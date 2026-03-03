# 🖥️ Computer Agent

AI-powered computer control agent using GPT-4o Vision and Azure OpenAI. This agent can understand tasks in natural language and execute them by observing the screen and controlling mouse, keyboard, and applications.

## Features

### 🤖 AI-Powered Control
- **Vision-based Control**: Uses GPT-4o Vision to understand screen content
- **Natural Language Tasks**: Describe what you want in plain language
- **Autonomous Execution**: Agent observes, plans, and executes actions automatically
- **Iterative Refinement**: Continuously checks progress and adjusts actions

### 🛡️ Security Features
- **Operation Confirmation**: High-risk operations require user approval
- **Application Blacklist**: Prevents opening dangerous system applications
- **Command Filtering**: Blocks potentially harmful keyboard shortcuts and text input
- **Audit Logging**: All operations are logged for review

### 🎯 Skills System
- **Extensible Architecture**: Add custom skills by placing markdown files in the `skills/` directory
- **Automatic Discovery**: Skills are automatically loaded and matched to tasks
- **Skill Metadata**: Each skill includes name, description, keywords, and examples

### 🌐 Web Interface
- Modern, responsive web UI for task management
- Real-time screen preview
- Task history and logging
- Security operation management

### 🔧 API Endpoints
RESTful API for programmatic control and integration

## Installation

### Prerequisites
- Node.js 18+ 
- Azure OpenAI account with GPT-4o deployment
- Windows OS (currently supports Windows via PowerShell)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/zhiqianlu/computer-agent.git
   cd computer-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Azure OpenAI**
   
   Set environment variables:
   ```bash
   # Azure OpenAI endpoint
   export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
   
   # Model deployment name
   export MODEL_NAME="gpt-4o"
   
   # Optional: Skills directory path
   export SKILLS_DIR="/path/to/skills"
   ```

4. **Authenticate with Azure**
   
   The agent uses `DefaultAzureCredential` from Azure Identity SDK. Make sure you're authenticated:
   ```bash
   az login
   ```

## Usage

### Starting the Server

```bash
npm start
```

The server will start on port 3200 (configurable via `PORT` environment variable).

```
🖥️  Computer Agent Server
========================
Port: 3200
Web UI: http://localhost:3200
Loaded Skills: 0
Security Mode: Enabled 🔒
```

### Web Interface

Open your browser and navigate to `http://localhost:3200`

**Example Tasks:**
- "打开记事本，写 Hello World" (Open Notepad and write Hello World)
- "打开计算器，计算 123 + 456" (Open calculator and compute 123 + 456)
- "打开浏览器，搜索 GitHub Copilot" (Open browser and search for GitHub Copilot)
- "打开文件管理器，创建一个新文件夹叫 test" (Open file manager and create a folder named test)

## API Reference

### Task Management

#### Start a Task
```http
POST /task
Content-Type: application/json

{
  "task": "Open notepad and write hello world"
}
```

**Response:**
```json
{
  "message": "Task started",
  "task": "Open notepad and write hello world"
}
```

#### Get Task Status
```http
GET /task/status
```

**Response (Running):**
```json
{
  "running": true,
  "task": "Open notepad and write hello world",
  "startTime": 1234567890,
  "updates": [...]
}
```

**Response (Idle):**
```json
{
  "running": false,
  "lastTask": {
    "task": "...",
    "result": {...},
    "endTime": 1234567890
  }
}
```

#### Stop a Task
```http
POST /task/stop
```

#### Get Task History
```http
GET /history
```

### Skills Management

#### List All Skills
```http
GET /skills
```

**Response:**
```json
{
  "count": 5,
  "skills": [
    {
      "name": "web_search",
      "description": "Search the web for information",
      "path": "/skills/web_search/SKILL.md"
    }
  ]
}
```

#### Refresh Skills Cache
```http
POST /skills/refresh
```

#### Get Skill Details
```http
GET /skills/:name
```

#### Test Skill Matching
```http
POST /skills/match
Content-Type: application/json

{
  "task": "Search for Node.js tutorials"
}
```

### Security Management

#### Get Security Status
```http
GET /security/status
```

**Response:**
```json
{
  "enabled": true,
  "operationsBlocked": 5,
  "operationsAllowed": 23,
  "pendingConfirmations": 1
}
```

#### Get Security Configuration
```http
GET /security/config
```

#### Update Security Configuration
```http
PATCH /security/config
Content-Type: application/json

{
  "requireConfirmation": {
    "enabled": true,
    "operations": ["key_combo", "type_text", "open_app"]
  }
}
```

#### Toggle Security Mode
```http
POST /security/toggle
Content-Type: application/json

{
  "enabled": false
}
```

#### Get Pending Confirmations
```http
GET /security/confirmations
```

#### Confirm Operation
```http
POST /security/confirm/:id
```

#### Reject Operation
```http
POST /security/reject/:id
```

## Skills System

Skills are modular capabilities that extend the agent's abilities. Each skill is defined in a markdown file with frontmatter metadata.

### Creating a Skill

1. Create a directory under `skills/` (e.g., `skills/web_search/`)
2. Create a `SKILL.md` file with the following structure:

```markdown
---
name: web_search
description: Search the web for information
keywords: search, web, internet, browse, find, google
priority: 5
---

# Web Search Skill

This skill enables the agent to search the web for information.

## When to Use

Use this skill when:
- User asks to search for something
- Need to find information online
- Look up current events or news

## Examples

- "Search for Python tutorials"
- "Find the latest news about AI"
- "Look up weather in New York"

## Implementation

The agent will:
1. Open a web browser
2. Navigate to a search engine
3. Type the search query
4. Press Enter to search
```

### Skill File Format

**Frontmatter Fields:**
- `name`: Unique identifier for the skill (required)
- `description`: Brief description of what the skill does (required)
- `keywords`: Comma-separated keywords for matching (optional)
- `priority`: Priority level 1-10 (optional, default: 5)

**Body:**
- Detailed documentation about the skill
- Usage instructions
- Examples
- Implementation details

### Skill Matching

The agent automatically matches skills to tasks based on:
1. Keywords in the skill metadata
2. Skill name and description
3. Task content analysis

## Security Configuration

### Blocked Applications

The following system applications are blocked by default:
- `cmd`, `powershell` - Command-line interfaces
- `regedit` - Registry Editor
- `taskmgr` - Task Manager
- `msconfig` - System Configuration
- `gpedit`, `secpol` - Security and policy editors
- `diskmgmt`, `compmgmt` - System management tools

### Blocked Key Combinations

Dangerous keyboard shortcuts are blocked:
- `Alt+F4` - Close window
- `Ctrl+Alt+Delete` - Security options
- `Win+R` - Run dialog
- `Win+X` - Quick access menu

### Blocked Text Patterns

Text input matching these patterns is blocked:
- `rm -rf` - Dangerous delete command
- `del /s`, `del /f` - Windows delete commands
- `format [drive]:` - Disk formatting
- `shutdown` - Shutdown commands
- `password`, `credential` - Sensitive data

### Operation Confirmation

By default, these operations require user confirmation:
- `key_combo` - Keyboard shortcuts
- `type_text` - Text input
- `open_app` - Opening applications

## Architecture

### Core Modules

- **agent.js** - Main agent loop and orchestration
- **openai.js** - Azure OpenAI integration
- **screenshot.js** - Screen capture functionality
- **controls.js** - Mouse and keyboard control
- **skills.js** - Skills system and management
- **security.js** - Security checks and audit
- **index.js** - Express server and API routes

### Control Methods

The agent can perform these actions:
- `click(x, y)` - Click at coordinates
- `doubleClick(x, y)` - Double-click at coordinates
- `typeText(text)` - Type text
- `pressKey(key)` - Press a single key
- `keyCombo(keys)` - Press key combination
- `scroll(direction, amount)` - Scroll up/down
- `drag(x1, y1, x2, y2)` - Drag from point to point
- `wait(ms)` - Wait for specified time
- `openApp(appName)` - Open an application

### Agent Loop

1. Capture screen screenshot
2. Send to GPT-4o Vision with task description
3. Receive action plan
4. Execute actions with security checks
5. Verify results
6. Repeat until task is complete or max iterations reached

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses Node.js watch mode to automatically restart on file changes.

### Environment Variables

- `PORT` - Server port (default: 3200)
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint URL
- `MODEL_NAME` - GPT-4o deployment name (default: gpt-4o)
- `SKILLS_DIR` - Skills directory path (default: `./skills`)

## Troubleshooting

### Authentication Issues

If you get authentication errors:
1. Make sure you're logged in to Azure: `az login`
2. Verify your Azure subscription has access to the OpenAI resource
3. Check that `AZURE_OPENAI_ENDPOINT` is correctly set

### Screen Capture Issues

On Windows, make sure:
- The application has permission to capture the screen
- No applications are blocking screen capture (e.g., DRM-protected content)

### Security Blocks

If operations are being blocked:
1. Check `/security/status` to see blocked operations
2. Adjust security configuration via `/security/config`
3. Temporarily disable security mode for testing (not recommended in production)

## License

This project is provided as-is for demonstration purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

**Note**: This agent has access to control your computer. Always review the security settings and monitor the agent's actions. Never run untrusted code or disable security features in production environments.
