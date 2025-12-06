import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/User';

const roleRedirects: Record<UserRole, string> = {
  Administrator: '/admin',
  Staff: '/staff',
};

/**
 * A component that redirects an authenticated user to their respective dashboard.
 * If the user is not authenticated, it does nothing.
 * Only runs on login/landing pages to avoid infinite loops.
 */
const AuthRedirector = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if we're on a login or landing page
    const isOnAuthPage = ['/', '/admin-login', '/staff-login'].includes(location.pathname);
    
    if (isAuthenticated && user && isOnAuthPage) {
      const targetPath = roleRedirects[user.role] ?? '/';
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.pathname]);

  // This component renders nothing. Its only purpose is to trigger the redirect effect.
  return null;
};

export default AuthRedirector;
