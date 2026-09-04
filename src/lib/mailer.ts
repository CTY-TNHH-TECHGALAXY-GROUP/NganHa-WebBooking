// src/lib/mailer.ts - Oria Spa Booking Received (Auto-confirmation) Email Service
import nodemailer from 'nodemailer';

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
    greeting: (name) => `您好 ${name}，`,
    thankYou: "感谢您预约 Oria Spa！我们已收到您的预约申请，团队目前正在审核处理中。",
    heading: "您的预约申请信息：",
    serviceLabel: "服务项目",
    dateLabel: "预约日期",
    timeLabel: "预约时间",
    durationLabel: "服务时长",
    guestsLabel: "预约人数",
    guestsSuffix: (n) => `${n} 位`,
    therapistLabel: "理疗师",
    therapistMap: { female: '女理疗师', male: '男理疗师', any: '随机安排' },
    locationLabel: "分店地址",
    bookingCodeLabel: "预约编号",
    totalLabel: "预计总额",
    preferencesLabel: "理疗偏好与特别要求",
    notesLabel: "客户特别备注",
    followUp: "确认您的预约时间后，我们将很快向您发送正式确认邮件。如需作任何调整，我们会主动与您联系。",
    questions: (phone) => `在此期间如有任何疑问，可直接回复此邮件，或致电联系我们：${phone}。`,
    signoffGreeting: "此致，",
    signoffTeam: "Oria Spa 团队敬上",
  },
  jp: {
    subject: "ご予約リクエストを受け付けました — Oria Spa",
    greeting: (name) => `${name} 様`,
    thankYou: "Oria Spa をご予約いただき、誠にありがとうございます！ご予約リクエストを受け付けました。現在スタッフが確認しております。",
    heading: "ご予約リクエスト内容：",
    serviceLabel: "コース・施術",
    dateLabel: "日付",
    timeLabel: "時間",
    durationLabel: "所要時間",
    guestsLabel: "ご利用人数",
    guestsSuffix: (n) => `${n} 名様`,
    therapistLabel: "セラピスト",
    therapistMap: { female: '女性', male: '男性', any: 'おまかせ' },
    locationLabel: "店舗所在地",
    bookingCodeLabel: "予約番号",
    totalLabel: "お支払い概算",
    preferencesLabel: "施術のご要望・注意事項",
    notesLabel: "お客様からの備考",
    followUp: "予約枠が確保され次第、確認メールをお送りいたします。調整が必要な場合はご連絡させていただきます。",
    questions: (phone) => `ご不明な点がございましたら、このメールにご返信いただくか、${phone} までお気軽にお電話ください。`,
    signoffGreeting: "敬具",
    signoffTeam: "Oria Spa チームより",
  },
  kr: {
    subject: "예약 요청이 정상 접수되었습니다 — Oria Spa",
    greeting: (name) => `안녕하세요 ${name} 님,`,
    thankYou: "Oria Spa를 예약해 주셔서 감사합니다! 고객님의 예약 요청이 접수되어 현재 담당 팀에서 확인 중입니다.",
    heading: "요청하신 예약 정보:",
    serviceLabel: "서비스",
    dateLabel: "날짜",
    timeLabel: "시간",
    durationLabel: "소요 시간",
    guestsLabel: "방문 인원",
    guestsSuffix: (n) => `${n} 명`,
    therapistLabel: "테라피스트",
    therapistMap: { female: '여성', male: '남성', any: '지정 없음' },
    locationLabel: "지점 위치",
    bookingCodeLabel: "예약 번호",
    totalLabel: "예상 결제 금액",
    preferencesLabel: "맞춤 요청 및 참고 사항",
    notesLabel: "고객 요청 메모",
    followUp: "예약이 확정되는 대로 확인 이메일을 보내드리겠습니다. 변경 사항이 있을 경우 별도로 연락드리겠습니다.",
    questions: (phone) => `문의 사항이 있으시면 본 이메일에 답장해 주시거나 ${phone} 번으로 전화해 주시기 바랍니다.`,
    signoffGreeting: "감사합니다,",
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
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
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
    const durationDisplay = totalDuration > 0 ? `${totalDuration} mins` : (services[0]?.duration ? `${services[0].duration} mins` : '-');

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
• ${t.dateLabel}: ${date}
• ${t.timeLabel}: ${time}
• ${t.durationLabel}: ${durationDisplay}
• ${t.guestsLabel}: ${guestsDisplay}
• ${t.therapistLabel}: ${therapistDisplay}
• ${t.locationLabel}: ${branchName}
• ${t.bookingCodeLabel}: ${bookingId}
${totalAmount > 0 ? `• ${t.totalLabel}: ${formatVND(totalAmount)}` : ''}
${focusAreaNote ? `\n• ${t.preferencesLabel}:\n${focusAreaNote}` : ''}
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
      
      <!-- BRAND HEADER -->
      <tr>
        <td align="center" style="padding: 36px 24px 24px; background: linear-gradient(180deg, #1f140f 0%, #281b15 100%); border-bottom: 1px solid #422f25;">
          <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #D4AF37; text-transform: uppercase;">
            ORIA SPA
          </div>
          <div style="font-size: 11px; letter-spacing: 2.5px; color: rgba(247, 235, 199, 0.6); text-transform: uppercase; margin-top: 4px;">
            Wellness & Beauty Sanctuary
          </div>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding: 32px 28px 28px;">
          <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #ffffff;">
            ${t.greeting(customerName)}
          </p>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.65; color: rgba(247, 235, 199, 0.88);">
            ${t.thankYou}
          </p>

          <!-- DETAILS CARD -->
          <div style="background-color: #1f1510; border: 1px solid #473328; border-radius: 14px; padding: 22px 24px; margin-bottom: 24px;">
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; font-weight: 600; color: #D4AF37; letter-spacing: 0.5px; margin-bottom: 16px;">
              ${t.heading}
            </div>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.7;">
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); width: 170px; vertical-align: top;">
                  • <strong>${t.serviceLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; font-weight: 500;">
                  ${serviceNames}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.dateLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; font-weight: 500;">
                  ${date}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.timeLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #D4AF37; font-weight: 600;">
                  ${time}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.durationLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff;">
                  ${durationDisplay}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.guestsLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; font-weight: 500;">
                  ${guestsDisplay}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.therapistLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff; font-weight: 500;">
                  ${therapistDisplay}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.locationLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #ffffff;">
                  ${branchName}
                </td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.bookingCodeLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #D4AF37; font-weight: bold; letter-spacing: 0.5px;">
                  ${bookingId}
                </td>
              </tr>
              ${totalAmount > 0 ? `
              <tr>
                <td style="padding: 5px 0; color: rgba(247, 235, 199, 0.6); vertical-align: top;">
                  • <strong>${t.totalLabel}:</strong>
                </td>
                <td style="padding: 5px 0; color: #D4AF37; font-weight: bold;">
                  ${formatVND(totalAmount)}
                </td>
              </tr>
              ` : ''}

              ${focusAreaNote ? `
              <tr>
                <td colspan="2" style="padding: 12px 0 6px; border-top: 1px dashed rgba(247, 235, 199, 0.15);">
                  <div style="color: #D4AF37; font-size: 13px; font-weight: 600; margin-bottom: 6px;">
                    • ${t.preferencesLabel}:
                  </div>
                  <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 8px; padding: 10px 14px; color: #f7ebc7; font-size: 13px; line-height: 1.6; white-space: pre-line;">
${focusAreaNote}
                  </div>
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
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.65; color: rgba(247, 235, 199, 0.88);">
            ${t.followUp}
          </p>

          <!-- QUESTIONS -->
          <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.65; color: rgba(247, 235, 199, 0.88);">
            ${t.questions(`<a href="tel:+84964090277" style="color: #D4AF37; text-decoration: none; font-weight: 600;">${phoneDisplay}</a>`)}
          </p>

          <!-- SIGNOFF -->
          <div style="border-top: 1px solid #422f25; padding-top: 20px;">
            <p style="margin: 0 0 4px; font-size: 14px; color: rgba(247, 235, 199, 0.75);">
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

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: customerEmail,
      replyTo,
      subject: `${t.subject} (#${bookingId})`,
      text: plainText,
      html,
    });

    console.log(`✅ [Mailer] Sent Booking Received (Template 1) email to ${customerEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('❌ [Mailer] Failed to send Booking Received email:', err.message);
    return { success: false, error: err.message };
  }
}
