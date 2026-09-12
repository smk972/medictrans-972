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
          <Route path="/etablissements" element={<FacilityPortalPage />} />
          <Route path="/transporteurs" element={<TransporterPortalPage />} />
          <Route path="/inscription/transporteur" element={<RegisterTransporterPage />} />
          <Route path="/inscription/etablissement" element={<RegisterFacilityPage />} />
          
          {/* Back-Office & Régulation Régionale 972 */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/supervision" element={<AdminSupervisionPage />} />
          <Route path="/admin/transporteurs" element={<AdminTransportersPage />} />
          <Route path="/admin/etablissements" element={<AdminFacilitiesPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
