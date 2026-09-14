import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { adminService } from '../services/adminService';
import { SystemSettings, AuditLog } from '../types';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, logs] = await Promise.all([
        adminService.getSettings(),
        adminService.getAuditLogs()
      ]);
      setSettings(s);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Erreur chargement paramètres:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const updated = await adminService.updateSettings(settings);
      setSettings(updated);
      setActionFeedback('Paramètres système et barème CPAM enregistrés avec succès.');
      const refreshedLogs = await adminService.getAuditLogs();
      setAuditLogs(refreshedLogs);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'enregistrement des paramètres');
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchType = logFilter === 'ALL' || log.targetType === logFilter;
    const q = logSearch.toLowerCase().trim();
    const matchSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.adminEmail.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  return (
    <AdminLayout
      title="Paramètres Généraux & Audit Trail"
      subtitle="Barème CPAM 972, alertes régionales et traçabilité inviolable des actes d'administration"
      actions={
        <div className="flex items-center gap-2">
          <a
            href="/Guide_Administrateur_MedicTrans_972.pdf"
            download="Guide_Administrateur_MedicTrans_972.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold shadow-xs hover:bg-secondary/90 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            <span>Télécharger le Guide PDF</span>
          </a>
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
      {actionFeedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
          <span>{actionFeedback}</span>
        </div>
      )}

      {settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6 mb-8">
          {/* Section 1: Bannière d'Alerte Régionale */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-amber-600 text-2xl">campaign</span>
                <div>
                  <h2 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">
                    Bandeau d'Alerte Régionale (Météo / Crise Sanitaire)
                  </h2>
                  <p className="text-[11px] text-on-surface-variant">
                    Diffusé en haut de page à tous les utilisateurs (patients, hôpitaux, transporteurs)
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold text-on-surface">
                  {settings.bannerActive ? 'Bannière Activée' : 'Bannière Désactivée'}
                </span>
                <input
                  type="checkbox"
                  checked={settings.bannerActive}
                  onChange={e => setSettings({ ...settings, bannerActive: e.target.checked })}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">Niveau d'Alerte</label>
                <select
                  value={settings.bannerLevel}
                  onChange={e => setSettings({ ...settings, bannerLevel: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-bold outline-none focus:border-primary"
                >
                  <option value="INFO">Information Générale (Bleu)</option>
                  <option value="WARNING">Vigilance Jaune / Orange (Orange)</option>
                  <option value="DANGER">Alerte Cyclonique / Danger Sanitaire (Rouge)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-on-surface block mb-1">Message Diffusé</label>
                <input
                  type="text"
                  value={settings.bannerText}
                  onChange={e => setSettings({ ...settings, bannerText: e.target.value })}
                  placeholder="Ex: Météo France : Vigilance jaune fortes pluies et orages sur l'île. Anticipez les temps de trajet."
                  className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Barème Conventionnel CPAM 972 */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-2xl">payments</span>
              <div>
                <h2 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">
                  Barème Conventionnel CPAM & CGSS Martinique
                </h2>
                <p className="text-[11px] text-on-surface-variant">
                  Tarifs officiels applicables aux transports sanitaires terrestres prescrits en Martinique
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                <span className="font-bold text-on-surface block">Forfait Prise en Charge Ambulances</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.cpamBaseForfaitAmbulance}
                    onChange={e => setSettings({ ...settings, cpamBaseForfaitAmbulance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest font-mono font-bold text-xs outline-none"
                  />
                  <span className="font-bold text-on-surface">€</span>
                </div>
                <span className="text-[10px] text-on-surface-variant">Forfait d'intervention départemental</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                <span className="font-bold text-on-surface block">Tarif Kilométrique Sanitaire</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={settings.cpamRatePerKm}
                    onChange={e => setSettings({ ...settings, cpamRatePerKm: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest font-mono font-bold text-xs outline-none"
                  />
                  <span className="font-bold text-on-surface">€/km</span>
                </div>
                <span className="text-[10px] text-on-surface-variant">Calculé selon distance réelle</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                <span className="font-bold text-on-surface block">Forfait Prise en Charge VSL</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={settings.cpamBaseForfaitVsl}
                    onChange={e => setSettings({ ...settings, cpamBaseForfaitVsl: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest font-mono font-bold text-xs outline-none"
                  />
                  <span className="font-bold text-on-surface">€</span>
                </div>
                <span className="text-[10px] text-on-surface-variant">Véhicule sanitaire léger</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                <span className="font-bold text-on-surface block">Rayonnement Dispatch par défaut</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.defaultDispatchRadiusKm}
                    onChange={e => setSettings({ ...settings, defaultDispatchRadiusKm: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest font-mono font-bold text-xs outline-none"
                  />
                  <span className="font-bold text-on-surface">km</span>
                </div>
                <span className="text-[10px] text-on-surface-variant">Zone d'attribution prioritaire</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                <span className="font-bold text-on-surface block">Majoration Nuit, Dimanche & Jours Fériés</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.cpamNightSundaySurchargePercent}
                    onChange={e => setSettings({ ...settings, cpamNightSundaySurchargePercent: parseInt(e.target.value) || 0 })}
                    className="w-32 p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest font-mono font-bold text-xs outline-none"
                  />
                  <span className="font-bold text-on-surface">%</span>
                </div>
                <span className="text-[10px] text-on-surface-variant">Conformément aux avenants conventionnels CGSS</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-1">
                <span className="font-bold text-on-surface block">Délai limite d'annulation sans pénalité</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.cancellationThresholdHours}
                    onChange={e => setSettings({ ...settings, cancellationThresholdHours: parseInt(e.target.value) || 0 })}
                    className="w-32 p-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest font-mono font-bold text-xs outline-none"
                  />
                  <span className="font-bold text-on-surface">heures avant départ</span>
                </div>
                <span className="text-[10px] text-on-surface-variant">Au-delà de ce délai, contact direct obligatoire avec le dispatch</span>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Enregistrer la Configuration
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Section 3: Audit Trail & Traçabilité Inviolable */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-purple-700 text-2xl">verified_user</span>
            <div>
              <h2 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">
                Journal d'Audit Trail des Actes d'Administration ({auditLogs.length})
              </h2>
              <p className="text-[11px] text-on-surface-variant">
                Registre inviolable de chaque modification, création, réinitialisation de mot de passe ou suppression
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              placeholder="Filtrer les actions..."
              className="p-1.5 px-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs outline-none focus:border-primary w-44"
            />
            <select
              value={logFilter}
              onChange={e => setLogFilter(e.target.value)}
              className="p-1.5 px-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-bold outline-none"
            >
              <option value="ALL">Toutes les cibles</option>
              <option value="CLIENT">Fiches Clients</option>
              <option value="FACILITY">Établissements</option>
              <option value="TRANSPORTER">Transporteurs</option>
              <option value="USER">Comptes Utilisateurs</option>
              <option value="SETTINGS">Paramètres</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                <th className="p-3">Horodatage</th>
                <th className="p-3">Administrateur</th>
                <th className="p-3">Action Réalisée</th>
                <th className="p-3">Cible</th>
                <th className="p-3">Détails de l'Opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-surface-container-lowest/80 transition-colors">
                  <td className="p-3 font-mono text-[11px] text-on-surface-variant shrink-0">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </td>
                  <td className="p-3 font-mono text-primary font-bold">
                    {log.adminEmail}
                  </td>
                  <td className="p-3">
                    <span className="font-extrabold text-on-surface">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/30">
                      {log.targetType}
                    </span>
                  </td>
                  <td className="p-3 text-on-surface-variant">
                    {log.details}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                    Aucun événement d'audit ne correspond à vos filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
