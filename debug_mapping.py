from category_mapping import get_category_for_merchant

test_cases = [
    "Luis Antonio Amaya Salinas",
    "NOVAVENTA BOG CODIGO",
    "Novaventa BOG",
    "CREPES Y WAFFLES",
    "ALIANZA FIDUCIARIA S.A. FIDEI",
    "   CREPES Y WAFFLES   ",  # Test whitespace
]

print(f"{'MERCHANT':<40} | {'CATEGORY':<20}")
print("-" * 60)

for merchant in test_cases:
    cat = get_category_for_merchant(merchant)
    print(f"{merchant:<40} | {cat:<20}")
