#!/usr/bin/env python3
"""
Simplified WeAD Dashboard - Core functionality only
"""

import os
import json
import time
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from PIL import Image, ImageDraw, ImageFont
import io
import uuid

# Initialize Flask app
app = Flask(__name__, static_folder='static', static_url_path='/static', template_folder='templates')
CORS(app)

# Configuration from environment variables
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads/videos'
app.config['ALLOWED_VIDEO_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'mkv', 'webm'}

# Create upload folders if they don't exist
os.makedirs('uploads/videos', exist_ok=True)
os.makedirs('uploads/thumbnails', exist_ok=True)

# Initialize JWT
jwt = JWTManager(app)

# Sample data
CAMPAIGNS = [
    {
        "id": 1,
        "name": "Welcome Campaign",
        "description": "Your first micro-advertising campaign",
        "budget": 100.0,
        "spent": 0.0,
        "views": 0,
        "reach": 0,
        "impressions": 0,
        "duration": 30,
        "status": "active",
        "created_at": datetime.now().isoformat()
    }
]

DEVICES = [
    {
        "id": 1,
        "device_id": "DEVICE001",
        "name": "Main Display",
        "status": "active",
        "location": "New York, NY",
        "earnings": 0.0,
        "impressions": 0,
        "uptime": "99.9%"
    }
]

MICROTISERS = []
ADVERTISERS = []
EARNINGS = []
ANALYTICS_DATA = {}

# Helper functions
def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_VIDEO_EXTENSIONS']

def generate_thumbnail(video_path, output_path):
    """Generate thumbnail for video"""
    try:
        # Create a simple placeholder thumbnail
        img = Image.new('RGB', (320, 180), color=(73, 109, 137))
        d = ImageDraw.Draw(img)
        d.text((10, 10), "WeAD Video", fill=(255, 255, 255))
        img.save(output_path)
        return True
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return False

# Routes
@app.route('/')
def index():
    """Render main index page"""
    return render_template('index.html')

@app.route('/home')
def home():
    """Render home dashboard"""
    return render_template('home.html')

@app.route('/campaigns')
def campaigns_page():
    """Render campaigns management page"""
    return render_template('campaigns.html')

@app.route('/devices')
def devices_page():
    """Render devices management page"""
    return render_template('devices.html')

@app.route('/analytics')
def analytics_page():
    """Render analytics dashboard"""
    return render_template('analytics.html')

@app.route('/earnings')
def earnings_page():
    """Render earnings page"""
    return render_template('earnings.html')

@app.route('/microtisers')
def microtisers_page():
    """Render microtisers page"""
    return render_template('microtisers.html')

@app.route('/advertisers')
def advertisers_page():
    """Render advertisers page"""
    return render_template('advertisers.html')

# API Routes

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # Simple authentication (replace with proper authentication in production)
        if username and password:
            access_token = create_access_token(identity=username)
            return jsonify({
                'success': True,
                'token': access_token,
                'user': {'username': username}
            }), 200
        
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/campaigns', methods=['GET'])
@jwt_required()
def get_campaigns():
    """Get all campaigns"""
    return jsonify({'success': True, 'campaigns': CAMPAIGNS}), 200

@app.route('/api/campaigns', methods=['POST'])
@jwt_required()
def create_campaign():
    """Create new campaign"""
    try:
        data = request.get_json()
        new_campaign = {
            'id': len(CAMPAIGNS) + 1,
            'name': data.get('name'),
            'description': data.get('description'),
            'budget': float(data.get('budget', 0)),
            'spent': 0.0,
            'views': 0,
            'reach': 0,
            'impressions': 0,
            'duration': int(data.get('duration', 30)),
            'status': 'active',
            'created_at': datetime.now().isoformat()
        }
        CAMPAIGNS.append(new_campaign)
        return jsonify({'success': True, 'campaign': new_campaign}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/campaigns/<int:campaign_id>/upload', methods=['POST'])
@jwt_required()
def upload_campaign_video(campaign_id):
    """Upload video for campaign"""
    try:
        if 'video' not in request.files:
            return jsonify({'success': False, 'message': 'No video file provided'}), 400
        
        file = request.files['video']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            
            # Generate thumbnail
            thumbnail_path = os.path.join('uploads/thumbnails', f"{unique_filename}.jpg")
            generate_thumbnail(filepath, thumbnail_path)
            
            return jsonify({
                'success': True,
                'message': 'Video uploaded successfully',
                'filename': unique_filename
            }), 200
        
        return jsonify({'success': False, 'message': 'Invalid file type'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/devices', methods=['GET'])
@jwt_required()
def get_devices():
    """Get all devices"""
    return jsonify({'success': True, 'devices': DEVICES}), 200

@app.route('/api/devices/register', methods=['POST'])
@jwt_required()
def register_device():
    """Register new device"""
    try:
        data = request.get_json()
        new_device = {
            'id': len(DEVICES) + 1,
            'device_id': data.get('device_id', f'DEVICE{len(DEVICES) + 1:03d}'),
            'name': data.get('name', 'New Device'),
            'status': 'active',
            'location': data.get('location', 'Unknown'),
            'earnings': 0.0,
            'impressions': 0,
            'uptime': '100%'
        }
        DEVICES.append(new_device)
        return jsonify({'success': True, 'device': new_device}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/devices/<int:device_id>/earnings', methods=['GET'])
@jwt_required()
def get_device_earnings(device_id):
    """Get device earnings"""
    device = next((d for d in DEVICES if d['id'] == device_id), None)
    if device:
        return jsonify({
            'success': True,
            'device_id': device_id,
            'earnings': device['earnings'],
            'impressions': device['impressions']
        }), 200
    return jsonify({'success': False, 'message': 'Device not found'}), 404

@app.route('/api/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get analytics data"""
    analytics = {
        'total_campaigns': len(CAMPAIGNS),
        'active_campaigns': len([c for c in CAMPAIGNS if c['status'] == 'active']),
        'total_devices': len(DEVICES),
        'active_devices': len([d for d in DEVICES if d['status'] == 'active']),
        'total_impressions': sum(c['impressions'] for c in CAMPAIGNS),
        'total_spent': sum(c['spent'] for c in CAMPAIGNS),
        'total_earnings': sum(d['earnings'] for d in DEVICES)
    }
    return jsonify({'success': True, 'analytics': analytics}), 200

@app.route('/api/microtisers', methods=['GET'])
@jwt_required()
def get_microtisers():
    """Get all microtisers (device owners)"""
    return jsonify({'success': True, 'microtisers': MICROTISERS}), 200

@app.route('/api/advertisers', methods=['GET'])
@jwt_required()
def get_advertisers():
    """Get all advertisers"""
    return jsonify({'success': True, 'advertisers': ADVERTISERS}), 200

@app.route('/api/earnings', methods=['GET'])
@jwt_required()
def get_earnings():
    """Get earnings history"""
    return jsonify({'success': True, 'earnings': EARNINGS}), 200

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }), 200

# Static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'success': False, 'message': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    # Get configuration from environment variables
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"🚀 WeAD Dashboard starting on {host}:{port}")
    print(f"🔧 Debug mode: {debug}")
    print(f"🌐 Environment: {os.getenv('FLASK_ENV', 'development')}")
    
    app.run(host=host, port=port, debug=debug)

