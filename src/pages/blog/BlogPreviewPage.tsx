import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { SEOHead } from '../../components/SEOHead';
import { blogService } from '../../services/blogService';
import { BlogPost } from '../../types/blog';
import { renderMarkdownContent } from '../../utils/markdownRenderer';

export const BlogPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (id) {
      loadPost(id);
    }
  }, [id]);

  const loadPost = async (postId: string) => {
    setLoading(true);
    try {
      const article = await blogService.getPostById(postId);
      setPost(article);
    } catch (err) {
      console.error('Erreur chargement aperçu article:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handlePublishNow = async () => {
    if (!post) return;
    if (post.content_sensitivity === 'REGULATORY_INFO' || post.content_sensitivity === 'MEDICAL_INFO') {
      const ok = window.confirm(
        `⚠ Confirmation : Cet article est classé "${post.content_sensitivity}". Confirmez-vous que les sources et éléments réglementaires ont été vérifiés avant publication en ligne ?`
      );
      if (!ok) return;
    }
    setPublishing(true);
    try {
      await blogService.updatePost(post.id, {
        status: 'published',
        published_at: new Date().toISOString(),
      });
      alert('Article publié avec succès !');
      navigate(`/blog/${post.slug}`);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la publication.');
    } finally {
      setPublishing(false);
    }
  };

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

  const renderMarkdown = (content: string) => {
    return renderMarkdownContent(content);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 text-slate-500">
          Chargement de l'aperçu...
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <h1 className="text-xl font-bold text-slate-900">Article introuvable</h1>
          <Link to="/admin/seo/articles" className="mt-4 text-xs font-bold text-teal-700 underline">
            Retour à la liste des articles
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const toc = extractTableOfContents(post.content);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Règle N°17: NOINDEX, NOFOLLOW garanti pour la prévisualisation */}
      <SEOHead
        title={`[Aperçu] ${post.title} | Clinigo`}
        description={post.meta_description || post.excerpt}
        noIndex={true}
      />

      {/* Bandeau Administrateur Fixe */}
      <div className={`sticky top-0 z-50 px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs font-bold transition-colors ${
        post.status === 'published' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="material-symbols-outlined text-base">
            {post.status === 'published' ? 'verified' : 'visibility'}
          </span>
          <span>
            {post.status === 'published' ? (
              <>
                ARTICLE EN LIGNE (PUBLIÉ) • Accessible au public sur <span className="underline font-extrabold font-mono">/blog/{post.slug}</span>
              </>
            ) : (
              <>
                APERÇU SÉCURISÉ ADMIN • Statut : <span className="uppercase">{post.status}</span> • (Balise noindex active, non indexable par Google)
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {post.status === 'published' ? (
            <Link
              to={`/blog/${post.slug}`}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold transition-colors shadow-xs"
              title="Voir la version publique en ligne"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span>Voir l'article en ligne</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handlePublishNow}
              disabled={publishing}
              className="px-3 py-1 rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 text-xs font-bold transition-colors disabled:opacity-50"
            >
              {publishing ? 'Publication...' : 'Publier en ligne'}
            </button>
          )}
          <Link
            to={`/admin/seo/articles/${post.id}/edit`}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
              post.status === 'published' ? 'bg-emerald-900 text-white hover:bg-emerald-950' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            Modifier
          </Link>
        </div>
      </div>

      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Notice si l'article est déjà publié */}
        {post.status === 'published' && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 flex-wrap shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl text-emerald-700">check_circle</span>
              <div className="text-xs">
                <span className="font-bold text-emerald-900">Cet article est actuellement en ligne !</span>
                <span className="text-emerald-700 block sm:inline sm:ml-1">
                  URL publique indexable : <code className="font-mono font-semibold bg-emerald-100/70 px-1 py-0.5 rounded">/blog/{post.slug}</code>
                </span>
              </div>
            </div>
            <Link
              to={`/blog/${post.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all"
            >
              <span>Ouvrir la page publique</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-slate-900 transition-colors">Guides &amp; Blog</Link>
          {post.category && (
            <>
              <span>/</span>
              <span className="text-slate-700">{post.category.name}</span>
            </>
          )}
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* En-tête */}
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
              Statut : {post.status}
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

          {(post.content_sensitivity === 'REGULATORY_INFO' || post.content_sensitivity === 'MEDICAL_INFO') && (
            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/60 flex items-start gap-3 text-xs text-teal-950 shadow-2xs">
              <span className="material-symbols-outlined text-base text-teal-700 shrink-0 mt-0.5">verified</span>
              <div>
                <strong>Information réglementaire et de santé publique :</strong> Ce guide s'appuie sur les textes officiels de l'Assurance Maladie (ameli.fr) et les recommandations de l'Agence Régionale de Santé (ARS).
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

        {/* Sommaire */}
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

        {/* Corps */}
        <article className="prose prose-slate max-w-none mb-12">
          {renderMarkdown(post.content)}
        </article>

        {/* Sources */}
        {post.sources && post.sources.length > 0 && (
          <section className="mb-12 p-6 rounded-3xl bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-base text-emerald-600">verified_user</span>
              <span>Sources institutionnelles &amp; Références</span>
            </h3>
            <div className="space-y-2">
              {post.sources.map((src, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{src.title || src.organization}</div>
                    {src.url && (
                      <span className="text-[11px] text-teal-700 font-mono truncate block max-w-md">
                        {src.url}
                      </span>
                    )}
                  </div>
                  {src.verified && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Vérifiée
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
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
                  <div key={index} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-50"
                    >
                      <span>{item.question}</span>
                      <span className="material-symbols-outlined text-base text-slate-400">
                        {isOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};
