/**
 * API Client Module
 * Handles all HTTP communication with the backend
 */

class APIClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Task endpoints
  async startTask(task) {
    return this.request('/task', {
      method: 'POST',
      body: JSON.stringify({ task })
    });
  }

  async getTaskStatus() {
    return this.request('/task/status');
  }

  async stopTask() {
    return this.request('/task/stop', { method: 'POST' });
  }

  async getHistory() {
    return this.request('/history');
  }

  // Skills endpoints
  async getSkills() {
    return this.request('/skills');
  }

  async refreshSkills() {
    return this.request('/skills/refresh', { method: 'POST' });
  }

  async getSkillDetails(name) {
    return this.request(`/skills/${encodeURIComponent(name)}`);
  }

  async matchSkills(task) {
    return this.request('/skills/match', {
      method: 'POST',
      body: JSON.stringify({ task })
    });
  }

  // Security endpoints
  async getSecurityStatus() {
    return this.request('/security/status');
  }

  async getSecurityConfig() {
    return this.request('/security/config');
  }

  async updateSecurityConfig(config) {
    return this.request('/security/config', {
      method: 'PATCH',
      body: JSON.stringify(config)
    });
  }

  async toggleSecurity(enabled) {
    return this.request('/security/toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  }

  async getPendingConfirmations() {
    return this.request('/security/confirmations');
  }

  async confirmOperation(id) {
    return this.request(`/security/confirm/${id}`, { method: 'POST' });
  }

  async rejectOperation(id) {
    return this.request(`/security/reject/${id}`, { method: 'POST' });
  }

  async checkHealth() {
    return this.request('/health');
  }
}
