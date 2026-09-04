// src/lib/mailer.ts - Automated email notification service for Oria Spa
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
  branchName?: string;
  services: BookingEmailServiceItem[];
  totalAmount: number;
  lang?: string;
  notes?: string;
}

const I18N: Record<string, {
  subject: (id: string) => string;
  title: string;
  subtitle: string;
  greeting: (name: string) => string;
  thankYou: string;
  codeLabel: string;
  timeLabel: string;
  branchLabel: string;
  customerLabel: string;
  phoneLabel: string;
  servicesTitle: string;
  serviceCol: string;
  durationCol: string;
  priceCol: string;
  totalLabel: string;
  notesLabel: string;
  noticeTitle: string;
  noticeContent: string;
  contactTitle: string;
  addressLabel: string;
  hotlineLabel: string;
  spaTagline: string;
}> = {
  vi: {
    subject: (id) => `[Oria Spa] Xác nhận đặt lịch thành công - Mã: ${id}`,
    title: 'XÁC NHẬN ĐẶT LỊCH THÀNH CÔNG',
    subtitle: 'ORIA SPA • NGHỆ THUẬT THƯ GIÃN ĐẲNG CẤP',
    greeting: (name) => `Kính gửi Quý khách ${name},`,
    thankYou: 'Oria Spa xin chân thành cảm ơn Quý khách đã tin tưởng và lựa chọn dịch vụ của chúng tôi. Lịch hẹn chăm sóc sức khoẻ của Quý khách đã được tiếp nhận thành công với các thông tin chi tiết dưới đây:',
    codeLabel: 'Mã đặt lịch',
    timeLabel: 'Thời gian hẹn',
    branchLabel: 'Chi nhánh',
    customerLabel: 'Khách hàng',
    phoneLabel: 'Số điện thoại',
    servicesTitle: 'CHI TIẾT DỊCH VỤ ĐÃ CHỌN',
    serviceCol: 'Dịch vụ',
    durationCol: 'Thời lượng',
    priceCol: 'Đơn giá',
    totalLabel: 'Tổng thanh toán dự kiến',
    notesLabel: 'Ghi chú đặc biệt',
    noticeTitle: 'Lưu ý khi đến hẹn',
    noticeContent: '• Quý khách vui lòng đến trước giờ hẹn 10 - 15 phút để thưởng thức trà thảo mộc độc quyền và hoàn tất thủ tục tư vấn liệu trình.\n• Trong trường hợp Quý khách cần điều chỉnh thời gian hẹn, xin vui lòng liên hệ hotline trước ít nhất 2 giờ để được hỗ trợ chu đáo nhất.',
    contactTitle: 'Thông tin liên hệ & Hỗ trợ',
    addressLabel: 'Địa chỉ',
    hotlineLabel: 'Hotline',
    spaTagline: 'Trải nghiệm dịch vụ chăm sóc sức khoẻ và làm đẹp đẳng cấp tại trung tâm TP.HCM.',
  },
  en: {
    subject: (id) => `[Oria Spa] Booking Confirmation - Code: ${id}`,
    title: 'BOOKING CONFIRMATION',
    subtitle: 'ORIA SPA • LUXURY WELLNESS & BEAUTY',
    greeting: (name) => `Dear ${name},`,
    thankYou: 'Thank you for choosing Oria Spa. Your appointment has been successfully received and scheduled. Here are the details of your booking:',
    codeLabel: 'Booking Code',
    timeLabel: 'Date & Time',
    branchLabel: 'Location',
    customerLabel: 'Guest Name',
    phoneLabel: 'Phone Number',
    servicesTitle: 'SELECTED SERVICES',
    serviceCol: 'Service',
    durationCol: 'Duration',
    priceCol: 'Price',
    totalLabel: 'Estimated Total',
    notesLabel: 'Special Requests',
    noticeTitle: 'Appointment Tips',
    noticeContent: '• Please arrive 10 - 15 minutes prior to your appointment time to enjoy our welcome herbal tea and consult with your therapist.\n• If you need to reschedule or cancel, kindly notify us via hotline at least 2 hours in advance.',
    contactTitle: 'Contact & Support',
    addressLabel: 'Address',
    hotlineLabel: 'Hotline',
    spaTagline: 'Experience premium wellness and beauty services in District 1, HCMC.',
  },
  cn: {
    subject: (id) => `[Oria Spa] 预约成功确认函 - 编号: ${id}`,
    title: '预约成功确认',
    subtitle: 'ORIA SPA • 尊贵养生与美疗体验',
    greeting: (name) => `尊敬的 ${name} 贵宾：`,
    thankYou: '衷心感谢您选择 Oria Spa。您的养生护理预约已成功受理，预约明细如下：',
    codeLabel: '预约编号',
    timeLabel: '预约时间',
    branchLabel: '分店地址',
    customerLabel: '贵宾姓名',
    phoneLabel: '联系电话',
    servicesTitle: '已选服务项目',
    serviceCol: '服务项目',
    durationCol: '时长',
    priceCol: '单价',
    totalLabel: '预计总额',
    notesLabel: '特别需求',
    noticeTitle: '到店提示',
    noticeContent: '• 建议您提前 10 - 15 分钟抵达，品尝精选中草药迎宾茶并进行护理前沟通。\n• 如需调整或取消时间，请至少提前 2 小时致电热线。',
    contactTitle: '联系与支持',
    addressLabel: '地址',
    hotlineLabel: '服务热线',
    spaTagline: '胡志明市第一郡核心区顶级养生与美疗中心。',
  },
  jp: {
    subject: (id) => `[Oria Spa] ご予約完了のお知らせ - 予約番号: ${id}`,
    title: 'ご予約確認書',
    subtitle: 'ORIA SPA • 極上のウェルネス＆トリートメント',
    greeting: (name) => `${name} 様`,
    thankYou: 'Oria Spa をご利用いただき、誠にありがとうございます。ご予約が完了いたしましたので、以下の詳細をご確認ください。',
    codeLabel: '予約番号',
    timeLabel: '日時',
    branchLabel: '店舗',
    customerLabel: 'お名前',
    phoneLabel: 'お電話番号',
    servicesTitle: 'ご予約のコース内容',
    serviceCol: 'コース・施術',
    durationCol: '所要時間',
    priceCol: '料金',
    totalLabel: 'お支払い合計（概算）',
    notesLabel: 'ご要望・メモ',
    noticeTitle: 'ご来店時のご案内',
    noticeContent: '• カウンセリングとウェルカムハーブティーをお楽しみいただくため、予約時間の10〜15分前にお越しください。\n• 日時の変更やキャンセルは、2時間前までにお電話にてお知らせください。',
    contactTitle: 'お問い合わせ・店舗情報',
    addressLabel: '所在地',
    hotlineLabel: '電話番号',
    spaTagline: 'ホーチミン市1区中心部に位置するラグジュアリースパ。',
  },
  kr: {
    subject: (id) => `[Oria Spa] 예약 완료 확인서 - 예약번호: ${id}`,
    title: '예약 완료 확인서',
    subtitle: 'ORIA SPA • 프리미엄 웰니스 & 스파 테라피',
    greeting: (name) => `${name} 고객님,`,
    thankYou: 'Oria Spa를 예약해 주셔서 진심으로 감사드립니다. 고객님의 예약이 성공적으로 접수되었으며, 상세 내역은 아래와 같습니다.',
    codeLabel: '예약 번호',
    timeLabel: '예약 일시',
    branchLabel: '이용 지점',
    customerLabel: '고객명',
    phoneLabel: '연락처',
    servicesTitle: '선택하신 서비스',
    serviceCol: '서비스명',
    durationCol: '소요시간',
    priceCol: '금액',
    totalLabel: '예상 결제 금액',
    notesLabel: '요청 사항',
    noticeTitle: '방문 전 안내사항',
    noticeContent: '• 웰컴 허브티 시음 및 맞춤 상담을 위해 예약 시간 10~15분 전까지 도착해 주시기 바랍니다.\n• 예약 변경 또는 취소 시 최소 2시간 전까지 핫라인으로 연락 부탁드립니다.',
    contactTitle: '고객센터 및 안내',
    addressLabel: '주소',
    hotlineLabel: '핫라인',
    spaTagline: '호치민 1군 중심에서 즐기는 최고급 힐링 & 뷰티 스파.',
  },
};

// Create reusable transporter
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
      branchName = '11 Ngô Đức Kế, Q.1, TP.HCM',
      services = [],
      totalAmount = 0,
      lang = 'vi',
      notes,
    } = payload;

    if (!customerEmail || !customerEmail.includes('@')) {
      console.log('[Mailer] Skipped email: invalid or missing customer email');
      return { success: false, reason: 'Invalid email' };
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.warn('[Mailer] Cannot send email: transporter not configured');
      return { success: false, reason: 'Transporter not configured' };
    }

    const t = I18N[lang] || I18N.vi;
    const fromName = process.env.SMTP_FROM_NAME || 'Oria Spa';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'info@techgalaxygroup.com';
    const replyTo = process.env.SMTP_REPLY_TO || fromEmail;
    const hotline = '+84 964 090 277';
    const address = '11 Ngô Đức Kế, P. Sài Gòn, Q.1, TP.HCM & 6B Thi Sách, Q.1, TP.HCM';

    // Build Service Rows HTML
    const serviceRowsHtml = services.map((s) => {
      const durationStr = s.duration ? `${s.duration} min` : '-';
      const priceStr = s.priceVND ? formatVND(s.priceVND * (s.quantity || 1)) : '-';
      const qtyStr = s.quantity && s.quantity > 1 ? ` (x${s.quantity})` : '';
      return `
        <tr style="border-bottom: 1px solid #3d2b22;">
          <td style="padding: 12px 14px; color: #f7ebc7; font-weight: 500; font-size: 14px;">
            ${s.name || 'Dịch vụ Spa'}${qtyStr}
          </td>
          <td style="padding: 12px 14px; color: #f7ebc7; font-size: 13px; text-align: center; opacity: 0.85;">
            ${durationStr}
          </td>
          <td style="padding: 12px 14px; color: #D4AF37; font-weight: 600; font-size: 14px; text-align: right;">
            ${priceStr}
          </td>
        </tr>
      `;
    }).join('');

    // HTML Email Template
    const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a120e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f7ebc7;">
  <div style="background-color: #1a120e; padding: 30px 15px;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #281b15; border-radius: 18px; overflow: hidden; border: 1px solid #523a2e; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      
      <!-- HEADER -->
      <tr>
        <td align="center" style="padding: 36px 24px 28px; background: linear-gradient(180deg, #1e140f 0%, #281b15 100%); border-bottom: 1px solid #4a3328;">
          <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #D4AF37; text-transform: uppercase; margin-bottom: 6px;">
            ORIA SPA
          </div>
          <div style="font-size: 11px; letter-spacing: 2px; color: #f7ebc7; opacity: 0.6; text-transform: uppercase;">
            ${t.subtitle}
          </div>
          <div style="margin-top: 24px; display: inline-block; background-color: rgba(212, 175, 55, 0.12); border: 1px solid #D4AF37; padding: 7px 20px; border-radius: 30px;">
            <span style="font-size: 12px; font-weight: 600; letter-spacing: 1.5px; color: #D4AF37; text-transform: uppercase;">
              ${t.codeLabel}: <strong style="color: #ffffff;">${bookingId}</strong>
            </span>
          </div>
        </td>
      </tr>

      <!-- BODY CONTENT -->
      <tr>
        <td style="padding: 32px 28px 24px;">
          <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #ffffff; text-align: center; letter-spacing: 0.5px;">
            ${t.title}
          </h1>
          <p style="margin: 0 0 16px; font-size: 15px; color: #f7ebc7; font-weight: 500;">
            ${t.greeting(customerName)}
          </p>
          <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: rgba(247, 235, 199, 0.85);">
            ${t.thankYou}
          </p>

          <!-- BOOKING SUMMARY CARD -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e140f; border: 1px solid #422f25; border-radius: 12px; margin-bottom: 26px; overflow: hidden;">
            <tr>
              <td style="padding: 18px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: rgba(247, 235, 199, 0.6); width: 140px;">
                      ${t.timeLabel}:
                    </td>
                    <td style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #D4AF37;">
                      ${time || ''} • ${date || ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: rgba(247, 235, 199, 0.6);">
                      ${t.branchLabel}:
                    </td>
                    <td style="padding: 6px 0; font-size: 14px; color: #f7ebc7;">
                      ${branchName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: rgba(247, 235, 199, 0.6);">
                      ${t.customerLabel}:
                    </td>
                    <td style="padding: 6px 0; font-size: 14px; color: #f7ebc7; font-weight: 500;">
                      ${customerName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: rgba(247, 235, 199, 0.6);">
                      ${t.phoneLabel}:
                    </td>
                    <td style="padding: 6px 0; font-size: 14px; color: #f7ebc7;">
                      ${customerPhone || '-'}
                    </td>
                  </tr>
                  ${notes ? `
                  <tr>
                    <td style="padding: 6px 0; font-size: 13px; color: rgba(247, 235, 199, 0.6);">
                      ${t.notesLabel}:
                    </td>
                    <td style="padding: 6px 0; font-size: 13px; color: #f7ebc7; font-style: italic;">
                      ${notes}
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </td>
            </tr>
          </table>

          <!-- SERVICES TABLE -->
          <div style="font-size: 13px; font-weight: 600; letter-spacing: 1px; color: #D4AF37; text-transform: uppercase; margin-bottom: 12px;">
            ${t.servicesTitle}
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e140f; border: 1px solid #422f25; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #2f2018; border-bottom: 1px solid #4a3328;">
                <th style="padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: rgba(247, 235, 199, 0.7); text-align: left;">
                  ${t.serviceCol}
                </th>
                <th style="padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: rgba(247, 235, 199, 0.7); text-align: center; width: 90px;">
                  ${t.durationCol}
                </th>
                <th style="padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: rgba(247, 235, 199, 0.7); text-align: right; width: 110px;">
                  ${t.priceCol}
                </th>
              </tr>
            </thead>
            <tbody>
              ${serviceRowsHtml}
              <!-- TOTAL -->
              <tr style="background-color: rgba(212, 175, 55, 0.08);">
                <td colspan="2" style="padding: 14px; font-size: 14px; font-weight: 600; color: #f7ebc7; text-align: right;">
                  ${t.totalLabel}:
                </td>
                <td style="padding: 14px; font-size: 16px; font-weight: bold; color: #D4AF37; text-align: right;">
                  ${formatVND(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- IMPORTANT NOTICE -->
          <div style="background-color: rgba(212, 175, 55, 0.05); border-left: 3px solid #D4AF37; border-radius: 6px; padding: 14px 16px; margin-bottom: 26px;">
            <div style="font-size: 13px; font-weight: 600; color: #D4AF37; margin-bottom: 6px;">
              ${t.noticeTitle}
            </div>
            <div style="font-size: 12px; line-height: 1.6; color: rgba(247, 235, 199, 0.85); white-space: pre-line;">
              ${t.noticeContent}
            </div>
          </div>

          <!-- CONTACT & SUPPORT -->
          <div style="border-top: 1px solid #422f25; padding-top: 20px;">
            <div style="font-size: 13px; font-weight: 600; color: #f7ebc7; margin-bottom: 8px;">
              ${t.contactTitle}
            </div>
            <div style="font-size: 12px; line-height: 1.7; color: rgba(247, 235, 199, 0.7);">
              • ${t.addressLabel}: <strong>${address}</strong><br>
              • ${t.hotlineLabel}: <a href="tel:+84964090277" style="color: #D4AF37; text-decoration: none; font-weight: 600;">${hotline}</a> (Zalo / WhatsApp)
            </div>
          </div>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td align="center" style="padding: 24px; background-color: #1a120e; border-top: 1px solid #422f25; text-align: center;">
          <p style="margin: 0 0 6px; font-size: 12px; color: rgba(247, 235, 199, 0.5);">
            ${t.spaTagline}
          </p>
          <p style="margin: 0; font-size: 11px; letter-spacing: 1px; color: rgba(247, 235, 199, 0.35); text-transform: uppercase;">
            © ${new Date().getFullYear()} TECHGALAXY GROUP • ALL RIGHTS RESERVED.
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
      subject: t.subject(bookingId),
      html,
    });

    console.log(`✅ [Mailer] Sent booking confirmation email to ${customerEmail} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('❌ [Mailer] Failed to send booking confirmation email:', err.message);
    return { success: false, error: err.message };
  }
}
