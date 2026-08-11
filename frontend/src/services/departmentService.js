/**
 * departmentService.js
 * Real backend API service for /departments CRUD & matrix insights.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';

export function normalizeDepartment(dept, idx) {
  if (!dept) return null;
  const id = dept.id ?? (idx !== undefined ? idx + 1 : 1);
  const name = dept.departmentName || dept.name || `Department #${id}`;
  const empCount = Array.isArray(dept.employees) ? dept.employees.length : (dept.employeeCount ?? 0);

  return {
    id,
    department: name,
    name,
    category: dept.category || 'General',
    employeeCount: empCount,
    avgSkillScore: dept.avgSkillScore ?? 0,
    avgGapScore: dept.avgGapScore ?? 0,
    competencyScore: dept.competencyScore ?? (dept.avgSkillScore ? Math.round(dept.avgSkillScore * 20) : 0),
    healthStatus: dept.healthStatus || 'Active',
    trainingPriority: dept.trainingPriority || 'Normal',
    criticalSkills: Array.isArray(dept.criticalSkills) ? dept.criticalSkills : [],
    missingSkill: dept.missingSkill || '',
    manager: dept.manager || 'Not Assigned',
    description: dept.description || '',
  };
}

export function getDepartments() {
  return fetchWithFallback({
    request: () => api.get('/departments'),
    normalize: normalizeDepartment,
    moduleName: 'Departments',
  });
}

export function getDepartmentSkillMatrix() {
  return fetchWithFallback({
    request: () => api.get('/departments'),
    normalize: normalizeDepartment,
    moduleName: 'Department Skill Matrix',
  });
}

export function getSkillHeatmapData() {
  return fetchWithFallback({
    request: () => api.get('/departments'),
    normalize: (dept) => ({
      department: dept.departmentName || dept.name || 'Department',
      skill: 'General Competency',
      category: dept.category || 'General',
      competencyScore: dept.competencyScore ?? 0,
      gapScore: dept.avgGapScore ?? 0,
      tier: 'below_40',
      tierName: 'Standard',
      employeesCovered: Array.isArray(dept.employees) ? dept.employees.length : 0,
      trainingRequired: 'Normal',
    }),
    moduleName: 'Skill Heatmap',
  });
}

export async function addDepartment(deptData) {
  const res = await api.post('/departments', {
    departmentName: deptData.name || deptData.departmentName,
    ...deptData,
  });
  return normalizeDepartment(res.data);
}

export async function updateDepartment(id, deptData) {
  const res = await api.put(`/departments/${id}`, {
    departmentName: deptData.name || deptData.departmentName,
    ...deptData,
  });
  return normalizeDepartment(res.data);
}

export async function deleteDepartment(id) {
  await api.delete(`/departments/${id}`);
  return true;
}
