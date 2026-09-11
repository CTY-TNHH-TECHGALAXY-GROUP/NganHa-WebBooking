import assert from 'node:assert/strict';
const { generateBookingConfirmationHtml, sendBookingConfirmationEmail } = await import(
  new URL('../src/lib/mailer.ts', import.meta.url).href
);
const { normalizeBccRecipients, parseNotificationSettingsValue, readNotificationSettings } = await import(
  new URL('../src/lib/notificationSettings.ts', import.meta.url).href
);

type BookingEmailPayload = {
  bookingId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  date: string;
  time: string;
  guests?: number;
  branchName?: string;
  services: Array<{ name: string; duration: number; quantity?: number }>;
  totalAmount: number;
  lang?: string;
};

const payload: BookingEmailPayload = {
  bookingId: 'WB-07092026-001',
  customerName: 'Nguyen An',
  customerEmail: 'guest@booking.example.org',
  customerPhone: '+84 964 090 277',
  date: '2026-09-18',
  time: '14:00',
  guests: 1,
  branchName: 'ORIA SPA',
  services: [{ name: 'Massage', duration: 60, quantity: 1 }],
  totalAmount: 790000,
  lang: 'en',
};

type MailOptions = Record<string, unknown>;

function fakeTransporter(
  sent: MailOptions[],
  messageId: string,
  failure?: Record<string, unknown>,
  result?: Record<string, unknown>
) {
  return {
    async sendMail(mailOptions: MailOptions) {
      sent.push(mailOptions);
      if (failure) {
        throw Object.assign(new Error('sentinel raw SMTP error: password=secret-token'), failure);
      }
      return { messageId, accepted: [mailOptions.to], ...result };
    },
  };
}

function assertDiagnostics(result: any, expected: {
  success: boolean;
  outcome: string;
  stage: string;
  code: string;
  attempts: Array<{ attempt: number; stage: string; code: string }>;
}) {
  assert.equal(result.success, expected.success);
  assert.equal(result.diagnosticsVersion, 1);
  assert.equal(result.outcome, expected.outcome);
  assert.equal(result.stage, expected.stage);
  assert.equal(result.code, expected.code);
  assert.deepEqual(result.attempts, expected.attempts);
}

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

async function run() {
  const originalEnv = {
    receptionNotification: process.env.RECEPTION_NOTIFICATION_EMAIL,
    reception: process.env.RECEPTION_EMAIL,
    from: process.env.SMTP_FROM_EMAIL,
    replyTo: process.env.SMTP_REPLY_TO,
  };

  try {
    for (const [lang, pressure, medium, foot] of [
      ['vi', 'Lực massage', 'Vừa', 'Bàn chân'],
      ['en', 'Pressure', 'Medium', 'Feet'],
      ['cn', '按摩力度', '适中', '足部'],
      ['jp', 'マッサージの強さ', '普通', '足'],
      ['kr', '마사지 강도', '보통', '발'],
    ]) {
      const sent: MailOptions[] = [];
      await sendBookingConfirmationEmail({
        ...payload, lang,
        focusAreaNote: '[Massage]\nPressure: medium\nFocus: FOOT\nAvoid: THIGH\nPrivate Room\nPregnancy note\nAllergy or sensitive skin note\nMy own note <keep>',
      }, { createTransporter: () => fakeTransporter(sent, 'localized') as any });
      assert.equal(sent.length, 1);
      assert.ok(String(sent[0].text).includes(`${pressure}: ${medium}`));
      assert.ok(String(sent[0].html).includes(pressure));
      assert.ok(String(sent[0].html).includes(medium));
      assert.ok(String(sent[0].text).includes(foot));
      assert.ok(String(sent[0].html).includes('My own note &lt;keep&gt;'));
      assert.ok(String(sent[0].text).includes('My own note <keep>'));
      assert.ok(!String(sent[0].text).includes('Pressure: medium'));
    }
    const escapedHtml = generateBookingConfirmationHtml({
      ...payload,
      bookingId: 'WB-<script>alert(1)</script>',
      customerName: '<img src=x onerror=alert(1)>',
      customerPhone: '+84\"><svg/onload=alert(1)>',
      time: '<iframe src=javascript:alert(1)>',
      branchName: '<b>Branch</b>',
      therapist: '<i>Therapist</i>',
      services: [{ name: '<svg/onload=alert(1)>', duration: 60 }],
      notes: '<script>alert(1)</script>',
      focusAreaNote: '[<img src=x>]\nFocus: <svg/onload=alert(1)>',
    });

    assert(!escapedHtml.includes('<script>alert(1)</script>'));
    assert(!escapedHtml.includes('<svg/onload=alert(1)>'));
    assert(!escapedHtml.includes('<img src=x onerror=alert(1)>'));
    assert(escapedHtml.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert(escapedHtml.includes('&lt;svg/onload=alert(1)&gt;'));
    assert(escapedHtml.includes('href="tel:+84'));
    assert(!escapedHtml.includes('href="tel:+84"><'));

    setEnv('RECEPTION_NOTIFICATION_EMAIL', 'env-reception@booking.example.org');
    setEnv('RECEPTION_EMAIL', 'legacy-reception@booking.example.org');
    setEnv('SMTP_FROM_EMAIL', 'sender@booking.example.org');
    setEnv('SMTP_REPLY_TO', 'reply@booking.example.org');

    const payloadReceptionSent: MailOptions[] = [];
    const payloadReceptionResult = await sendBookingConfirmationEmail(
      { ...payload, customerEmail: null, receptionEmail: 'desk@booking.example.org' },
      { createTransporter: () => fakeTransporter(payloadReceptionSent, 'payload-reception') as any }
    );
    assert.equal(payloadReceptionResult.success, true);
    assert.equal(payloadReceptionSent[0].to, 'desk@booking.example.org');

    const envFallbackSent: MailOptions[] = [];
    await sendBookingConfirmationEmail(
      { ...payload, customerEmail: null, receptionEmail: 'not an email\nBcc: injected@example.org' },
      { createTransporter: () => fakeTransporter(envFallbackSent, 'env-fallback') as any }
    );
    assert.equal(envFallbackSent[0].to, 'env-reception@booking.example.org');

    setEnv('RECEPTION_NOTIFICATION_EMAIL', undefined);
    const legacyFallbackSent: MailOptions[] = [];
    await sendBookingConfirmationEmail(
      { ...payload, customerEmail: null, receptionEmail: 'bad-value' },
      { createTransporter: () => fakeTransporter(legacyFallbackSent, 'legacy-fallback') as any }
    );
    assert.equal(legacyFallbackSent[0].to, 'legacy-reception@booking.example.org');

    setEnv('RECEPTION_EMAIL', undefined);
    const defaultFallbackSent: MailOptions[] = [];
    await sendBookingConfirmationEmail(
      { ...payload, customerEmail: null, receptionEmail: 'bad-value' },
      { createTransporter: () => fakeTransporter(defaultFallbackSent, 'default-fallback') as any }
    );
    assert.equal(defaultFallbackSent[0].to, 'info@techgalaxygroup.com');

    const customerAndReceptionSent: MailOptions[] = [];
    await sendBookingConfirmationEmail(
      { ...payload, receptionEmail: 'desk@booking.example.org' },
      { createTransporter: () => fakeTransporter(customerAndReceptionSent, 'customer-and-reception') as any }
    );
    assert.equal(customerAndReceptionSent[0].to, payload.customerEmail);
    assert.equal(customerAndReceptionSent[0].bcc, 'desk@booking.example.org');

    const normalizedBcc = normalizeBccRecipients([
      ' Ops@booking.example.org ',
      'ops@booking.example.org',
      'guest@booking.example.org',
      'desk@booking.example.org',
      'second@booking.example.org',
      'second@booking.example.org',
    ]);
    assert.deepEqual(normalizedBcc, {
      ok: true,
      recipients: ['ops@booking.example.org', 'guest@booking.example.org', 'desk@booking.example.org', 'second@booking.example.org'],
    });
    assert.equal(normalizeBccRecipients([
      'one@booking.example.org',
      'two@booking.example.org',
      'three@booking.example.org',
      'four@booking.example.org',
      'five@booking.example.org',
      'six@booking.example.org',
    ]).ok, false);
    assert.equal(normalizeBccRecipients(['ok@booking.example.org\r\nBcc: injected@example.org']).ok, false);
    assert.deepEqual(parseNotificationSettingsValue({ bccEnabled: false, bccRecipients: ['OPS@booking.example.org'] }), {
      ok: true,
      bccEnabled: false,
      bccRecipients: ['ops@booking.example.org'],
      revision: 0,
    });

    const fakeSettingsReader = (result: { data: unknown; error?: unknown }) => ({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => result }),
        }),
      }),
    });
    const absentSettings = await readNotificationSettings(fakeSettingsReader({ data: null }));
    assert.deepEqual(absentSettings, { state: 'absent', bccEnabled: false, bccRecipients: [], revision: 0 });
    const unavailableSettings = await readNotificationSettings(fakeSettingsReader({ data: null, error: { code: '42P01' } }));
    assert.deepEqual(unavailableSettings, {
      state: 'unavailable',
      bccEnabled: false,
      bccRecipients: [],
      revision: 0,
      diagnostic: 'NOTIFICATION_SETTINGS_UNAVAILABLE',
    });

    const bccSent: MailOptions[] = [];
    const bccResult = await sendBookingConfirmationEmail(
      {
        ...payload,
        receptionEmail: 'desk@booking.example.org',
        bccRecipients: [' Ops@booking.example.org ', 'ops@booking.example.org', payload.customerEmail!, 'desk@booking.example.org', 'second@booking.example.org'],
      },
      {
        createTransporter: () => ({
          async sendMail(mailOptions: MailOptions) {
            bccSent.push(mailOptions);
            const bcc = Array.isArray(mailOptions.bcc) ? mailOptions.bcc : [mailOptions.bcc];
            return { messageId: 'bcc-happy', accepted: [mailOptions.to, ...bcc] };
          },
        }) as any,
      },
    );
    assert.equal(bccResult.success, true);
    assert.deepEqual(bccSent[0].bcc, ['desk@booking.example.org', 'ops@booking.example.org', 'second@booking.example.org']);
    assert.deepEqual(bccResult.bcc, {
      configuredCount: 3,
      acceptedCount: 3,
      rejectedCount: 0,
      unknownCount: 0,
      outcome: 'accepted',
      code: 'SMTP_ACCEPTED',
    });

    const bccPartialResult = await sendBookingConfirmationEmail(
      { ...payload, receptionEmail: 'desk@booking.example.org', bccRecipients: ['ops@booking.example.org', 'second@booking.example.org'] },
      {
        createTransporter: () => ({
          async sendMail(mailOptions: MailOptions) {
            const bcc = Array.isArray(mailOptions.bcc) ? mailOptions.bcc : [mailOptions.bcc];
            return { messageId: 'bcc-partial', accepted: [mailOptions.to, bcc[0], bcc[2]], rejected: [bcc[1]] };
          },
        }) as any,
      },
    );
    assert.equal(bccPartialResult.success, true);
    assert.equal(bccPartialResult.code, 'SMTP_ACCEPTED');
    assert.deepEqual(bccPartialResult.bcc, {
      configuredCount: 3,
      acceptedCount: 2,
      rejectedCount: 1,
      unknownCount: 0,
      outcome: 'failed',
      code: 'SMTP_RECIPIENT_REJECTED',
    });

    const invalidBccResult = await sendBookingConfirmationEmail(
      { ...payload, bccRecipients: ['valid@booking.example.org', 'bad-value\nBcc: injected@example.org'] },
      { createTransporter: () => fakeTransporter([], 'invalid-bcc') as any },
    );
    assert.equal(invalidBccResult.success, true);
    assert.equal(invalidBccResult.bccConfiguration, 'NOTIFICATION_SETTINGS_INVALID');

    const retryPorts: Array<number | undefined> = [];
    const retrySent: MailOptions[] = [];
    const retryResult = await sendBookingConfirmationEmail(
      { ...payload, receptionEmail: 'desk@booking.example.org' },
      {
          createTransporter: ((portOverride?: number) => {
            retryPorts.push(portOverride);
            return fakeTransporter(
              retrySent,
              portOverride === 587 ? 'retry-success' : 'unused',
              portOverride !== 587 ? { code: 'ECONNECTION', command: 'CONN' } : undefined
            ) as any;
          }) as any,
        }
      );
    assertDiagnostics(retryResult, {
      success: true,
      outcome: 'accepted',
      stage: 'smtp',
      code: 'SMTP_ACCEPTED',
      attempts: [
        { attempt: 1, stage: 'smtp', code: 'SMTP_CONNECTION_FAILED' },
        { attempt: 2, stage: 'smtp', code: 'SMTP_ACCEPTED' },
      ],
    });
    assert.equal(retryResult.messageId, 'retry-success');
    assert.deepEqual(retryPorts, [undefined, 587]);
    assert.equal(retrySent.length, 2);

    let syntheticFactoryCalls = 0;
    const syntheticResult = await sendBookingConfirmationEmail(
      { ...payload, customerEmail: 'synthetic@booking.test', receptionEmail: 'desk@booking.example.org' },
      {
        createTransporter: (() => {
          syntheticFactoryCalls += 1;
          return fakeTransporter([], 'must-not-send') as any;
        }) as any,
      }
    );
    assertDiagnostics(syntheticResult, {
      success: false,
      outcome: 'skipped',
      stage: 'preparation',
      code: 'EMAIL_TEST_SKIPPED',
      attempts: [],
    });
    assert.equal(syntheticResult.messageId, undefined);
    assert.equal(syntheticFactoryCalls, 0);

    assertDiagnostics(payloadReceptionResult, {
      success: true,
      outcome: 'accepted',
      stage: 'smtp',
      code: 'SMTP_ACCEPTED',
      attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_ACCEPTED' }],
    });

    const runSmtpFailure = async (failure: Record<string, unknown>) => {
      const sent: MailOptions[] = [];
      const result = await sendBookingConfirmationEmail(
        payload,
        { createTransporter: () => fakeTransporter(sent, 'must-not-be-used', failure) as any }
      );
      return { result, sent };
    };

    const authFailure = await runSmtpFailure({ code: 'EAUTH', command: 'AUTH', responseCode: 535 });
    assertDiagnostics(authFailure.result, {
      success: false,
      outcome: 'failed',
      stage: 'smtp',
      code: 'SMTP_AUTH_FAILED',
      attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_AUTH_FAILED' }],
    });

    const dnsFailure = await runSmtpFailure({ code: 'ENOTFOUND', command: 'CONN' });
    assertDiagnostics(dnsFailure.result, {
      success: false,
      outcome: 'failed',
      stage: 'smtp',
      code: 'SMTP_CONNECTION_FAILED',
      attempts: [
        { attempt: 1, stage: 'smtp', code: 'SMTP_CONNECTION_FAILED' },
        { attempt: 2, stage: 'smtp', code: 'SMTP_CONNECTION_FAILED' },
      ],
    });

    const tlsFailure = await runSmtpFailure({ code: 'ETLS', command: 'STARTTLS' });
    assertDiagnostics(tlsFailure.result, {
      success: false,
      outcome: 'failed',
      stage: 'smtp',
      code: 'SMTP_TLS_FAILED',
      attempts: [
        { attempt: 1, stage: 'smtp', code: 'SMTP_TLS_FAILED' },
        { attempt: 2, stage: 'smtp', code: 'SMTP_TLS_FAILED' },
      ],
    });

    const timeoutFailure = await runSmtpFailure({ code: 'ETIMEDOUT', command: 'DATA' });
    assertDiagnostics(timeoutFailure.result, {
      success: false,
      outcome: 'unknown',
      stage: 'smtp',
      code: 'SMTP_TIMEOUT',
      attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_TIMEOUT' }],
    });

    const preparationResult = await sendBookingConfirmationEmail(
      { ...payload, services: null as any },
      { createTransporter: () => fakeTransporter([], 'must-not-send') as any }
    );
    assertDiagnostics(preparationResult, {
      success: false,
      outcome: 'failed',
      stage: 'preparation',
      code: 'EMAIL_PREPARATION_FAILED',
      attempts: [],
    });

    const configurationResult = await sendBookingConfirmationEmail(
      payload,
      { createTransporter: () => null as any }
    );
    assertDiagnostics(configurationResult, {
      success: false,
      outcome: 'failed',
      stage: 'configuration',
      code: 'EMAIL_CONFIGURATION_UNAVAILABLE',
      attempts: [],
    });

    const messageIdOnlyResult = await sendBookingConfirmationEmail(
      payload,
      {
        createTransporter: () => fakeTransporter(
          [],
          'message-id-only',
          undefined,
          { accepted: undefined, rejected: undefined }
        ) as any,
      }
    );
    assertDiagnostics(messageIdOnlyResult, {
      success: false,
      outcome: 'unknown',
      stage: 'smtp',
      code: 'EMAIL_RESULT_UNKNOWN',
      attempts: [{ attempt: 1, stage: 'smtp', code: 'EMAIL_RESULT_UNKNOWN' }],
    });
    assert.equal(messageIdOnlyResult.messageId, 'message-id-only');

    const bccOnlySent: MailOptions[] = [];
    const bccOnlyResult = await sendBookingConfirmationEmail(
      { ...payload, receptionEmail: 'desk@booking.example.org' },
      {
        createTransporter: () => ({
          async sendMail(mailOptions: MailOptions) {
            bccOnlySent.push(mailOptions);
            return { messageId: 'bcc-only', accepted: [mailOptions.bcc], rejected: [] };
          },
        }) as any,
      }
    );
    assertDiagnostics(bccOnlyResult, {
      success: false,
      outcome: 'unknown',
      stage: 'smtp',
      code: 'EMAIL_RESULT_UNKNOWN',
      attempts: [{ attempt: 1, stage: 'smtp', code: 'EMAIL_RESULT_UNKNOWN' }],
    });
    assert.equal(bccOnlySent.length, 1);

    const rejectedCustomerResult = await sendBookingConfirmationEmail(
      { ...payload, receptionEmail: 'desk@booking.example.org' },
      {
        createTransporter: () => ({
          async sendMail(mailOptions: MailOptions) {
            return {
              messageId: 'customer-rejected',
              accepted: [mailOptions.bcc],
              rejected: [mailOptions.to],
            };
          },
        }) as any,
      }
    );
    assertDiagnostics(rejectedCustomerResult, {
      success: false,
      outcome: 'failed',
      stage: 'smtp',
      code: 'SMTP_RECIPIENT_REJECTED',
      attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_RECIPIENT_REJECTED' }],
    });

    const secret = 'smtp-secret-sentinel-token';
    const secretLogs: string[] = [];
    const originalWarn = console.warn;
    const originalError = console.error;
    console.warn = (...args: unknown[]) => secretLogs.push(JSON.stringify(args));
    console.error = (...args: unknown[]) => secretLogs.push(JSON.stringify(args));
    let secretResult;
    try {
      secretResult = await sendBookingConfirmationEmail(
        payload,
        {
          createTransporter: () => fakeTransporter([], 'unused', {
            code: 'EAUTH',
            command: 'AUTH',
            responseCode: 535,
            response: `server detail ${secret}`,
            host: `smtp.${secret}.example`,
            username: `user-${secret}`,
            token: secret,
          }) as any,
        }
      );
    } finally {
      console.warn = originalWarn;
      console.error = originalError;
    }
    assert(!JSON.stringify(secretResult).includes(secret));
    assert(!secretLogs.join('\n').includes(secret));

    console.log('PASS: mailer hardening assertions (safe diagnostics, recipient evidence, fallback, synthetic guard)');
  } finally {
    setEnv('RECEPTION_NOTIFICATION_EMAIL', originalEnv.receptionNotification);
    setEnv('RECEPTION_EMAIL', originalEnv.reception);
    setEnv('SMTP_FROM_EMAIL', originalEnv.from);
    setEnv('SMTP_REPLY_TO', originalEnv.replyTo);
  }
}

run().catch((error) => {
  console.error('FAIL: mailer hardening assertions');
  console.error(error);
  process.exitCode = 1;
});
