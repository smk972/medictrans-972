import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { AdminSeoSubnav } from '../../components/admin/AdminSeoSubnav';
import { blogService } from '../../services/blogService';
import { aiSeoService } from '../../services/aiSeoService';
import { SeoIdea } from '../../types/blog';

export const AdminSeoIdeasPage: React.FC = () => {
  const [ideas, setIdeas] = useState<SeoIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New idea form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newIntent, setNewIntent] = useState<'informational' | 'transactional' | 'navigational'>('informational');
  const [newAudience, setNewAudience] = useState<'patient' | 'transporter' | 'facility' | 'general'>('patient');
  const [newPriority, setNewPriority] = useState<number>(3);
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    setLoading(true);
    try {
      const data = await blogService.getIdeas();
      setIdeas(data);
    } catch (err) {
      console.error('Erreur chargement idées:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    try {
      await blogService.createIdea({
        topic: newTopic,
        primary_keyword: newKeyword || null,
        search_intent: newIntent,
        target_audience: newAudience,
        priority: newPriority,
        status: 'pending',
        notes: newNotes || null,
      });
      setMessage({ type: 'success', text: 'Nouvelle idée ajoutée au pipeline !' });
      setShowAddForm(false);
      setNewTopic('');
      setNewKeyword('');
      setNewNotes('');
      await loadIdeas();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la création.' });
    }
  };

  const handleGenerateIdeasAi = async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const generated = await aiSeoService.generateIdeas({
        theme: 'transport sanitaire martinique, vsl, ambulance, droits cpam, prescription médicale de transport',
        count: 4,
      });

      for (const item of generated) {
        await blogService.createIdea({
          topic: item.topic,
          primary_keyword: item.primaryKeyword || null,
          search_intent: (item.searchIntent as any) || 'informational',
          target_audience: (item.targetAudience as any) || 'patient',
          priority: item.priority || 4,
          status: 'pending',
          notes: item.notes || 'Généré automatiquement par l’IA Clinigo',
        });
      }

      setMessage({
        type: 'success',
        text: `${generated.length} nouvelles opportunités SEO suggérées par l'IA et ajoutées au pipeline !`,
      });
      await loadIdeas();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la génération des idées IA.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (ideaId: string, newStatus: SeoIdea['status']) => {
    try {
      await blogService.updateIdea(ideaId, { status: newStatus });
      await loadIdeas();
    } catch (err: any) {
      console.error('Erreur statut idée:', err);
    }
  };

  return (
    <AdminLayout
      title="Idées de Contenus & Pipeline SEO"
      subtitle="Identification des opportunités de recherche et planification éditoriale."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateIdeasAi}
            disabled={generating}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base text-amber-300">auto_awesome</span>
            <span>{generating ? 'Recherche IA...' : 'Idées avec l\'IA'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Ajouter une idée</span>
          </button>
        </div>
      }
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

      {/* Formulaire Nouvel Idée (Repliable) */}
      {showAddForm && (
        <form onSubmit={handleCreateIdea} className="mb-6 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-on-surface">Ajouter une opportunité de sujet SEO</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-on-surface-variant mb-1">
                Sujet / Titre de travail <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={newTopic}
                onChange={e => setNewTopic(e.target.value)}
                placeholder="Ex: Comment déclarer son transport médical aux impôts ?"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Mot-clé principal associé
              </label>
              <input
                type="text"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="Ex: transport médical impôts déduction"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Public visé
              </label>
              <select
                value={newAudience}
                onChange={e => setNewAudience(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              >
                <option value="patient">Patient / Famille</option>
                <option value="transporter">Transporteur Sanitaire</option>
                <option value="facility">Établissement de Santé</option>
                <option value="general">Général</option>
              </select>
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
                <option value="informational">Informationnelle (Comment, Pourquoi)</option>
                <option value="transactional">Transactionnelle (Réserver, Devis)</option>
                <option value="navigational">Navigationnelle (Clinigo Martinique)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Priorité (1 = Basse, 5 = Très Haute)
              </label>
              <select
                value={newPriority}
                onChange={e => setNewPriority(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              >
                <option value={1}>1 - Basse</option>
                <option value={2}>2 - Moyenne</option>
                <option value={3}>3 - Standard</option>
                <option value={4}>4 - Haute</option>
                <option value={5}>5 - Priorité Maximale</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-on-surface-variant mb-1">
                Notes ou angle recommandé
              </label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Ressources ameli.fr à citer, cas particuliers..."
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs"
            >
              Enregistrer l'idée
            </button>
          </div>
        </form>
      )}

      {/* Pipeline Grid des Idées */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-on-surface">
            Pipeline éditorial ({ideas.length} sujet{ideas.length > 1 ? 's' : ''})
          </h2>
          <span className="text-xs text-on-surface-variant">
            Workflow : Idée → Plan → Rédaction IA → Validation Humaine → Publication
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-on-surface-variant">Chargement des idées...</div>
        ) : ideas.length === 0 ? (
          <div className="py-12 text-center text-xs text-on-surface-variant">
            Aucune idée de sujet dans le pipeline. Cliquez sur "Idées avec l'IA" pour en générer automatiquement.
          </div>
        ) : (
          <div className="space-y-3">
            {ideas.map(idea => (
              <div
                key={idea.id}
                className="p-4 rounded-2xl bg-surface-container-low/40 border border-outline-variant/20 hover:border-primary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-on-surface">
                      {idea.topic}
                    </span>
                    <span className="px-2 py-0.2 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
                      P{idea.priority}
                    </span>
                    <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[10px] capitalize">
                      {idea.target_audience}
                    </span>
                    <span className="px-2 py-0.2 rounded-md bg-sky-50 text-sky-800 text-[10px] capitalize">
                      {idea.search_intent}
                    </span>
                  </div>

                  {idea.primary_keyword && (
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-outline">key</span>
                      <span>Mot-clé : <strong>{idea.primary_keyword}</strong></span>
                    </div>
                  )}

                  {idea.notes && (
                    <p className="text-[11px] text-on-surface-variant line-clamp-2">
                      {idea.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <select
                    value={idea.status}
                    onChange={e => handleUpdateStatus(idea.id, e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface focus:outline-none"
                  >
                    <option value="pending">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Rédigé</option>
                    <option value="rejected">Rejeté</option>
                  </select>

                  <Link
                    to={`/admin/seo/articles/new?ideaId=${idea.id}&auto=1`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 transition-all"
                    title="Rédiger immédiatement l'article complet avec l'IA"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Rédiger</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
