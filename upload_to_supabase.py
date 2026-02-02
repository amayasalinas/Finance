import json
import requests
import os

# Configuration
SUPABASE_URL = "https://iikarklhudhsfvkhhyub.supabase.co"
SUPABASE_KEY = "sb_publishable_PIdI08dSRTLPVauDLxX6Hg_yMEsxwU-" # Anon Key provided
TABLE_NAME = "movimientos"

JSON_FILE = r"C:\Users\Amaya\OneDrive\Documentos\Personal\dashboard_finanzas_2025\data\movimientos.json"

def upload_data():
    if not os.path.exists(JSON_FILE):
        print(f"Error: {JSON_FILE} not found.")
        return

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} records from JSON.")
    
    # Prepare Headers
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation" # Return inserted rows (optional)
    }
    
    # Supabase REST API Endpoint
    url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}"
    
    # Insert in batches to avoid payload limits
    BATCH_SIZE = 100
    total_uploaded = 0
    
    # Clean data keys to match likely DB columns (lowercase, no spaces)
    # JSON keys: banco, tipo, valor, fecha, producto, numero_producto, detalle, categoria
    # These are safe snake_case or single words.
    
    for i in range(0, len(data), BATCH_SIZE):
        batch = data[i:i+BATCH_SIZE]
        
        try:
            response = requests.post(url, json=batch, headers=headers)
            
            if response.status_code in [200, 201]:
                total_uploaded += len(batch)
                print(f"uploaded batch {i//BATCH_SIZE + 1}: {len(batch)} rows.")
            else:
                print(f"Error uploading batch {i}: {response.status_code} - {response.text}")
                # Analyze common errors
                if response.status_code == 404:
                    print(f"❌ Table '{TABLE_NAME}' does not exist. Please create it in Supabase.")
                    break
                elif response.status_code == 401:
                    print("❌ Unauthorized. Check RLS policies (need INSERT access for Anon Key) or use Service Role Key.")
                    break
        except Exception as e:
            print(f"Exception: {e}")
            
    print(f"✅ Upload process finished. Total uploaded: {total_uploaded}/{len(data)}")

if __name__ == "__main__":
    upload_data()
