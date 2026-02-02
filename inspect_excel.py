import pandas as pd

EXCEL_PATH = r"C:\Users\Amaya\OneDrive\Documentos\Personal\Movimientos\movimientos_bancos_estandarizados_v2.xlsx"

try:
    df = pd.read_excel(EXCEL_PATH, sheet_name='Consolidado')
    print("Columns found in Excel:")
    print(df.columns.tolist())
    
    # Show first few rows of the category column if it exists
    possible_cols = [c for c in df.columns if 'cat' in c.lower()]
    if possible_cols:
        print(f"\nSample data for {possible_cols[0]}:")
        print(df[possible_cols[0]].head())
    else:
        print("\nNo specific 'Category' column found.")
        
except Exception as e:
    print(f"Error: {e}")
