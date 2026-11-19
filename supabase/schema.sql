-- Noa Cosmetics: מאגר הנתונים (Supabase / Postgres)
-- מריצים פעם אחת ב-Supabase: SQL Editor → מדביקים → Run.
-- כל הטבלאות נעולות (RLS בלי הרשאות): רק השרת, עם המפתח הסודי, יכול לקרוא ולכתוב.

create table if not exists content (
  key   text primary key,
  value text not null default ''
);

create table if not exists bookings (
  key      text primary key check (key ~ '^\d{4}-\d{2}-\d{2}_\d{2}:00$'),  -- 2026-12-25_14:00, ייחודי = אין תור כפול
  service  text not null,
  name     text not null,
  phone    text not null default '',
  email    text not null default '',
  source   text not null default 'site',          -- site / admin / import
  event_id text,                                   -- האירוע ביומן גוגל
  reminded timestamptz,
  created  timestamptz not null default now()
);
create index if not exists bookings_phone on bookings (phone);

create table if not exists cancelled (
  id        bigserial primary key,
  key       text not null,
  service   text, name text, phone text, email text,
  created   timestamptz,
  cancelled timestamptz not null default now()
);

create table if not exists blocks (
  key     text primary key check (key ~ '^\d{4}-\d{2}-\d{2}(_\d{2}:00)?$'),   -- יום שלם או שעה אחת
  note    text not null default '',
  created timestamptz not null default now()
);

create table if not exists sessions     (hash text primary key, exp timestamptz not null);
create table if not exists login_tokens (hash text primary key, exp timestamptz not null);
create table if not exists secrets      (key  text primary key, value text not null);
create table if not exists counters     (k text primary key, n int not null default 0, reset_at timestamptz not null);

-- מונה עם חלון זמן: מחזיר true ומוסיף 1, או false אם הגיע למקסימום
create or replace function hit(p_k text, p_max int, p_secs int) returns boolean
language plpgsql security definer set search_path = public as $$
declare cur counters;
begin
  insert into counters (k, n, reset_at) values (p_k, 0, now() + make_interval(secs => p_secs))
  on conflict (k) do nothing;
  select * into cur from counters where k = p_k for update;
  if cur.reset_at < now() then
    update counters set n = 1, reset_at = now() + make_interval(secs => p_secs) where k = p_k;
    return true;
  end if;
  if cur.n >= p_max then return false; end if;
  update counters set n = n + 1 where k = p_k;
  return true;
end $$;

alter table content      enable row level security;
alter table bookings     enable row level security;
alter table cancelled    enable row level security;
alter table blocks       enable row level security;
alter table sessions     enable row level security;
alter table login_tokens enable row level security;
alter table secrets      enable row level security;
alter table counters     enable row level security;
revoke execute on function hit(text, int, int) from public, anon, authenticated;

-- רק לשרת (service_role) יש גישה. האתר הציבורי (anon) לא רואה כלום.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on function hit(text, int, int) to service_role;
revoke all on all tables in schema public from anon, authenticated;
