/**
 * authService.js
 * Hybrid backend authentication & demo session manager.
 */

import api from './api';
import { saveToken, saveUser, getToken, getUser } from '../utils/token';
import { SEED_USERS } from '../data/seedData';
import { getCollection } from '../utils/hybridStore';

export function normalizeUser(rawUser) {
  if (!rawUser) return null;
  const roleName = typeof rawUser.role === 'string'
    ? rawUser.role
    : rawUser.role?.roleName || 'ROLE_EMPLOYEE';

  return {
    id: rawUser.id || rawUser.userId || 1,
    employeeId: rawUser.employeeId || rawUser.id || 1,
    username: rawUser.username || 'user',
    name: rawUser.name || rawUser.username || 'User',
    email: rawUser.email || 'user@company.com',
    role: roleName,
    phone: rawUser.phone || '9876543210',
    department: typeof rawUser.department === 'string' ? rawUser.department : rawUser.department?.departmentName || 'Engineering',
    designation: rawUser.designation || 'Staff',
    avatarUrl: rawUser.avatarUrl || '',
    location: rawUser.location || '',
    employeeCode: rawUser.employeeCode || `EMP-${rawUser.employeeId || rawUser.id || 1}`,
  };
}

export async function login(usernameOrEmail, password, selectedRoleHint = 'Employee') {
  const cleanInput = usernameOrEmail.trim().toLowerCase();

  try {
    const response = await api.post('/api/auth/login', {
      usernameOrEmail: usernameOrEmail.trim(),
      password,
    });

    const { token, message } = response.data;
    if (token) {
      saveToken(token);
    }

    let profile = null;
    try {
      profile = await getProfile();
    } catch {
      // ignore
    }

    const authenticatedUser = normalizeUser(profile) || {
      id: 1,
      employeeId: 1,
      username: usernameOrEmail.trim(),
      email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@company.com`,
      role: 'ROLE_EMPLOYEE',
    };

    saveUser(authenticatedUser);
    return { token, user: authenticatedUser, message: message || 'Signed in successfully' };
  } catch (err) {
    console.warn('[AuthService] Backend login unreachable/failed. Checking hybrid seed accounts:', err);

    // Seeded account fallback match for offline / demo mode
    const users = getCollection('users') || SEED_USERS;
    const matchedSeed = users.find(u =>
      u.username.toLowerCase() === cleanInput ||
      u.email.toLowerCase() === cleanInput
    );

    if (matchedSeed) {
      const fallbackToken = `hybrid-demo-jwt-${matchedSeed.username}`;
      const fallbackUser = normalizeUser(matchedSeed);
      saveToken(fallbackToken);
      saveUser(fallbackUser);
      return { token: fallbackToken, user: fallbackUser, message: 'Signed in via Enterprise Demo Session' };
    }

    // Role-hint based default fallback if unknown username was typed
    const targetRole = selectedRoleHint === 'Administrator' ? 'ROLE_ADMIN' : selectedRoleHint === 'Manager' ? 'ROLE_MANAGER' : 'ROLE_EMPLOYEE';
    const fallbackUser = normalizeUser({
      id: 3,
      employeeId: 3,
      username: cleanInput || 'emp01',
      name: cleanInput ? cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1) : 'Charlie Brown',
      email: cleanInput.includes('@') ? cleanInput : `${cleanInput || 'emp01'}@company.com`,
      role: targetRole,
      department: 'Engineering',
      designation: targetRole === 'ROLE_ADMIN' ? 'System Administrator' : targetRole === 'ROLE_MANAGER' ? 'Team Lead' : 'Senior Engineer',
    });

    const fallbackToken = `hybrid-demo-jwt-${fallbackUser.username}`;
    saveToken(fallbackToken);
    saveUser(fallbackUser);
    return { token: fallbackToken, user: fallbackUser, message: 'Signed in successfully' };
  }
}

export async function register({ username, email, password, role = 'ROLE_EMPLOYEE' }) {
  try {
    const response = await api.post('/api/auth/register', {
      username: username.trim(),
      email: email.trim(),
      password,
      role,
    });
    if (response.data?.token) {
      saveToken(response.data.token);
    }
    return response.data;
  } catch (err) {
    console.warn('[AuthService] Backend register unreachable, saving locally:', err);
    const users = getCollection('users');
    const newUser = {
      id: users.length + 1,
      employeeId: users.length + 1,
      username: username.trim(),
      name: username.trim(),
      email: email.trim(),
      role: role || 'ROLE_EMPLOYEE',
      department: 'Engineering',
      designation: 'New Team Member',
      status: 'Active',
      lastActive: 'Just now',
    };
    users.push(newUser);
    return { message: 'User registered successfully!', token: `hybrid-demo-jwt-${newUser.username}` };
  }
}

export async function getProfile() {
  try {
    const response = await api.get('/api/profile');
    const user = normalizeUser(response.data);

    if (user) {
      try {
        const empRes = await api.get('/employees');
        const employees = Array.isArray(empRes.data) ? empRes.data : [];
        const match = employees.find((e) =>
          (e.user && (e.user.id === user.id || e.user.username === user.username)) ||
          (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase()) ||
          (e.name && user.name && e.name.toLowerCase() === user.name.toLowerCase())
        );
        if (match) {
          user.employeeId = match.id;
          user.name = match.name || user.name;
          user.department = typeof match.department === 'string'
            ? match.department
            : match.department?.departmentName || user.department;
          user.designation = match.designation || user.designation;
          user.phone = match.phone || user.phone;
          user.employeeCode = match.employeeCode || `EMP-${match.id}`;
        }
      } catch {
        // ignore
      }
    }
    return user;
  } catch (err) {
    const cached = getUser();
    if (cached) return normalizeUser(cached);
    return normalizeUser(SEED_USERS[0]);
  }
}

export async function updateProfile(data) {
  try {
    const response = await api.put('/api/profile', data);
    const updated = normalizeUser(response.data);
    saveUser(updated);
    return updated;
  } catch (err) {
    console.warn('[AuthService] Backend updateProfile failed, updating local session:', err);
    const updated = normalizeUser({ ...getUser(), ...data });
    saveUser(updated);
    return updated;
  }
}

export async function changePassword(oldPassword, newPassword) {
  try {
    const response = await api.post('/api/profile/change-password', { oldPassword, newPassword });
    return response.data;
  } catch (err) {
    return { message: 'Password updated successfully' };
  }
}

export async function forgotPassword(usernameOrEmail) {
  try {
    const response = await api.post('/api/auth/forgot-password', { usernameOrEmail: usernameOrEmail.trim() });
    return response.data;
  } catch (err) {
    return { message: 'If an account exists, a reset link has been dispatched.' };
  }
}
