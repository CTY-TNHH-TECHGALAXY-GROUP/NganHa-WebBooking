// src/lib/mailer.ts - Oria Spa Booking Received (Auto-confirmation) Email Service
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export interface BookingEmailServiceItem {
  name?: string;
  duration?: number | string;
  priceVND?: number;
  quantity?: number;
  options?: any;
}

export interface BookingEmailPayload {
  bookingId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  date: string;
  time: string;
  guests?: number;
  branchName?: string;
  services: BookingEmailServiceItem[];
  totalAmount: number;
  therapist?: string;
  lang?: string;
  notes?: string;
  focusAreaNote?: string;
  receptionEmail?: string;
  /** Additional private copies configured by the authenticated admin settings flow. */
  bccRecipients?: string[];
  /** Read diagnostics from the private notification settings loader. */
  bccConfiguration?: 'NOTIFICATION_SETTINGS_UNAVAILABLE' | 'NOTIFICATION_SETTINGS_INVALID';
}

export interface BookingEmailSendOptions {
  /** Test-only seam for exercising delivery behavior without opening SMTP connections. */
  createTransporter?: typeof getTransporter;
}

export type BookingEmailOutcome = 'accepted' | 'failed' | 'unknown' | 'skipped';
export type BookingEmailStage = 'preparation' | 'configuration' | 'smtp' | 'unknown';
export type BookingEmailDiagnosticCode =
  | 'SMTP_ACCEPTED'
  | 'EMAIL_PREPARATION_FAILED'
  | 'EMAIL_CONFIGURATION_UNAVAILABLE'
  | 'EMAIL_RECIPIENT_INVALID'
  | 'EMAIL_TEST_SKIPPED'
  | 'SMTP_AUTH_FAILED'
  | 'SMTP_CONNECTION_FAILED'
  | 'SMTP_TLS_FAILED'
  | 'SMTP_TIMEOUT'
  | 'SMTP_RECIPIENT_REJECTED'
  | 'SMTP_DELIVERY_UNKNOWN'
  | 'EMAIL_SEND_FAILED'
  | 'EMAIL_RESULT_UNKNOWN'
  | 'EMAIL_REPLAY_NOT_ATTEMPTED';

export interface BookingEmailAttempt {
  attempt: number;
  stage: 'smtp';
  code: BookingEmailDiagnosticCode;
}

export interface BookingEmailBccDiagnostics {
  configuredCount: number;
  acceptedCount: number;
  rejectedCount: number;
  unknownCount: number;
  outcome: 'accepted' | 'failed' | 'unknown';
  code: BookingEmailDiagnosticCode;
}

export interface BookingEmailResult {
  /** Legacy caller field. True only when the intended recipient has accepted evidence. */
  success: boolean;
  /** Legacy caller field. A message id is not delivery or inbox evidence. */
  messageId?: string;
  diagnosticsVersion: 1;
  outcome: BookingEmailOutcome;
  stage: BookingEmailStage;
  code: BookingEmailDiagnosticCode;
  attempts: BookingEmailAttempt[];
  /** Preserved fixed strings used by older callers for local preparation/configuration failures. */
  reason?: 'No recipient email' | 'Transporter not configured';
  /** Preserved fixed string used by older callers for an unclassified send failure. */
  error?: 'Notification delivery failed.';
  /** Safe counts only. Recipient addresses never cross this boundary. */
  bcc?: BookingEmailBccDiagnostics;
  bccConfiguration?: 'NOTIFICATION_SETTINGS_UNAVAILABLE' | 'NOTIFICATION_SETTINGS_INVALID';
}

const I18N_TEMPLATE_1: Record<string, {
  subject: string;
  greeting: (name: string) => string;
  thankYou: string;
  heading: string;
  customerLabel: string;
  phoneLabel: string;
  serviceLabel: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  durationFormat: (minutes: number) => string;
  guestsLabel: string;
  guestsSuffix: (n: number) => string;
  therapistLabel: string;
  therapistMap: Record<string, string>;
  locationLabel: string;
  bookingCodeLabel: string;
  totalLabel: string;
  preferencesLabel: string;
  notesLabel: string;
  followUp: string;
  questions: (phone: string) => string;
  signoffGreeting: string;
  signoffTeam: string;
}> = {
  en: {
    subject: "We've received your booking request — Oria Spa",
    greeting: (name) => `Hi ${name},`,
    thankYou: "Thank you for booking with Oria Spa! We've received your request and our team is reviewing it now.",
    heading: "Your requested booking:",
    customerLabel: "Guest Name",
    phoneLabel: "Phone Number",
    serviceLabel: "Service",
    dateLabel: "Date",
    timeLabel: "Time",
    durationLabel: "Duration",
    durationFormat: (m) => `${m} mins`,
    guestsLabel: "Number of Guests",
    guestsSuffix: (n) => `${n} guest${n > 1 ? 's' : ''}`,
    therapistLabel: "Therapist",
    therapistMap: { female: 'Female', male: 'Male', random: 'Random', any: 'Random' },
    locationLabel: "Location",
    bookingCodeLabel: "Booking Code",
    totalLabel: "Estimated Total",
    preferencesLabel: "Service Preferences & Notes",
    notesLabel: "Special Requests / Notes",
    followUp: "You'll receive a confirmation email shortly once we've secured your appointment. If we need to adjust anything, we'll be in touch.",
    questions: (phone) => `Questions in the meantime? Just reply to this email or call us at ${phone}.`,
    signoffGreeting: "Warmly,",
    signoffTeam: "The Oria Spa Team",
  },
  vi: {
    subject: "Chúng tôi đã nhận được yêu cầu đặt lịch của bạn — Oria Spa",
    greeting: (name) => `Xin chào ${name},`,
    thankYou: "Cảm ơn bạn đã đặt lịch tại Oria Spa! Chúng tôi đã nhận được yêu cầu của bạn và đội ngũ Oria Spa đang tiến hành xử lý.",
    heading: "Thông tin yêu cầu đặt lịch của bạn:",
    customerLabel: "Khách hàng",
    phoneLabel: "Số điện thoại",
    serviceLabel: "Dịch vụ",
    dateLabel: "Ngày hẹn",
    timeLabel: "Giờ hẹn",
    durationLabel: "Thời lượng",
    durationFormat: (m) => `${m} phút`,
    guestsLabel: "Số lượng khách",
    guestsSuffix: (n) => `${n} khách`,
    therapistLabel: "Kỹ thuật viên",
    therapistMap: { female: 'Nữ', male: 'Nam', random: 'Ngẫu nhiên', any: 'Ngẫu nhiên' },
    locationLabel: "Chi nhánh",
    bookingCodeLabel: "Mã đặt lịch",
    totalLabel: "Tổng thanh toán dự kiến",
    preferencesLabel: "Yêu cầu & Lưu ý dịch vụ",
    notesLabel: "Ghi chú của khách hàng",
    followUp: "Bạn sẽ nhận được email xác nhận chính thức ngay sau khi lịch hẹn được sắp xếp hoàn tất. Nếu cần điều chỉnh bất kỳ điều gì, chúng tôi sẽ chủ động liên hệ với bạn.",
    questions: (phone) => `Trong thời gian chờ đợi, nếu có bất kỳ thắc mắc nào, bạn chỉ cần phản hồi email này hoặc gọi cho chúng tôi qua số ${phone}.`,
    signoffGreeting: "Thân ái,",
    signoffTeam: "Đội ngũ Oria Spa",
  },
  cn: {
    subject: "我们已收到您的预约申请 — Oria Spa",
    greeting: (name) => `尊敬的 ${name} 贵宾：`,
    thankYou: "感谢您选择 Oria Spa！我们已收到您的预约申请，水疗团队目前正在核对档期并为您妥善安排。",
    heading: "您的预约申请详情：",
    customerLabel: "贵宾姓名",
    phoneLabel: "联系电话",
    serviceLabel: "服务项目",
    dateLabel: "预约日期",
    timeLabel: "预约时间",
    durationLabel: "服务时长",
    durationFormat: (m) => `${m} 分钟`,
    guestsLabel: "预约人数",
    guestsSuffix: (n) => `${n} 位`,
    therapistLabel: "理疗师",
    therapistMap: { female: '女', male: '男', random: '随机', any: '随机' },
    locationLabel: "水疗中心地址",
    bookingCodeLabel: "预约编号",
    totalLabel: "预计总额",
    preferencesLabel: "服务偏好与特别要求",
    notesLabel: "客户特别备注",
    followUp: "预约确认后，我们将在第一时间向您发送正式确认邮件。如需对时间或项目进行微调，我们将主动与您取得联系。",
    questions: (phone) => `在此期间如有任何疑问或需要协助，欢迎直接回复此邮件，或致电联系我们：${phone}。`,
    signoffGreeting: "顺祝 雅安，",
    signoffTeam: "Oria Spa 贵宾服务团队 敬上",
  },
  jp: {
    subject: "【Oria Spa】ご予約リクエストを承りました",
    greeting: (name) => `${name} 様`,
    thankYou: "この度は Oria Spa をご利用いただき、誠にありがとうございます。お客様のご予約リクエストを承りました。現在、担当スタッフが空き状況と施術スケジュールを確認しております。",
    heading: "ご予約リクエスト内容：",
    customerLabel: "お客様氏名",
    phoneLabel: "お電話番号",
    serviceLabel: "施術コース",
    dateLabel: "ご来店日",
    timeLabel: "ご来店時間",
    durationLabel: "所要時間",
    durationFormat: (m) => `${m} 分`,
    guestsLabel: "ご利用人数",
    guestsSuffix: (n) => `${n} 名様`,
    therapistLabel: "担当セラピスト",
    therapistMap: { female: '女性', male: '男性', random: 'お任せ', any: 'お任せ' },
    locationLabel: "店舗所在地",
    bookingCodeLabel: "ご予約番号",
    totalLabel: "お支払い概算",
    preferencesLabel: "サービスのご要望・特記事項",
    notesLabel: "お客様からのご要望・メモ",
    followUp: "ご予約枠が確定いたしましたら、改めて正式な「ご予約確定メール」をお送りいたします。万が一、日時の調整が必要な場合には、担当スタッフより速やかにご連絡申し上げます。",
    questions: (phone) => `ご不明な点やご相談がございましたら、本メールにご返信いただくか、お電話（${phone}）にてお気軽にお問い合わせください。`,
    signoffGreeting: "心よりお待ち申し上げております。",
    signoffTeam: "Oria Spa スタッフ一同",
  },
  kr: {
    subject: "[Oria Spa] 예약 요청이 정상적으로 접수되었습니다",
    greeting: (name) => `${name} 고객님,`,
    thankYou: "Oria Spa를 찾아주셔서 진심으로 감사드립니다. 고객님의 예약 요청이 정상적으로 접수되었으며, 현재 전담 팀에서 스케줄을 확인하고 있습니다.",
    heading: "요청하신 예약 상세 내역:",
    customerLabel: "고객 성함",
    phoneLabel: "연락처",
    serviceLabel: "예약 프로그램",
    dateLabel: "예약 일자",
    timeLabel: "예약 시간",
    durationLabel: "소요 시간",
    durationFormat: (m) => `${m} 분`,
    guestsLabel: "방문 인원",
    guestsSuffix: (n) => `${n} 인`,
    therapistLabel: "테라피스트",
    therapistMap: { female: '여성', male: '남성', random: '랜덤', any: '랜덤' },
    locationLabel: "지점 위치",
    bookingCodeLabel: "예약 번호",
    totalLabel: "예상 결제 금액",
    preferencesLabel: "서비스 요청 및 참고 사항",
    notesLabel: "고객 요청 메모",
    followUp: "예약 일정이 확정되는 즉시 공식 확정 안내 이메일을 발송해 드리겠습니다. 일정 조정이 필요한 경우 사전에 미리 연락드리겠습니다.",
    questions: (phone) => `문의 사항이 있으실 경우, 본 이메일에 답장해 주시거나 ${phone} 번으로 편하게 연락해 주시기 바랍니다.`,
    signoffGreeting: "감사합니다.",
    signoffTeam: "Oria Spa 팀 드림",
  },
};

let cachedTransporter: any = null;
let cachedKey = '';

function getTransporter(portOverride?: number) {
  const host = process.env.SMTP_HOST || 'smtp.zoho.com';
  const port = portOverride || parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[Mailer] Missing SMTP_USER or SMTP_PASS in environment variables.');
    return null;
  }

  const key = `${host}:${port}:${user}:${secure}`;
  if (!portOverride && cachedTransporter && cachedKey === key) {
    return cachedTransporter;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 8000,
    greetingTimeout: 6000,
    socketTimeout: 10000,
  });

  if (!portOverride) {
    cachedTransporter = transporter;
    cachedKey = key;
  }

  return transporter;
}

function safeSmtpErrorDetails(error: unknown): Record<string, string | number> {
  if (!error || typeof error !== 'object') return {};
  const value = error as Record<string, unknown>;
  const details: Record<string, string | number> = {};
  if (typeof value.code === 'string' && /^[A-Z][A-Z0-9_:-]{1,31}$/.test(value.code)) details.code = value.code;
  if (typeof value.command === 'string' && /^(CONN|AUTH|MAIL|RCPT|DATA|STARTTLS)$/i.test(value.command)) details.command = value.command.toUpperCase();
  if (typeof value.responseCode === 'number' && Number.isInteger(value.responseCode) && value.responseCode >= 100 && value.responseCode <= 599) details.responseCode = value.responseCode;
  return details;
}

type SmtpFailureClassification = Pick<BookingEmailResult, 'code' | 'outcome'>;
type SendInfoClassification = Pick<BookingEmailResult, 'code' | 'outcome'> & { success: boolean };

function classifySmtpError(error: unknown): SmtpFailureClassification {
  if (!error || typeof error !== 'object') {
    return { outcome: 'unknown', code: 'SMTP_DELIVERY_UNKNOWN' };
  }

  const value = error as Record<string, unknown>;
  const errorCode = typeof value.code === 'string' ? value.code.toUpperCase() : '';
  const command = typeof value.command === 'string' ? value.command.toUpperCase() : '';
  const responseCode = typeof value.responseCode === 'number' ? value.responseCode : undefined;

  if (command === 'AUTH' || errorCode === 'EAUTH' || responseCode === 534 || responseCode === 535) {
    return { outcome: 'failed', code: 'SMTP_AUTH_FAILED' };
  }

  if (
    command === 'STARTTLS' ||
    errorCode === 'ETLS' ||
    errorCode === 'TLS' ||
    errorCode.startsWith('ERR_TLS')
  ) {
    return { outcome: 'failed', code: 'SMTP_TLS_FAILED' };
  }

  if (errorCode === 'ETIMEDOUT' || errorCode === 'ETIME' || errorCode === 'ESOCKETTIMEDOUT') {
    return { outcome: 'unknown', code: 'SMTP_TIMEOUT' };
  }

  // Once DATA has started, a transport error cannot prove whether the server
  // accepted the message. Keep it unknown and never retry it blindly.
  if (command === 'DATA') {
    return { outcome: 'unknown', code: 'SMTP_DELIVERY_UNKNOWN' };
  }

  if (command === 'RCPT' || errorCode === 'EENVELOPE') {
    return { outcome: 'failed', code: 'SMTP_RECIPIENT_REJECTED' };
  }

  if (
    command === 'CONN' ||
    errorCode === 'ENOTFOUND' ||
    errorCode === 'EAI_AGAIN' ||
    errorCode === 'ECONNECTION' ||
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ECONNRESET' ||
    errorCode === 'ESOCKET' ||
    errorCode === 'EHOSTUNREACH' ||
    errorCode === 'ENETUNREACH'
  ) {
    return { outcome: 'failed', code: 'SMTP_CONNECTION_FAILED' };
  }

  return { outcome: 'unknown', code: 'SMTP_DELIVERY_UNKNOWN' };
}

function canRetryWithFallback(error: unknown): boolean {
  const classification = classifySmtpError(error);
  if (classification.code === 'SMTP_TLS_FAILED') {
    return Boolean(error && typeof error === 'object' && (error as Record<string, unknown>).command === 'STARTTLS');
  }
  if (classification.code !== 'SMTP_CONNECTION_FAILED' || !error || typeof error !== 'object') return false;

  const value = error as Record<string, unknown>;
  const errorCode = typeof value.code === 'string' ? value.code.toUpperCase() : '';
  const command = typeof value.command === 'string' ? value.command.toUpperCase() : '';
  return command === 'CONN' || errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN' || errorCode === 'ECONNREFUSED';
}

function getMessageId(info: unknown): string | undefined {
  if (!info || typeof info !== 'object') return undefined;
  const messageId = (info as Record<string, unknown>).messageId;
  return typeof messageId === 'string' && messageId ? messageId : undefined;
}

function getRecipientAddress(value: unknown): string | null {
  if (typeof value === 'string') return normalizeEmailRecipient(value);
  if (!value || typeof value !== 'object') return null;
  return normalizeEmailRecipient((value as Record<string, unknown>).address);
}

function recipientWasListed(info: unknown, field: 'accepted' | 'rejected', recipient: string): boolean {
  if (!info || typeof info !== 'object') return false;
  const values = (info as Record<string, unknown>)[field];
  if (!Array.isArray(values)) return false;

  const normalizedRecipient = recipient.toLowerCase();
  return values.some((value) => getRecipientAddress(value)?.toLowerCase() === normalizedRecipient);
}

function classifySendInfo(info: unknown, expectedRecipient: string): SendInfoClassification {
  if (recipientWasListed(info, 'accepted', expectedRecipient)) {
    return { success: true, outcome: 'accepted', code: 'SMTP_ACCEPTED' };
  }

  if (recipientWasListed(info, 'rejected', expectedRecipient)) {
    return { success: false, outcome: 'failed', code: 'SMTP_RECIPIENT_REJECTED' };
  }

  // A message id or acceptance of only BCC/reception recipients is not customer delivery evidence.
  return { success: false, outcome: 'unknown', code: 'EMAIL_RESULT_UNKNOWN' };
}

function makeBookingEmailResult(
  result: Omit<BookingEmailResult, 'diagnosticsVersion'>
): BookingEmailResult {
  return { diagnosticsVersion: 1, ...result };
}

const DEFAULT_RECEPTION_EMAIL = 'info@techgalaxygroup.com';

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] || character);
}

function sanitizeHeaderText(value: unknown): string {
  return String(value ?? '').replace(/[\r\n\0]/g, ' ').trim();
}

function normalizeEmailRecipient(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const email = value.trim();
  if (!email || /[\r\n\0]/.test(email)) return null;

  // A single mailbox only: no display names, recipient lists, or header injection.
  return /^[^\s@<>,;:]+@[^\s@<>,;:]+\.[^\s@<>,;:]+$/.test(email) ? email : null;
}

const MAX_BCC_RECIPIENTS = 5;

function normalizeConfiguredBccRecipients(value: unknown): {
  recipients: string[];
  invalid: boolean;
} {
  if (value === undefined) return { recipients: [], invalid: false };
  if (!Array.isArray(value)) {
    return { recipients: [], invalid: true };
  }

  const recipients: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') return { recipients: [], invalid: true };
    const normalized = normalizeEmailRecipient(item);
    if (!normalized || normalized.length > 254) return { recipients: [], invalid: true };
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      recipients.push(key);
    }
  }
  if (recipients.length > MAX_BCC_RECIPIENTS) return { recipients: [], invalid: true };
  return { recipients, invalid: false };
}

function resolveReceptionEmail(value: unknown): string | null {
  return (
    normalizeEmailRecipient(value) ||
    normalizeEmailRecipient(process.env.RECEPTION_NOTIFICATION_EMAIL) ||
    normalizeEmailRecipient(process.env.RECEPTION_EMAIL) ||
    DEFAULT_RECEPTION_EMAIL
  );
}

function classifyBccSendInfo(info: unknown, recipients: string[]): BookingEmailBccDiagnostics | undefined {
  if (recipients.length === 0) return undefined;

  let acceptedCount = 0;
  let rejectedCount = 0;
  let unknownCount = 0;
  for (const recipient of recipients) {
    if (recipientWasListed(info, 'accepted', recipient)) acceptedCount += 1;
    else if (recipientWasListed(info, 'rejected', recipient)) rejectedCount += 1;
    else unknownCount += 1;
  }

  const outcome = rejectedCount > 0 ? 'failed' : unknownCount > 0 ? 'unknown' : 'accepted';
  return {
    configuredCount: recipients.length,
    acceptedCount,
    rejectedCount,
    unknownCount,
    outcome,
    code: rejectedCount > 0
      ? 'SMTP_RECIPIENT_REJECTED'
      : unknownCount > 0
        ? 'EMAIL_RESULT_UNKNOWN'
        : 'SMTP_ACCEPTED',
  };
}

function classifyBccError(error: unknown, recipients: string[]): BookingEmailBccDiagnostics | undefined {
  if (recipients.length === 0) return undefined;
  const classification = classifySmtpError(error);
  return {
    configuredCount: recipients.length,
    acceptedCount: 0,
    rejectedCount: classification.code === 'SMTP_RECIPIENT_REJECTED' ? recipients.length : 0,
    unknownCount: classification.code === 'SMTP_RECIPIENT_REJECTED' ? 0 : recipients.length,
    outcome: classification.code === 'SMTP_RECIPIENT_REJECTED' ? 'failed' : 'unknown',
    code: classification.code,
  };
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
}

function renderPreferenceItemHtml(item: string, isFirst = false): string {
  let text = item.trim();
  if (!text) return '';

  text = text.replace(/^[•\-\*]\s*/, '').trim();

  // Header like [Service Name]
  if (/^\[.*\]$/.test(text)) {
    const cleanHeader = text.replace(/^\[\s*|\s*\]$/g, '').trim();
    const topMargin = isFirst ? '2px' : '12px';
    return `<div style="font-weight: 600; color: #D4AF37; margin-top: ${topMargin}; margin-bottom: 4px; font-size: 13.5px; letter-spacing: 0.3px;">${escapeHtml(cleanHeader)}</div>`;
  }

  // Tag badge
  const isTag = /^(Phòng riêng|Private Room|包间|個室|프라이빗 룸|Phụ nữ có thai|Pregnant|孕期|妊娠中|임산부|Có dị ứng|Allergies|过敏|アレルギー|알레르기)/i.test(text);
  if (isTag && !text.includes(':')) {
    return `<div style="margin-bottom: 6px;"><span style="display: inline-block; padding: 2px 10px; background-color: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.45); border-radius: 12px; font-size: 12px; color: #f7ebc7; font-weight: 500;">🏷️ ${escapeHtml(text)}</span></div>`;
  }

  // Key: Value
  const colonIdx = text.indexOf(':');
  if (colonIdx > 0 && colonIdx < 30) {
    const key = text.slice(0, colonIdx).trim();
    let val = text.slice(colonIdx + 1).trim();
    if (/WHOLE_BODY|FULL_BODY/i.test(val)) {
      const isEn = /focus|avoid/i.test(key);
      const isCn = /重点|避开/i.test(key);
      const isKr = /집중|제외/i.test(key);
      const fullText = isEn ? 'Full Body' : isCn ? '全身' : isKr ? '전신' : 'Toàn thân';
      if (val.includes(',') || val.includes(';')) {
        val = fullText;
      } else {
        val = val.replace(/WHOLE_BODY|FULL_BODY/gi, fullText);
      }
    }
    return `<div style="margin: 3px 0; font-size: 13px; line-height: 1.5;"><span style="color: rgba(247, 235, 199, 0.65); font-weight: 600;">• ${escapeHtml(key)}:</span> <span style="color: #ffffff; font-weight: 500;">${escapeHtml(val)}</span></div>`;
  }

  return `<div style="margin: 3px 0; font-size: 13px; line-height: 1.5; color: #f7ebc7;">• ${escapeHtml(text)}</div>`;
}

const PREFERENCE_COPY: Record<string, string[]> = {
  vi: ['Lực massage', 'Tập trung', 'Tránh', 'Nhẹ', 'Vừa', 'Mạnh', 'Đầu', 'Cổ', 'Vai', 'Lưng', 'Cánh tay', 'Đùi', 'Đầu gối', 'Bắp chân', 'Bàn chân', 'Toàn thân', 'Phòng riêng', 'Lưu ý mang thai', 'Lưu ý dị ứng hoặc da nhạy cảm'],
  en: ['Pressure', 'Focus', 'Avoid', 'Light', 'Medium', 'Strong', 'Head', 'Neck', 'Shoulders', 'Back', 'Arms', 'Thighs', 'Knees', 'Calves', 'Feet', 'Full body', 'Private Room', 'Pregnancy note', 'Allergy or sensitive skin note'],
  cn: ['按摩力度', '重点部位', '避开部位', '轻柔', '适中', '较强', '头部', '颈部', '肩部', '背部', '手臂', '大腿', '膝盖', '小腿', '足部', '全身', '包间', '孕期注意事项', '过敏或敏感肌肤注意事项'],
  jp: ['マッサージの強さ', '重点部位', '避ける部位', '弱め', '普通', '強め', '頭', '首', '肩', '背中', '腕', '太もも', '膝', 'ふくらはぎ', '足', '全身', '個室', '妊娠に関する注意事項', 'アレルギー・敏感肌に関する注意事項'],
  kr: ['마사지 강도', '집중 부위', '피할 부위', '약하게', '보통', '강하게', '머리', '목', '어깨', '등', '팔', '허벅지', '무릎', '종아리', '발', '전신', '프라이빗 룸', '임신 관련 주의사항', '알레르기 또는 민감성 피부 주의사항'],
};

function localizePreferences(raw: string, lang: string): string {
  const resolvedLang = I18N_TEMPLATE_1[lang] ? lang : 'vi';
  const t = I18N_TEMPLATE_1[resolvedLang];
  const copy = PREFERENCE_COPY[resolvedLang] || PREFERENCE_COPY.vi;
  const bodyCodes = ['HEAD', 'NECK', 'SHOULDER', 'BACK', 'ARM', 'THIGH', 'KNEE', 'CALF', 'FOOT', 'WHOLE_BODY', 'FULL_BODY'];
  return raw.split(/\r?\n/).map(line => {
    const value = line.trim();
    const tag = ['Private Room', 'Pregnancy note', 'Allergy or sensitive skin note'].indexOf(value);
    if (tag >= 0) return copy[16 + tag];
    const match = /^(Pressure|Focus|Avoid|Therapist):\s*(.*)$/i.exec(value);
    if (!match) return line;
    const key = match[1].toLowerCase();
    if (key === 'pressure') {
      const index = ['light', 'medium', 'strong'].indexOf(match[2].toLowerCase());
      return index < 0 ? line : `${copy[0]}: ${copy[3 + index]}`;
    }
    if (key === 'therapist') {
      const rawVal = match[2].toLowerCase().trim();
      let label = t.therapistMap.random || t.therapistMap.any;
      if (rawVal.includes('female') || rawVal.includes('nữ') || rawVal === 'female') {
        label = t.therapistMap.female;
      } else if (rawVal.includes('male') || rawVal.includes('nam') || rawVal === 'male') {
        label = t.therapistMap.male;
      } else if (rawVal.includes('random') || rawVal.includes('ngẫu nhiên') || rawVal === 'random' || rawVal === 'any') {
        label = t.therapistMap.random || t.therapistMap.any;
      }
      return `${t.therapistLabel}: ${label}`;
    }
    const parts = match[2].split(',').map(part => part.trim());
    if (!parts.every(part => bodyCodes.includes(part))) return line;
    return `${copy[key === 'focus' ? 1 : 2]}: ${parts.map(part => copy[6 + Math.min(bodyCodes.indexOf(part), 9)]).join(', ')}`;
  }).join('\n');
}

function renderPreferencesHtml(rawFocusNote?: string, lang = 'vi'): string {
  if (!rawFocusNote) return '';

  const lines = localizePreferences(rawFocusNote, lang)
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  let itemsHtml = '';
  let isFirstHeader = true;
  lines.forEach(line => {
    if (line.includes(' | ')) {
      let prefix = '';
      let remaining = line;
      const firstColon = line.indexOf(':');
      if (firstColon > 0 && firstColon < 40 && !line.slice(0, firstColon).toLowerCase().includes('tập trung') && !line.slice(0, firstColon).toLowerCase().includes('focus')) {
        prefix = line.slice(0, firstColon).trim();
        remaining = line.slice(firstColon + 1).trim();
        const cleanPrefix = prefix.replace(/^\[\s*|\s*\]$/g, '').trim();
        const topMargin = isFirstHeader ? '2px' : '12px';
        isFirstHeader = false;
        itemsHtml += `<div style="font-weight: 600; color: #D4AF37; margin-top: ${topMargin}; margin-bottom: 4px; font-size: 13.5px; letter-spacing: 0.3px;">${escapeHtml(cleanPrefix)}</div>`;
      }
      const parts = remaining.split(' | ').map(p => p.trim()).filter(Boolean);
      parts.forEach(part => {
        itemsHtml += renderPreferenceItemHtml(part, isFirstHeader);
      });
    } else {
      if (/^\[.*\]$/.test(line)) {
        const topMargin = isFirstHeader ? '2px' : '12px';
        isFirstHeader = false;
        const cleanHeader = line.replace(/^\[\s*|\s*\]$/g, '').trim();
        itemsHtml += `<div style="font-weight: 600; color: #D4AF37; margin-top: ${topMargin}; margin-bottom: 4px; font-size: 13.5px; letter-spacing: 0.3px;">${escapeHtml(cleanHeader)}</div>`;
      } else {
        itemsHtml += renderPreferenceItemHtml(line, isFirstHeader);
      }
    }
  });

  return `
    <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(212, 175, 55, 0.22); border-radius: 10px; padding: 12px 14px; color: #f7ebc7;">
      ${itemsHtml}
    </div>
  `.trim();
}

function formatPreferencesText(rawNote: string, lang = 'vi'): string {
  if (!rawNote) return '';
  const cleanedNote = localizePreferences(rawNote, lang);
  return cleanedNote
    .split(/\r?\n/)
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (/^\[.*\]$/.test(trimmed)) {
        return `\n  ${trimmed.replace(/^\[\s*|\s*\]$/g, '').trim()}:`;
      }
      if (trimmed.includes(' | ')) {
        return trimmed.split(' | ').map(p => `  - ${p.replace(/^[•\-\*]\s*/, '').trim()}`).join('\n');
      }
      return trimmed.startsWith('•') || trimmed.startsWith('-') ? `  ${trimmed}` : `  - ${trimmed}`;
    })
    .filter(Boolean)
    .join('\n');
}

function formatDateByLang(dateStr: string, lang: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;

  if (lang === 'vi') return `${day}/${month}/${year}`;
  if (lang === 'cn' || lang === 'jp') return `${year}年${Number(month)}月${Number(day)}日`;
  if (lang === 'kr') return `${year}년 ${Number(month)}월 ${Number(day)}일`;

  const dateObj = new Date(`${dateStr}T00:00:00`);
  const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return !isNaN(dateObj.getTime()) ? `${mNames[dateObj.getMonth()]} ${Number(day)}, ${year}` : dateStr;
}

export function generateBookingConfirmationHtml(
  payload: BookingEmailPayload,
  options: { embedCid?: boolean } = {}
): string {
  const {
    bookingId,
    customerName,
    customerPhone,
    date,
    time,
    guests = 1,
    branchName = '11 Ngô Đức Kế, Q.1, TP.HCM & 6B Thi Sách, Q.1, TP.HCM',
    services = [],
    totalAmount = 0,
    therapist,
    lang = 'vi',
    notes,
    focusAreaNote,
  } = payload;

  const resolvedLang = I18N_TEMPLATE_1[lang] ? lang : 'vi';
  const t = I18N_TEMPLATE_1[resolvedLang];
  const phoneDisplay = '+84 964 090 277';

  // Calculate total duration & construct service items with quantity
  const serviceItemsHtml = services.length > 0
    ? services.map(s => {
        const name = escapeHtml(s.name || 'Oria Spa Treatment');
        const qty = s.quantity && Number(s.quantity) > 0 ? Number(s.quantity) : 1;
        return `<div style="margin: 2px 0;">${name} <span style="color: #D4AF37; font-weight: 600;">x ${qty}</span></div>`;
      }).join('')
    : escapeHtml(services[0]?.name || 'Oria Spa Treatment');

  const totalDuration = services.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
  const durationDisplay = totalDuration > 0
    ? t.durationFormat(totalDuration)
    : (services[0]?.duration ? t.durationFormat(Number(services[0].duration)) : '-');

  const formattedDate = escapeHtml(formatDateByLang(date, resolvedLang));

  // Guests count formatted
  const guestCount = guests && Number(guests) > 0 ? Number(guests) : 1;
  const guestsDisplay = t.guestsSuffix(guestCount);

  const safeCustomerName = escapeHtml(customerName);
  const safeCustomerPhone = escapeHtml(customerPhone);
  const safePhoneHref = escapeHtml(String(customerPhone ?? '').replace(/[^+\d]/g, ''));
  const safeTime = escapeHtml(time);
  const safeBranchName = escapeHtml(branchName);
  const safeBookingId = escapeHtml(bookingId);
  const safeNotes = escapeHtml(notes);

  const logoUrl = 'https://oria-spa.vercel.app/images/oria-logo-email.png';
  const logoPath = path.join(process.cwd(), 'public/images/oria-logo-email.png');
  const hasLocalLogo = fs.existsSync(logoPath);
  const logoSrc = options.embedCid && hasLocalLogo ? 'cid:orialogo' : logoUrl;

  return `
<!DOCTYPE html>
<html lang="${escapeHtml(resolvedLang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a120e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f7ebc7;">
  <div style="background-color: #1a120e; padding: 32px 16px;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #281b15; border-radius: 18px; overflow: hidden; border: 1px solid #4a352a; box-shadow: 0 10px 30px rgba(0,0,0,0.55);">
      
      <!-- BRAND HEADER WITH LOGO -->
      <tr>
        <td align="center" style="padding: 28px 24px 20px; background: linear-gradient(180deg, #1f140f 0%, #281b15 100%); border-bottom: 1px solid #422f25;">
          <a href="https://oria-spa.vercel.app" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${logoSrc}"
              alt="ORIA SPA - Wellness & Beauty Sanctuary" 
              width="145" 
              style="display: block; margin: 0 auto; max-width: 145px; width: 145px; height: auto; border: 0; outline: none; text-decoration: none;" 
            />
          </a>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding: 32px 28px 28px;">
          <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #ffffff;">
            ${t.greeting(safeCustomerName)}
          </p>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.7; color: rgba(247, 235, 199, 0.9);">
            ${t.thankYou}
          </p>

          <!-- DETAILS CARD -->
          <div style="background-color: #1f1510; border: 1px solid #473328; border-radius: 14px; padding: 22px 24px; margin-bottom: 24px;">
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; font-weight: 600; color: #D4AF37; letter-spacing: 0.5px; margin-bottom: 16px;">
              ${t.heading}
            </div>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.7;">
              <tr>
                <td style="padding: 6px 0; color: rgba(247, 235, 199, 0.6); width: 38%; min-width: 110px; vertical-align: top;">
                  • <strong>${t.serviceLabel}:</strong>
                </td>
                <td style="padding: 6px 0; color: #ffffff; font-weight: 500; vertical-align: top;">
                  ${serviceItemsHtml}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.dateLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; font-weight: 500; vertical-align: top;">
                  ${formattedDate}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.timeLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #D4AF37; font-weight: 600; vertical-align: top;">
                  ${safeTime}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.durationLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; vertical-align: top;">
                  ${durationDisplay}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.guestsLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; font-weight: 500; vertical-align: top;">
                  ${guestsDisplay}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.locationLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; vertical-align: top;">
                  ${safeBranchName}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.bookingCodeLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #D4AF37; font-weight: bold; letter-spacing: 0.5px; vertical-align: top;">
                  ${safeBookingId}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.customerLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; font-weight: 600; vertical-align: top;">
                  ${safeCustomerName}
                </td>
              </tr>
              ${customerPhone ? `
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.phoneLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; font-weight: 500; vertical-align: top;">
                  <a href="tel:${safePhoneHref}" style="color: #D4AF37; text-decoration: none;">${safeCustomerPhone}</a>
                </td>
              </tr>
              ` : ''}
              ${totalAmount > 0 ? `
              <tr>
                <td style="padding: 7px 0; color: rgba(247, 235, 199, 0.6); vertical-align: middle;">
                  • <strong>${t.totalLabel}:</strong>
                </td>
                <td style="padding: 7px 0; color: #D4AF37; font-weight: bold; font-size: 16px; white-space: nowrap; vertical-align: middle;">
                  ${formatVND(totalAmount)}
                </td>
              </tr>
              ` : ''}

              ${focusAreaNote ? `
              <tr>
                <td colspan="2" style="padding: 12px 0 6px; border-top: 1px dashed rgba(247, 235, 199, 0.15);">
                  <div style="color: #D4AF37; font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                    • ${t.preferencesLabel}:
                  </div>
                  ${renderPreferencesHtml(focusAreaNote, lang)}
                </td>
              </tr>
              ` : ''}

              ${notes ? `
              <tr>
                <td colspan="2" style="padding: 12px 0 6px; border-top: 1px dashed rgba(247, 235, 199, 0.15);">
                  <div style="color: #D4AF37; font-size: 13px; font-weight: 600; margin-bottom: 6px;">
                    • ${t.notesLabel}:
                  </div>
                  <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 8px; padding: 10px 14px; color: #f7ebc7; font-size: 13px; line-height: 1.6; white-space: pre-line; font-style: italic;">
${safeNotes}
                  </div>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- FOLLOW UP NOTE -->
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.7; color: rgba(247, 235, 199, 0.9);">
            ${t.followUp}
          </p>

          <!-- QUESTIONS -->
          <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.7; color: rgba(247, 235, 199, 0.9);">
            ${t.questions(`<a href="tel:+84964090277" style="color: #D4AF37; text-decoration: none; font-weight: 600;">${phoneDisplay}</a>`)}
          </p>

          <!-- SIGNOFF -->
          <div style="border-top: 1px solid #422f25; padding-top: 20px;">
            <p style="margin: 0 0 4px; font-size: 14px; color: rgba(247, 235, 199, 0.8);">
              ${t.signoffGreeting}
            </p>
            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #D4AF37; font-family: 'Playfair Display', Georgia, serif;">
              ${t.signoffTeam}
            </p>
          </div>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td align="center" style="padding: 20px; background-color: #1a120e; border-top: 1px solid #3d2b22; text-align: center;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 1px; color: rgba(247, 235, 199, 0.35); text-transform: uppercase;">
            © ${new Date().getFullYear()} TECHGALAXY GROUP • ALL RIGHTS RESERVED
          </p>
        </td>
      </tr>

    </table>
  </div>
</body>
</html>
  `.trim();
}

export async function sendBookingConfirmationEmail(
  payload: BookingEmailPayload,
  options: BookingEmailSendOptions = {}
) : Promise<BookingEmailResult> {
  let stage: BookingEmailStage = 'preparation';
  const attempts: BookingEmailAttempt[] = [];
  let bccDiagnostics: BookingEmailBccDiagnostics | undefined;
  let bccConfiguration: BookingEmailResult['bccConfiguration'];

  try {
    const {
      bookingId,
      customerName,
      customerEmail,
      customerPhone,
      date,
      time,
      guests = 1,
      branchName = '11 Ngô Đức Kế, Q.1, TP.HCM & 6B Thi Sách, Q.1, TP.HCM',
      services = [],
      totalAmount = 0,
      therapist,
      lang = 'vi',
      notes,
      focusAreaNote,
    } = payload;

    const customerRecipient = normalizeEmailRecipient(customerEmail);
    const hasCustomerEmail = Boolean(customerRecipient);
    const rawReception = resolveReceptionEmail(payload.receptionEmail);
    const normalizedConfiguredBcc = normalizeConfiguredBccRecipients(payload.bccRecipients);
    bccConfiguration = payload.bccConfiguration || (normalizedConfiguredBcc.invalid ? 'NOTIFICATION_SETTINGS_INVALID' : undefined);

    if (!hasCustomerEmail && !rawReception) {
      console.log('[Mailer] Skipped email: neither customer email nor reception email available');
      return makeBookingEmailResult({
        success: false,
        outcome: 'failed',
        stage: 'preparation',
        code: 'EMAIL_RECIPIENT_INVALID',
        attempts,
        reason: 'No recipient email',
        ...(bccConfiguration ? { bccConfiguration } : {}),
      });
    }

    // Prevent delivering real SMTP emails to dummy/test domains (RFC 2606 reserved domains)
    const emailLower = (customerRecipient || '').toLowerCase();
    const isTestEmail =
      hasCustomerEmail && (
        emailLower.endsWith('.test') ||
        emailLower.endsWith('.example') ||
        emailLower.endsWith('.invalid') ||
        emailLower.endsWith('.localhost') ||
        emailLower.endsWith('@example.com') ||
        emailLower.endsWith('@test.com') ||
        emailLower.includes('dummy') ||
        emailLower.includes('synthetic')
      );

    if (isTestEmail) {
      console.log('[Mailer] Synthetic/test recipient detected; SMTP delivery skipped.');
      return makeBookingEmailResult({
        success: false,
        outcome: 'skipped',
        stage: 'preparation',
        code: 'EMAIL_TEST_SKIPPED',
        attempts,
        ...(bccConfiguration ? { bccConfiguration } : {}),
      });
    }

    const createTransporter = options.createTransporter || getTransporter;
    stage = 'configuration';
    const transporter = createTransporter();
    if (!transporter || typeof transporter.sendMail !== 'function') {
      console.warn('[Mailer] Cannot send email: transporter not configured (check SMTP_USER and SMTP_PASS)');
      return makeBookingEmailResult({
        success: false,
        outcome: 'failed',
        stage: 'configuration',
        code: 'EMAIL_CONFIGURATION_UNAVAILABLE',
        attempts,
        reason: 'Transporter not configured',
        ...(bccConfiguration ? { bccConfiguration } : {}),
      });
    }
    stage = 'preparation';

    const t = I18N_TEMPLATE_1[lang] || I18N_TEMPLATE_1.vi;
    const fromName = process.env.SMTP_FROM_NAME || 'Oria Spa';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'info@techgalaxygroup.com';
    const replyTo = process.env.SMTP_REPLY_TO || fromEmail;
    const phoneDisplay = '+84 964 090 277';

    // Construct service items with quantity
    const serviceItemsText = services.length > 0
      ? services.map(s => {
          const name = s.name || 'Oria Spa Treatment';
          const qty = s.quantity && Number(s.quantity) > 0 ? Number(s.quantity) : 1;
          return `  • ${name} x ${qty}`;
        }).join('\n')
      : `  • ${services[0]?.name || 'Oria Spa Treatment'}`;
    const totalDuration = services.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    const durationDisplay = totalDuration > 0
      ? t.durationFormat(totalDuration)
      : (services[0]?.duration ? t.durationFormat(Number(services[0].duration)) : '-');

    const formattedDate = formatDateByLang(date, lang);

    // Guests count formatted
    const guestCount = guests && Number(guests) > 0 ? Number(guests) : 1;
    const guestsDisplay = t.guestsSuffix(guestCount);

    // Plain Text Version (Exact structure matching Template 1 in PDF with guests & notes)
    const plainText = `
${t.greeting(customerName)}

${t.thankYou}

${t.heading}

• ${t.bookingCodeLabel}: ${bookingId}
• ${t.customerLabel}: ${customerName}
${customerPhone ? `• ${t.phoneLabel}: ${customerPhone}\n` : ''}• ${t.serviceLabel}:
${serviceItemsText}
• ${t.dateLabel}: ${formattedDate}
• ${t.timeLabel}: ${time}
• ${t.durationLabel}: ${durationDisplay}
• ${t.guestsLabel}: ${guestsDisplay}
• ${t.locationLabel}: ${branchName}
${totalAmount > 0 ? `• ${t.totalLabel}: ${formatVND(totalAmount)}` : ''}
${focusAreaNote ? `\n• ${t.preferencesLabel}:\n${formatPreferencesText(focusAreaNote, lang)}` : ''}
${notes ? `\n• ${t.notesLabel}: ${notes}` : ''}

${t.followUp}

${t.questions(phoneDisplay)}

${t.signoffGreeting}
${t.signoffTeam}
    `.trim();

    const logoPath = path.join(process.cwd(), 'public/images/oria-logo-email.png');
    const hasLocalLogo = fs.existsSync(logoPath);

    // Generate HTML Version
    const html = generateBookingConfirmationHtml(payload, { embedCid: true });

    const attachments = hasLocalLogo
      ? [
          {
            filename: 'oria-logo.png',
            path: logoPath,
            cid: 'orialogo',
          },
        ]
      : [];

    let toRecipient: string;
    const bccRecipients: string[] = [];

    if (hasCustomerEmail) {
      toRecipient = customerRecipient!;
      if (rawReception && rawReception.toLowerCase() !== customerRecipient!.toLowerCase()) {
        bccRecipients.push(rawReception);
      }
    } else {
      toRecipient = rawReception!;
    }

    const excludedRecipients = new Set(
      [customerRecipient, rawReception]
        .filter((recipient): recipient is string => Boolean(recipient))
        .map((recipient) => recipient.toLowerCase()),
    );
    for (const recipient of normalizedConfiguredBcc.recipients) {
      const normalized = recipient.toLowerCase();
      if (!excludedRecipients.has(normalized) && !bccRecipients.some((item) => item.toLowerCase() === normalized)) {
        bccRecipients.push(recipient);
      }
    }

    const phoneTag = customerPhone ? ` - ${customerPhone}` : '';
    const emailSubject = hasCustomerEmail
      ? `${t.subject} (#${bookingId})`
      : `[ĐƠN MỚI] Đặt lịch hẹn Oria Spa (#${bookingId}) - ${customerName}${phoneTag}`;

    const mailOptions: any = {
      from: `"${sanitizeHeaderText(fromName)}" <${normalizeEmailRecipient(fromEmail) || DEFAULT_RECEPTION_EMAIL}>`,
      to: toRecipient,
      replyTo: normalizeEmailRecipient(replyTo) || normalizeEmailRecipient(fromEmail) || DEFAULT_RECEPTION_EMAIL,
      subject: sanitizeHeaderText(emailSubject),
      text: plainText,
      html,
      attachments,
    };

    if (bccRecipients.length > 0) {
      // Keep the old single-string shape for the existing reception BCC while
      // using an array only when additional configured copies are present.
      mailOptions.bcc = bccRecipients.length === 1 ? bccRecipients[0] : bccRecipients;
    }

    const expectedRecipient = customerRecipient || toRecipient;
    stage = 'smtp';

    const sendAttempt = async (candidate: { sendMail: (mailOptions: any) => Promise<unknown> }) => {
      const attempt = attempts.length + 1;
      try {
        const info = await candidate.sendMail(mailOptions);
        const classification = classifySendInfo(info, expectedRecipient);
        bccDiagnostics = classifyBccSendInfo(info, bccRecipients);
        attempts.push({ attempt, stage: 'smtp', code: classification.code });
        return { info, classification, bccDiagnostics };
      } catch (error) {
        const classification = classifySmtpError(error);
        bccDiagnostics = classifyBccError(error, bccRecipients);
        attempts.push({ attempt, stage: 'smtp', code: classification.code });
        throw error;
      }
    };

    try {
      const { info, classification } = await sendAttempt(transporter);
      return makeBookingEmailResult({
        success: classification.success,
        messageId: getMessageId(info),
        outcome: classification.outcome,
        stage: 'smtp',
        code: classification.code,
        attempts,
        ...(bccDiagnostics ? { bcc: bccDiagnostics } : {}),
        ...(bccConfiguration ? { bccConfiguration } : {}),
      });
    } catch (primaryErr: any) {
      if (!canRetryWithFallback(primaryErr)) throw primaryErr;
      console.warn('[Mailer] Primary SMTP attempt failed; trying port 587', {
        bookingId,
        port: Number(process.env.SMTP_PORT || 465),
        ...safeSmtpErrorDetails(primaryErr),
      });
      const fallbackTransporter = createTransporter(587);
      if (!fallbackTransporter || typeof fallbackTransporter.sendMail !== 'function') throw primaryErr;
      try {
        const { info, classification } = await sendAttempt(fallbackTransporter);
        return makeBookingEmailResult({
          success: classification.success,
          messageId: getMessageId(info),
          outcome: classification.outcome,
          stage: 'smtp',
          code: classification.code,
          attempts,
          ...(bccDiagnostics ? { bcc: bccDiagnostics } : {}),
          ...(bccConfiguration ? { bccConfiguration } : {}),
        });
      } catch (fallbackErr: any) {
        console.error('[Mailer] Fallback SMTP attempt failed', {
          bookingId,
          port: 587,
          ...safeSmtpErrorDetails(fallbackErr),
        });
        throw fallbackErr;
      }
    }
  } catch (err: any) {
    const classification = stage === 'preparation'
      ? { outcome: 'failed' as const, code: 'EMAIL_PREPARATION_FAILED' as const }
      : stage === 'configuration'
        ? { outcome: 'failed' as const, code: 'EMAIL_CONFIGURATION_UNAVAILABLE' as const }
        : stage === 'smtp'
          ? classifySmtpError(err)
          : { outcome: 'unknown' as const, code: 'EMAIL_SEND_FAILED' as const };

    console.error('[Mailer] Booking notification failed.', {
      bookingId: payload.bookingId,
      ...safeSmtpErrorDetails(err),
    });
    return makeBookingEmailResult({
      success: false,
      outcome: classification.outcome,
      stage,
      code: classification.code,
      attempts,
      error: 'Notification delivery failed.',
      ...(bccDiagnostics ? { bcc: bccDiagnostics } : {}),
      ...(bccConfiguration ? { bccConfiguration } : {}),
    });
  }
}
