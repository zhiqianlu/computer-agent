import { captureScreen, getScreenSize } from './screenshot.js';
import { click, doubleClick, typeText, pressKey, keyCombo, scroll, drag, wait, openApp } from './controls.js';
import { callOpenAI } from './openai.js';
import { getSkills, matchSkills, formatSkillsForPrompt } from './skills.js';
import { checkOperation, startSecuritySession, endSecuritySession } from './security.js';

const MAX_ITERATIONS = 50;

// 安全模式开关
let securityEnabled = true;

/**
 * 设置安全模式
 */
export function setSecurityMode(enabled) {
  securityEnabled = enabled;
  console.log(`🔒 Security mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
}

/**
 * 执行工具调用
 * @param {Object} toolCall - 工具调用对象
 * @param {Object} screenInfo - 屏幕信息（用于安全检查）
 */
async function executeTool(toolCall, screenInfo) {
  const { name, arguments: argsStr } = toolCall.function;
  const args = JSON.parse(argsStr);
  
  console.log(`\n🔧 Executing: ${name}`, args);
  
  // 安全检查
  if (securityEnabled) {
    const securityCheck = checkOperation(name, args, screenInfo);
    
    if (!securityCheck.allowed) {
      if (securityCheck.requiresConfirmation) {
        console.log(`⚠️ 操作需要确认: ${securityCheck.reason}`);
        return { 
          success: false, 
          blocked: true,
          requiresConfirmation: true,
          confirmationId: securityCheck.confirmationId,
          reason: securityCheck.reason 
        };
      }
      console.log(`🚫 操作被阻止: ${securityCheck.reason}`);
      return { success: false, blocked: true, reason: securityCheck.reason };
    }
  }
  
  switch (name) {
    case 'open_app':
      await openApp(args.app_name);
      return { success: true, action: `Opened app: ${args.app_name}` };
      
    case 'click':
      await click(args.x, args.y, args.button || 'left');
      return { success: true, action: `Clicked at (${args.x}, ${args.y})` };
      
    case 'double_click':
      await doubleClick(args.x, args.y);
      return { success: true, action: `Double-clicked at (${args.x}, ${args.y})` };
      
    case 'type_text':
      await typeText(args.text);
      return { success: true, action: `Typed: "${args.text}"` };
      
    case 'press_key':
      await pressKey(args.key);
      return { success: true, action: `Pressed key: ${args.key}` };
      
    case 'key_combo':
      await keyCombo(...args.keys);
      return { success: true, action: `Key combo: ${args.keys.join('+')}` };
      
    case 'scroll':
      await scroll(args.x, args.y, 0, args.delta_y);
      return { success: true, action: `Scrolled at (${args.x}, ${args.y})` };
      
    case 'drag':
      await drag(args.start_x, args.start_y, args.end_x, args.end_y);
      return { success: true, action: `Dragged from (${args.start_x}, ${args.start_y}) to (${args.end_x}, ${args.end_y})` };
      
    case 'wait':
      await wait(args.ms);
      return { success: true, action: `Waited ${args.ms}ms` };
      
    case 'task_complete':
      return { success: true, complete: true, summary: args.summary };
      
    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

/**
 * 运行 Agent 控制循环
 */
export async function runAgent(task, onUpdate) {
  const screenInfo = await getScreenSize();
  const messages = [];
  const history = [];
  
  // 启动安全会话
  if (securityEnabled) {
    startSecuritySession();
    console.log('🔒 Security session started');
  }
  
  // 加载并匹配相关技能
  console.log('🔍 Loading and matching skills...');
  const allSkills = await getSkills();
  const matchedSkills = matchSkills(task, allSkills);
  const skillsPrompt = formatSkillsForPrompt(matchedSkills);
  
  if (matchedSkills.length > 0) {
    console.log(`✨ Matched ${matchedSkills.length} skill(s): ${matchedSkills.map(s => s.name).join(', ')}`);
  } else {
    console.log('📭 No matching skills found');
  }
  
  onUpdate?.({ type: 'start', task, screenInfo, securityEnabled, matchedSkills: matchedSkills.map(s => ({ name: s.name, description: s.description })) });
  
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    console.log(`\n📸 Iteration ${i + 1}/${MAX_ITERATIONS}`);
    
    // 截取屏幕
    const screenshot = await captureScreen();
    onUpdate?.({ type: 'screenshot', iteration: i + 1, screenshot: screenshot.base64 });
    
    // 构建用户消息
    const userMessage = i === 0 
      ? { role: 'user', content: task, screenshot }
      : { role: 'user', content: '请继续执行任务。这是当前屏幕截图。', screenshot };
    
    messages.push(userMessage);
    
    // 调用 OpenAI（传入技能提示）
    console.log('🤖 Calling GPT-4o...');
    const response = await callOpenAI(messages, screenInfo, { skillsPrompt });
    
    const assistantMessage = response.choices[0].message;
    messages.push(assistantMessage);
    
    // 检查是否有工具调用
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        const result = await executeTool(toolCall, screenInfo);
        
        history.push({
          iteration: i + 1,
          tool: toolCall.function.name,
          args: JSON.parse(toolCall.function.arguments),
          result
        });
        
        onUpdate?.({ type: 'action', ...history[history.length - 1] });
        
        // 检查操作是否被安全模块阻止
        if (result.blocked) {
          console.log(`\n🚫 操作被安全模块阻止: ${result.reason}`);
          onUpdate?.({ type: 'security_blocked', reason: result.reason, requiresConfirmation: result.requiresConfirmation });
          
          // 如果需要确认，暂停任务
          if (result.requiresConfirmation) {
            endSecuritySession();
            return { 
              success: false, 
              pendingConfirmation: true, 
              confirmationId: result.confirmationId,
              reason: result.reason,
              history 
            };
          }
          
          // 跳过被阻止的操作，继续下一个
          continue;
        }
        
        // 检查任务是否完成
        if (result.complete) {
          console.log('\n✅ Task completed!');
          if (securityEnabled) endSecuritySession();
          onUpdate?.({ type: 'complete', summary: result.summary, history });
          return { success: true, summary: result.summary, history };
        }
        
        // 添加工具结果到消息
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
        
        // 等待一下让操作生效
        await wait(500);
      }
    } else if (assistantMessage.content) {
      // 纯文本回复
      console.log('💬 Assistant:', assistantMessage.content);
      onUpdate?.({ type: 'message', content: assistantMessage.content });
    }
  }
  
  console.log('\n⚠️ Max iterations reached');
  if (securityEnabled) endSecuritySession();
  onUpdate?.({ type: 'max_iterations', history });
  return { success: false, error: 'Max iterations reached', history };
}
