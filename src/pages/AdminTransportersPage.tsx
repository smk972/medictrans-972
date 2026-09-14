import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { adminService } from '../services/adminService';
import { Transporter } from '../types';
import { MARTINIQUE_COMMUNES } from '../services/rideService';

export const AdminTransportersPage: React.FC = () => {
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [selectedTransporter, setSelectedTransporter] = useState<Transporter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
        fleetAmbulances: Number(editForm.fleetAmbulances) || 0,
        fleetVsl: Number(editForm.fleetVsl) || 0,
        fleetTaxis: Number(editForm.fleetTaxis) || 0,
        zone: editForm.zone
      });

      setShowEditModal(false);
      setActionFeedback(`Fiche de ${updated.companyName} mise à jour avec succès.`);
      await loadData();
      setSelectedTransporter(updated);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la modification');
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
                      {selectedTransporter.verified ? 'Agrément Actif ARS 972' : 'Dossier en Instruction'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {selectedTransporter.address}, {selectedTransporter.city} ({selectedTransporter.postalCode}) • Tél : {selectedTransporter.phone} • Email : {selectedTransporter.email || 'dispatch@medictrans.mq'}
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

              {/* Administrative IDs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Numéro SIRET</span>
                  <span className="font-mono text-xs font-bold text-on-surface">{selectedTransporter.siret}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Agrément ARS Martinique</span>
                  <span className="font-mono text-xs font-bold text-primary">{selectedTransporter.arsLicense}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Convention CPAM / CGSS</span>
                  <span className="font-mono text-xs font-bold text-secondary">{selectedTransporter.cpamConventionNumber}</span>
                </div>
              </div>

              {/* Fleet Composition */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                  Composition de la Flotte Déclarée
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-outline-variant/30 text-center bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-rose-600 text-2xl mb-1">ambulance</span>
                    <div className="text-xl font-extrabold text-on-surface font-mono">{selectedTransporter.fleetAmbulances}</div>
                    <span className="text-xs text-on-surface-variant font-semibold">Ambulances Type A/B</span>
                  </div>

                  <div className="p-4 rounded-2xl border border-outline-variant/30 text-center bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-secondary text-2xl mb-1">directions_car</span>
                    <div className="text-xl font-extrabold text-on-surface font-mono">{selectedTransporter.fleetVsl}</div>
                    <span className="text-xs text-on-surface-variant font-semibold">VSL Médicalisés</span>
                  </div>

                  <div className="p-4 rounded-2xl border border-outline-variant/30 text-center bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-amber-600 text-2xl mb-1">local_taxi</span>
                    <div className="text-xl font-extrabold text-on-surface font-mono">{selectedTransporter.fleetTaxis}</div>
                    <span className="text-xs text-on-surface-variant font-semibold">Taxis Conventionnés</span>
                  </div>
                </div>
              </div>

              {/* Bassin Territorial & Rayonnement */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                  Bassin Territorial & Rayonnement 972
                </h3>
                <p className="text-xs text-on-surface">
                  {selectedTransporter.zone || 'Ensemble du territoire martiniquais (34 communes)'}
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold text-primary pt-1">
                  <span>⏱️ Temps d'approche moyen : {selectedTransporter.avgApproachMinutes || 14} min</span>
                  <span>📍 Taux de ponctualité : {selectedTransporter.complianceRate || 98.4}%</span>
                </div>
              </div>

              {/* Pièces Justificatives d'Instruction */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                  Contrôles & Pièces Justificatives Déposées
                </h3>
                <div className="space-y-2">
                  {[
                    { name: 'Agrément Préfectoral & Autorisation ARS 972', date: '01/01/2026', valid: true },
                    { name: 'Attestation de Conventionnement CGSS Martinique', date: '15/01/2026', valid: true },
                    { name: 'Contrôles Techniques Sanitaires & Désinfection des Véhicules', date: '10/08/2026', valid: true },
                    { name: 'Attestation d\'Assurance Professionnelle et Responsabilité Civile', date: '01/01/2026', valid: true }
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                        <span className="font-semibold text-on-surface">{doc.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        Validé le {doc.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Commune d'Attache *</label>
                  <select
                    value={newTransporter.city}
                    onChange={e => setNewTransporter({ ...newTransporter, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  >
                    {MARTINIQUE_COMMUNES.map(commune => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>
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
                <h3 className="text-base font-extrabold text-on-surface">Modifier la Fiche Transporteur</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Raison Sociale</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">N° Agrément ARS Martinique</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Commune</label>
                  <select
                    value={editForm.city}
                    onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  >
                    {MARTINIQUE_COMMUNES.map(commune => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>
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

              {/* Composition Flotte */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <label className="font-bold text-on-surface block">Parc de véhicules conventionnés</label>
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
                  placeholder="Ex: Bassin Sud (Marin, Rivière-Pilote, Sainte-Luce, Le Diamant) & CHU"
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
    </AdminLayout>
  );
};
