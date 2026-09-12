import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { rideService } from '../services/rideService';
import { Transporter } from '../types';

export const AdminTransportersPage: React.FC = () => {
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [selectedTransporter, setSelectedTransporter] = useState<Transporter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await rideService.getAllTransporters();
      setTransporters(data);
      if (data.length > 0 && !selectedTransporter) {
        setSelectedTransporter(data[0]);
      } else if (selectedTransporter) {
        const refreshed = data.find(t => t.id === selectedTransporter.id);
        if (refreshed) setSelectedTransporter(refreshed);
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
    const newVerified = !transporter.verified;
    await rideService.updateTransporterVerification(transporter.id, newVerified);
    setActionFeedback(
      newVerified
        ? `Agrément validé avec succès pour ${transporter.companyName}.`
        : `Statut suspendu pour ${transporter.companyName}.`
    );
    await loadData();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Fleet Totals
  const totalAmbulances = transporters.reduce((acc, t) => acc + (t.fleetAmbulances || 0), 0);
  const totalVsl = transporters.reduce((acc, t) => acc + (t.fleetVsl || 0), 0);
  const totalTaxis = transporters.reduce((acc, t) => acc + (t.fleetTaxis || 0), 0);
  const totalVehicles = totalAmbulances + totalVsl + totalTaxis;

  return (
    <AdminLayout
      title="Sociétés Conventionnées & Agréments"
      subtitle="Gestion des entreprises de transport sanitaire agréées ARS Martinique et conventionnées CPAM"
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
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                Toutes ({transporters.length})
              </button>
              <button
                onClick={() => setStatusFilter('VERIFIED')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === 'VERIFIED'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                Agréées ({transporters.filter(t => t.verified).length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === 'PENDING'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant'
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
                  <div className="flex items-center gap-2">
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
                    {selectedTransporter.address}, {selectedTransporter.city} • Tél : {selectedTransporter.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleVerification(selectedTransporter)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      selectedTransporter.verified
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        : 'bg-primary text-on-primary hover:bg-primary-container'
                    }`}
                  >
                    {selectedTransporter.verified ? 'Suspendre l\'Agrément' : 'Valider l\'Agrément ARS'}
                  </button>
                </div>
              </div>

              {/* Administrative IDs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Numéro SIRET</span>
                  <span className="font-mono text-xs font-bold text-on-surface">{selectedTransporter.siret}</span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Agrément ARS Martinique</span>
                  <span className="font-mono text-xs font-bold text-primary">{selectedTransporter.arsLicense}</span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20">
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
    </AdminLayout>
  );
};
