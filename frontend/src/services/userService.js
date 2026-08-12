/**
 * userService.js
 * Hybrid backend API & persistent store service for /users CRUD.
 */

import api from './api';
import { fetchWithFallback } from '../utils/apiFallback';
import { addCollectionItem, updateCollectionItem, deleteCollectionItem } from '../utils/hybridStore';

export function normalizeUserItem(u) {
  if (!u) return null;
  const roleName = typeof u.role === 'string'
    ? u.role
    : u.role?.roleName || 'ROLE_EMPLOYEE';

  return {
    id: u.id || u.userId,
    username: u.username || '',
    name: u.name || u.username || 'User',
    email: u.email || '',
    role: roleName,
    roleDisplay: roleName.includes('ADMIN') ? 'Administrator' : roleName.includes('MANAGER') ? 'Manager' : 'Employee',
    department: u.department || 'Engineering',
    designation: u.designation || 'Staff',
    phone: u.phone || '9876543210',
    status: u.status || 'Active',
    lastActive: u.lastActive || 'Today',
  };
}

export function getUsers() {
  return fetchWithFallback({
    request: () => api.get('/users'),
    normalize: normalizeUserItem,
    fallbackKey: 'users',
    moduleName: 'Users',
  });
}

export function getUserById(id) {
  return fetchWithFallback({
    request: () => api.get(`/users/${id}`),
    normalize: normalizeUserItem,
    fallbackKey: 'users',
    moduleName: 'User Details',
  }).then(res => {
    if (Array.isArray(res)) {
      return res.find(u => String(u.id) === String(id)) || res[0];
    }
    return res;
  });
}

export async function addUser(userData) {
  try {
    const res = await api.post('/users', userData);
    const mapped = normalizeUserItem(res.data);
    addCollectionItem('users', mapped);
    return mapped;
  } catch (err) {
    console.warn('[UserService] Backend addUser failed, saving to hybrid store:', err);
    const mapped = normalizeUserItem(userData);
    return addCollectionItem('users', mapped);
  }
}

export async function updateUser(id, userData) {
  try {
    const res = await api.put(`/users/${id}`, userData);
    const mapped = normalizeUserItem(res.data);
    updateCollectionItem('users', id, mapped);
    return mapped;
  } catch (err) {
    console.warn('[UserService] Backend updateUser failed, updating hybrid store:', err);
    const mapped = normalizeUserItem({ ...userData, id });
    return updateCollectionItem('users', id, mapped);
  }
}

export async function deleteUser(id) {
  try {
    await api.delete(`/users/${id}`);
    deleteCollectionItem('users', id);
    return true;
  } catch (err) {
    console.warn('[UserService] Backend deleteUser failed, deleting from hybrid store:', err);
    deleteCollectionItem('users', id);
    return true;
  }
}
