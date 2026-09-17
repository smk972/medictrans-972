import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { SEOHead } from '../../components/SEOHead';
import { blogService } from '../../services/blogService';
import { BlogPost, BlogTag } from '../../types/blog';

export const BlogTagPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tag, setTag] = useState<BlogTag | null>(null);
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadTagData(slug);
    }
  }, [slug]);

  const loadTagData = async (tagSlug: string) => {
    setLoading(true);
    try {
      const allTags = await blogService.getTags();
      const currentTag = allTags.find(t => t.slug === tagSlug);
      setTag(currentTag || null);

      if (currentTag) {
        const posts = await blogService.getPosts({
          status: 'published',
          tagId: currentTag.id,
        });
        setArticles(posts);
      }
    } catch (err) {
      console.error('Erreur chargement tag:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 text-slate-500">
          Chargement du tag...
        </main>
        <Footer />
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <SEOHead
          title="Tag non trouvé | Clinigo"
          description="Ce tag n'existe pas."
          noIndex={false}
        />
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <h1 className="text-2xl font-black text-slate-900">Tag introuvable</h1>
          <Link
            to="/blog"
            className="mt-6 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs"
          >
            Retour au Blog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      <SEOHead
        title={`Articles tagués #${tag.name} | Clinigo`}
        description={`Tous les articles et dossiers relatifs au mot-clé ${tag.name} en Martinique.`}
        canonicalPath={`/blog/tag/${tag.slug}`}
      />

      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-slate-900 transition-colors">Guides &amp; Blog</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">#{tag.name}</span>
        </nav>

        <header className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-sm">tag</span>
            <span>Tag Thématique</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            #{tag.name}
          </h1>
          <p className="text-slate-600 text-sm mt-2">
            {articles.length} article{articles.length > 1 ? 's' : ''} associé{articles.length > 1 ? 's' : ''}
          </p>
        </header>

        {articles.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Aucun article publié avec ce tag</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(art => (
              <article
                key={art.id}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={art.featured_image || '/assets/medictrans_hero_discover.jpg'}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug line-clamp-2">
                      <Link to={`/blog/${art.slug}`}>
                        {art.title}
                      </Link>
                    </h3>
                    {art.excerpt && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {art.excerpt}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-5 pb-5 pt-2 flex items-center justify-end border-t border-slate-100">
                  <Link
                    to={`/blog/${art.slug}`}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-0.5"
                  >
                    <span>Consulter</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
