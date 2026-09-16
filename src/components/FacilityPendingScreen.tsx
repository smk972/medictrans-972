import React, { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FacilityPendingScreenProps {
  status?: 'PENDING' | 'REJECTED';
}

export const FacilityPendingScreen: React.FC<FacilityPendingScreenProps> = ({ status = 'PENDING' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  const isRejected = status === 'REJECTED';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-10 text-center relative overflow-hidden">
          {/* Top banner accent */}
          <div className={`absolute top-0 left-0 right-0 h-2 ${isRejected ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 via-teal-500 to-sky-600'}`} />

          {/* Status Icon */}
          <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-md transition-transform hover:scale-105"
            style={{
              backgroundColor: isRejected ? '#FEE2E2' : '#FEF3C7',
              color: isRejected ? '#DC2626' : '#D97706'
            }}
          >
            <span className="material-symbols-outlined text-4xl">
              {isRejected ? 'gpp_bad' : 'hourglass_top'}
            </span>
          </div>

          {/* Title & Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border"
            style={{
              backgroundColor: isRejected ? '#FEF2F2' : '#FFFBEB',
              color: isRejected ? '#991B1B' : '#92400E',
              borderColor: isRejected ? '#FECACA' : '#FDE68A'
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: isRejected ? '#EF4444' : '#F59E0B' }}
            />
            {isRejected ? 'Demande Non Validée / Suspendue' : 'En attente de validation Administrateur'}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">
            {isRejected ? "Accès à l'espace établissement restreint" : "Votre demande d'accès est en cours d'examen"}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            {isRejected ? (
              "Votre habilitation pour l'accès au Portail Établissements de Santé n'a pas été validée ou a été suspendue par l'administrateur. Veuillez vous rapprocher du support pour régulariser votre situation."
            ) : (
              "L'accès au Portail Établissements de Santé & Sorties d'hospitalisation est strictement réservé aux structures de soins autorisées et soumis à la validation préalable de l'administrateur du site."
            )}
          </p>

          {/* Info Card */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 max-w-xl mx-auto text-left mb-8 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200">
              Récapitulatif de votre structure
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Établissement :</span>
              <span className="font-semibold text-slate-900">{user?.facilityName || 'Centre Hospitalier / Clinique'}</span>
            </div>
            {user?.facilityFiness && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Numéro FINESS :</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs">
                  {user.facilityFiness}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Contact déclarant :</span>
              <span className="font-medium text-slate-800">{user?.firstName} {user?.lastName} ({user?.email})</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Date de la demande :</span>
              <span className="text-xs font-medium text-slate-600">
                {user?.facilityAccessRequestedAt ? new Date(user.facilityAccessRequestedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'En cours'}
              </span>
            </div>
          </div>

          {/* Security & ARS notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-50/70 border border-teal-200/60 max-w-xl mx-auto text-left mb-8 text-xs text-teal-900 leading-relaxed">
            <span className="material-symbols-outlined text-teal-700 text-xl shrink-0 mt-0.5">verified_user</span>
            <div>
              <strong className="font-semibold">Protocole Secret Médical & Sécurité Sanitaire :</strong><br />
              Pour garantir la conformité RGPD Santé et les directives ARS, chaque FINESS et identité soignante est vérifiée avant d'autoriser la commande directe de transports et l'accès aux dossiers patients.
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            {!isRejected && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <span className={`material-symbols-outlined text-lg ${isRefreshing ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                {isRefreshing ? 'Vérification en cours...' : 'Actualiser mon statut'}
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
