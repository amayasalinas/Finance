-- SQL para crear la tabla de movimientos en Supabase

create table public.movimientos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  fecha date not null,
  detalle text,
  banco text,
  producto text,
  numero_producto text,
  valor numeric,
  tipo text,
  categoria text
);

-- Habilitar Row Level Security (RLS)
alter table public.movimientos enable row level security;

-- Política para permitir INSERT a cualquier usuario anónimo (para la carga inicial)
-- IMPORTANTE: Desactivar o restringir después de la carga inicial si es necesario.
create policy "Enable insert for anon (public)" 
on public.movimientos for insert 
with check (true);

-- Política para permitir SELECT (para que el Dashboard lea datos)
create policy "Enable read access for all users" 
on public.movimientos for select 
using (true);
