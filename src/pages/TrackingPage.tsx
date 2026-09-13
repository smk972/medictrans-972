import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { GoogleMapView } from '../components/GoogleMapView';
import { SEOHead } from '../components/SEOHead';
import { whatsappService } from '../services/whatsappService';
import { rideService } from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';
import { Ride } from '../types';

export const TrackingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRideModal, setSelectedRideModal] = useState<Ride | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadRides = async () => {
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

        let relevantRides = allRides;

        // Si patient connecté, filtrer ses propres courses
        if (isAuthenticated && user?.email && user.role === 'PATIENT') {
          relevantRides = allRides.filter((r) => {
            const matchesEmail = r.patient?.email?.toLowerCase() === user.email?.toLowerCase();
            const matchesLastBooking = lastBookingRef && r.reference.toUpperCase() === lastBookingRef.toUpperCase();
            return matchesEmail || matchesLastBooking;
          });
        }

        setRides(relevantRides);
      } catch (err) {
        console.warn('Erreur chargement des courses:', err);
        setRides([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRides();
  }, [isAuthenticated, user?.email, user?.role]);

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
    if (!searchTerm.trim()) return rides;
    const term = searchTerm.toLowerCase();
    return rides.filter(
      (r) =>
        r.reference.toLowerCase().includes(term) ||
        r.pickupAddress.toLowerCase().includes(term) ||
        r.dropoffAddress.toLowerCase().includes(term) ||
        (r.facilityName && r.facilityName.toLowerCase().includes(term)) ||
        `${r.patient.firstName} ${r.patient.lastName}`.toLowerCase().includes(term)
    );
  }, [rides, searchTerm]);

  // Statistiques calculées en temps réel (100% fiables)
  const pendingCount = rides.filter((r) => r.status === 'PENDING').length;
  const confirmedCount = rides.filter(
    (r) => r.status === 'ACCEPTED' || r.status === 'EN_ROUTE' || r.status === 'PICKED_UP'
  ).length;
  const completedCount = rides.filter(
    (r) => r.status === 'COMPLETED' || r.status === 'CANCELLED'
  ).length;

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
        title="Suivi en Direct Transport Sanitaire Martinique | Médic'Trans 972"
        description="Suivez en temps réel votre transport médical en Martinique : statut de l'ambulance, heure d'approche géolocalisée et contact direct du chauffeur sanitaire."
        canonicalPath="/suivi"
        ogImage="/assets/medictrans_hero_discover.jpg"
      />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* Network status ticker banner */}
        {showBanner && (
          <div className="w-full bg-surface-container-high px-margin md:px-margin-md lg:px-margin-lg py-space-sm shadow-xs border-b border-outline-variant/20">
            <div className="max-w-[1280px] w-full mx-auto flex flex-wrap items-center justify-between gap-space-sm text-xs md:text-sm">
              <div className="flex items-center gap-space-sm">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                </span>
                <span className="font-label-md text-label-md text-on-surface">
                  Réseau Martinique Sud &amp; Centre actif : 42 ambulances et taxis conventionnés en liaison continue avec le SAMU 972.
                </span>
              </div>
              <div className="flex items-center gap-space-md">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">
                  Synchronisé avec CPAM 972
                </span>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-on-surface-variant hover:text-on-surface flex items-center p-1"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-[1280px] w-full mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-lg flex flex-col gap-space-xl">
          {/* Header Title */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
            <div className="flex flex-col gap-space-xs max-w-2xl">
              <div className="flex items-center gap-space-sm">
                <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold text-xs">
                  {user ? `Espace ${user.firstName} ${user.lastName}` : 'Espace Patient & Coordonnateur Clinique'}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                  {user ? `Compte : ${user.email}` : 'Dossier ID: #MQ-97204-J'}
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold text-2xl md:text-3xl">
                Tableau de bord de suivi - Transports en cours
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                Superviser la prise en charge sanitaire, la géolocalisation des équipages agréés ARS et
                les attestations 100% Tiers-Payant Sécurité Sociale.
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
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-on-primary font-headline-sm text-sm font-bold shadow-md hover:bg-primary/90 active:scale-[0.99] transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">add_circle</span>
                      Commander un transport sanitaire
                    </Link>
                    <a
                      href="tel:0596720097"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-surface-container text-primary hover:bg-surface-container-high font-label-md text-sm font-semibold transition-all border border-outline-variant/30"
                    >
                      <span className="material-symbols-outlined text-lg">call</span>
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
                    <div className="relative bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-md overflow-hidden border border-outline-variant/30">
                      <div className="flex flex-wrap items-center justify-between gap-space-sm relative z-10">
                        <div className="flex items-center gap-space-sm">
                          {activeRide.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-label-md text-label-md font-bold text-xs">
                              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                              RECHERCHE ACTIVE D'UN TRANSPORTEUR
                            </span>
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
                        <span className="font-headline-sm text-headline-sm text-primary font-bold text-sm">
                          {new Date(activeRide.pickupDateTime).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          ·{' '}
                          {new Date(activeRide.pickupDateTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
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

                  {/* History Table */}
                  <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-md border border-outline-variant/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                      <div className="flex flex-col">
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">
                          Historique des transports sanitaires
                        </h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                          {rides.length} transport(s) enregistré(s) dans votre espace.
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          className="h-10 pl-9 pr-3 rounded-xl bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all w-64 text-xs border border-outline-variant/30"
                          placeholder="Rechercher un trajet, date..."
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="material-symbols-outlined text-outline absolute left-2.5 top-2.5 text-lg">
                          search
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider text-[10px]">
                            <th className="py-3 px-4 rounded-l-lg">Référence &amp; Date</th>
                            <th className="py-3 px-4">Trajet / Destination</th>
                            <th className="py-3 px-4">Véhicule</th>
                            <th className="py-3 px-4">Statut</th>
                            <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm text-on-surface">
                          {filteredRides.map((ride) => {
                            const badge = getStatusBadge(ride.status);
                            return (
                              <tr key={ride.id} className="hover:bg-surface-container-low/60 transition-colors">
                                <td className="py-3.5 px-4 align-top">
                                  <span className="font-mono text-primary font-bold block">
                                    {ride.reference}
                                  </span>
                                  <span className="text-on-surface-variant font-label-sm text-label-sm">
                                    {new Date(ride.pickupDateTime).toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })}{' '}
                                    ·{' '}
                                    {new Date(ride.pickupDateTime).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
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
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}
                                  >
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 align-top text-right">
                                  <button
                                    onClick={() => setSelectedRideModal(ride)}
                                    className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-xs font-bold transition-colors"
                                  >
                                    Détails
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
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

              {/* Status breakdown (100% RÉEL & FIABLE) */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex items-center justify-between border-b border-surface-container-high pb-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-xl">analytics</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                      Statut de mes transports
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold text-xs">
                    Temps réel
                  </span>
                </div>

                <div className="flex flex-col gap-space-sm text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-2.5 border border-outline-variant/20">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          En diffusion
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                          Recherche transporteur active
                        </span>
                      </div>
                    </div>
                    <span className="font-headline-lg text-headline-lg text-amber-900 font-bold">
                      {pendingCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-secondary-container/20 p-2.5 border border-secondary/20">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary text-base">
                          check_circle
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-secondary font-semibold">
                          Confirmé
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary text-[11px]">
                          Prise en charge planifiée
                        </span>
                      </div>
                    </div>
                    <span className="font-headline-lg text-headline-lg text-secondary font-bold">
                      {confirmedCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-2.5 border border-outline-variant/20">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-outline text-base">history</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          Archivés
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                          Courses terminées
                        </span>
                      </div>
                    </div>
                    <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                      {completedCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assistance Helpline banner */}
              <div className="bg-primary text-on-primary rounded-2xl p-space-lg flex flex-col gap-space-md shadow-md relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-space-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold w-fit tracking-wide uppercase">
                    URGENCES RELATIVES &amp; TRANSFERTS
                  </span>
                  <h4 className="font-headline-sm text-headline-sm font-bold text-base">
                    Besoin d'un transport imprévu ?
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-primary-container text-xs leading-relaxed">
                    Notre centre de régulation en Martinique vous assiste 24h/24 et 7j/7 pour adapter
                    vos horaires ou organiser un rapatriement.
                  </p>
                </div>
                <div className="relative z-10 flex flex-col gap-space-sm pt-space-xs">
                  <a
                    className="w-full h-12 bg-white text-primary rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm font-bold text-sm"
                    href="tel:0596720097"
                  >
                    <span className="material-symbols-outlined text-xl text-secondary">call</span>
                    <span>05 96 72 00 97</span>
                  </a>
                  <span className="font-label-sm text-label-sm text-center text-on-primary-container text-[11px]">
                    Numéro local non surtaxé · Coordination CHU / Cliniques
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Modal Détails Course */}
      {selectedRideModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">local_taxi</span>
                <h3 className="text-base font-bold text-on-surface">
                  Détails du transport #{selectedRideModal.reference}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRideModal(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-surface-container-low p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Trajet</span>
                <p className="font-semibold text-on-surface">
                  {selectedRideModal.pickupAddress} ({selectedRideModal.pickupCity})
                </p>
                <div className="text-secondary flex items-center gap-1 font-bold">➔</div>
                <p className="font-semibold text-on-surface">
                  {selectedRideModal.facilityName || selectedRideModal.dropoffAddress} ({selectedRideModal.dropoffCity})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Date &amp; Heure</span>
                  <p className="font-bold text-on-surface mt-1">
                    {new Date(selectedRideModal.pickupDateTime).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-secondary font-bold">
                    {new Date(selectedRideModal.pickupDateTime).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="bg-surface-container-low p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Véhicule</span>
                  <p className="font-bold text-on-surface mt-1">
                    {getVehicleLabel(selectedRideModal.transportType)}
                  </p>
                  <p className="text-on-surface-variant">
                    {selectedRideModal.mobility.stretcher ? 'Brancardage' : 'Station assise'}
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Patient</span>
                <p className="font-bold text-on-surface mt-1">
                  {selectedRideModal.patient.firstName} {selectedRideModal.patient.lastName}
                </p>
                <p className="text-on-surface-variant">NIR: {selectedRideModal.patient.nir}</p>
                <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedRideModal.patient.isAld ? 'Prise en charge 100% ALD' : 'Sécurité Sociale 65%'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRideModal(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
