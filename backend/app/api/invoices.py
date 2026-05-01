from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import db, Invoice, Transaction, User
import uuid

invoices_bp = Blueprint('invoices', __name__)

@invoices_bp.route('/', methods=['GET'])
@jwt_required()
def get_invoices():
    user_id = get_jwt_identity()
    invoices = Invoice.query.filter_by(creator_id=user_id).all()
    return jsonify([{
        'id': i.id,
        'invoice_number': i.invoice_number,
        'client_name': i.client_name,
        'amount': i.amount,
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
    
    return jsonify({'message': 'Invoice created', 'id': invoice.id, 'payment_link': invoice.payment_link}), 201

@invoices_bp.route('/<id>/pay', methods=['POST'])
@jwt_required()
def pay_invoice(id):
    user_id = get_jwt_identity()
    invoice = Invoice.query.get_or_404(id)
    
    if invoice.status == 'paid':
        return jsonify({'error': 'Invoice already paid'}), 400
        
    # Simulate Umbra Confidential Payment
    tx_hash = f"0x{uuid.uuid4().hex}{uuid.uuid4().hex}"
    viewing_key = f"vk_{uuid.uuid4().hex}"
    
    tx = Transaction(
        tx_hash=tx_hash,
        sender=request.json.get('sender_wallet', 'External'),
        receiver=User.query.get(invoice.creator_id).wallet_address or 'System',
        encrypted_amount="ENCRYPTED_DATA_UMBRA",
        viewing_key=viewing_key,
        type='invoice',
        memo=f"Payment for {invoice.invoice_number}"
    )
    
    invoice.status = 'paid'
    db.session.add(tx)
    db.session.commit()
    
    return jsonify({
        'message': 'Payment successful via Umbra',
        'tx_hash': tx_hash,
        'viewing_key': viewing_key
    }), 200
