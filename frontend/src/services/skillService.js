/**
 * skillService.js
 * Real backend API service for /skills and /employee-skills CRUD.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';

export const LEVEL_LABELS = {
  1: 'Unaware',
  2: 'Beginner',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export function mapSkill(skill) {
  if (!skill) return null;
  return {
    id: skill.id,
    name: skill.skillName || skill.name || `Skill #${skill.id}`,
    category: skill.category || 'Technical',
    description: skill.description || '',
    requiredLevel: skill.requiredLevel ?? 3,
  };
}

export function normalizeEmployeeSkill(item, idx) {
  if (!item) return null;
  const empName = typeof item.employee === 'string'
    ? item.employee
    : item.employee?.name || `Employee #${item.employee?.id || (idx !== undefined ? idx + 1 : 1)}`;

  const deptName = typeof item.department === 'string'
    ? item.department
    : item.employee?.department?.departmentName || item.department?.departmentName || 'General';

  const skillName = typeof item.skill === 'string'
    ? item.skill
    : item.skill?.skillName || item.skill?.name || 'Skill';

  const currentLvl = item.level ?? item.currentLevel ?? 0;
  const requiredLvl = item.requiredLevel ?? 3;
  const gap = requiredLvl - currentLvl;
  const status = item.gapStatus || (gap <= 0 ? 'Met' : gap > 1 ? 'High Gap' : 'Gap');

  return {
    id: item.id ?? (idx !== undefined ? idx + 1 : 1),
    employee: empName,
    department: deptName,
    skill: skillName,
    currentLevel: currentLvl,
    requiredLevel: requiredLvl,
    gapStatus: status,
  };
}

export function getSkills() {
  return fetchWithFallback({
    request: () => api.get('/skills'),
    normalize: mapSkill,
    moduleName: 'Skills Catalog',
  });
}

export function getSkillById(id) {
  return fetchWithFallback({
    request: () => api.get(`/skills/${id}`),
    normalize: mapSkill,
    moduleName: 'Skill Details',
  });
}

export function getEmployeeSkills() {
  return fetchWithFallback({
    request: () => api.get('/employee-skills'),
    normalize: normalizeEmployeeSkill,
    moduleName: 'Employee Skills',
  });
}

export async function addSkill(skillData) {
  const res = await api.post('/skills', {
    skillName: skillData.name || skillData.skillName,
    ...skillData,
  });
  return mapSkill(res.data);
}

export async function updateSkill(id, skillData) {
  const res = await api.put(`/skills/${id}`, {
    skillName: skillData.name || skillData.skillName,
    ...skillData,
  });
  return mapSkill(res.data);
}

export async function deleteSkill(id) {
  await api.delete(`/skills/${id}`);
  return true;
}

export async function addEmployeeSkill(data) {
  const res = await api.post('/employee-skills', data);
  return normalizeEmployeeSkill(res.data);
}

export async function updateEmployeeSkill(id, data) {
  const res = await api.put(`/employee-skills/${id}`, data);
  return normalizeEmployeeSkill(res.data);
}

export async function deleteEmployeeSkill(id) {
  await api.delete(`/employee-skills/${id}`);
  return true;
}

