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

// Core Mental Wellness Feature Pages
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { MoodPage } from '../pages/mood/MoodPage';
import { CommunityPage } from '../pages/community/CommunityPage';
import { ModerationPage } from '../pages/moderation/ModerationPage';

// Therapist & Appointment Feature Pages
import { TherapistsPage } from '../pages/therapist/TherapistsPage';
import { TherapistDetailPage } from '../pages/therapist/TherapistDetailPage';
import { AppointmentsListPage } from '../pages/appointment/AppointmentsListPage';
import { AppointmentDetailPage } from '../pages/appointment/AppointmentDetailPage';
import { VideoConsultationPage } from '../pages/appointment/VideoConsultationPage';
import { TherapistPortalPage } from '../pages/therapist/TherapistPortalPage';
import { TherapistAvailabilityPage } from '../pages/therapist/TherapistAvailabilityPage';

// Shell Placeholders for downstream roles/features
import { TherapistShell } from '../pages/placeholders/TherapistShell';
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

        {/* Shared Video Consultation Route (Help Seeker and Therapist) */}
        <Route element={<ProtectedRoute allowedRoles={['HELP_SEEKER', 'THERAPIST']} />}>
          <Route path="/appointments/:id/video" element={<VideoConsultationPage />} />
        </Route>

        {/* Help Seeker Specific Routes */}
        <Route element={<ProtectedRoute allowedRoles={['HELP_SEEKER']} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/moods" element={<MoodPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/therapists" element={<TherapistsPage />} />
          <Route path="/therapists/:id" element={<TherapistDetailPage />} />
          <Route path="/appointments" element={<AppointmentsListPage />} />
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
        </Route>

        {/* Therapist Specific Routes */}
        <Route element={<ProtectedRoute allowedRoles={['THERAPIST']} />}>
          <Route path="/therapist/portal" element={<TherapistPortalPage />} />
          <Route path="/therapist/appointments" element={<TherapistPortalPage />} />
          <Route path="/therapist/availability" element={<TherapistAvailabilityPage />} />
          <Route path="/therapist/credentials" element={<TherapistShell />} />
          <Route path="/therapist/appointments/:id/video" element={<VideoConsultationPage />} />
        </Route>

        {/* Moderator Specific Routes */}
        <Route element={<ProtectedRoute allowedRoles={['MODERATOR', 'ADMIN']} />}>
          <Route path="/moderation" element={<ModerationPage />} />
          <Route path="/moderation/reports" element={<ModerationPage />} />
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
