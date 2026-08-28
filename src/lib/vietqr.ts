// ═══════════════════════════════════════
// VietQR URL Builder
// ═══════════════════════════════════════

const BANK_CODE = process.env.NEXT_PUBLIC_VIETQR_BANK_CODE || '';
const ACCOUNT_NO = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO || '';
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NAME || '';
const TEMPLATE = 'compact2';

interface VietQRParams {
  amount: number;
  bookingCode: string;
  customerName: string;
}

/**
 * Generate VietQR Quick Link URL (no API key needed)
 * @see https://www.vietqr.io/danh-sach-api/link-tao-ma-nhanh
 */
export const generateVietQRUrl = ({ amount, bookingCode, customerName }: VietQRParams): string => {
  const addInfo = `${bookingCode} - ${customerName}`;
  const encodedInfo = encodeURIComponent(addInfo);
  const encodedName = encodeURIComponent(ACCOUNT_NAME);

  return `https://img.vietqr.io/image/${BANK_CODE}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${amount}&addInfo=${encodedInfo}&accountName=${encodedName}`;
};
