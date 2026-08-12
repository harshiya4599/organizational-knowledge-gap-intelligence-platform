/**
 * competencyService.js
 * Hybrid backend API & persistent store service for /competencies CRUD.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';
import { LEVEL_LABELS } from './employeeService';
import { addCollectionItem, updateCollectionItem, deleteCollectionItem, getCollection } from '../utils/hybridStore';

export function normalizeCompetencyRow(comp) {
  if (!comp) return null;
  const deptObj = comp.department || {};
  const skillObj = comp.skill || {};
  const deptName = deptObj.departmentName || deptObj.name || (typeof comp.department === 'string' ? comp.department : 'Engineering');
  const skillName = skillObj.skillName || skillObj.name || (typeof comp.skill === 'string' ? comp.skill : comp.competencyName || 'Enterprise Capability');
  const reqLevel = typeof comp.requiredLevel === 'number' ? comp.requiredLevel : (comp.targetLevel || 4);
  const avgCur = typeof comp.avgCurrentLevel === 'number'
    ? comp.avgCurrentLevel
    : (typeof comp.currentAvg === 'number' ? comp.currentAvg : (reqLevel >= 4 ? 3.5 : 3.0));

  const varianceNum = parseFloat((avgCur - reqLevel).toFixed(1));
  const gap = Math.max(0, parseFloat((reqLevel - avgCur).toFixed(1)));
  const statusStr = comp.status || (varianceNum >= 0 ? 'Met' : varianceNum > -1 ? 'Low Gap' : varianceNum > -2 ? 'Medium Gap' : 'High Gap');

  return {
    id: comp.id,
    departmentId: deptObj.id ?? comp.departmentId ?? 1,
    skillId: skillObj.id ?? comp.skillId ?? 1,
    competencyName: comp.competencyName || `${deptName} - ${skillName}`,
    department: deptName,
    skill: skillName,
    requiredLevel: reqLevel,
    targetLevelLabel: LEVEL_LABELS[reqLevel] || `Level ${reqLevel}`,
    avgCurrentLevel: avgCur,
    avgCurrentLabel: LEVEL_LABELS[Math.round(avgCur)] || `Level ${avgCur}`,
    variance: varianceNum,
    gap,
    status: statusStr,
    departmentObj: deptObj.id ? deptObj : { id: comp.departmentId || 1, departmentName: deptName },
    skillObj: skillObj.id ? skillObj : { id: comp.skillId || 1, skillName, name: skillName },
  };
}

export function getCompetencyMatrix() {
  return fetchWithFallback({
    request: () => api.get('/competencies'),
    normalize: normalizeCompetencyRow,
    fallbackKey: 'competencies',
    moduleName: 'Competency Matrix',
  });
}

export function getCompetencies() {
  return getCompetencyMatrix();
}

export async function addCompetency(competencyData) {
  try {
    const res = await api.post('/competencies', competencyData);
    const mapped = normalizeCompetencyRow(res.data);
    addCollectionItem('competencies', mapped);
    return mapped;
  } catch (err) {
    console.warn('[CompetencyService] Backend addCompetency failed, saving to hybrid store:', err);
    const mapped = normalizeCompetencyRow(competencyData);
    addCollectionItem('competencies', mapped);
    return mapped;
  }
}

export async function updateCompetency(id, competencyData) {
  try {
    const res = await api.put(`/competencies/${id}`, competencyData);
    const mapped = normalizeCompetencyRow(res.data);
    updateCollectionItem('competencies', id, mapped);
    return mapped;
  } catch (err) {
    console.warn('[CompetencyService] Backend updateCompetency failed, updating in hybrid store:', err);
    const mapped = normalizeCompetencyRow({ id, ...competencyData });
    updateCollectionItem('competencies', id, mapped);
    return mapped;
  }
}

export async function deleteCompetency(id) {
  try {
    await api.delete(`/competencies/${id}`);
    deleteCollectionItem('competencies', id);
    return true;
  } catch (err) {
    console.warn('[CompetencyService] Backend deleteCompetency failed, deleting in hybrid store:', err);
    deleteCollectionItem('competencies', id);
    return true;
  }
}
