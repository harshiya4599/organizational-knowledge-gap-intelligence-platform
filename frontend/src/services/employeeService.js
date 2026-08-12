/**
 * employeeService.js
 * Hybrid backend API & persistent store service for /employees CRUD.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';
import { addCollectionItem, updateCollectionItem, deleteCollectionItem, getCollection } from '../utils/hybridStore';

export const LEVEL_LABELS = {
  1: 'Unaware',
  2: 'Beginner',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export function mapEmployee(emp) {
  if (!emp) return null;
  const deptName = typeof emp.department === 'string'
    ? emp.department
    : emp.department?.departmentName || emp.departmentName || 'Engineering';

  return {
    id: emp.id || emp.employeeId,
    employeeCode: emp.employeeCode || `EMP-${String(emp.id || emp.employeeId || 1).padStart(3, '0')}`,
    name: emp.name || `Employee #${emp.id || emp.employeeId}`,
    email: emp.email || '',
    phone: emp.phone || '9876543210',
    designation: emp.designation || 'Specialist',
    department: deptName,
    departmentObj: typeof emp.department === 'object' ? emp.department : { id: 1, departmentName: deptName },
    salary: emp.salary ?? 85000,
    joiningDate: emp.joiningDate || '2023-01-10',
    experience: emp.experience ?? 4,
    status: emp.status || 'Active',
    skills: Array.isArray(emp.skills) ? emp.skills : [],
    user: emp.user || { id: emp.id, username: (emp.name || 'user').toLowerCase().replace(/\s+/g, ''), role: emp.role || 'ROLE_EMPLOYEE' },
  };
}

export function getEmployees() {
  return fetchWithFallback({
    request: () => api.get('/employees'),
    normalize: mapEmployee,
    fallbackKey: 'employees',
    moduleName: 'Employees',
  });
}

export function getEmployeeById(id) {
  return fetchWithFallback({
    request: () => api.get(`/employees/${id}`),
    normalize: mapEmployee,
    fallbackKey: 'employees',
    moduleName: 'Employee Details',
  }).then(res => {
    if (Array.isArray(res)) {
      return res.find(e => String(e.id) === String(id)) || res[0];
    }
    return res;
  });
}

export async function addEmployee(employeeData) {
  try {
    const res = await api.post('/employees', employeeData);
    const mapped = mapEmployee(res.data);
    addCollectionItem('employees', mapped);
    return mapped;
  } catch (err) {
    console.warn('[EmployeeService] Backend addEmployee failed, saving to hybrid store:', err);
    const mapped = mapEmployee(employeeData);
    return addCollectionItem('employees', mapped);
  }
}

export async function updateEmployee(id, employeeData) {
  try {
    const res = await api.put(`/employees/${id}`, employeeData);
    const mapped = mapEmployee(res.data);
    updateCollectionItem('employees', id, mapped);
    return mapped;
  } catch (err) {
    console.warn('[EmployeeService] Backend updateEmployee failed, updating hybrid store:', err);
    const mapped = mapEmployee({ ...employeeData, id });
    return updateCollectionItem('employees', id, mapped);
  }
}

export async function deleteEmployee(id) {
  try {
    await api.delete(`/employees/${id}`);
    deleteCollectionItem('employees', id);
    return true;
  } catch (err) {
    console.warn('[EmployeeService] Backend deleteEmployee failed, deleting from hybrid store:', err);
    deleteCollectionItem('employees', id);
    return true;
  }
}
