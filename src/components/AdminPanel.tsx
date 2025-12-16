import { useState, useEffect } from 'react';
import { Shield, Users, Settings, Download, Trophy, Zap, Camera } from 'lucide-react';
import ScoreboardAdmin from './ScoreboardAdmin';
import { supabase, Profile, TEAMS, TeamColor } from '../lib/supabase';
import { CampSettings } from '../lib/types';
import { useOilExtractionVisibility } from '../hooks/useOilExtractionVisibility';
import { useGalleryVisibility } from '../hooks/useGalleryVisibility';
import { useLanguage } from '../contexts/LanguageContext';
import { getGradeDisplayWithNumber } from '../lib/utils';

interface SportSelection {
  sport_id: string;
  sport_name: string;
  participants: Profile[];
}

const getTeamProperty = (teamKey: keyof typeof TEAMS, property: keyof typeof TEAMS[keyof typeof TEAMS]) => {
  return TEAMS[teamKey][property];
};

export default function AdminPanel() {
  const { oilExtractionVisible, toggleOilExtractionVisibility, loading: oilVisibilityLoading } = useOilExtractionVisibility();
  const { galleryVisible, toggleGalleryVisibility, loading: galleryVisibilityLoading } = useGalleryVisibility();
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [campSettings, setCampSettings] = useState<CampSettings | null>(null);
  const [sportSelections, setSportSelections] = useState<SportSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamColor | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'participants' | 'sports' | 'roles'>('participants');
  const [lockedTeams, setLockedTeams] = useState<string[]>([]);

  useEffect(() => {
    fetchProfiles();
    fetchCampSettings();
    fetchSportSelections();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchCampSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('camp_settings')
        .select('*')
        .single();

      if (error) throw error;
      // Cast the data to include locked_teams with proper typing and default values
      const settingsData: CampSettings = {
        id: data.id,
        teams_locked: data.teams_locked || false,
        lock_date: data.lock_date,
        max_team_size: data.max_team_size || 50,
        locked_teams: Array.isArray((data as any).locked_teams) ? (data as any).locked_teams : [],
        gallery_visible: data.gallery_visible || false,
        oil_extraction_visible: data.oil_extraction_visible || false,
        camp_start_date: data.camp_start_date,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      
      setCampSettings(settingsData);
      setLockedTeams(settingsData.locked_teams);
    } catch (error) {
      console.error('Error fetching camp settings:', error);
    }
  };

  const toggleTeamLock = async (teamColor: TeamColor) => {
    if (!campSettings) return;
    
    setLoading(true);
    try {
      const newLockedTeams = lockedTeams.includes(teamColor)
        ? lockedTeams.filter(t => t !== teamColor)
        : [...lockedTeams, teamColor];

      const { error } = await supabase
        .from('camp_settings')
        .update({
          locked_teams: newLockedTeams
        } as Partial<CampSettings>)
        .eq('id', campSettings.id);

      if (error) throw error;
      setLockedTeams(newLockedTeams);
      await fetchCampSettings();
    } catch (error) {
      console.error('Error toggling team lock:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSportSelections = async () => {
    try {
      const { data: selections, error: selectionsError } = await supabase
        .from('user_sport_selections')
        .select(`
          sport_id,
          profiles!inner(
            id,
            full_name,
            grade,
            gender,
            current_team,
            is_admin
          )
        `);

      if (selectionsError) throw selectionsError;

      const sportMap = new Map<string, SportSelection>();

      selections?.forEach((selection) => {
        const sportId = selection.sport_id;
        const profile = selection.profiles as any;

        if (!sportMap.has(sportId)) {
          sportMap.set(sportId, {
            sport_id: sportId,
            sport_name: getSportDisplayName(sportId),
            participants: [],
          });
        }

        sportMap.get(sportId)!.participants.push(profile);
      });

      setSportSelections(Array.from(sportMap.values()));
    } catch (error) {
      console.error('Error fetching sport selections:', error);
    }
  };

  const getSportDisplayName = (sportId: string): string => {
    const sportNames: Record<string, string> = {
      soccer: 'Soccer ⚽',
      dodgeball: 'Dodgeball 🏐',
      chairball: 'Chairball 🪑',
      'big-game': 'Big Game 🎯',
      'pool-time': 'Pool Time 🏊',
    };
    return sportNames[sportId] || sportId;
  };

  const toggleTeamsLock = async () => {
    if (!campSettings) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('camp_settings')
        .update({
          teams_locked: !campSettings.teams_locked,
          lock_date: !campSettings.teams_locked ? new Date().toISOString() : null,
        })
        .eq('id', campSettings.id);

      if (error) throw error;

      await fetchCampSettings();
    } catch (error) {
      console.error('Error toggling teams lock:', error);
    } finally {
      setLoading(false);
    }
  };

  const reassignUser = async (userId: string, newTeam: TeamColor) => {
    try {
      if (!newTeam) {
        console.error('Invalid team selected');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ current_team: newTeam })
        .eq('id', userId);

      if (error) throw error;

      console.log(`User ${userId} reassigned to team ${newTeam}`);
      await fetchProfiles();
    } catch (error) {
      console.error('Error reassigning user:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await fetchProfiles();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const exportRoster = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Name,Grade,Gender,Team,Switches Remaining,Join Date\n' +
      profiles
        .map(
          (p) =>
            `"${p.full_name}",${p.grade},${p.gender},${p.current_team || 'Unassigned'},${p.switches_remaining},${
              p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'
            }`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'camp_roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSportSelections = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Sport,Name,Grade,Gender,Team,Admin\n' +
      sportSelections
        .flatMap((sport) =>
          sport.participants.map(
            (p) =>
              `"${sport.sport_name}","${p.full_name}",${p.grade},${p.gender},${p.current_team || 'Unassigned'},${
                p.is_admin ? 'Yes' : 'No'
              }`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sport_selections.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProfiles = selectedTeam === 'all' 
    ? profiles 
    : profiles.filter((p) => p.current_team === selectedTeam);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-purple-500" />
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text)]">Admin Panel</h2>
              <p className="text-[var(--color-text-muted)]">Manage camp participants and settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6">
        <div className="border-b border-[var(--color-border)]">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('participants')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'participants'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Participant Management
            </button>
            <button
              onClick={() => setActiveTab('sports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sports'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
              }`}
            >
              <Trophy className="h-4 w-4 inline mr-2" />
              Sport Selections
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Role Management
            </button>
          </nav>
        </div>
      </div>

      {/* Camp Settings */}
      <div className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Camp Settings</h3>
          <button
            onClick={toggleTeamsLock}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <Settings className="h-4 w-4 mr-2" />
            {campSettings?.teams_locked ? 'Unlock Teams' : 'Lock Teams'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[var(--color-bg-muted)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--color-text)]">Teams Status</h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              {campSettings?.teams_locked ? 'Locked' : 'Unlocked'}
            </p>
          </div>
          <div className="bg-[var(--color-bg-muted)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--color-text)]">Lock Date</h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              {campSettings?.lock_date 
                ? new Date(campSettings.lock_date).toLocaleDateString()
                : 'Not locked'
              }
            </p>
          </div>
          <div className="bg-[var(--color-bg-muted)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--color-text)]">Max Team Size</h4>
            <p className="text-sm text-[var(--color-text-muted)]">{campSettings?.max_team_size || 50}</p>
          </div>
          <div className="bg-[var(--color-bg-muted)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--color-text)]">{t('oilExtractionVisibility')}</h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              {oilExtractionVisible ? t('oilExtractionVisible') : t('oilExtractionHidden')}
            </p>
          </div>
          <div className="bg-[var(--color-bg-muted)] rounded-lg p-4">
            <h4 className="font-medium text-[var(--color-text)]">{t('galleryVisibility')}</h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              {galleryVisible ? t('galleryVisible') : t('galleryHidden')}
            </p>
          </div>
        </div>
        
        {/* Oil Extraction Visibility Toggle */}
        <div className="mt-4 flex items-center justify-between p-4 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-lg">
          <div className="flex items-center">
            <Zap className="h-5 w-5 text-sky-600 mr-3" />
            <div>
              <h4 className="font-medium text-[var(--color-text)]">{t('oilExtractionVisibility')}</h4>
              <p className="text-sm text-[var(--color-text-muted)]">
                {oilExtractionVisible ? t('oilExtractionVisible') : t('oilExtractionHidden')}
              </p>
            </div>
          </div>
          <button
            onClick={toggleOilExtractionVisibility}
            disabled={oilVisibilityLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
          >
            {oilVisibilityLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {oilExtractionVisible ? t('hideOilExtraction') : t('showOilExtraction')}
          </button>
        </div>

        {/* Gallery Visibility Toggle */}
        <div className="mt-4 flex items-center justify-between p-4 bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-lg">
          <div className="flex items-center">
            <Camera className="h-5 w-5 text-purple-600 mr-3" />
            <div>
              <h4 className="font-medium text-[var(--color-text)]">{t('galleryVisibility')}</h4>
              <p className="text-sm text-[var(--color-text-muted)]">
                {galleryVisible ? t('galleryVisible') : t('galleryHidden')}
              </p>
            </div>
          </div>
          <button
            onClick={toggleGalleryVisibility}
            disabled={galleryVisibilityLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {galleryVisibilityLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            {galleryVisible ? t('hideGallery') : t('showGallery')}
          </button>
        </div>

        {/* Scoreboard Admin */}
        <div className="mt-6">
          <ScoreboardAdmin />
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'participants' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--color-text)]">Participant Management</h3>
            <div className="flex space-x-2">
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value as TeamColor | 'all')}
                className="rounded-md border-[var(--color-border)] shadow-sm bg-[var(--color-input-bg)] focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="all">All Teams</option>
                {Object.entries(TEAMS).map(([key, team]) => (
                  <option key={key} value={key}>{team.name}</option>
                ))}
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={exportRoster}
                  className="inline-flex items-center px-3 py-2 border border-[var(--color-border)] shadow-sm text-sm leading-4 font-medium rounded-md text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
          
          {/* Team Lock Controls */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(TEAMS).map(([key, team]) => (
              <div key={key} className="relative">
                <div className={`p-4 rounded-lg ${team.lightColor} border ${lockedTeams.includes(key) ? 'border-red-500' : 'border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${team.textColor}`}>{team.name}</span>
                    <button
                      onClick={() => toggleTeamLock(key as TeamColor)}
                      disabled={loading}
                      className={`ml-2 inline-flex items-center px-2 py-1 border ${
                        lockedTeams.includes(key)
                          ? 'border-red-500 text-red-700 hover:bg-red-50'
                          : 'border-green-500 text-green-700 hover:bg-green-50'
                      } text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50`}
                    >
                      {lockedTeams.includes(key) ? 'Unlock' : 'Lock'}
                    </button>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    {lockedTeams.includes(key) ? 'No new joins allowed' : 'Open for new players'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border)]">
              <thead className="bg-[var(--color-bg-muted)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Current Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Switches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[var(--color-card-bg)] divide-y divide-[var(--color-border)]">
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {profile.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                      {getGradeDisplayWithNumber(profile.grade)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                      {profile.gender}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                      {profile.current_team && TEAMS[profile.current_team as keyof typeof TEAMS] ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getTeamProperty(profile.current_team as keyof typeof TEAMS, 'lightColor')
                          } ${getTeamProperty(profile.current_team as keyof typeof TEAMS, 'textColor')}`}
                        >
                          {getTeamProperty(profile.current_team as keyof typeof TEAMS, 'name')}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                      {profile.switches_remaining}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                      <select
                        value={profile.current_team || ''}
                        onChange={(e) => reassignUser(profile.id, e.target.value as TeamColor)}
                        className="rounded-md border-[var(--color-border)] shadow-sm bg-[var(--color-input-bg)] focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {Object.entries(TEAMS).map(([key, team]) => (
                          <option key={key} value={key}>{team.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'sports' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--color-text)]">Sport Selections</h3>
            <button
              onClick={exportSportSelections}
              className="inline-flex items-center px-3 py-2 border border-[var(--color-border)] shadow-sm text-sm leading-4 font-medium rounded-md text-[var(--color-text)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-muted)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
          
          <div className="space-y-6">
            {sportSelections.map((sport) => (
              <div key={sport.sport_id} className="bg-[var(--color-card-bg)] rounded-lg shadow-sm border border-[var(--color-border)]">
                <div className="px-6 py-4 border-b border-[var(--color-border)]">
                  <h4 className="text-lg font-semibold text-[var(--color-text)]">{sport.sport_name}</h4>
                  <p className="text-sm text-[var(--color-text-muted)]">{sport.participants.length} participants</p>
                </div>
                <div className="px-6 py-4">
                  {sport.participants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sport.participants.map((participant) => (
                        <div key={participant.id} className="flex items-center space-x-3 p-3 bg-[var(--color-bg-muted)] rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[var(--color-text)]">{participant.full_name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {getGradeDisplayWithNumber(participant.grade)} • {participant.gender}
                              {participant.current_team && (
                                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  TEAMS[participant.current_team as keyof typeof TEAMS].lightColor
                                } ${TEAMS[participant.current_team as keyof typeof TEAMS].textColor}`}>
                                  {TEAMS[participant.current_team as keyof typeof TEAMS].name}
                                </span>
                              )}
                            </p>
                          </div>
                          {participant.is_admin && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Admin
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[var(--color-text-muted)] text-center py-4">No participants yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'roles' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--color-text)]">Role Management</h3>
            <div className="text-sm text-[var(--color-text-muted)]">
              Only you can assign team_leader roles. New users get 'camper' by default.
            </div>
          </div>
          
          <div className="bg-[var(--color-card-bg)] shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-[var(--color-border)]">
              <thead className="bg-[var(--color-bg-muted)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    Assign Role
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[var(--color-card-bg)] divide-y divide-[var(--color-border)]">
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)]">
                      {profile.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                      {getGradeDisplayWithNumber(profile.grade)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                      {profile.current_team ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          TEAMS[profile.current_team as keyof typeof TEAMS].lightColor
                        } ${TEAMS[profile.current_team as keyof typeof TEAMS].textColor}`}>
                          {TEAMS[profile.current_team as keyof typeof TEAMS].name}
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        profile.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        profile.role === 'shop_owner' ? 'bg-yellow-100 text-yellow-800' :
                        profile.role === 'team_leader' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {profile.role === 'admin' ? 'Admin' :
                         profile.role === 'shop_owner' ? 'Shop Owner' :
                         profile.role === 'team_leader' ? 'Team Leader' :
                         'Camper'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                      <select
                        value={profile.role || 'camper'}
                        onChange={(e) => updateUserRole(profile.id, e.target.value)}
                        className="rounded-md border-[var(--color-border)] bg-[var(--color-input-bg)] shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                      >
                        <option value="camper">Camper</option>
                        <option value="team_leader">Team Leader</option>
                        <option value="shop_owner">Shop Owner</option>
                        {profile.is_admin && <option value="admin">Admin</option>}
                      </select>
                    </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       ) : null}
    </div>
  );
}