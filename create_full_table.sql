-- 1. Crear la Tabla
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
  categoria text,
  miembro text -- Agregado para soportar filtro por miembro
);

-- 2. Habilitar Seguridad (RLS)
alter table public.movimientos enable row level security;

-- 3. Crear Políticas (Permisos)

-- Permitir INSERTAR (Carga de datos)
create policy "Enable insert for anon" 
on public.movimientos for insert 
with check (true);

-- Permitir LEER (Ver dashboard)
create policy "Enable read access for anon" 
on public.movimientos for select 
using (true);

-- Permitir BORRAR (Para limpiar datos)
create policy "Enable delete for anon" 
on public.movimientos for delete 
using (true);
