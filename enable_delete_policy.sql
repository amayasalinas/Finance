-- RUN THIS IN SUPABASE SQL EDITOR
-- Esto permite que el script delete_supabase.py (usando la Anon Key) pueda borrar registros.

create policy "Enable delete for anon" 
on public.movimientos 
for delete 
using (true);
