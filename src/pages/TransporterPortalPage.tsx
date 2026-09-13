import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMapView } from '../components/GoogleMapView';
import { SEOHead } from '../components/SEOHead';
import { rideService } from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateMartiniqueRoadDistance, calculateMedicalRidePricing } from '../services/pricingService';
import { Ride, RideStatus, TransportType } from '../types';

interface VehicleFleet {
  id: string;
  name: string;
  type: TransportType;
  plate: string;
  driver: string;
  phone: string;
  status: 'DISPONIBLE' | 'EN_MISSION' | 'EN_PAUSE';
}

const DEFAULT_FLEET: VehicleFleet[] = [
  {
    id: 'fl-1',
    name: 'Ambulance ASSU 01',
    type: 'AMBULANCE',
    plate: 'GH-972-MQ',
    driver: 'Patrick Césaire (Cadre)',
    phone: '0596 75 20 20',
    status: 'DISPONIBLE'
  },
  {
    id: 'fl-2',
    name: 'VSL Médical 02',
    type: 'VSL',
    plate: 'AA-972-FX',
    driver: 'Loïc Marie-Rose (Ambulancier DEA)',
    phone: '0696 34 56 78',
    status: 'DISPONIBLE'
  },
  {
    id: 'fl-3',
    name: 'Taxi Conventionné 03',
    type: 'TAXI_CONVENTIONNE',
    plate: 'BC-972-MQ',
    driver: 'Marcelle Eustache (Chauffeur)',
    phone: '0696 90 12 34',
    status: 'DISPONIBLE'
  }
];

export const TransporterPortalPage: React.FC = () => {
  const { user } = useAuth();

  // State
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BOURSE' | 'ACTIVES' | 'FACTURES' | 'FLOTTE'>('BOURSE');
  const [sectorFilter, setSectorFilter] = useState<'ALL' | 'CENTRE' | 'SUD' | 'NORD'>('ALL');
  const [vehicleFilter, setVehicleFilter] = useState<'ALL' | 'AMBULANCE' | 'VSL' | 'TAXI'>('ALL');
  const [selectedMissionForDetails, setSelectedMissionForDetails] = useState<Ride | null>(null);
  const [missionToAccept, setMissionToAccept] = useState<Ride | null>(null);
  const [missionToDecline, setMissionToDecline] = useState<Ride | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('FLOTTE_INDISPONIBLE');
  const [declinedRefs, setDeclinedRefs] = useState<string[]>(() => {
    return rideService.getDeclinedRideRefs();
  });
  const [fleet, setFleet] = useState<VehicleFleet[]>(DEFAULT_FLEET);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type?: 'success' | 'info' | 'error' } | null>(null);

  // Form affectation véhicule
  const [selectedDriver, setSelectedDriver] = useState<string>(DEFAULT_FLEET[0].driver);
  const [selectedPlate, setSelectedPlate] = useState<string>(DEFAULT_FLEET[0].plate);
  const [selectedEta, setSelectedEta] = useState<number>(15);

  // Nom de la compagnie active
  const transporterName = user?.transporterName || 'Ambulances Madinina Secours';
  const transporterPhone = user?.phone || '0596 75 20 20';

  // Chargement des courses depuis Supabase / Local
  const loadMissions = useCallback(async () => {
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
  }, []);

  // Synchronisation initiale & écoute temps réel Supabase
  useEffect(() => {
    window.scrollTo(0, 0);
    loadMissions();

    const sb = supabase;
    if (isSupabaseConfigured() && sb) {
      const channel = sb
        .channel('realtime-transporter-rides')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rides' },
          (payload) => {
            console.log('📡 Événement temps réel Supabase reçu (Rides):', payload.eventType);
            loadMissions();
          }
        )
        .subscribe();

      return () => {
        sb.removeChannel(channel);
      };
    }
  }, [loadMissions]);

  // Filtrage Bourse aux courses (Status PENDING et non déclinées)
  const availableMissions = useMemo(() => {
    return rides.filter((r) => {
      if (r.status !== 'PENDING') return false;
      if (declinedRefs.includes(r.reference.trim().toUpperCase())) return false;

      // Filtre Véhicule
      if (vehicleFilter === 'AMBULANCE' && r.transportType !== 'AMBULANCE') return false;
      if (vehicleFilter === 'VSL' && r.transportType !== 'VSL') return false;
      if (vehicleFilter === 'TAXI' && r.transportType !== 'TAXI_CONVENTIONNE') return false;

      // Filtre Secteur Martinique
      if (sectorFilter === 'CENTRE') {
        const c = (r.pickupCity + ' ' + r.dropoffCity + ' ' + r.pickupAddress + ' ' + r.dropoffAddress).toLowerCase();
        if (!c.includes('fort-de-france') && !c.includes('lamentin') && !c.includes('schoelcher') && !c.includes('ducos') && !c.includes('cluny')) return false;
      } else if (sectorFilter === 'SUD') {
        const c = (r.pickupCity + ' ' + r.dropoffCity).toLowerCase();
        if (!c.includes('marin') && !c.includes('salée') && !c.includes('luce') && !c.includes('diamant') && !c.includes('trois-îlets')) return false;
      } else if (sectorFilter === 'NORD') {
        const c = (r.pickupCity + ' ' + r.dropoffCity).toLowerCase();
        if (!c.includes('trinité') && !c.includes('marie') && !c.includes('pierre') && !c.includes('robert') && !c.includes('carbet')) return false;
      }

      return true;
    });
  }, [rides, vehicleFilter, sectorFilter, declinedRefs]);

  // Missions actives en cours de réalisation
  const activeMissions = useMemo(() => {
    return rides.filter(
      (r) => r.status === 'ACCEPTED' || r.status === 'EN_ROUTE' || r.status === 'PICKED_UP'
    );
  }, [rides]);

  // Missions clôturées / terminées (Facturation)
  const completedMissions = useMemo(() => {
    return rides.filter((r) => r.status === 'COMPLETED');
  }, [rides]);

  // Total facturé CPAM estimé pour les courses clôturées
  const totalBilledCpam = useMemo(() => {
    return completedMissions.reduce((sum, m) => {
      const pricing = m.pricing || calculateMedicalRidePricing({
        transportType: m.transportType,
        originAddress: m.pickupAddress,
        destinationAddress: m.facilityName || m.dropoffAddress,
        isAld: m.patient.isAld,
        isRoundTrip: m.isRoundTrip
      });
      return sum + (pricing?.cpamAmount || pricing?.totalPrestation || 68.5);
    }, 0);
  }, [completedMissions]);

  // 1-CLIC ACCEPTATION DIRECTE (Fluidité instantanée)
  const handleDirectAccept = async (mission: Ride) => {
    // Sélectionner le véhicule le plus adapté dans la flotte
    const matchingVehicle =
      fleet.find((v) => v.type === mission.transportType && v.status === 'DISPONIBLE') ||
      fleet.find((v) => v.type === mission.transportType) ||
      fleet[0];

    const assignedData = {
      companyName: transporterName,
      driverName: matchingVehicle.driver,
      driverPhone: transporterPhone,
      vehiclePlate: matchingVehicle.plate,
      etaMinutes: 15
    };

    // Mise à jour optimiste immédiate (0ms)
    setRides((prev) =>
      prev.map((r) =>
        r.reference.toUpperCase() === mission.reference.toUpperCase()
          ? { ...r, status: 'ACCEPTED' as RideStatus, assignedTransporter: assignedData }
          : r
      )
    );

    setFleet((prev) =>
      prev.map((v) => (v.plate === matchingVehicle.plate ? { ...v, status: 'EN_MISSION' } : v))
    );

    setToastMessage({
      title: 'Course acceptée avec succès !',
      desc: `Mission #${mission.reference} (${mission.patient.firstName} ${mission.patient.lastName}) affectée à ${matchingVehicle.driver} (${matchingVehicle.plate}).`,
      type: 'success'
    });

    setActiveTab('ACTIVES');

    // Sauvegarde en arrière-plan Supabase / Local
    try {
      await rideService.updateRideStatus(mission.reference, 'ACCEPTED', assignedData);
    } catch (err) {
      console.error('Erreur acceptation directe:', err);
    }
  };

  // Déclencher le modal d'affectation manuelle (Chauffeur / Véhicule / ETA personnalisés)
  const openAcceptModal = (mission: Ride) => {
    setMissionToAccept(mission);
    const match = fleet.find((v) => v.type === mission.transportType) || fleet[0];
    setSelectedDriver(match.driver);
    setSelectedPlate(match.plate);
    setSelectedEta(15);
  };

  const confirmAcceptMission = async () => {
    if (!missionToAccept) return;
    const missionRef = missionToAccept.reference;

    const assignedData = {
      companyName: transporterName,
      driverName: selectedDriver,
      driverPhone: transporterPhone,
      vehiclePlate: selectedPlate,
      etaMinutes: selectedEta
    };

    // Mise à jour optimiste immédiate
    setRides((prev) =>
      prev.map((r) =>
        r.reference.toUpperCase() === missionRef.toUpperCase()
          ? { ...r, status: 'ACCEPTED' as RideStatus, assignedTransporter: assignedData }
          : r
      )
    );

    setFleet((prev) =>
      prev.map((v) => (v.plate === selectedPlate ? { ...v, status: 'EN_MISSION' } : v))
    );

    setToastMessage({
      title: 'Mission validée & affectée !',
      desc: `La course #${missionRef} (${missionToAccept.patient.firstName} ${missionToAccept.patient.lastName}) a été assignée à ${selectedDriver} (${selectedPlate}).`,
      type: 'success'
    });

    setMissionToAccept(null);
    setActiveTab('ACTIVES');

    try {
      await rideService.updateRideStatus(missionRef, 'ACCEPTED', assignedData);
    } catch (err) {
      console.error('Erreur acceptation:', err);
      setToastMessage({
        title: 'Erreur',
        desc: 'Impossible de synchroniser avec le serveur. Vérifiez votre connexion.',
        type: 'error'
      });
    }
  };

  // Déclencher le modal de refus de mission
  const openDeclineModal = (mission: Ride) => {
    setMissionToDecline(mission);
    setDeclineReason('FLOTTE_INDISPONIBLE');
  };

  const confirmDeclineMission = async () => {
    if (!missionToDecline) return;
    const cleanRef = missionToDecline.reference.trim().toUpperCase();

    // Mise à jour optimiste : masque immédiatement la course pour ce transporteur
    const updatedDeclined = [...declinedRefs, cleanRef];
    setDeclinedRefs(updatedDeclined);
    localStorage.setItem('medictrans_declined_missions_972', JSON.stringify(updatedDeclined));

    setToastMessage({
      title: 'Mission déclinée',
      desc: `La course #${cleanRef} a été retirée de votre console. Elle reste disponible pour les autres transporteurs sanitaires de l'île.`,
      type: 'info'
    });

    setMissionToDecline(null);

    try {
      await rideService.declineRide(cleanRef, transporterName, declineReason);
    } catch (err) {
      console.error('Erreur refus:', err);
    }
  };

  // Réinitialiser les refus (très utile lors des tests et démonstrations)
  const handleResetDeclined = () => {
    rideService.resetDeclinedRides();
    setDeclinedRefs([]);
    setToastMessage({
      title: 'Filtre réinitialisé',
      desc: 'Toutes les courses déclinées sont à nouveau affichées dans votre bourse.',
      type: 'info'
    });
  };

  // Mise à jour du statut d'une mission active (En approche -> À bord -> Clôturé)
  const handleUpdateActiveStatus = async (mission: Ride, nextStatus: RideStatus) => {
    // Mise à jour optimiste immédiate
    setRides((prev) =>
      prev.map((r) =>
        r.reference.toUpperCase() === mission.reference.toUpperCase()
          ? { ...r, status: nextStatus }
          : r
      )
    );

    let statusLabel = 'Statut mis à jour';
    if (nextStatus === 'EN_ROUTE') statusLabel = 'Chauffeur en route vers le patient !';
    if (nextStatus === 'PICKED_UP') statusLabel = 'Patient pris en charge à bord !';
    if (nextStatus === 'COMPLETED') {
      statusLabel = 'Mission terminée & télétransmise à la CPAM !';
      setFleet((prev) =>
        prev.map((v) =>
          v.plate === mission.assignedTransporter?.vehiclePlate ? { ...v, status: 'DISPONIBLE' } : v
        )
      );
    }

    setToastMessage({
      title: statusLabel,
      desc: `Course #${mission.reference} (${mission.patient.firstName} ${mission.patient.lastName}).`,
      type: 'success'
    });

    try {
      await rideService.updateRideStatus(mission.reference, nextStatus, {
        companyName: mission.assignedTransporter?.companyName || transporterName,
        driverName: mission.assignedTransporter?.driverName || selectedDriver,
        driverPhone: mission.assignedTransporter?.driverPhone || transporterPhone,
        vehiclePlate: mission.assignedTransporter?.vehiclePlate || selectedPlate,
        etaMinutes: nextStatus === 'EN_ROUTE' ? 10 : nextStatus === 'PICKED_UP' ? 0 : 0
      });
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    }
  };

  // Création d'une course test réelle dans Supabase pour démonstration
  const handleCreateTestMission = async () => {
    try {
      const testRide = await rideService.createRide({
        pickupAddress: '14 Rue Victor Hugo, Place Clémenceau',
        pickupCity: 'Le Lamentin',
        dropoffAddress: 'CHU Pierre Zobda-Quitman, Route de Châteauboeuf',
        dropoffCity: 'Fort-de-France',
        facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
        pickupDateTime: new Date(Date.now() + 45 * 60000).toISOString(),
        isRoundTrip: false,
        transportType: 'VSL',
        source: 'FACILITY',
        facilityDepartment: 'Néphrologie & Dialyse',
        patient: {
          firstName: 'Éliane',
          lastName: 'Moutoussamy',
          birthDate: '1961-04-18',
          nir: '2 61 04 97 215 098 44',
          phone: '0696 22 88 11',
          email: 'eliane.moutoussamy@sante-972.fr',
          address: '14 Rue Victor Hugo',
          city: 'Le Lamentin',
          postalCode: '97232',
          isAld: true,
          aldReason: 'Insuffisance Rénale Chronique (ALD 19)',
          hasPmt: true,
          pmtPrescriberDoctor: 'Dr. Alix Célestine - CHU Martinique'
        },
        mobility: {
          wheelchair: false,
          stretcher: false,
          oxygen: false,
          stairsWithoutElevator: false,
          needsEscort: false,
          notes: 'Séance de dialyse programmée à 14h30 - Patient autonome'
        }
      });

      setToastMessage({
        title: 'Nouvelle demande diffusée !',
        desc: `Course test #${testRide.reference} générée avec succès depuis Le Lamentin vers le CHU.`,
        type: 'info'
      });

      await loadMissions();
    } catch (e) {
      console.error('Erreur création test ride:', e);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans antialiased">
      <SEOHead
        title="Console Dispatch Transporteurs Sanitaires Martinique | Médic'Trans 972"
        description="Console télématique temps réel pour les ambulanciers, VSL et taxis conventionnés 972. Attribution directe, suivi GPS et télétransmission Noémie CPAM."
        canonicalPath="/transporteurs"
      />

      {/* Barre de navigation latérale */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col border-r border-outline-variant/20 shadow-xs hidden md:flex">
        <div className="p-4 border-b border-outline-variant/20 flex items-center gap-3">
          <img alt="Logo Médic'Trans" className="h-8 w-auto object-contain" src="/assets/logo-icon.svg" />
          <div className="flex flex-col">
            <span className="font-headline-sm text-sm font-extrabold text-primary leading-tight">Médic'Trans 972</span>
            <span className="text-[10px] text-secondary font-bold uppercase tracking-wider">Console Dispatch</span>
          </div>
        </div>

        {/* Info Société */}
        <div className="m-3 p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 font-bold flex items-center justify-center text-lg shrink-0">
            🚑
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-on-surface truncate">{transporterName}</div>
            <div className="text-[10px] text-on-surface-variant font-mono truncate">Agrément ARS 972</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('BOURSE')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'BOURSE'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">radar</span>
              <span>Bourse des courses</span>
            </div>
            {availableMissions.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'BOURSE' ? 'bg-white text-primary' : 'bg-primary/10 text-primary'
              }`}>
                {availableMissions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ACTIVES')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'ACTIVES'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
              <span>Missions en cours</span>
            </div>
            {activeMissions.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'ACTIVES' ? 'bg-white text-primary' : 'bg-secondary text-white'
              }`}>
                {activeMissions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FACTURES')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'FACTURES'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              <span>Facturation CPAM</span>
            </div>
            <span className="text-[10px] text-secondary font-mono font-bold">100% BPEC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FLOTTE')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeTab === 'FLOTTE'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">garage</span>
              <span>Flotte & Équipages</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">3 actifs</span>
          </button>
        </nav>

        {/* Support & Régulation 972 */}
        <div className="p-3 m-3 bg-surface-container rounded-xl border border-outline-variant/30 text-xs">
          <div className="flex items-center gap-2 text-secondary font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>Régulation ARS 24/7</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mb-1.5">Ligne d'urgence SAMU / CHU :</p>
          <a
            href="tel:0596720097"
            className="block font-bold text-primary text-sm hover:underline font-mono"
          >
            05 96 72 00 97
          </a>
        </div>

        {/* Lien Retour Site */}
        <div className="p-3 border-t border-outline-variant/20">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors py-1.5 px-2 rounded-lg"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Retour à l'accueil</span>
          </Link>
        </div>
      </aside>

      {/* Contenu Principal */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Header supérieur */}
        <header className="sticky top-0 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/20 z-40 px-4 sm:px-6 h-16 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="md:hidden">
              <Link to="/" className="flex items-center gap-2 text-primary font-bold text-sm">
                <img alt="Logo" className="h-6 w-auto" src="/assets/logo-icon.svg" />
                <span>Médic'Trans</span>
              </Link>
            </span>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-bold text-on-surface">Réseau Télématique Actif :</span>
              <span className="text-secondary font-semibold">Martinique Centre & Agglomération</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadMissions}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-bold text-primary flex items-center gap-1.5 transition-all"
            >
              <span className={`material-symbols-outlined text-base ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span className="hidden sm:inline">Synchroniser</span>
            </button>

            <button
              type="button"
              onClick={handleCreateTestMission}
              className="px-3 py-1.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Créer une nouvelle commande réelle dans Supabase pour tester la réception immédiate"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>+ Course Test</span>
            </button>

            <div className="h-6 w-px bg-outline-variant/30 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-700 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                {transporterName[0] || 'A'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-on-surface truncate max-w-[140px]">
                  {transporterName}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Agréé ARS & CPAM</span>
              </div>
            </div>
          </div>
        </header>

        {/* Onglets Mobile */}
        <div className="md:hidden flex border-b border-outline-variant/20 bg-surface-container-lowest px-2 py-1 overflow-x-auto text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('BOURSE')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'BOURSE' ? 'bg-primary text-white' : 'text-on-surface-variant'
            }`}
          >
            Bourse ({availableMissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVES')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'ACTIVES' ? 'bg-primary text-white' : 'text-on-surface-variant'
            }`}
          >
            En cours ({activeMissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FACTURES')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'FACTURES' ? 'bg-primary text-white' : 'text-on-surface-variant'
            }`}
          >
            Facturation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FLOTTE')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'FLOTTE' ? 'bg-primary text-white' : 'text-on-surface-variant'
            }`}
          >
            Flotte
          </button>
        </div>

        {/* Dashboard Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* Bannière Démo si non connecté en transporteur */}
          {(!user || user.role !== 'TRANSPORTER') && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-amber-900 text-xs shadow-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-lg">verified_user</span>
                <span>
                  <strong>Mode Démonstration Actif (Ambulances Madinina Secours)</strong> — Vous pouvez tester l'ensemble du flux ou vous connecter avec vos identifiants réels.
                </span>
              </div>
              <Link
                to="/connexion"
                state={{ requiredRole: 'TRANSPORTER' }}
                className="font-bold text-amber-800 hover:text-amber-950 underline shrink-0 whitespace-nowrap"
              >
                Se connecter avec mes identifiants ➔
              </Link>
            </div>
          )}

          {/* Bannière KPIs Réels */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Disponibles
                </div>
                <div className="text-2xl font-extrabold text-primary mt-0.5">{availableMissions.length}</div>
                <div className="text-[11px] text-secondary font-semibold mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">radar</span>
                  <span>En attente 972</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
                📡
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  En Approche / À Bord
                </div>
                <div className="text-2xl font-extrabold text-amber-600 mt-0.5">{activeMissions.length}</div>
                <div className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">near_me</span>
                  <span>Missions actives</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl shrink-0">
                🚑
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Clôturées Aujourd'hui
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">{completedMissions.length}</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  <span>Arrivées confirmées</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                🏁
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Télétransmission CPAM
                </div>
                <div className="text-2xl font-extrabold text-secondary mt-0.5">
                  {totalBilledCpam.toFixed(2)} €
                </div>
                <div className="text-[11px] text-secondary font-semibold mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">account_balance</span>
                  <span>100% Noémie BPEC</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center text-xl shrink-0">
                💶
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1 : BOURSE AUX COURSES (DISPONIBLES)                                  */}
          {/* ========================================================================= */}
          {activeTab === 'BOURSE' && (
            <div className="flex flex-col gap-5">
              {/* Barre de filtres */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase mr-1">Secteur :</span>
                  {(['ALL', 'CENTRE', 'SUD', 'NORD'] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSectorFilter(sec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        sectorFilter === sec
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {sec === 'ALL'
                        ? 'Toute la Martinique'
                        : sec === 'CENTRE'
                        ? 'Centre (FDF / Lamentin)'
                        : sec === 'SUD'
                        ? 'Sud (Ducos / Marin)'
                        : 'Nord (Trinité / Marie)'}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-on-surface-variant uppercase mr-1">Véhicule :</span>
                  {(['ALL', 'AMBULANCE', 'VSL', 'TAXI'] as const).map((veh) => (
                    <button
                      key={veh}
                      type="button"
                      onClick={() => setVehicleFilter(veh)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        vehicleFilter === veh
                          ? 'bg-secondary text-white shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span>{veh === 'AMBULANCE' ? '🚑' : veh === 'VSL' ? '🚐' : veh === 'TAXI' ? '🚗' : '✨'}</span>
                      <span>{veh === 'ALL' ? 'Tous' : veh === 'AMBULANCE' ? 'Ambulance' : veh === 'VSL' ? 'VSL' : 'Taxi'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Liste des opportunités */}
              {isLoading ? (
                <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-outline-variant/20 shadow-xs">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-on-surface-variant font-medium">Recherche des courses en direct sur la Martinique...</p>
                </div>
              ) : availableMissions.length === 0 ? (
                /* ENCART BLANC CONFORME LORSQU'AUCUNE MISSION N'EST EN COURS */
                <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-14 text-center border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center animate-fadeIn">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-xs">
                    <span className="material-symbols-outlined text-3xl">task_alt</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight mb-2">
                    Vous n'avez aucune mission en cours.
                  </h2>
                  <p className="text-sm text-on-surface-variant max-w-lg mx-auto leading-relaxed mb-6">
                    Toutes les nouvelles opportunités et demandes de transport sanitaire émises par les patients et les établissements de santé (CHU Pierre Zobda-Quitman, Trinité, Le Marin) apparaîtront ici dès leur diffusion.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container text-secondary text-xs font-bold border border-outline-variant/30">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                      <span>Écoute active du réseau de régulation Martinique 972</span>
                    </div>
                    {declinedRefs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetDeclined}
                        className="px-4 py-2 rounded-full border border-outline-variant/40 hover:bg-surface-container text-on-surface text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-sm text-primary">restart_alt</span>
                        <span>Réafficher les missions déclinées ({declinedRefs.length})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCreateTestMission}
                      className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Générer une course test en direct</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {availableMissions.map((mission) => {
                    const route = calculateMartiniqueRoadDistance(mission.pickupCity, mission.dropoffCity);
                    const pricing = calculateMedicalRidePricing({
                      transportType: mission.transportType,
                      originAddress: mission.pickupAddress,
                      destinationAddress: mission.facilityName || mission.dropoffAddress,
                      isAld: mission.patient.isAld,
                      isRoundTrip: mission.isRoundTrip
                    });

                    return (
                      <article
                        key={mission.id}
                        className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-secondary"></div>

                        <div>
                          {/* Header carte */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                                EN ATTENTE IMMÉDIATE
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-[11px] font-bold border border-outline-variant/20">
                                {mission.transportType === 'AMBULANCE'
                                  ? '🚑 Ambulance'
                                  : mission.transportType === 'TAXI_CONVENTIONNE'
                                  ? '🚗 Taxi Conventionné'
                                  : '🚐 VSL'}
                              </span>
                            </div>
                            <span className="font-mono text-xs font-bold text-on-surface-variant">
                              #{mission.reference}
                            </span>
                          </div>

                          {/* Patient & Prise en charge */}
                          <div className="bg-surface-container-low p-3 rounded-xl mb-3 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-bold text-on-surface">
                                {mission.patient.firstName} {mission.patient.lastName}
                              </div>
                              <div className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-xs text-secondary">verified</span>
                                <span>{mission.patient.isAld ? 'Prescription 100% ALD validée' : 'Prescription Médicale (PMT)'}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-extrabold text-primary">
                                {new Date(mission.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-[10px] text-on-surface-variant font-semibold">
                                {new Date(mission.pickupDateTime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </div>
                            </div>
                          </div>

                          {/* Itinéraire */}
                          <div className="space-y-2 mb-3 text-xs">
                            <div className="flex items-start gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0 ring-2 ring-primary/20"></span>
                              <div className="overflow-hidden">
                                <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Départ</span>
                                <span className="font-bold text-on-surface truncate block">{mission.pickupAddress}</span>
                                <span className="text-on-surface-variant text-[11px]">{mission.pickupCity}</span>
                              </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-secondary mt-1 shrink-0 ring-2 ring-secondary/20"></span>
                              <div className="overflow-hidden">
                                <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Destination</span>
                                <span className="font-bold text-on-surface truncate block">
                                  {mission.facilityName || mission.dropoffAddress}
                                </span>
                                <span className="text-on-surface-variant text-[11px]">{mission.dropoffCity}</span>
                              </div>
                            </div>
                          </div>

                          {/* Détails distance, tarif & mobilité */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/20 text-[11px]">
                            <span className="px-2 py-0.5 rounded-md bg-surface-container font-mono font-semibold text-on-surface">
                              📏 ~{route.distanceKm} km ({route.durationMinutes} min)
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                              💶 {pricing?.totalPrestation?.toFixed(2) || '68.50'} € (100% CPAM)
                            </span>
                            {mission.mobility.wheelchair && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                                ♿ Fauteuil
                              </span>
                            )}
                            {mission.mobility.stretcher && (
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 font-semibold border border-rose-200">
                                🛏️ Brancardage
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions : Décliner, PMT, Affecter, Accepter */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-outline-variant/20">
                          {/* Décliner la mission */}
                          <button
                            type="button"
                            onClick={() => openDeclineModal(mission)}
                            className="py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            title="Décliner cette opportunité de transport"
                          >
                            <span className="material-symbols-outlined text-base text-rose-600">close</span>
                            <span>Décliner</span>
                          </button>

                          {/* Fiche PMT */}
                          <button
                            type="button"
                            onClick={() => setSelectedMissionForDetails(mission)}
                            className="py-2 px-3 rounded-xl border border-outline-variant/40 text-on-surface text-xs font-bold hover:bg-surface-container transition-all flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-base">description</span>
                            <span>Fiche PMT</span>
                          </button>

                          {/* Affectation personnalisée (chauffeur / véhicule) */}
                          <button
                            type="button"
                            onClick={() => openAcceptModal(mission)}
                            className="py-2 px-3 rounded-xl border border-secondary/30 text-secondary bg-secondary/5 hover:bg-secondary/15 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            title="Choisir le chauffeur et le véhicule avant d'accepter"
                          >
                            <span className="material-symbols-outlined text-base">badge</span>
                            <span className="hidden sm:inline">Affecter</span>
                          </button>

                          {/* 1-Clic Acceptation Directe */}
                          <button
                            type="button"
                            onClick={() => handleDirectAccept(mission)}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            <span>Accepter la course</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2 : MISSIONS EN COURS (SUIVI GPS & ÉTAPES)                           */}
          {/* ========================================================================= */}
          {activeTab === 'ACTIVES' && (
            <div className="flex flex-col gap-6">
              {activeMissions.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-12 text-center border border-outline-variant/20 shadow-xs flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-3xl">local_shipping</span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-1">Aucune mission active en cours</h3>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-4">
                    Toutes les courses que vous acceptez depuis la bourse apparaîtront ici pour le suivi télématique et le guidage GPS.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('BOURSE')}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 transition-all"
                  >
                    Voir les opportunités disponibles
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {activeMissions.map((mission) => {
                    const stepIndex =
                      mission.status === 'ACCEPTED' ? 1 : mission.status === 'EN_ROUTE' ? 2 : 3;

                    return (
                      <div
                        key={mission.id}
                        className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 border border-secondary/30 shadow-md flex flex-col gap-5"
                      >
                        {/* Header Mission */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary font-bold flex items-center justify-center text-lg">
                              🚑
                            </span>
                            <div>
                              <div className="text-base font-extrabold text-on-surface">
                                {mission.patient.firstName} {mission.patient.lastName}
                              </div>
                              <div className="text-xs text-on-surface-variant font-mono">
                                Course #{mission.reference} • Affectée à : {mission.assignedTransporter?.driverName || transporterName} ({mission.assignedTransporter?.vehiclePlate || 'GH-972-MQ'})
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${mission.patient.phone}`}
                              className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 transition-all"
                            >
                              <span className="material-symbols-outlined text-base">call</span>
                              <span>Appeler le patient ({mission.patient.phone})</span>
                            </a>

                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                mission.facilityName || mission.dropoffAddress + ', ' + mission.dropoffCity + ', Martinique'
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-secondary text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-secondary/90 transition-all"
                            >
                              <span className="material-symbols-outlined text-base">navigation</span>
                              <span>Guidage GPS Waze / Maps</span>
                            </a>
                          </div>
                        </div>

                        {/* Stepper de Progression */}
                        <div className="py-2">
                          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                            <div className="flex flex-col items-center gap-1.5 text-secondary">
                              <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-sm shadow-xs ring-4 ring-secondary/20">
                                1
                              </div>
                              <span>Acceptée</span>
                            </div>

                            <div className={`flex flex-col items-center gap-1.5 ${stepIndex >= 2 ? 'text-secondary' : 'text-on-surface-variant/60'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                stepIndex >= 2 ? 'bg-secondary text-white ring-4 ring-secondary/20' : 'bg-surface-container text-on-surface-variant'
                              }`}>
                                2
                              </div>
                              <span>En approche</span>
                            </div>

                            <div className={`flex flex-col items-center gap-1.5 ${stepIndex >= 3 ? 'text-secondary' : 'text-on-surface-variant/60'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                stepIndex >= 3 ? 'bg-secondary text-white ring-4 ring-secondary/20' : 'bg-surface-container text-on-surface-variant'
                              }`}>
                                3
                              </div>
                              <span>Patient à bord</span>
                            </div>

                            <div className="flex flex-col items-center gap-1.5 text-on-surface-variant/60">
                              <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-sm">
                                4
                              </div>
                              <span>Arrivé / Clôturé</span>
                            </div>
                          </div>
                        </div>

                        {/* Itinéraire & Carte Mini */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                          <div className="lg:col-span-7 space-y-2 bg-surface-container-low p-4 rounded-2xl text-xs">
                            <div className="flex items-start gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0"></span>
                              <div>
                                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Départ prise en charge :</span>
                                <p className="font-bold text-on-surface">{mission.pickupAddress}, {mission.pickupCity}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-secondary mt-1 shrink-0"></span>
                              <div>
                                <span className="text-[10px] font-bold uppercase text-on-surface-variant">Destination sanitaire :</span>
                                <p className="font-bold text-on-surface">{mission.facilityName || mission.dropoffAddress}, {mission.dropoffCity}</p>
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-5 h-36 rounded-2xl overflow-hidden border border-outline-variant/30 relative">
                            <GoogleMapView
                              mode="tracking"
                              origin={mission.pickupCity}
                              destination={mission.facilityName || mission.dropoffCity}
                              height="100%"
                            />
                          </div>
                        </div>

                        {/* Bouton d'action pour avancer dans le cycle de la mission */}
                        <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                          {mission.status === 'ACCEPTED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateActiveStatus(mission, 'EN_ROUTE')}
                              className="px-6 py-3 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-md hover:bg-amber-700 transition-all flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-base">near_me</span>
                              <span>Démarrer l'approche (Véhicule en route)</span>
                            </button>
                          )}

                          {mission.status === 'EN_ROUTE' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateActiveStatus(mission, 'PICKED_UP')}
                              className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-base">airline_seat_recline_extra</span>
                              <span>Confirmer la prise en charge (Patient à bord)</span>
                            </button>
                          )}

                          {mission.status === 'PICKED_UP' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateActiveStatus(mission, 'COMPLETED')}
                              className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2"
                            >
                              <span className="material-symbols-outlined text-base">check_circle</span>
                              <span>Valider l'arrivée au centre de soins (Terminer la mission)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3 : FACTURATION CPAM & TÉLÉTRANSMISSION NOÉMIE                       */}
          {/* ========================================================================= */}
          {activeTab === 'FACTURES' && (
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/20 shadow-xs flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-on-surface">Télétransmission Noémie & Facturation CPAM 972</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Télétransmission directe des Prescriptions Médicales de Transport (PMT) au centre de liquidation CPAM Martinique.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase block">Total à recouvrer :</span>
                  <span className="text-2xl font-black text-secondary">{totalBilledCpam.toFixed(2)} €</span>
                </div>
              </div>

              {completedMissions.length === 0 ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
                    receipt_long
                  </span>
                  <p className="text-sm font-bold text-on-surface mb-1">Aucune course clôturée pour le moment</p>
                  <p>Dès qu'une mission active est validée à l'arrivée, elle bascule automatiquement ici avec son bordereau de facturation.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/30 text-on-surface-variant uppercase text-[10px] font-bold">
                        <th className="py-3 px-3">Réf Course</th>
                        <th className="py-3 px-3">Patient & NIR</th>
                        <th className="py-3 px-3">Trajet Sanitaire</th>
                        <th className="py-3 px-3">Véhicule</th>
                        <th className="py-3 px-3">Montant CPAM</th>
                        <th className="py-3 px-3">Statut BPEC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {completedMissions.map((m) => {
                        const pricing = m.pricing || calculateMedicalRidePricing({
                          transportType: m.transportType,
                          originAddress: m.pickupAddress,
                          destinationAddress: m.facilityName || m.dropoffAddress,
                          isAld: m.patient.isAld,
                          isRoundTrip: m.isRoundTrip
                        });

                        return (
                          <tr key={m.id} className="hover:bg-surface-container/50 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-primary">#{m.reference}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-on-surface">{m.patient.firstName} {m.patient.lastName}</div>
                              <div className="text-[10px] text-on-surface-variant font-mono">{m.patient.nir}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div>{m.pickupCity} ➔ {m.facilityName || m.dropoffCity}</div>
                              <div className="text-[10px] text-on-surface-variant">
                                {new Date(m.pickupDateTime).toLocaleDateString('fr-FR')}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[10px] font-bold">
                                {m.transportType}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-extrabold text-secondary">
                              {(pricing?.cpamAmount || pricing?.totalPrestation || 68.5).toFixed(2)} €
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                <span className="material-symbols-outlined text-xs text-emerald-600">check</span>
                                Télétransmis Noémie
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4 : GESTION DU PARC DE VÉHICULES & CHAUFFEURS                         */}
          {/* ========================================================================= */}
          {activeTab === 'FLOTTE' && (
            <div className="flex flex-col gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-on-surface">Véhicules & Équipages Conventionnés</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Flotte homologuée ARS Martinique et télétransmettrice CPAM 972.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    3 Véhicules Opérationnels
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fleet.map((veh) => (
                    <div
                      key={veh.id}
                      className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-2xl">
                            {veh.type === 'AMBULANCE' ? '🚑' : veh.type === 'VSL' ? '🚐' : '🚗'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              veh.status === 'DISPONIBLE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : veh.status === 'EN_MISSION'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {veh.status}
                          </span>
                        </div>
                        <div className="font-extrabold text-sm text-on-surface">{veh.name}</div>
                        <div className="font-mono text-xs text-primary font-bold">{veh.plate}</div>
                        <div className="text-xs text-on-surface-variant mt-2">
                          Chauffeur : <strong>{veh.driver}</strong>
                        </div>
                        <div className="text-[11px] text-on-surface-variant">Tél : {veh.phone}</div>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/20 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFleet((prev) =>
                              prev.map((v) =>
                                v.id === veh.id
                                  ? { ...v, status: v.status === 'DISPONIBLE' ? 'EN_PAUSE' : 'DISPONIBLE' }
                                  : v
                              )
                            );
                          }}
                          className="w-full py-1.5 rounded-lg border border-outline-variant/40 text-[11px] font-bold hover:bg-surface-container transition-all"
                        >
                          {veh.status === 'DISPONIBLE' ? 'Mettre en pause' : 'Rendre disponible'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL : AFFECTATION DU VÉHICULE & CHAUFFEUR AVANT ACCEPTATION             */}
      {/* ========================================================================= */}
      {missionToAccept && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center text-lg">
                  🚑
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">Affectation de la mission</h3>
                  <p className="text-xs text-on-surface-variant font-mono">Course #{missionToAccept.reference}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMissionToAccept(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-on-surface text-sm">
                {missionToAccept.patient.firstName} {missionToAccept.patient.lastName}
              </div>
              <div className="text-on-surface-variant">
                Trajet : <strong>{missionToAccept.pickupCity}</strong> ➔ <strong>{missionToAccept.facilityName || missionToAccept.dropoffCity}</strong>
              </div>
              <div className="text-secondary font-semibold">
                Véhicule prescrit : {missionToAccept.transportType} • ALD 100%
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Chauffeur / Équipage mobilisé :
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                >
                  {fleet.map((v) => (
                    <option key={v.id} value={v.driver}>
                      {v.driver} — {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Immatriculation du véhicule :
                </label>
                <select
                  value={selectedPlate}
                  onChange={(e) => setSelectedPlate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono text-xs text-on-surface outline-none focus:border-primary"
                >
                  {fleet.map((v) => (
                    <option key={v.id} value={v.plate}>
                      {v.plate} ({v.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Délai d'approche estimé (ETA) :
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSelectedEta(mins)}
                      className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                        selectedEta === mins
                          ? 'border-secondary bg-secondary text-white shadow-xs'
                          : 'border-outline-variant/40 hover:bg-surface-container'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setMissionToAccept(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmAcceptMission}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold shadow-xs hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Confirmer l'affectation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : DÉCLINER LA MISSION                                               */}
      {/* ========================================================================= */}
      {missionToDecline && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">cancel</span>
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">
                    Décliner la mission
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    Course #{missionToDecline.reference}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMissionToDecline(null)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-on-surface text-sm">
                {missionToDecline.patient.firstName} {missionToDecline.patient.lastName}
              </div>
              <div className="text-on-surface-variant">
                Trajet : <strong>{missionToDecline.pickupCity}</strong> ➔ <strong>{missionToDecline.facilityName || missionToDecline.dropoffCity}</strong>
              </div>
              <div className="text-rose-700 font-semibold">
                Véhicule requis : {missionToDecline.transportType}
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              En déclinant, cette mission sera retirée de votre console dispatch. Elle reste immédiatement disponible pour les autres compagnies sanitaires conventionnées de Martinique.
            </p>

            <div className="space-y-2 text-xs">
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                Motif du refus opérationnel :
              </label>
              {[
                { id: 'FLOTTE_INDISPONIBLE', label: 'Flotte 100% mobilisée / Aucun véhicule disponible' },
                { id: 'HORS_SECTEUR', label: 'Hors zone géographique prioritaire' },
                { id: 'DELAI_COURT', label: "Délai d'intervention trop court (< 30 min)" },
                { id: 'EQUIPAGE_INDISPONIBLE', label: 'Équipage en fin de vacation réglementaire' },
                { id: 'AUTRE', label: 'Autre contrainte dispatch' }
              ].map((reason) => (
                <label
                  key={reason.id}
                  onClick={() => setDeclineReason(reason.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    declineReason === reason.id
                      ? 'border-rose-300 bg-rose-50/70 text-rose-900 font-semibold'
                      : 'border-outline-variant/30 hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="declineReason"
                    value={reason.id}
                    checked={declineReason === reason.id}
                    onChange={() => setDeclineReason(reason.id)}
                    className="accent-rose-600"
                  />
                  <span>{reason.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setMissionToDecline(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
              >
                Conserver la mission
              </button>
              <button
                type="button"
                onClick={confirmDeclineMission}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">close</span>
                <span>Confirmer le refus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : FICHE COMPLÈTE PATIENT & PRESCRIPTION PMT                         */}
      {/* ========================================================================= */}
      {selectedMissionForDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-on-surface">
                  Prescription Médicale de Transport (PMT)
                </h3>
                <p className="text-xs text-on-surface-variant font-mono">
                  Dossier #{selectedMissionForDetails.reference}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMissionForDetails(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Fiche Patient */}
            <div className="bg-surface-container-low p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-on-surface">
                  {selectedMissionForDetails.patient.firstName} {selectedMissionForDetails.patient.lastName}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  100% ALD CPAM
                </span>
              </div>
              <div className="text-on-surface-variant">
                N° Sécurité Sociale (NIR) : <strong className="font-mono text-on-surface">{selectedMissionForDetails.patient.nir}</strong>
              </div>
              <div className="text-on-surface-variant">
                Téléphone patient : <a href={`tel:${selectedMissionForDetails.patient.phone}`} className="text-primary font-bold underline">{selectedMissionForDetails.patient.phone}</a>
              </div>
              <div className="text-on-surface-variant">
                Médecin Prescripteur : <strong>{selectedMissionForDetails.patient.pmtPrescriberDoctor || 'Dr. Régulateur CHU'}</strong>
              </div>
            </div>

            {/* Consignes de mobilité */}
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 text-xs space-y-1.5">
              <span className="text-[11px] font-bold uppercase text-on-surface-variant block">Consignes Médicales & Mobilité :</span>
              <p className="text-on-surface font-medium">
                {selectedMissionForDetails.mobility.notes || 'Aucune consigne particulière. Transport standard assis.'}
              </p>
            </div>

            {/* Trajet & Google Map */}
            <div className="h-44 rounded-2xl overflow-hidden border border-outline-variant/30">
              <GoogleMapView
                mode="route"
                origin={selectedMissionForDetails.pickupCity}
                destination={selectedMissionForDetails.facilityName || selectedMissionForDetails.dropoffCity}
                height="100%"
              />
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setSelectedMissionForDetails(null)}
                className="py-2.5 px-5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 transition-all"
              >
                Fermer la fiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NOTIFICATION TOAST                                                        */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 max-w-md bg-surface-container-lowest text-on-surface p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 border border-secondary/30 animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
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
    </div>
  );
};
