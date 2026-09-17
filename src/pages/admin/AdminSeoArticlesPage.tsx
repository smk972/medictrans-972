import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { AdminSeoSubnav } from '../../components/admin/AdminSeoSubnav';
import { blogService } from '../../services/blogService';
import { BlogPost, BlogPostStatus, ContentSensitivity } from '../../types/blog';

export const AdminSeoArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sensitivityFilter, setSensitivityFilter] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await blogService.getPosts({ status: 'all' });
      setArticles(data);
    } catch (err) {
      console.error('Erreur chargement articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    const newStatus: BlogPostStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await blogService.updatePost(post.id, {
        status: newStatus,
        published_at: newStatus === 'published' ? (post.published_at || new Date().toISOString()) : null,
      });
      setMessage({
        type: 'success',
        text: `L'article "${post.title}" est désormais ${newStatus === 'published' ? 'publié en ligne' : 'en brouillon'}.`,
      });
      await loadArticles();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive de l'article "${post.title}" ?`)) {
      return;
    }
    try {
      await blogService.deletePost(post.id);
      setMessage({ type: 'success', text: `Article "${post.title}" supprimé avec succès.` });
      await loadArticles();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la suppression.' });
    }
  };

  const filteredArticles = articles.filter(post => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.target_keyword && post.target_keyword.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesSensitivity = sensitivityFilter === 'all' || post.content_sensitivity === sensitivityFilter;

    return matchesSearch && matchesStatus && matchesSensitivity;
  });

  const getSensitivityBadge = (level: ContentSensitivity) => {
    switch (level) {
      case 'REGULATORY_INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300" title="⚠ Vérification recommandée avant publication (Réglementaire)">
            <span className="material-symbols-outlined text-xs">gavel</span>
            <span>Réglementaire</span>
          </span>
        );
      case 'MEDICAL_INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300" title="⚠ Vérification recommandée avant publication (Médical)">
            <span className="material-symbols-outlined text-xs">medical_services</span>
            <span>Médical</span>
          </span>
        );
      case 'GENERAL_INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
            <span>Général</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: BlogPostStatus) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Publié</span>;
      case 'review':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">En relecture</span>;
      case 'scheduled':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">Programmé</span>;
      case 'archived':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">Archivé</span>;
      case 'draft':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">Brouillon</span>;
    }
  };

  return (
    <AdminLayout
      title="Gestion des Articles de Blog"
      subtitle="Rédaction, optimisation SEO, cycle de validation et programmation des publications."
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/seo/articles/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-md shadow-primary/20 hover:opacity-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Créer un article</span>
          </Link>
        </div>
      }
    >
      <AdminSeoSubnav />

      {message && (
        <div
          className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
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

      {/* Barre de Filtres & Recherche */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher par titre, slug, mot-clé..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillons</option>
            <option value="review">En relecture</option>
            <option value="scheduled">Programmés</option>
            <option value="published">Publiés</option>
            <option value="archived">Archivés</option>
          </select>

          <select
            value={sensitivityFilter}
            onChange={e => setSensitivityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
          >
            <option value="all">Toutes sensibilités</option>
            <option value="GENERAL_INFO">Information Générale</option>
            <option value="REGULATORY_INFO">Information Réglementaire</option>
            <option value="MEDICAL_INFO">Information Médicale</option>
          </select>

          <span className="text-xs text-on-surface-variant ml-2 font-medium">
            {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table des Articles */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-on-surface-variant">Chargement des articles...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-12 text-center text-xs text-on-surface-variant">
            Aucun article ne correspond à votre recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-on-surface-variant font-bold">
                  <th className="py-3.5 px-4">Article</th>
                  <th className="py-3.5 px-3">Sensibilité</th>
                  <th className="py-3.5 px-3">Statut</th>
                  <th className="py-3.5 px-3 text-center">Score SEO interne</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredArticles.map(post => (
                  <tr key={post.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-on-surface truncate" title={post.title}>
                        {post.title}
                      </div>
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px]">/blog/{post.slug}</span>
                        {post.target_keyword && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                            KW: {post.target_keyword}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      {getSensitivityBadge(post.content_sensitivity || 'GENERAL_INFO')}
                    </td>
                    <td className="py-3.5 px-3">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                        (post.seo_score || 0) >= 80 ? 'bg-emerald-100 text-emerald-800' :
                        (post.seo_score || 0) >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {post.seo_score || 0}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-on-surface-variant">
                      <div className="text-[11px]">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString('fr-FR') : (post.created_at ? new Date(post.created_at).toLocaleDateString('fr-FR') : '-')}
                      </div>
                      <div className="text-[10px] text-outline">
                        {post.published_at ? 'Publié' : 'Créé'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Bouton Voir en direct si publié */}
                        {post.status === 'published' && (
                          <Link
                            to={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Consulter l'article public en direct (Indexable Google)"
                          >
                            <span className="material-symbols-outlined text-base">public</span>
                          </Link>
                        )}

                        {/* Bouton Aperçu */}
                        <Link
                          to={`/preview/blog/${post.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                          title="Aperçu Sécurisé"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </Link>

                        {/* Bouton Éditer */}
                        <Link
                          to={`/admin/seo/articles/${post.id}/edit`}
                          className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                          title="Modifier l'article"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </Link>

                        {/* Bascule Rapide Publier / Dépublier */}
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(post)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            post.status === 'published'
                              ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:text-emerald-700'
                          }`}
                          title={post.status === 'published' ? 'Passer en brouillon' : 'Publier immédiatement'}
                        >
                          <span className="material-symbols-outlined text-base">
                            {post.status === 'published' ? 'check_circle' : 'publish'}
                          </span>
                        </button>

                        {/* Supprimer */}
                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-rose-50 text-on-surface-variant hover:text-rose-600 transition-colors"
                          title="Supprimer définitivement"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
