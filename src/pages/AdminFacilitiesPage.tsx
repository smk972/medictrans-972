import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { AdminService } from '../services/adminService';
import { Facility, UserProfile } from '../types';
import { GoogleMapView } from '../components/GoogleMapView';
import { MARTINIQUE_COMMUNES } from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';

export const AdminFacilitiesPage: React.FC = () => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [activeSection, setActiveSection] = useState<'FACILITIES' | 'REQUESTS'>('FACILITIES');
  const [accessRequests, setAccessRequests] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // New staff member state in selected facility
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  // Department management
  const [newDeptName, setNewDeptName] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [passwordModalFacility, setPasswordModalFacility] = useState<Facility | null>(null);
  const [facilityPasswordValue, setFacilityPasswordValue] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formFiness, setFormFiness] = useState('');
  const [formType, setFormType] = useState<Facility['type']>('HOSPITAL');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Fort-de-France');
  const [formContactName, setFormContactName] = useState('');
  const [formContactRole, setFormContactRole] = useState('Cadre Supérieur de Santé');
  const [formContactPhone, setFormContactPhone] = useState('0596 ');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formDepartments, setFormDepartments] = useState<string>('Cardiologie, Néphrologie & Dialyse, Urgences');

  // Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await AdminService.getAllFacilities();
      setFacilities(data);
      if (data.length > 0 && !selectedFacility) {
        setSelectedFacility(data[0]);
      } else if (selectedFacility) {
        const refreshed = data.find(f => f.id === selectedFacility.id);
        if (refreshed) setSelectedFacility(refreshed);
      }

      // Demandes d'accès des établissements
      const reqs = await AdminService.getFacilityAccessRequests();
      setAccessRequests(reqs);
    } catch (err) {
      console.error('Erreur chargement établissements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (request: UserProfile) => {
    try {
      await AdminService.approveFacilityAccess(request.id || request.email, user?.email);
      setToastMessage({
        title: 'Accès Établissement Validé',
        desc: `L'accès à la plateforme pour ${request.facilityName || request.email} a été validé avec succès.`
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la validation de l'accès.");
    }
  };

  const handleRejectRequest = async (request: UserProfile) => {
    if (!confirm(`Confirmez-vous le refus ou la suspension de l'accès pour ${request.facilityName || request.email} ?`)) return;
    try {
      await AdminService.rejectFacilityAccess(request.id || request.email, user?.email);
      setToastMessage({
        title: 'Accès Établissement Restreint',
        desc: `L'accès pour ${request.facilityName || request.email} a été refusé / suspendu.`
      });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'opération.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredFacilities = facilities.filter((f) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.city.toLowerCase().includes(q) ||
      f.finess.includes(q) ||
      f.contactName.toLowerCase().includes(q);

    const matchType = typeFilter === 'ALL' || f.type === typeFilter;
    return matchSearch && matchType;
  });

  const openCreateModal = () => {
    setFormName('');
    setFormFiness(`9702${Math.floor(10000 + Math.random() * 90000)}`);
    setFormType('HOSPITAL');
    setFormAddress('Route de Châteauboeuf');
    setFormCity('Fort-de-France');
    setFormContactName('Cadre de permanence');
    setFormContactRole('Cadre Supérieur de Santé');
    setFormContactPhone('0596 55 20 00');
    setFormContactEmail('coordination@chu-martinique.fr');
    setFormDepartments('Néphrologie, Oncologie, Chirurgie Ambulatoire, Cardiologie');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (facility: Facility) => {
    setEditingFacility(facility);
    setFormName(facility.name);
    setFormFiness(facility.finess);
    setFormType(facility.type);
    setFormAddress(facility.address);
    setFormCity(facility.city);
    setFormContactName(facility.contactName);
    setFormContactRole(facility.contactRole);
    setFormContactPhone(facility.contactPhone);
    setFormContactEmail(facility.contactEmail);
    setFormDepartments(facility.departments.join(', '));
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formFiness.trim()) {
      alert('Veuillez remplir le nom et le numéro FINESS.');
      return;
    }

    try {
      const depts = formDepartments
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

      const payload = {
        name: formName.trim(),
        finess: formFiness.trim(),
        type: formType,
        address: formAddress.trim(),
        city: formCity,
        contactName: formContactName.trim(),
        contactRole: formContactRole.trim(),
        contactPhone: formContactPhone.trim(),
        contactEmail: formContactEmail.trim().toLowerCase(),
        departments: depts
      };

      if (editingFacility) {
        await AdminService.updateFacility(editingFacility.id, payload, user?.email);
        setToastMessage({
          title: 'Établissement Modifié',
          desc: `Les modifications de ${payload.name} ont été enregistrées.`
        });
        setEditingFacility(null);
      } else {
        const created = await AdminService.createFacility(payload, user?.email);
        setToastMessage({
          title: 'Établissement Créé',
          desc: `La structure ${created.name} (FINESS ${created.finess}) a été ajoutée.`
        });
        setIsCreateModalOpen(false);
      }
      await loadData();
    } catch (err) {
      console.error('Erreur sauvegarde établissement:', err);
      alert('Erreur lors de la sauvegarde.');
    }
  };

  const handleDeleteFacility = async (facility: Facility) => {
    if (!confirm(`Confirmez-vous la suppression de l'établissement ${facility.name} ?`)) return;
    try {
      await AdminService.deleteFacility(facility.id, user?.email);
      setToastMessage({
        title: 'Établissement Supprimé',
        desc: `${facility.name} a été retiré du répertoire.`
      });
      setSelectedFacility(null);
      await loadData();
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression.');
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility || !newDeptName.trim()) return;

    try {
      await AdminService.addFacilityDepartment(selectedFacility.id, newDeptName.trim(), user?.email);
      setToastMessage({
        title: 'Service Ajouté',
        desc: `Le service "${newDeptName.trim()}" a été ajouté à ${selectedFacility.name}.`
      });
      setNewDeptName('');
      await loadData();
    } catch (err) {
      console.error('Erreur ajout service:', err);
    }
  };

  const handleRemoveDepartment = async (dept: string) => {
    if (!selectedFacility) return;
    try {
      await AdminService.removeFacilityDepartment(selectedFacility.id, dept, user?.email);
      setToastMessage({
        title: 'Service Retiré',
        desc: `Le service "${dept}" a été supprimé de ${selectedFacility.name}.`
      });
      await loadData();
    } catch (err) {
      console.error('Erreur retrait service:', err);
    }
  };

  const handleOpenPasswordModal = (facility: Facility) => {
    setPasswordModalFacility(facility);
    setFacilityPasswordValue(`CH972-${Math.random().toString(36).slice(-5).toUpperCase()}!`);
    setPasswordFeedback(null);
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalFacility || !facilityPasswordValue.trim()) return;

    try {
      const res = await AdminService.resetFacilityPassword(passwordModalFacility.id, facilityPasswordValue.trim(), user?.email);
      setPasswordFeedback(res.password);
      setToastMessage({
        title: 'Accès Coordinateur Réinitialisé',
        desc: `Nouveau mot de passe généré pour ${passwordModalFacility.name} (${res.email}).`
      });
      await loadData();
    } catch (err) {
      console.error('Erreur réinitialisation mdp hôpital:', err);
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !selectedFacility) return;

    setToastMessage({
      title: 'Cadre Habilité',
      desc: `Le cadre de santé "${newStaffName}" a été habilité(e) avec succès.`
    });
    setNewStaffName('');
    setNewStaffRole('');
    setNewStaffPhone('');
  };

  const totalDischarges = facilities.reduce((acc, f) => acc + (f.activeDischargesCount || 0), 0);
  const totalStaff = facilities.reduce((acc, f) => acc + (f.authorizedStaffCount || 0), 0);

  return (
    <AdminLayout
      title="Établissements de Soins & Cadres Habilités"
      subtitle="Répertoire hospitalier, points de dépose paramétrés et régulation des départs soignants"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_business</span>
            <span>Nouvel Établissement</span>
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
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Structures Raccordées</span>
          <div className="text-3xl font-extrabold text-primary font-mono mt-1">{facilities.length}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">CHU, Cliniques, Dialyses & Hôpitaux 972</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Départs Régulés Aujourd'hui</span>
          <div className="text-3xl font-extrabold text-on-surface font-mono mt-1">{totalDischarges}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Sorties programmées et transferts inter-hôpitaux</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Cadres Habilités</span>
          <div className="text-3xl font-extrabold text-secondary font-mono mt-1">{totalStaff}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Personnel soignant avec accès régulation</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Services Paramétrés</span>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono mt-1">
            {facilities.reduce((acc, f) => acc + f.departments.length, 0)}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Départements, lits et consultations</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-outline-variant/30 pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('FACILITIES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'FACILITIES'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-base">domain</span>
          <span>Annuaire des Établissements ({facilities.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('REQUESTS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeSection === 'REQUESTS'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-base">how_to_reg</span>
          <span>Demandes d'accès & Habilitations</span>
          {accessRequests.filter(r => r.facilityAccessStatus === 'PENDING').length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono animate-pulse ${
              activeSection === 'REQUESTS' ? 'bg-amber-400 text-slate-950' : 'bg-amber-500 text-slate-950'
            }`}>
              {accessRequests.filter(r => r.facilityAccessStatus === 'PENDING').length} à valider
            </span>
          )}
        </button>
      </div>

      {activeSection === 'REQUESTS' ? (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">verified_user</span>
                Habilitations & Validation des Établissements de Santé
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Conformité ARS & RGPD : chaque établissement doit être validé par un administrateur pour débloquer la commande de transports.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {accessRequests.filter(r => r.facilityAccessStatus === 'PENDING').length} en attente
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-bold font-mono">
                {accessRequests.filter(r => r.facilityAccessStatus === 'APPROVED').length} validés
              </span>
            </div>
          </div>

          {/* Cards of requests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accessRequests.map((req) => {
              const status = req.facilityAccessStatus || 'PENDING';
              const isPending = status === 'PENDING';
              const isApproved = status === 'APPROVED';
              const isRejected = status === 'REJECTED';

              return (
                <div
                  key={req.id || req.email}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                    isPending
                      ? 'bg-white border-amber-300 shadow-md shadow-amber-500/10'
                      : isApproved
                      ? 'bg-surface-container-lowest border-emerald-200/80'
                      : 'bg-surface-container-lowest border-rose-200 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-primary font-mono block">
                          ÉTABLISSEMENT DE SANTÉ
                        </span>
                        <h4 className="text-base font-black text-on-surface mt-0.5">
                          {req.facilityName || 'Structure de Soins'}
                        </h4>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 flex items-center gap-1 ${
                        isPending
                          ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
                          : isApproved
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-rose-50 border-rose-300 text-rose-800'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {isPending ? 'hourglass_top' : isApproved ? 'check_circle' : 'cancel'}
                        </span>
                        {isPending ? 'En attente' : isApproved ? 'Accès Validé' : 'Accès Restreint'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-surface-container-low/50 p-3 rounded-2xl border border-outline-variant/20">
                      <div>
                        <span className="text-on-surface-variant text-[11px] block">Numéro FINESS</span>
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 inline-block mt-0.5">
                          {req.facilityFiness || 'Non renseigné'}
                        </span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant text-[11px] block">Déclarant</span>
                        <span className="font-semibold text-on-surface truncate block mt-0.5">
                          {req.firstName} {req.lastName}
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-outline-variant/20 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">mail</span>
                          {req.email}
                        </span>
                        {req.phone && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">call</span>
                            {req.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {req.facilityAccessRequestedAt && (
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        <span>Demande soumise le {new Date(req.facilityAccessRequestedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleApproveRequest(req)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Valider l'accès</span>
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(req)}
                        className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">block</span>
                        <span>Refuser</span>
                      </button>
                    )}

                    {isApproved && (
                      <div className="flex-1 text-[11px] text-emerald-800 font-medium flex items-center gap-1 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        <span>Compte habilité : accès complet aux sorties & commandes.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {accessRequests.length === 0 && (
              <div className="col-span-2 p-12 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">inbox</span>
                <p className="text-xs font-semibold text-on-surface-variant">Aucune demande d'accès enregistrée pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Main Content: Split Master-Detail */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Facilities List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Filters */}
          <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Rechercher par nom, commune, FINESS, cadre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-outline-variant/40 bg-surface-container-low/40 focus:bg-surface-container-lowest focus:border-primary outline-none transition-all"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-semibold text-on-surface outline-none"
            >
              <option value="ALL">Toutes les structures</option>
              <option value="HOSPITAL">Hôpitaux Publics (CHU)</option>
              <option value="CLINIC">Cliniques Privées</option>
              <option value="DIALYSIS">Centres de Dialyse</option>
            </select>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 text-center text-xs text-on-surface-variant font-semibold">
                Chargement des structures hospitalières...
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 text-center text-xs text-on-surface-variant">
                Aucun établissement ne correspond aux filtres.
              </div>
            ) : (
              filteredFacilities.map((facility) => {
                const isSelected = selectedFacility?.id === facility.id;
                return (
                  <div
                    key={facility.id}
                    onClick={() => setSelectedFacility(facility)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary'
                        : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          facility.type === 'HOSPITAL' ? 'bg-blue-50 text-blue-800' :
                          facility.type === 'CLINIC' ? 'bg-indigo-50 text-indigo-800' :
                          'bg-emerald-50 text-emerald-800'
                        }`}>
                          <span className="material-symbols-outlined text-xl">
                            {facility.type === 'DIALYSIS' ? 'water_drop' : 'local_hospital'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface leading-tight">
                            {facility.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-on-surface-variant mt-1">
                            <span className="font-mono font-bold text-primary">FINESS {facility.finess}</span>
                            <span>•</span>
                            <span>{facility.city}</span>
                            <span>•</span>
                            <span className="font-semibold text-secondary">{facility.departments.length} services</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openEditModal(facility); }}
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant text-xs cursor-pointer"
                          title="Modifier la fiche"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleOpenPasswordModal(facility); }}
                          className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-800 text-xs cursor-pointer"
                          title="Gérer les accès et mots de passe"
                        >
                          <span className="material-symbols-outlined text-base">lock_reset</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteFacility(facility); }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-700 text-xs cursor-pointer"
                          title="Supprimer"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Facility Details & Services Management */}
        <div className="lg:col-span-5">
          {selectedFacility ? (
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/30 shadow-xs space-y-6 sticky top-20">
              <div className="flex items-start justify-between border-b border-outline-variant/20 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Détails & Services Hospitaliers
                  </span>
                  <h3 className="text-base font-extrabold text-on-surface mt-0.5 leading-snug">
                    {selectedFacility.name}
                  </h3>
                  <div className="text-[11px] text-on-surface-variant mt-1">
                    {selectedFacility.address}, {selectedFacility.city}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openEditModal(selectedFacility)}
                  className="px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  <span>Modifier</span>
                </button>
              </div>

              {/* Contact Coordinateur Référent */}
              <div className="p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/20 space-y-2 text-xs">
                <div className="font-bold text-on-surface flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-primary">person_check</span>
                    Cadre Coordinateur Référent
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenPasswordModal(selectedFacility)}
                    className="text-primary font-bold hover:underline text-[11px]"
                  >
                    Réinitialiser MDP
                  </button>
                </div>
                <div className="text-on-surface font-semibold">{selectedFacility.contactName} ({selectedFacility.contactRole})</div>
                <div className="text-[11px] text-on-surface-variant flex items-center gap-3">
                  <a href={`tel:${selectedFacility.contactPhone}`} className="text-primary hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">phone</span>
                    {selectedFacility.contactPhone}
                  </a>
                  <a href={`mailto:${selectedFacility.contactEmail}`} className="text-on-surface-variant hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">mail</span>
                    {selectedFacility.contactEmail}
                  </a>
                </div>
              </div>

              {/* Services Hospitaliers Paramétrés */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-secondary">hotel</span>
                    Services & Départements ({selectedFacility.departments.length})
                  </h4>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedFacility.departments.map((dept) => (
                    <span
                      key={dept}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-medium text-on-surface group"
                    >
                      <span>{dept}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDepartment(dept)}
                        className="text-on-surface-variant hover:text-rose-600 transition-colors cursor-pointer"
                        title="Supprimer ce service"
                      >
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  ))}
                </div>

                {/* Formulaire ajout rapide de service */}
                <form onSubmit={handleAddDepartment} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Ajouter un service (ex: Maternité, Soins Intensifs...)"
                    className="flex-1 p-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    Ajouter
                  </button>
                </form>
              </div>

              {/* Habiliter un nouveau cadre */}
              <div className="pt-4 border-t border-outline-variant/20 space-y-3">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">clinical_notes</span>
                  Habiliter un Nouveau Cadre Soignant
                </h4>

                <form onSubmit={handleAddStaff} className="space-y-2.5 text-xs">
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Nom et prénom du cadre de santé"
                    className="w-full p-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs outline-none focus:border-primary"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      placeholder="Fonction / Service"
                      className="w-full p-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs outline-none focus:border-primary"
                    />
                    <input
                      type="tel"
                      required
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      placeholder="Ligne directe / Mobile"
                      className="w-full p-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs transition-all cursor-pointer"
                  >
                    Enregistrer l'habilitation
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 text-center text-xs text-on-surface-variant">
              Sélectionnez une structure hospitalière pour afficher et modifier ses services.
            </div>
          )}
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : CRÉER / MODIFIER ÉTABLISSEMENT                                   */}
      {/* ========================================================================= */}
      {(isCreateModalOpen || editingFacility) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-xl w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 my-8">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">
                    {editingFacility ? 'edit_square' : 'add_business'}
                  </span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    {editingFacility ? `Modifier ${editingFacility.name}` : 'Ajouter un nouvel établissement de santé'}
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    Paramétrage FINESS, localisation géographique et services
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsCreateModalOpen(false); setEditingFacility(null); }}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">Nom officiel de l'établissement *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="CHU de Martinique - Hôpital Pierre Zobda-Quitman"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">Numéro FINESS (9 chiffres) *</label>
                  <input
                    type="text"
                    required
                    value={formFiness}
                    onChange={(e) => setFormFiness(e.target.value)}
                    placeholder="970200021"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono font-bold text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">Catégorie d'établissement *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs outline-none focus:border-primary font-medium"
                  >
                    <option value="HOSPITAL">Hôpital Public (CHU)</option>
                    <option value="CLINIC">Clinique Privée</option>
                    <option value="DIALYSIS">Centre de Dialyse</option>
                    <option value="EHPAD">EHPAD / Résidence</option>
                    <option value="REHAB">Centre de Rééducation (SSR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-on-surface mb-1">Adresse physique *</label>
                  <input
                    type="text"
                    required
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Route de Châteauboeuf"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">Commune 972 *</label>
                  <select
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs outline-none focus:border-primary"
                  >
                    {MARTINIQUE_COMMUNES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-outline-variant/20">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">Cadre Coordinateur Référent *</label>
                  <input
                    type="text"
                    required
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    placeholder="Marie-Paule Valaire"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1">Téléphone direct régulation *</label>
                  <input
                    type="tel"
                    required
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    placeholder="0596 55 20 00"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">Email de liaison *</label>
                <input
                  type="email"
                  required
                  value={formContactEmail}
                  onChange={(e) => setFormContactEmail(e.target.value)}
                  placeholder="coordination.transports@chu-martinique.fr"
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">
                  Services hospitaliers initiaux (séparés par des virgules) :
                </label>
                <input
                  type="text"
                  value={formDepartments}
                  onChange={(e) => setFormDepartments(e.target.value)}
                  placeholder="Cardiologie, Néphrologie, Oncologie, Chirurgie Ambulatoire..."
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); setEditingFacility(null); }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>{editingFacility ? 'Mettre à jour' : 'Créer l\'établissement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : RÉINITIALISATION DU MOT DE PASSE COORDINATEUR                    */}
      {/* ========================================================================= */}
      {passwordModalFacility && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 my-8">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                  <span className="material-symbols-outlined text-xl">key</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Accès Coordinateur Hospitalier</h3>
                  <span className="text-[11px] text-on-surface-variant">
                    {passwordModalFacility.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalFacility(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmPasswordReset} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">
                  Nouveau mot de passe de connexion au portail soignant :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={facilityPasswordValue}
                    onChange={(e) => setFacilityPasswordValue(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono font-bold text-xs text-on-surface outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setFacilityPasswordValue(`CH972-${Math.random().toString(36).slice(-5).toUpperCase()}!`)}
                    className="px-3 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-base">autorenew</span>
                  </button>
                </div>
              </div>

              {passwordFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1 text-emerald-800">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>Accès mis à jour avec succès !</span>
                  </div>
                  <div className="font-mono text-xs font-bold bg-white p-2 rounded-lg border border-emerald-200 select-all">
                    {passwordFeedback}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setPasswordModalFacility(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>Enregistrer le mot de passe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 max-w-md bg-surface-container-lowest text-on-surface p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 border border-outline-variant/40 animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base">check_circle</span>
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-on-surface text-sm">{toastMessage.title}</div>
            <p className="text-on-surface-variant mt-0.5 leading-relaxed">{toastMessage.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
    </AdminLayout>
  );
};
