import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './components/common/PrivateRoute';
import AuthRedirector from './components/common/AuthRedirector';

const LandingPage = lazy(() => import('./pages/auth/LandingPage'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const StaffLogin = lazy(() => import('./pages/auth/StaffLogin'));
const AdminRoutes = lazy(() => import('./routes/AdminRoutes'));
const StaffRoutes = lazy(() => import('./routes/StaffRoutes'));

function App() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-brand-primary">Loading...</div>}>
      <Toaster />
      <AuthRedirector />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route
          path="/admin/*"
          element={
            <PrivateRoute allowedRoles={["Administrator"]}>
              <AdminRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="/staff/*"
          element={
            <PrivateRoute allowedRoles={["Administrator", "Staff"]}>
              <StaffRoutes />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
