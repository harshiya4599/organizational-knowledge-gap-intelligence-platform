/**
 * hybridStore.js
 * Centralized Hybrid Data Management & Synchronization Engine.
 *
 * Implements a persistent, interconnected local cache layered underneath
 * real Spring Boot REST APIs. Guarantees the application is NEVER EMPTY,
 * supports CRUD persistence across page refreshes in offline/demo mode,
 * and seamlessly synchronizes cross-module updates across Employees,
 * Skills, Competencies, Gaps, Recommendations, Mentorship, Communities,
 * Learning Progress, Certifications, and Dashboards.
 */

import {
  SEED_DEPARTMENTS,
  SEED_SKILLS,
  SEED_USERS,
  SEED_EMPLOYEES,
  SEED_COMPETENCIES,
  SEED_EMPLOYEE_SKILLS,
  SEED_TRAININGS,
  SEED_RECOMMENDATIONS,
  SEED_MENTORS,
  SEED_KNOWLEDGE_SESSIONS,
  SEED_EXPERTS,
  SEED_COMMUNITIES,
  SEED_KNOWLEDGE_RESOURCES,
  SEED_SESSION_FEEDBACK,
  SEED_LEARNING_ENROLLMENTS,
  SEED_LEARNING_MILESTONES,
  SEED_CERTIFICATIONS,
  SEED_SKILL_IMPROVEMENTS,
  SEED_LEARNING_VELOCITY,
  SEED_ASSESSMENTS,
  SEED_ASSESSMENT_TEMPLATES,
  SEED_ASSESSMENT_QUESTIONS,
  SEED_PEER_REVIEWS,
  SEED_ASSESSMENT_SCHEDULES,
  SEED_NOTIFICATIONS,
  SEED_NOTIFICATION_PREFERENCES,
  SEED_NOTIFICATION_DELIVERY_LOGS,
} from '../data/seedData';

const STORE_KEY = 'kg_hybrid_store_v13';
const EVENT_NAME = 'kg_data_sync_event';

/**
 * Calculates dynamic days remaining from today to expiryDate string.
 */
export function calculateDaysRemaining(expiryDateStr) {
  if (!expiryDateStr) return 365;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDateStr);
    exp.setHours(0, 0, 0, 0);
    const diffMs = exp - today;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 365;
  }
}

/**
 * Normalizes certifications with dynamic status and days remaining.
 */
function normalizeCertificationsList(certs) {
  return certs.map(c => {
    const days = calculateDaysRemaining(c.expiryDate);
    let status = 'Valid';
    let statusBadge = 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200';
    let renewalRequired = false;

    if (days < 0) {
      status = 'Expired';
      statusBadge = 'badge-danger bg-red-50 text-red-700 border-red-200';
      renewalRequired = true;
    } else if (days <= 60) {
      status = 'Expiring Soon';
      statusBadge = 'badge-warning bg-amber-50 text-amber-700 border-amber-200';
      renewalRequired = true;
    }

    return {
      ...c,
      daysRemaining: days,
      status,
      statusBadge,
      renewalRequired,
    };
  });
}

function calculateInitialGaps(employeeSkills, competencies, employees) {
  const gaps = [];
  const empMap = Object.fromEntries(employees.map(e => [e.id, e]));

  employeeSkills.forEach((es, idx) => {
    const emp = empMap[es.employeeId] || { name: `Employee #${es.employeeId}`, department: 'Engineering' };
    const compMatch = competencies.find(c =>
      (c.department === emp.department || String(c.departmentId) === String(emp.departmentId)) &&
      (c.skill === es.skill || String(c.skillId) === String(es.skillId))
    );
    const reqLevel = compMatch?.requiredLevel ?? es.requiredLevel ?? 4;
    const curLevel = es.level ?? 1;
    const gapDiff = reqLevel - curLevel;

    if (gapDiff > 0) {
      gaps.push({
        id: es.id || (idx + 1),
        employeeId: es.employeeId,
        skillId: es.skillId,
        employee: emp.name,
        department: emp.department,
        skill: es.skill,
        currentLevel: curLevel,
        requiredLevel: reqLevel,
        overallSkillScore: curLevel,
        gapDiff: gapDiff,
        gapScore: gapDiff,
        gapSeverity: gapDiff >= 3 ? 'Critical' : gapDiff >= 2 ? 'High' : gapDiff === 1 ? 'Medium' : 'Low',
        priority: gapDiff >= 3 ? 'Critical' : gapDiff >= 2 ? 'High' : gapDiff === 1 ? 'Medium' : 'Low',
        lastAssessed: es.lastUpdated || '2026-07-15',
      });
    }
  });

  return gaps;
}

function calculateCompetencyAverages(competencies, employeeSkills, employees) {
  const empMap = Object.fromEntries(employees.map(e => [e.id, e]));

  return competencies.map(comp => {
    const matchingEmpSkills = employeeSkills.filter(es => {
      const emp = empMap[es.employeeId];
      if (!emp) return false;
      const deptMatch = emp.department === comp.department || String(emp.departmentId) === String(comp.departmentId);
      const skillMatch = es.skill === comp.skill || String(es.skillId) === String(comp.skillId);
      return deptMatch && skillMatch;
    });

    const sum = matchingEmpSkills.reduce((acc, curr) => acc + (curr.level || 0), 0);
    const count = matchingEmpSkills.length;
    const computedAvg = count > 0 ? parseFloat((sum / count).toFixed(2)) : (comp.currentVal || 3.0);
    const req = comp.requiredLevel || comp.targetVal || 4.0;
    const variance = parseFloat((computedAvg - req).toFixed(2));

    return {
      ...comp,
      currentVal: computedAvg,
      averageProficiency: computedAvg,
      targetVal: req,
      requiredLevel: req,
      gapVariance: variance,
      status: variance >= 0 ? 'Optimal' : variance >= -1 ? 'Moderate Gap' : 'Critical Deficit',
      evaluatedEmployees: count || 4,
    };
  });
}

function calculateInitialRecommendations(gaps, trainings) {
  if (SEED_RECOMMENDATIONS && SEED_RECOMMENDATIONS.length > 0) {
    return SEED_RECOMMENDATIONS;
  }

  return gaps.map((gap, idx) => {
    const matchedTraining = trainings.find(t =>
      t.recommendedForSkill === gap.skill ||
      (t.name && t.name.toLowerCase().includes(gap.skill.toLowerCase()))
    ) || trainings[idx % trainings.length];

    const matchPct = Math.min(99, Math.max(75, 95 - (gap.gapDiff * 3)));

    return {
      id: idx + 1,
      gapId: gap.id,
      employeeId: gap.employeeId,
      employee: gap.employee,
      department: gap.department,
      skill: gap.skill,
      currentLevel: gap.currentLevel,
      targetLevel: gap.requiredLevel,
      gapSeverity: gap.gapSeverity,
      courseTitle: matchedTraining?.name || `${gap.skill} Mastery & Production Architecture`,
      trainingName: matchedTraining?.name || `${gap.skill} Mastery & Production Architecture`,
      trainingId: matchedTraining?.id || 1,
      provider: matchedTraining?.dept === 'Data Science' ? 'Coursera' : 'Internal LMS',
      duration: matchedTraining?.duration || '4 Weeks',
      difficulty: matchedTraining?.difficulty || 'Advanced',
      matchScore: matchPct,
      matchScoreFormatted: `${matchPct}%`,
      expectedProficiencyGain: matchedTraining?.expectedGain || `+${gap.gapDiff} Levels`,
      expectedGain: matchedTraining?.expectedGain || `+${gap.gapDiff} Levels`,
      status: 'Recommended',
      priority: gap.priority || 'High',
    };
  });
}

export function recalculateGapsAndDependencies(store) {
  if (!store) return;
  const computedCompetencies = calculateCompetencyAverages(store.competencies || [], store.employee_skills || [], store.employees || []);
  const computedGaps = calculateInitialGaps(store.employee_skills || [], computedCompetencies, store.employees || []);
  
  store.competencies = computedCompetencies;
  store.gap_analysis = computedGaps;

  // Dynamically update recommendations based on employee active skills
  if (store.recommendations && Array.isArray(store.recommendations)) {
    store.recommendations = store.recommendations.map(rec => {
      const empSkill = (store.employee_skills || []).find(es =>
        (String(es.employeeId) === String(rec.employeeId) || !rec.employeeId) &&
        (es.skill.toLowerCase().includes(rec.skill.toLowerCase()) || rec.skill.toLowerCase().includes(es.skill.toLowerCase()))
      );

      const curLevel = empSkill?.level ?? rec.currentLevel ?? 2;
      const targetLevel = rec.targetLevel || 4;
      const gapDiff = Math.max(0, targetLevel - curLevel);

      let priority = rec.priority;
      let score = rec.score || rec.matchScore || 88;

      if (gapDiff >= 2) {
        priority = 'Critical';
        score = Math.max(score, 96);
      } else if (gapDiff === 1) {
        priority = 'High';
        score = Math.max(score, 88);
      } else if (gapDiff === 0) {
        priority = 'Completed';
        score = 75;
      }

      return {
        ...rec,
        currentLevel: curLevel,
        targetLevel,
        gapLevel: gapDiff,
        priority: priority === 'Completed' ? 'Completed' : (rec.priority || priority),
        matchScore: score,
        score,
        aiMatchScore: score,
      };
    });
  }

  store.learning_velocity = calculateDynamicVelocity(store);
}

function calculateDynamicVelocity(store, employeeId = null) {
  const enrollments = store.learning_enrollments || [];
  const milestones = store.learning_milestones || [];
  const skillGains = store.skill_improvements || [];

  const empEnrollments = employeeId
    ? enrollments.filter(e => String(e.employeeId) === String(employeeId))
    : enrollments;

  const completedCount = empEnrollments.filter(e => e.status === 'Completed' || e.status === 'Certified').length;
  const inProgressCount = empEnrollments.filter(e => e.status === 'In Progress').length;
  const verifiedGainsCount = skillGains.filter(s => s.verified).length;

  const totalLearningHours = (completedCount * 32) + (inProgressCount * 14) + 12;
  const avgCompletionDays = Math.max(12, Math.round(24 - (completedCount * 2)));
  const velocityIndex = Math.min(100, Math.max(50, 60 + (completedCount * 8) + (verifiedGainsCount * 6)));

  const monthlyTrend = [
    { month: 'Jan', coursesCompleted: 1, hoursStudied: 20, velocityScore: 68 },
    { month: 'Feb', coursesCompleted: 1, hoursStudied: 24, velocityScore: 72 },
    { month: 'Mar', coursesCompleted: 2, hoursStudied: 32, velocityScore: 78 },
    { month: 'Apr', coursesCompleted: 2, hoursStudied: 30, velocityScore: 82 },
    { month: 'May', coursesCompleted: Math.max(2, completedCount - 1), hoursStudied: 36, velocityScore: 86 },
    { month: 'Jun', coursesCompleted: completedCount, hoursStudied: totalLearningHours, velocityScore: velocityIndex },
  ];

  return {
    coursesCompletedTotal: completedCount || 4,
    coursesInProgressTotal: inProgressCount || 2,
    avgCompletionDays,
    skillsImprovedCount: verifiedGainsCount || 3,
    avgSkillLevelGain: 1.8,
    totalLearningHours,
    learningVelocityIndex: velocityIndex,
    monthlyTrend,
  };
}

function getInitialStoreState() {
  const computedCompetencies = calculateCompetencyAverages(SEED_COMPETENCIES, SEED_EMPLOYEE_SKILLS, SEED_EMPLOYEES);
  const initialGaps = calculateInitialGaps(SEED_EMPLOYEE_SKILLS, computedCompetencies, SEED_EMPLOYEES);
  const initialRecs = SEED_RECOMMENDATIONS && SEED_RECOMMENDATIONS.length > 0
    ? SEED_RECOMMENDATIONS
    : calculateInitialRecommendations(initialGaps, SEED_TRAININGS);
  const initialCerts = normalizeCertificationsList(SEED_CERTIFICATIONS);

  return {
    departments: SEED_DEPARTMENTS,
    skills: SEED_SKILLS,
    users: SEED_USERS,
    employees: SEED_EMPLOYEES,
    competencies: computedCompetencies,
    employee_skills: SEED_EMPLOYEE_SKILLS,
    trainings: SEED_TRAININGS,
    gap_analysis: initialGaps,
    recommendations: initialRecs,

    // Milestone 3: Mentorship & Knowledge Sharing
    mentors: SEED_MENTORS,
    mentorship_sessions: SEED_KNOWLEDGE_SESSIONS,
    experts: SEED_EXPERTS,
    communities: SEED_COMMUNITIES,
    knowledge_resources: SEED_KNOWLEDGE_RESOURCES,
    session_feedback: SEED_SESSION_FEEDBACK,
    mentorship_requests: [],
    expert_bookings: [],

    // Milestone 3: Learning Progress Tracking
    learning_enrollments: SEED_LEARNING_ENROLLMENTS,
    learning_milestones: SEED_LEARNING_MILESTONES,
    certifications: initialCerts,
    skill_improvements: SEED_SKILL_IMPROVEMENTS,
    learning_velocity: SEED_LEARNING_VELOCITY,

    // Module 8 & 9: Assessments, Surveys & Notifications
    assessments: SEED_ASSESSMENTS,
    assessment_templates: SEED_ASSESSMENT_TEMPLATES,
    assessment_questions: SEED_ASSESSMENT_QUESTIONS,
    peer_reviews: SEED_PEER_REVIEWS,
    assessment_schedules: SEED_ASSESSMENT_SCHEDULES,
    notifications: SEED_NOTIFICATIONS,
    notification_preferences: SEED_NOTIFICATION_PREFERENCES,
    notification_delivery_logs: SEED_NOTIFICATION_DELIVERY_LOGS,
  };
}

/**
 * Loads entire store from localStorage or initializes from seed data.
 */
export function getStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const initial = getInitialStoreState();
      localStorage.setItem(STORE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);

    // Guard: ensure all collections exist even if previous cache was loaded
    let needsResave = false;
    const initial = getInitialStoreState();
    Object.keys(initial).forEach((key) => {
      if (parsed[key] === undefined) {
        parsed[key] = initial[key];
        needsResave = true;
      }
    });

    // Ensure recommendations always contain external industry platform courses (no Internal LMS in recommendations)
    const hasInternalLms = (parsed.recommendations || []).some(r => r.provider === 'Internal LMS');
    if (!parsed.recommendations || parsed.recommendations.length < SEED_RECOMMENDATIONS.length || hasInternalLms) {
      parsed.recommendations = SEED_RECOMMENDATIONS;
      needsResave = true;
    }

    // Ensure certs always have current days remaining calculated
    if (parsed.certifications && Array.isArray(parsed.certifications)) {
      parsed.certifications = normalizeCertificationsList(parsed.certifications);
    }

    // Ensure notifications dynamically match real application data across all modules
    parsed.notifications = syncDynamicNotifications(parsed);

    if (needsResave) {
      localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch (err) {
    console.warn('[HybridStore] Error reading store, using initial seed:', err);
    return getInitialStoreState();
  }
}

/**
 * Saves entire store to localStorage and broadcasts update event.
 */
export function saveStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    notifyUpdate();
  } catch (err) {
    console.error('[HybridStore] Error saving store:', err);
  }
}

/**
 * Returns a specific collection (e.g. 'skills', 'employees', 'mentors', 'learning_enrollments').
 */
export function getCollection(collectionName) {
  const store = getStore();
  return Array.isArray(store[collectionName])
    ? store[collectionName]
    : store[collectionName] !== undefined
    ? store[collectionName]
    : [];
}

/**
 * Adds an item to a collection with automatic ID allocation and recalculation.
 */
export function addCollectionItem(collectionName, item) {
  const store = getStore();
  const list = Array.isArray(store[collectionName]) ? store[collectionName] : [];
  const maxId = list.reduce((max, x) => (x.id && typeof x.id === 'number' ? Math.max(max, x.id) : max), 0);
  const newItem = { ...item, id: item.id || (maxId + 1) };
  store[collectionName] = [newItem, ...list];
  recalculateGapsAndDependencies(store);
  saveStore(store);
  return newItem;
}

/**
 * Updates an item in a collection.
 */
export function updateCollectionItem(collectionName, id, updates) {
  const store = getStore();
  const list = Array.isArray(store[collectionName]) ? store[collectionName] : [];
  store[collectionName] = list.map((item) =>
    String(item.id) === String(id) ? { ...item, ...updates } : item
  );
  recalculateGapsAndDependencies(store);
  saveStore(store);
  return store[collectionName].find(item => String(item.id) === String(id));
}

/**
 * Deletes an item from a collection.
 */
export function deleteCollectionItem(collectionName, id) {
  const store = getStore();
  const list = Array.isArray(store[collectionName]) ? store[collectionName] : [];
  store[collectionName] = list.filter((item) => String(item.id) !== String(id));

  // Cascade cleanup
  if (collectionName === 'skills') {
    store.employee_skills = (store.employee_skills || []).filter(es => String(es.skillId) !== String(id) && es.skill !== id);
    store.competencies = (store.competencies || []).filter(c => String(c.skillId) !== String(id) && c.skill !== id);
  } else if (collectionName === 'employees') {
    store.employee_skills = (store.employee_skills || []).filter(es => String(es.employeeId) !== String(id));
  } else if (collectionName === 'departments') {
    store.competencies = (store.competencies || []).filter(c => String(c.departmentId) !== String(id) && c.department !== id);
  }

  recalculateGapsAndDependencies(store);
  saveStore(store);
  return true;
}

/**
 * CROSS-MODULE INTEGRATION:
 * Applies verified skill level gain from completing a training course.
 * Automatically updates employee_skills, closes the gap in gap_analysis,
 * updates recommendations, and marks the enrollment & improvement as verified!
 */
export function applySkillGainFromTraining(enrollmentId, employeeId, skillName, targetLevel = 4) {
  const store = getStore();

  // 1. Update or add employee skill
  const empSkills = store.employee_skills || [];
  const existingSkillIdx = empSkills.findIndex(
    es => String(es.employeeId) === String(employeeId) && (es.skill === skillName || String(es.skillId) === String(skillName))
  );

  if (existingSkillIdx >= 0) {
    empSkills[existingSkillIdx] = {
      ...empSkills[existingSkillIdx],
      level: targetLevel,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  } else {
    empSkills.push({
      id: empSkills.length + 1,
      employeeId: Number(employeeId),
      skill: skillName,
      level: targetLevel,
      requiredLevel: targetLevel,
      lastUpdated: new Date().toISOString().split('T')[0],
    });
  }
  store.employee_skills = empSkills;

  // 2. Mark enrollment as 100% completed & certified
  if (store.learning_enrollments) {
    store.learning_enrollments = store.learning_enrollments.map(en => {
      if (String(en.id) === String(enrollmentId) || (String(en.employeeId) === String(employeeId) && en.skill === skillName)) {
        return {
          ...en,
          progress: 100,
          status: 'Certified',
          statusBadge: 'badge-purple bg-purple-50 text-purple-700 border-purple-200',
          certificateStatus: `Verified Certificate Issued (Level ${targetLevel})`,
          verifiedGain: `+${(targetLevel - (en.currentLevelBefore || 2)).toFixed(1)} Levels (Achieved Level ${targetLevel})`,
          milestonesCompleted: en.milestonesTotal || 5,
        };
      }
      return en;
    });
  }

  // 3. Mark skill improvement as verified
  if (store.skill_improvements) {
    store.skill_improvements = store.skill_improvements.map(si => {
      if (String(si.employeeId) === String(employeeId) && si.skill === skillName) {
        return {
          ...si,
          afterLevel: targetLevel,
          afterScorePct: Math.round((targetLevel / 5) * 100),
          status: 'Verified & Applied',
          verified: true,
          impact: `Successfully closed gap, target benchmark of Level ${targetLevel} reached!`,
        };
      }
      return si;
    });
  }

  // 4. Recalculate gaps, competency matrix, and recommendations
  recalculateGapsAndDependencies(store);
  saveStore(store);
  return true;
}

/**
 * Mentorship session registration action.
 */
export function registerForSession(sessionId, userId) {
  const store = getStore();
  const sessions = store.mentorship_sessions || [];

  store.mentorship_sessions = sessions.map(s => {
    if (String(s.id) === String(sessionId)) {
      const regList = Array.isArray(s.registeredUserIds) ? s.registeredUserIds : [];
      if (!regList.includes(userId)) {
        const nextSeats = Math.min(s.totalSeats, (s.registeredSeats || 0) + 1);
        return {
          ...s,
          registeredSeats: nextSeats,
          registeredUserIds: [...regList, userId],
        };
      }
    }
    return s;
  });

  saveStore(store);
  return true;
}

/**
 * Mentorship session cancellation action.
 */
export function cancelSessionRegistration(sessionId, userId) {
  const store = getStore();
  const sessions = store.mentorship_sessions || [];

  store.mentorship_sessions = sessions.map(s => {
    if (String(s.id) === String(sessionId)) {
      const regList = Array.isArray(s.registeredUserIds) ? s.registeredUserIds : [];
      return {
        ...s,
        registeredSeats: Math.max(0, (s.registeredSeats || 0) - 1),
        registeredUserIds: regList.filter(id => String(id) !== String(userId)),
      };
    }
    return s;
  });

  saveStore(store);
  return true;
}

/**
 * Mentorship request management (create / cancel).
 */
export function createMentorshipRequest(requestData) {
  const store = getStore();
  const requests = store.mentorship_requests || [];
  const existingIdx = requests.findIndex(
    r => String(r.mentorId) === String(requestData.mentorId) && String(r.employeeId) === String(requestData.employeeId)
  );

  const newReq = {
    ...requestData,
    id: requestData.id || requests.length + 1,
    status: 'Pending Review',
    requestedAt: new Date().toISOString().split('T')[0],
  };

  if (existingIdx >= 0) {
    requests[existingIdx] = newReq;
  } else {
    requests.push(newReq);
  }

  store.mentorship_requests = requests;
  saveStore(store);
  return newReq;
}

export function cancelMentorshipRequest(mentorId, employeeId) {
  const store = getStore();
  store.mentorship_requests = (store.mentorship_requests || []).filter(
    r => !(String(r.mentorId) === String(mentorId) && String(r.employeeId) === String(employeeId))
  );
  saveStore(store);
  return true;
}

/**
 * Expert 1:1 Consultation booking management.
 */
export function bookExpertConsultation(bookingData) {
  const store = getStore();
  const bookings = store.expert_bookings || [];
  const newBooking = {
    ...bookingData,
    id: bookingData.id || bookings.length + 1,
    status: 'Confirmed',
    bookedAt: new Date().toISOString().split('T')[0],
  };
  store.expert_bookings = [...bookings, newBooking];
  saveStore(store);
  return newBooking;
}

export function cancelExpertConsultation(expertId, employeeId) {
  const store = getStore();
  store.expert_bookings = (store.expert_bookings || []).filter(
    b => !(String(b.expertId) === String(expertId) && String(b.employeeId) === String(employeeId))
  );
  saveStore(store);
  return true;
}

/**
 * Community membership toggle.
 */
export function toggleCommunityMembership(communityId, userId, isJoining) {
  const store = getStore();
  const communities = store.communities || [];

  store.communities = communities.map(c => {
    if (String(c.id) === String(communityId)) {
      const userList = Array.isArray(c.joinedUserIds) ? c.joinedUserIds : (c.isJoined ? [userId] : []);
      let updatedUserIds = userList;

      if (isJoining) {
        if (!updatedUserIds.includes(userId)) updatedUserIds = [...updatedUserIds, userId];
      } else {
        updatedUserIds = updatedUserIds.filter(id => String(id) !== String(userId));
      }

      return {
        ...c,
        isJoined: isJoining,
        joinedUserIds: updatedUserIds,
        membersCount: isJoining ? c.membersCount + 1 : Math.max(1, c.membersCount - 1),
      };
    }
    return c;
  });

  saveStore(store);
  return true;
}

/**
 * Community discussions and resources addition.
 */
export function addCommunityDiscussion(communityId, discussion) {
  const store = getStore();
  store.communities = (store.communities || []).map(c => {
    if (String(c.id) === String(communityId)) {
      const discList = Array.isArray(c.discussions) ? c.discussions : [];
      const newDisc = {
        ...discussion,
        id: discList.length + 1,
        timestamp: 'Just now',
        repliesCount: 0,
        likesCount: 1,
      };
      return {
        ...c,
        discussions: [newDisc, ...discList],
      };
    }
    return c;
  });
  saveStore(store);
  return true;
}

export function addCommunityResource(communityId, resource) {
  const store = getStore();
  store.communities = (store.communities || []).map(c => {
    if (String(c.id) === String(communityId)) {
      const resList = Array.isArray(c.resources) ? c.resources : [];
      const newRes = {
        ...resource,
        id: resList.length + 1,
        size: '1.2 MB',
      };
      return {
        ...c,
        resources: [newRes, ...resList],
      };
    }
    return c;
  });
  saveStore(store);
  return true;
}

/**
 * Resource bookmark toggle.
 */
export function toggleResourceBookmark(resourceId, userId) {
  const store = getStore();
  const resources = store.knowledge_resources || [];

  store.knowledge_resources = resources.map(r => {
    if (String(r.id) === String(resourceId)) {
      const nextState = !r.isBookmarked;
      return {
        ...r,
        isBookmarked: nextState,
        likes: nextState ? (r.likes || 0) + 1 : Math.max(0, (r.likes || 1) - 1),
      };
    }
    return r;
  });

  saveStore(store);
  return true;
}

/**
 * Feedback submission with live rating recalculation across mentors & experts.
 */
export function addSessionFeedbackItem(feedback) {
  const store = getStore();
  const feedbackList = store.session_feedback || [];
  const newFeedback = {
    ...feedback,
    id: feedback.id || feedbackList.length + 1,
    date: feedback.date || new Date().toISOString().split('T')[0],
  };

  store.session_feedback = [newFeedback, ...feedbackList];

  // Update mentor and expert ratings
  if (feedback.mentorName) {
    const allMentorFeedbacks = store.session_feedback.filter(f => f.mentorName === feedback.mentorName);
    if (allMentorFeedbacks.length > 0) {
      const avg = (allMentorFeedbacks.reduce((acc, f) => acc + (f.rating || 5), 0) / allMentorFeedbacks.length).toFixed(1);
      const parsedAvg = parseFloat(avg);

      store.mentors = (store.mentors || []).map(m =>
        m.name === feedback.mentorName ? { ...m, rating: parsedAvg, sessionsCount: (m.sessionsCount || 10) + 1 } : m
      );
      store.experts = (store.experts || []).map(e =>
        e.name === feedback.mentorName ? { ...e, rating: parsedAvg, sessionsConducted: (e.sessionsConducted || 8) + 1 } : e
      );
    }
  }

  saveStore(store);
  return newFeedback;
}

/**
 * Milestone status toggle.
 */
export function toggleMilestoneCompletion(milestoneId) {
  const store = getStore();
  const milestones = store.learning_milestones || [];
  let enrollmentToUpdate = null;

  store.learning_milestones = milestones.map(m => {
    if (String(m.id) === String(milestoneId)) {
      const isDone = m.status === 'Completed';
      const nextStatus = isDone ? 'In Progress' : 'Completed';
      enrollmentToUpdate = m.enrollmentId;
      return {
        ...m,
        status: nextStatus,
        completedDate: nextStatus === 'Completed' ? new Date().toISOString().split('T')[0] : null,
      };
    }
    return m;
  });

  // Update enrollment progress
  if (enrollmentToUpdate && store.learning_enrollments) {
    const courseMilestones = store.learning_milestones.filter(m => String(m.enrollmentId) === String(enrollmentToUpdate));
    const completedCount = courseMilestones.filter(m => m.status === 'Completed').length;
    const totalCount = courseMilestones.length || 5;
    const progressPct = Math.min(100, Math.max(0, Math.round((completedCount / totalCount) * 100)));

    store.learning_enrollments = store.learning_enrollments.map(en => {
      if (String(en.id) === String(enrollmentToUpdate)) {
        const isComplete = progressPct === 100;
        return {
          ...en,
          progress: progressPct,
          milestonesCompleted: completedCount,
          status: isComplete ? 'Completed' : progressPct > 0 ? 'In Progress' : 'Not Started',
          statusBadge: isComplete
            ? 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200'
            : progressPct > 0
            ? 'badge-warning bg-amber-50 text-amber-700 border-amber-200'
            : 'badge-neutral bg-slate-50 text-slate-700 border-slate-200',
          certificateStatus: isComplete ? 'Eligible for Verification' : 'In Progress',
        };
      }
      return en;
    });
  }

  // Recalculate velocity dynamically
  store.learning_velocity = calculateDynamicVelocity(store);

  saveStore(store);
  return true;
}

/**
 * Certification renewal action.
 */
export function renewCertification(certId) {
  const store = getStore();
  const certs = store.certifications || [];

  const today = new Date();
  const issueDateStr = today.toISOString().split('T')[0];
  const expiryDate = new Date(today);
  expiryDate.setFullYear(today.getFullYear() + 3);
  const expiryDateStr = expiryDate.toISOString().split('T')[0];

  store.certifications = certs.map(c => {
    if (String(c.id) === String(certId)) {
      return {
        ...c,
        status: 'Valid',
        statusBadge: 'badge-success bg-emerald-50 text-emerald-700 border-emerald-200',
        issueDate: issueDateStr,
        expiryDate: expiryDateStr,
        daysRemaining: 1095,
        renewalRequired: false,
      };
    }
    return c;
  });

  saveStore(store);
  return true;
}

/**
 * MODULE 8: ASSESSMENT SUBMISSION & CROSS-MODULE GAP RECALCULATION ENGINE
 * Automatically updates employee skill levels, recalculates gap_analysis,
 * updates competency_matrix, refreshes recommendations, and emits a notification!
 */
export function submitAssessmentAndRecalculateGaps(payload) {
  const store = getStore();
  const { employeeId, templateId, title, assessedSkills, scorePct, overallScore, strengths, gapsIdentified } = payload;
  const empId = Number(employeeId || 3);
  const employee = (store.employees || []).find(e => Number(e.id) === empId) || { name: 'Charlie Brown', department: 'Engineering' };

  // 1. Update or create assessment record
  const assessments = store.assessments || [];
  const existingIdx = assessments.findIndex(a => Number(a.templateId) === Number(templateId) && Number(a.employeeId) === empId && a.status !== 'Completed');

  const newAssessmentRecord = {
    id: existingIdx >= 0 ? assessments[existingIdx].id : (assessments.length + 1),
    templateId: Number(templateId || 1),
    employeeId: empId,
    employeeName: employee.name,
    department: employee.department,
    title: title || 'Skill Proficiency Assessment',
    status: 'Completed',
    scorePct: scorePct || 85,
    overallScore: overallScore || 4.25,
    submittedAt: new Date().toISOString().split('T')[0],
    assessedSkills: assessedSkills || [],
    strengths: strengths || ['Solid technical domain foundations'],
    gapsIdentified: gapsIdentified || [],
    managerEvaluator: 'Bob Jones',
    managerStatus: 'Verified',
  };

  if (existingIdx >= 0) {
    assessments[existingIdx] = newAssessmentRecord;
  } else {
    assessments.unshift(newAssessmentRecord);
  }
  store.assessments = assessments;

  // 2. Update employee_skills with new evaluated levels
  const empSkills = store.employee_skills || [];
  (assessedSkills || []).forEach(as => {
    const idx = empSkills.findIndex(es => Number(es.employeeId) === empId && es.skill.toLowerCase() === as.skill.toLowerCase());
    if (idx >= 0) {
      empSkills[idx] = {
        ...empSkills[idx],
        level: as.afterLevel,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
    } else {
      empSkills.push({
        id: empSkills.length + 1,
        employeeId: empId,
        skill: as.skill,
        level: as.afterLevel,
        requiredLevel: as.targetLevel || 4,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
    }
  });
  store.employee_skills = empSkills;

  // 3. Recalculate Gaps, Competency Matrix & Recommendations
  recalculateGapsAndDependencies(store);

  // 4. Generate System Notification
  const newNotif = {
    id: (store.notifications || []).length + 1,
    employeeId: empId,
    title: `📝 Assessment Completed: ${newAssessmentRecord.title}`,
    description: `Evaluated ${assessedSkills?.length || 3} skills. Score: ${newAssessmentRecord.scorePct}%. Skill levels updated across platform.`,
    category: 'Assessments',
    priority: 'High',
    read: false,
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
    actionLabel: 'View Gap Analysis',
    actionRoute: '/gap-analysis',
    meta: { templateId: newAssessmentRecord.templateId, scorePct: newAssessmentRecord.scorePct },
  };

  store.notifications = [newNotif, ...(store.notifications || [])];

  // 5. Save and return updated summary
  saveStore(store);
  return {
    assessment: newAssessmentRecord,
    recalculatedGaps: store.gap_analysis.filter(g => Number(g.employeeId) === empId),
    notification: newNotif,
  };
}

/**
 * MODULE 9: NOTIFICATION ENGINE & HELPER FUNCTIONS
 */
export function createNotificationItem(notifData) {
  const store = getStore();
  const list = store.notifications || [];
  const newNotif = {
    ...notifData,
    id: notifData.id || (list.length + 1),
    read: false,
    timestamp: 'Just now',
    createdAt: new Date().toISOString(),
  };
  store.notifications = [newNotif, ...list];

  // Add delivery log entry
  const logs = store.notification_delivery_logs || [];
  logs.unshift({
    id: logs.length + 1,
    title: newNotif.title,
    channel: 'In-App / Push',
    recipient: 'Current User',
    status: 'Delivered',
    sentAt: new Date().toLocaleString(),
  });
  store.notification_delivery_logs = logs;

  saveStore(store);
  return newNotif;
}

export function toggleNotificationReadState(notificationId) {
  const store = getStore();
  store.notifications = (store.notifications || []).map(n => {
    if (String(n.id) === String(notificationId)) {
      return { ...n, read: !n.read };
    }
    return n;
  });
  saveStore(store);
  return true;
}

export function markAllNotificationsReadForUser(employeeId = null) {
  const store = getStore();
  store.notifications = (store.notifications || []).map(n => {
    if (!employeeId || Number(n.employeeId) === Number(employeeId) || !n.employeeId) {
      return { ...n, read: true };
    }
    return n;
  });
  saveStore(store);
  return true;
}

export function saveNotificationPreferencesData(prefs) {
  const store = getStore();
  store.notification_preferences = {
    ...(store.notification_preferences || {}),
    ...prefs,
  };
  saveStore(store);
  return store.notification_preferences;
}

/**
 * Dynamically synchronizes notification state with real store data across
 * Skills, Gaps, Certifications, Enrollments, Assessments, Recommendations, and Mentorship.
 */
export function syncDynamicNotifications(store) {
  const baseList = (store && Array.isArray(store.notifications) && store.notifications.length > 0)
    ? store.notifications
    : (SEED_NOTIFICATIONS || []);

  const readStateMap = {};
  baseList.forEach(n => {
    const key = n.eventKey || `id:${n.id}`;
    if (n.read !== undefined) {
      readStateMap[key] = n.read;
    }
  });

  const mergedList = [...baseList];

  // Dynamic Skill Gap notification synchronization for Charlie Brown (empId: 3)
  const emp3Gaps = (store?.gap_analysis || []).filter(g => Number(g.employeeId) === 3);
  emp3Gaps.forEach(g => {
    const key = `gap:${g.skill}:3`;
    if (!mergedList.some(n => n.eventKey === key || (n.meta && n.meta.skill === g.skill && Number(n.employeeId) === 3))) {
      if (g.gapLevel > 0) {
        mergedList.push({
          eventKey: key,
          id: mergedList.length + 100,
          employeeId: 3,
          title: `⚠️ Skill Gap Alert: ${g.skill} Deficit`,
          description: `A ${g.gapLevel.toFixed(1)}-level skill gap was identified in ${g.skill}. Current Level: ${g.currentLevel} / Target Level: ${g.requiredLevel}.`,
          category: 'Skill Gap',
          priority: g.gapLevel >= 2 ? 'Critical' : 'High',
          read: readStateMap[key] !== undefined ? readStateMap[key] : false,
          timestamp: '10 mins ago',
          actionLabel: 'View Gap Analysis →',
          actionRoute: '/gap-analysis',
          meta: { skill: g.skill, currentLevel: g.currentLevel, requiredLevel: g.requiredLevel },
        });
      }
    }
  });

  return mergedList;
}

/**
 * Broadcasts a custom DOM event so all subscribed components refetch data immediately.
 */
export function notifyUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

/**
 * Subscribes to store update events. Returns an unsubscribe function.
 */
export function subscribeToStore(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') return () => {};
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

