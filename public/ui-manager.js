/**
 * UI Manager Module
 * Handles UI updates and user feedback
 */

class UIManager {
  constructor(app) {
    this.app = app;
  }

  log(type, message) {
    const container = document.getElementById('logContainer');
    if (!container) return;

    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="time">${time}</span><span class="${type}">${this.escapeHtml(message)}</span>`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;

    // Keep only last 100 entries
    while (container.children.length > 100) {
      container.removeChild(container.firstChild);
    }
  }

  updateStatus(status, text) {
    const el = document.getElementById('status');
    if (!el) return;

    el.className = 'status ' + status;
    const icons = { idle: '⚪', running: '🔵', complete: '🟢', error: '🔴' };
    el.innerHTML = `<span>${icons[status] || '⚪'}</span> ${this.escapeHtml(text)}`;
  }

  updateScreenshot(base64Data) {
    const container = document.getElementById('screenshotContainer');
    if (!container) return;

    container.innerHTML = `<img src="data:image/png;base64,${base64Data}" alt="Screen">`;
  }

  updateHistory() {
    const container = document.getElementById('historyContainer');
    if (!container) return;

    const history = this.app.state.history;

    if (history.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无历史记录</div>';
      return;
    }

    container.innerHTML = history.slice(-10).reverse().map(item => `
      <div class="history-item">
        <div class="history-header">
          <span class="history-task">${this.escapeHtml(item.task)}</span>
          <span class="history-time">${new Date(item.startTime).toLocaleString()}</span>
        </div>
        <div class="history-status ${item.result?.success ? 'success' : 'error'}">
          ${item.result?.success ? '✅ 成功' : '❌ 失败'}
          ${item.result?.summary ? ': ' + this.escapeHtml(item.result.summary) : ''}
          ${item.error ? ': ' + this.escapeHtml(item.error) : ''}
        </div>
      </div>
    `).join('');
  }

  showError(message) {
    // Simple error display - could be enhanced with a modal or toast
    this.log('error', message);
    this.updateStatus('error', message);
  }

  showSuccess(message) {
    this.log('message', message);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setExample(text) {
    const input = document.getElementById('taskInput');
    if (input) {
      input.value = text;
      input.focus();
    }
  }
}
