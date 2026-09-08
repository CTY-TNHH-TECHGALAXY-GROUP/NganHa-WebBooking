type QuoteItem = {
  id?: string;
  variantId?: string;
  serviceId?: string;
  quantity?: number;
  qty?: number;
  options?: unknown;
  customOptions?: unknown;
  priceVND?: number;
  priceUSD?: number;
  duration?: number;
};

const reviewCopy: Record<string, string> = {
  vi: 'Giá hoặc dịch vụ đã thay đổi. Vui lòng tải lại và kiểm tra trước khi xác nhận.',
  en: 'Prices or services have changed. Please reload and review before confirming.',
  jp: '料金またはサービスが変更されました。再読み込みして内容をご確認ください。',
  kr: '가격 또는 서비스가 변경되었습니다. 새로고침 후 내용을 확인해 주세요.',
  cn: '价格或服务已变更。请刷新页面并确认后再提交。',
};
const unavailableCopy: Record<string, string> = {
  vi: 'Tạm thời chưa thể kiểm tra giá. Vui lòng thử lại.',
  en: 'Pricing is temporarily unavailable. Please try again.',
  jp: '現在料金を確認できません。もう一度お試しください。',
  kr: '현재 가격을 확인할 수 없습니다. 다시 시도해 주세요.',
  cn: '暂时无法确认价格，请重试。',
};

// Legacy booking entry points use the same signed quote as the main checkout.
export async function fetchBookingQuote(items: QuoteItem[], lang: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch('/api/bookings/reprice', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(item => ({
        id: item.id || item.variantId || item.serviceId, quantity: item.quantity ?? item.qty ?? 1,
        options: item.options || item.customOptions || {}, priceVND: item.priceVND, priceUSD: item.priceUSD, duration: item.duration,
      })) }),
    });
  } catch {
    throw new Error(unavailableCopy[lang] || unavailableCopy.en);
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 409 || data.hasPriceChanged) throw new Error(reviewCopy[lang] || reviewCopy.en);
  if (!response.ok || !data.valid || !data.quote) throw new Error(unavailableCopy[lang] || unavailableCopy.en);
  return data.quote;
}
