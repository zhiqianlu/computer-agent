# ============================================
# Computer Agent - Azure VM 部署脚本
# 在VM上以管理员身份运行此脚本
# ============================================

$ErrorActionPreference = "Stop"
$AppPath = "C:\computer-agent"
$NodeVersion = "20.11.0"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Computer Agent - Azure VM 部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. 安装 Node.js
Write-Host "`n[1/5] 检查 Node.js..." -ForegroundColor Yellow
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeInstalled) {
    Write-Host "正在下载 Node.js v$NodeVersion..." -ForegroundColor Gray
    $nodeUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-x64.msi"
    $nodeMsi = "$env:TEMP\node.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
    Write-Host "正在安装 Node.js..." -ForegroundColor Gray
    Start-Process msiexec.exe -ArgumentList "/i", $nodeMsi, "/quiet", "/norestart" -Wait
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Write-Host "Node.js 安装完成!" -ForegroundColor Green
} else {
    Write-Host "Node.js 已安装: $(node --version)" -ForegroundColor Green
}

# 2. 创建应用目录
Write-Host "`n[2/5] 准备应用目录..." -ForegroundColor Yellow
if (Test-Path $AppPath) {
    Write-Host "清理旧目录..." -ForegroundColor Gray
    Remove-Item -Path $AppPath -Recurse -Force
}
New-Item -ItemType Directory -Path $AppPath -Force | Out-Null
Write-Host "应用目录: $AppPath" -ForegroundColor Green

# 3. 复制应用文件 (假设文件已通过RDP拖放到桌面)
Write-Host "`n[3/5] 复制应用文件..." -ForegroundColor Yellow
$SourcePath = "$env:USERPROFILE\Desktop\computer-agent"
if (Test-Path $SourcePath) {
    Copy-Item -Path "$SourcePath\*" -Destination $AppPath -Recurse -Force
    Write-Host "文件复制完成!" -ForegroundColor Green
} else {
    Write-Host "请先将 computer-agent 文件夹拖放到桌面!" -ForegroundColor Red
    Write-Host "然后重新运行此脚本" -ForegroundColor Yellow
    exit 1
}

# 4. 安装依赖
Write-Host "`n[4/5] 安装 npm 依赖..." -ForegroundColor Yellow
Set-Location $AppPath
npm install --production 2>&1 | Out-Null
npm install pm2 -g 2>&1 | Out-Null
Write-Host "依赖安装完成!" -ForegroundColor Green

# 5. 配置 PM2 作为 Windows 服务
Write-Host "`n[5/5] 配置 24/7 自动运行..." -ForegroundColor Yellow

# 创建 PM2 生态系统配置
$pm2Config = @"
module.exports = {
  apps: [{
    name: 'computer-agent',
    script: 'src/index.js',
    cwd: '$($AppPath -replace '\\', '/')',
    env: {
      NODE_ENV: 'production',
      PORT: 3200
    },
    watch: false,
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000
  }]
}
"@
$pm2Config | Out-File -FilePath "$AppPath\ecosystem.config.js" -Encoding UTF8

# 启动应用
pm2 start "$AppPath\ecosystem.config.js"
pm2 save

# 配置开机自启动
Write-Host "配置开机自启动..." -ForegroundColor Gray
$startupScript = @"
@echo off
cd /d $AppPath
pm2 resurrect
"@
$startupScript | Out-File -FilePath "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\start-computer-agent.bat" -Encoding ASCII

# 配置防火墙
Write-Host "配置防火墙规则..." -ForegroundColor Gray
New-NetFirewallRule -DisplayName "Computer Agent" -Direction Inbound -Port 3200 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " 部署完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "应用地址: http://localhost:3200" -ForegroundColor White
Write-Host "外部访问: http://<VM公网IP>:3200" -ForegroundColor White
Write-Host ""
Write-Host "管理命令:" -ForegroundColor Yellow
Write-Host "  pm2 status       - 查看状态" -ForegroundColor Gray
Write-Host "  pm2 logs         - 查看日志" -ForegroundColor Gray
Write-Host "  pm2 restart all  - 重启应用" -ForegroundColor Gray
Write-Host "  pm2 stop all     - 停止应用" -ForegroundColor Gray
Write-Host ""
