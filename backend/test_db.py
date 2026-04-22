from app.db.supabase_client import supabase_admin
print(supabase_admin)
print(supabase_admin.table('conversations').execute())
print("Success")
