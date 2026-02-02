import json
import pandas as pd
import csv
import os
import re
from category_mapping import get_category_for_merchant

# Inputs
CSV_2025 = r"C:\Users\Amaya\OneDrive\Documentos\Personal\movimientos_bancarios_2025_claude_v2.csv"
# Pointing to v1 file which has the 'Categoria ' column (User updated version)
EXCEL_2026 = r"C:\Users\Amaya\OneDrive\Documentos\Personal\Movimientos\movimientos_bancos_estandarizados.xlsx"
OUTPUT_FILE = r"C:\Users\Amaya\OneDrive\Documentos\Personal\dashboard_finanzas_2025\data\movimientos.json"

def clean_currency(value_str):
    """Convierte string de moneda a float (Legacy for CSV)."""
    if not value_str or value_str == "N/A": return 0.0
    cleaned = value_str.replace("$", "").replace(" ", "").strip()
    if not cleaned: return 0.0
    
    # Patrón europeo: "1.800,00"
    if re.search(r'\d+\.\d{3}', cleaned) and ',' in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif cleaned.endswith(",00"):
        cleaned = cleaned.replace(",", ".")
    else:
        cleaned = cleaned.replace(",", "")
    
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def process_2025_csv():
    """Reads 2025 Email Data from CSV."""
    print(f"Reading 2025 Data: {CSV_2025}...")
    movimientos = []
    if not os.path.exists(CSV_2025):
        print(f"⚠️ Warning: 2025 File not found.")
        return []
        
    try:
        with open(CSV_2025, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                valor = clean_currency(row['Valor'])
                fecha_full = row['Día de la transacción']
                fecha_date = fecha_full.split(' ')[0] if ' ' in fecha_full else fecha_full
                detalle = row['Detalle']
                
                # Logic for Debit *2186 legacy
                prod_num = row.get('Número producto', '').strip()
                producto_nombre = row['Producto']
                if not prod_num or prod_num == 'N/A':
                    prod_num = '*2186'
                    if producto_nombre == 'N/A' or not producto_nombre:
                        producto_nombre = 'Tarjeta Débito'

                movimiento = {
                    "banco": row['Banco'],
                    "tipo": row['Tipo de transacción'],
                    "valor": valor,
                    "fecha": fecha_date,
                    "producto": producto_nombre,
                    "numero_producto": prod_num,
                    "detalle": detalle,
                    "categoria": get_category_for_merchant(detalle)
                }
                movimientos.append(movimiento)
    except Exception as e:
        print(f"Error processing 2025 CSV: {e}")
        
    return movimientos

def process_2026_excel():
    """Reads 2026 Bank Data from Excel (User Updated)."""
    print(f"Reading 2026 Data: {EXCEL_2026}...")
    movimientos = []
    if not os.path.exists(EXCEL_2026):
        print(f"⚠️ Warning: 2026 File not found.")
        return []

    try:
        df = pd.read_excel(EXCEL_2026, sheet_name='Consolidado')
        df['Fecha'] = df['Fecha'].astype(str).str.slice(0, 10)
        
        # Identify Category Column (User added 'Categoria ' with space?)
        cat_col = None
        if 'Categoria ' in df.columns:
            cat_col = 'Categoria '
        elif 'Categoria' in df.columns:
            cat_col = 'Categoria'
            
        print(f"Using Category Column: {cat_col if cat_col else 'None (Auto-mapping)'}")
        
        for _, row in df.iterrows():
            detalle = str(row['Detalle'])
            banco = str(row['Banco'])
            
            # Determine Category
            categoria = 'Otros'
            if cat_col:
                user_cat = str(row[cat_col]).strip()
                if user_cat and user_cat.lower() != 'nan':
                    categoria = user_cat
            
            # Fallback to auto-mapping if User Category is missing/Other
            if categoria == 'Otros' or categoria == 'nan':
                categoria = get_category_for_merchant(detalle)

            # Infer Product/Number (Missing in v1 file)
            producto = ''
            numero = ''
            
            if 'Bancolombia' in banco:
                producto = 'Cuenta Bancolombia'
                numero = '' # User didn't provide number in v1
            elif 'Itaú' in banco or 'Itau' in banco:
                producto = 'Tarjeta Crédito'
                numero = '*7729' # Inferred
            else:
                # Try to use columns if they exist (unlikely in v1)
                producto = str(row.get('Producto', ''))
                numero = str(row.get('Numero', ''))

            movimiento = {
                "banco": banco,
                "tipo": str(row['Tipo']),
                "valor": abs(float(row['Valor'])), # Force positive
                "fecha": str(row['Fecha']),
                "producto": producto,
                "numero_producto": numero if pd.notna(numero) else '',
                "detalle": detalle,
                "categoria": categoria
            }
            movimientos.append(movimiento)
    except Exception as e:
        print(f"❌ Error reading Excel: {e}")
    
    return movimientos

def process_data():
    all_movimientos = []
    category_stats = {}
    
    # 1. Process 2025 (Email)
    data_2025 = process_2025_csv()
    all_movimientos.extend(data_2025)
    
    # 2. Process 2026 (Bank Excel)
    data_2026 = process_2026_excel()
    all_movimientos.extend(data_2026)
    
    # Calc Stats
    for m in all_movimientos:
        cat = m['categoria']
        category_stats[cat] = category_stats.get(cat, 0) + 1

    # Save
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_movimientos, f, ensure_ascii=False, indent=2)
        
    print(f"✅ Total Procesados: {len(all_movimientos)} (2025: {len(data_2025)} + 2026: {len(data_2026)})")
    
    print("\n📊 Categorías Globales:")
    for cat, count in sorted(category_stats.items(), key=lambda x: -x[1]):
        pct = count / len(all_movimientos) * 100
        print(f"   {cat}: {count} ({pct:.1f}%)")

if __name__ == "__main__":
    process_data()
