import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          grade: number
          gender: 'male' | 'female'
          preferred_team: 'red' | 'blue' | 'green' | 'yellow'
          current_team: 'red' | 'blue' | 'green' | 'yellow' | null

          switches_remaining: number
          is_admin: boolean
          participate_in_teams: boolean
          role: 'admin' | 'shop_owner' | 'team_leader'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          grade: number
          gender: 'male' | 'female'
          preferred_team: 'red' | 'blue' | 'green' | 'yellow'
          current_team?: 'red' | 'blue' | 'green' | 'yellow' | null
          switches_remaining?: number
          is_admin?: boolean
          participate_in_teams?: boolean
          role?: 'admin' | 'shop_owner' | 'team_leader'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          grade?: number
          gender?: 'male' | 'female'
          preferred_team?: 'red' | 'blue' | 'green' | 'yellow'
          current_team?: 'red' | 'blue' | 'green' | 'yellow' | null
          switches_remaining?: number
          is_admin?: boolean
          participate_in_teams?: boolean
          role?: 'admin' | 'shop_owner' | 'team_leader'
          created_at?: string
          updated_at?: string
        }
      }
      team_switches: {
        Row: {
          id: string
          user_id: string
          from_team: string | null
          to_team: 'red' | 'blue' | 'green' | 'yellow'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          from_team?: string | null
          to_team: 'red' | 'blue' | 'green' | 'yellow'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          from_team?: string | null
          to_team?: 'red' | 'blue' | 'green' | 'yellow'
          created_at?: string
        }
      }
      camp_settings: {
        Row: {
          id: string
          teams_locked: boolean
          lock_date: string | null
          max_team_size: number
          oil_extraction_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teams_locked?: boolean
          lock_date?: string | null
          max_team_size?: number
          oil_extraction_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teams_locked?: boolean
          lock_date?: string | null
          max_team_size?: number
          oil_extraction_visible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          start_time: string
          end_time: string
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          start_time: string
          end_time: string
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          start_time?: string
          end_time?: string
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_wallets: {
        Row: {
          id: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          coins: number
          net_worth: number
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          coins?: number
          net_worth?: number
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: 'red' | 'blue' | 'green' | 'yellow'
          coins?: number
          net_worth?: number
          updated_at?: string
        }
      }
      oil_transactions: {
        Row: {
          id: string
          session_id: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          transaction_type: 'collect' | 'sell' | 'purchase' | 'bonus' | 'penalty'
          amount: number
          description: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          transaction_type: 'collect' | 'sell' | 'purchase' | 'bonus' | 'penalty'
          amount: number
          description?: string | null
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          team_id?: 'red' | 'blue' | 'green' | 'yellow'
          transaction_type?: 'collect' | 'sell' | 'purchase' | 'bonus' | 'penalty'
          amount?: number
          description?: string | null
          created_by?: string
          created_at?: string
        }
      }
      coin_transactions: {
        Row: {
          id: string
          admin_id: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          amount: number
          transaction_type: 'admin_adjustment' | 'bonus' | 'penalty'
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          amount: number
          transaction_type?: 'admin_adjustment' | 'bonus' | 'penalty'
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          team_id?: 'red' | 'blue' | 'green' | 'yellow'
          amount?: number
          transaction_type?: 'admin_adjustment' | 'bonus' | 'penalty'
          description?: string | null
          created_at?: string
        }
      }
      oil_grid: {
        Row: {
          square_id: number
          quality: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          is_excavated: boolean
          excavated_by_team: 'red' | 'blue' | 'green' | 'yellow' | null
          timestamp: string | null
          session_id: string
          created_at: string
        }
        Insert: {
          square_id: number
          quality: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          is_excavated?: boolean
          excavated_by_team?: 'red' | 'blue' | 'green' | 'yellow' | null
          timestamp?: string | null
          session_id: string
          created_at?: string
        }
        Update: {
          square_id?: number
          quality?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          is_excavated?: boolean
          excavated_by_team?: 'red' | 'blue' | 'green' | 'yellow' | null
          timestamp?: string | null
          session_id?: string
          created_at?: string
        }
      }
      oil_inventory: {
        Row: {
          id: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          quality: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          quantity: number
          timestamp: string
          session_id: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          quality: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          quantity?: number
          timestamp?: string
          session_id: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: 'red' | 'blue' | 'green' | 'yellow'
          quality?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          quantity?: number
          timestamp?: string
          session_id?: string
          created_at?: string
        }
      }
      oil_sales: {
        Row: {
          id: string
          session_id: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          quality: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          quantity: number
          price_per_barrel: number
          total_amount: number
          sold_by: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          quality: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          quantity: number
          price_per_barrel: number
          total_amount: number
          sold_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          team_id?: 'red' | 'blue' | 'green' | 'yellow'
          quality?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
          quantity?: number
          price_per_barrel?: number
          total_amount?: number
          sold_by?: string
          created_at?: string
        }
      }
      oil_hints: {
        Row: {
          id: string
          session_id: string
          hint_text: string
          quality_hint_for: string | null
          cost: number
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          hint_text: string
          quality_hint_for?: string | null
          cost: number
          created_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          hint_text?: string
          quality_hint_for?: string | null
          cost?: number
          created_by?: string
          created_at?: string
        }
      }
      hint_purchases: {
        Row: {
          id: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          hint_id: string
          session_id: string
          purchased_at: string
        }
        Insert: {
          id?: string
          team_id: 'red' | 'blue' | 'green' | 'yellow'
          hint_id: string
          session_id: string
          purchased_at?: string
        }
        Update: {
          id?: string
          team_id?: 'red' | 'blue' | 'green' | 'yellow'
          hint_id?: string
          session_id?: string
          purchased_at?: string
        }
      }
      rules_acceptance: {
        Row: {
          id: string
          user_id: string
          accepted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          accepted_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          accepted_at?: string
          created_at?: string
        }
      }
    }
    Functions: {
      get_team_wallet_with_transactions: {
        Args: {
          team_id_param: string
        }
        Returns: {
          wallet_id: string
          team_id: string
          coins: number
          net_worth: number
          updated_at: string
          transactions: unknown
        }[]
      }
      get_game_leaderboard: {
        Args: Record<string, never>
        Returns: {
          team_id: string
          coins: number
          net_worth: number
          rank: number
        }[]
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
      add_coins_to_team: {
        Args: {
          team_id_param: string
          amount_param: number
          description_param?: string
        }
        Returns: undefined
      }
      get_coin_transactions_with_admin: {
        Args: Record<string, never>
        Returns: {
          transaction_id: string
          admin_name: string
          team_id: string
          amount: number
          transaction_type: string
          description: string | null
          created_at: string
        }[]
      }
      excavate_square: {
        Args: {
          square_id_param: number
          session_id_param: string
        }
        Returns: {
          success: boolean
          quality: string
          coins_deducted: number
          remaining_coins: number
        }
      }
      get_oil_grid_with_status: {
        Args: {
          session_id_param: string
        }
        Returns: {
          square_id: number
          quality: string
          is_excavated: boolean
          excavated_by_team: string | null
          timestamp: string | null
        }[]
      }
      get_team_inventory: {
        Args: {
          team_id_param: string
          session_id_param: string
        }
        Returns: {
          quality: string
          quantity: number
        }[]
      }
      get_all_teams_inventory: {
        Args: {
          session_id_param: string
        }
        Returns: {
          team_id: string
          common_count: number
          rare_count: number
          epic_count: number
          legendary_count: number
          mythic_count: number
          total_count: number
        }[]
      }
      initialize_oil_grid: {
        Args: {
          session_id_param: string
        }
        Returns: undefined
      }
      buy_oil_from_team: {
        Args: {
          team_id_param: string
          quality_param: string
          quantity_param: number
          session_id_param: string
        }
        Returns: {
          success: boolean
          quantity_sold: number
          quality: string
          price_per_barrel: number
          total_amount: number
          remaining_inventory: number
        }
      }
      get_oil_sales_history: {
        Args: {
          session_id_param: string
        }
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
      get_shop_statistics: {
        Args: {
          session_id_param: string
        }
        Returns: {
          total_sales: number
          total_revenue: number
          sales_by_quality: unknown
          top_selling_team: string | null
          top_selling_team_amount: number
        }[]
      }
      purchase_hint: {
        Args: {
          hint_id_param: string
          session_id_param: string
        }
        Returns: {
          success: boolean
          hint_text: string
          cost: number
          remaining_coins: number
        }
      }
      get_available_hints_for_team: {
        Args: {
          team_id_param: string
          session_id_param: string
        }
        Returns: {
          id: string
          hint_text: string
          quality_hint_for: string | null
          cost: number
          created_at: string
          is_purchased: boolean
        }[]
      }
      get_hint_analytics: {
        Args: {
          session_id_param: string
        }
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
      create_hint: {
        Args: {
          hint_text_param: string
          quality_hint_for_param: string
          cost_param: number
          session_id_param: string
        }
        Returns: {
          success: boolean
          hint_id: string
          message: string
        }
      }
      has_accepted_rules: {
        Args: {
          user_id_param: string
        }
        Returns: boolean
      }
      accept_rules: {
        Args: {
          user_id_param: string
        }
        Returns: boolean
      }
      initialize_team_wallets: {
        Args: Record<string, never>
        Returns: undefined
      }
      get_team_economy_status: {
        Args: {
          session_id_param: string
        }
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
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type TeamSwitch = Database['public']['Tables']['team_switches']['Row']
export type CampSettings = Database['public']['Tables']['camp_settings']['Row']
export type GameSession = Database['public']['Tables']['game_sessions']['Row']
export type TeamWallet = Database['public']['Tables']['team_wallets']['Row']
export type OilTransaction = Database['public']['Tables']['oil_transactions']['Row']
export type CoinTransaction = Database['public']['Tables']['coin_transactions']['Row']
export type OilGrid = Database['public']['Tables']['oil_grid']['Row']
export type OilInventory = Database['public']['Tables']['oil_inventory']['Row']
export type OilSale = Database['public']['Tables']['oil_sales']['Row']
export type OilHint = Database['public']['Tables']['oil_hints']['Row']
export type HintPurchase = Database['public']['Tables']['hint_purchases']['Row']
export type RulesAcceptance = Database['public']['Tables']['rules_acceptance']['Row']

export const TEAMS = {
  red: { name: 'Red', color: 'bg-red-500', lightColor: 'bg-red-100', textColor: 'text-red-600' },
  blue: { name: 'Blue', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-600' },
  green: { name: 'Green', color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-600' },
  yellow: { name: 'Yellow', color: 'bg-yellow-500', lightColor: 'bg-yellow-100', textColor: 'text-yellow-600' }
} as const

export type TeamColor = keyof typeof TEAMS