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

export type AnalyticsTruncation = {
  any: boolean;
  aggregate: boolean;
  rawEvents: boolean;
  recentActivity: boolean;
};

export type AnalyticsDashboard = {
  status: 'ready' | 'not_configured';
  filters: AnalyticsDashboardFilters;
  metricQuality: {
    sessions: 'exact' | 'bucket_total';
    funnel: 'ordered_sessions' | 'event_counts';
  };
  truncation: AnalyticsTruncation;
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
  event_id?: string;
  session_id?: string;
  event_name?: string;
  page_path?: string;
  occurred_at?: string;
  received_at?: string;
  language?: string;
  device_category?: string;
  identifier?: string;
  duration_ms?: number;
  campaign_name?: string;
  is_test?: boolean;
  is_admin?: boolean;
  is_bot?: boolean;
};

type AnalyticsQueryResult = { data: unknown[] | null; error: unknown | null };
type AnalyticsQuery = {
  select: (columns: string) => AnalyticsQuery;
  gte: (column: string, value: string) => AnalyticsQuery;
  lte: (column: string, value: string) => AnalyticsQuery;
  eq: (column: string, value: string | boolean) => AnalyticsQuery;
  order: (column: string, options: { ascending: boolean }) => AnalyticsQuery;
  range: (from: number, to: number) => AnalyticsQuery;
} & PromiseLike<AnalyticsQueryResult>;

type ReadRowsResult<T> = {
  rows: T[];
  error: unknown | null;
  truncated: boolean;
};

const QUERY_PAGE_SIZE = 1000;
const MAX_QUERY_ROWS = 50_000;
const RECENT_ACTIVITY_LIMIT = 250;
const RAW_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_LOOKBACK_MS = 30 * 60 * 1000;
const FUNNEL_KEYS = ['page_view', 'service_view', 'cart_add', 'checkout_view', 'booking_received'] as const;

const numberValue = (value: unknown) => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
};

const emptyTruncation = (): AnalyticsTruncation => ({
  any: false,
  aggregate: false,
  rawEvents: false,
  recentActivity: false,
});

const emptyDashboard = (
  filters: AnalyticsDashboardFilters,
  status: AnalyticsDashboard['status'],
  note?: string,
): AnalyticsDashboard => ({
  status,
  filters,
  metricQuality: { sessions: 'exact', funnel: 'ordered_sessions' },
  truncation: emptyTruncation(),
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
  note: note || (status === 'not_configured'
    ? 'Analytics storage is not configured or has not received an aggregate yet.'
    : 'Funnel counts distinct sessions that complete each stage in order. Active time is an estimate; recent activity is limited to 250 rows.'),
});

const readRows = async <T>(makeQuery: (from: number, to: number) => AnalyticsQuery): Promise<ReadRowsResult<T>> => {
  const rows: T[] = [];
  for (let offset = 0; offset < MAX_QUERY_ROWS; offset += QUERY_PAGE_SIZE) {
    const { data, error } = await makeQuery(offset, offset + QUERY_PAGE_SIZE - 1);
    if (error) return { rows, error, truncated: rows.length > 0 };
    const page = Array.isArray(data) ? data as T[] : [];
    rows.push(...page);
    if (page.length < QUERY_PAGE_SIZE) return { rows, error: null, truncated: false };
  }
  return { rows, error: null, truncated: true };
};

const dateRange = (filters: AnalyticsDashboardFilters, includeSessionLookback = false) => ({
  from: new Date(
    Date.parse(`${filters.dateFrom}T00:00:00.000Z`)
      - (includeSessionLookback ? SESSION_LOOKBACK_MS : 0),
  ).toISOString(),
  to: `${filters.dateTo}T23:59:59.999Z`,
});

const buildAggregateQuery = (store: AnalyticsStore, filters: AnalyticsDashboardFilters, from: number, to: number) => {
  let query = store.from(ANALYTICS_DAILY_TABLE) as AnalyticsQuery;
  query = query
    .select('bucket_date,event_name,page_path,language,device_category,event_count,session_count,engaged_ms,campaign_name')
    .gte('bucket_date', filters.dateFrom)
    .lte('bucket_date', filters.dateTo)
    .order('bucket_date', { ascending: true })
    .range(from, to);
  if (filters.language) query = query.eq('language', filters.language);
  if (filters.device) query = query.eq('device_category', filters.device);
  // entry_page is a session property, not the page_path of every event.
  if (filters.campaign) query = query.eq('campaign_name', filters.campaign);
  return query;
};

const buildRawQuery = (store: AnalyticsStore, filters: AnalyticsDashboardFilters, from: number, to: number) => {
  // Entry page belongs to the session. Include the maximum anonymous-session
  // lookback so a session that started just before dateFrom is attributed correctly.
  const range = dateRange(filters, Boolean(filters.entryPage));
  let query = store.from(ANALYTICS_EVENTS_TABLE) as AnalyticsQuery;
  query = query
    .select('event_id,session_id,event_name,page_path,occurred_at,received_at,language,device_category,identifier,duration_ms,campaign_name,is_test,is_admin,is_bot')
    .gte('received_at', range.from)
    .lte('received_at', range.to)
    .eq('is_admin', false)
    .eq('is_bot', false)
    .order('received_at', { ascending: false })
    .range(from, to);
  // includeTest means include TEST traffic in addition to normal traffic.
  if (!filters.includeTest) query = query.eq('is_test', false);
  if (filters.language) query = query.eq('language', filters.language);
  if (filters.device) query = query.eq('device_category', filters.device);
  if (filters.campaign) query = query.eq('campaign_name', filters.campaign);
  // Do not filter event page_path here; entry_page is resolved per session below.
  return query;
};

const rowTime = (row: RawRow) => {
  const value = row.occurred_at || row.received_at || '';
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const rowDate = (row: RawRow) => (row.occurred_at || row.received_at || '').slice(0, 10);

const dedupeRawRows = (rows: RawRow[]) => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (!row.event_id) return true;
    if (seen.has(row.event_id)) return false;
    seen.add(row.event_id);
    return true;
  });
};

const sessionGroups = (rows: RawRow[]) => {
  const groups = new Map<string, RawRow[]>();
  for (const row of rows) {
    if (!row.session_id) continue;
    const group = groups.get(row.session_id) || [];
    group.push(row);
    groups.set(row.session_id, group);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => rowTime(a) - rowTime(b) || String(a.event_id || '').localeCompare(String(b.event_id || '')));
  }
  return groups;
};

const sessionEntryPages = (groups: Map<string, RawRow[]>) => {
  const result = new Map<string, string>();
  for (const [sessionId, group] of groups) {
    const firstPageView = group.find((row) => row.event_name === 'page_view' && row.page_path);
    const firstEvent = group.find((row) => row.page_path);
    if (firstPageView?.page_path || firstEvent?.page_path) {
      result.set(sessionId, firstPageView?.page_path || firstEvent?.page_path || '/');
    }
  }
  return result;
};

const applyEntryPageFilter = (rows: RawRow[], entryPage?: string) => {
  if (!entryPage) return rows;
  const entries = sessionEntryPages(sessionGroups(rows));
  return rows.filter((row) => row.session_id && entries.get(row.session_id) === entryPage);
};

const filterRowsToDateRange = (rows: RawRow[], filters: AnalyticsDashboardFilters) => {
  const range = dateRange(filters);
  const fromMs = Date.parse(range.from);
  const toMs = Date.parse(range.to);
  return rows.filter((row) => {
    const occurredMs = rowTime(row);
    return occurredMs >= fromMs && occurredMs <= toMs;
  });
};

const funnelForSessions = (groups: Map<string, RawRow[]>) => {
  const counts = new Map<string, number>(FUNNEL_KEYS.map((key) => [key, 0]));
  for (const group of groups.values()) {
    let stage = 0;
    for (const row of group) {
      if (row.event_name !== FUNNEL_KEYS[stage]) continue;
      counts.set(FUNNEL_KEYS[stage], (counts.get(FUNNEL_KEYS[stage]) || 0) + 1);
      stage += 1;
      if (stage === FUNNEL_KEYS.length) break;
    }
  }
  return FUNNEL_KEYS.map((key) => ({
    key,
    label: key === 'page_view' ? 'Landing / page view' : key === 'service_view' ? 'Service view' : key === 'cart_add' ? 'Cart add' : key === 'checkout_view' ? 'Checkout view' : 'Verified booking',
    count: counts.get(key) || 0,
  }));
};

const activityFromRawRows = (rows: RawRow[]) => rows
  .slice()
  .sort((a, b) => rowTime(b) - rowTime(a) || String(b.event_id || '').localeCompare(String(a.event_id || '')))
  .slice(0, RECENT_ACTIVITY_LIMIT)
  .map((row) => ({
    sessionId: row.session_id || '',
    eventName: row.event_name || 'unknown',
    pagePath: row.page_path || '/',
    occurredAt: row.occurred_at || '',
    language: row.language || 'unknown',
    deviceCategory: row.device_category || 'unknown',
    ...(row.identifier ? { identifier: row.identifier } : {}),
    ...(typeof row.duration_ms === 'number' ? { durationMs: row.duration_ms } : {}),
  }));

const buildRawDashboard = (
  filters: AnalyticsDashboardFilters,
  rows: RawRow[],
  rawTruncated: boolean,
): AnalyticsDashboard => {
  const base = emptyDashboard(filters, 'ready');
  const eventTotals = new Map<string, number>();
  const pageTotals = new Map<string, { views: number; sessions: Set<string>; engagedMs: number }>();
  const trendTotals = new Map<string, { sessions: Set<string>; events: number; conversions: number }>();
  const groups = sessionGroups(rows);

  for (const row of rows) {
    const eventName = row.event_name || 'unknown';
    eventTotals.set(eventName, (eventTotals.get(eventName) || 0) + 1);

    if (row.page_path) {
      const current = pageTotals.get(row.page_path) || { views: 0, sessions: new Set<string>(), engagedMs: 0 };
      if (eventName === 'page_view') {
        current.views += 1;
        if (row.session_id) current.sessions.add(row.session_id);
      }
      if (eventName === 'engagement_delta') current.engagedMs += numberValue(row.duration_ms);
      pageTotals.set(row.page_path, current);
    }

    const date = rowDate(row);
    if (date) {
      const current = trendTotals.get(date) || { sessions: new Set<string>(), events: 0, conversions: 0 };
      current.events += 1;
      if (eventName === 'page_view' && row.session_id) current.sessions.add(row.session_id);
      if (eventName === 'booking_received') current.conversions += 1;
      trendTotals.set(date, current);
    }
  }

  const pageViewSessions = new Set(
    rows.filter((row) => row.event_name === 'page_view' && row.session_id).map((row) => row.session_id as string),
  );
  base.overview = {
    sessions: pageViewSessions.size,
    events: rows.length,
    engagedMs: rows.filter((row) => row.event_name === 'engagement_delta').reduce((total, row) => total + numberValue(row.duration_ms), 0),
    conversions: eventTotals.get('booking_received') || 0,
  };
  base.funnel = funnelForSessions(groups);
  base.trend = Array.from(trendTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, sessions: values.sessions.size, events: values.events, conversions: values.conversions }));
  base.topPages = Array.from(pageTotals.entries())
    .sort(([, a], [, b]) => b.views - a.views)
    .slice(0, 10)
    .map(([pagePath, values]) => ({ pagePath, views: values.views, sessions: values.sessions.size, engagedMs: values.engagedMs }));
  base.topActions = Array.from(eventTotals.entries())
    .filter(([eventName]) => eventName !== 'engagement_delta')
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([eventName, count]) => ({ eventName, count }));

  const activityWasTruncated = rows.length > RECENT_ACTIVITY_LIMIT || rawTruncated;
  base.recentActivity = activityFromRawRows(rows);
  base.truncation = {
    any: rawTruncated || activityWasTruncated,
    aggregate: false,
    rawEvents: rawTruncated,
    recentActivity: activityWasTruncated,
  };
  base.metricQuality = { sessions: 'exact', funnel: 'ordered_sessions' };
  return base;
};

const buildAggregateDashboard = (
  filters: AnalyticsDashboardFilters,
  rows: DailyRow[],
  aggregateTruncated: boolean,
  note?: string,
): AnalyticsDashboard => {
  const base = emptyDashboard(
    filters,
    'ready',
    note || 'Daily aggregate rows provide event and bucket session totals; exact cross-page session dedupe and ordered funnel progression require retained raw events.',
  );
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

  base.overview = {
    // Raw events are required to dedupe a session across pages or days. This
    // fallback is retained for buckets beyond raw-event retention only.
    sessions: rows.filter((row) => row.event_name === 'page_view').reduce((total, row) => total + numberValue(row.session_count), 0),
    events: rows.reduce((total, row) => total + numberValue(row.event_count), 0),
    engagedMs: rows.reduce((total, row) => total + numberValue(row.engaged_ms), 0),
    conversions: eventTotals.get('booking_received') || 0,
  };
  base.funnel = FUNNEL_KEYS.map((key) => ({
    key,
    label: key === 'page_view' ? 'Landing / page view' : key === 'service_view' ? 'Service view' : key === 'cart_add' ? 'Cart add' : key === 'checkout_view' ? 'Checkout view' : 'Verified booking',
    count: eventTotals.get(key) || 0,
  }));
  base.metricQuality = { sessions: 'bucket_total', funnel: 'event_counts' };
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
  base.truncation = {
    any: aggregateTruncated,
    aggregate: aggregateTruncated,
    rawEvents: false,
    recentActivity: false,
  };
  return base;
};

export const getAnalyticsDashboard = async (
  store: AnalyticsStore,
  filters: AnalyticsDashboardFilters,
): Promise<AnalyticsDashboard> => {
  const aggregate = filters.includeTest
    ? { rows: [], error: null, truncated: false }
    : await readRows<DailyRow>((from, to) => buildAggregateQuery(store, filters, from, to));
  const raw = await readRows<RawRow>((from, to) => buildRawQuery(store, filters, from, to));
  const rawCoverageStart = new Date(Date.now() - RAW_RETENTION_MS).toISOString().slice(0, 10);
  const rawCoverageComplete = filters.dateFrom >= rawCoverageStart;

  if (raw.error && !raw.rows.length) {
    if (!filters.includeTest && !filters.entryPage && !aggregate.error && aggregate.rows.length) {
      return buildAggregateDashboard(filters, aggregate.rows, aggregate.truncated, 'Recent raw events are unavailable; session totals use daily bucket counts for retained aggregate data.');
    }
    return emptyDashboard(filters, 'not_configured', 'Analytics raw events are unavailable for this filter.');
  }

  const eligibleRawRows = dedupeRawRows(raw.rows).filter((row) =>
    row.is_admin !== true &&
    row.is_bot !== true &&
    (filters.includeTest === true || row.is_test !== true),
  );
  const filteredRawRows = filterRowsToDateRange(
    applyEntryPageFilter(eligibleRawRows, filters.entryPage),
    filters,
  );

  if (raw.rows.length && !rawCoverageComplete && filters.entryPage) {
    const dashboard = buildRawDashboard(filters, [], true);
    dashboard.note = 'Entry-page filtering requires raw events for the full selected period; narrow the date range to the raw-event retention window.';
    return dashboard;
  }

  if (raw.rows.length && !rawCoverageComplete && !filters.includeTest && !filters.entryPage && !aggregate.error && aggregate.rows.length) {
    return buildAggregateDashboard(filters, aggregate.rows, aggregate.truncated, 'The selected period exceeds raw-event retention; session totals use daily bucket counts and cannot dedupe a session across bucket boundaries.');
  }

  if (raw.rows.length || filters.includeTest || filters.entryPage) {
    const dashboard = buildRawDashboard(filters, filteredRawRows, raw.truncated || !rawCoverageComplete);
    if (!rawCoverageComplete) dashboard.note = 'The selected period exceeds raw-event retention; raw-event metrics cover retained raw events only.';
    if (raw.error) dashboard.note = 'Some raw analytics pages could not be read; displayed metrics are partial.';
    return dashboard;
  }

  if (aggregate.error) return emptyDashboard(filters, 'not_configured');
  return buildAggregateDashboard(filters, aggregate.rows, aggregate.truncated);
};
