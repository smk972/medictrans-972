import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { SEOHead } from '../../components/SEOHead';
import { blogService } from '../../services/blogService';
import { BlogPost, BlogCategory } from '../../types/blog';

export const BlogCategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<BlogCategory | null>(null);
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadCategoryData(slug);
    }
  }, [slug]);

  const loadCategoryData = async (catSlug: string) => {
    setLoading(true);
    try {
      const allCategories = await blogService.getCategories();
      const currentCat = allCategories.find(c => c.slug === catSlug);
      setCategory(currentCat || null);

      if (currentCat) {
        const posts = await blogService.getPosts({
          status: 'published',
          categoryId: currentCat.id,
        });
        setArticles(posts);
      }
    } catch (err) {
      console.error('Erreur chargement catégorie:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 text-slate-500">
          Chargement de la catégorie...
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <SEOHead
          title="Catégorie non trouvée | Clinigo"
          description="Cette catégorie d'articles n'existe pas."
          noIndex={false}
        />
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <h1 className="text-2xl font-black text-slate-900">Catégorie introuvable</h1>
          <p className="text-sm text-slate-600 mt-2">La thématique demandée n'existe pas.</p>
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
        title={`${category.name} - Guides & Réglementation | Clinigo`}
        description={category.description || `Retrouvez tous nos articles et guides consacrés à ${category.name} en Martinique.`}
        canonicalPath={`/blog/category/${category.slug}`}
      />

      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-slate-900 transition-colors">Guides &amp; Blog</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{category.name}</span>
        </nav>

        {/* Header Catégorie */}
        <header className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-bold mb-3">
            <span className="material-symbols-outlined text-sm">folder</span>
            <span>Catégorie Éditoriale</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-slate-600 text-base mt-2 leading-relaxed">
              {category.description}
            </p>
          )}
        </header>

        {/* Liste des articles */}
        {articles.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">menu_book</span>
            <h3 className="text-base font-bold text-slate-900">Aucun article dans cette catégorie</h3>
            <p className="text-xs text-slate-600 mt-1">
              Les articles de cette thématique sont en cours de rédaction.
            </p>
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
                    <div className="text-[11px] text-slate-400 font-medium">
                      {art.reading_time_minutes || 4} min de lecture
                    </div>
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
