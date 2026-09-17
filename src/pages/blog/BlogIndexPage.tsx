import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { SEOHead } from '../../components/SEOHead';
import { blogService } from '../../services/blogService';
import { BlogPost, BlogCategory } from '../../types/blog';

export const BlogIndexPage: React.FC = () => {
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublishedContent();
  }, []);

  const loadPublishedContent = async () => {
    setLoading(true);
    try {
      const [allArticles, allCats] = await Promise.all([
        blogService.getPosts({ status: 'published' }),
        blogService.getCategories(),
      ]);
      setArticles(allArticles);
      setCategories(allCats);
    } catch (err) {
      console.error('Erreur chargement blog:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(post => {
    const matchesCategory =
      selectedCategorySlug === 'all' || post.category?.slug === selectedCategorySlug;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.target_keyword && post.target_keyword.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const standardArticles = filteredArticles.length > 1 ? filteredArticles.slice(1) : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      <SEOHead
        title="Guides, Conseils & Réglementation Transport Médical | Clinigo"
        description="Découvrez tous nos guides pratiques sur le transport sanitaire, VSL, taxi conventionné, prise en charge CPAM à 100% et ALD en Martinique."
        canonicalPath="/blog"
        ogType="website"
      />

      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-bold mb-4 shadow-2xs">
            <span className="material-symbols-outlined text-base text-teal-600">verified</span>
            <span>Ressources Officielles &amp; Conseils Santé 972</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Guides &amp; Réglementation du Transport Sanitaire
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Prescription Médicale de Transport (PMT), démarches CPAM, remboursement à 100%, transport pour ALD et organisation des trajets médicaux en Martinique.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <span className="material-symbols-outlined absolute left-4 top-3.5 text-slate-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un guide, VSL, ALD, bon de transport..."
              className="w-full pl-12 pr-4 py-3.5 rounded-full border border-slate-200 bg-white shadow-sm text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/30 transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCategorySlug('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedCategorySlug === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Tous les sujets
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategorySlug(cat.slug)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  selectedCategorySlug === cat.slug
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="py-20 text-center text-slate-500 font-medium">
            Chargement des guides et articles...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">menu_book</span>
            <h3 className="text-base font-bold text-slate-900">Aucun article publié</h3>
            <p className="text-xs text-slate-600 mt-1">
              Les articles rédigés sont actuellement en cours de validation éditoriale par nos régulateurs avant mise en ligne.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Article Card */}
            {featuredArticle && (
              <section className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-lg shadow-slate-950/5 grid grid-cols-1 lg:grid-cols-12 gap-0 hover:border-teal-500/40 transition-all group">
                <div className="lg:col-span-7 aspect-video lg:aspect-auto overflow-hidden relative">
                  <img
                    src={featuredArticle.featured_image || '/assets/medictrans_hero_discover.jpg'}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-800 text-white shadow-md">
                      À la une
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-5 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span>{featuredArticle.category?.name || 'Réglementation'}</span>
                      <span>•</span>
                      <span>{featuredArticle.reading_time_minutes || 5} min de lecture</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                      <Link to={`/blog/${featuredArticle.slug}`}>
                        {featuredArticle.title}
                      </Link>
                    </h2>

                    {featuredArticle.excerpt && (
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {featuredArticle.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-4">
                    <span className="text-xs font-medium text-slate-400">
                      Mise à jour : {featuredArticle.published_at ? new Date(featuredArticle.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Récent'}
                    </span>
                    <Link
                      to={`/blog/${featuredArticle.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
                    >
                      <span>Lire le guide</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* Grid of Other Articles */}
            {standardArticles.length > 0 && (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {standardArticles.map(art => (
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
                        {art.category && (
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs">
                              {art.category.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 space-y-2">
                        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                          <span>{art.reading_time_minutes || 4} min</span>
                          <span>•</span>
                          <span>{art.published_at ? new Date(art.published_at).toLocaleDateString('fr-FR') : 'Récent'}</span>
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

                    <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-100">
                      <div className="flex flex-wrap gap-1">
                        {art.tags?.slice(0, 2).map(tag => (
                          <span key={tag.id} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            #{tag.name}
                          </span>
                        ))}
                      </div>
                      <Link
                        to={`/blog/${art.slug}`}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-0.5"
                      >
                        <span>Lire</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </div>
        )}

        {/* CTA Clinigo Reservation Banner */}
        <section className="mt-16 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">ambulance</span>
              <span>Plateforme Agréée ARS Martinique 972</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Besoin d'un VSL ou d'une Ambulance conventionnée en Martinique ?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Réservez votre trajet médical en 3 minutes. Vos droits sont vérifiés auprès de la CGSS et nos transporteurs agréés assurent votre prise en charge sereine vers tous les établissements de santé de l'île.
            </p>
            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <Link
                to="/reserver"
                className="px-6 py-3 rounded-full bg-white text-slate-900 font-extrabold text-xs sm:text-sm shadow-md hover:bg-teal-50 transition-all inline-flex items-center gap-2"
              >
                <span>Commander un transport</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
              <Link
                to="/droits-cpam"
                className="px-5 py-3 rounded-full border border-white/30 text-white hover:bg-white/10 font-bold text-xs sm:text-sm transition-all"
              >
                Vérifier mes droits CPAM
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
