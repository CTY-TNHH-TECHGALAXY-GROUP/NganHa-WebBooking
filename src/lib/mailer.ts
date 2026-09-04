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
  customerEmail: string;
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
}

const I18N_TEMPLATE_1: Record<string, {
  subject: string;
  greeting: (name: string) => string;
  thankYou: string;
  heading: string;
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
    serviceLabel: "Service",
    dateLabel: "Date",
    timeLabel: "Time",
    durationLabel: "Duration",
    durationFormat: (m) => `${m} mins`,
    guestsLabel: "Number of Guests",
    guestsSuffix: (n) => `${n} guest${n > 1 ? 's' : ''}`,
    therapistLabel: "Therapist",
    therapistMap: { female: 'Female', male: 'Male', any: 'Any Therapist' },
    locationLabel: "Location",
    bookingCodeLabel: "Booking Code",
    totalLabel: "Estimated Total",
    preferencesLabel: "Treatment Preferences & Focus Areas",
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
    serviceLabel: "Dịch vụ",
    dateLabel: "Ngày hẹn",
    timeLabel: "Giờ hẹn",
    durationLabel: "Thời lượng",
    durationFormat: (m) => `${m} phút`,
    guestsLabel: "Số lượng khách",
    guestsSuffix: (n) => `${n} khách`,
    therapistLabel: "Kỹ thuật viên",
    therapistMap: { female: 'Nữ', male: 'Nam', any: 'Ngẫu nhiên' },
    locationLabel: "Chi nhánh",
    bookingCodeLabel: "Mã đặt lịch",
    totalLabel: "Tổng thanh toán dự kiến",
    preferencesLabel: "Yêu cầu & Lưu ý trị liệu",
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
    serviceLabel: "服务项目",
    dateLabel: "预约日期",
    timeLabel: "预约时间",
    durationLabel: "服务时长",
    durationFormat: (m) => `${m} 分钟`,
    guestsLabel: "预约人数",
    guestsSuffix: (n) => `${n} 位`,
    therapistLabel: "理疗师",
    therapistMap: { female: '女理疗师', male: '男理疗师', any: '随机安排' },
    locationLabel: "水疗中心地址",
    bookingCodeLabel: "预约编号",
    totalLabel: "预计总额",
    preferencesLabel: "护理偏好与特别要求",
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
    serviceLabel: "施術コース",
    dateLabel: "ご来店日",
    timeLabel: "ご来店時間",
    durationLabel: "所要時間",
    durationFormat: (m) => `${m} 分`,
    guestsLabel: "ご利用人数",
    guestsSuffix: (n) => `${n} 名様`,
    therapistLabel: "担当セラピスト",
    therapistMap: { female: '女性セラピスト', male: '男性セラピスト', any: 'おまかせ（指定なし）' },
    locationLabel: "店舗所在地",
    bookingCodeLabel: "ご予約番号",
    totalLabel: "お支払い概算",
    preferencesLabel: "施術のご要望・特記事項",
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
    serviceLabel: "예약 프로그램",
    dateLabel: "예약 일자",
    timeLabel: "예약 시간",
    durationLabel: "소요 시간",
    durationFormat: (m) => `${m} 분`,
    guestsLabel: "방문 인원",
    guestsSuffix: (n) => `${n} 인`,
    therapistLabel: "테라피스트",
    therapistMap: { female: '여성 테라피스트', male: '남성 테라피스트', any: '임의 배정 (지정 없음)' },
    locationLabel: "지점 위치",
    bookingCodeLabel: "예약 번호",
    totalLabel: "예상 결제 금액",
    preferencesLabel: "맞춤 케어 요청 및 참고 사항",
    notesLabel: "고객 요청 메모",
    followUp: "예약 일정이 확정되는 즉시 공식 확정 안내 이메일을 발송해 드리겠습니다. 일정 조정이 필요한 경우 사전에 미리 연락드리겠습니다.",
    questions: (phone) => `문의 사항이 있으실 경우, 본 이메일에 답장해 주시거나 ${phone} 번으로 편하게 연락해 주시기 바랍니다.`,
    signoffGreeting: "감사합니다.",
    signoffTeam: "Oria Spa 팀 드림",
  },
};

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.zoho.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('[Mailer] Missing SMTP_USER or SMTP_PASS in environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '\u00A0₫';
}

function renderPreferenceItemHtml(item: string): string {
  let text = item.trim();
  if (!text) return '';

  text = text.replace(/^[•\-\*]\s*/, '').trim();

  // Header like [Service Name]
  if (/^\[.*\]$/.test(text)) {
    return `<div style="font-weight: 600; color: #D4AF37; margin-top: 8px; margin-bottom: 4px; font-size: 13px; letter-spacing: 0.3px;">${text}</div>`;
  }

  // Tag badge
  const isTag = /^(Phòng riêng|Private Room|包间|個室|프라이빗 룸|Phụ nữ có thai|Pregnant|孕期|妊娠中|임산부|Có dị ứng|Allergies|过敏|アレルギー|알레르기)/i.test(text);
  if (isTag && !text.includes(':')) {
    return `<div style="margin-bottom: 6px;"><span style="display: inline-block; padding: 2px 10px; background-color: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212, 175, 55, 0.45); border-radius: 12px; font-size: 12px; color: #f7ebc7; font-weight: 500;">🏷️ ${text}</span></div>`;
  }

  // Key: Value
  const colonIdx = text.indexOf(':');
  if (colonIdx > 0 && colonIdx < 30) {
    const key = text.slice(0, colonIdx).trim();
    const val = text.slice(colonIdx + 1).trim();
    return `<div style="margin: 3px 0; font-size: 13px; line-height: 1.5;"><span style="color: rgba(247, 235, 199, 0.65); font-weight: 600;">• ${key}:</span> <span style="color: #ffffff; font-weight: 500;">${val}</span></div>`;
  }

  return `<div style="margin: 3px 0; font-size: 13px; line-height: 1.5; color: #f7ebc7;">• ${text}</div>`;
}

function renderPreferencesHtml(rawFocusNote?: string): string {
  if (!rawFocusNote) return '';

  const lines = rawFocusNote
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  let itemsHtml = '';
  lines.forEach(line => {
    if (line.includes(' | ')) {
      let prefix = '';
      let remaining = line;
      const firstColon = line.indexOf(':');
      if (firstColon > 0 && firstColon < 40 && !line.slice(0, firstColon).toLowerCase().includes('tập trung') && !line.slice(0, firstColon).toLowerCase().includes('focus')) {
        prefix = line.slice(0, firstColon).trim();
        remaining = line.slice(firstColon + 1).trim();
        itemsHtml += `<div style="font-weight: 600; color: #D4AF37; margin-top: 6px; margin-bottom: 4px; font-size: 13px;">${prefix}</div>`;
      }
      const parts = remaining.split(' | ').map(p => p.trim()).filter(Boolean);
      parts.forEach(part => {
        itemsHtml += renderPreferenceItemHtml(part);
      });
    } else {
      itemsHtml += renderPreferenceItemHtml(line);
    }
  });

  return `
    <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(212, 175, 55, 0.22); border-radius: 10px; padding: 12px 14px; color: #f7ebc7;">
      ${itemsHtml}
    </div>
  `.trim();
}

function formatPreferencesText(rawNote: string): string {
  if (!rawNote) return '';
  return rawNote
    .split(/\r?\n/)
    .map(line => {
      if (line.includes(' | ')) {
        return line.split(' | ').map(p => `  - ${p.replace(/^[•\-\*]\s*/, '').trim()}`).join('\n');
      }
      return line.startsWith('•') || line.startsWith('-') ? `  ${line}` : `  - ${line}`;
    })
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

export async function sendBookingConfirmationEmail(payload: BookingEmailPayload) {
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

    if (!customerEmail || !customerEmail.includes('@')) {
      console.log('[Mailer] Skipped email: invalid or missing customer email');
      return { success: false, reason: 'Invalid email' };
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.warn('[Mailer] Cannot send email: transporter not configured (check SMTP_USER and SMTP_PASS)');
      return { success: false, reason: 'Transporter not configured' };
    }

    const t = I18N_TEMPLATE_1[lang] || I18N_TEMPLATE_1.vi;
    const fromName = process.env.SMTP_FROM_NAME || 'Oria Spa';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'info@techgalaxygroup.com';
    const replyTo = process.env.SMTP_REPLY_TO || fromEmail;
    const phoneDisplay = '+84 964 090 277';

    // Calculate total duration & construct service string
    const serviceNames = services.map(s => s.name || 'Oria Spa Treatment').join(', ');
    const totalDuration = services.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    const durationDisplay = totalDuration > 0
      ? t.durationFormat(totalDuration)
      : (services[0]?.duration ? t.durationFormat(Number(services[0].duration)) : '-');

    const formattedDate = formatDateByLang(date, lang);

    // Guests count formatted
    const guestCount = guests && Number(guests) > 0 ? Number(guests) : 1;
    const guestsDisplay = t.guestsSuffix(guestCount);

    // Resolve therapist strictly in single language (no bilingual tags)
    const rawTherapist = (therapist || '').toLowerCase().trim();
    let therapistDisplay = '';
    if (rawTherapist.includes('female') || rawTherapist.includes('nữ') || rawTherapist === 'female') {
      therapistDisplay = t.therapistMap.female;
    } else if (rawTherapist.includes('male') || rawTherapist.includes('nam') || rawTherapist === 'male') {
      therapistDisplay = t.therapistMap.male;
    } else if (rawTherapist && rawTherapist !== 'any' && rawTherapist !== 'ngẫu nhiên' && rawTherapist !== 'random') {
      therapistDisplay = therapist!;
    } else {
      therapistDisplay = t.therapistMap.any;
    }

    // Plain Text Version (Exact structure matching Template 1 in PDF with guests & notes)
    const plainText = `
${t.greeting(customerName)}

${t.thankYou}

${t.heading}

• ${t.serviceLabel}: ${serviceNames}
• ${t.dateLabel}: ${formattedDate}
• ${t.timeLabel}: ${time}
• ${t.durationLabel}: ${durationDisplay}
• ${t.guestsLabel}: ${guestsDisplay}
• ${t.therapistLabel}: ${therapistDisplay}
• ${t.locationLabel}: ${branchName}
• ${t.bookingCodeLabel}: ${bookingId}
${totalAmount > 0 ? `• ${t.totalLabel}: ${formatVND(totalAmount)}` : ''}
${focusAreaNote ? `\n• ${t.preferencesLabel}:\n${formatPreferencesText(focusAreaNote)}` : ''}
${notes ? `\n• ${t.notesLabel}: ${notes}` : ''}

${t.followUp}

${t.questions(phoneDisplay)}

${t.signoffGreeting}
${t.signoffTeam}
    `.trim();

    // Luxurious Brand HTML Version (Matching Oria Spa aesthetic & Template 1 text)
    const html = `
<!DOCTYPE html>
<html lang="${lang}">
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
          <a href="https://nganha.vercel.app" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="cid:orialogo" 
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
            ${t.greeting(customerName)}
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
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); width: 38%; min-width: 110px; vertical-align: top;">
                  • <strong>${t.serviceLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; font-weight: 500; vertical-align: top;">
                  ${serviceNames}
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
                  ${time}
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
                  • <strong>${t.therapistLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; font-weight: 500; vertical-align: top;">
                  ${therapistDisplay}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.locationLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; vertical-align: top;">
                  ${branchName}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.bookingCodeLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #D4AF37; font-weight: bold; letter-spacing: 0.5px; vertical-align: top;">
                  ${bookingId}
                </td>
              </tr>
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
                  ${renderPreferencesHtml(focusAreaNote)}
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
${notes}
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
    `;

    const logoPath = path.join(process.cwd(), 'public/images/oria-logo-email.png');
    const attachments = fs.existsSync(logoPath)
      ? [
          {
            filename: 'oria-logo.png',
            path: logoPath,
            cid: 'orialogo',
          },
        ]
      : [];

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: customerEmail,
      replyTo,
      subject: `${t.subject} (#${bookingId})`,
      text: plainText,
      html,
      attachments,
    });

    console.log(`✅ [Mailer] Sent Booking Received (Template 1 - ${lang}) email to ${customerEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('❌ [Mailer] Failed to send Booking Received email:', err.message);
    return { success: false, error: err.message };
  }
}
