# Computer Agent - Flask Web UI

An AI-powered computer control agent with a web interface built using Python Flask.

## Features

- 🖥️ Web-based UI for controlling the computer agent
- 🔒 Security mode with operation confirmation
- 📦 Skills management system
- 📊 Task history and status tracking
- 🌐 RESTful API for all operations

## Requirements

- Python 3.8+
- Flask 3.0.0+

## Installation

### Using Python/Flask

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask server:
```bash
python app.py
```

3. Open your browser and navigate to:
```
http://localhost:3200
```

### Using Node.js (Alternative)

1. Install Node.js dependencies:
```bash
npm install
```

2. Run the Express server:
```bash
npm start
```

## Configuration

The Flask server can be configured using environment variables:

- `PORT`: Server port (default: 3200)
- `FLASK_DEBUG`: Enable debug mode (default: False). Set to 'true', '1', or 'yes' to enable. **Warning**: Never enable debug mode in production as it exposes sensitive information.

## API Endpoints

### Task Management
- `POST /task` - Start a new task
- `GET /task/status` - Get current task status
- `POST /task/stop` - Stop current task
- `GET /history` - Get task history

### Skills Management
- `GET /skills` - List all skills
- `POST /skills/refresh` - Refresh skills cache
- `GET /skills/:name` - Get skill details
- `POST /skills/match` - Match skills to a task

### Security
- `GET /security/status` - Get security status
- `GET /security/config` - Get security configuration
- `PATCH /security/config` - Update security configuration
- `POST /security/toggle` - Enable/disable security mode
- `GET /security/confirmations` - Get pending confirmations
- `POST /security/confirm/:id` - Confirm an operation
- `POST /security/reject/:id` - Reject an operation

## Usage

1. Start the server (see Installation section)
2. Open the web UI in your browser
3. Enter a task description (e.g., "Open notepad and write Hello World")
4. Click "Start" to execute the task
5. Monitor the task progress in the UI

## Security

The agent includes several security features:

- Operation confirmation for sensitive actions
- Blocked applications and key combinations
- Rate limiting
- Protected screen areas
- Audit logging

## Development

### Project Structure

```
computer-agent/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── package.json        # Node.js dependencies (alternative)
├── public/            # Static files (HTML, CSS, JS)
│   └── index.html     # Web UI
└── src/               # Node.js source files (alternative)
    ├── index.js       # Express server
    ├── agent.js       # Agent logic
    ├── controls.js    # Computer control functions
    ├── openai.js      # OpenAI integration
    ├── screenshot.js  # Screenshot capture
    ├── security.js    # Security controls
    └── skills.js      # Skills management
```

## License

MIT
