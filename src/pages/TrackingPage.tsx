import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Phone, 
  ShieldCheck, 
  Car, 
  Ambulance, 
  Search, 
  CheckCircle2, 
  Calendar, 
  Download, 
  ArrowRight,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { rideService } from '../services/rideService';
import { Ride } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TransportBadge } from '../components/TransportBadge';

export const TrackingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const refQuery = searchParams.get('ref') || '';
  
  const [searchTerm, setSearchTerm] = useState(refQuery);
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rideService.getAllRides().then((rides) => {
      setAllRides(rides);
      if (refQuery) {
        const found = rides.find(r => r.reference.toUpperCase() === refQuery.toUpperCase());
        if (found) {
          setSelectedRide(found);
        } else if (rides.length > 0) {
          setSelectedRide(rides[0]);
        }
      } else if (rides.length > 0) {
        setSelectedRide(rides[0]);
      }
      setLoading(false);
    });
  }, [refQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const found = allRides.find(r => r.reference.toUpperCase().includes(searchTerm.trim().toUpperCase()));
    if (found) {
      setSelectedRide(found);
      setSearchParams({ ref: found.reference });
    } else {
      alert(`Aucun transport trouvé avec la référence "${searchTerm}".`);
    }
  };

  const selectRide = (ride: Ride) => {
    setSelectedRide(ride);
    setSearchTerm(ride.reference);
    setSearchParams({ ref: ride.reference });
  };

  return (
    <div className="bg-surface py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header & Recherche de référence */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-primary">
              Mes Demandes & Suivi en Direct
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Suivez l'avancée de votre véhicule sanitaire en temps réel sur les routes de Martinique.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="N° de dossier (ex: MT-972-8821)"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              Rechercher
            </button>
          </form>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-xs text-slate-500">Chargement des données de régulation...</p>
          </div>
        ) : selectedRide ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Colonne Gauche (7 cols) : Carte Interactive & Statut en Direct */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Carte Graphique Stylisée de la Martinique avec Géolocalisation */}
              <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl border border-slate-800">
                {/* Background Map Visual */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <svg viewBox="0 0 400 400" className="w-full h-full text-slate-600 fill-current">
                    <path d="M120,40 Q160,20 200,30 Q240,60 270,110 Q290,160 280,210 Q270,260 230,300 Q190,340 160,370 Q130,350 110,310 Q90,260 85,210 Q80,150 95,90 Z" />
                  </svg>
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Signal GPS Actif • Martinique
                      </span>
                    </div>

                    <StatusBadge status={selectedRide.status} size="sm" />
                  </div>

                  {/* ETA & Driver summary banner */}
                  <div className="p-4 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-secondary/20 text-secondary-container rounded-xl">
                        <Navigation className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 font-medium">Temps d'arrivée estimé</div>
                        <div className="text-xl font-black text-white">
                          {selectedRide.assignedTransporter?.etaMinutes 
                            ? `${selectedRide.assignedTransporter.etaMinutes} minutes` 
                            : 'En cours de calcul'}
                        </div>
                      </div>
                    </div>

                    {selectedRide.assignedTransporter && (
                      <div className="text-right sm:border-l sm:border-slate-700 sm:pl-4">
                        <div className="text-xs text-slate-400">Véhicule Sanitaire</div>
                        <div className="text-sm font-bold text-white font-mono">{selectedRide.assignedTransporter.vehiclePlate}</div>
                        <div className="text-[11px] text-secondary-container">{selectedRide.assignedTransporter.driverName}</div>
                      </div>
                    )}
                  </div>

                  {/* Visual Route Steps */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full bg-emerald-400 mt-0.5 shrink-0 ring-4 ring-emerald-400/20" />
                      <div>
                        <span className="text-xs font-bold text-slate-300">Point de Départ :</span>
                        <p className="text-sm font-bold text-white mt-0.5">{selectedRide.pickupAddress}</p>
                        <p className="text-xs text-slate-400">{selectedRide.pickupCity} (972)</p>
                      </div>
                    </div>

                    <div className="ml-2 pl-4 border-l-2 border-dashed border-slate-700 py-1 text-xs text-slate-400">
                      Itinéraire optimisé par régulation Médic'Trans 972
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full bg-primary mt-0.5 shrink-0 ring-4 ring-primary/40" />
                      <div>
                        <span className="text-xs font-bold text-slate-300">Destination Médicale :</span>
                        <p className="text-sm font-bold text-white mt-0.5">{selectedRide.dropoffAddress}</p>
                        <p className="text-xs text-slate-400">{selectedRide.dropoffCity} {selectedRide.facilityName && `• ${selectedRide.facilityName}`}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Contact Button */}
                  {selectedRide.assignedTransporter && (
                    <div className="pt-2">
                      <a
                        href={`tel:${selectedRide.assignedTransporter.driverPhone}`}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Contacter le chauffeur ({selectedRide.assignedTransporter.driverPhone})
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Stepper d'avancement de la mission */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Chronologie de Prise en Charge
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                    <div className="text-xs font-bold text-slate-900">Demande enregistrée & vérification PMT</div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(selectedRide.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • Référence {selectedRide.reference}
                    </div>
                  </div>

                  <div className="relative">
                    <span className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      selectedRide.status !== 'PENDING' ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      {selectedRide.status !== 'PENDING' ? '✓' : '2'}
                    </span>
                    <div className="text-xs font-bold text-slate-900">Transporteur conventionné assigné</div>
                    <div className="text-[11px] text-slate-500">
                      {selectedRide.assignedTransporter 
                        ? `${selectedRide.assignedTransporter.companyName} (${selectedRide.assignedTransporter.vehiclePlate})` 
                        : 'En attente d\'attribution'}
                    </div>
                  </div>

                  <div className="relative">
                    <span className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      ['EN_ROUTE', 'PICKED_UP', 'COMPLETED'].includes(selectedRide.status) ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      {['EN_ROUTE', 'PICKED_UP', 'COMPLETED'].includes(selectedRide.status) ? '✓' : '3'}
                    </span>
                    <div className="text-xs font-bold text-slate-900">Véhicule en approche du domicile</div>
                    <div className="text-[11px] text-slate-500">
                      {selectedRide.status === 'EN_ROUTE' ? 'Le chauffeur circule actuellement vers le patient' : 'Étape suivante'}
                    </div>
                  </div>

                  <div className="relative">
                    <span className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      ['PICKED_UP', 'COMPLETED'].includes(selectedRide.status) ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
                    }`}>
                      {['PICKED_UP', 'COMPLETED'].includes(selectedRide.status) ? '✓' : '4'}
                    </span>
                    <div className="text-xs font-bold text-slate-900">Patient à bord & trajet en cours</div>
                    <div className="text-[11px] text-slate-500">
                      {selectedRide.status === 'PICKED_UP' ? 'En route vers la structure médicale' : 'Non débuté'}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Colonne Droite (5 cols) : Fiche Dossier & Liste de mes courses */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Fiche Dossier Actuel */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dossier sélectionné</span>
                    <h3 className="font-mono font-bold text-base text-primary">{selectedRide.reference}</h3>
                  </div>
                  <TransportBadge type={selectedRide.transportType} />
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-500">Patient :</span>
                    <div className="font-bold text-slate-900">{selectedRide.patient.lastName} {selectedRide.patient.firstName}</div>
                  </div>

                  <div>
                    <span className="text-slate-500">Date et heure programmées :</span>
                    <div className="font-bold text-slate-900">
                      {new Date(selectedRide.pickupDateTime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {new Date(selectedRide.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500">Régime de Sécurité Sociale :</span>
                    <div className="font-bold text-emerald-700">
                      {selectedRide.patient.isAld ? 'Exonération ALD 100% (Tiers-payant intégral)' : 'Tiers-payant CPAM Martinique'}
                    </div>
                  </div>

                  {selectedRide.mobility.stairsWithoutElevator && (
                    <div className="p-2.5 bg-amber-50 rounded-lg text-amber-800 font-medium">
                      ⚠️ Portage requis : {selectedRide.mobility.floorNumber}e étage sans ascenseur
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    to={`/confirmation/${selectedRide.reference}`}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl text-center transition-colors"
                  >
                    Voir le Bon d'Admission
                  </Link>
                </div>
              </div>

              {/* Historique de tous les dossiers */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Tous mes dossiers ({allRides.length})
                  </h3>
                  <Link to="/reserver" className="text-xs font-bold text-primary hover:underline">
                    + Nouveau
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 space-y-1 max-h-80 overflow-y-auto pr-1">
                  {allRides.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => selectRide(r)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        selectedRide.id === r.id
                          ? 'bg-primary/5 border border-primary/20'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-xs text-slate-900">{r.reference}</span>
                        <StatusBadge status={r.status} size="sm" />
                      </div>
                      <div className="text-xs text-slate-600 font-medium truncate">
                        {r.pickupCity} → {r.dropoffCity}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
                        <span>{new Date(r.pickupDateTime).toLocaleDateString('fr-FR')}</span>
                        <span className="font-semibold text-slate-500">{r.transportType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
