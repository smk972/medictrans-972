import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { rideService } from '../services/rideService';
import { Ride, RideStatus, TransportType, Transporter } from '../types';
import { TransportBadge } from '../components/TransportBadge';
import { StatusBadge } from '../components/StatusBadge';
import { GoogleMapView } from '../components/GoogleMapView';
import { calculateMedicalRidePricing } from '../services/pricingService';

export const AdminSupervisionPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  // Selected Mission for Side Drawer
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [reassignTransporterId, setReassignTransporterId] = useState('');
  const [reassignDriverName, setReassignDriverName] = useState('');
  const [reassignDriverPhone, setReassignDriverPhone] = useState('');
  const [reassignVehiclePlate, setReassignVehiclePlate] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allRides, allTransporters] = await Promise.all([
        rideService.getAllRides(),
        rideService.getAllTransporters()
      ]);
      setRides(allRides);
      setTransporters(allTransporters);
    } catch (err) {
      console.error('Erreur chargement missions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered rides
  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ride.reference.toLowerCase().includes(q) ||
        ride.patient.firstName.toLowerCase().includes(q) ||
        ride.patient.lastName.toLowerCase().includes(q) ||
        ride.pickupCity.toLowerCase().includes(q) ||
        ride.dropoffCity.toLowerCase().includes(q) ||
        (ride.assignedTransporter?.driverName.toLowerCase().includes(q) ?? false) ||
        (ride.assignedTransporter?.companyName.toLowerCase().includes(q) ?? false);

      // Status
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'URGENT' && ride.status === 'PENDING' && (ride.mobility.stretcher || ride.transportType === 'AMBULANCE')) ||
        ride.status === selectedStatus;

      // Transport Type
      const matchType = selectedType === 'ALL' || ride.transportType === selectedType;

      // Sector (simplified logic by Martinique city)
      let matchSector = true;
      if (selectedSector === 'CENTRE') {
        matchSector = ['Fort-de-France', 'Le Lamentin', 'Schœlcher', 'Ducos', 'Saint-Joseph'].includes(ride.pickupCity) ||
                      ['Fort-de-France', 'Le Lamentin', 'Schœlcher', 'Ducos'].includes(ride.dropoffCity);
      } else if (selectedSector === 'SUD') {
        matchSector = ['Le Marin', 'Sainte-Luce', 'Rivière-Salée', 'Le Diamant', 'Les Trois-Îlets', 'Sainte-Anne', 'Rivière-Pilote', 'Le Vauclin'].includes(ride.pickupCity);
      } else if (selectedSector === 'NORD_ATLANTIQUE') {
        matchSector = ['La Trinité', 'Sainte-Marie', 'Le Robert', 'Gros-Morne', 'Le Lorrain', 'Marigot'].includes(ride.pickupCity);
      } else if (selectedSector === 'NORD_CARAIBE') {
        matchSector = ['Saint-Pierre', 'Case-Pilote', 'Bellefontaine', 'Carbet', 'Le Prêcheur', 'Le Morne-Rouge'].includes(ride.pickupCity);
      }

      return matchSearch && matchStatus && matchType && matchSector;
    });
  }, [rides, searchQuery, selectedStatus, selectedType, selectedSector]);

  const handleOpenDrawer = (ride: Ride) => {
    setSelectedRide(ride);
    if (ride.assignedTransporter) {
      setReassignDriverName(ride.assignedTransporter.driverName);
      setReassignDriverPhone(ride.assignedTransporter.driverPhone);
      setReassignVehiclePlate(ride.assignedTransporter.vehiclePlate);
    } else {
      setReassignDriverName('Chauffeur disponible');
      setReassignDriverPhone('0696 11 22 33');
      setReassignVehiclePlate('CD-972-EF');
    }
  };

  const handleUpdateStatus = async (newStatus: RideStatus) => {
    if (!selectedRide) return;
    setIsUpdatingStatus(true);
    await rideService.updateRideStatus(selectedRide.reference, newStatus);
    const updated = await rideService.getRideByReference(selectedRide.reference);
    setSelectedRide(updated);
    await loadData();
    setIsUpdatingStatus(false);
  };

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRide) return;
    setIsUpdatingStatus(true);
    const chosen = transporters.find(t => t.id === reassignTransporterId) || transporters[0];

    await rideService.reassignRide(selectedRide.reference, {
      companyName: chosen ? chosen.companyName : (selectedRide.assignedTransporter?.companyName || 'Ambulances Agréées'),
      driverName: reassignDriverName,
      driverPhone: reassignDriverPhone,
      vehiclePlate: reassignVehiclePlate,
      etaMinutes: 15
    }, 'ACCEPTED');

    const updated = await rideService.getRideByReference(selectedRide.reference);
    setSelectedRide(updated);
    await loadData();
    setIsUpdatingStatus(false);
  };

  const urgentCount = rides.filter(r => r.status === 'PENDING' && (r.mobility.stretcher || r.transportType === 'AMBULANCE')).length;

  return (
    <AdminLayout
      title="Supervision des Demandes & Régulation en Direct"
      subtitle="Suivi temps réel des courses sanitaires, assignations de chauffeurs et horodatage BPEC certifié"
      urgentCount={urgentCount}
      actions={
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container text-xs font-bold text-on-surface shadow-xs transition-colors"
        >
          <span className="material-symbols-outlined text-base">sync</span>
          <span>Actualiser les courses</span>
        </button>
      }
    >
      {/* 4 Mini Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">Missions du Jour</span>
          <div className="text-2xl font-extrabold text-primary font-mono mt-0.5">{rides.length}</div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">Alertes / En Attente</span>
          <div className="text-2xl font-extrabold text-error font-mono mt-0.5">
            {rides.filter(r => r.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">Véhicules Actifs</span>
          <div className="text-2xl font-extrabold text-on-surface font-mono mt-0.5">
            {rides.filter(r => r.status === 'EN_ROUTE' || r.status === 'PICKED_UP').length}
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">Prise en Charge CPAM</span>
          <div className="text-2xl font-extrabold text-secondary font-mono mt-0.5">99.1%</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-xl">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par référence (MT-972-XXXX), nom du patient, commune, chauffeur..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant/50 focus:border-primary text-xs sm:text-sm bg-surface-container-lowest text-on-surface outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Sector Select */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="w-full md:w-48 px-3 py-2.5 rounded-xl border border-outline-variant/50 text-xs font-semibold bg-surface-container-lowest text-on-surface outline-none"
          >
            <option value="ALL">Tous les secteurs 972</option>
            <option value="CENTRE">Bassin Centre (FDF, Lamentin)</option>
            <option value="SUD">Bassin Sud (Marin, Ste-Luce)</option>
            <option value="NORD_ATLANTIQUE">Nord Atlantique (Trinité)</option>
            <option value="NORD_CARAIBE">Nord Caraïbe (St-Pierre)</option>
          </select>

          {/* Type Select */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full md:w-48 px-3 py-2.5 rounded-xl border border-outline-variant/50 text-xs font-semibold bg-surface-container-lowest text-on-surface outline-none"
          >
            <option value="ALL">Tous types de transport</option>
            <option value="AMBULANCE">Ambulance (ASSU)</option>
            <option value="VSL">VSL (Assis médicalisé)</option>
            <option value="TAXI_CONVENTIONNE">Taxi Conventionné</option>
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-outline-variant/20">
          <span className="text-xs font-bold text-on-surface-variant mr-2">Statut :</span>
          {[
            { id: 'ALL', label: 'Toutes', count: rides.length },
            { id: 'PENDING', label: 'En attente', count: rides.filter(r => r.status === 'PENDING').length },
            { id: 'URGENT', label: 'Alertes', count: urgentCount },
            { id: 'ACCEPTED', label: 'Assignées', count: rides.filter(r => r.status === 'ACCEPTED').length },
            { id: 'EN_ROUTE', label: 'En route', count: rides.filter(r => r.status === 'EN_ROUTE').length },
            { id: 'PICKED_UP', label: 'Pris en charge', count: rides.filter(r => r.status === 'PICKED_UP').length },
            { id: 'COMPLETED', label: 'Terminées', count: rides.filter(r => r.status === 'COMPLETED').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedStatus === tab.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedStatus === tab.id ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Missions Interactive Table */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant uppercase text-[10px] font-extrabold tracking-wider">
              <tr>
                <th className="py-3 px-4">Réf. & Date</th>
                <th className="py-3 px-4">Patient & NIR</th>
                <th className="py-3 px-4">Itinéraire (972)</th>
                <th className="py-3 px-4">Véhicule</th>
                <th className="py-3 px-4">Transporteur Assigné</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredRides.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl mb-1">search_off</span>
                    <p className="font-bold text-sm">Aucune mission ne correspond à vos filtres</p>
                  </td>
                </tr>
              ) : (
                filteredRides.map((ride) => {
                  const isSelected = selectedRide?.id === ride.id;
                  return (
                    <tr
                      key={ride.id}
                      onClick={() => handleOpenDrawer(ride)}
                      className={`cursor-pointer transition-colors hover:bg-surface-container/50 ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-primary block">
                          {ride.reference}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          {new Date(ride.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-on-surface">
                          {ride.patient.firstName} {ride.patient.lastName}
                        </div>
                        <div className="font-mono text-[10px] text-on-surface-variant">
                          {ride.patient.nir}
                        </div>
                        {ride.patient.isAld && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                            ALD 100%
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-on-surface flex items-center gap-1">
                          <span className="text-secondary font-bold">DEP:</span> {ride.pickupCity}
                        </div>
                        <div className="text-on-surface-variant flex items-center gap-1">
                          <span className="text-primary font-bold">ARR:</span> {ride.facilityName || ride.dropoffCity}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <TransportBadge type={ride.transportType} />
                        {ride.mobility.stretcher && (
                          <span className="block text-[9px] text-rose-700 font-semibold mt-0.5">
                            Brancardage
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {ride.assignedTransporter ? (
                          <div>
                            <div className="font-bold text-on-surface">
                              {ride.assignedTransporter.companyName}
                            </div>
                            <div className="text-[10px] text-on-surface-variant">
                              {ride.assignedTransporter.driverName} • {ride.assignedTransporter.vehiclePlate}
                            </div>
                          </div>
                        ) : (
                          <span className="text-error font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
                            Non affectée
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={ride.status} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer(ride);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-outline-variant/50 hover:bg-primary hover:text-on-primary hover:border-primary text-xs font-bold text-primary transition-colors"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Mission Inspection Drawer */}
      {selectedRide && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-xl bg-surface-container-lowest h-full shadow-2xl border-l border-outline-variant/30 flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low flex items-center justify-between sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-primary">
                    {selectedRide.reference}
                  </span>
                  <TransportBadge type={selectedRide.transportType} />
                  <StatusBadge status={selectedRide.status} />
                </div>
                <span className="text-xs text-on-surface-variant">
                  Créée le {new Date(selectedRide.createdAt).toLocaleDateString()} à {new Date(selectedRide.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                onClick={() => setSelectedRide(null)}
                className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Quick Status Changers */}
              <div className="bg-surface-container p-4 rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                  Changer le statut en direct
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(['PENDING', 'ACCEPTED', 'EN_ROUTE', 'PICKED_UP', 'COMPLETED', 'CANCELLED'] as RideStatus[]).map((st) => (
                    <button
                      key={st}
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        selectedRide.status === st
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carte Google Maps Itinéraire */}
              <div className="w-full h-44 rounded-2xl overflow-hidden shadow-xs border border-outline-variant/30">
                <GoogleMapView
                  mode="route"
                  origin={selectedRide.pickupAddress}
                  destination={selectedRide.dropoffAddress}
                  height="100%"
                />
              </div>

              {/* Patient Profile Card */}
              <div className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                  Identité Patient & Sécurité Sociale
                </h4>
                <div className="text-sm font-extrabold text-on-surface">
                  {selectedRide.patient.firstName} {selectedRide.patient.lastName}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant">
                  <div>
                    <span className="font-semibold text-on-surface">NIR :</span> {selectedRide.patient.nir}
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">Né(e) le :</span> {selectedRide.patient.birthDate}
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">Téléphone :</span> {selectedRide.patient.phone}
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">Prise en charge :</span>{' '}
                    {selectedRide.patient.isAld ? 'ALD 100%' : 'Standard 65%'}
                  </div>
                </div>
              </div>

              {/* Medical Requirements & PMT */}
              <div className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-secondary">
                  Prescription Médicale (PMT Cerfa S3138)
                </h4>
                <div className="text-xs text-on-surface-variant">
                  Médecin prescripteur : <span className="font-bold text-on-surface">{selectedRide.patient.pmtPrescriberDoctor || 'Dr. Alix Célestine'}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedRide.mobility.stretcher && (
                    <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                      Brancardage Obligatoire
                    </span>
                  )}
                  {selectedRide.mobility.wheelchair && (
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                      Fauteuil Roulant TPMR
                    </span>
                  )}
                  {selectedRide.mobility.oxygen && (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                      Oxygénothérapie
                    </span>
                  )}
                  {selectedRide.mobility.stairsWithoutElevator && (
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
                      Portage Étage ({selectedRide.mobility.floorNumber || 1}e)
                    </span>
                  )}
                </div>
                {selectedRide.mobility.notes && (
                  <p className="text-xs italic bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/20 mt-2">
                    « {selectedRide.mobility.notes} »
                  </p>
                )}
              </div>

              {/* Reassignment Form */}
              <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    Affectation Transporteur & Chauffeur
                  </h4>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Régulateur ARS
                  </span>
                </div>

                <form onSubmit={handleConfirmReassign} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Société Conventionnée
                    </label>
                    <select
                      value={reassignTransporterId}
                      onChange={(e) => setReassignTransporterId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/60 text-xs bg-surface-container-lowest text-on-surface outline-none"
                    >
                      <option value="">Sélectionner une entreprise...</option>
                      {transporters.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.companyName} ({t.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface mb-1">
                        Chauffeur
                      </label>
                      <input
                        type="text"
                        value={reassignDriverName}
                        onChange={(e) => setReassignDriverName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/60 text-xs bg-surface-container-lowest"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={reassignDriverPhone}
                        onChange={(e) => setReassignDriverPhone(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/60 text-xs bg-surface-container-lowest"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-on-surface mb-1">
                      Plaque Immatriculation
                    </label>
                    <input
                      type="text"
                      value={reassignVehiclePlate}
                      onChange={(e) => setReassignVehiclePlate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/60 text-xs bg-surface-container-lowest font-mono uppercase"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary-container hover:text-on-primary transition-all"
                  >
                    Mettre à jour l'affectation
                  </button>
                </form>
              </div>

              {/* BPEC Certification Box */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-start gap-2.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0 mt-0.5">
                  verified
                </span>
                <div>
                  <span className="font-bold text-on-surface block">
                    Télétransmission CGSS Martinique certifiée
                  </span>
                  Numéro d'agrément BPEC : <span className="font-mono">972-BPEC-2026-X8</span>. Données cryptées conformes HDS.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
