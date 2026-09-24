/**
 * Service Client Sécurisé pour le Hub IA SEO
 * Centralise tous les appels vers le serveur backend (/api/ai/seo)
 * Aucune clé API n'est manipulée dans le frontend.
 */

import { BlogService } from './blogService';

export interface GeneratePlanParams {
  topic: string;
  targetKeyword?: string;
  focusKeyword?: string;
  targetCity?: string;
  contentType?: string;
  contentSensitivity?: string;
  targetAudience?: string;
  tone?: string;
  wordCountTarget?: number;
}

export interface GeneratedPlan {
  title: string;
  slug: string;
  focusKeyword: string;
  intent: string;
  searchIntent?: string;
  headings: string[];
  sections?: Array<{ heading: string; subheadings?: string[] }>;
  suggestedQuestions: string[];
  questions?: string[];
  sourcesToVerify: string[];
  sourcesToConsult?: string[];
}

export interface GenerateArticleParams {
  topic?: string;
  targetKeyword?: string;
  targetAudience?: string;
  contentSensitivity?: string;
  plan?: GeneratedPlan;
  approvedPlan?: any;
  contentType?: string;
  tone?: string;
}

export interface GeneratedArticleData {
  title: string;
  slug: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  faq?: { question: string; answer: string }[];
  suggestedCta?: string;
  suggestedImageAlt?: string;
  sources?: { title: string; url: string; organization?: string; verified: boolean }[];
}

export class AiSeoService {
  static async generatePlan(params: GeneratePlanParams): Promise<any> {
    const startTime = Date.now();
    try {
      const normalizedPayload = {
        topic: params.topic,
        focusKeyword: params.targetKeyword || params.focusKeyword || params.topic,
        contentType: params.contentSensitivity || params.contentType || 'GENERAL_INFO',
        targetAudience: params.targetAudience || 'patient',
      };

      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generatePlan',
          payload: normalizedPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la génération du plan');
      }

      await BlogService.logAiGeneration({
        operation: 'GENERATE_PLAN',
        model: 'gemini-2.5-flash',
        tokensInput: 150,
        tokensOutput: 350,
        durationMs: Date.now() - startTime,
        status: 'SUCCESS',
      });

      const d = json.data || {};
      const sections = d.sections || (d.headings ? d.headings.map((h: string) => ({ heading: h.replace(/^##\s*/, ''), subheadings: [] })) : []);
      const questions = d.questions || d.suggestedQuestions || [];
      const sourcesToConsult = d.sourcesToConsult || d.sourcesToVerify || ['ameli.fr', 'service-public.fr'];

      return {
        ...d,
        title: d.title || params.topic,
        slug: d.slug || params.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        searchIntent: d.searchIntent || d.intent || 'Informationnelle',
        sections,
        questions,
        sourcesToConsult,
      };
    } catch (err: any) {
      await BlogService.logAiGeneration({
        operation: 'GENERATE_PLAN',
        model: 'gemini-2.5-flash',
        tokensInput: 150,
        tokensOutput: 0,
        durationMs: Date.now() - startTime,
        status: 'ERROR',
        error: err.message,
      });
      throw err;
    }
  }

  static async generateArticle(params: GenerateArticleParams): Promise<GeneratedArticleData> {
    const startTime = Date.now();
    try {
      const existingPosts = await BlogService.getAllPosts(false);
      const existingArticles = existingPosts.map((p) => ({ title: p.title, slug: p.slug }));

      const planData = params.approvedPlan || params.plan;

      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateArticle',
          payload: {
            plan: planData,
            topic: params.topic,
            focusKeyword: params.targetKeyword,
            contentType: params.contentSensitivity || 'GENERAL_INFO',
            existingArticles,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur lors de la rédaction de l'article");
      }

      await BlogService.logAiGeneration({
        operation: 'GENERATE_ARTICLE',
        model: 'gemini-2.5-flash',
        tokensInput: 600,
        tokensOutput: 1200,
        durationMs: Date.now() - startTime,
        status: 'SUCCESS',
      });

      const d = json.data;
      const finalContent = ensureClinigoEndingLink(d.content);
      return {
        title: d.title,
        slug: d.slug,
        excerpt: d.excerpt,
        metaTitle: d.metaTitle || `${d.title} | Clinigo`,
        metaDescription: d.metaDescription || d.excerpt,
        content: finalContent,
        faq: d.faq || [],
        suggestedCta: d.suggestedCta,
        suggestedImageAlt: d.suggestedImageAlt,
        sources: d.sources || [],
      };
    } catch (err: any) {
      await BlogService.logAiGeneration({
        operation: 'GENERATE_ARTICLE',
        model: 'gemini-2.5-flash',
        tokensInput: 600,
        tokensOutput: 0,
        durationMs: Date.now() - startTime,
        status: 'ERROR',
        error: err.message,
      });
      throw err;
    }
  }

  static async generateMeta(title: string, content: string) {
    try {
      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateMeta',
          payload: { title, content: content.slice(0, 800) },
        }),
      });
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  }

  static async generateFAQ(topic: string, content: string) {
    try {
      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateFAQ',
          payload: { topic, content: content.slice(0, 1000) },
        }),
      });
      const json = await res.json();
      return json.data?.faq || [];
    } catch {
      return [];
    }
  }

  static async generateIdeas(arg: { count?: number; theme?: string } | number = 5): Promise<any[]> {
    try {
      const count = typeof arg === 'number' ? arg : arg.count || 5;
      const theme = typeof arg === 'object' ? arg.theme : undefined;

      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateIdeas',
          payload: { count, theme },
        }),
      });
      const json = await res.json();
      return json.data?.ideas || [];
    } catch {
      return [];
    }
  }

  static async transformText(params: {
    text: string;
    instruction: string;
    customPrompt?: string;
    targetKeyword?: string;
  }): Promise<string> {
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transformText',
          payload: params,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de la transformation');
      }

      await BlogService.logAiGeneration({
        operation: 'REFINE_SECTION',
        model: 'gemini-2.5-flash',
        tokensInput: Math.ceil(params.text.length / 4),
        tokensOutput: Math.ceil((json.data?.text || '').length / 4),
        durationMs: Date.now() - startTime,
        status: 'SUCCESS',
      });

      return json.data?.text || params.text;
    } catch (err: any) {
      console.error('[AiSeoService] Erreur transformText:', err);
      throw err;
    }
  }

  static async generateImage(params: {
    prompt: string;
    aspectRatio?: string;
  }): Promise<{ imageUrl: string; prompt: string }> {
    const startTime = Date.now();
    try {
      const res = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateImage',
          payload: params,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur lors de la génération de l'image");
      }

      await BlogService.logAiGeneration({
        operation: 'GENERATE_ARTICLE',
        model: 'imagen-3.0',
        tokensInput: 100,
        tokensOutput: 1024,
        durationMs: Date.now() - startTime,
        status: 'SUCCESS',
      });

      return json.data;
    } catch (err: any) {
      console.warn('[AiSeoService] Repli local pour image :', err);
      const lower = (params.prompt || '').toLowerCase();
      const isAntillesRequested = /martinique|guadeloupe|antilles|caraïbes|caraibes|972|971|chum|fort-de-france|pointe-à-pitre|pointe-a-pitre|trinité|lamentin/i.test(params.prompt || '');
      const categories = [
        { file: '/assets/gallery/regulation_ambulance_dispatch.jpg', keywords: ['régulation', 'regulation', 'salle de régulation', 'salle de regulation', 'dispatch', 'centre de régulation', 'standard', 'permanence', 'opérateur', 'coordination', 'écran'], weight: 3.0 },
        { file: '/assets/gallery/transport_pmr_fauteuil.jpg', keywords: ['pmr', 'fauteuil', 'roulant', 'handicap', 'rampe', 'ufr', 'mobilité', 'mobilite'], weight: 2.5 },
        { file: '/assets/gallery/dialyse_centre_soins.jpg', keywords: ['dialyse', 'hémodialyse', 'rein', 'néphrologie', 'chimio', 'séance', 'régulier'], weight: 2.5 },
        { file: '/assets/gallery/pediatrie_maternite.jpg', keywords: ['enfant', 'pédiatrie', 'bébé', 'nourrisson', 'maternité', 'mère', 'maman', 'enceinte', 'naissance'], weight: 2.5 },
        { file: '/assets/gallery/evasan_helicoptere_chu.jpg', keywords: ['hélicoptère', 'helicoptere', 'dragon', 'évasan', 'évacuation', 'héliport', 'aérien'], weight: 2.5 },
        { file: '/assets/gallery/clinique_accueil_urgences.jpg', keywords: ['clinique', 'accueil', 'secrétaire', 'admission', 'rendez-vous', 'rdv'], weight: 2.0 },
        { file: '/assets/gallery/taxi_conventionne_aidant.jpg', keywords: ['taxi', 'conventionné', 'cpam', 'chauffeur', 'senior', 'personne âgée', 'aide', 'aidant'], weight: 2.0 },
        { file: '/assets/gallery/vsl_transport_france.jpg', keywords: ['vsl', 'véhicule sanitaire', 'paris', 'lyon', 'bordeaux', 'marseille', 'france', 'assis', 'berline'], weight: 2.4 },
        { file: '/assets/gallery/vsl_transport_cote.jpg', keywords: ['côte', 'littoral', 'bord de mer', 'plage', 'martinique', 'guadeloupe'], weight: 2.0 },
        { file: '/assets/gallery/brancardiers_soins_hopital.jpg', keywords: ['brancard', 'brancardier', 'civière', 'allongé', 'couché', 'soins', 'transfert', 'couloir'], weight: 2.0 },
        { file: '/assets/gallery/medecin_prescription_pmt.jpg', keywords: ['pmt', 'cerfa', 'prescription', 'bon de transport', 'médecin', 'ordonnance', '100%'], weight: 2.0 },
        { file: '/assets/gallery/ambulance_france_urgence.jpg', keywords: ['paris', 'pompidou', 'necker', 'ile-de-france', 'île-de-france', 'france', 'metropole', 'métropole', 'samu 75'], weight: 3.5 },
        { file: '/assets/gallery/ambulance_martinique_chu.jpg', keywords: ['martinique', 'chum', '972', 'antilles', 'caraïbes', 'caraibes', 'fort-de-france'], weight: 3.0 },
        { file: '/assets/gallery/ambulance_france_urgence.jpg', keywords: ['ambulance', 'samu', 'smur', 'urgence', '15', 'hôpital', 'hopital'], weight: 1.5 }
      ];

      let fallback = isAntillesRequested ? '/assets/gallery/ambulance_martinique_chu.jpg' : '/assets/gallery/ambulance_france_urgence.jpg';
      let highestScore = 0;
      for (const cat of categories) {
        let catScore = 0;
        for (const kw of cat.keywords) {
          if (lower.includes(kw)) catScore += kw.length * cat.weight;
        }
        if (catScore > highestScore) {
          highestScore = catScore;
          fallback = cat.file;
        }
      }
      return { imageUrl: fallback, prompt: params.prompt };
    }
  }
}

export const aiSeoService = AiSeoService;

/**
 * Garantit que le contenu d'un article se termine toujours par une section CTA
 * avec un lien cliquable vers www.clinigo.fr
 */
export const ensureClinigoEndingLink = (content: string): string => {
  if (!content || !content.trim()) {
    return `## Réserver votre transport conventionné en toute simplicité\n\nPour planifier sereinement vos déplacements médicaux en ambulance, VSL ou taxi conventionné avec prise en charge Sécurité sociale, réservez directement votre transport sur [www.clinigo.fr](https://www.clinigo.fr).`;
  }

  const trimmed = content.trim();

  // Si le contenu se termine déjà par [www.clinigo.fr](https://www.clinigo.fr)
  const endingPattern = /\[www\.clinigo\.fr\]\(https?:\/\/(www\.)?clinigo\.fr\/?\)\s*$/i;
  if (endingPattern.test(trimmed)) {
    return trimmed;
  }

  // Si les 250 derniers caractères contiennent déjà le lien exact
  const lastChunk = trimmed.slice(-250);
  if (lastChunk.includes('[www.clinigo.fr](')) {
    return trimmed;
  }

  // Ajout propre du bloc CTA terminal avec le lien obligatoire
  return `${trimmed}\n\n---\n\n### Réservez votre transport conventionné en toute simplicité\n\nPour planifier sereinement vos déplacements médicaux en ambulance, VSL ou taxi conventionné avec prise en charge Sécurité sociale, effectuez votre réservation directement sur [www.clinigo.fr](https://www.clinigo.fr).`;
};
