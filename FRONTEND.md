# Computer Agent - Frontend UI Web

AI-powered computer control assistant with a modern web interface.

## Features

### 🎯 Task Control
- **Task Execution**: Submit tasks for the AI agent to execute
- **Real-time Status**: Monitor task execution with live status updates
- **Screen Preview**: View what the AI sees during task execution
- **Activity Log**: Track all actions and operations in real-time
- **Example Tasks**: Quick-start with pre-defined example tasks

### 📦 Skills Management
- **Skills Listing**: View all available skills loaded by the agent
- **Skill Details**: Examine skill descriptions and configurations
- **Skill Matching**: Test which skills match your task description
- **Refresh**: Reload skills from the filesystem

### 🔒 Security Controls
- **Security Status**: Monitor security mode, session activity, and operation counts
- **Rate Limiting**: View current operation rate limits
- **Pending Confirmations**: Review and approve/reject operations requiring confirmation
- **Security Configuration**: View and manage security settings
- **Toggle Security**: Enable/disable security mode

### 📜 Task History
- **History Tracking**: View past task executions
- **Success/Failure Status**: See which tasks completed successfully
- **Execution Details**: Review task summaries and error messages
- **Time Tracking**: See when tasks were executed

## Architecture

### Modular Frontend Structure

The frontend is built with a modular architecture for maintainability and extensibility:

```
public/
├── index.html           # Main HTML with tab-based layout
├── styles.css           # Comprehensive styling
├── app.js              # Main application controller
├── api-client.js       # Backend API communication
├── ui-manager.js       # UI updates and user feedback
├── skills-manager.js   # Skills listing and management
├── security-manager.js # Security status and confirmations
└── tabs.js            # Tab navigation
```

### Component Overview

#### **app.js** - Main Application
- Initializes all modules
- Manages application state
- Handles task execution and polling
- Coordinates between modules

#### **api-client.js** - API Client
- Centralized HTTP communication
- Handles all backend endpoints:
  - Task management (`/task`, `/task/status`, `/task/stop`)
  - Skills (`/skills`, `/skills/refresh`, `/skills/:name`)
  - Security (`/security/*`)
  - History (`/history`)

#### **ui-manager.js** - UI Manager
- Status updates
- Activity logging
- Screenshot display
- Task history rendering
- Error/success notifications

#### **skills-manager.js** - Skills Manager
- Skills list display
- Skill detail modals
- Skills refresh
- Skill matching test

#### **security-manager.js** - Security Manager
- Security status display
- Pending confirmations management
- Security toggle
- Configuration viewer

#### **tabs.js** - Tab Navigation
- Simple tab switching functionality

## Usage

### Starting the Server

```bash
npm start
```

The server will start on port 3200 (or the port specified in `PORT` environment variable).

Access the web interface at: `http://localhost:3200`

### Using the Interface

1. **Submit a Task**
   - Navigate to the "任务控制" (Task Control) tab
   - Enter your task in the textarea
   - Click "开始执行" (Start Execution)
   - Monitor progress in the log and screen preview

2. **Manage Skills**
   - Navigate to the "技能管理" (Skills Management) tab
   - View all available skills
   - Click "详情" on any skill to see its full description
   - Use "测试匹配" to test which skills match the current task input

3. **Security Settings**
   - Navigate to the "安全设置" (Security Settings) tab
   - View current security status
   - Approve or reject pending operations
   - Toggle security mode on/off
   - View security configuration

4. **View History**
   - Navigate to the "历史记录" (History) tab
   - See all past task executions
   - Review success/failure status

## API Endpoints

The backend provides the following REST API endpoints:

### Task Management
- `POST /task` - Start a new task
- `GET /task/status` - Get current task status
- `POST /task/stop` - Request task stop
- `GET /history` - Get task history

### Skills
- `GET /skills` - List all skills
- `POST /skills/refresh` - Refresh skills cache
- `GET /skills/:name` - Get skill details
- `POST /skills/match` - Test skill matching

### Security
- `GET /security/status` - Get security status
- `GET /security/config` - Get security configuration
- `PATCH /security/config` - Update security configuration
- `POST /security/toggle` - Toggle security mode
- `GET /security/confirmations` - Get pending confirmations
- `POST /security/confirm/:id` - Confirm an operation
- `POST /security/reject/:id` - Reject an operation

## Design Principles

1. **Modular Architecture**: Each module has a single responsibility
2. **Separation of Concerns**: API, UI, and business logic are separated
3. **Responsive Design**: Works on desktop and mobile devices
4. **Real-time Updates**: Polling-based updates for task status
5. **User Feedback**: Clear error messages and success notifications
6. **Security First**: Built-in security controls and confirmations

## Technologies

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Node.js, Express.js
- **AI**: OpenAI GPT-4o Vision API
- **Image Processing**: Sharp (for screenshots)
- **Computer Control**: NirCmd (Windows) / Native APIs

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Future Enhancements

Possible improvements for future versions:

- [ ] WebSocket support for real-time updates (instead of polling)
- [ ] Dark/Light theme toggle
- [ ] Keyboard shortcuts
- [ ] Task templates and saved tasks
- [ ] Advanced screenshot viewer with zoom and pan
- [ ] Export task history
- [ ] Multi-language support
- [ ] User authentication
- [ ] Task scheduling
- [ ] Mobile app version

## Contributing

When contributing to the frontend:

1. Follow the modular architecture pattern
2. Add new features as separate modules when possible
3. Maintain consistent styling using the existing CSS classes
4. Test on multiple browsers
5. Document new API endpoints

## License

See main repository LICENSE file.
