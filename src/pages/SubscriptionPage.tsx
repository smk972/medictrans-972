import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StripeSubscriptionService } from '../services/stripeSubscriptionService';

export const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const transporterId = user?.transporterId || (user?.role === 'TRANSPORTER' ? user.id : null);

  const handleSubscribe = async () => {
    setErrorMessage(null);

    // Si non connecté en tant que transporteur, redirection vers la page de connexion
    if (!user) {
      navigate('/connexion?redirect=/abonnement&role=TRANSPORTER');
      return;
    }

    if (!transporterId) {
      setErrorMessage("Votre profil utilisateur n'est pas encore rattaché à une entreprise de transport sanitaire.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await StripeSubscriptionService.createCheckoutSession({
        transporterId,
        email: user.email,
        companyName: user.transporterName || (user as any).companyName,
        siret: user.siret
      });

      if (res.success && res.url) {
        // Redirection vers la page de paiement sécurisée hébergée par Stripe
        window.location.href = res.url;
      } else {
        setErrorMessage(res.error || "Impossible d'initialiser la session de paiement Stripe.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur imprévue est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Header Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
              <span className="material-symbols-outlined text-2xl">local_hospital</span>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">Clinigo<span className="text-teal-400">.fr</span></span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-teal-400/80">Réseau Sanitaire Pro</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/portal-transporteur"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                <span>Mon Espace Dispatch</span>
              </Link>
            ) : (
              <Link
                to="/connexion"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Abonnement Professionnel Sans Engagement
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Accédez à toutes les courses <br className="hidden sm:inline" />
            du réseau sanitaire <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-300">Clinigo</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Recevez les demandes hospitalières en temps réel, optimisez les plannings de vos chauffeurs, bénéficiez de la priorité 24h sur vos patients réguliers et délimitez votre zone géographique sur-mesure.
          </p>
        </div>

        {/* Pricing Card (Agency Grade) */}
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border-2 border-teal-500/40 p-6 sm:p-10 shadow-2xl shadow-teal-500/10 mb-12 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-slate-800">
            <div className="space-y-2">
              <div className="inline-block px-3 py-1 rounded-md bg-teal-500/20 text-teal-300 text-xs font-black uppercase tracking-wider">
                Formule Clinigo Pro
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Abonnement Mensuel Tout-en-un
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
                Destiné exclusivement aux sociétés d'ambulances, VSL et taxis conventionnés CPAM / ARS.
              </p>
            </div>

            <div className="text-left lg:text-right shrink-0 bg-slate-950/60 p-5 sm:p-6 rounded-2xl border border-slate-800">
              <div className="flex items-baseline gap-1 justify-start lg:justify-end">
                <span className="text-4xl sm:text-5xl font-black font-mono text-white">19,90 €</span>
                <span className="text-slate-400 text-xs font-semibold">HT / mois</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">
                ✓ Sans engagement · Résiliation en 1 clic
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Paiement sécurisé via Stripe Billing
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="relative z-10 py-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm font-bold">check</span>
              </div>
              <span><strong>Courses et départs hospitaliers illimités</strong> sans commission par transport</span>
            </div>

            <div className="flex items-start gap-3 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm font-bold">check</span>
              </div>
              <span><strong>Priorité exclusive de 24h</strong> pour la prise en charge de vos clients réguliers (continuité des soins)</span>
            </div>

            <div className="flex items-start gap-3 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm font-bold">check</span>
              </div>
              <span><strong>Éditeur de zone d'intervention personnalisé</strong> (commune, polygone libre, rayon +30 km autour de votre base)</span>
            </div>

            <div className="flex items-start gap-3 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm font-bold">check</span>
              </div>
              <span><strong>Dispatching intelligent de flotte</strong> & gestion multi-véhicules (Ambulances, VSL, Taxis)</span>
            </div>

            <div className="flex items-start gap-3 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm font-bold">check</span>
              </div>
              <span><strong>Fiches PMT & prescriptions médicales</strong> dématérialisées conformes CPAM</span>
            </div>

            <div className="flex items-start gap-3 text-slate-200">
              <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-sm font-bold">check</span>
              </div>
              <span><strong>Portail client Stripe dédié</strong> pour gérer votre carte bancaire et télécharger vos factures en PDF</span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="relative z-10 pt-4 flex flex-col items-center">
            {errorMessage && (
              <div className="w-full mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl">lock</span>
              <span>
                {isLoading ? 'Redirection vers Stripe Checkout...' : 'Souscrire à Clinigo Pro — 19,90 € / mois'}
              </span>
            </button>

            <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-400 flex-wrap justify-center">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-teal-400">verified_user</span>
                Paiement 100% sécurisé Stripe
              </span>
              <span className="text-slate-600">•</span>
              <span>Chiffrement SSL 256 bits</span>
              <span className="text-slate-600">•</span>
              <span>Authentification 3D Secure 2</span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Questions fréquentes sur l'abonnement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-200">Comment fonctionne le renouvellement ?</h4>
              <p className="text-slate-400">L'abonnement est prélevé automatiquement chaque mois à date anniversaire sur votre carte bancaire via le système certifié Stripe Billing.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-200">Puis-je résilier à tout moment ?</h4>
              <p className="text-slate-400">Oui, sans préavis ni frais. Vous pouvez résilier en un clic depuis votre espace transporteur via le portail Stripe. Votre accès reste ouvert jusqu'à la fin de la période payée.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-200">Où trouver mes factures ?</h4>
              <p className="text-slate-400">Vos factures officielles conformes aux exigences comptables françaises sont générées automatiquement et téléchargeables au format PDF sur votre portail.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-200">Y a-t-il des frais par course ?</h4>
              <p className="text-slate-400">Non. Clinigo ne prélève aucune commission sur vos transports sanitaires. Le forfait mensuel de 19,90 € HT est fixe et illimité.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Clinigo.fr — Plateforme Régulée de Transport Sanitaire Professionnel. Tous droits réservés.</p>
      </footer>
    </div>
  );
};
