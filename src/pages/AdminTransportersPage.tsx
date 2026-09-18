import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { adminService } from '../services/adminService';
import { Transporter, TransporterVehicle, TransporterDriver, TransportType } from '../types';
import { MARTINIQUE_COMMUNES } from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';

export const AdminTransportersPage: React.FC = () => {
  const { user } = useAuth();
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [selectedTransporter, setSelectedTransporter] = useState<Transporter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Active Tab in Transporter Detail Sheet
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'FLEET' | 'DRIVERS' | 'COMPLIANCE'>('OVERVIEW');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialDaysInput, setTrialDaysInput] = useState(30);

  // Vehicle Modals State
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TransporterVehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<{
    id: string;
    name: string;
    type: TransportType;
    plate: string;
    driver: string;
    phone: string;
    status: 'DISPONIBLE' | 'EN_MISSION' | 'EN_PAUSE' | 'MAINTENANCE';
  }>({
    id: '',
    name: '',
    type: 'AMBULANCE',
    plate: '',
    driver: '',
    phone: '',
    status: 'DISPONIBLE'
  });
  const [showDeleteVehicleModal, setShowDeleteVehicleModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<TransporterVehicle | null>(null);

  // Driver Modals State
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<TransporterDriver | null>(null);
  const [driverForm, setDriverForm] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    phone: string;
    email: string;
    status: 'DISPONIBLE' | 'EN_MISSION' | 'EN_REPOS';
    assignedVehiclePlate: string;
  }>({
    id: '',
    firstName: '',
    lastName: '',
    role: 'Ambulancier DEA Diplômé',
    phone: '',
    email: '',
    status: 'DISPONIBLE',
    assignedVehiclePlate: ''
  });
  const [showDeleteDriverModal, setShowDeleteDriverModal] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<TransporterDriver | null>(null);

  // Create Form State
  const [newTransporter, setNewTransporter] = useState({
    companyName: '',
    siret: '',
    arsLicense: '',
    cpamConventionNumber: '',
    address: '',
    city: 'Fort-de-France',
    postalCode: '97200',
    phone: '',
    email: '',
    fleetAmbulances: 2,
    fleetVsl: 2,
    fleetTaxis: 1,
    zone: 'Ensemble du territoire martiniquais (34 communes)',
    verified: true,
    initialPassword: `AMB972-${Math.random().toString(36).slice(-5).toUpperCase()}!`
  });

  // Edit Form State
  const [editForm, setEditForm] = useState<Transporter | null>(null);

  // Password Reset State
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllTransporters();
      setTransporters(data);
      if (data.length > 0 && !selectedTransporter) {
        setSelectedTransporter(data[0]);
      } else if (selectedTransporter) {
        const refreshed = data.find((t: Transporter) => t.id === selectedTransporter.id);
        if (refreshed) setSelectedTransporter(refreshed);
        else if (data.length > 0) setSelectedTransporter(data[0]);
      }
    } catch (err) {
      console.error('Erreur chargement transporteurs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransporters = transporters.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      t.companyName.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.siret.includes(q) ||
      t.arsLicense.toLowerCase().includes(q);

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VERIFIED' && t.verified) ||
      (statusFilter === 'PENDING' && !t.verified);

    return matchSearch && matchStatus;
  });

  const handleToggleVerification = async (transporter: Transporter) => {
    try {
      const updated = await adminService.toggleTransporterVerification(transporter.id);
      setActionFeedback(
        updated.verified
          ? `Agrément ARS validé et actif pour ${transporter.companyName}.`
          : `Agrément suspendu pour ${transporter.companyName}.`
      );
      await loadData();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

  const handleOpenCreate = () => {
    setNewTransporter({
      companyName: '',
      siret: '',
      arsLicense: `ARS-972-${Math.floor(1000 + Math.random() * 9000)}`,
      cpamConventionNumber: `CPAM-972-${Math.floor(10000 + Math.random() * 90000)}`,
      address: '',
      city: 'Fort-de-France',
      postalCode: '97200',
      phone: '0596 ',
      email: '',
      fleetAmbulances: 2,
      fleetVsl: 2,
      fleetTaxis: 1,
      zone: 'Ensemble du territoire martiniquais (34 communes)',
      verified: true,
      initialPassword: `AMB972-${Math.random().toString(36).slice(-5).toUpperCase()}!`
    });
    setShowCreateModal(true);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransporter.companyName.trim()) {
      alert('Veuillez saisir la raison sociale de la société.');
      return;
    }
    try {
      const created = await adminService.createTransporter({
        companyName: newTransporter.companyName.trim(),
        siret: newTransporter.siret.trim() || `${Math.floor(100000000 + Math.random() * 900000000)}00018`,
        arsLicense: newTransporter.arsLicense.trim(),
        cpamConventionNumber: newTransporter.cpamConventionNumber.trim(),
        address: newTransporter.address.trim() || 'Martinique',
        city: newTransporter.city,
        postalCode: newTransporter.postalCode,
        phone: newTransporter.phone.trim() || '0596 00 00 00',
        email: newTransporter.email.trim() || `dispatch@${newTransporter.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.mq`,
        fleetAmbulances: Number(newTransporter.fleetAmbulances) || 0,
        fleetVsl: Number(newTransporter.fleetVsl) || 0,
        fleetTaxis: Number(newTransporter.fleetTaxis) || 0,
        verified: newTransporter.verified,
        zone: newTransporter.zone,
        complianceRate: 99,
        avgApproachMinutes: 14
      });

      setShowCreateModal(false);
      setActionFeedback(`Société ${created.companyName} ajoutée avec succès.`);
      await loadData();
      setSelectedTransporter(created);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création du transporteur');
    }
  };

  const handleOpenEdit = () => {
    if (!selectedTransporter) return;
    setEditForm({ ...selectedTransporter });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try {
      const updated = await adminService.updateTransporter(editForm.id, {
        companyName: editForm.companyName,
        siret: editForm.siret,
        arsLicense: editForm.arsLicense,
        cpamConventionNumber: editForm.cpamConventionNumber,
        address: editForm.address,
        city: editForm.city,
        postalCode: editForm.postalCode,
        phone: editForm.phone,
        email: editForm.email,
        status: editForm.status || 'ACTIVE',
        verified: editForm.verified ?? true,
        avgApproachMinutes: Number(editForm.avgApproachMinutes) || 12,
        complianceRate: Number(editForm.complianceRate) || 98.5,
        fleetAmbulances: Number(editForm.fleetAmbulances) || 0,
        fleetVsl: Number(editForm.fleetVsl) || 0,
        fleetTaxis: Number(editForm.fleetTaxis) || 0,
        zone: editForm.zone
      });

      setShowEditModal(false);
      setActionFeedback(`Fiche complète de ${updated.companyName} mise à jour avec succès.`);
      await loadData();
      setSelectedTransporter(updated);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la modification');
    }
  };

  // --- GESTION DE LA FLOTTE ---
  const handleOpenAddVehicle = () => {
    if (!selectedTransporter) return;
    const defaultPlate = `AB-${(selectedTransporter.postalCode || '972').slice(0, 2)}-${Math.floor(100 + Math.random() * 900)}`;
    setEditingVehicle(null);
    setVehicleForm({
      id: `${selectedTransporter.id}-vh-${Date.now()}`,
      name: '',
      type: 'AMBULANCE',
      plate: defaultPlate,
      driver: '',
      phone: selectedTransporter.phone || '',
      status: 'DISPONIBLE'
    });
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (vehicle: TransporterVehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      id: vehicle.id,
      name: vehicle.name,
      type: vehicle.type,
      plate: vehicle.plate,
      driver: vehicle.driver || '',
      phone: vehicle.phone || '',
      status: vehicle.status
    });
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransporter) return;

    try {
      const currentVehicles = [...(selectedTransporter.vehicles || [])];
      let updatedVehicles: TransporterVehicle[];

      if (editingVehicle) {
        updatedVehicles = currentVehicles.map(v => v.id === editingVehicle.id ? { ...vehicleForm } : v);
      } else {
        const newVehicle: TransporterVehicle = {
          ...vehicleForm,
          name: vehicleForm.name.trim() || `${vehicleForm.type === 'AMBULANCE' ? 'Ambulance' : vehicleForm.type === 'VSL' ? 'VSL' : 'Taxi'} ${vehicleForm.plate}`
        };
        updatedVehicles = [newVehicle, ...currentVehicles];
      }

      const updated = await adminService.updateTransporter(selectedTransporter.id, {
        vehicles: updatedVehicles
      });

      setSelectedTransporter(updated);
      setShowVehicleModal(false);
      setActionFeedback(editingVehicle ? `Véhicule ${vehicleForm.plate} modifié.` : `Nouveau véhicule ${vehicleForm.plate} ajouté à la flotte.`);
      await loadData();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'enregistrement du véhicule');
    }
  };

  const handleOpenDeleteVehicle = (vehicle: TransporterVehicle) => {
    setVehicleToDelete(vehicle);
    setShowDeleteVehicleModal(true);
  };

  const handleConfirmDeleteVehicle = async () => {
    if (!selectedTransporter || !vehicleToDelete) return;
    try {
      const currentVehicles = [...(selectedTransporter.vehicles || [])];
      const updatedVehicles = currentVehicles.filter(v => v.id !== vehicleToDelete.id);

      const updated = await adminService.updateTransporter(selectedTransporter.id, {
        vehicles: updatedVehicles
      });

      setSelectedTransporter(updated);
      setShowDeleteVehicleModal(false);
      setVehicleToDelete(null);
      setActionFeedback(`Véhicule ${vehicleToDelete.plate} retiré de la flotte.`);
      await loadData();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression du véhicule');
    }
  };

  // --- GESTION DES CHAUFFEURS ---
  const handleOpenAddDriver = () => {
    if (!selectedTransporter) return;
    setEditingDriver(null);
    setDriverForm({
      id: `${selectedTransporter.id}-dr-${Date.now()}`,
      firstName: '',
      lastName: '',
      role: 'Ambulancier DEA Diplômé',
      phone: selectedTransporter.phone || '',
      email: '',
      status: 'DISPONIBLE',
      assignedVehiclePlate: ''
    });
    setShowDriverModal(true);
  };

  const handleOpenEditDriver = (driver: TransporterDriver) => {
    setEditingDriver(driver);
    setDriverForm({
      id: driver.id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      role: driver.role,
      phone: driver.phone,
      email: driver.email || '',
      status: driver.status,
      assignedVehiclePlate: driver.assignedVehiclePlate || ''
    });
    setShowDriverModal(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransporter) return;

    try {
      const currentDrivers = [...(selectedTransporter.drivers || [])];
      let updatedDrivers: TransporterDriver[];

      if (editingDriver) {
        updatedDrivers = currentDrivers.map(d => d.id === editingDriver.id ? { ...driverForm } : d);
      } else {
        const newDriver: TransporterDriver = { ...driverForm };
        updatedDrivers = [newDriver, ...currentDrivers];
      }

      const updated = await adminService.updateTransporter(selectedTransporter.id, {
        drivers: updatedDrivers
      });

      setSelectedTransporter(updated);
      setShowDriverModal(false);
      setActionFeedback(editingDriver ? `Chauffeur ${driverForm.firstName} ${driverForm.lastName} mis à jour.` : `Nouveau chauffeur ${driverForm.firstName} ${driverForm.lastName} ajouté.`);
      await loadData();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'enregistrement du chauffeur');
    }
  };

  const handleOpenDeleteDriver = (driver: TransporterDriver) => {
    setDriverToDelete(driver);
    setShowDeleteDriverModal(true);
  };

  const handleConfirmDeleteDriver = async () => {
    if (!selectedTransporter || !driverToDelete) return;
    try {
      const currentDrivers = [...(selectedTransporter.drivers || [])];
      const updatedDrivers = currentDrivers.filter(d => d.id !== driverToDelete.id);

      const updated = await adminService.updateTransporter(selectedTransporter.id, {
        drivers: updatedDrivers
      });

      setSelectedTransporter(updated);
      setShowDeleteDriverModal(false);
      setDriverToDelete(null);
      setActionFeedback(`Chauffeur ${driverToDelete.firstName} ${driverToDelete.lastName} retiré de l'équipe.`);
      await loadData();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression du chauffeur');
    }
  };

  const handleOpenPasswordReset = () => {
    if (!selectedTransporter) return;
    const newPass = `AMB972-${Math.random().toString(36).slice(-5).toUpperCase()}!`;
    setGeneratedPassword(newPass);
    setPasswordCopied(false);
    setShowPasswordModal(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (!selectedTransporter) return;
    try {
      await adminService.resetTransporterPassword(selectedTransporter.id, generatedPassword);
      setShowPasswordModal(false);
      setActionFeedback(`Mot de passe réinitialisé pour ${selectedTransporter.companyName}.`);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la réinitialisation');
    }
  };

  const handleDelete = async () => {
    if (!selectedTransporter) return;
    try {
      await adminService.deleteTransporter(selectedTransporter.id);
      setShowDeleteModal(false);
      setActionFeedback(`Société ${selectedTransporter.companyName} supprimée.`);
      setSelectedTransporter(null);
      await loadData();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleOpenTrialModal = (transporter: Transporter) => {
    setSelectedTransporter(transporter);
    setTrialDaysInput(transporter.subscription?.trialDaysRemaining ?? 30);
    setShowTrialModal(true);
  };

  const handleSaveTrialDays = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransporter) return;
    try {
      await adminService.updateTransporterTrialDays(selectedTransporter.id, trialDaysInput, user?.email);
      setShowTrialModal(false);
      setActionFeedback(`Période de gratuité mise à jour : ${trialDaysInput} jours alloués à ${selectedTransporter.companyName}.`);
      await loadData();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la mise à jour de la gratuité");
    }
  };

  // Fleet Totals
  const totalAmbulances = transporters.reduce((acc, t) => acc + (t.fleetAmbulances || 0), 0);
  const totalVsl = transporters.reduce((acc, t) => acc + (t.fleetVsl || 0), 0);
  const totalTaxis = transporters.reduce((acc, t) => acc + (t.fleetTaxis || 0), 0);
  const totalVehicles = totalAmbulances + totalVsl + totalTaxis;

  return (
    <AdminLayout
      title="Sociétés Conventionnées & Agréments"
      subtitle="Gestion granulaire des entreprises de transport sanitaire agréées ARS Martinique et conventionnées CPAM"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Nouveau Transporteur</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant transition-colors"
            title="Rafraîchir"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      }
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Sociétés Partenaires</span>
          <div className="text-3xl font-extrabold text-primary font-mono mt-1">{transporters.length}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {transporters.filter(t => t.verified).length} agréées ARS • {transporters.filter(t => !t.verified).length} en attente
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Flotte Sanitaire Totale</span>
          <div className="text-3xl font-extrabold text-on-surface font-mono mt-1">{totalVehicles}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {totalAmbulances} Amb. • {totalVsl} VSL • {totalTaxis} Taxis
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Conformité Contrôle Technique</span>
          <div className="text-3xl font-extrabold text-secondary font-mono mt-1">99.1%</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Attestations sanitaires à jour</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Temps d'Approche Moyen</span>
          <div className="text-3xl font-extrabold text-on-surface font-mono mt-1">14 min</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Sur les 34 communes de Martinique</p>
        </div>
      </div>

      {actionFeedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Directory List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/30 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">
                Annuaire des Sociétés ({filteredTransporters.length})
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer par nom, SIRET, commune..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant/50 text-xs bg-surface-container-lowest outline-none focus:border-primary"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Toutes ({transporters.length})
              </button>
              <button
                onClick={() => setStatusFilter('VERIFIED')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'VERIFIED'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Agréées ({transporters.filter(t => t.verified).length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  statusFilter === 'PENDING'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                En attente ({transporters.filter(t => !t.verified).length})
              </button>
            </div>

            {/* List */}
            <div className="space-y-2 pt-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredTransporters.map((t) => {
                const isSelected = selectedTransporter?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTransporter(t)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20'
                        : 'border-outline-variant/30 hover:border-outline-variant/70 bg-surface-container-lowest'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-extrabold text-on-surface leading-tight">
                          {t.companyName}
                        </h3>
                        <span className="text-[11px] text-on-surface-variant">
                          {t.city} • SIRET {t.siret.slice(0, 9)}...
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          t.verified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {t.verified ? 'Agréé ARS' : 'En attente'}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{t.fleetAmbulances} Amb.</span>
                        <span>•</span>
                        <span className="font-semibold text-secondary">{t.fleetVsl} VSL</span>
                        <span>•</span>
                        <span className="font-semibold text-on-surface">{t.fleetTaxis} Taxis</span>
                      </div>
                      <span className="font-semibold text-emerald-700">
                        {t.complianceRate || 98}% conformité
                      </span>
                      <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300/40">
                        {t.subscription?.trialDaysRemaining ?? 30}j gratuit
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredTransporters.length === 0 && (
                <div className="p-8 text-center text-xs text-on-surface-variant">
                  Aucune société trouvée pour ce critère.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Detailed Transporter Sheet (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTransporter ? (
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-on-surface">
                      {selectedTransporter.companyName}
                    </h2>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        selectedTransporter.verified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {selectedTransporter.verified ? 'Agrément Actif ARS' : 'Dossier en Instruction'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {selectedTransporter.address}, {selectedTransporter.city} ({selectedTransporter.postalCode}) • Tél : {selectedTransporter.phone} • Email : {selectedTransporter.email || 'contact@clinigo.fr'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => handleToggleVerification(selectedTransporter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      selectedTransporter.verified
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {selectedTransporter.verified ? 'Suspendre l\'Agrément' : 'Valider l\'Agrément ARS'}
                  </button>
                  <button
                    onClick={() => handleOpenTrialModal(selectedTransporter)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 border border-amber-400/50 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    title="Gérer la gratuité / jours d'essai"
                  >
                    <span className="material-symbols-outlined text-base text-amber-600">stars</span>
                    <span>Gratuité ({selectedTransporter.subscription?.trialDaysRemaining ?? 30}j)</span>
                  </button>
                  <button
                    onClick={handleOpenEdit}
                    className="p-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
                    title="Modifier la fiche"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={handleOpenPasswordReset}
                    className="p-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container text-secondary transition-colors cursor-pointer"
                    title="Réinitialiser le mot de passe dispatch"
                  >
                    <span className="material-symbols-outlined text-base">lock_reset</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Supprimer la société"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setDetailTab('OVERVIEW')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    detailTab === 'OVERVIEW'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">badge</span>
                  <span>Fiche & Paramètres</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('FLEET')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    detailTab === 'FLEET'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">local_shipping</span>
                  <span>Flotte ({selectedTransporter.vehicles?.length ?? (selectedTransporter.fleetAmbulances + selectedTransporter.fleetVsl + selectedTransporter.fleetTaxis)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('DRIVERS')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    detailTab === 'DRIVERS'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">group</span>
                  <span>Équipe Chauffeurs ({selectedTransporter.drivers?.length ?? 4})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('COMPLIANCE')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    detailTab === 'COMPLIANCE'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span>Pièces & Agréments</span>
                </button>
              </div>

              {/* TAB 1: OVERVIEW & PARAMÈTRES */}
              {detailTab === 'OVERVIEW' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Abonnement & Gratuité Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-amber-300/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-xl">workspace_premium</span>
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            Abonnement : {
                              selectedTransporter.subscription?.status === 'active' || selectedTransporter.subscription?.status === 'ACTIVE'
                                ? 'Abonnement Mensuel Pro Stripe (Actif)'
                                : selectedTransporter.subscription?.status === 'past_due'
                                ? 'Stripe : Paiement en attente'
                                : selectedTransporter.subscription?.status === 'canceled'
                                ? 'Stripe : Résilié'
                                : selectedTransporter.subscription?.status === 'TRIAL'
                                ? 'Essai gratuit actif'
                                : 'Non abonné / En attente'
                            }
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300">
                            {selectedTransporter.subscription?.trialDaysRemaining ?? 30} jours de gratuité
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {selectedTransporter.subscription?.whatsappVerified ? 'Numéro WhatsApp vérifié' : 'Numéro WhatsApp non encore vérifié'} • Formule Pro Sanitaire (19,90 € HT / mois)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenTrialModal(selectedTransporter)}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">edit_calendar</span>
                      <span>Gérer les jours</span>
                    </button>
                  </div>

                  {/* Administrative IDs & Statut */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Numéro SIRET</span>
                      <span className="font-mono text-xs font-bold text-on-surface">{selectedTransporter.siret}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Agrément ARS</span>
                      <span className="font-mono text-xs font-bold text-primary">{selectedTransporter.arsLicense}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Convention CPAM / CGSS</span>
                      <span className="font-mono text-xs font-bold text-secondary">{selectedTransporter.cpamConventionNumber}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Statut Entreprise</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        selectedTransporter.status === 'ACTIVE' || !selectedTransporter.status
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedTransporter.status === 'SUSPENDED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedTransporter.status === 'ACTIVE' || !selectedTransporter.status ? 'ACTIF' : selectedTransporter.status === 'SUSPENDED' ? 'SUSPENDU' : 'EN ATTENTE'}
                      </span>
                    </div>
                  </div>

                  {/* Fleet Summary Card */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                        Parc de véhicules ({selectedTransporter.vehicles?.length || (selectedTransporter.fleetAmbulances + selectedTransporter.fleetVsl + selectedTransporter.fleetTaxis)} immatriculés)
                      </h3>
                      <button
                        type="button"
                        onClick={() => setDetailTab('FLEET')}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Gérer la flotte</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border border-outline-variant/30 text-center bg-surface-container-lowest">
                        <span className="material-symbols-outlined text-rose-600 text-xl mb-0.5">ambulance</span>
                        <div className="text-lg font-extrabold text-on-surface font-mono">{selectedTransporter.fleetAmbulances}</div>
                        <span className="text-[11px] text-on-surface-variant font-semibold">Ambulances</span>
                      </div>
                      <div className="p-3 rounded-xl border border-outline-variant/30 text-center bg-surface-container-lowest">
                        <span className="material-symbols-outlined text-secondary text-xl mb-0.5">directions_car</span>
                        <div className="text-lg font-extrabold text-on-surface font-mono">{selectedTransporter.fleetVsl}</div>
                        <span className="text-[11px] text-on-surface-variant font-semibold">VSL</span>
                      </div>
                      <div className="p-3 rounded-xl border border-outline-variant/30 text-center bg-surface-container-lowest">
                        <span className="material-symbols-outlined text-amber-600 text-xl mb-0.5">local_taxi</span>
                        <div className="text-lg font-extrabold text-on-surface font-mono">{selectedTransporter.fleetTaxis}</div>
                        <span className="text-[11px] text-on-surface-variant font-semibold">Taxis</span>
                      </div>
                    </div>
                  </div>

                  {/* Bassin Territorial & Rayonnement */}
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                        Bassin Territorial & Indicateurs de Performance
                      </h3>
                      <button
                        type="button"
                        onClick={handleOpenEdit}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        <span>Modifier paramètres</span>
                      </button>
                    </div>
                    <p className="text-xs text-on-surface">
                      {selectedTransporter.zone || 'Ensemble du secteur et agglomération'}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-semibold text-primary pt-1 flex-wrap">
                      <span>⏱️ Temps d'approche moyen : <strong>{selectedTransporter.avgApproachMinutes || 14} min</strong></span>
                      <span>📍 Taux de ponctualité : <strong>{selectedTransporter.complianceRate || 98.4}%</strong></span>
                      <span>📫 Implantation : <strong>{selectedTransporter.city} ({selectedTransporter.postalCode || 'Département'})</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FLOTTE DE VÉHICULES */}
              {detailTab === 'FLEET' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                    <div>
                      <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">directions_car</span>
                        <span>Parc de Véhicules Agréés ARS</span>
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Ajoutez, modifiez ou retirez les ambulances, VSL et taxis conventionnés rattachés à cette société.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddVehicle}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-all cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      <span>Ajouter un véhicule</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedTransporter.vehicles || []).map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant/60 shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                vehicle.type === 'AMBULANCE'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : vehicle.type === 'VSL'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-amber-100 text-amber-900 border border-amber-200'
                              }`}>
                                {vehicle.type === 'AMBULANCE' ? 'Ambulance ASSU' : vehicle.type === 'VSL' ? 'VSL Sanitaire' : 'Taxi CPAM'}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                vehicle.status === 'DISPONIBLE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : vehicle.status === 'EN_MISSION'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : vehicle.status === 'MAINTENANCE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                <span>{vehicle.status}</span>
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-on-surface">
                              {vehicle.name}
                            </h4>
                          </div>

                          {/* Plaque d'immatriculation stylisée */}
                          <div className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 font-mono text-xs font-extrabold text-slate-900 tracking-wider shadow-2xs flex items-center gap-1">
                            <span className="w-1.5 h-3 bg-blue-700 rounded-2xs inline-block"></span>
                            <span>{vehicle.plate}</span>
                          </div>
                        </div>

                        <div className="text-xs text-on-surface-variant space-y-1 pt-2 border-t border-outline-variant/15">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-primary">person</span>
                            <span>Chauffeur : <strong className="text-on-surface">{vehicle.driver || 'Non affecté'}</strong></span>
                          </div>
                          {vehicle.phone && (
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-secondary">phone</span>
                              <span className="font-mono">{vehicle.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-outline-variant/10">
                          <button
                            type="button"
                            onClick={() => handleOpenEditVehicle(vehicle)}
                            className="px-2.5 py-1 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Modifier</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteVehicle(vehicle)}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Retirer</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!selectedTransporter.vehicles || selectedTransporter.vehicles.length === 0) && (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-outline-variant/50 text-xs text-on-surface-variant space-y-2">
                      <span className="material-symbols-outlined text-3xl text-slate-400">directions_car</span>
                      <p className="font-bold text-on-surface">Aucun véhicule enregistré dans cette fiche</p>
                      <p>Cliquez sur "Ajouter un véhicule" pour référencer la première ambulance ou VSL.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ÉQUIPE CHAUFFEURS */}
              {detailTab === 'DRIVERS' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                    <div>
                      <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">badge</span>
                        <span>Équipe Ambulanciers & Chauffeurs</span>
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Gérez les diplômes DEA, auxiliaires et chauffeurs de taxi conventionnés de la compagnie.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddDriver}
                      className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-all cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-base">person_add</span>
                      <span>Ajouter un chauffeur</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedTransporter.drivers || []).map((driver) => (
                      <div
                        key={driver.id}
                        className="p-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant/60 shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm font-mono shrink-0">
                              {driver.firstName.charAt(0)}{driver.lastName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-on-surface">
                                {driver.firstName} {driver.lastName}
                              </h4>
                              <span className="text-[11px] font-semibold text-secondary block">
                                {driver.role}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            driver.status === 'DISPONIBLE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : driver.status === 'EN_MISSION'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{driver.status}</span>
                          </span>
                        </div>

                        <div className="text-xs text-on-surface-variant space-y-1 pt-2 border-t border-outline-variant/15">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-secondary">phone</span>
                            <a href={`tel:${driver.phone}`} className="font-mono text-primary hover:underline">{driver.phone}</a>
                          </div>
                          {driver.email && (
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-on-surface-variant">mail</span>
                              <span className="truncate">{driver.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="material-symbols-outlined text-sm text-amber-600">directions_car</span>
                            <span>Véhicule affecté : <strong className="font-mono text-on-surface">{driver.assignedVehiclePlate || 'Non assigné'}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-outline-variant/10">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDriver(driver)}
                            className="px-2.5 py-1 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Modifier</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteDriver(driver)}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span>Retirer</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(!selectedTransporter.drivers || selectedTransporter.drivers.length === 0) && (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-outline-variant/50 text-xs text-on-surface-variant space-y-2">
                      <span className="material-symbols-outlined text-3xl text-slate-400">group</span>
                      <p className="font-bold text-on-surface">Aucun chauffeur enregistré pour cette société</p>
                      <p>Cliquez sur "Ajouter un chauffeur" pour affecter votre premier ambulancier.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: COMPLIANCE & PIÈCES */}
              {detailTab === 'COMPLIANCE' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                      Dossier Réglementaire & Contrôles ARS / CPAM
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Conformité des autorisations de mise en service (AMS), certificats d'aptitude et contrôles périodiques.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: 'Agrément Préfectoral & Autorisation ARS', date: '01/01/2026', valid: true },
                      { name: 'Attestation de Conventionnement CPAM / CGSS', date: '15/01/2026', valid: true },
                      { name: 'Contrôles Techniques Sanitaires & Désinfection des Véhicules', date: '10/08/2026', valid: true },
                      { name: 'Attestation d\'Assurance Professionnelle et Responsabilité Civile', date: '01/01/2026', valid: true },
                      { name: 'Fiches Aptitudes Médicales des Ambulanciers DEA', date: '01/02/2026', valid: true }
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
                          <div>
                            <span className="font-bold text-on-surface block">{doc.name}</span>
                            <span className="text-[10px] text-on-surface-variant">Dossier vérifié et validé par le superviseur</span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {doc.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl p-12 border border-outline-variant/30 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2">ambulance</span>
              <p className="text-sm font-bold text-on-surface">Sélectionnez une société de transport</p>
              <p className="text-xs">Cliquez sur un transporteur dans la liste à gauche pour voir sa fiche d'agrément.</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full p-6 border border-outline-variant/40 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">add_business</span>
                <h3 className="text-base font-extrabold text-on-surface">Nouvelle Société de Transport Sanitaire</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Raison Sociale *</label>
                  <input
                    type="text"
                    required
                    value={newTransporter.companyName}
                    onChange={e => setNewTransporter({ ...newTransporter, companyName: e.target.value })}
                    placeholder="Ex: Ambulances Madinina Secours"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Numéro SIRET *</label>
                  <input
                    type="text"
                    required
                    value={newTransporter.siret}
                    onChange={e => setNewTransporter({ ...newTransporter, siret: e.target.value })}
                    placeholder="14 chiffres (ex: 80123456700018)"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">N° Agrément ARS Martinique *</label>
                  <input
                    type="text"
                    required
                    value={newTransporter.arsLicense}
                    onChange={e => setNewTransporter({ ...newTransporter, arsLicense: e.target.value })}
                    placeholder="Ex: ARS-972-2024-08"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">N° Convention CPAM / CGSS *</label>
                  <input
                    type="text"
                    required
                    value={newTransporter.cpamConventionNumber}
                    onChange={e => setNewTransporter({ ...newTransporter, cpamConventionNumber: e.target.value })}
                    placeholder="Ex: CPAM-972-CONV-019"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Code Postal *</label>
                  <input
                    type="text"
                    required
                    value={newTransporter.postalCode || ''}
                    onChange={e => setNewTransporter({ ...newTransporter, postalCode: e.target.value })}
                    placeholder="97200, 31000, 75001"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Commune d'Attache *</label>
                  <input
                    type="text"
                    required
                    list="create-communes-list"
                    value={newTransporter.city}
                    onChange={e => setNewTransporter({ ...newTransporter, city: e.target.value })}
                    placeholder="Fort-de-France, Toulouse..."
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                  <datalist id="create-communes-list">
                    {MARTINIQUE_COMMUNES.map(commune => (
                      <option key={commune} value={commune} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Adresse du Dépôt / Siège</label>
                  <input
                    type="text"
                    value={newTransporter.address}
                    onChange={e => setNewTransporter({ ...newTransporter, address: e.target.value })}
                    placeholder="Ex: ZI Petit Manoir"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Téléphone Dispatch / Régulation *</label>
                  <input
                    type="tel"
                    required
                    value={newTransporter.phone}
                    onChange={e => setNewTransporter({ ...newTransporter, phone: e.target.value })}
                    placeholder="0596 00 00 00"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Email du Dispatch</label>
                  <input
                    type="email"
                    value={newTransporter.email}
                    onChange={e => setNewTransporter({ ...newTransporter, email: e.target.value })}
                    placeholder="dispatch@societe.mq"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Composition Flotte */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <label className="font-bold text-on-surface block">Composition initiale du parc de véhicules</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-on-surface-variant font-semibold">Ambulances A/B</span>
                    <input
                      type="number"
                      min="0"
                      value={newTransporter.fleetAmbulances}
                      onChange={e => setNewTransporter({ ...newTransporter, fleetAmbulances: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono text-center outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-on-surface-variant font-semibold">VSL Médicalisés</span>
                    <input
                      type="number"
                      min="0"
                      value={newTransporter.fleetVsl}
                      onChange={e => setNewTransporter({ ...newTransporter, fleetVsl: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono text-center outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-on-surface-variant font-semibold">Taxis Conventionnés</span>
                    <input
                      type="number"
                      min="0"
                      value={newTransporter.fleetTaxis}
                      onChange={e => setNewTransporter({ ...newTransporter, fleetTaxis: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono text-center outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Mot de passe initial */}
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Mot de passe provisoire du compte dispatch</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTransporter.initialPassword}
                    onChange={e => setNewTransporter({ ...newTransporter, initialPassword: e.target.value })}
                    className="flex-1 p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest font-mono text-xs focus:border-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNewTransporter({ ...newTransporter, initialPassword: `AMB972-${Math.random().toString(36).slice(-5).toUpperCase()}!` })}
                    className="px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container text-xs font-bold hover:bg-surface-container-high transition-colors"
                  >
                    Régénérer
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant">Ce mot de passe servira au dispatching du transporteur pour se connecter à l'espace transporteur.</p>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors"
                >
                  Créer la Fiche Transporteur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full p-6 border border-outline-variant/40 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">edit</span>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">Modifier la Fiche Transporteur</h3>
                  <p className="text-[11px] text-on-surface-variant font-medium">{editForm.companyName} (ID: {editForm.id})</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Statut et Agrément */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Statut du compte</label>
                  <select
                    value={editForm.status || 'ACTIVE'}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-bold focus:border-primary outline-none"
                  >
                    <option value="ACTIVE">🟢 Actif & Opérationnel</option>
                    <option value="PENDING">🟡 En attente de validation</option>
                    <option value="SUSPENDED">🔴 Suspendu / Inactif</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Validation ARS / Convention</label>
                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.verified ?? true}
                      onChange={e => setEditForm({ ...editForm, verified: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/30"
                    />
                    <span className="text-xs font-semibold text-on-surface">Dossier vérifié & conventionné</span>
                  </label>
                </div>
              </div>

              {/* Identification Entreprise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Raison Sociale *</label>
                  <input
                    type="text"
                    required
                    value={editForm.companyName}
                    onChange={e => setEditForm({ ...editForm, companyName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Numéro SIRET</label>
                  <input
                    type="text"
                    value={editForm.siret}
                    onChange={e => setEditForm({ ...editForm, siret: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Agréments ARS et CPAM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">N° Agrément ARS</label>
                  <input
                    type="text"
                    value={editForm.arsLicense}
                    onChange={e => setEditForm({ ...editForm, arsLicense: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">N° Convention CPAM / CGSS</label>
                  <input
                    type="text"
                    value={editForm.cpamConventionNumber}
                    onChange={e => setEditForm({ ...editForm, cpamConventionNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Localisation Nationale & DOM */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Code Postal</label>
                  <input
                    type="text"
                    value={editForm.postalCode || ''}
                    onChange={e => setEditForm({ ...editForm, postalCode: e.target.value })}
                    placeholder="Ex: 97200, 31000, 75001"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Commune / Ville</label>
                  <input
                    type="text"
                    list="edit-communes-list"
                    value={editForm.city}
                    onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                    placeholder="Ville d'attache"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                  <datalist id="edit-communes-list">
                    {MARTINIQUE_COMMUNES.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Adresse du Siège</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Contact Dispatch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Téléphone Dispatch</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Email de Notification</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Métriques Opérationnelles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Temps d'approche moyen (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={editForm.avgApproachMinutes ?? 12}
                    onChange={e => setEditForm({ ...editForm, avgApproachMinutes: parseInt(e.target.value) || 12 })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Taux de conformité ARS / CPAM (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="50"
                    max="100"
                    value={editForm.complianceRate ?? 98.5}
                    onChange={e => setEditForm({ ...editForm, complianceRate: parseFloat(e.target.value) || 98.5 })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Composition Flotte - Compteurs globaux */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-on-surface block">Compteurs de flotte déclarés</label>
                  <span className="text-[10px] text-on-surface-variant">Synchronisé automatiquement avec l'onglet Flotte</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-on-surface-variant font-semibold">Ambulances A/B</span>
                    <input
                      type="number"
                      min="0"
                      value={editForm.fleetAmbulances || 0}
                      onChange={e => setEditForm({ ...editForm, fleetAmbulances: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono text-center outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-on-surface-variant font-semibold">VSL Médicalisés</span>
                    <input
                      type="number"
                      min="0"
                      value={editForm.fleetVsl || 0}
                      onChange={e => setEditForm({ ...editForm, fleetVsl: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono text-center outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-on-surface-variant font-semibold">Taxis Conventionnés</span>
                    <input
                      type="number"
                      min="0"
                      value={editForm.fleetTaxis || 0}
                      onChange={e => setEditForm({ ...editForm, fleetTaxis: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono text-center outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface">Bassin Territorial / Zone de rayonnement</label>
                <input
                  type="text"
                  value={editForm.zone || ''}
                  onChange={e => setEditForm({ ...editForm, zone: e.target.value })}
                  placeholder="Ex: Bassin Sud (Marin, Sainte-Luce...) ou Agglomération Toulousaine"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                />
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {showPasswordModal && selectedTransporter && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 border border-outline-variant/40 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-2xl">lock_reset</span>
              <h3 className="text-base font-extrabold text-on-surface">Réinitialiser Mot de Passe Dispatch</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Générer un mot de passe sécurisé pour l'accès dispatch de la société <strong className="text-on-surface">{selectedTransporter.companyName}</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface">Nouveau mot de passe généré :</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedPassword}
                  onChange={e => setGeneratedPassword(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest font-mono text-xs font-bold text-primary outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    setPasswordCopied(true);
                    setTimeout(() => setPasswordCopied(false), 2000);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container text-xs font-bold hover:bg-surface-container-high transition-colors"
                >
                  {passwordCopied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedPassword(`AMB972-${Math.random().toString(36).slice(-5).toUpperCase()}!`)}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Générer un autre mot de passe
              </button>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmPasswordReset}
                className="px-5 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold shadow-xs hover:bg-secondary/90 transition-colors"
              >
                Valider la Réinitialisation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedTransporter && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 border border-rose-200 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="text-base font-extrabold text-on-surface">Supprimer le transporteur</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement la société <strong className="text-on-surface">{selectedTransporter.companyName}</strong> (SIRET: {selectedTransporter.siret}) ?
              Cette action retirera cette entreprise des propositions de dispatching territorial.
            </p>
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 transition-colors"
              >
                Confirmer la Suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRIAL DAYS MODAL */}
      {showTrialModal && selectedTransporter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 border border-amber-300 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-amber-600">stars</span>
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">Gratuité & Période d'Essai</h3>
                  <span className="text-[11px] text-on-surface-variant font-medium">
                    {selectedTransporter.companyName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrialModal(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTrialDays} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-amber-700">info</span>
                  <span>Gestion Administrateur des accès gratuits</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  Définissez le nombre total de jours de gratuité accordés à cette entreprise sanitaire pour tester la plateforme. Le compte à rebours est actualisé en temps réel sur son panel.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  Raccourcis d'attribution rapide :
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 15, 30, 60].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setTrialDaysInput(days)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                        trialDaysInput === days
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-outline-variant/30'
                      }`}
                    >
                      {days} jours
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nombre personnalisé de jours restants :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={trialDaysInput}
                    onChange={(e) => setTrialDaysInput(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono font-bold text-sm text-on-surface outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <span className="text-xs font-bold text-on-surface-variant shrink-0">jours</span>
                </div>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTrialModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>Enregistrer la gratuité</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* VEHICLE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 border border-outline-variant/40 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  {editingVehicle ? 'edit_square' : 'add_circle'}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">
                    {editingVehicle ? 'Modifier le Véhicule Sanitaire' : 'Ajouter un Véhicule à la Flotte'}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-medium">
                    {selectedTransporter?.companyName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Type de Véhicule *</label>
                  <select
                    value={vehicleForm.type}
                    onChange={e => setVehicleForm({ ...vehicleForm, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-bold focus:border-primary outline-none"
                  >
                    <option value="AMBULANCE">🚑 Ambulance (Type A/B/C)</option>
                    <option value="VSL">🚗 VSL Médicalisé</option>
                    <option value="TAXI_CONVENTIONNE">🚕 Taxi Conventionné CPAM</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Immatriculation (Plaque) *</label>
                  <input
                    type="text"
                    required
                    value={vehicleForm.plate}
                    onChange={e => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })}
                    placeholder="Ex: AB-123-CD"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono font-bold uppercase focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface">Nom / Désignation du Véhicule</label>
                <input
                  type="text"
                  value={vehicleForm.name}
                  onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                  placeholder="Ex: Ambulance Urgence 01 ou VSL Confort Nord"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Statut Opérationnel *</label>
                  <select
                    value={vehicleForm.status}
                    onChange={e => setVehicleForm({ ...vehicleForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-bold focus:border-primary outline-none"
                  >
                    <option value="DISPONIBLE">🟢 Disponible / En attente</option>
                    <option value="EN_MISSION">🟡 En mission de transport</option>
                    <option value="EN_PAUSE">⚪ En pause équipage</option>
                    <option value="MAINTENANCE">🔴 Révision / Maintenance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Téléphone Embarqué</label>
                  <input
                    type="tel"
                    value={vehicleForm.phone || ''}
                    onChange={e => setVehicleForm({ ...vehicleForm, phone: e.target.value })}
                    placeholder="Ligne directe mobile"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface">Chauffeur Assigné</label>
                <input
                  type="text"
                  list="vehicle-drivers-list"
                  value={vehicleForm.driver || ''}
                  onChange={e => setVehicleForm({ ...vehicleForm, driver: e.target.value })}
                  placeholder="Sélectionnez ou saisissez le nom du chauffeur"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                />
                <datalist id="vehicle-drivers-list">
                  {(selectedTransporter?.drivers || []).map(d => (
                    <option key={d.id} value={`${d.firstName} ${d.lastName}`}>
                      {d.role} ({d.status})
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>{editingVehicle ? 'Enregistrer le véhicule' : 'Ajouter à la flotte'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRIVER MODAL */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 border border-outline-variant/40 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  {editingDriver ? 'badge' : 'person_add'}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">
                    {editingDriver ? 'Modifier le Chauffeur / Équipier' : 'Ajouter un Chauffeur / Équipier'}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant font-medium">
                    {selectedTransporter?.companyName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDriverModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.firstName}
                    onChange={e => setDriverForm({ ...driverForm, firstName: e.target.value })}
                    placeholder="Ex: Jean"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Nom de Famille *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.lastName}
                    onChange={e => setDriverForm({ ...driverForm, lastName: e.target.value })}
                    placeholder="Ex: Dupont"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Rôle / Qualification *</label>
                  <select
                    value={driverForm.role}
                    onChange={e => setDriverForm({ ...driverForm, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-bold focus:border-primary outline-none"
                  >
                    <option value="Ambulancier DEA Diplômé">Ambulancier DEA Diplômé</option>
                    <option value="Auxiliaire Ambulancier">Auxiliaire Ambulancier</option>
                    <option value="Chauffeur Taxi Conventionné CPAM">Chauffeur Taxi Conventionné CPAM</option>
                    <option value="Régulateur / Coordinateur">Régulateur / Coordinateur</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Statut d'Activité *</label>
                  <select
                    value={driverForm.status}
                    onChange={e => setDriverForm({ ...driverForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-bold focus:border-primary outline-none"
                  >
                    <option value="DISPONIBLE">🟢 Disponible</option>
                    <option value="EN_MISSION">🟡 En mission</option>
                    <option value="EN_REPOS">⚪ En repos / Congé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Téléphone Portable Direct *</label>
                  <input
                    type="tel"
                    required
                    value={driverForm.phone}
                    onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })}
                    placeholder="Ex: 0696 12 34 56"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Email Professionnel</label>
                  <input
                    type="email"
                    value={driverForm.email || ''}
                    onChange={e => setDriverForm({ ...driverForm, email: e.target.value })}
                    placeholder="chauffeur@societe.com"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-on-surface">Véhicule Assigné Habituel</label>
                <input
                  type="text"
                  list="driver-vehicles-list"
                  value={driverForm.assignedVehiclePlate || ''}
                  onChange={e => setDriverForm({ ...driverForm, assignedVehiclePlate: e.target.value.toUpperCase() })}
                  placeholder="Sélectionnez ou saisissez la plaque du véhicule"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono font-bold uppercase focus:border-primary outline-none"
                />
                <datalist id="driver-vehicles-list">
                  {(selectedTransporter?.vehicles || []).map(v => (
                    <option key={v.id} value={v.plate}>
                      {v.name} ({v.type})
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  <span>{editingDriver ? 'Enregistrer le chauffeur' : 'Ajouter le chauffeur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE VEHICLE MODAL */}
      {showDeleteVehicleModal && vehicleToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 border border-rose-200 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="text-base font-extrabold text-on-surface">Retirer le véhicule</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Êtes-vous sûr de vouloir retirer le véhicule <strong className="text-on-surface">{vehicleToDelete.name}</strong> (<span className="font-mono font-bold text-on-surface">{vehicleToDelete.plate}</span>) de la flotte de {selectedTransporter?.companyName} ?
            </p>
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteVehicleModal(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVehicle}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Confirmer le Retrait
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DRIVER MODAL */}
      {showDeleteDriverModal && driverToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 border border-rose-200 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="text-base font-extrabold text-on-surface">Supprimer le chauffeur</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Êtes-vous sûr de vouloir supprimer le profil de <strong className="text-on-surface">{driverToDelete.firstName} {driverToDelete.lastName}</strong> ({driverToDelete.role}) des effectifs de {selectedTransporter?.companyName} ?
            </p>
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteDriverModal(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDriver}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Confirmer la Suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
