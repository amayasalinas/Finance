import requests
import json

SUPABASE_URL = "https://iikarklhudhsfvkhhyub.supabase.co"
SUPABASE_KEY = "sb_publishable_PIdI08dSRTLPVauDLxX6Hg_yMEsxwU-" 
TABLE_NAME = "movimientos"

def test_fetch():
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}?select=*"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Status: {response.status_code}")
            print(f"📊 Records retrieved: {len(data)}")
            if len(data) > 0:
                print("Sample record:", data[0])
            else:
                print("⚠️ Warning: 0 records returned. RLS Policy for SELECT might be missing.")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_fetch()
