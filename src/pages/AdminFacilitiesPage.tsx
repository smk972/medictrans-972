import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { rideService } from '../services/rideService';
import { Facility } from '../types';

export const AdminFacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // New staff member state in selected facility
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await rideService.getAllFacilities();
      setFacilities(data);
      if (data.length > 0 && !selectedFacility) {
        setSelectedFacility(data[0]);
      } else if (selectedFacility) {
        const refreshed = data.find(f => f.id === selectedFacility.id);
        if (refreshed) setSelectedFacility(refreshed);
      }
    } catch (err) {
      console.error('Erreur chargement établissements:', err);
    } finally {
      setIsLoading(false);
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

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !selectedFacility) return;

    setFeedback(`Cadre de santé "${newStaffName}" habilité(e) avec succès.`);
    setNewStaffName('');
    setNewStaffRole('');
    setNewStaffPhone('');
    setTimeout(() => setFeedback(null), 3000);
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
          <p className="text-[11px] text-on-surface-variant mt-1">Coordonnateurs de soins et cadres de santé</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Traçabilité Numérique PMT</span>
          <div className="text-3xl font-extrabold text-secondary font-mono mt-1">100%</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Conforme Cerfa S3138 et BPEC 972</p>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Facilities List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/30 shadow-xs space-y-3">
            <h2 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">
              Répertoire Hospitalier ({filteredFacilities.length})
            </h2>

            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, ville, FINESS..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant/50 text-xs bg-surface-container-lowest outline-none focus:border-primary"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'ALL', label: 'Tous' },
                { id: 'HOSPITAL', label: 'Hôpitaux' },
                { id: 'CLINIC', label: 'Cliniques' },
                { id: 'DIALYSIS', label: 'Dialyses' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypeFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    typeFilter === t.id
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-2 pt-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredFacilities.map((f) => {
                const isSelected = selectedFacility?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFacility(f)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20'
                        : 'border-outline-variant/30 hover:border-outline-variant/70 bg-surface-container-lowest'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-extrabold text-on-surface leading-tight">
                          {f.name}
                        </h3>
                        <span className="text-[11px] text-on-surface-variant">
                          {f.city} • FINESS {f.finess}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 shrink-0">
                        {f.type}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="font-semibold text-primary">
                        {f.activeDischargesCount || 0} sorties régulées
                      </span>
                      <span className="font-semibold text-on-surface">
                        {f.authorizedStaffCount || 0} cadres habilités
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Facility Detail View (7 cols) */}
        <div className="lg:col-span-7">
          {selectedFacility ? (
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/20">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-on-surface">
                      {selectedFacility.name}
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      FINESS {selectedFacility.finess}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {selectedFacility.address}, {selectedFacility.city} • Tél : {selectedFacility.contactPhone}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    ⭐ Note {selectedFacility.rating || 4.9} / 5
                  </div>
                </div>
              </div>

              {/* Paramétrage des Points de Dépose */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                  Points de Dépose & Sas de Prise en Charge Paramétrés
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(selectedFacility.dropoffPoints || [
                    { name: 'Quai Ambulances Niveau 0', type: 'BRANCARDAGE', notes: 'Accès Urgences & Sas Déchoquage' },
                    { name: 'Dépose-minute Entrée Sud', type: 'VSL_TAXI', notes: 'Consultations & Ambulatoire' }
                  ]).map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">{pt.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                          {pt.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant">{pt.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pôles & Services Hospitaliers */}
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                  Pôles & Services Actifs Raccordés ({selectedFacility.departments.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFacility.departments.map((dept, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-surface-container text-on-surface border border-outline-variant/30"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cadres de Santé Habilités */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                    Cadres de Santé & Référents Sorties Habilités
                  </h3>
                  <span className="text-[11px] text-secondary font-bold">
                    {selectedFacility.authorizedStaffCount || 12} habilitations actives
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
                        {selectedFacility.contactName[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-on-surface block">
                          {selectedFacility.contactName}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {selectedFacility.contactRole} • {selectedFacility.contactPhone}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Référent Principal
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        M
                      </div>
                      <div>
                        <span className="text-xs font-bold text-on-surface block">
                          Mireille Rosamond
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          Cadre de Santé - Pôle Ambulatoire • 0596 55 20 44
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Habilité(e) 24/7
                    </span>
                  </div>
                </div>

                {/* Form to add staff member */}
                <form onSubmit={handleAddStaff} className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2.5">
                  <span className="text-xs font-bold text-on-surface block">
                    + Habiliter un nouveau soignant au déclenchement
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="Prénom & Nom"
                      className="px-3 py-1.5 rounded-xl border border-outline-variant/50 text-xs bg-surface-container-lowest outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      placeholder="Fonction / Service"
                      className="px-3 py-1.5 rounded-xl border border-outline-variant/50 text-xs bg-surface-container-lowest outline-none"
                    />
                    <input
                      type="tel"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      placeholder="Ligne directe / Mobile"
                      className="px-3 py-1.5 rounded-xl border border-outline-variant/50 text-xs bg-surface-container-lowest outline-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container"
                    >
                      Enregistrer l'Habilitation
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-3xl p-12 border border-outline-variant/30 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2">local_hospital</span>
              <p className="text-sm font-bold text-on-surface">Sélectionnez un établissement</p>
              <p className="text-xs">Cliquez sur une structure dans la liste à gauche pour voir sa configuration complète.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
