/**
 * departmentService.js
 * Hybrid backend API & persistent store service for /departments CRUD & Heatmaps.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';
import { addCollectionItem, updateCollectionItem, deleteCollectionItem, getCollection } from '../utils/hybridStore';

export function normalizeDepartment(d) {
  if (!d) return null;
  const name = d.departmentName || d.name || 'Enterprise Unit';
  const id = d.id || d.departmentId || null;
  return {
    id,
    name,
    departmentName: name,
    code: d.code || `DEPT-${name.slice(0, 3).toUpperCase()}`,
    description: d.description || `Core operational department for ${name}.`,
    head: d.head || (d.manager?.name || 'Department Lead'),
    employeeCount: d.employeeCount ?? 3,
    activeRoles: d.activeRoles ?? 3,
    budgetUtilization: d.budgetUtilization ?? 80,
    status: d.status || 'Active',
  };
}

export function getDepartments() {
  return fetchWithFallback({
    request: () => api.get('/departments'),
    normalize: normalizeDepartment,
    fallbackKey: 'departments',
    moduleName: 'Departments',
  });
}

export function getDepartmentById(id) {
  return fetchWithFallback({
    request: () => api.get(`/departments/${id}`),
    normalize: normalizeDepartment,
    fallbackKey: 'departments',
    moduleName: 'Department Details',
  }).then((res) => {
    if (Array.isArray(res)) {
      return res.find(d => String(d.id) === String(id)) || res[0];
    }
    return res;
  });
}

export async function addDepartment(departmentData) {
  try {
    const res = await api.post('/departments', departmentData);
    const mapped = normalizeDepartment(res.data);
    addCollectionItem('departments', mapped);
    return mapped;
  } catch (err) {
    console.warn('[DepartmentService] Backend addDepartment failed, saving to hybrid store:', err);
    const mapped = normalizeDepartment(departmentData);
    return addCollectionItem('departments', mapped);
  }
}

export async function updateDepartment(id, departmentData) {
  try {
    const res = await api.put(`/departments/${id}`, departmentData);
    const mapped = normalizeDepartment(res.data);
    updateCollectionItem('departments', id, mapped);
    return mapped;
  } catch (err) {
    console.warn('[DepartmentService] Backend updateDepartment failed, updating hybrid store:', err);
    const mapped = normalizeDepartment({ ...departmentData, id });
    return updateCollectionItem('departments', id, mapped);
  }
}

export async function deleteDepartment(id) {
  try {
    await api.delete(`/departments/${id}`);
    deleteCollectionItem('departments', id);
    return true;
  } catch (err) {
    console.warn('[DepartmentService] Backend deleteDepartment failed, deleting from hybrid store:', err);
    deleteCollectionItem('departments', id);
    return true;
  }
}

export async function getDepartmentSkillMatrix() {
  const depts = await getDepartments();
  const competencies = getCollection('competencies');
  const employeeSkills = getCollection('employee_skills');
  const employees = getCollection('employees');

  const DEPT_HEALTH_SCORES = {
    Engineering: 82,
    'Data Science': 76,
    Finance: 68,
    'Human Resources': 79,
    Marketing: 73,
    Operations: 71,
  };

  return depts.map((d) => {
    const deptEmps = employees.filter(e => e.department === d.name || String(e.departmentId) === String(d.id));
    const deptEmpIds = new Set(deptEmps.map(e => e.id));
    const deptSkills = employeeSkills.filter(es => deptEmpIds.has(es.employeeId));

    let avgSkill = 3.6;
    let deptScore = DEPT_HEALTH_SCORES[d.name] || 75;

    if (deptSkills.length > 0) {
      const sum = deptSkills.reduce((acc, s) => acc + (s.level || 3), 0);
      avgSkill = parseFloat((sum / deptSkills.length).toFixed(1));
      deptScore = Math.min(100, Math.max(30, Math.round((avgSkill / 5.0) * 100)));
    }

    const deptComps = competencies.filter(c => c.department === d.name || String(c.departmentId) === String(d.id));
    const deficitComps = deptComps.filter(c => (c.requiredLevel || 4) > (c.avgCurrentLevel || avgSkill));
    const criticalSkillList = deficitComps.map(c => c.skill).filter(Boolean);
    const safeCriticalSkills = criticalSkillList.length > 0
      ? criticalSkillList
      : (deptComps.length > 0 ? deptComps.slice(0, 2).map(c => c.skill) : ['Core Architecture']);

    const avgGap = parseFloat(Math.max(0.2, (4.5 - avgSkill)).toFixed(1));
    const priority = avgGap >= 1.2 ? 'High' : avgGap >= 0.6 ? 'Medium' : 'Low';
    const status = deptScore >= 80 ? 'Excellent' : deptScore >= 70 ? 'Good' : 'Needs Improvement';

    return {
      id: d.id,
      department: d.name,
      category: d.name === 'Engineering' || d.name === 'Data Science' ? 'Technical' : 'Business & Operations',
      competencyScore: deptScore,
      targetScore: 85,
      avgSkillScore: avgSkill,
      avgGapScore: avgGap,
      criticalSkills: safeCriticalSkills,
      trainingPriority: priority,
      gap: Math.max(0, 85 - deptScore),
      healthStatus: status,
      employeeCount: deptEmps.length || d.employeeCount || 2,
      criticalSkillsCount: safeCriticalSkills.length,
      topSkill: deptComps[0]?.skill || 'Core Systems',
    };
  });
}

export async function getSkillHeatmapData() {
  const depts = await getDepartments();
  const skills = getCollection('skills');
  const competencies = getCollection('competencies');
  const employeeSkills = getCollection('employee_skills');
  const employees = getCollection('employees');

  const cells = [];
  const topDepts = depts.slice(0, 6);
  const topSkills = skills.slice(0, 8);

  const BASELINE_HEATMAP = {
    Engineering:       { Java: 88, Python: 62, React: 91, 'AWS Cloud': 76, 'Docker & Kubernetes': 58, SQL: 70, 'Spring Boot': 85, 'System Architecture': 80 },
    'Data Science':    { Java: 70, Python: 94, React: 68, 'AWS Cloud': 72, 'Docker & Kubernetes': 61, SQL: 90, 'Spring Boot': 60, 'System Architecture': 68 },
    Finance:           { Java: 81, Python: 55, React: 64, 'AWS Cloud': 59, 'Docker & Kubernetes': 43, SQL: 82, 'Spring Boot': 65, 'System Architecture': 58 },
    Marketing:         { Java: 74, Python: 61, React: 83, 'AWS Cloud': 67, 'Docker & Kubernetes': 52, SQL: 68, 'Spring Boot': 58, 'System Architecture': 60 },
    'Human Resources': { Java: 65, Python: 58, React: 71, 'AWS Cloud': 49, 'Docker & Kubernetes': 46, SQL: 62, 'Spring Boot': 50, 'System Architecture': 52 },
    Operations:        { Java: 79, Python: 67, React: 72, 'AWS Cloud': 81, 'Docker & Kubernetes': 63, SQL: 75, 'Spring Boot': 68, 'System Architecture': 74 },
  };

  topDepts.forEach((d) => {
    const deptEmps = employees.filter(e => e.department === d.name || String(e.departmentId) === String(d.id));
    const deptEmpIds = new Set(deptEmps.map(e => e.id));

    topSkills.forEach((s) => {
      const matchingSkills = employeeSkills.filter(es => deptEmpIds.has(es.employeeId) && (es.skill === s.name || String(es.skillId) === String(s.id)));

      let score = BASELINE_HEATMAP[d.name]?.[s.name];
      if (matchingSkills.length > 0) {
        const sum = matchingSkills.reduce((acc, x) => acc + (x.level || 3), 0);
        score = Math.round((sum / matchingSkills.length / 5.0) * 100);
      } else if (!score) {
        const compMatch = competencies.find(c => (c.department === d.name || String(c.departmentId) === String(d.id)) && (c.skill === s.name || String(c.skillId) === String(s.id)));
        const reqLvl = compMatch?.avgCurrentLevel || compMatch?.requiredLevel || 3;
        score = Math.round((reqLvl / 5.0) * 100);
      }

      const tier = score >= 90 ? '90_100' : score >= 75 ? '75_89' : score >= 60 ? '60_74' : score >= 40 ? '40_59' : 'below_40';

      cells.push({
        department: d.name,
        category: s.category || 'Technical',
        skill: s.name,
        competencyScore: score,
        tier,
      });
    });
  });

  return cells;
}
