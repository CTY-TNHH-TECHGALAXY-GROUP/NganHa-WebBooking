// Display-only date formatting for the e-voucher (same output as the admin card).
const VN_TZ = 'Asia/Ho_Chi_Minh';

const dateFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "2026-10-03T09:00:00" (no offset) is VN wall-clock time from the server, not browser-local. */
const NO_OFFSET_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

const parse = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const d = new Date(NO_OFFSET_RE.test(iso) ? `${iso}+07:00` : iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** 31/10/2026 */
export const formatPromoDate = (iso: string | null | undefined): string => {
  const d = parse(iso);
  return d ? dateFmt.format(d) : '—';
};

/** 31/10/2026 18:05 */
export const formatPromoDateTime = (iso: string | null | undefined): string => {
  const d = parse(iso);
  if (!d) return '—';
  const part = (type: Intl.DateTimeFormatPartTypes) => dateTimeFmt.formatToParts(d).find((p) => p.type === type)?.value ?? '';
  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
};
