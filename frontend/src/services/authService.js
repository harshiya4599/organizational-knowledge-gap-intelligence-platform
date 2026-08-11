import api from './api';
import { saveToken, saveUser, getToken, getUser } from '../utils/token';

/**
 * Normalizes backend profile/user object into a consistent frontend user shape.
 */
export function normalizeUser(rawUser) {
  if (!rawUser) return null;
  return {
    id: rawUser.id || rawUser.userId,
    username: rawUser.username || '',
    name: rawUser.name || rawUser.username || 'User',
    email: rawUser.email || '',
    role: rawUser.role || rawUser.roleName || 'ROLE_EMPLOYEE',
    phone: rawUser.phone || '',
    department: typeof rawUser.department === 'string' ? rawUser.department : rawUser.department?.departmentName || '',
    designation: rawUser.designation || '',
    avatarUrl: rawUser.avatarUrl || '',
    location: rawUser.location || '',
  };
}

/**
 * Authenticates user against backend API POST /api/auth/login
 */
export async function login(usernameOrEmail, password) {
  const response = await api.post('/api/auth/login', {
    usernameOrEmail: usernameOrEmail.trim(),
    password,
  });

  const { token, message } = response.data;
  if (!token) {
    throw new Error('No authentication token received from server.');
  }

  saveToken(token);

  // Fetch real authenticated user profile from backend
  let profile = null;
  try {
    profile = await getProfile();
  } catch (err) {
    console.warn('[AuthService] Profile fetch failed, falling back to minimal user object', err);
  }

  const authenticatedUser = normalizeUser(profile) || {
    id: 1,
    username: usernameOrEmail.trim(),
    email: usernameOrEmail.includes('@') ? usernameOrEmail.trim() : '',
    role: 'ROLE_EMPLOYEE',
  };

  saveUser(authenticatedUser);
  return { token, user: authenticatedUser, message: message || 'Signed in successfully' };
}

/**
 * Registers new user via backend API POST /api/auth/register
 */
export async function register({ username, email, password, role = 'ROLE_EMPLOYEE' }) {
  const response = await api.post('/api/auth/register', {
    username: username.trim(),
    email: email.trim(),
    password,
    role,
  });

  const { token } = response.data;
  if (token) {
    saveToken(token);
  }
  return response.data;
}

/**
 * Retrieves authenticated user profile from backend GET /api/profile
 */
export async function getProfile() {
  const response = await api.get('/api/profile');
  return normalizeUser(response.data);
}

/**
 * Updates authenticated user profile via backend PUT /api/profile
 */
export async function updateProfile(data) {
  const response = await api.put('/api/profile', data);
  const updated = normalizeUser(response.data);
  saveUser(updated);
  return updated;
}

/**
 * Changes user password via backend POST /api/profile/change-password
 */
export async function changePassword(oldPassword, newPassword) {
  const response = await api.post('/api/profile/change-password', {
    oldPassword,
    newPassword,
  });
  return response.data;
}

/**
 * Sends password reset request via backend POST /api/auth/forgot-password
 */
export async function forgotPassword(usernameOrEmail) {
  const response = await api.post('/api/auth/forgot-password', {
    usernameOrEmail: usernameOrEmail.trim(),
  });
  return response.data;
}

