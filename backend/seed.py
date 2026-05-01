from app import create_app
from app.models.models import db, User, Employee, Invoice, PaymentLink, Transaction
from werkzeug.security import generate_password_hash
from app.services.transaction_service import TransactionService
from datetime import datetime, timedelta
import random

def seed():
    app = create_app()
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()

        print("Seeding demo user...")
        demo_user = User(
            email='demo@stealthpay.io',
            password_hash=generate_password_hash('password123'),
            company_name='Acme Corp',
            wallet_address='7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
        )
        db.session.add(demo_user)
        db.session.flush() # Get user ID

        print("Seeding employees...")
        depts = ['Engineering', 'Design', 'Marketing', 'Legal']
        employees = []
        for i in range(5):
            emp = Employee(
                employer_id=demo_user.id,
                name=f'Employee {i+1}',
                email=f'emp{i+1}@acmecorp.com',
                wallet_address=f'wallet_{random.getrandbits(160):x}'[:44],
                salary=5000 + (i * 1000),
                department=random.choice(depts),
                status='active'
            )
            db.session.add(emp)
            employees.append(emp)
        db.session.flush()

        print("Seeding recent transactions...")
        for i in range(10):
            TransactionService.create_private_transaction(
                user_id=demo_user.id,
                receiver_address=employees[i % 5].wallet_address,
                amount=random.randint(100, 2000),
                currency='USDC',
                tx_type='payroll' if i < 5 else 'payment_link',
                memo=f"Sample Transaction {i+1}"
            )

        print("Seeding invoices...")
        for i in range(3):
            inv = Invoice(
                creator_id=demo_user.id,
                invoice_number=f"INV-2026-00{i+1}",
                client_name=f"Client {chr(65+i)}",
                client_email=f"billing@client{chr(65+i).lower()}.com",
                amount=2500 * (i + 1),
                description=f"Consulting services for Project {chr(65+i)}",
                payment_link=f"https://stealthpay.io/pay/inv-{i+1}",
                status='pending' if i == 0 else 'paid',
                due_date=datetime.utcnow() + timedelta(days=30)
            )
            db.session.add(inv)

        print("Seeding payment links...")
        for i in range(2):
            pl = PaymentLink(
                creator_id=demo_user.id,
                title=f"Conference Sponsorship {i+1}",
                amount=500 * (i + 1),
                currency='USDC',
                status='active'
            )
            db.session.add(pl)

        db.session.commit()
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed()
