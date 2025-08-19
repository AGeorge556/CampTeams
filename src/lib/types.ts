export interface CampSession {
  id: string
  name: string
  description?: string
  session_type: 'sermon' | 'quiet_time' | 'activity' | 'meal' | 'other'
  start_time: string
  end_time: string
  is_active: boolean
  qr_code?: string
  schedule_id?: string
  created_by: string
  created_at: string
}

export interface ScheduleItem {
  id: string
  day: number
  time: string
  activity: string
  location: string
  description?: string
}

export interface SessionWithSchedule extends CampSession {
  schedule_day?: number
  schedule_time?: string
  schedule_activity?: string
  schedule_location?: string
}

export interface ScheduleStatus {
  finalized: boolean
  finalized_at?: string
  camp_start_date?: string
  total_sessions: number
  active_sessions: number
}

export interface SessionWithDelay extends SessionWithSchedule {
  original_start_time?: string
  has_delay: boolean
  delay_minutes?: number
}

export interface AttendanceRecord {
  id: string
  session_id: string
  user_id: string
  status: 'present' | 'absent' | 'late' | 'excused'
  checked_in_at: string
  checked_in_by?: string
  notes?: string
  created_at: string
}

export interface AttendanceWithUser extends AttendanceRecord {
  user: {
    id: string
    full_name: string
    grade: number
    gender: 'male' | 'female'
    current_team?: string
  }
}

export interface SessionWithAttendance extends CampSession {
  attendance_count: number
  total_participants: number
  attendance_records: AttendanceWithUser[]
}

export type SessionType = 'sermon' | 'quiet_time' | 'activity' | 'meal' | 'other'

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  sermon: 'Sermon',
  quiet_time: 'Quiet Time',
  activity: 'Activity',
  meal: 'Meal',
  other: 'Other'
}

export const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  sermon: 'bg-purple-100 text-purple-800',
  quiet_time: 'bg-blue-100 text-blue-800',
  activity: 'bg-green-100 text-green-800',
  meal: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800'
}

export interface CampSettings {
  id: string;
  teams_locked: boolean;
  lock_date: string | null;
  max_team_size: number;
  locked_teams: string[];
  gallery_visible: boolean | null;
  oil_extraction_visible: boolean | null;
  camp_start_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Oil Extraction Game Types
export type UserRole = 'admin' | 'shop_owner' | 'team_leader' | 'camper'

export interface GameSession {
  id: string
  start_time: string
  end_time: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface TeamWallet {
  id: string
  team_id: 'red' | 'blue' | 'green' | 'yellow'
  coins: number
  net_worth: number
  updated_at: string
}

export interface OilTransaction {
  id: string
  session_id: string
  team_id: 'red' | 'blue' | 'green' | 'yellow'
  transaction_type: 'collect' | 'sell' | 'purchase' | 'bonus' | 'penalty'
  amount: number
  description?: string
  created_by: string
  created_at: string
}

export interface CoinTransaction {
  id: string
  admin_id: string
  team_id: 'red' | 'blue' | 'green' | 'yellow'
  amount: number
  transaction_type: 'admin_adjustment' | 'bonus' | 'penalty'
  description?: string
  created_at: string
}

export interface CoinTransactionWithAdmin extends CoinTransaction {
  admin_name: string
}

// Oil Excavation Types
export type OilQuality = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'

export interface OilGridSquare {
  square_id: number
  quality: OilQuality | 'unknown'
  is_excavated: boolean
  excavated_by_team?: 'red' | 'blue' | 'green' | 'yellow'
  timestamp?: string
}

export interface OilInventoryItem {
  quality: OilQuality
  quantity: number
}

export interface TeamInventorySummary {
  team_id: 'red' | 'blue' | 'green' | 'yellow'
  common_count: number
  rare_count: number
  epic_count: number
  legendary_count: number
  mythic_count: number
  total_count: number
}

export interface ExcavationResult {
  success: boolean
  quality?: OilQuality
  coins_deducted?: number
  remaining_coins?: number
  error?: string
}

// Oil Sales Types
export interface OilSale {
  id: string
  session_id: string
  team_id: 'red' | 'blue' | 'green' | 'yellow'
  quality: OilQuality
  quantity: number
  price_per_barrel: number
  total_amount: number
  sold_by: string
  created_at: string
}

export interface OilSaleWithOwner extends OilSale {
  shop_owner_name: string
}

export interface OilPurchaseResult {
  success: boolean
  quantity_sold?: number
  quality?: OilQuality
  price_per_barrel?: number
  total_amount?: number
  remaining_inventory?: number
  error?: string
}

export interface ShopStatistics {
  total_sales: number
  total_revenue: number
  sales_by_quality: Record<OilQuality, number>
  top_selling_team: string | null
  top_selling_team_amount: number
}

// Oil Hints Types
export interface OilHint {
  id: string
  session_id: string
  hint_text: string
  quality_hint_for?: string
  cost: number
  created_by: string
  created_at: string
}

export interface OilHintWithPurchaseStatus extends OilHint {
  is_purchased: boolean
}

export interface HintPurchase {
  id: string
  team_id: 'red' | 'blue' | 'green' | 'yellow'
  hint_id: string
  session_id: string
  purchased_at: string
}

export interface HintPurchaseResult {
  success: boolean
  hint_text?: string
  cost?: number
  remaining_coins?: number
  error?: string
}

export interface HintAnalytics {
  hint_id: string
  hint_text: string
  cost: number
  total_purchases: number
  total_revenue: number
  teams_purchased: string[]
  created_at: string
}

export interface CreateHintResult {
  success: boolean
  hint_id?: string
  message?: string
  error?: string
}

export interface TeamWalletWithTransactions extends TeamWallet {
  transactions: OilTransaction[]
}

export interface GameLeaderboardEntry {
  team_id: 'red' | 'blue' | 'green' | 'yellow'
  coins: number
  net_worth: number
  rank: number
}

export interface GameStats {
  total_sessions: number
  active_sessions: number
  total_transactions: number
  total_coins_in_circulation: number
}

export const TEAM_COLORS: Record<'red' | 'blue' | 'green' | 'yellow', string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500'
}

export const TEAM_NAMES: Record<'red' | 'blue' | 'green' | 'yellow', string> = {
  red: 'Red Team',
  blue: 'Blue Team',
  green: 'Green Team',
  yellow: 'Yellow Team'
}

export const TRANSACTION_TYPE_LABELS: Record<OilTransaction['transaction_type'], string> = {
  collect: 'Oil Collection',
  sell: 'Oil Sale',
  purchase: 'Equipment Purchase',
  bonus: 'Bonus',
  penalty: 'Penalty'
}

export const TRANSACTION_TYPE_COLORS: Record<OilTransaction['transaction_type'], string> = {
  collect: 'bg-green-100 text-green-800',
  sell: 'bg-blue-100 text-blue-800',
  purchase: 'bg-orange-100 text-orange-800',
  bonus: 'bg-purple-100 text-purple-800',
  penalty: 'bg-red-100 text-red-800'
}

export const OIL_QUALITY_COLORS: Record<OilQuality, string> = {
  common: 'bg-gray-100 text-gray-800',
  rare: 'bg-blue-100 text-blue-800',
  epic: 'bg-purple-100 text-purple-800',
  legendary: 'bg-orange-100 text-orange-800',
  mythic: 'bg-red-100 text-red-800'
}

export const OIL_QUALITY_LABELS: Record<OilQuality, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythic: 'Mythic'
}

export const OIL_QUALITY_VALUES: Record<OilQuality, number> = {
  common: 50,
  rare: 100,
  epic: 175,
  legendary: 250,
  mythic: 750
}

// Gallery Types
export type PhotoStatus = 'pending' | 'approved' | 'rejected'

export interface GalleryPhoto {
  id: string
  user_id: string
  team_id?: 'red' | 'blue' | 'green' | 'yellow'
  image_url: string
  storage_path?: string | null
  caption?: string
  status: PhotoStatus
  submitted_at: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface GalleryPhotoWithInfo extends GalleryPhoto {
  user_name: string
  team_name: string
  reviewer_name?: string
}

export interface GalleryStats {
  total_photos: number
  pending_photos: number
  approved_photos: number
  rejected_photos: number
  total_users: number
}

export interface PhotoUpload {
  file: File // Supports both images and videos
  caption?: string
  preview?: string
}

export interface GalleryFilters {
  status?: PhotoStatus
  team?: 'red' | 'blue' | 'green' | 'yellow'
  user?: string
}

export const PHOTO_STATUS_LABELS: Record<PhotoStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected'
}

export const PHOTO_STATUS_COLORS: Record<PhotoStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}

// Scoreboard Types
export interface TeamScore {
  team_id: 'red' | 'blue' | 'green' | 'yellow'
  points: number
  updated_at: string
}

export interface ScoreEvent {
  id: string
  team_id: 'red' | 'blue' | 'green' | 'yellow'
  delta: number
  reason?: string | null
  admin_id: string
  created_at: string
} 