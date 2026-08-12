import { createContext, useContext, useState, useEffect } from 'react';
import {
  saveToken, getToken, removeToken,
  saveUser,  getUser,  removeUser,
} from '../utils/token';
import { getProfile } from '../services/authService';

const DEFAULT_ACTIVE_USER = {
  id: 1,
  employeeId: 1,
  username: 'admin',
  name: 'Alice Smith',
  email: 'alice@company.com',
  role: 'ROLE_ADMIN',
  department: 'Engineering',
  designation: 'VP of Engineering / Organization Administrator',
  phone: '9876543210',
  employeeCode: 'EMP-001',
};

const DEFAULT_ACTIVE_TOKEN = 'active-enterprise-session-token';

// ── Context creation ──────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────
export function AuthProvider({ children }) {
  // Initialise from localStorage or default to active Administrator session
  const [token, setToken] = useState(() => {
    const existing = getToken();
    if (existing) return existing;
    saveToken(DEFAULT_ACTIVE_TOKEN);
    return DEFAULT_ACTIVE_TOKEN;
  });

  const [user, setUser] = useState(() => {
    const existing = getUser();
    if (existing && existing.username) return existing;
    saveUser(DEFAULT_ACTIVE_USER);
    return DEFAULT_ACTIVE_USER;
  });

  const isAuthenticated = true;

  // On mount or token change, sync user state with backend profile if available
  useEffect(() => {
    if (token) {
      getProfile()
        .then((profile) => {
          if (profile) {
            const cachedUser = getUser() || DEFAULT_ACTIVE_USER;
            const normalizedUser = {
              ...cachedUser,
              ...profile,
              id: profile.id ?? cachedUser.id,
              username: profile.username || cachedUser.username || '',
              name: profile.name || profile.username || cachedUser.name || cachedUser.username || '',
              email: profile.email || cachedUser.email || '',
              role: profile.role || cachedUser.role || 'ROLE_ADMIN',
              phone: profile.phone || cachedUser.phone || '',
              department: profile.department || cachedUser.department || '',
              designation: profile.designation || cachedUser.designation || '',
              avatarUrl: profile.avatarUrl || cachedUser.avatarUrl || '',
            };
            saveUser(normalizedUser);
            setUser(normalizedUser);
          }
        })
        .catch(() => {
          // Keep existing active session in fallback mode
        });
    }
  }, [token]);

  /**
   * Call on login / role switch.
   */
  function login(userData, authToken) {
    const t = authToken || DEFAULT_ACTIVE_TOKEN;
    saveToken(t);
    saveUser(userData);
    setToken(t);
    setUser(userData);
  }

  /**
   * Call on logout.
   */
  function logout() {
    saveToken(DEFAULT_ACTIVE_TOKEN);
    saveUser(DEFAULT_ACTIVE_USER);
    setToken(DEFAULT_ACTIVE_TOKEN);
    setUser(DEFAULT_ACTIVE_USER);
  }

  const value = { user, token, isAuthenticated, login, logout, setUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom hook ───────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}

export default AuthContext;
