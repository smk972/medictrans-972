import { searchKnowledgeBase, KNOWLEDGE_BASE } from './knowledge';

// Rate limiter en mémoire par IP (fenêtre glissante de 60 secondes)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  record.count += 1;
  return true;
}

// Nettoyage régulier du cache de rate-limiting
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 120000);

// Détection des urgences médicales vitales
const EMERGENCY_KEYWORDS = [
  'urgence vitale',
  'douleur poitrine',
  'douleur thoracique',
  'infarctus',
  'avc',
  'bras engourdi',
  'paralysie',
  'crise cardiaque',
  'étouffement',
  'ne respire plus',
  'détresse respiratoire',
  'perte de connaissance',
  'inconscient',
  'coma',
  'hémorragie grave',
  'saignement abondant',
  'convulsion'
];

function isMedicalEmergency(text: string): boolean {
  const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return EMERGENCY_KEYWORDS.some(kw => normalized.includes(kw));
}

// Détection des demandes de diagnostic ou prescription médicale
const DIAGNOSIS_KEYWORDS = [
  'quel médicament',
  'posologie',
  'quel traitement',
  'mon diagnostic',
  'suis-je malade',
  'quelle maladie',
  'ordonnance pour',
  'que prendre pour'
];

function isMedicalAdviceRequest(text: string): boolean {
  const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return DIAGNOSIS_KEYWORDS.some(kw => normalized.includes(kw));
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  conversationId?: string;
}

/**
 * Générateur de réponse autonome basé sur la base de connaissances
 * Utilisé si aucune clé externe n'est fournie ou en cas d'indisponibilité du réseau externe
 */
function generateFallbackKnowledgeResponse(userPrompt: string): string {
  if (isMedicalEmergency(userPrompt)) {
    return `🚨 **URGENCE MÉDICALE DÉTECTÉE :**\n\nSi vous-même ou un proche présentez des symptômes graves (douleur thoracique, difficultés respiratoires, signes d'AVC, perte de connaissance ou hémorragie), **composez immédiatement le 15 (SAMU) ou le 112**.\n\n*Médic'Trans 972 est une plateforme de transport sanitaire programmé et ne prend pas en charge les urgences vitales directes.*`;
  }

  if (isMedicalAdviceRequest(userPrompt)) {
    return `ℹ️ **Avertissement Médical :**\n\nEn tant qu'assistant support Médic'Trans 972, je suis spécialisé exclusivement dans l'organisation administrative et logistique des transports sanitaires en Martinique. Je ne suis pas habilité à formuler de diagnostic ni à conseiller de traitement.\n\nVeuillez consulter votre médecin traitant ou un professionnel de santé pour toute question médicale.`;
  }

  const items = searchKnowledgeBase(userPrompt);

  if (items.length > 0) {
    const main = items[0];
    let reply = `Bonjour ! Voici les informations officielles Médic'Trans 972 concernant **${main.title}** :\n\n${main.content}\n\n`;

    if (items.length > 1) {
      reply += `📌 *Informations complémentaires :*\n${items[1].content}\n\n`;
    }

    reply += `Besoin d'une précision supplémentaire ? Vous pouvez également réserver directement en ligne depuis notre onglet **« Réserver un transport »** ou contacter notre équipe au **05 96 72 00 97**.`;
    return reply;
  }

  return `Bonjour ! Je suis l'assistant support Médic'Trans 972, votre service de transport sanitaire en Martinique (Ambulance, VSL, Taxi conventionné CPAM).\n\nJe peux vous renseigner sur :\n• Les différents modes de transport et la Prescription Médicale de Transport (PMT Cerfa S3138)\n• La prise en charge et le tiers-payant CPAM Martinique (100% ALD, hospitalisation)\n• La réservation en ligne ou le choix direct d'un transporteur (délai de 24h & pot commun)\n• Le suivi et l'annulation d'un trajet (/suivi)\n\nComment puis-je vous aider aujourd'hui ?`;
}

/**
 * Construit le prompt système RAG
 */
function buildSystemPrompt(userQuery: string): string {
  const relevantDocs = searchKnowledgeBase(userQuery);
  const contextSnippet = relevantDocs
    .slice(0, 4)
    .map(doc => `### ${doc.title} (${doc.category})\n${doc.content}`)
    .join('\n\n');

  return `Tu es l'assistant IA de support client officiel de la plateforme Médic'Trans Martinique 972.
Ton rôle est d'informer, d'orienter et d'aider les patients, proches aidants, soignants et transporteurs dans l'organisation de transports médicalisés en Martinique.

RÈGLES STRICTES DE SÉCURITÉ ET D'ÉTHIQUE :
1. URGENCE VITALE : Si l'utilisateur mentionne une détresse vitale, douleur thoracique, suspicion d'AVC, étouffement, accident grave, perte de connaissance : ALERTE IMMÉDIATEMENT en invitant à composer le 15 (SAMU), le 112 ou le 18 sans délai.
2. AUCUN DIAGNOSTIC MÉDICAL : Ne jamais poser de diagnostic, ne jamais prescrire de médicament ni donner de conseil thérapeutique personnalisé. Rappelle toujours de consulter un médecin.
3. REMBOURSEMENT : Ne jamais affirmer qu'un transport est garanti 100% remboursé sans rappeler la nécessité d'une Prescription Médicale de Transport (PMT Cerfa S3138) signée AVANT le trajet et de droits valides auprès de la CPAM de Martinique.
4. BASES DE CONNAISSANCES : Privilégie TOUJOURS les informations fournies dans le contexte ci-dessous. N'invente aucune modalité absente de la documentation.
5. LOCALISATION : Tu es spécialisé en Martinique (972), desservant les 34 communes et les pôles majeurs (CHUM Pierre Zobda-Quitman, MFME, Mangot-Vulcin, Trinité, Le Marin, cliniques Saint-Paul et Sainte-Marie).

BASE DE CONNAISSANCES MÉTIER CERTIFIÉE :
${contextSnippet}

CONSIGNE DE TON : Sois bienveillant, clair, professionnel, rassurant et concis. Utilise des puces et du gras Markdown pour faciliter la lecture.`;
}

/**
 * Handler Cloudflare Pages Functions pour POST /api/ai/chat
 */
export async function onRequestPost(context: any): Promise<Response> {
  const request = context.request;
  const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // 1. Vérification du rate limiting
  if (!checkRateLimit(clientIp)) {
    return new Response(JSON.stringify({
      error: 'Trop de requêtes. Veuillez patienter une minute avant de poser une nouvelle question.',
      status: 429
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête JSON invalide.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { messages = [], conversationId = `conv-${Date.now()}` } = body;
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

  // Journalisation sécurisée (sans NIR ni données privées)
  console.log(`[AI Chat] Query received from ${clientIp.slice(0, 7)}*** | Len: ${lastUserMessage.length} | Conv: ${conversationId}`);

  // 2. Interception immédiate des urgences vitales
  if (isMedicalEmergency(lastUserMessage)) {
    const emergencyReply = `🚨 **URGENCE MÉDICALE DÉTECTÉE :**\n\nSi vous ou votre proche êtes en situation d'urgence vitale (douleur thoracique, difficultés à respirer, signes d'AVC, perte de connaissance ou blessure grave), **appelez immédiatement le 15 (SAMU) ou le 112**.\n\n*Médic'Trans 972 régule des transports sanitaires programmés et ne se substitue pas aux interventions d'urgence immédiate du SAMU.*`;
    return new Response(JSON.stringify({
      response: emergencyReply,
      conversationId,
      timestamp: new Date().toISOString(),
      isEmergency: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Récupération de la clé API Gemini côté serveur
  const geminiApiKey = context.env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');

  // Si aucune clé Gemini n'est configurée, repli intelligent sur la base de connaissances
  if (!geminiApiKey) {
    const localReply = generateFallbackKnowledgeResponse(lastUserMessage);
    return new Response(JSON.stringify({
      response: localReply,
      conversationId,
      timestamp: new Date().toISOString(),
      source: 'knowledge-base-autonomous'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. Appel au modèle Gemini 2.5 Flash via REST API
  try {
    const systemInstruction = buildSystemPrompt(lastUserMessage);
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
        topP: 0.8
      }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    if (!apiResponse.ok) {
      console.warn(`[AI Chat] Gemini API warning status: ${apiResponse.status}, falling back to knowledge base.`);
      const fallback = generateFallbackKnowledgeResponse(lastUserMessage);
      return new Response(JSON.stringify({
        response: fallback,
        conversationId,
        timestamp: new Date().toISOString(),
        source: 'knowledge-base-fallback'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data: any = await apiResponse.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('Réponse vide du modèle de langage.');
    }

    return new Response(JSON.stringify({
      response: candidateText,
      conversationId,
      timestamp: new Date().toISOString(),
      source: 'gemini-2.5-flash'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[AI Chat] Error during inference:', error?.message);
    // Garantie de haute disponibilité : jamais d'erreur 500 pour l'utilisateur
    const safeFallback = generateFallbackKnowledgeResponse(lastUserMessage);
    return new Response(JSON.stringify({
      response: safeFallback,
      conversationId,
      timestamp: new Date().toISOString(),
      source: 'safe-recovery'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
