import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectMessage?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectMessage
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-on-surface-variant font-semibold">
            Vérification des habilitations d'accès...
          </span>
        </div>
      </div>
    );
  }

  // Si non connecté : redirection immédiate vers la page de connexion
  if (!isAuthenticated || !user) {
    const targetRole = Array.isArray(requiredRole) ? requiredRole[0] : requiredRole;
    const defaultMsg = targetRole === 'FACILITY'
      ? "Veuillez vous identifier pour accéder au Portail Établissements & Sorties d'hospitalisation (CHU & Cliniques 972)."
      : targetRole === 'TRANSPORTER'
      ? "Veuillez vous identifier pour accéder à l'Espace Transporteurs (Dispatch & Bourse de courses sanitaires)."
      : targetRole === 'ADMIN'
      ? "Veuillez vous identifier pour accéder à la Tour de Contrôle et Régulation Territoriale 972."
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

  return <>{children}</>;
};
