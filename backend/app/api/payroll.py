from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import db, Employee, Transaction, User
import uuid

payroll_bp = Blueprint('payroll', __name__)

@payroll_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_employees():
    user_id = get_jwt_identity()
    employees = Employee.query.filter_by(employer_id=user_id).all()
    return jsonify([{
        'id': e.id,
        'name': e.name,
        'email': e.email,
        'wallet_address': e.wallet_address,
        'salary': e.salary,
        'department': e.department,
        'status': e.status
    } for e in employees]), 200

@payroll_bp.route('/employees', methods=['POST'])
@jwt_required()
def add_employee():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    employee = Employee(
        employer_id=user_id,
        name=data.get('name'),
        email=data.get('email'),
        wallet_address=data.get('wallet_address'),
        salary=data.get('salary'),
        department=data.get('department')
    )
    db.session.add(employee)
    db.session.commit()
    
    return jsonify({'message': 'Employee added', 'id': employee.id}), 201

@payroll_bp.route('/run', methods=['POST'])
@jwt_required()
def run_payroll():
    user_id = get_jwt_identity()
    data = request.get_json()
    employee_ids = data.get('employee_ids', [])
    umbra_metadata = data.get('umbra_metadata', {})
    
    user = User.query.get(user_id)
    employees = Employee.query.filter(Employee.id.in_(employee_ids), Employee.employer_id == user_id).all()
    
    if not employees:
        return jsonify({'error': 'No employees found'}), 404
        
    transactions = []
    for emp in employees:
        # Use metadata from frontend (Umbra SDK) if available, otherwise fallback to simulation
        tx_hash = umbra_metadata.get('txHash') or f"0x{uuid.uuid4().hex}{uuid.uuid4().hex}"
        viewing_key = umbra_metadata.get('viewingKey') or f"vk_{uuid.uuid4().hex}"
        enc_amount = umbra_metadata.get('encryptedAmount') or "ENCRYPTED_DATA_UMBRA"
        
        tx = Transaction(
            tx_hash=tx_hash,
            sender=user.wallet_address or 'System',
            receiver=emp.wallet_address,
            encrypted_amount=enc_amount,
            viewing_key=viewing_key,
            type='payroll',
            memo=f"Payroll for {emp.name}"
        )
        db.session.add(tx)
        transactions.append({
            'employee_name': emp.name,
            'tx_hash': tx_hash,
            'viewing_key': viewing_key
        })
        
    db.session.commit()
    return jsonify({
        'message': f'Payroll run for {len(transactions)} employees complete',
        'transactions': transactions
    }), 200
