-- ========================================
-- SCRIPT TO IDENTIFY AND REMOVE DUPLICATE TRANSACTIONS
-- ========================================
-- WARNING: This will permanently delete duplicate records
-- BACKUP your data before running this script!

-- Step 1: VIEW duplicates (run this first to verify)
WITH duplicates AS (
    SELECT 
        id,
        fecha,
        tipo,
        valor,
        categoria,
        detalle,
        banco,
        producto,
        miembro,
        family_id,
        ROW_NUMBER() OVER (
            PARTITION BY fecha, valor, detalle, categoria, banco, miembro, family_id 
            ORDER BY created_at ASC  -- Keep the oldest record
        ) as row_num
    FROM movimientos
    WHERE family_id = 'default'
)
SELECT 
    COUNT(*) as total_duplicates,
    SUM(CASE WHEN row_num = 1 THEN 0 ELSE valor END) as total_duplicated_value
FROM duplicates
WHERE row_num > 1;

-- Step 2: SEE examples of duplicates (first 20)
WITH duplicates AS (
    SELECT 
        id,
        fecha,
        tipo,
        valor,
        categoria,
        detalle,
        banco,
        miembro,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY fecha, valor, detalle, categoria, banco, miembro, family_id 
            ORDER BY created_at ASC
        ) as row_num
    FROM movimientos
    WHERE family_id = 'default'
)
SELECT * FROM duplicates
WHERE row_num > 1
ORDER BY fecha DESC, valor DESC
LIMIT 20;

-- Step 3: DELETE duplicates (CAREFUL!)
-- Uncomment the following block ONLY after verifying the above queries

/*
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY fecha, valor, detalle, categoria, banco, miembro, family_id 
            ORDER BY created_at ASC  -- Keep the oldest record
        ) as row_num
    FROM movimientos
    WHERE family_id = 'default'
)
DELETE FROM movimientos
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);
*/

-- Step 4: Verify after deletion
-- Run this to confirm only unique records remain
/*
SELECT 
    fecha, 
    valor, 
    detalle,
    categoria,
    COUNT(*) as count
FROM movimientos
WHERE family_id = 'default'
GROUP BY fecha, valor, detalle, categoria
HAVING COUNT(*) > 1;
*/
