import React, { useState, useMemo, useEffect } from 'react';
import { Ride, TransportType } from '../types';
import { rideService } from '../services/rideService';

export interface DriverInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  assignedVehiclePlate?: string;
  status: 'DISPONIBLE' | 'EN_MISSION' | 'EN_REPOS';
}

export interface FleetVehicle {
  id: string;
  name: string;
  plate: string;
  type: TransportType;
  status: 'DISPONIBLE' | 'EN_MISSION' | 'EN_PAUSE';
  driver?: string;
}

interface ConflictGroup {
  id: string;
  dateKey: string;
  timeRange: string;
  missions: Ride[];
  hasAmbulance: boolean;
  canCombine: boolean;
  reason: string;
}

export interface TransporterPlanningCalendarProps {
  missions: Ride[];
  drivers: DriverInfo[];
  fleet: FleetVehicle[];
  transporterName: string;
  defaultCity?: string;
  onSelectMission: (mission: Ride) => void;
  onUpdateMission?: (updatedMission: Ride) => void;
  onCombineMissions?: (missionIds: string[], driverName: string, driverPhone: string, vehiclePlate: string) => void;
  onUncombineMission?: (combinedGroupId: string) => void;
  onReassignDriver?: (mission: Ride) => void;
  onAddQuickRide?: (newRide: Ride) => void;
  onRequestOpenFullModal?: (dateTimeISO: string, driverId?: string) => void;
  onDuplicateMission?: (mission: Ride) => void;
}

type CalendarViewMode = 'WEEK' | 'DAY' | 'DRIVERS' | 'MONTH';

const START_HOUR = 6; // 06:00
const END_HOUR = 21; // 21:00
const TOTAL_HOURS = END_HOUR - START_HOUR; // 15 heures
const TOTAL_MINUTES = TOTAL_HOURS * 60; // 900 minutes

const COMMON_FACILITIES = [
  'CHU de Martinique - P. Zobda Quitman',
  'Clinique Sainte-Marie (Schoelcher)',
  'Clinique Saint-Paul (Clairière)',
  'Hôpital Pierre Zobda-Quitman',
  'Centre de dialyse Meynard',
  'Hôpital Maurice Despinoy'
];

export const TransporterPlanningCalendar: React.FC<TransporterPlanningCalendarProps> = ({
  missions,
  drivers,
  fleet,
  transporterName,
  defaultCity = 'Fort-de-France',
  onSelectMission,
  onUpdateMission,
  onCombineMissions,
  onUncombineMission,
  onReassignDriver,
  onAddQuickRide,
  onRequestOpenFullModal,
  onDuplicateMission,
}) => {
  // Navigation & Mode d'affichage
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('WEEK');
  const [filterType, setFilterType] = useState<'ALL' | TransportType>('ALL');
  const [filterDriverId, setFilterDriverId] = useState<string>('ALL');

  // Conflits & Arbitrage
  const [activeConflict, setActiveConflict] = useState<ConflictGroup | null>(null);
  const [selectedCombineDriverId, setSelectedCombineDriverId] = useState<string>('');
  const [combineSuccessToast, setCombineSuccessToast] = useState<string | null>(null);

  // État du créneau vide cliqué pour ajout rapide
  const [slotToCreate, setSlotToCreate] = useState<{
    date: Date;
    dateKey: string;
    hour: number;
    minute: number;
    timeStr: string;
    dateTimeISO: string;
    driverId?: string;
  } | null>(null);

  // Champs du formulaire rapide
  const [quickPatientName, setQuickPatientName] = useState('');
  const [quickPatientPhone, setQuickPatientPhone] = useState('');
  const [quickTransportType, setQuickTransportType] = useState<TransportType>('VSL');
  const [quickPickupAddress, setQuickPickupAddress] = useState('');
  const [quickPickupCity, setQuickPickupCity] = useState(defaultCity);
  const [quickDropoffAddress, setQuickDropoffAddress] = useState('CHU Pierre Zobda Quitman');
  const [quickDropoffCity, setQuickDropoffCity] = useState('Fort-de-France');
  const [quickDurationMin, setQuickDurationMin] = useState(45);
  const [quickDriverId, setQuickDriverId] = useState<string>('');
  const [quickError, setQuickError] = useState<string | null>(null);
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // Heure actuelle en temps réel (pour la ligne rouge d'indicateur)
  const [nowDate, setNowDate] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Calcul du premier jour de la semaine affichée (Lundi)
  const weekDays = useMemo(() => {
    const base = new Date(currentDate);
    const day = base.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Jour unique sélectionné (pour vue Jour ou Ressources)
  const singleDay = useMemo(() => {
    const d = new Date(currentDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  // Formatage standard des clés de date (YYYY-MM-DD)
  const formatDateKey = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Filtrage des courses
  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      if (filterType !== 'ALL' && m.transportType !== filterType) return false;
      if (filterDriverId !== 'ALL') {
        const assignedDriverName = (m.assignedTransporter?.driverName || '').toLowerCase();
        const targetDriver = drivers.find((d) => d.id === filterDriverId);
        if (targetDriver) {
          const matchFirstName = assignedDriverName.includes(targetDriver.firstName.toLowerCase());
          const matchLastName = assignedDriverName.includes(targetDriver.lastName.toLowerCase());
          if (!matchFirstName && !matchLastName) return false;
        } else {
          return false;
        }
      }
      return true;
    });
  }, [missions, filterType, filterDriverId, drivers]);

  // Algorithme de détection des conflits de courses
  const detectedConflicts = useMemo<ConflictGroup[]>(() => {
    const conflictMap = new Map<string, ConflictGroup>();
    const missionsByDay = new Map<string, Ride[]>();

    filteredMissions.forEach((m) => {
      const dateKey = formatDateKey(new Date(m.pickupDateTime));
      if (!missionsByDay.has(dateKey)) {
        missionsByDay.set(dateKey, []);
      }
      missionsByDay.get(dateKey)!.push(m);
    });

    missionsByDay.forEach((dayRides, dateKey) => {
      if (dayRides.length < 2) return;

      const intervals = dayRides.map((r) => {
        const start = new Date(r.pickupDateTime).getTime();
        const durationMin = r.estimatedDurationMin || 45;
        const end = start + durationMin * 60 * 1000;
        return {
          ride: r,
          start,
          end,
          driverName: r.assignedTransporter?.driverName?.trim().toLowerCase() || '',
          driverId: r.assignedTransporter?.driverName || 'UNASSIGNED',
          isShared: !!r.isSharedTransport || !!r.combinedGroupId,
          combinedGroupId: r.combinedGroupId,
        };
      });

      for (let i = 0; i < intervals.length; i++) {
        for (let j = i + 1; j < intervals.length; j++) {
          const a = intervals[i];
          const b = intervals[j];

          // Deux courses déjà associées dans le même groupe partagé ne sont pas en conflit
          if (a.combinedGroupId && b.combinedGroupId && a.combinedGroupId === b.combinedGroupId) {
            continue;
          }

          const hasSameDriver = a.driverName && b.driverName && a.driverName === b.driverName;
          const bothUnassigned = !a.driverName && !b.driverName;
          const driversCollide = hasSameDriver || bothUnassigned;

          if (!driversCollide) continue;

          // Chevauchement temporel : Max(startA, startB) < Min(endA, endB)
          const overlap = Math.max(a.start, b.start) < Math.min(a.end, b.end);
          if (overlap) {
            const conflictKey = `${dateKey}-${a.driverId}-${Math.min(a.start, b.start)}`;
            const ridesInConflict = [a.ride, b.ride];

            const hasAmbulance = ridesInConflict.some((r) => r.transportType === 'AMBULANCE');
            const canCombine = !hasAmbulance && ridesInConflict.length <= 3;

            const startTimeStr = new Date(Math.min(a.start, b.start)).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const endTimeStr = new Date(Math.max(a.end, b.end)).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const reason = hasSameDriver
              ? `Le chauffeur ${a.ride.assignedTransporter?.driverName} a 2 courses programmées sur le même intervalle horaire.`
              : `Deux courses simultanées n'ont pas encore de chauffeur attribué et se chevauchent.`;

            if (!conflictMap.has(conflictKey)) {
              conflictMap.set(conflictKey, {
                id: conflictKey,
                dateKey,
                timeRange: `${startTimeStr} - ${endTimeStr}`,
                missions: ridesInConflict,
                hasAmbulance,
                canCombine,
                reason,
              });
            } else {
              const existing = conflictMap.get(conflictKey)!;
              ridesInConflict.forEach((r) => {
                if (!existing.missions.some((m) => m.id === r.id)) {
                  existing.missions.push(r);
                }
              });
              existing.hasAmbulance = existing.missions.some((m) => m.transportType === 'AMBULANCE');
              existing.canCombine = !existing.hasAmbulance && existing.missions.length <= 3;
            }
          }
        }
      }
    });

    return Array.from(conflictMap.values());
  }, [filteredMissions]);

  // Dictionnaire direct pour retrouver si une course est en conflit
  const missionConflictMap = useMemo(() => {
    const map = new Map<string, ConflictGroup>();
    detectedConflicts.forEach((cg) => {
      cg.missions.forEach((m) => {
        map.set(m.id, cg);
      });
    });
    return map;
  }, [detectedConflicts]);

  // Actions de navigation
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'MONTH') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'WEEK') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'MONTH') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'WEEK') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Clic sur un espace vide du calendrier pour planifier
  const handleSlotClick = (dateObj: Date, hour: number, minute: number, driverId?: string) => {
    const dateCopy = new Date(dateObj);
    dateCopy.setHours(hour, minute, 0, 0);

    const pad = (n: number) => String(n).padStart(2, '0');
    const dateKey = formatDateKey(dateCopy);
    const timeStr = `${pad(hour)}:${pad(minute)}`;
    const dateTimeISO = `${dateKey}T${timeStr}`;

    setSlotToCreate({
      date: dateCopy,
      dateKey,
      hour,
      minute,
      timeStr,
      dateTimeISO,
      driverId
    });

    // Initialiser les champs rapides
    setQuickPatientName('');
    setQuickPatientPhone('');
    setQuickTransportType('VSL');
    setQuickPickupAddress(defaultCity);
    setQuickPickupCity(defaultCity);
    setQuickDropoffAddress('CHU Pierre Zobda Quitman');
    setQuickDropoffCity('Fort-de-France');
    setQuickDurationMin(45);
    setQuickDriverId(driverId || (drivers.length > 0 ? drivers[0].id : ''));
    setQuickError(null);
  };

  // Validation de l'ajout rapide
  const handleConfirmQuickAdd = async () => {
    if (!slotToCreate) return;

    if (!quickPatientName.trim()) {
      setQuickError('Veuillez renseigner le nom ou prénom du patient.');
      return;
    }

    setIsSubmittingQuick(true);
    setQuickError(null);

    const nameParts = quickPatientName.trim().split(' ');
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Patient';

    const targetDriver = drivers.find((d) => d.id === quickDriverId);
    const targetPlate = targetDriver?.assignedVehiclePlate || fleet[0]?.plate || 'GH-972-MQ';

    const newRef = `DIR-${Date.now().toString().slice(-6)}`;
    const newRide: Ride = {
      id: `ride-quick-${Date.now()}`,
      reference: newRef,
      status: 'ACCEPTED',
      source: 'TRANSPORTER_DIRECT',
      isRoundTrip: false,
      createdAt: new Date().toISOString(),
      pickupDateTime: slotToCreate.dateTimeISO,
      estimatedDurationMin: quickDurationMin,
      transportType: quickTransportType,
      mobility: {
        wheelchair: false,
        stretcher: quickTransportType === 'AMBULANCE',
        oxygen: false,
        stairsWithoutElevator: false,
        floorNumber: 0,
        needsEscort: false,
        notes: 'Course directe planifiée depuis le Google Agenda'
      },
      patient: {
        firstName,
        lastName,
        phone: quickPatientPhone.trim() || '06 96 00 00 00',
        email: 'contact@patient.mq',
        address: quickPickupAddress.trim() || defaultCity,
        city: quickPickupCity.trim() || defaultCity,
        postalCode: '97200',
        isAld: true,
        hasPmt: true,
        birthDate: '1980-01-01'
      },
      pickupAddress: quickPickupAddress.trim() || defaultCity,
      pickupCity: quickPickupCity.trim() || defaultCity,
      dropoffAddress: quickDropoffAddress.trim() || 'CHU Pierre Zobda Quitman',
      dropoffCity: quickDropoffCity.trim() || 'Fort-de-France',
      facilityName: quickDropoffAddress.trim() || 'CHU Pierre Zobda Quitman',
      estimatedDistanceKm: 14,
      assignedTransporter: {
        companyName: transporterName,
        driverName: targetDriver ? `${targetDriver.firstName} ${targetDriver.lastName}` : transporterName,
        driverPhone: targetDriver?.phone || '06 96 00 00 00',
        vehiclePlate: targetPlate,
        etaMinutes: 15
      }
    };

    try {
      if (onAddQuickRide) {
        onAddQuickRide(newRide);
      } else if (onUpdateMission) {
        onUpdateMission(newRide);
      }

      try {
        await rideService.createRide(newRide);
      } catch (err) {
        console.warn('Sauvegarde service ride:', err);
      }

      setCombineSuccessToast(`Course #${newRef} (${firstName} ${lastName}) planifiée avec succès à ${slotToCreate.timeStr} !`);
      setTimeout(() => setCombineSuccessToast(null), 5000);
      setSlotToCreate(null);
    } catch (err: any) {
      setQuickError(err.message || "Erreur lors de l'enregistrement de la course.");
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // Basculer vers le formulaire complet
  const handleOpenFullForm = () => {
    if (!slotToCreate) return;
    const dt = slotToCreate.dateTimeISO;
    const drv = slotToCreate.driverId;
    setSlotToCreate(null);
    if (onRequestOpenFullModal) {
      onRequestOpenFullModal(dt, drv);
    }
  };

  // Confirmation de la combinaison en transport partagé
  const handleConfirmCombination = (group: ConflictGroup) => {
    if (group.hasAmbulance) {
      alert("La réglementation interdit formellement le transport partagé pour les ambulances.");
      return;
    }
    if (group.missions.length > 3) {
      alert("Le transport partagé est limité à un maximum de 3 patients simultanés par véhicule.");
      return;
    }

    const driver = drivers.find((d) => d.id === selectedCombineDriverId) || drivers[0];
    const driverName = driver ? `${driver.firstName} ${driver.lastName}` : transporterName;
    const driverPhone = driver?.phone || '0596 00 00 00';
    const vehiclePlate = driver?.assignedVehiclePlate || fleet[0]?.plate || 'GH-972-MQ';
    const missionIds = group.missions.map((m) => m.id);

    if (onCombineMissions) {
      onCombineMissions(missionIds, driverName, driverPhone, vehiclePlate);
    } else {
      const newGroupId = `GRP-${Date.now().toString().slice(-6)}`;
      group.missions.forEach((m) => {
        const updated: Ride = {
          ...m,
          combinedGroupId: newGroupId,
          isSharedTransport: true,
          combinedRidesCount: group.missions.length,
          assignedTransporter: {
            companyName: transporterName,
            driverName,
            driverPhone,
            vehiclePlate,
            etaMinutes: m.assignedTransporter?.etaMinutes || 15,
          },
        };
        if (onUpdateMission) {
          onUpdateMission(updated);
        }
      });
    }

    setCombineSuccessToast(
      `Les ${group.missions.length} courses ont été combinées en transport partagé (${group.missions.length}/3) !`
    );
    setTimeout(() => setCombineSuccessToast(null), 5000);
    setActiveConflict(null);
  };

  // Dissoudre un groupe partagé
  const handleDissolveGroup = (combinedGroupId: string) => {
    if (onUncombineMission) {
      onUncombineMission(combinedGroupId);
    } else {
      missions
        .filter((m) => m.combinedGroupId === combinedGroupId)
        .forEach((m) => {
          const updated: Ride = {
            ...m,
            combinedGroupId: undefined,
            isSharedTransport: false,
            combinedRidesCount: undefined,
          };
          if (onUpdateMission) {
            onUpdateMission(updated);
          }
        });
    }
    setCombineSuccessToast("Le transport partagé a été dissocié en trajets individuels.");
    setTimeout(() => setCombineSuccessToast(null), 4000);
  };

  // =========================================================================
  // 1. EN-TÊTE PROFESSIONNEL (GOOGLE AGENDA PREMIUM)
  // =========================================================================
  const renderCalendarHeader = () => {
    let titleStr = '';
    if (viewMode === 'MONTH') {
      titleStr = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      titleStr = titleStr.charAt(0).toUpperCase() + titleStr.slice(1);
    } else if (viewMode === 'WEEK') {
      const start = weekDays[0];
      const end = weekDays[6];
      titleStr = `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      titleStr = singleDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      titleStr = titleStr.charAt(0).toUpperCase() + titleStr.slice(1);
    }

    return (
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4">
        {/* Ligne 1 : Navigation temporelle + Titre + Boutons Vues + Action Nouvelle Course */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Bouton Aujourd'hui */}
            <button
              type="button"
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm text-blue-600">today</span>
              <span>Aujourd'hui</span>
            </button>

            {/* Chevrons Précédent / Suivant */}
            <div className="flex items-center bg-slate-100/90 rounded-xl p-0.5 border border-slate-200/60">
              <button
                type="button"
                onClick={handlePrev}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
                title="Période précédente"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
                title="Période suivante"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>

            {/* Titre Editorial de la période */}
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight capitalize flex items-center gap-2">
              <span>{titleStr}</span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                {filteredMissions.length} course{filteredMissions.length > 1 ? 's' : ''}
              </span>
            </h2>
          </div>

          {/* Contrôle Segmenté des Vues (Mois / Semaine / Jour / Chauffeurs) + Bouton Nouvelle course */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setViewMode('MONTH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'MONTH'
                    ? 'bg-white text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                <span>Mois</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('WEEK')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'WEEK'
                    ? 'bg-white text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">calendar_view_week</span>
                <span>Semaine</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('DAY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'DAY'
                    ? 'bg-white text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">view_day</span>
                <span>Jour</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('DRIVERS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'DRIVERS'
                    ? 'bg-white text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                <span>Chauffeurs ({drivers.length})</span>
              </button>
            </div>

            {/* Bouton Créer course */}
            <button
              type="button"
              onClick={() => handleSlotClick(currentDate, 8, 30)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Cliquer pour planifier une course sur le calendrier"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>Nouvelle Course</span>
            </button>
          </div>
        </div>

        {/* Ligne 2 : Filtres rapides par type de transport & Sélection chauffeur & Alerte Conflits */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Pills Types */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider shrink-0">Type :</span>
            {[
              { key: 'ALL', label: 'Tous', color: 'bg-slate-900 text-white' },
              { key: 'AMBULANCE', label: 'Ambulances', dot: 'bg-amber-500', color: 'bg-amber-500 text-white' },
              { key: 'VSL', label: 'VSL', dot: 'bg-blue-600', color: 'bg-blue-600 text-white' },
              { key: 'TAXI_CONVENTIONNE', label: 'Taxis CPAM', dot: 'bg-emerald-600', color: 'bg-emerald-600 text-white' },
            ].map((t) => {
              const active = filterType === t.key;
              const count = t.key === 'ALL'
                ? missions.length
                : missions.filter(m => m.transportType === t.key).length;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilterType(t.key as any)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    active
                      ? `${t.color} shadow-xs font-bold`
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700'
                  }`}
                >
                  {t.dot && !active && <span className={`w-2 h-2 rounded-full ${t.dot}`}></span>}
                  <span>{t.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-white/25 text-white' : 'bg-white text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Droite : Sélecteur Chauffeur & Alerte Conflits */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {detectedConflicts.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveConflict(detectedConflicts[0])}
                className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer animate-pulse"
                title="Conflits de programmation détectés. Cliquez pour réguler."
              >
                <span className="material-symbols-outlined text-sm text-rose-600">warning</span>
                <span>{detectedConflicts.length} conflit{detectedConflicts.length > 1 ? 's' : ''} détecté{detectedConflicts.length > 1 ? 's' : ''}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Chauffeur :</span>
              <select
                value={filterDriverId}
                onChange={(e) => setFilterDriverId(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none cursor-pointer focus:border-blue-500"
              >
                <option value="ALL">Tous les équipages</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName} ({d.assignedVehiclePlate || 'Sans véh.'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Indication interactive pour l'utilisateur */}
        <div className="px-3 py-1.5 rounded-xl bg-blue-50/60 border border-blue-100/80 text-blue-900 text-[11px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-blue-600">touch_app</span>
            <span><strong>Astuce agenda :</strong> Cliquez sur n'importe quel créneau horaire vide pour planifier directement une course sur cet horaire.</span>
          </div>
          <span className="text-[10px] text-blue-700 font-medium hidden sm:inline">Créneaux de 30 min interactifs</span>
        </div>

        {/* Toast Succès */}
        {combineSuccessToast && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
              <span>{combineSuccessToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setCombineSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // =========================================================================
  // 2. RENDU D'UN BLOC DE COURSE (ÉVÉNEMENT AGENDA)
  // =========================================================================
  const renderMissionEvent = (mission: Ride) => {
    const d = new Date(mission.pickupDateTime);
    const startMinutes = d.getHours() * 60 + d.getMinutes();
    const duration = mission.estimatedDurationMin || 45;

    // Calcul de position relatif à START_HOUR
    const relStart = startMinutes - START_HOUR * 60;
    const topPct = Math.max(0, (relStart / TOTAL_MINUTES) * 100);
    const heightPct = Math.max(3.8, (duration / TOTAL_MINUTES) * 100);

    const timeLabel = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const endD = new Date(d.getTime() + duration * 60000);
    const endTimeLabel = endD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const isConflict = missionConflictMap.has(mission.id);
    const conflictGroup = missionConflictMap.get(mission.id);
    const isShared = !!mission.isSharedTransport || !!mission.combinedGroupId;
    const isAmbu = mission.transportType === 'AMBULANCE';
    const isTaxi = mission.transportType === 'TAXI_CONVENTIONNE';

    // Styles des cartes selon les règles médicales
    let cardBg = '';
    let cardBorder = '';
    let accentBar = '';
    let typeLabel = '';
    let typeIcon = '';

    if (isShared) {
      cardBg = 'bg-purple-50/95 hover:bg-purple-100/90 text-purple-950';
      cardBorder = 'border-purple-200/90';
      accentBar = 'border-l-[3.5px] border-l-purple-600';
      typeLabel = 'Partagé';
      typeIcon = 'groups';
    } else if (isAmbu) {
      cardBg = 'bg-amber-50/95 hover:bg-amber-100/90 text-amber-950';
      cardBorder = 'border-amber-200/90';
      accentBar = 'border-l-[3.5px] border-l-amber-500';
      typeLabel = 'Ambulance';
      typeIcon = 'ambulance';
    } else if (isTaxi) {
      cardBg = 'bg-emerald-50/95 hover:bg-emerald-100/90 text-emerald-950';
      cardBorder = 'border-emerald-200/90';
      accentBar = 'border-l-[3.5px] border-l-emerald-600';
      typeLabel = 'Taxi CPAM';
      typeIcon = 'local_taxi';
    } else {
      // VSL Médical
      cardBg = 'bg-blue-50/95 hover:bg-blue-100/90 text-blue-950';
      cardBorder = 'border-blue-200/90';
      accentBar = 'border-l-[3.5px] border-l-blue-600';
      typeLabel = 'VSL';
      typeIcon = 'directions_car';
    }

    return (
      <div
        key={mission.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectMission(mission);
        }}
        style={{
          top: `${topPct}%`,
          height: `${heightPct}%`,
          minHeight: '46px',
        }}
        className={`absolute inset-x-1 sm:inset-x-1.5 rounded-xl border p-2 flex flex-col justify-between overflow-hidden shadow-2xs transition-all cursor-pointer z-10 group hover:shadow-md hover:z-20 ${cardBg} ${cardBorder} ${accentBar} ${
          isConflict ? 'ring-2 ring-rose-500 shadow-md animate-pulse' : ''
        }`}
        title={`Course #${mission.reference} • ${mission.patient.firstName} ${mission.patient.lastName} (${typeLabel})`}
      >
        <div>
          {/* Ligne 1 : Heure & Badges statut */}
          <div className="flex items-center justify-between gap-1 leading-none">
            <div className="flex items-center gap-1 font-mono font-black text-[10px] sm:text-[11px] text-slate-800">
              <span>{timeLabel}</span>
              <span className="opacity-40">➔</span>
              <span className="opacity-75">{endTimeLabel}</span>
            </div>

            <div className="flex items-center gap-1">
              {isConflict && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (conflictGroup) setActiveConflict(conflictGroup);
                  }}
                  className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-extrabold text-[9px] shadow-xs flex items-center gap-0.5 hover:scale-105 transition-transform"
                  title="Conflit horaire ! Cliquez pour arbitrer ou combiner."
                >
                  <span className="material-symbols-outlined text-[10px]">warning</span>
                  <span>Conflit</span>
                </button>
              )}

              {isShared && (
                <span className="px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-900 font-black text-[9px] flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[10px]">groups</span>
                  <span>{mission.combinedRidesCount || 2}/3</span>
                </span>
              )}

              <span className="material-symbols-outlined text-[13px] opacity-70">
                {typeIcon}
              </span>
            </div>
          </div>

          {/* Ligne 2 : Nom Patient & Destination */}
          <div className="mt-1">
            <div className="font-extrabold text-xs truncate text-slate-900">
              {mission.patient.firstName} {mission.patient.lastName}
            </div>
            <div className="text-[10px] text-slate-600 truncate flex items-center gap-0.5 mt-0.5 font-medium">
              <span className="material-symbols-outlined text-[11px] text-slate-400 shrink-0">location_on</span>
              <span className="truncate">{mission.pickupCity} ➔ {mission.facilityName || mission.dropoffCity}</span>
            </div>
          </div>
        </div>

        {/* Ligne 3 : Chauffeur & Réf */}
        <div className="pt-1 mt-1 border-t border-slate-900/5 flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-slate-600">
          <span className="truncate">
            {mission.assignedTransporter?.driverName ? (
              <span className="flex items-center gap-1 truncate font-semibold text-slate-800">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                  {mission.assignedTransporter.driverName.charAt(0)}
                </span>
                <span className="truncate">{mission.assignedTransporter.driverName}</span>
              </span>
            ) : (
              <span className="text-amber-800 font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]">person_off</span>
                <span>Sans chauffeur</span>
              </span>
            )}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {onDuplicateMission && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateMission(mission);
                }}
                className="opacity-60 hover:opacity-100 hover:text-blue-700 transition-all p-0.5"
                title="Dupliquer cette course"
              >
                <span className="material-symbols-outlined text-[13px]">content_copy</span>
              </button>
            )}
            <span className="font-mono text-[9px] opacity-60">#{mission.reference.slice(-4)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Rendu des cellules horaires interactives (deux demi-heures par tranche de 1h)
  const renderTimeSlotCells = (dateObj: Date, driverId?: string) => {
    return Array.from({ length: TOTAL_HOURS }).map((_, i) => {
      const hour = START_HOUR + i;
      const padHour = String(hour).padStart(2, '0');

      return (
        <div key={hour} className="h-16 border-b border-slate-200/60 relative">
          {/* 1ère demi-heure : 00 à 30 */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleSlotClick(dateObj, hour, 0, driverId);
            }}
            className="h-1/2 w-full border-b border-dashed border-slate-100/90 hover:bg-blue-500/10 cursor-pointer transition-colors relative group/slot flex items-center justify-center"
            title={`Planifier une course à ${padHour}:00`}
          >
            <span className="opacity-0 group-hover/slot:opacity-100 transition-opacity text-[10px] font-bold text-blue-600 bg-white/95 px-2 py-0.5 rounded-full shadow-2xs pointer-events-none border border-blue-200">
              + {padHour}:00
            </span>
          </div>

          {/* 2ème demi-heure : 30 à 60 */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleSlotClick(dateObj, hour, 30, driverId);
            }}
            className="h-1/2 w-full hover:bg-blue-500/10 cursor-pointer transition-colors relative group/slot flex items-center justify-center"
            title={`Planifier une course à ${padHour}:30`}
          >
            <span className="opacity-0 group-hover/slot:opacity-100 transition-opacity text-[10px] font-bold text-blue-600 bg-white/95 px-2 py-0.5 rounded-full shadow-2xs pointer-events-none border border-blue-200">
              + {padHour}:30
            </span>
          </div>
        </div>
      );
    });
  };

  // =========================================================================
  // 3. VUE SEMAINE (7 Colonnes Lundi à Dimanche)
  // =========================================================================
  const renderWeekView = () => {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Entête des 7 jours */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] sm:grid-cols-[64px_repeat(7,1fr)] border-b border-slate-200/80 bg-slate-50/80 sticky top-0 z-20">
          <div className="p-2 sm:p-3 border-r border-slate-200/60 flex items-center justify-center text-[11px] font-bold text-slate-400">
            Heure
          </div>
          {weekDays.map((day) => {
            const isCurrentDay = day.toDateString() === today.toDateString();
            const dateKey = formatDateKey(day);
            const dayMissions = filteredMissions.filter(
              (m) => formatDateKey(new Date(m.pickupDateTime)) === dateKey
            );
            const hasConflict = detectedConflicts.some((c) => c.dateKey === dateKey);

            return (
              <div
                key={dateKey}
                onClick={() => {
                  setCurrentDate(day);
                  setViewMode('DAY');
                }}
                className={`p-2 sm:p-2.5 text-center border-r border-slate-200/60 last:border-r-0 cursor-pointer hover:bg-slate-100/80 transition-colors ${
                  isCurrentDay ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black ${
                      isCurrentDay
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-800'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  {hasConflict && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Conflit détecté sur cette journée"></span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {dayMissions.length} course{dayMissions.length > 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grille Horaire avec les 7 colonnes */}
        <div className="relative overflow-y-auto max-h-[720px] min-h-[580px] select-none">
          <div className="grid grid-cols-[56px_repeat(7,1fr)] sm:grid-cols-[64px_repeat(7,1fr)] relative">
            {/* Colonne des heures sur la gauche */}
            <div className="border-r border-slate-200/60 bg-slate-50/50">
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                const hour = START_HOUR + i;
                return (
                  <div
                    key={hour}
                    className="h-16 border-b border-slate-200/60 text-right pr-2 pt-1 text-[10px] sm:text-[11px] font-mono font-bold text-slate-400"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                );
              })}
            </div>

            {/* 7 Colonnes de journées */}
            {weekDays.map((day) => {
              const dateKey = formatDateKey(day);
              const dayMissions = filteredMissions.filter(
                (m) => formatDateKey(new Date(m.pickupDateTime)) === dateKey
              );
              const isCurrentDay = day.toDateString() === today.toDateString();

              return (
                <div
                  key={dateKey}
                  className={`relative border-r border-slate-200/60 last:border-r-0 ${
                    isCurrentDay ? 'bg-blue-50/[0.04]' : ''
                  }`}
                >
                  {/* Demi-heures interactives cliquables */}
                  {renderTimeSlotCells(day)}

                  {/* Ligne rouge temps réel pour aujourd'hui */}
                  {isCurrentDay && (() => {
                    const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
                    if (nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60) {
                      const nowPct = ((nowMinutes - START_HOUR * 60) / TOTAL_MINUTES) * 100;
                      return (
                        <div
                          style={{ top: `${nowPct}%` }}
                          className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shadow-xs"></div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Événements de la journée */}
                  {dayMissions.map((mission) => renderMissionEvent(mission))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 4. VUE JOUR (Timeline détaillée d'une seule journée)
  // =========================================================================
  const renderDayView = () => {
    const dateKey = formatDateKey(singleDay);
    const dayMissions = filteredMissions.filter(
      (m) => formatDateKey(new Date(m.pickupDateTime)) === dateKey
    );
    const isCurrentDay = singleDay.toDateString() === today.toDateString();

    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Entête du jour */}
        <div className="p-4 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${
              isCurrentDay ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-800'
            }`}>
              {singleDay.getDate()}
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 capitalize">
                {singleDay.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', year: 'numeric' })}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {dayMissions.length} course{dayMissions.length > 1 ? 's' : ''} planifiée{dayMissions.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setViewMode('WEEK')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">view_week</span>
            <span>Retour Semaine</span>
          </button>
        </div>

        {/* Grille Horaire du jour */}
        <div className="relative overflow-y-auto max-h-[720px] min-h-[580px] select-none">
          <div className="grid grid-cols-[64px_1fr] relative">
            {/* Colonne des heures */}
            <div className="border-r border-slate-200/60 bg-slate-50/50">
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                const hour = START_HOUR + i;
                return (
                  <div
                    key={hour}
                    className="h-16 border-b border-slate-200/60 text-right pr-2 pt-1 text-xs font-mono font-bold text-slate-400"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                );
              })}
            </div>

            {/* Colonne des événements avec créneaux cliquables */}
            <div className="relative">
              {renderTimeSlotCells(singleDay)}

              {/* Ligne rouge temps réel */}
              {isCurrentDay && (() => {
                const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
                if (nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60) {
                  const nowPct = ((nowMinutes - START_HOUR * 60) / TOTAL_MINUTES) * 100;
                  return (
                    <div
                      style={{ top: `${nowPct}%` }}
                      className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shadow-xs"></div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Événements de la journée */}
              {dayMissions.map((mission) => renderMissionEvent(mission))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 5. VUE RESSOURCES CHAUFFEURS (1 Colonne par Chauffeur)
  // =========================================================================
  const renderDriversView = () => {
    const dateKey = formatDateKey(singleDay);
    const dayMissions = filteredMissions.filter(
      (m) => formatDateKey(new Date(m.pickupDateTime)) === dateKey
    );

    const resourceColumns = [
      ...drivers.map((d) => ({
        id: d.id,
        name: `${d.firstName} ${d.lastName}`,
        sub: d.assignedVehiclePlate || 'Sans véhicule',
        avatar: `${d.firstName[0]}${d.lastName[0]}`,
        isDriver: true,
        driverObj: d,
      })),
      {
        id: 'UNASSIGNED',
        name: 'Non affectées',
        sub: 'À répartir',
        avatar: '?',
        isDriver: false,
        driverObj: null,
      },
    ];

    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Entête Chauffeurs */}
        <div className="overflow-x-auto border-b border-slate-200/80 bg-slate-50/80 sticky top-0 z-20">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `64px repeat(${resourceColumns.length}, minmax(170px, 1fr))`,
            }}
          >
            <div className="p-3 border-r border-slate-200/60 flex items-center justify-center text-[11px] font-bold text-slate-400">
              Heure
            </div>

            {resourceColumns.map((col) => {
              const colMissions = dayMissions.filter((m) => {
                if (col.id === 'UNASSIGNED') {
                  return !m.assignedTransporter?.driverName;
                }
                const name = m.assignedTransporter?.driverName?.toLowerCase() || '';
                return (
                  col.driverObj &&
                  (name.includes(col.driverObj.firstName.toLowerCase()) ||
                    name.includes(col.driverObj.lastName.toLowerCase()))
                );
              });

              return (
                <div
                  key={col.id}
                  className="p-3 border-r border-slate-200/60 last:border-r-0 flex items-center gap-2.5"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    col.id === 'UNASSIGNED'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-200'
                  }`}>
                    {col.avatar}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-extrabold text-xs text-slate-900 truncate">{col.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{col.sub} ({colMissions.length})</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grille Horaire par chauffeur */}
        <div className="relative overflow-x-auto overflow-y-auto max-h-[720px] min-h-[580px] select-none">
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: `64px repeat(${resourceColumns.length}, minmax(170px, 1fr))`,
            }}
          >
            {/* Colonne des heures */}
            <div className="border-r border-slate-200/60 bg-slate-50/50">
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                const hour = START_HOUR + i;
                return (
                  <div
                    key={hour}
                    className="h-16 border-b border-slate-200/60 text-right pr-2 pt-1 text-xs font-mono font-bold text-slate-400"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                );
              })}
            </div>

            {/* Colonnes individuelles de chauffeurs */}
            {resourceColumns.map((col) => {
              const colMissions = dayMissions.filter((m) => {
                if (col.id === 'UNASSIGNED') {
                  return !m.assignedTransporter?.driverName;
                }
                const name = m.assignedTransporter?.driverName?.toLowerCase() || '';
                return (
                  col.driverObj &&
                  (name.includes(col.driverObj.firstName.toLowerCase()) ||
                    name.includes(col.driverObj.lastName.toLowerCase()))
                );
              });

              return (
                <div
                  key={col.id}
                  className="relative border-r border-slate-200/60 last:border-r-0"
                >
                  {/* Créneaux cliquables avec pré-sélection de ce chauffeur */}
                  {renderTimeSlotCells(singleDay, col.id !== 'UNASSIGNED' ? col.id : undefined)}

                  {/* Événements de ce chauffeur */}
                  {colMissions.map((mission) => renderMissionEvent(mission))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 6. MODAL D'AJOUT RAPIDE SUR CRÉNEAU CLIQUÉ (POP-UP GOOGLE CALENDAR)
  // =========================================================================
  const renderQuickAddModal = () => {
    if (!slotToCreate) return null;

    const formattedDate = slotToCreate.date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const capFormattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-xl">event_available</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Planifier une course directe
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-blue-700 font-medium mt-0.5">
                  <span className="material-symbols-outlined text-xs">schedule</span>
                  <span>{capFormattedDate} à <strong>{slotToCreate.timeStr}</strong></span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSlotToCreate(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-xl cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {quickError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-rose-600">error</span>
              <span>{quickError}</span>
            </div>
          )}

          {/* Type de Transport */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              Type de Véhicule sanitaire :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'VSL' as TransportType, label: 'VSL Médicalisé', icon: 'directions_car', desc: 'Assis conventionné' },
                { type: 'TAXI_CONVENTIONNE' as TransportType, label: 'Taxi CPAM', icon: 'local_taxi', desc: 'Assis agréé' },
                { type: 'AMBULANCE' as TransportType, label: 'Ambulance', icon: 'ambulance', desc: 'Allongé / Brancard' },
              ].map((item) => {
                const isSelected = quickTransportType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setQuickTransportType(item.type)}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`material-symbols-outlined text-base ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                        {item.icon}
                      </span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                    </div>
                    <div className="mt-1.5">
                      <div className="font-extrabold text-xs text-slate-900">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Nom &amp; Prénom du patient <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={quickPatientName}
                onChange={(e) => setQuickPatientName(e.target.value)}
                placeholder="Ex: Jean DUPONT"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-blue-600"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Téléphone mobile
              </label>
              <input
                type="tel"
                value={quickPatientPhone}
                onChange={(e) => setQuickPatientPhone(e.target.value)}
                placeholder="Ex: 06 96 12 34 56"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-blue-600"
              />
            </div>
          </div>

          {/* Trajet : Départ & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Lieu de départ (Commune / Adresse)
              </label>
              <input
                type="text"
                value={quickPickupAddress}
                onChange={(e) => {
                  setQuickPickupAddress(e.target.value);
                  setQuickPickupCity(e.target.value);
                }}
                placeholder="Ex: Fort-de-France (Clairière)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Destination (Hôpital / Clinique)
              </label>
              <input
                type="text"
                value={quickDropoffAddress}
                onChange={(e) => setQuickDropoffAddress(e.target.value)}
                placeholder="Ex: CHU Pierre Zobda Quitman"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-blue-600"
              />
            </div>
          </div>

          {/* Suggestions d'établissements rapides */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] font-bold text-slate-400 shrink-0">Suggestions :</span>
            {COMMON_FACILITIES.slice(0, 3).map((fac) => (
              <button
                key={fac}
                type="button"
                onClick={() => setQuickDropoffAddress(fac)}
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[10px] font-medium transition-colors shrink-0 cursor-pointer"
              >
                {fac.split(' - ')[0]}
              </button>
            ))}
          </div>

          {/* Attribution Chauffeur & Durée */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Chauffeur affecté
              </label>
              <select
                value={quickDriverId}
                onChange={(e) => setQuickDriverId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-hidden focus:border-blue-600 cursor-pointer"
              >
                <option value="">À affecter ultérieurement</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName} ({d.assignedVehiclePlate || 'Flotte'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Durée estimée de prise en charge
              </label>
              <select
                value={quickDurationMin}
                onChange={(e) => setQuickDurationMin(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-hidden focus:border-blue-600 cursor-pointer"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes (standard)</option>
                <option value={60}>1 heure</option>
                <option value={90}>1 heure 30</option>
                <option value={120}>2 heures (trajet long)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleOpenFullForm}
              className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Formulaire complet (NIR, ALD, Prescription...)</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setSlotToCreate(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickAdd}
                disabled={isSubmittingQuick}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                <span>{isSubmittingQuick ? 'Planification...' : 'Valider ce créneau'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 7. MODAL DE RÉSOLUTION DE CONFLIT & TRANSPORT PARTAGÉ
  // =========================================================================
  const renderConflictModal = () => {
    if (!activeConflict) return null;

    const { missions: conflictMissions, hasAmbulance, canCombine, timeRange, reason } = activeConflict;

    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 border border-rose-200 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl text-rose-700">warning</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Arbitrage de Conflit &amp; Régulation d'Horaire
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Créneau : {timeRange} • {conflictMissions.length} courses en collision
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveConflict(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-xl cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Motif du conflit */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-blue-600">info</span>
            <span>{reason}</span>
          </div>

          {/* Cartes des courses en collision */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Courses concernées par le chevauchement ({conflictMissions.length}) :
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {conflictMissions.map((m, idx) => {
                const isAmbu = m.transportType === 'AMBULANCE';
                const isTaxi = m.transportType === 'TAXI_CONVENTIONNE';
                const timeStr = new Date(m.pickupDateTime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2.5 relative shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-blue-700">
                        <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-[11px] font-black">
                          {timeStr}
                        </span>
                        <span>#{m.reference}</span>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-800 border border-slate-200">
                        <span className="material-symbols-outlined text-xs text-blue-600">
                          {isAmbu ? 'ambulance' : isTaxi ? 'local_taxi' : 'directions_car'}
                        </span>
                        <span>{isAmbu ? 'Ambulance' : isTaxi ? 'Taxi CPAM' : 'VSL'}</span>
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="font-extrabold text-slate-900">
                        Patient {idx + 1} : {m.patient.firstName} {m.patient.lastName}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">
                        Départ : <strong className="text-slate-900">{m.pickupCity}</strong> ({m.pickupAddress})
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">
                        Destination : <strong className="text-blue-700">{m.facilityName || m.dropoffCity}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        {m.assignedTransporter?.driverName ? `Chauffeur : ${m.assignedTransporter.driverName}` : 'Non assigné'}
                      </span>
                      {onReassignDriver && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveConflict(null);
                            onReassignDriver(m);
                          }}
                          className="text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          Réassigner
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section d'arbitrage selon Ambulance vs VSL/Taxi */}
          {hasAmbulance ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-black text-xs text-rose-800 uppercase tracking-wide">
                <span className="material-symbols-outlined text-lg text-rose-700">block</span>
                <span>Combinaison strictement impossible pour les Ambulances</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-900">
                La réglementation sanitaire (ARS &amp; CPAM - Art. R. 322-10-6 du CSS) <strong>interdit formellement le transport partagé pour les ambulances</strong>.
                La prise en charge en position allongée/semi-assise exige une surveillance continue et un brancardage exclusif.
              </p>
              <div className="pt-2 border-t border-rose-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-900">Action recommandée :</span>
                <span className="font-bold text-rose-700">Réaffecter l'une des courses vers un autre chauffeur disponible.</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-xs text-blue-900 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-lg text-blue-700">groups</span>
                  <span>Combiner en transport partagé (Art. R. 322-10-6 CSS)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
                  Max 3 courses
                </span>
              </div>
              <p className="text-xs text-blue-950 leading-relaxed">
                Ces courses de type VSL / Taxi peuvent être légalement regroupées dans le même véhicule.
                Sélectionnez le chauffeur qui réalisera la tournée groupée :
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select
                  value={selectedCombineDriverId}
                  onChange={(e) => setSelectedCombineDriverId(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-blue-300 text-xs font-bold text-slate-800 outline-none flex-1"
                >
                  <option value="">Sélectionner le chauffeur affecté...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName} ({d.assignedVehiclePlate || 'Flotte'})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleConfirmCombination(activeConflict)}
                  disabled={!canCombine}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">merge_type</span>
                  <span>Confirmer le transport partagé ({conflictMissions.length}/3)</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveConflict(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // 5. VUE MENSUELLE (MONTH VIEW)
  // =========================================================================
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Dimanche = 7
    const padStart = startDayOfWeek - 1;

    const days: { date: Date; dateKey: string; isCurrentMonth: boolean; isToday: boolean }[] = [];
    const todayStr = formatDateKey(new Date());

    for (let i = padStart; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        isCurrentMonth: false,
        isToday: formatDateKey(d) === todayStr,
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        isCurrentMonth: true,
        isToday: formatDateKey(d) === todayStr,
      });
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateKey: formatDateKey(d),
        isCurrentMonth: false,
        isToday: formatDateKey(d) === todayStr,
      });
    }

    // Regrouper les missions par jour
    const missionsByDay = new Map<string, Ride[]>();
    filteredMissions.forEach((m) => {
      const k = formatDateKey(new Date(m.pickupDateTime));
      if (!missionsByDay.has(k)) missionsByDay.set(k, []);
      missionsByDay.get(k)!.push(m);
    });

    const dayHeaders = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Entête des jours de la semaine */}
        <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/80 text-center text-xs font-bold text-slate-600 py-3">
          {dayHeaders.map((dh) => (
            <div key={dh} className="truncate px-1">
              <span className="hidden sm:inline">{dh}</span>
              <span className="sm:hidden">{dh.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Grille des cellules du mois */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100/40">
          {days.map((dayItem) => {
            const dayMissions = missionsByDay.get(dayItem.dateKey) || [];
            return (
              <div
                key={dayItem.dateKey}
                onClick={() => {
                  setCurrentDate(dayItem.date);
                  setViewMode('DAY');
                }}
                className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition-colors cursor-pointer group hover:bg-blue-50/40 ${
                  dayItem.isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        dayItem.isToday
                          ? 'bg-blue-600 text-white font-black shadow-xs'
                          : dayItem.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </span>

                    {dayMissions.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                        {dayMissions.length}
                      </span>
                    )}
                  </div>

                  {/* Liste des courses du jour (max 3 pills affichées) */}
                  <div className="space-y-1">
                    {dayMissions.slice(0, 3).map((m) => {
                      const timeStr = m.pickupDateTime
                        ? new Date(m.pickupDateTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '';
                      const isAmb = m.transportType === 'AMBULANCE';
                      const isTaxi = m.transportType === 'TAXI_CONVENTIONNE';
                      const pillBg = isAmb
                        ? 'bg-amber-100 text-amber-900 border-l-2 border-l-amber-600'
                        : isTaxi
                        ? 'bg-emerald-100 text-emerald-900 border-l-2 border-l-emerald-600'
                        : 'bg-blue-100 text-blue-900 border-l-2 border-l-blue-600';

                      return (
                        <div
                          key={m.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMission(m);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] truncate font-medium flex items-center justify-between gap-1 shadow-2xs hover:opacity-90 ${pillBg}`}
                          title={`${timeStr} • ${m.patient.firstName} ${m.patient.lastName}`}
                        >
                          <span className="font-bold shrink-0">{timeStr}</span>
                          <span className="truncate">{m.patient.lastName || 'Patient'}</span>
                        </div>
                      );
                    })}

                    {dayMissions.length > 3 && (
                      <div className="text-[10px] font-bold text-blue-600 text-center">
                        +{dayMissions.length - 3} autre{dayMissions.length - 3 > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-[10px] text-blue-600 font-bold">
                  <span>Voir le jour</span>
                  <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Google Agenda */}
      {renderCalendarHeader()}

      {/* 2. Vue Principale */}
      {viewMode === 'MONTH' && renderMonthView()}
      {viewMode === 'WEEK' && renderWeekView()}
      {viewMode === 'DAY' && renderDayView()}
      {viewMode === 'DRIVERS' && renderDriversView()}

      {/* 3. Modal de Résolution de Conflit */}
      {renderConflictModal()}

      {/* 4. Modal d'Ajout Rapide sur créneau vide cliqué */}
      {renderQuickAddModal()}
    </div>
  );
};

export default TransporterPlanningCalendar;
