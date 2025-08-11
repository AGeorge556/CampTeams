export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
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
      coin_transactions: {
        Row: {
          admin_id: string
          amount: number
          created_at: string | null
          description: string | null
          id: string
          team_id: string
          transaction_type: string
        }
        Insert: {
          admin_id: string
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          team_id: string
          transaction_type?: string
        }
        Update: {
          admin_id?: string
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          team_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      game_sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hint_purchases: {
        Row: {
          hint_id: string | null
          id: string
          purchased_at: string | null
          session_id: string | null
          team_id: string
        }
        Insert: {
          hint_id?: string | null
          id?: string
          purchased_at?: string | null
          session_id?: string | null
          team_id: string
        }
        Update: {
          hint_id?: string | null
          id?: string
          purchased_at?: string | null
          session_id?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hint_purchases_hint_id_fkey"
            columns: ["hint_id"]
            isOneToOne: false
            referencedRelation: "oil_hints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hint_purchases_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_hints: {
        Row: {
          cost: number
          created_at: string | null
          created_by: string
          hint_text: string
          id: string
          quality_hint_for: string | null
          session_id: string | null
        }
        Insert: {
          cost?: number
          created_at?: string | null
          created_by: string
          hint_text: string
          id?: string
          quality_hint_for?: string | null
          session_id?: string | null
        }
        Update: {
          cost?: number
          created_at?: string | null
          created_by?: string
          hint_text?: string
          id?: string
          quality_hint_for?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_hints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_inventory: {
        Row: {
          created_at: string | null
          id: string
          quality: string
          quantity: number | null
          session_id: string | null
          team_id: string
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          quality: string
          quantity?: number | null
          session_id?: string | null
          team_id: string
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          quality?: string
          quantity?: number | null
          session_id?: string | null
          team_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oil_inventory_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_sales: {
        Row: {
          created_at: string | null
          id: string
          price_per_barrel: number
          quality: string
          quantity: number
          session_id: string | null
          sold_by: string
          team_id: string
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          price_per_barrel: number
          quality: string
          quantity?: number
          session_id?: string | null
          sold_by: string
          team_id: string
          total_amount: number
        }
        Update: {
          created_at?: string | null
          id?: string
          price_per_barrel?: number
          quality?: string
          quantity?: number
          session_id?: string | null
          sold_by?: string
          team_id?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "oil_sales_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      oil_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          session_id: string | null
          team_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          session_id?: string | null
          team_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          session_id?: string | null
          team_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "oil_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oil_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          current_team: string | null
          full_name: string
          gender: string
          grade: number
          id: string
          is_admin: boolean | null
          participate_in_teams: boolean | null
          preferred_team: string
          role: string | null
          switches_remaining: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_team?: string | null
          full_name: string
          gender: string
          grade: number
          id: string
          is_admin?: boolean | null
          participate_in_teams?: boolean | null
          preferred_team: string
          role?: string | null
          switches_remaining?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_team?: string | null
          full_name?: string
          gender?: string
          grade?: number
          id?: string
          is_admin?: boolean | null
          participate_in_teams?: boolean | null
          preferred_team?: string
          role?: string | null
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
      team_wallets: {
        Row: {
          coins: number | null
          id: string
          net_worth: number | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          coins?: number | null
          id?: string
          net_worth?: number | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          coins?: number | null
          id?: string
          net_worth?: number | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      ,
      sports_matches: {
        Row: {
          id: string
          sport_id: string
          team_a: string
          team_b: string
          scheduled_time: string | null
          score_a: number | null
          score_b: number | null
          status: string
          final: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sport_id: string
          team_a: string
          team_b: string
          scheduled_time?: string | null
          score_a?: number | null
          score_b?: number | null
          status?: string
          final?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sport_id?: string
          team_a?: string
          team_b?: string
          scheduled_time?: string | null
          score_a?: number | null
          score_b?: number | null
          status?: string
          final?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_rules: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      add_coins_to_team: {
        Args: {
          team_id_param: string
          amount_param: number
          description_param?: string
        }
        Returns: undefined
      }
      approve_photo: {
        Args: { photo_id_param: string; admin_id_param: string }
        Returns: boolean
      }
      buy_oil_from_team: {
        Args: {
          team_id_param: string
          quality_param: string
          quantity_param: number
          session_id_param: string
        }
        Returns: Json
      }
      can_attend_session: {
        Args: { session_uuid: string; user_uuid: string }
        Returns: boolean
      }
      can_switch_team: {
        Args: { user_id: string; new_team: string }
        Returns: boolean
      }
      check_daily_upload_limit: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      create_hint: {
        Args: {
          hint_text_param: string
          quality_hint_for_param: string
          cost_param: number
          session_id_param: string
        }
        Returns: Json
      }
      excavate_square: {
        Args: { square_id_param: number; session_id_param: string }
        Returns: Json
      }
      finalize_schedule: {
        Args: { camp_start_date_param: string }
        Returns: undefined
      }
      generate_session_qr_code: {
        Args: { session_uuid: string }
        Returns: string
      }
      get_attendance_with_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          record_id: string
          session_name: string
          user_name: string
          status: string
          checked_in_at: string
          checked_in_by_name: string
        }[]
      }
      get_available_hints_for_team: {
        Args: { team_id_param: string; session_id_param: string }
        Returns: {
          id: string
          hint_text: string
          quality_hint_for: string
          cost: number
          created_at: string
          is_purchased: boolean
        }[]
      }
      get_coin_transactions_with_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          transaction_id: string
          admin_name: string
          team_id: string
          amount: number
          transaction_type: string
          description: string
          created_at: string
        }[]
      }
      get_gallery_photos_with_info: {
        Args: { status_filter?: string }
        Returns: {
          id: string
          user_id: string
          team_id: string
          image_url: string
          caption: string
          status: string
          submitted_at: string
          reviewed_by: string
          reviewed_at: string
          created_at: string
          user_name: string
          team_name: string
          reviewer_name: string
        }[]
      }
      get_gallery_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_photos: number
          pending_photos: number
          approved_photos: number
          rejected_photos: number
          total_users: number
        }[]
      }
      get_gallery_visibility: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_game_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          team_id: string
          coins: number
          net_worth: number
          rank: number
        }[]
      }
      get_hint_analytics: {
        Args: { session_id_param: string }
        Returns: {
          hint_id: string
          hint_text: string
          cost: number
          total_purchases: number
          total_revenue: number
          teams_purchased: string[]
          created_at: string
        }[]
      }
      get_oil_sales_history: {
        Args: { session_id_param: string }
        Returns: {
          id: string
          team_id: string
          quality: string
          quantity: number
          price_per_barrel: number
          total_amount: number
          sold_by: string
          created_at: string
          shop_owner_name: string
        }[]
      }
      get_schedule_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          finalized: boolean
          finalized_at: string
          camp_start_date: string
          total_sessions: number
          active_sessions: number
        }[]
      }
      get_schedule_visibility: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_sessions_with_attendance: {
        Args: Record<PropertyKey, never>
        Returns: {
          session_id: string
          session_name: string
          session_type: string
          start_time: string
          end_time: string
          total_participants: number
          present_count: number
          absent_count: number
          late_count: number
          excused_count: number
        }[]
      }
      get_sessions_with_delays: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          session_type: string
          original_start_time: string
          start_time: string
          end_time: string
          schedule_day: number
          schedule_time: string
          schedule_activity: string
          schedule_location: string
          is_active: boolean
          has_delay: boolean
          delay_minutes: number
        }[]
      }
      get_sessions_with_schedule: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          session_type: string
          start_time: string
          end_time: string
          schedule_id: string
          schedule_day: number
          schedule_time: string
          schedule_activity: string
          schedule_location: string
          is_active: boolean
        }[]
      }
      get_shop_statistics: {
        Args: { session_id_param: string }
        Returns: {
          total_sales: number
          total_revenue: number
          sales_by_quality: Json
          top_selling_team: string
          top_selling_team_amount: number
        }[]
      }
      get_team_balance: {
        Args: Record<PropertyKey, never>
        Returns: {
          team: string
          total_count: number
          male_count: number
          female_count: number
          grade_7_count: number
          grade_8_count: number
          grade_9_count: number
          grade_10_count: number
          grade_11_count: number
          grade_12_count: number
        }[]
      }
      get_team_economy_status: {
        Args: { session_id_param: string }
        Returns: {
          team_id: string
          coins: number
          net_worth: number
          total_inventory: number
          total_spent_on_excavation: number
          total_spent_on_hints: number
          total_earned_from_sales: number
          last_updated: string
        }[]
      }
      get_team_wallet_with_transactions: {
        Args: { team_id_param: string }
        Returns: {
          wallet_id: string
          team_id: string
          coins: number
          net_worth: number
          updated_at: string
          transactions: Json
        }[]
      }
      has_accepted_rules: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      initialize_team_wallets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      purchase_hint: {
        Args: { hint_id_param: string; session_id_param: string }
        Returns: Json
      }
      reject_photo: {
        Args: { photo_id_param: string; admin_id_param: string }
        Returns: boolean
      }
      toggle_gallery_visibility: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      toggle_oil_extraction_visibility: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      toggle_schedule_visibility: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_session_times: {
        Args: {
          session_id: string
          new_start_time: string
          new_end_time: string
          delay_reason?: string
        }
        Returns: undefined
      }
      update_team_wallet: {
        Args: {
          team_id_param: string
          coins_change: number
          net_worth_change: number
          transaction_type_param: string
          description_param?: string
        }
        Returns: undefined
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
  public: {
    Enums: {},
  },
} as const
