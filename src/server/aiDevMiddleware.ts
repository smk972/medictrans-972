import { searchKnowledge, KNOWLEDGE_BASE } from '../services/aiKnowledgeBase';

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

function generateAutonomousResponse(userPrompt: string): string {
  if (isMedicalEmergency(userPrompt)) {
    return `🚨 **URGENCE MÉDICALE DÉTECTÉE :**\n\nSi vous ou votre proche présentez des symptômes graves (douleur thoracique, difficultés respiratoires, signes d'AVC, perte de connaissance ou hémorragie), **composez immédiatement le 15 (SAMU) ou le 112**.\n\n*Médic'Trans 972 est un service de transport sanitaire programmé et ne se substitue pas aux interventions d'urgence vitale.*`;
  }

  if (isMedicalAdviceRequest(userPrompt)) {
    return `ℹ️ **Avertissement Médical :**\n\nEn tant qu'assistant de support Médic'Trans 972, je suis spécialisé dans l'organisation administrative et logistique des transports sanitaires en Martinique. Je ne suis pas habilité à donner de conseil médical ni à poser de diagnostic.\n\nVeuillez contacter votre médecin traitant pour toute question d'ordre clinique.`;
  }

  const items = searchKnowledge(userPrompt);
  if (items.length > 0) {
    const main = items[0];
    let reply = `Bonjour ! Voici les informations officielles Médic'Trans 972 concernant **${main.title}** :\n\n${main.content}\n\n`;
    if (items.length > 1) {
      reply += `📌 *Informations complémentaires :*\n${items[1].content}\n\n`;
    }
    reply += `Vous pouvez réserver directement en ligne dans l'onglet **« Réserver un transport »** ou contacter notre équipe au **05 96 72 00 97**.`;
    return reply;
  }

  return `Bonjour ! Je suis l'assistant support Médic'Trans 972, spécialisé dans les transports sanitaires en Martinique (Ambulances, VSL, Taxis conventionnés CPAM).\n\nJe peux vous renseigner sur :\n• Les différents types de véhicules et la Prescription Médicale de Transport (PMT)\n• La prise en charge CPAM 972 et le tiers-payant\n• La réservation en ligne ou le choix nominatif d'un transporteur (délai 24h & pot commun)\n• Le suivi et l'annulation d'un trajet (/suivi)\n\nQue puis-je faire pour vous ?`;
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

      // Urgence vitale
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

      // Si clé Gemini disponible
      if (geminiApiKey) {
        try {
          const relevantDocs = searchKnowledge(lastUserMessage);
          const contextSnippet = relevantDocs.slice(0, 4).map(d => `### ${d.title}\n${d.content}`).join('\n\n');
          const systemInstruction = `Tu es l'assistant IA de support client officiel de Médic'Trans Martinique 972.
Aide avec bienveillance les utilisateurs pour organiser leurs transports sanitaires en Martinique.
INTERDICTION FORMELLE : Aucun diagnostic ni conseil médical. En cas d'urgence vitale, renvoie immédiatement vers le 15 (SAMU) ou le 112.
Remboursement : rappelle l'obligation de la PMT Cerfa S3138 préalable.
Base documentaire certifiée :
${contextSnippet}`;

          const geminiPayload = {
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: messages.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
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

      // Fallback base de connaissances locale
      const reply = generateAutonomousResponse(lastUserMessage);
      res.statusCode = 200;
      res.end(JSON.stringify({
        response: reply,
        conversationId,
        timestamp: new Date().toISOString(),
        source: 'knowledge-base-local'
      }));

    } catch (err: any) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Format JSON invalide' }));
    }
  });
}
