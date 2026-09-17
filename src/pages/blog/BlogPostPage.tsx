import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { SEOHead } from '../../components/SEOHead';
import { useAuth } from '../../contexts/AuthContext';
import { blogService } from '../../services/blogService';
import { BlogPost } from '../../types/blog';
import { renderMarkdownContent } from '../../utils/markdownRenderer';

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([]);

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug, isAdmin]);

  const loadPost = async (targetSlug: string) => {
    setLoading(true);
    try {
      // 1. Vérifier si une redirection existe pour cette URL
      const currentPath = `/blog/${targetSlug}`;
      const redirect = await blogService.getRedirect(currentPath);
      if (redirect && redirect.target_path) {
        navigate(redirect.target_path, { replace: true });
        return;
      }

      // 2. Récupérer l'article (strictement publié pour l'URL publique /blog/:slug)
      // L'aperçu administrateur dédié se fait via /preview/blog/:id ou avec ?preview=true explicite
      const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === 'true';
      const allowDraft = Boolean(isAdmin && isPreview);
      const article = await blogService.getPostBySlug(targetSlug, allowDraft);
      if (article && (article.status === 'published' || allowDraft)) {
        setPost(article);

        // Charger articles liés
        const allPosts = await blogService.getPosts({
          status: 'published',
          categoryId: article.category_id || undefined,
        });
        setRelatedPosts(allPosts.filter(p => p.id !== article.id && p.status === 'published').slice(0, 3));
      } else {
        setPost(null);
      }
    } catch (err) {
      console.error('Erreur chargement article:', err);
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Helper pour extraire les H2 pour le Sommaire
  const extractTableOfContents = (content: string) => {
    const lines = content.split('\n');
    const h2List: { id: string; text: string }[] = [];
    lines.forEach(line => {
      const match = line.match(/^##\s+(.+)$/);
      if (match) {
        const text = match[1].replace(/[*_~`]/g, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        h2List.push({ id, text });
      }
    });
    return h2List;
  };

  // Rendu Markdown enrichi avec support des tableaux, alignements et callouts
  const renderMarkdown = (content: string) => {
    return renderMarkdownContent(content);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 text-slate-500">
          Chargement de l'article...
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <SEOHead
          title="Guide non trouvé | Clinigo"
          description="Cet article n'est pas disponible ou est en cours de révision éditoriale."
          noIndex={false}
        />
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-3">
            article_shortcut
          </span>
          <h1 className="text-2xl font-black text-slate-900">Guide introuvable</h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md">
            L'article demandé n'existe pas ou est en cours de validation par nos équipes de régulation.
          </p>
          <Link
            to="/blog"
            className="mt-6 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Retour à tous les guides</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const toc = extractTableOfContents(post.content);

  // Construction du Schema JSON-LD (Article + FAQPage si FAQ présente)
  const schemaGraph: any[] = [
    {
      '@type': 'Article',
      '@id': `https://clinigo.fr/blog/${post.slug}#article`,
      headline: post.title,
      description: post.meta_description || post.excerpt,
      image: post.featured_image ? [`https://clinigo.fr${post.featured_image}`] : undefined,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at || post.published_at || post.created_at,
      mainEntityOfPage: `https://clinigo.fr/blog/${post.slug}`,
      author: {
        '@type': 'Organization',
        name: 'Clinigo Régulation Sanitaire',
        url: 'https://clinigo.fr',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Clinigo',
        logo: {
          '@type': 'ImageObject',
          url: 'https://clinigo.fr/assets/clinigo-logo.png',
        },
      },
    },
  ];

  if (post.faq && post.faq.length > 0) {
    schemaGraph.push({
      '@type': 'FAQPage',
      '@id': `https://clinigo.fr/blog/${post.slug}#faq`,
      mainEntity: post.faq.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  const schemaJson = {
    '@context': 'https://schema.org',
    '@graph': schemaGraph,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      <SEOHead
        title={post.meta_title || `${post.title} | Clinigo`}
        description={post.meta_description || post.excerpt || post.title}
        canonicalPath={`/blog/${post.slug}`}
        ogImage={post.featured_image || '/assets/medictrans_hero_discover.jpg'}
        ogType="article"
        schemaJson={schemaJson}
        noIndex={post.status !== 'published'}
      />

      {/* Alerte Admin si article non publié */}
      {post.status !== 'published' && (
        <div className="sticky top-0 z-50 bg-amber-500 text-slate-950 px-4 py-3 shadow-md flex items-center justify-between gap-3 text-xs font-bold border-b border-amber-600">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">warning</span>
            <span>
              MODE BROUILLON (ADMIN) • Cet article est en brouillon dans le panel : il est <u>strictement invisible</u> pour les internautes et exclu de Google.
            </span>
          </div>
          <Link
            to={`/admin/seo/articles/${post.id}/edit`}
            className="px-3 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-colors shrink-0"
          >
            Modifier / Publier
          </Link>
        </div>
      )}

      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-slate-900 transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-slate-900 transition-colors">Guides &amp; Conseils</Link>
          {post.category && (
            <>
              <span>/</span>
              <Link to={`/blog/category/${post.category.slug}`} className="hover:text-slate-900 transition-colors">
                {post.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* En-tête de l'article */}
        <header className="space-y-4 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            {post.category && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/60">
                {post.category.name}
              </span>
            )}
            <span className="text-xs text-slate-500 font-medium">
              {post.reading_time_minutes || 5} min de lecture
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">
              Publié le {new Date(post.published_at || post.created_at || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              {post.excerpt}
            </p>
          )}

          {/* Badge de Sensibilité et Source Officielle */}
          {(post.content_sensitivity === 'REGULATORY_INFO' || post.content_sensitivity === 'MEDICAL_INFO') && (
            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/60 flex items-start gap-3 text-xs text-teal-950 shadow-2xs">
              <span className="material-symbols-outlined text-base text-teal-700 shrink-0 mt-0.5">verified</span>
              <div>
                <strong>Information réglementaire et de santé publique :</strong> Ce guide s'appuie sur les textes officiels de l'Assurance Maladie (ameli.fr) et les recommandations de l'Agence Régionale de Santé (ARS). Les modalités de remboursement requièrent une Prescription Médicale de Transport (PMT) valide.
              </div>
            </div>
          )}
        </header>

        {/* Image à la une */}
        {post.featured_image && (
          <div className="rounded-3xl overflow-hidden mb-10 shadow-md aspect-video max-h-[440px] w-full">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Sommaire interactif si H2 présents */}
        {toc.length > 1 && (
          <div className="mb-10 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              <span className="material-symbols-outlined text-base text-teal-600">format_list_bulleted</span>
              <span>Sommaire du guide</span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              {toc.map(item => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-slate-600 hover:text-teal-700 hover:underline transition-colors flex items-center gap-1.5"
                  >
                    <span className="text-teal-600">›</span>
                    <span>{item.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Corps de l'article */}
        <article className="prose prose-slate max-w-none mb-12">
          {renderMarkdown(post.content)}
        </article>

        {/* Sources Officielles (Règle N°4) */}
        {post.sources && post.sources.length > 0 && (
          <section className="mb-12 p-6 rounded-3xl bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-base text-emerald-600">verified_user</span>
              <span>Sources institutionnelles &amp; Références</span>
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Ce contenu a été vérifié à partir des publications officielles suivantes :
            </p>
            <div className="space-y-2">
              {post.sources.map((src, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{src.title || src.organization}</div>
                    {src.url ? (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-[11px] text-teal-700 hover:underline font-mono truncate block max-w-md"
                      >
                        {src.url}
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">{src.organization}</span>
                    )}
                  </div>
                  {src.verified && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      Source vérifiée
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section FAQ Interactive (Accordéon) */}
        {post.faq && post.faq.length > 0 && (
          <section className="mb-12 space-y-4">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">help</span>
              <span>Questions fréquentes (FAQ)</span>
            </h3>
            <div className="space-y-2.5">
              {post.faq.map((item, index) => {
                const isOpen = openFaqIndices.includes(index);
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                    >
                      <span>{item.question}</span>
                      <span className="material-symbols-outlined text-base text-slate-400 shrink-0">
                        {isOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tags de l'article */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-12 pt-4 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-400">Tags :</span>
            {post.tags.map(tag => (
              <Link
                key={tag.id}
                to={`/blog/tag/${tag.slug}`}
                className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* CTA Clinigo Réservation */}
        <section className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg mb-12 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold">
            <span className="material-symbols-outlined text-sm">local_hospital</span>
            <span>Réservation Simplifiée Martinique</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black leading-snug">
            Organisez votre transport médicalisé avec Clinigo
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
            Que ce soit pour une séance de dialyse, une chimiothérapie, une consultation ou une sortie d'hospitalisation au CHU, nous mobilisons un transporteur sanitaire agréé proche de vous.
          </p>
          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <Link
              to="/reserver"
              className="px-6 py-2.5 rounded-full bg-white text-slate-900 font-extrabold text-xs sm:text-sm shadow-md hover:bg-teal-50 transition-all inline-flex items-center gap-1.5"
            >
              <span>Réserver mon transport</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <Link
              to="/droits-cpam"
              className="px-5 py-2.5 rounded-full border border-white/30 text-white hover:bg-white/10 font-bold text-xs sm:text-sm transition-all"
            >
              Vérifier le barème CPAM
            </Link>
          </div>
        </section>

        {/* Articles Liés */}
        {relatedPosts.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Articles et guides associés
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map(rel => (
                <article
                  key={rel.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 uppercase">
                      {rel.category?.name || 'Guide'}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-1 line-clamp-2">
                      <Link to={`/blog/${rel.slug}`} className="hover:text-teal-700">
                        {rel.title}
                      </Link>
                    </h4>
                  </div>
                  <Link
                    to={`/blog/${rel.slug}`}
                    className="mt-3 text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-0.5"
                  >
                    <span>Lire</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};
