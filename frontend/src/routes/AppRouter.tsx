import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { PublicRoute, getRoleHomePath } from '../components/auth/PublicRoute';
import { useAuth } from '../hooks/useAuth';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { ProfilePage } from '../pages/profile/ProfilePage';

// Shell Placeholders
import { DashboardShell } from '../pages/placeholders/DashboardShell';
import { MoodShell } from '../pages/placeholders/MoodShell';
import { CommunityShell } from '../pages/placeholders/CommunityShell';
import { TherapistShell } from '../pages/placeholders/TherapistShell';
import { ModeratorShell } from '../pages/placeholders/ModeratorShell';
import { AdminShell } from '../pages/placeholders/AdminShell';

// Error Pages
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';

const HomeRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated && user) {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }
  return <Navigate to="/login" replace />;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route element={<Shell />}>
        {/* Root Redirect */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Public Authentication Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Shared Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Help Seeker Specific Routes */}
        <Route element={<ProtectedRoute allowedRoles={['HELP_SEEKER']} />}>
          <Route path="/dashboard" element={<DashboardShell />} />
          <Route path="/moods" element={<MoodShell />} />
          <Route path="/community" element={<CommunityShell />} />
          <Route path="/therapists" element={<DashboardShell />} />
        </Route>

        {/* Therapist Specific Routes */}
        <Route element={<ProtectedRoute allowedRoles={['THERAPIST']} />}>
          <Route path="/therapist/portal" element={<TherapistShell />} />
          <Route path="/therapist/appointments" element={<TherapistShell />} />
          <Route path="/therapist/credentials" element={<TherapistShell />} />
        </Route>

        {/* Moderator Specific Routes */}
        <Route element={<ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']} />}>
          <Route path="/moderation" element={<ModeratorShell />} />
          <Route path="/moderation/reports" element={<ModeratorShell />} />
        </Route>

        {/* Admin Specific Routes */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminShell />} />
          <Route path="/admin/verifications" element={<AdminShell />} />
          <Route path="/admin/audit-logs" element={<AdminShell />} />
        </Route>

        {/* Fallback & Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
