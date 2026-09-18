import React from 'react';
import { Link } from 'react-router-dom';

export const SubscriptionCancelPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="space-y-6 py-4 animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-4xl">remove_shopping_cart</span>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              Paiement Non Finalisé
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Souscription annulée
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Votre démarche d'abonnement a été interrompue. <strong>Votre compte bancaire n'a pas été débité.</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left text-xs space-y-1.5 text-slate-400">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-base text-teal-400 shrink-0 mt-0.5">info</span>
              <span>
                Vous pouvez retenter votre souscription à tout moment pour activer votre accès prioritaire aux départs hospitaliers et au dispatching temps réel.
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              to="/abonnement"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">replay</span>
              <span>Réessayer la souscription (19,90 € / mois)</span>
            </Link>

            <Link
              to="/portal-transporteur"
              className="block w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors border border-slate-700"
            >
              Retourner à mon compte transporteur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
