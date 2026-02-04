import requests

SUPABASE_URL = 'https://iikarklhudhsfvkhhyub.supabase.co'
SUPABASE_KEY = 'sb_publishable_PIdI08dSRTLPVauDLxX6Hg_yMEsxwU-'

# Get all IDs first
get_url = f'{SUPABASE_URL}/rest/v1/movimientos?select=id'
headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
}
response = requests.get(get_url, headers=headers)
records = response.json()
print(f'Total registros encontrados: {len(records)}')

# Delete each one
delete_headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Prefer': 'return=minimal'
}
deleted = 0
for record in records:
    del_url = f"{SUPABASE_URL}/rest/v1/movimientos?id=eq.{record['id']}"
    del_response = requests.delete(del_url, headers=delete_headers)
    if del_response.status_code in [200, 204]:
        deleted += 1

print(f'Registros eliminados: {deleted}')
