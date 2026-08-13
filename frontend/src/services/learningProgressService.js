/**
 * learningProgressService.js
 * Hybrid backend API & persistent hybrid store service for Learning Progress Tracking & Certifications.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';
import {
  getCollection,
  addCollectionItem,
  updateCollectionItem,
  applySkillGainFromTraining,
  toggleMilestoneCompletion,
  renewCertification,
} from '../utils/hybridStore';

// ── 1. Learning Enrollments ──────────────────────────────────
export function normalizeEnrollment(en) {
  if (!en) return null;
  return {
    id: en.id,
    employeeId: en.employeeId || 3,
    employeeName: en.employeeName || 'Employee',
    courseName: en.courseName || en.name || `Training Program #${en.id}`,
    skill: en.skill || 'Core Skill',
    instructor: en.instructor || en.trainer || 'Certified Instructor',
    platform: en.platform || 'Internal LMS',
    startDate: en.startDate || '2026-07-01',
    endDate: en.endDate || '2026-08-30',
    duration: en.duration || '4 Weeks',
    progress: typeof en.progress === 'number' ? en.progress : 0,
    score: en.score !== undefined ? en.score : null,
    status: en.status || 'In Progress',
    statusBadge: en.statusBadge || (en.progress === 100 ? 'badge-success' : 'badge-warning'),
    certificateStatus: en.certificateStatus || 'In Progress',
    currentLevelBefore: en.currentLevelBefore || 2,
    targetLevelAfter: en.targetLevelAfter || 4,
    projectedGain: en.projectedGain || '+2.0 Levels',
    verifiedGain: en.verifiedGain || null,
    milestonesTotal: en.milestonesTotal || 5,
    milestonesCompleted: en.milestonesCompleted || 0,
  };
}

export function getLearningEnrollments(employeeId = null) {
  return fetchWithFallback({
    request: () => api.get('/api/learning/enrollments', { params: { employeeId } }),
    normalize: normalizeEnrollment,
    fallbackKey: 'learning_enrollments',
    moduleName: 'Learning Enrollments',
  }).then(enrollments => {
    if (employeeId && Array.isArray(enrollments)) {
      return enrollments.filter(e => String(e.employeeId) === String(employeeId));
    }
    return enrollments;
  });
}

// ── 2. Learning Milestones ───────────────────────────────────
export function normalizeMilestone(m) {
  if (!m) return null;
  return {
    id: m.id,
    enrollmentId: m.enrollmentId || 1,
    courseName: m.courseName || 'Training Program',
    title: m.title || `Milestone #${m.id}`,
    dueDate: m.dueDate || '2026-08-30',
    completedDate: m.completedDate || null,
    status: m.status || 'In Progress',
    order: m.order || 1,
    weight: m.weight || 20,
    description: m.description || 'Milestone objective description.',
  };
}

export function getLearningMilestones(enrollmentId = null) {
  return fetchWithFallback({
    request: () => api.get('/api/learning/milestones', { params: { enrollmentId } }),
    normalize: normalizeMilestone,
    fallbackKey: 'learning_milestones',
    moduleName: 'Learning Milestones',
  }).then(milestones => {
    if (enrollmentId && Array.isArray(milestones)) {
      return milestones.filter(m => String(m.enrollmentId) === String(enrollmentId));
    }
    return milestones;
  });
}

export async function toggleMilestone(milestoneId) {
  try {
    await api.post(`/api/learning/milestones/${milestoneId}/toggle`);
    toggleMilestoneCompletion(milestoneId);
  } catch (err) {
    toggleMilestoneCompletion(milestoneId);
  }
  return true;
}

// ── 3. Post-Training Skill Improvement (Cross-Module Sync) ───
export function normalizeSkillImprovement(si) {
  if (!si) return null;
  return {
    id: si.id,
    employeeId: si.employeeId || 3,
    employeeName: si.employeeName || 'Employee',
    skill: si.skill || 'Core Skill',
    courseName: si.courseName || 'Training Course',
    beforeLevel: si.beforeLevel || 2,
    afterLevel: si.afterLevel || 4,
    beforeScorePct: si.beforeScorePct || 40,
    afterScorePct: si.afterScorePct || 80,
    improvementPct: si.improvementPct || 40,
    levelGain: si.levelGain || 2.0,
    status: si.status || 'Verified & Applied',
    verified: !!si.verified,
    impact: si.impact || 'Skill gap closed upon completion.',
  };
}

export function getSkillImprovements(employeeId = null) {
  return fetchWithFallback({
    request: () => api.get('/api/learning/skill-improvements', { params: { employeeId } }),
    normalize: normalizeSkillImprovement,
    fallbackKey: 'skill_improvements',
    moduleName: 'Skill Improvements',
  }).then(improvements => {
    if (employeeId && Array.isArray(improvements)) {
      return improvements.filter(si => String(si.employeeId) === String(employeeId));
    }
    return improvements;
  });
}

export async function applyVerifiedSkillGain(enrollmentId, employeeId, skillName, targetLevel = 4) {
  try {
    await api.post('/api/learning/apply-skill-gain', { enrollmentId, employeeId, skillName, targetLevel });
    applySkillGainFromTraining(enrollmentId, employeeId, skillName, targetLevel);
  } catch (err) {
    console.warn('[LearningProgressService] Backend applySkillGain failed, applying locally in hybrid store:', err);
    applySkillGainFromTraining(enrollmentId, employeeId, skillName, targetLevel);
  }
  return true;
}

// ── 4. Certifications & Expiry Tracking ──────────────────────
export function normalizeCertification(c) {
  if (!c) return null;
  return {
    id: c.id,
    employeeId: c.employeeId || 3,
    employeeName: c.employeeName || 'Employee',
    certificationName: c.certificationName || 'Enterprise Certification',
    issuingOrganization: c.issuingOrganization || 'Certification Authority',
    issueDate: c.issueDate || '2024-09-15',
    expiryDate: c.expiryDate || '2026-09-15',
    credentialId: c.credentialId || `CERT-${c.id}`,
    credentialUrl: c.credentialUrl || '#',
    status: c.status || 'Valid',
    statusBadge: c.statusBadge || 'badge-success',
    daysRemaining: typeof c.daysRemaining === 'number' ? c.daysRemaining : 365,
    renewalRequired: !!c.renewalRequired,
    skill: c.skill || 'Technology',
    icon: c.icon || '📜',
  };
}

export function getCertifications(employeeId = null) {
  return fetchWithFallback({
    request: () => api.get('/api/learning/certifications', { params: { employeeId } }),
    normalize: normalizeCertification,
    fallbackKey: 'certifications',
    moduleName: 'Certifications',
  }).then(certs => {
    if (employeeId && Array.isArray(certs)) {
      return certs.filter(c => String(c.employeeId) === String(employeeId));
    }
    return certs;
  });
}

export async function renewCert(certId) {
  try {
    await api.post(`/api/learning/certifications/${certId}/renew`);
    renewCertification(certId);
  } catch (err) {
    renewCertification(certId);
  }
  return true;
}

// ── 5. Learning Velocity Analytics ───────────────────────────
export function getLearningVelocity(employeeId = null) {
  return fetchWithFallback({
    request: () => api.get('/api/learning/velocity', { params: { employeeId } }),
    normalize: (data) => data,
    fallbackKey: 'learning_velocity',
    moduleName: 'Learning Velocity',
  });
}

// ── 6. Team Learning Progress (Manager & Admin View) ─────────
export async function getTeamLearningProgress(department = null) {
  const employees = getCollection('employees');
  const enrollments = getCollection('learning_enrollments');
  const certs = getCollection('certifications');

  const filteredEmployees = department && department !== 'All'
    ? employees.filter(e => e.department === department)
    : employees;

  return filteredEmployees.map(emp => {
    const empEnrollments = enrollments.filter(en => String(en.employeeId) === String(emp.id));
    const completedCount = empEnrollments.filter(en => en.status === 'Completed' || en.status === 'Certified').length;
    const avgProg = empEnrollments.length > 0
      ? Math.round(empEnrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / empEnrollments.length)
      : 0;

    const empCerts = certs.filter(c => String(c.employeeId) === String(emp.id));
    const expiringCertsCount = empCerts.filter(c => c.status === 'Expiring Soon' || c.status === 'Expired').length;
    const isAtRisk = empEnrollments.some(en => en.status === 'In Progress' && en.progress < 40) || expiringCertsCount > 0;

    return {
      employee: emp,
      totalCourses: empEnrollments.length || 2,
      completedCourses: completedCount,
      averageProgress: avgProg,
      certificationsCount: empCerts.length,
      expiringCertsCount,
      isAtRisk,
      learningVelocity: avgProg >= 70 ? 'High' : avgProg >= 40 ? 'Moderate' : 'Needs Support',
      courses: empEnrollments,
    };
  });
}
