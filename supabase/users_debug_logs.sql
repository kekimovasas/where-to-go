create table if not exists public.users_debug_logs (
  id bigint generated always as identity primary key,
  telegram_id bigint,
  step text not null,
  payload jsonb,
  error jsonb,
  created_at timestamptz not null default now()
);

create index if not exists users_debug_logs_telegram_id_created_at_idx
on public.users_debug_logs (telegram_id, created_at desc);

alter table public.users_debug_logs enable row level security;

drop policy if exists "Mini App can create user debug logs"
on public.users_debug_logs;

create policy "Mini App can create user debug logs"
on public.users_debug_logs
for insert
to anon, authenticated
with check (true);

grant insert on table public.users_debug_logs to anon, authenticated;
grant usage, select on sequence public.users_debug_logs_id_seq to anon, authenticated;

comment on table public.users_debug_logs is
'Temporary diagnostics for Telegram user synchronization. Remove after the issue is resolved.';
