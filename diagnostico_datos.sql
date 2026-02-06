-- Diagnóstico de Datos en Supabase
-- Ejecuta esto en el SQL Editor de Supabase para ver qué datos existen

-- 1. Ver cuántos registros hay por family_id
SELECT 
    family_id, 
    COUNT(*) as total_transacciones,
    MIN(fecha) as fecha_primera,
    MAX(fecha) as fecha_ultima,
    SUM(CASE WHEN tipo IN ('Depósito', 'Transferencia Recibida', 'Ingreso', 'Sueldo', 'Salario') THEN 1 ELSE 0 END) as ingresos_count,
    SUM(CASE WHEN tipo IN ('Compra', 'Retiro', 'Débito', 'Gasto', 'Pago', 'Cargo') THEN 1 ELSE 0 END) as gastos_count
FROM movimientos
GROUP BY family_id
ORDER BY family_id;

-- 2. Ver los primeros 10 registros de 'default'
SELECT *
FROM movimientos
WHERE family_id = 'default'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ver si hay datos en otros family_ids
SELECT DISTINCT family_id
FROM movimientos
ORDER BY family_id;
