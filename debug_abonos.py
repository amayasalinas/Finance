import json
import collections

# Load data
try:
    with open('c:/Users/Amaya/OneDrive/Documentos/Personal/dashboard_finanzas_2025/data/movimientos.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
except Exception as e:
    print(f"Error loading file: {e}")
    exit()

print(f"Total Transactions: {len(data)}")

# Filter logic matching app.js
abono_payments = []
abono_total = 0

for t in data:
    # Safe checks
    tipo = (t.get('Tipo') or '').lower()
    cat = (t.get('Categoria') or '').lower()
    det = (t.get('Detalle') or '').lower()
    val = float(t.get('Valor') or 0)

    has_abono = 'abono' in tipo or 'abono' in cat or 'abono' in det
    is_interest = 'interes' in tipo or 'interes' in cat or 'interes' in det
    
    if has_abono and not is_interest:
        abono_payments.append(t)
        abono_total += abs(val)

print(f"\nTotal Abono Payments (Calculated): ${abono_total:,.2f}")
print(f"Count: {len(abono_payments)}")

# Group by category/detail to see what's big
grouped = collections.defaultdict(float)
for t in abono_payments:
    key = f"{t.get('Tipo')} - {t.get('Categoria')} - {t.get('Detalle')}"
    grouped[key] += abs(float(t.get('Valor') or 0))

print("\nTop Contributors to 'Abono TC':")
sorted_groups = sorted(grouped.items(), key=lambda x: x[1], reverse=True)
for k, v in sorted_groups[:10]:
    print(f"${v:,.2f} : {k}")
