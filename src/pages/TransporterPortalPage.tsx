import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Car, 
  Ambulance, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  User, 
  ShieldCheck, 
  Check, 
  Filter 
} from 'lucide-react';
import { rideService } from '../services/rideService';
import { Ride, TransportType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TransportBadge } from '../components/TransportBadge';

export const TransporterPortalPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Mon entreprise connectée
  const myCompany = {
    name: 'Ambulances Madinina Secours',
    siret: '481 294 029 00018',
    arsLicense: '972-AMB-2021-04',
    cpamConvention: '972-CPAM-881',
    driverName: 'Jean-Luc Bernabé',
    driverPhone: '0696 88 44 22',
    vehiclePlate: 'GH-972-LM'
  };

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    setLoading(true);
    const data = await rideService.getAllRides();
    setRides(data);
    setLoading(false);
  };

  const handleAcceptRide = async (ride: Ride) => {
    await rideService.updateRideStatus(ride.reference, 'ACCEPTED', {
      companyName: myCompany.name,
      driverName: myCompany.driverName,
      driverPhone: myCompany.driverPhone,
      vehiclePlate: myCompany.vehiclePlate,
      etaMinutes: 15
    });
    await loadRides();
  };

  const handleUpdateStatus = async (ride: Ride, newStatus: Ride['status']) => {
    await rideService.updateRideStatus(ride.reference, newStatus);
    await loadRides();
  };

  const pendingMissions = rides.filter(r => r.status === 'PENDING');
  const myActiveMissions = rides.filter(r => 
    r.assignedTransporter?.companyName === myCompany.name || r.status !== 'PENDING'
  );

  const filteredPending = pendingMissions.filter(r => {
    if (filterType === 'ALL') return true;
    return r.transportType === filterType;
  });

  return (
    <div className="bg-surface py-8 space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Entreprise de Transport */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary text-white flex items-center justify-center shrink-0">
              <Truck className="w-7 h-7 text-secondary-container" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold mb-1">
                Espace Transporteur Régulé
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {myCompany.name}
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                Agrément ARS {myCompany.arsLicense} • Convention CPAM {myCompany.cpamConvention}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs hidden sm:block">
              <div className="text-slate-400">Véhicule de service actif</div>
              <div className="font-bold text-slate-900 font-mono">{myCompany.vehiclePlate} ({myCompany.driverName})</div>
            </div>
            <div className="h-10 w-2.5 bg-emerald-500 rounded-full" title="Régulation Connectée" />
          </div>
        </div>

        {/* Section 1 : Courses Disponibles Immédiatement */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Missions Disponibles sur le Territoire</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                  {pendingMissions.length} en attente
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Demandes de patients et sorties de lit hospitalières à pourvoir en Martinique
              </p>
            </div>

            {/* Filter by vehicle type */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="ALL">Tous les modes</option>
                <option value="VSL">VSL uniquement</option>
                <option value="AMBULANCE">Ambulance uniquement</option>
                <option value="TAXI_CONVENTIONNE">Taxi CPAM uniquement</option>
              </select>
            </div>
          </div>

          {filteredPending.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aucune course en attente pour le moment dans cette catégorie.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPending.map((ride) => (
                <div 
                  key={ride.id} 
                  className="p-5 rounded-2xl border border-slate-200 hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-primary">{ride.reference}</span>
                      <TransportBadge type={ride.transportType} />
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {ride.patient.lastName} {ride.patient.firstName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Prise en charge à : <strong className="text-slate-700">{new Date(ride.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong> (le {new Date(ride.pickupDateTime).toLocaleDateString('fr-FR')})
                      </div>
                    </div>

                    {/* Trajet */}
                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold truncate">{ride.pickupCity} ({ride.pickupAddress})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        <span className="font-semibold truncate">{ride.dropoffCity} {ride.facilityName && `(${ride.facilityName})`}</span>
                      </div>
                    </div>

                    {/* Contraintes */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {ride.mobility.stretcher && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold">🛏️ Brancard</span>
                      )}
                      {ride.mobility.oxygen && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-bold">💨 Oxygène</span>
                      )}
                      {ride.mobility.stairsWithoutElevator && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">
                          🪜 Portage ({ride.mobility.floorNumber}e étage)
                        </span>
                      )}
                      {ride.source === 'FACILITY' && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-bold">🏥 Sortie Hôpital</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700">
                      Tiers-payant 100% garanti
                    </span>
                    <button
                      onClick={() => handleAcceptRide(ride)}
                      className="px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accepter la mission
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2 : Mes Missions Assignées / En Cours */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Missions Actives & Historique</h2>
              <p className="text-xs text-slate-500">Gérez l'avancement et le statut en temps réel de vos chauffeurs</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {myActiveMissions.map((ride) => (
              <div key={ride.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary">{ride.reference}</span>
                    <StatusBadge status={ride.status} size="sm" />
                    <TransportBadge type={ride.transportType} />
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {ride.patient.lastName} {ride.patient.firstName} • {ride.patient.phone}
                  </div>
                  <div className="text-xs text-slate-600">
                    {ride.pickupCity} → {ride.dropoffCity} ({ride.facilityName || 'Destination'})
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {ride.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleUpdateStatus(ride, 'EN_ROUTE')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Démarrer trajet (En route)
                    </button>
                  )}

                  {ride.status === 'EN_ROUTE' && (
                    <button
                      onClick={() => handleUpdateStatus(ride, 'PICKED_UP')}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Patient à bord
                    </button>
                  )}

                  {ride.status === 'PICKED_UP' && (
                    <button
                      onClick={() => handleUpdateStatus(ride, 'COMPLETED')}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Clôturer transport
                    </button>
                  )}

                  {ride.status === 'COMPLETED' && (
                    <span className="text-xs font-bold text-slate-500">
                      ✓ Télétransmis CPAM
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
