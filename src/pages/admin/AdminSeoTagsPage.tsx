import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { AdminSeoSubnav } from '../../components/admin/AdminSeoSubnav';
import { blogService } from '../../services/blogService';
import { BlogTag } from '../../types/blog';

export const AdminSeoTagsPage: React.FC = () => {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const data = await blogService.getTags();
      setTags(data);
    } catch (err) {
      console.error('Erreur chargement tags:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      await blogService.createTag({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
      });
      setMessage({ type: 'success', text: `Tag #${name} créé avec succès !` });
      setName('');
      setSlug('');
      await loadTags();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la création du tag.' });
    }
  };

  return (
    <AdminLayout
      title="Gestion des Tags Sémantiques"
      subtitle="Étiquettes transversales pour le maillage et la découverte des articles."
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche : Ajouter un Tag */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Nouveau Tag</h3>
          <form onSubmit={handleCreateTag} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Libellé du tag <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ex: Martinique 972"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Slug (/blog/tag/...) <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                placeholder="martinique-972"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 transition-all mt-2"
            >
              Créer le tag
            </button>
          </form>
        </div>

        {/* Colonne Droite : Liste des Tags */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs p-5">
          <h3 className="text-sm font-bold text-on-surface mb-4">
            Tags enregistrés ({tags.length})
          </h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">Chargement...</div>
          ) : tags.length === 0 ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              Aucun tag enregistré.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className="px-3 py-2 rounded-xl bg-surface-container-low/60 border border-outline-variant/20 flex items-center gap-2"
                >
                  <span className="font-bold text-xs text-on-surface">#{tag.name}</span>
                  <a
                    href={`/blog/tag/${tag.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-on-surface-variant hover:text-primary transition-colors"
                    title="Voir les articles"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
