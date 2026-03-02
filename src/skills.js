import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// skills 目录路径
const SKILLS_DIR = process.env.SKILLS_DIR || join(__dirname, '../../skills');

/**
 * 解析 SKILL.md 文件的 frontmatter
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return { metadata: {}, body: content };
  
  const frontmatter = match[1];
  const body = content.slice(match[0].length).trim();
  
  const metadata = {};
  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // 移除引号
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      metadata[key] = value;
    }
  });
  
  return { metadata, body };
}

/**
 * 扫描并加载所有可用的 skills
 */
export async function loadAllSkills() {
  const skills = [];
  
  if (!existsSync(SKILLS_DIR)) {
    console.log(`⚠️ Skills directory not found: ${SKILLS_DIR}`);
    return skills;
  }
  
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue; // 跳过隐藏目录
    
    const skillPath = join(SKILLS_DIR, entry.name, 'SKILL.md');
    
    if (!existsSync(skillPath)) continue;
    
    try {
      const content = await readFile(skillPath, 'utf-8');
      const { metadata, body } = parseFrontmatter(content);
      
      skills.push({
        name: metadata.name || entry.name,
        description: metadata.description || '',
        path: join(SKILLS_DIR, entry.name),
        content: body,
        fullContent: content
      });
      
      console.log(`📦 Loaded skill: ${metadata.name || entry.name}`);
    } catch (error) {
      console.error(`Failed to load skill ${entry.name}:`, error.message);
    }
  }
  
  return skills;
}

/**
 * 根据任务描述匹配相关的 skills
 * @param {string} task - 用户任务描述
 * @param {Array} skills - 所有可用的 skills
 * @returns {Array} - 匹配的 skills
 */
export function matchSkills(task, skills) {
  const taskLower = task.toLowerCase();
  const matchedSkills = [];
  
  for (const skill of skills) {
    const description = skill.description.toLowerCase();
    const name = skill.name.toLowerCase();
    
    // 检查任务是否包含 skill 相关的关键词
    // 从 description 中提取关键词
    const keywords = extractKeywords(description);
    keywords.push(name);
    
    const score = calculateMatchScore(taskLower, keywords);
    
    if (score > 0) {
      matchedSkills.push({
        ...skill,
        matchScore: score
      });
    }
  }
  
  // 按匹配分数排序
  return matchedSkills.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * 从描述中提取关键词
 */
function extractKeywords(description) {
  // 提取可能的关键词
  const keywords = [];
  
  // 文件扩展名模式
  const extPattern = /\.(pptx?|docx?|xlsx?|pdf|mp4|avi|mov|jpg|png|gif)/gi;
  let match;
  while ((match = extPattern.exec(description)) !== null) {
    keywords.push(match[0].toLowerCase());
  }
  
  // 常见任务关键词
  const taskWords = [
    'presentation', 'slide', 'deck', 'video', 'edit', 'create', 'generate',
    'document', 'spreadsheet', 'image', 'audio', 'convert', 'export',
    'powerpoint', 'word', 'excel', 'pdf', 'movie', 'film', 'animation'
  ];
  
  for (const word of taskWords) {
    if (description.includes(word)) {
      keywords.push(word);
    }
  }
  
  // 提取引号中的关键词
  const quotedPattern = /"([^"]+)"/g;
  while ((match = quotedPattern.exec(description)) !== null) {
    keywords.push(...match[1].toLowerCase().split(/[,\s]+/));
  }
  
  return [...new Set(keywords)]; // 去重
}

/**
 * 计算任务与关键词的匹配分数
 */
function calculateMatchScore(task, keywords) {
  let score = 0;
  
  for (const keyword of keywords) {
    if (task.includes(keyword)) {
      // 关键词长度越长，权重越高
      score += keyword.length;
    }
  }
  
  return score;
}

/**
 * 将匹配的 skills 格式化为系统提示
 */
export function formatSkillsForPrompt(matchedSkills) {
  if (matchedSkills.length === 0) {
    return '';
  }
  
  let prompt = '\n\n## 已加载的相关技能 (Skills)\n\n';
  prompt += '以下技能与当前任务相关，请参考其中的指导来完成任务：\n\n';
  
  for (const skill of matchedSkills) {
    prompt += `### ${skill.name}\n\n`;
    prompt += skill.content + '\n\n';
    prompt += '---\n\n';
  }
  
  return prompt;
}

/**
 * 加载指定名称的 skill
 */
export async function loadSkillByName(skillName) {
  const skillPath = join(SKILLS_DIR, skillName, 'SKILL.md');
  
  if (!existsSync(skillPath)) {
    return null;
  }
  
  const content = await readFile(skillPath, 'utf-8');
  const { metadata, body } = parseFrontmatter(content);
  
  return {
    name: metadata.name || skillName,
    description: metadata.description || '',
    path: join(SKILLS_DIR, skillName),
    content: body,
    fullContent: content
  };
}

/**
 * 读取 skill 目录中的其他文件
 */
export async function readSkillFile(skillName, fileName) {
  const filePath = join(SKILLS_DIR, skillName, fileName);
  
  if (!existsSync(filePath)) {
    return null;
  }
  
  return await readFile(filePath, 'utf-8');
}

// 缓存已加载的 skills
let cachedSkills = null;

/**
 * 获取所有 skills（带缓存）
 */
export async function getSkills() {
  if (cachedSkills === null) {
    cachedSkills = await loadAllSkills();
  }
  return cachedSkills;
}

/**
 * 刷新 skills 缓存
 */
export async function refreshSkills() {
  cachedSkills = await loadAllSkills();
  return cachedSkills;
}
