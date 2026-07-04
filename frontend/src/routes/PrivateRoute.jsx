import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0817] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          {/* Animated Loader Circle */}
          <div className="w-12 h-12 border-4 border-brand-light border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm animate-pulse font-medium">Validating session...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
