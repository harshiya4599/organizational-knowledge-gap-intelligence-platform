import { createContext, useContext, useState, useEffect } from 'react';
import {
  saveToken, getToken, removeToken,
  saveUser,  getUser,  removeUser,
} from '../utils/token';
import { getProfile } from '../services/authService';

// ── Context creation ──────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken() || null);
  const [user,  setUser]  = useState(() => getUser()  || null);

  const isAuthenticated = !!(token && user);

  // On mount or token change, sync user state with backend profile if available
  useEffect(() => {
    if (token) {
      getProfile()
        .then((profile) => {
          if (profile) {
            const cachedUser = getUser() || {};
            const resolvedRole = (profile.role && profile.role !== 'ROLE_EMPLOYEE' && profile.role !== 'Employee')
              ? profile.role
              : (cachedUser.role || profile.role || 'ROLE_EMPLOYEE');

            const normalizedUser = {
              ...cachedUser,
              ...profile,
              id:          profile.id          ?? cachedUser.id,
              username:    profile.username    || cachedUser.username    || '',
              name:        profile.name        || profile.username || cachedUser.name || cachedUser.username || '',
              email:       profile.email       || cachedUser.email       || '',
              role:        resolvedRole,
              phone:       profile.phone       || cachedUser.phone       || '',
              department:  profile.department  || cachedUser.department  || '',
              designation: profile.designation || cachedUser.designation || '',
              avatarUrl:   profile.avatarUrl   || cachedUser.avatarUrl   || '',
            };
            saveUser(normalizedUser);
            setUser(normalizedUser);
          }
        })
        .catch(() => {
          // Keep existing session in fallback/demo mode — backend may be offline
        });
    }
  }, [token]);

  /** Call on successful login. userData and authToken come from authService. */
  function login(userData, authToken) {
    if (!userData || !authToken) return;
    saveToken(authToken);
    saveUser(userData);
    setToken(authToken);
    setUser(userData);
  }

  /** Call on logout — clears ALL session data and forces re-authentication. */
  function logout() {
    removeToken();
    removeUser();
    setToken(null);
    setUser(null);
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
    throw new Error('useAuth must be inside <AuthProvider>');
  }
  return context;
}

export default AuthContext;
