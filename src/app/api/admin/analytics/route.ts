import { NextRequest } from 'next/server';
import { apiResponse } from '@/lib/api/apiResponse';
import { requireAnalyticsRead } from '@/lib/analytics/adminAccess';
import { getAnalyticsDashboard, type AnalyticsDashboardFilters } from '@/lib/analytics/dashboard';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SUPPORTED_LANGUAGES = new Set(['vi', 'en', 'cn', 'jp', 'kr']);
const SUPPORTED_DEVICES = new Set(['mobile', 'tablet', 'desktop']);

const dateOrDefault = (value: string | null, fallback: string) => {
  if (!value || !ISO_DATE.test(value)) return fallback;
  const parsed = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value ? value : fallback;
};

export async function GET(request: NextRequest) {
  const access = await requireAnalyticsRead();
  if (!access.ok) {
    const code = access.status === 401 ? 'UNAUTHORIZED' : access.status === 503 ? 'CAPABILITY_UNAVAILABLE' : 'FORBIDDEN';
    return apiResponse.error(access.error, code, access.status);
  }

  const search = request.nextUrl.searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const language = search.get('language');
  const device = search.get('device');
  const entryPage = search.get('entry_page');
  const campaign = search.get('campaign');
  const filters: AnalyticsDashboardFilters = {
    dateFrom: dateOrDefault(search.get('date_from'), defaultFrom),
    dateTo: dateOrDefault(search.get('date_to'), today),
    ...(language && SUPPORTED_LANGUAGES.has(language) ? { language } : {}),
    ...(device && SUPPORTED_DEVICES.has(device) ? { device } : {}),
    ...(entryPage && entryPage.startsWith('/') && !entryPage.includes('?') ? { entryPage: entryPage.slice(0, 200) } : {}),
    ...(campaign && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,49}$/.test(campaign) ? { campaign } : {}),
    includeTest: search.get('include_test') === '1',
  };
  if (filters.dateFrom > filters.dateTo) {
    return apiResponse.error('date_from must be on or before date_to', 'INVALID_DATE_RANGE', 400);
  }

  const dashboard = await getAnalyticsDashboard(access.access.supabase, filters);
  return apiResponse.success(dashboard, { refreshSeconds: 60 });
}
