"""
Flask Web UI for Computer Agent
Main application entry point
"""
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
from datetime import datetime
from pathlib import Path

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

# Global state
current_task = None
task_history = []

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('public', 'index.html')

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'hasTask': current_task is not None
    })

@app.route('/task', methods=['POST'])
def start_task():
    """Start a new task"""
    global current_task, task_history
    
    data = request.get_json()
    task = data.get('task')
    
    if not task:
        return jsonify({'error': 'Task is required'}), 400
    
    if current_task:
        return jsonify({'error': 'A task is already running'}), 409
    
    current_task = {
        'task': task,
        'startTime': datetime.now().timestamp() * 1000,
        'updates': []
    }
    task_history = []
    
    print(f'\n🚀 Starting task: {task}')
    
    # In a real implementation, this would start the agent in a background thread
    # For now, we'll just return success
    return jsonify({'message': 'Task started', 'task': task})

@app.route('/task/status', methods=['GET'])
def task_status():
    """Get current task status"""
    if not current_task:
        last_task = task_history[-1] if task_history else None
        return jsonify({
            'running': False,
            'lastTask': last_task
        })
    
    return jsonify({
        'running': True,
        'task': current_task['task'],
        'startTime': current_task['startTime'],
        'updates': current_task['updates'][-10:]  # Last 10 updates
    })

@app.route('/task/stop', methods=['POST'])
def stop_task():
    """Stop current task"""
    global current_task
    
    if not current_task:
        return jsonify({'error': 'No task running'}), 400
    
    current_task['stopRequested'] = True
    return jsonify({'message': 'Stop requested'})

@app.route('/history', methods=['GET'])
def get_history():
    """Get task history"""
    return jsonify(task_history)

# ===== Skills API =====

@app.route('/skills', methods=['GET'])
def get_skills():
    """Get all loaded skills"""
    # In a real implementation, this would load from skills directory
    skills = []
    return jsonify({
        'count': len(skills),
        'skills': skills
    })

@app.route('/skills/refresh', methods=['POST'])
def refresh_skills():
    """Refresh skills cache"""
    # In a real implementation, this would reload skills
    skills = []
    return jsonify({
        'message': 'Skills refreshed',
        'count': len(skills),
        'skills': []
    })

@app.route('/skills/<name>', methods=['GET'])
def get_skill(name):
    """Get skill details by name"""
    # In a real implementation, this would load specific skill
    return jsonify({'error': 'Skill not found'}), 404

@app.route('/skills/match', methods=['POST'])
def match_skills():
    """Match skills to a task"""
    data = request.get_json()
    task = data.get('task')
    
    if not task:
        return jsonify({'error': 'Task is required'}), 400
    
    # In a real implementation, this would match skills
    return jsonify({
        'task': task,
        'matchedCount': 0,
        'matches': []
    })

# ===== Security API =====

@app.route('/security/status', methods=['GET'])
def security_status():
    """Get security status"""
    return jsonify({
        'enabled': True,
        'sessionActive': current_task is not None,
        'pendingConfirmations': 0
    })

@app.route('/security/config', methods=['GET'])
def get_security_config():
    """Get security configuration"""
    return jsonify({
        'enabled': True,
        'requireConfirmation': {
            'enabled': True,
            'operations': ['key_combo', 'type_text', 'open_app']
        },
        'blockedApps': ['cmd', 'powershell', 'regedit'],
        'rateLimit': {
            'enabled': True,
            'maxOperationsPerMinute': 60
        }
    })

@app.route('/security/config', methods=['PATCH'])
def update_security_config():
    """Update security configuration"""
    data = request.get_json()
    # In a real implementation, this would update config
    return jsonify({
        'message': 'Config updated',
        'config': get_security_config().json
    })

@app.route('/security/toggle', methods=['POST'])
def toggle_security():
    """Enable/disable security mode"""
    data = request.get_json()
    enabled = data.get('enabled')
    
    if not isinstance(enabled, bool):
        return jsonify({'error': 'enabled (boolean) is required'}), 400
    
    # In a real implementation, this would toggle security
    return jsonify({
        'message': f'Security mode {"enabled" if enabled else "disabled"}',
        'enabled': enabled
    })

@app.route('/security/confirmations', methods=['GET'])
def get_confirmations():
    """Get pending confirmations"""
    return jsonify({'confirmations': []})

@app.route('/security/confirm/<confirmation_id>', methods=['POST'])
def confirm_operation(confirmation_id):
    """Confirm an operation"""
    # In a real implementation, this would confirm operation
    return jsonify({
        'message': 'Operation confirmed',
        'success': True
    })

@app.route('/security/reject/<confirmation_id>', methods=['POST'])
def reject_operation(confirmation_id):
    """Reject an operation"""
    # In a real implementation, this would reject operation
    return jsonify({'message': 'Operation rejected'})

def main():
    """Main entry point"""
    port = int(os.environ.get('PORT', 3200))
    
    print(f'''
🖥️  Computer Agent Server (Flask)
========================
Port: {port}
Web UI: http://localhost:{port}
Security Mode: Enabled 🔒

API Endpoints:
  POST /task - Start task
  GET  /task/status - Get task status
  POST /task/stop - Stop task
  GET  /history - Get history
  
  GET  /skills - View all skills
  POST /skills/refresh - Refresh skills
  GET  /skills/:name - Get skill details
  POST /skills/match - Test task matching
  
  GET  /security/status - Security status
  GET  /security/config - Security config
  PATCH /security/config - Update config
  POST /security/toggle - Toggle security mode
  GET  /security/confirmations - Pending confirmations
  POST /security/confirm/:id - Confirm operation
  POST /security/reject/:id - Reject operation
    ''')
    
    app.run(host='0.0.0.0', port=port, debug=True)

if __name__ == '__main__':
    main()
