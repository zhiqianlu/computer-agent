/**
 * 安全控制模块
 * 提供操作审计、权限控制、敏感区域保护等功能
 */

// 安全配置
const securityConfig = {
  // 是否启用安全模式
  enabled: true,
  
  // 需要确认的高风险操作
  requireConfirmation: {
    enabled: true,
    operations: [
      'key_combo',      // 组合键可能执行危险操作
      'type_text',      // 输入文字可能包含敏感内容
      'open_app',       // 打开应用需要审核
    ]
  },
  
  // 敏感应用黑名单 - 禁止打开这些应用
  blockedApps: [
    'cmd',
    'powershell',
    'regedit',
    'taskmgr',
    'msconfig',
    'gpedit',
    'secpol',
    'diskmgmt',
    'compmgmt',
  ],
  
  // 敏感组合键黑名单
  blockedKeyCombos: [
    ['alt', 'f4'],           // 关闭窗口
    ['ctrl', 'alt', 'delete'], // 安全选项
    ['win', 'r'],            // 运行对话框
    ['win', 'x'],            // 快速链接菜单
  ],
  
  // 敏感文本模式 - 禁止输入匹配这些模式的文本
  blockedTextPatterns: [
    /rm\s+-rf/i,             // 危险的删除命令
    /del\s+\/[sf]/i,         // Windows 删除命令
    /format\s+[a-z]:/i,      // 格式化磁盘
    /shutdown/i,             // 关机命令
    /password/i,             // 密码相关
    /credential/i,           // 凭据相关
  ],
  
  // 屏幕敏感区域 (相对坐标 0-1)
  protectedAreas: [
    { name: '任务栏', x1: 0, y1: 0.95, x2: 1, y2: 1 },
    { name: '系统托盘', x1: 0.8, y1: 0.95, x2: 1, y2: 1 },
  ],
  
  // 操作速率限制
  rateLimit: {
    enabled: true,
    maxOperationsPerMinute: 60,
    cooldownMs: 500,  // 操作间隔最小时间
  },
  
  // 会话超时
  sessionTimeout: {
    enabled: true,
    maxDurationMs: 5 * 60 * 1000,  // 5 分钟
    maxIterations: 30,
  },
  
  // 审计日志
  audit: {
    enabled: true,
    logFile: 'security-audit.log',
  }
};

// 操作历史（用于速率限制）
let operationHistory = [];
let sessionStartTime = null;
let pendingConfirmations = new Map();
let confirmationIdCounter = 0;

/**
 * 初始化会话
 */
export function startSecuritySession() {
  sessionStartTime = Date.now();
  operationHistory = [];
  pendingConfirmations.clear();
  logAudit('SESSION_START', { timestamp: new Date().toISOString() });
}

/**
 * 结束会话
 */
export function endSecuritySession() {
  logAudit('SESSION_END', { 
    duration: Date.now() - sessionStartTime,
    operationCount: operationHistory.length
  });
  sessionStartTime = null;
  operationHistory = [];
}

/**
 * 检查操作是否被允许
 * @returns {{ allowed: boolean, reason?: string, requiresConfirmation?: boolean, confirmationId?: string }}
 */
export function checkOperation(operation, args, screenInfo) {
  if (!securityConfig.enabled) {
    return { allowed: true };
  }
  
  // 检查会话超时
  if (securityConfig.sessionTimeout.enabled && sessionStartTime) {
    const elapsed = Date.now() - sessionStartTime;
    if (elapsed > securityConfig.sessionTimeout.maxDurationMs) {
      return { 
        allowed: false, 
        reason: `会话超时 (${Math.round(elapsed / 1000)}秒)，请重新开始任务` 
      };
    }
  }
  
  // 检查速率限制
  if (securityConfig.rateLimit.enabled) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentOps = operationHistory.filter(t => t > oneMinuteAgo);
    
    if (recentOps.length >= securityConfig.rateLimit.maxOperationsPerMinute) {
      return { 
        allowed: false, 
        reason: `操作速率过快，请稍后再试 (${recentOps.length}/分钟)` 
      };
    }
    
    const lastOp = operationHistory[operationHistory.length - 1];
    if (lastOp && (now - lastOp) < securityConfig.rateLimit.cooldownMs) {
      return { 
        allowed: false, 
        reason: `操作间隔过短，请等待 ${securityConfig.rateLimit.cooldownMs}ms` 
      };
    }
  }
  
  // 检查具体操作
  let result;
  switch (operation) {
    case 'open_app':
      result = checkOpenApp(args);
      break;
    case 'key_combo':
      result = checkKeyCombo(args);
      break;
    case 'type_text':
      result = checkTypeText(args);
      break;
    case 'click':
    case 'double_click':
      result = checkClick(args, screenInfo);
      break;
    default:
      result = { allowed: true };
  }
  
  if (!result.allowed) {
    logAudit('BLOCKED', { operation, args, reason: result.reason });
    return result;
  }
  
  // 检查是否需要确认
  if (securityConfig.requireConfirmation.enabled && 
      securityConfig.requireConfirmation.operations.includes(operation)) {
    const confirmationId = `confirm_${++confirmationIdCounter}`;
    pendingConfirmations.set(confirmationId, { operation, args, timestamp: Date.now() });
    
    logAudit('CONFIRMATION_REQUIRED', { operation, args, confirmationId });
    
    return {
      allowed: false,
      requiresConfirmation: true,
      confirmationId,
      reason: `操作 "${operation}" 需要确认`
    };
  }
  
  // 记录操作
  operationHistory.push(Date.now());
  logAudit('ALLOWED', { operation, args });
  
  return { allowed: true };
}

/**
 * 确认待处理的操作
 */
export function confirmOperation(confirmationId) {
  const pending = pendingConfirmations.get(confirmationId);
  if (!pending) {
    return { success: false, reason: '确认请求不存在或已过期' };
  }
  
  // 检查确认是否过期 (30秒)
  if (Date.now() - pending.timestamp > 30000) {
    pendingConfirmations.delete(confirmationId);
    return { success: false, reason: '确认请求已过期' };
  }
  
  pendingConfirmations.delete(confirmationId);
  operationHistory.push(Date.now());
  logAudit('CONFIRMED', { confirmationId, ...pending });
  
  return { success: true, operation: pending.operation, args: pending.args };
}

/**
 * 拒绝待处理的操作
 */
export function rejectOperation(confirmationId) {
  const pending = pendingConfirmations.get(confirmationId);
  if (pending) {
    pendingConfirmations.delete(confirmationId);
    logAudit('REJECTED', { confirmationId, ...pending });
  }
  return { success: true };
}

/**
 * 获取所有待确认的操作
 */
export function getPendingConfirmations() {
  const now = Date.now();
  const result = [];
  
  for (const [id, pending] of pendingConfirmations.entries()) {
    if (now - pending.timestamp < 30000) {
      result.push({ id, ...pending });
    } else {
      pendingConfirmations.delete(id);
    }
  }
  
  return result;
}

/**
 * 检查打开应用
 */
function checkOpenApp(args) {
  const appName = (args.app_name || '').toLowerCase();
  
  for (const blocked of securityConfig.blockedApps) {
    if (appName.includes(blocked)) {
      return { 
        allowed: false, 
        reason: `应用 "${args.app_name}" 在黑名单中，禁止打开` 
      };
    }
  }
  
  return { allowed: true };
}

/**
 * 检查组合键
 */
function checkKeyCombo(args) {
  const keys = (args.keys || []).map(k => k.toLowerCase());
  
  for (const blocked of securityConfig.blockedKeyCombos) {
    if (blocked.length === keys.length && 
        blocked.every(k => keys.includes(k))) {
      return { 
        allowed: false, 
        reason: `组合键 ${keys.join('+')} 在黑名单中，禁止执行` 
      };
    }
  }
  
  return { allowed: true };
}

/**
 * 检查输入文本
 */
function checkTypeText(args) {
  const text = args.text || '';
  
  for (const pattern of securityConfig.blockedTextPatterns) {
    if (pattern.test(text)) {
      return { 
        allowed: false, 
        reason: `输入文本包含敏感内容，禁止执行` 
      };
    }
  }
  
  return { allowed: true };
}

/**
 * 检查点击位置
 */
function checkClick(args, screenInfo) {
  if (!screenInfo || !screenInfo.width || !screenInfo.height) {
    return { allowed: true };
  }
  
  const relX = args.x / screenInfo.width;
  const relY = args.y / screenInfo.height;
  
  for (const area of securityConfig.protectedAreas) {
    if (relX >= area.x1 && relX <= area.x2 && 
        relY >= area.y1 && relY <= area.y2) {
      return { 
        allowed: false, 
        reason: `点击位置 (${args.x}, ${args.y}) 在保护区域 "${area.name}" 内，禁止点击` 
      };
    }
  }
  
  return { allowed: true };
}

/**
 * 审计日志
 */
function logAudit(event, data) {
  if (!securityConfig.audit.enabled) return;
  
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...data
  };
  
  console.log(`🔒 [Security] ${event}:`, JSON.stringify(data));
  
  // 可以扩展为写入文件
  // fs.appendFileSync(securityConfig.audit.logFile, JSON.stringify(entry) + '\n');
}

/**
 * 获取当前安全配置
 */
export function getSecurityConfig() {
  return { ...securityConfig };
}

/**
 * 更新安全配置
 */
export function updateSecurityConfig(updates) {
  Object.assign(securityConfig, updates);
  logAudit('CONFIG_UPDATED', updates);
}

/**
 * 获取安全状态
 */
export function getSecurityStatus() {
  return {
    enabled: securityConfig.enabled,
    sessionActive: sessionStartTime !== null,
    sessionDuration: sessionStartTime ? Date.now() - sessionStartTime : 0,
    operationCount: operationHistory.length,
    pendingConfirmations: pendingConfirmations.size,
    rateLimit: {
      current: operationHistory.filter(t => t > Date.now() - 60000).length,
      max: securityConfig.rateLimit.maxOperationsPerMinute
    }
  };
}
