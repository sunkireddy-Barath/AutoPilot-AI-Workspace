import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in environment.")
    exit(1)

try:
    supabase: Client = create_client(url, key)
    print(f"Successfully initialized Supabase client for {url}")
    
    # Try a simple query to verify connection
    # Note: This might fail if no tables exist yet, but we check if the client can talk to the API
    response = supabase.table("users").select("*").limit(1).execute()
    print("Connection verified (API level).")
except Exception as e:
    print(f"Connection verification failed: {e}")
    print("This is expected if the 'users' table hasn't been created yet.")
