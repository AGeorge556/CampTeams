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
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 px-4 sm:px-6 lg:px-8">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>
      
      <div className="max-w-4xl w-full space-y-8">
  <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-16 w-16 text-orange-500" />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold text-[var(--color-text)]">
            {t('rulesAndAgreement')}
          </h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            {t('readAndAgreeToRules')}
          </p>
        </div>

        <div className="bg-[var(--color-card-bg)] rounded-lg shadow-lg p-8 space-y-8 border border-[var(--color-border)]">
          {/* Website Purpose Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-text)] flex items-center">
              <Users className="h-6 w-6 mr-2 text-orange-500" />
              {t('aboutPlatform')}
            </h2>
                          <div className="prose prose-lg text-[var(--color-text-muted)] space-y-4">
                <p>
                  {t('platformDescription')}
                </p>
                <p>
                  <strong>{t('teamSwitchingConcept')}:</strong> {t('teamSwitchingDescription')}
                </p>
                <p>
                  <strong>{t('teamSwitchingLimitations')}:</strong> {t('teamSwitchingDeadlineDescription')}
                </p>
                <p>
                  <strong>{t('teamBalanceLimits')}:</strong> {t('teamBalanceDescription')}
                </p>
              </div>
          </div>

          {/* General Camp Rules Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[var(--color-text)] flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-orange-500" />
              {t('generalCampRules')}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Respect for Others */}
              <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                <div className="flex items-start space-x-3">
                  <Heart className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">{t('respectForOthers')}</h3>
                    <ul className="text-[var(--color-text-muted)] space-y-2 text-sm">
                      <li>• {t('respectRule1')}</li>
                      <li>• {t('respectRule2')}</li>
                      <li>• {t('respectRule3')}</li>
                      <li>• {t('respectRule4')}</li>
                      <li>• {t('respectRule5')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Teamwork and Fair Play */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Users className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">{t('teamworkAndFairPlay')}</h3>
                    <ul className="text-[var(--color-text-muted)] space-y-2 text-sm">
                      <li>• {t('teamworkRule1')}</li>
                      <li>• {t('teamworkRule2')}</li>
                      <li>• {t('teamworkRule3')}</li>
                      <li>• {t('teamworkRule4')}</li>
                      <li>• {t('teamworkRule5')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Rules */}
            <div className="bg-[var(--color-bg-muted)] rounded-lg p-6 border border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-[var(--color-text)] mb-3">{t('additionalGuidelines')}</h3>
              <ul className="text-[var(--color-text-muted)] space-y-2 text-sm">
                <li>• {t('additionalRule1')}</li>
                <li>• {t('additionalRule2')}</li>
                <li>• {t('additionalRule3')}</li>
                <li>• {t('additionalRule4')}</li>
                <li>• {t('additionalRule5')}</li>
                <li>• {t('additionalRule6')}</li>
              </ul>
            </div>
          </div>

          {/* Agreement Section */}
      <div className="border-t border-[var(--color-border)] pt-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="agree-rules"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
        className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-[var(--color-border)] rounded bg-[var(--color-bg)]"
              />
              <label htmlFor="agree-rules" className="text-gray-700">
                <span className="font-medium">{t('agreeToRules')}</span>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  {t('agreementDescription')}
                </p>
              </label>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleAccept}
              loading={loading}
              disabled={!agreed}
              icon={<Check />}
              className="px-8 py-3 text-lg"
            >
              {t('continueToCamp')}
            </Button>
          </div>

          {/* Warning Message */}
          {!agreed && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
        <p className="text-yellow-700 text-sm">
                  {t('mustAgreeToRules')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 