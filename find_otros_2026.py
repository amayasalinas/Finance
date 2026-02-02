import pandas as pd
from category_mapping import get_category_for_merchant

EXCEL_2026 = r"C:\Users\Amaya\OneDrive\Documentos\Personal\Movimientos\movimientos_bancos_estandarizados_v2.xlsx"

def find_unclassified():
    df = pd.read_excel(EXCEL_2026, sheet_name='Consolidado')
    
    otros_counts = {}
    
    for detalle in df['Detalle']:
        detalle = str(detalle)
        cat = get_category_for_merchant(detalle)
        if cat == 'Otros':
            otros_counts[detalle] = otros_counts.get(detalle, 0) + 1
            
    # Sort by count
    sorted_otros = sorted(otros_counts.items(), key=lambda x: x[1], reverse=True)
    
    print("Top 20 Unclassified Merchants (2026):")
    for det, count in sorted_otros[:20]:
        print(f"{count} | {det}")

if __name__ == "__main__":
    find_unclassified()
