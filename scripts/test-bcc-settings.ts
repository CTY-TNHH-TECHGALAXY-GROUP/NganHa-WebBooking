import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { normalizeBccRecipients, parseNotificationSettingsValue, readNotificationSettings, saveNotificationSettings } = await import(
  new URL('../src/lib/notificationSettings.ts', import.meta.url).href,
);
const { sendBookingConfirmationEmail } = await import(
  new URL('../src/lib/mailer.ts', import.meta.url).href,
);

type MailOptions = {
  to?: string;
  bcc?: string | string[];
  [key: string]: unknown;
};

const basePayload = {
  bookingId: 'WB-BCC-TEST-001',
  customerName: 'BCC Test Guest',
  customerEmail: 'customer@booking.example.org',
  customerPhone: '+84964090277',
  date: '2099-09-18',
  time: '14:00',
  services: [{ name: 'Massage', duration: 60 }],
  totalAmount: 790000,
  lang: 'en',
};

function addresses(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function fakeTransport(sent: MailOptions[], rejected: string[] = []) {
  return {
    async sendMail(options: MailOptions) {
      sent.push(options);
      const allRecipients = [options.to, ...addresses(options.bcc)].filter((item): item is string => Boolean(item));
      return {
        messageId: '<bcc-test@mock.invalid>',
        accepted: allRecipients.filter(recipient => !rejected.includes(recipient)),
        rejected,
      };
    },
  };
}

function fakeSettingsClient(result: unknown) {
  const builder = {
    select() { return builder; },
    eq() { return builder; },
    maybeSingle() { return Promise.resolve(result); },
  };
  return { from() { return builder; } };
}

function fakeConditionalSettingsClient(initialValue: Record<string, unknown> | null) {
  let storedValue = initialValue;
  const writes: string[] = [];

  const readBuilder = {
    select() { return readBuilder; },
    eq() { return readBuilder; },
    maybeSingle() {
      return Promise.resolve({
        data: storedValue ? { value: storedValue } : null,
        error: null,
      });
    },
  };

  const client = {
    from() {
      return {
        select() { return readBuilder; },
        update(next: { value: Record<string, unknown> }) {
          let revision: string | null = null;
          let allowMissingRevision = false;
          const builder = {
            eq(column: string, value: string) {
              if (column === 'value->>revision') revision = value;
              return builder;
            },
            or(filters: string) {
              allowMissingRevision = filters.includes('value->>revision.is.null');
              if (filters.includes('value->>revision.eq.0')) revision = '0';
              return builder;
            },
            select() {
              return {
                maybeSingle: async () => {
                  const currentRevision = storedValue?.revision;
                  const matches = storedValue !== null
                    && ((revision === '0' && allowMissingRevision && currentRevision === undefined)
                      || String(currentRevision) === revision);
                  if (!matches) return { data: null, error: null };
                  storedValue = next.value;
                  writes.push('update');
                  return { data: { value: storedValue }, error: null };
                },
              };
            },
          };
          return builder;
        },
        insert(next: { value: Record<string, unknown> }) {
          return {
            select() {
              return {
                maybeSingle: async () => {
                  if (storedValue !== null) return { data: null, error: { code: '23505' } };
                  storedValue = next.value;
                  writes.push('insert');
                  return { data: { value: storedValue }, error: null };
                },
              };
            },
          };
        },
      };
    },
  };

  return { client, writes, getValue: () => storedValue };
}

async function send(overrides: Record<string, unknown> = {}, rejected: string[] = []) {
  const sent: MailOptions[] = [];
  const result = await sendBookingConfirmationEmail(
    { ...basePayload, receptionEmail: 'reception@oria.example.org', ...overrides } as any,
    { createTransporter: () => fakeTransport(sent, rejected) as any },
  );
  assert.equal(sent.length, 1, 'test must use exactly one mocked SMTP attempt');
  return { result, mail: sent[0] };
}

async function run() {
  const five = normalizeBccRecipients([
    'one@oria.example.org',
    'two@oria.example.org',
    'three@oria.example.org',
    'four@oria.example.org',
    'five@oria.example.org',
  ]);
  assert.deepEqual(five, {
    ok: true,
    recipients: [
      'one@oria.example.org',
      'two@oria.example.org',
      'three@oria.example.org',
      'four@oria.example.org',
      'five@oria.example.org',
    ],
  });
  assert.equal(normalizeBccRecipients([...(five.ok ? five.recipients : []), 'six@oria.example.org']).ok, false, 'six recipients must be rejected');
  assert.deepEqual(parseNotificationSettingsValue({ bccEnabled: false, bccRecipients: [], revision: 4 }), {
    ok: true,
    bccEnabled: false,
    bccRecipients: [],
    revision: 4,
  });
  assert.deepEqual(await readNotificationSettings(fakeSettingsClient({ data: null, error: null })), {
    state: 'absent', bccEnabled: false, bccRecipients: [], revision: 0,
  });
  assert.deepEqual(await readNotificationSettings(fakeSettingsClient({
    data: { value: { bccEnabled: false, bccRecipients: ['copy@oria.example.org'], revision: 2 } },
    error: null,
  })), {
    state: 'disabled', bccEnabled: false, bccRecipients: ['copy@oria.example.org'], revision: 2,
  });
  assert.equal((await readNotificationSettings(fakeSettingsClient({ data: null, error: { code: 'PGRST205' } }))).state, 'unavailable');

  const initialRace = fakeConditionalSettingsClient(null);
  const initialResults = await Promise.all([
    saveNotificationSettings(initialRace.client, {
      bccEnabled: true,
      bccRecipients: ['one@oria.example.org'],
      expectedRevision: 0,
    }),
    saveNotificationSettings(initialRace.client, {
      bccEnabled: false,
      bccRecipients: ['two@oria.example.org'],
      expectedRevision: 0,
    }),
  ]);
  assert.deepEqual(initialResults.map((result) => result.state).sort(), ['conflict', 'saved']);
  assert.deepEqual(initialRace.writes, ['insert'], 'first-time creation must have one atomic winner');
  assert.equal(initialRace.getValue()?.revision, 1);

  const revisionRace = fakeConditionalSettingsClient({
    bccEnabled: false,
    bccRecipients: ['old@oria.example.org'],
    revision: 4,
  });
  const revisionResults = await Promise.all([
    saveNotificationSettings(revisionRace.client, {
      bccEnabled: true,
      bccRecipients: ['one@oria.example.org'],
      expectedRevision: 4,
    }),
    saveNotificationSettings(revisionRace.client, {
      bccEnabled: true,
      bccRecipients: ['two@oria.example.org'],
      expectedRevision: 4,
    }),
  ]);
  assert.deepEqual(revisionResults.map((result) => result.state).sort(), ['conflict', 'saved']);
  assert.deepEqual(revisionRace.writes, ['update'], 'same-revision writes must have one atomic winner');
  assert.equal(revisionRace.getValue()?.revision, 5);

  const happy = await send({
    bccRecipients: ['one@oria.example.org', 'two@oria.example.org'],
  });
  assert.equal(happy.result.success, true);
  assert.deepEqual(addresses(happy.mail.bcc), [
    'reception@oria.example.org',
    'one@oria.example.org',
    'two@oria.example.org',
  ]);
  assert.deepEqual(happy.result.bcc, {
    configuredCount: 3,
    acceptedCount: 3,
    rejectedCount: 0,
    unknownCount: 0,
    outcome: 'accepted',
    code: 'SMTP_ACCEPTED',
  });

  const duplicateAndExcluded = await send({
    bccRecipients: [
      'CUSTOMER@BOOKING.EXAMPLE.ORG',
      'RECEPTION@ORIA.EXAMPLE.ORG',
      'valid@oria.example.org',
      'VALID@ORIA.EXAMPLE.ORG',
    ],
  });
  assert.deepEqual(addresses(duplicateAndExcluded.mail.bcc), [
    'reception@oria.example.org',
    'valid@oria.example.org',
  ], 'customer, reception and duplicate addresses must be excluded');
  assert.equal(duplicateAndExcluded.result.bcc?.configuredCount, 2);

  const invalid = await send({
    bccRecipients: ['safe@oria.example.org', 'attacker@oria.example.org\r\nBcc: injected@example.org'],
  });
  assert.equal(invalid.result.success, true, 'invalid BCC config must not affect customer acceptance');
  assert.equal(invalid.result.bccConfiguration, 'NOTIFICATION_SETTINGS_INVALID');
  assert.deepEqual(addresses(invalid.mail.bcc), ['reception@oria.example.org']);
  assert.equal(JSON.stringify(invalid.mail).includes('injected@example.org'), false, 'header injection must not reach mail options');
  assert.equal(normalizeBccRecipients(['bad\r\nBcc: injected@example.org']).ok, false);
  assert.equal(normalizeBccRecipients(['malformed-address']).ok, false);

  const bccRejected = await send(
    { bccRecipients: ['copy@oria.example.org'] },
    ['copy@oria.example.org'],
  );
  assert.equal(bccRejected.result.success, true, 'BCC rejection must not change customer acceptance');
  assert.equal(bccRejected.result.bcc?.outcome, 'failed');
  assert.equal(bccRejected.result.bcc?.rejectedCount, 1);

  const maxRejected = await send({
    bccRecipients: [
      'one@oria.example.org',
      'two@oria.example.org',
      'three@oria.example.org',
      'four@oria.example.org',
      'five@oria.example.org',
      'six@oria.example.org',
    ],
  });
  assert.equal(maxRejected.result.success, true);
  assert.equal(maxRejected.result.bccConfiguration, 'NOTIFICATION_SETTINGS_INVALID');
  assert.deepEqual(addresses(maxRejected.mail.bcc), ['reception@oria.example.org']);

  const backwardCompatible = await send();
  assert.equal(backwardCompatible.mail.to, basePayload.customerEmail);
  assert.equal(backwardCompatible.mail.bcc, 'reception@oria.example.org', 'legacy reception BCC shape must remain unchanged');
  assert.equal('bccConfiguration' in backwardCompatible.result, false);

  const receptionOnly = await send({ customerEmail: null, bccRecipients: ['copy@oria.example.org'] });
  assert.equal(receptionOnly.mail.to, 'reception@oria.example.org');
  assert.deepEqual(addresses(receptionOnly.mail.bcc), ['copy@oria.example.org']);

  const bookingRoute = readFileSync(new URL('../src/app/api/bookings/route.ts', import.meta.url), 'utf8');
  const settingsRoute = readFileSync(new URL('../src/app/api/admin/notification-settings/route.ts', import.meta.url), 'utf8');
  const publicRoute = readFileSync(new URL('../src/app/api/public/site-content/route.ts', import.meta.url), 'utf8');
  assert.match(bookingRoute, /readNotificationSettings\(supabase\)/);
  assert.match(bookingRoute, /bccRecipients/);
  assert.match(settingsRoute, /withCapability\(/);
  assert.match(settingsRoute, /notification_settings\.manage/);
  assert.doesNotMatch(publicRoute, /notification_settings/);

  console.log('PASS: BCC normalization, envelope routing, exclusions, diagnostics, privacy and compatibility');
}

run().catch(error => {
  console.error('FAIL: BCC settings assertions');
  console.error(error);
  process.exitCode = 1;
});
