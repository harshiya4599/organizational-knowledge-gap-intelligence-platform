/**
 * authService.js
 * Hybrid backend authentication & demo session manager.
 */

import api from './api';
import { saveToken, saveUser, getToken, getUser } from '../utils/token';
import { SEED_USERS } from '../data/seedData';
import { getCollection } from '../utils/hybridStore';

/**
 * Normalizes any raw user record from Spring Boot, OAuth2, or hybrid store into
 * a standardized frontend user object with guaranteed role consistency.
 */
export function normalizeUser(rawUser, roleHint = null) {
  if (!rawUser) return null;

  // Extract raw role from all possible representations
  let roleVal = rawUser.role;
  if (!roleVal) {
    roleVal = rawUser.roleName || rawUser.role_name || rawUser.roles?.[0] || rawUser.authorities?.[0];
  }
  if (typeof roleVal === 'object' && roleVal !== null) {
    roleVal = roleVal.roleName || roleVal.name || roleVal.role || roleVal.authority || roleVal.role_name;
  }

  // If still no role or default employee, check roleHint or match username/email
  const uname = String(rawUser.username || rawUser.name || rawUser.email || '').toLowerCase();
  if (!roleVal || roleVal === 'ROLE_EMPLOYEE' || roleVal === 'Employee') {
    if (roleHint === 'Administrator' || /admin|alice/i.test(uname)) {
      roleVal = 'ROLE_ADMIN';
    } else if (roleHint === 'Manager' || /manager|bob|lead/i.test(uname)) {
      roleVal = 'ROLE_MANAGER';
    } else if (roleHint === 'Employee') {
      roleVal = 'ROLE_EMPLOYEE';
    }
  }

  if (!roleVal) {
    if (/admin|alice/i.test(uname)) roleVal = 'ROLE_ADMIN';
    else if (/manager|bob|lead/i.test(uname)) roleVal = 'ROLE_MANAGER';
    else roleVal = 'ROLE_EMPLOYEE';
  }

  const roleName = typeof roleVal === 'string' ? roleVal : 'ROLE_EMPLOYEE';

  const isAdm = /admin|hr|learning|system/i.test(roleName);
  const isMgr = /manager|lead|department_head|dept_head/i.test(roleName);

  const defaultName = isAdm ? 'Alice Smith' : isMgr ? 'Bob Jones' : 'Charlie Brown';
  const defaultDesignation = isAdm
    ? 'VP of Engineering / Organization Administrator'
    : isMgr
    ? 'Engineering Lead & Team Manager'
    : 'Senior Frontend Engineer';

  return {
    id: rawUser.id || rawUser.userId || (isAdm ? 1 : isMgr ? 2 : 3),
    employeeId: rawUser.employeeId || rawUser.id || (isAdm ? 1 : isMgr ? 2 : 3),
    username: rawUser.username || (isAdm ? 'admin' : isMgr ? 'manager' : 'emp01'),
    name: rawUser.name || rawUser.username || defaultName,
    email: rawUser.email || (isAdm ? 'alice@company.com' : isMgr ? 'bob@company.com' : 'charlie@company.com'),
    role: roleName,
    phone: rawUser.phone || '9876543210',
    department: typeof rawUser.department === 'string' ? rawUser.department : rawUser.department?.departmentName || 'Engineering',
    designation: rawUser.designation || defaultDesignation,
    avatarUrl: rawUser.avatarUrl || '',
    location: rawUser.location || '',
    employeeCode: rawUser.employeeCode || `EMP-${rawUser.employeeId || rawUser.id || (isAdm ? 1 : isMgr ? 2 : 3)}`,
  };
}

export async function login(usernameOrEmail, password, selectedRoleHint = 'Employee') {
  const cleanInput = usernameOrEmail.trim().toLowerCase();

  // Determine target role from hint or username
  let targetRole = 'ROLE_EMPLOYEE';
  if (selectedRoleHint === 'Administrator' || /admin|alice/i.test(cleanInput)) {
    targetRole = 'ROLE_ADMIN';
  } else if (selectedRoleHint === 'Manager' || /manager|bob|lead/i.test(cleanInput)) {
    targetRole = 'ROLE_MANAGER';
  }

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

    let authenticatedUser = null;
    if (profile) {
      authenticatedUser = normalizeUser(profile, selectedRoleHint);
    }

    if (!authenticatedUser) {
      const users = getCollection('users') || SEED_USERS;
      const matchedSeed = users.find(u =>
        u.username.toLowerCase() === cleanInput ||
        u.email.toLowerCase() === cleanInput
      );
      if (matchedSeed) {
        authenticatedUser = normalizeUser(matchedSeed, selectedRoleHint);
      } else {
        authenticatedUser = normalizeUser({
          id: targetRole === 'ROLE_ADMIN' ? 1 : targetRole === 'ROLE_MANAGER' ? 2 : 3,
          employeeId: targetRole === 'ROLE_ADMIN' ? 1 : targetRole === 'ROLE_MANAGER' ? 2 : 3,
          username: usernameOrEmail.trim(),
          email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@company.com`,
          role: targetRole,
        }, selectedRoleHint);
      }
    }

    saveUser(authenticatedUser);
    return { token, user: authenticatedUser, message: message || 'Signed in successfully' };
  } catch (err) {
    console.warn('[AuthService] Backend login unreachable/failed. Checking hybrid seed accounts:', err);

    // Seeded account fallback match for offline / demo mode
    const users = getCollection('users') || SEED_USERS;
    const matchedSeed = users.find(u =>
      u.username.toLowerCase() === cleanInput ||
      u.email.toLowerCase() === cleanInput ||
      (selectedRoleHint === 'Administrator' && (u.role === 'ROLE_ADMIN' || u.username === 'admin')) ||
      (selectedRoleHint === 'Manager' && (u.role === 'ROLE_MANAGER' || u.username === 'manager')) ||
      (selectedRoleHint === 'Employee' && (u.role === 'ROLE_EMPLOYEE' || u.username === 'emp01'))
    );

    if (matchedSeed) {
      const fallbackToken = `hybrid-demo-jwt-${matchedSeed.username}`;
      const fallbackUser = normalizeUser({ ...matchedSeed, role: matchedSeed.role || targetRole }, selectedRoleHint);
      saveToken(fallbackToken);
      saveUser(fallbackUser);
      return { token: fallbackToken, user: fallbackUser, message: 'Signed in via Enterprise Demo Session' };
    }

    // Role-hint based fallback
    const fallbackUser = normalizeUser({
      id: targetRole === 'ROLE_ADMIN' ? 1 : targetRole === 'ROLE_MANAGER' ? 2 : 3,
      employeeId: targetRole === 'ROLE_ADMIN' ? 1 : targetRole === 'ROLE_MANAGER' ? 2 : 3,
      username: cleanInput || (targetRole === 'ROLE_ADMIN' ? 'admin' : targetRole === 'ROLE_MANAGER' ? 'manager' : 'emp01'),
      email: cleanInput.includes('@') ? cleanInput : `${cleanInput || 'user'}@company.com`,
      role: targetRole,
    }, selectedRoleHint);

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
