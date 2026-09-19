import React, { useState, useMemo } from 'react';
import { Ride, TransportType } from '../types';

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

interface TransporterPlanningCalendarProps {
  missions: Ride[];
  drivers: DriverInfo[];
  fleet: FleetVehicle[];
  transporterName: string;
  onSelectMission: (mission: Ride) => void;
  onUpdateMission?: (updatedMission: Ride) => void;
  onCombineMissions?: (missionIds: string[], driverName: string, driverPhone: string, vehiclePlate: string) => void;
  onUncombineMission?: (combinedGroupId: string) => void;
  onReassignDriver?: (mission: Ride) => void;
}

type CalendarViewMode = 'WEEK' | 'DAY' | 'DRIVERS';

const START_HOUR = 6; // 06:00
const END_HOUR = 21; // 21:00
const TOTAL_HOURS = END_HOUR - START_HOUR; // 15 hours
const TOTAL_MINUTES = TOTAL_HOURS * 60; // 900 minutes

export const TransporterPlanningCalendar: React.FC<TransporterPlanningCalendarProps> = ({
  missions,
  drivers,
  fleet,
  transporterName,
  onSelectMission,
  onUpdateMission,
  onCombineMissions,
  onUncombineMission,
  onReassignDriver,
}) => {
  // Navigation & View State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('WEEK');
  const [filterType, setFilterType] = useState<'ALL' | TransportType>('ALL');
  const [filterDriverId, setFilterDriverId] = useState<string>('ALL');

  // Conflict Resolution Modal State
  const [activeConflict, setActiveConflict] = useState<ConflictGroup | null>(null);
  const [selectedCombineDriverId, setSelectedCombineDriverId] = useState<string>('');
  const [combineSuccessToast, setCombineSuccessToast] = useState<string | null>(null);

  // Helper date calculations
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Compute Week start (Monday) and 7 days
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Current Day for DAY view
  const singleDay = useMemo(() => {
    const d = new Date(currentDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  // Format date keys (YYYY-MM-DD)
  const formatDateKey = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Navigate functions
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'WEEK') {
      nextDate.setDate(nextDate.getDate() - 7);
    } else {
      nextDate.setDate(nextDate.getDate() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'WEEK') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter missions
  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      if (filterType !== 'ALL' && m.transportType !== filterType) {
        return false;
      }
      if (filterDriverId !== 'ALL') {
        const driver = drivers.find((d) => d.id === filterDriverId);
        if (!driver) return false;
        const assignedName = m.assignedTransporter?.driverName?.toLowerCase() || '';
        const matches =
          assignedName.includes(driver.firstName.toLowerCase()) ||
          assignedName.includes(driver.lastName.toLowerCase());
        if (!matches) return false;
      }
      return true;
    });
  }, [missions, filterType, filterDriverId, drivers]);

  // CONFLICT DETECTION ENGINE
  // Two missions conflict if:
  // 1. Same date
  // 2. Time intervals overlap: [Start, Start + Duration]
  // 3. AND (Same driver/vehicle OR collision of unassigned missions)
  // 4. AND not already in the same combinedGroupId!
  const detectedConflicts = useMemo(() => {
    const conflictMap = new Map<string, ConflictGroup>();
    const missionsByDate = new Map<string, Ride[]>();

    filteredMissions.forEach((m) => {
      const d = new Date(m.pickupDateTime);
      const dateKey = formatDateKey(d);
      if (!missionsByDate.has(dateKey)) {
        missionsByDate.set(dateKey, []);
      }
      missionsByDate.get(dateKey)!.push(m);
    });

    missionsByDate.forEach((dayMissions, dateKey) => {
      for (let i = 0; i < dayMissions.length; i++) {
        for (let j = i + 1; j < dayMissions.length; j++) {
          const m1 = dayMissions[i];
          const m2 = dayMissions[j];

          // If already in the same combined group, they are deliberately merged!
          if (m1.combinedGroupId && m2.combinedGroupId && m1.combinedGroupId === m2.combinedGroupId) {
            continue;
          }

          const t1Start = new Date(m1.pickupDateTime).getTime();
          const dur1Min = m1.estimatedDurationMin || 45;
          const t1End = t1Start + (dur1Min + 15) * 60000; // 15 min buffer

          const t2Start = new Date(m2.pickupDateTime).getTime();
          const dur2Min = m2.estimatedDurationMin || 45;
          const t2End = t2Start + (dur2Min + 15) * 60000;

          // Interval overlap check: start1 < end2 && start2 < end1
          const isOverlap = t1Start < t2End && t2Start < t1End;

          if (isOverlap) {
            // Check driver clash or shared schedule
            const d1 = m1.assignedTransporter?.driverName;
            const d2 = m2.assignedTransporter?.driverName;
            const sameDriver = d1 && d2 && d1 === d2;
            const bothUnassigned = !d1 && !d2;

            // Flag conflict if same driver or simultaneous unassigned
            if (sameDriver || bothUnassigned || (!d1 && d2) || (d1 && !d2)) {
              const conflictKey = [m1.id, m2.id].sort().join('_');
              const hasAmbulance = m1.transportType === 'AMBULANCE' || m2.transportType === 'AMBULANCE';
              const canCombine = !hasAmbulance;

              const timeRange = `${new Date(Math.min(t1Start, t2Start)).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })} - ${new Date(Math.max(t1End, t2End)).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}`;

              let reason = '';
              if (hasAmbulance) {
                reason = "Chevauchement incluant une Ambulance. L'Assurance Maladie interdit le transport partagé sous brancardage.";
              } else if (sameDriver) {
                reason = `Même chauffeur (${d1}) affecté sur deux courses simultanées.`;
              } else {
                reason = 'Deux transports programmés sur le même créneau horaire.';
              }

              conflictMap.set(conflictKey, {
                id: conflictKey,
                dateKey,
                timeRange,
                missions: [m1, m2],
                hasAmbulance,
                canCombine,
                reason,
              });
            }
          }
        }
      }
    });

    return Array.from(conflictMap.values());
  }, [filteredMissions]);

  // Quick lookup map: missionId -> conflict group
  const missionConflictMap = useMemo(() => {
    const map = new Map<string, ConflictGroup>();
    detectedConflicts.forEach((cg) => {
      cg.missions.forEach((m) => {
        map.set(m.id, cg);
      });
    });
    return map;
  }, [detectedConflicts]);

  // Execute Combination into Transport Partagé (max 3)
  const handleConfirmCombination = (group: ConflictGroup) => {
    if (group.hasAmbulance) {
      alert("La réglementation interdit formellement le transport partagé pour les ambulances.");
      return;
    }

    if (group.missions.length > 3) {
      alert("Le transport partagé est limité à un maximum de 3 patients simultanés par véhicule.");
      return;
    }

    // Determine driver to assign
    const driver = drivers.find((d) => d.id === selectedCombineDriverId) || drivers[0];
    const driverName = driver ? `${driver.firstName} ${driver.lastName}` : transporterName;
    const driverPhone = driver?.phone || '0596 00 00 00';
    const vehiclePlate = driver?.assignedVehiclePlate || fleet[0]?.plate || 'GH-972-MQ';

    const missionIds = group.missions.map((m) => m.id);

    if (onCombineMissions) {
      onCombineMissions(missionIds, driverName, driverPhone, vehiclePlate);
    } else {
      // Fallback local update if parent didn't provide callback
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
      `Les ${group.missions.length} courses ont été combinées avec succès en transport partagé (${group.missions.length}/3) !`
    );
    setTimeout(() => setCombineSuccessToast(null), 5000);
    setActiveConflict(null);
  };

  // Dissolve/Uncombine a group
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
    setCombineSuccessToast("Le transport partagé a été dissocié en courses individuelles distinctes.");
    setTimeout(() => setCombineSuccessToast(null), 4000);
  };

  // Render Header of the Calendar
  const renderCalendarHeader = () => {
    let titleStr = '';
    if (viewMode === 'WEEK') {
      const start = weekDays[0];
      const end = weekDays[6];
      titleStr = `${start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      titleStr = singleDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      titleStr = titleStr.charAt(0).toUpperCase() + titleStr.slice(1);
    }

    return (
      <div className="bg-surface-container-lowest rounded-3xl p-4 sm:p-5 border border-outline-variant/30 shadow-xs flex flex-col gap-4">
        {/* Top bar: Navigation + Title + Views */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Today Button */}
            <button
              type="button"
              onClick={handleToday}
              className="px-3.5 py-1.5 rounded-xl border border-outline-variant/50 hover:bg-surface-container text-on-surface text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              Aujourd'hui
            </button>

            {/* Prev / Next */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
              <button
                type="button"
                onClick={handlePrev}
                title="Période précédente"
                className="w-8 h-8 rounded-lg hover:bg-surface-container text-on-surface flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                title="Période suivante"
                className="w-8 h-8 rounded-lg hover:bg-surface-container text-on-surface flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>

            {/* Date Title */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
              <h2 className="text-base sm:text-lg font-black text-on-surface tracking-tight capitalize">
                {titleStr}
              </h2>
            </div>
          </div>

          {/* View Mode Switcher + Conflict pill */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {detectedConflicts.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveConflict(detectedConflicts[0])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-black animate-pulse hover:bg-rose-100 transition-all cursor-pointer shadow-xs"
                title="Cliquez pour afficher et résoudre les conflits horaires"
              >
                <span className="material-symbols-outlined text-sm text-rose-600">warning</span>
                <span>{detectedConflicts.length} conflit{detectedConflicts.length > 1 ? 's' : ''} détecté{detectedConflicts.length > 1 ? 's' : ''}</span>
              </button>
            )}

            <div className="inline-flex p-1 bg-surface-container-low rounded-2xl border border-outline-variant/30 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('WEEK')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'WEEK'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">calendar_view_week</span>
                <span>Semaine</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('DAY')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'DAY'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">calendar_view_day</span>
                <span>Jour</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('DRIVERS')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'DRIVERS'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                <span>Chauffeurs ({drivers.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Bar: Transport Type + Drivers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-outline-variant/15 text-xs">
          {/* Type filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-on-surface-variant mr-1 shrink-0">Type :</span>
            {[
              { key: 'ALL', label: 'Tous', icon: 'apps' },
              { key: 'AMBULANCE', label: 'Ambulance', icon: 'ambulance' },
              { key: 'VSL', label: 'VSL', icon: 'directions_car' },
              { key: 'TAXI_CONVENTIONNE', label: 'Taxi CPAM', icon: 'local_taxi' },
            ].map((t) => {
              const active = filterType === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilterType(t.key as any)}
                  className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Driver filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-on-surface-variant shrink-0">Filtrer par chauffeur :</span>
            <select
              value={filterDriverId}
              onChange={(e) => setFilterDriverId(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-bold text-on-surface outline-none cursor-pointer"
            >
              <option value="ALL">Tous les chauffeurs</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName} ({d.assignedVehiclePlate || 'Sans véh.'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Conflict Warning Banner if any */}
        {detectedConflicts.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-orange-500/10 to-rose-500/15 border border-rose-400/60 text-slate-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                <span className="material-symbols-outlined text-xl">event_busy</span>
              </div>
              <div>
                <div className="font-extrabold text-xs sm:text-sm text-rose-950 flex items-center gap-2">
                  <span>Conflits de programmation détectés</span>
                  <span className="px-2 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                    {detectedConflicts.length} alerte{detectedConflicts.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 mt-0.5 leading-tight">
                  Deux ou plusieurs courses se chevauchent sur le même créneau horaire.
                  Pour les véhicules VSL &amp; Taxis, vous pouvez les <strong>combiner en transport partagé (jusqu'à 3 max)</strong>.
                  La combinaison est <strong>strictement interdite pour les ambulances</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveConflict(detectedConflicts[0])}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">rule</span>
              <span>Résoudre le conflit</span>
            </button>
          </div>
        )}

        {/* Success Toast */}
        {combineSuccessToast && (
          <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-700 text-base">check_circle</span>
              <span>{combineSuccessToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setCombineSuccessToast(null)}
              className="text-emerald-800 hover:text-emerald-950"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render a Single Event Block
  const renderMissionEvent = (mission: Ride) => {
    const d = new Date(mission.pickupDateTime);
    const startMinutes = d.getHours() * 60 + d.getMinutes();
    const duration = mission.estimatedDurationMin || 45;

    // Relative to START_HOUR (06:00 = 360 min)
    const relStart = startMinutes - START_HOUR * 60;
    const topPct = Math.max(0, (relStart / TOTAL_MINUTES) * 100);
    const heightPct = Math.max(3.5, (duration / TOTAL_MINUTES) * 100);

    const timeLabel = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const endD = new Date(d.getTime() + duration * 60000);
    const endTimeLabel = endD.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const isConflict = missionConflictMap.has(mission.id);
    const conflictGroup = missionConflictMap.get(mission.id);
    const isShared = !!mission.isSharedTransport || !!mission.combinedGroupId;
    const isAmbu = mission.transportType === 'AMBULANCE';
    const isTaxi = mission.transportType === 'TAXI_CONVENTIONNE';

    // Theme based on transport type and combined status
    let cardStyle = '';
    let accentBorder = '';

    if (isShared) {
      cardStyle = 'bg-purple-50/95 border-purple-300 text-purple-950 hover:bg-purple-100';
      accentBorder = 'border-l-4 border-l-purple-600';
    } else if (isAmbu) {
      cardStyle = 'bg-teal-50/95 border-teal-300 text-teal-950 hover:bg-teal-100';
      accentBorder = 'border-l-4 border-l-teal-600';
    } else if (isTaxi) {
      cardStyle = 'bg-amber-50/95 border-amber-300 text-amber-950 hover:bg-amber-100';
      accentBorder = 'border-l-4 border-l-amber-600';
    } else {
      // VSL
      cardStyle = 'bg-blue-50/95 border-blue-300 text-blue-950 hover:bg-blue-100';
      accentBorder = 'border-l-4 border-l-blue-600';
    }

    return (
      <div
        key={mission.id}
        onClick={() => onSelectMission(mission)}
        style={{
          top: `${topPct}%`,
          height: `${heightPct}%`,
          minHeight: '44px',
        }}
        className={`absolute inset-x-1 sm:inset-x-1.5 rounded-xl border p-1.5 sm:p-2 flex flex-col justify-between overflow-hidden shadow-2xs transition-all cursor-pointer z-10 group hover:shadow-md hover:z-20 ${cardStyle} ${accentBorder} ${
          isConflict ? 'ring-2 ring-rose-500 shadow-md animate-pulse' : ''
        }`}
        title={`Course #${mission.reference} - ${mission.patient.firstName} ${mission.patient.lastName}`}
      >
        <div>
          {/* Header of event block */}
          <div className="flex items-center justify-between gap-1 leading-none">
            <div className="flex items-center gap-1 font-mono font-extrabold text-[10px] sm:text-[11px]">
              <span>{timeLabel}</span>
              <span className="opacity-50">-</span>
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
                  className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs hover:scale-110 transition-transform"
                  title="Conflit horaire détecté ! Cliquez pour combiner ou réassigner."
                >
                  !
                </button>
              )}

              {isShared && (
                <span className="px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-900 font-black text-[9px] flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[10px]">groups</span>
                  <span>{mission.combinedRidesCount || 2}/3</span>
                </span>
              )}

              <span className="material-symbols-outlined text-[13px] opacity-75">
                {isAmbu ? 'ambulance' : isTaxi ? 'local_taxi' : 'directions_car'}
              </span>
            </div>
          </div>

          {/* Patient and Trajet */}
          <div className="mt-1">
            <div className="font-extrabold text-[11px] sm:text-xs truncate text-on-surface">
              {mission.patient.firstName} {mission.patient.lastName[0]}.
            </div>
            <div className="text-[10px] text-on-surface-variant truncate flex items-center gap-0.5 mt-0.5">
              <span className="material-symbols-outlined text-[11px] shrink-0 text-slate-500">trip_origin</span>
              <span className="truncate">{mission.pickupCity} ➔ {mission.facilityName || mission.dropoffCity}</span>
            </div>
          </div>
        </div>

        {/* Footer: Chauffeur attribution */}
        <div className="pt-1 mt-1 border-t border-black/5 flex items-center justify-between text-[9px] sm:text-[10px] font-medium">
          <span className="truncate opacity-80">
            {mission.assignedTransporter?.driverName ? (
              <span className="flex items-center gap-0.5 truncate">
                <span className="material-symbols-outlined text-[11px]">badge</span>
                <span className="truncate">{mission.assignedTransporter.driverName}</span>
              </span>
            ) : (
              <span className="text-amber-800 font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[11px]">person_off</span>
                <span>Non affecté</span>
              </span>
            )}
          </span>
          <span className="font-mono text-[9px] opacity-60">#{mission.reference.slice(-4)}</span>
        </div>
      </div>
    );
  };

  // VUE SEMAINE (7 Colonnes Lundi à Dimanche)
  const renderWeekView = () => {
    return (
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
        {/* Entête des 7 jours */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] sm:grid-cols-[64px_repeat(7,1fr)] border-b border-outline-variant/20 bg-surface-container-low/70 sticky top-0 z-20">
          <div className="p-2 sm:p-3 border-r border-outline-variant/20 flex items-center justify-center text-[11px] font-bold text-on-surface-variant">
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
                className={`p-2 sm:p-2.5 text-center border-r border-outline-variant/20 last:border-r-0 cursor-pointer hover:bg-surface-container transition-colors ${
                  isCurrentDay ? 'bg-primary/5' : ''
                }`}
              >
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-extrabold ${
                      isCurrentDay
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  {hasConflict && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Conflit sur cette journée"></span>
                  )}
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
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
            <div className="border-r border-outline-variant/20 bg-surface-container-low/40">
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                const hour = START_HOUR + i;
                return (
                  <div
                    key={hour}
                    className="h-16 border-b border-outline-variant/15 text-right pr-2 pt-1 text-[10px] sm:text-[11px] font-mono font-bold text-on-surface-variant/80"
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
                  className={`relative border-r border-outline-variant/20 last:border-r-0 ${
                    isCurrentDay ? 'bg-primary/[0.02]' : ''
                  }`}
                >
                  {/* Lignes horizontales d'heures */}
                  {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 border-b border-outline-variant/15 relative"
                    >
                      {/* Demi-heure en pointillés discrets */}
                      <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-outline-variant/10"></div>
                    </div>
                  ))}

                  {/* Ligne rouge temps réel pour aujourd'hui */}
                  {isCurrentDay && (() => {
                    const now = new Date();
                    const nowMinutes = now.getHours() * 60 + now.getMinutes();
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

                  {/* Blocs de courses pour cette journée */}
                  {dayMissions.map((mission) => renderMissionEvent(mission))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // VUE JOUR UNIQUE
  const renderDayView = () => {
    const dateKey = formatDateKey(singleDay);
    const dayMissions = filteredMissions.filter(
      (m) => formatDateKey(new Date(m.pickupDateTime)) === dateKey
    );
    const isCurrentDay = singleDay.toDateString() === today.toDateString();

    return (
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
        {/* Entête du jour */}
        <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${
              isCurrentDay ? 'bg-primary text-white shadow-xs' : 'bg-surface-container text-on-surface'
            }`}>
              {singleDay.getDate()}
            </div>
            <div>
              <div className="font-extrabold text-sm text-on-surface capitalize">
                {singleDay.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', year: 'numeric' })}
              </div>
              <div className="text-xs text-on-surface-variant font-mono">
                {dayMissions.length} course{dayMissions.length > 1 ? 's' : ''} planifiée{dayMissions.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setViewMode('WEEK')}
            className="px-3 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-bold text-on-surface transition-all flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">view_week</span>
            <span>Retour Semaine</span>
          </button>
        </div>

        {/* Grille Horaire du jour */}
        <div className="relative overflow-y-auto max-h-[720px] min-h-[580px] select-none">
          <div className="grid grid-cols-[64px_1fr] relative">
            {/* Colonne des heures */}
            <div className="border-r border-outline-variant/20 bg-surface-container-low/40">
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                const hour = START_HOUR + i;
                return (
                  <div
                    key={hour}
                    className="h-20 border-b border-outline-variant/15 text-right pr-2 pt-1 text-xs font-mono font-bold text-on-surface-variant/80"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                );
              })}
            </div>

            {/* Colonne des événements */}
            <div className="relative">
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                <div key={i} className="h-20 border-b border-outline-variant/15 relative">
                  <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-outline-variant/15"></div>
                </div>
              ))}

              {/* Ligne rouge temps réel */}
              {isCurrentDay && (() => {
                const now = new Date();
                const nowMinutes = now.getHours() * 60 + now.getMinutes();
                if (nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60) {
                  const nowPct = ((nowMinutes - START_HOUR * 60) / TOTAL_MINUTES) * 100;
                  return (
                    <div
                      style={{ top: `${nowPct}%` }}
                      className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none flex items-center"
                    >
                      <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5 shadow-xs"></div>
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

  // VUE RESSOURCES CHAUFFEURS (1 Colonne par Chauffeur sur la journée sélectionnée)
  const renderDriversView = () => {
    const dateKey = formatDateKey(singleDay);
    const dayMissions = filteredMissions.filter(
      (m) => formatDateKey(new Date(m.pickupDateTime)) === dateKey
    );

    // Columns: all drivers + 1 column for unassigned
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
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xs overflow-hidden flex flex-col">
        {/* Entête Chauffeurs */}
        <div className="overflow-x-auto border-b border-outline-variant/20 bg-surface-container-low/70 sticky top-0 z-20">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `64px repeat(${resourceColumns.length}, minmax(160px, 1fr))`,
            }}
          >
            <div className="p-3 border-r border-outline-variant/20 flex items-center justify-center text-[11px] font-bold text-on-surface-variant">
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
                  className="p-3 border-r border-outline-variant/20 last:border-r-0 flex items-center gap-2.5"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    col.id === 'UNASSIGNED' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-200'
                  }`}>
                    {col.avatar}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-extrabold text-xs text-on-surface truncate">{col.name}</div>
                    <div className="text-[10px] text-on-surface-variant font-mono truncate">{col.sub} ({colMissions.length})</div>
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
              gridTemplateColumns: `64px repeat(${resourceColumns.length}, minmax(160px, 1fr))`,
            }}
          >
            {/* Colonne des heures */}
            <div className="border-r border-outline-variant/20 bg-surface-container-low/40">
              {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                const hour = START_HOUR + i;
                return (
                  <div
                    key={hour}
                    className="h-20 border-b border-outline-variant/15 text-right pr-2 pt-1 text-xs font-mono font-bold text-on-surface-variant/80"
                  >
                    {String(hour).padStart(2, '0')}:00
                  </div>
                );
              })}
            </div>

            {/* Colonnes individuelles */}
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
                  className="relative border-r border-outline-variant/20 last:border-r-0"
                >
                  {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                    <div key={i} className="h-20 border-b border-outline-variant/15 relative">
                      <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-outline-variant/15"></div>
                    </div>
                  ))}

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

  // MODAL : RÉSOLUTION DE CONFLIT & COMBINAISON DE COURSES (TRANSPORT PARTAGÉ MAX 3)
  const renderConflictModal = () => {
    if (!activeConflict) return null;

    const { missions: conflictMissions, hasAmbulance, canCombine, timeRange, reason } = activeConflict;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 border border-rose-200 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl text-rose-700">warning</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-on-surface">
                  Détection de conflit &amp; Régulation d'horaire
                </h3>
                <p className="text-xs text-on-surface-variant font-mono">
                  Créneau : {timeRange} • {conflictMissions.length} courses en collision
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveConflict(null)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-xl"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Conflict Reason Explanation */}
          <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface flex items-center gap-2.5">
            <span className="material-symbols-outlined text-base text-secondary">info</span>
            <span>{reason}</span>
          </div>

          {/* Cards of conflicting missions */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-on-surface-variant tracking-wider">
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
                    className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-between gap-2.5 relative shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-1 border-b border-outline-variant/15 pb-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-primary">
                        <span className="px-2 py-0.5 rounded-lg bg-primary text-white text-[11px] font-black">
                          {timeStr}
                        </span>
                        <span>#{m.reference}</span>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface border border-outline-variant/20">
                        <span className="material-symbols-outlined text-xs text-primary">
                          {isAmbu ? 'ambulance' : isTaxi ? 'local_taxi' : 'directions_car'}
                        </span>
                        <span>{isAmbu ? 'Ambulance' : isTaxi ? 'Taxi CPAM' : 'VSL'}</span>
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="font-extrabold text-on-surface">
                        Patient {idx + 1} : {m.patient.firstName} {m.patient.lastName}
                      </div>
                      <div className="text-[11px] text-on-surface-variant truncate">
                        Départ : <strong className="text-on-surface">{m.pickupCity}</strong> ({m.pickupAddress})
                      </div>
                      <div className="text-[11px] text-on-surface-variant truncate">
                        Destination : <strong className="text-primary">{m.facilityName || m.dropoffCity}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>Affecté à : <strong>{m.assignedTransporter?.driverName || 'Non affecté'}</strong></span>
                      {onReassignDriver && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveConflict(null);
                            onReassignDriver(m);
                          }}
                          className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                        >
                          Changer chauffeur
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CASE 1 : AMBULANCE RESTRICTION (IMPOSSIBLE POUR LES AMBULANCES) */}
          {hasAmbulance && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm text-rose-900">
                <span className="material-symbols-outlined text-xl text-rose-600">block</span>
                <span>Combinaison strictement impossible pour les Ambulances</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                <strong>Réglementation CPAM &amp; ARS :</strong> Le transport en Ambulance (ASSU) nécessite un équipage dédié avec surveillance continue du patient sous brancardage strict.
                Le regroupement de patients en <strong>transport partagé est formellement interdit pour toute course en Ambulance</strong>.
              </p>
              <div className="pt-2 text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                <span>Solution : Réaffectez l'une des courses à un autre chauffeur ou débranchez l'horaire.</span>
              </div>
            </div>
          )}

          {/* CASE 2 : VSL & TAXI COMBINATION (TRANSPORT PARTAGÉ JUSQU'À 3 PATIENTS) */}
          {canCombine && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-purple-400/50 text-slate-900 flex flex-col gap-3 animate-fadeIn">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm text-purple-950">
                  <span className="material-symbols-outlined text-xl text-purple-700">groups</span>
                  <span>Option : Combiner en Transport Partagé (Jusqu'à 3 max)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-black text-[10px] tracking-wide">
                  Art. R. 322-10-6 CSS
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Les transports en <strong>VSL</strong> et <strong>Taxi conventionné</strong> peuvent être légalement combinés en un circuit unique si les trajets et créneaux sont compatibles.
                La Sécurité Sociale autorise <strong>jusqu'à 3 patients transportés simultanément</strong>.
              </p>

              {/* Chauffeur selection for combined route */}
              <div className="bg-white/80 p-3 rounded-xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <label className="font-bold text-purple-950">
                  Chauffeur &amp; Véhicule titulaire du circuit partagé :
                </label>
                <select
                  value={selectedCombineDriverId}
                  onChange={(e) => setSelectedCombineDriverId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-300 font-bold text-purple-950 text-xs outline-none cursor-pointer"
                >
                  <option value="">-- Choisir un chauffeur commun --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName} ({d.assignedVehiclePlate || 'Sans véh.'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleConfirmCombination(activeConflict)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-base">merge_type</span>
                <span>Valider la combinaison en Transport Partagé ({conflictMissions.length}/3)</span>
              </button>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setActiveConflict(null)}
              className="py-2.5 px-4 rounded-xl border border-outline-variant/40 text-xs font-bold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Google Agenda */}
      {renderCalendarHeader()}

      {/* 2. Main Calendar Content according to View Mode */}
      {viewMode === 'WEEK' && renderWeekView()}
      {viewMode === 'DAY' && renderDayView()}
      {viewMode === 'DRIVERS' && renderDriversView()}

      {/* 3. Conflict Resolution Modal */}
      {renderConflictModal()}
    </div>
  );
};
export default TransporterPlanningCalendar;
