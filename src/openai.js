import { DefaultAzureCredential } from '@azure/identity';

const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || 'https://zqcontent-rg.openai.azure.com';
const DEPLOYMENT_NAME = process.env.MODEL_NAME || 'gpt-4o';
const API_VERSION = '2024-12-01-preview';

let cachedToken = null;
let tokenExpiry = 0;

/**
 * 获取 Azure 访问令牌
 */
async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 60000) {
    return cachedToken;
  }
  
  const credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken('https://cognitiveservices.azure.com/.default');
  cachedToken = tokenResponse.token;
  tokenExpiry = tokenResponse.expiresOnTimestamp;
  return cachedToken;
}

/**
 * 调用 OpenAI Responses API (Chat Completions with vision)
 * @param {Array} messages - 消息数组
 * @param {Object} screenInfo - 屏幕信息
 * @param {Object} options - 可选参数
 * @param {string} options.skillsPrompt - 技能提示（由 skills 模块生成）
 */
export async function callOpenAI(messages, screenInfo, options = {}) {
  const { skillsPrompt = '' } = options;
  const token = await getAccessToken();
  
  const url = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`;
  
  // 构建消息，包含屏幕截图
  const formattedMessages = messages.map(msg => {
    if (msg.role === 'user' && msg.screenshot) {
      return {
        role: 'user',
        content: [
          { type: 'text', text: msg.content },
          {
            type: 'image_url',
            image_url: {
              url: `data:${msg.screenshot.mimeType};base64,${msg.screenshot.base64}`,
              detail: 'high'
            }
          }
        ]
      };
    }
    return msg;
  });
  
  // 定义工具 (电脑控制功能)
  const tools = [
    {
      type: 'function',
      function: {
        name: 'open_app',
        description: '直接打开应用程序。这是最可靠的打开应用方式！',
        parameters: {
          type: 'object',
          properties: {
            app_name: { type: 'string', description: '应用名称，如: calc, notepad, paint, explorer, chrome, edge, word, excel, vscode' }
          },
          required: ['app_name']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'click',
        description: '在屏幕指定位置点击鼠标',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: '点击位置的 X 坐标' },
            y: { type: 'number', description: '点击位置的 Y 坐标' },
            button: { type: 'string', enum: ['left', 'right'], description: '鼠标按键，默认 left' }
          },
          required: ['x', 'y']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'double_click',
        description: '在屏幕指定位置双击鼠标',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X 坐标' },
            y: { type: 'number', description: 'Y 坐标' }
          },
          required: ['x', 'y']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'type_text',
        description: '输入文字',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '要输入的文字' }
          },
          required: ['text']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'press_key',
        description: '按下键盘按键',
        parameters: {
          type: 'object',
          properties: {
            key: { type: 'string', description: '按键名称，如 enter, tab, escape, backspace, space, up, down, left, right 等' }
          },
          required: ['key']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'key_combo',
        description: '按下组合键',
        parameters: {
          type: 'object',
          properties: {
            keys: { 
              type: 'array', 
              items: { type: 'string' },
              description: '组合键数组，如 ["ctrl", "c"] 表示 Ctrl+C'
            }
          },
          required: ['keys']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'scroll',
        description: '滚动鼠标滚轮',
        parameters: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X 坐标' },
            y: { type: 'number', description: 'Y 坐标' },
            delta_y: { type: 'number', description: '垂直滚动量，正数向下，负数向上' }
          },
          required: ['x', 'y', 'delta_y']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'drag',
        description: '拖拽操作',
        parameters: {
          type: 'object',
          properties: {
            start_x: { type: 'number', description: '起始 X 坐标' },
            start_y: { type: 'number', description: '起始 Y 坐标' },
            end_x: { type: 'number', description: '结束 X 坐标' },
            end_y: { type: 'number', description: '结束 Y 坐标' }
          },
          required: ['start_x', 'start_y', 'end_x', 'end_y']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'wait',
        description: '等待指定毫秒数',
        parameters: {
          type: 'object',
          properties: {
            ms: { type: 'number', description: '等待的毫秒数' }
          },
          required: ['ms']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'task_complete',
        description: '任务已完成，结束控制循环',
        parameters: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: '任务完成摘要' }
          },
          required: ['summary']
        }
      }
    }
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: `你是一个电脑控制 AI Agent。你必须通过调用工具来直接控制电脑完成用户任务。

屏幕尺寸: ${screenInfo.width} x ${screenInfo.height}

**严格规则 - 必须遵守:**
1. 你必须调用工具来执行操作，绝对不能只返回文字说明
2. 仔细观察屏幕截图，识别 UI 元素的精确坐标
3. 每次只执行一个操作，然后等待新截图
4. **打开应用程序必须使用 open_app 工具！**这是最可靠的方式
5. 坐标是实际屏幕像素坐标
6. 任务完成后必须调用 task_complete

**打开计算器并计算的正确步骤:**
1. 调用 open_app("calc") 直接打开计算器 - 这是最可靠的！
2. 等待500ms后查看截图确认计算器已打开
3. 使用 click 点击计算器上的数字按钮
4. 完成计算后调用 task_complete

**绝对禁止:** 只返回文字建议而不调用工具！必须立即执行操作！${skillsPrompt}`
        },
        ...formattedMessages
      ],
      tools,
      tool_choice: 'required',
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  return await response.json();
}
