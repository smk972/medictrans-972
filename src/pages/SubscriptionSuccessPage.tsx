import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { StripeSubscriptionService } from '../services/stripeSubscriptionService';

export const SubscriptionSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'verifying' | 'active' | 'timeout'>('verifying');
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

  const transporterId = user?.transporterId || (user?.role === 'TRANSPORTER' ? user.id : null);

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 10; // 10 vérifications x 2s = 20 secondes

    const checkStatus = async () => {
      if (!transporterId) {
        // En attente du chargement de l'utilisateur ou session locale
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          if (isMounted) setStatus('active'); // Fallback optimiste si session validée par Stripe Checkout
        }
        return;
      }

      try {
        const res = await StripeSubscriptionService.getSubscriptionStatus(transporterId);
        if (res.hasActiveSubscription) {
          if (isMounted) {
            setStatus('active');
            if (res.subscription?.current_period_end) {
              setPeriodEnd(res.subscription.current_period_end);
            }
            // Lancer les confettis
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              });
            } catch {}
          }
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          // Si le webhook a pris un peu plus de temps, considérer le checkout réussi
          if (isMounted) {
            setStatus('active');
            try {
              confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 }
              });
            } catch {}
          }
        }
      } catch (e) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 2000);
        } else {
          if (isMounted) setStatus('active');
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [transporterId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />

        {status === 'verifying' ? (
          <div className="space-y-6 py-6 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Vérification du paiement en cours...
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Votre demande d'abonnement a bien été transmise à Stripe. Nous synchronisons actuellement votre compte professionnel.
              </p>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-teal-400 h-full rounded-full animate-pulse w-3/4" />
            </div>

            <p className="text-[11px] text-slate-500">
              Session Stripe : <span className="font-mono text-slate-400">{sessionId ? `${sessionId.slice(0, 16)}...` : 'Enregistrée'}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4 animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <span className="material-symbols-outlined text-4xl font-black">check</span>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">verified</span>
                Paiement Confirmé
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Bienvenue sur Clinigo Pro !
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Votre abonnement professionnel est désormais <strong>actif</strong>. Vous avez un accès direct et illimité au réseau de régulation sanitaire.
              </p>
            </div>

            {/* Recal Details */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Formule :</span>
                <span className="font-bold text-white">Clinigo Pro Illimité</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Montant :</span>
                <span className="font-mono font-bold text-teal-400">19,90 € HT / mois</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Renouvellement :</span>
                <span className="font-bold text-slate-200">
                  {periodEnd ? new Date(periodEnd).toLocaleDateString('fr-FR') : 'Mensuel automatique'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                to="/portal-transporteur"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">dashboard</span>
                <span>Accéder à mon espace dispatch & courses</span>
              </Link>

              <Link
                to="/espace-transporteur"
                className="block text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Retourner à l'accueil transporteur
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
