import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleMapView } from '../components/GoogleMapView';
import { SEOHead } from '../components/SEOHead';
import { rideService } from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';
import { Ride } from '../types';

export const TransporterPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState<'ALL' | 'CENTRE' | 'SUD' | 'NORD'>('ALL');
  const [vehicleFilter, setVehicleFilter] = useState<'ALL' | 'AMBULANCE' | 'VSL' | 'TAXI'>('ALL');
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const loadMissions = async () => {
    setIsLoading(true);
    try {
      const all = await rideService.getAllRides();
      setRides(all);
    } catch (e) {
      console.warn('Erreur chargement missions transporteur:', e);
      setRides([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadMissions();
  }, []);

  // Filtrage des missions disponibles
  const availableMissions = useMemo(() => {
    return rides.filter((r) => {
      if (r.status !== 'PENDING') return false;

      // Filtre Véhicule
      if (vehicleFilter === 'AMBULANCE' && r.transportType !== 'AMBULANCE') return false;
      if (vehicleFilter === 'VSL' && r.transportType !== 'VSL') return false;
      if (vehicleFilter === 'TAXI' && r.transportType !== 'TAXI_CONVENTIONNE') return false;

      // Filtre Secteur
      if (sectorFilter === 'CENTRE') {
        const c = (r.pickupCity + ' ' + r.dropoffCity).toLowerCase();
        if (!c.includes('fort-de-france') && !c.includes('lamentin') && !c.includes('schoelcher') && !c.includes('ducos')) return false;
      } else if (sectorFilter === 'SUD') {
        const c = (r.pickupCity + ' ' + r.dropoffCity).toLowerCase();
        if (!c.includes('marin') && !c.includes('salée') && !c.includes('luce') && !c.includes('diamant')) return false;
      } else if (sectorFilter === 'NORD') {
        const c = (r.pickupCity + ' ' + r.dropoffCity).toLowerCase();
        if (!c.includes('trinité') && !c.includes('marie') && !c.includes('pierre') && !c.includes('robert')) return false;
      }

      return true;
    });
  }, [rides, vehicleFilter, sectorFilter]);

  // Missions acceptées par le transporteur
  const acceptedMissions = useMemo(() => {
    return rides.filter(
      (r) => r.status === 'ACCEPTED' || r.status === 'EN_ROUTE' || r.status === 'PICKED_UP' || r.status === 'COMPLETED'
    );
  }, [rides]);

  const handleAcceptMission = async (mission: Ride) => {
    try {
      await rideService.updateRideStatus(mission.reference, 'ACCEPTED', {
        companyName: user?.transporterName || 'Ambulances Caraïbes Express',
        driverName: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Équipage 972',
        driverPhone: user?.phone || '0596 63 45 45',
        vehiclePlate: 'GH-972-MQ',
        etaMinutes: 15,
      });

      setToastMessage({
        title: 'Mission acceptée !',
        desc: `La course #${mission.reference} (${mission.patient.firstName} ${mission.patient.lastName}) vous a été affectée. L'itinéraire et la prise en charge CPAM 100% sont validés.`,
      });

      setTimeout(() => {
        setToastMessage(null);
      }, 5000);

      await loadMissions();
    } catch (err) {
      console.error('Erreur acceptation:', err);
    }
  };

  const handleDeclineMission = async (mission: Ride) => {
    // Retirer temporairement de l'affichage local
    setRides((prev) => prev.filter((r) => r.id !== mission.id));
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary">
      <SEOHead
        title="Espace Transporteurs Sanitaires Martinique | Agréments ARS & Flottes 972"
        description="Console télématique pour les ambulanciers, VSL et taxis conventionnés de Martinique. Réception des courses en direct, régulation ARS et télétransmission CPAM."
        canonicalPath="/transporteurs"
        ogImage="/assets/medictrans_hero_discover.jpg"
      />

      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex flex-col pt-space-md pb-space-lg shadow-[0_1px_8px_rgba(11,28,48,0.04)]">
        <div className="px-space-md pb-space-md flex items-center gap-space-sm">
          <Link to="/" className="flex items-center gap-space-sm">
            <img alt="Logo Médic'Trans Martinique" className="h-7 w-auto object-contain" src="/assets/logo-icon.svg" />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary">Médic'Trans</span>
              <span className="font-label-sm text-label-sm text-secondary">Plateforme Régionale 972</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-space-sm flex flex-col gap-space-xs mt-space-sm">
          <Link
            className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary font-bold transition-colors"
            to="/transporteurs"
          >
            <span className="material-symbols-outlined">local_shipping</span>
            <span className="font-label-md text-label-md">Console Dispatch</span>
          </Link>
          <Link
            className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            to="/suivi"
          >
            <span className="material-symbols-outlined">alt_route</span>
            <span className="font-label-md text-label-md">Suivi des courses</span>
          </Link>
          <Link
            className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            to="/etablissements"
          >
            <span className="material-symbols-outlined">domain</span>
            <span className="font-label-md text-label-md">Portail Établissements</span>
          </Link>
          <Link
            className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            to="/inscription/transporteur"
          >
            <span className="material-symbols-outlined">app_registration</span>
            <span className="font-label-md text-label-md">Agrément &amp; Flotte</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-primary hover:bg-primary/10 transition-colors font-medium text-sm mt-4"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span>Retour au site public</span>
          </Link>
        </nav>
        <div className="px-space-md pt-space-md bg-surface-container-low mx-space-sm rounded-lg">
          <div className="flex items-center gap-space-xs mb-1">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-label-sm text-label-sm text-secondary font-bold">Permanence Régul. 972</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-1">CHU Zobda-Quitman &amp; SAMU</p>
          <a href="tel:0596720097" className="font-label-md text-label-md text-primary font-bold hover:underline">
            05 96 72 00 97
          </a>
        </div>
      </aside>

      <div className="pl-72">
        <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.04)] z-40 flex items-center justify-between px-space-lg">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-md text-label-md text-on-surface-variant">Secteur Régional :</span>
            <span className="font-label-md text-label-md text-primary font-bold">Martinique Centre &amp; Nord/Sud</span>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-label-sm text-label-sm text-secondary">24/7 En ligne</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-outline-variant/30">
              {user?.firstName?.[0] || 'T'}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-label-md text-label-md text-on-surface leading-none">
                {user?.transporterName || 'Ambulances Caraïbes Express'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-1">
                {user?.email || 'Conventionné CPAM 972'}
              </span>
            </div>
          </div>
        </header>

        <main className="relative pt-16 bg-surface w-full px-space-lg py-space-lg min-h-screen">
          <div className="flex flex-col w-full gap-space-lg">
            {/* Header Banner */}
            <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-sm flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Flux Direct Régulation 972
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold text-2xl">
                  Portail Transporteur — Régulation &amp; Opportunités de courses
                </h1>
              </div>
              <div className="flex items-center gap-space-md bg-surface-container-low p-space-md rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-2xl">local_shipping</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                      {user?.transporterName || 'Ambulances Caraïbes Express'}
                    </span>
                    <span className="material-symbols-outlined text-secondary text-base" title="Agréé ARS & CPAM">
                      verified
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-on-surface-variant">
                    <span className="font-label-sm text-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface font-semibold">
                      Conventionné CPAM 972
                    </span>
                    <span className="font-label-sm text-label-sm flex items-center gap-1 text-secondary font-bold">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                      Flotte opérationnelle
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Cards (100% RÉEL & SYNCHRONISÉ) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between h-full border border-outline-variant/20">
                <div className="flex flex-col justify-between h-full gap-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">
                    Missions dispo.
                  </span>
                  <div className="font-headline-lg text-headline-lg text-primary font-bold text-3xl">
                    {availableMissions.length}
                  </div>
                  <span className="font-body-sm text-body-sm text-secondary font-semibold flex items-center gap-1 text-xs">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    {availableMissions.length > 0 ? `${availableMissions.length} en attente immédiate` : 'Aucune demande en attente'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-2xl">radar</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between h-full border border-outline-variant/20">
                <div className="flex flex-col justify-between h-full gap-1">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">
                    Planning du jour
                  </span>
                  <div className="font-headline-lg text-headline-lg text-on-surface font-bold text-3xl">
                    {acceptedMissions.length}
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 text-xs">
                    <span className="material-symbols-outlined text-sm text-secondary">check_circle</span>
                    {acceptedMissions.length} courses validées
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-2xl">task_alt</span>
                </div>
              </div>

              <div className="bg-primary text-on-primary p-space-md rounded-xl shadow-sm flex items-center justify-between h-full">
                <div className="flex flex-col justify-between h-full gap-1">
                  <span className="font-label-sm text-label-sm text-on-primary-container uppercase font-bold tracking-wider text-xs">
                    Régul. SAMU 972
                  </span>
                  <div className="font-headline-md text-headline-md font-bold text-white text-xl">
                    Ligne Ouverte
                  </div>
                  <span className="font-body-sm text-body-sm text-surface-variant font-medium flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    Canal Prioritaire Dédié
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-inner">
                  <span className="material-symbols-outlined text-2xl">phone_in_talk</span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-xs text-on-surface">
                  <span className="material-symbols-outlined text-primary text-xl">tune</span>
                  <span className="font-headline-sm text-headline-sm font-bold text-sm">
                    Filtrer les opportunités
                  </span>
                </div>
                <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm text-xs">
                  <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                  Synchronisé en continu avec la base de régulation
                </div>
              </div>

              <div className="flex flex-col gap-space-sm">
                <div className="flex flex-wrap items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase mr-1 text-xs">
                    Secteur :
                  </span>
                  {(['ALL', 'CENTRE', 'SUD', 'NORD'] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSectorFilter(sec)}
                      className={`px-3.5 py-1.5 rounded-full font-label-md text-xs font-bold transition-all ${
                        sectorFilter === sec
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {sec === 'ALL'
                        ? `Tous (${availableMissions.length})`
                        : sec === 'CENTRE'
                        ? 'Centre (FDF / Lamentin)'
                        : sec === 'SUD'
                        ? 'Sud (Ducos / Marin)'
                        : 'Nord (Trinité / Marie)'}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-space-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase mr-1 text-xs">
                    Véhicule :
                  </span>
                  {(['ALL', 'AMBULANCE', 'VSL', 'TAXI'] as const).map((veh) => (
                    <button
                      key={veh}
                      type="button"
                      onClick={() => setVehicleFilter(veh)}
                      className={`px-3 py-1.5 rounded-lg font-label-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                        vehicleFilter === veh
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      <span>{veh === 'AMBULANCE' ? '🚑' : veh === 'VSL' ? '🚐' : veh === 'TAXI' ? '🚗' : '✨'}</span>
                      {veh === 'ALL' ? 'Tous véhicules' : veh === 'AMBULANCE' ? 'Ambulance' : veh === 'VSL' ? 'VSL' : 'Taxi conventionné'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
              {/* Available Missions Column */}
              <div className="xl:col-span-8 flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold text-lg">
                      Missions disponibles immédiatement
                    </h2>
                    <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-label-sm text-xs font-bold flex items-center justify-center">
                      {availableMissions.length}
                    </span>
                  </div>
                  <button
                    onClick={loadMissions}
                    className="font-label-md text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-base">refresh</span> Actualiser
                  </button>
                </div>

                {isLoading ? (
                  <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/30">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs text-on-surface-variant">Recherche des courses en direct...</p>
                  </div>
                ) : availableMissions.length === 0 ? (
                  /* ENCART BLANC TRANSPORTEUR QUAND AUCUNE MISSION N'EST EN COURS */
                  <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-12 shadow-sm flex flex-col items-center justify-center text-center border border-outline-variant/30">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
                      <span className="material-symbols-outlined text-3xl">task_alt</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold text-xl mb-2">
                      Vous n'avez aucune mission en cours.
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto text-sm leading-relaxed mb-6">
                      Toutes les nouvelles opportunités et demandes de transport sanitaire émises par les patients et les établissements de santé (CHU Pierre Zobda-Quitman, Trinité, Le Marin) apparaîtront ici dès leur diffusion.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high text-secondary text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                      Écoute active du réseau de régulation Martinique 972
                    </div>
                  </div>
                ) : (
                  availableMissions.map((mission) => (
                    <article
                      key={mission.id}
                      className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md relative overflow-hidden transition-all border border-outline-variant/30"
                    >
                      <div className="w-2 absolute left-0 top-0 bottom-0 bg-primary"></div>
                      <div className="flex flex-wrap items-center justify-between gap-space-sm pl-2">
                        <div className="flex items-center gap-space-xs flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-label-sm text-xs font-bold animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                            DISPONIBLE IMMÉDIATEMENT
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-xs font-bold">
                            <span>
                              {mission.transportType === 'AMBULANCE'
                                ? '🚑 Ambulance Allongée'
                                : mission.transportType === 'TAXI_CONVENTIONNE'
                                ? '🚗 Taxi conventionné'
                                : '🚐 VSL'}
                            </span>
                          </span>
                        </div>
                        <span className="font-label-sm text-xs text-on-surface-variant font-mono font-bold">
                          REF: {mission.reference}
                        </span>
                      </div>

                      <div className="pl-2 flex flex-col lg:flex-row lg:items-start justify-between gap-space-md bg-surface-container-low p-space-md rounded-lg">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-space-xs">
                            <span className="material-symbols-outlined text-primary">person</span>
                            <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                              {mission.patient.firstName} {mission.patient.lastName}
                            </span>
                          </div>
                          <p className="font-body-sm text-xs text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-secondary text-base">verified</span>
                            {mission.patient.isAld ? 'Prescription 100% ALD validée' : 'Prescription Médicale de Transport (PMT)'}
                          </p>
                          {mission.mobility.notes && (
                            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container text-on-surface font-label-sm text-xs">
                              <span className="material-symbols-outlined text-base text-primary">info</span>
                              <span>{mission.mobility.notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold">
                            Prise en charge
                          </span>
                          <span className="font-headline-md text-primary font-bold text-sm">
                            {new Date(mission.pickupDateTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="font-label-sm text-secondary font-bold text-xs">
                            {new Date(mission.pickupDateTime).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="pl-2 grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
                        <div className="md:col-span-7 flex flex-col gap-space-sm">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center mt-1">
                              <span className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center ring-4 ring-primary-fixed"></span>
                              <span className="w-0.5 h-10 bg-surface-container-highest my-0.5"></span>
                              <span className="w-3.5 h-3.5 rounded-full bg-secondary flex items-center justify-center ring-4 ring-secondary-container"></span>
                            </div>
                            <div className="flex flex-col justify-between h-full gap-3 min-w-0 text-xs">
                              <div>
                                <span className="font-label-sm text-on-surface-variant font-bold uppercase text-[10px]">
                                  Départ
                                </span>
                                <p className="font-headline-sm text-on-surface font-semibold truncate">
                                  {mission.pickupAddress}
                                </p>
                                <span className="font-body-sm text-on-surface-variant">{mission.pickupCity}</span>
                              </div>
                              <div>
                                <span className="font-label-sm text-on-surface-variant font-bold uppercase text-[10px]">
                                  Arrivée
                                </span>
                                <p className="font-headline-sm text-on-surface font-semibold truncate">
                                  {mission.facilityName || mission.dropoffAddress}
                                </p>
                                <span className="font-body-sm text-on-surface-variant">{mission.dropoffCity}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-5 bg-surface-container p-space-md rounded-lg flex flex-col justify-center gap-space-xs text-xs">
                          <div className="flex items-center justify-between text-on-surface">
                            <span className="text-on-surface-variant">Prise en charge CPAM :</span>
                            <span className="font-bold text-secondary">100% Tiers payant</span>
                          </div>
                          <div className="flex items-center justify-between text-on-surface">
                            <span className="text-on-surface-variant">Télétransmission :</span>
                            <span className="font-semibold text-primary">Flux BPEC / Noémie</span>
                          </div>
                        </div>
                      </div>

                      <div className="pl-2 pt-space-xs flex flex-col sm:flex-row items-center justify-end gap-space-sm">
                        <button
                          onClick={() => handleDeclineMission(mission)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                          Décliner
                        </button>
                        <button
                          onClick={() => handleAcceptMission(mission)}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 transition-all shadow-md font-label-lg text-xs font-bold flex items-center justify-center gap-1.5 text-white active:scale-95"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          Accepter cette mission
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>

              {/* Accepted Missions & Map Column */}
              <div className="xl:col-span-4 flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
                  <div className="flex items-center justify-between border-b border-surface-container pb-2">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary">calendar_today</span>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                        Missions acceptées du jour
                      </h3>
                    </div>
                    <span className="font-label-sm text-xs bg-secondary-container text-on-secondary-container font-bold px-2 py-0.5 rounded-full">
                      {acceptedMissions.length} active(s)
                    </span>
                  </div>

                  {acceptedMissions.length === 0 ? (
                    <div className="py-8 text-center text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-1">
                        schedule
                      </span>
                      <p className="font-bold text-on-surface text-sm mb-1">Aucune mission planifiée</p>
                      <p>Vos courses validées apparaîtront dans cette liste avec suivi en direct.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-space-md relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-container-highest">
                      {acceptedMissions.map((m) => (
                        <div key={m.id} className="flex gap-space-sm relative pl-7">
                          <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-xs font-bold absolute left-0 top-0 ring-4 ring-surface-container-lowest">
                            <span className="material-symbols-outlined text-xs">done</span>
                          </span>
                          <div className="flex-1 bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-on-surface">
                                {m.patient.firstName} {m.patient.lastName}
                              </span>
                              <span className="text-secondary font-bold text-[10px]">
                                {m.status === 'COMPLETED' ? 'Terminée' : 'Validée'}
                              </span>
                            </div>
                            <p className="text-on-surface-variant">
                              {m.pickupCity} ➔ {m.facilityName || m.dropoffCity}
                            </p>
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-surface-container text-on-surface-variant text-[11px]">
                              <span className="text-primary font-semibold">#{m.reference}</span>
                              <span className="font-mono font-bold">100% CPAM</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Map Card */}
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-on-surface font-bold text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">map</span> Carte • Flotte en direct
                    </h3>
                    <span className="font-label-sm text-xs text-on-surface-variant font-mono">Martinique (972)</span>
                  </div>
                  <div className="w-full h-48 rounded-xl overflow-hidden relative shadow-inner">
                    <GoogleMapView mode="fleet" height="100%" />
                  </div>
                  <div className="p-2.5 bg-surface-container-low rounded-lg text-xs text-on-surface-variant flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span>Réseau télématique synchronisé avec l'ARS Martinique</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast Confirmation */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 max-w-md bg-surface-container-lowest text-on-surface p-space-md rounded-xl shadow-xl z-50 flex items-start gap-space-sm border border-secondary/30 animate-fadeIn">
          <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary">check_circle</span>
          </div>
          <div className="flex flex-col flex-1 text-xs">
            <span className="font-headline-sm text-sm font-bold text-on-surface">{toastMessage.title}</span>
            <p className="font-body-sm text-on-surface-variant mt-0.5">{toastMessage.desc}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-on-surface-variant hover:text-on-surface" type="button">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}
    </div>
  );
};
