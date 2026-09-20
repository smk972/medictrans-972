import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../contexts/AuthContext';
import { rideService } from '../services/rideService';
import { Ride } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { extractTime, formatRideDate } from '../utils/dateUtils';

export const ConfirmationPage: React.FC = () => {
  const { ref } = useParams<{ ref: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Déterminer la référence effective de manière synchrone et dynamique
  const reservationRef = useMemo(() => {
    if (ref && ref.trim()) return ref.trim().toUpperCase();
    const queryRef = searchParams.get('ref');
    if (queryRef && queryRef.trim()) return queryRef.trim().toUpperCase();
    try {
      const rawBooking = localStorage.getItem('medictrans_last_booking');
      if (rawBooking) {
        const parsed = JSON.parse(rawBooking);
        if (parsed.ref && typeof parsed.ref === 'string') {
          return parsed.ref.trim().toUpperCase();
        }
      }
    } catch {}
    return 'MT-972-8821';
  }, [ref, searchParams]);

  // Si l'utilisateur est sur /confirmation sans référence explicite dans l'URL, mettre à jour l'URL sans rechargement
  useEffect(() => {
    if (!ref && reservationRef && reservationRef !== 'MT-972-8821') {
      window.history.replaceState(null, '', `/confirmation/${reservationRef}`);
    }
  }, [ref, reservationRef]);

  const [bookingData, setBookingData] = useState<any>(null);
  const [matchedRide, setMatchedRide] = useState<Ride | null>(null);
  const [storedDoc, setStoredDoc] = useState<any>(null);
  const [storedMutuelleDoc, setStoredMutuelleDoc] = useState<any>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showMutuelleDocModal, setShowMutuelleDocModal] = useState(false);
  const [liveStatusToast, setLiveStatusToast] = useState<{
    title: string;
    message: string;
    icon?: string;
  } | null>(null);

  const prevStatusRef = useRef<string | null>(null);
  const isWaitingForAcceptanceRef = useRef<boolean>(false);

  // Déclencheur du rechargement automatique garanti dès acceptation
  const triggerAutoReload = useCallback((reason: string) => {
    const reloadKey = `clinigo_reloaded_accepted_${reservationRef}`;
    if (sessionStorage.getItem(reloadKey)) {
      return;
    }
    console.log(`[ConfirmationPage] ${reason} -> Rechargement automatique immédiat de la page client !`);
    sessionStorage.setItem(reloadKey, 'true');
    sessionStorage.removeItem(`clinigo_waiting_for_acceptance_${reservationRef}`);

    // Signal sonore discret de notification (Web Audio API)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {}

    // Confetti de célébration et signal sonore lors du passage à ACCEPTED
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#059669', '#10B981', '#34D399', '#004479', '#6EE7B7'],
      });
    } catch {}
  }, [reservationRef]);

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
      const rawMutuelleDoc = localStorage.getItem('booking_mutuelle_document');
      if (rawMutuelleDoc) {
        setStoredMutuelleDoc(JSON.parse(rawMutuelleDoc));
      }
    } catch {
      // ignore
    }

    // Charger les informations précises de la course
    async function fetchRideInfo(isInitial = false) {
      try {
        const found = await rideService.getRideByReference(reservationRef);
        if (found) {
          const oldStatus = prevStatusRef.current;
          prevStatusRef.current = found.status;

          // Si la course est encore PENDING, marquer l'attente
          if (found.status === 'PENDING') {
            isWaitingForAcceptanceRef.current = true;
            try {
              sessionStorage.setItem(`clinigo_waiting_for_acceptance_${reservationRef}`, 'true');
              sessionStorage.removeItem(`clinigo_reloaded_accepted_${reservationRef}`);
            } catch {}
          }

          // Détection d'un passage à ACCEPTED depuis un état d'attente
          const wasWaiting = 
            oldStatus === 'PENDING' || 
            isWaitingForAcceptanceRef.current || 
            sessionStorage.getItem(`clinigo_waiting_for_acceptance_${reservationRef}`) === 'true';
          const isNowAccepted = found.status === 'ACCEPTED' || found.status === 'EN_ROUTE' || found.status === 'PICKED_UP';

          if (wasWaiting && isNowAccepted && !sessionStorage.getItem(`clinigo_reloaded_accepted_${reservationRef}`)) {
            sessionStorage.setItem(`clinigo_reloaded_accepted_${reservationRef}`, 'true');
            triggerAutoReload(`Passage d'état en cours: ${oldStatus || 'PENDING'} -> ${found.status}`);
          }

          // Détection d'un changement d'état en direct
          if (oldStatus && oldStatus !== found.status) {
            const tName = found.assignedTransporter?.companyName || 'Ambulances Sanitaires Agréées';
            const dName = found.assignedTransporter?.driverName;

            if (found.status === 'ACCEPTED') {
              setLiveStatusToast({
                title: 'Course validée et attribuée !',
                message: `Votre transporteur ${tName} a validé votre prise en charge${dName ? ` (Chauffeur : ${dName})` : ''}.`,
                icon: 'celebration'
              });
              try {
                confetti({
                  particleCount: 100,
                  spread: 75,
                  origin: { y: 0.5 },
                  colors: ['#059669', '#10B981', '#34D399', '#004479', '#6EE7B7'],
                });
              } catch {}
            } else if (found.status === 'EN_ROUTE') {
              setLiveStatusToast({
                title: 'Chauffeur en route !',
                message: `Votre chauffeur ${dName || 'assigné'} fait route vers votre adresse de départ.`,
                icon: 'directions_car'
              });
            } else if (found.status === 'PICKED_UP') {
              setLiveStatusToast({
                title: 'Prise en charge effectuée',
                message: `Vous êtes bien à bord du véhicule. Trajet en cours vers votre destination.`,
                icon: 'local_hospital'
              });
            } else if (found.status === 'COMPLETED') {
              setLiveStatusToast({
                title: 'Vous êtes arrivé(e) !',
                message: `Votre transport avec ${tName} est terminé. Merci de votre confiance.`,
                icon: 'task_alt'
              });
              try {
                confetti({
                  particleCount: 80,
                  spread: 60,
                  origin: { y: 0.5 },
                  colors: ['#10B981', '#3B82F6', '#6366F1'],
                });
              } catch {}
            } else if (found.status === 'CANCELLED') {
              setLiveStatusToast({
                title: 'Demande de transport annulée',
                message: `Votre demande #${reservationRef} a été annulée.`,
                icon: 'cancel'
              });
              try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtx) {
                  const ctx = new AudioCtx();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(440, ctx.currentTime);
                  osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.1);
                  gain.gain.setValueAtTime(0.2, ctx.currentTime);
                  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 0.35);
                }
              } catch {}
            }
          }

          setMatchedRide(found);
        }
      } catch (err) {
        console.warn('Erreur récupération course:', err);
      }
    }

    fetchRideInfo(true);

    // Initial celebratory confetti
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

    // 1. Abonnement Supabase Realtime (mise à jour fluide en direct sans rechargement de page)
    let channel: any = null;
    if (isSupabaseConfigured() && supabase) {
      channel = supabase
        .channel(`confirmation_ride_${reservationRef}_${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rides' },
          (payload: any) => {
            const updatedRef = (payload.new?.reference || payload.old?.reference || '').toUpperCase();
            if (!updatedRef || updatedRef === reservationRef.toUpperCase()) {
              fetchRideInfo();
            }
          }
        )
        .subscribe();
    }

    // 2. BroadcastChannel inter-onglets (mise à jour instantanée en direct)
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('clinigo_rides_channel');
        bc.onmessage = (event) => {
          if (event.data?.reference && event.data.reference.toUpperCase() === reservationRef.toUpperCase()) {
            fetchRideInfo();
          }
        };
      } catch {}
    }

    // 3. Écouteur Storage Event (inter-onglets universel)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'clinigo_last_ride_update' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.reference && parsed.reference.toUpperCase() === reservationRef.toUpperCase()) {
            fetchRideInfo();
          }
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);

    // 4. Écouteur événement local CustomEvent
    const onLocalStatusUpdate = (e: any) => {
      if (e.detail?.reference && e.detail.reference.toUpperCase() === reservationRef.toUpperCase()) {
        fetchRideInfo();
      }
    };
    window.addEventListener('clinigo_ride_status_updated', onLocalStatusUpdate);

    // 5. Polling de précaution discret (toutes les 6 secondes, en tâche de fond)
    const pollInterval = setInterval(() => {
      fetchRideInfo();
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('clinigo_ride_status_updated', onLocalStatusUpdate);
      if (bc) {
        bc.close();
      }
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [reservationRef, triggerAutoReload]);

  // Données dynamiques du bénéficiaire
  const displayPatientName =
    (matchedRide?.patient ? `${matchedRide.patient.firstName} ${matchedRide.patient.lastName}`.trim() : null) ||
    bookingData?.patientName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
    'Dossier Bénéficiaire Pris en Charge';

  const displayPhone =
    matchedRide?.patient?.phone ||
    bookingData?.phone ||
    user?.phone ||
    'Non renseigné';

  const displayEmail =
    matchedRide?.patient?.email ||
    bookingData?.email ||
    user?.email ||
    '';

  const displayNir =
    matchedRide?.patient?.nir ||
    bookingData?.nir ||
    user?.nir ||
    'Prise en charge ALD 100%';

  const displayPickup =
    matchedRide?.pickupAddress ||
    bookingData?.pickupAddress ||
    user?.address ||
    'Adresse de prise en charge';

  const displayDestination =
    matchedRide?.facilityName ||
    matchedRide?.dropoffAddress ||
    bookingData?.destinationFacility ||
    'Établissement Hospitalier';

  const displayDate =
    formatRideDate(matchedRide?.pickupDateTime || bookingData?.transportDate) ||
    'Aujourd’hui';

  const displayTime =
    bookingData?.transportTime ||
    matchedRide?.appointmentTime ||
    bookingData?.appointmentTime ||
    (matchedRide?.pickupDateTime ? extractTime(matchedRide.pickupDateTime) : null) ||
    '08:30';

  const displayTransportType =
    matchedRide?.transportType ||
    bookingData?.transportType ||
    'vsl';

  // Détection du département CPAM / CGSS
  const fullAddress = `${displayPickup} ${displayDestination}`;
  const postalMatch = fullAddress.match(/\b(97\d|2[AB]|\d{2})\d{3}\b/)?.[1];
  const userDept = user?.postalCode?.startsWith('97') ? user.postalCode.slice(0, 3) : user?.postalCode?.slice(0, 2);
  const detectedDept = postalMatch || userDept || '972';
  const displayRegime =
    detectedDept === '972' ? 'Régime Général - CGSS Martinique' :
    detectedDept === '971' ? 'Régime Général - CGSS Guadeloupe' :
    detectedDept === '973' ? 'Régime Général - CGSS Guyane' :
    detectedDept === '974' ? 'Régime Général - CGSS Réunion' :
    detectedDept === '976' ? 'Régime Général - CSS Mayotte' :
    `Assurance Maladie - CPAM (${detectedDept})`;

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary flex flex-col">
      <SEOHead
        title={`Réservation Confirmée #${reservationRef} | Clinigo`}
        description="Votre demande de transport médicalisé Clinigo a été confirmée et transmise à la flotte de régulation."
        noIndex={true}
      />
      <Header />

      <main className="w-full pt-4 sm:pt-6 bg-background flex-1">
        <div className="flex flex-col w-full">
          <div className="max-w-[1280px] w-full mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-md lg:py-space-xl flex flex-col gap-space-lg">
            {/* Alerte temps réel lors de l'évolution du statut de la course sous les yeux du client */}
            {liveStatusToast && (
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 rounded-3xl shadow-xl border-2 border-emerald-300 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl text-emerald-100">{liveStatusToast.icon || 'notifications_active'}</span>
                  </div>
                  <div>
                    <div className="font-black text-base sm:text-lg flex items-center gap-2">
                      <span>{liveStatusToast.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-white text-emerald-800">En direct</span>
                    </div>
                    <div className="text-xs sm:text-sm text-emerald-100 font-medium">
                      {liveStatusToast.message}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setLiveStatusToast(null)}
                  className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all shrink-0"
                >
                  Fermer
                </button>
              </div>
            )}

            {/* Step progress bar */}
            <section className="bg-white rounded-3xl shadow-sm p-4 md:p-6 border border-slate-200/80 card-silky-subtle">
              <div className="flex flex-col md:flex-row items-center justify-between gap-space-md">
                <div className="flex items-center gap-space-sm w-full md:w-auto">
                  <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-teal-700 uppercase font-bold tracking-wider">
                      Étape 01
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Trajet validé
                    </span>
                  </div>
                </div>

                <div className="hidden md:block h-0.5 flex-1 mx-space-md bg-teal-600/30 rounded-full"></div>

                <div className="flex items-center gap-space-sm w-full md:w-auto">
                  <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-teal-700 uppercase font-bold tracking-wider">
                      Étape 02
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Patient &amp; PMT
                    </span>
                  </div>
                </div>

                <div className="hidden md:block h-0.5 flex-1 mx-space-md bg-teal-600/30 rounded-full"></div>

                <div className="flex items-center gap-space-sm w-full md:w-auto">
                  <div className={`w-9 h-9 rounded-full ${
                    matchedRide?.status === 'CANCELLED'
                      ? 'bg-red-600 text-white shadow-xs'
                      : matchedRide?.status === 'ACCEPTED' || matchedRide?.status === 'EN_ROUTE' || matchedRide?.status === 'PICKED_UP' || matchedRide?.status === 'COMPLETED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white shadow-sm animate-pulse'
                  } flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[18px]">
                      {matchedRide?.status === 'CANCELLED'
                        ? 'close'
                        : matchedRide?.status === 'ACCEPTED' || matchedRide?.status === 'EN_ROUTE' || matchedRide?.status === 'PICKED_UP' || matchedRide?.status === 'COMPLETED'
                        ? 'check'
                        : 'task_alt'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[11px] uppercase font-bold tracking-wider ${
                      matchedRide?.status === 'CANCELLED'
                        ? 'text-red-700 font-extrabold'
                        : matchedRide?.status === 'ACCEPTED' || matchedRide?.status === 'EN_ROUTE' || matchedRide?.status === 'PICKED_UP' || matchedRide?.status === 'COMPLETED'
                        ? 'text-emerald-700 font-extrabold'
                        : 'text-slate-900'
                    }`}>
                      Étape 03
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {matchedRide?.status === 'CANCELLED'
                        ? 'Course Annulée'
                        : matchedRide?.status === 'EN_ROUTE'
                        ? 'Chauffeur en approche'
                        : matchedRide?.status === 'PICKED_UP'
                        ? 'Trajet en cours'
                        : matchedRide?.status === 'COMPLETED'
                        ? 'Arrivé à destination'
                        : matchedRide?.status === 'ACCEPTED'
                        ? 'Prise en charge confirmée'
                        : 'Régulation & Confirmation'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Mention d'information Email de confirmation & Dossier Spam */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/80 dark:bg-amber-950/30 border-2 border-amber-300/80 dark:border-amber-700/50 rounded-3xl p-4 sm:p-5 shadow-sm flex items-start gap-3.5 animate-fadeIn">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-2xl">mark_email_read</span>
              </div>
              <div className="flex-1 text-xs sm:text-sm">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <strong className="text-amber-950 dark:text-amber-100 font-bold text-sm">
                    E-mail de confirmation et suivi expédié
                  </strong>
                  {displayEmail && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-semibold">
                      {displayEmail}
                    </span>
                  )}
                </div>
                <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed text-xs sm:text-[13px]">
                  Un courriel officiel contenant le récapitulatif de votre transport et votre lien direct de suivi vient de vous être adressé.<br className="hidden sm:inline" />
                  <strong>Conseil utile :</strong> Si vous ne le voyez pas dans votre boîte de réception d'ici 1 à 2 minutes, <strong>pensez à vérifier votre dossier Spam ou Courrier indésirable</strong> et à marquer le message comme légitime.
                </p>
              </div>
            </div>

            {/* Top Banner Success / Status / Cancellation */}
            {matchedRide?.status === 'CANCELLED' ? (
              <section className="relative overflow-hidden bg-gradient-to-r from-red-950 via-red-900 to-rose-950 text-white rounded-3xl p-space-lg md:p-space-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border-2 border-red-500/40 animate-fadeIn">
                <div className="relative z-10 flex flex-col gap-space-xs max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full font-label-sm text-label-sm font-black uppercase tracking-wider text-xs shadow-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">cancel</span>
                      Demande de transport annulée
                    </span>
                    <span className="font-mono font-bold text-white/90 text-sm">
                      #{reservationRef}
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-xl sm:text-2xl md:text-3xl text-white">
                    Cette course a été annulée
                  </h1>
                  <p className="font-body-md text-body-md text-red-100 max-w-xl text-xs sm:text-sm leading-relaxed">
                    Votre demande de transport médicalisé N° <strong>#{reservationRef}</strong> a bien été annulée. Aucun frais n'est engagé et votre Prescription Médicale de Transport (Cerfa S3138) reste disponible pour une prochaine réservation.
                  </p>
                  {matchedRide.mobility?.notes && matchedRide.mobility.notes.includes('[ANNULATION]:') && (
                    <div className="mt-2 p-3 rounded-xl bg-black/30 border border-red-400/40 text-xs text-red-100 flex items-start gap-2">
                      <span className="material-symbols-outlined text-base text-red-300 shrink-0 mt-0.5">info</span>
                      <div>
                        <strong className="text-white">Motif de l'annulation :</strong> {matchedRide.mobility.notes.split('[ANNULATION]:')[1]?.trim()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full md:w-auto shrink-0">
                  <Link
                    to="/reserver"
                    className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white text-red-950 font-bold text-xs sm:text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-red-700">calendar_add_on</span>
                    <span>Effectuer une nouvelle réservation</span>
                  </Link>
                </div>
              </section>
            ) : matchedRide?.status === 'ACCEPTED' || matchedRide?.status === 'EN_ROUTE' || matchedRide?.status === 'PICKED_UP' || matchedRide?.status === 'COMPLETED' ? (
              <section className="relative overflow-hidden bg-gradient-to-r from-[#002D52] via-[#004D40] to-[#065F46] text-white rounded-3xl p-space-lg md:p-space-xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border border-emerald-500/30">
                <div className="relative z-10 flex flex-col gap-space-xs max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-400 text-emerald-950 px-3 py-1 rounded-full font-label-sm text-label-sm font-black uppercase tracking-wider text-xs shadow-xs">
                      {matchedRide.status === 'EN_ROUTE' ? '🚗 Chauffeur en approche' :
                       matchedRide.status === 'PICKED_UP' ? '🏥 Trajet en cours' :
                       matchedRide.status === 'COMPLETED' ? '✅ Arrivé à destination' :
                       '✓ Transporteur Confirmé'}
                    </span>
                    <span className="font-mono font-bold text-white/90 text-sm">
                      #{reservationRef}
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-xl sm:text-2xl md:text-3xl text-white">
                    {matchedRide.status === 'EN_ROUTE' ? 'Votre chauffeur est en route !' :
                     matchedRide.status === 'PICKED_UP' ? 'Prise en charge effectuée' :
                     matchedRide.status === 'COMPLETED' ? 'Vous êtes bien arrivé(e)' :
                     'Votre transporteur est confirmé !'}
                  </h1>
                  <p className="font-body-md text-body-md text-emerald-100 max-w-xl text-xs sm:text-sm">
                    {matchedRide.status === 'EN_ROUTE'
                      ? `Votre chauffeur ${matchedRide.assignedTransporter?.driverName || 'assigné'} fait route vers votre adresse de départ à bord du véhicule ${matchedRide.assignedTransporter?.vehiclePlate || ''}.`
                      : matchedRide.status === 'PICKED_UP'
                      ? `Votre trajet se poursuit vers ${displayDestination} en toute sécurité.`
                      : matchedRide.status === 'COMPLETED'
                      ? `Votre transport médicalisé avec ${matchedRide.assignedTransporter?.companyName || 'votre transporteur'} est terminé.`
                      : `Votre course a été prise en charge par ${matchedRide?.assignedTransporter?.companyName || 'Ambulances Sanitaires Agréées'}. Le véhicule et l'équipage sont officiellement réservés.`}
                  </p>
                </div>

                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-space-sm sm:p-4 flex items-center gap-space-sm self-stretch md:self-auto relative z-10 shadow-sm border border-white/20">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-emerald-200 uppercase text-[10px] font-bold">
                      Statut Mission
                    </span>
                    <span className="font-label-md text-label-md text-white font-black text-xs sm:text-sm">
                      {matchedRide.status === 'EN_ROUTE' ? 'En Approche' :
                       matchedRide.status === 'PICKED_UP' ? 'Patient à bord' :
                       matchedRide.status === 'COMPLETED' ? 'Terminé' :
                       'Transporteur Confirmé'}
                    </span>
                  </div>
                </div>
              </section>
            ) : (
              <section className="relative overflow-hidden bg-primary text-on-primary rounded-3xl p-space-lg md:p-space-xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
                <div className="relative z-10 flex flex-col gap-space-xs max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-secondary text-on-secondary px-3 py-1 rounded-full font-label-sm text-label-sm font-bold uppercase tracking-wider text-xs">
                      Réservation Confirmée
                    </span>
                    <span className="font-mono font-bold text-on-primary/90 text-sm">
                      #{reservationRef}
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-xl sm:text-2xl md:text-3xl text-white">
                    Votre demande de transport est validée
                  </h1>
                  <p className="font-body-md text-body-md text-on-primary-container max-w-xl text-xs sm:text-sm text-white/90">
                    La demande a été transmise aux transporteurs sanitaires conventionnés du secteur.
                    Vous recevrez une alerte dès qu'un chauffeur valide votre prise en charge.
                  </p>
                </div>

                <div className="bg-surface-container-lowest/15 backdrop-blur-md rounded-xl p-space-sm flex items-center gap-space-sm self-stretch md:self-auto relative z-10 shadow-sm border border-white/20">
                  <div className="w-3 h-3 rounded-full bg-secondary-fixed animate-ping"></div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-surface-container-high uppercase text-[10px]">
                      Régulation active
                    </span>
                    <span className="font-label-md text-label-md text-on-primary font-bold text-xs">
                      Dispatch Sanitaire Clinigo
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Carte Détaillée du Transporteur Assigné OU Alerte Annulation OU Barre En attente */}
            {matchedRide?.status === 'CANCELLED' ? (
              <div className="bg-red-50/80 dark:bg-red-950/30 rounded-3xl p-6 sm:p-7 border-2 border-red-300 dark:border-red-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">event_busy</span>
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-200 text-red-950 inline-block mb-1">
                      Statut : Annulée
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-red-950 dark:text-red-100">
                      Ce transport sanitaire ne sera pas réalisé
                    </h3>
                    <p className="text-xs text-red-800 dark:text-red-300 mt-0.5">
                      Besoin d'aide ou de réorganiser votre rendez-vous ? Notre équipe reste à votre écoute par e-mail à <strong>support@clinigo.fr</strong>.
                    </p>
                  </div>
                </div>
                <a
                  href={`mailto:support@clinigo.fr?subject=${encodeURIComponent(`Assistance transport #${reservationRef}`)}`}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-red-50 shrink-0"
                >
                  <span className="material-symbols-outlined text-base text-red-600">mail</span>
                  <span>support@clinigo.fr</span>
                </a>
              </div>
            ) : matchedRide?.status === 'ACCEPTED' || matchedRide?.status === 'EN_ROUTE' || matchedRide?.status === 'PICKED_UP' || matchedRide?.status === 'COMPLETED' ? (
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-400/90 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
                    <span className="material-symbols-outlined text-3xl">airport_shuttle</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900">
                        Transporteur Conventionné Assigné
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                        Prise en charge active
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {matchedRide?.assignedTransporter?.companyName || 'Ambulances Conventionnées Clinigo'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-slate-700 mt-0.5">
                      <span className="flex items-center gap-1.5 font-medium bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        <span className="material-symbols-outlined text-base text-emerald-700">person</span>
                        Chauffeur : <strong className="text-slate-900">{matchedRide?.assignedTransporter?.driverName || 'Chauffeur Régulé'}</strong>
                      </span>
                      {matchedRide?.assignedTransporter?.vehiclePlate && (
                        <span className="flex items-center gap-1.5 font-mono bg-white px-2.5 py-1 rounded-lg border border-emerald-300 font-bold text-slate-900 shadow-2xs">
                          <span className="material-symbols-outlined text-sm text-emerald-700">directions_car</span>
                          {matchedRide.assignedTransporter.vehiclePlate}
                        </span>
                      )}
                      {matchedRide?.assignedTransporter?.driverPhone && (
                        <a
                          href={`tel:${matchedRide.assignedTransporter.driverPhone}`}
                          className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">call</span>
                          {matchedRide.assignedTransporter.driverPhone}
                        </a>
                      )}
                      {matchedRide?.assignedTransporter?.etaMinutes && (
                        <span className="flex items-center gap-1 text-xs text-emerald-800 font-bold bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          Arrivée estimée : {matchedRide.assignedTransporter.etaMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                  <Link
                    to={`/suivi?ref=${reservationRef}`}
                    className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-xl">gps_fixed</span>
                    <span>Suivre mon chauffeur en direct</span>
                  </Link>
                </div>
              </div>
            ) : (
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
                      {bookingData?.isDirectRequest ? 'Continuité des Soins (Priorité 24h)' : 'Réseau Sanitaire Opérationnel'}
                    </span>
                    <p className="font-headline-sm text-headline-sm text-on-surface font-semibold text-sm">
                      {bookingData?.isDirectRequest ? (
                        <>
                          Demande adressée en priorité à <span className="text-amber-700 font-bold">{bookingData.targetTransporterName || 'votre transporteur habituel'}</span>
                        </>
                      ) : (
                        <>
                          Demande diffusée aux <span className="text-primary font-bold">transporteurs sanitaires conventionnés</span>
                        </>
                      )}
                    </p>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                      {bookingData?.isDirectRequest
                        ? 'Délai prioritaire de 24h00 pour votre transporteur habituel • Rebasculement automatique garanti au pot commun en cas d\'indisponibilité'
                        : 'Attribution automatique par proximité et disponibilité de flotte'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-2 rounded-xl shadow-xs border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[20px] text-secondary animate-spin">
                    sync
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface font-bold text-xs">
                    {bookingData?.isDirectRequest ? 'En attente acceptation (24h)' : 'Attribution en cours'}
                  </span>
                </div>
              </div>
            )}

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
                        {displayPatientName}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        {displayPhone ? `Tél : ${displayPhone}` : (displayEmail || 'Dossier certifié')}
                      </span>
                    </div>

                    <div className="flex flex-col p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase text-[10px]">
                        N° Sécurité Sociale (NIR)
                      </span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface tracking-wide text-xs font-mono">
                        {displayNir}
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary font-bold text-xs">
                        {displayRegime}
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
                          {displayTransportType === 'taxi'
                            ? 'Taxi Conventionné'
                            : displayTransportType === 'ambulance'
                            ? 'Ambulance A/C'
                            : 'VSL Sanitaire Léger'}
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
                    <span className="font-label-md text-label-md text-primary font-bold bg-surface-container-high px-3 py-1 rounded-lg text-xs capitalize">
                      {displayDate}
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
                          {displayTime}
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
                            {displayPickup}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-on-surface-variant bg-surface-container-lowest px-2 py-1 rounded w-fit border border-outline-variant/30">
                        Prise en charge au domicile
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
                            {displayDestination}
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

                {/* Card Mutuelle Document Téléversé */}
                {(storedMutuelleDoc || bookingData?.uploadedMutuelleDoc || matchedRide?.patient?.mutuelleFileUrl) && (
                  <div className="bg-surface-container-lowest rounded-2xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-sm border border-outline-variant/30 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[24px] text-sky-700">
                          health_and_safety
                        </span>
                        <h2 className="font-headline-md text-headline-md text-on-surface font-bold text-base">
                          Attestation de Mutuelle / Carte Tiers-Payant
                        </h2>
                      </div>
                      <span className="bg-sky-100 text-sky-900 px-3 py-1 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-sky-600"></span> Télétransmis Transporteur
                      </span>
                    </div>

                    <div className="p-space-md bg-surface-container-low rounded-xl flex items-center justify-between gap-space-sm border border-outline-variant/20">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-2xl">
                            {(storedMutuelleDoc || bookingData?.uploadedMutuelleDoc)?.type?.includes('pdf')
                              ? 'picture_as_pdf'
                              : 'image'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-on-surface">
                            {(storedMutuelleDoc || bookingData?.uploadedMutuelleDoc)?.name || matchedRide?.patient?.mutuelleFileName || 'Attestation_Mutuelle.pdf'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {bookingData?.mutuelleNumber ? `N° Télétransmission / Adhérent : ${bookingData.mutuelleNumber}` : 'Document justificatif de droits complémentaire'}
                          </span>
                        </div>
                      </div>

                      {((storedMutuelleDoc || bookingData?.uploadedMutuelleDoc)?.dataUrl || matchedRide?.patient?.mutuelleFileUrl) && (
                        <button
                          type="button"
                          onClick={() => {
                            if ((storedMutuelleDoc || bookingData?.uploadedMutuelleDoc)?.dataUrl) {
                              setShowMutuelleDocModal(true);
                            } else if (matchedRide?.patient?.mutuelleFileUrl) {
                              window.open(matchedRide.patient.mutuelleFileUrl, '_blank');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-sky-800 hover:bg-surface-variant font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Consulter</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Alerte reste à charge si sans ALD et sans Mutuelle */}
                {!bookingData?.isAld && !bookingData?.hasMutuelle && !matchedRide?.patient?.isAld && !matchedRide?.patient?.hasMutuelle && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 text-xs animate-fadeIn">
                    <span className="material-symbols-outlined text-amber-700 text-xl shrink-0 mt-0.5">payments</span>
                    <div className="flex flex-col gap-1 w-full">
                      <span className="font-bold text-sm text-amber-900">
                        Information règlement transporteur sanitaire
                      </span>
                      <p className="text-[12px] text-amber-900 leading-relaxed">
                        Votre prise en charge ne comportant pas d'exonération ALD 100% ni d'attestation de mutuelle, la part ticket modérateur de 35% ({bookingData?.pricing?.patientRemainder ? `${bookingData.pricing.patientRemainder.toFixed(2)} €` : 'calculée selon conventionnement'}) sera à régler directement auprès du transporteur sanitaire lors de la course.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Col: Actions & Contact */}
              <aside className="lg:col-span-4 flex flex-col gap-space-md">
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
                        Notification SMS &amp; E-mail
                      </span>
                    </div>
                  </div>

                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                    Un lien contenant les coordonnées du véhicule et le suivi en direct sera transmis par SMS et e-mail à{' '}
                    <strong className="text-on-surface">
                      {displayPhone}
                    </strong>{' '}
                    dès que le transporteur valide la course.
                  </p>

                  <Link
                    to={`/suivi?ref=${reservationRef}`}
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
                      Tiers Payant Assurance Maladie
                    </span>
                    <span className="text-secondary font-bold text-xs">Pris en charge à 100%</span>
                  </div>
                  <div className="text-xs text-on-surface-variant flex flex-col gap-1 border-t border-outline-variant/20 pt-2">
                    <div className="flex justify-between">
                      <span>Régime de sécurité sociale :</span>
                      <span className="font-semibold text-on-surface">{displayRegime}</span>
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
                    <span>Assistance &amp; Support</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Besoin de modifier ou d'annuler votre réservation ?
                  </p>
                  <a
                    href={`mailto:support@clinigo.fr?subject=${encodeURIComponent(`Demande réservation #${reservationRef}`)}`}
                    className="text-primary font-bold text-sm hover:underline flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">mail</span>
                    <span>support@clinigo.fr</span>
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

        {/* Modal Aperçu Attestation Mutuelle */}
        {showMutuelleDocModal && (storedMutuelleDoc || bookingData?.uploadedMutuelleDoc)?.dataUrl && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-outline-variant/30 animate-scaleUp">
              <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sky-700">health_and_safety</span>
                  <span className="font-bold text-sm text-on-surface">
                    {(storedMutuelleDoc || bookingData?.uploadedMutuelleDoc)?.name || 'Attestation_Mutuelle.pdf'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMutuelleDocModal(false)}
                  className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-surface-container-lowest">
                {(storedMutuelleDoc || bookingData?.uploadedMutuelleDoc)?.type?.includes('pdf') ? (
                  <iframe
                    src={(storedMutuelleDoc || bookingData?.uploadedMutuelleDoc)?.dataUrl}
                    title="Aperçu Attestation Mutuelle"
                    className="w-full h-[60vh] rounded-lg border border-outline-variant/20"
                  />
                ) : (
                  <img
                    src={(storedMutuelleDoc || bookingData?.uploadedMutuelleDoc)?.dataUrl}
                    alt="Aperçu Attestation Mutuelle"
                    className="max-h-[60vh] max-w-full object-contain rounded-lg border border-outline-variant/20"
                  />
                )}
              </div>
              <div className="p-3 border-t border-outline-variant/20 bg-surface-container-low flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowMutuelleDocModal(false)}
                  className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold cursor-pointer"
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
