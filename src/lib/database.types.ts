export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          session_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          session_id?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          session_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "camp_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_gallery: {
        Row: {
          camp_id: string
          caption: string | null
          created_at: string | null
          id: string
          photo_url: string
          status: string | null
          team: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          camp_id: string
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url: string
          status?: string | null
          team?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          camp_id?: string
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string
          status?: string | null
          team?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_gallery_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_registrations: {
        Row: {
          age: number | null
          camp_id: string
          created_at: string | null
          current_team: string | null
          full_name: string
          gender: string
          grade: number
          id: string
          mobile_number: string | null
          parent_name: string | null
          parent_number: string | null
          participate_in_teams: boolean | null
          preferred_team: string | null
          role: string | null
          switches_remaining: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          camp_id: string
          created_at?: string | null
          current_team?: string | null
          full_name: string
          gender: string
          grade: number
          id?: string
          mobile_number?: string | null
          parent_name?: string | null
          parent_number?: string | null
          participate_in_teams?: boolean | null
          preferred_team?: string | null
          role?: string | null
          switches_remaining?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          camp_id?: string
          created_at?: string | null
          current_team?: string | null
          full_name?: string
          gender?: string
          grade?: number
          id?: string
          mobile_number?: string | null
          parent_name?: string | null
          parent_number?: string | null
          participate_in_teams?: boolean | null
          preferred_team?: string | null
          role?: string | null
          switches_remaining?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_registrations_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_schedule: {
        Row: {
          activity: string
          created_at: string | null
          day: number
          description: string | null
          id: string
          location: string
          time: string
          updated_at: string | null
        }
        Insert: {
          activity: string
          created_at?: string | null
          day: number
          description?: string | null
          id: string
          location: string
          time: string
          updated_at?: string | null
        }
        Update: {
          activity?: string
          created_at?: string | null
          day?: number
          description?: string | null
          id?: string
          location?: string
          time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      camp_schedules: {
        Row: {
          camp_id: string
          created_at: string | null
          day: number
          description: string | null
          id: string
          location: string | null
          time_slot: string
          title: string
          updated_at: string | null
        }
        Insert: {
          camp_id: string
          created_at?: string | null
          day: number
          description?: string | null
          id?: string
          location?: string | null
          time_slot: string
          title: string
          updated_at?: string | null
        }
        Update: {
          camp_id?: string
          created_at?: string | null
          day?: number
          description?: string | null
          id?: string
          location?: string | null
          time_slot?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camp_schedules_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_scoreboard: {
        Row: {
          camp_id: string
          created_at: string | null
          id: string
          score: number | null
          team: string
          updated_at: string | null
        }
        Insert: {
          camp_id: string
          created_at?: string | null
          id?: string
          score?: number | null
          team: string
          updated_at?: string | null
        }
        Update: {
          camp_id?: string
          created_at?: string | null
          id?: string
          score?: number | null
          team?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camp_scoreboard_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          name: string
          qr_code: string | null
          schedule_id: string | null
          session_type: string
          start_time: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          qr_code?: string | null
          schedule_id?: string | null
          session_type: string
          start_time?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          qr_code?: string | null
          schedule_id?: string | null
          session_type?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camp_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camp_sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "camp_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_settings: {
        Row: {
          camp_start_date: string | null
          created_at: string | null
          gallery_visible: boolean | null
          id: string
          lock_date: string | null
          locked_teams: string[] | null
          max_gender_difference: number | null
          max_per_grade: number | null
          max_team_size: number | null
          oil_extraction_visible: boolean | null
          schedule_finalized: boolean | null
          schedule_finalized_at: string | null
          schedule_visible: boolean | null
          teams_locked: boolean | null
          updated_at: string | null
        }
        Insert: {
          camp_start_date?: string | null
          created_at?: string | null
          gallery_visible?: boolean | null
          id?: string
          lock_date?: string | null
          locked_teams?: string[] | null
          max_gender_difference?: number | null
          max_per_grade?: number | null
          max_team_size?: number | null
          oil_extraction_visible?: boolean | null
          schedule_finalized?: boolean | null
          schedule_finalized_at?: string | null
          schedule_visible?: boolean | null
          teams_locked?: boolean | null
          updated_at?: string | null
        }
        Update: {
          camp_start_date?: string | null
          created_at?: string | null
          gallery_visible?: boolean | null
          id?: string
          lock_date?: string | null
          locked_teams?: string[] | null
          max_gender_difference?: number | null
          max_per_grade?: number | null
          max_team_size?: number | null
          oil_extraction_visible?: boolean | null
          schedule_finalized?: boolean | null
          schedule_finalized_at?: string | null
          schedule_visible?: boolean | null
          teams_locked?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      camp_team_switches: {
        Row: {
          created_at: string | null
          from_team: string
          id: string
          reason: string | null
          registration_id: string
          to_team: string
        }
        Insert: {
          created_at?: string | null
          from_team: string
          id?: string
          reason?: string | null
          registration_id: string
          to_team: string
        }
        Update: {
          created_at?: string | null
          from_team?: string
          id?: string
          reason?: string | null
          registration_id?: string
          to_team?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_team_switches_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "camp_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      camps: {
        Row: {
          bible_verse: string | null
          created_at: string | null
          custom_content: Json | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          max_participants: number | null
          name: string
          registration_open: boolean | null
          season: string
          start_date: string
          theme_primary_color: string | null
          theme_secondary_color: string | null
          updated_at: string | null
          verse_reference: string | null
          year: number
        }
        Insert: {
          bible_verse?: string | null
          created_at?: string | null
          custom_content?: Json | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          name: string
          registration_open?: boolean | null
          season: string
          start_date: string
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          updated_at?: string | null
          verse_reference?: string | null
          year: number
        }
        Update: {
          bible_verse?: string | null
          created_at?: string | null
          custom_content?: Json | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          name?: string
          registration_open?: boolean | null
          season?: string
          start_date?: string
          theme_primary_color?: string | null
          theme_secondary_color?: string | null
          updated_at?: string | null
          verse_reference?: string | null
          year?: number
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string | null
          submitted_at: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string | null
          submitted_at?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string | null
          submitted_at?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          current_team: string | null
          full_name: string
          gender: string | null
          grade: number | null
          id: string
          is_admin: boolean | null
          is_super_admin: boolean | null
          participate_in_teams: boolean | null
          preferred_team: string | null
          switches_remaining: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_team?: string | null
          full_name: string
          gender?: string | null
          grade?: number | null
          id: string
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          participate_in_teams?: boolean | null
          preferred_team?: string | null
          switches_remaining?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_team?: string | null
          full_name?: string
          gender?: string | null
          grade?: number | null
          id?: string
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          participate_in_teams?: boolean | null
          preferred_team?: string | null
          switches_remaining?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rules_acceptance: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rules_acceptance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      score_events: {
        Row: {
          admin_id: string
          created_at: string
          delta: number
          id: string
          reason: string | null
          team_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          delta: number
          id?: string
          reason?: string | null
          team_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          delta?: number
          id?: string
          reason?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_events_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sports_matches: {
        Row: {
          created_at: string
          final: boolean
          id: string
          scheduled_time: string | null
          score_a: number | null
          score_b: number | null
          sport_id: string
          status: string
          team_a: string
          team_b: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          final?: boolean
          id?: string
          scheduled_time?: string | null
          score_a?: number | null
          score_b?: number | null
          sport_id: string
          status?: string
          team_a: string
          team_b: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          final?: boolean
          id?: string
          scheduled_time?: string | null
          score_a?: number | null
          score_b?: number | null
          sport_id?: string
          status?: string
          team_a?: string
          team_b?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_scores: {
        Row: {
          points: number
          team_id: string
          updated_at: string
        }
        Insert: {
          points?: number
          team_id: string
          updated_at?: string
        }
        Update: {
          points?: number
          team_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_switches: {
        Row: {
          created_at: string | null
          from_team: string | null
          id: string
          to_team: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from_team?: string | null
          id?: string
          to_team: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          from_team?: string | null
          id?: string
          to_team?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_switches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sport_selections: {
        Row: {
          created_at: string | null
          id: string
          sport_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sport_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sport_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sport_selections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_rules: { Args: { user_id_param: string }; Returns: boolean }
      adjust_team_score: {
        Args: {
          delta_param: number
          reason_param?: string
          team_id_param: string
        }
        Returns: number
      }
      approve_photo: {
        Args: { admin_id_param: string; photo_id_param: string }
        Returns: boolean
      }
      can_attend_session: {
        Args: { session_uuid: string; user_uuid: string }
        Returns: boolean
      }
      can_switch_team: {
        Args: { new_team: string; user_id: string }
        Returns: {
          can_switch: boolean
          reason: string
        }[]
      }
      can_switch_team_with_reason: {
        Args: { new_team: string; user_id: string }
        Returns: {
          allowed: boolean
          reason: string
        }[]
      }
      can_team_accept_player: {
        Args: { team_name: string; user_gender: string }
        Returns: {
          can_accept: boolean
          reason: string
        }[]
      }
      check_daily_upload_limit: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      create_session_from_schedule: {
        Args: {
          end_time_offset?: string
          schedule_item_id: string
          session_name: string
          session_type?: string
          start_time_offset?: string
        }
        Returns: string
      }
      create_sessions_for_day: {
        Args: { day_number: number }
        Returns: undefined
      }
      finalize_schedule: {
        Args: { camp_start_date_param: string }
        Returns: undefined
      }
      generate_session_qr_code: {
        Args: { session_uuid: string }
        Returns: string
      }
      get_active_camp_registrations: {
        Args: { p_camp_id: string }
        Returns: {
          age: number
          camp_id: string
          created_at: string
          current_team: string
          full_name: string
          gender: string
          grade: number
          id: string
          is_admin: boolean
          mobile_number: string
          parent_name: string
          parent_number: string
          participate_in_teams: boolean
          preferred_team: string
          role: string
          switches_remaining: number
          updated_at: string
          user_id: string
        }[]
      }
      get_attendance_with_users: {
        Args: never
        Returns: {
          checked_in_at: string
          checked_in_by_name: string
          record_id: string
          session_name: string
          status: string
          user_name: string
        }[]
      }
      get_camps_with_stats: {
        Args: never
        Returns: {
          bible_verse: string
          custom_content: Json
          description: string
          end_date: string
          id: string
          is_active: boolean
          max_participants: number
          name: string
          registered_count: number
          registration_open: boolean
          season: string
          spots_available: number
          start_date: string
          theme_primary_color: string
          theme_secondary_color: string
          verse_reference: string
          year: number
        }[]
      }
      get_gallery_photos_with_info: {
        Args: { status_filter?: string }
        Returns: {
          caption: string
          created_at: string
          id: string
          image_url: string
          reviewed_at: string
          reviewed_by: string
          reviewer_name: string
          status: string
          submitted_at: string
          team_id: string
          team_name: string
          user_id: string
          user_name: string
        }[]
      }
      get_gallery_stats: {
        Args: never
        Returns: {
          approved_photos: number
          pending_photos: number
          rejected_photos: number
          total_photos: number
          total_users: number
        }[]
      }
      get_gallery_visibility: { Args: never; Returns: boolean }
      get_recommended_team: {
        Args: { user_id: string }
        Returns: {
          reason: string
          recommended_team: string
        }[]
      }
      get_schedule_status: {
        Args: never
        Returns: {
          active_sessions: number
          camp_start_date: string
          finalized: boolean
          finalized_at: string
          total_sessions: number
        }[]
      }
      get_schedule_visibility: { Args: never; Returns: boolean }
      get_sessions_with_attendance: {
        Args: never
        Returns: {
          absent_count: number
          end_time: string
          excused_count: number
          late_count: number
          present_count: number
          session_id: string
          session_name: string
          session_type: string
          start_time: string
          total_participants: number
        }[]
      }
      get_sessions_with_delays: {
        Args: never
        Returns: {
          delay_minutes: number
          end_time: string
          has_delay: boolean
          id: string
          is_active: boolean
          name: string
          original_start_time: string
          schedule_activity: string
          schedule_day: number
          schedule_location: string
          schedule_time: string
          session_type: string
          start_time: string
        }[]
      }
      get_sessions_with_schedule: {
        Args: never
        Returns: {
          end_time: string
          id: string
          is_active: boolean
          name: string
          schedule_activity: string
          schedule_day: number
          schedule_id: string
          schedule_location: string
          schedule_time: string
          session_type: string
          start_time: string
        }[]
      }
      get_team_balance: {
        Args: never
        Returns: {
          female_count: number
          grade_10_count: number
          grade_11_count: number
          grade_12_count: number
          grade_7_count: number
          grade_8_count: number
          grade_9_count: number
          male_count: number
          team: string
          total_count: number
        }[]
      }
      get_team_balance_for_validation: {
        Args: never
        Returns: {
          female_count: number
          male_count: number
          team: string
          total_count: number
        }[]
      }
      get_team_balance_stats: {
        Args: never
        Returns: {
          at_capacity: boolean
          can_accept_female: boolean
          can_accept_male: boolean
          female_players: number
          male_players: number
          team: string
          total_players: number
        }[]
      }
      get_team_sizes: {
        Args: never
        Returns: {
          female_count: number
          male_count: number
          size: number
          team: string
        }[]
      }
      has_accepted_rules: { Args: { user_id_param: string }; Returns: boolean }
      is_admin_user: { Args: { uid: string }; Returns: boolean }
      reject_photo: {
        Args: { admin_id_param: string; photo_id_param: string }
        Returns: boolean
      }
      toggle_gallery_visibility: { Args: never; Returns: undefined }
      toggle_oil_extraction_visibility: { Args: never; Returns: undefined }
      toggle_schedule_visibility: { Args: never; Returns: undefined }
      update_session_times: {
        Args: {
          delay_reason?: string
          new_end_time: string
          new_start_time: string
          session_id: string
        }
        Returns: undefined
      }
      validate_team_assignment: {
        Args: { new_team: string; user_gender: string }
        Returns: {
          can_assign: boolean
          reason: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
