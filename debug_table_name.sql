-- PASO 1: Ejecuta esto primero para ver el nombre real de tu tabla
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- PASO 2: Dependiendo del resultado, usa una de estas opciones:

-- OPCIÓN A (Si la tabla se llama 'movimientos' todo minúscula)
create policy "Enable delete for anon" 
on public.movimientos
for delete 
using (true);

-- OPCIÓN B (Si la tabla se llama 'Movimientos' con mayúscula)
-- create policy "Enable delete for anon" 
-- on public."Movimientos" 
-- for delete 
-- using (true);
