// Single definition of how a stored gender value becomes a usable one.
//
// camp_registrations.gender and profiles.gender are both plain `string` in the
// schema — there is no CHECK constraint and no enum. Values entered before
// validateGender() existed, imported from spreadsheets, or typed by hand can be
// 'Male', 'F', ' female ', '' or null. Comparing those with === 'male' silently
// misclassifies people, which shows up as wrong team balance rather than as an
// error, so every read path funnels through here.

export type Gender = 'male' | 'female';

const MALE_FORMS = new Set(['male', 'm', 'boy', 'man']);
const FEMALE_FORMS = new Set(['female', 'f', 'girl', 'woman']);

// Returns null rather than guessing. Callers decide what an unknown value
// means for them — a roster count should skip it, a display should show
// "Unknown". Defaulting here would bury bad data.
export function normalizeGender(value: unknown): Gender | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (MALE_FORMS.has(normalized)) return 'male';
  if (FEMALE_FORMS.has(normalized)) return 'female';
  return null;
}

// For the places that must render something for every row.
export function genderLabel(value: unknown): string {
  const normalized = normalizeGender(value);
  if (normalized === 'male') return 'Male';
  if (normalized === 'female') return 'Female';
  return 'Unknown';
}

// Filter option type shared by every list that offers gender filtering, so the
// admin screens can't drift apart on what the values are called.
export type GenderFilter = 'all' | Gender | 'unknown';

export function matchesGenderFilter(
  value: unknown,
  filter: GenderFilter
): boolean {
  if (filter === 'all') return true;
  const normalized = normalizeGender(value);
  if (filter === 'unknown') return normalized === null;
  return normalized === filter;
}
