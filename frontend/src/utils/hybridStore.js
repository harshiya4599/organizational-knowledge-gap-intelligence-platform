/**
 * hybridStore.js
 * Centralized Hybrid Data Management & Synchronization Engine.
 *
 * Implements a persistent, interconnected local cache layered underneath
 * real Spring Boot REST APIs. Guarantees the application is NEVER EMPTY,
 * supports CRUD persistence across page refreshes in offline/demo mode,
 * and seamlessly synchronizes cross-module updates across Employees,
 * Skills, Competencies, Gaps, Recommendations, Heatmaps, and Dashboards.
 */

import {
  SEED_DEPARTMENTS,
  SEED_SKILLS,
  SEED_USERS,
  SEED_EMPLOYEES,
  SEED_COMPETENCIES,
  SEED_EMPLOYEE_SKILLS,
  SEED_TRAININGS,
} from '../data/seedData';

const STORE_KEY = 'kg_hybrid_store_v3';
const EVENT_NAME = 'kg_data_sync_event';

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
        gapSeverity: gapDiff >= 2 ? 'Critical' : 'High',
        priority: gapDiff >= 2 ? 'High' : 'Medium',
        deficitSkills: [es.skill],
        missingSkills: [es.skill],
        recommendation: `Complete targeted training in ${es.skill} to bridge ${gapDiff}-level deficit`,
      });
    }
  });

  return gaps;
}

function calculateInitialRecommendations(gaps, trainings) {
  const recs = [];
  const trainingMap = Object.fromEntries(trainings.map(t => [t.recommendedForSkill, t]));

  const DETERMINISTIC_MATCH_SCORES = [96, 94, 91, 88, 85, 82, 79, 74, 68, 62];

  gaps.forEach((g, idx) => {
    const matchedTraining = trainingMap[g.skill];
    const scoreVal = DETERMINISTIC_MATCH_SCORES[idx % DETERMINISTIC_MATCH_SCORES.length];
    const diffLevel = g.requiredLevel - g.currentLevel;
    const gainStr = matchedTraining?.expectedGain || `+${diffLevel}.0 Levels`;
    const difficultyStr = matchedTraining?.difficulty || (g.requiredLevel >= 4 ? 'Advanced' : 'Intermediate');
    const durationStr = matchedTraining?.duration || (diffLevel >= 2 ? '4 Weeks' : '3 Weeks');
    const providerStr = matchedTraining ? 'Internal L&D LMS' : (idx % 2 === 0 ? 'Coursera' : 'Udemy');
    const courseTitle = matchedTraining?.name || `Enterprise ${g.skill} Mastery & Production Patterns`;

    recs.push({
      id: idx + 1,
      employeeId: g.employeeId,
      employee: g.employee,
      department: g.department,
      skill: g.skill,
      course: courseTitle,
      courseTitle: courseTitle,
      title: courseTitle,
      provider: providerStr,
      priority: g.priority || (diffLevel >= 2 ? 'High' : 'Medium'),
      priorityBadge: g.gapSeverity === 'Critical' ? 'badge-danger' : 'badge-warning',
      score: scoreVal,
      matchScore: scoreVal,
      aiMatchScore: scoreVal,
      duration: durationStr,
      difficulty: difficultyStr,
      expectedImprovement: gainStr,
      expectedGain: gainStr,
      reason: `Identified ${g.gapSeverity ? g.gapSeverity.toLowerCase() : 'skill'} deficit in ${g.skill} (Current: Level ${g.currentLevel}, Benchmark: Level ${g.requiredLevel}) relative to ${g.department} standard.`,
      status: 'Recommended',
      gapLevel: diffLevel,
      currentLevel: g.currentLevel,
      targetLevel: g.requiredLevel,
      requiredSkills: [g.skill],
    });
  });

  return recs;
}

function calculateCompetencyAverages(competencies, employeeSkills, employees) {
  const empMap = Object.fromEntries(employees.map(e => [e.id, e]));

  return competencies.map((comp) => {
    const matchingSkills = employeeSkills.filter((es) => {
      const emp = empMap[es.employeeId];
      if (!emp) return false;
      const isDept = emp.department === comp.department || String(emp.departmentId) === String(comp.departmentId);
      const isSkill = es.skill === comp.skill || String(es.skillId) === String(comp.skillId);
      return isDept && isSkill;
    });

    let avgCur = comp.avgCurrentLevel;
    if (matchingSkills.length > 0) {
      const sum = matchingSkills.reduce((acc, s) => acc + (s.level || 3), 0);
      avgCur = parseFloat((sum / matchingSkills.length).toFixed(1));
    } else if (avgCur === undefined || avgCur === null) {
      avgCur = 3.0;
    }

    const variance = parseFloat((avgCur - comp.requiredLevel).toFixed(1));
    const status = variance >= 0 ? 'Met' : variance > -1 ? 'Low Gap' : variance > -2 ? 'Medium Gap' : 'High Gap';

    return {
      ...comp,
      avgCurrentLevel: avgCur,
      variance,
      gap: Math.max(0, parseFloat((comp.requiredLevel - avgCur).toFixed(1))),
      status,
    };
  });
}

function getInitialStoreState() {
  const computedCompetencies = calculateCompetencyAverages(SEED_COMPETENCIES, SEED_EMPLOYEE_SKILLS, SEED_EMPLOYEES);
  const initialGaps = calculateInitialGaps(SEED_EMPLOYEE_SKILLS, computedCompetencies, SEED_EMPLOYEES);
  const initialRecs = calculateInitialRecommendations(initialGaps, SEED_TRAININGS);

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
    return JSON.parse(raw);
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
 * Returns a specific collection (e.g. 'skills', 'employees', 'departments').
 */
export function getCollection(collectionName) {
  const store = getStore();
  return Array.isArray(store[collectionName]) ? store[collectionName] : [];
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
 * Recalculates gaps, recommendations, and analytics based on latest employee skills and competencies.
 */
function recalculateGapsAndDependencies(store) {
  const employeeSkills = store.employee_skills || [];
  const competencies = store.competencies || [];
  const employees = store.employees || [];
  const trainings = store.trainings || [];

  store.competencies = calculateCompetencyAverages(competencies, employeeSkills, employees);
  store.gap_analysis = calculateInitialGaps(employeeSkills, store.competencies, employees);
  store.recommendations = calculateInitialRecommendations(store.gap_analysis, trainings);
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
