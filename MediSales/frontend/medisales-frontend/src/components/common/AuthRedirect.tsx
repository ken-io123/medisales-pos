import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/User';

const roleRedirects: Record<UserRole, string> = {
  Administrator: '/admin',
  Staff: '/staff',
};

const AuthRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const targetPath = roleRedirects[user.role] ?? '/';
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return null;
};

export default AuthRedirect;
