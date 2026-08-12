/**
 * skillService.js
 * Hybrid backend API & persistent store service for Skills Catalog & EmployeeSkills CRUD.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';
import { LEVEL_LABELS } from './employeeService';
export { LEVEL_LABELS };
import {
  addCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
  getCollection,
} from '../utils/hybridStore';

export function normalizeSkill(s) {
  if (!s) return null;
  const name = s.skillName || s.name || `Skill #${s.id}`;
  return {
    id: s.id,
    skill: name,
    name: name,
    skillName: name,
    category: s.category || 'Technical',
    description: s.description || 'Enterprise platform competency & technical capability.',
    certifiedCount: s.certifiedCount || 4,
    demandLevel: s.demandLevel || 'High',
    status: s.status || 'Active',
  };
}

export function normalizeEmployeeSkill(item) {
  if (!item) return null;
  const empObj = item.employee || {};
  const skillObj = item.skill || {};
  const employeeName = empObj.name || (typeof item.employee === 'string' ? item.employee : `Employee #${item.employeeId || empObj.id || ''}`);
  const skillName = skillObj.skillName || skillObj.name || (typeof item.skill === 'string' ? item.skill : `Skill #${item.skillId || skillObj.id || ''}`);
  const currentVal = item.level ?? item.currentLevel ?? 1;
  const requiredVal = item.requiredLevel ?? 4;
  const gapDiff = requiredVal - currentVal;
  const gapStatus = gapDiff <= 0 ? 'Met' : gapDiff === 1 ? 'Gap' : 'High Gap';

  return {
    id: item.id,
    employeeId: item.employeeId ?? empObj.id ?? null,
    userId: empObj.user?.id ?? item.userId ?? null,
    skillId: item.skillId ?? skillObj.id ?? null,
    employee: employeeName,
    skill: skillName,
    category: skillObj.category || item.category || 'Technical',
    currentLevel: LEVEL_LABELS[currentVal] || `Level ${currentVal}`,
    requiredLevel: LEVEL_LABELS[requiredVal] || `Level ${requiredVal}`,
    currentVal,
    requiredVal,
    level: currentVal,
    gapStatus,
    lastUpdated: item.lastUpdated || '2026-07-15',
    employeeObj: empObj.id ? empObj : { id: item.employeeId, name: employeeName },
    skillObj: skillObj.id ? skillObj : { id: item.skillId, skillName, name: skillName, category: item.category || 'Technical' },
  };
}

export function getSkills() {
  return fetchWithFallback({
    request: () => api.get('/skills'),
    normalize: normalizeSkill,
    fallbackKey: 'skills',
    moduleName: 'Skills',
  });
}

export async function addSkill(skillData) {
  try {
    const res = await api.post('/skills', skillData);
    const mapped = normalizeSkill(res.data);
    addCollectionItem('skills', mapped);
    return mapped;
  } catch (err) {
    console.warn('[SkillService] Backend addSkill failed, saving to hybrid store:', err);
    const mapped = normalizeSkill(skillData);
    return addCollectionItem('skills', mapped);
  }
}

export async function updateSkill(id, skillData) {
  try {
    const res = await api.put(`/skills/${id}`, skillData);
    const mapped = normalizeSkill(res.data);
    updateCollectionItem('skills', id, mapped);
    return mapped;
  } catch (err) {
    console.warn('[SkillService] Backend updateSkill failed, updating hybrid store:', err);
    const mapped = normalizeSkill({ ...skillData, id });
    return updateCollectionItem('skills', id, mapped);
  }
}

export async function deleteSkill(id) {
  try {
    await api.delete(`/skills/${id}`);
    deleteCollectionItem('skills', id);
    return true;
  } catch (err) {
    console.warn('[SkillService] Backend deleteSkill failed, deleting from hybrid store:', err);
    deleteCollectionItem('skills', id);
    return true;
  }
}

export function getEmployeeSkills() {
  return fetchWithFallback({
    request: () => api.get('/employee-skills'),
    normalize: normalizeEmployeeSkill,
    fallbackKey: 'employee_skills',
    moduleName: 'EmployeeSkills',
  });
}

export async function addEmployeeSkill(payload) {
  try {
    const res = await api.post('/employee-skills', payload);
    const mapped = normalizeEmployeeSkill(res.data);
    addCollectionItem('employee_skills', mapped);
    return mapped;
  } catch (err) {
    console.warn('[SkillService] Backend addEmployeeSkill failed, saving to hybrid store:', err);
    const mapped = normalizeEmployeeSkill({
      ...payload,
      employeeId: payload.employee?.id || payload.employeeId,
      skillId: payload.skill?.id || payload.skillId,
      level: payload.level || 3,
    });
    return addCollectionItem('employee_skills', mapped);
  }
}

export async function updateEmployeeSkill(id, payload) {
  try {
    const res = await api.put(`/employee-skills/${id}`, payload);
    const mapped = normalizeEmployeeSkill(res.data);
    updateCollectionItem('employee_skills', id, mapped);
    return mapped;
  } catch (err) {
    console.warn('[SkillService] Backend updateEmployeeSkill failed, updating hybrid store:', err);
    const mapped = normalizeEmployeeSkill({
      ...payload,
      id,
      employeeId: payload.employee?.id || payload.employeeId,
      skillId: payload.skill?.id || payload.skillId,
      level: payload.level || 3,
    });
    return updateCollectionItem('employee_skills', id, mapped);
  }
}

export async function deleteEmployeeSkill(id) {
  try {
    await api.delete(`/employee-skills/${id}`);
    deleteCollectionItem('employee_skills', id);
    return true;
  } catch (err) {
    console.warn('[SkillService] Backend deleteEmployeeSkill failed, deleting from hybrid store:', err);
    deleteCollectionItem('employee_skills', id);
    return true;
  }
}
