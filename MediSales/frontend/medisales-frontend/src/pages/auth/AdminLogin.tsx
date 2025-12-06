import { isAxiosError } from 'axios';
import { type ChangeEvent, type FormEvent, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, Shield, User, Sparkles } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const FALLBACK_ERROR = 'Unable to sign in. Please check your credentials and try again.';

type FormState = {
  username: string;
  password: string;
};

const AdminLogin = () => {
  const [formState, setFormState] = useState<FormState>({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const { login } = useAuth();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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

    try {
      const response = await authService.login({ username, password });
      
      // Backend returns flat structure with user data at root level
      // Check if response has required fields
      if (!response) {
        setError('Invalid response from server. Please try again.');
        setLoading(false);
        return;
      }

      // Check if role exists - use 'in' operator because role can be 0 (which is falsy)
      if (!('role' in response)) {
        setError('Invalid response from server. Role information missing.');
        setLoading(false);
        return;
      }

      // Convert role to string if it's a number (enum value)
      // 0 = Administrator, 1 = Staff
      const roleString = typeof response.role === 'number' 
        ? (response.role === 0 ? 'Administrator' : 'Staff')
        : response.role;

      // Verify this is an admin account
      if (roleString !== 'Administrator') {
        setError('This account is not an Administrator account. Please use Staff login.');
        setLoading(false);
        return;
      }

      // Extract token and create user object
      // Backend returns null token (JWT not implemented yet), use placeholder
      const token = response.token || 'TEMP_TOKEN';
      
      const authenticatedUser = {
        userId: response.userId,
        username: response.username,
        fullName: response.fullName,
        email: response.email,
        phoneNumber: response.phoneNumber,
        role: roleString as 'Administrator' | 'Staff',
        status: 'Online' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      login(token, authenticatedUser);
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
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-4 w-96 h-96 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-4 w-96 h-96 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className={`relative z-10 w-full max-w-xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 backdrop-blur-xl bg-white/80 border border-white/40 shadow-lg text-sm font-bold text-slate-700 transition-all duration-300 hover:bg-white hover:shadow-xl hover:-translate-x-1 animate-fade-in"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Main Card */}
        <div className="relative backdrop-blur-2xl bg-white/80 border border-white/40 shadow-2xl overflow-hidden animate-scale-in animation-delay-200">
          {/* Decorative Gradient Overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          
          <div className="relative p-8 sm:p-12">
            {/* Header with Logo */}
            <div className="flex items-center gap-4 mb-8 animate-slide-in-left animation-delay-400">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative flex h-20 w-20 items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-black uppercase tracking-wider text-blue-600">Administrator Portal</p>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Admin Login</h1>
                <p className="text-sm font-semibold text-slate-600 mt-1">Manage your pharmacy system</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 backdrop-blur-xl bg-red-50/90 border border-red-200 px-5 py-4 shadow-lg animate-fade-in">
                <p className="text-sm font-bold text-red-700">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6 animate-slide-in-right animation-delay-600" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2" htmlFor="username">
                  Username
                </label>
                <div className="relative group">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600 transition-all duration-300 group-focus-within:scale-110" />
                  <input
                    id="username"
                    name="username"
                    autoComplete="username"
                    disabled={loading}
                    value={formState.username}
                    onChange={handleChange}
                    className="w-full backdrop-blur-xl bg-white/70 border-2 border-slate-200 px-12 py-4 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 hover:border-blue-400"
                    placeholder="Enter your admin username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600 transition-all duration-300 group-focus-within:scale-110" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    disabled={loading}
                    value={formState.password}
                    onChange={handleChange}
                    className="w-full backdrop-blur-xl bg-white/70 border-2 border-slate-200 px-12 py-4 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 hover:border-blue-400"
                    placeholder="Enter your admin password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 animate-shimmer"></div>
                <div className="relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-black text-white shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-3xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100">
                  <Shield className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                  {loading ? 'Signing in...' : 'Sign in as Administrator'}
                </div>
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 space-y-4 text-center animate-fade-in animation-delay-800">
              <Link
                to="/staff-login"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition-all duration-300 hover:text-indigo-600 hover:gap-3"
              >
                Are you a Staff member?
                <span className="underline">Login here</span>
              </Link>
              
              <p className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Administrator access only · Contact IT support if needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
