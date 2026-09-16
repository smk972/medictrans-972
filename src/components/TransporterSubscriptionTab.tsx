import React, { useState } from 'react';
import { UserProfile, Transporter, TransporterSubscription, TransporterInvoice } from '../types';
import { AuthService } from '../services/authService';
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
  // Récupération de l'abonnement actif (soit depuis user, soit depuis transporter)
  const [subscription, setSubscription] = useState<TransporterSubscription>(() => {
    if (user?.subscription) return user.subscription;
    if (transporter?.subscription) return transporter.subscription;
    return {
      status: 'NONE',
      trialDaysTotal: 30,
      trialDaysRemaining: 30,
      isTrialUnlocked: false,
      whatsappVerified: false,
      whatsappPhone: user?.phone || transporter?.phone || '0696 75 20 20',
      planName: 'Formule Pro Sanitaire (Illimitée)',
      monthlyPrice: 19.9,
      invoices: []
    };
  });

  // Modal WhatsApp
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState(() => user?.phone || transporter?.phone || '0696 75 20 20');
  const [whatsAppStep, setWhatsAppStep] = useState<'PHONE' | 'VERIFY' | 'SUCCESS'>('PHONE');
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const isTrial = subscription.status === 'TRIAL';
  const isExpired = subscription.status === 'EXPIRED';
  const isTrialUnlocked = subscription.isTrialUnlocked;

  // Calcul du pourcentage de jours restants
  const totalDays = subscription.trialDaysTotal || 30;
  const remainingDays = subscription.trialDaysRemaining ?? 30;
  const progressPercent = Math.min(100, Math.max(0, Math.round((remainingDays / totalDays) * 100)));

  // Formatage date d'échéance
  const expiresFormatted = subscription.trialExpiresAt
    ? new Date(subscription.trialExpiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Dans 30 jours';

  const formatPhoneForWhatsApp = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0696') || digits.startsWith('0796')) {
      return '596' + digits.slice(1);
    } else if (digits.startsWith('0690') || digits.startsWith('0790')) {
      return '590' + digits.slice(1);
    } else if (digits.startsWith('0694')) {
      return '594' + digits.slice(1);
    } else if (digits.startsWith('0692') || digits.startsWith('0693') || digits.startsWith('0639')) {
      return '262' + digits.slice(1);
    } else if (digits.startsWith('06') || digits.startsWith('07')) {
      return '33' + digits.slice(1);
    } else if (digits.startsWith('33') || digits.startsWith('596') || digits.startsWith('590') || digits.startsWith('594') || digits.startsWith('262')) {
      return digits;
    }
    return digits;
  };

  const handleOpenWhatsAppModal = () => {
    setWhatsAppStep('PHONE');
    setEnteredCode('');
    setCodeError(null);
    setIsWhatsAppModalOpen(true);
  };

  const handleSendWhatsAppCode = async () => {
    if (!phoneInput.trim()) {
      alert('Veuillez renseigner un numéro de téléphone.');
      return;
    }

    setIsSendingCode(true);
    setCodeError(null);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);

    const waPhone = formatPhoneForWhatsApp(phoneInput);

    try {
      localStorage.setItem('clinigo_transporter_otp', JSON.stringify({
        phone: waPhone,
        code,
        sentAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000
      }));

      // Appel de l'API backend Meta WhatsApp Cloud
      const res = await fetch('/api/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneInput.trim(),
          code
        })
      });

      const data = await res.json();
      if (!data.success && data.errorCode === 131030) {
        setCodeError("Numéro de test non autorisé : Veuillez ajouter ce numéro dans votre console Meta for Developers (Étape 2 : Destinataires autorisés).");
      }
    } catch (err) {
      console.warn("Erreur envoi OTP WhatsApp:", err);
    } finally {
      setIsSendingCode(false);
      setWhatsAppStep('VERIFY');
    }
  };

  const handleVerifyCode = () => {
    if (enteredCode.trim().replace(/\s+/g, '') !== generatedCode) {
      setCodeError('Code de vérification incorrect. Veuillez vérifier le message WhatsApp reçu.');
      return;
    }

    // Déblocage de l'essai gratuit
    const updated = AuthService.unlockTransporterFreeTrial(phoneInput.trim(), totalDays);
    if (updated?.subscription) {
      setSubscription(updated.subscription);
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated(updated.subscription);
      }
    } else {
      const newSub: TransporterSubscription = {
        ...subscription,
        status: 'TRIAL',
        trialDaysRemaining: totalDays,
        isTrialUnlocked: true,
        whatsappVerified: true,
        whatsappPhone: phoneInput.trim(),
        trialExpiresAt: new Date(Date.now() + totalDays * 86400000).toISOString(),
        invoices: [
          {
            id: `inv-${Date.now()}`,
            invoiceNumber: `FACT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().slice(0, 10),
            amount: 0,
            description: `Offre Découverte — Période d’essai gratuit ${totalDays} jours (Vérification WhatsApp)`,
            status: 'TRIAL_FREE',
            periodStart: new Date().toISOString().slice(0, 10),
            periodEnd: new Date(Date.now() + totalDays * 86400000).toISOString().slice(0, 10)
          }
        ]
      };
      setSubscription(newSub);
      if (onSubscriptionUpdated) onSubscriptionUpdated(newSub);
    }

    setWhatsAppStep('SUCCESS');
    setTimeout(() => {
      setIsWhatsAppModalOpen(false);
    }, 1400);
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
      {/* ========================================================================= */}
      {/* 1. BANDEAU DE DÉCOMPTE DES JOURS RESTANTS D'ESSAI GRATUIT                */}
      {/* ========================================================================= */}
      {isTrial ? (
        <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/20 border border-amber-300">
          {/* Subtle decorative circles */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none blur-xl" />
          <div className="absolute right-32 top-0 w-32 h-32 rounded-full bg-amber-400/20 pointer-events-none blur-lg" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-black/20">
                <span className="material-symbols-outlined text-3xl">timer</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2.5 py-0.5 rounded-full shadow-xs">
                    ✦ Période d'essai gratuit active
                  </span>
                  <span className="text-xs font-bold text-slate-900 bg-white/40 px-2.5 py-0.5 rounded-full">
                    Formule Pro Sanitaire illimitée
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                  Il vous reste <span className="underline decoration-slate-950/40">{remainingDays} jour{remainingDays > 1 ? 's' : ''}</span> de gratuité
                </h2>
                <p className="text-xs sm:text-sm font-medium text-slate-900/90 max-w-2xl leading-relaxed">
                  Vous disposez d'un accès sans restriction à l'ensemble des modules : dispatching intelligent des courses hospitalières, affectation des chauffeurs, télétransmission CPAM et historique exportable.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="bg-slate-950/90 backdrop-blur-xs text-white p-4 rounded-2xl border border-white/15 text-center min-w-[150px] shadow-lg">
                <span className="text-[10px] uppercase font-bold text-amber-300 block tracking-wider">Date d'échéance</span>
                <span className="text-sm font-mono font-black text-white mt-0.5 block">
                  {expiresFormatted}
                </span>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {!subscription.whatsappVerified && (
                <button
                  type="button"
                  onClick={handleOpenWhatsAppModal}
                  className="px-4 py-3 rounded-2xl bg-white text-emerald-800 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-emerald-600 text-lg">chat</span>
                  <span>Lier mon WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : isExpired ? (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl">event_busy</span>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                Période d'essai expirée
              </span>
              <h3 className="text-lg font-black text-rose-900 mt-1">
                Votre période de gratuité est arrivée à son terme
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Contactez l'administrateur ou activez votre abonnement pour continuer à recevoir des courses.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenWhatsAppModal}
            className="px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
          >
            Prolonger mon essai
          </button>
        </div>
      ) : (
        /* Invitation Essai Gratuit */
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white shadow-xl border border-teal-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
              <span className="material-symbols-outlined text-3xl">card_giftcard</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-400/15 px-2.5 py-0.5 rounded-full border border-amber-400/30 inline-block">
                Offre spéciale Découverte
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Activez votre essai gratuit de 30 jours
              </h2>
              <p className="text-xs sm:text-sm text-teal-100/80 max-w-2xl leading-relaxed">
                Testez sans engagement toutes les fonctionnalités professionnelles de MedicTrans (dispatching en direct, fiches PMT dématérialisées et planning). Aucune carte bancaire requise.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenWhatsAppModal}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-xl">chat</span>
            <span>Débloquer 1 mois gratuit (WhatsApp)</span>
          </button>
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
                  Abonnement Pro Flotte & Dispatching
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pour Ambulances, VSL et Taxis conventionnés CPAM / ARS
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                  19,90 € <span className="text-xs font-normal text-slate-500">HT / mois</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {isTrial ? 'Période d\'essai gratuite active' : 'Facturation mensuelle'}
                </span>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Courses & Départs hospitaliers illimités</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Délai prioritaire de 24h sur demandes directes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Dispatching flotte & géolocalisation d'approche</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Planning partagé avec les chauffeurs</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Télétransmission CPAM et tiers-payant 100%</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Support technique et régulation territoriale 7j/7</span>
              </div>
            </div>
          </div>

          {/* Payment info notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-start gap-3 text-xs text-slate-600">
            <span className="material-symbols-outlined text-teal-700 text-xl shrink-0 mt-0.5">credit_card</span>
            <div className="leading-relaxed">
              <strong className="text-slate-800">Système de paiement par carte bancaire en ligne :</strong><br />
              Le module de paiement direct par carte sera activé prochainement. Pendant toute votre période d'essai gratuit ({remainingDays} jours restants), votre accès reste 100% opérationnel sans aucune interruption ni prélèvement.
            </div>
          </div>
        </div>

        {/* Coordonnées & Statut WhatsApp Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">verified_user</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Vérification du compte</h4>
                <span className="text-[11px] text-slate-500">Sécurité et gratuité de test</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Entreprise :</span>
                <span className="font-bold text-slate-900 text-right">{user?.transporterName || transporter?.companyName || 'Ambulances Madinina Secours'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Agrément ARS :</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-[11px]">
                  {transporter?.arsLicense || user?.transporterLicense || '972-AMB-2024-08'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Téléphone WhatsApp :</span>
                <span className="font-mono font-bold text-slate-800">{subscription.whatsappPhone || user?.phone || '0696 75 20 20'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Statut WhatsApp :</span>
                <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full ${
                  subscription.whatsappVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  <span className="material-symbols-outlined text-xs">
                    {subscription.whatsappVerified ? 'verified' : 'pending'}
                  </span>
                  {subscription.whatsappVerified ? 'Numéro vérifié' : 'Non vérifié'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenWhatsAppModal}
            className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-emerald-600">sync</span>
            <span>{subscription.whatsappVerified ? 'Modifier le numéro WhatsApp' : 'Vérifier mon numéro WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HISTORIQUE DES PAIEMENTS & FACTURES TÉLÉCHARGEABLES                     */}
      {/* ========================================================================= */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              Facturation & Historique des Règlements
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Téléchargez vos factures et justificatifs de période de test au format officiel PDF.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500 font-mono">
            {(subscription.invoices || []).length} document{(subscription.invoices || []).length > 1 ? 's' : ''} disponible{(subscription.invoices || []).length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Invoices List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Numéro de Facture</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Montant HT</th>
                <th className="py-3 px-3">Statut</th>
                <th className="py-3 px-3 text-right">Facture PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(subscription.invoices && subscription.invoices.length > 0) ? (
                subscription.invoices.map((inv) => (
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
                        {inv.status === 'TRIAL_FREE' ? 'Offert (Essai)' : 'Payé'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
                        title="Télécharger ou imprimer la facture en PDF"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>Télécharger PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Aucune facture émise pour le moment. Votre première facture d'essai gratuit sera générée dès la vérification WhatsApp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL : VÉRIFICATION WHATSAPP POUR DÉBLOQUER L'ESSAI GRATUIT             */}
      {/* ========================================================================= */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 my-8 relative overflow-hidden">
            {/* Top WhatsApp Banner Accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#25D366]" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">chat</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Vérification WhatsApp</h3>
                  <span className="text-[11px] text-slate-500 font-medium">1 mois d'essai gratuit offert</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Step 1: Phone input */}
            {whatsAppStep === 'PHONE' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nous allons envoyer un code de vérification sécurisé à 6 chiffres par WhatsApp au numéro enregistré pour <strong>{user?.transporterName || transporter?.companyName || 'votre entreprise'}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Numéro de portable enregistré :
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="06 XX XX XX XX"
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Numéro mobile français ou DOM (+33 / 06 / 07 / 0696)
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSendWhatsAppCode}
                    disabled={isSendingCode}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSendingCode ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Envoi du message WhatsApp...
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">send</span>
                        <span>Envoyer le code par WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Code Verification */}
            {whatsAppStep === 'VERIFY' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-[#DCF8C6]/50 border border-[#25D366]/40 flex items-start gap-3 text-xs text-slate-800">
                  <span className="material-symbols-outlined text-[#128C7E] text-xl shrink-0 mt-0.5">mark_chat_read</span>
                  <div>
                    <strong className="text-slate-950 font-bold">Message WhatsApp envoyé !</strong><br />
                    Un message contenant votre code confidentiel à 6 chiffres a été envoyé au <span className="font-mono font-bold text-[#075E54]">{phoneInput}</span>. Veuillez consulter votre application WhatsApp pour y lire le code et le saisir ci-dessous :
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Code de vérification reçu sur WhatsApp :
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={enteredCode}
                    onChange={(e) => {
                      setEnteredCode(e.target.value.replace(/\D/g, ''));
                      setCodeError(null);
                    }}
                    placeholder="• • • • • •"
                    className="w-full p-3 rounded-xl border border-slate-300 font-mono font-black text-2xl text-center tracking-widest text-slate-900 outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all placeholder:text-slate-300"
                  />
                  {codeError && (
                    <span className="text-[11px] font-bold text-rose-600 mt-1 block">
                      {codeError}
                    </span>
                  )}

                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleSendWhatsAppCode}
                    className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Renvoyer le code WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsAppStep('PHONE')}
                    className="text-teal-700 hover:underline font-bold cursor-pointer"
                  >
                    Changer de numéro
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={enteredCode.length < 6}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>Valider et débloquer 1 mois gratuit</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {whatsAppStep === 'SUCCESS' && (
              <div className="py-6 text-center space-y-3 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-4xl animate-pulse">verified</span>
                </div>
                <h4 className="text-lg font-black text-slate-900">
                  Essai gratuit débloqué avec succès !
                </h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Vos 30 jours de gratuité sont maintenant actifs sur votre plateforme.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
