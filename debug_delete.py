import requests

SUPABASE_URL = 'https://iikarklhudhsfvkhhyub.supabase.co'
SUPABASE_KEY = 'sb_publishable_PIdI08dSRTLPVauDLxX6Hg_yMEsxwU-'

ID_TO_DELETE = "4c259015-a0e8-409e-a852-c2" # Partial ID from logs, need full ID?
# Wait, the logs cut off the ID. "c2..."
# I need to get a real ID first.

def debug_delete():
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Prefer': 'return=representation'
    }
    
    # 1. Get one ID
    print("Fetching one ID...")
    resp = requests.get(f"{SUPABASE_URL}/rest/v1/movimientos?limit=1&select=id", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to fetch: {resp.status_code}")
        return
        
    records = resp.json()
    if not records:
        print("No records found.")
        return
        
    target_id = records[0]['id']
    print(f"Targeting ID: {target_id}")
    
    # 2. Try to delete it
    print(f"Attempting to delete {target_id}...")
    del_url = f"{SUPABASE_URL}/rest/v1/movimientos?id=eq.{target_id}"
    del_resp = requests.delete(del_url, headers=headers)
    
    if del_resp.status_code in [200, 204]:
         if del_resp.content:
             print("Success response:", del_resp.json())
         else:
             print("Success (No Content)")
    else:
        print(f"Delete Failed: {del_resp.status_code} - {del_resp.text}")

if __name__ == "__main__":
    debug_delete()
