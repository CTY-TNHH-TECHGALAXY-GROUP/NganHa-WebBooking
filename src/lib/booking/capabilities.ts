export const KNOWN_BODY_AREAS = [
  'HEAD', 'NECK', 'SHOULDER', 'BACK', 'ARM', 'THIGH', 'KNEE', 'CALF', 'FOOT',
  'WHOLE_BODY', 'FULL_BODY',
] as const;

export type CapabilityConfig = {
  showCustomForYou?: boolean | null;
  showPreferences?: boolean | null;
  showStrength?: boolean | null;
  showGender?: boolean | null;
  showFocus?: boolean | null;
  showNotes?: boolean | null;
  focusConfig?: unknown;
};

export type ServiceCapabilities = {
  custom: boolean;
  strength: boolean;
  gender: boolean;
  preferences: boolean;
  focus: boolean;
  notes: boolean;
  allowedBodyAreas: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

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
  const strength = custom && config.showPreferences !== false && config.showStrength === true;
  const gender = custom && config.showPreferences !== false && config.showGender !== false;
  const allowedBodyAreas = parseAllowedBodyAreas(config.focusConfig);

  return {
    custom,
    strength,
    gender,
    preferences: strength || gender,
    focus: custom && config.showFocus !== false && allowedBodyAreas.length > 0,
    notes: custom && config.showNotes !== false,
    allowedBodyAreas,
  };
}
