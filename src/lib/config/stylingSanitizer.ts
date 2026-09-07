/**
 * stylingSanitizer.ts
 * Strict allowlist parser and sanitizer for homepage_styling configuration.
 *
 * Enforces:
 * 1. Safe font name allowlist matching curated Google Fonts (alphanumeric + space only).
 * 2. Bounded dimensions for font-size and hero heading size (px, rem, clamp).
 * 3. Strict rejection of CSS break-outs: </style>, @import, url(), script tags, semicolons, brackets, braces.
 * 4. Safe conversion into typed CSS variables and sanitized inline style blocks.
 */

export interface HomepageStylingInput {
  headingFont?: unknown;
  bodyFont?: unknown;
  baseFontSize?: unknown;
  heroHeadingSize?: unknown;
  headingWeight?: unknown;
  [key: string]: unknown;
}

export interface SanitizedHomepageStyling {
  headingFont: string;
  bodyFont: string;
  baseFontSize: string;
  heroHeadingSize: string;
  headingWeight: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized: SanitizedHomepageStyling | null;
}

export interface TypedCssVariables {
  '--font-heading': string;
  '--font-body': string;
  '--base-font-size': string;
  '--hero-heading-size': string;
  '--heading-weight': string;
}

// Default safe styling values
export const DEFAULT_HOMEPAGE_STYLING: Readonly<SanitizedHomepageStyling> = Object.freeze({
  headingFont: 'Playfair Display',
  bodyFont: 'Inter',
  baseFontSize: '16px',
  heroHeadingSize: '5rem',
  headingWeight: '600',
});

// Curated safe Google Fonts allowlist for headings (matching admin UI + luxury spa aesthetic)
export const ALLOWED_HEADING_FONTS: readonly string[] = Object.freeze([
  'Playfair Display',
  'Cormorant Garamond',
  'Cinzel',
  'Cinzel Decorative',
  'Merriweather',
  'Lora',
  'Prata',
  'EB Garamond',
  'Marcellus',
  'Bodoni Moda',
  'Libre Baskerville',
  'Philosopher',
  'Great Vibes',
  'Alex Brush',
  'Italiana',
  'Cormorant',
  'Spectral',
  'Castoro',
]);

// Curated safe Google Fonts allowlist for body text (matching admin UI + high readability)
export const ALLOWED_BODY_FONTS: readonly string[] = Object.freeze([
  'Inter',
  'Roboto',
  'Outfit',
  'Open Sans',
  'Montserrat',
  'Lato',
  'Nunito',
  'Poppins',
  'Raleway',
  'Plus Jakarta Sans',
  'Source Sans 3',
  'Work Sans',
  'DM Sans',
  'Manrope',
  'Rubik',
]);

// Allowed heading weights
export const ALLOWED_HEADING_WEIGHTS: readonly string[] = Object.freeze([
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
]);

const ALLOWED_HEADING_FONTS_MAP = new Map(
  ALLOWED_HEADING_FONTS.map(font => [font.toLowerCase(), font])
);

const ALLOWED_BODY_FONTS_MAP = new Map(
  ALLOWED_BODY_FONTS.map(font => [font.toLowerCase(), font])
);

const ALLOWED_WEIGHTS_SET = new Set(ALLOWED_HEADING_WEIGHTS);

/**
 * Checks whether a string contains any dangerous CSS or HTML injection vectors:
 * - </style> or <style>
 * - <script> or </script>
 * - @import, @charset, @namespace
 * - url(...)
 * - javascript: or expression(...) or behavior:
 * - semicolons (;), braces ({, }), brackets ([, ]), angle brackets (<, >)
 * - quotes (', ", `)
 * - backslashes (\)
 * - newlines (\r, \n) or null bytes (\0)
 */
export function containsDangerousCss(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  // Check dangerous tags and directives
  if (/<\/?style/i.test(value)) return true;
  if (/<\/?script/i.test(value)) return true;
  if (/@(?:import|charset|namespace|keyframes|font-face|supports|media)/i.test(value)) return true;
  if (/url\s*\(/i.test(value)) return true;
  if (/javascript\s*:/i.test(value)) return true;
  if (/expression\s*\(/i.test(value)) return true;
  if (/behavior\s*:/i.test(value)) return true;

  // Check forbidden punctuation: semicolons, braces, brackets, angle brackets, quotes, backslashes
  if (/[;{}<>[\]\\`"']/i.test(value)) return true;

  // Check control characters
  if (/[\r\n\0\u2028\u2029]/.test(value)) return true;

  return false;
}

/**
 * Validates a font name against an allowlist map and safe naming regex.
 */
function validateFontName(
  font: unknown,
  allowedMap: Map<string, string>,
  fontType: 'heading' | 'body'
): { isValid: boolean; canonicalName?: string; error?: string } {
  if (typeof font !== 'string') {
    return { isValid: false, error: `${fontType}Font must be a string` };
  }

  const trimmed = font.trim();
  if (!trimmed) {
    return { isValid: false, error: `${fontType}Font cannot be empty` };
  }

  if (containsDangerousCss(trimmed)) {
    return { isValid: false, error: `${fontType}Font contains forbidden characters` };
  }

  // Must only consist of alphanumeric characters and single spaces
  if (!/^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/.test(trimmed) || trimmed.length > 50) {
    return { isValid: false, error: `${fontType}Font format is invalid` };
  }

  const canonical = allowedMap.get(trimmed.toLowerCase());
  if (!canonical) {
    return {
      isValid: false,
      error: `${fontType}Font "${trimmed}" is not in the list of allowed safe fonts`,
    };
  }

  return { isValid: true, canonicalName: canonical };
}

/**
 * Validates heading weight.
 */
function validateHeadingWeight(weight: unknown): { isValid: boolean; weight?: string; error?: string } {
  if (weight === undefined || weight === null) {
    return { isValid: true, weight: DEFAULT_HOMEPAGE_STYLING.headingWeight };
  }

  const strWeight = String(weight).trim();
  if (containsDangerousCss(strWeight)) {
    return { isValid: false, error: 'headingWeight contains forbidden characters' };
  }

  if (ALLOWED_WEIGHTS_SET.has(strWeight)) {
    return { isValid: true, weight: strWeight };
  }

  return {
    isValid: false,
    error: `headingWeight "${strWeight}" is invalid. Allowed weights: ${ALLOWED_HEADING_WEIGHTS.join(', ')}`,
  };
}

/**
 * Validates base font size:
 * - 12px to 24px
 * - 0.75rem to 1.5rem
 * - bounded clamp(min, pref, max)
 */
function validateBaseFontSize(size: unknown): { isValid: boolean; size?: string; error?: string } {
  if (size === undefined || size === null) {
    return { isValid: true, size: DEFAULT_HOMEPAGE_STYLING.baseFontSize };
  }

  if (typeof size !== 'string') {
    return { isValid: false, error: 'baseFontSize must be a string' };
  }

  const trimmed = size.trim();
  if (containsDangerousCss(trimmed)) {
    return { isValid: false, error: 'baseFontSize contains forbidden characters' };
  }

  // Check px (12px to 24px)
  const pxMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*px$/);
  if (pxMatch) {
    const val = parseFloat(pxMatch[1]);
    if (val >= 12 && val <= 24) {
      return { isValid: true, size: `${val}px` };
    }
    return { isValid: false, error: 'baseFontSize in px must be between 12px and 24px' };
  }

  // Check rem (0.75rem to 1.5rem)
  const remMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*rem$/);
  if (remMatch) {
    const val = parseFloat(remMatch[1]);
    if (val >= 0.75 && val <= 1.5) {
      return { isValid: true, size: `${val}rem` };
    }
    return { isValid: false, error: 'baseFontSize in rem must be between 0.75rem and 1.5rem' };
  }

  // Check bounded clamp(min, pref, max)
  const clampMatch = trimmed.match(
    /^clamp\(\s*(\d+(?:\.\d+)?(?:px|rem))\s*,\s*(\d+(?:\.\d+)?(?:vw|vi|cqw|%|rem))\s*,\s*(\d+(?:\.\d+)?(?:px|rem))\s*\)$/
  );
  if (clampMatch) {
    return { isValid: true, size: trimmed };
  }

  return {
    isValid: false,
    error: 'baseFontSize must be between 12px-24px, 0.75rem-1.5rem, or a valid bounded clamp(...)',
  };
}

/**
 * Validates hero heading size:
 * - 24px to 128px
 * - 2rem to 8rem
 * - bounded clamp(min, pref, max)
 */
function validateHeroHeadingSize(size: unknown): { isValid: boolean; size?: string; error?: string } {
  if (size === undefined || size === null) {
    return { isValid: true, size: DEFAULT_HOMEPAGE_STYLING.heroHeadingSize };
  }

  if (typeof size !== 'string') {
    return { isValid: false, error: 'heroHeadingSize must be a string' };
  }

  const trimmed = size.trim();
  if (containsDangerousCss(trimmed)) {
    return { isValid: false, error: 'heroHeadingSize contains forbidden characters' };
  }

  // Check rem (2rem to 8rem)
  const remMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*rem$/);
  if (remMatch) {
    const val = parseFloat(remMatch[1]);
    if (val >= 2 && val <= 8) {
      return { isValid: true, size: `${val}rem` };
    }
    return { isValid: false, error: 'heroHeadingSize in rem must be between 2rem and 8rem' };
  }

  // Check px (24px to 128px)
  const pxMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*px$/);
  if (pxMatch) {
    const val = parseFloat(pxMatch[1]);
    if (val >= 24 && val <= 128) {
      return { isValid: true, size: `${val}px` };
    }
    return { isValid: false, error: 'heroHeadingSize in px must be between 24px and 128px' };
  }

  // Check bounded clamp(min, pref, max)
  const clampMatch = trimmed.match(
    /^clamp\(\s*(\d+(?:\.\d+)?(?:px|rem))\s*,\s*(\d+(?:\.\d+)?(?:vw|vi|cqw|%|rem))\s*,\s*(\d+(?:\.\d+)?(?:px|rem))\s*\)$/
  );
  if (clampMatch) {
    return { isValid: true, size: trimmed };
  }

  return {
    isValid: false,
    error: 'heroHeadingSize must be between 2rem-8rem, 24px-128px, or a valid bounded clamp(...)',
  };
}

/**
 * Validates a homepage styling payload.
 * Used at API boundaries (e.g. POST /api/admin/system-settings).
 */
export function validateHomepageStyling(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      errors: ['homepage_styling must be an object'],
      sanitized: null,
    };
  }

  const record = input as Record<string, unknown>;

  // Reject unexpected keys
  const allowedKeys = new Set([
    'headingFont',
    'bodyFont',
    'baseFontSize',
    'heroHeadingSize',
    'headingWeight',
  ]);

  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      errors.push(`Unknown styling property "${key}"`);
    }
  }

  const headingFontVal = validateFontName(
    record.headingFont ?? DEFAULT_HOMEPAGE_STYLING.headingFont,
    ALLOWED_HEADING_FONTS_MAP,
    'heading'
  );
  if (!headingFontVal.isValid) {
    errors.push(headingFontVal.error || 'Invalid headingFont');
  }

  const bodyFontVal = validateFontName(
    record.bodyFont ?? DEFAULT_HOMEPAGE_STYLING.bodyFont,
    ALLOWED_BODY_FONTS_MAP,
    'body'
  );
  if (!bodyFontVal.isValid) {
    errors.push(bodyFontVal.error || 'Invalid bodyFont');
  }

  const weightVal = validateHeadingWeight(record.headingWeight);
  if (!weightVal.isValid) {
    errors.push(weightVal.error || 'Invalid headingWeight');
  }

  const baseSizeVal = validateBaseFontSize(record.baseFontSize);
  if (!baseSizeVal.isValid) {
    errors.push(baseSizeVal.error || 'Invalid baseFontSize');
  }

  const heroSizeVal = validateHeroHeadingSize(record.heroHeadingSize);
  if (!heroSizeVal.isValid) {
    errors.push(heroSizeVal.error || 'Invalid heroHeadingSize');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      sanitized: null,
    };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      headingFont: headingFontVal.canonicalName || DEFAULT_HOMEPAGE_STYLING.headingFont,
      bodyFont: bodyFontVal.canonicalName || DEFAULT_HOMEPAGE_STYLING.bodyFont,
      baseFontSize: baseSizeVal.size || DEFAULT_HOMEPAGE_STYLING.baseFontSize,
      heroHeadingSize: heroSizeVal.size || DEFAULT_HOMEPAGE_STYLING.heroHeadingSize,
      headingWeight: weightVal.weight || DEFAULT_HOMEPAGE_STYLING.headingWeight,
    },
  };
}

/**
 * Sanitizes homepage styling for runtime consumption (layout.tsx, public API).
 * Returns null if the input is missing, empty, or fails safety checks.
 */
export function sanitizeHomepageStyling(input: unknown): SanitizedHomepageStyling | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }

  const validation = validateHomepageStyling(input);
  if (validation.isValid && validation.sanitized) {
    return validation.sanitized;
  }

  return null;
}

/**
 * Converts sanitized styling into typed CSS variables.
 */
export function toCssVariables(
  styling: SanitizedHomepageStyling,
  fallbacks?: { headingFallback?: string; bodyFallback?: string }
): TypedCssVariables {
  const headingFallback = fallbacks?.headingFallback ? `, ${fallbacks.headingFallback}` : ', serif';
  const bodyFallback = fallbacks?.bodyFallback ? `, ${fallbacks.bodyFallback}` : ', sans-serif';

  return {
    '--font-heading': `'${styling.headingFont}'${headingFallback}`,
    '--font-body': `'${styling.bodyFont}'${bodyFallback}`,
    '--base-font-size': styling.baseFontSize,
    '--hero-heading-size': styling.heroHeadingSize,
    '--heading-weight': styling.headingWeight,
  };
}

/**
 * Constructs a safe Google Fonts link URL using only strictly validated tokens.
 */
export function getSafeGoogleFontUrl(styling: SanitizedHomepageStyling): string {
  const hFont = encodeURIComponent(styling.headingFont).replace(/%20/g, '+');
  const bFont = encodeURIComponent(styling.bodyFont).replace(/%20/g, '+');
  const weight = styling.headingWeight;

  return `https://fonts.googleapis.com/css2?family=${hFont}:ital,wght@0,400;0,${weight};1,400&family=${bFont}:wght@300;400;500;600&display=swap`;
}

/**
 * Generates a safe sanitized CSS string for the root layout <style> tag.
 * Uses only validated tokens and escapes/sanitizes Next.js fallback family strings.
 */
export function generateSanitizedCss(
  styling: SanitizedHomepageStyling,
  fallbacks: { headingFontFamily?: string; bodyFontFamily?: string }
): string {
  // Only permit alphanumeric, hyphens, and underscores in fallback font family names
  const safeHeadingFallback = fallbacks.headingFontFamily
    ? fallbacks.headingFontFamily.replace(/[^a-zA-Z0-9_-]/g, '')
    : '';
  const safeBodyFallback = fallbacks.bodyFontFamily
    ? fallbacks.bodyFontFamily.replace(/[^a-zA-Z0-9_-]/g, '')
    : '';

  const headingFallbackList = safeHeadingFallback
    ? `'${styling.headingFont}', ${safeHeadingFallback}, serif`
    : `'${styling.headingFont}', serif`;

  const bodyFallbackList = safeBodyFallback
    ? `'${styling.bodyFont}', ${safeBodyFallback}, sans-serif`
    : `'${styling.bodyFont}', sans-serif`;

  const css = `
:root {
  --font-heading: ${headingFallbackList};
  --font-body: ${bodyFallbackList};
  font-size: ${styling.baseFontSize};
}
.hero-title, h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: ${styling.headingWeight};
}
@media (min-width: 768px) {
  .hero-title {
    font-size: ${styling.heroHeadingSize} !important;
  }
}
body {
  font-family: var(--font-body);
}
`.trim();

  // Defense-in-depth: if any forbidden characters are somehow detected, abort and return empty string
  if (containsDangerousCss(css)) {
    console.error('[stylingSanitizer] Safety assertion failed during CSS generation');
    return '';
  }

  return css;
}
