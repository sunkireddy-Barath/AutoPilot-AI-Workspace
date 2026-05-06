import uuid

NAMESPACE_UUID = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8') # DNS Namespace as fallback

def to_uuid(firebase_uid: str) -> str:
    """
    Deterministically map a Firebase UID (string) to a UUID (string).
    This allows storing Firebase UIDs in Supabase UUID columns.
    """
    if not firebase_uid:
        return str(uuid.uuid4())
    
    # Generate a deterministic UUID from the Firebase UID
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, firebase_uid))
