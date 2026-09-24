export const KNOWN_BODY_AREAS = [
  'HEAD', 'NECK', 'SHOULDER', 'BACK', 'ARM', 'THIGH', 'KNEE', 'CALF', 'FOOT',
  'WHOLE_BODY', 'FULL_BODY',
] as const;

export const STRENGTH_LEVELS = ['light', 'medium', 'strong'] as const;
export type StrengthLevel = (typeof STRENGTH_LEVELS)[number];

export type CapabilityConfig = {
  showCustomForYou?: boolean | null;
  showPreferences?: boolean | null;
  showStrength?: boolean | null;
  strengthConfig?: unknown;
  showGender?: boolean | null;
  showFocus?: boolean | null;
  showNotes?: boolean | null;
  focusConfig?: unknown;
};

export type ServiceCapabilities = {
  custom: boolean;
  strength: boolean;
  allowedStrengths: StrengthLevel[];
  gender: boolean;
  preferences: boolean;
  focus: boolean;
  notes: boolean;
  allowedBodyAreas: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function parseAllowedStrengths(value: unknown): StrengthLevel[] {
  if (value === null || value === undefined) return [...STRENGTH_LEVELS];
  if (!isRecord(value)) return [];
  return STRENGTH_LEVELS.filter(level => value[level] === true);
}

export function parseAllowedBodyAreas(value: unknown): string[] {
  let candidate = value;
  if (typeof candidate === 'string') {
    try { candidate = JSON.parse(candidate); } catch { return []; }
  }
  if (!isRecord(candidate)) return [];

  const known = new Set<string>(KNOWN_BODY_AREAS);
  return Object.entries(candidate)
    .filter(([key, enabled]) => known.has(key.toUpperCase()) && enabled === true)
    .map(([key]) => key.toUpperCase());
}

export function resolveServiceCapabilities(config: CapabilityConfig): ServiceCapabilities {
  const custom = config.showCustomForYou !== false;
  const allowedStrengths = parseAllowedStrengths(config.strengthConfig);
  const strength = custom && config.showPreferences !== false && config.showStrength === true && allowedStrengths.length > 0;
  const gender = custom && config.showPreferences !== false && config.showGender !== false;
  const allowedBodyAreas = parseAllowedBodyAreas(config.focusConfig);

  return {
    custom,
    strength,
    allowedStrengths: strength ? allowedStrengths : [],
    gender,
    preferences: strength || gender,
    focus: custom && config.showFocus !== false && allowedBodyAreas.length > 0,
    notes: custom && config.showNotes !== false,
    allowedBodyAreas,
  };
}
