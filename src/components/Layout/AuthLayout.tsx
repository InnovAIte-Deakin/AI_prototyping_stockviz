
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function AuthLayout({ children, requireAuth = false }: AuthLayoutProps) {
  const { user, isLoading } = useAuth();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  // Redirect if authentication status doesn't match requirement
  if (requireAuth && !user) {
    return <Navigate to="/auth/login" replace />;
  }
  
  if (!requireAuth && user) {
    return <Navigate to="/profile" replace />;
  }
  
  return <>{children}</>;
}
