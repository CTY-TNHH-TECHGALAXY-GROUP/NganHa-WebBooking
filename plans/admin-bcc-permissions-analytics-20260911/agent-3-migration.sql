-- Agent 3 draft only. Do not run in production from this file.
-- Review table names, ownership, service_role grants, and pg_cron availability
-- with the integrator before applying.

create table if not exists public."WebbookingAnalyticsEvents" (
  event_id text primary key,
  schema_version text not null,
  event_name text not null check (event_name in (
    'page_view', 'service_view', 'service_option_select', 'cart_add',
    'cart_remove', 'cart_open', 'checkout_view', 'booking_submit',
    'booking_received', 'booking_failed', 'contact_click',
    'language_change', 'hero_video_started', 'hero_video_failed',
    'engagement_delta'
  )),
  session_id uuid not null,
  page_path text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  language text not null check (language in ('vi', 'en', 'cn', 'jp', 'kr', 'unknown')),
  device_category text not null check (device_category in ('mobile', 'tablet', 'desktop', 'unknown')),
  identifier text,
  duration_ms integer check (duration_ms is null or (duration_ms >= 0 and duration_ms <= 60000)),
  campaign jsonb not null default '{}'::jsonb check (jsonb_typeof(campaign) = 'object'),
  campaign_name text not null default '',
  traffic_source text check (traffic_source is null or traffic_source in ('direct', 'organic_search', 'ai_referral', 'social', 'referral', 'unknown')),
  source text not null check (source in ('client', 'server')),
  conversion_key text unique,
  is_test boolean not null default false,
  is_bot boolean not null default false,
  is_admin boolean not null default false,
  constraint webbooking_analytics_conversion_server_only check (
    (event_name = 'booking_received' and source = 'server' and conversion_key is not null)
    or (event_name <> 'booking_received' and conversion_key is null)
  )
);

create index if not exists "WebbookingAnalyticsEvents_received_at_idx"
  on public."WebbookingAnalyticsEvents" (received_at desc);
create index if not exists "WebbookingAnalyticsEvents_session_id_idx"
  on public."WebbookingAnalyticsEvents" (session_id, received_at desc);
create index if not exists "WebbookingAnalyticsEvents_event_name_idx"
  on public."WebbookingAnalyticsEvents" (event_name, received_at desc);

create table if not exists public."WebbookingAnalyticsDaily" (
  bucket_date date not null,
  event_name text not null,
  page_path text not null,
  language text not null,
  device_category text not null,
  campaign_name text not null default '',
  event_count bigint not null default 0,
  session_count bigint not null default 0,
  engaged_ms bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (bucket_date, event_name, page_path, language, device_category, campaign_name)
);

create index if not exists "WebbookingAnalyticsDaily_bucket_date_idx"
  on public."WebbookingAnalyticsDaily" (bucket_date desc);

alter table public."WebbookingAnalyticsEvents" enable row level security;
alter table public."WebbookingAnalyticsDaily" enable row level security;
revoke all on public."WebbookingAnalyticsEvents" from anon, authenticated;
revoke all on public."WebbookingAnalyticsDaily" from anon, authenticated;

create or replace function public.webbooking_analytics_maintain()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."WebbookingAnalyticsDaily" (
    bucket_date, event_name, page_path, language, device_category,
    campaign_name, event_count, session_count, engaged_ms, updated_at
  )
  select
    (received_at at time zone 'UTC')::date,
    event_name,
    page_path,
    language,
    device_category,
    campaign_name,
    count(*)::bigint,
    count(distinct session_id)::bigint,
    coalesce(sum(case when event_name = 'engagement_delta' then duration_ms else 0 end), 0)::bigint,
    now()
  from public."WebbookingAnalyticsEvents"
  where received_at >= now() - interval '13 months'
    and is_test = false
    and is_bot = false
    and is_admin = false
  group by 1, 2, 3, 4, 5, 6
  on conflict (bucket_date, event_name, page_path, language, device_category, campaign_name)
  do update set
    event_count = excluded.event_count,
    session_count = excluded.session_count,
    engaged_ms = excluded.engaged_ms,
    updated_at = now();

  delete from public."WebbookingAnalyticsEvents"
  where received_at < now() - interval '30 days';

  delete from public."WebbookingAnalyticsDaily"
  where bucket_date < (current_date - interval '12 months')::date;
end;
$$;

revoke all on function public.webbooking_analytics_maintain() from public;
grant execute on function public.webbooking_analytics_maintain() to service_role;

-- Schedule pruning/aggregation when pg_cron is approved and enabled. Dynamic
-- SQL keeps this draft installable on projects that do not expose pg_cron.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    execute 'select cron.schedule(''webbooking-analytics-maintain'', ''15 * * * *'', ''select public.webbooking_analytics_maintain();'')';
  end if;
end;
$$;
