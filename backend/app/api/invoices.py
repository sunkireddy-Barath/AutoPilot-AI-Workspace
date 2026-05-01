from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import db, Invoice, User
from ..services.transaction_service import TransactionService
from ..services.blockchain_service import BlockchainService
import uuid

invoices_bp = Blueprint('invoices', __name__)
blockchain = BlockchainService()

@invoices_bp.route('/', methods=['GET'])
@jwt_required()
def get_invoices():
    user_id = get_jwt_identity()
    invoices = Invoice.query.filter_by(creator_id=user_id).all()
    return jsonify([{
        'id': i.id,
        'invoice_number': i.invoice_number,
        'client_name': i.client_name,
        'client_email': i.client_email,
        'amount': i.amount,
        'description': i.description,
        'status': i.status,
        'due_date': i.due_date.isoformat() if i.due_date else None,
        'payment_link': i.payment_link
    } for i in invoices]), 200

@invoices_bp.route('/', methods=['POST'])
@jwt_required()
def create_invoice():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    invoice_id = str(uuid.uuid4())
    invoice = Invoice(
        id=invoice_id,
        creator_id=user_id,
        invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
        client_name=data.get('client_name'),
        client_email=data.get('client_email'),
        amount=data.get('amount'),
        description=data.get('description'),
        payment_link=f"https://stealthpay.io/pay/{invoice_id}",
        status='pending'
    )
    db.session.add(invoice)
    db.session.commit()
    
    # Sync to Supabase
    try:
        from supabase import create_client
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if url and key:
            sb = create_client(url, key)
            sb.table("invoices").insert({
                "id": invoice.id,
                "creator_id": invoice.creator_id,
                "invoice_number": invoice.invoice_number,
                "client_name": invoice.client_name,
                "client_email": invoice.client_email,
                "amount": invoice.amount,
                "status": invoice.status,
                "payment_link": invoice.payment_link
            }).execute()
    except Exception as e:
        print(f"Supabase invoice sync failed: {e}")
    
    return jsonify({'message': 'Invoice created', 'id': invoice.id, 'payment_link': invoice.payment_link}), 201

@invoices_bp.route('/<id>/pay', methods=['POST'])
@jwt_required()
def pay_invoice(id):
    user_id = get_jwt_identity()
    invoice = Invoice.query.get_or_404(id)
    
    if invoice.status == 'paid':
        return jsonify({'error': 'Invoice already paid'}), 400
        
    try:
        # Simulate On-Chain Payment
        user = User.query.get(user_id)
        blockchain.simulate_transfer(
            'EXTERNAL_CLIENT_WALLET',
            user.wallet_address or 'System',
            invoice.amount / 100
        )

        # Create the private transaction using the service
        tx = TransactionService.create_private_transaction(
            user_id=user_id,
            receiver_address=user.wallet_address or 'System',
            amount=invoice.amount,
            currency='USDC',
            tx_type='invoice',
            memo=f"Payment for {invoice.invoice_number}"
        )
        
        invoice.status = 'paid'
        db.session.commit()
        
        return jsonify({
            'message': 'Payment successful via Umbra',
            'tx_hash': tx.tx_hash,
            'viewing_key': tx.viewing_key
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@invoices_bp.route('/<id>/status', methods=['PATCH'])
@jwt_required()
def update_invoice_status(id):
    user_id = get_jwt_identity()
    invoice = Invoice.query.filter_by(id=id, creator_id=user_id).first_or_404()
    data = request.get_json()
    new_status = data.get('status')
    
    invoice.status = new_status
    db.session.commit()
    
    return jsonify({'message': f'Invoice marked as {new_status}'}), 200
