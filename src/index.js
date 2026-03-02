import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { runAgent, setSecurityMode } from './agent.js';
import { getSkills, refreshSkills, matchSkills, loadSkillByName } from './skills.js';
import { 
  getSecurityConfig, 
  updateSecurityConfig, 
  getSecurityStatus,
  getPendingConfirmations,
  confirmOperation,
  rejectOperation
} from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3200;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// 当前任务状态
let currentTask = null;
let taskHistory = [];

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', hasTask: !!currentTask });
});

// 启动任务
app.post('/task', async (req, res) => {
  const { task } = req.body;
  
  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }
  
  if (currentTask) {
    return res.status(409).json({ error: 'A task is already running' });
  }
  
  currentTask = { task, startTime: Date.now(), updates: [] };
  taskHistory = [];
  
  console.log(`\n🚀 Starting task: ${task}`);
  res.json({ message: 'Task started', task });
  
  try {
    const result = await runAgent(task, (update) => {
      currentTask.updates.push(update);
      console.log('Update:', update.type);
    });
    
    currentTask.result = result;
    currentTask.endTime = Date.now();
    taskHistory.push({ ...currentTask });
    currentTask = null;
    
  } catch (error) {
    console.error('Task error:', error);
    currentTask.error = error.message;
    currentTask.endTime = Date.now();
    taskHistory.push({ ...currentTask });
    currentTask = null;
  }
});

// 获取任务状态
app.get('/task/status', (req, res) => {
  if (!currentTask) {
    return res.json({ running: false, lastTask: taskHistory[taskHistory.length - 1] || null });
  }
  
  res.json({
    running: true,
    task: currentTask.task,
    startTime: currentTask.startTime,
    updates: currentTask.updates.slice(-10) // 只返回最近 10 条更新
  });
});

// 停止任务 (设置标志，不是立即停止)
app.post('/task/stop', (req, res) => {
  if (!currentTask) {
    return res.status(400).json({ error: 'No task running' });
  }
  
  // 这里只能设置标志，真正停止需要在 agent 循环中检查
  currentTask.stopRequested = true;
  res.json({ message: 'Stop requested' });
});

// 获取历史
app.get('/history', (req, res) => {
  res.json(taskHistory);
});

// ===== Skills API =====

// 获取所有已加载的 skills
app.get('/skills', async (req, res) => {
  try {
    const skills = await getSkills();
    res.json({
      count: skills.length,
      skills: skills.map(s => ({
        name: s.name,
        description: s.description,
        path: s.path
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 刷新 skills 缓存
app.post('/skills/refresh', async (req, res) => {
  try {
    const skills = await refreshSkills();
    res.json({
      message: 'Skills refreshed',
      count: skills.length,
      skills: skills.map(s => s.name)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个 skill 的详细信息
app.get('/skills/:name', async (req, res) => {
  try {
    const skill = await loadSkillByName(req.params.name);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 测试任务与 skills 的匹配
app.post('/skills/match', async (req, res) => {
  const { task } = req.body;
  if (!task) {
    return res.status(400).json({ error: 'Task is required' });
  }
  
  try {
    const skills = await getSkills();
    const matched = matchSkills(task, skills);
    res.json({
      task,
      matchedCount: matched.length,
      matches: matched.map(s => ({
        name: s.name,
        description: s.description,
        matchScore: s.matchScore
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== Security API =====

// 获取安全状态
app.get('/security/status', (req, res) => {
  res.json(getSecurityStatus());
});

// 获取安全配置
app.get('/security/config', (req, res) => {
  res.json(getSecurityConfig());
});

// 更新安全配置
app.patch('/security/config', (req, res) => {
  try {
    updateSecurityConfig(req.body);
    res.json({ message: 'Config updated', config: getSecurityConfig() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启用/禁用安全模式
app.post('/security/toggle', (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled (boolean) is required' });
  }
  setSecurityMode(enabled);
  res.json({ message: `Security mode ${enabled ? 'enabled' : 'disabled'}`, enabled });
});

// 获取待确认的操作
app.get('/security/confirmations', (req, res) => {
  res.json({ confirmations: getPendingConfirmations() });
});

// 确认操作
app.post('/security/confirm/:id', (req, res) => {
  const result = confirmOperation(req.params.id);
  if (!result.success) {
    return res.status(400).json({ error: result.reason });
  }
  res.json({ message: 'Operation confirmed', ...result });
});

// 拒绝操作
app.post('/security/reject/:id', (req, res) => {
  const result = rejectOperation(req.params.id);
  res.json({ message: 'Operation rejected' });
});

app.listen(PORT, async () => {
  // 预加载 skills
  console.log('📦 Loading skills...');
  const skills = await getSkills();
  
  console.log(`
🖥️  Computer Agent Server
========================
端口: ${PORT}
Web UI: http://localhost:${PORT}
已加载 Skills: ${skills.length} 个
安全模式: 已启用 🔒

API 端点:
  POST /task - 启动任务
  GET  /task/status - 获取任务状态
  POST /task/stop - 停止任务
  GET  /history - 获取历史
  
  GET  /skills - 查看所有技能
  POST /skills/refresh - 刷新技能
  GET  /skills/:name - 获取技能详情
  POST /skills/match - 测试任务匹配
  
  GET  /security/status - 安全状态
  GET  /security/config - 安全配置
  PATCH /security/config - 更新配置
  POST /security/toggle - 开关安全模式
  GET  /security/confirmations - 待确认操作
  POST /security/confirm/:id - 确认操作
  POST /security/reject/:id - 拒绝操作
  `);
});
