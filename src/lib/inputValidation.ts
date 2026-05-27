// Centralized input validation and sanitization.
// Supabase uses parameterized queries so SQL injection via the ORM is not possible,
// but validation here enforces data integrity, prevents XSS-via-stored-content,
// and gives users clear feedback on bad input.

export interface ValidationResult {
  ok: boolean
  error?: string
}

const ok = (): ValidationResult => ({ ok: true })
const fail = (error: string): ValidationResult => ({ ok: false, error })

// ── Sanitizers ───────────────────────────────────────────────────────────────

/** Trim and collapse interior whitespace runs to a single space. */
export function sanitizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/** Strip everything except digits, +, spaces, hyphens, parentheses. */
export function sanitizePhone(value: string): string {
  return value.trim().replace(/[^\d\s+\-()]/g, '')
}

// ── Validators ───────────────────────────────────────────────────────────────

/** Human name: 2–60 chars, letters (incl. Arabic/Unicode), spaces, hyphens, apostrophes. */
export function validateName(value: string): ValidationResult {
  const s = sanitizeText(value)
  if (s.length < 2) return fail('Name must be at least 2 characters.')
  if (s.length > 60) return fail('Name must be 60 characters or fewer.')
  // Allow Unicode letters, spaces, hyphens, apostrophes — blocks angle brackets, scripts, SQL keywords
  if (/[<>"'`;\\]/.test(s)) return fail('Name contains invalid characters.')
  return ok()
}

/** Phone number: 7–15 digits after stripping formatting characters. */
export function validatePhone(value: string): ValidationResult {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 7) return fail('Phone number must be at least 7 digits.')
  if (digits.length > 15) return fail('Phone number must be 15 digits or fewer.')
  return ok()
}

/** Email: standard RFC-like pattern. */
export function validateEmail(value: string): ValidationResult {
  const s = value.trim()
  if (!s) return fail('Email is required.')
  if (s.length > 254) return fail('Email is too long.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return fail('Enter a valid email address.')
  return ok()
}

/** Password: 8–128 characters. */
export function validatePassword(value: string, isSignUp = false): ValidationResult {
  if (!isSignUp) {
    if (!value) return fail('Password is required.')
    return ok()
  }
  if (value.length < 8) return fail('Password must be at least 8 characters.')
  if (value.length > 128) return fail('Password must be 128 characters or fewer.')
  return ok()
}

/** Age: integer in [10, 25]. */
export function validateAge(value: string | number): ValidationResult {
  const n = typeof value === 'string' ? parseInt(value, 10) : value
  if (!Number.isInteger(n)) return fail('Age must be a whole number.')
  if (n < 10 || n > 25) return fail('Age must be between 10 and 25.')
  return ok()
}

/** Grade: integer in [7, 12] (per Egyptian school system). */
export function validateGrade(value: string | number): ValidationResult {
  const n = typeof value === 'string' ? parseInt(value, 10) : value
  if (!Number.isInteger(n)) return fail('Grade must be a whole number.')
  if (n < 7 || n > 12) return fail('Grade must be between 7 and 12.')
  return ok()
}

/** Gender: must be exactly 'male' or 'female'. */
export function validateGender(value: string): ValidationResult {
  if (value !== 'male' && value !== 'female') return fail('Please select a gender.')
  return ok()
}

/** Short free text (activity title, location): 1–100 characters. */
export function validateShortText(value: string, label: string, maxLen = 100): ValidationResult {
  const s = sanitizeText(value)
  if (!s) return fail(`${label} is required.`)
  if (s.length > maxLen) return fail(`${label} must be ${maxLen} characters or fewer.`)
  if (/[<>]/.test(s)) return fail(`${label} contains invalid characters.`)
  return ok()
}

/** Long free text (description, reason, announcement): 0–500 characters. */
export function validateLongText(value: string, label: string, maxLen = 500): ValidationResult {
  const s = value.trim()
  if (s.length > maxLen) return fail(`${label} must be ${maxLen} characters or fewer.`)
  if (/<script/i.test(s)) return fail(`${label} contains invalid content.`)
  return ok()
}

/** Score delta: integer in [-999, 999], non-zero. */
export function validateScoreDelta(value: number): ValidationResult {
  if (!Number.isInteger(value)) return fail('Points must be a whole number.')
  if (value === 0) return fail('Points cannot be zero.')
  if (value < -999 || value > 999) return fail('Points must be between -999 and 999.')
  return ok()
}

// ── Batch helper ─────────────────────────────────────────────────────────────

/** Run multiple validators and return the first failure, or ok. */
export function validate(...results: ValidationResult[]): ValidationResult {
  return results.find(r => !r.ok) ?? ok()
}
