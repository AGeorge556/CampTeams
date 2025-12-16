import React, { useState } from 'react'
import { Check, Users, Shield, Heart, Trophy, AlertCircle } from 'lucide-react'
import { useRulesAcceptance } from '../hooks/useRulesAcceptance'
import { useToast } from './Toast'
import { useLanguage } from '../contexts/LanguageContext'
import Button from './ui/Button'
import LanguageSwitcher from './LanguageSwitcher'

export default function RulesAgreement() {
  const { acceptRules } = useRulesAcceptance()
  const { addToast } = useToast()
  const { t } = useLanguage()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    if (!agreed) {
      addToast({
        type: 'error',
        title: t('agreementRequired'),
        message: t('mustAgreeToRules')
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await acceptRules()
      
      if (error) {
        throw new Error(error)
      }

      addToast({
        type: 'success',
        title: 'Welcome to Camp!',
        message: 'You have successfully agreed to the camp rules.'
      })

      // Refresh the page to trigger the app to show the Dashboard
      window.location.reload()
    } catch (error: any) {
      console.error('Error accepting rules:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to accept rules. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--gradient-app-bg)] px-4 sm:px-6 lg:px-8">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>
      
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Users className="h-16 w-16 text-sky-500" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-[var(--color-text)]">
            Camp Rules & Guidelines
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Please read and agree to the camp rules before continuing
          </p>
        </div>
        
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-lg p-6 border border-[var(--color-border)]">
          <div className="prose prose-sm max-w-none text-[var(--color-text)]">
            <div className="bg-[var(--color-bg-muted)] rounded-lg p-6 border border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Camp Rules & Guidelines</h3>
              
              <div className="space-y-4 text-sm text-[var(--color-text)]">
                <div>
                  <h4 className="font-semibold text-[var(--color-text)] mb-2">1. Respect & Kindness</h4>
                  <p className="text-[var(--color-text-muted)]">
                    Treat everyone with respect, kindness, and understanding. Bullying, harassment, or any form of discrimination will not be tolerated.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[var(--color-text)] mb-2">2. Safety First</h4>
                  <p className="text-[var(--color-text-muted)]">
                    Follow all safety guidelines and instructions from camp staff. Report any safety concerns immediately.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[var(--color-text)] mb-2">3. Team Participation</h4>
                  <p className="text-[var(--color-text-muted)]">
                    Participate actively in team activities and support your teammates. Remember, we're all working together to have a great camp experience.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[var(--color-text)] mb-2">4. Digital Citizenship</h4>
                  <p className="text-[var(--color-text-muted)]">
                    Use technology responsibly and respectfully. Be mindful of what you share online and how you interact with others digitally.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[var(--color-text)] mb-2">5. Christian Values</h4>
                  <p className="text-[var(--color-text-muted)]">
                    This camp is built on Christian values. We encourage you to live out these values in your interactions and activities.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--color-bg-muted)] border border-[var(--color-border)] rounded-lg p-4 mt-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm font-bold">!</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text)] mb-1">Important Note</h4>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    By agreeing to these rules, you commit to following them throughout the camp. Violation of these rules may result in appropriate consequences as determined by camp staff.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-lg p-4 sm:p-6 border border-[var(--color-border)]">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <input
                type="checkbox"
                id="agree-checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-6 h-6 sm:w-5 sm:h-5 text-sky-600 bg-[var(--color-input-bg)] border-[var(--color-border)] rounded focus:ring-sky-500 focus:ring-2 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="agree-checkbox" className="text-sm text-[var(--color-text)] cursor-pointer select-none">
                <span className="font-medium">I have read and agree to the Camp Rules & Guidelines</span>
                <p className="text-[var(--color-text-muted)] mt-1">
                  By checking this box, you acknowledge that you have read, understood, and agree to follow all the rules and guidelines outlined above.
                </p>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleAccept}
            loading={loading}
            disabled={!agreed}
            className={`px-8 py-3 text-lg ${!agreed ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processing...' : 'I Agree to the Rules'}
          </Button>
        </div>
      </div>
    </div>
  )
} 