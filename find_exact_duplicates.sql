-- ========================================
-- STRICTER DUPLICATE DETECTION SCRIPT
-- ========================================
-- This script finds EXACT duplicates by fecha + valor + detalle

-- Step 1: Count duplicates (exact matches only)
SELECT 
    COUNT(*) FILTER (WHERE duplicate_count > 1) as total_duplicate_transactions,
    SUM(CASE WHEN duplicate_count > 1 THEN duplicate_count - 1 ELSE 0 END) as extra_copies
FROM (
    SELECT 
        fecha,
        valor,
        detalle,
        COUNT(*) as duplicate_count
    FROM movimientos
    WHERE family_id = 'default'
    GROUP BY fecha, valor, detalle
) subquery;

-- Step 2: Show groups with duplicates
SELECT 
    fecha,
    valor,
    detalle,
    categoria,
    COUNT(*) as copies,
    ARRAY_AGG(id ORDER BY created_at) as all_ids,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM movimientos
WHERE family_id = 'default'
GROUP BY fecha, valor, detalle, categoria
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, fecha DESC
LIMIT 20;

-- Step 3: Delete duplicates (UNCOMMENT to execute)
-- This keeps the OLDEST copy (first created_at) and deletes newer ones
/*
DELETE FROM movimientos
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY fecha, valor, detalle 
                ORDER BY created_at ASC
            ) as row_num
        FROM movimientos
        WHERE family_id = 'default'
    ) ranked
    WHERE row_num > 1
);
*/

-- Step 4: Verify no duplicates remain
/*
SELECT 
    fecha,
    valor,
    detalle,
    COUNT(*) as count
FROM movimientos
WHERE family_id = 'default'
GROUP BY fecha, valor, detalle
HAVING COUNT(*) > 1;
*/
