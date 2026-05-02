from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import Transaction, User

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    wallet = user.wallet_address or 'System'
    
    # Fetch transactions where user is sender or receiver
    txs = Transaction.query.filter(
        (Transaction.sender == wallet) | (Transaction.receiver == wallet)
    ).order_by(Transaction.created_at.desc()).all()
    
    return jsonify([{
        'id': tx.id,
        'tx_hash': tx.tx_hash,
        'sender': tx.sender,
        'receiver': tx.receiver,
        'encrypted_amount': tx.encrypted_amount,
        'viewing_key': tx.viewing_key,
        'type': tx.type,
        'status': tx.status,
        'memo': tx.memo,
        'created_at': tx.created_at.isoformat()
    } for tx in txs]), 200
