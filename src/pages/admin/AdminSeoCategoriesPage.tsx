import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { AdminSeoSubnav } from '../../components/admin/AdminSeoSubnav';
import { blogService } from '../../services/blogService';
import { BlogCategory } from '../../types/blog';

export const AdminSeoCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await blogService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    try {
      await blogService.createCategory({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || null,
      });
      setMessage({ type: 'success', text: `Catégorie "${name}" créée avec succès !` });
      setName('');
      setSlug('');
      setDescription('');
      await loadCategories();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la création de la catégorie.' });
    }
  };

  return (
    <AdminLayout
      title="Gestion des Catégories Éditoriales"
      subtitle="Organisation thématique des articles de blog et silos sémantiques."
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
        {/* Colonne Gauche : Créer une catégorie */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-on-surface">Nouvelle Catégorie</h3>
          <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Nom de la catégorie <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ex: Prise en charge & Démarches"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Slug (/blog/category/...) <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                placeholder="prise-en-charge-demarches"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-on-surface-variant mb-1">
                Description SEO (pour la page catégorie)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Guide complet et articles relatifs aux démarches CPAM..."
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:opacity-95 transition-all mt-2"
            >
              Créer la catégorie
            </button>
          </form>
        </div>

        {/* Colonne Droite : Liste des Catégories */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs p-5">
          <h3 className="text-sm font-bold text-on-surface mb-4">
            Catégories actives ({categories.length})
          </h3>

          {loading ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">Chargement...</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              Aucune catégorie créée.
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="p-4 rounded-xl bg-surface-container-low/40 border border-outline-variant/20 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm text-on-surface flex items-center gap-2">
                      <span>{cat.name}</span>
                      <span className="font-mono text-[11px] text-outline">
                        /blog/category/{cat.slug}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-on-surface-variant mt-1">{cat.description}</p>
                    )}
                  </div>
                  <a
                    href={`/blog/category/${cat.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors shrink-0"
                    title="Voir la page publique"
                  >
                    <span className="material-symbols-outlined text-base">open_in_new</span>
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
