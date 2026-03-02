import { exec, spawn, execSync } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

/**
 * Windows PowerShell 控制方案
 * 使用临时脚本文件来确保命令正确执行
 */

async function runPowerShell(script) {
  // 创建临时脚本文件
  const tempFile = join(tmpdir(), `agent_${Date.now()}.ps1`);
  
  try {
    // 写入脚本
    writeFileSync(tempFile, script, 'utf8');
    
    // 执行脚本 - 使用 -WindowStyle Hidden 避免弹窗
    const { stdout, stderr } = await execAsync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${tempFile}"`,
      { encoding: 'utf8', windowsHide: true }
    );
    
    if (stderr) console.error('PowerShell error:', stderr);
    return stdout;
  } finally {
    // 删除临时文件
    try { unlinkSync(tempFile); } catch {}
  }
}

/**
 * 打开应用程序 - 使用 Start-Process 直接打开
 */
export async function openApp(appName) {
  // 常见应用映射
  const appMap = {
    'calc': 'calc.exe',
    'calculator': 'calc.exe',
    '计算器': 'calc.exe',
    'notepad': 'notepad.exe',
    '记事本': 'notepad.exe',
    'paint': 'mspaint.exe',
    '画图': 'mspaint.exe',
    'explorer': 'explorer.exe',
    '文件管理器': 'explorer.exe',
    'cmd': 'cmd.exe',
    'powershell': 'powershell.exe',
    'chrome': 'chrome.exe',
    'edge': 'msedge.exe',
    'firefox': 'firefox.exe',
    'word': 'winword.exe',
    'excel': 'excel.exe',
    'vscode': 'code.exe'
  };

  const executable = appMap[appName.toLowerCase()] || appName;
  
  return new Promise((resolve, reject) => {
    const child = spawn('cmd.exe', ['/c', 'start', '', executable], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });
    child.unref();
    
    setTimeout(() => {
      console.log(`Opened app: ${executable}`);
      resolve();
    }, 500);
  });
}

/**
 * 执行鼠标点击 - 添加可见的鼠标移动
 */
export async function click(x, y, button = 'left') {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);' -Name U32 -Namespace W

# 先移动鼠标到目标位置
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(x)}, ${Math.round(y)})

# 等待300毫秒让用户能看到鼠标移动
Start-Sleep -Milliseconds 300

# 执行点击
[W.U32]::mouse_event(${button === 'right' ? '0x0008' : '0x0002'}, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[W.U32]::mouse_event(${button === 'right' ? '0x0010' : '0x0004'}, 0, 0, 0, 0)

# 等待点击效果
Start-Sleep -Milliseconds 200
`;
  console.log(`[Mouse] Moving to (${x}, ${y}) and clicking ${button}...`);
  await runPowerShell(script);
  console.log(`[Mouse] Click completed at (${x}, ${y})`);
}

/**
 * 执行双击
 */
export async function doubleClick(x, y) {
  await click(x, y);
  await wait(100);
  await click(x, y);
  console.log(`Double-clicked at (${x}, ${y})`);
}

/**
 * 移动鼠标
 */
export async function moveMouse(x, y) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(x)}, ${Math.round(y)})
`;
  await runPowerShell(script);
  console.log(`Moved mouse to (${x}, ${y})`);
}

/**
 * 拖拽
 */
export async function drag(startX, startY, endX, endY) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);' -Name U32 -Namespace W
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(startX)}, ${Math.round(startY)})
Start-Sleep -Milliseconds 50
[W.U32]::mouse_event(0x0002, 0, 0, 0, 0)
Start-Sleep -Milliseconds 50
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(endX)}, ${Math.round(endY)})
Start-Sleep -Milliseconds 50
[W.U32]::mouse_event(0x0004, 0, 0, 0, 0)
`;
  await runPowerShell(script);
  console.log(`Dragged from (${startX}, ${startY}) to (${endX}, ${endY})`);
}

/**
 * 滚动鼠标
 */
export async function scroll(x, y, deltaX, deltaY) {
  await moveMouse(x, y);
  const script = `
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int dwFlags, int dx, int dy, int dwData, int dwExtraInfo);' -Name U32 -Namespace W
[W.U32]::mouse_event(0x0800, 0, 0, ${Math.round(deltaY * -120)}, 0)
`;
  await runPowerShell(script);
  console.log(`Scrolled at (${x}, ${y}) by (${deltaX}, ${deltaY})`);
}

/**
 * 输入文字
 */
export async function typeText(text) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${text.replace(/'/g, "''").replace(/[+^%~(){}[\]]/g, '{$&}')}')
`;
  await runPowerShell(script);
  console.log(`Typed: "${text}"`);
}

/**
 * 按下按键
 */
export async function pressKey(key) {
  const keyMap = {
    'enter': '{ENTER}',
    'return': '{ENTER}',
    'tab': '{TAB}',
    'escape': '{ESC}',
    'esc': '{ESC}',
    'backspace': '{BACKSPACE}',
    'delete': '{DELETE}',
    'space': ' ',
    'up': '{UP}',
    'down': '{DOWN}',
    'left': '{LEFT}',
    'right': '{RIGHT}',
    'home': '{HOME}',
    'end': '{END}',
    'pageup': '{PGUP}',
    'pagedown': '{PGDN}',
    'f1': '{F1}',
    'f2': '{F2}',
    'f3': '{F3}',
    'f4': '{F4}',
    'f5': '{F5}',
    'f6': '{F6}',
    'f7': '{F7}',
    'f8': '{F8}',
    'f9': '{F9}',
    'f10': '{F10}',
    'f11': '{F11}',
    'f12': '{F12}'
  };

  const mappedKey = keyMap[key.toLowerCase()] || key;
  const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${mappedKey}')
`;
  await runPowerShell(script);
  console.log(`Pressed key: ${key}`);
}

/**
 * 按下组合键 (支持 Win 键)
 */
export async function keyCombo(...keys) {
  const lowerKeys = keys.map(k => k.toLowerCase());
  
  // 如果只有 Win 键，使用 keybd_event 直接按
  if (lowerKeys.length === 1 && lowerKeys[0] === 'win') {
    const script = `
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);' -Name U32 -Namespace W
[W.U32]::keybd_event(0x5B, 0, 0, 0)
Start-Sleep -Milliseconds 100
[W.U32]::keybd_event(0x5B, 0, 2, 0)
`;
    await runPowerShell(script);
    console.log('Pressed Win key');
    return;
  }
  
  // 带 Win 的组合键
  if (lowerKeys.includes('win')) {
    const otherKeys = lowerKeys.filter(k => k !== 'win');
    const keyCode = getKeyCode(otherKeys[0]) || otherKeys[0].toUpperCase().charCodeAt(0);
    const script = `
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);' -Name U32 -Namespace W
[W.U32]::keybd_event(0x5B, 0, 0, 0)
[W.U32]::keybd_event(${keyCode}, 0, 0, 0)
Start-Sleep -Milliseconds 50
[W.U32]::keybd_event(${keyCode}, 0, 2, 0)
[W.U32]::keybd_event(0x5B, 0, 2, 0)
`;
    await runPowerShell(script);
    console.log(`Key combo: ${keys.join('+')}`);
    return;
  }
  
  // 普通组合键使用 SendKeys
  const modifierMap = {
    'ctrl': '^',
    'alt': '%',
    'shift': '+'
  };

  let combo = '';
  let mainKey = '';
  
  for (const key of lowerKeys) {
    if (modifierMap[key]) {
      combo += modifierMap[key];
    } else {
      mainKey = key;
    }
  }
  
  combo += mainKey;
  
  const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('${combo}')
`;
  await runPowerShell(script);
  console.log(`Key combo: ${keys.join('+')}`);
}

function getKeyCode(key) {
  const keyCodes = {
    'r': 0x52, 'd': 0x44, 'e': 0x45, 'm': 0x4D,
    'tab': 0x09, 'enter': 0x0D, 'escape': 0x1B
  };
  return keyCodes[key.toLowerCase()];
}

/**
 * 等待指定毫秒
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
