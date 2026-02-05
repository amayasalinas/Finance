-- 1. Agregar columna 'family_id' a la tabla de movimientos
-- Por defecto 'default' para que los datos actuales sean de la familia principal.
alter table public.movimientos 
add column if not exists family_id text default 'default';

-- 2. Crear tabla de miembros de familia
create table if not exists public.family_members (
    id uuid default gen_random_uuid() primary key,
    family_id text not null,
    name text not null,
    initials text,
    color text,
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar seguridad en nueva tabla
alter table public.family_members enable row level security;

-- 4. Crear políticas para la tabla de miembros (Permiso total para demo)
create policy "Enable all for anon (members)" 
on public.family_members 
for all 
using (true) 
with check (true);

-- 5. Insertar miembros por defecto (Para migrarlos de config.js a BD)
-- Solo se insertan si está vacía para esa familia.
insert into public.family_members (family_id, name, initials, color)
select 'default', 'Isa', 'I', 'bg-purple-500'
where not exists (select 1 from public.family_members where family_id = 'default');

insert into public.family_members (family_id, name, initials, color)
select 'default', 'Sebas', 'S', 'bg-blue-500'
where not exists (select 1 from public.family_members where family_id = 'default' and name = 'Sebas');

insert into public.family_members (family_id, name, initials, color)
select 'default', 'Fabio', 'F', 'bg-green-500'
where not exists (select 1 from public.family_members where family_id = 'default' and name = 'Fabio');
