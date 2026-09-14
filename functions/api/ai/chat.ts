import { searchKnowledgeBase, KNOWLEDGE_BASE } from './knowledge';
import { validateNir, verifyRouteTiming, extractBookingFieldsFromConversation } from './tools';

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

  // 5. Remplissage direct par la conversation & Extraction d'entités (Niveau 2)
  const lower = userPrompt.toLowerCase();

  // Question spécifique sur la capacité d'Eva à remplir directement le formulaire
  if (
    lower.includes('rempli') &&
    (lower.includes('directement') || lower.includes('champs') || lower.includes('conversant') || lower.includes('conversation') || lower.includes('interlocuteur'))
  ) {
    return {
      text: `✨ **Oui, absolument ! Je peux remplir directement et en temps réel l'ensemble des champs de votre formulaire de réservation au cours de notre conversation.**\n\nVous n'avez pas besoin de remplir chaque case manuellement : vous me donnez vos informations dans le chat et **je les insère instantanément sur votre écran** !\n\nPar exemple, dites-moi simplement :\n• *« Je veux réserver un VSL pour aller au CHU Zobda-Quitman le 28 octobre à 08h30 depuis Schoelcher »*\n• *« Mon numéro de sécurité sociale est le 1 54 08 97 213 456 88 »*\n• *« Mon fils m'accompagne »*\n\n👉 **Dès que vous m'envoyez un message, le formulaire se met à jour en direct sous vos yeux.** Vous pouvez ensuite vérifier et valider votre demande en un clic !\n\n*Que souhaitez-vous que je renseigne pour vous dès maintenant ?*`
    };
  }

  // Extraction d'entités en direct
  const extraction = extractBookingFieldsFromConversation(userPrompt);
  if (extraction.hasUpdates) {
    let confirmationText = `⚡ **J'ai directement mis à jour votre formulaire en direct :**\n\n`;
    for (const item of extraction.updatedFieldsList) {
      confirmationText += `• ✅ **${item}**\n`;
    }
    confirmationText += `\n*Les cases correspondantes sur votre écran ont été automatiquement renseignées en temps réel !*`;

    // Éventuel audit trafic si heure détectée
    if (extraction.fields.transportTime) {
      confirmationText += `\n\n⏱️ *Rappel trafic Martinique : Pensez à prévoir 45 à 60 min de marge sur l'axe Lamentin / Rocade le matin.*`;
    }

    const missing: string[] = [];
    if (!extraction.fields.transportType) missing.push('le type de véhicule prescrit (Taxi, VSL ou Ambulance)');
    if (!extraction.fields.pickupAddress) missing.push('votre commune ou quartier de prise en charge');
    if (!extraction.fields.destinationFacility) missing.push('votre hôpital ou clinique de destination');
    if (!extraction.fields.transportDate || !extraction.fields.transportTime) missing.push('la date et l\'heure de convocation');
    if (!extraction.fields.patientNir) missing.push('votre numéro de Sécurité Sociale (NIR)');

    if (missing.length > 0) {
      confirmationText += `\n\n💡 *Indiquez-moi maintenant : ${missing.slice(0, 2).join(' et ')}, et je les ajoute immédiatement au formulaire !*`;
    } else {
      confirmationText += `\n\n🎉 *Toutes vos informations principales sont enregistrées sur le formulaire ! Il ne vous reste plus qu'à vérifier et finaliser votre réservation.*`;
    }

    return {
      text: confirmationText,
      formDraft: extraction.fields
    };
  }

  if (lower.includes('remplir') || lower.includes('aide formulaire') || lower.includes('formulaire')) {
    return {
      text: `✍️ **Je suis là pour remplir votre réservation en direct avec vous :**\n\nIndiquez-moi simplement dans notre échange :\n1. **Votre transport prescrit** : Taxi conventionné, VSL ou Ambulance ?\n2. **Votre adresse de départ** en Martinique (ex: Schoelcher, Lamentin, Sainte-Luce).\n3. **Votre destination** : CHU Zobda-Quitman, MFME, Mangot-Vulcin, Clarac...\n4. **La date et l'heure** de votre rendez-vous.\n5. **Votre numéro de Sécurité Sociale** (NIR sur votre carte Vitale).\n\n💡 *Dites-moi ces informations comme vous le souhaitez, et je remplis les champs immédiatement sur votre écran !*`
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

  return `Tu es Eva, l'assistante officielle d'aide à la réservation de la plateforme Médic'Trans Martinique 972. Ton nom officiel et exclusif est "Eva - Aide à la réservation". Ne mentionne jamais "niveau 2" ni l'intitulé "Assistante Médic'Trans 972".
Ton rôle est d'informer avec bienveillance et précision, de guider pas-à-pas, d'aider au remplissage et d'auditer les informations saisies par les utilisateurs (patients, aidants, établissements de santé, transporteurs).

TES CAPACITÉS :
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
