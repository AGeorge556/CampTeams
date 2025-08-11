import type { Database } from './database.types'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

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
export type SportsMatch = Database['public']['Tables']['sports_matches']['Row']

export const TEAMS = {
  red: { name: 'Red', color: 'bg-red-500', lightColor: 'bg-red-100', textColor: 'text-red-600' },
  blue: { name: 'Blue', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-600' },
  green: { name: 'Green', color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-600' },
  yellow: { name: 'Yellow', color: 'bg-yellow-500', lightColor: 'bg-yellow-100', textColor: 'text-yellow-600' }
} as const

export type TeamColor = keyof typeof TEAMS