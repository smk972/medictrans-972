import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { rideService } from '../services/rideService';
import { Ride, Transporter } from '../types';
import { TransportBadge } from '../components/TransportBadge';
import { StatusBadge } from '../components/StatusBadge';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [stats, setStats] = useState({
    totalActiveRides: 142,
    pendingCount: 4,
    enRouteCount: 68,
    completedTodayCount: 70,
    urgentAlertsCount: 3,
    avgAttributionMinutes: 4.25,
    totalFleetsCount: 38,
    fleetBreakdown: { ambulances: 18, vsl: 14, taxis: 6 },
    transportersCount: 5,
    verifiedTransportersCount: 4
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal d'attribution rapide
  const [assignModalRide, setAssignModalRide] = useState<Ride | null>(null);
  const [selectedTransporterId, setSelectedTransporterId] = useState('');
  const [driverName, setDriverName] = useState('Chauffeur d\'astreinte');
  const [driverPhone, setDriverPhone] = useState('0696 12 34 56');
  const [vehiclePlate, setVehiclePlate] = useState('AB-972-CD');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allRides, allTransporters, dashboardStats] = await Promise.all([
        rideService.getAllRides(),
        rideService.getAllTransporters(),
        rideService.getDashboardStats()
      ]);
      setRides(allRides);
      setTransporters(allTransporters);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Courses en attente d'arbitrage
  const pendingRides = rides.filter(r => r.status === 'PENDING');

  const handleOpenAssign = (ride: Ride) => {
    setAssignModalRide(ride);
    if (transporters.length > 0) {
      setSelectedTransporterId(transporters[0].id);
    }
  };

  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalRide) return;

    setIsSubmittingAssign(true);
    const chosenTransporter = transporters.find(t => t.id === selectedTransporterId) || transporters[0];

    await rideService.reassignRide(assignModalRide.reference, {
      companyName: chosenTransporter ? chosenTransporter.companyName : 'Ambulances Agréées 972',
      driverName,
      driverPhone,
      vehiclePlate,
      etaMinutes: 15
    }, 'ACCEPTED');

    setIsSubmittingAssign(false);
    setAssignModalRide(null);
    await loadData();
  };

  return (
    <AdminLayout
      title="Supervision & Régulation Active"
      subtitle="Tour de contrôle régionale des transports sanitaires terrestres de la Martinique (972)"
      urgentCount={stats.urgentAlertsCount}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors"
            title="Rafraîchir les flux"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
          <Link
            to="/admin/supervision"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-xs hover:bg-primary-container hover:text-on-primary transition-all"
          >
            <span className="material-symbols-outlined text-base">crisis_alert</span>
            <span>Console Supervision</span>
          </Link>
        </div>
      }
    >
      {/* 4 KPIs Top Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* KPI 1 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Demandes Actives 972</span>
            <span className="material-symbols-outlined text-primary text-xl">conversion_path</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-primary font-mono tracking-tight">
              {stats.totalActiveRides}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              +8.4% vs S-1
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2">
            {stats.pendingCount} en attente • {stats.enRouteCount} véhicules en rotation
          </p>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Délai Moyen d'Attribution</span>
            <span className="material-symbols-outlined text-secondary text-xl">timer</span>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              4
            </span>
            <span className="text-lg font-bold text-on-surface-variant">min</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight ml-1">
              15
            </span>
            <span className="text-lg font-bold text-on-surface-variant">s</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2">
            Objectif ARS &lt; 8 min (Conforme BPEC 972)
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Flottes Sanitaires Engagées</span>
            <span className="material-symbols-outlined text-secondary text-xl">local_shipping</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-secondary font-mono tracking-tight">
              {stats.totalFleetsCount}
            </span>
            <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">
              {stats.transportersCount} sociétés actives
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2">
            {stats.fleetBreakdown.ambulances} Ambulances • {stats.fleetBreakdown.vsl} VSL • {stats.fleetBreakdown.taxis} Taxis conv.
          </p>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Arbitrages Urgents</span>
            <span className="material-symbols-outlined text-error text-xl animate-bounce">warning</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-error font-mono tracking-tight">
              0{stats.urgentAlertsCount}
            </span>
            <span className="text-xs font-bold text-error bg-error/10 px-2 py-0.5 rounded-md">
              Action requise
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2">
            Urgences hospitalières & brancardages sans transporteur
          </p>
        </div>
      </div>

      {/* Main Grid: Priority Arbitrations + Territorial Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left 2 Cols: Arbitrages Prioritaires Immédiats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-on-surface">
                  Arbitrages Prioritaires Immédiats
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Demandes sanitaires en souffrance ou transferts critiques nécessitant une attribution régulateur
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-error/10 text-error text-xs font-extrabold">
                {pendingRides.length} en attente
              </span>
            </div>

            {pendingRides.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
                <p className="text-sm font-bold text-on-surface">Toutes les demandes sont régulées</p>
                <p className="text-xs">Aucune mission en souffrance sur le réseau 972 actuellement.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {pendingRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-4 rounded-2xl border border-outline-variant/40 hover:border-primary/50 bg-surface-container-lowest transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {ride.reference}
                        </span>
                        <TransportBadge type={ride.transportType} />
                        <StatusBadge status={ride.status} />
                        {ride.patient.isAld && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ALD 100%
                          </span>
                        )}
                        {ride.mobility.stretcher && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Brancardage
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-bold text-on-surface">
                        {ride.patient.firstName} {ride.patient.lastName}
                        <span className="text-xs font-normal text-on-surface-variant ml-2 font-mono">
                          {ride.patient.nir}
                        </span>
                      </div>

                      <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
                        <span>{ride.pickupCity} ({ride.pickupAddress})</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        <span>{ride.dropoffCity} ({ride.facilityName || ride.dropoffAddress})</span>
                      </div>

                      {ride.facilityDepartment && (
                        <div className="text-[11px] text-primary font-semibold">
                          Service déclencheur : {ride.facilityDepartment} (Lit {ride.bedDischargeNumber || 'Non spécifié'})
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenAssign(ride)}
                        className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container hover:text-on-primary transition-all active:scale-95 flex items-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-sm">how_to_reg</span>
                        <span>Attribuer</span>
                      </button>

                      <Link
                        to="/admin/supervision"
                        className="p-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant transition-colors"
                        title="Détails"
                      >
                        <span className="material-symbols-outlined text-base">visibility</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flux Horaires & Évolution */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">
                  Flux Horaires : Départs vs Retours Domicile
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Pic d'activité régulation observé : 07h30-09h00 et 14h00-16h30
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-primary font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Entrées Soins
                </span>
                <span className="flex items-center gap-1 text-secondary font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> Sorties Hôpital
                </span>
              </div>
            </div>

            {/* Simulated Chart Bars */}
            <div className="grid grid-cols-8 gap-2 pt-4 pb-2 items-end h-36 border-b border-outline-variant/20">
              {[
                { time: '06h', in: 12, out: 4 },
                { time: '08h', in: 38, out: 14 },
                { time: '10h', in: 28, out: 22 },
                { time: '12h', in: 16, out: 30 },
                { time: '14h', in: 24, out: 42 },
                { time: '16h', in: 18, out: 36 },
                { time: '18h', in: 8, out: 18 },
                { time: '20h', in: 5, out: 6 }
              ].map((slot, i) => (
                <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-28">
                    <div
                      style={{ height: `${(slot.in / 45) * 100}%` }}
                      className="w-3 bg-primary rounded-t-sm transition-all"
                      title={`${slot.in} entrées`}
                    ></div>
                    <div
                      style={{ height: `${(slot.out / 45) * 100}%` }}
                      className="w-3 bg-secondary rounded-t-sm transition-all"
                      title={`${slot.out} sorties`}
                    ></div>
                  </div>
                  <span className="text-[10px] font-mono text-on-surface-variant">{slot.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Disponibilité Géolocalisée & Journal Traces */}
        <div className="space-y-6">
          {/* Disponibilité Géolocalisée par Bassin */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-on-surface">
                Disponibilité Géolocalisée
              </h2>
              <span className="text-xs text-secondary font-bold">34 Communes 972</span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Bassin Centre', desc: 'Fort-de-France, Lamentin, Schœlcher, Ducos', fleets: 18, status: 'FLUIDE', color: 'text-emerald-700 bg-emerald-50' },
                { name: 'Bassin Sud', desc: 'Le Marin, Sainte-Luce, Rivière-Salée, Diamant', fleets: 9, status: 'FLUIDE', color: 'text-emerald-700 bg-emerald-50' },
                { name: 'Bassin Nord Atlantique', desc: 'La Trinité, Ste-Marie, Le Robert, Lorrain', fleets: 7, status: 'TENSION', color: 'text-amber-700 bg-amber-50' },
                { name: 'Bassin Nord Caraïbe', desc: 'Saint-Pierre, Case-Pilote, Morne-Rouge', fleets: 4, status: 'VIGILANCE', color: 'text-amber-700 bg-amber-50' }
              ].map((zone, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-on-surface">{zone.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${zone.color}`}>
                      {zone.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate mb-2">{zone.desc}</p>
                  <div className="flex items-center justify-between text-xs font-semibold text-primary">
                    <span>{zone.fleets} véhicules en veille</span>
                    <span className="text-[11px] text-on-surface-variant">ETA moy. 12 min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Journal des Arbitrages ARS / BPEC */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                Traces Régulation & Audit ARS
              </h3>
              <span className="material-symbols-outlined text-sm text-on-surface-variant">history</span>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              <div className="border-l-2 border-primary pl-2.5 py-0.5">
                <span className="text-outline text-[10px]">08:14:22</span>
                <p className="text-on-surface font-sans font-semibold">Course MT-972-8821 assignée</p>
                <p className="text-on-surface-variant text-[10px]">Ambulances Madinina Secours (J-L. Bernabé)</p>
              </div>

              <div className="border-l-2 border-emerald-500 pl-2.5 py-0.5">
                <span className="text-outline text-[10px]">08:02:11</span>
                <p className="text-on-surface font-sans font-semibold">Télétransmission CGSS certifiée</p>
                <p className="text-on-surface-variant text-[10px]">Accord préalable ALD 30 validé (100%)</p>
              </div>

              <div className="border-l-2 border-secondary pl-2.5 py-0.5">
                <span className="text-outline text-[10px]">07:49:05</span>
                <p className="text-on-surface font-sans font-semibold">Sortie Néphrologie CHU Zobda</p>
                <p className="text-on-surface-variant text-[10px]">Dossier MT-972-4912 transmis aux flottes</p>
              </div>

              <div className="border-l-2 border-amber-500 pl-2.5 py-0.5">
                <span className="text-outline text-[10px]">07:31:40</span>
                <p className="text-on-surface font-sans font-semibold">Alerte temps d'approche</p>
                <p className="text-on-surface-variant text-[10px]">Secteur Nord Caraïbe : renfort VSL suggéré</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Assignment Modal */}
      {assignModalRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-outline-variant/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  <span className="material-symbols-outlined text-base">how_to_reg</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Arbitrage Direct Régulation
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Dossier {assignModalRide.reference} • {assignModalRide.patient.firstName} {assignModalRide.patient.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalRide(null)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Société de Transport Sanitaire Conventionnée
                </label>
                <select
                  value={selectedTransporterId}
                  onChange={(e) => setSelectedTransporterId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/60 text-sm bg-surface-container-lowest text-on-surface outline-none focus:border-primary"
                >
                  {transporters.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.companyName} ({t.city} • {t.fleetAmbulances} Amb / {t.fleetVsl} VSL)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Nom du Chauffeur
                  </label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/60 text-sm bg-surface-container-lowest outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Téléphone Chauffeur
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/60 text-sm bg-surface-container-lowest outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Immatriculation Véhicule Sanitaire
                </label>
                <input
                  type="text"
                  required
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/60 text-sm bg-surface-container-lowest outline-none focus:border-primary font-mono uppercase"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalRide(null)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs font-bold text-on-surface-variant hover:bg-surface-container"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container hover:text-on-primary shadow-sm"
                >
                  {isSubmittingAssign ? 'Attribution...' : 'Confirmer l\'Attribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
