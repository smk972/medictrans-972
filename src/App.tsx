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
import { TransporterSalesPage } from './pages/TransporterSalesPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';

// CMS SEO & Blog Public
import { BlogIndexPage } from './pages/blog/BlogIndexPage';
import { BlogPostPage } from './pages/blog/BlogPostPage';
import { BlogCategoryPage } from './pages/blog/BlogCategoryPage';
import { BlogTagPage } from './pages/blog/BlogTagPage';
import { BlogPreviewPage } from './pages/blog/BlogPreviewPage';

// Admin CMS & SEO Hub
import { AdminSeoOverviewPage } from './pages/admin/AdminSeoOverviewPage';
import { AdminSeoArticlesPage } from './pages/admin/AdminSeoArticlesPage';
import { AdminSeoEditorPage } from './pages/admin/AdminSeoEditorPage';
import { AdminSeoIdeasPage } from './pages/admin/AdminSeoIdeasPage';
import { AdminSeoKeywordsPage } from './pages/admin/AdminSeoKeywordsPage';
import { AdminSeoCategoriesPage } from './pages/admin/AdminSeoCategoriesPage';
import { AdminSeoTagsPage } from './pages/admin/AdminSeoTagsPage';
import { AdminSeoSettingsPage } from './pages/admin/AdminSeoSettingsPage';
import { EmailPreviewPage } from './pages/EmailPreviewPage';

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
          
          {/* Espace Mon Profil (Protégé) */}
          <Route 
            path="/profil" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mon-profil" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Espaces Professionnels (Accès Strictement Protégé - Connexion Obligatoire) */}
          <Route 
            path="/etablissements" 
            element={
              <ProtectedRoute requiredRole={['FACILITY', 'ADMIN']} allowDemo={false}>
                <FacilityPortalPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/etablissement" 
            element={
              <ProtectedRoute requiredRole={['FACILITY', 'ADMIN']} allowDemo={false}>
                <FacilityPortalPage />
              </ProtectedRoute>
            } 
          />
          {/* Espace Transporteurs (Page Publique / Présentation & Offre Pro) */}
          <Route path="/transporteurs" element={<TransporterSalesPage />} />
          <Route path="/transporteur" element={<TransporterSalesPage />} />
          <Route path="/espace-transporteur" element={<TransporterSalesPage />} />
          <Route path="/espace-transporteurs" element={<TransporterSalesPage />} />
          <Route path="/offre-pro" element={<TransporterSalesPage />} />
          <Route path="/abonnement-pro" element={<TransporterSalesPage />} />
          <Route path="/tarifs-transporteurs" element={<TransporterSalesPage />} />

          {/* Console Dispatch & Régulation (Accès Protégé Transporteur Connecté) */}
          <Route 
            path="/portal-transporteur" 
            element={
              <ProtectedRoute requiredRole={['TRANSPORTER', 'ADMIN']} allowDemo={false}>
                <TransporterPortalPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dispatch-transporteur" 
            element={
              <ProtectedRoute requiredRole={['TRANSPORTER', 'ADMIN']} allowDemo={false}>
                <TransporterPortalPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/inscription/transporteur" element={<RegisterTransporterPage />} />
          <Route path="/inscription-transporteur" element={<RegisterTransporterPage />} />
          <Route path="/inscription/etablissement" element={<RegisterFacilityPage />} />
          <Route path="/inscription-etablissement" element={<RegisterFacilityPage />} />
          
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

          {/* CMS Blog Public & Guides */}
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/blog/category/:slug" element={<BlogCategoryPage />} />
          <Route path="/blog/tag/:slug" element={<BlogTagPage />} />

          {/* Prévisualisation Protégée Admin */}
          <Route 
            path="/preview/blog/:id" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <BlogPreviewPage />
              </ProtectedRoute>
            } 
          />

          {/* Content Hub SEO & Rédaction IA (Console Admin) */}
          <Route 
            path="/admin/seo" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSeoOverviewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/seo/articles" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSeoArticlesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/seo/articles/new" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSeoEditorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/seo/articles/:id/edit" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSeoEditorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/seo/ideas" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSeoIdeasPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/seo/keywords" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSeoKeywordsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/seo/categories" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSeoCategoriesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/seo/tags" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSeoTagsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/seo/settings" 
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminSeoSettingsPage />
              </ProtectedRoute>
            } 
          />

          {/* Maquette E-mail Transactionnel de Bienvenue */}
          <Route path="/email-preview" element={<EmailPreviewPage />} />
          <Route path="/maquette-email" element={<EmailPreviewPage />} />
          <Route path="/admin/email-preview" element={<EmailPreviewPage />} />
          </Routes>
          <AiChatWidget />
        </AiChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
