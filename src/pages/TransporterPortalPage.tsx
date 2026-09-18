import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleMapView } from '../components/GoogleMapView';
import { SEOHead } from '../components/SEOHead';
import { BrandLogo } from '../components/BrandLogo';
import { rideService } from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { calculateNationalRoadDistance, calculateMartiniqueRoadDistance, calculateMedicalRidePricing } from '../services/pricingService';
import { Ride, RideStatus, TransportType, TransporterSubscription } from '../types';
import { AuthService } from '../services/authService';
import { exportRidesToExcel, exportRidesToPdf } from '../utils/exportUtils';
import { TransporterZoneEditor } from '../components/TransporterZoneEditor';
import { InterventionZone, loadTransporterZone, isRideCoveredByZone } from '../services/transporterZoneService';
import { resolveCoordinates } from '../services/pricingService';
import { TransporterSubscriptionTab } from '../components/TransporterSubscriptionTab';
import { StripeSubscriptionService } from '../services/stripeSubscriptionService';
import { TerritoryId, TERRITORIES_CONFIG, detectTerritoryFromAddress } from '../data/nationalTerritoriesData';
import { reverseGeocode } from '../services/nationalGeoDatabase';
import { TransporterManualRideModal } from '../components/TransporterManualRideModal';

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string; // Numéro de mobile direct
  status: 'DISPONIBLE' | 'EN_MISSION' | 'EN_REPOS';
  assignedVehiclePlate?: string;
}

export interface VehicleFleet {
  id: string;
  name: string;
  type: TransportType;
  plate: string;
  driver: string;
  phone: string;
  status: 'DISPONIBLE' | 'EN_MISSION' | 'EN_PAUSE';
}

export const FLEET_STORAGE_KEY = 'medictrans_transporter_fleet_v2';
export const DRIVERS_STORAGE_KEY = 'medictrans_transporter_drivers_v2';
export const RADIUS_STORAGE_KEY = 'medictrans_transporter_radius_km';
export const OUTSIDE_RADIUS_STORAGE_KEY = 'medictrans_transporter_include_outside';
export const BASE_COMMUNE_STORAGE_KEY = 'medictrans_transporter_base_commune';

export const DEFAULT_DRIVERS: Driver[] = [
  { id: 'drv-1', firstName: 'Jean-Marc', lastName: 'Alphonse', role: "Ambulancier Diplômé d'État (ADE)", phone: '06 96 12 34 56', status: 'DISPONIBLE', assignedVehiclePlate: 'GF-452-LK' },
  { id: 'drv-2', firstName: 'Sarah', lastName: 'Montrose', role: 'Auxiliaire Ambulancier', phone: '06 96 23 45 67', status: 'DISPONIBLE', assignedVehiclePlate: 'HX-891-TR' },
  { id: 'drv-3', firstName: 'Patrick', lastName: 'Calixte', role: 'Chauffeur Taxi Conventionné', phone: '06 96 34 56 78', status: 'DISPONIBLE', assignedVehiclePlate: 'EK-304-QZ' }
];

export const DEFAULT_FLEET: VehicleFleet[] = [
  { id: 'veh-1', name: 'Ambulance Type A #01', type: 'AMBULANCE', plate: 'GF-452-LK', driver: 'Jean-Marc Alphonse', phone: '06 96 12 34 56', status: 'DISPONIBLE' },
  { id: 'veh-2', name: 'VSL Médical #02', type: 'VSL', plate: 'HX-891-TR', driver: 'Sarah Montrose', phone: '06 96 23 45 67', status: 'DISPONIBLE' },
  { id: 'veh-3', name: 'Taxi Conventionné #03', type: 'TAXI_CONVENTIONNE', plate: 'EK-304-QZ', driver: 'Patrick Calixte', phone: '06 96 34 56 78', status: 'DISPONIBLE' }
];

/**
 * Règle de protection du secret médical (RGPD & Déontologie Santé) :
 * Sur les propositions de courses non validées / en attente (status === 'PENDING'),
 * seul le prénom et la première lettre du nom sont affichés (ex: "Éliane M.").
 * L'accès à l'ensemble des informations (nom complet, NIR, téléphone, PMT) est déverrouillé
 * uniquement lorsqu'ils ont validé / accepté la course.
 */
export const getPatientDisplayName = (
  patient?: { firstName?: string; lastName?: string },
  isAccepted: boolean = false
): string => {
  if (!patient) return 'Patient';
  const firstName = patient.firstName?.trim() || '';
  const lastName = patient.lastName?.trim() || '';

  if (isAccepted) {
    return `${firstName} ${lastName}`.trim() || 'Patient';
  }

  // Format proposition : Prénom + Initiale du nom
  const initial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : '';
  return `${firstName} ${initial}`.trim() || 'Patient';
};

export const TransporterPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  // State
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DISPONIBLES' | 'ACTIVES' | 'PLANNING' | 'FLOTTE' | 'HISTORIQUE' | 'ABONNEMENT'>('DISPONIBLES');
  const [historySubFilter, setHistorySubFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<'ALL' | 'AMBULANCE' | 'VSL' | 'TAXI'>('ALL');
  const [selectedMissionForDetails, setSelectedMissionForDetails] = useState<Ride | null>(null);

  // États du Planning des courses & Fiche Récapitulative
  const [planningHorizon, setPlanningHorizon] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'NEXT_7_DAYS'>('ALL');
  const [selectedPlanningDate, setSelectedPlanningDate] = useState<string | null>(null);
  const [planningStatusFilter, setPlanningStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [planningSearch, setPlanningSearch] = useState('');
  const [isManualRideModalOpen, setIsManualRideModalOpen] = useState<boolean>(false);
  const [planningViewMode, setPlanningViewMode] = useState<'CHRONO' | 'DISPATCH_DRIVERS'>('CHRONO');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('ALL');

  const [selectedMissionForRecap, setSelectedMissionForRecap] = useState<Ride | null>(null);
  const [missionToAccept, setMissionToAccept] = useState<Ride | null>(null);
  const [transporterPickupTimeInput, setTransporterPickupTimeInput] = useState<string>('08:30');
  const [missionToDecline, setMissionToDecline] = useState<Ride | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('FLOTTE_INDISPONIBLE');
  const [declinedRefs, setDeclinedRefs] = useState<string[]>(() => {
    return rideService.getDeclinedRideRefs();
  });
  const [fleet, setFleet] = useState<VehicleFleet[]>(() => {
    try {
      const saved = localStorage.getItem(FLEET_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(v => !v.name?.includes('#') && !v.driver?.includes('#'));
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_FLEET;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    try {
      const saved = localStorage.getItem(DRIVERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(d => !d.firstName?.includes('Équipage') && !d.lastName?.includes('VSL') && !d.lastName?.includes('Taxi'));
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_DRIVERS;
  });

  // Sauvegarde automatique Flotte & Chauffeurs dans le stockage local
  useEffect(() => {
    try {
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(fleet));
    } catch (e) {}
  }, [fleet]);

  useEffect(() => {
    try {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(drivers));
    } catch (e) {}
  }, [drivers]);

  // Rayon d'action géographique & Cercle d'intervention (distance en km)
  const [actionRadiusKm, setActionRadiusKm] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(RADIUS_STORAGE_KEY);
      if (saved) return Number(saved);
    } catch (e) {}
    return 15;
  });

  const [includeOutsideRadius, setIncludeOutsideRadius] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(OUTSIDE_RADIUS_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return false;
  });

  const [baseTerritory, setBaseTerritory] = useState<TerritoryId>(() => {
    try {
      const saved = localStorage.getItem('clinigo_transporter_territory') as TerritoryId;
      if (saved && TERRITORIES_CONFIG[saved]) return saved;
    } catch (e) {}
    return 'MARTINIQUE';
  });

  const [baseCommune, setBaseCommune] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(BASE_COMMUNE_STORAGE_KEY);
      if (saved) return saved;
    } catch (e) {}
    return 'Le Lamentin';
  });

  // Auto-détection du territoire et de la commune de base selon l'adresse ou le code postal du profil transporteur
  useEffect(() => {
    const userAddr = user?.postalCode || user?.city || user?.address;
    if (userAddr) {
      const detected = detectTerritoryFromAddress(userAddr);
      try {
        const savedTerritory = localStorage.getItem('clinigo_transporter_territory');
        if (!savedTerritory) {
          setBaseTerritory(detected);
          const savedCommune = localStorage.getItem(BASE_COMMUNE_STORAGE_KEY);
          if (!savedCommune) {
            setBaseCommune(TERRITORIES_CONFIG[detected].defaultCommune);
          }
        }
      } catch (e) {}
    }
  }, [user]);

  // Zone d'intervention officielle personnalisée (Polygone + Offres étendues 30km)
  const [activeZone, setActiveZone] = useState<InterventionZone | null>(null);
  const [isRadiusModalOpen, setIsRadiusModalOpen] = useState(false);

  useEffect(() => {
    const tId = user?.transporterId || user?.id;
    if (tId) {
      loadTransporterZone(tId).then((zone) => {
        if (zone) {
          setActiveZone(zone);
          if (zone.cityName) setBaseCommune(zone.cityName);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(RADIUS_STORAGE_KEY, String(actionRadiusKm));
      localStorage.setItem(OUTSIDE_RADIUS_STORAGE_KEY, String(includeOutsideRadius));
      localStorage.setItem(BASE_COMMUNE_STORAGE_KEY, baseCommune);
      localStorage.setItem('clinigo_transporter_territory', baseTerritory);
    } catch (e) {}
  }, [actionRadiusKm, includeOutsideRadius, baseCommune, baseTerritory]);

  // Sous-vues et modales de gestion Flotte & Chauffeurs
  const [fleetSubView, setFleetSubView] = useState<'ALL' | 'VEHICLES' | 'DRIVERS'>('ALL');

  // Modales Gestion Véhicules
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehName, setNewVehName] = useState('');
  const [newVehType, setNewVehType] = useState<TransportType>('VSL');
  const [newVehPlate, setNewVehPlate] = useState('');
  const [newVehDriverId, setNewVehDriverId] = useState('');
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleFleet | null>(null);

  // Modales Gestion Chauffeurs & Attribution de Mobile
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [newDriverFirstName, setNewDriverFirstName] = useState('');
  const [newDriverLastName, setNewDriverLastName] = useState('');
  const [newDriverRole, setNewDriverRole] = useState('Ambulancier DEA');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverPlate, setNewDriverPlate] = useState('');

  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [editDriverFirstName, setEditDriverFirstName] = useState('');
  const [editDriverLastName, setEditDriverLastName] = useState('');
  const [editDriverRole, setEditDriverRole] = useState('Ambulancier DEA');
  const [editDriverPhone, setEditDriverPhone] = useState('');
  const [editDriverPlate, setEditDriverPlate] = useState('');
  const [editDriverStatus, setEditDriverStatus] = useState<'DISPONIBLE' | 'EN_MISSION' | 'EN_REPOS'>('DISPONIBLE');
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type?: 'success' | 'info' | 'error' | 'warning' } | null>(null);

  const showNotification = (type: 'success' | 'warning' | 'error' | 'info', title: string, desc: string) => {
    setToastMessage({ type, title, desc });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.title === title ? null : prev));
    }, 5000);
  };

  // Géolocalisation directe depuis le Dashboard
  const [isGeolocatingDashboard, setIsGeolocatingDashboard] = useState(false);

  const handleDashboardGeolocate = () => {
    if (!navigator.geolocation) {
      showNotification('error', 'Géolocalisation', "La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsGeolocatingDashboard(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { longitude, latitude } = pos.coords;
          const result = await reverseGeocode(longitude, latitude);
          if (result) {
            setBaseTerritory(result.territoryId);
            const cityName = result.city || result.label;
            setBaseCommune(cityName);
            try {
              localStorage.setItem('clinigo_transporter_territory', result.territoryId);
              localStorage.setItem(BASE_COMMUNE_STORAGE_KEY, cityName);
              if (result.street) {
                localStorage.setItem('medictrans_transporter_street_address', result.label);
              }
            } catch (e) {}
            showNotification(
              'success',
              'Position détectée avec succès',
              `Nouvelle base : ${result.label} (${TERRITORIES_CONFIG[result.territoryId]?.shortName || result.territoryId})`
            );
          } else {
            showNotification('info', 'Position GPS', `Coordonnées reçues : ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (err) {
          showNotification('error', 'Erreur de géocodage', "Impossible d'identifier la commune.");
        } finally {
          setIsGeolocatingDashboard(false);
        }
      },
      (err) => {
        setIsGeolocatingDashboard(false);
        showNotification('error', 'Géolocalisation refusée', err.message || 'Permission GPS non accordée.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Form affectation véhicule
  const [selectedDriver, setSelectedDriver] = useState<string>(DEFAULT_FLEET[0]?.driver || '');
  const [selectedPlate, setSelectedPlate] = useState<string>(DEFAULT_FLEET[0]?.plate || '');
  const [selectedEta, setSelectedEta] = useState<number>(15);

  // Form réaffectation chauffeur après validation
  const [missionToReassign, setMissionToReassign] = useState<Ride | null>(null);
  const [reassignDriver, setReassignDriver] = useState<string>('');
  const [reassignPlate, setReassignPlate] = useState<string>('');
  const [reassignPhone, setReassignPhone] = useState<string>('');
  const [reassignEta, setReassignEta] = useState<number>(15);

  // Form désistement & republication de course
  const [missionToRelease, setMissionToRelease] = useState<Ride | null>(null);
  const [releaseReason, setReleaseReason] = useState<string>('PANNE_VEHICULE');
  const [releaseCustomNote, setReleaseCustomNote] = useState<string>('');

  // Nom de la compagnie active
  const transporterName = user?.transporterName || 'Ambulances Madinina Secours';
  const transporterPhone = user?.phone || '0596 75 20 20';
  const transporterId = user?.transporterId || 'transporter-1';

  // État local réactif de l'abonnement / essai gratuit
  const [subscriptionState, setSubscriptionState] = useState<TransporterSubscription | undefined>(() => {
    if (user?.subscription) return user.subscription;
    try {
      const saved = localStorage.getItem('medictrans_demo_transporter_sub');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return undefined;
  });

  useEffect(() => {
    if (user?.subscription) {
      setSubscriptionState(user.subscription);
    }
    // Synchronisation en temps réel avec Stripe / Supabase
    if (transporterId) {
      StripeSubscriptionService.getSubscriptionStatus(transporterId).then((res) => {
        if (res.success && res.subscription) {
          setSubscriptionState({
            status: res.subscription.status,
            planName: 'Formule Clinigo Pro (Illimitée)',
            monthlyPrice: 19.9,
            stripeCustomerId: res.subscription.stripe_customer_id,
            stripeSubscriptionId: res.subscription.stripe_subscription_id,
            stripePriceId: res.subscription.stripe_price_id,
            currentPeriodStart: res.subscription.current_period_start,
            currentPeriodEnd: res.subscription.current_period_end,
            cancelAtPeriodEnd: res.subscription.cancel_at_period_end,
            canceledAt: res.subscription.canceled_at
          });
        }
      }).catch(() => {});
    }
  }, [user?.subscription, transporterId]);

  // Vérification stricte de l'accès : abonnement Stripe actif ou essai valide
  const activeSubscription = subscriptionState || user?.subscription;
  const isSubscriptionOrTrialValid = Boolean(
    activeSubscription && StripeSubscriptionService.hasActiveSubscription(activeSubscription)
  );


  // Horloge temps-réel pour le décompte des 24h00
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Helper : vérifie si une course est une demande directe nominative adressée spécifiquement à cette entreprise (active et non expirée)
  const isDirectTargetedToMe = useCallback(
    (r: Ride) => {
      if (!r.isDirectRequest || r.isDirectRequestExpired || r.reassignedToPublicPool) return false;
      const targetId = r.targetTransporterId;
      const targetName = r.targetTransporterName?.toLowerCase().trim() || '';
      const currentName = transporterName.toLowerCase().trim();

      if (targetId && user?.transporterId && targetId === user.transporterId) return true;
      if (targetName && currentName && (targetName === currentName || targetName.includes(currentName) || currentName.includes(targetName))) return true;
      if (
        (targetName.includes('madinina') && currentName.includes('madinina')) ||
        (targetId === 'transporter-1' && transporterId === 'transporter-1')
      ) {
        return true;
      }
      return false;
    },
    [transporterName, user?.transporterId, transporterId]
  );

  // Helper : vérifie si une course est une demande directe active réservée à un AUTRE transporteur pendant ses 24h00
  const isDirectTargetedToOther = useCallback(
    (r: Ride) => {
      if (!r.isDirectRequest || r.isDirectRequestExpired || r.reassignedToPublicPool) return false;
      return !isDirectTargetedToMe(r);
    },
    [isDirectTargetedToMe]
  );

  // Décompte précis du délai de 24h00
  const getDirectRemainingTime = useCallback(
    (expiresAtStr?: string) => {
      if (!expiresAtStr) return { text: '24h00 restantes', isExpiringSoon: false, isExpired: false };
      const expiresAt = new Date(expiresAtStr).getTime();
      const diff = expiresAt - currentTimestamp;
      if (diff <= 0) {
        return { text: '0h 00min (Rebasculement au pot commun)', isExpiringSoon: true, isExpired: true };
      }
      const totalMinutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return {
        text: `${hours}h ${minutes < 10 ? '0' : ''}${minutes}min restantes`,
        isExpiringSoon: hours < 4,
        isExpired: false,
      };
    },
    [currentTimestamp]
  );

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

  // Transférer manuellement une demande directe au pot commun avant l'échéance des 24h
  const handleTransferToPublicPool = async (mission: Ride) => {
    const confirmTransfer = window.confirm(
      `Voulez-vous transférer la demande directe #${mission.reference} au pot commun ?\n\nCette mission sera immédiatement rendue visible à tous les transporteurs conventionnés de Martinique afin que le patient soit pris en charge sans attendre l'expiration des 24h.`
    );
    if (!confirmTransfer) return;

    try {
      await rideService.releaseDirectRequestToPublicPool(mission.reference, `Transféré au pot commun par ${transporterName}`);
      setToastMessage({
        title: 'Demande rebasculée au pot commun',
        desc: `La course #${mission.reference} a été libérée pour les autres transporteurs de l'île.`,
        type: 'info'
      });
      await loadMissions();
    } catch (err) {
      console.warn('Erreur transfert pot commun:', err);
    }
  };

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

  // Toutes les courses en attente (non déclinées, hors demandes directes exclusives d'autres confrères)
  const allPendingMissions = useMemo(() => {
    return rides.filter((r) => {
      if (r.status !== 'PENDING') return false;
      if (declinedRefs.includes(r.reference.trim().toUpperCase())) return false;
      if (isDirectTargetedToOther(r)) return false;
      return true;
    });
  }, [rides, declinedRefs, isDirectTargetedToOther]);

  // Filtrage des courses disponibles (Status PENDING et non déclinées, filtres véhicule, secteur et Zone d'intervention officielle)
  const availableMissions = useMemo(() => {
    return rides.filter((r) => {
      if (r.status !== 'PENDING') return false;
      if (declinedRefs.includes(r.reference.trim().toUpperCase())) return false;

      // Si la demande est réservée à un autre transporteur pendant ses 24h, on la masque
      if (isDirectTargetedToOther(r)) return false;

      // Si la demande m'est adressée directement (orange vif), elle est TOUJOURS visible en priorité
      if (isDirectTargetedToMe(r)) return true;

      // Filtre Véhicule
      if (vehicleFilter === 'AMBULANCE' && r.transportType !== 'AMBULANCE') return false;
      if (vehicleFilter === 'VSL' && r.transportType !== 'VSL') return false;
      if (vehicleFilter === 'TAXI' && r.transportType !== 'TAXI_CONVENTIONNE') return false;

      // Filtrage par Zone d'intervention géographique officielle (Polygone + Offres étendues à 30 km de la base)
      if (activeZone && activeZone.polygonCoordinates && activeZone.polygonCoordinates.length >= 3) {
        const coords = (r as any).pickupCoordinates || resolveCoordinates(r.pickupCity || r.pickupAddress);
        const match = isRideCoveredByZone(coords, activeZone);
        if (!match.covered) return false;
      } else {
        const dist = calculateNationalRoadDistance(baseCommune, r.pickupCity || r.pickupAddress, baseTerritory).distanceKm;
        const isInside = dist <= actionRadiusKm;
        if (!includeOutsideRadius && !isInside) return false;
      }

      return true;
    }).sort((a, b) => {
      // Les demandes directes nominatives ciblées sur ma société apparaissent TOUJOURS en tout premier
      const aDirect = isDirectTargetedToMe(a) ? 1 : 0;
      const bDirect = isDirectTargetedToMe(b) ? 1 : 0;
      if (aDirect !== bDirect) return bDirect - aDirect;
      return new Date(a.pickupDateTime).getTime() - new Date(b.pickupDateTime).getTime();
    });
  }, [rides, vehicleFilter, declinedRefs, activeZone, baseCommune, baseTerritory, actionRadiusKm, includeOutsideRadius, isDirectTargetedToOther, isDirectTargetedToMe]);

  // Compteurs de courses dans et hors zone d'action
  const pendingInRadiusCount = useMemo(() => {
    return allPendingMissions.filter((m) => {
      if (activeZone && activeZone.polygonCoordinates && activeZone.polygonCoordinates.length >= 3) {
        const coords = (m as any).pickupCoordinates || resolveCoordinates(m.pickupCity || m.pickupAddress);
        return isRideCoveredByZone(coords, activeZone).covered;
      }
      const dist = calculateNationalRoadDistance(baseCommune, m.pickupCity || m.pickupAddress, baseTerritory).distanceKm;
      return dist <= actionRadiusKm;
    }).length;
  }, [allPendingMissions, activeZone, baseCommune, baseTerritory, actionRadiusKm]);

  const pendingOutsideRadiusCount = useMemo(() => {
    return allPendingMissions.length - pendingInRadiusCount;
  }, [allPendingMissions, pendingInRadiusCount]);

  // Compteur de demandes par type de véhicule (dans le rayon d'action actif)
  const vehicleCounts = useMemo(() => {
    const counts = { ALL: 0, AMBULANCE: 0, VSL: 0, TAXI: 0 };
    allPendingMissions.forEach((r) => {
      const isDirectMe = isDirectTargetedToMe(r);
      let isCovered = true;
      if (activeZone && activeZone.polygonCoordinates && activeZone.polygonCoordinates.length >= 3) {
        const coords = (r as any).pickupCoordinates || resolveCoordinates(r.pickupCity || r.pickupAddress);
        isCovered = isRideCoveredByZone(coords, activeZone).covered;
      } else {
        const dist = calculateNationalRoadDistance(baseCommune, r.pickupCity || r.pickupAddress, baseTerritory).distanceKm;
        isCovered = includeOutsideRadius || dist <= actionRadiusKm;
      }
      if (!isCovered && !isDirectMe) return;

      counts.ALL++;
      if (r.transportType === 'AMBULANCE') counts.AMBULANCE++;
      else if (r.transportType === 'VSL') counts.VSL++;
      else if (r.transportType === 'TAXI_CONVENTIONNE') counts.TAXI++;
    });
    return counts;
  }, [allPendingMissions, activeZone, baseCommune, baseTerritory, actionRadiusKm, includeOutsideRadius, isDirectTargetedToMe]);

  // Compteur des demandes directes prioritaires nominatives pour ce transporteur (délai 24h)
  const pendingDirectRequestsCount = useMemo(() => {
    return rides.filter((r) => r.status === 'PENDING' && isDirectTargetedToMe(r)).length;
  }, [rides, isDirectTargetedToMe]);

  // Missions actives en cours de réalisation
  const activeMissions = useMemo(() => {
    return rides.filter(
      (r) => r.status === 'ACCEPTED' || r.status === 'EN_ROUTE' || r.status === 'PICKED_UP'
    );
  }, [rides]);

  // Missions clôturées / terminées
  const completedMissions = useMemo(() => {
    return rides.filter((r) => r.status === 'COMPLETED');
  }, [rides]);

  // Toutes les anciennes courses (terminées et expressément annulées)
  const archivedMissions = useMemo(() => {
    return rides.filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED');
  }, [rides]);

  // Filtrage personnalisé de l'historique transporteur
  const filteredArchivedMissions = useMemo(() => {
    return archivedMissions.filter((r) => {
      if (historySubFilter === 'COMPLETED' && r.status !== 'COMPLETED') return false;
      if (historySubFilter === 'CANCELLED' && r.status !== 'CANCELLED') return false;

      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      return (
        r.reference.toLowerCase().includes(q) ||
        r.patient.firstName.toLowerCase().includes(q) ||
        r.patient.lastName.toLowerCase().includes(q) ||
        (r.patient.nir && r.patient.nir.includes(q)) ||
        r.pickupCity.toLowerCase().includes(q) ||
        r.dropoffCity.toLowerCase().includes(q) ||
        (r.facilityName && r.facilityName.toLowerCase().includes(q)) ||
        (r.assignedTransporter?.driverName && r.assignedTransporter.driverName.toLowerCase().includes(q)) ||
        (r.mobility.notes && r.mobility.notes.toLowerCase().includes(q))
      );
    });
  }, [archivedMissions, historySubFilter, historySearch]);

  // Courses éligibles au planning : UNIQUEMENT les courses déjà acceptées et confirmées (ou en cours)
  const plannedMissions = useMemo(() => {
    return rides
      .filter((r) => r.status === 'ACCEPTED' || r.status === 'EN_ROUTE' || r.status === 'PICKED_UP')
      .sort((a, b) => new Date(a.pickupDateTime).getTime() - new Date(b.pickupDateTime).getTime());
  }, [rides]);

  // Courses disponibles non affectées pouvant correspondre au transporteur (dans sa zone d'intervention officielle et non déclinées)
  const matchingAvailableMissions = useMemo(() => {
    return allPendingMissions
      .filter((m) => {
        if (activeZone && activeZone.polygonCoordinates && activeZone.polygonCoordinates.length >= 3) {
          const coords = (m as any).pickupCoordinates || resolveCoordinates(m.pickupCity || m.pickupAddress);
          return isRideCoveredByZone(coords, activeZone).covered;
        }
        const dist = calculateNationalRoadDistance(baseCommune, m.pickupCity || m.pickupAddress, baseTerritory).distanceKm;
        return dist <= actionRadiusKm;
      })
      .sort((a, b) => new Date(a.pickupDateTime).getTime() - new Date(b.pickupDateTime).getTime());
  }, [allPendingMissions, activeZone, baseCommune, baseTerritory, actionRadiusKm]);

  // Jours uniques avec décompte pour le sélecteur de dates rapide
  const planningDaysSummary = useMemo(() => {
    const map = new Map<string, { dateKey: string; label: string; count: number; date: Date }>();

    plannedMissions.forEach((mission) => {
      const d = new Date(mission.pickupDateTime);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const today = new Date();
      const isToday = today.toDateString() === d.toDateString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = tomorrow.toDateString() === d.toDateString();

      let label = isToday
        ? "Aujourd'hui"
        : isTomorrow
        ? "Demain"
        : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

      label = label.charAt(0).toUpperCase() + label.slice(1);

      if (!map.has(dateKey)) {
        map.set(dateKey, { dateKey, label, count: 1, date: d });
      } else {
        map.get(dateKey)!.count += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [plannedMissions]);

  // Filtrage fin des courses pour la vue planning
  const filteredPlanningMissions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const in7Days = new Date(today);
    in7Days.setDate(in7Days.getDate() + 7);
    in7Days.setHours(23, 59, 59, 999);

    return plannedMissions.filter((mission) => {
      const d = new Date(mission.pickupDateTime);

      // Filtre de date spécifique ou horizon
      if (selectedPlanningDate) {
        const missionDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (missionDateKey !== selectedPlanningDate) return false;
      } else if (planningHorizon === 'TODAY') {
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);
        if (d < today || d > endOfToday) return false;
      } else if (planningHorizon === 'TOMORROW') {
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        if (d < tomorrow || d > endOfTomorrow) return false;
      } else if (planningHorizon === 'NEXT_7_DAYS') {
        if (d < today || d > in7Days) return false;
      }

      // Filtre d'affectation chauffeur
      if (planningStatusFilter === 'ASSIGNED' && !mission.assignedTransporter?.driverName) return false;
      if (planningStatusFilter === 'UNASSIGNED' && !!mission.assignedTransporter?.driverName) return false;

      // Filtre spécifique par chauffeur individuel
      if (selectedDriverFilter !== 'ALL') {
        if (selectedDriverFilter === 'UNASSIGNED') {
          if (mission.assignedTransporter?.driverName) return false;
        } else {
          const targetDriver = drivers.find((d) => d.id === selectedDriverFilter);
          if (targetDriver) {
            const assigned = (mission.assignedTransporter?.driverName || '').toLowerCase();
            const fName = targetDriver.firstName.toLowerCase();
            const lName = targetDriver.lastName.toLowerCase();
            if (!assigned.includes(fName) && !assigned.includes(lName)) return false;
          }
        }
      }

      // Recherche textuelle
      if (!planningSearch.trim()) return true;
      const q = planningSearch.toLowerCase();
      return (
        mission.reference.toLowerCase().includes(q) ||
        mission.patient.firstName.toLowerCase().includes(q) ||
        mission.patient.lastName.toLowerCase().includes(q) ||
        (mission.patient.nir && mission.patient.nir.includes(q)) ||
        mission.pickupCity.toLowerCase().includes(q) ||
        mission.dropoffCity.toLowerCase().includes(q) ||
        (mission.facilityName && mission.facilityName.toLowerCase().includes(q)) ||
        (mission.assignedTransporter?.driverName && mission.assignedTransporter.driverName.toLowerCase().includes(q)) ||
        (mission.mobility.notes && mission.mobility.notes.toLowerCase().includes(q))
      );
    });
  }, [plannedMissions, planningHorizon, selectedPlanningDate, planningStatusFilter, planningSearch, selectedDriverFilter, drivers]);

  // Groupement des courses du planning par jour
  const planningGroupedByDay = useMemo(() => {
    const map = new Map<string, Ride[]>();

    filteredPlanningMissions.forEach((mission) => {
      const d = new Date(mission.pickupDateTime);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(mission);
    });

    const groups: { dateKey: string; fullTitle: string; rides: Ride[] }[] = [];

    map.forEach((ridesInDay, dateKey) => {
      const firstDate = new Date(ridesInDay[0].pickupDateTime);
      const today = new Date();
      const isToday = today.toDateString() === firstDate.toDateString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = tomorrow.toDateString() === firstDate.toDateString();

      const prefix = isToday ? "Aujourd'hui • " : isTomorrow ? "Demain • " : "";
      const formatted = firstDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const fullTitle = `${prefix}${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;

      groups.push({
        dateKey,
        fullTitle,
        rides: ridesInDay.sort((a, b) => new Date(a.pickupDateTime).getTime() - new Date(b.pickupDateTime).getTime())
      });
    });

    return groups.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [filteredPlanningMissions]);

  // Handlers Exportation Planning
  const handleExportPlanningExcel = () => {
    exportRidesToExcel(filteredPlanningMissions, {
      filename: `Planning_Previsionnel_Courses_${new Date().toISOString().slice(0, 10)}`,
      title: 'Planning & Programmation des Transports Sanitaires',
      userContext: `${transporterName} | Martinique 972`
    });
    setToastMessage({
      title: 'Export Planning Excel réussi',
      desc: `${filteredPlanningMissions.length} course(s) planifiée(s) exportée(s) pour Excel.`,
      type: 'success'
    });
  };

  const handleExportPlanningPdf = () => {
    exportRidesToPdf(filteredPlanningMissions, {
      filename: `Planning_Previsionnel_Courses_${new Date().toISOString().slice(0, 10)}`,
      title: 'Planning Prévisionnel des Transports Sanitaires',
      subtitle: `Société : ${transporterName} (${filteredPlanningMissions.length} courses planifiées)`,
      userContext: `Agréé ARS Martinique · Programmation d'équipage`
    });
    setToastMessage({
      title: 'Planning PDF généré',
      desc: `Le planning officiel a été exporté en PDF avec succès.`,
      type: 'success'
    });
  };

  // Handlers Exportation Transporteur
  const handleExportExcel = () => {
    exportRidesToExcel(filteredArchivedMissions, {
      filename: `Registre_Courses_Transporteur_${new Date().toISOString().slice(0, 10)}`,
      title: 'Registre Officiel des Transports Sanitaires Réalisés & Archivés',
      userContext: `${transporterName} | Télétransmission CPAM Martinique 972`
    });
    setToastMessage({
      title: 'Export Excel réussi',
      desc: `${filteredArchivedMissions.length} course(s) archivée(s) exportée(s) au format .csv pour Excel.`,
      type: 'success'
    });
  };

  const handleExportPdf = () => {
    exportRidesToPdf(filteredArchivedMissions, {
      filename: `Registre_Courses_Transporteur_${new Date().toISOString().slice(0, 10)}`,
      title: 'Registre Officiel des Transports Sanitaires',
      subtitle: `Société : ${transporterName} | Filtre : ${historySubFilter === 'ALL' ? 'Toutes les archives (dont annulées)' : historySubFilter === 'COMPLETED' ? 'Terminées avec succès' : 'Annulées'} (${filteredArchivedMissions.length} courses)`,
      userContext: `Agréé ARS Martinique · N° Convention CPAM : 972-CPAM-881`
    });
    setToastMessage({
      title: 'Export PDF généré',
      desc: `Le registre PDF officiel de vos courses a été téléchargé avec succès.`,
      type: 'success'
    });
  };

  // ==========================================
  // GESTION DU PARC DE VÉHICULES (CRUD)
  // ==========================================
  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehName.trim() || !newVehPlate.trim()) {
      setToastMessage({
        title: 'Informations incomplètes',
        desc: 'Veuillez saisir un nom et une immatriculation pour le véhicule.',
        type: 'error'
      });
      return;
    }

    const cleanPlate = newVehPlate.trim().toUpperCase();
    if (fleet.some((v) => v.plate.toUpperCase() === cleanPlate)) {
      setToastMessage({
        title: 'Immatriculation déjà enregistrée',
        desc: `Le véhicule ${cleanPlate} existe déjà dans votre flotte.`,
        type: 'error'
      });
      return;
    }

    const assignedDr = drivers.find((d) => d.id === newVehDriverId);
    const driverName = assignedDr ? `${assignedDr.firstName} ${assignedDr.lastName} (${assignedDr.role})` : 'Non assigné';
    const driverPhone = assignedDr?.phone || transporterPhone;

    const newVehicle: VehicleFleet = {
      id: `fl-${Date.now()}`,
      name: newVehName.trim(),
      type: newVehType,
      plate: cleanPlate,
      driver: driverName,
      phone: driverPhone,
      status: 'DISPONIBLE'
    };

    setFleet((prev) => [...prev, newVehicle]);

    // Lier le véhicule au chauffeur sélectionné
    if (assignedDr) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === assignedDr.id ? { ...d, assignedVehiclePlate: cleanPlate } : d))
      );
    }

    setToastMessage({
      title: 'Véhicule ajouté avec succès',
      desc: `${newVehicle.name} (${newVehicle.plate}) a été intégré à votre flotte opérationnelle.`,
      type: 'success'
    });

    setIsAddVehicleOpen(false);
    setNewVehName('');
    setNewVehPlate('');
    setNewVehDriverId('');
  };

  const confirmDeleteVehicle = () => {
    if (!vehicleToDelete) return;
    const plate = vehicleToDelete.plate;

    setFleet((prev) => prev.filter((v) => v.id !== vehicleToDelete.id));

    // Libérer les chauffeurs qui avaient ce véhicule
    setDrivers((prev) =>
      prev.map((d) => (d.assignedVehiclePlate === plate ? { ...d, assignedVehiclePlate: undefined } : d))
    );

    setToastMessage({
      title: 'Véhicule retiré',
      desc: `Le véhicule ${vehicleToDelete.name} (${plate}) a été supprimé de votre flotte.`,
      type: 'info'
    });

    setVehicleToDelete(null);
  };

  const toggleVehiclePause = (vehId: string) => {
    setFleet((prev) =>
      prev.map((v) =>
        v.id === vehId
          ? { ...v, status: v.status === 'DISPONIBLE' ? 'EN_PAUSE' : 'DISPONIBLE' }
          : v
      )
    );
  };

  // ==========================================
  // GESTION DES CHAUFFEURS & MOBILES (CRUD)
  // ==========================================
  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverFirstName.trim() || !newDriverLastName.trim() || !newDriverPhone.trim()) {
      setToastMessage({
        title: 'Champs requis manquants',
        desc: 'Veuillez renseigner le prénom, le nom et le numéro de mobile du chauffeur.',
        type: 'error'
      });
      return;
    }

    const cleanPhone = newDriverPhone.trim();
    const newDr: Driver = {
      id: `dr-${Date.now()}`,
      firstName: newDriverFirstName.trim(),
      lastName: newDriverLastName.trim(),
      role: newDriverRole,
      phone: cleanPhone,
      status: 'DISPONIBLE',
      assignedVehiclePlate: newDriverPlate || undefined
    };

    setDrivers((prev) => [...prev, newDr]);

    // Si un véhicule est assigné immédiatement, synchroniser le véhicule
    if (newDriverPlate) {
      setFleet((prev) =>
        prev.map((v) =>
          v.plate === newDriverPlate
            ? {
                ...v,
                driver: `${newDr.firstName} ${newDr.lastName} (${newDr.role})`,
                phone: cleanPhone
              }
            : v
        )
      );
    }

    setToastMessage({
      title: 'Chauffeur enregistré',
      desc: `${newDr.firstName} ${newDr.lastName} a été ajouté avec son mobile direct (${cleanPhone}).`,
      type: 'success'
    });

    setIsAddDriverOpen(false);
    setNewDriverFirstName('');
    setNewDriverLastName('');
    setNewDriverPhone('');
    setNewDriverPlate('');
  };

  const openEditDriverModal = (dr: Driver) => {
    setDriverToEdit(dr);
    setEditDriverFirstName(dr.firstName);
    setEditDriverLastName(dr.lastName);
    setEditDriverRole(dr.role);
    setEditDriverPhone(dr.phone);
    setEditDriverPlate(dr.assignedVehiclePlate || '');
    setEditDriverStatus(dr.status);
  };

  const handleSaveEditedDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverToEdit) return;

    const updatedFirstName = editDriverFirstName.trim();
    const updatedLastName = editDriverLastName.trim();
    const updatedPhone = editDriverPhone.trim();

    if (!updatedFirstName || !updatedLastName || !updatedPhone) {
      setToastMessage({
        title: 'Champs requis',
        desc: 'Le prénom, le nom et le numéro de mobile sont obligatoires.',
        type: 'error'
      });
      return;
    }

    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverToEdit.id
          ? {
              ...d,
              firstName: updatedFirstName,
              lastName: updatedLastName,
              role: editDriverRole,
              phone: updatedPhone,
              status: editDriverStatus,
              assignedVehiclePlate: editDriverPlate || undefined
            }
          : d
      )
    );

    // Mettre à jour le véhicule correspondant dans la flotte (nom chauffeur + mobile de bord)
    setFleet((prev) =>
      prev.map((v) => {
        if (
          (editDriverPlate && v.plate === editDriverPlate) ||
          v.driver.includes(driverToEdit.lastName)
        ) {
          return {
            ...v,
            driver: `${updatedFirstName} ${updatedLastName} (${editDriverRole})`,
            phone: updatedPhone
          };
        }
        return v;
      })
    );

    setToastMessage({
      title: 'Chauffeur & Mobile mis à jour',
      desc: `Coordonnées de ${updatedFirstName} ${updatedLastName} enregistrées (Mobile : ${updatedPhone}).`,
      type: 'success'
    });

    setDriverToEdit(null);
  };

  const confirmDeleteDriver = () => {
    if (!driverToDelete) return;

    setDrivers((prev) => prev.filter((d) => d.id !== driverToDelete.id));

    // Si le chauffeur était affecté à un véhicule, libérer le véhicule
    setFleet((prev) =>
      prev.map((v) =>
        v.driver.includes(driverToDelete.lastName)
          ? { ...v, driver: 'Non assigné', phone: transporterPhone }
          : v
      )
    );

    setToastMessage({
      title: 'Chauffeur retiré',
      desc: `${driverToDelete.firstName} ${driverToDelete.lastName} a été retiré de vos effectifs.`,
      type: 'info'
    });

    setDriverToDelete(null);
  };

  // Calcul dynamique de l'arrivée estimée selon l'heure de prise en charge et la durée de route
  const calculateEstimatedArrival = (pickupTime: string, durationMinutes: number): string => {
    if (!pickupTime || !pickupTime.includes(':')) return '';
    const [hours, minutes] = pickupTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    const totalMinutes = hours * 60 + minutes + Math.round(durationMinutes);
    const arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMinutes = totalMinutes % 60;
    return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMinutes).padStart(2, '0')}`;
  };

  // ACCEPTATION DE LA MISSION : ouverture du modal avec saisie obligatoire de la prise en charge
  const handleDirectAccept = (mission: Ride) => {
    if (!isSubscriptionOrTrialValid) {
      setActiveTab('ABONNEMENT');
      showNotification(
        'warning',
        'Validation requise',
        'Vous devez valider votre essai gratuit de 30 jours (ou votre abonnement) pour pouvoir accepter des courses.'
      );
      return;
    }
    openAcceptModal(mission);
  };

  // Déclencher le modal d'affectation (Chauffeur / Véhicule / Heure de prise en charge calculée)
  const openAcceptModal = (mission: Ride) => {
    if (!isSubscriptionOrTrialValid) {
      setActiveTab('ABONNEMENT');
      showNotification(
        'warning',
        'Validation requise',
        'Vous devez valider votre essai gratuit de 30 jours (ou votre abonnement) pour pouvoir accepter des courses.'
      );
      return;
    }
    setMissionToAccept(mission);
    const match = fleet.find((v) => v.type === mission.transportType) || fleet[0];
    setSelectedDriver(match.driver);
    setSelectedPlate(match.plate);
    setSelectedEta(15);

    // Initialiser l'heure de prise en charge suggérée selon l'heure du RDV médical
    const appTime = mission.appointmentTime || (
      mission.pickupDateTime ? new Date(mission.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '09:00'
    );
    const duration = mission.estimatedDurationMin || mission.pricing?.durationMinutes || 25;
    const [h, m] = appTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const appTotalMins = h * 60 + m;
      const suggestedPickupTotalMins = Math.max(0, appTotalMins - (Math.round(duration) + 15));
      const sugH = Math.floor(suggestedPickupTotalMins / 60) % 24;
      const sugM = suggestedPickupTotalMins % 60;
      setTransporterPickupTimeInput(`${String(sugH).padStart(2, '0')}:${String(sugM).padStart(2, '0')}`);
    } else {
      setTransporterPickupTimeInput('08:30');
    }
  };

  const confirmAcceptMission = async () => {
    if (!isSubscriptionOrTrialValid) {
      setActiveTab('ABONNEMENT');
      showNotification(
        'error',
        'Accès restreint',
        'Validation requise : veuillez activer votre essai gratuit de 30 jours pour valider cette course.'
      );
      return;
    }
    if (!missionToAccept) return;
    const missionRef = missionToAccept.reference;

    const matchedDriver = drivers.find(
      (d) => selectedDriver.includes(d.lastName) || selectedDriver.includes(d.firstName)
    );
    const assignedPhone = matchedDriver?.phone || fleet.find((v) => v.plate === selectedPlate)?.phone || transporterPhone;

    const assignedData = {
      companyName: transporterName,
      driverName: selectedDriver,
      driverPhone: assignedPhone,
      vehiclePlate: selectedPlate,
      etaMinutes: selectedEta
    };

    const travelDuration = missionToAccept.estimatedDurationMin || missionToAccept.pricing?.durationMinutes || 25;
    const calculatedArrival = calculateEstimatedArrival(transporterPickupTimeInput, travelDuration);

    // Mise à jour optimiste immédiate
    setRides((prev) =>
      prev.map((r) =>
        r.reference.toUpperCase() === missionRef.toUpperCase()
          ? { 
              ...r, 
              status: 'ACCEPTED' as RideStatus, 
              assignedTransporter: assignedData,
              transporterPickupTime: transporterPickupTimeInput,
              estimatedArrivalTime: calculatedArrival
            }
          : r
      )
    );

    setFleet((prev) =>
      prev.map((v) => (v.plate === selectedPlate ? { ...v, status: 'EN_MISSION' } : v))
    );

    setToastMessage({
      title: 'Course acceptée & Patient averti !',
      desc: `Mission #${missionRef} validée. Notification e-mail envoyée au client. Prise en charge à ${transporterPickupTimeInput} (Arrivée : ${calculatedArrival}).`,
      type: 'success'
    });

    setMissionToAccept(null);
    setActiveTab((prev) => (prev === 'PLANNING' ? 'PLANNING' : 'ACTIVES'));

    try {
      await rideService.updateRideStatus(missionRef, 'ACCEPTED', assignedData, {
        transporterPickupTime: transporterPickupTimeInput,
        estimatedArrivalTime: calculatedArrival
      });
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
      if (missionToDecline.isDirectRequest && !missionToDecline.isDirectRequestExpired) {
        await rideService.releaseDirectRequestToPublicPool(cleanRef, `Déclinée par le transporteur sollicité (${declineReason})`);
      }
      await loadMissions();
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
      desc: 'Toutes les courses déclinées sont à nouveau affichées dans vos courses disponibles.',
      type: 'info'
    });
  };

  // Ouvrir le modal de modification d'affectation chauffeur
  const openReassignModal = (mission: Ride) => {
    setMissionToReassign(mission);
    const currentDriver = mission.assignedTransporter?.driverName || fleet[0].driver;
    const currentPlate = mission.assignedTransporter?.vehiclePlate || fleet[0].plate;
    const currentPhone = mission.assignedTransporter?.driverPhone || transporterPhone;
    const currentEta = mission.assignedTransporter?.etaMinutes || 15;
    setReassignDriver(currentDriver);
    setReassignPlate(currentPlate);
    setReassignPhone(currentPhone);
    setReassignEta(currentEta);
  };

  // Sélection rapide d'un véhicule de la flotte pour réaffectation
  const handleSelectFleetForReassign = (plate: string) => {
    const match = fleet.find((v) => v.plate === plate);
    if (match) {
      setReassignPlate(match.plate);
      setReassignDriver(match.driver);
      setReassignPhone(match.phone || transporterPhone);
    }
  };

  // Confirmer la réaffectation du chauffeur
  const confirmReassignMission = async () => {
    if (!missionToReassign) return;
    const missionRef = missionToReassign.reference;
    const oldPlate = missionToReassign.assignedTransporter?.vehiclePlate;

    const newAssignment = {
      companyName: missionToReassign.assignedTransporter?.companyName || transporterName,
      driverName: reassignDriver,
      driverPhone: reassignPhone || transporterPhone,
      vehiclePlate: reassignPlate,
      etaMinutes: reassignEta
    };

    // Mise à jour optimiste immédiate (0ms)
    setRides((prev) =>
      prev.map((r) =>
        r.reference.toUpperCase() === missionRef.toUpperCase()
          ? { ...r, assignedTransporter: newAssignment }
          : r
      )
    );

    // Ajuster le statut des véhicules dans la flotte
    setFleet((prev) =>
      prev.map((v) => {
        if (v.plate === oldPlate && oldPlate !== reassignPlate) {
          return { ...v, status: 'DISPONIBLE' };
        }
        if (v.plate === reassignPlate) {
          return { ...v, status: 'EN_MISSION' };
        }
        return v;
      })
    );

    setToastMessage({
      title: 'Affectation chauffeur modifiée !',
      desc: `La course #${missionRef} est désormais assignée à ${reassignDriver} (${reassignPlate}).`,
      type: 'success'
    });

    setMissionToReassign(null);

    try {
      await rideService.reassignRide(missionRef, newAssignment, missionToReassign.status);
    } catch (err) {
      console.error('Erreur réaffectation chauffeur:', err);
    }
  };

  // Affectation rapide en 1 clic d'un chauffeur depuis le tableau de dispatching
  const handleQuickAssignDriver = async (mission: Ride, driverId: string) => {
    if (!driverId) return;
    const targetDriver = drivers.find((d) => d.id === driverId);
    if (!targetDriver) return;

    const targetPlate = targetDriver.assignedVehiclePlate || fleet.find((v) => v.driver?.includes(targetDriver.lastName))?.plate || 'DISPO-972';

    const newAssignment = {
      companyName: mission.assignedTransporter?.companyName || transporterName,
      driverName: `${targetDriver.firstName} ${targetDriver.lastName}`,
      driverPhone: targetDriver.phone,
      vehiclePlate: targetPlate,
      etaMinutes: 15
    };

    setRides((prev) =>
      prev.map((r) =>
        r.reference.toUpperCase() === mission.reference.toUpperCase()
          ? { ...r, assignedTransporter: newAssignment }
          : r
      )
    );

    setToastMessage({
      title: 'Chauffeur affecté !',
      desc: `La course #${mission.reference} est désormais confiée à ${targetDriver.firstName} ${targetDriver.lastName}.`,
      type: 'success'
    });

    try {
      await rideService.reassignRide(mission.reference, newAssignment, mission.status);
    } catch (err) {
      console.error('Erreur affectation rapide chauffeur:', err);
    }
  };

  // Ouvrir le modal d'annulation / désistement et republication
  const openReleaseModal = (mission: Ride) => {
    setMissionToRelease(mission);
    setReleaseReason('PANNE_VEHICULE');
    setReleaseCustomNote('');
  };

  // Confirmer l'annulation et la republication immédiate
  const confirmReleaseMission = async () => {
    if (!missionToRelease) return;
    const missionRef = missionToRelease.reference;
    const vehiclePlate = missionToRelease.assignedTransporter?.vehiclePlate;

    const reasonLabels: Record<string, string> = {
      PANNE_VEHICULE: 'Panne ou incident technique sur le véhicule',
      URGENCE_SAMU: 'Réquisition SAMU 972 / Urgence vitale prioritaire',
      RETARD_TRAFIC: 'Retard imprévu important / Circulation bloquée',
      EQUIPAGE_INDISPONIBLE: 'Indisponibilité subite du chauffeur / ambulancier',
      AUTRE: 'Autre contrainte opérationnelle'
    };

    const fullReason = releaseCustomNote.trim()
      ? `${reasonLabels[releaseReason] || releaseReason} (${releaseCustomNote.trim()})`
      : (reasonLabels[releaseReason] || releaseReason);

    // Mise à jour optimiste : la course repasse en PENDING et quitte les actives
    setRides((prev) =>
      prev.map((r) => {
        if (r.reference.toUpperCase() === missionRef.toUpperCase()) {
          const updated = { ...r, status: 'PENDING' as RideStatus };
          delete updated.assignedTransporter;
          return updated;
        }
        return r;
      })
    );

    // Libérer le véhicule dans la flotte
    if (vehiclePlate) {
      setFleet((prev) =>
        prev.map((v) => (v.plate === vehiclePlate ? { ...v, status: 'DISPONIBLE' } : v))
      );
    }

    setToastMessage({
      title: 'Course libérée & republiée !',
      desc: `La mission #${missionRef} a été remise en ligne. Elle est de nouveau accessible à l'ensemble des transporteurs sanitaires de l'île.`,
      type: 'info'
    });

    setMissionToRelease(null);

    try {
      await rideService.releaseAndRepublishRide(missionRef, transporterName, fullReason);
      await loadMissions();
    } catch (err) {
      console.error('Erreur annulation et republication:', err);
    }
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
      statusLabel = 'Mission terminée avec succès !';
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-teal-50/70 to-sky-100/60 text-slate-900 font-sans antialiased relative selection:bg-teal-600 selection:text-white">
      {/* Halos lumineux d'arrière-plan en dégradé */}
      <div 
        aria-hidden="true" 
        className="fixed top-0 right-0 w-[600px] h-[500px] bg-gradient-to-b from-teal-200/35 via-sky-200/25 to-transparent rounded-full blur-3xl pointer-events-none z-0" 
      />
      <div 
        aria-hidden="true" 
        className="fixed bottom-0 right-1/4 w-[500px] h-[450px] bg-gradient-to-tr from-teal-100/35 via-slate-200/40 to-transparent rounded-full blur-3xl pointer-events-none z-0" 
      />

      <SEOHead
        title="Console Dispatch Transporteurs Sanitaires | Clinigo"
        description="Console télématique temps réel pour les ambulanciers, VSL et taxis conventionnés Clinigo. Attribution directe et suivi GPS des interventions."
        canonicalPath="/transporteurs"
      />

      {/* Barre de navigation latérale avec dégradé de marque Signature */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-teal-950 via-slate-950 to-teal-950 text-white z-50 flex flex-col border-r border-teal-800/40 shadow-2xl hidden md:flex">
        <div className="p-4 border-b border-teal-800/30 flex items-center justify-between">
          <BrandLogo to="/transporteurs" dark={true} />
        </div>

        {/* Info Société */}
        <div className="m-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-inner flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold flex items-center justify-center text-lg shrink-0 shadow-md shadow-amber-900/30">
            🚑
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-black text-white truncate">{transporterName}</div>
            <div className="text-[10px] text-teal-300 font-mono truncate">Agrément ARS 972</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('DISPONIBLES')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'DISPONIBLES'
                ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold shadow-lg shadow-teal-950/40 ring-1 ring-white/20'
                : 'text-teal-100/75 hover:bg-white/10 hover:text-white font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">radar</span>
              <span>Courses disponibles</span>
            </div>
            <div className="flex items-center gap-1.5">
              {pendingDirectRequestsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-black text-[10px] flex items-center gap-0.5 shadow-xs animate-pulse" title={`${pendingDirectRequestsCount} demande(s) directe(s) nominative(s) (délai 24h)`}>
                  <span>🔥</span>
                  <span>{pendingDirectRequestsCount}</span>
                </span>
              )}
              {availableMissions.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'DISPONIBLES' ? 'bg-white text-teal-900' : 'bg-teal-500/20 text-teal-300'
                }`}>
                  {availableMissions.length}
                </span>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ACTIVES')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'ACTIVES'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold shadow-lg shadow-amber-950/40 ring-1 ring-white/20'
                : 'text-teal-100/75 hover:bg-white/10 hover:text-white font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
              <span>Missions en cours</span>
            </div>
            {activeMissions.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'ACTIVES' ? 'bg-white text-amber-950' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {activeMissions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PLANNING')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'PLANNING'
                ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold shadow-lg shadow-teal-950/40 ring-1 ring-white/20'
                : 'text-teal-100/75 hover:bg-white/10 hover:text-white font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">calendar_month</span>
              <span>Planning des courses</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'PLANNING' ? 'bg-white text-teal-900' : 'bg-teal-500/20 text-teal-300'
            }`}>
              {plannedMissions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FLOTTE')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'FLOTTE'
                ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold shadow-lg shadow-teal-950/40 ring-1 ring-white/20'
                : 'text-teal-100/75 hover:bg-white/10 hover:text-white font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">garage</span>
              <span>Flotte & Équipages</span>
            </div>
            <span className="text-[10px] text-teal-300 font-bold">{fleet.length} actifs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORIQUE')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'HISTORIQUE'
                ? 'bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold shadow-lg shadow-teal-950/40 ring-1 ring-white/20'
                : 'text-teal-100/75 hover:bg-white/10 hover:text-white font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg">history</span>
              <span>Historique des courses</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'HISTORIQUE' ? 'bg-white text-teal-900' : 'bg-teal-500/20 text-teal-300'
            }`}>
              {archivedMissions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ABONNEMENT')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'ABONNEMENT'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-lg shadow-amber-950/40 ring-1 ring-white/30'
                : 'text-teal-100/75 hover:bg-white/10 hover:text-white font-medium'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-amber-300">workspace_premium</span>
              <span>Mon abonnement</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
              activeTab === 'ABONNEMENT' ? 'bg-slate-950 text-amber-300' : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'
            }`}>
              {user?.subscription?.status === 'TRIAL' ? `${user.subscription.trialDaysRemaining ?? 30}j` : 'Pro'}
            </span>
          </button>
        </nav>

        {/* Liens Retour Site & Déconnexion */}
        <div className="p-3 border-t border-teal-800/30 flex flex-col gap-1">
          <Link
            to="/profil"
            className="flex items-center gap-2 text-xs font-bold text-teal-100 hover:text-white hover:bg-white/10 transition-colors py-1.5 px-2 rounded-xl"
          >
            <span className="material-symbols-outlined text-base">manage_accounts</span>
            <span>Mon Profil Entreprise</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-teal-200/80 hover:text-white hover:bg-white/10 transition-colors py-1.5 px-2 rounded-xl"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Retour à l'accueil</span>
          </Link>
          <button
            id="btn-sidebar-logout"
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 transition-colors py-1.5 px-2 rounded-xl text-left cursor-pointer"
            title="Se déconnecter de votre compte transporteur"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* Contenu Principal */}
      <div className="md:pl-64 flex flex-col min-h-screen relative z-10">
        {/* Header supérieur */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 z-40 px-4 sm:px-6 h-16 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="md:hidden">
              <BrandLogo to="/transporteurs" variant="compact" />
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsManualRideModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-primary hover:from-teal-700 hover:to-primary/90 text-white text-xs font-bold shadow-xs hover:shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              title="Saisir manuellement une course directe reçue de votre côté (client privé ou appel téléphonique)"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span className="font-extrabold">+ Course Directe</span>
            </button>

            <button
              type="button"
              onClick={loadMissions}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className={`material-symbols-outlined text-base ${isLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span className="hidden sm:inline">Synchroniser</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <Link
              to="/profil"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity p-1 rounded-xl hover:bg-slate-50"
              title="Gérer mon profil transporteur"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-700 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                {transporterName[0] || 'A'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                  {transporterName}
                </span>
                <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-0.5">
                  <span>Agréé ARS & CPAM</span>
                  <span className="material-symbols-outlined text-[11px]">edit</span>
                </span>
              </div>
            </Link>

            <button
              id="btn-logout-transporter"
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-rose-800 hover:to-rose-900 text-white text-xs font-bold shadow-md shadow-slate-950/10 active:scale-95 transition-all cursor-pointer"
              title="Se déconnecter de l'espace transporteur"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Onglets Mobile */}
        <div className="md:hidden flex border-b border-slate-200/80 bg-white px-2 py-1.5 overflow-x-auto text-xs font-medium gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('DISPONIBLES')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'DISPONIBLES' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Courses disponibles ({availableMissions.length})</span>
            {pendingDirectRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                🔥 {pendingDirectRequestsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVES')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'ACTIVES' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Missions en cours ({activeMissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PLANNING')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'PLANNING' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Planning ({plannedMissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FLOTTE')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'FLOTTE' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Flotte ({fleet.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORIQUE')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'HISTORIQUE' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Historique ({archivedMissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ABONNEMENT')}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'ABONNEMENT' ? 'bg-amber-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            <span>Abonnement</span>
            {user?.subscription?.status === 'TRIAL' && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-[10px] font-mono font-bold">
                {user.subscription.trialDaysRemaining ?? 30}j
              </span>
            )}
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

          {/* Bannière KPIs Réels (Encarts cliquables vers chaque vue dédiée) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Disponibles -> Onglet DISPONIBLES */}
            <button
              type="button"
              onClick={() => setActiveTab('DISPONIBLES')}
              title="Accéder aux courses disponibles"
              className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between text-left transition-all duration-200 group cursor-pointer active:scale-[0.98] ${
                activeTab === 'DISPONIBLES'
                  ? 'bg-white border-teal-600 ring-2 ring-teal-500/20 shadow-md'
                  : 'bg-white border-slate-200/80 hover:border-teal-500/40 hover:shadow-md card-silky-subtle'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <span>Disponibles</span>
                  <span className="material-symbols-outlined text-[13px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-teal-600">
                    arrow_forward
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">{availableMissions.length}</div>
                <div className="text-[11px] text-teal-700 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">radar</span>
                  <span>En attente 972</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                📡
              </div>
            </button>

            {/* 2. En Approche / À Bord -> Onglet ACTIVES */}
            <button
              type="button"
              onClick={() => setActiveTab('ACTIVES')}
              title="Accéder aux missions actives en cours"
              className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between text-left transition-all duration-200 group cursor-pointer active:scale-[0.98] ${
                activeTab === 'ACTIVES'
                  ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'bg-white border-slate-200/80 hover:border-amber-400/60 hover:shadow-md card-silky-subtle'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <span>En Approche / À Bord</span>
                  <span className="material-symbols-outlined text-[13px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-600">
                    arrow_forward
                  </span>
                </div>
                <div className="text-2xl font-black text-amber-600 mt-0.5">{activeMissions.length}</div>
                <div className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">near_me</span>
                  <span>Missions actives</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                🚑
              </div>
            </button>

            {/* 3. Clôturées Aujourd'hui -> Onglet HISTORIQUE */}
            <button
              type="button"
              onClick={() => setActiveTab('HISTORIQUE')}
              title="Accéder à l'historique des courses clôturées"
              className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between text-left transition-all duration-200 group cursor-pointer active:scale-[0.98] ${
                activeTab === 'HISTORIQUE'
                  ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white border-slate-200/80 hover:border-emerald-400/60 hover:shadow-md card-silky-subtle'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <span>Clôturées Aujourd'hui</span>
                  <span className="material-symbols-outlined text-[13px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-600">
                    arrow_forward
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-0.5">{completedMissions.length}</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  <span>Arrivées confirmées</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                🏁
              </div>
            </button>

            {/* 4. Flotte Opérationnelle -> Onglet FLOTTE */}
            <button
              type="button"
              onClick={() => setActiveTab('FLOTTE')}
              title="Accéder à la gestion de la flotte et des chauffeurs"
              className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between text-left transition-all duration-200 group cursor-pointer active:scale-[0.98] ${
                activeTab === 'FLOTTE'
                  ? 'bg-white border-teal-600 ring-2 ring-teal-500/20 shadow-md'
                  : 'bg-white border-slate-200/80 hover:border-teal-400/60 hover:shadow-md card-silky-subtle'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <span>Flotte Opérationnelle</span>
                  <span className="material-symbols-outlined text-[13px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-teal-600">
                    arrow_forward
                  </span>
                </div>
                <div className="text-2xl font-black text-teal-800 mt-0.5">
                  {fleet.filter(v => v.status !== 'EN_PAUSE').length}/{fleet.length}
                </div>
                <div className="text-[11px] text-teal-700 font-semibold mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">local_shipping</span>
                  <span>Véhicules prêts</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                🚙
              </div>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1 : COURSES DISPONIBLES                                               */}
          {/* ========================================================================= */}
          {activeTab === 'DISPONIBLES' && (
            <div className="flex flex-col gap-5 relative">
              {/* Alerte si essai gratuit ou abonnement non validé */}
              {!isSubscriptionOrTrialValid && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/40 text-slate-900 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md font-bold">
                      <span className="material-symbols-outlined text-2xl">lock</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-slate-950">
                          Panel de dispatch verrouillé
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                          Validation requise
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed max-w-2xl">
                        Tant que vous n'avez pas validé votre <strong>essai gratuit de 30 jours sans engagement</strong> (ou activé votre abonnement), votre panel de dispatch est grisé et vous ne pouvez pas valider de courses sanitaires.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ABONNEMENT')}
                    className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base text-amber-400">workspace_premium</span>
                    <span>Activer mes 30 jours offerts ➔</span>
                  </button>
                </div>
              )}

              {/* Contenu principal du panel (grisé et non cliquable si essai/abonnement non validé) */}
              <div className={`flex flex-col gap-5 transition-all duration-300 ${
                !isSubscriptionOrTrialValid
                  ? 'opacity-40 grayscale pointer-events-none select-none filter blur-[0.5px]'
                  : ''
              }`}>
                {/* ========================================================================= */}
                {/* BARRE DE GESTION OFFICIELLE DES ZONES D'INTERVENTION (POLYGONE + 30KM)     */}
                {/* ========================================================================= */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-xs overflow-hidden flex flex-col">
                  <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                    {/* Bloc 1 : Base d'intervention & Région */}
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
                        <span className="text-xl">📍</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-on-surface uppercase tracking-wider">
                            Zone d'intervention officielle
                          </span>
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            <span>{activeZone?.polygonCoordinates?.length ? `${activeZone.polygonCoordinates.length} sommets actifs` : 'Polygone configuré'}</span>
                          </span>
                          {activeZone?.allowExtendedRadius && (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30">
                              📢 Offres étendues (+30 km de la base)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="font-bold text-on-surface">
                            Base : <span className="text-primary font-black">{activeZone?.cityName || baseCommune}</span>
                          </span>
                          <span className="text-on-surface-variant">•</span>
                          <span className="text-on-surface-variant font-medium">
                            Région : <strong className="text-on-surface font-bold">{activeZone?.regionName || 'France'}</strong>
                          </span>
                          {activeZone?.baseAddress && (
                            <>
                              <span className="text-on-surface-variant">•</span>
                              <span className="text-on-surface-variant text-[11px] truncate max-w-[260px]" title={activeZone.baseAddress}>
                                {activeZone.baseAddress}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Séparateur vertical pour grand écran */}
                    <div className="hidden xl:block w-px h-12 bg-outline-variant/20 self-center"></div>

                    {/* Bloc 2 : Télémétrie et Bouton d'accès au tracé */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between xl:justify-end gap-3.5">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          <span>{pendingInRadiusCount} course{pendingInRadiusCount > 1 ? 's' : ''} dans la zone</span>
                        </span>
                        {pendingOutsideRadiusCount > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant border border-outline-variant/30 text-[11px]">
                            <span>{pendingOutsideRadiusCount} hors zone</span>
                          </span>
                        )}
                      </div>

                      <button
                        id="btn-open-zone-modal"
                        type="button"
                        onClick={() => setIsRadiusModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer shrink-0"
                      >
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                          <line x1="9" y1="3" x2="9" y2="18" />
                          <line x1="15" y1="6" x2="15" y2="21" />
                        </svg>
                        <span>✏️ Configurer ma zone d'action</span>
                      </button>
                    </div>
                  </div>
                </div>

              {/* Bloc de sélection du type de véhicule sanitaire */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                      <circle cx="7" cy="17" r="2" />
                      <path d="M9 17h6" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-black text-on-surface uppercase tracking-wider block">
                      Type de véhicule sanitaire
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Filtrez les demandes par agrément (Ambulance, VSL, Taxi conventionné)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: 'ALL', label: 'Tous les véhicules', icon: '✨', count: vehicleCounts.ALL },
                    { key: 'AMBULANCE', label: 'Ambulance', icon: '🚑', count: vehicleCounts.AMBULANCE },
                    { key: 'VSL', label: 'VSL', icon: '🚐', count: vehicleCounts.VSL },
                    { key: 'TAXI', label: 'Taxi conventionné', icon: '🚗', count: vehicleCounts.TAXI },
                  ].map((veh) => {
                    const isActive = vehicleFilter === veh.key;
                    return (
                      <button
                        key={veh.key}
                        type="button"
                        onClick={() => setVehicleFilter(veh.key as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20 scale-[1.02]'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                      >
                        <span className="text-sm">{veh.icon}</span>
                        <span>{veh.label}</span>
                        <span
                          className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {veh.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bannière d'alerte pour les Demandes Directes Nominatives (Délai 24h) */}
              {pendingDirectRequestsCount > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-orange-400 animate-fadeIn">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-2xl text-white animate-bounce">local_fire_department</span>
                    </div>
                    <div>
                      <div className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                        <span>🚨 DEMANDE DIRECTE NOMINATIVE EN ATTENTE</span>
                        <span className="bg-white text-orange-900 text-[11px] px-2.5 py-0.5 rounded-full font-black shadow-xs">
                          Délai 24h00
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-white/95 mt-0.5 leading-relaxed">
                        Un patient a directement sélectionné votre société <strong>{transporterName}</strong>. 
                        Cette demande apparaît <strong>en orange vif ci-dessous</strong>. Vous disposez de 24h00 pour accepter la course avant son rebasculement automatique dans le pot commun.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-black/25 text-white font-mono text-xs font-bold border border-white/20">
                      {pendingDirectRequestsCount} course{pendingDirectRequestsCount > 1 ? 's' : ''} prioritaire{pendingDirectRequestsCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

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
                  <p className="text-sm text-on-surface-variant max-w-lg mx-auto leading-relaxed mb-4">
                    Toutes les nouvelles opportunités et demandes de transport sanitaire émises par les patients et les établissements de santé (CHU Pierre Zobda-Quitman, Trinité, Le Marin) apparaîtront ici dès leur diffusion.
                  </p>

                  {/* Alerte si des courses sont en attente hors du rayon sélectionné */}
                  {pendingOutsideRadiusCount > 0 && !includeOutsideRadius && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 max-w-xl w-full text-left">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-amber-600 text-xl shrink-0">radar</span>
                        <div>
                          <div className="font-bold text-amber-950">
                            {pendingOutsideRadiusCount} course(s) disponible(s) hors de votre rayon
                          </div>
                          <div className="text-[11px] text-amber-800">
                            Votre rayon actuel est fixé à {actionRadiusKm} km autour de {baseCommune}.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIncludeOutsideRadius(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-all shadow-xs"
                      >
                        Recevoir les courses hors zone
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container text-secondary text-xs font-bold border border-outline-variant/30">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                      <span>Écoute active du réseau de régulation {TERRITORIES_CONFIG[baseTerritory]?.name || 'France'}</span>
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
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {availableMissions.map((mission) => {
                    const route = calculateNationalRoadDistance(mission.pickupCity, mission.dropoffCity, baseTerritory);
                    let distFromBase = 0;
                    let isInsideZone = true;
                    let zoneMatchReason: 'INSIDE_POLYGON' | 'EXTENDED_RADIUS' | 'NONE' = 'INSIDE_POLYGON';

                    if (activeZone && activeZone.polygonCoordinates && activeZone.polygonCoordinates.length >= 3) {
                      const coords = (mission as any).pickupCoordinates || resolveCoordinates(mission.pickupCity || mission.pickupAddress);
                      const match = isRideCoveredByZone(coords, activeZone);
                      distFromBase = match.distanceFromBaseKm;
                      isInsideZone = match.covered;
                      zoneMatchReason = match.reason;
                    } else {
                      distFromBase = calculateNationalRoadDistance(baseCommune, mission.pickupCity || mission.pickupAddress, baseTerritory).distanceKm;
                      isInsideZone = distFromBase <= actionRadiusKm;
                    }

                    const pricing = calculateMedicalRidePricing({
                      transportType: mission.transportType,
                      originAddress: mission.pickupAddress,
                      destinationAddress: mission.facilityName || mission.dropoffAddress,
                      isAld: mission.patient.isAld,
                      isRoundTrip: mission.isRoundTrip
                    });

                    const isDirect = isDirectTargetedToMe(mission);
                    const isPotCommun = mission.reassignedToPublicPool || mission.isDirectRequestExpired;
                    const remaining = isDirect ? getDirectRemainingTime(mission.directRequestExpiresAt) : null;

                    return (
                      <article
                        key={mission.id}
                        id={isDirect ? `direct-request-${mission.reference}` : undefined}
                        className={`rounded-2xl p-5 border-2 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                          isDirect
                            ? 'border-orange-500 bg-gradient-to-b from-orange-500/15 via-amber-500/10 to-surface-container-lowest ring-4 ring-orange-500/25 shadow-lg shadow-orange-500/15'
                            : 'border-outline-variant/30 bg-surface-container-lowest'
                        }`}
                      >
                        {/* Top bar */}
                        {isDirect ? (
                          <div className="flex items-center justify-between gap-2 p-2.5 -mx-5 -mt-5 mb-1 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white shadow-xs">
                            <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                              <span className="material-symbols-outlined text-base animate-bounce">local_fire_department</span>
                              <span>Demande directe nominative</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold">
                              <span className="material-symbols-outlined text-xs">timer</span>
                              <span>{remaining?.text}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-secondary"></div>
                        )}

                        <div>
                          {/* Header carte */}
                          <div className="flex flex-col gap-2 mb-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {isDirect ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 border border-orange-300 text-orange-950 text-[11px] font-black">
                                    <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping"></span>
                                    🔥 DEMANDE DIRECTE NOMINATIVE (24H)
                                  </span>
                                ) : isPotCommun ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold" title="Initialement demandée à un transporteur précis mais non répondue sous 24h : rebasculée au pot commun">
                                    <span className="material-symbols-outlined text-xs text-blue-600">sync_alt</span>
                                    🌐 POT COMMUN (Délai 24h expiré)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                                    EN ATTENTE IMMÉDIATE
                                  </span>
                                )}
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

                            {/* Badge Zone d'intervention / 3 Cas de matching */}
                            <div className="flex items-center">
                              {zoneMatchReason === 'INSIDE_POLYGON' ? (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-[11px] font-bold"
                                  title={`Prise en charge dans votre polygone d'action (à ${distFromBase.toFixed(1)} km de votre base)`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  <span>🟢 Dans votre zone d'action ({distFromBase.toFixed(1)} km de votre base)</span>
                                </span>
                              ) : zoneMatchReason === 'EXTENDED_RADIUS' ? (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-900 text-[11px] font-bold"
                                  title={`Offre située hors du polygone mais à moins de 30 km de votre base (${activeZone?.cityName || baseCommune})`}
                                >
                                  <span className="material-symbols-outlined text-[13px] text-amber-700">travel_explore</span>
                                  <span>📢 Offre étendue (+30 km) • À {distFromBase.toFixed(1)} km de votre base</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-500/15 border border-slate-500/30 text-slate-800 text-[11px] font-bold"
                                  title={`Départ à ${distFromBase.toFixed(1)} km de votre base`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                  <span>🟠 Hors zone d'action ({distFromBase.toFixed(1)} km de votre base)</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Patient & Prise en charge */}
                          <div className="bg-surface-container-low p-3 rounded-xl mb-3 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                                <span>{getPatientDisplayName(mission.patient, false)}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                  Secret médical
                                </span>
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

                          {/* Avertissement PMT non téléversée par le client */}
                          {(!mission.patient.hasPmt && !mission.patient.pmtUploaded && !mission.patient.pmtFileUrl) ? (
                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center gap-2 mt-2">
                              <span className="material-symbols-outlined text-amber-700 text-base shrink-0">warning</span>
                              <span className="text-[11px] leading-tight">
                                <strong className="text-amber-900">PMT non téléversée :</strong> le client fournira le Cerfa papier original lors de la prise en charge.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-semibold mt-2">
                              <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
                              <span>Prescription PMT numérique enregistrée</span>
                            </div>
                          )}
                        </div>

                        {/* Actions : Décliner, PMT (après acceptation), Affecter, Accepter */}
                        {isDirect ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-3 border-t border-orange-300/40">
                            {/* Transférer immédiatement au pot commun */}
                            <button
                              type="button"
                              onClick={() => handleTransferToPublicPool(mission)}
                              className="py-2.5 px-3 rounded-xl border border-orange-300 bg-white hover:bg-orange-50 text-orange-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-xs"
                              title="Libérer cette demande au pot commun pour qu'un confrère disponible la prenne sans attendre"
                            >
                              <span className="material-symbols-outlined text-base text-orange-600">sync_alt</span>
                              <span>Transférer au pot commun</span>
                            </button>

                            {/* Affectation personnalisée */}
                            <button
                              type="button"
                              onClick={() => openAcceptModal(mission)}
                              className="py-2.5 px-3 rounded-xl border border-orange-400 text-orange-950 bg-orange-100 hover:bg-orange-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                              title="Choisir le chauffeur et le véhicule avant d'accepter"
                            >
                              <span className="material-symbols-outlined text-base">badge</span>
                              <span className="hidden sm:inline">Affecter</span>
                            </button>

                            {/* Accepter la demande directe nominative */}
                            <button
                              type="button"
                              onClick={() => handleDirectAccept(mission)}
                              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white text-xs font-extrabold hover:opacity-95 transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-base">check_circle</span>
                              <span>Accepter la demande directe</span>
                            </button>
                          </div>
                        ) : (
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

                            {/* Fiche PMT : disponible au transporteur uniquement après acceptation de la course */}
                            <div
                              className="py-2 px-3 rounded-xl border border-outline-variant/30 text-on-surface-variant/70 text-xs font-semibold flex items-center justify-center gap-1.5 bg-surface-container-low cursor-not-allowed select-none"
                              title="La fiche PMT détaillée est confidentielle et accessible uniquement après validation de la course"
                            >
                              <span className="material-symbols-outlined text-[15px] text-on-surface-variant/60">lock</span>
                              <span>PMT après acceptation</span>
                            </div>

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
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
              </div>
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
                    Toutes les courses que vous acceptez depuis les courses disponibles apparaîtront ici pour le suivi télématique et le guidage GPS.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('DISPONIBLES')}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 transition-all"
                  >
                    Voir les courses disponibles
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

                        {/* Avertissement PMT sur mission active */}
                        {(!mission.patient.hasPmt && !mission.patient.pmtUploaded && !mission.patient.pmtFileUrl) ? (
                          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-amber-700 text-lg shrink-0">warning</span>
                            <div className="flex-1">
                              <span className="font-bold text-amber-900">Avertissement : Le client n'a pas téléversé de PMT.</span>{' '}
                              <span className="text-amber-800 text-[11px]">Exigez obligatoirement la prescription Cerfa papier originale lors de la prise en charge pour la facturation CPAM.</span>
                            </div>
                          </div>
                        ) : (
                          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
                              <span className="font-semibold text-[11px]">Prescription Médicale de Transport (PMT) jointe numériquement</span>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded">
                              Téléversée
                            </span>
                          </div>
                        )}

                        {/* Actions opérationnelles sur la mission active */}
                        <div className="pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3">
                          {/* Actions d'ajustement & désistement */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Fiche PMT déverrouillée post-acceptation */}
                            <button
                              type="button"
                              onClick={() => setSelectedMissionForDetails(mission)}
                              className="px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 transition-all border border-primary/20 shadow-2xs"
                              title="Consulter la prescription médicale de transport et les détails médicaux"
                            >
                              <span className="material-symbols-outlined text-base">description</span>
                              <span>Fiche PMT</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openReassignModal(mission)}
                              className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-1.5 transition-all border border-outline-variant/30 shadow-2xs"
                              title="Changer le chauffeur ou le véhicule affecté à cette course"
                            >
                              <span className="material-symbols-outlined text-base text-secondary">badge</span>
                              <span>Changer de chauffeur</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openReleaseModal(mission)}
                              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-800 text-xs font-bold flex items-center gap-1.5 transition-all border border-rose-200/80 shadow-2xs"
                              title="Annuler votre prise en charge et republier immédiatement la course pour les autres transporteurs"
                            >
                              <span className="material-symbols-outlined text-base text-rose-600">undo</span>
                              <span>Annuler &amp; Republier</span>
                            </button>
                          </div>

                          {/* Boutons de progression dans le cycle de la mission */}
                          <div className="flex items-center gap-2">
                            {mission.status === 'ACCEPTED' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateActiveStatus(mission, 'EN_ROUTE')}
                                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-md hover:bg-amber-700 transition-all flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-base">near_me</span>
                                <span>Démarrer l'approche (Véhicule en route)</span>
                              </button>
                            )}

                            {mission.status === 'EN_ROUTE' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateActiveStatus(mission, 'PICKED_UP')}
                                className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-base">airline_seat_recline_extra</span>
                                <span>Confirmer la prise en charge (Patient à bord)</span>
                              </button>
                            )}

                            {mission.status === 'PICKED_UP' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateActiveStatus(mission, 'COMPLETED')}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2"
                              >
                                <span className="material-symbols-outlined text-base">check_circle</span>
                                <span>Valider l'arrivée au centre de soins (Terminer)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VUE 3 : PLANNING & PROGRAMMATION DES COURSES EN AVANCE                    */}
          {/* ========================================================================= */}
          {activeTab === 'PLANNING' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* En-tête Planning avec KPIs et Boutons d'Exportation */}
              <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">calendar_month</span>
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-extrabold text-on-surface">Planning & Programmation des Courses</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-mono text-xs font-bold">
                          {plannedMissions.length} acceptée{plannedMissions.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 max-w-2xl leading-relaxed">
                        Planning officiel de votre flotte : seules les courses acceptées et confirmées sont programmées ici. Assignez vos chauffeurs et consultez les fiches de mission.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-outline-variant/15 text-xs">
                    <span className="px-2.5 py-1 rounded-xl bg-surface-container text-on-surface-variant font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>Total planning : <strong>{plannedMissions.length} courses acceptées</strong></span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 font-medium flex items-center gap-1.5 border border-blue-200/60">
                      <span className="material-symbols-outlined text-sm text-blue-600">verified</span>
                      <span>Chauffeurs affectés : <strong>{plannedMissions.filter(m => !!m.assignedTransporter?.driverName).length}</strong></span>
                    </span>
                    {plannedMissions.filter(m => !m.assignedTransporter?.driverName).length > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-medium flex items-center gap-1.5 border border-amber-200/60">
                        <span className="material-symbols-outlined text-sm text-amber-600">person_alert</span>
                        <span>À affecter : <strong>{plannedMissions.filter(m => !m.assignedTransporter?.driverName).length}</strong></span>
                      </span>
                    )}
                    {matchingAvailableMissions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('DISPONIBLES')}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold flex items-center gap-1.5 border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                        title="Voir les courses non affectées correspondant à votre zone"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{matchingAvailableMissions.length} disponible{matchingAvailableMissions.length > 1 ? 's' : ''} non affectée{matchingAvailableMissions.length > 1 ? 's' : ''}</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsManualRideModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-primary text-white hover:opacity-95 text-xs font-black transition-all shadow-xs hover:shadow-md cursor-pointer"
                    title="Ajouter manuellement une course directe reçue par téléphone ou client privé"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    <span>+ Saisir Course Directe</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPlanningExcel}
                    disabled={filteredPlanningMissions.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Exporter le planning prévisionnel en Excel (.csv)"
                  >
                    <span className="material-symbols-outlined text-base">file_download</span>
                    <span>Planning Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPlanningPdf}
                    disabled={filteredPlanningMissions.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
                    title="Exporter le planning prévisionnel officiel en PDF"
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    <span>Planning PDF</span>
                  </button>
                </div>
              </div>

              {/* MODULE OPPORTUNITÉS BOURSE : COURSES DISPONIBLES NON AFFECTÉES CORRESPONDANTES */}
              {matchingAvailableMissions.length > 0 ? (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-amber-500/5 to-primary/5 border border-emerald-500/30 shadow-xs flex flex-col gap-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-2xl">radar</span>
                        </span>
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600"></span>
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-on-surface">
                            Opportunités Bourse : {matchingAvailableMissions.length} course{matchingAvailableMissions.length > 1 ? 's' : ''} disponible{matchingAvailableMissions.length > 1 ? 's' : ''} non affectée{matchingAvailableMissions.length > 1 ? 's' : ''} pourrai{matchingAvailableMissions.length > 1 ? 'ent' : 't'} vous correspondre !
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono text-xs font-bold">
                            {activeZone?.polygonCoordinates?.length ? `${activeZone.polygonCoordinates.length} sommets • ${activeZone.cityName}` : `Zone ${baseCommune}`}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Demandes en attente situées dans votre zone d'intervention officielle ({activeZone?.cityName || baseCommune} et alentours). Vous pouvez les accepter pour les intégrer directement à votre planning :
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('DISPONIBLES')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/30 text-primary font-bold text-xs transition-colors shrink-0 shadow-2xs self-start sm:self-auto cursor-pointer"
                    >
                      <span>Consulter toute la bourse ({availableMissions.length})</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>

                  {/* Grille des courses disponibles correspondantes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                    {matchingAvailableMissions.slice(0, 3).map((mission) => {
                      const distFromBase = calculateNationalRoadDistance(baseCommune, mission.pickupCity || mission.pickupAddress, baseTerritory).distanceKm;
                      const pickupDate = new Date(mission.pickupDateTime);
                      const isToday = new Date().toDateString() === pickupDate.toDateString();
                      const isTomorrow = new Date(Date.now() + 86400000).toDateString() === pickupDate.toDateString();
                      const dayLabel = isToday
                        ? "Aujourd'hui"
                        : isTomorrow
                        ? "Demain"
                        : pickupDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                      const timeStr = pickupDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      const hasPmt = mission.patient.hasPmt || mission.patient.pmtUploaded || mission.patient.pmtFileUrl;

                      return (
                        <div
                          key={mission.id}
                          className="p-4 rounded-2xl bg-surface-container-lowest border border-emerald-300/80 hover:border-emerald-500 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/15">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-on-surface">
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-mono text-[11px] font-extrabold">
                                  {dayLabel} {timeStr}
                                </span>
                                <span className="font-mono text-[11px] text-primary">#{mission.reference}</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {mission.transportType === 'AMBULANCE' ? '🚑 Ambulance' : mission.transportType === 'VSL' ? '🚐 VSL' : '🚗 Taxi'}
                              </span>
                            </div>

                            <div className="mt-2.5 space-y-1.5 text-xs">
                              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                                <span className="material-symbols-outlined text-sm">near_me</span>
                                <span>Départ à {distFromBase.toFixed(1)} km de votre base ({baseCommune})</span>
                              </div>

                              <div className="p-2 rounded-xl bg-surface-container-low/60 space-y-1">
                                <div className="flex items-center gap-1.5 text-on-surface truncate">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                  <span className="font-medium truncate">{mission.pickupCity} ({mission.pickupAddress})</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-on-surface truncate">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                                  <span className="font-bold truncate">
                                    {mission.facilityName ? mission.facilityName : `${mission.dropoffAddress}, ${mission.dropoffCity}`}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] pt-1 text-on-surface-variant">
                                <span>Patient : <strong>{getPatientDisplayName(mission.patient, false)}</strong></span>
                                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.2 rounded font-semibold">
                                  Secret médical
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-on-surface-variant font-medium">
                              {hasPmt ? '📄 PMT Jointe' : '📄 PMT Papier'}
                            </span>

                            <button
                              type="button"
                              onClick={() => openAcceptModal(mission)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                              title="Accepter cette course et l'intégrer immédiatement à votre planning"
                            >
                              <span className="material-symbols-outlined text-sm">add_task</span>
                              <span>Accepter & planifier</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {matchingAvailableMissions.length > 3 && (
                    <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20 text-xs">
                      <span className="text-on-surface-variant font-medium">
                        + {matchingAvailableMissions.length - 3} autre{matchingAvailableMissions.length - 3 > 1 ? 's' : ''} course{matchingAvailableMissions.length - 3 > 1 ? 's' : ''} disponible{matchingAvailableMissions.length - 3 > 1 ? 's' : ''} dans votre rayon
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('DISPONIBLES')}
                        className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Voir toutes les opportunités dans la bourse</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : allPendingMissions.length > 0 ? (
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-xl">info</span>
                    <div>
                      <span className="font-bold text-on-surface">Aucune course non affectée dans votre rayon direct ({actionRadiusKm} km de {baseCommune})</span>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        Cependant, <strong>{allPendingMissions.length} course{allPendingMissions.length > 1 ? 's' : ''} en attente</strong> {allPendingMissions.length > 1 ? 'sont disponibles' : 'est disponible'} sur d'autres communes en Martinique.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('DISPONIBLES')}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                  >
                    Voir la bourse ({allPendingMissions.length})
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/15 flex items-center gap-2.5 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                  <span>Toutes les courses sur la Martinique sont actuellement pourvues. Aucune course non affectée en attente.</span>
                </div>
              )}

              {/* Barre de navigation temporelle, Filtres & Recherche */}
              <div className="p-4 rounded-3xl bg-surface-container-low border border-outline-variant/20 flex flex-col gap-3">
                {/* 1. Sélecteur d'horizon temporel & Dates */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase text-on-surface-variant mr-1">Horizon :</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPlanningHorizon('ALL');
                        setSelectedPlanningDate(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        planningHorizon === 'ALL' && selectedPlanningDate === null
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Toutes les dates ({plannedMissions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlanningHorizon('TODAY');
                        setSelectedPlanningDate(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        planningHorizon === 'TODAY'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Aujourd'hui ({planningDaysSummary.find((d) => d.label === "Aujourd'hui")?.count || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlanningHorizon('TOMORROW');
                        setSelectedPlanningDate(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        planningHorizon === 'TOMORROW'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Demain ({planningDaysSummary.find((d) => d.label === 'Demain')?.count || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPlanningHorizon('NEXT_7_DAYS');
                        setSelectedPlanningDate(null);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        planningHorizon === 'NEXT_7_DAYS'
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      7 prochains jours
                    </button>
                  </div>

                  {/* Barre de recherche */}
                  <div className="relative w-full md:w-72 shrink-0">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
                      search
                    </span>
                    <input
                      type="text"
                      value={planningSearch}
                      onChange={(e) => setPlanningSearch(e.target.value)}
                      placeholder="Filtrer réf, patient, NIR, ville..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary"
                    />
                    {planningSearch && (
                      <button
                        type="button"
                        onClick={() => setPlanningSearch('')}
                        className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Mode d'affichage (Agenda vs Dispatching Chauffeurs) & Filtres Chauffeurs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-outline-variant/15">
                  {/* Toggle Vue Agenda vs Dispatching Chauffeurs */}
                  <div className="flex items-center gap-1 bg-surface-container-high/60 p-1 rounded-2xl w-fit">
                    <button
                      type="button"
                      onClick={() => setPlanningViewMode('CHRONO')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        planningViewMode === 'CHRONO'
                          ? 'bg-white text-slate-950 shadow-xs font-black'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">view_agenda</span>
                      <span>Vue Agenda</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanningViewMode('DISPATCH_DRIVERS')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        planningViewMode === 'DISPATCH_DRIVERS'
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">badge</span>
                      <span>Planning Chauffeurs ({drivers.length})</span>
                    </button>
                  </div>

                  {/* Filtres d'affectation globale */}
                  <div className="flex items-center gap-1.5 shrink-0 text-xs">
                    <button
                      type="button"
                      onClick={() => setPlanningStatusFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        planningStatusFilter === 'ALL'
                          ? 'bg-surface-container-high text-on-surface shadow-2xs font-extrabold'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Toutes ({plannedMissions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanningStatusFilter('ASSIGNED')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        planningStatusFilter === 'ASSIGNED'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-blue-800 hover:bg-blue-50'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span>Chauffeur affecté ({plannedMissions.filter((m) => !!m.assignedTransporter?.driverName).length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanningStatusFilter('UNASSIGNED')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        planningStatusFilter === 'UNASSIGNED'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span>À affecter ({plannedMissions.filter((m) => !m.assignedTransporter?.driverName).length})</span>
                    </button>
                  </div>
                </div>

                {/* 3. Bandeau des journées individuelles (Défilement horizontal) & Filtre individuel par Chauffeur */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-outline-variant/15">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <span className="text-[11px] font-bold text-on-surface-variant mr-1 shrink-0">Par jour :</span>
                    {planningDaysSummary.map((day) => {
                      const isSelected = selectedPlanningDate === day.dateKey;
                      return (
                        <button
                          key={day.dateKey}
                          type="button"
                          onClick={() => setSelectedPlanningDate(isSelected ? null : day.dateKey)}
                          className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-secondary text-white shadow-xs'
                              : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/20'
                          }`}
                        >
                          <span>{day.label}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-high text-primary font-mono'
                          }`}>
                            {day.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Filtre par chauffeur individuel */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <span className="text-[11px] font-bold text-on-surface-variant mr-1 shrink-0">Chauffeur :</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDriverFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                        selectedDriverFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/20'
                      }`}
                    >
                      Tous
                    </button>
                    {drivers.map((d) => {
                      const count = plannedMissions.filter(
                        (m) =>
                          m.assignedTransporter?.driverName &&
                          (m.assignedTransporter.driverName.toLowerCase().includes(d.firstName.toLowerCase()) ||
                            m.assignedTransporter.driverName.toLowerCase().includes(d.lastName.toLowerCase()))
                      ).length;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDriverFilter(selectedDriverFilter === d.id ? 'ALL' : d.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                            selectedDriverFilter === d.id
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant/20'
                          }`}
                        >
                          <span>👨‍✈️ {d.firstName}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                              selectedDriverFilter === d.id ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setSelectedDriverFilter(selectedDriverFilter === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED')}
                      className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                        selectedDriverFilter === 'UNASSIGNED'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-surface-container-lowest hover:bg-surface-container text-amber-800 border border-amber-300/50'
                      }`}
                    >
                      <span>⚠️ Sans chauffeur</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                          selectedDriverFilter === 'UNASSIGNED' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {plannedMissions.filter((m) => !m.assignedTransporter?.driverName).length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Contenu Planning : soit Vue Dispatching Chauffeurs, soit Vue Chronologique groupée par journée */}
              {planningViewMode === 'DISPATCH_DRIVERS' ? (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  {/* Bandeau d'en-tête Dispatching */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-950/20 via-slate-900/10 to-indigo-950/20 border border-blue-300/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <span className="material-symbols-outlined text-2xl">badge</span>
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm sm:text-base text-on-surface">
                            Dispatching &amp; Planning des Chauffeurs
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono text-xs font-bold">
                            {drivers.length} équipages
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Visualisez le planning individuel de chaque chauffeur pour la période sélectionnée et réaffectez les courses en 1 clic.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsManualRideModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-xs cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span>+ Saisir Course Directe</span>
                    </button>
                  </div>

                  {/* Grille des colonnes : À affecter + Chaque Chauffeur */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                    {/* Colonne 1 : Courses non assignées à un chauffeur */}
                    <div className="rounded-3xl border-2 border-dashed border-amber-400 bg-amber-50/50 p-4 flex flex-col gap-3 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm">
                            <span className="material-symbols-outlined text-base">person_alert</span>
                          </span>
                          <div>
                            <div className="font-extrabold text-xs text-amber-950">À Affecter</div>
                            <div className="text-[10px] text-amber-800">Chauffeur non désigné</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-mono text-xs font-extrabold">
                          {filteredPlanningMissions.filter((m) => !m.assignedTransporter?.driverName).length}
                        </span>
                      </div>

                      {filteredPlanningMissions.filter((m) => !m.assignedTransporter?.driverName).length === 0 ? (
                        <div className="p-6 text-center text-xs text-amber-900/70 flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-2xl text-emerald-600">check_circle</span>
                          <span className="font-bold text-slate-800">Tous les chauffeurs sont désignés</span>
                          <span>Aucune course en attente d'affectation pour cette sélection.</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredPlanningMissions
                            .filter((m) => !m.assignedTransporter?.driverName)
                            .map((mission) => {
                              const timeStr = new Date(mission.pickupDateTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                              const isDirect = mission.source === 'TRANSPORTER_DIRECT';

                              return (
                                <div
                                  key={mission.id}
                                  className="p-3.5 rounded-2xl bg-white border border-amber-300 shadow-xs flex flex-col gap-2.5"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-mono text-xs font-black">
                                        {timeStr}
                                      </span>
                                      <span className="font-mono text-xs font-bold text-primary">#{mission.reference}</span>
                                    </div>
                                    {isDirect ? (
                                      <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-purple-100 text-purple-950 border border-purple-300">
                                        Directe
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-900 border border-teal-200">
                                        Clinigo
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs space-y-1">
                                    <div className="font-bold text-slate-900">{getPatientDisplayName(mission.patient, true)}</div>
                                    <div className="text-[11px] text-slate-600 truncate">
                                      📍 {mission.pickupCity} ➔ {mission.facilityName || mission.dropoffCity}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      {mission.transportType === 'AMBULANCE' ? '🚑 Ambulance' : mission.transportType === 'VSL' ? '🚐 VSL' : '🚗 Taxi Conv.'}
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-amber-900">Affecter en 1 clic à :</label>
                                    <select
                                      defaultValue=""
                                      onChange={(e) => {
                                        handleQuickAssignDriver(mission, e.target.value);
                                        e.target.value = '';
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-950 focus:outline-hidden focus:border-amber-600 cursor-pointer"
                                    >
                                      <option value="" disabled>-- Choisir un chauffeur --</option>
                                      {drivers.map((d) => (
                                        <option key={d.id} value={d.id}>
                                          👨‍✈️ {d.firstName} {d.lastName} ({d.assignedVehiclePlate || 'Sans véhicule'})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {/* Colonnes individuelles pour chaque Chauffeur */}
                    {drivers.map((driver) => {
                      const driverMissions = filteredPlanningMissions.filter(
                        (m) =>
                          m.assignedTransporter?.driverName &&
                          (m.assignedTransporter.driverName.toLowerCase().includes(driver.firstName.toLowerCase()) ||
                            m.assignedTransporter.driverName.toLowerCase().includes(driver.lastName.toLowerCase()))
                      );

                      return (
                        <div
                          key={driver.id}
                          className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-4 flex flex-col gap-3 shadow-xs hover:border-primary/40 transition-colors"
                        >
                          {/* En-tête du chauffeur */}
                          <div className="pb-3 border-b border-outline-variant/15 flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-sm border border-blue-200 shrink-0">
                                {driver.firstName[0]}
                                {driver.lastName[0]}
                              </div>
                              <div>
                                <div className="font-extrabold text-xs text-on-surface flex items-center gap-1.5">
                                  <span>
                                    {driver.firstName} {driver.lastName}
                                  </span>
                                </div>
                                <div className="text-[10px] text-on-surface-variant leading-tight truncate max-w-[140px]">
                                  {driver.role}
                                </div>
                                <a
                                  href={`tel:${driver.phone}`}
                                  className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 mt-0.5"
                                >
                                  <span className="material-symbols-outlined text-[12px]">phone</span>
                                  <span>{driver.phone}</span>
                                </a>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-mono text-xs font-extrabold">
                                {driverMissions.length}
                              </span>
                              {driver.assignedVehiclePlate && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-bold">
                                  {driver.assignedVehiclePlate}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Liste des courses confiées à ce chauffeur */}
                          {driverMissions.length === 0 ? (
                            <div className="p-6 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
                              <span className="material-symbols-outlined text-2xl opacity-40">schedule</span>
                              <span className="font-semibold text-[11px]">Aucune course programmée</span>
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Disponible
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {driverMissions.map((mission) => {
                                const timeStr = new Date(mission.pickupDateTime).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                                const isDirect = mission.source === 'TRANSPORTER_DIRECT';

                                return (
                                  <div
                                    key={mission.id}
                                    onClick={() => setSelectedMissionForRecap(mission)}
                                    className="p-3.5 rounded-2xl bg-surface-container-low/60 hover:bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 transition-all cursor-pointer flex flex-col gap-2 group"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-2 py-0.5 rounded-lg bg-primary text-white font-mono text-xs font-black shadow-2xs">
                                          {timeStr}
                                        </span>
                                        <span className="font-mono text-[11px] text-primary font-bold">
                                          #{mission.reference}
                                        </span>
                                      </div>

                                      {isDirect ? (
                                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-purple-100 text-purple-950 border border-purple-300 flex items-center gap-0.5">
                                          <span className="material-symbols-outlined text-[10px] text-purple-700">call</span>
                                          <span>Directe</span>
                                        </span>
                                      ) : (
                                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-900 border border-teal-200 flex items-center gap-0.5">
                                          <span className="material-symbols-outlined text-[10px] text-teal-700">language</span>
                                          <span>Clinigo</span>
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-xs space-y-1">
                                      <div className="font-bold text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                                        <span>{getPatientDisplayName(mission.patient, true)}</span>
                                        <span className="text-[10px] font-mono text-on-surface-variant font-normal">
                                          {mission.transportType === 'AMBULANCE' ? '🚑' : mission.transportType === 'VSL' ? '🚐' : '🚗'}
                                        </span>
                                      </div>

                                      <div className="p-2 rounded-xl bg-surface-container-lowest text-[11px] space-y-0.5 border border-outline-variant/15">
                                        <div className="truncate text-on-surface-variant">
                                          📍 <span className="font-medium text-on-surface">{mission.pickupCity}</span>
                                        </div>
                                        <div className="truncate text-on-surface-variant">
                                          🏥 <span className="font-bold text-primary">{mission.facilityName || mission.dropoffCity}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div
                                      className="pt-2 border-t border-outline-variant/15 flex items-center justify-between text-[11px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => openReassignModal(mission)}
                                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-xs">sync_alt</span>
                                        <span>Changer</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setSelectedMissionForRecap(mission)}
                                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                                      >
                                        <span>Fiche</span>
                                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : planningGroupedByDay.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl opacity-40">event_busy</span>
                  <div className="font-bold text-sm text-on-surface">Aucune course acceptée dans le planning</div>
                  <p className="text-xs max-w-sm">
                    {planningSearch
                      ? `Aucune course acceptée ne correspond à "${planningSearch}".`
                      : 'Aucune course acceptée ne correspond aux filtres de dates ou de chauffeur sélectionnés.'}
                  </p>
                  {(selectedPlanningDate || planningHorizon !== 'ALL' || planningStatusFilter !== 'ALL' || planningSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlanningHorizon('ALL');
                        setSelectedPlanningDate(null);
                        setPlanningStatusFilter('ALL');
                        setPlanningSearch('');
                      }}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all mt-2 cursor-pointer"
                    >
                      Réinitialiser tous les filtres
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {planningGroupedByDay.map((group) => {
                    const assignedCount = group.rides.filter((r) => !!r.assignedTransporter?.driverName).length;
                    const unassignedCount = group.rides.length - assignedCount;

                    return (
                      <div key={group.dateKey} className="flex flex-col gap-3">
                        {/* En-tête de Journée */}
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">event</span>
                            <h3 className="font-extrabold text-base text-on-surface tracking-tight">
                              {group.fullTitle}
                            </h3>
                            <span className="px-2 py-0.5 rounded-md bg-surface-container font-mono text-xs font-bold text-on-surface-variant">
                              {group.rides.length} course{group.rides.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              {assignedCount} avec chauffeur
                            </span>
                            {unassignedCount > 0 && (
                              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                {unassignedCount} à affecter
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cartes des courses pour cette journée */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.rides.map((mission) => {
                            const hasPmt = mission.patient.hasPmt || mission.patient.pmtUploaded || mission.patient.pmtFileUrl;
                            const timeStr = new Date(mission.pickupDateTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            const hasDriver = !!mission.assignedTransporter?.driverName;

                            return (
                              <div
                                key={mission.id}
                                onClick={() => setSelectedMissionForRecap(mission)}
                                className="p-4 sm:p-5 rounded-3xl border bg-surface-container-lowest border-outline-variant/30 hover:border-primary/50 shadow-xs flex flex-col justify-between gap-3.5 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 group"
                              >
                                {/* En-tête de carte : Heure, Réf, Véhicule & Statut */}
                                <div>
                                  <div className="flex items-start justify-between gap-2 border-b border-outline-variant/15 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="px-2.5 py-1 rounded-xl font-mono text-sm font-extrabold flex items-center gap-1 shadow-2xs bg-primary text-white">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        <span>{timeStr}</span>
                                      </div>
                                      <div>
                                        <div className="font-mono text-xs font-bold text-primary">
                                          #{mission.reference}
                                        </div>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-surface-container text-on-surface-variant">
                                          {mission.transportType === 'AMBULANCE'
                                            ? '🚑 Ambulance'
                                            : mission.transportType === 'VSL'
                                            ? '🚐 VSL'
                                            : '🚗 Taxi'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      {mission.source === 'TRANSPORTER_DIRECT' ? (
                                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-950 border border-purple-300 text-[10px] font-black flex items-center gap-1 shadow-2xs">
                                          <span className="material-symbols-outlined text-[12px] text-purple-700">call</span>
                                          <span>Course Directe</span>
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-[10px] font-bold flex items-center gap-1">
                                          <span className="material-symbols-outlined text-[12px] text-teal-700">language</span>
                                          <span>Clinigo</span>
                                        </span>
                                      )}

                                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-extrabold flex items-center gap-1 border border-blue-200">
                                        <span className="material-symbols-outlined text-xs">verified</span>
                                        {mission.status === 'EN_ROUTE' ? 'En route' : mission.status === 'PICKED_UP' ? 'Prise en charge' : 'Confirmée'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Patient & Trajet */}
                                  <div className="mt-3 space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <div className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                                        <span>{getPatientDisplayName(mission.patient, true)}</span>
                                      </div>
                                      <span className="text-[10px] text-on-surface-variant font-mono">
                                        NIR: {mission.patient.nir ? `${mission.patient.nir.slice(0, 7)}...` : '••••••••'}
                                      </span>
                                    </div>

                                    {/* Trajet résumé */}
                                    <div className="p-2.5 rounded-2xl bg-surface-container-low/70 space-y-1 text-xs">
                                      <div className="flex items-center gap-2 text-on-surface">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                        <span className="font-medium truncate">{mission.pickupCity} ({mission.pickupAddress})</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-on-surface">
                                        <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                                        <span className="font-bold truncate">
                                          {mission.facilityName ? mission.facilityName : `${mission.dropoffAddress}, ${mission.dropoffCity}`}
                                        </span>
                                      </div>
                                      {mission.isRoundTrip && (
                                        <div className="text-[10px] text-secondary font-semibold pt-0.5 flex items-center gap-1">
                                          <span className="material-symbols-outlined text-xs">sync_alt</span>
                                          <span>Aller-Retour programmé</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Équipage Chauffeur */}
                                    {hasDriver ? (
                                      <div className="text-[11px] text-blue-900 bg-blue-50/70 p-2 rounded-xl border border-blue-100 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                          <span className="material-symbols-outlined text-xs text-blue-600">person</span>
                                          <span>Chauffeur : <strong>{mission.assignedTransporter?.driverName}</strong></span>
                                        </span>
                                        <span className="font-mono font-bold text-xs">{mission.assignedTransporter?.vehiclePlate}</span>
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 font-bold">
                                          <span className="material-symbols-outlined text-xs text-amber-600">person_alert</span>
                                          <span>Chauffeur à désigner</span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openReassignModal(mission);
                                          }}
                                          className="px-2 py-0.5 rounded-lg bg-amber-600 text-white font-bold text-[10px] hover:bg-amber-700 cursor-pointer"
                                        >
                                          Affecter
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Pied de carte : Statut PMT et Actions */}
                                <div className="pt-2.5 border-t border-outline-variant/15 flex items-center justify-between gap-2">
                                  <div className="text-[11px]">
                                    {hasPmt ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                        <span className="material-symbols-outlined text-xs">verified</span>
                                        PMT Jointe
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                                        <span className="material-symbols-outlined text-xs">warning</span>
                                        PMT Papier
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => openReassignModal(mission)}
                                      className="px-2.5 py-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Affecter ou modifier le chauffeur et véhicule"
                                    >
                                      <span className="material-symbols-outlined text-xs">person</span>
                                      <span>Chauffeur</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedMissionForRecap(mission)}
                                      className="px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Consulter la fiche récapitulative complète et gérer la course"
                                    >
                                      <span>Fiche</span>
                                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}



          {/* ========================================================================= */}
          {/* TAB 4 : GESTION DU PARC DE VÉHICULES & CHAUFFEURS (CRUD COMPLET)           */}
          {/* ========================================================================= */}
          {activeTab === 'FLOTTE' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* En-tête Flotte & Boutons d'Action */}
              <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">garage</span>
                    <h2 className="text-xl font-extrabold text-on-surface">Véhicules &amp; Équipages Conventionnés</h2>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Flotte homologuée ARS
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setNewVehName('');
                      setNewVehPlate('');
                      setNewVehDriverId('');
                      setIsAddVehicleOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-base">directions_car</span>
                    <span>+ Ajouter un véhicule</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewDriverFirstName('');
                      setNewDriverLastName('');
                      setNewDriverPhone('');
                      setNewDriverPlate('');
                      setIsAddDriverOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-white hover:bg-secondary/90 text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-base">person_add</span>
                    <span>+ Nouveau chauffeur</span>
                  </button>
                </div>
              </div>

              {/* Barre de KPI & Filtres de sous-vue */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFleetSubView('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      fleetSubView === 'ALL'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Vue d'ensemble
                  </button>
                  <button
                    type="button"
                    onClick={() => setFleetSubView('VEHICLES')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      fleetSubView === 'VEHICLES'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    🚗 Véhicules ({fleet.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFleetSubView('DRIVERS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      fleetSubView === 'DRIVERS'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    👨‍✈️ Chauffeurs &amp; Mobiles ({drivers.length})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    🟢 {fleet.filter((v) => v.status === 'DISPONIBLE').length} / {fleet.length} Véhicules prêts
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-bold border border-blue-200">
                    📱 {drivers.length} Chauffeurs avec mobile actif
                  </span>
                </div>
              </div>

              {/* 1. SECTION VÉHICULES */}
              {(fleetSubView === 'ALL' || fleetSubView === 'VEHICLES') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-primary">airport_shuttle</span>
                      <span>Parc des Véhicules Agréés ({fleet.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setNewVehName('');
                        setNewVehPlate('');
                        setNewVehDriverId('');
                        setIsAddVehicleOpen(true);
                      }}
                      className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span>Ajouter un véhicule</span>
                    </button>
                  </div>

                  {fleet.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 text-center">
                      <p className="text-sm text-on-surface-variant">Aucun véhicule dans votre flotte.</p>
                      <button
                        type="button"
                        onClick={() => setIsAddVehicleOpen(true)}
                        className="mt-3 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                      >
                        + Ajouter un premier véhicule
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {fleet.map((veh) => {
                        const isAmbu = veh.type === 'AMBULANCE';
                        const isTaxi = veh.type === 'TAXI_CONVENTIONNE';
                        return (
                          <div
                            key={veh.id}
                            className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary"></div>

                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2 pt-1">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-container text-on-surface">
                                  <span>{isAmbu ? '🚑' : isTaxi ? '🚗' : '🚐'}</span>
                                  <span>{isAmbu ? 'Ambulance ASSU' : isTaxi ? 'Taxi CPAM' : 'VSL'}</span>
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    veh.status === 'DISPONIBLE'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : veh.status === 'EN_MISSION'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'
                                  }`}
                                >
                                  {veh.status === 'DISPONIBLE' ? 'Disponible' : veh.status === 'EN_MISSION' ? 'En mission' : 'En pause'}
                                </span>
                              </div>

                              <div className="font-extrabold text-sm text-on-surface mt-1">{veh.name}</div>

                              {/* Plaque d'immatriculation style officiel français */}
                              <div className="inline-flex items-center bg-white border-2 border-slate-900 rounded-md overflow-hidden my-2 shadow-2xs">
                                <span className="bg-blue-800 text-white text-[9px] font-bold px-1 py-0.5 flex flex-col items-center justify-center leading-none">
                                  <span>★</span>
                                  <span>F</span>
                                </span>
                                <span className="font-mono text-xs font-black text-slate-900 px-2 py-0.5 tracking-wider">
                                  {veh.plate}
                                </span>
                                <span className="bg-blue-800 text-white text-[9px] font-bold px-1 py-0.5 flex flex-col items-center justify-center leading-none">
                                  <span>972</span>
                                </span>
                              </div>

                              {/* Chauffeur affecté & Mobile */}
                              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1 text-xs mt-1">
                                <div className="text-on-surface-variant text-[11px]">Chauffeur titulaire :</div>
                                <div className="font-bold text-on-surface flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm text-secondary">badge</span>
                                  <span>{veh.driver}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-[11px]">
                                  <span className="text-on-surface-variant flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs text-primary">smartphone</span>
                                    <span>Mobile : <strong>{veh.phone || 'Non attribué'}</strong></span>
                                  </span>
                                  {veh.phone && (
                                    <a
                                      href={`tel:${veh.phone}`}
                                      className="text-primary hover:underline font-bold flex items-center gap-0.5 text-[10px]"
                                    >
                                      <span className="material-symbols-outlined text-xs">call</span>
                                      <span>Appeler</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions sur le véhicule */}
                            <div className="pt-2 border-t border-outline-variant/20 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleVehiclePause(veh.id)}
                                className="flex-1 py-1.5 px-2 rounded-xl border border-outline-variant/40 text-[11px] font-bold hover:bg-surface-container transition-all"
                              >
                                {veh.status === 'DISPONIBLE' ? 'Mettre en pause' : 'Rendre disponible'}
                              </button>

                              <button
                                type="button"
                                onClick={() => setVehicleToDelete(veh)}
                                className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
                                title="Supprimer ce véhicule de la flotte"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 2. SECTION CHAUFFEURS & ATTRIBUTION DU MOBILE */}
              {(fleetSubView === 'ALL' || fleetSubView === 'DRIVERS') && (
                <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-secondary">group</span>
                      <span>Gestion des Chauffeurs &amp; Numéros de Mobile ({drivers.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setNewDriverFirstName('');
                        setNewDriverLastName('');
                        setNewDriverPhone('');
                        setNewDriverPlate('');
                        setIsAddDriverOpen(true);
                      }}
                      className="text-xs text-secondary font-bold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      <span>Ajouter un chauffeur</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {drivers.map((dr) => (
                      <div
                        key={dr.id}
                        className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                      >
                        <div>
                          {/* Entête Chauffeur : Avatar & Rôle */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full bg-secondary/15 text-secondary font-bold flex items-center justify-center text-sm">
                              {dr.firstName.charAt(0)}{dr.lastName.charAt(0)}
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {dr.status === 'DISPONIBLE' ? 'En service' : dr.status === 'EN_MISSION' ? 'En mission' : 'En repos'}
                            </span>
                          </div>

                          <div className="font-extrabold text-sm text-on-surface">
                            {dr.firstName} {dr.lastName}
                          </div>
                          <div className="text-[11px] text-secondary font-semibold mt-0.5">
                            {dr.role}
                          </div>

                          {/* Encadré Mobile Chauffeur Dédié */}
                          <div className="my-2.5 p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold uppercase text-primary tracking-wider flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">smartphone</span>
                              <span>Mobile Dédié Chauffeur :</span>
                            </span>
                            <div className="font-mono text-sm font-extrabold text-on-surface">
                              {dr.phone}
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-primary/10">
                              <a
                                href={`tel:${dr.phone}`}
                                className="flex-1 py-1 rounded-lg bg-primary text-white text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-primary/90 transition-all shadow-2xs"
                              >
                                <span className="material-symbols-outlined text-xs">call</span>
                                <span>Appeler</span>
                              </a>
                              <a
                                href={`sms:${dr.phone}`}
                                className="flex-1 py-1 rounded-lg bg-surface-container text-on-surface text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-surface-container-high transition-all"
                              >
                                <span className="material-symbols-outlined text-xs">sms</span>
                                <span>SMS</span>
                              </a>
                            </div>
                          </div>

                          {/* Véhicule assigné */}
                          <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                            <span>Véhicule affecté :</span>
                            {dr.assignedVehiclePlate ? (
                              <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {dr.assignedVehiclePlate}
                              </span>
                            ) : (
                              <span className="italic text-on-surface-variant">Non affecté</span>
                            )}
                          </div>
                        </div>

                        {/* Actions chauffeur */}
                        <div className="pt-2 border-t border-outline-variant/20 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditDriverModal(dr)}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Modifier mobile</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDriverToDelete(dr)}
                            className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all"
                            title="Supprimer ce chauffeur"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VUE 4 : HISTORIQUE COMPLET DES COURSES & ARCHIVES (INCLUANT ANNULÉES)     */}
          {/* ========================================================================= */}
          {activeTab === 'HISTORIQUE' && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* En-tête Historique avec Exports */}
              <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">history</span>
                    <h2 className="text-xl font-extrabold text-on-surface">Historique & Registre des Courses</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold font-mono">
                      {archivedMissions.length} archivée{archivedMissions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
                    Consultez l'ensemble des courses passées (courses réalisées ou annulées avec motif), accédez aux fiches de liaison PMT et exportez votre registre d'activité réglementaire.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={filteredArchivedMissions.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 text-xs font-bold transition-all shadow-xs"
                    title="Exporter le registre au format Excel (.csv)"
                  >
                    <span className="material-symbols-outlined text-base">file_download</span>
                    <span>Export Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={filteredArchivedMissions.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 text-xs font-bold transition-all shadow-xs"
                    title="Générer le registre PDF officiel"
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Barre de recherche et Filtres */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHistorySubFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      historySubFilter === 'ALL'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Toutes les archives ({archivedMissions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistorySubFilter('COMPLETED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      historySubFilter === 'COMPLETED'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Terminées avec succès ({archivedMissions.filter((r) => r.status === 'COMPLETED').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistorySubFilter('CANCELLED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      historySubFilter === 'CANCELLED'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Courses annulées ({archivedMissions.filter((r) => r.status === 'CANCELLED').length})
                  </button>
                </div>

                <div className="relative w-full md:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Rechercher réf, patient, NIR, motif..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary"
                  />
                  {historySearch && (
                    <button
                      type="button"
                      onClick={() => setHistorySearch('')}
                      className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface text-xs"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Liste des courses archivées */}
              {filteredArchivedMissions.length === 0 ? (
                <div className="p-12 text-center rounded-3xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl opacity-40">inventory_2</span>
                  <div className="font-bold text-sm text-on-surface">Aucune course dans l'historique</div>
                  <p className="text-xs max-w-sm">
                    {historySearch
                      ? `Aucune course ne correspond à la recherche "${historySearch}".`
                      : 'Aucune archive disponible avec les filtres sélectionnés.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredArchivedMissions.map((mission) => {
                    const isCancelled = mission.status === 'CANCELLED';
                    const hasPmt = mission.patient.hasPmt || mission.patient.pmtUploaded || mission.patient.pmtFileUrl;

                    return (
                      <div
                        key={mission.id}
                        onClick={() => setSelectedMissionForDetails(mission)}
                        className={`p-5 rounded-3xl bg-surface-container-lowest border shadow-xs flex flex-col justify-between gap-4 transition-all hover:shadow-md cursor-pointer hover:border-primary/40 ${
                          isCancelled
                            ? 'border-rose-200/80 bg-rose-50/20'
                            : 'border-outline-variant/25'
                        }`}
                      >
                        {/* En-tête de la carte */}
                        <div className="flex items-start justify-between gap-2 border-b border-outline-variant/15 pb-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-extrabold text-primary">
                                #{mission.reference}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-surface-container text-on-surface-variant">
                                {mission.transportType === 'AMBULANCE'
                                  ? '🚑 Ambulance'
                                  : mission.transportType === 'VSL'
                                  ? '🚐 VSL'
                                  : '🚗 TPMR'}
                              </span>
                            </div>
                            <div className="text-[11px] text-on-surface-variant mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">calendar_today</span>
                              <span>
                                {new Date(mission.pickupDateTime).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })} à{' '}
                                {new Date(mission.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {isCancelled ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold flex items-center gap-1 border border-rose-200">
                              <span className="material-symbols-outlined text-xs">cancel</span>
                              Annulée
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-200">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              Terminée
                            </span>
                          )}
                        </div>

                        {/* Informations Patient & Trajet */}
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <div className="font-bold text-on-surface text-sm">
                              {mission.patient.firstName} {mission.patient.lastName}
                            </div>
                            <div className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1">
                              <span>NIR:</span>
                              <strong className="text-on-surface">{mission.patient.nir}</strong>
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-surface-container-low/70 space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 text-on-surface">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                              <span className="font-medium truncate">{mission.pickupAddress}, {mission.pickupCity}</span>
                            </div>
                            <div className="flex items-center gap-2 text-on-surface">
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                              <span className="font-bold truncate">
                                {mission.facilityName ? `${mission.facilityName} (${mission.dropoffCity})` : `${mission.dropoffAddress}, ${mission.dropoffCity}`}
                              </span>
                            </div>
                          </div>

                          {/* Info Chauffeur & Véhicule affecté */}
                          {mission.assignedTransporter && (
                            <div className="text-[11px] text-on-surface-variant flex items-center justify-between px-1">
                              <span>Chauffeur : <strong>{mission.assignedTransporter.driverName}</strong></span>
                              <span className="font-mono font-bold text-primary">{mission.assignedTransporter.vehiclePlate}</span>
                            </div>
                          )}

                          {/* Zone d'alerte motif d'annulation si annulée */}
                          {isCancelled && (
                            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-rose-950 text-[11px]">
                                <span className="material-symbols-outlined text-sm text-rose-600">info</span>
                                <span>Motif de l'annulation :</span>
                              </div>
                              <p className="text-[11px] text-rose-800 leading-snug">
                                {mission.mobility.notes || 'Annulée par le régulateur ou le demandeur.'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Pied de carte : Statut PMT et Bouton d'action */}
                        <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between gap-2">
                          <div className="text-[11px]">
                            {hasPmt ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                <span className="material-symbols-outlined text-xs">verified</span>
                                PMT Jointe
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                                <span className="material-symbols-outlined text-xs">warning</span>
                                PMT Papier
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedMissionForDetails(mission)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            <span>Fiche PMT & Détails</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VUE 5 : MON ABONNEMENT & DÉCOMPTE ESSAI GRATUIT                          */}
          {/* ========================================================================= */}
          {activeTab === 'ABONNEMENT' && (
            <TransporterSubscriptionTab
              user={user ? { ...user, subscription: activeSubscription } : null}
              onSubscriptionUpdated={(newSub) => {
                setSubscriptionState(newSub);
                try {
                  localStorage.setItem('medictrans_demo_transporter_sub', JSON.stringify(newSub));
                } catch (e) {
                  // ignore
                }
                if (user) {
                  user.subscription = newSub;
                  AuthService.setLocalUser({ ...user, subscription: newSub });
                }
                showNotification(
                  'success',
                  'Essai gratuit débloqué !',
                  'Votre essai de 30 jours est actif. Redirection vers votre panel de dispatch...'
                );
                setTimeout(() => {
                  setActiveTab('DISPONIBLES');
                }, 1200);
              }}
            />
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
              <div className="font-bold text-on-surface text-sm flex items-center gap-2">
                <span>{getPatientDisplayName(missionToAccept.patient, false)}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  Secret médical
                </span>
              </div>
              <div className="text-on-surface-variant">
                Trajet : <strong>{missionToAccept.pickupCity}</strong> ➔ <strong>{missionToAccept.facilityName || missionToAccept.dropoffCity}</strong>
              </div>
              <div className="text-secondary font-semibold">
                Véhicule prescrit : {missionToAccept.transportType} • ALD 100%
              </div>
              <div className="text-[11px] text-primary bg-primary/5 p-2 rounded-xl border border-primary/15 mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">lock_open</span>
                <span>En confirmant la course, vous déverrouillerez l'accès à toutes les coordonnées du patient (nom complet, NIR, téléphone et PMT).</span>
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

            {/* Heure de prise en charge et Arrivée estimée calculée */}
            {(() => {
              const appTime = missionToAccept.appointmentTime || (
                missionToAccept.pickupDateTime ? new Date(missionToAccept.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '09:00'
              );
              const duration = missionToAccept.estimatedDurationMin || missionToAccept.pricing?.durationMinutes || 25;
              const calculatedArrival = calculateEstimatedArrival(transporterPickupTimeInput, duration);

              let isLate = false;
              if (transporterPickupTimeInput && appTime) {
                const [ah, am] = appTime.split(':').map(Number);
                const [ch, cm] = calculatedArrival.split(':').map(Number);
                if (!isNaN(ah) && !isNaN(am) && !isNaN(ch) && !isNaN(cm)) {
                  isLate = (ch * 60 + cm) > (ah * 60 + am);
                }
              }

              return (
                <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                      Rendez-vous médical patient :
                    </span>
                    <span className="font-extrabold text-sm text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">
                      {appTime}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label 
                      htmlFor="transporterPickupTimeInput"
                      className="text-[11px] font-bold uppercase text-on-surface-variant flex items-center justify-between"
                    >
                      <span>Heure de prise en charge confirmée :</span>
                      <span className="text-[10px] text-secondary font-semibold">Trajet estimé : ~{duration} min</span>
                    </label>
                    <input
                      id="transporterPickupTimeInput"
                      type="time"
                      value={transporterPickupTimeInput}
                      onChange={(e) => setTransporterPickupTimeInput(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl border border-secondary/50 bg-surface-container-lowest font-mono font-bold text-sm text-on-surface outline-none focus:ring-2 focus:ring-secondary text-center shadow-xs"
                    />
                  </div>

                  <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                    isLate
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">
                        {isLate ? 'warning' : 'check_circle'}
                      </span>
                      <span className="font-semibold">Arrivée estimée à destination :</span>
                    </div>
                    <span className="font-mono font-extrabold text-sm">
                      {calculatedArrival}
                    </span>
                  </div>
                  {isLate && (
                    <p className="text-[10px] text-amber-700 leading-tight">
                      ⚠️ Attention : Avec ce départ, l'arrivée calculée ({calculatedArrival}) dépasse l'heure du rendez-vous ({appTime}).
                    </p>
                  )}
                </div>
              );
            })()}

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
              <div className="font-bold text-on-surface text-sm flex items-center gap-2">
                <span>{getPatientDisplayName(missionToDecline.patient, false)}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  Secret médical
                </span>
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

            {/* Alerte si course annulée */}
            {selectedMissionForDetails.status === 'CANCELLED' && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-2 text-rose-950 font-bold text-sm">
                  <span className="material-symbols-outlined text-rose-600 text-xl">cancel</span>
                  <span>Course Annulée</span>
                </div>
                <div className="text-rose-900 leading-relaxed text-xs">
                  <strong>Motif renseigné : </strong>
                  {selectedMissionForDetails.mobility.notes || 'Course annulée par le régulateur ou le demandeur.'}
                </div>
              </div>
            )}

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

            {/* Statut & Prévisualisation de la Prescription PMT */}
            {!selectedMissionForDetails.patient.hasPmt && !selectedMissionForDetails.patient.pmtUploaded && !selectedMissionForDetails.patient.pmtFileUrl ? (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                  <span className="material-symbols-outlined text-xl text-amber-600">warning</span>
                  <span>Avertissement : Pas de PMT téléversée par le client</span>
                </div>
                <p className="text-amber-900 leading-relaxed text-[11px]">
                  Le client n'a pas joint de copie numérique de sa Prescription Médicale de Transport lors de sa demande en ligne.
                </p>
                <div className="p-3 rounded-xl bg-white/90 border border-amber-200 text-amber-950 flex items-start gap-2 text-[11px] font-medium leading-snug">
                  <span className="material-symbols-outlined text-amber-700 text-base shrink-0 mt-0.5">priority_high</span>
                  <span>
                    <strong>Consigne équipage :</strong> Récupérez obligatoirement le <strong>volet papier original Cerfa S3138</strong> (signé et cacheté par le médecin) lors de la prise en charge au domicile ou au centre de soins pour valider la télétransmission CPAM.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
                    <span>Document PMT numérique disponible</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Téléversé
                  </span>
                </div>
                <p className="text-emerald-900 text-[11px]">
                  Nom du fichier : <strong>{selectedMissionForDetails.patient.pmtFileName || 'Prescription_Medicale_S3138.pdf'}</strong>
                </p>
                {selectedMissionForDetails.patient.pmtFileUrl && (
                  <div className="pt-1">
                    <a
                      href={selectedMissionForDetails.patient.pmtFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      <span>Ouvrir la prescription PMT</span>
                    </a>
                  </div>
                )}
              </div>
            )}

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
      {/* MODAL : MODIFIER L'AFFECTATION DU CHAUFFEUR (POST-VALIDATION)             */}
      {/* ========================================================================= */}
      {missionToReassign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">badge</span>
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">
                    Modifier l'affectation
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    Course #{missionToReassign.reference} • Statut : {missionToReassign.status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMissionToReassign(null)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Récapitulatif Course & Patient */}
            <div className="bg-surface-container-low p-3.5 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-on-surface text-sm">
                {missionToReassign.patient.firstName} {missionToReassign.patient.lastName}
              </div>
              <div className="text-on-surface-variant">
                Trajet : <strong>{missionToReassign.pickupCity}</strong> ➔ <strong>{missionToReassign.facilityName || missionToReassign.dropoffCity}</strong>
              </div>
              <div className="text-secondary font-semibold">
                Actuellement assignée à : {missionToReassign.assignedTransporter?.driverName || 'Non assigné'} ({missionToReassign.assignedTransporter?.vehiclePlate || 'N/A'})
              </div>
            </div>

            {/* Formulaire de réaffectation */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Sélectionner dans la flotte :
                </label>
                <select
                  onChange={(e) => handleSelectFleetForReassign(e.target.value)}
                  value={reassignPlate}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                >
                  {fleet.map((v) => (
                    <option key={v.id} value={v.plate}>
                      {v.driver} — {v.name} ({v.plate}) [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Nom du chauffeur :
                </label>
                <input
                  type="text"
                  value={reassignDriver}
                  onChange={(e) => setReassignDriver(e.target.value)}
                  placeholder="Nom & prénom du chauffeur"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Immatriculation :
                  </label>
                  <input
                    type="text"
                    value={reassignPlate}
                    onChange={(e) => setReassignPlate(e.target.value)}
                    placeholder="ex. GH-972-MQ"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono text-xs text-on-surface outline-none focus:border-primary uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Téléphone direct :
                  </label>
                  <input
                    type="text"
                    value={reassignPhone}
                    onChange={(e) => setReassignPhone(e.target.value)}
                    placeholder="0696 XX XX XX"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Délai d'approche estimé (ETA) :
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setReassignEta(mins)}
                      className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                        reassignEta === mins
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
                onClick={() => setMissionToReassign(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmReassignMission}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold shadow-xs hover:bg-secondary/90 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>Enregistrer la réaffectation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : DÉSISTEMENT & REPUBLICATION AUTOMATIQUE DE LA COURSE              */}
      {/* ========================================================================= */}
      {missionToRelease && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">undo</span>
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">
                    Annuler &amp; Republier la course
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    Course #{missionToRelease.reference}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMissionToRelease(null)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Avertissement & Explication */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <span className="material-symbols-outlined text-base">campaign</span>
                <span>Republication instantanée sur le réseau</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-900/90">
                En annulant votre prise en charge, cette course sera <strong>immédiatement remise en ligne</strong> dans les <em>Courses disponibles</em> pour l'ensemble des autres transporteurs sanitaires conventionnés de Martinique.
              </p>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-on-surface text-sm">
                Patient : {missionToRelease.patient.firstName} {missionToRelease.patient.lastName}
              </div>
              <div className="text-on-surface-variant">
                Trajet : <strong>{missionToRelease.pickupCity}</strong> ➔ <strong>{missionToRelease.facilityName || missionToRelease.dropoffCity}</strong>
              </div>
            </div>

            {/* Motif du désistement */}
            <div className="space-y-2 text-xs">
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                Motif de l'annulation / libération :
              </label>
              {[
                { id: 'PANNE_VEHICULE', label: '🔧 Panne ou incident technique sur le véhicule' },
                { id: 'URGENCE_SAMU', label: '🚨 Réquisition SAMU 972 / Urgence vitale prioritaire' },
                { id: 'RETARD_TRAFIC', label: '⏱️ Retard imprévu important / Circulation bloquée' },
                { id: 'EQUIPAGE_INDISPONIBLE', label: '👨‍⚕️ Indisponibilité subite du personnel ambulancier' },
                { id: 'AUTRE', label: '📝 Autre contrainte opérationnelle' }
              ].map((reason) => (
                <label
                  key={reason.id}
                  onClick={() => setReleaseReason(reason.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    releaseReason === reason.id
                      ? 'border-rose-300 bg-rose-50/70 text-rose-900 font-semibold'
                      : 'border-outline-variant/30 hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="releaseReason"
                    value={reason.id}
                    checked={releaseReason === reason.id}
                    onChange={() => setReleaseReason(reason.id)}
                    className="accent-rose-600"
                  />
                  <span>{reason.label}</span>
                </label>
              ))}

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mt-2 mb-1">
                  Commentaire / Précisions éventuelles :
                </label>
                <input
                  type="text"
                  value={releaseCustomNote}
                  onChange={(e) => setReleaseCustomNote(e.target.value)}
                  placeholder="ex. Crevaison sur la RN1, patient prévenu..."
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setMissionToRelease(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
              >
                Conserver la mission
              </button>
              <button
                type="button"
                onClick={confirmReleaseMission}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">campaign</span>
                <span>Confirmer &amp; Republier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : FICHE RÉCAPITULATIVE COMPLÈTE DE COURSE & ACTIONS (PLANNING)       */}
      {/* ========================================================================= */}
      {selectedMissionForRecap && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
            {/* En-tête de la Fiche Récapitulative */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg ${
                  selectedMissionForRecap.status === 'PENDING'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {selectedMissionForRecap.transportType === 'AMBULANCE'
                    ? '🚑'
                    : selectedMissionForRecap.transportType === 'VSL'
                    ? '🚐'
                    : '🚗'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-on-surface">
                      Fiche Récapitulative de Mission
                    </h3>
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      #{selectedMissionForRecap.reference}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    <span className="capitalize">
                      {new Date(selectedMissionForRecap.pickupDateTime).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    <span>à</span>
                    <strong className="text-on-surface font-mono">
                      {new Date(selectedMissionForRecap.pickupDateTime).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMissionForRecap(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Bannière de Statut & Horaires */}
            {selectedMissionForRecap.status === 'PENDING' ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300/80 text-emerald-950 text-xs flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-xl shrink-0 mt-0.5">event_available</span>
                <div className="flex-1">
                  <div className="font-bold text-emerald-900 text-sm">Course disponible à réserver en avance</div>
                  <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                    Rendez-vous médical patient : <strong>{selectedMissionForRecap.appointmentTime || new Date(selectedMissionForRecap.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong>.
                    {selectedMissionForRecap.isRecurring && ` • Transport récurrent (${selectedMissionForRecap.recurringDates?.length || 0} dates programmées).`}
                  </p>
                  <p className="text-emerald-700 text-[10px] mt-1 font-medium">
                    Vous indiquerez votre heure de prise en charge au domicile lors de l'acceptation de la mission.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 text-xl shrink-0 mt-0.5">verified</span>
                <div className="flex-1">
                  <div className="font-bold text-blue-900 text-sm">Course confirmée dans votre planning</div>
                  <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                    Assignée à : <strong>{selectedMissionForRecap.assignedTransporter?.driverName || transporterName}</strong> ({selectedMissionForRecap.assignedTransporter?.vehiclePlate || 'Véhicule flotte'}).
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold font-mono">
                      RDV : {selectedMissionForRecap.appointmentTime || new Date(selectedMissionForRecap.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {selectedMissionForRecap.transporterPickupTime && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold font-mono">
                        Prise en charge : {selectedMissionForRecap.transporterPickupTime}
                      </span>
                    )}
                    {selectedMissionForRecap.estimatedArrivalTime && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold font-mono">
                        Arrivée estimée : {selectedMissionForRecap.estimatedArrivalTime}
                      </span>
                    )}
                    {selectedMissionForRecap.isRecurring && (
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold">
                        Récurrent ({selectedMissionForRecap.recurringDates?.length} dates)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fiche Patient & Couverture CPAM */}
            {(() => {
              const isAccepted = selectedMissionForRecap.status !== 'PENDING';
              return (
                <div className="bg-surface-container-low p-4 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-on-surface">
                        {getPatientDisplayName(selectedMissionForRecap.patient, isAccepted)}
                      </span>
                      {!isAccepted && (
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[10px] border border-primary/20 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">lock</span>
                          Secret médical protégé
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      100% ALD CPAM
                    </span>
                  </div>

                  {!isAccepted && (
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-[11px] flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-700 text-base shrink-0">privacy_tip</span>
                      <span>
                        <strong>Protection du secret médical :</strong> Conformément à la réglementation sanitaire, le nom complet, le NIR, le numéro de téléphone et la PMT sont confidentiels et ne deviennent accessibles qu'après validation de la course par votre société.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-on-surface-variant">
                    <div>
                      N° Sécurité Sociale (NIR) :{' '}
                      {isAccepted ? (
                        <strong className="font-mono text-on-surface">{selectedMissionForRecap.patient.nir}</strong>
                      ) : (
                        <span className="font-mono text-on-surface-variant italic">••••••••••••• (après validation)</span>
                      )}
                    </div>
                    <div>
                      Date de naissance :{' '}
                      {isAccepted ? (
                        <strong className="text-on-surface">{selectedMissionForRecap.patient.birthDate}</strong>
                      ) : (
                        <span className="text-on-surface-variant italic">Masquée avant validation</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Téléphone :</span>
                      {isAccepted ? (
                        <a
                          href={`tel:${selectedMissionForRecap.patient.phone}`}
                          className="text-primary font-bold underline flex items-center gap-0.5"
                        >
                          <span className="material-symbols-outlined text-xs">call</span>
                          <span>{selectedMissionForRecap.patient.phone}</span>
                        </a>
                      ) : (
                        <span className="text-on-surface-variant italic">Accessible après validation</span>
                      )}
                    </div>
                    {selectedMissionForRecap.patient.aldReason && (
                      <div>
                        Prise en charge : <strong className="text-secondary">{selectedMissionForRecap.patient.aldReason}</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Trajet Sanitaire & Établissement */}
            <div className="bg-surface-container-low p-4 rounded-2xl space-y-2 text-xs">
              <span className="text-[11px] font-bold uppercase text-on-surface-variant block">Itinéraire du transport :</span>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-on-surface">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                  <div>
                    <span className="text-on-surface-variant text-[11px] block">Prise en charge :</span>
                    <strong className="text-sm">{selectedMissionForRecap.pickupAddress}, {selectedMissionForRecap.pickupCity}</strong>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-on-surface">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1"></span>
                  <div>
                    <span className="text-on-surface-variant text-[11px] block">Destination médicale :</span>
                    <strong className="text-sm">
                      {selectedMissionForRecap.facilityName
                        ? `${selectedMissionForRecap.facilityName} (${selectedMissionForRecap.dropoffCity})`
                        : `${selectedMissionForRecap.dropoffAddress}, ${selectedMissionForRecap.dropoffCity}`}
                    </strong>
                    {selectedMissionForRecap.facilityDepartment && (
                      <span className="block text-secondary font-semibold text-[11px] mt-0.5">
                        Service : {selectedMissionForRecap.facilityDepartment} {selectedMissionForRecap.bedDischargeNumber ? `• Lit/Box : ${selectedMissionForRecap.bedDischargeNumber}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedMissionForRecap.isRoundTrip && (
                <div className="p-2.5 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-xs flex items-center justify-between font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">sync_alt</span>
                    <span>Transport Aller-Retour programmé</span>
                  </div>
                  {selectedMissionForRecap.returnDateTime && (
                    <span className="font-mono text-[11px]">
                      Retour prévu à {new Date(selectedMissionForRecap.returnDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Carte Google Map interactive du trajet */}
            <div className="h-40 rounded-2xl overflow-hidden border border-outline-variant/30">
              <GoogleMapView
                mode="route"
                origin={selectedMissionForRecap.pickupCity}
                destination={selectedMissionForRecap.facilityName || selectedMissionForRecap.dropoffCity}
                height="100%"
              />
            </div>

            {/* Prescription Médicale de Transport (PMT) */}
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/25 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">description</span>
                  <span>Prescription Médicale de Transport (PMT Cerfa S3138)</span>
                </span>
                <span className="font-bold text-xs text-secondary">
                  Mode : {selectedMissionForRecap.transportType === 'AMBULANCE' ? 'Ambulance' : selectedMissionForRecap.transportType === 'VSL' ? 'VSL' : 'Taxi Conv.'}
                </span>
              </div>

              {selectedMissionForRecap.status === 'PENDING' ? (
                /* PMT NON VISIBLE TANT QUE LA COURSE N'EST PAS ACCEPTÉE */
                <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-on-surface font-bold text-xs">
                    <span className="material-symbols-outlined text-base text-amber-600">lock</span>
                    <span>Document PMT confidentiel — Accessible uniquement après acceptation de la course</span>
                  </div>
                  <p className="text-on-surface-variant text-[11px] leading-relaxed">
                    Conformément aux règles de confidentialité médicale et de régulation, les détails de prescription et le document Cerfa S3138 sont <strong>verrouillés et visibles uniquement après acceptation de la mission</strong>.
                  </p>
                  <div className="pt-0.5">
                    {selectedMissionForRecap.patient.pmtUploaded || selectedMissionForRecap.patient.pmtFileUrl ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px]">
                        <span className="material-symbols-outlined text-xs text-emerald-600">verified</span>
                        Document PMT téléversé par le client (déverrouillé dès acceptation)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px]">
                        <span className="material-symbols-outlined text-xs text-amber-600">warning</span>
                        Avertissement : Pas de PMT téléversée (Cerfa papier original à récupérer lors de la prise en charge)
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* PMT DÉVERROUILLÉE ET VISIBLE POST-ACCEPTATION */
                <>
                  <div className="text-on-surface-variant">
                    Médecin prescripteur : <strong className="text-on-surface">{selectedMissionForRecap.patient.pmtPrescriberDoctor || 'Dr. Régulateur Hospitalier'}</strong>
                  </div>

                  {selectedMissionForRecap.patient.pmtUploaded || selectedMissionForRecap.patient.pmtFileUrl ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-base">verified</span>
                        <span className="font-semibold text-[11px]">
                          PMT numérique disponible ({selectedMissionForRecap.patient.pmtFileName || 'PMT_Prescription.pdf'})
                        </span>
                      </div>
                      {selectedMissionForRecap.patient.pmtFileUrl && (
                        <a
                          href={selectedMissionForRecap.patient.pmtFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors"
                        >
                          Consulter PMT
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-center gap-2 text-[11px]">
                      <span className="material-symbols-outlined text-amber-700 text-base shrink-0">warning</span>
                      <span>
                        <strong>PMT Papier requise :</strong> Le volet papier Cerfa S3138 original sera remis à l'équipage le jour de la prise en charge.
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Consignes & Besoins de Mobilité */}
            <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 text-xs space-y-2">
              <span className="text-[11px] font-bold uppercase text-on-surface-variant block">Besoins Spécifiques & Mobilité :</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedMissionForRecap.mobility.stretcher && (
                  <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-bold text-[11px] flex items-center gap-1">
                    <span>🛏️</span> Brancardage complet
                  </span>
                )}
                {selectedMissionForRecap.mobility.wheelchair && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px] flex items-center gap-1">
                    <span>♿</span> Fauteuil roulant
                  </span>
                )}
                {selectedMissionForRecap.mobility.oxygen && (
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-800 font-bold text-[11px] flex items-center gap-1">
                    <span>💨</span> Oxygénothérapie requise
                  </span>
                )}
                {selectedMissionForRecap.mobility.stairsWithoutElevator && (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1">
                    <span>🪜</span> Portage étages (Étage {selectedMissionForRecap.mobility.floorNumber || 1})
                  </span>
                )}
                {selectedMissionForRecap.mobility.needsEscort && (
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold text-[11px] flex items-center gap-1">
                    <span>👥</span> Accompagnateur autorisé
                  </span>
                )}
              </div>
              <p className="text-on-surface font-medium pt-1 text-[11px]">
                Consignes complémentaires : {selectedMissionForRecap.mobility.notes || 'Transport sanitaire régulier.'}
              </p>
            </div>

            {/* Barre d'Actions Intégrées */}
            <div className="pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedMissionForRecap(null)}
                className="py-2.5 px-4 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
              >
                Fermer la fiche
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {selectedMissionForRecap.status === 'PENDING' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleDirectAccept(selectedMissionForRecap);
                        setSelectedMissionForRecap(null);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold transition-all flex items-center gap-1.5"
                      title="Affectation automatique du premier véhicule disponible de la flotte"
                    >
                      <span className="material-symbols-outlined text-base">bolt</span>
                      <span>Acceptation rapide (1-clic)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedMissionForRecap;
                        setSelectedMissionForRecap(null);
                        openAcceptModal(target);
                      }}
                      className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">person_check</span>
                      <span>Accepter &amp; Affecter un équipage</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedMissionForRecap;
                        setSelectedMissionForRecap(null);
                        openReleaseModal(target);
                      }}
                      className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base text-rose-600">undo</span>
                      <span>Annuler / Libérer la course</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedMissionForRecap;
                        setSelectedMissionForRecap(null);
                        openReassignModal(target);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-base">sync</span>
                      <span>Modifier l'affectation</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1 : AJOUTER UN VÉHICULE                                             */}
      {/* ========================================================================= */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">directions_car</span>
                <h3 className="font-extrabold text-base text-on-surface">Ajouter un véhicule à la flotte</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Catégorie de véhicule conventionné * :
                </label>
                <select
                  value={newVehType}
                  onChange={(e) => setNewVehType(e.target.value as TransportType)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                >
                  <option value="VSL">🚐 VSL (Véhicule Sanitaire Léger)</option>
                  <option value="AMBULANCE">🚑 Ambulance (Type B / ASSU)</option>
                  <option value="TAXI_CONVENTIONNE">🚗 Taxi Conventionné CPAM</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Nom / Indicatif de flotte * :
                </label>
                <input
                  type="text"
                  required
                  value={newVehName}
                  onChange={(e) => setNewVehName(e.target.value)}
                  placeholder="ex. VSL Médical 04 ou ASSU Madinina"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Immatriculation officielle (format AA-123-AA) * :
                </label>
                <input
                  type="text"
                  required
                  value={newVehPlate}
                  onChange={(e) => setNewVehPlate(e.target.value.toUpperCase())}
                  placeholder="ex. JK-972-AZ"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono font-bold text-xs text-on-surface outline-none focus:border-primary uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Chauffeur titulaire assigné (optionnel) :
                </label>
                <select
                  value={newVehDriverId}
                  onChange={(e) => setNewVehDriverId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                >
                  <option value="">-- Aucun chauffeur (assigner plus tard) --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName} ({d.role}) • 📱 {d.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="py-2 px-4 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                >
                  Enregistrer le véhicule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2 : CONFIRMER SUPPRESSION VÉHICULE                                  */}
      {/* ========================================================================= */}
      {vehicleToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-on-surface">Supprimer le véhicule ?</h3>
                <p className="text-on-surface-variant text-[11px]">Cette action est irréversible.</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container-low text-on-surface space-y-1">
              <div className="font-bold">{vehicleToDelete.name}</div>
              <div className="font-mono font-bold text-primary">{vehicleToDelete.plate}</div>
              <div className="text-on-surface-variant text-[11px]">Chauffeur : {vehicleToDelete.driver}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="py-2 px-4 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteVehicle}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Supprimer de la flotte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3 : AJOUTER UN CHAUFFEUR & ATTRIBUER UN MOBILE                      */}
      {/* ========================================================================= */}
      {isAddDriverOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">person_add</span>
                <h3 className="font-extrabold text-base text-on-surface">Nouveau Chauffeur &amp; Attribution Mobile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDriverOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleAddDriver} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Prénom * :
                  </label>
                  <input
                    type="text"
                    required
                    value={newDriverFirstName}
                    onChange={(e) => setNewDriverFirstName(e.target.value)}
                    placeholder="ex. Jean"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Nom de famille * :
                  </label>
                  <input
                    type="text"
                    required
                    value={newDriverLastName}
                    onChange={(e) => setNewDriverLastName(e.target.value)}
                    placeholder="ex. Dupond"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Qualification / Titre professionnel * :
                </label>
                <select
                  value={newDriverRole}
                  onChange={(e) => setNewDriverRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-secondary"
                >
                  <option value="Ambulancier DEA">Ambulancier Diplômé d'État (DEA)</option>
                  <option value="Ambulancier DEA (Cadre)">Ambulancier DEA (Cadre / Chef d'équipe)</option>
                  <option value="Ambulancière Auxiliaire">Ambulancier Auxiliaire</option>
                  <option value="Chauffeur Taxi Conventionné">Chauffeur Taxi Conventionné CPAM</option>
                  <option value="Chauffeur TPMR">Chauffeur TPMR Autonome</option>
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-secondary/5 border border-secondary/20 space-y-1">
                <label className="block text-[11px] font-bold uppercase text-secondary mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">smartphone</span>
                  <span>Numéro de Mobile dédié du chauffeur * :</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newDriverPhone}
                  onChange={(e) => setNewDriverPhone(e.target.value)}
                  placeholder="ex. 0696 34 56 78"
                  className="w-full p-2.5 rounded-xl border border-secondary/40 bg-surface-container-lowest font-mono font-extrabold text-sm text-on-surface outline-none focus:border-secondary"
                />
                <p className="text-[10px] text-on-surface-variant leading-tight mt-1">
                  Ce numéro servira à joindre directement le chauffeur en mission, à lui transmettre les alertes SMS et à l'équipage de bord.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Affecter immédiatement à un véhicule (optionnel) :
                </label>
                <select
                  value={newDriverPlate}
                  onChange={(e) => setNewDriverPlate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-secondary"
                >
                  <option value="">-- Réserve / Non affecté --</option>
                  {fleet.map((v) => (
                    <option key={v.id} value={v.plate}>
                      {v.name} ({v.plate}) [{v.type === 'AMBULANCE' ? 'Ambulance' : v.type === 'VSL' ? 'VSL' : 'Taxi'}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddDriverOpen(false)}
                  className="py-2 px-4 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition-all shadow-xs"
                >
                  Enregistrer le chauffeur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4 : MODIFIER UN CHAUFFEUR & SON NUMÉRO DE MOBILE                     */}
      {/* ========================================================================= */}
      {driverToEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">edit</span>
                <h3 className="font-extrabold text-base text-on-surface">Modifier Chauffeur &amp; Mobile</h3>
              </div>
              <button
                type="button"
                onClick={() => setDriverToEdit(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditedDriver} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Prénom * :
                  </label>
                  <input
                    type="text"
                    required
                    value={editDriverFirstName}
                    onChange={(e) => setEditDriverFirstName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Nom * :
                  </label>
                  <input
                    type="text"
                    required
                    value={editDriverLastName}
                    onChange={(e) => setEditDriverLastName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Rôle / Qualification :
                </label>
                <select
                  value={editDriverRole}
                  onChange={(e) => setEditDriverRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                >
                  <option value="Ambulancier DEA">Ambulancier Diplômé d'État (DEA)</option>
                  <option value="Ambulancier DEA (Cadre)">Ambulancier DEA (Cadre / Chef d'équipe)</option>
                  <option value="Ambulancière Auxiliaire">Ambulancier Auxiliaire</option>
                  <option value="Chauffeur Taxi Conventionné">Chauffeur Taxi Conventionné CPAM</option>
                  <option value="Chauffeur TPMR">Chauffeur TPMR Autonome</option>
                </select>
              </div>

              {/* Champ Mobile direct */}
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/25 space-y-1">
                <label className="block text-[11px] font-bold uppercase text-primary mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">smartphone</span>
                  <span>Numéro de Mobile direct * :</span>
                </label>
                <input
                  type="tel"
                  required
                  value={editDriverPhone}
                  onChange={(e) => setEditDriverPhone(e.target.value)}
                  placeholder="ex. 0696 34 56 78"
                  className="w-full p-2.5 rounded-xl border border-primary/40 bg-surface-container-lowest font-mono font-extrabold text-sm text-on-surface outline-none focus:border-primary"
                />
                <p className="text-[10px] text-on-surface-variant leading-tight">
                  La modification synchronise automatiquement le numéro de mobile du véhicule qui lui est assigné.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Statut opérationnel :
                  </label>
                  <select
                    value={editDriverStatus}
                    onChange={(e) => setEditDriverStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                  >
                    <option value="DISPONIBLE">🟢 Disponible / En service</option>
                    <option value="EN_MISSION">🟠 En mission</option>
                    <option value="EN_REPOS">⚪ En repos / Congé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                    Véhicule affecté :
                  </label>
                  <select
                    value={editDriverPlate}
                    onChange={(e) => setEditDriverPlate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary"
                  >
                    <option value="">Non affecté (réserve)</option>
                    {fleet.map((v) => (
                      <option key={v.id} value={v.plate}>
                        {v.name} ({v.plate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDriverToEdit(null)}
                  className="py-2 px-4 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                >
                  Mettre à jour le mobile &amp; profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5 : CONFIRMER SUPPRESSION CHAUFFEUR                                 */}
      {/* ========================================================================= */}
      {driverToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 text-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">person_remove</span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-on-surface">Retirer ce chauffeur ?</h3>
                <p className="text-on-surface-variant text-[11px]">Le chauffeur sera désassigné de son véhicule.</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-surface-container-low text-on-surface space-y-1">
              <div className="font-bold text-sm">{driverToDelete.firstName} {driverToDelete.lastName}</div>
              <div className="text-secondary font-semibold">{driverToDelete.role}</div>
              <div className="font-mono text-xs">📱 {driverToDelete.phone}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setDriverToDelete(null)}
                className="py-2 px-4 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteDriver}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Retirer de l'équipe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6 : CONFIGURATION OFFICIELLE DES ZONES D'INTERVENTION (NOUVEAU)     */}
      {/* ========================================================================= */}
      {isRadiusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-5xl my-auto">
            <TransporterZoneEditor
              transporterId={user?.transporterId || user?.id || 'demo-transporter'}
              initialBaseAddress={activeZone?.baseAddress || user?.address || ''}
              initialCity={activeZone?.cityName || user?.city || baseCommune}
              initialZone={activeZone}
              onSaved={(newZone) => {
                setActiveZone(newZone);
                setBaseCommune(newZone.cityName);
                showNotification(
                  'success',
                  "Zone d'intervention enregistrée",
                  `Base : ${newZone.cityName} (${newZone.regionName}) • ${newZone.polygonCoordinates.length} sommets • ${newZone.allowExtendedRadius ? 'Offres étendues +30km actives' : 'Offres étendues désactivées'}`
                );
              }}
              onClose={() => setIsRadiusModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE SAISIE MANUELLE DE COURSE DIRECTE / CLIENT PRIVÉ                  */}
      {/* ========================================================================= */}
      <TransporterManualRideModal
        isOpen={isManualRideModalOpen}
        onClose={() => setIsManualRideModalOpen(false)}
        onSuccess={(newRide) => {
          setRides((prev) => [newRide, ...prev]);
          setToastMessage({
            title: 'Course directe ajoutée au planning !',
            desc: `La course #${newRide.reference} (${newRide.patient.firstName} ${newRide.patient.lastName}) est désormais intégrée à votre planning.`,
            type: 'success'
          });
          setActiveTab('PLANNING');
        }}
        drivers={drivers}
        fleet={fleet}
        transporterName={transporterName}
        defaultCity={baseCommune}
        defaultTerritory={baseTerritory}
      />

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
