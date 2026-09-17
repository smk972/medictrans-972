/**
 * Serveur de Production Node.js pour Plesk (VPS IONOS)
 * Médic'Trans 972 / Clinigo
 * 
 * Fonctionnalités :
 * 1. Sert les fichiers statiques de production générés par Vite dans `dist/`
 * 2. Gère le routage Single Page Application (SPA) avec fallback automatique vers `index.html`
 * 3. Gère l'endpoint de l'assistant IA `POST /api/ai/chat` (compatible avec l'ancienne Cloudflare Function)
 * 4. Fournit un endpoint de santé `GET /health` pour la supervision Plesk / Uptime Kuma
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');

// Clé API Gemini (passée par Plesk dans les variables d'environnement)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Table des types MIME essentiels
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

// Rate limiter en mémoire par IP (30 requêtes par minute)
const rateLimitMap = new Map();
const MAX_REQUESTS_PER_MINUTE = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  if (rateLimitMap.size > 500) {
    for (const [key, data] of rateLimitMap.entries()) {
      if (now > data.resetTime) rateLimitMap.delete(key);
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
  'urgence vitale', 'douleur poitrine', 'douleur thoracique', 'infarctus',
  'avc', 'bras engourdi', 'paralysie', 'crise cardiaque', 'etouffement',
  'ne respire plus', 'detresse respiratoire', 'perte de connaissance',
  'inconscient', 'coma', 'hemorragie grave', 'saignement abondant', 'convulsion'
];

function isMedicalEmergency(text) {
  const normalized = (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return EMERGENCY_KEYWORDS.some(kw => normalized.includes(kw));
}

// Détection des demandes de diagnostic ou prescription médicale
const DIAGNOSIS_KEYWORDS = [
  'quel medicament', 'posologie', 'quel traitement', 'mon diagnostic',
  'suis-je malade', 'quelle maladie', 'ordonnance pour', 'que prendre pour'
];

function isMedicalAdviceRequest(text) {
  const normalized = (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return DIAGNOSIS_KEYWORDS.some(kw => normalized.includes(kw));
}

// Validation algorithmique du NIR (Sécurité Sociale)
function validateNir(nirInput) {
  const cleaned = (nirInput || '').replace(/[\s.-]/g, '');
  if (!/^\d{13,15}$/.test(cleaned)) {
    return {
      isValid: false,
      message: `Le NIR comporte ${cleaned.length} chiffres. Format requis : 13 chiffres de base + 2 chiffres de clé (total 15 chiffres).`
    };
  }
  const base13 = cleaned.slice(0, 13);
  const providedKey = cleaned.length === 15 ? cleaned.slice(13, 15) : undefined;
  const genderDigit = base13.charAt(0);
  const gender = genderDigit === '1' ? 'Homme' : genderDigit === '2' ? 'Femme' : undefined;
  const birthYear = base13.slice(1, 3);
  const department = base13.slice(5, 7);

  const baseNum = BigInt(base13);
  const calculatedMod = 97n - (baseNum % 97n);
  const calculatedKeyStr = calculatedMod < 10n ? `0${calculatedMod}` : calculatedMod.toString();

  if (providedKey) {
    const keyMatches = calculatedKeyStr === providedKey;
    return {
      isValid: keyMatches,
      gender,
      birthYear: `19${birthYear} / 20${birthYear}`,
      department: department === '97' ? 'Outre-Mer (972 Martinique)' : department,
      calculatedKey: calculatedKeyStr,
      providedKey,
      message: keyMatches
        ? `✅ Numéro de Sécurité Sociale valide (Clé ${providedKey} conforme CPAM).`
        : `❌ Clé incorrecte (${providedKey} saisie vs ${calculatedKeyStr} calculée).`
    };
  }

  return {
    isValid: true,
    gender,
    birthYear: `19${birthYear} / 20${birthYear}`,
    department: department === '97' ? 'Outre-Mer (972 Martinique)' : department,
    calculatedKey: calculatedKeyStr,
    message: `ℹ️ Clé de contrôle calculée : ${calculatedKeyStr}. Numéro complet : ${base13} ${calculatedKeyStr}.`
  };
}

function extractAndAuditNir(text) {
  const match = (text || '').match(/\b([12]\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{3}\s*\d{3}(\s*\d{2})?)\b/);
  if (match) {
    const res = validateNir(match[0]);
    return `🔍 **Audit de votre Numéro de Sécurité Sociale (NIR) :**\n\n${res.message}\n• **Profil déduit :** ${res.gender || 'Non déterminé'}, Né(e) vers ${res.birthYear || 'N/A'}\n• **Département :** ${res.department || 'N/A'}\n• **Clé calculée :** **${res.calculatedKey}**\n\n*Note : Ce contrôle a été exécuté de manière éphémère sans stockage de votre numéro.*`;
  }
  return null;
}

// Extraction automatique des champs de réservation depuis la conversation
function extractBookingFields(text) {
  const updates = {};
  const lower = (text || '').toLowerCase();

  // Mode de transport
  if (lower.includes('vsl') || lower.includes('véhicule sanitaire')) updates.transportType = 'VSL';
  else if (lower.includes('ambulance') || lower.includes('allongé') || lower.includes('brancard')) updates.transportType = 'AMBULANCE';
  else if (lower.includes('taxi conventionné') || lower.includes('taxi')) updates.transportType = 'TAXI_CONVENTIONNE';

  // Destinations communes Martinique
  if (lower.includes('zobda') || lower.includes('chum') || lower.includes('la meynard') || lower.includes('chuf')) {
    updates.destinationAddress = 'CHU de Martinique - Hôpital Pierre Zobda-Quitman, Route de Châteaubœuf, 97200 Fort-de-France';
  } else if (lower.includes('mangot') || lower.includes('vulcin')) {
    updates.destinationAddress = 'Hôpital Mangot-Vulcin, Quartier Mangot Vulcin, 97232 Le Lamentin';
  } else if (lower.includes('trinité') || lower.includes('louis domergue')) {
    updates.destinationAddress = 'Hôpital Louis-Domergue, Rue de l\'Hôpital, 97220 La Trinité';
  } else if (lower.includes('sainte-marie') || lower.includes('clarac')) {
    updates.destinationAddress = 'Clinique Sainte-Marie (Clarac), Route de Cluny, 97200 Fort-de-France';
  }

  // NIR
  const nirMatch = (text || '').match(/\b([12]\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{3}\s*\d{3}(\s*\d{2})?)\b/);
  if (nirMatch) updates.nir = nirMatch[0].replace(/\s+/g, '');

  return {
    hasUpdates: Object.keys(updates).length > 0,
    updates
  };
}

// Fallback autonome
function generateAutonomousReply(userPrompt) {
  if (isMedicalEmergency(userPrompt)) {
    return {
      text: `🚨 **URGENCE MÉDICALE DÉTECTÉE :**\n\nSi vous ou votre proche présentez des symptômes graves (douleur thoracique, difficultés respiratoires, signes d'AVC, perte de connaissance ou hémorragie), **composez immédiatement le 15 (SAMU) ou le 112**.\n\n*Clinigo est un service de transport sanitaire programmé et ne se substitue pas aux interventions d'urgence vitale.*`
    };
  }

  if (isMedicalAdviceRequest(userPrompt)) {
    return {
      text: `ℹ️ **Avertissement Médical :**\n\nEn tant qu'assistante de support Clinigo, je suis spécialisée dans l'organisation administrative et logistique des transports sanitaires en Martinique. Je ne suis pas habilitée à donner de conseil médical ni à poser de diagnostic.\n\nVeuillez contacter votre médecin traitant pour toute question d'ordre clinique.`
    };
  }

  const nirAudit = extractAndAuditNir(userPrompt);
  if (nirAudit) return { text: nirAudit };

  const extraction = extractBookingFields(userPrompt);
  if (extraction.hasUpdates) {
    return {
      text: `⚡ **J'ai détecté des informations pour votre réservation :**\n\n${Object.keys(extraction.updates).map(k => `• ✅ **${k} :** ${extraction.updates[k]}`).join('\n')}\n\n*Les cases correspondantes sur votre écran peuvent être pré-remplies.*`,
      formDraft: extraction.updates
    };
  }

  return {
    text: `Bonjour ! Je suis **Eva**, votre assistante intelligente Clinigo en Martinique 🌴.\n\nJe peux vous accompagner pour :\n• 📋 Vérifier vos justificatifs CPAM (Prescription Médicale de Transport - PMT, ALD, carte Vitale)\n• 🚑 Choisir le mode adapté : Ambulance, VSL ou Taxi conventionné\n• 📍 Estimer vos horaires et marges de trafic sur la Martinique\n• ✍️ Pré-remplir votre formulaire de réservation en direct\n\n*Comment puis-je vous aider aujourd'hui ?*`
  };
}

// Handler de l'endpoint IA
async function handleAiChat(req, res) {
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Trop de requêtes. Veuillez patienter une minute.', status: 429 }));
    return;
  }

  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', async () => {
    try {
      const body = JSON.parse(rawBody || '{}');
      const messages = body.messages || [];
      const conversationId = body.conversationId || `conv-${Date.now()}`;
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';

      // Interception immédiate urgences vitales
      if (isMedicalEmergency(lastUserMessage)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          response: `🚨 **URGENCE MÉDICALE DÉTECTÉE :**\n\nSi vous ou votre proche êtes en situation d'urgence vitale, **appelez immédiatement le 15 (SAMU) ou le 112**.\n\n*Clinigo régule des transports sanitaires programmés.*`,
          conversationId,
          timestamp: new Date().toISOString(),
          isEmergency: true
        }));
        return;
      }

      // Appel Google Gemini si la clé API est fournie
      if (GEMINI_API_KEY) {
        try {
          const systemPrompt = `Tu es Eva, l'assistante officielle de régulation de transport sanitaire de Clinigo (Martinique).
Tu guides les patients, les soignants et les transporteurs avec précision, empathie et professionnalisme.
Contexte Martinique : CHU Zobda-Quitman, Hôpital Mangot-Vulcin, Hôpital de Trinité, Clinique Sainte-Marie.
Transports : Ambulance (allongé/surveillance), VSL (assis avec aide), Taxi conventionné (assis autonome).
RÈGLES ABSOLUES :
- Pas de diagnostic ni d'ordonnance.
- En cas d'urgence vitale, oriente vers le 15 (SAMU) ou le 112.
- Réponses concises, claires et bien formatées en Markdown avec puces.`;

          const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

          const geminiPayload = {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: 0.3, maxOutputTokens: 900 }
          };

          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
          const geminiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
          });

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                response: replyText,
                conversationId,
                timestamp: new Date().toISOString(),
                source: 'gemini-2.5-flash'
              }));
              return;
            }
          }
        } catch (geminiError) {
          console.warn('[Plesk AI Server] Gemini error, fallbacking:', geminiError.message);
        }
      }

      // Repli sur le moteur autonome
      const fallback = generateAutonomousReply(lastUserMessage);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        response: fallback.text,
        formDraft: fallback.formDraft,
        conversationId,
        timestamp: new Date().toISOString(),
        source: 'autonomous-fallback'
      }));

    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Format de requête invalide.' }));
    }
  });
}

// Handler de l'endpoint IA SEO Content Hub
const SYSTEM_SEO_PROMPT = `Tu es l'assistant éditorial en chef et expert SEO de Clinigo (clinigo.fr), plateforme de référence en France pour la réservation et la régulation de transports sanitaires (Ambulances, VSL et Taxis Conventionnés).

RÈGLES DÉONTOLOGIQUES & ÉDITORIALES STRICTES :
1. Tu ne dois JAMAIS inventer de tarifs officiels, de pourcentages de remboursement erronés, d'articles de loi fictifs ou de données médicales inventées.
2. Privilégie TOUJOURS les références officielles : Caisse Nationale d'Assurance Maladie (ameli.fr), Ministère de la Santé (sante.gouv.fr), Service-Public.fr, Légifrance.
3. Distingue clairement les faits établis des conseils pratiques. Si une règle dépend de la caisse ou de la situation clinique, écris "Selon les critères définis par votre caisse d'Assurance Maladie" ou "Sous réserve d'accord préalable".
4. Évite le bourrage de mots-clés (keyword stuffing). Écris dans un français irréprochable, clair, humain, bienveillant et professionnel.
5. Structure tes réponses en Markdown impeccable avec H2 (##) et H3 (###).
6. Ne crée des liens internes QUE vers des URLs existantes fournies explicitement dans la liste fournie.`;

async function callGeminiSeoJson(userPrompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_SEO_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText.slice(0, 200)}`);
  }
  const data = await response.json();
  const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) throw new Error('Aucune réponse générée par le modèle');
  try {
    return JSON.parse(textOutput);
  } catch {
    const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

async function handleAiSeo(req, res) {
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Trop de requêtes. Veuillez patienter une minute.', status: 429 }));
    return;
  }

  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', async () => {
    try {
      const body = JSON.parse(rawBody || '{}');
      const { action, payload } = body;
      const startTime = Date.now();
      let resultData;

      if (action === 'generatePlan') {
        const { topic, focusKeyword, targetCity, contentType, tone = 'Professionnel', wordCountTarget = 1000 } = payload || {};
        if (GEMINI_API_KEY) {
          const prompt = `Génère le PLAN DÉTAILLÉ (Outline) pour un article SEO sur Clinigo.fr.
Sujet : "${topic}"
Mot-clé : "${focusKeyword}"
${targetCity ? `Zone ciblée : "${targetCity}"` : ''}
Type : ${contentType}
Ton : ${tone}
Longueur : ${wordCountTarget} mots
Format JSON :
{
  "title": "Titre optimisé (50-65 caractères)",
  "slug": "slug-optimise-sans-accents",
  "focusKeyword": "${focusKeyword}",
  "intent": "informationnelle ou commerciale",
  "headings": ["## 1. Titre H2", "### 1.1 Sous-titre H3", "## 2. Titre H2"],
  "suggestedQuestions": ["Question 1 ?", "Question 2 ?"],
  "sourcesToVerify": ["ameli.fr", "service-public.fr"]
}`;
          resultData = await callGeminiSeoJson(prompt, GEMINI_API_KEY);
        } else {
          resultData = {
            title: `${topic} : Guide Complet & Démarches Pratiques`,
            slug: (topic || 'guide').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
            focusKeyword: focusKeyword || 'transport sanitaire',
            intent: 'informationnelle',
            headings: [
              `## 1. Qu'est-ce que ${focusKeyword || topic} ?`,
              `## 2. Dans quels cas pouvez-vous en bénéficier ?`,
              `## 3. Modalités de prise en charge et démarches avec la CPAM`,
              `## 4. Comment réserver sereinement avec Clinigo ?`
            ],
            suggestedQuestions: [
              `Qui a droit au remboursement pour ${focusKeyword || topic} ?`,
              `Quelle est la différence entre VSL et taxi conventionné ?`
            ],
            sourcesToVerify: [
              'ameli.fr - Prise en charge des transports sanitaires',
              'service-public.fr - Prescription Médicale de Transport'
            ]
          };
        }
      } else if (action === 'generateArticle') {
        const { plan, existingArticles = [] } = payload || {};
        if (GEMINI_API_KEY) {
          const prompt = `Rédige l'ARTICLE COMPLET en respectant scrupuleusement ce plan validé :
Titre : ${plan?.title}
Mot-clé : ${plan?.focusKeyword}
Intention : ${plan?.intent}
Plan des sous-titres :
${(plan?.headings || []).join('\n')}
Questions FAQ :
${(plan?.suggestedQuestions || []).join('\n')}
Articles existants pour maillage interne :
${existingArticles.map(a => `- [${a.title}](/blog/${a.slug})`).join('\n') || 'Aucun'}
Format JSON :
{
  "title": "${plan?.title}",
  "slug": "${(plan?.title || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}",
  "excerpt": "Résumé incitatif de 130 à 160 caractères.",
  "metaTitle": "${plan?.title} | Clinigo",
  "metaDescription": "Description de 130 à 155 caractères.",
  "content": "Texte intégral rédigé en Markdown avec H2, H3, listes à puces et liens internes.",
  "faq": [{ "question": "Q1", "answer": "R1" }],
  "suggestedCta": "Réserver un transport conventionné",
  "suggestedImageAlt": "Illustration professionnelle",
  "sources": [{ "title": "Assurance Maladie Ameli.fr", "url": "https://www.ameli.fr", "organization": "CPAM", "verified": true }]
}`;
          resultData = await callGeminiSeoJson(prompt, GEMINI_API_KEY);
        } else {
          resultData = {
            title: plan?.title || 'Guide Médical',
            slug: (plan?.title || 'guide').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
            excerpt: `Découvrez notre guide complet sur ${plan?.focusKeyword || 'le transport sanitaire'} : démarches et prise en charge.`,
            metaTitle: `${plan?.title || 'Guide'} | Clinigo`,
            metaDescription: `Guide pratique sur ${plan?.focusKeyword || 'le transport sanitaire'} : règles de remboursement et réservation en ligne.`,
            content: `## Introduction\n\nLe recours à un transport sanitaire est encadré par des règles médicales et administratives précises.\n\n## 1. Cadre légal et prescription\n\nTout transport prescrit doit faire l'objet d'une Prescription Médicale de Transport (PMT) établie avant le trajet.\n\n## Comment réserver avec Clinigo ?\n\nSur **Clinigo.fr**, trouvez rapidement une ambulance, un VSL ou un taxi conventionné disponible.`,
            faq: (plan?.suggestedQuestions || []).map(q => ({ question: q, answer: 'Consultez les recommandations officielles de l\'Assurance Maladie et votre médecin traitant.' })),
            suggestedCta: 'Réserver un transport sanitaire',
            suggestedImageAlt: `Illustration pour ${plan?.focusKeyword || 'transport'}`,
            sources: [{ title: 'Ameli.fr - Frais de transport sanitaire', url: 'https://www.ameli.fr/assure/remboursements/rembourse/transport', organization: 'Assurance Maladie', verified: true }]
          };
        }
      } else if (action === 'generateIdeas') {
        const count = payload?.count || 5;
        if (GEMINI_API_KEY) {
          const prompt = `Propose ${count} idées d'articles SEO stratégiques pour Clinigo.fr autour du transport sanitaire, ambulance, VSL, ALD, dialyse.
Format JSON :
{
  "ideas": [
    { "topic": "Thème", "keyword": "mot cle", "searchIntent": "informationnelle", "suggestedTitle": "Titre", "priority": "HIGH" }
  ]
}`;
          resultData = await callGeminiSeoJson(prompt, GEMINI_API_KEY);
        } else {
          resultData = {
            ideas: [
              { topic: 'Prise en charge rééducation', keyword: 'transport kiné rééducation', searchIntent: 'informationnelle', suggestedTitle: 'Séances de rééducation : Conditions de remboursement du transport', priority: 'MEDIUM' },
              { topic: 'Accord préalable CPAM', keyword: 'délai accord préalable transport', searchIntent: 'informationnelle', suggestedTitle: 'Accord préalable de transport médical : Délais et démarches avec la CPAM', priority: 'HIGH' }
            ]
          };
        }
      } else if (action === 'transformText') {
        const { text, instruction, customPrompt, targetKeyword } = payload || {};
        if (!text || !text.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Texte manquant' }));
          return;
        }
        if (GEMINI_API_KEY) {
          try {
            const prompt = `Voici le texte sélectionné :
"""
${text}
"""
Consigne : ${instruction === 'custom' ? customPrompt : instruction}
${targetKeyword ? `Mot-clé : "${targetKeyword}"` : ''}
${instruction === 'transformer_en_tableau' ? 'IMPORTANT : Transforme obligatoirement ces informations en un TABLEAU MARKDOWN propre (| Colonne 1 | Colonne 2 |).' : ''}
Rends DIRECTEMENT et UNIQUEMENT le texte ou tableau en Markdown sans aucun bavardage.`;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            const gRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: 'Tu es un assistant éditorial expert. Rends uniquement le texte final en Markdown sans bavardage.' }] },
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 }
              })
            });
            if (gRes.ok) {
              const d = await gRes.json();
              const output = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              if (output) {
                resultData = { text: output };
              }
            }
          } catch (err) {
            console.warn('[Plesk SEO Server] Gemini transformText fallback:', err.message);
          }
        }
        if (!resultData) {
          if (instruction === 'transformer_en_tableau') {
            const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
            let table = `| Critère / Élément | Détails & Spécificités | Prise en charge Clinigo |\n| :--- | :--- | :--- |\n`;
            rawLines.forEach((line, idx) => {
              const parts = line.split(/[:;\-\t|]/).map(p => p.trim()).filter(Boolean);
              if (parts.length >= 2) {
                table += `| ${parts[0]} | ${parts.slice(1).join(' - ')} | Conforme CPAM |\n`;
              } else {
                table += `| Point ${idx + 1} | ${line.replace(/^[-*•\d.]\s*/, '')} | Inclus |\n`;
              }
            });
            resultData = { text: table };
          } else if (instruction === 'raccourcir') {
            resultData = { text: text.split('\n').filter(Boolean).map(l => `• ${l.replace(/^[-*•\d.]\s*/, '').trim()}`).slice(0, 4).join('\n') };
          } else if (instruction === 'simplifier') {
            resultData = { text: `**En résumé simple pour le patient :**\n${text}\n\n*Note Clinigo : Prise en charge avec le tiers-payant automatique.*` };
          } else {
            resultData = { text };
          }
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Action non supportée : ${action}` }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: resultData, durationMs: Date.now() - startTime }));
    } catch (err) {
      console.error('[Plesk SEO Server] Erreur :', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message || 'Erreur interne' }));
    }
  });
}

// Création du serveur HTTP
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // 1. Health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
    return;
  }

  // 2. Endpoint API Chat
  if (pathname === '/api/ai/chat' && req.method === 'POST') {
    handleAiChat(req, res);
    return;
  }

  // 3. Endpoint API SEO Content Hub
  if (pathname === '/api/ai/seo' && req.method === 'POST') {
    handleAiSeo(req, res);
    return;
  }

  // 3. Fichiers statiques depuis `dist/`
  let filePath = path.join(DIST_DIR, pathname);

  // Protection contre le path traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      // Headers de mise en cache
      const headers = { 'Content-Type': contentType };
      if (ext === '.html') {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      } else {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      }

      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // 4. SPA Fallback : Si ce n'est pas un fichier existant et que c'est une requête GET, servir index.html
    if (req.method === 'GET' || req.method === 'HEAD') {
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (!indexErr && indexStats.isFile()) {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          });
          fs.createReadStream(indexPath).pipe(res);
        } else {
          res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>503 - Application en cours de déploiement (dossier dist introuvable)</h1><p>Veuillez exécuter <code>npm run build</code> sur le serveur.</p>');
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[Plesk Server] Médic'Trans 972 démarré sur http://${HOST}:${PORT}`);
  console.log(`[Plesk Server] Dossier statique : ${DIST_DIR}`);
  console.log(`[Plesk Server] Mode Gemini API : ${GEMINI_API_KEY ? 'Activé' : 'Moteur Autonome de secours'}`);
});
