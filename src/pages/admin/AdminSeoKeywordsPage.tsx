import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { AdminSeoSubnav } from '../../components/admin/AdminSeoSubnav';
import { blogService } from '../../services/blogService';
import { SeoKeyword } from '../../types/blog';

export const AdminSeoKeywordsPage: React.FC = () => {
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [newIntent, setNewIntent] = useState<'informational' | 'transactional' | 'navigational'>('informational');
  const [newAudience, setNewAudience] = useState<'patient' | 'transporter' | 'facility' | 'general'>('patient');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    setLoading(true);
    try {
      const data = await blogService.getKeywords();
      setKeywords(data);
    } catch (err) {
      console.error('Erreur chargement mots-clés:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      await blogService.createKeyword({
        keyword: newKeyword.trim().toLowerCase(),
        search_volume: null, // Règle N°6 : Pas d'API connectée = NULL
        competition: null,
        target_audience: newAudience,
        intent: newIntent,
      });
      setMessage({ type: 'success', text: `Mot-clé "${newKeyword}" ajouté avec succès !` });
      setNewKeyword('');
      await loadKeywords();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l’ajout du mot-clé.' });
    }
  };

  return (
    <AdminLayout
      title="Gestion des Mots-Clés Stratégiques"
      subtitle="Cartographie des requêtes cibles pour le référencement naturel de Clinigo."
    >
      <AdminSeoSubnav />

      {message && (
        <div
          className={`mb-6 p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="hover:opacity-75">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Règle N°6 Notice */}
      <div className="mb-6 p-4 rounded-2xl bg-surface-container-low/80 border border-outline-variant/30 flex items-start gap-3 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-base text-primary shrink-0 mt-0.5">info</span>
        <div>
          <strong className="text-on-surface">Transparence des Données de Volume :</strong>
          <p className="mt-0.5">
            Conformément à la politique de précision Clinigo, en l'absence de clé API SEO connectée (Semrush / Ahrefs / Google Search Console), les volumes de recherche et difficultés sont affichés comme <em>Non disponible</em> et ne sont jamais extrapolés artificiellement.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche (1/3) : Ajouter un mot-clé */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Ajouter un mot-clé cible</h3>
          <form onSubmit={handleAddKeyword} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Mot-clé ou expression <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="Ex: transport vsl martinique"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Intention de recherche
              </label>
              <select
                value={newIntent}
                onChange={e => setNewIntent(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              >
                <option value="informational">Informationnelle</option>
                <option value="transactional">Transactionnelle</option>
                <option value="navigational">Navigationnelle</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Public cible
              </label>
              <select
                value={newAudience}
                onChange={e => setNewAudience(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              >
                <option value="patient">Patient / Famille</option>
                <option value="transporter">Transporteur Sanitaire</option>
                <option value="facility">Établissement</option>
                <option value="general">Général</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 transition-all mt-2"
            >
              Ajouter au référentiel
            </button>
          </form>
        </div>

        {/* Colonne Droite (2/3) : Table des mots-clés */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-on-surface">
              Mots-clés ciblés ({keywords.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">Chargement...</div>
          ) : keywords.length === 0 ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              Aucun mot-clé enregistré. Utilisez le formulaire pour en ajouter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface-variant font-semibold">
                    <th className="pb-3 pl-1">Mot-clé</th>
                    <th className="pb-3">Intention</th>
                    <th className="pb-3">Cible</th>
                    <th className="pb-3">Volume de recherche</th>
                    <th className="pb-3">Concurrence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {keywords.map(kw => (
                    <tr key={kw.id} className="hover:bg-surface-container-low/40">
                      <td className="py-3 pl-1 font-bold text-on-surface">
                        {kw.keyword}
                      </td>
                      <td className="py-3 capitalize text-on-surface-variant">
                        {kw.intent}
                      </td>
                      <td className="py-3 capitalize text-on-surface-variant">
                        {kw.target_audience}
                      </td>
                      <td className="py-3 text-outline">
                        {kw.search_volume !== null ? `${kw.search_volume}/mois` : 'Non disponible'}
                      </td>
                      <td className="py-3 text-outline">
                        {kw.competition !== null ? `${kw.competition}%` : 'Non disponible'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
