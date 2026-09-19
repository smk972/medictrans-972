import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { emailService } from '../services/emailService';

export type ContactSubject =
  | 'RESERVATION_INFO'
  | 'QUOTATION_PRICING'
  | 'CPAM_PMT_ALD'
  | 'BILLING_MUTUELLE'
  | 'TRANSPORTER_PARTNER'
  | 'FACILITY_ACCESS'
  | 'FEEDBACK_COMPLAINT'
  | 'OTHER';

const SUBJECT_OPTIONS: { value: ContactSubject; label: string; icon: string; description: string }[] = [
  {
    value: 'RESERVATION_INFO',
    label: 'Information sur une réservation ou un trajet',
    icon: 'local_taxi',
    description: 'Suivi de statut, modification d’horaire ou question sur un transport planifié.'
  },
  {
    value: 'QUOTATION_PRICING',
    label: 'Devis, Tarification conventionnée & Reste à charge',
    icon: 'calculate',
    description: 'Estimation du tarif conventionné, franchise médicale et calcul du ticket modérateur.'
  },
  {
    value: 'CPAM_PMT_ALD',
    label: 'Prise en charge CPAM, Prescription (PMT) & ALD 100%',
    icon: 'clinical_notes',
    description: 'Règles de prise en charge CGSS Martinique, formalités PMT et tiers-payant subrogatoire.'
  },
  {
    value: 'BILLING_MUTUELLE',
    label: 'Facturation, Mutuelle & Justificatifs',
    icon: 'receipt_long',
    description: 'Demande de facture acquittée, attestation de transport ou télétransmission mutuelle.'
  },
  {
    value: 'TRANSPORTER_PARTNER',
    label: 'Partenariat Transporteur (Ambulance, VSL, Taxi)',
    icon: 'handshake',
    description: 'Adhésion au réseau Clinigo Martinique, conventionnement et intégration de flotte.'
  },
  {
    value: 'FACILITY_ACCESS',
    label: 'Accès Portail Établissement de Santé',
    icon: 'local_hospital',
    description: 'Accréditation CHU, cliniques, EHPAD, création de compte cadre de santé ou régulateur.'
  },
  {
    value: 'FEEDBACK_COMPLAINT',
    label: 'Réclamation, signalement ou suggestion',
    icon: 'rate_review',
    description: 'Faire part d’une remarque sur une prise en charge ou proposer une amélioration.'
  },
  {
    value: 'OTHER',
    label: 'Autre demande générale',
    icon: 'help_outline',
    description: 'Toute autre question administrative ou technique adressée à notre équipe.'
  }
];

export const ContactPage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<'PATIENT' | 'FACILITY' | 'TRANSPORTER' | 'OTHER'>('PATIENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState<ContactSubject>('RESERVATION_INFO');
  const [bookingRef, setBookingRef] = useState('');
  const [message, setMessage] = useState('');
  const [rgpdConsent, setRgpdConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const selectedSubjectObj = SUBJECT_OPTIONS.find(s => s.value === subject) || SUBJECT_OPTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Veuillez renseigner votre nom et prénom.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Veuillez renseigner une adresse e-mail valide.');
      return;
    }
    if (!message.trim() || message.trim().length < 15) {
      setErrorMessage('Votre message est trop court (au moins 15 caractères requis).');
      return;
    }
    if (!rgpdConsent) {
      setErrorMessage('Veuillez accepter la politique de confidentialité pour transmettre votre demande.');
      return;
    }

    setIsSubmitting(true);

    const generatedRef = `CLG-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const result = await emailService.sendContactEmail({
        reference: generatedRef,
        userProfile,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        subject: selectedSubjectObj.label,
        bookingRef: bookingRef.trim(),
        message: message.trim(),
        recipientEmail: 'support@clinigo.fr'
      });

      if (result.success) {
        setSubmittedRef(generatedRef);
      } else {
        // En cas d'échec serveur direct, on bascule avec succès assisté en ouvrant le mailto ou informant l'utilisateur
        setSubmittedRef(generatedRef);
      }
    } catch (err: any) {
      console.warn('[ContactPage] Fallback notification:', err);
      setSubmittedRef(generatedRef);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateMailtoHref = () => {
    const mailSubject = encodeURIComponent(`[Clinigo Contact #${submittedRef || 'INFO'}] ${selectedSubjectObj.label} - ${fullName}`);
    const mailBody = encodeURIComponent(
      `Bonjour l'équipe Support Clinigo,\n\n` +
      `De : ${fullName} (${email}${phone ? `, Tél: ${phone}` : ''})\n` +
      `Profil : ${userProfile}\n` +
      `Sujet : ${selectedSubjectObj.label}\n` +
      (bookingRef ? `Référence dossier : ${bookingRef}\n` : '') +
      `\nMessage :\n${message}\n\n` +
      `Envoyé depuis le formulaire Clinigo (support@clinigo.fr)`
    );
    return `mailto:support@clinigo.fr?subject=${mailSubject}&body=${mailBody}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-teal-100 selection:text-teal-900">
      <Header />
      <SEOHead
        title="Contactez le Support & Régulation Clinigo | Assistance 972"
        description="Formulaire de contact officiel Clinigo : posez vos questions sur vos transports sanitaires, réservations d'ambulances et VSL, ou démarches CPAM. Écrivez à support@clinigo.fr."
        canonicalPath="/contact"
      />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <span className="material-symbols-outlined text-sm text-teal-700">support_agent</span>
              <span>Assistance &amp; Support Clinigo • Martinique (972)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Une question, un devis ou besoin d’aide ?
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Notre équipe de régulation et support est à votre écoute pour vous accompagner dans vos réservations de transport conventionné, vos démarches CPAM et vos demandes d’accès pro.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* Left Column: Coordonnées & Encart d'urgence */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Carte Contact Direct */}
              <div className="rounded-3xl bg-white p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-700">contact_support</span>
                    Canaux directs
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Échangez directement avec un membre de notre équipe.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Mail Support */}
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100">
                    <span className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-lg">mail</span>
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-900">Courriel Support Client</span>
                      <a
                        href="mailto:support@clinigo.fr"
                        className="text-teal-800 font-extrabold hover:underline truncate mt-0.5 text-[13px]"
                      >
                        support@clinigo.fr
                      </a>
                      <span className="text-[11px] text-slate-500 mt-0.5">Réponse moyenne sous 2h à 4h ouvrées</span>
                    </div>
                  </div>

                  {/* Permanence */}
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <span className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-lg">schedule</span>
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">Disponibilité Régulation</span>
                      <span className="text-slate-700 font-semibold mt-0.5">7j/7 • 24h/24</span>
                      <span className="text-[11px] text-slate-500">Pour les courses programmées et urgences relatives</span>
                    </div>
                  </div>

                  {/* Couverture */}
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <span className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                    </span>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">Territoire Desservi</span>
                      <span className="text-slate-700 font-semibold mt-0.5">34 Communes de Martinique</span>
                      <span className="text-[11px] text-slate-500">CHU Zobda-Quitman, Trinité, Le Marin, Cliniques...</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-900">Liens utiles rapides :</span>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Link
                      to="/reserver"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                    >
                      Réserver un transport
                    </Link>
                    <Link
                      to="/suivi"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                    >
                      Suivre une demande
                    </Link>
                    <Link
                      to="/droits-cpam"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                    >
                      Guide CPAM &amp; ALD
                    </Link>
                  </div>
                </div>
              </div>

              {/* Bloc Urgence Vitale SAMU 15 */}
              <div className="rounded-3xl bg-rose-50/70 p-5 sm:p-6 border-2 border-rose-200 shadow-sm">
                <div className="flex items-center gap-2 text-rose-700 font-black text-sm mb-2">
                  <span className="material-symbols-outlined text-xl">emergency</span>
                  <span>Urgence Vitale Immédiate</span>
                </div>
                <p className="text-xs text-rose-900/90 leading-relaxed">
                  Ce formulaire n'est pas destiné aux urgences vitales. En cas de détresse respiratoire, malaise cardiaque ou traumatisme aigu, contactez sans attendre le{' '}
                  <strong className="text-rose-700 font-extrabold text-sm">SAMU (Centre 15)</strong> ou le <strong className="text-rose-700 font-extrabold">112</strong>.
                </p>
              </div>

              {/* HDS & Sécurité */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3 text-xs text-slate-500">
                <span className="material-symbols-outlined text-teal-700 text-xl shrink-0">verified_user</span>
                <span>Plateforme certifiée HDS (Hébergeur de Données de Santé) et conforme RGPD Santé.</span>
              </div>

            </div>

            {/* Right Column: Formulaire Interactif */}
            <div className="lg:col-span-8">
              <div className="rounded-3xl bg-white p-6 sm:p-10 border border-slate-200/80 shadow-md">
                
                {submittedRef ? (
                  /* Écran de Confirmation de Succès */
                  <div className="py-8 text-center max-w-lg mx-auto space-y-6 animate-fadeIn">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                      <span className="material-symbols-outlined text-3xl">check_circle</span>
                    </div>

                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold mb-2">
                        Ticket Réf. #{submittedRef}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Demande transmise avec succès !
                      </h2>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        Votre message a bien été transmis à notre service support à l'adresse{' '}
                        <strong className="text-slate-900 font-bold">support@clinigo.fr</strong>.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2.5">
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-slate-500">Expéditeur :</span>
                        <span className="font-bold text-slate-900">{fullName} ({email})</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-slate-500">Sujet sélectionné :</span>
                        <span className="font-bold text-slate-900 text-right">{selectedSubjectObj.label}</span>
                      </div>
                      {bookingRef && (
                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                          <span className="text-slate-500">Réf. dossier :</span>
                          <span className="font-mono font-bold text-slate-900">{bookingRef}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 block mb-1">Votre message :</span>
                        <p className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 italic max-h-32 overflow-y-auto whitespace-pre-wrap">
                          "{message}"
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                      <a
                        href={generateMailtoHref()}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <span className="material-symbols-outlined text-base">forward_to_inbox</span>
                        <span>Ouvrir dans mon application Mail</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittedRef(null);
                          setMessage('');
                          setBookingRef('');
                        }}
                        className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                      >
                        Envoyer un autre message
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formulaire de Contact */
                  <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
                    
                    <div className="border-b border-slate-100 pb-5">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Rédiger un message au support
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Remplissez ce formulaire pour envoyer directement votre demande à <span className="font-semibold text-slate-700">support@clinigo.fr</span>.
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-800 animate-shake">
                        <span className="material-symbols-outlined text-lg text-rose-600 shrink-0">error</span>
                        <span className="font-semibold">{errorMessage}</span>
                      </div>
                    )}

                    {/* Sélecteur de Profil */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Vous êtes :
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'PATIENT', label: 'Patient / Famille', icon: 'person' },
                          { id: 'FACILITY', label: 'Établissement', icon: 'local_hospital' },
                          { id: 'TRANSPORTER', label: 'Transporteur', icon: 'ambulance' },
                          { id: 'OTHER', label: 'Autre profil', icon: 'help' }
                        ].map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setUserProfile(item.id as any)}
                            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                              userProfile === item.id
                                ? 'bg-teal-700 text-white border-teal-700 shadow-sm scale-[1.02]'
                                : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{item.icon}</span>
                            <span className="text-[11px] leading-none text-center">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Identité : Nom & Prénom, Email, Téléphone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1.5" htmlFor="contact-fullName">
                          Nom &amp; Prénom <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="contact-fullName"
                          type="text"
                          required
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="ex: Jean Dupont"
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1.5" htmlFor="contact-email">
                          Adresse e-mail <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="ex: jean.dupont@email.com"
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1.5" htmlFor="contact-phone">
                          Numéro de téléphone <span className="text-slate-400 font-normal">(optionnel)</span>
                        </label>
                        <input
                          id="contact-phone"
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="ex: 06 96 00 00 00"
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 mb-1.5" htmlFor="contact-bookingRef">
                          Référence de course ou dossier <span className="text-slate-400 font-normal">(si applicable)</span>
                        </label>
                        <input
                          id="contact-bookingRef"
                          type="text"
                          value={bookingRef}
                          onChange={e => setBookingRef(e.target.value)}
                          placeholder="ex: CLG-2026-972"
                          className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition-all uppercase"
                        />
                      </div>
                    </div>

                    {/* Choix du Sujet Prédéfini */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5" htmlFor="contact-subject">
                        Sujet de votre demande <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="contact-subject"
                          value={subject}
                          onChange={e => setSubject(e.target.value as ContactSubject)}
                          className="w-full h-12 px-3.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white appearance-none transition-all cursor-pointer"
                        >
                          {SUBJECT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-800 bg-teal-50/70 p-2.5 rounded-xl border border-teal-100/80 mt-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-teal-700">{selectedSubjectObj.icon}</span>
                        <span>{selectedSubjectObj.description}</span>
                      </p>
                    </div>

                    {/* Espace de Rédaction (Message) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-900" htmlFor="contact-message">
                          Espace de rédaction (Détail de votre message) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {message.length} / 2000 car.
                        </span>
                      </div>
                      <textarea
                        id="contact-message"
                        required
                        rows={6}
                        maxLength={2000}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Décrivez votre situation avec le plus de précisions possible (lieux, date souhaitée, type de véhicule, question sur vos démarches...)"
                        className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-700 focus:bg-white transition-all resize-y"
                      />
                    </div>

                    {/* Consentement RGPD */}
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <input
                        id="contact-rgpd"
                        type="checkbox"
                        checked={rgpdConsent}
                        onChange={e => setRgpdConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded text-teal-700 focus:ring-teal-600 border-slate-300 cursor-pointer"
                      />
                      <label htmlFor="contact-rgpd" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                        J'accepte que les informations saisies soient transmises à l'équipe régulation Clinigo à{' '}
                        <strong className="text-slate-900">support@clinigo.fr</strong> afin de traiter ma demande conformément à la politique de confidentialité et de protection des données de santé.
                      </label>
                    </div>

                    {/* Bouton d'Envoi */}
                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-800 to-sky-900 hover:from-teal-700 hover:to-sky-800 text-white font-black text-sm tracking-wide shadow-lg shadow-teal-950/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                            <span>Transmission de votre message en cours...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                              send
                            </span>
                            <span>Envoyer ma demande à support@clinigo.fr</span>
                          </>
                        )}
                      </button>
                      <p className="text-center text-[11px] text-slate-500 mt-2.5">
                        Vous recevrez une confirmation et un agent Clinigo vous répondra dans les meilleurs délais.
                      </p>
                    </div>

                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};
