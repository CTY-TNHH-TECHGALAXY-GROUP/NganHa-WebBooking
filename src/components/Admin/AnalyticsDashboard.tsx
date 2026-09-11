'use client';

import { useCallback, useEffect, useState } from 'react';

type Dashboard = {
  status: 'ready' | 'not_configured';
  overview: { sessions: number; events: number; engagedMs: number; conversions: number };
  funnel: Array<{ key: string; label: string; count: number }>;
  trend: Array<{ date: string; sessions: number; events: number; conversions: number }>;
  topPages: Array<{ pagePath: string; views: number; sessions: number; engagedMs: number }>;
  topActions: Array<{ eventName: string; count: number }>;
  recentActivity: Array<{ sessionId: string; eventName: string; pagePath: string; occurredAt: string; language: string; deviceCategory: string; identifier?: string; durationMs?: number }>;
  note: string;
};

const initialFilters = {
  date_from: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  date_to: new Date().toISOString().slice(0, 10),
  language: '',
  device: '',
  entry_page: '',
};

const formatMinutes = (milliseconds: number) => `${Math.round(milliseconds / 60000)} min`;

export default function AnalyticsDashboard() {
  const [filters, setFilters] = useState(initialFilters);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => Boolean(value)));
      const response = await fetch(`/api/admin/analytics?${query.toString()}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message || 'Unable to load analytics');
      setDashboard(body.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load analytics');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div className="min-h-screen bg-admin-bg p-4 lg:p-8 text-admin-text">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-admin-gold">First-party analytics</p>
            <h1 className="text-2xl lg:text-3xl font-bold mt-2">Customer journey</h1>
            <p className="text-sm text-admin-text-dim mt-2">Anonymous sessions, recent activity, and verified booking conversion.</p>
          </div>
          <button type="button" onClick={() => void load()} className="border border-admin-line-strong px-4 py-2 text-sm hover:border-admin-gold transition-colors" aria-label="Refresh analytics">Refresh</button>
        </header>

        <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-admin-panel border border-admin-line p-4" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <label className="text-xs text-admin-text-dim">From<input className="mt-1 w-full bg-admin-bg border border-admin-line p-2 text-sm text-admin-text" type="date" value={filters.date_from} onChange={(event) => setFilters({ ...filters, date_from: event.target.value })} /></label>
          <label className="text-xs text-admin-text-dim">To<input className="mt-1 w-full bg-admin-bg border border-admin-line p-2 text-sm text-admin-text" type="date" value={filters.date_to} onChange={(event) => setFilters({ ...filters, date_to: event.target.value })} /></label>
          <label className="text-xs text-admin-text-dim">Language<select className="mt-1 w-full bg-admin-bg border border-admin-line p-2 text-sm text-admin-text" value={filters.language} onChange={(event) => setFilters({ ...filters, language: event.target.value })}><option value="">All</option><option value="vi">vi</option><option value="en">en</option><option value="cn">cn</option><option value="jp">jp</option><option value="kr">kr</option></select></label>
          <label className="text-xs text-admin-text-dim">Device<select className="mt-1 w-full bg-admin-bg border border-admin-line p-2 text-sm text-admin-text" value={filters.device} onChange={(event) => setFilters({ ...filters, device: event.target.value })}><option value="">All</option><option value="mobile">Mobile</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option></select></label>
          <label className="text-xs text-admin-text-dim">Entry page<input className="mt-1 w-full bg-admin-bg border border-admin-line p-2 text-sm text-admin-text" placeholder="/" value={filters.entry_page} onChange={(event) => setFilters({ ...filters, entry_page: event.target.value })} /></label>
          <button type="submit" className="sm:col-span-2 lg:col-span-5 justify-self-start bg-admin-gold text-[#241804] px-4 py-2 text-sm font-semibold">Apply filters</button>
        </form>

        {loading && <p className="text-sm text-admin-text-dim">Loading analytics...</p>}
        {error && <p className="border border-red-400/30 bg-red-950/20 p-4 text-sm text-red-200">{error}</p>}
        {dashboard && (
          <>
            {dashboard.status === 'not_configured' && <p className="border border-admin-gold/30 bg-admin-panel p-4 text-sm text-admin-text-dim">{dashboard.note}</p>}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Sessions', dashboard.overview.sessions.toLocaleString()],
                ['Events', dashboard.overview.events.toLocaleString()],
                ['Estimated engaged', formatMinutes(dashboard.overview.engagedMs)],
                ['Verified bookings', dashboard.overview.conversions.toLocaleString()],
              ].map(([label, value]) => <article key={label} className="bg-admin-panel border border-admin-line p-4"><p className="text-xs text-admin-text-dim">{label}</p><strong className="block text-2xl mt-2 text-admin-gold">{value}</strong></article>)}
            </section>

            <section className="grid lg:grid-cols-2 gap-6">
              <article className="bg-admin-panel border border-admin-line p-5"><h2 className="font-semibold mb-4">Funnel</h2><div className="space-y-3">{dashboard.funnel.map((step) => <div key={step.key} className="flex items-center justify-between text-sm"><span>{step.label}</span><strong>{step.count.toLocaleString()}</strong></div>)}</div></article>
              <article className="bg-admin-panel border border-admin-line p-5"><h2 className="font-semibold mb-4">Top actions</h2><div className="space-y-3">{dashboard.topActions.map((action) => <div key={action.eventName} className="flex items-center justify-between text-sm"><span className="font-mono text-xs">{action.eventName}</span><strong>{action.count.toLocaleString()}</strong></div>)}</div></article>
            </section>

            <section className="bg-admin-panel border border-admin-line p-5"><h2 className="font-semibold mb-4">Daily trend</h2><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-admin-text-dim"><tr><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Sessions</th><th className="py-2 pr-3">Events</th><th className="py-2">Verified bookings</th></tr></thead><tbody>{dashboard.trend.map((day) => <tr key={day.date} className="border-t border-admin-line"><td className="py-2 pr-3">{day.date}</td><td className="py-2 pr-3">{day.sessions.toLocaleString()}</td><td className="py-2 pr-3">{day.events.toLocaleString()}</td><td className="py-2">{day.conversions.toLocaleString()}</td></tr>)}</tbody></table></div></section>

            <section className="grid lg:grid-cols-2 gap-6">
              <article className="bg-admin-panel border border-admin-line p-5"><h2 className="font-semibold mb-4">Most viewed pages</h2><div className="space-y-3">{dashboard.topPages.map((page) => <div key={page.pagePath} className="flex items-center justify-between gap-4 text-sm"><span className="font-mono text-xs truncate">{page.pagePath}</span><strong>{page.views.toLocaleString()}</strong></div>)}</div></article>
              <article className="bg-admin-panel border border-admin-line p-5"><h2 className="font-semibold mb-4">Recent activity</h2><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-admin-text-dim"><tr><th className="py-2 pr-3">Time</th><th className="py-2 pr-3">Action</th><th className="py-2 pr-3">Page</th><th className="py-2">Session</th></tr></thead><tbody>{dashboard.recentActivity.map((activity, index) => <tr key={`${activity.sessionId}-${activity.occurredAt}-${index}`} className="border-t border-admin-line"><td className="py-2 pr-3 whitespace-nowrap">{new Date(activity.occurredAt).toLocaleTimeString()}</td><td className="py-2 pr-3 font-mono">{activity.eventName}</td><td className="py-2 pr-3 font-mono">{activity.pagePath}</td><td className="py-2 font-mono">{activity.sessionId.slice(0, 8)}</td></tr>)}</tbody></table></div></article>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
