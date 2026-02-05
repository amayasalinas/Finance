import subprocess
import sys

def run_script(script_name):
    print(f"\n🚀 Running {script_name}...")
    try:
        result = subprocess.run([sys.executable, script_name], check=True, text=True)
        print(f"✅ {script_name} completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running {script_name}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🔄 Starting Data Sync Process...")
    
    # 1. Process Data (Generate JSON)
    run_script("process_data.py")
    
    # 2. Upload to Supabase
    run_script("upload_to_supabase.py")
    
    print("\n✨ All data synchronized to Supabase!")
