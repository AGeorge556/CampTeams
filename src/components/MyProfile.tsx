import { useState } from 'react'
import { User, Phone, Users, Edit2, Save, X } from 'lucide-react'
import { useCamp } from '../contexts/CampContext'
import { supabase, TEAMS, TeamColor } from '../lib/supabase'
import { useToast } from './Toast'
import Button from './ui/Button'
import { getGradeDisplayWithNumber } from '../lib/utils'

interface EditableFields {
  mobile_number: string
  parent_name: string
  parent_number: string
}

export default function MyProfile() {
  const { currentRegistration, refreshRegistration } = useCamp()
  const { addToast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EditableFields>({
    mobile_number: '',
    parent_name: '',
    parent_number: '',
  })

  if (!currentRegistration) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--color-text-muted)',
          fontSize: '1rem',
        }}
      >
        No registration found.
      </div>
    )
  }

  const reg = currentRegistration as typeof currentRegistration & {
    age?: number
    mobile_number?: string
    parent_name?: string
    parent_number?: string
  }

  const team = reg.current_team ? TEAMS[reg.current_team as TeamColor] : null

  const handleEditStart = () => {
    setForm({
      mobile_number: reg.mobile_number ?? '',
      parent_name: reg.parent_name ?? '',
      parent_number: reg.parent_number ?? '',
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!form.mobile_number.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Mobile number is required.' })
      return
    }
    if (!form.parent_name.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: "Parent's name is required." })
      return
    }
    if (!form.parent_number.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: "Parent's number is required." })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('camp_registrations')
        .update({
          mobile_number: form.mobile_number.trim(),
          parent_name: form.parent_name.trim(),
          parent_number: form.parent_number.trim(),
        })
        .eq('id', reg.id)

      if (error) throw error

      await refreshRegistration()
      setIsEditing(false)
      addToast({ type: 'success', title: 'Profile Updated', message: 'Your contact info has been saved.' })
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err?.message ?? 'Something went wrong.' })
    } finally {
      setSaving(false)
    }
  }

  const genderLabel = reg.gender === 'male' ? 'Male' : reg.gender === 'female' ? 'Female' : reg.gender ?? '—'

  return (
    <div
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '1.5rem 1rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Page heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
        <User
          style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)', flexShrink: 0 }}
        />
        <h1
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          My Profile
        </h1>
      </div>

      {/* ── Summary card ── */}
      <div
        style={{
          background: 'var(--color-card-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '1.25rem 1.25rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Avatar circle */}
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '50%',
              background: team ? team.colorValue : 'var(--color-bg-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
              letterSpacing: '0.02em',
            }}
          >
            {reg.full_name
              ? reg.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : '?'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
            <span
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {reg.full_name}
            </span>
            <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              {reg.grade ? getGradeDisplayWithNumber(reg.grade) : '—'} &middot; {genderLabel}
              {reg.age ? ` · Age ${reg.age}` : ''}
            </span>
          </div>
        </div>

        {/* Team + switches row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Team badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              background: team ? team.colorValue + '22' : 'var(--color-bg-muted)',
              border: `1px solid ${team ? team.colorValue + '55' : 'var(--color-border)'}`,
            }}
          >
            <Users
              style={{
                width: '0.875rem',
                height: '0.875rem',
                color: team ? team.colorValue : 'var(--color-text-muted)',
              }}
            />
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: team ? team.colorValue : 'var(--color-text-muted)',
              }}
            >
              {team ? `${team.name} Team` : 'No team assigned'}
            </span>
          </div>

          {/* Switches remaining */}
          <span
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              background: 'var(--color-bg-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            {reg.switches_remaining ?? 0} switch{reg.switches_remaining === 1 ? '' : 'es'} remaining
          </span>
        </div>
      </div>

      {/* ── Contact Info card ── */}
      <div
        style={{
          background: 'var(--color-card-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone
              style={{ width: '1rem', height: '1rem', color: 'var(--color-primary)', flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              Contact Info
            </span>
          </div>

          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 style={{ width: '0.875rem', height: '0.875rem' }} />}
              onClick={handleEditStart}
            >
              Edit
            </Button>
          )}
        </div>

        {/* Fields */}
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <FieldInput
              label="My Mobile Number"
              value={form.mobile_number}
              onChange={(v) => setForm((f) => ({ ...f, mobile_number: v }))}
              placeholder="+1 234 567 8900"
              type="tel"
            />
            <FieldInput
              label="Parent / Guardian Name"
              value={form.parent_name}
              onChange={(v) => setForm((f) => ({ ...f, parent_name: v }))}
              placeholder="Full name"
              type="text"
            />
            <FieldInput
              label="Parent / Guardian Number"
              value={form.parent_number}
              onChange={(v) => setForm((f) => ({ ...f, parent_number: v }))}
              placeholder="+1 234 567 8900"
              type="tel"
            />

            {/* Save / Cancel */}
            <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                icon={<Save style={{ width: '0.875rem', height: '0.875rem' }} />}
                onClick={handleSave}
              >
                Save Changes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={saving}
                icon={<X style={{ width: '0.875rem', height: '0.875rem' }} />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <FieldRow label="My Mobile" value={reg.mobile_number} />
            <FieldRow label="Parent / Guardian" value={reg.parent_name} />
            <FieldRow label="Parent Number" value={reg.parent_number} />
          </div>
        )}
      </div>

      {/* Read-only note */}
      {!isEditing && (
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Name, age, grade, and gender can only be changed by an admin.
        </p>
      )}
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────── */

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.15rem',
        padding: '0.5rem 0.75rem',
        background: 'var(--color-bg-muted)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
      }}
    >
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.9375rem', color: 'var(--color-text)', fontWeight: 500 }}>
        {value?.trim() ? value : <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Not provided</span>}
      </span>
    </div>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          fontSize: '0.9375rem',
          color: 'var(--color-text)',
          background: 'var(--color-bg-muted)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
        }}
      />
    </div>
  )
}
