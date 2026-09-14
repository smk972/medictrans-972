import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AiChatProvider } from './context/AiChatContext';
import { AiChatWidget } from './components/AiChatWidget';
import { HomePage } from './pages/HomePage';
import { HomePagePreview } from './pages/HomePagePreview';
import { HomePageDemo } from './pages/HomePageDemo';
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
import { AdminClientsPage } from './pages/AdminClientsPage';
import { AdminFacilitiesPage } from './pages/AdminFacilitiesPage';
import { AdminTransportersPage } from './pages/AdminTransportersPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
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
        <AiChatProvider>
          <ScrollToTop />
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/demo" element={<HomePageDemo />} />
          <Route path="/preview" element={<HomePageDemo />} />
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
            path="/admin/clients" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminClientsPage />
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
          <Route 
            path="/admin/transporteurs" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminTransportersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/utilisateurs" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminUsersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/parametres" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSettingsPage />
              </ProtectedRoute>
            } 
          />
          </Routes>
          <AiChatWidget />
        </AiChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
