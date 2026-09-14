import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { whatsappService } from '../services/whatsappService';

export const ConfirmationPage: React.FC = () => {
  const { ref } = useParams<{ ref: string }>();
  const reservationRef = ref || 'MT-972-8821';

  const [bookingData, setBookingData] = useState<any>(null);
  const [storedDoc, setStoredDoc] = useState<any>(null);
  const [showDocModal, setShowDocModal] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    try {
      const rawBooking = localStorage.getItem('medictrans_last_booking');
      if (rawBooking) {
        setBookingData(JSON.parse(rawBooking));
      }
      const rawDoc = localStorage.getItem('booking_pmt_document');
      if (rawDoc) {
        setStoredDoc(JSON.parse(rawDoc));
      }
    } catch {
      // ignore
    }

    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#004479', '#006A61', '#86F2E4', '#D2E4FF'],
      });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary flex flex-col">
      <SEOHead
        title={`Réservation Confirmée #${reservationRef} | Médic'Trans 972`}
        description="Votre demande de transport médicalisé en Martinique a été confirmée et transmise à la flotte de régulation."
        noIndex={true}
      />
      <Header />

      <main className="w-full pt-20 bg-background flex-1">
        <div className="flex flex-col w-full">
          <div className="max-w-[1280px] w-full mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-md lg:py-space-xl flex flex-col gap-space-lg">
            {/* Step progress bar */}
            <section className="bg-surface-container-lowest rounded-2xl shadow-xs p-space-md md:p-space-lg border border-outline-variant/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-sm w-full md:w-auto">
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">check</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider text-xs">
                      Étape 01
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                      Trajet validé
                    </span>
                  </div>
                </div>

                <div className="hidden md:block h-0.5 flex-1 mx-space-md bg-secondary/30 rounded-full"></div>

                <div className="flex items-center gap-space-sm w-full md:w-auto">
                  <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">check</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider text-xs">
                      Étape 02
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                      Patient &amp; PMT
                    </span>
                  </div>
                </div>

                <div className="hidden md:block h-0.5 flex-1 mx-space-md bg-secondary/30 rounded-full"></div>

                <div className="flex items-center gap-space-sm w-full md:w-auto">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md animate-pulse">
                    <span className="material-symbols-outlined text-[20px]">task_alt</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider text-xs">
                      Étape 03
                    </span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold text-sm">
                      Confirmation active
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Confirmation Banner */}
            <section className="bg-gradient-to-r from-primary via-primary-container to-primary text-on-primary rounded-2xl p-space-md md:p-space-lg shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md relative overflow-hidden">
              <div className="flex items-start gap-space-md relative z-10">
                <div className="p-space-sm bg-white/15 rounded-2xl backdrop-blur-md">
                  <span className="material-symbols-outlined text-[40px] text-secondary-fixed">
                    verified
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm bg-secondary px-2.5 py-0.5 rounded-full text-on-secondary font-bold tracking-wider uppercase text-[11px]">
                      Dossier Validé
                    </span>
                    <span className="font-label-sm text-label-sm text-surface-container-high tracking-wider text-xs">
                      Plateforme ARS 972
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-primary mt-1 font-bold text-2xl md:text-3xl">
                    Demande n° {reservationRef} enregistrée avec succès !
                  </h1>
                  <p className="font-body-sm text-body-sm text-surface-variant max-w-2xl mt-0.5 text-xs md:text-sm">
                    Le dossier médical et les garanties de couverture subrogatoire CPAM ont été
                    télétransmis au serveur de dispatch territorial.
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest/15 backdrop-blur-md rounded-xl p-space-sm flex items-center gap-space-sm self-stretch md:self-auto relative z-10 shadow-sm border border-white/20">
                <div className="w-3 h-3 rounded-full bg-secondary-fixed animate-ping"></div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-surface-container-high uppercase text-[10px]">
                    Régulation live
                  </span>
                  <span className="font-label-md text-label-md text-on-primary font-bold text-xs">
                    Centre 15 &amp; Médic'Trans
                  </span>
                </div>
              </div>
            </section>

            {/* Broadcast network status bar */}
            <div className="bg-surface-container-high rounded-2xl p-space-md shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md border border-outline-variant/30">
              <div className="flex items-center gap-space-sm">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/10">
                  <span className="material-symbols-outlined text-[28px] text-secondary">
                    {bookingData?.isDirectRequest ? 'local_fire_department' : 'broadcast_on_personal'}
                  </span>
                  <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${bookingData?.isDirectRequest ? 'bg-amber-600 animate-ping' : 'bg-secondary'}`}></span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold text-[10px]">
                    {bookingData?.isDirectRequest ? 'Demande Directe Nominative (Priorité 24h)' : 'Réseau Opérationnel Martinique'}
                  </span>
                  <p className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                    {bookingData?.isDirectRequest ? (
                      <>
                        Demande adressée à <span className="text-amber-700 font-bold">{bookingData.targetTransporterName || 'votre transporteur sélectionné'}</span>
                      </>
                    ) : (
                      <>
                        Demande diffusée à <span className="text-primary font-bold">18 transporteurs sanitaires agréés</span>
                      </>
                    )}
                  </p>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                    {bookingData?.isDirectRequest
                      ? 'Délai d\'acceptation de 24h00 • Rebasculement automatique au pot commun garanti en cas d\'indisponibilité'
                      : 'Zone prioritaire : Secteur Fort-de-France / Le Lamentin / Schoelcher'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-2 rounded-xl shadow-xs border border-outline-variant/20">
                <span className="material-symbols-outlined text-[20px] text-secondary animate-spin">
                  sync
                </span>
                <span className="font-label-sm text-label-sm text-on-surface font-bold text-xs">
                  {bookingData?.isDirectRequest ? 'En attente acceptation (24h)' : 'Attribution en cours (1/18)'}
                </span>
              </div>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* Left col: Patient & Route */}
              <div className="lg:col-span-8 flex flex-col gap-space-lg">
                {/* Beneficiary */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
                  <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[24px] text-primary">
                        person
                      </span>
                      <h2 className="font-headline-md text-headline-md text-on-surface font-bold text-base">
                        Bénéficiaire du transport
                      </h2>
                    </div>
                    <span className="bg-secondary-container/40 text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span> ALD 100% Exonérante
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-md">
                    <div className="flex flex-col p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px]">
                        Identité Patient
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                        {bookingData?.patientName || 'Aimé GLISSANT'}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        {bookingData?.phone ? `Tél : +596 ${bookingData.phone}` : '70 ans (Né le 12/04/1954)'}
                      </span>
                    </div>

                    <div className="flex flex-col p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px]">
                        N° Sécurité Sociale (NIR)
                      </span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface tracking-wide text-xs font-mono">
                        {bookingData?.nir || '1 54 08 97 213 456'}
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary font-bold text-xs">
                        Régime Général - CGSS 972
                      </span>
                    </div>

                    <div className="flex flex-col p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px]">
                        Type de véhicule prescrit
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px] text-primary">
                          directions_car
                        </span>
                        <span className="font-headline-sm text-headline-sm text-primary font-bold text-sm capitalize">
                          {bookingData?.transportType
                            ? bookingData.transportType === 'taxi'
                              ? 'Taxi Conventionné'
                              : bookingData.transportType === 'ambulance'
                              ? 'Ambulance A/C'
                              : 'VSL Sanitaire Léger'
                            : 'VSL Conventionné'}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Trajet Aller &amp; Retour
                      </span>
                    </div>
                  </div>
                </div>

                {/* Route Details */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
                  <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-[24px] text-primary">route</span>
                      <h2 className="font-headline-md text-headline-md text-on-surface font-bold text-base">
                        Détails de l'itinéraire sanitaire
                      </h2>
                    </div>
                    <span className="font-label-md text-label-md text-primary font-bold bg-surface-container-high px-3 py-1 rounded-lg text-xs">
                      {bookingData?.transportDate || 'Mardi 24 Octobre 2024'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between p-space-sm bg-surface-container-low rounded-xl gap-space-sm border border-outline-variant/20">
                    <div className="flex items-center gap-space-sm">
                      <div className="p-2 rounded-lg bg-primary text-on-primary">
                        <span className="material-symbols-outlined text-[20px]">alarm</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px]">
                          Rendez-vous médical sur place
                        </span>
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                          {bookingData?.appointmentTime || bookingData?.transportTime || '09h00'}
                        </span>
                      </div>
                    </div>

                    <div className="h-6 w-px bg-surface-variant hidden sm:block"></div>

                    <div className="flex items-center gap-space-sm">
                      <div className="p-2 rounded-lg bg-secondary text-on-secondary">
                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px]">
                          Prise en charge à domicile
                        </span>
                        <span className="font-headline-sm text-headline-sm text-secondary font-bold text-sm">
                          Calculée et confirmée par le transporteur
                        </span>
                      </div>
                    </div>
                  </div>

                  {bookingData?.isRecurring && bookingData?.recurringDates && bookingData.recurringDates.length > 0 && (
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="material-symbols-outlined text-sm">event_repeat</span>
                        <span>Transport Récurrent ({bookingData.recurringDates.length} séances programmées)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {bookingData.recurringDates.map((dateStr: string, idx: number) => (
                          <span key={dateStr} className="px-2 py-0.5 rounded-lg bg-white border border-purple-300 text-[11px] font-semibold text-purple-800">
                            Séance {idx + 1} : {dateStr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="p-space-md bg-surface-container-low/60 rounded-xl flex flex-col justify-between gap-space-sm border border-outline-variant/20">
                      <div className="flex items-start gap-space-sm">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold shadow-xs">
                          <span className="material-symbols-outlined text-[18px]">home_pin</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-primary font-bold uppercase text-[10px]">
                            Lieu de départ (Prise en charge)
                          </span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface text-sm">
                            {bookingData?.pickupAddress || 'Résidence Les Alizés, Bat C'}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                            Martinique 972
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-on-surface-variant bg-surface-container-lowest px-2 py-1 rounded w-fit border border-outline-variant/30">
                        Rez-de-chaussée / Sans obstacle
                      </span>
                    </div>

                    <div className="p-space-md bg-surface-container-low/60 rounded-xl flex flex-col justify-between gap-space-sm border border-outline-variant/20">
                      <div className="flex items-start gap-space-sm">
                        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-secondary font-bold shadow-xs">
                          <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-label-sm text-secondary font-bold uppercase text-[10px]">
                            Établissement d'accueil
                          </span>
                          <span className="font-label-lg text-label-lg font-bold text-on-surface text-sm">
                            {bookingData?.destinationFacility || 'CHU Pierre Zobda-Quitman'}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                            Entrée VSL &amp; Ambulances
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-secondary font-semibold bg-surface-container-lowest px-2 py-1 rounded w-fit border border-outline-variant/30">
                        Dépose minute réservée
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card PMT Document Téléversé */}
                {(storedDoc || bookingData?.uploadedPmtDoc) && (
                  <div className="bg-surface-container-lowest rounded-2xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-sm border border-outline-variant/30 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[24px] text-primary">
                          description
                        </span>
                        <h2 className="font-headline-md text-headline-md text-on-surface font-bold text-base">
                          Prescription Médicale de Transport (PMT)
                        </h2>
                      </div>
                      <span className="bg-secondary-container/40 text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span> Télétransmis HDS
                      </span>
                    </div>

                    <div className="p-space-md bg-surface-container-low rounded-xl flex items-center justify-between gap-space-sm border border-outline-variant/20">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-2xl">
                            {(storedDoc || bookingData?.uploadedPmtDoc)?.type?.includes('pdf')
                              ? 'picture_as_pdf'
                              : 'image'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-on-surface">
                            {(storedDoc || bookingData?.uploadedPmtDoc)?.name || 'PMT_Cerfa_S3138.pdf'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {storedDoc
                              ? `${(storedDoc.size / (1024 * 1024)).toFixed(2)} MB · Téléversé le ${new Date(
                                  storedDoc.uploadedAt
                                ).toLocaleDateString('fr-FR')}`
                              : '1.24 MB · Certificat médical d’ALD téléversé'}
                          </span>
                        </div>
                      </div>

                      {(storedDoc || bookingData?.uploadedPmtDoc)?.dataUrl && (
                        <button
                          type="button"
                          onClick={() => setShowDocModal(true)}
                          className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-primary hover:bg-surface-variant font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Consulter</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Col: Actions & Contact */}
              <aside className="lg:col-span-4 flex flex-col gap-space-md">
                {/* WhatsApp Automation Direct Trigger Card */}
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-space-md shadow-xs flex flex-col gap-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-emerald-900 font-bold uppercase text-[10px]">
                        Canal WhatsApp Médic'Trans
                      </span>
                      <span className="font-headline-sm text-headline-sm text-emerald-950 font-bold text-xs">
                        Récapitulatif &amp; Suivi en direct
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Recevez immédiatement le récapitulatif de votre course et les alertes d'approche du véhicule sur WhatsApp.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const phoneToUse = bookingData?.whatsappPhone || bookingData?.phone || '06 96 44 20 18';
                      whatsappService.openWhatsAppDirect(
                        phoneToUse,
                        'BOOKING_CONFIRMATION',
                        {
                          patientName: bookingData?.patientName || 'Aimé GLISSANT',
                          bookingRef: reservationRef,
                          pickupAddress: bookingData?.pickupAddress || 'Résidence Les Alizés, Schoelcher',
                          facilityName: bookingData?.destinationFacility || 'CHU Pierre Zobda-Quitman',
                          transportType: (bookingData?.transportType || 'vsl').toUpperCase(),
                          pickupTime: bookingData?.transportTime || '08:30',
                          pickupDate: bookingData?.transportDate || '2026-10-24',
                        }
                      );
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition-all shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    <span>Ouvrir ma confirmation sur WhatsApp</span>
                  </button>
                </div>

                {/* Live Tracking Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
                  <div className="flex items-center gap-space-sm">
                    <img
                      src="/assets/step3_care.jpg"
                      alt="Chauffeur sanitaire"
                      className="w-12 h-12 rounded-full object-cover shadow-xs ring-2 ring-secondary/30"
                    />
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-secondary font-bold uppercase text-[10px]">
                        Régulation Active
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                        Notification SMS &amp; WhatsApp
                      </span>
                    </div>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                    Un lien contenant la géolocalisation en temps réel de votre véhicule sera envoyé au{' '}
                    <strong className="text-on-surface">
                      {bookingData?.whatsappPhone || bookingData?.phone || '06 96 44 20 18'}
                    </strong>{' '}
                    20 minutes avant le départ.
                  </p>

                  <Link
                    to="/suivi"
                    className="w-full py-3.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
                  >
                    <span className="material-symbols-outlined text-lg">alt_route</span>
                    <span>Accéder au Suivi en Direct</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full py-3 bg-surface-container text-primary hover:bg-surface-container-high rounded-xl font-label-md text-label-md font-bold flex items-center justify-center gap-2 transition-all text-xs border border-outline-variant/30"
                  >
                    <span className="material-symbols-outlined text-base">print</span>
                    <span>Imprimer la confirmation (Volet Patient)</span>
                  </button>
                </div>

                {/* CPAM Summary Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex flex-col gap-space-sm border border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-bold text-xs">
                      Tiers Payant CPAM Martinique
                    </span>
                    <span className="text-secondary font-bold text-xs">Pris en charge à 100%</span>
                  </div>
                  <div className="text-xs text-on-surface-variant flex flex-col gap-1 border-t border-outline-variant/20 pt-2">
                    <div className="flex justify-between">
                      <span>Régime de sécurité sociale :</span>
                      <span className="font-semibold text-on-surface">CGSS 972</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reste à payer :</span>
                      <span className="font-bold text-secondary text-sm">0,00 €</span>
                    </div>
                  </div>
                </div>

                {/* Contact Helpline */}
                <div className="bg-surface-container-low rounded-2xl p-space-md flex flex-col gap-1.5 border border-outline-variant/30">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <span className="material-symbols-outlined text-base">support_agent</span>
                    <span>Assistance téléphonique 24/7</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Besoin de modifier ou d'annuler votre réservation ?
                  </p>
                  <a
                    href="tel:0596720097"
                    className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                    05 96 72 00 97
                  </a>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {/* Document Modal Preview */}
        {showDocModal && (storedDoc || bookingData?.uploadedPmtDoc) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b border-outline-variant/20 bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <span className="font-bold text-sm text-on-surface">
                    {(storedDoc || bookingData?.uploadedPmtDoc)?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-surface-container-lowest">
                {(storedDoc || bookingData?.uploadedPmtDoc)?.type?.includes('pdf') ? (
                  <iframe
                    src={(storedDoc || bookingData?.uploadedPmtDoc)?.dataUrl}
                    title="Aperçu PDF Cerfa PMT"
                    className="w-full h-[60vh] rounded-lg border border-outline-variant/20"
                  />
                ) : (
                  <img
                    src={(storedDoc || bookingData?.uploadedPmtDoc)?.dataUrl}
                    alt="Aperçu document PMT"
                    className="max-h-[60vh] max-w-full object-contain rounded-lg border border-outline-variant/20"
                  />
                )}
              </div>
              <div className="p-3 border-t border-outline-variant/20 bg-surface-container-low flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold"
                >
                  Fermer l'aperçu
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
