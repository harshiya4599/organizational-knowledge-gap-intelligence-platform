/**
 * assessmentService.js
 * Hybrid API & persistent hybrid store service for Assessment & Survey Module (Module 8).
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';
import {
  getCollection,
  addCollectionItem,
  updateCollectionItem,
  deleteCollectionItem,
  submitAssessmentAndRecalculateGaps,
  getStore,
  saveStore,
} from '../utils/hybridStore';

// ── 1. Assessment Templates ──────────────────────────────────────────
export function getAssessmentTemplates() {
  const localItems = getCollection('assessment_templates');
  if (Array.isArray(localItems) && localItems.length > 0) {
    return Promise.resolve(localItems);
  }
  return fetchWithFallback({
    request: () => api.get('/api/assessments/templates'),
    normalize: (t) => t,
    fallbackKey: 'assessment_templates',
    moduleName: 'Assessment Templates',
  });
}

export function saveAssessmentTemplate(template) {
  if (template.id) {
    return updateCollectionItem('assessment_templates', template.id, template);
  }
  return addCollectionItem('assessment_templates', {
    ...template,
    status: template.status || 'Published',
    createdDate: new Date().toISOString().split('T')[0],
  });
}

export function duplicateAssessmentTemplate(templateId) {
  const store = getStore();
  const templates = store.assessment_templates || [];
  const source = templates.find(t => String(t.id) === String(templateId));
  if (!source) return null;

  const newTemplate = {
    ...source,
    id: undefined,
    title: `${source.title} (Copy)`,
    name: `${source.name || source.title} (Copy)`,
    status: 'Draft',
    createdDate: new Date().toISOString().split('T')[0],
  };

  const saved = addCollectionItem('assessment_templates', newTemplate);

  // Duplicate questions as well
  const questions = store.assessment_questions || [];
  const sourceQuestions = questions.filter(q => String(q.templateId) === String(templateId));
  sourceQuestions.forEach(q => {
    addCollectionItem('assessment_questions', {
      ...q,
      id: undefined,
      templateId: saved.id,
    });
  });

  return saved;
}

export function archiveAssessmentTemplate(templateId) {
  return updateCollectionItem('assessment_templates', templateId, { status: 'Archived' });
}

export function deleteAssessmentTemplate(id) {
  // Also delete associated questions
  const store = getStore();
  store.assessment_questions = (store.assessment_questions || []).filter(q => String(q.templateId) !== String(id));
  saveStore(store);

  return deleteCollectionItem('assessment_templates', id);
}

// ── 2. Assessment Questions ──────────────────────────────────────────
export function getAssessmentQuestions(templateId = null) {
  const localItems = getCollection('assessment_questions');
  if (Array.isArray(localItems) && localItems.length > 0) {
    if (templateId) {
      return Promise.resolve(localItems.filter(q => String(q.templateId) === String(templateId)));
    }
    return Promise.resolve(localItems);
  }
  return fetchWithFallback({
    request: () => api.get('/api/assessments/questions', { params: { templateId } }),
    normalize: (q) => q,
    fallbackKey: 'assessment_questions',
    moduleName: 'Assessment Questions',
  }).then(questions => {
    if (templateId && Array.isArray(questions)) {
      return questions.filter(q => String(q.templateId) === String(templateId));
    }
    return questions;
  });
}

export function saveAssessmentQuestion(question) {
  if (question.id) {
    return updateCollectionItem('assessment_questions', question.id, question);
  }
  return addCollectionItem('assessment_questions', question);
}

export function deleteAssessmentQuestion(id) {
  return deleteCollectionItem('assessment_questions', id);
}

// ── 3. Assessments & Submissions ────────────────────────────────────
export function getAssessments(employeeId = null) {
  return fetchWithFallback({
    request: () => api.get('/api/assessments', { params: { employeeId } }),
    normalize: (a) => a,
    fallbackKey: 'assessments',
    moduleName: 'Assessments',
  }).then(list => {
    if (employeeId && Array.isArray(list)) {
      return list.filter(a => Number(a.employeeId) === Number(employeeId));
    }
    return list;
  });
}

export async function submitAssessment(payload) {
  try {
    await api.post('/api/assessments/submit', payload);
  } catch (err) {
    console.warn('[AssessmentService] Backend submit unavailable, saving locally:', err);
  }
  return submitAssessmentAndRecalculateGaps(payload);
}

// ── 4. 360-Degree Peer Reviews ──────────────────────────────────────
export function getPeerReviews(employeeId = null) {
  return fetchWithFallback({
    request: () => api.get('/api/assessments/peer-reviews', { params: { employeeId } }),
    normalize: (r) => r,
    fallbackKey: 'peer_reviews',
    moduleName: 'Peer Reviews',
  }).then(list => {
    if (employeeId && Array.isArray(list)) {
      return list.filter(r => Number(r.employeeId) === Number(employeeId) || Number(r.reviewerId) === Number(employeeId));
    }
    return list;
  });
}

export function requestPeerReview(requestData) {
  return addCollectionItem('peer_reviews', {
    ...requestData,
    status: 'Pending',
    requestedDate: new Date().toISOString().split('T')[0],
  });
}

export function cancelPeerReview(id) {
  return deleteCollectionItem('peer_reviews', id);
}

export function submitPeerReviewResponse(reviewId, feedbackData) {
  const skillRatings = feedbackData.skillRatings || {
    'AWS Cloud': Number(feedbackData.awsRating || 4),
    'Docker & Kubernetes': Number(feedbackData.k8sRating || 3.5),
    'React': Number(feedbackData.reactRating || 5),
    'System Architecture': Number(feedbackData.archRating || 4),
  };

  return updateCollectionItem('peer_reviews', reviewId, {
    status: 'Completed',
    completedDate: new Date().toISOString().split('T')[0],
    ratingScore: Number(feedbackData.rating || 4.5),
    skillRatings,
    strengths: feedbackData.strengths || 'Strong frontend component design, React 19 execution, and effective team collaboration.',
    areasForImprovement: feedbackData.areasForImprovement || 'Deepen AWS serverless deployment and Kubernetes ingress container architecture.',
    confidentialFeedback: feedbackData.feedback || feedbackData.comments || 'Consistently demonstrates solid technical proficiency.',
    comments: feedbackData.comments || feedbackData.feedback || 'Consistently demonstrates solid technical proficiency.',
    recommendation: feedbackData.recommendation || 'Complete AWS Certified Solutions Architect Associate exam.',
  });
}

// ── 5. Assessment Schedules & Reminders ─────────────────────────────
export function getAssessmentSchedules() {
  const localItems = getCollection('assessment_schedules');
  if (Array.isArray(localItems) && localItems.length > 0) {
    return Promise.resolve(localItems);
  }
  return fetchWithFallback({
    request: () => api.get('/api/assessments/schedules'),
    normalize: (s) => s,
    fallbackKey: 'assessment_schedules',
    moduleName: 'Assessment Schedules',
  });
}

export function saveAssessmentSchedule(schedule) {
  if (schedule.id) {
    return updateCollectionItem('assessment_schedules', schedule.id, schedule);
  }
  return addCollectionItem('assessment_schedules', schedule);
}

export function deleteAssessmentSchedule(id) {
  return deleteCollectionItem('assessment_schedules', id);
}

export function sendAssessmentReminder({ employeeId, employeeName, assessmentTitle, dueDate }) {
  const store = getStore();
  const notif = {
    id: (store.notifications || []).length + 1,
    employeeId: Number(employeeId || 3),
    title: `🔔 Reminder: ${assessmentTitle}`,
    description: `Your assessment "${assessmentTitle}" is due on ${dueDate || 'Aug 25, 2026'}. Please complete it soon.`,
    category: 'Assessments',
    priority: 'High',
    read: false,
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
    actionLabel: 'Take Assessment',
    actionRoute: '/assessments',
    meta: { assessmentTitle },
  };

  store.notifications = [notif, ...(store.notifications || [])];

  const logs = store.notification_delivery_logs || [];
  logs.unshift({
    id: logs.length + 1,
    title: notif.title,
    channel: 'In-App / System Alert',
    recipient: employeeName || `Employee #${employeeId}`,
    status: 'Delivered',
    sentAt: new Date().toLocaleString(),
  });
  store.notification_delivery_logs = logs;

  saveStore(store);
  return notif;
}
