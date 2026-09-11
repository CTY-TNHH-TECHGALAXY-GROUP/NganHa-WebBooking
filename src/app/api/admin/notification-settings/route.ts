import { NextRequest, NextResponse } from 'next/server';
import { withCapability } from '@/lib/api/withAuth';
import {
  MAX_BCC_RECIPIENTS,
  NOTIFICATION_SETTINGS_KEY,
  normalizeBccRecipients,
  parseNotificationSettingsValue,
  readNotificationSettings,
} from '@/lib/notificationSettings';

export const dynamic = 'force-dynamic';

const NOTIFICATION_SETTINGS_CAPABILITY = 'notification_settings.manage' as const;
const MAX_BODY_BYTES = 16 * 1024;

function safeDatabaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const code = (error as Record<string, unknown>).code;
  return typeof code === 'string' && /^[A-Z][A-Z0-9_:-]{1,31}$/.test(code) ? code : undefined;
}

function privateJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

function invalidRecipientsResponse() {
  return privateJson(
    { success: false, error: { code: 'INVALID_BCC_RECIPIENTS', message: `BCC must contain at most ${MAX_BCC_RECIPIENTS} valid email addresses.` } },
    400,
  );
}

export const GET = withCapability(async (_request, { supabase }) => {
  const settings = await readNotificationSettings(supabase);
  if (settings.state === 'unavailable') {
    return privateJson(
      { success: false, error: { code: 'NOTIFICATION_SETTINGS_UNAVAILABLE', message: 'Notification settings are temporarily unavailable.' } },
      503,
    );
  }
  if (settings.state === 'invalid') {
    return privateJson(
      { success: false, error: { code: 'NOTIFICATION_SETTINGS_INVALID', message: 'Notification settings need repair before they can be edited.' } },
      500,
    );
  }

  return privateJson({
    success: true,
    data: {
      bccEnabled: settings.bccEnabled,
      bccRecipients: settings.bccRecipients,
      revision: settings.revision,
    },
  });
}, NOTIFICATION_SETTINGS_CAPABILITY);

export const PATCH = withCapability(async (request: NextRequest, { supabase }) => {
  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return privateJson({ success: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' } }, 413);
    }
    body = JSON.parse(rawBody);
  } catch {
    return privateJson({ success: false, error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } }, 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return privateJson({ success: false, error: { code: 'INVALID_BODY', message: 'Request body must be an object.' } }, 400);
  }

  const requested = body as Record<string, unknown>;
  if (typeof requested.bccEnabled !== 'boolean' || typeof requested.revision !== 'number' || !Number.isSafeInteger(requested.revision) || requested.revision < 0) {
    return privateJson({ success: false, error: { code: 'INVALID_SETTINGS', message: 'bccEnabled and revision are required.' } }, 400);
  }
  const normalized = normalizeBccRecipients(requested.bccRecipients);
  if (!normalized.ok) return invalidRecipientsResponse();

  const current = await readNotificationSettings(supabase);
  if (current.state === 'unavailable') {
    return privateJson(
      { success: false, error: { code: 'NOTIFICATION_SETTINGS_UNAVAILABLE', message: 'Notification settings are temporarily unavailable.' } },
      503,
    );
  }
  if (current.state === 'invalid') {
    return privateJson(
      { success: false, error: { code: 'NOTIFICATION_SETTINGS_INVALID', message: 'Notification settings need repair before they can be edited.' } },
      500,
    );
  }
  if (requested.revision !== current.revision) {
    return privateJson(
      { success: false, error: { code: 'REVISION_CONFLICT', message: 'Notification settings changed. Reload and try again.' } },
      409,
    );
  }

  const value = {
    bccEnabled: requested.bccEnabled,
    bccRecipients: normalized.recipients,
    revision: current.revision + 1,
  };
  const { error } = await supabase
    .from('SystemConfigs')
    .upsert({
      key: NOTIFICATION_SETTINGS_KEY,
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

  if (error) {
    console.error('[NotificationSettings] Configuration write failed', {
      code: safeDatabaseErrorCode(error),
    });
    return privateJson(
      { success: false, error: { code: 'NOTIFICATION_SETTINGS_WRITE_FAILED', message: 'Notification settings could not be saved.' } },
      500,
    );
  }

  // Keep this parser as the final shape check before returning the private result.
  const saved = parseNotificationSettingsValue(value);
  if (!saved.ok) {
    return privateJson(
      { success: false, error: { code: 'NOTIFICATION_SETTINGS_INVALID', message: 'Notification settings could not be normalized.' } },
      500,
    );
  }

  return privateJson({
    success: true,
    data: {
      bccEnabled: saved.bccEnabled,
      bccRecipients: saved.bccRecipients,
      revision: saved.revision,
    },
  });
}, NOTIFICATION_SETTINGS_CAPABILITY, { mutation: true });
