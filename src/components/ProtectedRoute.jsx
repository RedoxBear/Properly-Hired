/* eslint-disable react/react-in-jsx-scope, react/prop-types */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // User is not authenticated, redirect to the login page
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
