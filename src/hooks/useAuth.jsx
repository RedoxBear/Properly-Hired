/* eslint-disable react/react-in-jsx-scope, react/prop-types */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TIERS } from '../components/utils/accessControl';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const savedUser = localStorage.getItem('prague_day_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { token, user: userData } = await response.json();
      
      setUser(userData);
      localStorage.setItem('prague_day_user', JSON.stringify(userData));
      localStorage.setItem('prague_day_token', token);
      return true;
    } catch (e) {
      console.error("Login error:", e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('prague_day_user');
    localStorage.removeItem('prague_day_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};