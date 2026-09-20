import React, { useState, useEffect } from 'react';
import { UserProfile, Transporter, TransporterSubscription, TransporterInvoice, StripeInvoiceRecord } from '../types';
import { StripeSubscriptionService } from '../services/stripeSubscriptionService';
import { downloadOrPrintInvoice } from '../utils/invoiceGenerator';

interface TransporterSubscriptionTabProps {
  user: UserProfile | null;
  transporter?: Transporter | null;
  onSubscriptionUpdated?: (subscription: TransporterSubscription) => void;
}

export const TransporterSubscriptionTab: React.FC<TransporterSubscriptionTabProps> = ({
  user,
  transporter,
  onSubscriptionUpdated
}) => {
  const transporterId = user?.transporterId || transporter?.id || (user?.role === 'TRANSPORTER' ? user.id : null);

  // État local de l'abonnement
  const [subscription, setSubscription] = useState<TransporterSubscription>(() => {
    if (user?.subscription) return user.subscription;
    if (transporter?.subscription) return transporter.subscription;
    return {
      status: 'NONE',
      planName: 'Formule Clinigo Pro (19,90 € / mois)',
      monthlyPrice: 19.9,
      invoices: []
    };
  });

  const [realInvoices, setRealInvoices] = useState<StripeInvoiceRecord[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronisation en direct avec le serveur Stripe / Supabase
  useEffect(() => {
    if (!transporterId) return;

    let isMounted = true;
    setIsLoadingStatus(true);

    StripeSubscriptionService.getSubscriptionStatus(transporterId)
      .then((res) => {
        if (!isMounted) return;

        if (res.success && res.subscription) {
          const sub = res.subscription;
          const updatedSub: TransporterSubscription = {
            ...subscription,
            status: sub.status,
            stripeCustomerId: sub.stripe_customer_id,
            stripeSubscriptionId: sub.stripe_subscription_id,
            stripePriceId: sub.stripe_price_id,
            currentPeriodStart: sub.current_period_start,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            canceledAt: sub.canceled_at,
            planName: 'Formule Clinigo Pro (Illimitée)',
            monthlyPrice: 19.9
          };
          setSubscription(updatedSub);
          if (onSubscriptionUpdated) onSubscriptionUpdated(updatedSub);
        }

        if (res.invoices && res.invoices.length > 0) {
          setRealInvoices(res.invoices);
        }
      })
      .catch((err) => {
        console.warn('[SubscriptionTab] Erreur synchronisation abonnement :', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, [transporterId]);

  const isActive = subscription.status === 'active' || subscription.status === 'ACTIVE' || subscription.status === 'trialing';
  const isPastDue = subscription.status === 'past_due';
  const isCanceled = subscription.status === 'canceled';
  const isTrial = subscription.status === 'TRIAL';
  const cancelAtPeriodEnd = subscription.cancelAtPeriodEnd;

  // Formatage de la date d'échéance
  const periodEndFormatted = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : subscription.trialExpiresAt
    ? new Date(subscription.trialExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // 1. Redirection vers Stripe Checkout pour souscrire
  const handleSubscribeStripe = async () => {
    if (!transporterId) {
      setErrorMessage("Identifiant de transporteur introuvable.");
      return;
    }

    try {
      setIsRedirectingToStripe(true);
      setErrorMessage(null);

      const res = await StripeSubscriptionService.createCheckoutSession({
        transporterId,
        email: user?.email || transporter?.email,
        companyName: user?.transporterName || transporter?.companyName,
        siret: transporter?.siret
      });

      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setErrorMessage(res.error || "Impossible d'ouvrir la page de paiement Stripe.");
        setIsRedirectingToStripe(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de communication avec Stripe.");
      setIsRedirectingToStripe(false);
    }
  };

  // 2. Redirection vers Stripe Customer Portal pour gérer l'abonnement
  const handleOpenCustomerPortal = async () => {
    if (!transporterId) {
      setErrorMessage("Identifiant de transporteur introuvable.");
      return;
    }

    try {
      setIsRedirectingToStripe(true);
      setErrorMessage(null);

      const res = await StripeSubscriptionService.createCustomerPortalSession(transporterId);

      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setErrorMessage(res.error || "Impossible d'accéder au portail client Stripe.");
        setIsRedirectingToStripe(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de l'accès au portail.");
      setIsRedirectingToStripe(false);
    }
  };

  const handleDownloadInvoice = (inv: TransporterInvoice) => {
    downloadOrPrintInvoice(inv, {
      companyName: user?.transporterName || transporter?.companyName,
      siret: transporter?.siret,
      address: transporter?.address,
      city: transporter?.city,
      postalCode: transporter?.postalCode,
      phone: subscription.whatsappPhone || user?.phone || transporter?.phone,
      email: user?.email || transporter?.email
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans">
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. BANDEAU DE STATUT D'ABONNEMENT (STRIPE REAL TIME)                      */}
      {/* ========================================================================= */}
      {isActive ? (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Abonnement &amp; Facturation
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Formule Clinigo Pro (Active)</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-mono font-bold border border-teal-500/30">
                19,90 € HT / mois
              </span>
            </div>
            <p className="text-slate-300 text-sm max-w-xl">
              {cancelAtPeriodEnd
                ? `Votre abonnement a été résilié et prendra fin le ${periodEndFormatted}. Votre accès reste 100% opérationnel jusque-là.`
                : `Votre forfait se renouvelle automatiquement. Prochaine échéance le ${periodEndFormatted || 'mois prochain'}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenCustomerPortal}
              disabled={isRedirectingToStripe}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">settings</span>
              <span>{isRedirectingToStripe ? 'Ouverture...' : 'Gérer mon abonnement (Stripe)'}</span>
            </button>
          </div>
        </div>
      ) : isPastDue ? (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Paiement en attente
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Le prélèvement a échoué</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
                Action requise
              </span>
            </div>
            <p className="text-slate-300 text-sm max-w-xl">
              Veuillez mettre à jour vos coordonnées bancaires sur le portail Stripe sécurisé pour continuer à recevoir et accepter des courses hospitalières.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenCustomerPortal}
              disabled={isRedirectingToStripe}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">credit_card</span>
              <span>Mettre à jour ma carte</span>
            </button>
          </div>
        </div>
      ) : (
        /* Invitation Souscription Stripe */
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Offre Professionnelle Sanitaire
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Activez votre abonnement Clinigo Pro</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-bold border border-amber-400/30">
                19,90 € HT / mois
              </span>
            </div>
            <p className="text-slate-300 text-sm max-w-xl">
              Courses hospitalières illimitées, délai prioritaire de 24h sur vos clients réguliers, éditeur de zone d'intervention personnalisé et fiches PMT dématérialisées. Sans engagement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSubscribeStripe}
              disabled={isRedirectingToStripe}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              <span>{isRedirectingToStripe ? 'Redirection vers Stripe...' : 'Souscrire pour 19,90 € / mois'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DÉTAILS DE LA FORMULE ET DU FORFAIT PRO                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formule Active Card */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 inline-block">
                  Formule Sanitaire Professionnelle
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Clinigo Pro — Flotte & Régulation Sanitaire
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pour Ambulances, VSL et Taxis conventionnés CPAM / ARS
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                  19,90 € <span className="text-xs font-normal text-slate-500">HT / mois</span>
                </div>
                <span className={`text-[11px] font-bold ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {isActive ? '✓ Abonnement Stripe actif' : 'Renouvellement mensuel sans engagement'}
                </span>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Courses & Départs hospitaliers illimités (0% commission)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Délai prioritaire de 24h sur demandes directes (continuité des soins)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Zone d'intervention sur-mesure (polygone + 30 km autour de votre base)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Dispatching flotte & synchronisation planning chauffeurs</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Fiches PMT dématérialisées conformes CPAM</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Portail de facturation sécurisé Stripe (factures PDF & gestion carte)</span>
              </div>
            </div>
          </div>

          {/* Stripe Billing Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3 text-xs text-slate-600">
            <span className="material-symbols-outlined text-teal-700 text-xl shrink-0 mt-0.5">lock</span>
            <div className="leading-relaxed">
              <strong className="text-slate-800">Gestion des paiements et résiliation :</strong><br />
              Vos paiements sont traités par Stripe. Vous pouvez modifier votre carte bancaire ou résilier à tout moment depuis le portail Stripe en 1 clic sans frais ni préavis.
            </div>
          </div>
        </div>

        {/* Coordonnées & Statut Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">domain</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Entreprise conventionnée</h4>
                <span className="text-[11px] text-slate-500">Compte Transporteur Clinigo</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Entreprise :</span>
                <span className="font-bold text-slate-900 text-right">{user?.transporterName || transporter?.companyName || 'Société de transport conventionnée'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Agrément ARS :</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-[11px]">
                  {transporter?.arsLicense || user?.transporterLicense || 'Agrément vérifié'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Téléphone :</span>
                <span className="font-mono font-bold text-slate-800">{user?.phone || transporter?.phone || '0696 75 20 20'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Statut Stripe :</span>
                <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isPastDue
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  <span className="material-symbols-outlined text-xs">
                    {isActive ? 'check_circle' : isPastDue ? 'warning' : 'pending'}
                  </span>
                  {isActive ? 'Abonnement Actif' : isPastDue ? 'Régularisation requise' : 'Non souscrit'}
                </span>
              </div>
            </div>
          </div>

          {isActive ? (
            <button
              type="button"
              onClick={handleOpenCustomerPortal}
              disabled={isRedirectingToStripe}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">manage_accounts</span>
              <span>Gérer mon compte Stripe</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubscribeStripe}
              disabled={isRedirectingToStripe}
              className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              <span>Souscrire (19,90 € / mois)</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HISTORIQUE DES FACTURES STRIPE TÉLÉCHARGEABLES                         */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-700">receipt_long</span>
              Facturation & Historique des Règlements
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Téléchargez vos factures officielles émises par Stripe au format PDF conforme.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500 font-mono">
            {realInvoices.length + (subscription.invoices || []).length} document(s) disponible(s)
          </span>
        </div>

        {/* Invoices List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Référence Facture</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Montant</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-3 text-right">Facture PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Factures réelles Stripe */}
              {realInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-3 font-mono text-slate-600">
                    {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('fr-FR') : (inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : '-')}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-teal-800">
                    {inv.stripe_invoice_id.slice(-10).toUpperCase()}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-800">
                    Abonnement Clinigo Pro Sanitaire Mensuel
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                    {inv.amount.toFixed(2)} € {inv.currency.toUpperCase()}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Payé
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {inv.invoice_pdf || inv.invoice_url ? (
                      <a
                        href={inv.invoice_pdf || inv.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold text-xs transition-colors cursor-pointer border border-teal-200"
                        title="Télécharger la facture officielle PDF Stripe"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>Facture PDF</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Génération en cours</span>
                    )}
                  </td>
                </tr>
              ))}

              {/* Factures antérieures éventuelles */}
              {(subscription.invoices || []).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-3 font-mono text-slate-600">
                    {new Date(inv.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-teal-800">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-800">
                    {inv.description}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                    {inv.amount.toFixed(2)} €
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      {inv.status === 'TRIAL_FREE' ? 'Offert' : 'Payé'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      <span>Télécharger PDF</span>
                    </button>
                  </td>
                </tr>
              ))}

              {realInvoices.length === 0 && (!subscription.invoices || subscription.invoices.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Aucune facture émise pour le moment. Dès votre premier prélèvement de 19,90 € HT, votre facture apparaîtra ici.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
