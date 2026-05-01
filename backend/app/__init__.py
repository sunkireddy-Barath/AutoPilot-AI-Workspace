from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .models.models import db
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///stealthpay.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'stealth-secret-key-123')
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    JWTManager(app)
    
    with app.app_context():
        db.create_all() # Create tables for development
    
    # Register blueprints
    from .api.auth import auth_bp
    from .api.payroll import payroll_bp
    from .api.invoices import invoices_bp
    from .api.compliance import compliance_bp
    from .api.payment_links import payment_links_bp
    from .api.wallet import wallet_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(payroll_bp, url_prefix='/api/payroll')
    app.register_blueprint(invoices_bp, url_prefix='/api/invoices')
    app.register_blueprint(compliance_bp, url_prefix='/api/compliance')
    app.register_blueprint(payment_links_bp, url_prefix='/api/payment-links')
    app.register_blueprint(wallet_bp, url_prefix='/api/wallet')
    
    @app.route('/health')
    def health():
        return {'status': 'healthy', 'service': 'stealthpay-backend'}
    
    return app
