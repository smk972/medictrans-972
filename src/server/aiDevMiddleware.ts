import { searchKnowledge, KNOWLEDGE_BASE } from '../services/aiKnowledgeBase';
import { validateNir, verifyRouteTiming } from '../../functions/api/ai/tools';

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

  // 5. Aide au remplissage / Formulaire & Brouillon interactif (Niveau 2)
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
      text: `✍️ **Je suis là pour vous aider à remplir votre réservation pas à pas :**\n\n1. **Mode de transport** : Regardez votre bon de transport (Cerfa S3138) volet 1 : est-ce coché *Taxi*, *VSL* ou *Ambulance* ?\n2. **Lieu de départ** : Votre adresse en Martinique (ex: Cluny, Lamentin, Trinité).\n3. **Destination** : Votre hôpital ou clinique (ex: CHU Zobda-Quitman, MFME, Mangot-Vulcin).\n4. **Date & Heure** : Pensez à prévoir 45 à 60 min de marge pour le trajet le matin.\n5. **Sécurité Sociale** : Ayez votre carte Vitale à portée pour le numéro NIR (15 chiffres).\n\n💡 *Dites-moi où vous partez, où vous allez et à quelle heure, et je vous prépare le récapitulatif prêt à être appliqué !*`
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
