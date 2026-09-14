import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { GoogleMapView } from '../components/GoogleMapView';
import { SEOHead } from '../components/SEOHead';
import { whatsappService } from '../services/whatsappService';
import { rideService } from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';
import { Ride } from '../types';
import { exportRidesToExcel, exportRidesToPdf } from '../utils/exportUtils';

export const TrackingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [showBanner, setShowBanner] = useState(true);
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRideModal, setSelectedRideModal] = useState<Ride | null>(null);
  const [rideToCancel, setRideToCancel] = useState<Ride | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('RDV_REPORTE');
  const [cancelCustomNote, setCancelCustomNote] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  // États pour le renouvellement d'une course terminée
  const [rideToRenew, setRideToRenew] = useState<Ride | null>(null);
  const [renewDate, setRenewDate] = useState<string>('');
  const [renewAppointmentTime, setRenewAppointmentTime] = useState<string>('09:00');
  const [renewDepartment, setRenewDepartment] = useState<string>('');
  const [renewIsRoundTrip, setRenewIsRoundTrip] = useState<boolean>(true);
  const [renewNotes, setRenewNotes] = useState<string>('');
  const [isRenewing, setIsRenewing] = useState<boolean>(false);

  const loadRides = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setRides([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const allRides = await rideService.getAllRides();

      // Récupérer une référence récente si réservée en local
      let lastBookingRef: string | null = null;
      try {
        const raw = localStorage.getItem('medictrans_last_booking');
        if (raw) {
          const parsed = JSON.parse(raw);
          lastBookingRef = parsed.ref;
        }
      } catch {
        // ignore
      }

      let relevantRides: Ride[] = [];

      if (user.role === 'ADMIN') {
        relevantRides = allRides;
      } else if (user.role === 'FACILITY') {
        relevantRides = allRides.filter((r) => 
          (r.facilityName && user.facilityName && r.facilityName.toLowerCase().includes(user.facilityName.toLowerCase())) ||
          (r.pickupAddress && user.facilityName && r.pickupAddress.toLowerCase().includes(user.facilityName.toLowerCase()))
        );
      } else if (user.role === 'TRANSPORTER') {
        relevantRides = allRides.filter((r) => 
          Boolean(r.assignedTransporter?.companyName && user.transporterName && r.assignedTransporter.companyName.toLowerCase().includes(user.transporterName.toLowerCase()))
        );
      } else {
        // Rôle PATIENT (ou compte particulier) : filtrer strictement ses propres courses
        relevantRides = allRides.filter((r) => {
          const matchesEmail = user.email && r.patient?.email?.toLowerCase() === user.email.toLowerCase();
          const matchesNir = user.nir && r.patient?.nir && r.patient.nir.replace(/\s/g, '') === user.nir.replace(/\s/g, '');
          const matchesPhone = user.phone && r.patient?.phone && r.patient.phone.replace(/\s/g, '') === user.phone.replace(/\s/g, '');
          const matchesLastName = user.lastName && r.patient?.lastName && r.patient.lastName.toLowerCase().trim() === user.lastName.toLowerCase().trim();
          const matchesLastBooking = lastBookingRef && r.reference.toUpperCase() === lastBookingRef.toUpperCase();
          return matchesEmail || matchesNir || matchesPhone || matchesLastName || matchesLastBooking;
        });
      }

      setRides(relevantRides);
    } catch (err) {
      console.warn('Erreur chargement des courses:', err);
      setRides([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadRides();
  }, [loadRides]);

  // Ouvrir le modal de renouvellement pour une course terminée
  const openRenewModal = (ride: Ride) => {
    setRideToRenew(ride);
    // Par défaut : date de demain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defDate = tomorrow.toISOString().split('T')[0];
    setRenewDate(defDate);

    // Heure de RDV médical par défaut : celle de la course précédente ou 09:00
    setRenewAppointmentTime(
      ride.appointmentTime ||
      (ride.pickupDateTime ? new Date(ride.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '09:00')
    );

    // Service hospitalier éventuel (département, aile, consultation)
    const existingDept = 
      ride.facilityDepartment || 
      (ride.facilityName?.includes(' - ') ? ride.facilityName.split(' - ')[1] : '');
    setRenewDepartment(existingDept || '');
    setRenewIsRoundTrip(Boolean(ride.isRoundTrip));
    setRenewNotes('');
  };

  // Confirmer le renouvellement et recréer la nouvelle demande
  const handleConfirmRenew = async () => {
    if (!rideToRenew || !renewDate || !renewAppointmentTime) return;
    setIsRenewing(true);
    try {
      const newPickupDateTime = new Date(`${renewDate}T${renewAppointmentTime}:00`).toISOString();

      let updatedFacilityName = rideToRenew.facilityName;
      if (renewDepartment.trim()) {
        const baseFacility = rideToRenew.facilityName ? rideToRenew.facilityName.split(' - ')[0] : 'Établissement de Santé 972';
        updatedFacilityName = `${baseFacility} - ${renewDepartment.trim()}`;
      }

      const payload: Omit<Ride, 'id' | 'reference' | 'createdAt' | 'status'> = {
        pickupAddress: rideToRenew.pickupAddress,
        pickupCity: rideToRenew.pickupCity,
        dropoffAddress: rideToRenew.dropoffAddress,
        dropoffCity: rideToRenew.dropoffCity,
        facilityName: updatedFacilityName,
        facilityDepartment: renewDepartment.trim() || rideToRenew.facilityDepartment,
        facilityFloor: rideToRenew.facilityFloor,
        facilityRoom: rideToRenew.facilityRoom,
        facilityStaircase: rideToRenew.facilityStaircase,
        facilityBed: rideToRenew.facilityBed,
        pickupDateTime: newPickupDateTime,
        returnDateTime: renewIsRoundTrip ? new Date(new Date(newPickupDateTime).getTime() + 4 * 3600000).toISOString() : undefined,
        isRoundTrip: renewIsRoundTrip,
        transportType: rideToRenew.transportType,
        source: 'PATIENT',
        appointmentTime: renewAppointmentTime,
        patient: { ...rideToRenew.patient },
        mobility: {
          ...rideToRenew.mobility,
          notes: renewNotes.trim()
            ? `${renewNotes.trim()} (Renouvellement de la course #${rideToRenew.reference})`
            : `Renouvellement de la course précédente #${rideToRenew.reference}`
        }
      };

      const newRide = await rideService.createRide(payload);

      localStorage.setItem('medictrans_last_booking', JSON.stringify({
        ref: newRide.reference,
        pickup: newRide.pickupAddress,
        destination: newRide.facilityName || newRide.dropoffAddress,
        date: renewDate,
        time: renewAppointmentTime,
        type: newRide.transportType
      }));

      await loadRides();

      setToastMessage({
        title: 'Transport renouvelé avec succès !',
        desc: `Votre nouvelle demande a été créée sous la référence #${newRide.reference} pour le ${new Date(renewDate).toLocaleDateString('fr-FR')} à ${renewAppointmentTime}.`
      });

      setRideToRenew(null);
    } catch (err) {
      console.error('Erreur lors du renouvellement:', err);
      alert('Une erreur est survenue lors du renouvellement du transport.');
    } finally {
      setIsRenewing(false);
    }
  };

  // Course prioritaire active
  const activeRide = useMemo(() => {
    return (
      rides.find(
        (r) =>
          r.status === 'PENDING' ||
          r.status === 'ACCEPTED' ||
          r.status === 'EN_ROUTE' ||
          r.status === 'PICKED_UP'
      ) || (rides.length > 0 ? rides[0] : null)
    );
  }, [rides]);

  // Filtrage de l'historique
  const filteredRides = useMemo(() => {
    return rides.filter((r) => {
      // Filtre de statut
      if (statusFilter === 'ACTIVE') {
        if (!['PENDING', 'ACCEPTED', 'EN_ROUTE', 'PICKED_UP'].includes(r.status)) return false;
      } else if (statusFilter === 'COMPLETED') {
        if (r.status !== 'COMPLETED') return false;
      } else if (statusFilter === 'CANCELLED') {
        if (r.status !== 'CANCELLED') return false;
      }

      // Recherche texte
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.reference.toLowerCase().includes(term) ||
        r.pickupAddress.toLowerCase().includes(term) ||
        r.dropoffAddress.toLowerCase().includes(term) ||
        (r.facilityName && r.facilityName.toLowerCase().includes(term)) ||
        `${r.patient.firstName} ${r.patient.lastName}`.toLowerCase().includes(term)
      );
    });
  }, [rides, searchTerm, statusFilter]);

  // Actions d'exportation
  const handleExportExcel = () => {
    exportRidesToExcel(filteredRides, {
      filename: `Historique_Transports_Client_${new Date().toISOString().slice(0, 10)}`,
      title: 'Historique des transports sanitaires',
      userContext: user?.email ? `Patient : ${user.email}` : 'Espace Demandeur / Patient'
    });
    setToastMessage({
      title: 'Export Excel réussi',
      desc: `${filteredRides.length} transport(s) exporté(s) au format .csv (compatible Excel).`
    });
  };

  const handleExportPdf = () => {
    exportRidesToPdf(filteredRides, {
      filename: `Historique_Transports_Client_${new Date().toISOString().slice(0, 10)}`,
      title: 'Registre de mes transports sanitaires',
      subtitle: `Filtre actif : ${statusFilter === 'ALL' ? 'Tous' : statusFilter === 'ACTIVE' ? 'En cours' : statusFilter === 'COMPLETED' ? 'Terminés' : 'Annulés'} (${filteredRides.length} résultat(s))`,
      userContext: user?.email ? `Dossier Patient : ${user.firstName || ''} ${user.lastName || ''} (${user.email})` : 'Espace Patient / Demandeur'
    });
    setToastMessage({
      title: 'Export PDF généré',
      desc: `Le document PDF certifié de vos transports a été téléchargé avec succès.`
    });
  };

  // Statistiques calculées en temps réel
  const pendingCount = rides.filter((r) => r.status === 'PENDING').length;
  const confirmedCount = rides.filter(
    (r) => r.status === 'ACCEPTED' || r.status === 'EN_ROUTE' || r.status === 'PICKED_UP'
  ).length;
  const completedCount = rides.filter((r) => r.status === 'COMPLETED').length;
  const cancelledCount = rides.filter((r) => r.status === 'CANCELLED').length;

  // Calcul du délai restant avant la prise en charge (pour la règle des 24h00)
  const getHoursUntilPickup = (ride: Ride | null): number => {
    if (!ride) return 0;
    const datePart = ride.pickupDateTime ? ride.pickupDateTime.slice(0, 10) : new Date().toISOString().slice(0, 10);
    let pickupTimestamp: number;
    if (ride.transporterPickupTime && ride.transporterPickupTime.includes(':')) {
      pickupTimestamp = new Date(`${datePart}T${ride.transporterPickupTime}:00`).getTime();
    } else {
      pickupTimestamp = new Date(ride.pickupDateTime).getTime();
    }
    return (pickupTimestamp - Date.now()) / (1000 * 60 * 60);
  };

  const openCancelModal = (ride: Ride) => {
    setRideToCancel(ride);
    setCancelReason('RDV_REPORTE');
    setCancelCustomNote('');
  };

  const confirmCancelRide = async () => {
    if (!rideToCancel) return;
    const ref = rideToCancel.reference;

    const reasonLabels: Record<string, string> = {
      RDV_REPORTE: 'Rendez-vous médical décalé ou reporté',
      ETAT_SANTE: 'Amélioration ou changement de l\'état de santé',
      PROCHE_TRANSPORTE: 'Pris en charge par un proche / véhicule particulier',
      ERREUR_DEMANDE: 'Demande effectuée par erreur',
      AUTRE: 'Autre motif'
    };

    const fullReason = cancelCustomNote.trim()
      ? `${reasonLabels[cancelReason] || cancelReason} (${cancelCustomNote.trim()})`
      : (reasonLabels[cancelReason] || cancelReason);

    // Optimistic update
    setRides((prev) =>
      prev.map((r) => (r.reference.toUpperCase() === ref.toUpperCase() ? { ...r, status: 'CANCELLED' } : r))
    );

    setToastMessage({
      title: 'Transport annulé avec succès',
      desc: `Votre réservation #${ref} a bien été annulée.`
    });

    setRideToCancel(null);

    try {
      await rideService.cancelRide(ref, fullReason);
    } catch (err) {
      console.error('Erreur annulation transport patient:', err);
    }
  };

  const getVehicleLabel = (type: string) => {
    switch (type) {
      case 'AMBULANCE':
        return 'Ambulance Type B';
      case 'TAXI_CONVENTIONNE':
        return 'Taxi Conventionné CPAM';
      case 'VSL':
      default:
        return 'VSL (Véhicule Sanitaire Léger)';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return { label: 'Confirmé', bg: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
      case 'EN_ROUTE':
        return { label: 'Chauffeur en route', bg: 'bg-emerald-100 text-emerald-900 border-emerald-200' };
      case 'PICKED_UP':
        return { label: 'Patient à bord', bg: 'bg-teal-100 text-teal-900 border-teal-200' };
      case 'PENDING':
        return { label: 'En recherche', bg: 'bg-amber-100 text-amber-900 border-amber-200' };
      case 'COMPLETED':
        return { label: 'Effectué', bg: 'bg-surface-container-high text-on-surface-variant border-transparent' };
      case 'CANCELLED':
        return { label: 'Annulé', bg: 'bg-error/10 text-error border-error/20' };
      default:
        return { label: status, bg: 'bg-surface-container-high text-on-surface-variant border-transparent' };
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary flex flex-col">
      <Header />
      <SEOHead
        title="Suivi en Direct Transport Sanitaire | Clinigo"
        description="Suivez en temps réel votre transport médical Clinigo : statut de l'ambulance, heure d'approche géolocalisée et contact direct du chauffeur sanitaire."
        canonicalPath="/suivi"
        ogImage="/assets/clinigo-logo.png"
      />

      <main className="w-full pt-4 sm:pt-6 bg-[#F8FAFD] flex-1">
        {/* Network status ticker banner */}
        {showBanner && (
          <div className="w-full bg-slate-50 px-4 sm:px-6 py-2.5 border-b border-slate-200/80 shadow-2xs">
            <div className="max-w-[1280px] w-full mx-auto flex flex-wrap items-center justify-between gap-space-sm text-xs md:text-sm">
              <div className="flex items-center gap-space-sm">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span className="text-xs sm:text-sm text-slate-700 font-medium">
                  Réseau Martinique Sud &amp; Centre actif : 42 ambulances et taxis conventionnés en liaison continue avec le SAMU 972.
                </span>
              </div>
              <div className="flex items-center gap-space-md">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 uppercase tracking-wider text-[10px] font-bold">
                  Synchronisé CPAM
                </span>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-slate-400 hover:text-slate-700 flex items-center p-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated || !user ? (
          /* ÉCRAN SÉCURISÉ : AUCUNE DONNÉE DE TRANSPORT AFFICHÉE SANS CONNEXION */
          <div className="max-w-[1280px] w-full mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-xl flex items-center justify-center min-h-[65vh]">
            <div className="w-full max-w-xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-200/80 p-8 sm:p-12 text-center animate-fadeIn card-silky">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-slate-100">
                <span className="material-symbols-outlined text-4xl">lock</span>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/70 text-xs font-bold uppercase tracking-wider mb-4">
                <span className="material-symbols-outlined text-sm text-teal-700">shield</span>
                Espace Sécurisé Patient &amp; Tiers-Payant
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                Connectez-vous pour voir vos demandes
              </h1>

              <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base leading-relaxed mb-8">
                Pour des raisons de secret médical et de sécurité de vos données de santé, le récapitulatif de vos transports et le suivi en direct sont accessibles uniquement après connexion à votre compte.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full">
                <Link
                  id="btn-login-to-see-rides"
                  to="/connexion"
                  state={{
                    from: { pathname: '/suivi' },
                    requiredRole: 'PATIENT',
                    message: 'Connectez-vous à votre compte pour consulter le récapitulatif de vos demandes de transport sanitaire.'
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-teal-800 via-teal-900 to-sky-900 hover:from-teal-700 hover:to-sky-800 text-white text-sm font-bold shadow-lg shadow-teal-950/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Se connecter / S'identifier</span>
                </Link>

                <Link
                  to="/reserver"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm transition-all border border-slate-200/80 shadow-xs"
                >
                  <span className="material-symbols-outlined text-lg text-teal-700">add_circle</span>
                  <span>Commander un transport</span>
                </Link>
              </div>

              {/* Rassurance & Garanties ARS / CPAM */}
              <div className="mt-10 pt-8 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-lg mt-0.5">verified_user</span>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Secret Médical</span>
                    <span className="text-[11px] text-on-surface-variant">Conformité RGPD &amp; ARS</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">near_me</span>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Suivi GPS Temps Réel</span>
                    <span className="text-[11px] text-on-surface-variant">Approche de votre véhicule</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-secondary text-lg mt-0.5">receipt_long</span>
                  <div>
                    <span className="text-xs font-bold text-on-surface block">Tiers-Payant 100%</span>
                    <span className="text-[11px] text-on-surface-variant">Bons de transport CPAM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[1280px] w-full mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-lg flex flex-col gap-space-xl">
            {/* Header Title */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
              <div className="flex flex-col gap-space-xs max-w-2xl">
                <div className="flex items-center gap-space-sm">
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold text-xs">
                    {`Espace ${user.firstName} ${user.lastName}`}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                    {`Compte : ${user.email}`}
                  </span>
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold text-2xl md:text-3xl">
                  Mes demandes de transport sanitaire
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                  Retrouvez ici le récapitulatif de vos prises en charge médicales.
                </p>
              </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            {/* Left Col: Active Card & History OR Empty State */}
            <div className="lg:col-span-8 flex flex-col gap-space-xl">
              {isLoading ? (
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-12 text-center border border-outline-variant/30 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-headline-sm text-sm font-semibold text-on-surface">
                    Synchronisation des missions sanitaires...
                  </p>
                </div>
              ) : rides.length === 0 ? (
                /* ENCART BLANC CONFORME LORSQUE AUCUNE MISSION N'EST EN COURS */
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-8 md:p-12 flex flex-col items-center justify-center text-center border border-outline-variant/30">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-xs">
                    <span className="material-symbols-outlined text-4xl">inventory_2</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-xs font-semibold mb-3">
                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                    Statut actuel : Aucune commande
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold text-2xl md:text-3xl mb-3">
                    Vous n'avez aucune mission en cours.
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto text-sm md:text-base leading-relaxed mb-8">
                    Toutes vos demandes de transport sanitaire (Ambulance, VSL, Taxi conventionné CPAM) apparaîtront ici dès leur réservation avec le suivi GPS en temps réel, l'heure d'approche géolocalisée et les attestations 100% Tiers-Payant.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
                    <Link
                      to="/reserver"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-teal-800 via-teal-900 to-sky-900 hover:from-teal-700 hover:to-sky-800 text-white text-sm font-bold shadow-lg shadow-teal-950/20 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Commander un transport sanitaire
                    </Link>
                    <a
                      href="tel:0596720097"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm transition-all border border-slate-200/80 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-lg text-teal-700">call</span>
                      Astreinte Régulation (05 96 72 00 97)
                    </a>
                  </div>

                  {/* Badges d'assurance et de sécurité */}
                  <div className="mt-10 pt-8 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-xl">verified</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-xs font-bold text-on-surface">Prise en charge 100%</span>
                        <span className="font-body-xs text-[11px] text-on-surface-variant mt-0.5">Tiers-payant Sécurité Sociale &amp; ALD</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-xl">local_taxi</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-xs font-bold text-on-surface">Flotte Conventionnée</span>
                        <span className="font-body-xs text-[11px] text-on-surface-variant mt-0.5">42 ambulances, VSL et taxis agréés ARS 972</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                        <span className="material-symbols-outlined text-xl">location_on</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-xs font-bold text-on-surface">Suivi Télématique</span>
                        <span className="font-body-xs text-[11px] text-on-surface-variant mt-0.5">Notification d'approche et contact direct</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Active Card (si disponible) */}
                  {activeRide && (
                    <div className="relative bg-white rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col gap-6 overflow-hidden border border-slate-200/80 card-silky">
                      <div className="flex flex-wrap items-center justify-between gap-space-sm relative z-10">
                        <div className="flex items-center gap-space-sm">
                          {activeRide.status === 'PENDING' ? (
                            activeRide.isDirectRequest && !activeRide.isDirectRequestExpired && !activeRide.reassignedToPublicPool ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-950 border border-orange-300 font-label-md text-label-md font-extrabold text-xs">
                                <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping"></span>
                                DEMANDE DIRECTE ({activeRide.targetTransporterName || 'Transporteur'} • DÉLAI 24H)
                              </span>
                            ) : activeRide.reassignedToPublicPool || activeRide.isDirectRequestExpired ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-950 border border-blue-300 font-label-md text-label-md font-bold text-xs">
                                <span className="material-symbols-outlined text-xs text-blue-700">sync_alt</span>
                                REBASCLUÉ AU POT COMMUN (BOURSE 972)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-label-md text-label-md font-bold text-xs">
                                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                                RECHERCHE ACTIVE D'UN TRANSPORTEUR
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-label-md text-label-md font-bold text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              {activeRide.status === 'EN_ROUTE'
                                ? 'CHAUFFEUR EN ROUTE'
                                : activeRide.status === 'PICKED_UP'
                                ? 'PATIENT À BORD'
                                : 'MISSION ACCEPTÉE & PLANIFIÉE'}
                            </span>
                          )}
                          <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                            Transport n°{activeRide.reference}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">alarm</span>
                              <span>RDV Médical : {activeRide.appointmentTime || new Date(activeRide.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                            {activeRide.transporterPickupTime ? (
                              <span className="font-bold text-secondary bg-secondary/15 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">local_shipping</span>
                                <span>Prise en charge : {activeRide.transporterPickupTime}</span>
                                {activeRide.estimatedArrivalTime && (
                                  <span>➔ Arrivée estimée : {activeRide.estimatedArrivalTime}</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-lg text-[11px] font-medium">
                                Prise en charge calculée par le transporteur
                              </span>
                            )}
                            {activeRide.isRecurring && (
                              <span className="font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-lg text-[11px] flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">event_repeat</span>
                                <span>Récurrent ({activeRide.recurringDates?.length || 1} séances)</span>
                              </span>
                            )}
                          </div>
                          {activeRide.status !== 'COMPLETED' && activeRide.status !== 'CANCELLED' && (
                            (() => {
                              const hoursLeft = getHoursUntilPickup(activeRide);
                              const isOver24h = hoursLeft >= 24;
                              return (
                                <button
                                  type="button"
                                  onClick={() => openCancelModal(activeRide)}
                                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                                    isOver24h
                                      ? 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                                      : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800'
                                  }`}
                                  title={isOver24h ? "Annulation gratuite en ligne (> 24h avant départ)" : "Moins de 24h avant prise en charge : contact transporteur requis"}
                                >
                                  <span className="material-symbols-outlined text-[15px]">
                                    {isOver24h ? 'cancel' : 'phone_in_talk'}
                                  </span>
                                  <span>Annuler</span>
                                  <span className="text-[10px] opacity-75 font-semibold">
                                    ({isOver24h ? '> 24h' : '< 24h'})
                                  </span>
                                </button>
                              );
                            })()
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md relative z-10 pt-space-xs">
                        <div className="md:col-span-8 flex flex-col gap-space-md">
                          <div className="flex items-start gap-space-md">
                            <div className="flex flex-col items-center pt-1">
                              <span className="material-symbols-outlined text-primary text-xl">
                                radio_button_checked
                              </span>
                              <div className="w-0.5 h-12 bg-surface-container-high my-1"></div>
                              <span className="material-symbols-outlined text-secondary text-xl">
                                location_on
                              </span>
                            </div>
                            <div className="flex flex-col gap-space-md w-full">
                              <div>
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[10px] font-bold">
                                  Prise en charge à domicile
                                </span>
                                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                                  {activeRide.pickupAddress}
                                </h2>
                                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                                  {activeRide.pickupCity}
                                </p>
                              </div>
                              <div>
                                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[10px] font-bold">
                                  Destination médicale
                                </span>
                                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                                  {activeRide.facilityName || activeRide.dropoffAddress}
                                </h2>
                                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                                  {activeRide.dropoffCity}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-4 bg-surface-container-low p-space-md rounded-xl flex flex-col justify-between gap-space-sm border border-outline-variant/30">
                          <div className="flex flex-col">
                            <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                              Prescription Médicale
                            </span>
                            <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 mt-1 font-bold text-xs">
                              <span className="material-symbols-outlined text-primary text-base">
                                local_taxi
                              </span>
                              {getVehicleLabel(activeRide.transportType)}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-[11px]">
                              Patient : {activeRide.patient.firstName} {activeRide.patient.lastName}
                            </span>
                          </div>
                          <div className="pt-space-xs">
                            <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold text-xs">
                              <span className="material-symbols-outlined text-sm">verified</span>
                              {activeRide.patient.isAld ? 'PEC 100% ALD' : 'PEC Conventionnée CPAM'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Équipage ou Diffusion */}
                      {activeRide.assignedTransporter ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md pt-2 border-t border-outline-variant/20">
                          <div className="md:col-span-7 flex flex-col gap-space-sm bg-surface-container-low/50 p-space-md rounded-xl border border-outline-variant/30">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[10px] font-bold">
                              Transporteur Sanitaire Agréé
                            </span>
                            <div className="flex items-center gap-space-md">
                              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-base ring-2 ring-secondary/30 shrink-0">
                                {activeRide.assignedTransporter.driverName?.[0] || 'C'}
                              </div>
                              <div className="flex flex-col">
                                <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                                  {activeRide.assignedTransporter.driverName}
                                </h4>
                                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                                  {activeRide.assignedTransporter.companyName}
                                </span>
                                <div className="flex items-center gap-space-sm mt-1">
                                  <span className="font-label-sm text-label-sm text-on-surface flex items-center gap-1 text-xs">
                                    <span className="material-symbols-outlined text-sm text-amber-500">star</span>{' '}
                                    4.9 (Avis certifiés)
                                  </span>
                                  <span className="text-on-surface-variant font-label-sm text-label-sm text-xs">
                                    · Plaque {activeRide.assignedTransporter.vehiclePlate}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="md:col-span-5 flex flex-col justify-between gap-space-sm bg-surface-container-low/50 p-space-md rounded-xl border border-outline-variant/30">
                            <div className="flex flex-col text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant">Arrivée estimée</span>
                                <span className="text-secondary font-bold text-sm">
                                  ~{activeRide.assignedTransporter.etaMinutes || 15} min
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-1">
                              <a
                                className="w-full h-9 px-3 rounded-xl bg-secondary text-on-secondary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-all truncate"
                                href={`tel:${activeRide.assignedTransporter.driverPhone}`}
                              >
                                <span className="material-symbols-outlined text-base shrink-0">call</span>
                                <span className="truncate">
                                  Appeler ({activeRide.assignedTransporter.driverPhone})
                                </span>
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  whatsappService.openWhatsAppDirect(
                                    activeRide.assignedTransporter!.driverPhone,
                                    'DRIVER_APPROACHING',
                                    {
                                      patientName: `${activeRide.patient.firstName} ${activeRide.patient.lastName}`,
                                      driverName: activeRide.assignedTransporter!.driverName,
                                      vehiclePlate: activeRide.assignedTransporter!.vehiclePlate,
                                      etaMinutes: String(activeRide.assignedTransporter!.etaMinutes || 15),
                                      trackingUrl: window.location.href,
                                    }
                                  );
                                }}
                                className="w-full h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all truncate"
                              >
                                <span className="material-symbols-outlined text-base shrink-0">chat</span>
                                <span className="truncate">WhatsApp Chauffeur</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50/80 rounded-xl p-space-md flex flex-col gap-space-sm relative z-10 border border-amber-200/60">
                          <div className="flex flex-wrap items-center justify-between gap-space-xs">
                            <div className="flex items-center gap-space-sm">
                              <span className="material-symbols-outlined text-amber-800 text-xl animate-spin">
                                sync
                              </span>
                              <span className="font-label-md text-label-md text-amber-900 font-semibold text-xs">
                                Demande diffusée aux chauffeurs agréés du secteur Martinique
                              </span>
                            </div>
                            <span className="font-label-sm text-label-sm text-amber-800 font-bold text-xs">
                              Attente moyenne : ~6 min
                            </span>
                          </div>

                          <div className="w-full bg-amber-200/70 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full w-2/3 transition-all duration-1000 animate-pulse"></div>
                          </div>
                          <p className="font-body-sm text-body-sm text-amber-900/80 text-xs">
                            Notre algorithme interroge successivement les taxis sanitaires et ambulances en fin de course à proximité.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* History Table & Archives */}
                  <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 flex flex-col gap-6 border border-slate-200/80 card-silky">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-teal-700 text-xl">history</span>
                          <h2 className="text-base sm:text-lg text-slate-900 font-extrabold tracking-tight">
                            Historique des demandes &amp; Transports
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {rides.length} transport(s) au total · {filteredRides.length} affiché(s)
                        </p>
                      </div>

                      {/* Barre d'outils : Exports & Recherche */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportExcel}
                          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                          title="Télécharger l'historique sous format Excel (.csv)"
                        >
                          <span className="material-symbols-outlined text-base text-emerald-700">table_view</span>
                          <span>Export Excel</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportPdf}
                          className="px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                          title="Générer un registre PDF officiel"
                        >
                          <span className="material-symbols-outlined text-base text-primary">picture_as_pdf</span>
                          <span>Export PDF</span>
                        </button>

                        <div className="relative">
                          <input
                            className="h-9 pl-8 pr-3 rounded-xl bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all w-52 text-xs border border-outline-variant/30"
                            placeholder="Rechercher..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          <span className="material-symbols-outlined text-outline absolute left-2.5 top-2.5 text-base">
                            search
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Filtres d'état rapides */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 pb-1 border-b border-outline-variant/20">
                      {[
                        { id: 'ALL', label: 'Toutes les demandes', count: rides.length },
                        { id: 'ACTIVE', label: 'En cours', count: pendingCount + confirmedCount },
                        { id: 'COMPLETED', label: 'Effectuées', count: completedCount },
                        { id: 'CANCELLED', label: 'Annulées', count: cancelledCount }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setStatusFilter(tab.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            statusFilter === tab.id
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                              statusFilter === tab.id
                                ? 'bg-white/25 text-white'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Tableau d'historique */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-4 rounded-l-lg">Référence &amp; Date</th>
                            <th className="py-3 px-4">Trajet / Destination</th>
                            <th className="py-3 px-4">Véhicule</th>
                            <th className="py-3 px-4">Prescription PMT</th>
                            <th className="py-3 px-4">Statut</th>
                            <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm text-on-surface">
                          {filteredRides.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-10 text-center text-on-surface-variant text-xs">
                                Aucun transport trouvé pour les critères sélectionnés.
                              </td>
                            </tr>
                          ) : (
                            filteredRides.map((ride) => {
                              const badge = getStatusBadge(ride.status);
                              const hasPmt = ride.patient.hasPmt || ride.patient.pmtUploaded || ride.patient.pmtFileUrl;
                              const hoursLeft = getHoursUntilPickup(ride);
                              const isOver24h = hoursLeft >= 24;

                              return (
                                <tr 
                                  key={ride.id} 
                                  onClick={() => setSelectedRideModal(ride)}
                                  className="hover:bg-primary/5 cursor-pointer transition-colors group"
                                  title="Cliquer pour afficher toutes les informations détaillées de ce transport"
                                >
                                  <td className="py-3.5 px-4 align-top">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-primary font-bold block group-hover:underline">
                                        {ride.reference}
                                      </span>
                                      <span className="material-symbols-outlined text-xs text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                        open_in_new
                                      </span>
                                    </div>
                                    <span className="text-on-surface-variant font-label-sm text-label-sm block">
                                      {new Date(ride.pickupDateTime).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                      })}
                                    </span>
                                    <span className="text-primary font-bold text-[11px] block">
                                      RDV : {ride.appointmentTime || new Date(ride.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {ride.transporterPickupTime && (
                                      <span className="text-secondary font-semibold text-[10px] block">
                                        Prise en charge : {ride.transporterPickupTime}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 align-top">
                                    <span className="font-label-md text-label-md text-on-surface block font-semibold">
                                      {ride.pickupCity} ➔ {ride.dropoffCity}
                                    </span>
                                    <span className="text-on-surface-variant text-xs">
                                      {ride.facilityName || ride.dropoffAddress}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 align-top">
                                    <span className="font-label-md text-label-md text-on-surface block font-semibold">
                                      {getVehicleLabel(ride.transportType)}
                                    </span>
                                    <span className="text-on-surface-variant text-xs">
                                      {ride.assignedTransporter?.companyName || "En cours d'affectation"}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 align-top">
                                    {hasPmt ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        <span className="material-symbols-outlined text-[13px] text-emerald-600">verified</span>
                                        <span>Numérique</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                        <span className="material-symbols-outlined text-[13px] text-amber-600">description</span>
                                        <span>Cerfa papier</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 align-top">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}
                                    >
                                      {badge.label}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 align-top text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedRideModal(ride)}
                                        className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                                        title="Consulter toutes les informations détaillées de ce transport"
                                      >
                                        <span className="material-symbols-outlined text-sm">visibility</span>
                                        <span>Détails</span>
                                      </button>

                                      {ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
                                        <button
                                          type="button"
                                          onClick={() => openCancelModal(ride)}
                                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all shadow-2xs ${
                                            isOver24h
                                              ? 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                                              : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800'
                                          }`}
                                          title={isOver24h ? "Annuler cette course en ligne (> 24h avant départ)" : "Moins de 24h : contact transporteur direct requis"}
                                        >
                                          <span className="material-symbols-outlined text-[15px]">
                                            {isOver24h ? 'cancel' : 'phone_in_talk'}
                                          </span>
                                          <span>Annuler</span>
                                        </button>
                                      )}

                                      {ride.status === 'COMPLETED' && (
                                        <button
                                          type="button"
                                          onClick={() => openRenewModal(ride)}
                                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                                          title="Renouveler ce transport avec nouvelle date et service"
                                        >
                                          <span className="material-symbols-outlined text-sm text-emerald-600">autorenew</span>
                                          <span>Renouveler</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Col: Stats & Support */}
            <aside className="lg:col-span-4 flex flex-col gap-space-lg">
              {/* Map Preview Card */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/30">
                <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">map</span>
                    <span className="font-bold text-sm text-primary">Régulation GPS 972</span>
                  </div>
                  <span className={`text-xs font-bold ${activeRide ? 'text-secondary' : 'text-on-surface-variant'}`}>
                    {activeRide ? 'En direct' : 'En veille'}
                  </span>
                </div>
                <div className="h-60 relative overflow-hidden">
                  {activeRide ? (
                    <GoogleMapView
                      mode="tracking"
                      height="100%"
                      etaMinutes={activeRide.assignedTransporter?.etaMinutes || 15}
                      driverName={activeRide.assignedTransporter?.driverName || "Affectation en cours"}
                      vehiclePlate={activeRide.assignedTransporter?.vehiclePlate || "En approche"}
                      origin={activeRide.pickupAddress}
                      destination={activeRide.facilityName || activeRide.dropoffAddress}
                    />
                  ) : (
                    <GoogleMapView
                      mode="route"
                      height="100%"
                      origin="Fort-de-France"
                      destination="Le Lamentin"
                    />
                  )}
                </div>
                <div className="p-3 bg-surface-container-low text-xs text-on-surface-variant flex items-center gap-2 border-t border-outline-variant/20">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>
                    {activeRide
                      ? `Mission active : ${activeRide.reference}`
                      : 'Réseau territorial disponible (42 véhicules en liaison)'}
                  </span>
                </div>
              </div>

              {/* Status breakdown */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex items-center justify-between border-b border-surface-container-high pb-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-xl">analytics</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                      Statut de mes transports
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-surface-container-low">
                    <span className="text-on-surface-variant text-[11px] block">En attente</span>
                    <span className="text-base font-bold text-amber-600">{pendingCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container-low">
                    <span className="text-on-surface-variant text-[11px] block">Confirmés</span>
                    <span className="text-base font-bold text-emerald-600">{confirmedCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container-low">
                    <span className="text-on-surface-variant text-[11px] block">Effectués</span>
                    <span className="text-base font-bold text-on-surface">{completedCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container-low">
                    <span className="text-on-surface-variant text-[11px] block">Annulés</span>
                    <span className="text-base font-bold text-rose-600">{cancelledCount}</span>
                  </div>
                </div>
              </div>

              {/* Assistance CPAM / Régulation */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="material-symbols-outlined text-lg">support_agent</span>
                  <span>Assistance Régulation 972</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Une question sur la prise en charge de votre bon de transport ou besoin d'un ajustement horaire ?
                </p>
                <div className="p-3 bg-surface-container-low rounded-xl text-xs space-y-1">
                  <span className="font-bold text-primary block">Permanence Transport Sanitaire :</span>
                  <a href="tel:0596752020" className="text-secondary font-extrabold text-sm hover:underline block">
                    0596 75 20 20
                  </a>
                  <span className="text-[10px] text-on-surface-variant block">
                    Numéro local non surtaxé · Coordination CHU / Cliniques
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
        )}
      </main>

      {/* Modal Détails Course & Fiche PMT */}
      {selectedRideModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn flex flex-col gap-4 my-8">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">local_taxi</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Dossier Transport #{selectedRideModal.reference}
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    {new Date(selectedRideModal.pickupDateTime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRideModal(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Statut & Alertes */}
            {selectedRideModal.status === 'CANCELLED' && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-start gap-2.5">
                <span className="material-symbols-outlined text-rose-600 text-lg shrink-0 mt-0.5">cancel</span>
                <div>
                  <div className="font-bold text-rose-900">Ce transport sanitaire a été annulé.</div>
                  <p className="text-rose-800 text-[11px] mt-0.5">
                    {selectedRideModal.mobility.notes || 'Annulation enregistrée auprès de la régulation Médic\'Trans 972.'}
                  </p>
                </div>
              </div>
            )}

            {selectedRideModal.status === 'COMPLETED' && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">check_circle</span>
                <div>
                  <span className="font-bold text-emerald-900">Mission sanitaire effectuée et clôturée.</span>{' '}
                  <span className="text-emerald-800 text-[11px]">Télétransmission CPAM Tiers-Payant validée.</span>
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Trajet */}
              <div className="bg-surface-container-low p-3.5 rounded-2xl space-y-2 border border-outline-variant/30">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Itinéraire Sanitaire</span>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase block">Prise en charge</span>
                      <p className="font-bold text-on-surface">{selectedRideModal.pickupAddress}, {selectedRideModal.pickupCity}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></span>
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase block">Destination</span>
                      <p className="font-bold text-on-surface">{selectedRideModal.facilityName || selectedRideModal.dropoffAddress}, {selectedRideModal.dropoffCity}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horaires & Programmation */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Horaires de la prise en charge</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-[10px] text-on-surface-variant block">RDV Médical :</span>
                    <span className="font-extrabold text-xs text-primary font-mono">
                      {selectedRideModal.appointmentTime || new Date(selectedRideModal.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-[10px] text-on-surface-variant block">Prise en charge :</span>
                    <span className="font-extrabold text-xs text-secondary font-mono">
                      {selectedRideModal.transporterPickupTime || 'En calcul transporteur'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-[10px] text-on-surface-variant block">Arrivée estimée :</span>
                    <span className="font-extrabold text-xs text-on-surface font-mono">
                      {selectedRideModal.estimatedArrivalTime || '~'}
                    </span>
                  </div>
                </div>
                {selectedRideModal.isRecurring && (
                  <div className="text-[11px] text-purple-900 bg-purple-50 p-2 rounded-xl border border-purple-200 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">event_repeat</span>
                    <span>Transport récurrent : {selectedRideModal.recurringDates?.length || 1} dates de transport programmées.</span>
                  </div>
                )}
              </div>

              {/* Véhicule & Transporteur */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/30">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Mode Prescrit</span>
                  <p className="font-bold text-on-surface mt-1">{getVehicleLabel(selectedRideModal.transportType)}</p>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">
                    {selectedRideModal.mobility.stretcher ? 'Brancardage complet' : selectedRideModal.mobility.wheelchair ? 'Fauteuil roulant' : 'Position assise'}
                  </p>
                </div>

                <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/30">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Équipage Sanitaire</span>
                  <p className="font-bold text-on-surface mt-1">
                    {selectedRideModal.assignedTransporter?.companyName || 'En attente d\'attribution'}
                  </p>
                  {selectedRideModal.assignedTransporter && (
                    <p className="text-primary font-semibold text-[11px] mt-0.5">
                      Chauffeur : {selectedRideModal.assignedTransporter.driverName} ({selectedRideModal.assignedTransporter.vehiclePlate})
                    </p>
                  )}
                </div>
              </div>

              {/* Fiche Prescription Médicale de Transport (PMT) */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                    <span className="material-symbols-outlined text-base">description</span>
                    <span>Prescription Médicale de Transport (PMT)</span>
                  </div>
                  {selectedRideModal.patient.hasPmt || selectedRideModal.patient.pmtUploaded || selectedRideModal.patient.pmtFileUrl ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Document Joint
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      Version Papier
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-on-surface-variant block text-[10px]">Médecin Prescripteur :</span>
                    <strong className="text-on-surface">{selectedRideModal.patient.pmtPrescriberDoctor || 'Médecin Référent'}</strong>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px]">Prise en Charge CPAM :</span>
                    <strong className="text-emerald-700">{selectedRideModal.patient.isAld ? '100% ALD / Tiers-Payant' : 'Conventionnée CPAM 65%'}</strong>
                  </div>
                </div>

                {selectedRideModal.patient.hasPmt || selectedRideModal.patient.pmtUploaded || selectedRideModal.patient.pmtFileUrl ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-emerald-700 text-lg shrink-0">attach_file</span>
                      <span className="text-[11px] text-emerald-950 font-semibold truncate">
                        {selectedRideModal.patient.pmtFileName || 'Prescription_Medicale_S3138.pdf'}
                      </span>
                    </div>
                    <a
                      href={selectedRideModal.patient.pmtFileUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shrink-0"
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      <span>Consulter la PMT</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-700 text-base shrink-0 mt-0.5">info</span>
                    <span>
                      Vous avez indiqué présenter la <strong>prescription Cerfa S3138 en version papier</strong>. Remettez-la directement au chauffeur lors de votre montée dans le véhicule.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-outline-variant/20 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {selectedRideModal.status !== 'COMPLETED' && selectedRideModal.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedRideModal;
                      setSelectedRideModal(null);
                      openCancelModal(r);
                    }}
                    className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-base">cancel</span>
                    <span>Annuler ce transport</span>
                  </button>
                )}

                {selectedRideModal.status === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = selectedRideModal;
                      setSelectedRideModal(null);
                      openRenewModal(r);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Renouveler ce transport avec nouvelle date et service"
                  >
                    <span className="material-symbols-outlined text-base">autorenew</span>
                    <span>Renouveler cette course</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedRideModal(null)}
                className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-highest transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Annulation Demandeur / Patient (Règle des 24h00) */}
      {rideToCancel && (() => {
        const hoursUntilPickup = getHoursUntilPickup(rideToCancel);
        const canCancelOnline = hoursUntilPickup >= 24;
        const transporterPhone = rideToCancel.assignedTransporter?.driverPhone || '0596 75 20 20';
        const transporterCompany = rideToCancel.assignedTransporter?.companyName || 'Médic\'Trans Régulation 972';

        return (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    canCancelOnline ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <span className="material-symbols-outlined text-lg">
                      {canCancelOnline ? 'cancel' : 'lock_clock'}
                    </span>
                  </span>
                  <h3 className="text-base font-bold text-on-surface">
                    Annulation de la course #{rideToCancel.reference}
                  </h3>
                </div>
                <button
                  onClick={() => setRideToCancel(null)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {!canCancelOnline ? (
                /* CAS < 24h00 : Annulation en ligne bloquée, contact direct transporteur obligatoire */
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-950 space-y-2">
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-900 text-sm">
                      <span className="material-symbols-outlined text-amber-700 text-base">warning</span>
                      <span>Annulation en ligne non autorisée (&lt; 24h00)</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                      Pour un fonctionnement fluide de la plateforme, <strong>l'annulation autonome en ligne est possible uniquement jusqu'à 24h00 avant l'heure de prise en charge</strong>.
                    </p>
                    <p className="leading-relaxed text-[11px]">
                      Votre trajet étant prévu dans <strong>{hoursUntilPickup <= 0 ? 'moins d\'une heure (ou aujourd\'hui)' : `environ ${Math.round(hoursUntilPickup)} heures`}</strong>, vous devez <strong>contacter directement le transporteur</strong> mandaté pour avertir le chauffeur et la régulation.
                    </p>
                  </div>

                  <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30 space-y-2 text-xs">
                    <span className="font-bold text-on-surface text-[11px] uppercase tracking-wider block">
                      Transporteur à joindre impérativement :
                    </span>
                    <div>
                      <div className="font-extrabold text-sm text-on-surface">{transporterCompany}</div>
                      {rideToCancel.assignedTransporter?.driverName && (
                        <div className="text-on-surface-variant text-[11px]">
                          Chauffeur : {rideToCancel.assignedTransporter.driverName} ({rideToCancel.assignedTransporter.vehiclePlate})
                        </div>
                      )}
                    </div>
                    <a
                      href={`tel:${transporterPhone.replace(/\s+/g, '')}`}
                      className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-base">call</span>
                      <span>Appeler le transporteur : {transporterPhone}</span>
                    </a>
                  </div>

                  <div className="pt-2 flex items-center justify-end border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => setRideToCancel(null)}
                      className="px-5 py-2.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-all"
                    >
                      Compris, je garde ma réservation
                    </button>
                  </div>
                </div>
              ) : (
                /* CAS >= 24h00 : Annulation en ligne autorisée */
                <>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-base shrink-0">verified</span>
                    <span>
                      <strong>Annulation en ligne autorisée :</strong> Votre demande intervient à plus de 24h avant la prise en charge (délai restant : ~{Math.round(hoursUntilPickup)}h).
                    </span>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Êtes-vous certain de vouloir annuler ce transport sanitaire ? Si un chauffeur avait déjà été mobilisé, il sera automatiquement libéré.
                  </p>

                  <div className="space-y-2 text-xs">
                    <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                      Motif de l'annulation :
                    </label>
                    {[
                      { id: 'RDV_REPORTE', label: '📅 Rendez-vous médical décalé ou reporté' },
                      { id: 'ETAT_SANTE', label: '🩺 Évolution clinique / consultation non nécessaire' },
                      { id: 'PROCHE_TRANSPORTE', label: '🚗 Transport assuré par un proche / famille' },
                      { id: 'ERREUR_DEMANDE', label: '⚠️ Erreur lors de la réservation' },
                      { id: 'AUTRE', label: '📝 Autre motif' }
                    ].map((reason) => (
                      <label
                        key={reason.id}
                        onClick={() => setCancelReason(reason.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          cancelReason === reason.id
                            ? 'border-rose-300 bg-rose-50/70 text-rose-900 font-semibold'
                            : 'border-outline-variant/30 hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <input
                          type="radio"
                          name="patientCancelReason"
                          value={reason.id}
                          checked={cancelReason === reason.id}
                          onChange={() => setCancelReason(reason.id)}
                          className="accent-rose-600"
                        />
                        <span>{reason.label}</span>
                      </label>
                    ))}

                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mt-2 mb-1">
                        Commentaire (optionnel) :
                      </label>
                      <input
                        type="text"
                        value={cancelCustomNote}
                        onChange={(e) => setCancelCustomNote(e.target.value)}
                        placeholder="Précisions éventuelles..."
                        className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => setRideToCancel(null)}
                      className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
                    >
                      Garder ma réservation
                    </button>
                    <button
                      type="button"
                      onClick={confirmCancelRide}
                      className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">cancel</span>
                      <span>Confirmer l'annulation</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal Renouvellement de Course Terminée */}
      {rideToRenew && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-lg w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-2xs">
                  <span className="material-symbols-outlined text-xl">autorenew</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Renouveler ce transport médical
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    Basé sur la course #{rideToRenew.reference} • {rideToRenew.pickupCity} ➔ {rideToRenew.dropoffCity}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRideToRenew(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Synthèse trajet & patient conservés */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-primary">
                <span>Patient : {rideToRenew.patient.firstName} {rideToRenew.patient.lastName}</span>
                <span>{getVehicleLabel(rideToRenew.transportType)}</span>
              </div>
              <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                <span className="font-semibold text-on-surface">{rideToRenew.pickupAddress}</span>
                <span>➔</span>
                <span className="font-semibold text-on-surface">{rideToRenew.facilityName || rideToRenew.dropoffAddress}</span>
              </div>
              <div className="pt-1.5 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-emerald-700 font-semibold">
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Prescription PMT &amp; Tiers-Payant conservés
                </span>
                <span>{rideToRenew.patient.isAld ? 'Exonération ALD 100%' : 'Conventionné CPAM'}</span>
              </div>
            </div>

            {/* Formulaire d'ajustement demandé par l'utilisateur */}
            <form onSubmit={(e) => { e.preventDefault(); handleConfirmRenew(); }} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Date du transport à corriger */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
                    <span>Date du nouveau transport *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={renewDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRenewDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                  />
                  <span className="text-[10px] text-on-surface-variant mt-0.5 block">
                    Indiquez la date de votre prochaine séance
                  </span>
                </div>

                {/* 2. Heure de rendez-vous médical */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-sm">alarm</span>
                    <span>Heure du RDV médical *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={renewAppointmentTime}
                    onChange={(e) => setRenewAppointmentTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono font-bold text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                  />
                  <span className="text-[10px] text-on-surface-variant mt-0.5 block">
                    Heure de votre convocation sur place
                  </span>
                </div>
              </div>

              {/* 3. Service hospitalier éventuellement à corriger */}
              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-sm">local_hospital</span>
                  <span>Service / Étage / Chambre (éventuellement à corriger)</span>
                </label>
                <input
                  type="text"
                  value={renewDepartment}
                  onChange={(e) => setRenewDepartment(e.target.value)}
                  placeholder="ex: Oncologie - Bâtiment C, Consultation Cardiologie, Étage 3..."
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                />
                <span className="text-[10px] text-on-surface-variant mt-0.5 block">
                  Précisez le service si votre rendez-vous a changé d'aile ou d'étage.
                </span>
              </div>

              {/* 4. Aller-retour */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={renewIsRoundTrip}
                  onChange={(e) => setRenewIsRoundTrip(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-on-surface block">Trajet aller-retour</span>
                  <span className="text-[10px] text-on-surface-variant">Prévoir le transport retour après la fin des soins</span>
                </div>
              </label>

              {/* 5. Précisions complémentaires */}
              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">
                  Informations complémentaires pour le transporteur (optionnel) :
                </label>
                <textarea
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  placeholder="Consignes particulières, code porte, accompagnant..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-primary flex items-start gap-2">
                <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">info</span>
                <span>
                  Le transporteur conventionné calculera l'heure de prise en charge à votre domicile selon la durée du trajet et vous la confirmera dès acceptation.
                </span>
              </div>

              {/* Boutons actions */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRideToRenew(null)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isRenewing || !renewDate || !renewAppointmentTime}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  {isRenewing ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Confirmer et créer la nouvelle demande</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 max-w-md bg-surface-container-lowest text-on-surface p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 border border-secondary/30 animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base">check_circle</span>
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-on-surface text-sm">{toastMessage.title}</div>
            <p className="text-on-surface-variant mt-0.5 leading-relaxed">{toastMessage.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
};
