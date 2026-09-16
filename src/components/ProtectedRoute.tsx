import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from './Header';
import { UserRole } from '../types';

import { FacilityPendingScreen } from './FacilityPendingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectMessage?: string;
  allowDemo?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectMessage,
  allowDemo = false
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500 font-semibold">
              Vérification des habilitations d'accès...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Si non connecté : redirection immédiate vers la page de connexion sauf si démo autorisée
  if (!isAuthenticated || !user) {
    if (allowDemo) {
      return <>{children}</>;
    }
    const targetRole = Array.isArray(requiredRole) ? requiredRole[0] : requiredRole;
    const defaultMsg = targetRole === 'FACILITY'
      ? "Veuillez vous identifier pour accéder au Portail Établissements & Sorties d'hospitalisation (CHU, Cliniques & Centres de soins)."
      : targetRole === 'TRANSPORTER'
      ? "Veuillez vous identifier pour accéder à l'Espace Transporteurs (Dispatch & Courses disponibles)"
      : targetRole === 'ADMIN'
      ? "Veuillez vous identifier pour accéder à la Tour de Contrôle et Régulation Territoriale."
      : "Veuillez vous identifier pour accéder à cet espace.";

    return (
      <Navigate
        to="/connexion"
        state={{
          from: location,
          requiredRole: targetRole || 'PATIENT',
          message: redirectMessage || defaultMsg
        }}
        replace
      />
    );
  }

  // Si connecté mais rôle non habilité (l'admin a accès partout)
  if (requiredRole && user.role !== 'ADMIN') {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      if (allowDemo) {
        return <>{children}</>;
      }
      const targetRole = Array.isArray(requiredRole) ? requiredRole[0] : requiredRole;
      const roleName = targetRole === 'FACILITY' 
        ? 'Établissement de Santé' 
        : targetRole === 'TRANSPORTER' 
        ? 'Transporteur Sanitaire' 
        : 'Régulateur';

      return (
        <Navigate
          to="/connexion"
          state={{
            from: location,
            requiredRole: targetRole,
            message: `Votre session actuelle (${user.role}) ne dispose pas des droits nécessaires. Cet espace requiert le profil "${roleName}". Veuillez vous identifier ci-dessous.`
          }}
          replace
        />
      );
    }
  }

  // Si l'utilisateur est un établissement de santé, l'accès au portail requiert la validation préalable de l'administrateur
  if (user.role === 'FACILITY') {
    const status = user.facilityAccessStatus;
    if (status === 'PENDING' || status === 'REJECTED') {
      return <FacilityPendingScreen status={status} />;
    }
  }

  return <>{children}</>;
};
