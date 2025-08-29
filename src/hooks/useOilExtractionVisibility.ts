import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

export function useOilExtractionVisibility() {
  const [oilExtractionVisible, setOilExtractionVisible] = useState<boolean>(true)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    fetchOilExtractionVisibility()
  }, [])

  const fetchOilExtractionVisibility = async () => {
    try {
      const { data, error } = await supabase
        .from('camp_settings')
        .select('oil_extraction_visible')
        .single()

      if (error) {
        // Handle different error types gracefully
        if (error.code === 'PGRST116') {
          // No rows returned - use default value
          setOilExtractionVisible(true)
        } else if (error.code === 'PGRST301' || error.code === '42501') {
          // Permission denied or insufficient privileges - use default value
          console.warn('Permission denied accessing camp_settings, using default visibility')
          setOilExtractionVisible(true)
        } else {
          console.error('Error fetching oil extraction visibility:', error)
          // Use default value on error
          setOilExtractionVisible(true)
        }
      } else {
        setOilExtractionVisible(data?.oil_extraction_visible ?? true)
      }
    } catch (error) {
      console.error('Error fetching oil extraction visibility:', error)
      // Use default value on any error
      setOilExtractionVisible(true)
    } finally {
      setLoading(false)
    }
  }

  const toggleOilExtractionVisibility = async () => {
    setLoading(true)
    try {
      const newVisibility = !oilExtractionVisible
      
      // First try to update existing record
      const { error: updateError } = await supabase
        .from('camp_settings')
        .update({ oil_extraction_visible: newVisibility })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update any existing record

      // If no record exists, we'll get an error, so we need to handle it gracefully
      if (updateError && updateError.code === 'PGRST116') {
        // No records to update, but that's okay - the setting will be created when needed
        console.log('No existing camp_settings record to update')
      } else if (updateError) {
        throw updateError
      }

      setOilExtractionVisible(newVisibility)
      
      addToast({
        type: 'success',
        title: 'Oil Extraction Visibility Updated',
        message: `Oil extraction tab is now ${newVisibility ? 'visible' : 'hidden'} to campers`
      })
    } catch (error: any) {
      console.error('Error updating oil extraction visibility:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to update oil extraction visibility'
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    oilExtractionVisible,
    loading,
    toggleOilExtractionVisibility
  }
} 