-- Senior Year Build storage. Tables live in a private schema the API cannot reach.
-- The only way in is sy_pull and sy_push, and both need a valid access code.
-- Access codes are stored as hashes and are never kept in this repo.
create schema if not exists senior_year;
revoke all on schema senior_year from public, anon, authenticated;

create table senior_year.access (
  code_hash text primary key,
  role text not null check (role in ('athlete', 'coach'))
);

create table senior_year.records (
  id text primary key,
  kind text not null,
  data jsonb not null,
  deleted boolean not null default false,
  by text not null,
  updated_at timestamptz not null default clock_timestamp()
);
create index records_updated_at on senior_year.records (updated_at);

alter table senior_year.access enable row level security;
alter table senior_year.records enable row level security;

create function senior_year.role_for(p_code text) returns text
language sql stable security definer set search_path = ''
as $$
  select role from senior_year.access
  where code_hash = encode(sha256(convert_to(p_code, 'UTF8')), 'hex')
$$;

create function public.sy_pull(p_code text, p_since timestamptz default null) returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_role text := senior_year.role_for(p_code);
begin
  if v_role is null then
    return json_build_object('role', null);
  end if;
  return json_build_object(
    'role', v_role,
    'now', clock_timestamp(),
    'rows', coalesce((
      select json_agg(r) from (
        select id, kind, data, deleted, by, updated_at
        from senior_year.records
        where p_since is null or updated_at > p_since - interval '10 seconds'
      ) r
    ), '[]'::json)
  );
end
$$;

create function public.sy_push(p_code text, p_rows jsonb) returns json
language plpgsql security definer set search_path = ''
as $$
declare
  v_role text := senior_year.role_for(p_code);
  v_row jsonb;
begin
  if v_role is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then
    return json_build_object('ok', false);
  end if;
  for v_row in select value from jsonb_array_elements(p_rows) loop
    if length(v_row->>'id') > 120 or pg_column_size(v_row->'data') > 200000 then
      continue;
    end if;
    insert into senior_year.records (id, kind, data, deleted, by, updated_at)
    values (
      v_row->>'id', v_row->>'kind', v_row->'data',
      coalesce((v_row->>'deleted')::boolean, false), v_role, clock_timestamp()
    )
    on conflict (id) do update set
      kind = excluded.kind, data = excluded.data, deleted = excluded.deleted,
      by = excluded.by, updated_at = excluded.updated_at;
  end loop;
  return json_build_object('ok', true);
end
$$;

revoke all on function senior_year.role_for(text) from public, anon, authenticated;
revoke all on function public.sy_pull(text, timestamptz) from public, anon, authenticated;
revoke all on function public.sy_push(text, jsonb) from public, anon, authenticated;
grant execute on function public.sy_pull(text, timestamptz) to anon;
grant execute on function public.sy_push(text, jsonb) to anon;
