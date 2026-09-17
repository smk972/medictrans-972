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
      return {
        title: d.title,
        slug: d.slug,
        excerpt: d.excerpt,
        metaTitle: d.metaTitle || `${d.title} | Clinigo`,
        metaDescription: d.metaDescription || d.excerpt,
        content: d.content,
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
}

export const aiSeoService = AiSeoService;
