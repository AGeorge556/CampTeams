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
          friend_requests: string[]
          switches_remaining: number
          is_admin: boolean
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
          friend_requests?: string[]
          switches_remaining?: number
          is_admin?: boolean
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
          friend_requests?: string[]
          switches_remaining?: number
          is_admin?: boolean
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teams_locked?: boolean
          lock_date?: string | null
          max_team_size?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teams_locked?: boolean
          lock_date?: string | null
          max_team_size?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type TeamSwitch = Database['public']['Tables']['team_switches']['Row']
export type CampSettings = Database['public']['Tables']['camp_settings']['Row']

export const TEAMS = {
  red: { name: 'Red', color: 'bg-red-500', lightColor: 'bg-red-100', textColor: 'text-red-600' },
  blue: { name: 'Blue', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-600' },
  green: { name: 'Green', color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-600' },
  yellow: { name: 'Yellow', color: 'bg-yellow-500', lightColor: 'bg-yellow-100', textColor: 'text-yellow-600' }
} as const

export type TeamColor = keyof typeof TEAMS