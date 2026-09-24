import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { rideService } from '../services/rideService';
import { Ride, RideStatus, TransportType, Transporter } from '../types';
import { TransportBadge } from '../components/TransportBadge';
import { StatusBadge } from '../components/StatusBadge';
import { GoogleMapView } from '../components/GoogleMapView';
import { calculateMedicalRidePricing } from '../services/pricingService';
import {
  SUPERVISION_TERRITORIES,
  SUPERVISION_SECTORS,
  getRideTerritory,
  getRideDepartmentBadge,
  matchRideSector
} from '../data/supervisionSectors';
import { TerritoryId } from '../data/nationalTerritoriesData';
import { Search, X } from 'lucide-react';
import { checkRideCompleteness } from '../utils/rideCompleteness';
import { extractTime, formatRideDateShort } from '../utils/dateUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';


interface ReportedIncident {
  text: string;
  raw: string;
}

const extractIncident = (notes?: string): ReportedIncident | null => {
  if (!notes) return null;
  const match = notes.match(/\[INCIDENT(?: CHAUFFEUR)?\]:\s*([^\n\r]+)/i);
  if (!match) return null;
  return {
    text: match[1].trim(),
    raw: match[0].trim()
  };
};

const hasActiveIncident = (ride: Ride): boolean => {
  return Boolean(extractIncident(ride.mobility?.notes));
};

const playAlertChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context not available or blocked
  }
};

export const AdminSupervisionPage: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters - National & DOM
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryId | 'ALL'>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Selected Mission for Side Drawer
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [reassignTransporterId, setReassignTransporterId] = useState('');
  const [reassignDriverName, setReassignDriverName] = useState('');
  const [reassignDriverPhone, setReassignDriverPhone] = useState('');
  const [reassignVehiclePlate, setReassignVehiclePlate] = useState('');
  const [isEditingNir, setIsEditingNir] = useState(false);
  const [editedNir, setEditedNir] = useState('');
  const [isSavingNir, setIsSavingNir] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

    // Supabase Realtime WebSocket listener for immediate alert propagation
    let channel: any = null;
    const sb = supabase;
    if (isSupabaseConfigured() && sb) {
      channel = sb
        .channel('supervision_rides_realtime_' + Date.now())
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rides' },
          (payload) => {
            console.log('📡 [Supervision] Événement temps réel Supabase reçu (Rides):', payload.eventType);
            loadData();
            if (payload.new && (payload.new as any).mobility_notes?.includes('[INCIDENT')) {
              playAlertChime();
            }
          }
        )
        .subscribe();
    }

    // BroadcastChannel inter-onglets local
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('clinigo_rides_channel');
      bc.onmessage = () => {
        loadData();
      };
    } catch {
      // BroadcastChannel ignore
    }

    return () => {
      if (channel && sb) {
        sb.removeChannel(channel);
      }
      if (bc) {
        bc.close();
      }
    };
  }, []);

  // Changement de territoire -> réinitialisation immédiate du sous-secteur
  const handleTerritoryChange = (territory: TerritoryId | 'ALL') => {
    setSelectedTerritory(territory);
    setSelectedSector('ALL');
  };

  // Filtered rides
  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      // Search (référence, patient, villes, département, établissement, chauffeur)
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ride.reference.toLowerCase().includes(q) ||
        ride.patient.firstName.toLowerCase().includes(q) ||
        ride.patient.lastName.toLowerCase().includes(q) ||
        ride.pickupCity.toLowerCase().includes(q) ||
        ride.dropoffCity.toLowerCase().includes(q) ||
        (ride.patient.postalCode?.toLowerCase().includes(q) ?? false) ||
        (ride.facilityName?.toLowerCase().includes(q) ?? false) ||
        (ride.assignedTransporter?.driverName.toLowerCase().includes(q) ?? false) ||
        (ride.assignedTransporter?.companyName.toLowerCase().includes(q) ?? false);

      // Status & Incident Matching
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'INCIDENT' && hasActiveIncident(ride)) ||
        (selectedStatus === 'URGENT' && ((ride.status === 'PENDING' && (ride.mobility.stretcher || ride.transportType === 'AMBULANCE')) || hasActiveIncident(ride))) ||
        ride.status === selectedStatus;

      // Transport Type
      const matchType = selectedType === 'ALL' || ride.transportType === selectedType;

      // Territory & Sector matching (National & DOM)
      const matchSector = matchRideSector(ride, selectedTerritory, selectedSector);

      return matchSearch && matchStatus && matchType && matchSector;
    });
  }, [rides, searchQuery, selectedStatus, selectedType, selectedTerritory, selectedSector]);

  const handleOpenDrawer = (ride: Ride) => {
    setSelectedRide(ride);
    setEditedNir(ride.patient.nir || '');
    setIsEditingNir(false);
    if (ride.assignedTransporter) {
      const matchedTransporter = transporters.find(t => t.companyName === ride.assignedTransporter?.companyName);
      setReassignTransporterId(matchedTransporter?.id || '');
      setReassignDriverName(ride.assignedTransporter.driverName);
      setReassignDriverPhone(ride.assignedTransporter.driverPhone);
      setReassignVehiclePlate(ride.assignedTransporter.vehiclePlate);
    } else {
      const terr = getRideTerritory(ride);
      const defaultPhone =
        terr === 'GUADELOUPE' ? '0690 11 22 33' :
        terr === 'GUYANE' ? '0694 11 22 33' :
        terr === 'REUNION' ? '0262 11 22 33' :
        terr === 'METROPOLE' ? '06 12 34 56 78' :
        '0696 11 22 33';

      const defaultPlate =
        terr === 'GUADELOUPE' ? 'CD-971-GP' :
        terr === 'GUYANE' ? 'CD-973-GF' :
        terr === 'REUNION' ? 'CD-974-RE' :
        terr === 'METROPOLE' ? 'CD-750-FR' :
        'CD-972-MQ';

      setReassignTransporterId('');
      setReassignDriverName('Chauffeur disponible');
      setReassignDriverPhone(defaultPhone);
      setReassignVehiclePlate(defaultPlate);
    }
  };

  const handleSaveNir = async () => {
    if (!selectedRide) return;
    setIsSavingNir(true);
    try {
      const updated = await rideService.updateRidePatient(selectedRide.reference, { nir: editedNir });
      setSelectedRide(updated);
      await loadData();
      setIsEditingNir(false);
    } catch (err: any) {
      alert(`Erreur mise à jour NIR : ${err?.message || err}`);
    } finally {
      setIsSavingNir(false);
    }
  };

  const handleDeleteRide = async (ride: Ride) => {
    if (!ride) return;
    const confirmDelete = window.confirm(
      `Attention Action Super Admin :\n\nConfirmez-vous la suppression DÉFINITIVE de la demande #${ride.reference} (${ride.patient.firstName} ${ride.patient.lastName}) ?\n\nCette action est irréversible et retirera complètement la course de la base de données.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await rideService.deleteRide(ride.reference);
      if (selectedRide?.reference === ride.reference) {
        setSelectedRide(null);
      }
      await loadData();
      alert(`La demande #${ride.reference} a été supprimée avec succès.`);
    } catch (err: any) {
      console.error('Erreur suppression course:', err);
      alert(`Erreur lors de la suppression : ${err?.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: RideStatus) => {
    if (!selectedRide) return;
    if (newStatus === 'ACCEPTED') {
      const completeness = checkRideCompleteness(selectedRide);
      if (!completeness.isComplete) {
        alert(`Action refusée : Cette demande ne peut pas être acceptée tant que les champs obligatoires ne sont pas entièrement remplis par le client :\n\n• ${completeness.missingLabels.join('\n• ')}`);
        return;
      }
    }

    let cancelReason: string | undefined = undefined;
    if (newStatus === 'CANCELLED') {
      const promptRes = window.prompt(
        `Veuillez indiquer le motif d'annulation (ce motif sera affiché au patient et mentionné dans l'email envoyé) :`,
        "Indisponibilité exceptionnelle de véhicule conventionné"
      );
      if (promptRes === null) {
        return; // L'administrateur a cliqué sur 'Annuler'
      }
      cancelReason = promptRes.trim() || "Annulation administrative";
    }

    setIsUpdatingStatus(true);
    try {
      await rideService.updateRideStatus(selectedRide.reference, newStatus, undefined, undefined, cancelReason);
      const updated = await rideService.getRideByReference(selectedRide.reference);
      setSelectedRide(updated);
      await loadData();
      if (newStatus === 'CANCELLED') {
        alert(`La course #${selectedRide.reference} a été annulée avec succès.\n\n• L'écran de suivi du patient a été actualisé en direct avec le motif d'annulation.\n• L'email de notification d'annulation a été envoyé au client.`);
      }
    } catch (err: any) {
      alert(`Erreur de mise à jour : ${err?.message || err}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRide) return;

    const completeness = checkRideCompleteness(selectedRide);
    if (!completeness.isComplete) {
      alert(`Action refusée : Cette demande ne peut pas être acceptée tant que les champs obligatoires ne sont pas entièrement remplis par le client :\n\n• ${completeness.missingLabels.join('\n• ')}`);
      return;
    }

    setIsUpdatingStatus(true);
    const chosen = transporters.find(t => t.id === reassignTransporterId) || transporters[0];

    try {
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
    } catch (err: any) {
      alert(`Erreur d'attribution : ${err?.message || err}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

    // Incidents actifs signalés depuis les terminaux chauffeurs
  const incidentRides = useMemo(() => {
    return rides.filter(hasActiveIncident);
  }, [rides]);

  const handleResolveIncident = async (ride: Ride) => {
    if (!ride) return;
    const confirmResolve = window.confirm(
      `Confirmez-vous la résolution de l'incident pour la course #${ride.reference} ?\n\nL'alerte sera retirée de la supervision et consignée dans le journal d'audit.`
    );
    if (!confirmResolve) return;

    setIsUpdatingStatus(true);
    try {
      const sb = supabase;
      let cleanedNotes = '';
      if (isSupabaseConfigured() && sb) {
        const { data: currentRows } = await sb
          .from('rides')
          .select('mobility_notes')
          .eq('reference', ride.reference)
          .limit(1);

        const rawNotes = (currentRows && currentRows[0]?.mobility_notes) || ride.mobility?.notes || '';
        cleanedNotes = rawNotes.replace(/\[INCIDENT(?: CHAUFFEUR)?\]:[^\n\r]+(\r?\n)?/gi, '').trim();

        const { error: updateError } = await sb
          .from('rides')
          .update({
            mobility_notes: cleanedNotes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('reference', ride.reference);

        if (updateError) throw updateError;

        try {
          await sb.from('ride_events').insert({
            ride_id: ride.id,
            actor_role: 'ADMIN',
            event_type: 'SUPERVISOR_RESOLVED_INCIDENT',
            notes: `Incident résolu par la supervision. Notes restantes: ${cleanedNotes || 'Aucune'}`,
          });
        } catch (evErr) {
          console.warn('ride_events log error:', evErr);
        }
      }

      if (selectedRide?.reference === ride.reference) {
        setSelectedRide({
          ...selectedRide,
          mobility: {
            ...selectedRide.mobility,
            notes: cleanedNotes || undefined,
          },
        });
      }

      await loadData();
      alert(`Incident de la course #${ride.reference} résolu avec succès.`);
    } catch (err: any) {
      alert(`Erreur lors de la clôture : ${err?.message || err}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const urgentCount = rides.filter(r => (r.status === 'PENDING' && (r.mobility.stretcher || r.transportType === 'AMBULANCE')) || hasActiveIncident(r)).length;

  return (
    <AdminLayout
      title="Supervision des Demandes & Régulation en Direct"
      subtitle="Suivi temps réel des courses sanitaires, assignations de chauffeurs et horodatage BPEC certifié • Couverture Nationale & DOM"
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
      {/* Bannière Flash Alerte Incident Chauffeur Mobile */}
      {incidentRides.length > 0 && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white p-4 sm:p-5 shadow-lg border-2 border-rose-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner border border-white/30">
                <span className="material-symbols-outlined text-3xl text-white animate-bounce">warning</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs uppercase tracking-wider bg-white/30 px-3 py-0.5 rounded-full text-white border border-white/40">
                    🚨 {incidentRides.length} {incidentRides.length > 1 ? 'INCIDENTS TERRAIN SIGNALÉS' : 'INCIDENT TERRAIN SIGNALÉ'}
                  </span>
                  <span className="text-xs text-rose-100 font-medium">
                    Signalé en direct par l'équipage mobile • Action supervision requise
                  </span>
                </div>
                <div className="text-sm font-extrabold mt-1 text-white">
                  Course <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded underline">#{incidentRides[0].reference}</span> : « {extractIncident(incidentRides[0].mobility?.notes)?.text} »
                  {incidentRides[0].assignedTransporter?.driverName && (
                    <span className="text-rose-100 font-normal ml-2">
                      (Chauffeur : <strong className="text-white">{incidentRides[0].assignedTransporter.driverName}</strong>)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus('INCIDENT');
                  handleOpenDrawer(incidentRides[0]);
                }}
                className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-white text-rose-700 font-black text-xs shadow-md hover:bg-rose-50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-base">crisis_alert</span>
                <span>Ouvrir la mission & Agir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Mini Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">Missions (Filtre actif)</span>
          <div className="text-2xl font-extrabold text-primary font-mono mt-0.5">
            {filteredRides.length} <span className="text-xs font-normal text-on-surface-variant">/ {rides.length} tot.</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">Alertes / En Attente</span>
          <div className="text-2xl font-extrabold text-error font-mono mt-0.5">
            {filteredRides.filter(r => r.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">Véhicules Actifs</span>
          <div className="text-2xl font-extrabold text-on-surface font-mono mt-0.5">
            {filteredRides.filter(r => r.status === 'EN_ROUTE' || r.status === 'PICKED_UP').length}
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">Prise en Charge CPAM / CGSS</span>
          <div className="text-2xl font-extrabold text-secondary font-mono mt-0.5">99.2%</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs mb-6 space-y-3.5">
        {/* Quick Territory Selector Tabs (National & DOM) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">public</span>
              Territoire Régulé (National & DOM) :
            </span>
            <span className="text-[11px] font-semibold text-primary">
              {SUPERVISION_TERRITORIES.find(t => t.id === selectedTerritory)?.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {SUPERVISION_TERRITORIES.map((terr) => {
              const countInTerr = terr.id === 'ALL'
                ? rides.length
                : rides.filter(r => getRideTerritory(r) === terr.id).length;
              const isSelected = selectedTerritory === terr.id;

              return (
                <button
                  key={terr.id}
                  onClick={() => handleTerritoryChange(terr.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-container/60 text-on-surface-variant border-transparent hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span>{terr.flag}</span>
                  <span>{terr.shortLabel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-on-primary/20 text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {countInTerr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Search, Sector Select, and Type Select */}
        <div className="flex flex-col md:flex-row items-center gap-3 pt-2 border-t border-outline-variant/20">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-on-surface-variant pointer-events-none select-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par référence, patient, commune, dép. (971, 972, 973, 974, 75, 69...)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-outline-variant/50 focus:border-primary text-xs sm:text-sm bg-surface-container-lowest text-on-surface outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sector / Health Basin Select (Dynamic based on selectedTerritory) */}
          <div className="w-full md:w-72">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/50 text-xs font-semibold bg-surface-container-lowest text-on-surface outline-none truncate"
              title="Filtrer par secteur / bassin sanitaire"
            >
              {SUPERVISION_SECTORS[selectedTerritory]?.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

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
            { id: 'ALL', label: 'Toutes', count: filteredRides.length },
            { id: 'INCIDENT', label: '🚨 Incidents', count: incidentRides.length },
            { id: 'PENDING', label: 'En attente', count: filteredRides.filter(r => r.status === 'PENDING').length },
            { id: 'URGENT', label: 'Alertes Brancardage', count: filteredRides.filter(r => r.status === 'PENDING' && (r.mobility.stretcher || r.transportType === 'AMBULANCE')).length },
            { id: 'ACCEPTED', label: 'Assignées', count: filteredRides.filter(r => r.status === 'ACCEPTED').length },
            { id: 'EN_ROUTE', label: 'En route', count: filteredRides.filter(r => r.status === 'EN_ROUTE').length },
            { id: 'PICKED_UP', label: 'Pris en charge', count: filteredRides.filter(r => r.status === 'PICKED_UP').length },
            { id: 'COMPLETED', label: 'Terminées', count: filteredRides.filter(r => r.status === 'COMPLETED').length }
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
                <th className="py-3 px-4">Itinéraire & Secteur</th>
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
                    <p className="text-xs text-on-surface-variant mt-1">
                      Essayez de réinitialiser le secteur ou de sélectionner "Tous les territoires".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRides.map((ride) => {
                  const isSelected = selectedRide?.id === ride.id;
                  const depBadge = getRideDepartmentBadge(ride);

                  return (
                    <tr
                      key={ride.id}
                      onClick={() => handleOpenDrawer(ride)}
                      className={`cursor-pointer transition-colors ${
                        hasActiveIncident(ride)
                          ? 'bg-rose-50/80 border-l-4 border-l-rose-600 hover:bg-rose-100/70'
                          : isSelected
                          ? 'bg-primary/5 hover:bg-surface-container/50'
                          : 'hover:bg-surface-container/50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-primary block">
                          {ride.reference}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {formatRideDateShort(ride.pickupDateTime)} • {ride.appointmentTime || extractTime(ride.pickupDateTime)}
                        </span>
                        {extractIncident(ride.mobility?.notes) && (
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[10px] shadow-xs">
                            <span className="material-symbols-outlined text-xs">emergency</span>
                            <span className="truncate max-w-[170px]">{extractIncident(ride.mobility?.notes)?.text}</span>
                          </div>
                        )}
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
                        <div className="mt-1">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${depBadge.bgClass} ${depBadge.textClass}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
                            {depBadge.code} • {depBadge.label}
                          </span>
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(ride);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-outline-variant/50 hover:bg-primary hover:text-on-primary hover:border-primary text-xs font-bold text-primary transition-colors cursor-pointer"
                          >
                            Détails
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRide(ride);
                            }}
                            title="Supprimer définitivement la demande (Super Admin)"
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
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
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDeleteRide(selectedRide)}
                  title="Supprimer définitivement cette mission (Super Admin)"
                  className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-100/70 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
                <button
                  onClick={() => setSelectedRide(null)}
                  className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Incident Alert Deck if reported by driver */}
              {extractIncident(selectedRide.mobility?.notes) && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-500 shadow-md space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-rose-600 text-2xl animate-pulse">
                        emergency
                      </span>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-900">
                          🚨 Incident Signalé par l'Ambulancier
                        </h4>
                        <span className="text-[10px] text-rose-600 font-semibold">
                          Intervention & arbitrage supervision requis
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                      Action requise
                    </span>
                  </div>

                  {/* Problem statement */}
                  <div className="p-3 bg-white rounded-xl border border-rose-200 shadow-xs">
                    <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-0.5">
                      Message transmis depuis le mobile :
                    </div>
                    <div className="text-xs font-extrabold text-rose-950">
                      « {extractIncident(selectedRide.mobility?.notes)?.text} »
                    </div>
                  </div>

                  {/* Action buttons for Supervisor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {selectedRide.assignedTransporter?.driverPhone ? (
                      <a
                        href={`tel:${selectedRide.assignedTransporter.driverPhone.replace(/\s+/g, '')}`}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 text-xs font-bold transition-all shadow-xs"
                      >
                        <span className="material-symbols-outlined text-base text-rose-600">call</span>
                        <span>Appeler {selectedRide.assignedTransporter.driverName || 'Chauffeur'}</span>
                      </a>
                    ) : (
                      <div className="p-2 text-center text-xs text-rose-600 bg-white/70 rounded-xl">
                        Numéro chauffeur non disponible
                      </div>
                    )}

                    {selectedRide.facilityContactPhone || selectedRide.patient.phone ? (
                      <a
                        href={`tel:${(selectedRide.facilityContactPhone || selectedRide.patient.phone).replace(/\s+/g, '')}`}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-bold transition-all shadow-xs"
                      >
                        <span className="material-symbols-outlined text-base text-slate-600">local_hospital</span>
                        <span>Appeler Service / Patient</span>
                      </a>
                    ) : null}
                  </div>

                  {/* Bouton de résolution / clôture */}
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleResolveIncident(selectedRide)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>{isUpdatingStatus ? 'Mise à jour en cours...' : 'Clôturer & Marquer l\'incident résolu'}</span>
                  </button>
                </div>
              )}

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
                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-on-surface">NIR :</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedNir(selectedRide.patient.nir || '');
                          setIsEditingNir(!isEditingNir);
                        }}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                      >
                        {isEditingNir ? 'Annuler' : selectedRide.patient.nir ? 'Modifier' : 'Régulariser le NIR'}
                      </button>
                    </div>
                    {isEditingNir ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editedNir}
                          onChange={(e) => setEditedNir(e.target.value)}
                          placeholder="1 XX XX XX XXX XXX XX"
                          className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                        <button
                          type="button"
                          disabled={isSavingNir || !editedNir.trim()}
                          onClick={handleSaveNir}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-800 hover:bg-teal-700 text-white transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isSavingNir ? '...' : 'Valider'}
                        </button>
                      </div>
                    ) : selectedRide.patient.nir ? (
                      <span className="font-mono font-bold text-slate-800">{selectedRide.patient.nir}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-bold border border-rose-200 text-[11px] mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">warning</span>
                        Non renseigné (Bloque l'acceptation)
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">Né(e) le :</span> {selectedRide.patient.birthDate}
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">Téléphone :</span> {selectedRide.patient.phone}
                  </div>
                  <div className="col-span-2">
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

              {/* Fiche Logistique d'Accès & Coordination Terrain */}
              <div className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">meeting_room</span>
                    <span>Accès Soins & Logistique Chambre / Étage</span>
                  </h4>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    Terrain Mobile
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Service / Département</span>
                    <span className="font-extrabold text-on-surface">
                      {selectedRide.facilityDepartment || selectedRide.facilityName || 'Service Non Spécifié'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Chambre & Lit</span>
                    <span className="font-extrabold text-on-surface font-mono">
                      {selectedRide.facilityRoom ? `Chambre ${selectedRide.facilityRoom}` : selectedRide.bedDischargeNumber ? `Ch. ${selectedRide.bedDischargeNumber}` : 'Chambre 218 • Lit A'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Étage & Ascenseur</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-on-surface">
                        {selectedRide.facilityFloor || selectedRide.mobility?.floorNumber ? `${selectedRide.facilityFloor || selectedRide.mobility?.floorNumber}ème étage` : '2ème étage'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                        Ascenseur OK
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Contact Direct Soignants</span>
                    <span className="font-bold text-teal-700 font-mono">
                      {selectedRide.facilityContactPhone || '0596 55 20 00 (Poste 412)'}
                    </span>
                  </div>
                </div>

                {/* Instructions complètes d'accès */}
                {selectedRide.mobility?.notes && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block mb-0.5">Consignes d'accès transmises :</span>
                    <p className="text-xs font-mono text-slate-800">
                      {selectedRide.mobility.notes}
                    </p>
                  </div>
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
                    Télétransmission CPAM & CGSS (National & DOM) certifiée
                  </span>
                  Numéro d'agrément BPEC / Sécurité Sociale : <span className="font-mono">BPEC-FR-2026-X8</span>. Données de santé chiffrées conformes HDS & RGPD.
                </div>
              </div>

              {/* Super Admin Privileged Deletion Card */}
              <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-800 font-extrabold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base text-rose-700">shield_person</span>
                    <span>Privilèges Super Admin</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-200/70 px-2 py-0.5 rounded-full">
                    Contrôle Total
                  </span>
                </div>
                <p className="text-xs text-rose-800/80 leading-relaxed">
                  En tant que Super Administrateur, vous pouvez supprimer définitivement cette demande du système. La course <strong className="font-mono text-rose-950 font-bold">#{selectedRide.reference}</strong> sera totalement effacée de la base de données.
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDeleteRide(selectedRide)}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">delete_forever</span>
                    <span>{isDeleting ? 'Suppression en cours...' : 'Supprimer définitivement la demande'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
