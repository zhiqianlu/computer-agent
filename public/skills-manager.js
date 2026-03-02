/**
 * Skills Manager Module
 * Handles skills listing and management
 */

class SkillsManager {
  constructor(app) {
    this.app = app;
  }

  updateSkillsList() {
    const container = document.getElementById('skillsList');
    if (!container) return;

    const skills = this.app.state.skills;

    if (skills.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无可用技能</div>';
      return;
    }

    container.innerHTML = skills.map(skill => `
      <div class="skill-item">
        <div class="skill-header">
          <span class="skill-name">📦 ${this.escapeHtml(skill.name)}</span>
          <button class="skill-details-btn" onclick="app.modules.skills.showSkillDetails('${this.escapeHtml(skill.name)}')">
            详情
          </button>
        </div>
        <div class="skill-description">${this.escapeHtml(skill.description)}</div>
      </div>
    `).join('');
  }

  async refreshSkills() {
    try {
      this.app.modules.ui.log('message', '正在刷新技能列表...');
      const data = await this.app.modules.api.refreshSkills();
      this.app.state.skills = data.skills.map(name => ({ name, description: '' }));

      // Reload full skill details
      const skillsData = await this.app.modules.api.getSkills();
      this.app.state.skills = skillsData.skills || [];

      this.updateSkillsList();
      this.app.modules.ui.showSuccess(`已刷新 ${data.count} 个技能`);
    } catch (error) {
      this.app.modules.ui.showError('刷新技能失败: ' + error.message);
    }
  }

  async showSkillDetails(skillName) {
    try {
      const skill = await this.app.modules.api.getSkillDetails(skillName);

      // Create modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2>📦 ${this.escapeHtml(skill.name)}</h2>
            <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <p><strong>描述:</strong> ${this.escapeHtml(skill.description)}</p>
            <p><strong>路径:</strong> ${this.escapeHtml(skill.path)}</p>
            <div class="skill-content">
              <pre>${this.escapeHtml(skill.content)}</pre>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

    } catch (error) {
      this.app.modules.ui.showError('加载技能详情失败: ' + error.message);
    }
  }

  async testSkillMatch() {
    const taskInput = document.getElementById('taskInput');
    const task = taskInput.value.trim();

    if (!task) {
      this.app.modules.ui.showError('请输入任务以测试匹配');
      return;
    }

    try {
      const result = await this.app.modules.api.matchSkills(task);

      this.app.modules.ui.log('message', `找到 ${result.matchedCount} 个匹配的技能`);

      if (result.matches.length > 0) {
        result.matches.forEach(match => {
          this.app.modules.ui.log('action', `  - ${match.name} (分数: ${match.matchScore})`);
        });
      }
    } catch (error) {
      this.app.modules.ui.showError('测试技能匹配失败: ' + error.message);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
