import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getRoleLandingRoute } from '../../lib/permissions';
import type { UserRole } from '../../api/types';

interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: React.ReactElement;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    const fallbackRoute = getRoleLandingRoute(user?.role);
    return <Navigate to={fallbackRoute} replace />;
  }

  return children;
};
