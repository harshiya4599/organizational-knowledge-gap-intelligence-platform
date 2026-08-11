/**
 * employeeService.js
 * Real backend API service for /employees CRUD.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';

export const LEVEL_LABELS = {
  1: 'Unaware',
  2: 'Beginner',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

export function mapEmployee(emp) {
  if (!emp) return null;
  return {
    id: emp.id,
    employeeCode: emp.employeeCode || `EMP-${emp.id}`,
    name: emp.name || `Employee #${emp.id}`,
    email: emp.email || '',
    phone: emp.phone || '',
    designation: emp.designation || 'Staff',
    department: typeof emp.department === 'string' ? emp.department : emp.department?.departmentName || 'General',
    departmentObj: typeof emp.department === 'object' ? emp.department : null,
    experience: emp.experience ?? 0,
    status: emp.status || 'Active',
    skills: Array.isArray(emp.skills) ? emp.skills : [],
    user: emp.user || null,
  };
}

export function getEmployees() {
  return fetchWithFallback({
    request: () => api.get('/employees'),
    normalize: mapEmployee,
    moduleName: 'Employees',
  });
}

export function getEmployeeById(id) {
  return fetchWithFallback({
    request: () => api.get(`/employees/${id}`),
    normalize: mapEmployee,
    moduleName: 'Employee Details',
  });
}

export async function addEmployee(employeeData) {
  const res = await api.post('/employees', employeeData);
  return mapEmployee(res.data);
}

export async function updateEmployee(id, employeeData) {
  const res = await api.put(`/employees/${id}`, employeeData);
  return mapEmployee(res.data);
}

export async function deleteEmployee(id) {
  await api.delete(`/employees/${id}`);
  return true;
}

