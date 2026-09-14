import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { TrackingPage } from './pages/TrackingPage';
import { CpamRightsPage } from './pages/CpamRightsPage';
import { FacilityPortalPage } from './pages/FacilityPortalPage';
import { TransporterPortalPage } from './pages/TransporterPortalPage';
import { RegisterTransporterPage } from './pages/RegisterTransporterPage';
import { RegisterFacilityPage } from './pages/RegisterFacilityPage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminSupervisionPage } from './pages/AdminSupervisionPage';
import { AdminTransportersPage } from './pages/AdminTransportersPage';
import { AdminFacilitiesPage } from './pages/AdminFacilitiesPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function ScrollToTop() {
  const { pathname } = window.location;
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/reserver" element={<BookingPage />} />
          <Route path="/confirmation/:ref" element={<ConfirmationPage />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
          <Route path="/suivi" element={<TrackingPage />} />
          <Route path="/droits-cpam" element={<CpamRightsPage />} />
          
          {/* Espaces Professionnels (Accès Protégé) */}
          <Route 
            path="/etablissements" 
            element={
              <ProtectedRoute requiredRole={['FACILITY', 'ADMIN']}>
                <FacilityPortalPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/transporteurs" 
            element={
              <ProtectedRoute requiredRole={['TRANSPORTER', 'ADMIN']}>
                <TransporterPortalPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/inscription/transporteur" element={<RegisterTransporterPage />} />
          <Route path="/inscription/etablissement" element={<RegisterFacilityPage />} />
          
          {/* Back-Office & Régulation Régionale 972 (Protégé Admin) */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/supervision" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSupervisionPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/transporteurs" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminTransportersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/etablissements" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminFacilitiesPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
