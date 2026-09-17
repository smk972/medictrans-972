import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { AdminSeoSubnav } from '../../components/admin/AdminSeoSubnav';
import { blogService } from '../../services/blogService';
import { BlogRedirect, SeoSettings } from '../../types/blog';

export const AdminSeoSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SeoSettings | null>(null);
  const [redirects, setRedirects] = useState<BlogRedirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New redirect form
  const [sourcePath, setSourcePath] = useState('');
  const [targetPath, setTargetPath] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sett, redirs] = await Promise.all([
        blogService.getSettings(),
        blogService.getRedirects(),
      ]);
      setSettings(sett);
      setRedirects(redirs);
    } catch (err) {
      console.error('Erreur chargement paramètres SEO:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await blogService.updateSettings(settings);
      setSettings(updated);
      setMessage({ type: 'success', text: 'Paramètres SEO globaux enregistrés avec succès !' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l’enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcePath.trim() || !targetPath.trim()) return;

    try {
      await blogService.createRedirect(sourcePath.trim(), targetPath.trim());
      setMessage({ type: 'success', text: `Redirection 301 de ${sourcePath} vers ${targetPath} enregistrée !` });
      setSourcePath('');
      setTargetPath('');
      const updatedRedirs = await blogService.getRedirects();
      setRedirects(updatedRedirs);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la création de la redirection.' });
    }
  };

  const handleRunScheduler = async () => {
    setRunningCron(true);
    setMessage(null);
    try {
      const publishedCount = await blogService.publishScheduledPosts();
      setMessage({
        type: 'success',
        text: `Cycle de publication idempotent exécuté : ${publishedCount} article(s) programmé(s) passé(s) en ligne.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur exécution scheduler.' });
    } finally {
      setRunningCron(false);
    }
  };

  return (
    <AdminLayout
      title="Paramètres SEO & Redirections 301"
      subtitle="Balisage global, source de vérité, robots.txt et gestion des slugs modifiés."
      actions={
        <button
          type="button"
          onClick={handleRunScheduler}
          disabled={runningCron}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-colors disabled:opacity-50"
          title="Exécute le passage des articles programmés à l'état publié si la date est atteinte (idempotent)"
        >
          <span className="material-symbols-outlined text-base text-sky-600">schedule</span>
          <span>{runningCron ? 'Vérification...' : 'Exécuter Scheduler'}</span>
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Paramètres Généraux */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">public</span>
            <span>Configuration Canonique &amp; Métadonnées</span>
          </h3>

          {loading || !settings ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">Chargement...</div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">
                  Nom du site / Marque
                </label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={e => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">
                  URL de base canonique (Règle N°9)
                </label>
                <input
                  type="url"
                  value={settings.canonical_base_url}
                  onChange={e => setSettings({ ...settings, canonical_base_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs font-mono text-on-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">
                  Modèle de titre (Title Template)
                </label>
                <input
                  type="text"
                  value={settings.title_template}
                  onChange={e => setSettings({ ...settings, title_template: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">
                  Description SEO par défaut
                </label>
                <textarea
                  rows={3}
                  value={settings.default_meta_description}
                  onChange={e => setSettings({ ...settings, default_meta_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface-variant mb-1">
                  Image de partage OpenGraph par défaut
                </label>
                <input
                  type="text"
                  value={settings.default_og_image}
                  onChange={e => setSettings({ ...settings, default_og_image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="auto_sitemap"
                  checked={settings.auto_sitemap_ping}
                  onChange={e => setSettings({ ...settings, auto_sitemap_ping: e.target.checked })}
                  className="rounded text-primary focus:ring-0"
                />
                <label htmlFor="auto_sitemap" className="font-medium text-on-surface cursor-pointer select-none">
                  Ping automatique Google lors d'une nouvelle publication
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 transition-all mt-3 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
              </button>
            </form>
          )}
        </div>

        {/* Redirections 301 (Règle N°11) */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-amber-600">alt_route</span>
              <span>Gestion des Redirections 301 (blog_redirects)</span>
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Préserve le « jus SEO » lorsqu'un article publié change de slug. Évite les erreurs 404 et les chaînes de redirections.
            </p>
          </div>

          {/* Formulaire ajout manuel */}
          <form onSubmit={handleAddRedirect} className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 space-y-2 text-xs">
            <div className="font-semibold text-on-surface">Ajouter une redirection permanente :</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="/blog/ancien-slug"
                value={sourcePath}
                onChange={e => setSourcePath(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest font-mono text-[11px] text-on-surface focus:outline-none"
              />
              <input
                type="text"
                required
                placeholder="/blog/nouveau-slug"
                value={targetPath}
                onChange={e => setTargetPath(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest font-mono text-[11px] text-on-surface focus:outline-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs transition-colors"
              >
                Créer la redirection 301
              </button>
            </div>
          </form>

          {/* Table des redirections */}
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            {redirects.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-4 text-center">
                Aucune redirection enregistrée pour le moment.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface-variant font-semibold">
                    <th className="pb-2">Origine</th>
                    <th className="pb-2">Destination</th>
                    <th className="pb-2 text-center">Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 font-mono text-[11px]">
                  {redirects.map(r => (
                    <tr key={r.id}>
                      <td className="py-2 text-rose-700 font-medium truncate max-w-[150px]">{r.source_path}</td>
                      <td className="py-2 text-emerald-700 font-medium truncate max-w-[150px]">{r.target_path}</td>
                      <td className="py-2 text-center text-outline">{r.status_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
