import { isAxiosError } from 'axios';
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, Package, User, Shield, Users } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole, AuthenticatedUser } from '../../types/User';

const roleRedirects: Record<UserRole, string> = {
  Administrator: '/admin',
  Staff: '/staff',
};

const FALLBACK_ERROR = 'Unable to sign in. Please check your credentials and try again.';

type FormState = {
  username: string;
  password: string;
};

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const Login = () => {
  const [formState, setFormState] = useState<FormState>({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('Administrator');
  const [submittingRole, setSubmittingRole] = useState<UserRole | null>(null);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTarget = useMemo(() => {
    if (user) {
      return roleRedirects[user.role] ?? '/';
    }

    return '/';
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && redirectTarget) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthenticated, redirectTarget, navigate]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const username = formState.username.trim();
    const password = formState.password;

    if (!username || !password) {
      setError('Please enter both your username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const desiredRole = submittingRole ?? activeRole;

    try {
      const response = await authService.login({ username, password });
      const token = response.token || '';
      const authenticatedUser: AuthenticatedUser = {
        userId: response.userId,
        username: response.username,
        fullName: response.fullName,
        email: response.email,
        role: response.role as UserRole,
        phoneNumber: response.phoneNumber || null,
        status: 'Online',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      login(token, authenticatedUser);

      const state = location.state as LocationState | undefined;
      const defaultRoute = roleRedirects[authenticatedUser.role] ?? '/';
      const targetPath = state?.from?.pathname && state.from.pathname !== '/login'
        ? state.from.pathname
        : defaultRoute;

      if (authenticatedUser.role !== desiredRole) {
        console.info(`User signed in as ${authenticatedUser.role}, overriding selected role ${desiredRole}.`);
      }

      navigate(targetPath, { replace: true });
    } catch (caughtError) {
      if (isAxiosError(caughtError)) {
        const payload = caughtError.response?.data as { message?: string; error?: string } | undefined;
        setError(payload?.message ?? payload?.error ?? FALLBACK_ERROR);
      } else if (caughtError instanceof Error) {
        setError(caughtError.message || FALLBACK_ERROR);
      } else {
        setError(FALLBACK_ERROR);
      }
    } finally {
      setLoading(false);
      setSubmittingRole(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 px-4 py-6 sm:py-8 md:py-12">
      <div className="w-full max-w-md md:max-w-lg">
        {/* Header Section */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-blue-600 bg-blue-600 shadow-lg sm:h-20 sm:w-20">
            <Package className="h-8 w-8 text-white sm:h-10 sm:w-10" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">MediSales POS</h1>
          <p className="mt-1 text-sm font-medium text-blue-600 sm:text-base">Pharmaceutical Management System</p>
        </div>

        {/* Login Card */}
        <div className="border-2 border-slate-200 bg-white p-6 shadow-lg sm:p-8 md:p-10">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Welcome Back</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">Sign in to manage your pharmacy</p>
          </div>

          {error ? (
            <div className="mb-5 border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700" htmlFor="username">Username</label>
                <div className="relative mt-2">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    disabled={loading}
                    value={formState.username}
                    onChange={handleChange}
                    className="w-full border-2 border-slate-200 bg-white px-10 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-75 sm:px-11 sm:py-3"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700" htmlFor="password">Password</label>
                <div className="relative mt-2">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    disabled={loading}
                    value={formState.password}
                    onChange={handleChange}
                    className="w-full border-2 border-slate-200 bg-white px-10 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-75 sm:px-11 sm:py-3"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="mb-3 text-sm font-bold text-slate-700">Select Role</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={loading}
                  onClick={() => {
                    setActiveRole('Administrator');
                    setSubmittingRole('Administrator');
                  }}
                  className={`flex items-center justify-center gap-2 border-2 px-4 py-3 text-sm font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                    activeRole === 'Administrator'
                      ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-blue-500 bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Shield className="h-5 w-5" aria-hidden="true" />
                  <span className="hidden sm:inline">{loading && submittingRole === 'Administrator' ? 'Signing in...' : 'Administrator'}</span>
                  <span className="sm:hidden">{loading && submittingRole === 'Administrator' ? 'Signing in...' : 'Admin'}</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  onClick={() => {
                    setActiveRole('Staff');
                    setSubmittingRole('Staff');
                  }}
                  className={`flex items-center justify-center gap-2 border-2 px-4 py-3 text-sm font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                    activeRole === 'Staff'
                      ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-blue-500 bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Users className="h-5 w-5" aria-hidden="true" />
                  {loading && submittingRole === 'Staff' ? 'Signing in...' : 'Staff'}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 border-t-2 border-slate-100 pt-5 text-center">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              🔒 Secure access for pharmacy management
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Contact your administrator for assistance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
