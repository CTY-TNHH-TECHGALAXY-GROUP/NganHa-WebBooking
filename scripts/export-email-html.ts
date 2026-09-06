import fs from 'fs';
import path from 'path';
import { generateBookingConfirmationHtml } from '../src/lib/mailer';

const samplePayload = {
  bookingId: 'WB-06092026-001',
  customerName: 'Quý khách',
  customerEmail: 'khachhang@example.com',
  customerPhone: '+84 964 090 277',
  date: '2026-09-06',
  time: '11:30',
  guests: 1,
  branchName: 'ORIA SPA',
  services: [
    {
      name: 'Tinh dầu dừa',
      duration: 60,
      priceVND: 580000,
    },
  ],
  totalAmount: 580000,
  therapist: 'random',
  lang: 'vi',
  notes: '',
  focusAreaNote: '• Tập trung: Toàn thân\n• Tránh: Bàn chân, Bắp chân, Đầu gối\n• Lực: Vừa',
};

const html = generateBookingConfirmationHtml(samplePayload, { embedCid: false });

// Export to public directory so it can be previewed in web browser
const publicOut = path.join(process.cwd(), 'public/email-current.html');
fs.writeFileSync(publicOut, html, 'utf8');

// Export to root directory
const rootOut = path.join(process.cwd(), 'email-current.html');
fs.writeFileSync(rootOut, html, 'utf8');

console.log('✅ Exported current email HTML to:');
console.log(' - ' + publicOut);
console.log(' - ' + rootOut);
