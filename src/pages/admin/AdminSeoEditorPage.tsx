import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { AdminSeoSubnav } from '../../components/admin/AdminSeoSubnav';
import { AdminRichMarkdownEditor } from '../../components/admin/AdminRichMarkdownEditor';
import { blogService } from '../../services/blogService';
import { aiSeoService } from '../../services/aiSeoService';
import {
  BlogPost,
  BlogPostStatus,
  ContentSensitivity,
  BlogCategory,
  BlogTag,
  FaqItem,
  SourceItem,
  AiOutlinePlan,
} from '../../types/blog';

export const AdminSeoEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [originalSlug, setOriginalSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('/assets/medictrans_hero_discover.jpg');
  const [status, setStatus] = useState<BlogPostStatus>('draft');
  const [contentSensitivity, setContentSensitivity] = useState<ContentSensitivity>('GENERAL_INFO');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [targetKeyword, setTargetKeyword] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');

  // Aux data
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedPostId, setSavedPostId] = useState<string | null>(id || null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live SEO Score & Internal link suggestions
  const [internalLinkSuggestions, setInternalLinkSuggestions] = useState<Array<{ title: string; url: string; anchorText: string }>>([]);

  // AI Modal States (2-step workflow)
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiKeyword, setAiKeyword] = useState('');
  const [aiAudience, setAiAudience] = useState<'patient' | 'transporter' | 'facility' | 'general'>('patient');
  const [aiSensitivity, setAiSensitivity] = useState<ContentSensitivity>('GENERAL_INFO');
  const [aiStep, setAiStep] = useState<'prompt' | 'plan' | 'generating' | 'done'>('prompt');
  const [aiPlan, setAiPlan] = useState<AiOutlinePlan | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  // Recalculer suggestions de liens internes à chaque changement de texte
  useEffect(() => {
    if (content) {
      blogService.suggestInternalLinks(content).then(sugs => {
        setInternalLinkSuggestions(sugs.map(s => ({ title: s.title, url: s.url, anchorText: s.title })));
      });
    }
  }, [content]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cats, allTags] = await Promise.all([
        blogService.getCategories(),
        blogService.getTags(),
      ]);
      setCategories(cats);
      setTags(allTags);

      if (isEditing && id) {
        const post = await blogService.getPostById(id);
        if (post) {
          setTitle(post.title);
          setSlug(post.slug);
          setOriginalSlug(post.slug);
          setExcerpt(post.excerpt || '');
          setContent(post.content);
          setFeaturedImage(post.featured_image || '/assets/medictrans_hero_discover.jpg');
          setStatus(post.status);
          setContentSensitivity(post.content_sensitivity || 'GENERAL_INFO');
          setCategoryId(post.category_id || '');
          setSelectedTagIds(post.tags?.map(t => t.id) || []);
          setTargetKeyword(post.target_keyword || '');
          setMetaTitle(post.meta_title || '');
          setMetaDescription(post.meta_description || '');
          setCanonicalUrl(post.canonical_url || `https://clinigo.fr/blog/${post.slug}`);
          setFaq(post.faq || []);
          setSources(post.sources || []);
          setSavedPostId(post.id);
          if (post.status === 'scheduled' && post.published_at) {
            setScheduledAt(post.published_at.slice(0, 16));
          }
        }
      } else {
        // Mode création: vérifier si une idée est passée en paramètre
        const ideaId = searchParams.get('ideaId');
        if (ideaId) {
          const ideas = await blogService.getIdeas();
          const idea = ideas.find(i => i.id === ideaId);
          if (idea) {
            setTitle(idea.topic);
            setSlug(idea.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
            setTargetKeyword(idea.primary_keyword || '');
            setExcerpt(idea.notes || '');
            setAiTopic(idea.topic);
            setAiKeyword(idea.primary_keyword || '');
            if (idea.target_audience) {
              setAiAudience(idea.target_audience as any);
            }
          }
        }
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors du chargement des données.' });
    } finally {
      setLoading(false);
    }
  };

  // Calcul dynamique du score SEO interne
  const currentSeoScore = blogService.calculateSeoScore({
    title,
    content,
    meta_description: metaDescription,
    target_keyword: targetKeyword,
    slug,
  });

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isEditing && !slug) {
      setSlug(newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
    if (!metaTitle) {
      setMetaTitle(`${newTitle} | Clinigo`);
    }
  };

  // Sauvegarde
  const handleSave = async (forcedStatus?: BlogPostStatus) => {
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Le titre de l’article est requis.' });
      return;
    }
    if (!slug.trim()) {
      setMessage({ type: 'error', text: 'Le slug de l’article est requis.' });
      return;
    }
    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Le contenu de l’article ne peut pas être vide.' });
      return;
    }

    const finalStatus = forcedStatus || status;

    // RÈGLE ABSOLUE N°2: Pas de publication automatique de contenus réglementaires ou médicaux
    if (finalStatus === 'published' && (contentSensitivity === 'REGULATORY_INFO' || contentSensitivity === 'MEDICAL_INFO')) {
      const confirmed = window.confirm(
        `⚠ ATTENTION RÉGLEMENTATION / MÉDICAL :\n\nCet article est classé "${contentSensitivity}". Avez-vous personnellement vérifié les sources officielles (ameli.fr, legifrance, sante.gouv.fr) et confirmé l'exactitude des informations avant de le mettre en ligne ?`
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const postPayload: Partial<BlogPost> = {
        title,
        slug: slug.toLowerCase().trim(),
        excerpt,
        content,
        featured_image: featuredImage,
        status: finalStatus,
        content_sensitivity: contentSensitivity,
        category_id: categoryId || null,
        target_keyword: targetKeyword || null,
        meta_title: metaTitle || `${title} | Clinigo`,
        meta_description: metaDescription,
        canonical_url: canonicalUrl || `https://clinigo.fr/blog/${slug.toLowerCase().trim()}`,
        faq,
        sources,
        published_at:
          finalStatus === 'published'
            ? new Date().toISOString()
            : finalStatus === 'scheduled' && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : null,
      };

      if (isEditing && id) {
        // Vérifier si le slug a changé pour créer la redirection 301 automatique
        if (originalSlug && originalSlug !== slug.toLowerCase().trim()) {
          await blogService.createRedirect(`/blog/${originalSlug}`, `/blog/${slug.toLowerCase().trim()}`);
        }
        const updated = await blogService.updatePost(id, postPayload);
        await blogService.syncPostTags(id, selectedTagIds);
        setSavedPostId(updated.id);
        setStatus(updated.status);
        setOriginalSlug(updated.slug);
        setMessage({ type: 'success', text: 'Article mis à jour avec succès !' });
      } else {
        const created = await blogService.createPost(postPayload);
        await blogService.syncPostTags(created.id, selectedTagIds);
        setSavedPostId(created.id);
        setStatus(created.status);
        setOriginalSlug(created.slug);
        setMessage({ type: 'success', text: 'Nouvel article créé avec succès !' });
        // Rediriger vers l'URL d'édition
        navigate(`/admin/seo/articles/${created.id}/edit`, { replace: true });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l’enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  // GESTION IA : Étape 1 - Générer le Plan
  const handleGeneratePlan = async () => {
    if (!aiTopic.trim()) {
      setAiError('Veuillez renseigner un sujet ou une intention.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const plan = await aiSeoService.generatePlan({
        topic: aiTopic,
        targetKeyword: aiKeyword || aiTopic,
        targetAudience: aiAudience,
        contentSensitivity: aiSensitivity,
      });
      setAiPlan(plan);
      setAiStep('plan');
    } catch (err: any) {
      setAiError(err.message || 'Erreur lors de la génération du plan IA.');
    } finally {
      setAiLoading(false);
    }
  };

  // GESTION IA : Étape 2 - Générer l'Article à partir du Plan validé
  const handleGenerateFullArticle = async () => {
    if (!aiPlan) return;
    setAiLoading(true);
    setAiError(null);
    setAiStep('generating');
    try {
      const generated = await aiSeoService.generateArticle({
        topic: aiTopic,
        targetKeyword: aiKeyword || aiTopic,
        targetAudience: aiAudience,
        contentSensitivity: aiSensitivity,
        approvedPlan: aiPlan,
      });

      // Injecter dans l'éditeur
      setTitle(generated.title);
      setSlug(generated.slug);
      setExcerpt(generated.excerpt);
      setContent(generated.content);
      setMetaTitle(generated.metaTitle);
      setMetaDescription(generated.metaDescription);
      setContentSensitivity(aiSensitivity);
      if (aiKeyword) setTargetKeyword(aiKeyword);
      if (generated.faq && generated.faq.length > 0) {
        setFaq(generated.faq);
      }
      if (generated.sources && generated.sources.length > 0) {
        setSources(generated.sources);
      }
      // Règle 2 : le statut initial reste 'draft'
      setStatus('draft');

      setAiStep('done');
      setShowAiModal(false);
      setMessage({
        type: 'success',
        text: 'Article et métadonnées générés avec succès par l’IA ! Statut défini en Brouillon pour vérification humaine.',
      });
    } catch (err: any) {
      setAiError(err.message || 'Erreur lors de la génération du contenu complet.');
      setAiStep('plan');
    } finally {
      setAiLoading(false);
    }
  };

  // FAQ Handlers
  const addFaqItem = () => {
    setFaq([...faq, { question: '', answer: '' }]);
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faq];
    updated[index][field] = value;
    setFaq(updated);
  };

  const removeFaqItem = (index: number) => {
    setFaq(faq.filter((_, i) => i !== index));
  };

  // Source Handlers
  const addSourceItem = () => {
    setSources([
      ...sources,
      {
        title: '',
        url: '',
        organization: 'ameli.fr',
        checked_at: new Date().toISOString(),
        verified: false,
      },
    ]);
  };

  const updateSourceItem = (index: number, field: keyof SourceItem, value: any) => {
    const updated = [...sources];
    (updated[index] as any)[field] = value;
    setSources(updated);
  };

  const removeSourceItem = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  // Insertion d'un lien interne dans le contenu
  const insertInternalLink = (url: string, anchor: string) => {
    const linkMarkdown = ` [${anchor}](${url}) `;
    setContent(prev => prev + linkMarkdown);
  };

  return (
    <AdminLayout
      title={isEditing ? `Modifier l'article : ${title || 'Sans titre'}` : 'Rédiger un nouvel article'}
      subtitle="Éditeur SEO, assistant IA en 2 étapes, audit sémantique et contrôle de sensibilité."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {savedPostId && (
            <Link
              to={`/preview/blog/${savedPostId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
              title="Prévisualiser avec noindex, nofollow"
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>Aperçu Sécurisé</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setAiStep('prompt');
              setShowAiModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-xs shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-base text-amber-300">auto_awesome</span>
            <span>Assistant IA (2 étapes)</span>
          </button>

          {/* Bouton ENREGISTRER (Maintient le statut sélectionné ou existant) */}
          <button
            type="button"
            id="btn-save-article-top"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition-all disabled:opacity-50"
            title="Enregistrer l'article et ses modifications"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>{saving ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Enregistrer'}</span>
          </button>

          {status !== 'published' ? (
            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-950/10 transition-all disabled:opacity-50"
              title="Valider et publier l'article en ligne"
            >
              <span className="material-symbols-outlined text-base">publish</span>
              <span>{saving ? 'Enregistrement...' : 'Publier en ligne'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors disabled:opacity-50"
              title="Repasser l'article en brouillon"
            >
              <span className="material-symbols-outlined text-base">drafts</span>
              <span>Passer en brouillon</span>
            </button>
          )}
        </div>
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
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{message.text}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="hover:opacity-75">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Alerte si contenu Réglementaire ou Médical */}
      {(contentSensitivity === 'REGULATORY_INFO' || contentSensitivity === 'MEDICAL_INFO') && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 flex items-start gap-3 text-amber-950 shadow-xs">
          <span className="material-symbols-outlined text-2xl text-amber-600 shrink-0">warning</span>
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-sm text-amber-900">
              ⚠ Vérification recommandée avant publication ({contentSensitivity === 'REGULATORY_INFO' ? 'Information Réglementaire' : 'Information Médicale'})
            </p>
            <p className="text-amber-800 leading-relaxed">
              Cet article traite de sujets de santé publique, de droits de transport ou de prise en charge CPAM. Même avec un <strong>Score SEO interne élevé ({currentSeoScore}/100)</strong>, une validation humaine de l'administrateur est obligatoire pour éviter toute mauvaise interprétation par les patients.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Principale : Édition du Contenu (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Titre & Slug */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Titre de l'article (H1) <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Ex: Prise en charge du transport en VSL : démarches et remboursements"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Slug d'URL (/blog/...)
                </label>
                <div className="flex items-center rounded-xl border border-outline-variant/40 bg-surface-container-low/40 px-3 py-2 text-xs font-mono">
                  <span className="text-outline shrink-0">/blog/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                    placeholder="prise-en-charge-vsl"
                    className="w-full bg-transparent text-xs text-on-surface focus:outline-none ml-0.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Mot-clé principal ciblé
                </label>
                <input
                  type="text"
                  value={targetKeyword}
                  onChange={e => setTargetKeyword(e.target.value)}
                  placeholder="Ex: transport vsl prise en charge"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Extrait / Résumé d'introduction
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Court résumé de l'article affiché sur les cartes du blog..."
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>
          </div>

          {/* Éditeur de Contenu Markdown Enrichi & Assistant IA Inline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm">edit_note</span>
                <span>Traitement de texte & Rédaction (Format Markdown)</span>
              </label>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                  <span>Sélectionnez du texte pour l'IA ou les tableaux</span>
                </span>
              </div>
            </div>

            <AdminRichMarkdownEditor
              value={content}
              onChange={setContent}
              targetKeyword={targetKeyword}
              articleTitle={title}
              onSave={handleSave}
              placeholder="Rédigez votre article en Markdown, ou utilisez la barre d'outils CMS (gras, italique, alignements, listes, tableaux) et sélectionnez un passage pour le modifier avec l'IA..."
              minRows={20}
            />
          </div>

          {/* Section FAQ (Données Structurées FAQPage Schema) */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">quiz</span>
                  <span>Foire Aux Questions (FAQ)</span>
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Ces questions/réponses généreront automatiquement le balisage Schema.org FAQPage pour Google.
                </p>
              </div>
              <button
                type="button"
                onClick={addFaqItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-bold text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Ajouter question</span>
              </button>
            </div>

            {faq.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-2">
                Aucune FAQ associée. Ajoutez des questions fréquentes pour enrichir la recherche Google.
              </p>
            ) : (
              <div className="space-y-3">
                {faq.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={item.question}
                        onChange={e => updateFaqItem(idx, 'question', e.target.value)}
                        placeholder="Ex: Faut-il une prescription médicale pour être remboursé ?"
                        className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-on-surface focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeFaqItem(idx)}
                        className="p-1 rounded-lg text-on-surface-variant hover:text-rose-600 transition-colors"
                        title="Supprimer"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={item.answer}
                      onChange={e => updateFaqItem(idx, 'answer', e.target.value)}
                      placeholder="Réponse claire et directe..."
                      className="w-full px-3 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section Sources & Traçabilité (Règle N°4) */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
                  <span>Sources &amp; Vérification (Réglementaire / Médical)</span>
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Associez des sources officielles vérifiables (ameli.fr, service-public.fr, legifrance.gouv.fr, sante.gouv.fr).
                </p>
              </div>
              <button
                type="button"
                onClick={addSourceItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-bold text-emerald-700 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Ajouter source</span>
              </button>
            </div>

            {sources.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-2">
                Aucune source renseignée. Pour les sujets de santé ou de remboursement, l'ajout de sources officielles est vivement conseillé.
              </p>
            ) : (
              <div className="space-y-3">
                {sources.map((src, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
                    <input
                      type="text"
                      value={src.title}
                      onChange={e => updateSourceItem(idx, 'title', e.target.value)}
                      placeholder="Titre de la source"
                      className="px-2.5 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-xs font-medium text-on-surface focus:outline-none"
                    />
                    <input
                      type="url"
                      value={src.url}
                      onChange={e => updateSourceItem(idx, 'url', e.target.value)}
                      placeholder="https://www.ameli.fr/..."
                      className="px-2.5 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-xs font-mono text-on-surface focus:outline-none"
                    />
                    <input
                      type="text"
                      value={src.organization}
                      onChange={e => updateSourceItem(idx, 'organization', e.target.value)}
                      placeholder="Organisme (ex: ameli.fr)"
                      className="px-2.5 py-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface focus:outline-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-[11px] text-on-surface cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={src.verified}
                          onChange={e => updateSourceItem(idx, 'verified', e.target.checked)}
                          className="rounded text-primary focus:ring-0"
                        />
                        <span>Vérifiée</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeSourceItem(idx)}
                        className="p-1 rounded-lg text-on-surface-variant hover:text-rose-600 transition-colors"
                        title="Supprimer la source"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Barre d'action et d'enregistrement de l'article (Bas de page) */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-between flex-wrap gap-3 mt-6">
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                status === 'review' ? 'bg-amber-100 text-amber-800' :
                status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                'bg-slate-100 text-slate-700'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                Statut : {status === 'published' ? 'Publié' : status === 'review' ? 'En relecture' : status === 'scheduled' ? 'Programmé' : 'Brouillon'}
              </span>
              {savedPostId && (
                <span className="text-[11px] text-on-surface-variant font-mono">
                  ID: {savedPostId.slice(0, 8)}...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {savedPostId && (
                <Link
                  to={`/preview/blog/${savedPostId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-base">visibility</span>
                  <span>Aperçu</span>
                </Link>
              )}

              <button
                type="button"
                id="btn-save-article-bottom"
                onClick={() => handleSave()}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
                title="Enregistrer l'article et ses modifications"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>{saving ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : 'Enregistrer'}</span>
              </button>

              {status !== 'published' && (
                <button
                  type="button"
                  onClick={() => handleSave('published')}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md shadow-emerald-950/10 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">publish</span>
                  <span>Publier</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Colonne Latérale : Paramètres SEO, Score & Métadonnées (1/3) */}
        <div className="space-y-6">
          {/* Card Score SEO Interne */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Score SEO interne
                </h3>
                <span className="text-[10px] text-on-surface-variant">Indicateur structurel interne</span>
              </div>
              <span className={`text-xl font-extrabold px-3 py-1 rounded-xl ${
                currentSeoScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                currentSeoScore >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {currentSeoScore}/100
              </span>
            </div>

            {/* Checklist des signaux SEO */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
                <span className="text-on-surface-variant">Longueur titre (40-70 car.)</span>
                <span className={title.length >= 40 && title.length <= 70 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {title.length} car.
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
                <span className="text-on-surface-variant">Longueur meta desc (120-165 car.)</span>
                <span className={metaDescription.length >= 120 && metaDescription.length <= 165 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {metaDescription.length} car.
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
                <span className="text-on-surface-variant">Volume de texte (&gt; 600 mots)</span>
                <span className={content.split(/\s+/).filter(Boolean).length >= 600 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {content.split(/\s+/).filter(Boolean).length} mots
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/10">
                <span className="text-on-surface-variant">Présence de sous-titres H2 (##)</span>
                <span className={(content.match(/^##\s+/gm) || []).length >= 2 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                  {(content.match(/^##\s+/gm) || []).length} H2
                </span>
              </div>
            </div>
          </div>

          {/* Card Paramètres de Publication */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Publication &amp; Catégorisation
            </h3>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Niveau de sensibilité du contenu
              </label>
              <select
                value={contentSensitivity}
                onChange={e => setContentSensitivity(e.target.value as ContentSensitivity)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              >
                <option value="GENERAL_INFO">Information Générale (Standard)</option>
                <option value="REGULATORY_INFO">Information Réglementaire (⚠ Vérif.)</option>
                <option value="MEDICAL_INFO">Information Médicale (⚠ Vérif.)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Statut actuel
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as BlogPostStatus)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              >
                <option value="draft">Brouillon (Draft)</option>
                <option value="review">En relecture (Review)</option>
                <option value="scheduled">Programmé (Scheduled)</option>
                <option value="published">Publié (Published)</option>
                <option value="archived">Archivé</option>
              </select>
            </div>

            {status === 'scheduled' && (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Date de publication programmée
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Catégorie
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              >
                <option value="">Sélectionner une catégorie...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Tags associés
              </label>
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto">
                {tags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setSelectedTagIds(prev =>
                          isSelected ? prev.filter(tId => tId !== tag.id) : [...prev, tag.id]
                        );
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-on-primary font-bold shadow-2xs'
                          : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Image à la une (URL)
              </label>
              <input
                type="text"
                value={featuredImage}
                onChange={e => setFeaturedImage(e.target.value)}
                placeholder="/assets/medictrans_hero_discover.jpg"
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                id="btn-save-sidebar"
                onClick={() => handleSave()}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
                title="Enregistrer les paramètres et le contenu"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          </div>

          {/* Card Métadonnées SEO & Canonical */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Métadonnées &amp; Balises Google
            </h3>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Meta Title (Balise &lt;title&gt;)
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
                placeholder="Titre affiché dans les résultats Google..."
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Meta Description (120 - 165 car.)
              </label>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={e => setMetaDescription(e.target.value)}
                placeholder="Description concise pour inciter au clic sur Google..."
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                URL Canonique absolue (Règle N°9)
              </label>
              <input
                type="url"
                value={canonicalUrl || `https://clinigo.fr/blog/${slug}`}
                onChange={e => setCanonicalUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
          </div>

          {/* Card Suggestions de Maillage Interne (Règle N°13) */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
              <span className="material-symbols-outlined text-base text-teal-600">link</span>
              <span>Suggestions de Liens Internes</span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Liens vers des pages ou articles existants à insérer pour fortifier le SEO :
            </p>

            {internalLinkSuggestions.length === 0 ? (
              <p className="text-xs text-on-surface-variant py-1">
                Aucune opportunité identifiée pour le texte actuel.
              </p>
            ) : (
              <div className="space-y-2">
                {internalLinkSuggestions.map((sug, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-surface-container-low/40 border border-outline-variant/20 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-on-surface truncate">{sug.title}</div>
                      <div className="text-[10px] text-outline font-mono truncate">{sug.url}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => insertInternalLink(sug.url, sug.anchorText)}
                      className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold shrink-0 transition-colors"
                      title="Insérer ce lien à la fin de l'article"
                    >
                      + Insérer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL ASSISTANT IA (Génération en 2 étapes : Plan puis Article complet) */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-amber-500">auto_awesome</span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Assistant Éditorial IA (Génération en 2 étapes)
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Étape 1 : Structuration du plan • Étape 2 : Rédaction et maillage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {aiError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {aiError}
              </div>
            )}

            {/* Étape 1 : Formulaire d'intention & Prompt */}
            {aiStep === 'prompt' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-on-surface mb-1">
                    Sujet ou intention de recherche <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="Ex: Dans quels cas le transport en VSL est-il pris en charge à 100% ?"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-on-surface-variant mb-1">
                      Mot-clé cible principal
                    </label>
                    <input
                      type="text"
                      value={aiKeyword}
                      onChange={e => setAiKeyword(e.target.value)}
                      placeholder="Ex: prise en charge transport vsl 100"
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface-variant mb-1">
                      Public cible
                    </label>
                    <select
                      value={aiAudience}
                      onChange={e => setAiAudience(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                    >
                      <option value="patient">Patient / Famille</option>
                      <option value="transporter">Transporteur Sanitaire</option>
                      <option value="facility">Établissement de Santé / Cadre</option>
                      <option value="general">Grand Public</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-on-surface-variant mb-1">
                    Niveau de sensibilité
                  </label>
                  <select
                    value={aiSensitivity}
                    onChange={e => setAiSensitivity(e.target.value as ContentSensitivity)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                  >
                    <option value="GENERAL_INFO">Information Générale (Qu'est-ce qu'un VSL ?)</option>
                    <option value="REGULATORY_INFO">Information Réglementaire (Prise en charge CPAM, ALD)</option>
                    <option value="MEDICAL_INFO">Information Médicale (Pathologies, soins spécifiques)</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePlan}
                    disabled={aiLoading}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">assignment</span>
                    <span>{aiLoading ? 'Génération du plan...' : 'Générer le Plan (Étape 1)'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Étape 2 : Revue et Validation du Plan */}
            {aiStep === 'plan' && aiPlan && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 space-y-2">
                  <div className="text-[11px] font-bold text-primary uppercase">Intention de recherche</div>
                  <div className="text-xs font-semibold text-on-surface">{aiPlan.searchIntent}</div>
                  <div className="text-sm font-bold text-on-surface mt-1">Titre proposé : {aiPlan.title}</div>
                </div>

                {/* Structure des Sections H2 / H3 */}
                <div className="space-y-2">
                  <div className="font-bold text-on-surface flex items-center justify-between">
                    <span>Plan des sections (H2 &amp; H3) :</span>
                    <span className="text-[11px] text-on-surface-variant font-normal">{aiPlan.sections.length} sections</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {aiPlan.sections.map((sec, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                        <div className="font-bold text-xs text-on-surface">## {sec.heading}</div>
                        {sec.subheadings && sec.subheadings.length > 0 && (
                          <ul className="list-disc list-inside text-[11px] text-on-surface-variant pl-2 mt-1">
                            {sec.subheadings.map((sub, j) => (
                              <li key={j}>### {sub}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sources recommandées */}
                <div className="space-y-1.5">
                  <div className="font-bold text-on-surface">Sources officielles à consulter :</div>
                  <div className="flex flex-wrap gap-1.5">
                    {aiPlan.sourcesToConsult.map((src, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                        {src}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAiStep('prompt')}
                    className="px-3.5 py-2 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface"
                  >
                    Retour aux paramètres
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateFullArticle}
                    disabled={aiLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 text-white font-bold text-xs shadow-md hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">edit_note</span>
                    <span>Valider le Plan &amp; Rédiger l'Article (Étape 2)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pendant la rédaction de l'étape 2 */}
            {aiStep === 'generating' && (
              <div className="py-12 text-center space-y-3">
                <div className="inline-block animate-spin text-primary">
                  <span className="material-symbols-outlined text-4xl">sync</span>
                </div>
                <div className="font-bold text-sm text-on-surface">
                  Rédaction de l'article en cours par l'IA...
                </div>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                  Génération des sections, FAQ Schema, suggestions de liens internes et balises meta.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
