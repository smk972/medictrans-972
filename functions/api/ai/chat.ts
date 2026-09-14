import { searchKnowledgeBase, KNOWLEDGE_BASE } from './knowledge';
import { validateNir, verifyRouteTiming } from './tools';

// Rate limiter en mémoire par IP (fenêtre glissante de 60 secondes)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_MINUTE = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Nettoyage opportuniste si la map devient grande
  if (rateLimitMap.size > 500) {
    for (const [key, data] of rateLimitMap.entries()) {
      if (now > data.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

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
 * Détection et audit du NIR
 */
function extractAndAuditNir(text: string): string | null {
  const match = text.match(/\b([12]\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{3}\s*\d{3}(\s*\d{2})?)\b/);
  if (match) {
    const res = validateNir(match[0]);
    return `🔍 **Audit de votre Numéro de Sécurité Sociale (NIR) :**\n\n${res.message}\n• **Profil déduit :** ${res.gender || 'Non déterminé'}, Né(e) vers ${res.birthYear || 'N/A'}\n• **Département :** ${res.department || 'N/A'}\n• **Clé calculée :** **${res.calculatedKey}**\n\n*Note : Ce contrôle a été exécuté de manière éphémère sans stockage de votre numéro.*`;
  }
  return null;
}

/**
 * Générateur de réponse autonome Niveau 2 basé sur la base de connaissances et les validateurs
 */
function generateFallbackKnowledgeResponse(userPrompt: string): { text: string; formDraft?: any } {
  if (isMedicalEmergency(userPrompt)) {
    return {
      text: `🚨 **URGENCE MÉDICALE DÉTECTÉE :**\n\nSi vous-même ou un proche présentez des symptômes graves (douleur thoracique, difficultés respiratoires, signes d'AVC, perte de connaissance ou hémorragie), **composez immédiatement le 15 (SAMU) ou le 112**.\n\n*Médic'Trans 972 est une plateforme de transport sanitaire programmé et ne prend pas en charge les urgences vitales directes.*`
    };
  }

  if (isMedicalAdviceRequest(userPrompt)) {
    return {
      text: `ℹ️ **Avertissement Médical :**\n\nEn tant qu'assistant support Médic'Trans 972, je suis spécialisé exclusivement dans l'organisation administrative et logistique des transports sanitaires en Martinique. Je ne suis pas habilité à formuler de diagnostic ni à conseiller de traitement.\n\nVeuillez consulter votre médecin traitant ou un professionnel de santé pour toute question médicale.`
    };
  }

  // Audit NIR si présent
  const nirAudit = extractAndAuditNir(userPrompt);
  if (nirAudit) {
    return { text: nirAudit };
  }

  // Audit d'horaires
  const hourMatches = userPrompt.match(/(\d{1,2})h(\d{2})?/gi);
  if (hourMatches && hourMatches.length >= 2) {
    const timingAudit = verifyRouteTiming('Martinique', 'CHUM', hourMatches[0].replace('h', ':'), hourMatches[1].replace('h', ':'));
    return {
      text: `⏱️ **Audit de cohérence de vos horaires (Trafic Martinique) :**\n\n${timingAudit.warningMessage}\n• **Départ :** ${timingAudit.pickupTime} | **Rendez-vous :** ${timingAudit.appointmentTime}\n• **Marge constatée :** ${timingAudit.diffMinutes} minutes (recommandé : ${timingAudit.recommendedMarginMinutes} min pour absorber les ralentissements).`
    };
  }

  // Guide formulaire & Brouillon de réservation (Niveau 2)
  const lower = userPrompt.toLowerCase();
  const isDraftRequest = lower.includes('réserver') || lower.includes('reserver') || lower.includes('brouillon') || (lower.includes('vsl') && (lower.includes('chu') || lower.includes('lamentin')));
  if (isDraftRequest) {
    let transportType: 'taxi' | 'vsl' | 'ambulance' = 'vsl';
    if (lower.includes('taxi')) transportType = 'taxi';
    else if (lower.includes('ambulance')) transportType = 'ambulance';

    const dateMatch = userPrompt.match(/\b(202\d-\d{2}-\d{2})\b/);
    const timeMatch = userPrompt.match(/\b(\d{1,2}[:h]\d{2})\b/i);

    const draft = {
      transportType,
      pickupAddress: lower.includes('lamentin') ? 'Place d\'Armes, Le Lamentin' : 'Cluny, Schoelcher',
      destinationFacility: lower.includes('zobda') || lower.includes('chu') ? 'CHU Pierre Zobda-Quitman - Pôle Oncologie, Fort-de-France' : 'Hôpital Pierre Zobda-Quitman',
      transportDate: dateMatch ? dateMatch[1] : '2026-11-15',
      transportTime: timeMatch ? timeMatch[1].replace('h', ':') : '09:15'
    };

    return {
      text: `✍️ **Brouillon de réservation prêt à être appliqué !**\n\nJ'ai analysé votre demande et préparé les détails de votre transport sanitaire :\n• **Mode :** ${transportType.toUpperCase()}\n• **Départ :** ${draft.pickupAddress}\n• **Destination :** ${draft.destinationFacility}\n• **Date & Heure :** le ${draft.transportDate} à ${draft.transportTime}\n\n👉 Cliquez sur le bouton **« Appliquer à ma réservation »** ci-dessous pour insérer directement ces paramètres dans le formulaire officiel !`,
      formDraft: draft
    };
  }

  if (lower.includes('remplir') || lower.includes('aide formulaire') || lower.includes('formulaire')) {
    return {
      text: `✍️ **Je suis là pour vous aider à remplir votre réservation pas à pas :**\n\n1. **Mode de transport** : Regardez votre bon Cerfa S3138 volet 1 : est-ce coché *Taxi*, *VSL* ou *Ambulance* ?\n2. **Lieu de départ** : Votre adresse en Martinique.\n3. **Destination** : Votre hôpital ou centre de soins (ex: CHU Pierre Zobda-Quitman, MFME, Mangot-Vulcin, Trinité).\n4. **Horaires** : Prévoyez 45 à 60 min de battement le matin pour tenir compte de la circulation.\n5. **Sécurité Sociale** : Saisissez votre NIR complet à 15 chiffres.\n\n💡 *Indiquez-moi votre ville de départ et votre lieu de consultation pour vous guider en direct !*`
    };
  }

  const items = searchKnowledgeBase(userPrompt);

  if (items.length > 0) {
    const main = items[0];
    let reply = `Bonjour ! Je suis **Eva - Aide à la réservation** pour Médic'Trans 972. Voici les informations concernant **${main.title}** :\n\n${main.content}\n\n`;

    if (items.length > 1) {
      reply += `📌 *Informations complémentaires :*\n${items[1].content}\n\n`;
    }

    reply += `Besoin d'aide pour remplir votre formulaire ou vérifier vos pièces justificatives ? N'hésitez pas à me demander !`;
    return { text: reply };
  }

  return {
    text: `Bonjour ! Je suis **Eva - Aide à la réservation** pour Médic'Trans 972.\n\nJe suis spécialement formée pour vous accompagner de bout en bout :\n• 🚑 **Expliquer les différents transports** : Taxi conventionné, VSL, Ambulance\n• ✍️ **Vous guider pour remplir le formulaire** de réservation\n• 🔍 **Vérifier vos informations** (NIR, marge horaires/embouteillages, conformité PMT Cerfa S3138)\n• 📋 **Expliquer les 5 étapes de réservation** et le délai de 24h\n• ❓ **Répondre à toutes vos questions (FAQ)**\n\nComment puis-je vous aider ?`
  };
}

/**
 * Construit le prompt système RAG Niveau 2
 */
function buildSystemPrompt(userQuery: string): string {
  const relevantDocs = searchKnowledgeBase(userQuery);
  const contextSnippet = relevantDocs
    .slice(0, 4)
    .map(doc => `### ${doc.title} (${doc.category})\n${doc.content}`)
    .join('\n\n');

  return `Tu es Eva, l'assistante officielle d'aide à la réservation (Niveau 2) de la plateforme Médic'Trans Martinique 972. Ton nom affiché est "Eva - Aide à la réservation".
Ton rôle est d'informer avec bienveillance et précision, de guider pas-à-pas, d'aider au remplissage et d'auditer les informations saisies par les utilisateurs (patients, aidants, établissements de santé, transporteurs).

TES CAPACITÉS NIVEAU 2 :
1. EXPLICATION DES TRANSPORTS : Explique clairement la différence clinique et réglementaire entre Taxi conventionné (assis autonome), VSL (assis avec aide à la marche ou accompagnement) et Ambulance (allongé/brancardé avec surveillance paramédicale continue).
2. GUIDAGE : Guide l'utilisateur pas-à-pas à travers les étapes de la réservation ou du suivi.
3. AIDE AU REMPLISSAGE : Indique précisément quoi inscrire dans chaque case du formulaire (/reserver) à partir des documents de l'utilisateur.
4. VÉRIFICATION DES INFORMATIONS :
   - Si l'utilisateur mentionne un numéro de sécurité sociale (NIR), analyse sa structure (13 chiffres + 2 chiffres de clé modulo 97) et indique s'il est conforme.
   - Si l'utilisateur indique des horaires, vérifie la marge horaire en alertant sur les embouteillages matinaux récurrents en Martinique (Rocade, Lamentin, CHUM).
   - Rappelle les 5 critères de validité d'une PMT Cerfa S3138 (date avant trajet, mode coché, tampon).
5. ÉTAPES DE RÉSERVATION : Explique les 5 étapes (Mode -> Horaires -> Justificatifs -> Choix direct 24h ou Pot commun -> Confirmation SMS/WhatsApp).
6. FAQ : Réponds de manière précise aux questions fréquentes (tiers-payant, ALD 100%, trajet > 150 km, accompagnateur, annulations).

RÈGLES STRICTES DE SÉCURITÉ ET D'ÉTHIQUE :
1. URGENCE VITALE : Si l'utilisateur mentionne une détresse vitale, douleur thoracique, suspicion d'AVC, étouffement, accident grave, perte de connaissance : ALERTE IMMÉDIATEMENT en invitant à composer le 15 (SAMU) ou le 112 sans délai.
2. AUCUN DIAGNOSTIC MÉDICAL : Ne jamais poser de diagnostic, ne jamais prescrire de médicament ni donner de conseil thérapeutique personnalisé.
3. REMBOURSEMENT : Rappelle toujours la nécessité d'une Prescription Médicale de Transport (PMT Cerfa S3138) signée AVANT le trajet et de droits valides auprès de la CPAM de Martinique.
4. BASES DE CONNAISSANCES : Privilégie TOUJOURS les informations fournies dans le contexte ci-dessous.

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
  console.log(`[AI Chat Niveau 2] Query from ${clientIp.slice(0, 7)}*** | Len: ${lastUserMessage.length} | Conv: ${conversationId}`);

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

  // Si aucune clé Gemini n'est configurée, repli sur le moteur autonome Niveau 2
  if (!geminiApiKey) {
    const localReply = generateFallbackKnowledgeResponse(lastUserMessage);
    return new Response(JSON.stringify({
      response: localReply.text,
      formDraft: localReply.formDraft,
      conversationId,
      timestamp: new Date().toISOString(),
      source: 'knowledge-base-level2-autonomous'
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
        maxOutputTokens: 900,
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
        response: fallback.text,
        formDraft: fallback.formDraft,
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
    const safeFallback = generateFallbackKnowledgeResponse(lastUserMessage);
    return new Response(JSON.stringify({
      response: safeFallback.text,
      formDraft: safeFallback.formDraft,
      conversationId,
      timestamp: new Date().toISOString(),
      source: 'safe-recovery'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
