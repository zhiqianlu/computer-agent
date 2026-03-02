/**
 * Security Manager Module
 * Handles security configuration and status
 */

class SecurityManager {
  constructor(app) {
    this.app = app;
    this.pollConfirmationsInterval = null;
  }

  updateSecurityStatus() {
    const statusEl = document.getElementById('securityStatus');
    const configEl = document.getElementById('securityConfig');

    if (!statusEl || !this.app.state.securityStatus) return;

    const status = this.app.state.securityStatus;

    statusEl.innerHTML = `
      <div class="security-status-item">
        <span>安全模式:</span>
        <span class="${status.enabled ? 'status-enabled' : 'status-disabled'}">
          ${status.enabled ? '🔒 已启用' : '🔓 已禁用'}
        </span>
      </div>
      <div class="security-status-item">
        <span>会话状态:</span>
        <span>${status.sessionActive ? '🟢 活跃' : '⚪ 未激活'}</span>
      </div>
      <div class="security-status-item">
        <span>操作次数:</span>
        <span>${status.operationCount}</span>
      </div>
      <div class="security-status-item">
        <span>速率限制:</span>
        <span>${status.rateLimit.current}/${status.rateLimit.max} /分钟</span>
      </div>
      <div class="security-status-item">
        <span>待确认操作:</span>
        <span class="${status.pendingConfirmations > 0 ? 'text-warning' : ''}">
          ${status.pendingConfirmations}
        </span>
      </div>
    `;

    // Start polling for confirmations if there are any pending
    if (status.pendingConfirmations > 0 && !this.pollConfirmationsInterval) {
      this.startPollingConfirmations();
    } else if (status.pendingConfirmations === 0 && this.pollConfirmationsInterval) {
      this.stopPollingConfirmations();
    }
  }

  async refreshStatus() {
    try {
      const status = await this.app.modules.api.getSecurityStatus();
      this.app.state.securityStatus = status;
      this.updateSecurityStatus();
      this.app.modules.ui.showSuccess('安全状态已刷新');
    } catch (error) {
      this.app.modules.ui.showError('刷新安全状态失败: ' + error.message);
    }
  }

  async toggleSecurity() {
    if (!this.app.state.securityStatus) return;

    const currentState = this.app.state.securityStatus.enabled;
    const newState = !currentState;

    try {
      await this.app.modules.api.toggleSecurity(newState);
      this.app.state.securityStatus.enabled = newState;
      this.updateSecurityStatus();
      this.app.modules.ui.showSuccess(`安全模式已${newState ? '启用' : '禁用'}`);
    } catch (error) {
      this.app.modules.ui.showError('切换安全模式失败: ' + error.message);
    }
  }

  async startPollingConfirmations() {
    this.pollConfirmationsInterval = setInterval(async () => {
      await this.updatePendingConfirmations();
    }, 2000);
  }

  stopPollingConfirmations() {
    if (this.pollConfirmationsInterval) {
      clearInterval(this.pollConfirmationsInterval);
      this.pollConfirmationsInterval = null;
    }
  }

  async updatePendingConfirmations() {
    try {
      const data = await this.app.modules.api.getPendingConfirmations();
      const container = document.getElementById('confirmationsContainer');

      if (!container) return;

      if (data.confirmations.length === 0) {
        container.innerHTML = '<div class="empty-state">无待确认操作</div>';
        return;
      }

      container.innerHTML = data.confirmations.map(conf => `
        <div class="confirmation-item">
          <div class="confirmation-header">
            <span class="confirmation-operation">${this.escapeHtml(conf.operation)}</span>
            <span class="confirmation-time">${new Date(conf.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="confirmation-args">
            <pre>${JSON.stringify(conf.args, null, 2)}</pre>
          </div>
          <div class="confirmation-actions">
            <button class="btn btn-success" onclick="app.modules.security.confirmOperation('${conf.id}')">
              ✓ 确认
            </button>
            <button class="btn btn-danger" onclick="app.modules.security.rejectOperation('${conf.id}')">
              ✕ 拒绝
            </button>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Error updating confirmations:', error);
    }
  }

  async confirmOperation(id) {
    try {
      await this.app.modules.api.confirmOperation(id);
      this.app.modules.ui.showSuccess('操作已确认');
      await this.updatePendingConfirmations();
      await this.refreshStatus();
    } catch (error) {
      this.app.modules.ui.showError('确认操作失败: ' + error.message);
    }
  }

  async rejectOperation(id) {
    try {
      await this.app.modules.api.rejectOperation(id);
      this.app.modules.ui.showSuccess('操作已拒绝');
      await this.updatePendingConfirmations();
      await this.refreshStatus();
    } catch (error) {
      this.app.modules.ui.showError('拒绝操作失败: ' + error.message);
    }
  }

  async showSecurityConfig() {
    try {
      const config = await this.app.modules.api.getSecurityConfig();

      // Create modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>🔒 安全配置</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <pre>${JSON.stringify(config, null, 2)}</pre>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

    } catch (error) {
      this.app.modules.ui.showError('加载安全配置失败: ' + error.message);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
