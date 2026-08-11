/**
 * gapAnalysisService.js
 * Real backend API service for Gap Analysis (/gap-analysis/* and /api/employees/{id}/skill-gaps).
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';

export function normalizeGapDetail(item, idx) {
  if (!item) return null;
  const currentLvl = item.actualLevel ?? item.currentLevel ?? 0;
  const reqLvl = item.requiredLevel ?? 3;
  const gap = item.gapScore ?? item.gap ?? (reqLvl - currentLvl);

  let severity = item.gapSeverity;
  if (!severity) {
    if (gap >= 2.0) severity = 'Critical';
    else if (gap >= 1.0) severity = 'High';
    else if (gap > 0) severity = 'Medium';
    else severity = 'Low';
  }

  const empName = typeof item.employee === 'string'
    ? item.employee
    : item.employee?.name || item.employeeName || (item.employeeId ? `Employee #${item.employeeId}` : 'Employee');

  const deptName = typeof item.department === 'string'
    ? item.department
    : item.employee?.department?.departmentName || item.department?.departmentName || 'General';

  let missing = [];
  if (Array.isArray(item.missingSkills)) {
    missing = item.missingSkills;
  } else if (item.skillName || item.skill?.skillName || item.name) {
    missing = [item.skillName || item.skill?.skillName || item.name];
  } else if (item.missingSkill) {
    missing = [item.missingSkill];
  }

  return {
    id: item.id ?? (idx !== undefined ? idx + 1 : 1),
    employee: empName,
    department: deptName,
    overallSkillScore: currentLvl,
    gapScore: gap < 0 ? 0 : gap,
    gapSeverity: severity,
    priority: item.priority || severity,
    missingSkills: missing,
    currentLevel: currentLvl,
    requiredLevel: reqLvl,
    gap: gap < 0 ? 0 : gap,
  };
}

export function getGapSummary() {
  return fetchWithFallback({
    request: () => api.get('/dashboard'),
    normalize: (data) => ({
      totalEmployeesAnalysed: data.employeeCount ?? 0,
      criticalGaps: data.criticalGaps ?? 0,
      avgSkillScore: data.averageSkillLevel ?? 0,
      avgGapScore: data.averageSkillLevel ? Math.max(0, parseFloat((5.0 - data.averageSkillLevel).toFixed(2))) : 0,
      totalEmployees: data.employeeCount ?? 0,
      employeesWithGaps: data.employeesWithGaps ?? 0,
      highPriorityGaps: data.highPriorityGaps ?? 0,
      departmentsAffected: data.departmentCount ?? 0,
    }),
    moduleName: 'Gap Analysis Summary',
  });
}

export function getGapDetails(employeeId) {
  const targetId = employeeId || 1;
  return fetchWithFallback({
    request: () => api.get(`/gap-analysis/${targetId}`),
    normalize: normalizeGapDetail,
    moduleName: 'Gap Analysis Details',
  });
}

export async function generateGapAnalysis(employeeId) {
  const res = await api.post(`/gap-analysis/${employeeId}`);
  return Array.isArray(res.data) ? res.data.map(normalizeGapDetail) : normalizeGapDetail(res.data);
}

export async function getSkillGaps(employeeId) {
  const res = await api.get(`/api/employees/${employeeId}/skill-gaps`);
  return res.data;
}

