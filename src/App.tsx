import React from 'react';
import { BrowserRouter, Routes, Route, ScrollRestoration } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { BookingPage } from './pages/BookingPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { TrackingPage } from './pages/TrackingPage';
import { CpamRightsPage } from './pages/CpamRightsPage';
import { FacilityPortalPage } from './pages/FacilityPortalPage';
import { TransporterPortalPage } from './pages/TransporterPortalPage';
import { RegisterTransporterPage } from './pages/RegisterTransporterPage';
import { RegisterFacilityPage } from './pages/RegisterFacilityPage';

// Scroll to top helper on route change
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
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/reserver" element={<BookingPage />} />
            <Route path="/confirmation/:ref" element={<ConfirmationPage />} />
            <Route path="/suivi" element={<TrackingPage />} />
            <Route path="/droits-cpam" element={<CpamRightsPage />} />
            <Route path="/etablissements" element={<FacilityPortalPage />} />
            <Route path="/transporteurs" element={<TransporterPortalPage />} />
            <Route path="/inscription/transporteur" element={<RegisterTransporterPage />} />
            <Route path="/inscription/etablissement" element={<RegisterFacilityPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};
