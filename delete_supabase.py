import requests

SUPABASE_URL = 'https://iikarklhudhsfvkhhyub.supabase.co'
SUPABASE_KEY = 'sb_publishable_PIdI08dSRTLPVauDLxX6Hg_yMEsxwU-'

def delete_all():
    print("🗑️ Deleting all records from 'movimientos'...")
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Prefer': 'return=representation' # To get count of deleted rows
    }
    
    # Filter to match all records (id is distinct from null)
    del_url = f"{SUPABASE_URL}/rest/v1/movimientos?id=not.is.null"
    
    try:
        response = requests.delete(del_url, headers=headers)
        
        if response.status_code in [200, 204]:
            data = response.json()
            # If RLS blocks delete, this might be empty list []
            if not data and response.headers.get('Content-Range') != '0-0/*':
                 # If no content returned, we can't be sure 100% without checking count before/after, 
                 # but usually [] means 0 deleted if representation was requested.
                 pass
            print(f"✅ Executed delete request. Rows returned: {len(data)}")
            if len(data) == 0:
                print("⚠️ Warning: 0 records deleted. Check RLS policies if you expected data to be deleted.")
        else:
            print(f"❌ Error deleting records: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    delete_all()
