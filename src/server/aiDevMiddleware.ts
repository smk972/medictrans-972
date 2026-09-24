declare const process: any;
declare const require: any;

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
      text: `🚨 **URGENCE MÉDICALE DÉTECTÉE :**\n\nSi vous ou votre proche présentez des symptômes graves (douleur thoracique, difficultés respiratoires, signes d'AVC, perte de connaissance ou hémorragie), **composez immédiatement le 15 (SAMU) ou le 112**.\n\n*Clinigo est un service de transport sanitaire programmé et ne se substitue pas aux interventions d'urgence vitale.*`
    };
  }

  // 2. Conseil médical interdit
  if (isMedicalAdviceRequest(userPrompt)) {
    return {
      text: `ℹ️ **Avertissement Médical :**\n\nEn tant qu'assistante de support Clinigo, je suis spécialisée dans l'organisation administrative et logistique des transports sanitaires en Martinique. Je ne suis pas habilitée à donner de conseil médical ni à poser de diagnostic.\n\nVeuillez contacter votre médecin traitant pour toute question d'ordre clinique.`
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
    let reply = `Bonjour ! Je suis **Eva - Aide à la réservation** pour Clinigo. Voici les informations concernant **${main.title}** :\n\n${main.content}\n\n`;
    if (items.length > 1) {
      reply += `📌 *Point complémentaire :*\n${items[1].content}\n\n`;
    }
    reply += `Besoin d'aide pour remplir votre formulaire ou vérifier vos pièces justificatives ? N'hésitez pas à me demander !`;
    return { text: reply };
  }

  return {
    text: `Bonjour ! Je suis **Eva - Aide à la réservation** pour Clinigo.\n\nJe suis spécialement formée pour vous accompagner de bout en bout :\n• 🚑 **Expliquer les différents transports** : Taxi conventionné, VSL, Ambulance\n• ✍️ **Vous guider pour remplir le formulaire** de réservation\n• 🔍 **Vérifier vos informations** : Numéro NIR (Sécurité Sociale), marge horaire et conformité PMT Cerfa S3138\n• 📋 **Expliquer les 5 étapes de réservation** et le délai de 24h\n• ❓ **Répondre à toutes vos questions (FAQ)**\n\nQue souhaitez-vous faire ?`
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
          response: `🚨 **URGENCE MÉDICALE DÉTECTÉE :**\n\nSi vous ou votre proche êtes en situation d'urgence vitale, **appelez immédiatement le 15 (SAMU) ou le 112**.\n\n*Clinigo régule des transports sanitaires programmés et ne se substitue pas au SAMU.*`,
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
          const systemInstruction = `Tu es Eva, l'assistante officielle d'aide à la réservation de la plateforme Clinigo (clinigo.fr). Ton nom officiel et exclusif est "Eva - Aide à la réservation". Ne mentionne jamais "niveau 2" ni l'intitulé "Assistante Médic'Trans 972".
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

/**
 * Middleware Vite Dev pour POST /api/ai/seo (Génération de contenu SEO, Plan, FAQ, Meta)
 */
export function handleAiSeoMiddleware(req: any, res: any, apiKey?: string) {
  let body = '';
  req.on('data', (chunk: any) => {
    body += chunk;
  });

  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const parsed = JSON.parse(body || '{}');
      const { action, payload } = parsed;
      const geminiApiKey = apiKey || (typeof process !== 'undefined' ? (process as any).env?.GEMINI_API_KEY : '') || '';

      const SYSTEM_SEO_PROMPT = `Tu es l'assistant éditorial en chef et expert SEO de Clinigo (clinigo.fr), plateforme de réservation et régulation de transports sanitaires en France (Ambulance, VSL, Taxi conventionné).
Règles strictes :
1. N'invente AUCUN tarif, loi ou règle légale fictive. Privilégie les sources officielles (ameli.fr, sante.gouv.fr, service-public.fr, legifrance.gouv.fr).
2. Français soigné, pédagogique et empathique. Structure en Markdown (H2 ##, H3 ###).
3. Ne crée de liens internes que vers des URLs existantes.
4. Réponds toujours au format JSON strictement valide.`;

      let resultData: any;

      if (action === 'generatePlan') {
        const { topic, focusKeyword, contentType = 'Guide', wordCountTarget = 1000 } = payload || {};
        if (geminiApiKey) {
          try {
            const prompt = `Génère le PLAN DÉTAILLÉ pour un article SEO sur Clinigo.fr.
Sujet : "${topic}"
Mot-clé : "${focusKeyword}"
Type : ${contentType}
Longueur : ${wordCountTarget} mots
Réponds en JSON :
{
  "title": "Titre optimisé (50-65 car.)",
  "slug": "${(topic || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}",
  "focusKeyword": "${focusKeyword}",
  "intent": "informationnelle",
  "headings": ["## 1. Introduction", "## 2. Conditions de prise en charge", "## 3. Démarches pratiques", "## Comment réserver avec Clinigo ?"],
  "suggestedQuestions": ["Qui est éligible ?", "Faut-il avancer les frais ?"],
  "sourcesToVerify": ["ameli.fr", "service-public.fr"]
}`;
            const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_SEO_PROMPT }] },
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
              })
            });
            if (apiRes.ok) {
              const d: any = await apiRes.json();
              resultData = JSON.parse(d.candidates[0].content.parts[0].text);
            }
          } catch (e) {
            console.warn('[AI SEO Dev] Fallback local plan :', e);
          }
        }
        if (!resultData) {
          resultData = {
            title: `${topic} : Guide Complet & Démarches Pratiques`,
            slug: (topic || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
            focusKeyword: focusKeyword || topic,
            intent: 'informationnelle',
            headings: [
              `## 1. Qu'est-ce que ${focusKeyword || topic} ?`,
              `## 2. Dans quels cas pouvez-vous en bénéficier ?`,
              `## 3. Prise en charge par l'Assurance Maladie et tiers-payant`,
              `## Comment réserver simplement sur Clinigo.fr ?`
            ],
            suggestedQuestions: [
              `Qui a droit au remboursement pour ${focusKeyword || topic} ?`,
              `Quels documents fournir au transporteur sanitaire ?`
            ],
            sourcesToVerify: [
              'ameli.fr - Prise en charge des transports sanitaires',
              'service-public.fr - Prescription Médicale de Transport'
            ]
          };
        }
      } else if (action === 'generateArticle') {
        const { plan, existingArticles = [] } = payload || {};
        if (geminiApiKey) {
          try {
            const prompt = `Rédige l'article complet en suivant ce plan validé :
Titre : ${plan?.title}
Mot-clé : ${plan?.focusKeyword}
Plan : ${plan?.headings?.join('\n')}
FAQ : ${plan?.suggestedQuestions?.join('\n')}
Articles existants pour maillage : ${existingArticles.map((a: any) => `- [${a.title}](/blog/${a.slug})`).join('\n')}

CONSIGNES DE RÉDACTION STRICTES :
1. Rédige un article complet, riche, approfondi et directement publiable (au minimum 800 à 1200 mots).
2. Utilise des balises H2 et H3, des paragraphes pédagogiques, des listes à puces et des encadrés de conseils pour détailler la réglementation (Prescription Médicale de Transport Cerfa, prise en charge CPAM, ALD, tiers payant).
3. L'article DOIT OBLIGATOIREMENT se terminer par une section de conclusion avec un appel à l'action clair contenant le lien markdown exact : [www.clinigo.fr](https://www.clinigo.fr).

Format JSON attendu :
{
  "title": "${plan?.title}",
  "slug": "${plan?.slug}",
  "excerpt": "Résumé incitatif de 130 à 160 caractères contenant le mot-clé.",
  "metaTitle": "${plan?.title} | Clinigo",
  "metaDescription": "Description incitative pour Google de 140 à 160 caractères.",
  "content": "Article complet en Markdown avec H2, H3, listes à puces et se terminant obligatoirement par le lien [www.clinigo.fr](https://www.clinigo.fr).",
  "faq": [{"question": "Question 1", "answer": "Réponse sourcée"}],
  "suggestedCta": "Réserver un transport médicalisé",
  "suggestedImageAlt": "Illustration professionnelle",
  "sources": [{"title": "Ameli.fr", "url": "https://www.ameli.fr", "organization": "Assurance Maladie", "verified": true}]
}`;
            const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_SEO_PROMPT }] },
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
              })
            });
            if (apiRes.ok) {
              const d: any = await apiRes.json();
              resultData = JSON.parse(d.candidates[0].content.parts[0].text);
            }
          } catch (e) {
            console.warn('[AI SEO Dev] Fallback local article :', e);
          }
        }
        if (!resultData) {
          const kw = plan?.focusKeyword || plan?.topic || 'transport sanitaire conventionné';
          const artTitle = plan?.title || `Guide Pratique : ${kw}`;
          const artSlug = plan?.slug || kw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          resultData = {
            title: artTitle,
            slug: artSlug,
            excerpt: `Découvrez notre guide complet sur ${kw} : règles de remboursement, Prescription Médicale de Transport (PMT Cerfa) et réservation en ligne.`,
            metaTitle: `${artTitle} | Clinigo`,
            metaDescription: `Guide pratique sur ${kw} : prise en charge Sécurité sociale, bon de transport Cerfa et réservation sur Clinigo.fr.`,
            content: `## Introduction

Le recours à un **transport sanitaire** pour **${kw}** constitue un maillon essentiel de votre parcours de soins. Encadré rigoureusement par le Code de la santé publique et la Caisse Nationale d'Assurance Maladie (CNAM), ce mode de transport garantit la continuité des soins et la sécurité du patient.

Ce guide pratique réunit l'ensemble des règles administratives, médicales et financières pour bénéficier d'une prise en charge intégrale sans mauvaise surprise.

---

## 1. Cadre réglementaire et Prescription Médicale de Transport (PMT)

Le remboursement des frais de transport n'est pas automatique : il répond à des règles strictes définies par l'Assurance Maladie.

### Le principe de la prescription préalable
Pour que votre déplacement lié à *${kw}* soit remboursé, il doit faire l'objet d'une **Prescription Médicale de Transport (formulaire Cerfa n° 11574)** établie par votre médecin traitant ou le spécialiste hospitalier **avant** le déplacement, sauf situation d'urgence médicale avérée.

### Les situations médicales ouvrant droit à prise en charge
L'Assurance Maladie prend en charge les transports dans les situations suivantes :
- **Entrées et sorties d'hospitalisation** (hospitalisation complète, ambulatoire ou séance de chimiothérapie / radiothérapie) ;
- **Traitements des Affections de Longue Durée (ALD 100%)** lorsque le patient présente des incapacités de déplacement ;
- **Traitements des accidents du travail et maladies professionnelles (AT/MP)** ;
- **Transports en série** : au moins 4 trajets de plus de 50 km sur une période de 2 mois pour un même traitement ;
- **Transports de longue distance** : trajets de plus de 150 km aller avec accord préalable de la CPAM.

---

## 2. Quel véhicule choisir : Ambulance, VSL ou Taxi conventionné ?

Le mode de transport prescrit ne dépend pas du choix personnel du patient mais de son autonomie physique et de son état clinique, certifiés par le médecin sur le volet Cerfa.

### L'Ambulance (Transport Allongé ou Surveillance Médicale)
L'ambulance est obligatoire si vous nécessitez :
- Une position allongée ou demi-assise durant le trajet ;
- Une surveillance médicale constante par un professionnel de santé diplômé ;
- Un brancardage ou un portage complexe avec du matériel dédié ;
- L'administration d'oxygène ou une assistance respiratoire.

### Le VSL ou le Taxi Conventionné CPAM (Transport Assis Professionnalisé)
Si vous êtes autonome pour vous asseoir mais que vous ne pouvez pas utiliser les transports en commun ou conduire vous-même :
- Le **Véhicule Sanitaire Léger (VSL)** ou le **Taxi conventionné CPAM** assurent un transport individualisé et sécurisé.
- Le chauffeur ou l'ambulancier vous aide à monter et descendre du véhicule et assure une transmission fluide avec le personnel soignant.

---

## 3. Prise en charge financière et Tiers Payant CPAM

La prise en charge standard de l'Assurance Maladie s'élève à **65%**, le reste à charge (35%) étant remboursé par votre mutuelle ou complémentaire santé solidaire (CSS).

### Prise en charge à 100% (Dispense totale d'avance de frais)
Vous bénéficiez du **tiers payant intégral à 100%** (zéro avance de frais) si le transport concerne :
1. Une **Affection de Longue Durée (ALD)** exonérante ;
2. Un **Accident du Travail** ou une **Maladie Professionnelle** ;
3. La maternité (à partir du 6ème mois de grossesse jusqu'au 12ème jour après l'accouchement) ;
4. Les bénéficiaires de la **Complémentaire Santé Solidaire (CSS)** ou de l'AME.

---

## 4. Conseils pratiques pour organiser votre trajet

- **Anticipez votre réservation** : réservez dès que vous recevez votre convocation hospitalière ou date de consultation.
- **Préparez vos justificatifs** : munissez-vous de votre bon de transport Cerfa original, de votre Carte Vitale à jour et de votre attestation de mutuelle.
- **Informez le transporteur** de tout équipement spécifique (fauteuil roulant pliant, déambulateur, oxygène portatif).

---

### Réservez votre transport conventionné en toute simplicité

Pour planifier sereinement vos déplacements médicaux en ambulance, VSL ou taxi conventionné avec prise en charge Sécurité sociale, réservez directement votre transport sur [www.clinigo.fr](https://www.clinigo.fr).`,
            faq: (plan?.suggestedQuestions || [
              `Comment obtenir le remboursement pour ${kw} ?`,
              `Faut-il avancer les frais lors du transport ?`,
              `Comment faire en cas de trajet de plus de 150 km ?`
            ]).map((q: string) => ({
              question: q,
              answer: 'Consultez votre médecin pour obtenir une prescription médicale Cerfa avant le déplacement. Sur Clinigo.fr, le tiers payant CPAM est directement appliqué.'
            })),
            suggestedCta: 'Réserver un transport conventionné',
            suggestedImageAlt: `Illustration transport conventionné pour ${kw}`,
            sources: [
              {
                title: 'Assurance Maladie - Prise en charge des frais de transport',
                url: 'https://www.ameli.fr/assure/remboursements/rembourse/transport',
                organization: 'Caisse Nationale d\'Assurance Maladie (Ameli)',
                verified: true
              },
              {
                title: 'Service-Public.fr - Prise en charge des frais de transport en santé',
                url: 'https://www.service-public.fr/particuliers/vosdroits/F2951',
                organization: 'Direction de l\'information légale et administrative',
                verified: true
              }
            ]
          };
        }

        // Sécurité absolue : garantir la présence du lien www.clinigo.fr en fin d'article
        if (resultData && resultData.content) {
          const endingRegex = /\[www\.clinigo\.fr\]\(https?:\/\/(www\.)?clinigo\.fr\/?\)\s*$/i;
          if (!endingRegex.test(resultData.content.trim()) && !resultData.content.slice(-250).includes('[www.clinigo.fr](')) {
            resultData.content = resultData.content.trim() + `\n\n---\n\n### Réservez votre transport conventionné en toute simplicité\n\nPour planifier sereinement vos déplacements médicaux en ambulance, VSL ou taxi conventionné avec prise en charge Sécurité sociale, réservez directement votre transport sur [www.clinigo.fr](https://www.clinigo.fr).`;
          }
        }
      } else if (action === 'generateIdeas') {
        resultData = {
          ideas: [
            {
              topic: 'Transport dialyse',
              keyword: 'transport dialyse remboursement',
              searchIntent: 'informationnelle',
              suggestedTitle: 'Séances de dialyse : Comment organiser et faire rembourser vos transports récurrents ?',
              priority: 'HIGH'
            },
            {
              topic: 'Sortie d\'hospitalisation',
              keyword: 'ambulance sortie clinique',
              searchIntent: 'commerciale',
              suggestedTitle: 'Sortie d\'hospitalisation : Qui réserve le transport sanitaire et dans quel délai ?',
              priority: 'HIGH'
            }
          ]
        };
      } else if (action === 'generateFAQ') {
        const { topic } = payload || {};
        resultData = {
          faq: [
            {
              question: `Comment faire prendre en charge un transport pour ${topic || 'mes soins'} ?`,
              answer: 'La prise en charge requiert obligatoirement une prescription médicale de transport délivrée par votre médecin avant le trajet.'
            },
            {
              question: 'Dois-je avancer les frais avec Clinigo ?',
              answer: 'Non, si vous bénéficiez du tiers-payant (ALD 100%, CSS, maternité), nos transporteurs conventionnés télétransmettent directement à votre caisse.'
            }
          ]
        };
      } else if (action === 'transformText') {
        const { text, instruction, customPrompt, targetKeyword } = payload || {};
        if (!text || !text.trim()) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Texte source requis pour la transformation.' }));
          return;
        }

        let transformed = '';

        if (geminiApiKey) {
          try {
            const prompt = `Tu es l'assistant de rédaction et d'édition de contenu de Clinigo.fr.
Voici le texte sélectionné par l'auteur :
"""
${text}
"""

Consigne demandée : ${instruction === 'custom' ? customPrompt : instruction}
${targetKeyword ? `Mot-clé cible associé : "${targetKeyword}"` : ''}
${instruction === 'transformer_en_tableau' ? 'IMPORTANT : Transforme obligatoirement ces informations sous la forme d’un TABLEAU MARKDOWN propre et lisible avec des colonnes cohérentes (| Colonne 1 | Colonne 2 | ... |).' : ''}

Consignes strictes :
1. Reste fidèle au sens d'origine.
2. Ne commence JAMAIS par des formules de politesse ("Voici la version...") ni de bavardage.
3. Rends DIRECTEMENT et UNIQUEMENT le texte ou tableau transformé en Markdown prêt à être inséré.`;

            const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: 'Tu es un assistant éditorial expert en rédaction médicale et SEO. Rends uniquement le texte final sans bavardage.' }] },
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 }
              })
            });

            if (apiRes.ok) {
              const d: any = await apiRes.json();
              transformed = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            }
          } catch (err) {
            console.warn('[AI Dev Middleware] Fallback local transformText :', err);
          }
        }

        // Fallback local algorithmique
        if (!transformed) {
          if (instruction === 'transformer_en_tableau') {
            const rawLines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
            if (rawLines.length > 0) {
              transformed = `| Élément / Étape | Description & Précisions | Modalités Clinigo |\n| :--- | :--- | :--- |\n`;
              rawLines.forEach((line: string, idx: number) => {
                const parts = line.split(/[:;\-\t|]/).map((p: string) => p.trim()).filter(Boolean);
                if (parts.length >= 2) {
                  transformed += `| ${parts[0]} | ${parts.slice(1).join(' - ')} | Inclus / Garanti |\n`;
                } else {
                  transformed += `| Point ${idx + 1} | ${line.replace(/^[-*•\d.]\s*/, '')} | Conforme CPAM |\n`;
                }
              });
            } else {
              transformed = `| Critère | Détail | Statut |\n| :--- | :--- | :--- |\n| ${text} | Informations vérifiées | Valide |\n`;
            }
          } else if (instruction === 'raccourcir') {
            transformed = text
              .split('\n')
              .filter(Boolean)
              .map((l: string) => `• ${l.replace(/^[-*•\d.]\s*/, '').trim()}`)
              .slice(0, 4)
              .join('\n');
          } else if (instruction === 'simplifier') {
            transformed = `**En clair pour les patients :**\n${text.replace(/ALD\s*30/gi, 'Affection de Longue Durée (ALD)').replace(/PMT/gi, 'Bon de transport (Prescription Médicale)')}\n\n*Conseil Clinigo : Présentez votre attestation de droits à jour au chauffeur lors de la prise en charge.*`;
          } else if (instruction === 'developper') {
            transformed = `${text}\n\nIl convient de noter que la prise en charge à 100% s'applique sous réserve de présentation d'une prescription médicale de transport conforme et, le cas échéant, de l'accord préalable du médecin-conseil de votre caisse d'Assurance Maladie.`;
          } else if (instruction === 'optimiser_seo') {
            transformed = `**${targetKeyword || 'Transport sanitaire'} :** ${text}\n\nNos transporteurs conventionnés (VSL, ambulances, taxis) assurent le respect strict des critères de remboursement Sécurité Sociale.`;
          } else {
            // Reformuler
            transformed = text
              .replace(/faut/g, 'est nécessaire de')
              .replace(/on peut/g, 'il est possible de')
              .trim();
          }
        }

        resultData = {
          transformedText: transformed,
          originalText: text,
          instruction
        };
      } else if (action === 'generateImage') {
        const rawPrompt = payload?.prompt || parsed?.prompt || '';
        const { aspectRatio = '16:9' } = payload || {};
        if (!rawPrompt || !rawPrompt.trim()) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: "Prompt manquant pour la génération d'image" }));
          return;
        }

        const fs = require('fs');
        const path = require('path');
        const { Buffer } = require('buffer');
        const cleanPrompt = rawPrompt.trim();

        // Dossiers locaux pour sauvegarder les images générées
        const publicGenDir = path.join(process.cwd(), 'public', 'assets', 'generated');
        const distGenDir = path.join(process.cwd(), 'dist', 'assets', 'generated');
        const galleryDir = path.join(process.cwd(), 'public', 'assets', 'gallery');

        try {
          if (!fs.existsSync(publicGenDir)) fs.mkdirSync(publicGenDir, { recursive: true });
          if (fs.existsSync(path.join(process.cwd(), 'dist')) && !fs.existsSync(distGenDir)) {
            fs.mkdirSync(distGenDir, { recursive: true });
          }
        } catch (e) {}

        const saveBufferToAssets = (buffer: any): string => {
          const fileName = `ai-${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;
          try {
            fs.writeFileSync(path.join(publicGenDir, fileName), buffer);
            if (fs.existsSync(path.join(process.cwd(), 'dist', 'assets'))) {
              fs.writeFileSync(path.join(distGenDir, fileName), buffer);
            }
            return `/assets/generated/${fileName}`;
          } catch (e) {
            return `data:image/jpeg;base64,${buffer.toString('base64')}`;
          }
        };

        // 1. Traduction & enrichissement sémantique du prompt pour l'IA
        const lowerPrompt = cleanPrompt.toLowerCase();
        const isAntillesRequested = /martinique|guadeloupe|antilles|caraïbes|caraibes|972|971|chum|fort-de-france|pointe-à-pitre|pointe-a-pitre|trinité|lamentin/i.test(cleanPrompt);
        const isParisRequested = /paris|île-de-france|ile-de-france|75|necker|pompidou|pitie|pitié|salpetriere|salpêtrière|cochin|bichat|saint-louis/i.test(cleanPrompt);
        const isMetropoleCity = /lyon|marseille|toulouse|bordeaux|lille|nantes|strasbourg|rennes|nice|montpellier/i.test(cleanPrompt);

        const frReplacements: Array<[RegExp, string]> = [
          [/ambulance/gi, 'French medical emergency ambulance vehicle SAMU'],
          [/vsl|véhicule sanitaire léger|vehicule sanitaire leger/gi, 'white medical patient transport vehicle VSL with blue caduceus'],
          [/taxi conventionné|taxi conventionne/gi, 'certified healthcare medical taxi'],
          [/brancard(ier)?|civière/gi, 'paramedic stretcher transport hospital corridor'],
          [/fauteuil roulant|pmr|handicap|rampe/gi, 'wheelchair accessible medical transport van with hydraulic lift ramp'],
          [/dialyse|hémodialyse|nephrologie/gi, 'hemodialysis specialized care hospital transport'],
          [/maternité|maternite|enceinte|bébé|nourrisson|pédiatrie|pediatrie/gi, 'pediatric and maternity hospital transport caring'],
          [/hélicoptère|helicoptere|dragon 972|évasan|evasan/gi, 'medical evacuation emergency helicopter SAMU helipad'],
          [/clinique|accueil|secrétaire/gi, 'modern medical clinic reception welcoming'],
          [/patient(e)?/gi, 'patient'],
          [/personne âgée|senior/gi, 'elderly patient'],
          [/médecin|docteur/gi, 'doctor with stethoscope and medical transport prescription'],
          [/soignant(e)?|infirmi(er|ère)/gi, 'nurse healthcare professional'],
          [/hôpital|hopital|chu|clinique/gi, 'modern French hospital building'],
          [/martinique|guadeloupe|antilles|caraïbes/gi, 'tropical caribbean island sunny'],
          [/ensoleillé(e)?|soleil/gi, 'bright daylight'],
          [/jaune et blanche|blanche et jaune/gi, 'yellow and white French medical livery'],
          [/blanche?|blanc/gi, 'white medical livery with blue and yellow accents'],
          [/jaune/gi, 'yellow medical livery'],
          [/bleue?|bleu/gi, 'blue medical livery'],
          [/route/gi, 'asphalt road'],
          [/devant/gi, 'parked in front of'],
          [/aide|aidant/gi, 'kindly assisting'],
          [/urgence/gi, 'emergency medical department hospital']
        ];

        let englishPrompt = cleanPrompt;
        for (const [re, en] of frReplacements) {
          englishPrompt = englishPrompt.replace(re, en);
        }

        // Détermination du contexte géographique national vs régional
        let locationModifier = 'in France, modern French healthcare architecture, European street and hospital';
        if (isAntillesRequested) {
          locationModifier = 'in French West Indies Caribbean, sunny tropical setting';
        } else if (isParisRequested) {
          locationModifier = 'in Paris France, Parisian Haussmannian and modern French hospital architecture';
        } else if (isMetropoleCity) {
          locationModifier = 'in modern metropolitan French city hospital';
        }

        const enrichedPrompt = `${englishPrompt}, ${locationModifier}, authentic French medical transport regulations, professional realistic photography, 4k, natural daylight, high resolution, shot on 35mm lens`;

        let finalImageUrl: string | null = null;

        // Étape A : Tentative Gemini Image API si clé disponible
        if (geminiApiKey) {
          try {
            const imgRes = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/images/generations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${geminiApiKey}`
              },
              signal: AbortSignal.timeout(2000),
              body: JSON.stringify({
                model: 'gemini-2.5-flash-image',
                prompt: enrichedPrompt,
                response_format: 'b64_json',
                n: 1,
                size: '1024x1024'
              })
            });
            if (imgRes.ok) {
              const imgData: any = await imgRes.json();
              const b64 = imgData.data?.[0]?.b64_json;
              if (b64) {
                finalImageUrl = saveBufferToAssets(Buffer.from(b64, 'base64'));
              }
            }
          } catch (e: any) {
            console.warn('[AI Image Dev] Gemini Image API error, fallback:', e.message);
          }
        }

        // Étape B : Tentative Pollinations / SANA direct avec timeout modéré
        if (!finalImageUrl) {
          try {
            const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enrichedPrompt)}?width=1024&height=576&nologo=true&seed=${Date.now() % 100000}`;
            const fluxRes = await fetch(fluxUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
              },
              signal: AbortSignal.timeout(3500)
            });
            if (fluxRes.ok && (fluxRes.headers.get('content-type') || '').includes('image')) {
              const buf = Buffer.from(await fluxRes.arrayBuffer());
              if (buf.length > 5000) {
                finalImageUrl = saveBufferToAssets(buf);
              }
            }
          } catch (e: any) {
            console.warn('[AI Image Dev] External AI generation unavailable or timed out, activating semantic matcher:', e.message);
          }
        }

        // Étape C : Sélection sémantique intelligente parmi les catégories 4K nationales et régionales
        if (!finalImageUrl) {
          const lower = cleanPrompt.toLowerCase();
          const categories = [
            {
              file: 'regulation_ambulance_dispatch.jpg',
              keywords: ['régulation', 'regulation', 'salle de régulation', 'salle de regulation', 'dispatch', 'centre de régulation', 'centre de regulation', 'standard', 'permanence', 'opérateur', 'operateur', 'coordination', 'écran', 'ecran', 'centre de contrôle'],
              weight: 3.0
            },
            {
              file: 'transport_pmr_fauteuil.jpg',
              keywords: ['pmr', 'fauteuil', 'roulant', 'handicap', 'rampe', 'ufr', 'mobilité', 'mobilite', 'invalide', 'marcheur', 'chariot'],
              weight: 2.5
            },
            {
              file: 'dialyse_centre_soins.jpg',
              keywords: ['dialyse', 'hémodialyse', 'hemodialyse', 'rein', 'néphrologie', 'nephrologie', 'chimio', 'chimiothérapie', 'chimiotherapie', 'oncologie', 'séance', 'seance', 'régulier', 'regulier'],
              weight: 2.5
            },
            {
              file: 'pediatrie_maternite.jpg',
              keywords: ['enfant', 'pédiatrie', 'pediatrie', 'bébé', 'bebe', 'nourrisson', 'maternité', 'maternite', 'mère', 'mere', 'maman', 'enceinte', 'grossesse', 'accouchement', 'naissance', 'pédiatrique', 'pediatrique'],
              weight: 2.5
            },
            {
              file: 'evasan_helicoptere_chu.jpg',
              keywords: ['hélicoptère', 'helicoptere', 'dragon', 'dragon 972', 'évasan', 'evasan', 'évacuation', 'evacuation', 'héliport', 'heliport', 'aérien', 'aerien', 'vol'],
              weight: 2.5
            },
            {
              file: 'clinique_accueil_urgences.jpg',
              keywords: ['clinique', 'accueil', 'secrétaire', 'secretaire', 'admission', 'rendez-vous', 'rdv', 'bureau', 'guichet', 'centre médical', 'centre medical'],
              weight: 2.0
            },
            {
              file: 'taxi_conventionne_aidant.jpg',
              keywords: ['taxi', 'conventionné', 'conventionne', 'cpam', 'chauffeur', 'senior', 'personne âgée', 'personne agee', 'aide', 'aidant', 'bienveillance', 'domicile', 'artisan'],
              weight: 2.0
            },
            {
              file: 'vsl_transport_france.jpg',
              keywords: ['vsl', 'véhicule sanitaire léger', 'vehicule sanitaire leger', 'lyon', 'paris', 'bordeaux', 'marseille', 'france', 'assis', 'berline'],
              weight: 2.4
            },
            {
              file: 'vsl_transport_cote.jpg',
              keywords: ['côte', 'cote', 'littoral', 'bord de mer', 'plage', 'martinique', 'guadeloupe'],
              weight: 2.0
            },
            {
              file: 'brancardiers_soins_hopital.jpg',
              keywords: ['brancard', 'brancardier', 'civière', 'civiere', 'allongé', 'allonge', 'couché', 'couche', 'perfusion', 'soins', 'transfert', 'couloir'],
              weight: 2.0
            },
            {
              file: 'medecin_prescription_pmt.jpg',
              keywords: ['pmt', 'cerfa', 'prescription', 'bon de transport', 'médecin', 'medecin', 'docteur', 'ordonnance', '100%', 'ald', 'sécurité sociale', 'securite sociale', 'remboursement', 'ameli'],
              weight: 2.0
            },
            {
              file: 'ambulance_france_urgence.jpg',
              keywords: ['paris', 'pompidou', 'necker', 'ile-de-france', 'île-de-france', 'france', 'metropole', 'métropole', 'samu 75', 'smur', 'hopital paris'],
              weight: 3.5
            },
            {
              file: 'ambulance_martinique_chu.jpg',
              keywords: ['martinique', 'chum', '972', 'antilles', 'caraïbes', 'caraibes', 'fort-de-france', 'lamentin', 'trinité', 'trinite'],
              weight: 3.0
            },
            {
              file: 'ambulance_france_urgence.jpg',
              keywords: ['ambulance', 'samu', 'urgence', '15', 'sirène', 'sirene', 'gyrophare', 'garde', 'hopital', 'hôpital'],
              weight: 1.5
            }
          ];

          let bestFile = 'ambulance_france_urgence.jpg';
          let highestScore = 0;

          for (const cat of categories) {
            let catScore = 0;
            for (const kw of cat.keywords) {
              if (lower.includes(kw)) {
                catScore += kw.length * cat.weight;
              }
            }
            if (catScore > highestScore) {
              highestScore = catScore;
              bestFile = cat.file;
            }
          }

          // Si le prompt contient des termes génériques
          if (highestScore === 0) {
            if (lower.includes('voiture') || lower.includes('assis') || lower.includes('vsl')) {
              bestFile = 'vsl_transport_france.jpg';
            } else if (lower.includes('médecin') || lower.includes('papier') || lower.includes('droit')) {
              bestFile = 'medecin_prescription_pmt.jpg';
            } else if (isAntillesRequested) {
              bestFile = 'ambulance_martinique_chu.jpg';
            } else {
              bestFile = 'ambulance_france_urgence.jpg';
            }
          }

          finalImageUrl = `/assets/gallery/${bestFile}`;
        }

        resultData = {
          imageUrl: finalImageUrl,
          prompt: cleanPrompt
        };
      } else {
        resultData = { message: 'Action traitée avec succès' };
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: resultData }));
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ success: false, error: err.message || 'Erreur serveur IA' }));
    }
  });
}

// --------------------------------------------------------------------------
// MIDDLEWARE BLOG & GUIDES CMS (Vite Dev Server)
// --------------------------------------------------------------------------
export function handleBlogMiddleware(req: any, res: any) {
  const fs = require('fs');
  const path = require('path');
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const method = req.method;

  const DATA_DIR = path.join(process.cwd(), 'data');
  const POSTS_FILE = path.join(DATA_DIR, 'blog_posts.json');
  const CATEGORIES_FILE = path.join(DATA_DIR, 'blog_categories.json');

  const getPosts = () => {
    try {
      if (fs.existsSync(POSTS_FILE)) {
        return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
      }
    } catch (e) {}
    return [];
  };

  const savePosts = (posts: any[]) => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
      return true;
    } catch (e) {
      return false;
    }
  };

  const getCategories = () => {
    try {
      if (fs.existsSync(CATEGORIES_FILE)) {
        return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
      }
    } catch (e) {}
    return [];
  };

  res.setHeader('Content-Type', 'application/json');

  if (pathname === '/api/blog/categories' && method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: getCategories() }));
    return;
  }

  if (pathname.startsWith('/api/blog/posts')) {
    const idFromPath = pathname.replace('/api/blog/posts', '').replace(/^\//, '');

    if (idFromPath && method === 'GET') {
      const posts = getPosts();
      const post = posts.find((p: any) => p.id === idFromPath || p.slug === idFromPath.toLowerCase());
      if (post) {
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, data: post }));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, error: 'Article introuvable' }));
      }
      return;
    }

    if (idFromPath && method === 'DELETE') {
      let posts = getPosts();
      const prev = posts.length;
      posts = posts.filter((p: any) => p.id !== idFromPath);
      savePosts(posts);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, deleted: prev !== posts.length }));
      return;
    }

    if (method === 'GET') {
      const slug = parsedUrl.searchParams.get('slug');
      const status = parsedUrl.searchParams.get('status');
      const categoryId = parsedUrl.searchParams.get('categoryId');
      const tagId = parsedUrl.searchParams.get('tagId');
      const allowDraft = parsedUrl.searchParams.get('allowDraft') === 'true';

      let posts = getPosts();

      if (slug) {
        const cleanSlug = slug.trim().toLowerCase();
        const post = posts.find((p: any) => p.slug === cleanSlug);
        if (post) {
          if (!allowDraft && post.status !== 'published') {
            res.statusCode = 404;
            res.end(JSON.stringify({ success: false, error: 'Article non publié' }));
            return;
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, data: post }));
          return;
        }
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, error: 'Article introuvable' }));
        return;
      }

      if (status && status !== 'all') {
        posts = posts.filter((p: any) => p.status === status);
      } else if (!status) {
        posts = posts.filter((p: any) => p.status === 'published');
      }

      if (categoryId) {
        posts = posts.filter((p: any) => p.categoryId === categoryId || p.category_id === categoryId);
      }

      if (tagId) {
        posts = posts.filter((p: any) => p.tags && p.tags.some((t: any) => t.id === tagId));
      }

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: posts, total: posts.length }));
      return;
    }

    if (method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => { body += chunk; });
      req.on('end', () => {
        try {
          const postData = JSON.parse(body);
          let posts = getPosts();
          const categories = getCategories();

          const now = new Date().toISOString();
          const id = postData.id || `post-${Date.now()}`;
          const existingIdx = posts.findIndex((p: any) => p.id === id);

          const catId = postData.categoryId || postData.category_id;
          const resolvedCategory = postData.category || categories.find((c: any) => c.id === catId);

          const fullPost = {
            ...(existingIdx >= 0 ? posts[existingIdx] : {}),
            ...postData,
            id,
            slug: (postData.slug || 'article').toLowerCase().trim(),
            status: postData.status || (existingIdx >= 0 ? posts[existingIdx].status : 'draft'),
            featured_image: postData.featured_image || postData.featuredImage || '/assets/step2_dispatch.jpg',
            featuredImage: postData.featuredImage || postData.featured_image || '/assets/step2_dispatch.jpg',
            category_id: catId,
            categoryId: catId,
            category: resolvedCategory,
            published_at: postData.status === 'published' ? (postData.published_at || postData.publishedAt || now) : null,
            publishedAt: postData.status === 'published' ? (postData.publishedAt || postData.published_at || now) : null,
            updated_at: now,
            updatedAt: now,
            created_at: (existingIdx >= 0 && posts[existingIdx].created_at) || postData.created_at || now,
            createdAt: (existingIdx >= 0 && posts[existingIdx].createdAt) || postData.createdAt || now,
          };

          if (existingIdx >= 0) {
            posts[existingIdx] = fullPost;
          } else {
            posts.unshift(fullPost);
          }

          savePosts(posts);

          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, data: fullPost }));
        } catch (e: any) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, error: 'Route blog non reconnue' }));
}

export function handleClientsMiddleware(req: any, res: any) {
  const fs = require('fs');
  const path = require('path');
  const DATA_DIR = path.join(process.cwd(), 'data');
  const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');

  const getStored = () => {
    try {
      if (fs.existsSync(CLIENTS_FILE)) return JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));
    } catch {}
    return [];
  };

  const saveStored = (data: any) => {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(CLIENTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch {}
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === '/api/clients' && req.method === 'GET') {
    const clients = getStored();
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: clients, total: clients.length }));
    return;
  }

  if (pathname === '/api/clients' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        const clientData = JSON.parse(body);
        let clients = getStored();
        const id = clientData.id || `client-${Date.now()}`;
        const idx = clients.findIndex((c: any) => c.id === id || (clientData.email && c.email.toLowerCase() === clientData.email.toLowerCase()));
        const fullClient = {
          ...(idx >= 0 ? clients[idx] : {}),
          ...clientData,
          id,
          updatedAt: new Date().toISOString()
        };
        if (idx >= 0) clients[idx] = fullClient;
        else clients.unshift(fullClient);
        saveStored(clients);
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, data: fullClient }));
      } catch (e: any) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/clients/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/clients/', '').trim();
    let clients = getStored();
    const prev = clients.length;
    clients = clients.filter((c: any) => c.id !== id);
    saveStored(clients);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, deleted: prev !== clients.length }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, error: 'Route client introuvable' }));
}

export function handleUsersMiddleware(req: any, res: any) {
  const fs = require('fs');
  const path = require('path');
  const DATA_DIR = path.join(process.cwd(), 'data');
  const USERS_FILE = path.join(DATA_DIR, 'users.json');
  const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');

  const getStoredUsers = () => {
    try {
      if (fs.existsSync(USERS_FILE)) return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {}
    return [];
  };

  const saveStoredUsers = (data: any) => {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch {}
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === '/api/users' && req.method === 'GET') {
    const users = getStoredUsers();
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, data: users, total: users.length }));
    return;
  }

  if (pathname === '/api/users' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        const userData = JSON.parse(body);
        let users = getStoredUsers();
        const id = userData.id || `user-${Date.now()}`;
        const cleanEmail = (userData.email || '').toLowerCase().trim();
        const idx = users.findIndex((u: any) => u.id === id || (cleanEmail && u.email.toLowerCase() === cleanEmail));
        const fullUser = {
          ...(idx >= 0 ? users[idx] : {}),
          ...userData,
          id: idx >= 0 ? users[idx].id : id,
          updatedAt: new Date().toISOString()
        };
        if (idx >= 0) users[idx] = fullUser;
        else users.unshift(fullUser);
        saveStoredUsers(users);

        // Si PATIENT, synchroniser également dans clients.json
        if (fullUser.role === 'PATIENT' || !fullUser.role) {
          try {
            let clients: any[] = [];
            if (fs.existsSync(CLIENTS_FILE)) clients = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));
            const cIdx = clients.findIndex((c: any) => c.email.toLowerCase() === cleanEmail);
            if (cIdx === -1) {
              const dept = fullUser.phone?.startsWith('0696') || fullUser.phone?.startsWith('0596') ? '97200' :
                           fullUser.phone?.startsWith('0690') || fullUser.phone?.startsWith('0590') ? '97100' :
                           fullUser.phone?.startsWith('0694') || fullUser.phone?.startsWith('0594') ? '97300' :
                           fullUser.phone?.startsWith('0692') || fullUser.phone?.startsWith('0262') ? '97400' : '75000';
              const cityName = dept === '97200' ? 'Fort-de-France' :
                                dept === '97100' ? 'Pointe-à-Pitre' :
                                dept === '97300' ? 'Cayenne' :
                                dept === '97400' ? 'Saint-Denis' : 'Paris';

              clients.unshift({
                id: `client-${fullUser.id}`,
                firstName: fullUser.firstName || 'Patient',
                lastName: fullUser.lastName || '',
                birthDate: '1980-01-01',
                nir: fullUser.nir || '1 80 01 75 000 000 00',
                phone: fullUser.phone || '06 00 00 00 00',
                email: fullUser.email,
                address: 'Adresse déclarée à l’inscription',
                city: cityName,
                postalCode: dept,
                isAld: false,
                hasPmt: true,
                mobility: {
                  wheelchair: false,
                  stretcher: false,
                  oxygen: false,
                  stairsWithoutElevator: false,
                  needsEscort: false
                },
                status: 'ACTIVE',
                createdAt: fullUser.createdAt || new Date().toISOString(),
                notes: 'Inscription en ligne sur Clinigo.fr'
              });
              fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), 'utf8');
            }
          } catch {}
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, data: fullUser }));
      } catch (e: any) {
        res.statusCode = 400;
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, error: 'Route user introuvable' }));
}


