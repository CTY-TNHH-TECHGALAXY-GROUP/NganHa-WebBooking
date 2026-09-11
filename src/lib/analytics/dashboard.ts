import {
  ANALYTICS_DAILY_TABLE,
  ANALYTICS_EVENTS_TABLE,
  type AnalyticsStore,
} from './server';

export type AnalyticsDashboardFilters = {
  dateFrom: string;
  dateTo: string;
  language?: string;
  device?: string;
  entryPage?: string;
  campaign?: string;
  includeTest?: boolean;
};

export type AnalyticsDashboard = {
  status: 'ready' | 'not_configured';
  filters: AnalyticsDashboardFilters;
  overview: {
    sessions: number;
    events: number;
    engagedMs: number;
    conversions: number;
  };
  funnel: Array<{ key: string; label: string; count: number }>;
  trend: Array<{ date: string; sessions: number; events: number; conversions: number }>;
  topPages: Array<{ pagePath: string; views: number; sessions: number; engagedMs: number }>;
  topActions: Array<{ eventName: string; count: number }>;
  recentActivity: Array<{
    sessionId: string;
    eventName: string;
    pagePath: string;
    occurredAt: string;
    language: string;
    deviceCategory: string;
    identifier?: string;
    durationMs?: number;
  }>;
  note: string;
};

type DailyRow = {
  bucket_date?: string;
  event_name?: string;
  page_path?: string;
  language?: string;
  device_category?: string;
  event_count?: number;
  session_count?: number;
  engaged_ms?: number;
  campaign_name?: string;
};

type RawRow = {
  session_id?: string;
  event_name?: string;
  page_path?: string;
  occurred_at?: string;
  language?: string;
  device_category?: string;
  identifier?: string;
  duration_ms?: number;
};

type AnalyticsQueryResult = { data: unknown[] | null; error: unknown | null };
type AnalyticsQuery = {
  select: (columns: string) => AnalyticsQuery;
  gte: (column: string, value: string) => AnalyticsQuery;
  lte: (column: string, value: string) => AnalyticsQuery;
  eq: (column: string, value: string | boolean) => AnalyticsQuery;
  order: (column: string, options: { ascending: boolean }) => AnalyticsQuery;
  limit: (value: number) => AnalyticsQuery;
} & PromiseLike<AnalyticsQueryResult>;

const numberValue = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const emptyDashboard = (filters: AnalyticsDashboardFilters, status: AnalyticsDashboard['status']): AnalyticsDashboard => ({
  status,
  filters,
  overview: { sessions: 0, events: 0, engagedMs: 0, conversions: 0 },
  funnel: [
    { key: 'page_view', label: 'Landing / page view', count: 0 },
    { key: 'service_view', label: 'Service view', count: 0 },
    { key: 'cart_add', label: 'Cart add', count: 0 },
    { key: 'checkout_view', label: 'Checkout view', count: 0 },
    { key: 'booking_received', label: 'Verified booking', count: 0 },
  ],
  trend: [],
  topPages: [],
  topActions: [],
  recentActivity: [],
  note: status === 'not_configured'
    ? 'Analytics storage is not configured or has not received an aggregate yet.'
    : 'Active time is an estimate. TEST, admin, and bot traffic are excluded by default.',
});

export const getAnalyticsDashboard = async (
  store: AnalyticsStore,
  filters: AnalyticsDashboardFilters,
): Promise<AnalyticsDashboard> => {
  const base = emptyDashboard(filters, 'ready');
  let aggregateQuery = store.from(ANALYTICS_DAILY_TABLE) as AnalyticsQuery;
  aggregateQuery = aggregateQuery
    .select('bucket_date,event_name,page_path,language,device_category,event_count,session_count,engaged_ms,campaign_name')
    .gte('bucket_date', filters.dateFrom)
    .lte('bucket_date', filters.dateTo)
    .limit(5000);
  if (filters.language) aggregateQuery = aggregateQuery.eq('language', filters.language);
  if (filters.device) aggregateQuery = aggregateQuery.eq('device_category', filters.device);
  if (filters.entryPage) aggregateQuery = aggregateQuery.eq('page_path', filters.entryPage);
  if (filters.campaign) aggregateQuery = aggregateQuery.eq('campaign_name', filters.campaign);

  const { data: aggregateRows, error: aggregateError } = await aggregateQuery;
  if (aggregateError) return emptyDashboard(filters, 'not_configured');

  const rows = (aggregateRows || []) as DailyRow[];
  const eventTotals = new Map<string, number>();
  const pageTotals = new Map<string, { views: number; sessions: number; engagedMs: number }>();
  const trendTotals = new Map<string, { sessions: number; events: number; conversions: number }>();

  for (const row of rows) {
    const eventName = row.event_name || 'unknown';
    const eventCount = numberValue(row.event_count);
    const sessions = numberValue(row.session_count);
    const engagedMs = numberValue(row.engaged_ms);
    eventTotals.set(eventName, (eventTotals.get(eventName) || 0) + eventCount);

    if (row.page_path) {
      const current = pageTotals.get(row.page_path) || { views: 0, sessions: 0, engagedMs: 0 };
      if (eventName === 'page_view') {
        current.views += eventCount;
        current.sessions += sessions;
      }
      current.engagedMs += engagedMs;
      pageTotals.set(row.page_path, current);
    }

    if (row.bucket_date) {
      const current = trendTotals.get(row.bucket_date) || { sessions: 0, events: 0, conversions: 0 };
      if (eventName === 'page_view') current.sessions += sessions;
      current.events += eventCount;
      if (eventName === 'booking_received') current.conversions += eventCount;
      trendTotals.set(row.bucket_date, current);
    }
  }

  const funnelKeys = ['page_view', 'service_view', 'cart_add', 'checkout_view', 'booking_received'];
  base.overview = {
    sessions: rows.filter((row) => row.event_name === 'page_view').reduce((total, row) => total + numberValue(row.session_count), 0),
    events: rows.reduce((total, row) => total + numberValue(row.event_count), 0),
    engagedMs: rows.reduce((total, row) => total + numberValue(row.engaged_ms), 0),
    conversions: eventTotals.get('booking_received') || 0,
  };
  base.funnel = funnelKeys.map((key) => ({
    key,
    label: key === 'page_view' ? 'Landing / page view' : key === 'service_view' ? 'Service view' : key === 'cart_add' ? 'Cart add' : key === 'checkout_view' ? 'Checkout view' : 'Verified booking',
    count: eventTotals.get(key) || 0,
  }));
  base.trend = Array.from(trendTotals.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values }));
  base.topPages = Array.from(pageTotals.entries())
    .sort(([, a], [, b]) => b.views - a.views)
    .slice(0, 10)
    .map(([pagePath, values]) => ({ pagePath, ...values }));
  base.topActions = Array.from(eventTotals.entries())
    .filter(([eventName]) => eventName !== 'engagement_delta')
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([eventName, count]) => ({ eventName, count }));

  let rawQuery = store.from(ANALYTICS_EVENTS_TABLE) as AnalyticsQuery;
  rawQuery = rawQuery
    .select('session_id,event_name,page_path,occurred_at,language,device_category,identifier,duration_ms')
    .gte('received_at', `${filters.dateFrom}T00:00:00.000Z`)
    .lte('received_at', `${filters.dateTo}T23:59:59.999Z`)
    .eq('is_test', filters.includeTest === true)
    .eq('is_admin', false)
    .eq('is_bot', false)
    .order('received_at', { ascending: false })
    .limit(250);
  if (filters.language) rawQuery = rawQuery.eq('language', filters.language);
  if (filters.device) rawQuery = rawQuery.eq('device_category', filters.device);
  if (filters.entryPage) rawQuery = rawQuery.eq('page_path', filters.entryPage);
  if (filters.campaign) rawQuery = rawQuery.eq('campaign_name', filters.campaign);
  const { data: rawRows } = await rawQuery;
  base.recentActivity = (rawRows as RawRow[] || []).map((row) => ({
    sessionId: row.session_id || '',
    eventName: row.event_name || 'unknown',
    pagePath: row.page_path || '/',
    occurredAt: row.occurred_at || '',
    language: row.language || 'unknown',
    deviceCategory: row.device_category || 'unknown',
    ...(row.identifier ? { identifier: row.identifier } : {}),
    ...(typeof row.duration_ms === 'number' ? { durationMs: row.duration_ms } : {}),
  }));

  return base;
};
