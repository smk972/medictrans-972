import React, { useMemo } from 'react';
import { Ride } from '../types';
import { Driver, VehicleFleet } from '../pages/TransporterPortalPage';

interface TransporterDashboardTabProps {
  rides: Ride[];
  drivers: Driver[];
  fleet: VehicleFleet[];
  transporterName: string;
  onNavigateTab: (tab: 'DISPONIBLES' | 'ACTIVES' | 'PLANNING' | 'FLOTTE' | 'HISTORIQUE' | 'ABONNEMENT' | 'PATIENTS') => void;
  onOpenNewRideModal: () => void;
  onOpenAddVehicleModal: () => void;
  onOpenAddDriverModal: () => void;
  onSelectRide: (ride: Ride) => void;
}

export const TransporterDashboardTab: React.FC<TransporterDashboardTabProps> = ({
  rides,
  drivers,
  fleet,
  transporterName,
  onNavigateTab,
  onOpenNewRideModal,
  onOpenAddVehicleModal,
  onOpenAddDriverModal,
  onSelectRide,
}) => {
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => now.toISOString().slice(0, 10), [now]);

  // Statistiques des courses
  const stats = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let todayRevenue = 0;
    let hasFinancialData = false;

    const unassignedNext24h: Ride[] = [];
    const nowTime = now.getTime();
    const next24hTime = nowTime + 24 * 3600 * 1000;

    for (const r of rides) {
      const pDate = r.pickupDateTime || r.createdAt || '';
      const isToday = pDate.startsWith(todayStr);

      if (isToday) {
        todayCount++;
        const amount = r.pricing?.totalPrestation;
        if (amount && (r.status === 'COMPLETED' || r.status === 'ACCEPTED' || r.status === 'EN_ROUTE' || r.status === 'PICKED_UP')) {
          todayRevenue += amount;
          hasFinancialData = true;
        }
      }

      const pTime = pDate ? new Date(pDate).getTime() : 0;
      if (pTime > nowTime && r.status !== 'CANCELLED' && r.status !== 'COMPLETED') {
        upcomingCount++;
      }

      switch (r.status) {
        case 'PENDING':
          pendingCount++;
          break;
        case 'ACCEPTED':
          confirmedCount++;
          break;
        case 'EN_ROUTE':
        case 'PICKED_UP':
          inProgressCount++;
          break;
        case 'COMPLETED':
          completedCount++;
          break;
        case 'CANCELLED':
          cancelledCount++;
          break;
      }

      // Alerte courses dans les 24h sans chauffeur affecté
      if (
        pTime >= nowTime &&
        pTime <= next24hTime &&
        r.status !== 'CANCELLED' &&
        r.status !== 'COMPLETED' &&
        !r.assignedDriverId &&
        !r.assignedTransporter?.driverName
      ) {
        unassignedNext24h.push(r);
      }
    }

    return {
      todayCount,
      upcomingCount,
      pendingCount,
      confirmedCount,
      inProgressCount,
      completedCount,
      cancelledCount,
      todayRevenue,
      hasFinancialData,
      unassignedNext24h,
    };
  }, [rides, todayStr, now]);

  // Disponibilités ressources
  const availableDriversCount = useMemo(
    () => drivers.filter((d) => d.status === 'DISPONIBLE').length,
    [drivers]
  );
  const availableVehiclesCount = useMemo(
    () => fleet.filter((v) => v.status === 'DISPONIBLE').length,
    [fleet]
  );

  // Nombre de patients uniques ayant déjà été transportés
  const uniquePatientsCount = useMemo(() => {
    const set = new Set<string>();
    for (const r of rides) {
      if (r.patient?.lastName && r.patient?.firstName) {
        set.add(`${r.patient.lastName.toLowerCase()}_${r.patient.firstName.toLowerCase()}`);
      }
    }
    return set.size;
  }, [rides]);

  // Activité récente (les 6 dernières courses enregistrées)
  const recentRides = useMemo(() => {
    return [...rides]
      .sort((a, b) => {
        const tA = new Date(a.createdAt || a.pickupDateTime || 0).getTime();
        const tB = new Date(b.createdAt || b.pickupDateTime || 0).getTime();
        return tB - tA;
      })
      .slice(0, 6);
  }, [rides]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* 1. Cockpit En-tête : Salutations & Raccourcis Rapides */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Tableau de Bord Exécutif
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{transporterName}</h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Gestion quotidienne de vos transports sanitaires, affectations des équipages et suivi des disponibilités en temps réel.
          </p>
        </div>

        {/* Barre de Raccourcis Rapides (Chapitre 1 - Point 13) */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenNewRideModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all transform active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>Créer une course</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('PLANNING')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            <span>Planning</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('PATIENTS')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">folder_shared</span>
            <span>Répertoire</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddDriverModal}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Chauffeur</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddVehicleModal}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">directions_car</span>
            <span>Véhicule</span>
          </button>
        </div>
      </div>

      {/* 2. Alertes Opérationnelles Importantes (Chapitre 1 - Point 10) */}
      {stats.unassignedNext24h.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl shrink-0 mt-0.5">warning</span>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {stats.unassignedNext24h.length} course(s) dans les prochaines 24h sans chauffeur affecté
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Attribuez rapidement un équipage pour garantir la prise en charge ponctuelle des patients.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('PLANNING')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            <span>Attribuer au planning</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      )}

      {/* 3. Grille des Indicateurs Clés (KPIs en Temps Réel) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Courses du jour */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Aujourd'hui</span>
            <span className="material-symbols-outlined text-teal-600 text-lg">today</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.todayCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">courses programmées</span>
          </div>
        </div>

        {/* Courses à venir */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>À venir</span>
            <span className="material-symbols-outlined text-indigo-600 text-lg">event_upcoming</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.upcomingCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">courses futures</span>
          </div>
        </div>

        {/* En attente */}
        <div
          onClick={() => onNavigateTab('DISPONIBLES')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>En attente</span>
            <span className="material-symbols-outlined text-amber-600 text-lg">hourglass_top</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{stats.pendingCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">à confirmer / traiter</span>
          </div>
        </div>

        {/* Confirmées / Prêtes */}
        <div
          onClick={() => onNavigateTab('ACTIVES')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Confirmées</span>
            <span className="material-symbols-outlined text-blue-600 text-lg">check_circle</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-blue-600">{stats.confirmedCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">équipages prêts</span>
          </div>
        </div>

        {/* En cours de transport */}
        <div
          onClick={() => onNavigateTab('ACTIVES')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>En cours</span>
            <span className="material-symbols-outlined text-emerald-600 text-lg">near_me</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.inProgressCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">sur la route</span>
          </div>
        </div>

        {/* Terminées */}
        <div
          onClick={() => onNavigateTab('HISTORIQUE')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Terminées</span>
            <span className="material-symbols-outlined text-slate-600 text-lg">task_alt</span>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-800">{stats.completedCount}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">courses clôturées</span>
          </div>
        </div>
      </div>

      {/* 4. Statut des Ressources, Flotte & Répertoire (Points 8 & 9) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chauffeurs */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Équipages / Chauffeurs</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                <span className="text-teal-600">{availableDriversCount}</span> / {drivers.length} disponibles
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('FLOTTE')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Gérer
          </button>
        </div>

        {/* Flotte / Véhicules */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-2xl">local_taxi</span>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Véhicules Homologués</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                <span className="text-indigo-600">{availableVehiclesCount}</span> / {fleet.length} disponibles
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('FLOTTE')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Gérer
          </button>
        </div>

        {/* Répertoire Contacts */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-2xl">folder_shared</span>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Répertoire Patients</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                <span className="text-emerald-600">{uniquePatientsCount}</span> fiches
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('PATIENTS')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Consulter
          </button>
        </div>
      </div>

      {/* 5. Activité Récente (Point 11) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-700 text-xl">history</span>
            <h2 className="text-base font-extrabold text-slate-900">Activité Récente de l'Entreprise</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('ACTIVES')}
            className="text-xs font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1"
          >
            <span>Voir tout</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>

        {recentRides.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Aucune course enregistrée pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentRides.map((ride) => {
              const patientName = `${ride.patient?.firstName || ''} ${ride.patient?.lastName || ''}`.trim() || 'Patient';
              const pDate = ride.pickupDateTime ? new Date(ride.pickupDateTime).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }) : 'Date non définie';

              return (
                <div
                  key={ride.id}
                  onClick={() => onSelectRide(ride)}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 text-xs font-black">
                      {ride.transportType === 'AMBULANCE' ? 'AMB' : ride.transportType === 'VSL' ? 'VSL' : 'TAXI'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {patientName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {ride.pickupCity} → {ride.dropoffCity}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-medium text-slate-700">{pDate}</div>
                    <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 bg-slate-100 text-slate-700">
                      {ride.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
