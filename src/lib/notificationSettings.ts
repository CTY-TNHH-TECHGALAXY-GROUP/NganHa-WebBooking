export const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
export const MAX_BCC_RECIPIENTS = 5;

const EMAIL_PATTERN = /^[^\s@<>,;:]+@[^\s@<>,;:]+\.[^\s@<>,;:]+$/;

export type BccNormalizationResult =
  | { ok: true; recipients: string[] }
  | { ok: false; errors: Array<'INVALID_TYPE' | 'MAX_RECIPIENTS' | 'INVALID_EMAIL' | 'HEADER_INJECTION'> };

export type ParsedNotificationSettings =
  | { ok: true; bccEnabled: boolean; bccRecipients: string[]; revision: number }
  | { ok: false; error: 'INVALID_SETTINGS' | 'INVALID_RECIPIENTS' | 'INVALID_REVISION' };

export type NotificationSettingsRead = {
  state: 'absent' | 'configured' | 'disabled' | 'unavailable' | 'invalid';
  bccEnabled: boolean;
  bccRecipients: string[];
  revision: number;
  diagnostic?: 'NOTIFICATION_SETTINGS_UNAVAILABLE' | 'NOTIFICATION_SETTINGS_INVALID';
};

type NotificationSettingsSupabase = {
  from: (table: string) => unknown;
};

type NotificationSettingsQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => PromiseLike<{ data: Record<string, unknown> | null; error?: unknown }>;
    };
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeDatabaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const code = (error as Record<string, unknown>).code;
  return typeof code === 'string' && /^[A-Z][A-Z0-9_:-]{1,31}$/.test(code) ? code : undefined;
}

/** Normalize a complete recipient list. Invalid input fails closed. */
export function normalizeBccRecipients(value: unknown): BccNormalizationResult {
  if (!Array.isArray(value)) return { ok: false, errors: ['INVALID_TYPE'] };

  const recipients: string[] = [];
  const seen = new Set<string>();
  const errors = new Set<'INVALID_EMAIL' | 'HEADER_INJECTION'>();

  for (const item of value) {
    if (typeof item !== 'string') {
      errors.add('INVALID_EMAIL');
      continue;
    }

    const email = item.trim();
    if (!email || email.length > 254 || /[\r\n\0]/.test(email)) {
      errors.add('HEADER_INJECTION');
      continue;
    }
    if (!EMAIL_PATTERN.test(email)) {
      errors.add('INVALID_EMAIL');
      continue;
    }

    const normalized = email.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      recipients.push(normalized);
    }
  }

  if (errors.size > 0) return { ok: false, errors: [...errors] };
  if (recipients.length > MAX_BCC_RECIPIENTS) return { ok: false, errors: ['MAX_RECIPIENTS'] };
  return { ok: true, recipients };
}

export function parseNotificationSettingsValue(value: unknown): ParsedNotificationSettings {
  if (!isRecord(value) || typeof value.bccEnabled !== 'boolean') {
    return { ok: false, error: 'INVALID_SETTINGS' };
  }

  const recipients = normalizeBccRecipients(value.bccRecipients);
  if (!recipients.ok) return { ok: false, error: 'INVALID_RECIPIENTS' };

  const revision = value.revision === undefined ? 0 : value.revision;
  if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0) {
    return { ok: false, error: 'INVALID_REVISION' };
  }

  return {
    ok: true,
    bccEnabled: value.bccEnabled,
    bccRecipients: recipients.recipients,
    revision,
  };
}

/** Read through the service-role Supabase client; callers decide how to expose the result. */
export async function readNotificationSettings(supabase: NotificationSettingsSupabase): Promise<NotificationSettingsRead> {
  try {
    const query = supabase.from('SystemConfigs') as NotificationSettingsQuery;
    const { data, error } = await query
      .select('value')
      .eq('key', NOTIFICATION_SETTINGS_KEY)
      .maybeSingle();

    if (error) {
      console.error('[NotificationSettings] Configuration read failed', {
        code: safeDatabaseErrorCode(error),
      });
      return {
        state: 'unavailable',
        bccEnabled: false,
        bccRecipients: [],
        revision: 0,
        diagnostic: 'NOTIFICATION_SETTINGS_UNAVAILABLE',
      };
    }

    if (!data) {
      return { state: 'absent', bccEnabled: false, bccRecipients: [], revision: 0 };
    }

    const parsed = parseNotificationSettingsValue(data.value);
    if (!parsed.ok) {
      console.error('[NotificationSettings] Configuration value is invalid', {
        reason: parsed.error,
      });
      return {
        state: 'invalid',
        bccEnabled: false,
        bccRecipients: [],
        revision: 0,
        diagnostic: 'NOTIFICATION_SETTINGS_INVALID',
      };
    }

    return {
      state: parsed.bccEnabled ? 'configured' : 'disabled',
      bccEnabled: parsed.bccEnabled,
      bccRecipients: parsed.bccRecipients,
      revision: parsed.revision,
    };
  } catch {
    console.error('[NotificationSettings] Configuration read threw an exception');
    return {
      state: 'unavailable',
      bccEnabled: false,
      bccRecipients: [],
      revision: 0,
      diagnostic: 'NOTIFICATION_SETTINGS_UNAVAILABLE',
    };
  }
}
