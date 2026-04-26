import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './i18n';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfessionalList from './pages/ProfessionalList';
import ProfessionalProfile from './pages/ProfessionalProfile';
import BookingDetail from './pages/BookingDetail';
import Dashboard from './pages/Dashboard/index';
import Settings from './pages/Settings';
import SmartMatch from './pages/SmartMatch';
import Opportunities from './pages/Opportunities';
import KYCVerification from './pages/KYCVerification';
import StripeOnboarding from './pages/StripeOnboarding';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      staleTime: 60000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [show, setShow] = React.useState(() => !localStorage.getItem('onboarding_seen'));
  function done() {
    localStorage.setItem('onboarding_seen', '1');
    setShow(false);
  }
  return (
    <>
      {children}
      {show && <Onboarding onDone={done} />}
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex justify-center items-center min-h-screen"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary>
            <OnboardingGate>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/professionals" element={<ProfessionalList />} />
                <Route path="/professionals/:id" element={<ProfessionalProfile />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
                <Route path="/bookings/:bookingId" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/match" element={<ProtectedRoute><SmartMatch /></ProtectedRoute>} />
                <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
                <Route path="/kyc" element={<ProtectedRoute><KYCVerification /></ProtectedRoute>} />
                <Route path="/stripe/onboarding" element={<ProtectedRoute><StripeOnboarding /></ProtectedRoute>} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
              </Route>
            </Routes>
            </OnboardingGate>
            </ErrorBoundary>
          </BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'text-sm',
              success: { duration: 3000 },
              error: { duration: 5000 },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
