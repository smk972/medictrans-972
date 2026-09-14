import { searchKnowledge, KNOWLEDGE_BASE } from '../services/aiKnowledgeBase';
import { validateNir, verifyRouteTiming, extractBookingFieldsFromConversation } from '../../functions/api/ai/tools';

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

function isMedicalAdviceRequest(text: string): boolean {
  const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ['quel médicament', 'posologie', 'quel traitement', 'mon diagnostic', 'suis-je malade'].some(kw => normalized.includes(kw));
}

/**
 * Détection et audit automatique du NIR si présent dans la question
 */
function extractAndAuditNir(text: string): string | null {
  // Détecte les suites de 13 à 15 chiffres, éventuellement séparées par des espaces
  const match = text.match(/\b([12]\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{3}\s*\d{3}(\s*\d{2})?)\b/);
  if (match) {
    const res = validateNir(match[0]);
    return `🔍 **Audit de votre Numéro de Sécurité Sociale (NIR) :**\n\n${res.message}\n• **Profil déduit :** ${res.gender || 'Non déterminé'}, Né(e) vers ${res.birthYear || 'N/A'}\n• **Département :** ${res.department || 'N/A'}\n• **Clé de contrôle calculée :** **${res.calculatedKey}**\n\n*Note de confidentialité : Ce numéro a été audité de manière éphémère sans être conservé ni enregistré en base de données.*`;
  }
  return null;
}

/**
 * Générateur autonome Niveau 2 (Copilote & Auditeur)
 */
function generateAutonomousResponse(userPrompt: string): { text: string; formDraft?: any } {
  // 1. Urgence
  if (isMedicalEmergency(userPrompt)) {
    return {
      text: `🚨 **URGENCE MÉDICALE DÉTECTÉE :**\n\nSi vous ou votre proche présentez des symptômes graves (douleur thoracique, difficultés respiratoires, signes d'AVC, perte de connaissance ou hémorragie), **composez immédiatement le 15 (SAMU) ou le 112**.\n\n*Médic'Trans 972 est un service de transport sanitaire programmé et ne se substitue pas aux interventions d'urgence vitale.*`
    };
  }

  // 2. Conseil médical interdit
  if (isMedicalAdviceRequest(userPrompt)) {
    return {
      text: `ℹ️ **Avertissement Médical :**\n\nEn tant qu'assistant de support Médic'Trans 972, je suis spécialisé dans l'organisation administrative et logistique des transports sanitaires en Martinique. Je ne suis pas habilité à donner de conseil médical ni à poser de diagnostic.\n\nVeuillez contacter votre médecin traitant pour toute question d'ordre clinique.`
    };
  }

  // 3. Audit NIR si un numéro est mentionné
  const nirAudit = extractAndAuditNir(userPrompt);
  if (nirAudit) {
    return { text: nirAudit };
  }

  // 4. Audit des horaires de transport
  const hourMatches = userPrompt.match(/(\d{1,2})h(\d{2})?/gi);
  if (hourMatches && hourMatches.length >= 2) {
    const timingAudit = verifyRouteTiming('Martinique', 'CHUM', hourMatches[0].replace('h', ':'), hourMatches[1].replace('h', ':'));
    return {
      text: `⏱️ **Audit de cohérence de vos horaires (Trafic Martinique) :**\n\n${timingAudit.warningMessage}\n• **Départ :** ${timingAudit.pickupTime} | **Rendez-vous :** ${timingAudit.appointmentTime}\n• **Marge constatée :** ${timingAudit.diffMinutes} minutes (recommandé : ${timingAudit.recommendedMarginMinutes} min sur les axes sensibles comme la Rocade ou le Lamentin).`
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

  // 6. Recherche dans la base RAG Niveau 2
  const items = searchKnowledge(userPrompt);
  if (items.length > 0) {
    const main = items[0];
    let reply = `Bonjour ! Je suis **Eva - Aide à la réservation** pour Médic'Trans 972. Voici les informations concernant **${main.title}** :\n\n${main.content}\n\n`;
    if (items.length > 1) {
      reply += `📌 *Point complémentaire :*\n${items[1].content}\n\n`;
    }
    reply += `Besoin d'aide pour remplir votre formulaire ou vérifier vos pièces justificatives ? N'hésitez pas à me demander !`;
    return { text: reply };
  }

  return {
    text: `Bonjour ! Je suis **Eva - Aide à la réservation** pour Médic'Trans 972.\n\nJe suis spécialement formée pour vous accompagner de bout en bout :\n• 🚑 **Expliquer les différents transports** : Taxi conventionné, VSL, Ambulance\n• ✍️ **Vous guider pour remplir le formulaire** de réservation\n• 🔍 **Vérifier vos informations** : Numéro NIR (Sécurité Sociale), marge horaire et conformité PMT Cerfa S3138\n• 📋 **Expliquer les 5 étapes de réservation** et le délai de 24h\n• ❓ **Répondre à toutes vos questions (FAQ)**\n\nQue souhaitez-vous faire ?`
  };
}

export function handleAiChatMiddleware(req: any, res: any, geminiApiKey?: string) {
  let rawBody = '';
  req.on('data', (chunk: any) => {
    rawBody += chunk;
  });

  req.on('end', async () => {
    try {
      const parsed = JSON.parse(rawBody || '{}');
      const messages = parsed.messages || [];
      const conversationId = parsed.conversationId || `conv-${Date.now()}`;
      const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';

      res.setHeader('Content-Type', 'application/json');

      // Urgence vitale réflexe
      if (isMedicalEmergency(lastUserMessage)) {
        res.statusCode = 200;
        res.end(JSON.stringify({
          response: `🚨 **URGENCE MÉDICALE DÉTECTÉE :**\n\nSi vous ou votre proche êtes en situation d'urgence vitale, **appelez immédiatement le 15 (SAMU) ou le 112**.\n\n*Médic'Trans 972 régule des transports sanitaires programmés et ne se substitue pas au SAMU.*`,
          conversationId,
          timestamp: new Date().toISOString(),
          isEmergency: true
        }));
        return;
      }

      // Si clé Gemini disponible, appel enrichi Niveau 2
      if (geminiApiKey) {
        try {
          const relevantDocs = searchKnowledge(lastUserMessage);
          const contextSnippet = relevantDocs.slice(0, 4).map(d => `### ${d.title}\n${d.content}`).join('\n\n');
          const systemInstruction = `Tu es Eva, l'assistante officielle d'aide à la réservation (Niveau 2) de support client Médic'Trans Martinique 972. Ton nom complet est "Eva - Aide à la réservation".
Tu as les capacités suivantes :
1. Expliquer les différents transports (Taxi conventionné assis autonome, VSL assis avec aide à la marche, Ambulance allongé/brancardé avec surveillance paramédicale continue).
2. Guider l'utilisateur pas-à-pas pour sa réservation sur la plateforme.
3. Aider à remplir le formulaire en indiquant quoi renseigner dans chaque champ.
4. Vérifier les informations saisies :
   - Vérifier le format du numéro NIR (13 chiffres + 2 chiffres clé modulo 97).
   - Vérifier la cohérence des horaires en tenant compte du trafic dense de Martinique (Lamentin, Rocade, CHUM).
   - Vérifier la conformité de la PMT Cerfa S3138 (date avant trajet, mode coché, tampon).
5. Expliquer les 5 étapes de réservation et le délai d'attribution de 24h (priorité transporteur désigné puis pot commun).
6. Répondre aux questions fréquentes (FAQ).

RÈGLES STRICTES :
- AUCUN diagnostic médical ni ordonnance.
- En cas d'urgence vitale, oriente DIRECTEMENT vers le 15 (SAMU) ou le 112.
- Utilise des listes à puces et du gras pour structurer tes explications de manière pédagogique.

Documentation officielle :
${contextSnippet}`;

          const geminiPayload = {
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: messages.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            generationConfig: { temperature: 0.3, maxOutputTokens: 900 }
          };

          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
          const geminiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
          });

          if (geminiRes.ok) {
            const data: any = await geminiRes.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                response: text,
                conversationId,
                timestamp: new Date().toISOString(),
                source: 'gemini-2.5-flash'
              }));
              return;
            }
          }
        } catch (geminiErr: any) {
          console.warn('[Vite Dev AI] Gemini API fallback:', geminiErr?.message);
        }
      }

      // Fallback base autonome Niveau 2
      const result = generateAutonomousResponse(lastUserMessage);
      res.statusCode = 200;
      res.end(JSON.stringify({
        response: result.text,
        formDraft: result.formDraft,
        conversationId,
        timestamp: new Date().toISOString(),
        source: 'knowledge-base-level2'
      }));

    } catch (err: any) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Format JSON invalide' }));
    }
  });
}
