from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.models import db, Employee, User, Transaction
import uuid
from datetime import datetime
from ..utils.supabase_sync import SupabaseSync

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
        'status': e.status,
        'lastPaid': e.last_paid.isoformat() if e.last_paid else None
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
    
    # SYNC TO SUPABASE
    SupabaseSync.sync_record("employees", {
        "id": employee.id,
        "employer_id": employee.employer_id,
        "name": employee.name,
        "email": employee.email,
        "wallet_address": employee.wallet_address,
        "salary": employee.salary,
        "department": employee.department,
        "status": employee.status
    })
    
    return jsonify({'message': 'Employee added', 'id': employee.id}), 201

@payroll_bp.route('/employees/<id>', methods=['DELETE'])
@jwt_required()
def remove_employee(id):
    user_id = get_jwt_identity()
    employee = Employee.query.filter_by(id=id, employer_id=user_id).first_or_404()
    db.session.delete(employee)
    db.session.commit()
    return jsonify({'message': 'Employee removed'}), 200

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
        
    transactions_meta = []
    try:
        for emp in employees:
            # Create a real Transaction record based on Umbra metadata from frontend
            tx = Transaction(
                id=str(uuid.uuid4()),
                tx_hash=umbra_metadata.get('txHash', f"sim_{uuid.uuid4().hex}"),
                sender=user.wallet_address,
                receiver=umbra_metadata.get('stealthAddress', f"umbra_{uuid.uuid4().hex}"),
                encrypted_amount=umbra_metadata.get('encryptedAmount'),
                viewing_key=umbra_metadata.get('viewingKey'),
                type='payroll',
                memo=f"Payroll for {emp.name}",
                status='confirmed',
                created_at=datetime.utcnow()
            )
            emp.last_paid = datetime.utcnow()
            db.session.add(tx)
            
            # SYNC TO SUPABASE
            SupabaseSync.sync_record("transactions", {
                "id": tx.id,
                "tx_hash": tx.tx_hash,
                "sender": tx.sender,
                "receiver": tx.receiver,
                "encrypted_amount": tx.encrypted_amount,
                "viewing_key": tx.viewing_key,
                "type": tx.type,
                "memo": tx.memo,
                "status": tx.status
            })
            
            transactions_meta.append({
                'employee_name': emp.name,
                'tx_hash': tx.tx_hash,
                'viewing_key': tx.viewing_key
            })
            
        db.session.commit()
        return jsonify({
            'message': 'Payroll complete',
            'transactions': transactions_meta
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
