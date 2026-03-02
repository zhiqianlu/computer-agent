// Computer Agent - Shared Frontend JavaScript

// API Base URL
const API_BASE = window.location.origin;

// Utility Functions
const utils = {
  // Format time
  formatTime(date) {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  },

  // Format date
  formatDate(date) {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  },

  // Format duration
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  },

  // Show notification
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 1.2rem;">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('已复制到剪贴板', 'success');
    } catch (err) {
      this.showNotification('复制失败', 'error');
    }
  }
};

// API Client
const api = {
  // Generic request
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Task APIs
  async startTask(task) {
    return this.request('/task', {
      method: 'POST',
      body: JSON.stringify({ task })
    });
  },

  async getTaskStatus() {
    return this.request('/task/status');
  },

  async stopTask() {
    return this.request('/task/stop', { method: 'POST' });
  },

  async getHistory() {
    return this.request('/history');
  },

  // Skills APIs
  async getSkills() {
    return this.request('/skills');
  },

  async refreshSkills() {
    return this.request('/skills/refresh', { method: 'POST' });
  },

  async getSkill(name) {
    return this.request(`/skills/${encodeURIComponent(name)}`);
  },

  async matchSkills(task) {
    return this.request('/skills/match', {
      method: 'POST',
      body: JSON.stringify({ task })
    });
  },

  // Security APIs
  async getSecurityStatus() {
    return this.request('/security/status');
  },

  async getSecurityConfig() {
    return this.request('/security/config');
  },

  async updateSecurityConfig(config) {
    return this.request('/security/config', {
      method: 'PATCH',
      body: JSON.stringify(config)
    });
  },

  async toggleSecurity(enabled) {
    return this.request('/security/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  },

  async getConfirmations() {
    return this.request('/security/confirmations');
  },

  async confirmOperation(id) {
    return this.request(`/security/confirm/${id}`, { method: 'POST' });
  },

  async rejectOperation(id) {
    return this.request(`/security/reject/${id}`, { method: 'POST' });
  },

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
};

// Modal Manager
const modal = {
  open(modalId) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      modalEl.classList.add('active');
    }
  },

  close(modalId) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      modalEl.classList.remove('active');
    }
  },

  closeAll() {
    document.querySelectorAll('.modal').forEach(m => {
      m.classList.remove('active');
    });
  }
};

// Click outside modal to close
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    modal.closeAll();
  }
});

// Set active navigation
function setActiveNav(page) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('href') === page) {
      item.classList.add('active');
    }
  });
}

// Get current page from URL
function getCurrentPage() {
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') return 'index.html';
  return path.split('/').pop() || 'index.html';
}

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav(getCurrentPage());
});

// Export for use in other scripts
window.api = api;
window.utils = utils;
window.modal = modal;
