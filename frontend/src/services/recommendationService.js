/**
 * recommendationService.js
 * Real backend API service for Recommendations and Learning Paths.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';

export function normalizeRecommendation(rec, idx) {
  if (!rec) return null;
  const scoreVal = typeof rec.score === 'number'
    ? (rec.score <= 1 ? Math.round(rec.score * 100) : Math.round(rec.score))
    : 75;

  return {
    id: rec.id ?? (idx !== undefined ? idx + 1 : 1),
    employeeId: rec.employeeId,
    employee: rec.employee || (rec.employeeId ? `Employee #${rec.employeeId}` : 'Employee'),
    department: rec.department || rec.category || 'General',
    course: rec.course || rec.title || 'Recommended Training Course',
    provider: rec.provider || rec.type || 'Platform Training',
    score: scoreVal,
    priority: rec.priority || (scoreVal >= 85 ? 'High' : scoreVal >= 60 ? 'Medium' : 'Low'),
    duration: rec.duration || '4 weeks',
    difficulty: rec.difficulty || rec.category || 'Intermediate',
    requiredSkills: Array.isArray(rec.requiredSkills)
      ? rec.requiredSkills
      : [rec.category || 'Core Competency'],
    expectedImprovement: rec.expectedImprovement || 'Target competency growth',
    reason: rec.reason || `AI-driven recommendation for ${rec.title || 'skill gap remediation'}.`,
    status: rec.status || 'Pending',
    createdAt: rec.createdAt || '',
  };
}

export function normalizeSingleLearningPath(path) {
  if (!path) return null;
  const rawSteps = path.steps || [];
  const steps = rawSteps.map((s, idx) => ({
    stepNumber: s.stepNumber || idx + 1,
    title: s.title || `Step ${s.stepNumber || idx + 1}: ${s.skillName || s.name || 'Skill Progression'}`,
    courseName: s.courseName || s.skillName || s.name || 'Skill Learning Resource',
    duration: s.duration || '2 weeks',
    status: s.status || (idx === 0 ? 'In Progress' : 'Pending'),
    provider: s.provider || (s.resources?.[0]?.type || 'Online Learning'),
    description: s.description || (s.resources?.[0]?.title || `Develop competency in ${s.skillName || s.name}`),
    currentLevel: s.currentLevel ?? 1,
    targetLevel: s.targetLevel ?? 3,
  }));

  return {
    id: path.id || path.employeeId || 1,
    title: path.title || `${path.designation || 'Specialist'} Skill Roadmap`,
    employee: path.employee || (path.employeeId ? `Employee #${path.employeeId}` : 'Employee'),
    department: path.department || 'General',
    currentLevel: path.currentLevel || 'Level 1',
    targetLevel: path.targetLevel || 'Level 3',
    estimatedTime: path.estimatedTime || `${steps.length * 2 || 4} weeks`,
    progress: typeof path.progress === 'number' ? path.progress : 0,
    status: path.status || 'In Progress',
    difficulty: path.difficulty || 'Intermediate',
    steps,
  };
}

export function normalizeLearningPaths(data) {
  if (Array.isArray(data)) {
    return data.map(normalizeSingleLearningPath).filter(Boolean);
  }
  if (data && typeof data === 'object') {
    const single = normalizeSingleLearningPath(data);
    return single ? [single] : [];
  }
  return [];
}

export function getRecommendations(employeeId) {
  const targetId = employeeId || 1;
  return fetchWithFallback({
    request: () => api.get(`/recommendations/${targetId}`),
    normalize: normalizeRecommendation,
    moduleName: 'Recommendations',
  });
}

export function getLearningPaths(employeeId) {
  const targetId = employeeId || 1;
  return fetchWithFallback({
    request: () => api.get(`/api/employees/${targetId}/learning-path`),
    normalize: normalizeLearningPaths,
    moduleName: 'Learning Paths',
  });
}

export async function generateRecommendations(employeeId) {
  const res = await api.post('/recommendations/generate', { employeeId: Number(employeeId) });
  return res.data;
}

export async function refreshRecommendations(employeeId) {
  const res = await api.post('/recommendations/refresh', { employeeId: Number(employeeId) });
  return res.data;
}
