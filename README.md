# Computer Agent - AI 电脑控制助手

基于 GPT-4o Vision 的 AI 驱动电脑控制助手，提供完整的 Web UI 管理界面。

## 功能特性

### 🖥️ 任务控制
- **自然语言任务执行**：通过自然语言描述任务，AI 自动分析并执行
- **实时屏幕预览**：查看 AI 看到的屏幕内容
- **执行日志**：实时查看任务执行的详细日志
- **示例任务**：预设常用任务示例，快速开始

### ✨ 技能管理
- **技能加载**：自动加载和管理技能模块
- **技能匹配**：根据任务自动匹配相关技能
- **技能详情**：查看每个技能的描述和路径

### 🔒 安全设置
- **安全模式开关**：启用/禁用安全保护机制
- **操作确认**：高风险操作需要用户确认
- **安全统计**：实时查看会话状态、操作次数、速率限制
- **待确认操作**：管理所有需要确认的操作

### 📊 任务历史
- **历史记录**：查看所有执行过的任务
- **执行详情**：查看任务执行时间和操作次数
- **结果状态**：清晰显示任务成功或失败状态

## 安装

```bash
# 克隆仓库
git clone https://github.com/zhiqianlu/computer-agent.git
cd computer-agent

# 安装依赖
npm install

# 启动服务器
npm start
```

## 使用

### 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3200` 上运行。

### 访问 Web UI

在浏览器中打开 `http://localhost:3200`，你将看到：

1. **任务控制**：执行任务的主界面
2. **技能管理**：查看和管理已加载的技能
3. **安全设置**：配置安全选项和确认待处理操作
4. **任务历史**：查看历史执行记录

### 配置

需要配置以下环境变量：

- `AZURE_OPENAI_API_KEY`：Azure OpenAI API 密钥
- `AZURE_OPENAI_ENDPOINT`：Azure OpenAI 端点
- `AZURE_OPENAI_DEPLOYMENT`：部署名称

或者使用 OpenAI API：

- `OPENAI_API_KEY`：OpenAI API 密钥

## API 端点

### 任务管理

- `POST /task` - 启动新任务
- `GET /task/status` - 获取任务状态
- `POST /task/stop` - 停止当前任务
- `GET /history` - 获取任务历史

### 技能管理

- `GET /skills` - 获取所有技能
- `POST /skills/refresh` - 刷新技能缓存
- `GET /skills/:name` - 获取特定技能详情
- `POST /skills/match` - 测试任务与技能匹配

### 安全管理

- `GET /security/status` - 获取安全状态
- `GET /security/config` - 获取安全配置
- `PATCH /security/config` - 更新安全配置
- `POST /security/toggle` - 开关安全模式
- `GET /security/confirmations` - 获取待确认操作
- `POST /security/confirm/:id` - 确认操作
- `POST /security/reject/:id` - 拒绝操作

## 安全特性

### 操作审计
- 所有操作都被记录和审计
- 支持操作速率限制
- 会话超时保护

### 权限控制
- 敏感应用黑名单（cmd、powershell、regedit 等）
- 危险组合键拦截
- 敏感文本模式过滤
- 屏幕保护区域设置

### 确认机制
- 高风险操作需要用户确认
- 支持批准和拒绝操作
- 确认请求自动过期（30秒）

## 技能系统

技能是预定义的任务模板，可以帮助 AI 更好地完成特定类型的任务。

技能文件应放置在 `skills/` 目录下，格式为：

```markdown
# 技能名称

技能描述

## 使用场景
- 场景1
- 场景2

## 示例
任务示例
```

## 项目结构

```
computer-agent/
├── src/
│   ├── index.js          # 主服务器
│   ├── agent.js          # AI 代理控制循环
│   ├── openai.js         # OpenAI API 集成
│   ├── controls.js       # 系统控制操作
│   ├── screenshot.js     # 屏幕截图功能
│   ├── security.js       # 安全控制模块
│   └── skills.js         # 技能管理模块
├── public/
│   └── index.html        # Web UI 前端
├── skills/               # 技能定义目录
├── package.json
└── README.md
```

## 技术栈

### 后端
- **Node.js** - JavaScript 运行时
- **Express** - Web 框架
- **screenshot-desktop** - 屏幕截图
- **sharp** - 图像处理
- **@azure/identity** - Azure 身份验证

### 前端
- **纯 HTML/CSS/JavaScript** - 无框架依赖
- **响应式设计** - 支持移动设备
- **模块化组件** - 标签页导航

### AI
- **GPT-4o Vision** - 视觉理解和任务执行
- **OpenAI Responses API** - 函数调用和工具使用

## 开发

### 开发模式

```bash
npm run dev
```

使用 `--watch` 模式自动重启服务器。

### 调试

服务器会输出详细的日志信息：

- 🚀 任务启动
- 📸 截图迭代
- 🤖 GPT-4o 调用
- 🔧 工具执行
- 🔒 安全检查
- ✅ 任务完成

## 注意事项

1. **安全性**：默认启用安全模式，建议保持启用
2. **API 配额**：频繁调用可能消耗较多 API 配额
3. **屏幕分辨率**：建议使用较低分辨率以减少 API 调用成本
4. **任务复杂度**：复杂任务可能需要多次迭代，请耐心等待

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请在 GitHub Issues 中提出。
