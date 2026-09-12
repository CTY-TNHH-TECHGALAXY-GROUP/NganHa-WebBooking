export const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
export const MAX_BCC_RECIPIENTS = 5;

const EMAIL_PATTERN = /^[^\s@<>,;:]+@[^\s@<>,;:]+\.[^\s@<>,;:]+$/;

export type BccNormalizationResult =
  | { ok: true; recipients: string[] }
  | { ok: false; errors: Array<'INVALID_TYPE' | 'MAX_RECIPIENTS' | 'INVALID_EMAIL' | 'HEADER_INJECTION'> };

export type ParsedNotificationSettings =
  | { ok: true; bccEnabled: boolean; bccRecipients: string[]; revision: number }
  | { ok: false; error: 'INVALID_SETTINGS' | 'INVALID_RECIPIENTS' | 'INVALID_REVISION' };

export type NotificationSettingsValue = {
  bccEnabled: boolean;
  bccRecipients: string[];
  revision: number;
};

export type NotificationSettingsSaveResult =
  | { state: 'saved'; value: NotificationSettingsValue }
  | { state: 'conflict' }
  | { state: 'invalid'; error: 'INVALID_SETTINGS' | 'INVALID_RECIPIENTS' | 'INVALID_REVISION' }
  | { state: 'unavailable' }
  | { state: 'failed' };

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

type NotificationSettingsMutationBuilder = {
  eq: (column: string, value: string) => NotificationSettingsMutationBuilder;
  or: (filters: string) => NotificationSettingsMutationBuilder;
  select: (columns: string) => {
    maybeSingle: () => PromiseLike<{ data: Record<string, unknown> | null; error?: unknown }>;
  };
};

type NotificationSettingsWriteTable = {
  update: (values: Record<string, unknown>) => NotificationSettingsMutationBuilder;
  insert: (values: Record<string, unknown>) => NotificationSettingsMutationBuilder;
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

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error)
    && typeof error === 'object'
    && (error as Record<string, unknown>).code === '23505';
}

/**
 * Persist settings with a database-side revision predicate. The read above is
 * only for diagnostics; the conditional UPDATE/INSERT decides the winner.
 */
export async function saveNotificationSettings(
  supabase: NotificationSettingsSupabase,
  input: { bccEnabled: unknown; bccRecipients: unknown; expectedRevision: unknown },
): Promise<NotificationSettingsSaveResult> {
  if (typeof input.bccEnabled !== 'boolean') {
    return { state: 'invalid', error: 'INVALID_SETTINGS' };
  }

  const recipients = normalizeBccRecipients(input.bccRecipients);
  if (!recipients.ok) return { state: 'invalid', error: 'INVALID_RECIPIENTS' };

  if (
    typeof input.expectedRevision !== 'number'
    || !Number.isSafeInteger(input.expectedRevision)
    || input.expectedRevision < 0
  ) {
    return { state: 'invalid', error: 'INVALID_REVISION' };
  }

  const current = await readNotificationSettings(supabase);
  if (current.state === 'unavailable') return { state: 'unavailable' };
  if (current.state === 'invalid') return { state: 'invalid', error: 'INVALID_SETTINGS' };
  if (current.revision !== input.expectedRevision) return { state: 'conflict' };

  const value: NotificationSettingsValue = {
    bccEnabled: input.bccEnabled,
    bccRecipients: recipients.recipients,
    revision: input.expectedRevision + 1,
  };
  const row = {
    key: NOTIFICATION_SETTINGS_KEY,
    value,
    updated_at: new Date().toISOString(),
  };

  try {
    const table = supabase.from('SystemConfigs') as NotificationSettingsWriteTable;

    if (current.state === 'absent') {
      // A unique-key insert makes first-time creation a single atomic winner.
      const { error } = await table.insert(row).select('value').maybeSingle();
      if (!error) return { state: 'saved', value };
      if (isUniqueViolation(error)) return { state: 'conflict' };
      console.error('[NotificationSettings] Initial configuration write failed', {
        code: safeDatabaseErrorCode(error),
      });
      return { state: 'failed' };
    }

    const update = table.update({ value, updated_at: row.updated_at }).eq('key', NOTIFICATION_SETTINGS_KEY);
    // Older rows may omit revision; the parser treats that shape as revision 0.
    const conditionalUpdate = input.expectedRevision === 0
      ? update.or('value->>revision.eq.0,value->>revision.is.null')
      : update.eq('value->>revision', String(input.expectedRevision));

    const { data, error } = await conditionalUpdate.select('value').maybeSingle();
    if (error) {
      console.error('[NotificationSettings] Conditional configuration write failed', {
        code: safeDatabaseErrorCode(error),
      });
      return { state: 'failed' };
    }
    if (!data) return { state: 'conflict' };
    return { state: 'saved', value };
  } catch {
    console.error('[NotificationSettings] Configuration write threw an exception');
    return { state: 'failed' };
  }
}
