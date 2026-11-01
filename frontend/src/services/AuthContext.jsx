import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fineguard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('fineguard_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyToken() {
      if (token) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          localStorage.setItem('fineguard_user', JSON.stringify(profile));
        } catch (err) {
          console.warn("Session expired or invalid, logging out.");
          logout();
        }
      }
      setLoading(false);
    }
    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('fineguard_token', res.access_token);
    localStorage.setItem('fineguard_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (name, email, password) => {
    const res = await authService.register(name, email, password);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('fineguard_token', res.access_token);
    localStorage.setItem('fineguard_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fineguard_token');
    localStorage.removeItem('fineguard_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
