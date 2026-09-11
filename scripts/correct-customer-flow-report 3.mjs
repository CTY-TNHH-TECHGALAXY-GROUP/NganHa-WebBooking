import env from '@next/env';
import { readFile, writeFile } from 'node:fs/promises';
import nodemailer from 'nodemailer';
env.loadEnvConfig(process.cwd());
const root = 'plans/customer-flow-test-results';
const report = JSON.parse(await readFile(`${root}/results.json`, 'utf8'));
report.results.find(r => r.id === 'CF08').actual = {
  status: 200, expectedStatus: 400, testedSlot: '2099-09-08 08:30',
  unexpectedBookingCreated: true, bookingId: 'WB-08092099-53UPD855', bookingStatus: 'NEW',
  verifiedBy: 'Read-back of QA time validation / nghik22@gmail.com in configured DB',
  remainingSlots: 'NOT RUN: stopped immediately at first failed assertion',
  confirmationEmail: 'Not independently verified; check recipient inbox',
};
report.results.find(r => r.id === 'CF09').actual = {
  testedQuantity: 0, status: 200, expectedStatus: 400,
  remainingChecks: 'NOT RUN: negative/fractional/excess quantity and tampered price checks stopped after quantity zero failed',
};
report.results.find(r => r.id === 'CF07').actual.limitation = 'Combined invalid contact payload rejected; individual fields not independently tested.';
report.results.find(r => r.id === 'CF10').actual.reason = 'Local source dependencies absent in DB. Valid booking flow and idempotency not verified. Legacy live endpoint DID create the invalid-slot QA booking in CF08.';
report.results.find(r => r.id === 'CF10').actual.bookingCreated = 'No separate CF10 booking; CF08 unexpectedly created a NEW booking';
const text = '# CORRECTED: 10 customer flow tests\n\n' +
  'Correction to the previous QA report: CF08 returned HTTP 200 and actually created booking WB-08092099-53UPD855, status NEW, for 08:30 on 2099-09-08. The earlier statement that no booking was created was incorrect. This QA booking has not been deleted or changed.\n\n' +
  'Results: 6 PASS, 3 FAIL, 1 BLOCKED. These are live HTTP/API checks, not a complete browser E2E acceptance. CF06 confirms HTTP availability of five locale pages, not full translation quality.\n\n' +
  report.results.map(r => `## ${r.id} ${r.name}\n\n${r.status}\n\n${JSON.stringify(r.actual, null, 2)}\n`).join('\n') +
  '\nCatalog prices and shared schema were not changed. Booking confirmation email receipt is not verified. This message is the corrected test report.\n';
await writeFile(`${root}/results.json`, JSON.stringify(report, null, 2));
await writeFile(`${root}/REPORT.md`, text);
const port = Number(process.env.SMTP_PORT || 465);
const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.zoho.com', port, secure: port === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, connectionTimeout: 15000, socketTimeout: 20000 });
try {
  const info = await transport.sendMail({ from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER, to: 'nghik22@gmail.com',
    subject: '[QA CORRECTION] Oria Spa - live accepted an invalid booking time', text,
    attachments: [{ filename: 'CUSTOMER_FLOW_REPORT_CORRECTED.md', content: text }] });
  const receipt = { accepted: info.accepted, rejected: info.rejected, messageId: info.messageId };
  await writeFile(`${root}/email-correction-receipt.json`, JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt));
} finally { transport.close(); }
