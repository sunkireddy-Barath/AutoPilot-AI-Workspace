from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import Transaction, User

compliance_bp = Blueprint('compliance', __name__)

@compliance_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    # In Umbra, transactions are private. 
    # Here we return the transactions where the user is either sender or receiver
    # In a real app, this would involve scanning the chain for stealth addresses owned by the user.
    transactions = Transaction.query.filter(
        (Transaction.sender == (user.wallet_address or 'System')) | 
        (Transaction.receiver == (user.wallet_address or 'System'))
    ).order_by(Transaction.created_at.desc()).all()
    
    return jsonify([{
        'id': tx.id,
        'txHash': tx.tx_hash,
        'sender': tx.sender,
        'receiver': tx.receiver,
        'encryptedAmount': tx.encrypted_amount,
        'viewingKey': tx.viewing_key,
        'type': tx.type,
        'memo': tx.memo,
        'status': tx.status,
        'timestamp': tx.created_at.isoformat()
    } for tx in transactions]), 200

@compliance_bp.route('/decrypt', methods=['POST'])
@jwt_required()
def decrypt_transaction():
    data = request.get_json()
    tx_hash = data.get('tx_hash')
    viewing_key = data.get('viewing_key')
    
    if not tx_hash or not viewing_key:
        return jsonify({'error': 'tx_hash and viewing_key are required'}), 400
        
    tx = Transaction.query.filter_by(tx_hash=tx_hash).first()
    
    if not tx:
        # For the demo, if it starts with vk_ and hash is present, we can simulate a successful decryption
        # This allows the "Fill Demo Data" button to work even without a real DB entry
        if viewing_key.startswith('vk_') and len(tx_hash) > 10:
             return jsonify({
                'status': 'success',
                'decrypted_data': {
                    'tx_hash': tx_hash,
                    'sender': 'Demo Employer',
                    'receiver': 'Demo Employee',
                    'amount': 8500.00,
                    'currency': 'USDC',
                    'type': 'payroll',
                    'memo': 'Monthly Salary Payment (Umbra Verified)',
                    'timestamp': '2026-05-01T10:00:00Z'
                }
            }), 200
        return jsonify({'error': 'Transaction not found'}), 404
        
    if tx.viewing_key != viewing_key:
        return jsonify({'error': 'Invalid viewing key'}), 403
        
    # In a real system, the viewing key would be used to decrypt the actual amount from the blockchain
    return jsonify({
        'status': 'success',
        'decrypted_data': {
            'tx_hash': tx.tx_hash,
            'sender': tx.sender,
            'receiver': tx.receiver,
            'amount': 8500.00, # In a real app, this would be decrypted from tx.encrypted_amount
            'currency': 'USDC',
            'type': tx.type,
            'memo': tx.memo,
            'timestamp': tx.created_at.isoformat()
        }
    }), 200
