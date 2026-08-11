/**
 * competencyService.js
 * Real backend API service for /competencies CRUD.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';

function deriveStatus(gap) {
  if (gap <= 0) return 'Met';
  if (gap <= 0.75) return 'Low Gap';
  if (gap <= 1.25) return 'Medium Gap';
  return 'High Gap';
}

export function normalizeCompetencyRow(row, idx) {
  if (!row) return null;
  const req = row.requiredLevel ?? row.requiredScore ?? 3;
  const curr = row.avgCurrentLevel ?? row.currentLevel ?? row.currentScore ?? 0;
  const rawGap = req - curr;
  const gap = rawGap < 0 ? 0 : parseFloat(rawGap.toFixed(2));

  const deptName = typeof row.department === 'string'
    ? row.department
    : row.department?.departmentName || 'General';

  const skillName = row.competencyName
    || (typeof row.skill === 'string' ? row.skill : (row.skill?.skillName || row.skill?.name || 'Competency'));

  return {
    id: row.id ?? (idx !== undefined ? idx + 1 : 1),
    department: deptName,
    skill: skillName,
    requiredLevel: req,
    avgCurrentLevel: curr,
    gap: row.gap ?? gap,
    status: row.status ?? deriveStatus(gap),
  };
}

export function getCompetencyMatrix() {
  return fetchWithFallback({
    request: () => api.get('/competencies'),
    normalize: normalizeCompetencyRow,
    moduleName: 'Competency Matrix',
  });
}

export async function addCompetency(data) {
  const res = await api.post('/competencies', data);
  return normalizeCompetencyRow(res.data);
}

export async function updateCompetency(id, data) {
  const res = await api.put(`/competencies/${id}`, data);
  return normalizeCompetencyRow(res.data);
}

export async function deleteCompetency(id) {
  await api.delete(`/competencies/${id}`);
  return true;
}

