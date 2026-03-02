/**
 * Main Application Module
 * Handles core application state and initialization
 */

class ComputerAgentApp {
  constructor() {
    this.state = {
      isRunning: false,
      currentTask: null,
      pollInterval: null,
      skills: [],
      securityStatus: null,
      history: []
    };

    this.modules = {
      ui: null,
      api: null,
      skills: null,
      security: null
    };
  }

  async init() {
    // Initialize API client
    this.modules.api = new APIClient();

    // Initialize UI modules
    this.modules.ui = new UIManager(this);
    this.modules.skills = new SkillsManager(this);
    this.modules.security = new SecurityManager(this);

    // Load initial data
    await this.loadInitialData();

    // Setup event listeners
    this.setupEventListeners();

    console.log('Computer Agent App initialized');
  }

  async loadInitialData() {
    try {
      // Load skills
      const skillsData = await this.modules.api.getSkills();
      this.state.skills = skillsData.skills || [];
      this.modules.skills.updateSkillsList();

      // Load security status
      const securityStatus = await this.modules.api.getSecurityStatus();
      this.state.securityStatus = securityStatus;
      this.modules.security.updateSecurityStatus();

      // Load history
      const history = await this.modules.api.getHistory();
      this.state.history = history || [];
      this.modules.ui.updateHistory();

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.modules.ui.showError('加载初始数据失败: ' + error.message);
    }
  }

  setupEventListeners() {
    // Task control buttons
    document.getElementById('startBtn')?.addEventListener('click', () => this.startTask());
    document.getElementById('stopBtn')?.addEventListener('click', () => this.stopTask());

    // Refresh buttons
    document.getElementById('refreshSkills')?.addEventListener('click', () => this.modules.skills.refreshSkills());
    document.getElementById('refreshSecurity')?.addEventListener('click', () => this.modules.security.refreshStatus());
  }

  async startTask() {
    const taskInput = document.getElementById('taskInput');
    const task = taskInput.value.trim();

    if (!task) {
      this.modules.ui.showError('请输入任务');
      return;
    }

    try {
      this.modules.ui.log('message', `开始任务: ${task}`);
      await this.modules.api.startTask(task);

      this.state.isRunning = true;
      this.state.currentTask = task;

      // Update UI
      document.getElementById('startBtn').disabled = true;
      document.getElementById('stopBtn').style.display = 'inline-flex';
      this.modules.ui.updateStatus('running', '正在执行任务...');

      // Start polling
      this.state.pollInterval = setInterval(() => this.pollStatus(), 1000);

    } catch (error) {
      this.modules.ui.log('error', `错误: ${error.message}`);
      this.modules.ui.updateStatus('error', error.message);
      this.modules.ui.showError('启动任务失败: ' + error.message);
    }
  }

  async pollStatus() {
    try {
      const data = await this.modules.api.getTaskStatus();

      if (!data.running) {
        // Task completed
        clearInterval(this.state.pollInterval);
        this.state.isRunning = false;
        this.state.currentTask = null;

        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').style.display = 'none';

        if (data.lastTask?.result?.success) {
          this.modules.ui.updateStatus('complete', '任务完成');
          this.modules.ui.log('message', `✅ ${data.lastTask.result.summary}`);
        } else if (data.lastTask?.error) {
          this.modules.ui.updateStatus('error', '任务失败');
          this.modules.ui.log('error', data.lastTask.error);
        } else {
          this.modules.ui.updateStatus('idle', '空闲');
        }

        // Reload history
        const history = await this.modules.api.getHistory();
        this.state.history = history || [];
        this.modules.ui.updateHistory();

        return;
      }

      // Process updates
      if (data.updates && data.updates.length > 0) {
        const lastUpdate = data.updates[data.updates.length - 1];

        if (lastUpdate.type === 'screenshot' && lastUpdate.screenshot) {
          this.modules.ui.updateScreenshot(lastUpdate.screenshot);
        }

        if (lastUpdate.type === 'action') {
          this.modules.ui.log('action', `🔧 ${lastUpdate.tool}: ${JSON.stringify(lastUpdate.args)}`);
        }

        if (lastUpdate.type === 'message') {
          this.modules.ui.log('message', `💬 ${lastUpdate.content}`);
        }
      }

    } catch (error) {
      console.error('Poll error:', error);
    }
  }

  async stopTask() {
    try {
      await this.modules.api.stopTask();
      this.modules.ui.log('message', '已请求停止任务');
    } catch (error) {
      this.modules.ui.log('error', `停止失败: ${error.message}`);
    }
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', async () => {
  app = new ComputerAgentApp();
  await app.init();
});
