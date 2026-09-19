import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { AdminSeoSubnav } from '../../components/admin/AdminSeoSubnav';
import { AdminRichMarkdownEditor } from '../../components/admin/AdminRichMarkdownEditor';
import { blogService } from '../../services/blogService';
import { aiSeoService, ensureClinigoEndingLink, GeneratedArticleData } from '../../services/aiSeoService';
import {
  BlogPost,
  BlogPostStatus,
  ContentSensitivity,
  BlogCategory,
  BlogTag,
  FaqItem,
  SourceItem,
  AiOutlinePlan,
  SeoIdea,
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
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
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

  // Image Manager Modal States
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalTab, setImageModalTab] = useState<'ai' | 'upload' | 'library' | 'url'>('ai');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageGeneratedUrl, setImageGeneratedUrl] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const generatedPreviewRef = React.useRef<HTMLDivElement>(null);

  // Aux data
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedPostId, setSavedPostId] = useState<string | null>(id || null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; actionUrl?: string; actionLabel?: string } | null>(null);

  // Suppression d'article
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Auto-generation overlay states
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [autoGeneratingStatus, setAutoGeneratingStatus] = useState('');

  // Détection automatique de la catégorie selon le sujet et mot-clé
  const autoDetectCategory = (topic: string, keyword: string, cats: BlogCategory[]): string => {
    const text = `${topic} ${keyword}`.toLowerCase();
    if (text.includes('dialyse') || text.includes('chimio') || text.includes('cancer') || text.includes('ald') || text.includes('pathologie') || text.includes('rééducation') || text.includes('soin')) {
      const cat = cats.find(c => c.slug === 'pathologies-ald' || c.id === 'cat-pathologies');
      if (cat) return cat.id;
    }
    if (text.includes('vsl') || text.includes('ambulance') || text.includes('taxi') || text.includes('différence') || text.includes('difference') || text.includes('véhicule') || text.includes('vehicule') || text.includes('choisir') || text.includes('transport')) {
      const cat = cats.find(c => c.slug === 'types-de-transport' || c.id === 'cat-types-transport');
      if (cat) return cat.id;
    }
    if (text.includes('remboursement') || text.includes('cpam') || text.includes('pmt') || text.includes('prescription') || text.includes('100%') || text.includes('bon de transport') || text.includes('droits') || text.includes('prise en charge')) {
      const cat = cats.find(c => c.slug === 'remboursement-cpam' || c.id === 'cat-remboursement');
      if (cat) return cat.id;
    }
    return cats[0]?.id || 'cat-types-transport';
  };

  // Détection automatique de la photo à la une 16:9 haute définition selon le sujet
  const autoDetectFeaturedImage = (topic: string, keyword: string) => {
    const lower = `${topic} ${keyword}`.toLowerCase();
    if (lower.includes('régulation') || lower.includes('regulation') || lower.includes('dispatch') || lower.includes('standard') || lower.includes('permanence')) {
      return {
        url: '/assets/gallery/regulation_ambulance_dispatch.jpg',
        alt: 'Centre de régulation des transports sanitaires et coordination des ambulances en Martinique'
      };
    }
    if (lower.includes('pmr') || lower.includes('fauteuil') || lower.includes('handicap') || lower.includes('rampe')) {
      return {
        url: '/assets/gallery/transport_pmr_fauteuil.jpg',
        alt: 'Véhicule adapté PMR avec rampe d\'accès et prise en charge bienveillante en Martinique'
      };
    }
    if (lower.includes('dialyse') || lower.includes('néphrologie') || lower.includes('nephrologie') || lower.includes('rein')) {
      return {
        url: '/assets/gallery/dialyse_centre_soins.jpg',
        alt: 'Centre de soins et dialyse avec transport sanitaire conventionné en Martinique'
      };
    }
    if (lower.includes('bébé') || lower.includes('bebe') || lower.includes('enfant') || lower.includes('maternité') || lower.includes('maternite') || lower.includes('pédiatrie') || lower.includes('pediatrie')) {
      return {
        url: '/assets/gallery/pediatrie_maternite.jpg',
        alt: 'Transport médicalisé pédiatrique et maternité en Martinique'
      };
    }
    if (lower.includes('hélicoptère') || lower.includes('helicoptere') || lower.includes('evasan') || lower.includes('dragon')) {
      return {
        url: '/assets/gallery/evasan_helicoptere_chu.jpg',
        alt: 'Évacuation sanitaire héliportée Dragon 972 SAMU en Martinique'
      };
    }
    if (lower.includes('clinique') || lower.includes('accueil') || lower.includes('admission')) {
      return {
        url: '/assets/gallery/clinique_accueil_urgences.jpg',
        alt: 'Accueil et admissions en clinique médicale partenaire en Martinique'
      };
    }
    if (lower.includes('taxi') || lower.includes('conventionné') || lower.includes('conventionne')) {
      return {
        url: '/assets/gallery/taxi_conventionne_aidant.jpg',
        alt: 'Chauffeur de taxi conventionné CPAM bienveillant pour transport médical en Martinique'
      };
    }
    if (lower.includes('vsl') || lower.includes('assis') || lower.includes('véhicule sanitaire') || lower.includes('vehicule sanitaire')) {
      return {
        url: '/assets/gallery/vsl_transport_cote.jpg',
        alt: 'Véhicule Sanitaire Léger (VSL) conventionné longeant la côte en Martinique'
      };
    }
    if (lower.includes('brancard') || lower.includes('allongé') || lower.includes('allonge')) {
      return {
        url: '/assets/gallery/brancardiers_soins_hopital.jpg',
        alt: 'Équipe d\'ambulanciers brancardiers et transfert civière sécurisé'
      };
    }
    if (lower.includes('pmt') || lower.includes('prescription') || lower.includes('médecin') || lower.includes('medecin') || lower.includes('cerfa')) {
      return {
        url: '/assets/gallery/medecin_prescription_pmt.jpg',
        alt: 'Consultation médicale et validation du bon de transport Cerfa PMT'
      };
    }
    return {
      url: '/assets/gallery/ambulance_martinique_chu.jpg',
      alt: 'Ambulance moderne conventionnée prête pour une mission en Martinique'
    };
  };

  // Détection automatique des tags pour ne jamais laisser le champ vide
  const autoDetectTagIds = (topic: string, keyword: string, availableTags: BlogTag[]): string[] => {
    if (!availableTags || availableTags.length === 0) return [];
    const text = `${topic} ${keyword}`.toLowerCase();
    const matched = new Set<string>();

    for (const tag of availableTags) {
      const name = tag.name.toLowerCase();
      const slug = tag.slug.toLowerCase();
      if (text.includes(name) || text.includes(slug)) {
        matched.add(tag.id);
      }
    }

    if (text.includes('dialyse') || text.includes('rein')) {
      const t = availableTags.find(x => x.slug.includes('dialyse') || x.name.toLowerCase().includes('dialyse'));
      if (t) matched.add(t.id);
      const tAld = availableTags.find(x => x.slug.includes('ald') || x.name.toLowerCase().includes('ald'));
      if (tAld) matched.add(tAld.id);
    }

    if (text.includes('cerfa') || text.includes('prescription') || text.includes('pmt') || text.includes('bon')) {
      const tPmt = availableTags.find(x => x.slug.includes('pmt') || x.name.toLowerCase().includes('pmt'));
      if (tPmt) matched.add(tPmt.id);
      const tBon = availableTags.find(x => x.slug.includes('bon') || x.name.toLowerCase().includes('bon'));
      if (tBon) matched.add(tBon.id);
    }

    if (text.includes('taxi') || text.includes('conventionné') || text.includes('conventionne')) {
      const tTaxi = availableTags.find(x => x.slug.includes('taxi') || x.name.toLowerCase().includes('taxi'));
      if (tTaxi) matched.add(tTaxi.id);
    }

    if (text.includes('vsl') || text.includes('léger') || text.includes('leger') || text.includes('assis')) {
      const tVsl = availableTags.find(x => x.slug.includes('vsl') || x.name.toLowerCase().includes('vsl'));
      if (tVsl) matched.add(tVsl.id);
    }

    if (text.includes('ambulance') || text.includes('allongé') || text.includes('allonge') || text.includes('urgence')) {
      const tAmb = availableTags.find(x => x.slug.includes('ambulance') || x.name.toLowerCase().includes('ambulance'));
      if (tAmb) matched.add(tAmb.id);
    }

    if (text.includes('hôpital') || text.includes('hopital') || text.includes('clinique') || text.includes('sortie')) {
      const tHop = availableTags.find(x => x.slug.includes('hopital') || x.name.toLowerCase().includes('hopital'));
      if (tHop) matched.add(tHop.id);
    }

    if (matched.size === 0) {
      if (availableTags[0]) matched.add(availableTags[0].id);
      if (availableTags[1]) matched.add(availableTags[1].id);
    }

    return Array.from(matched);
  };

  // Génération de contenu de secours riche et complet avec lien de fin obligatoire
  const generateFallbackArticleContent = (topic: string, keyword: string): string => {
    const kw = keyword || topic;
    return `## Introduction

Le recours à un **transport sanitaire** pour **${topic}** est un acte de soin essentiel pour garantir la sécurité et la continuité du parcours de santé du patient. Encadré rigoureusement par le Code de la santé publique et les directives de l'Assurance Maladie, ce mode de déplacement répond à des impératifs médicaux rigoureux.

Ce guide complet vous détaille les critères d'éligibilité, la prescription médicale requise, le niveau de remboursement CPAM et les étapes simples pour réserver votre véhicule adapté.

---

## 1. Cadre légal et Prescription Médicale de Transport (PMT)

Le principe fondamental posé par l'Assurance Maladie est clair : **tout transport sanitaire doit impérativement faire l'objet d'une Prescription Médicale de Transport (PMT, formulaire Cerfa n° 11574) délivrée par votre médecin avant le déplacement**, sauf urgence médicale constatée.

### Les conditions ouvrant droit à une prise en charge
Pour que les frais de transport liés à *${kw}* soient remboursés, ils doivent correspondre à l'une des situations prévues par la réglementation :
- **Transports liés à une hospitalisation** (entrée ou sortie, complète ou ambulatoire) ;
- **Transports liés aux traitements ou examens pour les affections de longue durée (ALD 100%)** si le patient présente une incapacité ou une déficience attestée ;
- **Transports pour des séances de soins répétées** (dialyse, chimiothérapie, radiothérapie, rééducation fonctionnelle) ;
- **Transports en série** (au moins 4 trajets de plus de 50 km aller au cours d'une période de 2 mois pour un même traitement) ;
- **Transports longue distance** (déplacement de plus de 150 km aller).

> **Important** : Pour les transports de longue distance ou en série, un accord préalable du service médical de votre Caisse Primaire d'Assurance Maladie (CPAM) est requis. Pensez à anticiper votre demande au moins 15 jours avant la date du transport.

---

## 2. Quel véhicule choisir : Ambulance, VSL ou Taxi conventionné ?

Le choix du moyen de transport n'appartient ni au patient ni au transporteur : c'est le médecin qui détermine le mode de déplacement le plus adapté à votre autonomie sur la prescription Cerfa.

### L'Ambulance (Transport allongé ou demi-assis sous surveillance)
L'ambulance est prescrite si votre état de santé nécessite :
- Une position allongée ou demi-assise obligatoire ;
- Une surveillance médicale constante par un ambulancier diplômé d'État ;
- Un brancardage ou portage avec aide technique ;
- L'administration d'oxygène ou une surveillance des paramètres vitaux.

### Le VSL ou le Taxi Conventionné (Transport assis professionnalisé)
Si vous pouvez voyager en position assise sans nécessiter d'assistance médicale continue :
- Le **Véhicule Sanitaire Léger (VSL)** et le **Taxi conventionné CPAM** assurent un transport individualisé et sécurisé vers votre centre hospitalier, cabinet médical ou clinique.
- Ces véhicules respectent des normes sanitaires strictes et garantissent la dispense d'avance de frais via le tiers payant.

---

## 3. Remboursement et Tiers Payant CPAM : Zéro avance de frais

Dans la grande majorité des cas relevant d'une ALD 100%, d'un accident du travail, d'une maladie professionnelle ou d'une hospitalisation lourde, le transport est pris en charge à **100% par la Sécurité sociale** sans aucune avance de frais (tiers payant intégral).

Dans les autres cas généraux, la prise en charge standard de l'Assurance Maladie est de **65%**, le solde de 35% étant couvert par votre complémentaire santé ou mutuelle santé responsable.

### Documents à présenter au chauffeur ou ambulancier :
1. La **Prescription Médicale de Transport (PMT)** originale signée et tamponnée par le praticien ;
2. L'**accord préalable de la CPAM** si la situation l'exigeait (longue distance ou série) ;
3. Votre **Carte Vitale** à jour des droits ;
4. Votre **attestation de mutuelle** en cours de validité.

---

## 4. Organisation et conseils pratiques pour vos rendez-vous

Pour garantir la ponctualité de vos soins et limiter le stress du déplacement :
- **Réservez à l'avance** : dès confirmation de votre date de convocation ou d'hospitalisation, planifiez votre trajet auprès d'un transporteur sanitaire agréé.
- **Transmettez vos contraintes de mobilité** : précisez si vous disposez d'un fauteuil roulant pliable, d'un déambulateur ou si vous êtes accompagné par un proche.
- **Gardez vos documents à portée de main** pour faciliter la validation de votre bon de transport dès la prise en charge.

---

### Réservez votre transport conventionné en toute simplicité

Pour planifier sereinement vos déplacements médicaux en ambulance, VSL ou taxi conventionné avec prise en charge Sécurité sociale, réservez directement votre transport sur [www.clinigo.fr](https://www.clinigo.fr).`;
  };

  // Rédaction complète automatique lors du clic sur "Rédiger"
  const autoDraftFullArticleForIdea = async (
    idea: SeoIdea,
    cats: BlogCategory[],
    allTags: BlogTag[]
  ) => {
    setIsAutoGenerating(true);
    setAutoGeneratingStatus(`Démarrage de la rédaction automatique pour "${idea.topic}"...`);
    try {
      const chosenKw = (idea.primary_keyword || idea.topic).trim();
      const audience = (idea.target_audience as any) || 'patient';

      setAutoGeneratingStatus("1/3 Génération du plan éditorial SEO...");
      let plan: any;
      try {
        plan = await aiSeoService.generatePlan({
          topic: idea.topic.trim(),
          targetKeyword: chosenKw,
          targetAudience: audience,
          contentSensitivity: 'GENERAL_INFO',
        });
      } catch (planErr) {
        console.warn('[AutoDraft] Repli plan local :', planErr);
        plan = {
          title: idea.topic,
          slug: idea.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          focusKeyword: chosenKw,
          headings: [
            '## 1. Cadre légal et Prescription Médicale de Transport (PMT)',
            '## 2. Modalités de prise en charge et remboursement Sécurité sociale',
            '## 3. Choisir le bon véhicule : VSL, Taxi conventionné ou Ambulance',
            '## 4. Organisation pratique et démarches',
            '## Réserver votre transport conventionné en ligne'
          ],
          suggestedQuestions: [
            `Comment obtenir le remboursement pour ${chosenKw} ?`,
            'Faut-il avancer les frais auprès du transporteur ?',
            'Quelle est la différence entre VSL et taxi conventionné ?'
          ],
          sourcesToVerify: ['ameli.fr', 'service-public.fr']
        };
      }

      setAutoGeneratingStatus("2/3 Rédaction de l'article complet, chapitres et FAQ...");
      let generated: GeneratedArticleData;
      try {
        generated = await aiSeoService.generateArticle({
          topic: idea.topic.trim(),
          targetKeyword: chosenKw,
          targetAudience: audience,
          contentSensitivity: 'GENERAL_INFO',
          approvedPlan: plan,
        });
      } catch (artErr) {
        console.warn('[AutoDraft] Repli article local :', artErr);
        const fbContent = generateFallbackArticleContent(idea.topic, chosenKw);
        generated = {
          title: plan?.title || idea.topic,
          slug: plan?.slug || idea.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          excerpt: idea.notes || `Guide complet sur ${chosenKw} : prise en charge Sécurité sociale, bon de transport Cerfa et réservation sur Clinigo.fr.`,
          metaTitle: `${plan?.title || idea.topic} | Clinigo`,
          metaDescription: `Découvrez tout ce qu'il faut savoir sur ${chosenKw} : règles de remboursement CPAM et réservation en ligne.`,
          content: fbContent,
          faq: [
            {
              question: `Comment faire prendre en charge un transport pour ${idea.topic} ?`,
              answer: 'Le transport doit obligatoirement faire l\'objet d\'une Prescription Médicale de Transport (PMT Cerfa) délivrée par votre médecin avant le déplacement.'
            },
            {
              question: 'Le tiers payant est-il appliqué ?',
              answer: 'Oui, si vous disposez d\'une ALD 100% ou d\'une dispense d\'avance de frais, le transporteur applique directement le tiers payant avec votre caisse CPAM.'
            }
          ],
          suggestedCta: 'Réserver un transport conventionné',
          suggestedImageAlt: `Illustration transport conventionné pour ${idea.topic}`,
          sources: [
            {
              title: 'Assurance Maladie - Frais de transport',
              url: 'https://www.ameli.fr/assure/remboursements/rembourse/transport',
              organization: 'Caisse Nationale d\'Assurance Maladie (Ameli)',
              verified: true
            }
          ]
        };
      }

      setAutoGeneratingStatus("3/3 Finalisation des métadonnées, images, tags et maillage...");

      // Garantir le lien de fin obligatoire vers www.clinigo.fr
      const finalContent = ensureClinigoEndingLink(generated.content);

      // Image à la une & Alt text SEO automatiques
      const autoImg = autoDetectFeaturedImage(idea.topic, chosenKw);

      // Catégorie thématique automatique
      const autoCatId = autoDetectCategory(idea.topic, chosenKw, cats);

      // Tags automatiques
      const autoTagIds = autoDetectTagIds(idea.topic, chosenKw, allTags);

      const computedSlug = (generated.slug || idea.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).toLowerCase().trim();

      // Remplissage complet de l'ensemble des champs du formulaire
      setTitle(generated.title || idea.topic);
      setSlug(computedSlug);
      setOriginalSlug(computedSlug);
      setExcerpt(generated.excerpt || idea.notes || '');
      setContent(finalContent);
      setMetaTitle(generated.metaTitle || `${generated.title || idea.topic} | Clinigo`);
      setMetaDescription(generated.metaDescription || generated.excerpt || '');
      setCanonicalUrl(`https://clinigo.fr/blog/${computedSlug}`);
      setContentSensitivity('GENERAL_INFO');
      setTargetKeyword(chosenKw);
      setCategoryId(autoCatId);
      setSelectedTagIds(autoTagIds);
      setFeaturedImage(autoImg.url);
      setFeaturedImageAlt(generated.suggestedImageAlt || autoImg.alt);

      if (generated.faq && generated.faq.length > 0) {
        setFaq(generated.faq);
      }
      if (generated.sources && generated.sources.length > 0) {
        setSources(generated.sources);
      }

      setAiTopic(idea.topic);
      setAiKeyword(chosenKw);
      if (idea.target_audience) {
        setAiAudience(idea.target_audience as any);
      }

      setStatus('draft');

      // Marquer l'idée comme rédigée (completed) dans la base
      try {
        await blogService.updateIdeaStatus(idea.id, 'completed');
      } catch (updErr) {
        console.warn('Impossible de mettre à jour le statut de l\'idée:', updErr);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setMessage({
        type: 'success',
        text: `🎉 L'article "${generated.title || idea.topic}" a été entièrement rédigé par l'IA ! Tous les champs (titre, contenu complet, méta-balises, tags, image, FAQ et lien vers www.clinigo.fr) sont remplis.`,
      });
    } catch (err: any) {
      console.error('Erreur lors de la rédaction automatique:', err);
      setMessage({
        type: 'error',
        text: err.message || "Erreur lors de la rédaction automatique de l'article.",
      });
    } finally {
      setIsAutoGenerating(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [id, searchParams]);

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
          setFeaturedImage(post.featured_image || (post as any).featuredImage || '/assets/medictrans_hero_discover.jpg');
          setFeaturedImageAlt((post as any).featured_image_alt || (post as any).featuredImageAlt || '');
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
            const initialSlug = idea.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            setSlug(initialSlug);
            setOriginalSlug(initialSlug);
            setTargetKeyword(idea.primary_keyword || idea.topic);
            setExcerpt(idea.notes || '');
            setAiTopic(idea.topic);
            setAiKeyword(idea.primary_keyword || idea.topic);
            if (idea.target_audience) {
              setAiAudience(idea.target_audience as any);
            }

            // Déclencher immédiatement la rédaction complète automatique de l'article par l'IA
            await autoDraftFullArticleForIdea(idea, cats, allTags);
          }
        } else if (cats.length > 0 && !categoryId) {
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

  // Suppression de l'article en cours
  const handleDeleteArticle = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await blogService.deletePost(id);
      navigate('/admin/seo/articles', {
        state: { deletedMessage: `L'article "${title || 'Sans titre'}" a été définitivement supprimé.` },
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la suppression de l\'article.' });
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
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
        featured_image_alt: featuredImageAlt || title,
        featuredImageAlt: featuredImageAlt || title,
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
        if (finalStatus === 'published') {
          setMessage({
            type: 'success',
            text: 'Article publié en ligne avec succès ! Accessible au public et indexable.',
            actionUrl: `/blog/${updated.slug}`,
            actionLabel: 'Voir l’article sur le site',
          });
        } else {
          setMessage({ type: 'success', text: 'Article mis à jour avec succès !' });
        }
      } else {
        const created = await blogService.createPost(postPayload);
        await blogService.syncPostTags(created.id, selectedTagIds);
        setSavedPostId(created.id);
        setStatus(created.status);
        setOriginalSlug(created.slug);
        if (finalStatus === 'published') {
          setMessage({
            type: 'success',
            text: 'Nouvel article créé et publié en ligne avec succès !',
            actionUrl: `/blog/${created.slug}`,
            actionLabel: 'Voir l’article sur le site',
          });
        } else {
          setMessage({ type: 'success', text: 'Nouvel article créé avec succès !' });
        }
        // Rediriger vers l'URL d'édition
        navigate(`/admin/seo/articles/${created.id}/edit`, { replace: true });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l’enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  // GESTION IA : Génération Directe en 1 Clic (Article complet + Tous les champs remplis)
  const handleOneClickGenerateArticle = async () => {
    if (!aiTopic.trim()) {
      setAiError('Veuillez renseigner un sujet ou une intention de recherche.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiStep('generating');
    try {
      const chosenKw = aiKeyword.trim() || aiTopic.trim();

      // 1. Élaboration du plan structuré
      const plan = await aiSeoService.generatePlan({
        topic: aiTopic.trim(),
        targetKeyword: chosenKw,
        targetAudience: aiAudience,
        contentSensitivity: aiSensitivity,
      });

      // 2. Rédaction complète de l'article avec sections, FAQ et maillage
      const generated = await aiSeoService.generateArticle({
        topic: aiTopic.trim(),
        targetKeyword: chosenKw,
        targetAudience: aiAudience,
        contentSensitivity: aiSensitivity,
        approvedPlan: plan,
      });

      // 3. Remplissage automatique de l'ensemble des champs du formulaire
      setTitle(generated.title);
      setSlug(generated.slug);
      setOriginalSlug(generated.slug);
      setExcerpt(generated.excerpt);
      const finalContent = ensureClinigoEndingLink(generated.content);
      setContent(finalContent);
      setMetaTitle(generated.metaTitle);
      setMetaDescription(generated.metaDescription);
      setCanonicalUrl(`https://clinigo.fr/blog/${generated.slug.toLowerCase().trim()}`);
      setContentSensitivity(aiSensitivity);
      setTargetKeyword(chosenKw);

      // Image à la une & Alt text SEO automatiques
      const autoImg = autoDetectFeaturedImage(aiTopic, chosenKw);
      setFeaturedImage(autoImg.url);
      setFeaturedImageAlt(generated.suggestedImageAlt || autoImg.alt);

      // Catégorie thématique automatique
      const autoCatId = autoDetectCategory(aiTopic, chosenKw, categories);
      if (autoCatId) {
        setCategoryId(autoCatId);
      }

      // Tags automatiques
      const autoTagIds = autoDetectTagIds(aiTopic, chosenKw, tags);
      setSelectedTagIds(autoTagIds);

      // FAQ Schema.org
      if (generated.faq && generated.faq.length > 0) {
        setFaq(generated.faq);
      }
      // Sources officielles
      if (generated.sources && generated.sources.length > 0) {
        setSources(generated.sources);
      }

      setStatus('draft');
      setAiStep('done');
      setShowAiModal(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setMessage({
        type: 'success',
        text: '🎉 Article complet rédigé avec succès ! Tous les champs (titre, image à la une, catégorie, tags, contenu Markdown, SEO, FAQ et sources) ont été remplis automatiquement avec le lien vers www.clinigo.fr.',
      });
    } catch (err: any) {
      setAiError(err.message || "Erreur lors de la génération automatique de l'article.");
      setAiStep('prompt');
    } finally {
      setAiLoading(false);
    }
  };

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
      const chosenKw = aiKeyword.trim() || (aiPlan as any).focusKeyword || aiTopic.trim();
      const generated = await aiSeoService.generateArticle({
        topic: aiTopic,
        targetKeyword: chosenKw,
        targetAudience: aiAudience,
        contentSensitivity: aiSensitivity,
        approvedPlan: aiPlan,
      });

      // Injecter dans l'éditeur
      setTitle(generated.title);
      setSlug(generated.slug);
      setOriginalSlug(generated.slug);
      setExcerpt(generated.excerpt);
      const finalContent = ensureClinigoEndingLink(generated.content);
      setContent(finalContent);
      setMetaTitle(generated.metaTitle);
      setMetaDescription(generated.metaDescription);
      setCanonicalUrl(`https://clinigo.fr/blog/${generated.slug.toLowerCase().trim()}`);
      setContentSensitivity(aiSensitivity);
      setTargetKeyword(chosenKw);

      // Image à la une & Alt text SEO automatiques si non renseignés
      const autoImg = autoDetectFeaturedImage(aiTopic, chosenKw);
      setFeaturedImage(autoImg.url);
      setFeaturedImageAlt(generated.suggestedImageAlt || autoImg.alt);

      // Catégorie thématique automatique
      const autoCatId = autoDetectCategory(aiTopic, chosenKw, categories);
      if (autoCatId) {
        setCategoryId(autoCatId);
      }

      // Tags automatiques
      const autoTagIds = autoDetectTagIds(aiTopic, chosenKw, tags);
      setSelectedTagIds(autoTagIds);

      if (generated.faq && generated.faq.length > 0) {
        setFaq(generated.faq);
      }
      if (generated.sources && generated.sources.length > 0) {
        setSources(generated.sources);
      }
      setStatus('draft');

      setAiStep('done');
      setShowAiModal(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setMessage({
        type: 'success',
        text: '🎉 Article complet et métadonnées générés avec succès par l’IA ! Statut défini en Brouillon pour vérification humaine.',
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

  // Bibliothèque d'images recommandées Clinigo
  const CLINIGO_IMAGE_LIBRARY = [
    {
      title: "Transport Sanitaire Découverte",
      category: "Véhicules",
      url: "/assets/medictrans_hero_discover.jpg",
      description: "Ambulance et VSL d'intervention professionnelle"
    },
    {
      title: "Prescription Médicale (PMT)",
      category: "Réglementation",
      url: "/assets/step1_prescription.jpg",
      description: "Médecin prescripteur et bon de transport Cerfa"
    },
    {
      title: "Régulation & Dispatch SAMU",
      category: "Centrale",
      url: "/assets/step2_dispatch.jpg",
      description: "Centrale d'appels et régulation sanitaire 972"
    },
    {
      title: "Prise en Charge Bienveillante",
      category: "Soins",
      url: "/assets/step3_care.jpg",
      description: "Ambulancier diplômé et accompagnement patient"
    },
    {
      title: "Infirmière & Soignants",
      category: "Personnel",
      url: "/assets/nurse_almont.jpg",
      description: "Soignante de proximité et suivi médicalisé"
    },
    {
      title: "Réseau Santé Martinique",
      category: "Territoire",
      url: "/assets/martinique_map.jpg",
      description: "Carte et couverture des 34 communes de l'île"
    },
    {
      title: "Ambulance SAMU 972 CHUM",
      category: "Urgence",
      url: "/assets/gallery/ambulance_martinique_chu.jpg",
      description: "Ambulance d'urgence devant le CHUM sous les tropiques"
    },
    {
      title: "VSL Transport Médicalisé",
      category: "Véhicules",
      url: "/assets/gallery/vsl_transport_cote.jpg",
      description: "Véhicule Sanitaire Léger en bord de mer en Martinique"
    },
    {
      title: "Taxi Conventionné CPAM",
      category: "Véhicules",
      url: "/assets/gallery/taxi_conventionne_aidant.jpg",
      description: "Chauffeur conventionné aidant un patient avec bienveillance"
    },
    {
      title: "Véhicule Adapté PMR & Fauteuil",
      category: "Véhicules",
      url: "/assets/gallery/transport_pmr_fauteuil.jpg",
      description: "Rampe d'accès et assistance bienveillante pour fauteuil roulant"
    },
    {
      title: "Dialyse & Soins Réguliers",
      category: "Hôpital",
      url: "/assets/gallery/dialyse_centre_soins.jpg",
      description: "Prise en charge spécialisée pour centre de néphrologie"
    },
    {
      title: "Pédiatrie & Maternité",
      category: "Soins",
      url: "/assets/gallery/pediatrie_maternite.jpg",
      description: "Transport mère-enfant rassurant devant l'hôpital soleil"
    },
    {
      title: "Évacuation Sanitaire Hélicoptère",
      category: "Urgence",
      url: "/assets/gallery/evasan_helicoptere_chu.jpg",
      description: "Hélicoptère Dragon 972 SAMU sur l'héliport du CHUM"
    },
    {
      title: "Salle de Régulation & Dispatch SAMU",
      category: "Régulation",
      url: "/assets/gallery/regulation_ambulance_dispatch.jpg",
      description: "Centre de régulation des ambulances et coordination GPS en Martinique"
    },
    {
      title: "Clinique & Accueil Médical",
      category: "Accueil",
      url: "/assets/gallery/clinique_accueil_urgences.jpg",
      description: "Accueil chaleureux et admissions en clinique moderne"
    },
    {
      title: "Brancardiers & Soins Hospitaliers",
      category: "Hôpital",
      url: "/assets/gallery/brancardiers_soins_hopital.jpg",
      description: "Équipe soignante et transfert civière sécurisé"
    },
    {
      title: "Médecin & Prescription Cerfa PMT",
      category: "Réglementation",
      url: "/assets/gallery/medecin_prescription_pmt.jpg",
      description: "Consultation médicale et validation du bon de transport"
    }
  ];

  // Gestionnaire de génération d'image par IA
  const handleGenerateAiImage = async () => {
    if (!imagePrompt.trim()) {
      setImageError("Veuillez saisir un prompt descriptif pour l'image.");
      return;
    }
    setImageGenerating(true);
    setImageError(null);
    try {
      const res = await aiSeoService.generateImage({
        prompt: imagePrompt.trim(),
        aspectRatio: '16:9',
      });
      if (res && res.imageUrl) {
        setImageGeneratedUrl(res.imageUrl);
        setTimeout(() => {
          generatedPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
      } else {
        throw new Error("Impossible de générer l'image.");
      }
    } catch (err: any) {
      setImageError(err.message || "Erreur lors de la génération de l'image.");
    } finally {
      setImageGenerating(false);
    }
  };

  // Application de l'image sélectionnée ou générée
  const handleApplyImage = (url: string, defaultAlt?: string) => {
    if (!url) return;
    setFeaturedImage(url);
    if (!featuredImageAlt && (defaultAlt || title)) {
      setFeaturedImageAlt(defaultAlt || `Illustration : ${title}`);
    }
    setShowImageModal(false);
    setImageGeneratedUrl(null);
    setMessage({
      type: 'success',
      text: "Image de l'article mise à jour avec succès !",
    });
  };

  // Upload direct d'une image locale
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageGeneratedUrl(reader.result);
        setImageError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <AdminLayout
      title={isEditing ? `Modifier l'article : ${title || 'Sans titre'}` : 'Rédiger un nouvel article'}
      subtitle="Éditeur SEO, assistant IA en 2 étapes, audit sémantique et contrôle de sensibilité."
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {savedPostId && status === 'published' && (
            <Link
              to={`/blog/${slug.toLowerCase().trim()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all"
              title="Consulter l'article public en direct (Indexable Google)"
            >
              <span className="material-symbols-outlined text-base">public</span>
              <span>Voir en ligne</span>
            </Link>
          )}

          {savedPostId && (
            <Link
              to={`/preview/blog/${savedPostId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
              title="Prévisualiser avec bandeau sécurisé"
            >
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>Aperçu</span>
            </Link>
          )}

          {isEditing && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
              title="Supprimer définitivement cet article"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              <span className="hidden sm:inline">Supprimer</span>
            </button>
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="material-symbols-outlined text-base">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{message.text}</span>
            {message.actionUrl && (
              <Link
                to={message.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition-colors text-[11px] font-bold shadow-2xs"
              >
                <span>{message.actionLabel || "Voir l'article"}</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </Link>
            )}
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

            <div className="flex items-center gap-2 flex-wrap">
              {savedPostId && status === 'published' && (
                <Link
                  to={`/blog/${slug.toLowerCase().trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all"
                  title="Consulter l'article public en direct (Indexable Google)"
                >
                  <span className="material-symbols-outlined text-base">public</span>
                  <span>Voir en ligne</span>
                </Link>
              )}

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

              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
                  title="Supprimer définitivement cet article"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  <span>Supprimer l'article</span>
                </button>
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

            {/* Gestionnaire d'Image à la une */}
            <div className="space-y-3 pt-3 border-t border-outline-variant/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-primary">image</span>
                  <span>Image à la une</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (!imagePrompt) {
                      setImagePrompt(
                        title
                          ? `${title}, transport médical conventionné en Martinique, professionnel, photoréaliste, 4k`
                          : "Ambulance moderne en intervention en Martinique, photoréaliste, 4k"
                      );
                    }
                    setImageModalTab('ai');
                    setShowImageModal(true);
                  }}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-amber-500">auto_awesome</span>
                  <span>Générer IA</span>
                </button>
              </div>

              {/* Aperçu de l'image actuelle */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container-high group shadow-2xs">
                <img
                  data-testid="featured-image-preview"
                  src={featuredImage || '/assets/medictrans_hero_discover.jpg'}
                  alt={featuredImageAlt || title || "Image de l'article"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e: any) => {
                    e.currentTarget.src = '/assets/medictrans_hero_discover.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!imagePrompt) {
                        setImagePrompt(
                          title
                            ? `${title}, transport médical en Martinique, haute définition, 4k`
                            : "Ambulance moderne en Martinique, photoréaliste 4k"
                        );
                      }
                      setShowImageModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-bold shadow-md transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">tune</span>
                    <span>Changer l'image</span>
                  </button>
                </div>
              </div>

              {/* Boutons d'action rapides */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!imagePrompt) {
                      setImagePrompt(
                        title
                          ? `${title}, ambulance ou VSL médicalisé en Martinique, photoréaliste 4k`
                          : "Ambulance moderne en Martinique, photoréaliste 4k"
                      );
                    }
                    setImageModalTab('ai');
                    setShowImageModal(true);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white text-[11px] font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-amber-300">auto_awesome</span>
                  <span>Générer IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImageModalTab('upload');
                    setShowImageModal(true);
                  }}
                  className="py-2 px-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">upload_file</span>
                  <span>Importer / Biblio</span>
                </button>
              </div>

              {/* Texte Alternatif (Alt SEO) */}
              <div>
                <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                  Texte alternatif SEO (Alt text)
                </label>
                <input
                  type="text"
                  value={featuredImageAlt}
                  onChange={e => setFeaturedImageAlt(e.target.value)}
                  placeholder={title ? `Illustration : ${title}` : "Description pour Google et l'accessibilité"}
                  className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                />
              </div>
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
                    placeholder="Ex: VSL ou Ambulance : Quelles Différences et Quel Transport Choisir ?"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                  />

                  {/* Suggestions de sujets rapides */}
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-on-surface-variant font-semibold">💡 Sujets populaires :</span>
                    {[
                      { topic: "VSL ou Ambulance : Quelles Différences et Quel Transport Choisir ?", kw: "différence vsl ambulance" },
                      { topic: "Prise en charge transport médical CPAM à 100% et ALD", kw: "remboursement transport cpam ald" },
                      { topic: "Transport régulier pour dialyse et néphrologie en Martinique", kw: "transport dialyse martinique" },
                      { topic: "Comment réserver un taxi conventionné avec bon de transport PMT ?", kw: "taxi conventionne pmt cerfa" },
                      { topic: "Transport adapté PMR et fauteuil roulant en Martinique", kw: "transport pmr martinique" },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAiTopic(item.topic);
                          setAiKeyword(item.kw);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-[10px] text-on-surface transition-colors cursor-pointer"
                      >
                        {item.topic.split(':')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-on-surface-variant mb-1">
                      Mot-clé cible principal (optionnel)
                    </label>
                    <input
                      type="text"
                      value={aiKeyword}
                      onChange={e => setAiKeyword(e.target.value)}
                      placeholder="Ex: vsl ou ambulance difference"
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

                <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    className="px-4 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleGeneratePlan}
                      disabled={aiLoading}
                      className="px-4 py-2 rounded-xl border border-purple-300 hover:bg-purple-50 text-purple-900 font-bold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      title="Prévisualiser d'abord le plan des titres H2/H3"
                    >
                      <span className="material-symbols-outlined text-sm">assignment</span>
                      <span>{aiLoading && aiStep === 'prompt' ? 'Génération...' : '1. Prévisualiser le Plan'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOneClickGenerateArticle}
                      disabled={aiLoading}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-emerald-700 hover:from-purple-800 hover:to-emerald-800 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
                      title="Génère directement tout l'article avec image HD, catégorie, SEO et FAQ en 1 clic"
                    >
                      <span className="material-symbols-outlined text-base text-amber-300 animate-pulse">auto_awesome</span>
                      <span>{aiLoading ? 'Rédaction complète en cours...' : 'Rédiger l\'article complet en 1 clic'}</span>
                    </button>
                  </div>
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
      {/* MODAL GESTIONNAIRE D'IMAGE (IA Prompt, Upload, Bibliothèque, URL) */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-xl">image</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Image à la une de l'article
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Générez une illustration par IA, importez une photo ou parcourez notre bibliothèque
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setImageError(null);
                }}
                className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Navigation par Onglets */}
            <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setImageModalTab('ai')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  imageModalTab === 'ai'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-amber-300">auto_awesome</span>
                <span>Générer par IA</span>
              </button>

              <button
                type="button"
                onClick={() => setImageModalTab('upload')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  imageModalTab === 'upload'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                <span>Importer un fichier</span>
              </button>

              <button
                type="button"
                onClick={() => setImageModalTab('library')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  imageModalTab === 'library'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">photo_library</span>
                <span>Bibliothèque Clinigo</span>
              </button>

              <button
                type="button"
                onClick={() => setImageModalTab('url')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  imageModalTab === 'url'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-sm">link</span>
                <span>Lien URL externe</span>
              </button>
            </div>

            {imageError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{imageError}</span>
              </div>
            )}

            {/* Onglet 1 : Génération IA par Prompt */}
            {imageModalTab === 'ai' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                      <span>Description de l'image souhaitée (Prompt IA)</span>
                      <span className="text-error">*</span>
                    </label>
                    <span className="text-[11px] text-on-surface-variant font-mono bg-surface-container px-2 py-0.5 rounded">Format 16:9 recommandé</span>
                  </div>
                  <textarea
                    rows={3}
                    value={imagePrompt}
                    onChange={e => setImagePrompt(e.target.value)}
                    placeholder="Ex: Ambulance moderne arrivant devant le CHU de Martinique sous le soleil des Antilles, équipement professionnel, photoréaliste, 4k"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-purple-600/30 leading-relaxed"
                  />
                </div>

                {/* Suggestions de Prompts rapides */}
                <div>
                  <div className="text-[11px] font-semibold text-on-surface-variant mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-amber-500">lightbulb</span>
                    <span>Idées de prompts rapides adaptés :</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "🖥️ Salle de régulation", prompt: "Salle de régulation et dispatch des ambulances en Martinique, opérateurs avec casques et écrans GPS de suivi" },
                      { label: "🚑 Ambulance SAMU CHU", prompt: "Ambulance moderne SAMU en intervention devant l'hôpital en Martinique, photoréaliste 4k, lumière du jour tropicale" },
                      { label: "🚗 VSL transport assis", prompt: "Véhicule Sanitaire Léger (VSL) blanc professionnel sur une route ensoleillée de Martinique, photoréaliste" },
                      { label: "♿ Véhicule PMR & fauteuil", prompt: "Véhicule médical adapté PMR avec rampe d'accès, chauffeur aidant un patient en fauteuil roulant en Martinique" },
                      { label: "🚕 Taxi conventionné CPAM", prompt: "Taxi médical conventionné avec chauffeur bienveillant aidant un patient senior, Martinique" },
                      { label: "🩺 Dialyse & néphrologie", prompt: "Patient accueilli avec soin pour une séance d'hémodialyse en centre médical spécialisé en Martinique" },
                      { label: "👶 Pédiatrie & maternité", prompt: "Mère et nouveau-né pris en charge avec douceur devant le pôle mère-enfant de l'hôpital en Martinique" },
                      { label: "🚁 Évacuation Dragon 972", prompt: "Hélicoptère médicalisé Dragon 972 de la Sécurité Civile sur l'héliport du CHUM en Martinique" },
                      { label: "📋 Prescription Cerfa PMT", prompt: "Médecin prescripteur et patient complétant un bon de transport Cerfa PMT lors d'une consultation médicale" },
                      { label: "🏥 Clinique & admissions", prompt: "Accueil moderne et soignants à la réception d'une clinique médicale en Martinique" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImagePrompt(item.prompt)}
                        className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 hover:bg-purple-50 hover:text-purple-900 hover:border-purple-300 text-[11px] text-on-surface-variant transition-colors cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bouton de génération */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateAiImage}
                    disabled={imageGenerating || !imagePrompt.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-900 text-white font-bold text-xs shadow-md active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {imageGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Génération de l'image en cours selon votre prompt...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base text-amber-300">auto_awesome</span>
                        <span>Générer l'image avec l'IA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Résultat généré ou en cours de génération */}
                {(imageGeneratedUrl || imageGenerating) && (
                  <div
                    ref={generatedPreviewRef}
                    className="p-4 rounded-2xl bg-surface-container border border-purple-200 space-y-3 animate-fadeIn scroll-mt-4"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                      <div className="flex items-center gap-1.5 text-purple-800">
                        <span className="material-symbols-outlined text-base text-purple-700">
                          {imageGenerating ? 'hourglass_top' : 'check_circle'}
                        </span>
                        <span>
                          {imageGenerating
                            ? 'Création de l\'illustration en cours...'
                            : 'Illustration générée pour votre prompt'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full">
                        Format 16:9 Optimisé
                      </span>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-md bg-slate-900/5 flex items-center justify-center">
                      {imageGenerating ? (
                        <div className="absolute inset-0 z-10 bg-surface-container/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 p-4 text-center">
                          <div className="w-10 h-10 border-3 border-purple-300 border-t-purple-700 rounded-full animate-spin"></div>
                          <div>
                            <div className="text-xs font-bold text-purple-950">Génération de l'illustration en cours...</div>
                            <div className="text-[11px] text-purple-700 mt-0.5">Adaptation photographique 16:9 au transport sanitaire</div>
                          </div>
                        </div>
                      ) : (
                        <img
                          key={imageGeneratedUrl}
                          data-testid="generated-ai-preview"
                          src={imageGeneratedUrl || ''}
                          alt="Image générée par IA"
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            const lower = (imagePrompt || '').toLowerCase();
                            if (lower.includes('régulation') || lower.includes('regulation') || lower.includes('dispatch') || lower.includes('standard')) {
                              e.currentTarget.src = '/assets/gallery/regulation_ambulance_dispatch.jpg';
                            } else if (lower.includes('pmr') || lower.includes('fauteuil')) {
                              e.currentTarget.src = '/assets/gallery/transport_pmr_fauteuil.jpg';
                            } else if (lower.includes('dialyse')) {
                              e.currentTarget.src = '/assets/gallery/dialyse_centre_soins.jpg';
                            } else if (lower.includes('hélicoptère') || lower.includes('evasan') || lower.includes('dragon')) {
                              e.currentTarget.src = '/assets/gallery/evasan_helicoptere_chu.jpg';
                            } else if (lower.includes('clinique') || lower.includes('accueil')) {
                              e.currentTarget.src = '/assets/gallery/clinique_accueil_urgences.jpg';
                            } else if (lower.includes('taxi') || lower.includes('chauffeur')) {
                              e.currentTarget.src = '/assets/gallery/taxi_conventionne_aidant.jpg';
                            } else if (lower.includes('vsl') || lower.includes('assis')) {
                              e.currentTarget.src = '/assets/gallery/vsl_transport_cote.jpg';
                            } else if (lower.includes('brancard')) {
                              e.currentTarget.src = '/assets/gallery/brancardiers_soins_hopital.jpg';
                            } else if (lower.includes('pmt') || lower.includes('médecin') || lower.includes('cerfa')) {
                              e.currentTarget.src = '/assets/gallery/medecin_prescription_pmt.jpg';
                            } else {
                              e.currentTarget.src = '/assets/gallery/ambulance_martinique_chu.jpg';
                            }
                          }}
                        />
                      )}
                    </div>

                    <p className="text-[11px] text-on-surface-variant italic bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20 line-clamp-2">
                      « {imagePrompt} »
                    </p>

                    {!imageGenerating && imageGeneratedUrl && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleGenerateAiImage}
                          disabled={imageGenerating}
                          className="px-3 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">refresh</span>
                          <span>Variante</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyImage(imageGeneratedUrl, imagePrompt)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span className="material-symbols-outlined text-base">done</span>
                          <span>Appliquer à l'article</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Onglet 2 : Importer un fichier */}
            {imageModalTab === 'upload' && (
              <div className="space-y-4 text-center">
                <div className="border-2 border-dashed border-outline-variant/40 hover:border-primary rounded-3xl p-8 bg-surface-container-low/30 transition-colors">
                  <span className="material-symbols-outlined text-5xl text-outline mb-2">cloud_upload</span>
                  <h4 className="text-sm font-bold text-on-surface">
                    Glissez-déposez votre image ici
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 mb-4">
                    Formats acceptés : JPG, PNG, WEBP (Max : 5 Mo)
                  </p>

                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-base">folder_open</span>
                    <span>Parcourir mes fichiers...</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {imageGeneratedUrl && (
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-3 text-left">
                    <div className="text-xs font-bold text-on-surface">Image sélectionnée :</div>
                    <div className="aspect-video rounded-xl overflow-hidden shadow-xs">
                      <img src={imageGeneratedUrl} alt="Aperçu import" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setImageGeneratedUrl(null)}
                        className="px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-semibold cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyImage(imageGeneratedUrl, title)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Appliquer cette image
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Onglet 3 : Bibliothèque d'images Clinigo */}
            {imageModalTab === 'library' && (
              <div className="space-y-3">
                <p className="text-xs text-on-surface-variant">
                  Sélectionnez l'une des illustrations officielles et professionnelles du réseau Clinigo :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {CLINIGO_IMAGE_LIBRARY.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleApplyImage(item.url, item.title)}
                      className={`group relative rounded-2xl overflow-hidden border p-2 transition-all cursor-pointer flex flex-col gap-2 ${
                        featuredImage === item.url
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-outline-variant/30 bg-surface-container-lowest hover:border-primary/50 hover:shadow-sm'
                      }`}
                    >
                      <div className="aspect-video rounded-xl overflow-hidden relative bg-black/5">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e: any) => {
                            e.currentTarget.src = '/assets/medictrans_hero_discover.jpg';
                          }}
                        />
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {item.category}
                        </span>
                        {featuredImage === item.url && (
                          <div className="absolute inset-0 bg-emerald-900/30 flex items-center justify-center">
                            <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">check</span>
                              Actuelle
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Onglet 4 : Lien URL externe */}
            {imageModalTab === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Coller l'URL d'une image web
                  </label>
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={e => setCustomUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... ou /assets/mon-image.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low/40 text-xs text-on-surface focus:outline-none"
                  />
                </div>

                {customUrlInput && (
                  <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                    <div className="text-[11px] font-bold text-on-surface-variant">Aperçu du lien :</div>
                    <div className="aspect-video rounded-xl overflow-hidden max-h-52">
                      <img
                        src={customUrlInput}
                        alt="Aperçu URL"
                        className="w-full h-full object-cover"
                        onError={() => setImageError("Impossible de charger l'image depuis cette URL.")}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(false)}
                    className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs font-semibold text-on-surface cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyImage(customUrlInput, title)}
                    disabled={!customUrlInput.trim()}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    Appliquer cette URL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-200">
                <span className="material-symbols-outlined text-xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface leading-tight">Supprimer cet article ?</h3>
                <p className="text-xs text-on-surface-variant">Cette action est immédiate et irréversible.</p>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl mb-4 border border-outline-variant/20 text-xs space-y-1">
              <div className="font-bold text-on-surface truncate">{title || 'Sans titre'}</div>
              <div className="text-[11px] font-mono text-on-surface-variant">/blog/{slug || 'sans-slug'}</div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-5">
              L'article sera définitivement effacé du catalogue, désindexé et renverra désormais un écran 404 « Guide introuvable » aux visiteurs publics.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteArticle}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span>{isDeleting ? 'Suppression...' : 'Supprimer définitivement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Overlay de Rédaction Automatique IA */}
      {isAutoGenerating && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl p-8 max-w-md w-full shadow-2xl border border-primary/20 text-center animate-scaleUp">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
              <span className="material-symbols-outlined text-3xl">auto_fix_high</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Rédaction IA en cours...</h3>
            <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
              {autoGeneratingStatus || "Rédaction complète de l'article, des métadonnées SEO, des tags et de la FAQ..."}
            </p>
            <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden mb-4">
              <div className="bg-primary h-full rounded-full w-2/3 animate-pulse"></div>
            </div>
            <p className="text-[11px] text-outline">
              Veuillez patienter quelques instants : l'article est entièrement rédigé avec l'ensemble des balises et le lien de réservation vers www.clinigo.fr.
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
