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
        
        # 2. Create the Transaction record
        transaction = Transaction(
            tx_hash=tx_hash,
            sender=user.wallet_address or 'System',
            receiver=receiver_address,
            encrypted_amount=encrypted_amt,
            viewing_key=viewing_key,
            type=tx_type,
            memo=memo,
            status='confirmed'
        )
        
        db.session.add(transaction)
        # We don't commit here to allow atomic operations in the caller (e.g., payroll batch)
        
        return transaction

    @staticmethod
    def get_user_transactions(user_id: str):
        user = User.query.get(user_id)
        if not user:
            return []
            
        wallet = user.wallet_address or 'System'
        return Transaction.query.filter(
            (Transaction.sender == wallet) | (Transaction.receiver == wallet)
        ).order_by(Transaction.created_at.desc()).all()
