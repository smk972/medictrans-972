import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { AdminSeoSubnav } from '../../components/admin/AdminSeoSubnav';
import { blogService } from '../../services/blogService';
import { BlogPost, SeoIdea } from '../../types/blog';

export const AdminSeoOverviewPage: React.FC = () => {
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [ideas, setIdeas] = useState<SeoIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allArticles, allIdeas] = await Promise.all([
        blogService.getPosts(),
        blogService.getIdeas(),
      ]);
      setArticles(allArticles);
      setIdeas(allIdeas);
    } catch (err) {
      console.error('Erreur chargement SEO:', err);
    } finally {
      setLoading(false);
    }
  };

  const publishedCount = articles.filter(a => a.status === 'published').length;
  const draftCount = articles.filter(a => a.status === 'draft' || a.status === 'review').length;
  const scheduledCount = articles.filter(a => a.status === 'scheduled').length;
  const avgSeoScore = articles.length > 0
    ? Math.round(articles.reduce((acc, curr) => acc + (curr.seo_score || 0), 0) / articles.length)
    : 0;

  // Content Decay: Articles publiés il y a plus de 90 jours
  const now = new Date();
  const decayThreshold = 90 * 24 * 60 * 60 * 1000;
  const decayArticles = articles.filter(a => {
    if (a.status !== 'published' || !a.published_at) return false;
    return (now.getTime() - new Date(a.published_at).getTime()) > decayThreshold;
  });

  const getSensitivityBadge = (level: string) => {
    switch (level) {
      case 'REGULATORY_INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300" title="Vérification recommandée avant publication">
            <span className="material-symbols-outlined text-xs">gavel</span>
            <span>Réglementaire</span>
          </span>
        );
      case 'MEDICAL_INFO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300" title="Vérification recommandée avant publication">
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

  const getStatusBadge = (status: string) => {
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
      title="Content Hub SEO & Générateur IA"
      subtitle="Pilotage éditorial, performance SEO interne et rédaction assistée sans CMS externe."
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/seo/articles/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-xs shadow-md shadow-primary/20 hover:opacity-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            <span>Rédiger un article (IA)</span>
          </Link>
        </div>
      }
    >
      <AdminSeoSubnav />

      {/* Bannière Règle de Conformité & Santé Publique */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-amber-900 shadow-2xs">
        <span className="material-symbols-outlined text-xl text-amber-600 shrink-0 mt-0.5">warning</span>
        <div className="text-xs space-y-1">
          <p className="font-bold">
            Gouvernance éditoriale &amp; Contenus Médicaux / Réglementaires :
          </p>
          <p className="text-amber-800 leading-relaxed">
            Les articles touchant aux droits CPAM, barèmes, ALD ou prescriptions médicales doivent obligatoirement faire l'objet d'une validation humaine avant publication. Le <strong>Score SEO interne</strong> évalue la structure sémantique et ne garantit pas la conformité juridique. Supabase constitue la source de vérité de production.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant text-xs mb-1">
            <span>Total Articles</span>
            <span className="material-symbols-outlined text-base text-primary">article</span>
          </div>
          <div className="text-2xl font-extrabold text-on-surface">{loading ? '...' : articles.length}</div>
          <span className="text-[11px] text-on-surface-variant">Dans la base de données</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant text-xs mb-1">
            <span>Articles Publiés</span>
            <span className="material-symbols-outlined text-base text-emerald-600">public</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{loading ? '...' : publishedCount}</div>
          <span className="text-[11px] text-on-surface-variant">Accessibles sur /blog</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant text-xs mb-1">
            <span>Brouillons &amp; Revues</span>
            <span className="material-symbols-outlined text-base text-amber-600">edit_note</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{loading ? '...' : draftCount}</div>
          <span className="text-[11px] text-on-surface-variant">En attente de relecture</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant text-xs mb-1">
            <span>Idées de Sujets</span>
            <span className="material-symbols-outlined text-base text-purple-600">lightbulb</span>
          </div>
          <div className="text-2xl font-extrabold text-purple-600">{loading ? '...' : ideas.length}</div>
          <span className="text-[11px] text-on-surface-variant">Opportunités identifiées</span>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center justify-between text-on-surface-variant text-xs mb-1">
            <span>Score SEO interne</span>
            <span className="material-symbols-outlined text-base text-teal-600">speed</span>
          </div>
          <div className="text-2xl font-extrabold text-teal-700">
            {loading ? '...' : `${avgSeoScore}/100`}
          </div>
          <span className="text-[11px] text-on-surface-variant">Moyenne sémantique</span>
        </div>
      </div>

      {/* Main Grid: Articles Récents & Content Decay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Colonne Gauche (2/3): Articles récents */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-on-surface">Articles récents</h2>
              <p className="text-xs text-on-surface-variant">Dernières publications et brouillons en cours</p>
            </div>
            <Link
              to="/admin/seo/articles"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Voir tout</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">Chargement...</div>
          ) : articles.length === 0 ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              Aucun article pour le moment. Cliquez sur "Rédiger un article" pour démarrer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface-variant font-semibold">
                    <th className="pb-3 pl-1">Article</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3 text-center">Score SEO</th>
                    <th className="pb-3 text-right pr-1">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {articles.slice(0, 5).map(post => (
                    <tr key={post.id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 pl-1 max-w-[280px]">
                        <div className="font-bold text-on-surface truncate" title={post.title}>
                          {post.title}
                        </div>
                        <div className="text-[11px] text-on-surface-variant truncate">
                          /blog/{post.slug}
                        </div>
                      </td>
                      <td className="py-3">
                        {getSensitivityBadge(post.content_sensitivity || 'GENERAL_INFO')}
                      </td>
                      <td className="py-3">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          (post.seo_score || 0) >= 80 ? 'bg-emerald-100 text-emerald-800' :
                          (post.seo_score || 0) >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {post.seo_score || 0}/100
                        </span>
                      </td>
                      <td className="py-3 text-right pr-1">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/preview/blog/${post.id}`}
                            target="_blank"
                            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                            title="Aperçu Sécurisé (noindex)"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </Link>
                          <Link
                            to={`/admin/seo/articles/${post.id}/edit`}
                            className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                            title="Modifier l'article"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Colonne Droite (1/3): Content Decay & Idées */}
        <div className="space-y-6">
          {/* Content Decay Card */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-amber-600">history</span>
              <h3 className="text-sm font-bold text-on-surface">Content Decay (&gt; 90j)</h3>
            </div>
            {decayArticles.length === 0 ? (
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Tous vos articles publiés sont récents ou à jour. Aucun rafraîchissement urgent requis.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant/10 text-xs">
                {decayArticles.map(art => (
                  <li key={art.id} className="py-2.5 flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-on-surface">{art.title}</span>
                    <Link
                      to={`/admin/seo/articles/${art.id}/edit`}
                      className="shrink-0 text-primary hover:underline font-bold text-[11px]"
                    >
                      Mettre à jour
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Idées prioritaires */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">lightbulb</span>
                <h3 className="text-sm font-bold text-on-surface">Idées de Sujets</h3>
              </div>
              <Link to="/admin/seo/ideas" className="text-xs font-semibold text-primary hover:underline">
                Voir tout
              </Link>
            </div>
            {ideas.length === 0 ? (
              <p className="text-xs text-on-surface-variant">Aucune idée enregistrée.</p>
            ) : (
              <div className="space-y-2.5">
                {ideas.slice(0, 3).map(idea => (
                  <div key={idea.id} className="p-2.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/20">
                    <div className="text-xs font-bold text-on-surface">{idea.topic}</div>
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-1.5">
                      <span className="capitalize">{idea.target_audience}</span>
                      <Link
                        to={`/admin/seo/articles/new?ideaId=${idea.id}`}
                        className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        <span>Rédiger</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
