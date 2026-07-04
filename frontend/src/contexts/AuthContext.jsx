import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, getProfile } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('rk_token');
      if (token) {
        try {
          const res = await getProfile();
          setUser(res.data);
        } catch (error) {
          console.error('Session validation failed:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await loginUser(email, password);
      const { token, user: userProfile } = res.data;

      localStorage.setItem('rk_token', token);
      localStorage.setItem('rk_user', JSON.stringify(userProfile));
      setUser(userProfile);
      return userProfile;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('rk_token');
    localStorage.removeItem('rk_user');
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
