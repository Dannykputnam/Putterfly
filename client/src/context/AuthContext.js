import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getUserProfile()
        .then(response => {
          setUser(response.data);
          setAuthError('');
        })
        .catch((err) => {
          console.error('Auth profile error:', err);
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            localStorage.removeItem('token');
            setUser(null);
            setAuthError('Session expired or invalid. Please log in again.');
          } else {
            setAuthError('Failed to restore session. Try refreshing or logging in again.');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, authError }}>
      {authError && (
        <div style={{ margin: '16px' }}>
          <div style={{ color: 'red', fontWeight: 'bold' }}>{authError}</div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
