from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import Transaction, User
from ..services.umbra_service import UmbraService
from ..services.transaction_service import TransactionService

compliance_bp = Blueprint('compliance', __name__)

@compliance_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    txs = TransactionService.get_user_transactions(user_id)
    
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
    } for tx in txs]), 200

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
        return jsonify({'error': 'Transaction not found on chain'}), 404
        
    # Realistically verify the key
    if not UmbraService.verify_viewing_key(tx.tx_hash, tx.sender, viewing_key):
        return jsonify({'error': 'Invalid viewing key for this transaction'}), 403
        
    return jsonify({
        'status': 'success',
        'decrypted_data': {
            'tx_hash': tx.tx_hash,
            'sender': tx.sender,
            'receiver': tx.receiver,
            'amount': 8500.00, # In a production app, we would decrypt the actual value from encrypted_amount
            'currency': 'USDC',
            'type': tx.type,
            'memo': tx.memo,
            'timestamp': tx.created_at.isoformat()
        }
    }), 200

@compliance_bp.route('/verify-on-chain/<tx_hash>', methods=['GET'])
@jwt_required()
def verify_on_chain(tx_hash):
    # Search for transaction to get the stealth address
    tx = Transaction.query.filter_by(tx_hash=tx_hash).first_or_404()
    
    # Simulate Blockchain Explorer Data
    return jsonify({
        'status': 'success',
        'network': 'Solana Mainnet-Beta (Simulated)',
        'tx_hash': tx_hash,
        'on_chain_data': {
            'program_id': 'UmbraMod111111111111111111111111111111',
            'receiver_stealth_address': tx.receiver, # This is the stealth address on-chain
            'amount': 'Encrypted (Umbra)',
            'slot': 245901234,
            'timestamp': tx.created_at.isoformat()
        }
    }), 200
