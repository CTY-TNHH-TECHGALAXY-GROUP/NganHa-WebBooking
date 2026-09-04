import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sendBookingConfirmationEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const targetEmail = url.searchParams.get('email');

  const envStatus = {
    SMTP_HOST: process.env.SMTP_HOST || '(not set, default: smtp.zoho.com)',
    SMTP_PORT: process.env.SMTP_PORT || '(not set, default: 465)',
    SMTP_USER_EXISTS: Boolean(process.env.SMTP_USER),
    SMTP_USER_VAL: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 4)}***` : '(missing)',
    SMTP_PASS_EXISTS: Boolean(process.env.SMTP_PASS),
    SMTP_PASS_LENGTH: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0,
    SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || '(not set)',
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || '(not set)',
    SMTP_REPLY_TO: process.env.SMTP_REPLY_TO || '(not set)',
    VERCEL_ENV: process.env.VERCEL_ENV || 'local',
    VERCEL_REGION: process.env.VERCEL_REGION || 'local',
  };

  let verifyResult: any = null;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.zoho.com',
        port: parseInt(process.env.SMTP_PORT || '465', 10),
        secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
        auth: { user, pass },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const startVerify = Date.now();
      await transporter.verify();
      verifyResult = { success: true, durationMs: Date.now() - startVerify };
    } catch (err: any) {
      verifyResult = {
        success: false,
        message: err.message,
        code: err.code,
        command: err.command,
      };
    }
  } else {
    verifyResult = { success: false, reason: 'SMTP_USER or SMTP_PASS missing' };
  }

  let sendResult: any = null;
  if (targetEmail) {
    const startSend = Date.now();
    try {
      sendResult = await sendBookingConfirmationEmail({
        bookingId: `TEST-DIAG-${Date.now().toString(36).toUpperCase()}`,
        customerName: 'Kiểm thử Chẩn đoán',
        customerEmail: targetEmail,
        customerPhone: '+84901234567',
        date: '2026-09-06',
        time: '10:00',
        guests: 1,
        branchName: 'ORIA SPA - 11 Ngô Đức Kế, Q.1',
        services: [
          {
            name: 'Liệu trình thư giãn chẩn đoán',
            duration: 60,
            priceVND: 690000,
            quantity: 1,
          },
        ],
        totalAmount: 690000,
        therapist: 'female',
        lang: 'vi',
        notes: 'Thư chẩn đoán kết nối SMTP Vercel',
      });
      sendResult.durationMs = Date.now() - startSend;
    } catch (err: any) {
      sendResult = {
        success: false,
        message: err.message,
        durationMs: Date.now() - startSend,
      };
    }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    envStatus,
    verifyResult,
    sendResult,
  });
}
