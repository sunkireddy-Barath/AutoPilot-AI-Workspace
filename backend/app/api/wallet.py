from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import User
from ..services.wallet_service import WalletService

wallet_bp = Blueprint('wallet', __name__)

@wallet_bp.route('/balances', methods=['GET'])
@jwt_required()
def get_balances():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    balances = WalletService.get_balances(user.wallet_address)
    return jsonify(balances), 200
