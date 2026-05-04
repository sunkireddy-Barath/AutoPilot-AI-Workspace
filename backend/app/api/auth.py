from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from ..models.models import db, User
import uuid

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    company_name = data.get('company_name')
    wallet_address = data.get('wallet_address')

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        company_name=company_name,
        wallet_address=wallet_address
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'message': 'User created successfully',
        'access_token': access_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'company_name': user.company_name,
            'wallet_address': user.wallet_address
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'company_name': user.company_name,
                'wallet_address': user.wallet_address
            }
        }), 200

    return jsonify({'error': 'Invalid email or password'}), 401

@auth_bp.route('/wallet-login', methods=['POST'])
def wallet_login():
    data = request.get_json()
    address = data.get('address')
    
    if not address:
        return jsonify({'error': 'Wallet address required'}), 400
        
    # In a real app, we would verify the signature here.
    # For this dynamic version, we auto-register the wallet if it doesn't exist.
    user = User.query.filter_by(wallet_address=address).first()
    
    if not user:
        user = User(
            email=f"user_{address[:6]}@stealthpay.io",
            password_hash=generate_password_hash(str(uuid.uuid4())),
            wallet_address=address,
            company_name=f"Org {address[:4]}"
        )
        db.session.add(user)
        db.session.commit()
        
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'company_name': user.company_name,
            'wallet_address': user.wallet_address,
            'umbra_spending_key': user.umbra_spending_key,
            'umbra_viewing_key': user.umbra_viewing_key
        }
    }), 200
