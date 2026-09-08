import assert from 'node:assert/strict';
const { generateBookingConfirmationHtml, sendBookingConfirmationEmail } = await import(
  new URL('../src/lib/mailer.ts', import.meta.url).href
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
  shouldFail = false
) {
  return {
    async sendMail(mailOptions: MailOptions) {
      sent.push(mailOptions);
      if (shouldFail) throw new Error('primary transport unavailable');
      return { messageId };
    },
  };
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

    const retryPorts: Array<number | undefined> = [];
    const retrySent: MailOptions[] = [];
    const retryResult = await sendBookingConfirmationEmail(
      { ...payload, receptionEmail: 'desk@booking.example.org' },
      {
        createTransporter: ((portOverride?: number) => {
          retryPorts.push(portOverride);
          return fakeTransporter(retrySent, portOverride === 587 ? 'retry-success' : 'unused', portOverride !== 587) as any;
        }) as any,
      }
    );
    assert.equal(retryResult.success, true);
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
    assert.equal(syntheticResult.success, true);
    assert.equal(syntheticFactoryCalls, 0);

    console.log('PASS: mailer hardening assertions (HTML escaping, recipients, fallback, retry, synthetic guard)');
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
