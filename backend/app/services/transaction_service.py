from ..models.models import db, Transaction, User
from .umbra_service import UmbraService
import uuid

class TransactionService:
    @staticmethod
    def create_private_transaction(user_id: str, receiver_address: str, amount: float, currency: str, tx_type: str, memo: str = None):
        user = User.query.get(user_id)
        if not user:
            raise ValueError("User not found")

        # 1. Generate Umbra Stealth Metadata
        stealth_address = UmbraService.generate_stealth_address(user, receiver_address)
        tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex}"
        viewing_key = UmbraService.generate_viewing_key(user, tx_hash)
        encrypted_amt = UmbraService.encrypt_metadata(amount, currency)
        
        # 2. Create the Transaction record in local DB
        tx = Transaction(
            id=str(uuid.uuid4()),
            tx_hash=tx_hash,
            sender=user.wallet_address or 'System',
            receiver=stealth_address,
            encrypted_amount=encrypted_amt,
            viewing_key=viewing_key,
            type=tx_type,
            memo=memo,
            status='confirmed'
        )
        db.session.add(tx)
        
        # 3. SYNC TO SUPABASE (Cloud Storage)
        try:
            from supabase import create_client
            url = os.environ.get("SUPABASE_URL")
            key = os.environ.get("SUPABASE_KEY")
            if url and key:
                sb = create_client(url, key)
                sb.table("transactions").insert({
                    "tx_hash": tx.tx_hash,
                    "sender": tx.sender,
                    "receiver": tx.receiver,
                    "encrypted_amount": tx.encrypted_amount,
                    "viewing_key": tx.viewing_key,
                    "type": tx.type,
                    "memo": tx.memo,
                    "status": tx.status
                }).execute()
        except Exception as e:
            print(f"Supabase sync failed: {e}")

        return tx

    @staticmethod
    def get_user_transactions(user_id: str):
        user = User.query.get(user_id)
        if not user:
            return []
            
        wallet = user.wallet_address or 'System'
        return Transaction.query.filter(
            (Transaction.sender == wallet) | (Transaction.receiver == wallet)
        ).order_by(Transaction.created_at.desc()).all()
