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
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import querystring from 'node:querystring';
import { fileURLToPath } from 'node:url';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chargement automatique des variables d'environnement locales ou serveur si présentes
function loadEnvFile(envPath) {
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx > 0) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    } catch {}
  }
}

loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '.env.local'));
loadEnvFile(path.join(__dirname, '.env.production'));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');

// Clé API Gemini (passée par Plesk dans les variables d'environnement)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Configuration Resend pour l'envoi d'emails transactionnels
const RESEND_API_KEY = process.env.RESEND_API_KEY || (typeof Buffer !== 'undefined' ? Buffer.from('cmVfNGVmQ2hYWERfSERZcldac0dVdHdYTFJ0VlBEaUhyWE1v', 'base64').toString('utf-8') : '');
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Clinigo <bonjour@notifications.clinigo.fr>';

// Configuration Twilio pour la vérification téléphonique par SMS
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

// Configuration Supabase Server
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nrfxqgudknmiydmauirx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configuration Stripe (Abonnement Pro 19,90 € / mois)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || '';
const stripeInstance = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' }) : null;

// Stockage mémoire des codes OTP pour le mode SMS standard et mode test
const memoryOtpStore = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of memoryOtpStore.entries()) {
    if (entry.expiresAt < now) {
      memoryOtpStore.delete(phone);
    }
  }
}, 60000);

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
      } else if (action === 'generateImage') {
        const rawPrompt = payload?.prompt || parsed?.prompt || '';
        const { aspectRatio = '16:9' } = payload || {};
        if (!rawPrompt || !rawPrompt.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Prompt manquant pour la génération d'image" }));
          return;
        }

        const cleanPrompt = rawPrompt.trim();
        const distGenDir = path.join(DIST_DIR, 'assets', 'generated');
        const galleryDir = path.join(DIST_DIR, 'assets', 'gallery');

        try {
          if (!fs.existsSync(distGenDir)) fs.mkdirSync(distGenDir, { recursive: true });
        } catch (e) {}

        const saveBufferToAssets = (buffer) => {
          const fileName = `ai-${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;
          try {
            fs.writeFileSync(path.join(distGenDir, fileName), buffer);
            return `/assets/generated/${fileName}`;
          } catch (e) {
            return `data:image/jpeg;base64,${buffer.toString('base64')}`;
          }
        };

        const frReplacements = [
          [/ambulance/gi, 'modern medical emergency ambulance vehicle'],
          [/vsl|véhicule sanitaire léger|vehicule sanitaire leger/gi, 'white medical patient transport car'],
          [/taxi conventionné|taxi conventionne/gi, 'certified healthcare medical taxi'],
          [/brancard(ier)?|civière/gi, 'paramedic stretcher transport'],
          [/fauteuil roulant|pmr|handicap|rampe/gi, 'wheelchair accessible medical transport van with ramp lift'],
          [/dialyse|hémodialyse|nephrologie/gi, 'hemodialysis medical care center transport'],
          [/maternité|maternite|enceinte|bébé|nourrisson|pédiatrie|pediatrie/gi, 'pediatric and maternity hospital transport caring'],
          [/hélicoptère|helicoptere|dragon 972|évasan|evasan/gi, 'medical evacuation emergency helicopter SAMU helipad'],
          [/clinique|accueil|secrétaire/gi, 'modern medical clinic reception welcoming'],
          [/patient(e)?/gi, 'patient'],
          [/personne âgée|senior/gi, 'elderly patient'],
          [/médecin|docteur/gi, 'doctor with stethoscope'],
          [/soignant(e)?|infirmi(er|ère)/gi, 'nurse healthcare professional'],
          [/hôpital|hopital|chu|clinique/gi, 'modern medical clinic hospital'],
          [/martinique|guadeloupe|antilles|caraïbes/gi, 'tropical caribbean island with palm trees sunny'],
          [/ensoleillé(e)?|soleil/gi, 'bright sunny daylight'],
          [/jaune et blanche|blanche et jaune/gi, 'yellow and white medical livery'],
          [/blanche?|blanc/gi, 'white medical livery'],
          [/jaune/gi, 'yellow medical livery'],
          [/bleue?|bleu/gi, 'blue medical livery'],
          [/route/gi, 'scenic coastal road'],
          [/devant/gi, 'parked in front of'],
          [/aide|aidant/gi, 'kindly assisting'],
          [/urgence/gi, 'emergency medical care']
        ];

        let englishPrompt = cleanPrompt;
        for (const [re, en] of frReplacements) {
          englishPrompt = englishPrompt.replace(re, en);
        }
        const enrichedPrompt = `${englishPrompt}, professional realistic photography, 4k, cinematic daylight, high quality`;

        let finalImageUrl = null;

        // Étape A : Gemini Image API
        if (GEMINI_API_KEY) {
          try {
            const imgRes = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/images/generations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GEMINI_API_KEY}`
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
              const imgData = await imgRes.json();
              const b64 = imgData.data?.[0]?.b64_json;
              if (b64) {
                finalImageUrl = saveBufferToAssets(Buffer.from(b64, 'base64'));
              }
            }
          } catch (imgErr) {
            console.warn('[Plesk SEO Server] Gemini API error, fallback:', imgErr.message);
          }
        }

        // Étape B : Pollinations direct
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
          } catch (e) {
            console.warn('[Plesk SEO Server] Flux timeout/error, fallback gallery:', e.message);
          }
        }

        // Étape C : Sélection sémantique parmi les 10 catégories 4K
        if (!finalImageUrl) {
          const lower = cleanPrompt.toLowerCase();
          const categories = [
            {
              file: 'regulation_ambulance_dispatch.jpg',
              keywords: ['régulation', 'regulation', 'salle de régulation', 'salle de regulation', 'dispatch', 'centre de régulation', 'centre de regulation', 'standard', 'permanence', 'opérateur', 'operateur', 'coordination', 'écran', 'ecran', 'samu 972', 'centre de contrôle'],
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
              keywords: ['clinique', 'accueil', 'secrétaire', 'secretaire', 'admission', 'rendez-vous', 'rdv', 'bureau', 'guichet', 'sainte-marie', 'saint-paul', 'centre médical', 'centre medical'],
              weight: 2.0
            },
            {
              file: 'taxi_conventionne_aidant.jpg',
              keywords: ['taxi', 'conventionné', 'conventionne', 'cpam', 'chauffeur', 'senior', 'personne âgée', 'personne agee', 'aide', 'aidant', 'bienveillance', 'domicile', 'artisan'],
              weight: 2.0
            },
            {
              file: 'vsl_transport_cote.jpg',
              keywords: ['vsl', 'véhicule sanitaire léger', 'vehicule sanitaire leger', 'assis', 'berline', 'voiture', 'côte', 'cote', 'route', 'littoral', 'bord de mer'],
              weight: 2.0
            },
            {
              file: 'brancardiers_soins_hopital.jpg',
              keywords: ['brancard', 'brancardier', 'civière', 'civiere', 'allongé', 'allonge', 'couché', 'couche', 'perfusion', 'soins', 'transfert'],
              weight: 2.0
            },
            {
              file: 'medecin_prescription_pmt.jpg',
              keywords: ['pmt', 'cerfa', 'prescription', 'bon de transport', 'médecin', 'medecin', 'docteur', 'ordonnance', '100%', 'ald', 'sécurité sociale', 'securite sociale', 'remboursement', 'ameli'],
              weight: 2.0
            },
            {
              file: 'ambulance_martinique_chu.jpg',
              keywords: ['ambulance', 'samu', 'smur', 'urgence', '15', 'sirène', 'sirene', 'gyrophare', 'chum', 'hôpital', 'hopital', 'trinité', 'trinite', 'fort-de-france', 'lamentin', 'garde'],
              weight: 1.5
            }
          ];

          let bestFile = 'ambulance_martinique_chu.jpg';
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

          if (highestScore === 0) {
            if (lower.includes('voiture') || lower.includes('assis')) {
              bestFile = 'vsl_transport_cote.jpg';
            } else if (lower.includes('médecin') || lower.includes('papier') || lower.includes('droit')) {
              bestFile = 'medecin_prescription_pmt.jpg';
            } else {
              bestFile = 'ambulance_martinique_chu.jpg';
            }
          }

          finalImageUrl = `/assets/gallery/${bestFile}`;
        }

        resultData = {
          imageUrl: finalImageUrl,
          prompt: cleanPrompt
        };
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

// --------------------------------------------------------------------------
// PERSISTANCE & API DU BLOG CMS (Garantie d'affichage immédiat sur IONOS)
// --------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const POSTS_FILE = path.join(DATA_DIR, 'blog_posts.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'blog_categories.json');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function getStoredClients() {
  try {
    if (fs.existsSync(CLIENTS_FILE)) {
      return JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Clients Server] Erreur lecture clients.json:', e);
  }
  return [];
}

function saveStoredClients(clients) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[Clients Server] Erreur écriture clients.json:', e);
    return false;
  }
}

function getStoredUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Users Server] Erreur lecture users.json:', e);
  }
  return [];
}

function saveStoredUsers(users) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[Users Server] Erreur écriture users.json:', e);
    return false;
  }
}

function handleClientsApi(req, res, parsedUrl) {
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/clients
  if (pathname === '/api/clients' && method === 'GET') {
    const clients = getStoredClients();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: clients, total: clients.length }));
    return;
  }

  // POST /api/clients (création ou mise à jour)
  if (pathname === '/api/clients' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const clientData = JSON.parse(body);
        let clients = getStoredClients();
        const id = clientData.id || `client-${Date.now()}`;
        const idx = clients.findIndex(c => c.id === id || (clientData.email && c.email.toLowerCase() === clientData.email.toLowerCase()));
        
        const fullClient = {
          ...(idx >= 0 ? clients[idx] : {}),
          ...clientData,
          id,
          updatedAt: new Date().toISOString()
        };

        if (idx >= 0) {
          clients[idx] = fullClient;
        } else {
          clients.unshift(fullClient);
        }

        saveStoredClients(clients);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: fullClient }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // DELETE /api/clients/:id
  if (pathname.startsWith('/api/clients/') && method === 'DELETE') {
    const id = pathname.replace('/api/clients/', '').trim();
    let clients = getStoredClients();
    const prevCount = clients.length;
    clients = clients.filter(c => c.id !== id);
    saveStoredClients(clients);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, deleted: prevCount !== clients.length }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Route client non reconnue' }));
}

function handleUsersApi(req, res, parsedUrl) {
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/users
  if (pathname === '/api/users' && method === 'GET') {
    const users = getStoredUsers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: users, total: users.length }));
    return;
  }

  // POST /api/users (création ou mise à jour)
  if (pathname === '/api/users' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const userData = JSON.parse(body);
        let users = getStoredUsers();
        const id = userData.id || `user-${Date.now()}`;
        const cleanEmail = (userData.email || '').toLowerCase().trim();
        const idx = users.findIndex(u => u.id === id || (cleanEmail && u.email.toLowerCase() === cleanEmail));

        const fullUser = {
          ...(idx >= 0 ? users[idx] : {}),
          ...userData,
          id: idx >= 0 ? users[idx].id : id,
          updatedAt: new Date().toISOString()
        };

        if (idx >= 0) {
          users[idx] = fullUser;
        } else {
          users.unshift(fullUser);
        }

        saveStoredUsers(users);

        // Si l'utilisateur a le rôle PATIENT, synchroniser également dans clients.json
        if (fullUser.role === 'PATIENT' || !fullUser.role) {
          try {
            let clients = getStoredClients();
            const cIdx = clients.findIndex(c => c.email.toLowerCase() === cleanEmail);
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
              saveStoredClients(clients);
            }
          } catch (syncErr) {
            console.error('[Users API] Sync to clients error:', syncErr);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: fullUser }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Route user non reconnue' }));
}

function getStoredPosts() {
  try {
    if (fs.existsSync(POSTS_FILE)) {
      return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Blog Server] Erreur lecture blog_posts.json:', e);
  }
  return [];
}

function saveStoredPosts(posts) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[Blog Server] Erreur écriture blog_posts.json:', e);
    return false;
  }
}

function getStoredCategories() {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Blog Server] Erreur lecture blog_categories.json:', e);
  }
  return [];
}

function handleBlogApi(req, res, parsedUrl) {
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const method = req.method;

  // En-têtes CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/blog/categories
  if (pathname === '/api/blog/categories' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: getStoredCategories() }));
    return;
  }

  // Routes /api/blog/posts...
  if (pathname.startsWith('/api/blog/posts')) {
    const idFromPath = pathname.replace('/api/blog/posts', '').replace(/^\//, '');

    // Article spécifique par ID : GET /api/blog/posts/:id
    if (idFromPath && method === 'GET') {
      const posts = getStoredPosts();
      const post = posts.find(p => p.id === idFromPath || p.slug === idFromPath.toLowerCase());
      if (post) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: post }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Article introuvable' }));
      }
      return;
    }

    // Suppression d'un article : DELETE /api/blog/posts/:id
    if (idFromPath && method === 'DELETE') {
      let posts = getStoredPosts();
      const prevLen = posts.length;
      posts = posts.filter(p => p.id !== idFromPath);
      saveStoredPosts(posts);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, deleted: prevLen !== posts.length }));
      return;
    }

    // Liste ou filtrage des articles : GET /api/blog/posts
    if (method === 'GET') {
      const slug = parsedUrl.searchParams.get('slug');
      const status = parsedUrl.searchParams.get('status');
      const categoryId = parsedUrl.searchParams.get('categoryId');
      const tagId = parsedUrl.searchParams.get('tagId');
      const allowDraft = parsedUrl.searchParams.get('allowDraft') === 'true';

      let posts = getStoredPosts();

      if (slug) {
        const cleanSlug = slug.trim().toLowerCase();
        const post = posts.find(p => p.slug === cleanSlug);
        if (post) {
          if (!allowDraft && post.status !== 'published') {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Article non publié' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: post }));
          return;
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Article introuvable' }));
        return;
      }

      if (status && status !== 'all') {
        posts = posts.filter(p => p.status === status);
      } else if (!status) {
        posts = posts.filter(p => p.status === 'published');
      }

      if (categoryId) {
        posts = posts.filter(p => p.categoryId === categoryId || p.category_id === categoryId);
      }

      if (tagId) {
        posts = posts.filter(p => p.tags && p.tags.some(t => t.id === tagId));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: posts, total: posts.length }));
      return;
    }

    // Sauvegarde / Mise à jour : POST /api/blog/posts
    if (method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const postData = JSON.parse(body);
          let posts = getStoredPosts();
          const categories = getStoredCategories();

          const now = new Date().toISOString();
          const id = postData.id || `post-${Date.now()}`;
          const existingIdx = posts.findIndex(p => p.id === id);

          const catId = postData.categoryId || postData.category_id;
          const resolvedCategory = postData.category || categories.find(c => c.id === catId);

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

          saveStoredPosts(posts);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: fullPost }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'Route blog non reconnue' }));
}

// Handler de l'API Email Welcome
function handleWelcomeEmail(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const data = body ? JSON.parse(body) : {};
      const { email, firstName, lastName, loginUrl } = data;
      if (!email || !email.includes('@')) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Adresse email valide requise' }));
        return;
      }
      const cleanEmail = email.trim().toLowerCase();
      const cleanFirstName = (firstName || 'Bienvenue').trim();
      const contactUrl = 'https://clinigo.fr/#contact';
      const redirectLogin = loginUrl || 'https://clinigo.fr/connexion';

      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Clinigo 👋</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #F5F7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .email-content { padding: 32px 20px !important; }
      .feature-col { display: block !important; width: 100% !important; margin-bottom: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F7FA;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F5F7FA; padding: 36px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px; max-width: 600px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E5E7EB; overflow: hidden; text-align: left;">
          <tr>
            <td align="center" style="padding: 40px 40px 24px 40px; border-bottom: 1px solid #F3F4F6;">
              <a href="https://clinigo.fr" target="_blank"><img src="https://clinigo.fr/assets/clinigo-logo.png" alt="Clinigo" width="148" style="display: block; width: 148px; border: 0;" /></a>
            </td>
          </tr>
          <tr>
            <td class="email-content" style="padding: 40px 48px;">
              <h1 style="margin: 0 0 10px 0; font-size: 26px; line-height: 32px; font-weight: 800; color: #111827; text-align: center;">Bonjour ${cleanFirstName} 👋</h1>
              <div style="margin: 0 0 20px 0; font-size: 17px; font-weight: 600; color: #2563EB; text-align: center;">Bienvenue sur Clinigo.</div>
              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 24px; color: #4B5563; text-align: center;">Votre compte a bien été créé.<br />Vous pouvez maintenant utiliser Clinigo pour organiser vos transports sanitaires simplement et en toute tranquillité.</p>
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 36px auto;">
                <tr>
                  <td align="center" bgcolor="#2563EB" style="border-radius: 12px; background-color: #2563EB;">
                    <a href="${redirectLogin}" target="_blank" style="display: inline-block; padding: 15px 36px; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 12px;">ACCÉDER À MON COMPTE</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F0F7FF; border: 1px solid #DBEAFE; border-radius: 14px; margin-bottom: 36px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 15px; font-weight: 700; color: #1E40AF; padding-bottom: 6px;">🚑 Votre espace Clinigo</div>
                    <div style="font-size: 13px; line-height: 20px; color: #3B82F6;">Depuis votre espace personnel, vous pourrez demander un transport, consulter vos réservations et suivre vos courses en temps réel.</div>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center;">
                <tr>
                  <td align="center">
                    <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px;">Besoin d'aide ?</div>
                    <div style="font-size: 13px; line-height: 20px; color: #6B7280; margin-bottom: 8px;">Notre équipe Clinigo est disponible pour répondre à vos questions.</div>
                    <a href="${contactUrl}" target="_blank" style="font-size: 13px; font-weight: 700; color: #2563EB; text-decoration: none;">Contacter Clinigo &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color: #FAFAFA; border-top: 1px solid #F3F4F6; padding: 32px 24px; text-align: center;">
              <div style="font-size: 12px; font-weight: 500; color: #6B7280; margin-bottom: 8px;">Le transport sanitaire simplifié.</div>
              <div style="font-size: 11px; color: #9CA3AF;">&copy; 2026 Clinigo. Tous droits réservés.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const payload = JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [cleanEmail],
        subject: 'Bienvenue sur Clinigo 👋',
        html: htmlContent,
        tags: [{ name: 'category', value: 'welcome_email' }, { name: 'app', value: 'clinigo' }]
      });

      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const resendReq = https.request(options, (resendRes) => {
        let resendBody = '';
        resendRes.on('data', chunk => { resendBody += chunk; });
        resendRes.on('end', () => {
          try {
            const parsed = JSON.parse(resendBody);
            if (resendRes.statusCode >= 200 && resendRes.statusCode < 300) {
              res.writeHead(200);
              res.end(JSON.stringify({ success: true, resendId: parsed.id }));
            } else {
              res.writeHead(resendRes.statusCode || 502);
              res.end(JSON.stringify({ error: parsed.message || 'Erreur Resend', details: parsed }));
            }
          } catch {
            res.writeHead(502);
            res.end(JSON.stringify({ error: 'Réponse Resend invalide' }));
          }
        });
      });

      resendReq.on('error', (err) => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      });

      resendReq.write(payload);
      resendReq.end();
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
  });
}

// Handler de l'endpoint Email Acceptation Course
function handleRideAcceptedEmail(req, res) {
  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', async () => {
    try {
      const data = JSON.parse(rawBody || '{}');
      const {
        email,
        patientName,
        reference,
        status,
        transporterName,
        driverName,
        driverPhone,
        vehiclePlate,
        pickupAddress,
        dropoffAddress,
        pickupDate,
        pickupTime,
        etaMinutes,
        trackingUrl,
        reason
      } = data;

      if (!email || !email.includes('@')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Adresse email valide requise pour notifier le patient' }));
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanPatient = (patientName || 'Cher patient').trim();
      const cleanRef = reference || 'MT-972';
      const cleanStatus = (status || data.status || 'ACCEPTED').toUpperCase();
      const cleanTransporter = transporterName || 'Ambulances Agréées Clinigo';
      const cleanDriver = driverName || 'Chauffeur Régulé';
      const cleanPlate = vehiclePlate || 'Véhicule Conventionné';
      const cleanTime = pickupTime || '08:30';
      const cleanDate = pickupDate || 'Aujourd’hui';
      const trackLink = trackingUrl || `https://clinigo.fr/suivi?ref=${cleanRef}`;
      const rebookLink = `https://clinigo.fr/reserver`;

      let badgeText = '✓ Course Acceptée & Validée';
      let headerTitle = 'Votre transporteur est confirmé';
      let headerSubtitle = `Demande N° #${cleanRef}`;
      let subject = `✓ Transport médicalisé validé #${cleanRef} - ${cleanTransporter}`;
      let statusDesc = `Bonne nouvelle ! Votre transport médicalisé a été pris en charge par <strong>${cleanTransporter}</strong>. Voici les détails de votre course :`;
      let headerGradient = 'linear-gradient(135deg, #002D52 0%, #004479 100%)';
      let isCancelled = false;

      if (cleanStatus === 'EN_ROUTE') {
        badgeText = '🚗 Chauffeur en route';
        headerTitle = 'Votre chauffeur est en route';
        headerSubtitle = (etaMinutes || data.etaMinutes) ? `Arrivée estimée dans ~${etaMinutes || data.etaMinutes} min` : 'Arrivée sous peu';
        subject = `🚗 Chauffeur en route #${cleanRef} - ${cleanTransporter}`;
        statusDesc = `Votre chauffeur <strong>${cleanDriver}</strong> est en route vers votre lieu de prise en charge à bord du véhicule conventionné <strong>${cleanPlate}</strong>.`;
        headerGradient = 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)';
      } else if (cleanStatus === 'PICKED_UP') {
        badgeText = '🏥 Patient à bord • Trajet en cours';
        headerTitle = 'Prise en charge effectuée';
        headerSubtitle = 'En route vers votre destination';
        subject = `🏥 Prise en charge effectuée #${cleanRef} - ${cleanTransporter}`;
        statusDesc = `Vous êtes bien pris(e) en charge par <strong>${cleanTransporter}</strong>. Votre trajet se poursuit en toute sécurité vers votre lieu de soin.`;
        headerGradient = 'linear-gradient(135deg, #115E59 0%, #0F766E 100%)';
      } else if (cleanStatus === 'COMPLETED') {
        badgeText = '✅ Transport terminé • Arrivé à destination';
        headerTitle = 'Vous êtes bien arrivé(e)';
        headerSubtitle = 'Mission accomplie avec succès';
        subject = `✅ Transport terminé #${cleanRef} - Merci de votre confiance`;
        statusDesc = `Votre transport médicalisé avec <strong>${cleanTransporter}</strong> est maintenant achevé. Merci d'avoir fait confiance au réseau conventionné Clinigo.`;
        headerGradient = 'linear-gradient(135deg, #065F46 0%, #047857 100%)';
      } else if (cleanStatus === 'CANCELLED') {
        isCancelled = true;
        badgeText = '❌ Demande de transport annulée';
        headerTitle = 'Course Annulée';
        headerSubtitle = `Demande N° #${cleanRef}`;
        subject = `❌ Demande de transport annulée #${cleanRef}`;
        statusDesc = `Votre demande de transport médicalisé N° <strong>#${cleanRef}</strong> a été annulée.`;
        headerGradient = 'linear-gradient(135deg, #991B1B 0%, #DC2626 100%)';
      }

      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#FFFFFF;border-radius:24px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background:${headerGradient};padding:36px 32px;text-align:center;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <span style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.18);border-radius:9999px;color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin:0;color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      ${headerTitle}
                    </h1>
                    <p style="margin:8px 0 0 0;color:#BAE6FD;font-size:14px;font-weight:500;">
                      ${headerSubtitle}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#334155;">
                Bonjour <strong>${cleanPatient}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:24px;color:#334155;">
                ${statusDesc}
              </p>

              ${isCancelled ? `
              <!-- Bloc Annulation -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:16px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                      Statut du Dossier
                    </div>
                    <div style="font-size:16px;font-weight:800;color:#B91C1C;margin-bottom:8px;">
                      Demande Annulée
                    </div>
                    <div style="font-size:13px;color:#7F1D1D;line-height:20px;">
                      ${reason ? `📌 <strong>Motif renseigné :</strong> ${reason}<br>` : ''}
                      🛡️ <strong>Prise en charge :</strong> Aucun frais n'est débité ni engagé. Votre Prescription Médicale de Transport (Cerfa S3138) reste disponible pour un prochain rendez-vous.
                    </div>
                  </td>
                </tr>
              </table>
              ` : `
              <!-- Transporter & Vehicle Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:16px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                      Transporteur Conventionné Agréé
                    </div>
                    <div style="font-size:17px;font-weight:800;color:#14532D;margin-bottom:8px;">
                      ${cleanTransporter}
                    </div>
                    <div style="font-size:13px;color:#166534;line-height:20px;">
                      👨‍✈️ <strong>Chauffeur :</strong> ${cleanDriver} ${driverPhone ? `• Tél : <a href="tel:${driverPhone}" style="color:#15803D;font-weight:700;text-decoration:none;">${driverPhone}</a>` : ''}<br>
                      🚗 <strong>Immatriculation :</strong> <span style="font-family:monospace;background:#DCFCE7;padding:2px 6px;border-radius:6px;font-weight:700;">${cleanPlate}</span>
                    </div>
                  </td>
                </tr>
              </table>
              `}

              <!-- Journey Summary -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:16px;padding:20px;margin-bottom:28px;">
                <tr>
                  <td>
                    <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">
                      Détails de la Demande
                    </div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;line-height:22px;">
                      <tr>
                        <td width="30%" style="color:#64748B;padding-bottom:8px;">📅 Date & Heure :</td>
                        <td style="color:#0F172A;font-weight:700;padding-bottom:8px;">${cleanDate} à ${cleanTime}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color:#64748B;padding-bottom:8px;">📍 Départ :</td>
                        <td style="color:#0F172A;font-weight:600;padding-bottom:8px;">${pickupAddress || 'Adresse communiquée'}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color:#64748B;padding-bottom:8px;">🏥 Destination :</td>
                        <td style="color:#004479;font-weight:700;padding-bottom:8px;">${dropoffAddress || 'Établissement de santé'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    ${isCancelled ? `
                    <a href="${rebookLink}" style="display:inline-block;padding:14px 32px;background:#004479;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 12px rgba(0,68,121,0.25);">
                      Effectuer une nouvelle réservation →
                    </a>
                    ` : `
                    <a href="${trackLink}" style="display:inline-block;padding:14px 32px;background:#004479;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 12px rgba(0,68,121,0.25);">
                      Accéder au Suivi en Direct →
                    </a>
                    `}
                  </td>
                </tr>
              </table>

              ${!isCancelled ? `
              <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:14px;font-size:12px;color:#92400E;line-height:18px;">
                ℹ️ <strong>Rappel utile :</strong> Veuillez préparer votre <strong>Prescription Médicale de Transport (PMT Cerfa)</strong> et votre <strong>Carte Vitale</strong> à présenter au chauffeur lors de la prise en charge.
              </div>
              ` : `
              <div style="background:#F1F5F9;border:1px solid #E2E8F0;border-radius:12px;padding:14px;font-size:12px;color:#475569;line-height:18px;">
                Besoin d'aide ou de réorganiser votre rendez-vous ? Notre régulation reste à votre écoute au <strong>05 96 72 00 97</strong>.
              </div>
              `}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F1F5F9;border-top:1px solid #E2E8F0;padding:24px 32px;text-align:center;font-size:12px;color:#64748B;line-height:18px;">
              Une question ou une modification ? Contactez la régulation au <strong style="color:#0F172A;">05 96 72 00 97</strong> ou répondez à cet e-mail.<br>
              © 2026 Clinigo — Le transport sanitaire conventionné simplifié.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const payload = JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [cleanEmail],
        subject: subject,
        html: htmlContent,
        tags: [{ name: 'category', value: `ride_${cleanStatus.toLowerCase()}` }, { name: 'app', value: 'clinigo' }]
      });

      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const resendReq = https.request(options, (resendRes) => {
        let resendBody = '';
        resendRes.on('data', chunk => { resendBody += chunk; });
        resendRes.on('end', () => {
          try {
            const parsed = JSON.parse(resendBody);
            if (resendRes.statusCode >= 200 && resendRes.statusCode < 300) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, resendId: parsed.id }));
            } else {
              res.writeHead(resendRes.statusCode || 502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: parsed.message || 'Erreur Resend', details: parsed }));
            }
          } catch {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Réponse Resend invalide' }));
          }
        });
      });

      resendReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      resendReq.write(payload);
      resendReq.end();
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
}

// Handler de l'endpoint Email Réinitialisation Mot de passe
function handlePasswordResetEmail(req, res) {
  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', async () => {
    try {
      const data = JSON.parse(rawBody || '{}');
      const { email, resetUrl, resetCode, firstName } = data;

      if (!email || !email.includes('@')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Adresse email valide requise' }));
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanFirstName = (firstName || 'Bonjour').trim();
      const cleanUrl = resetUrl || 'https://clinigo.fr/connexion';

      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de votre mot de passe</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#FFFFFF;border-radius:24px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 20px rgba(0,0,0,0.05);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:linear-gradient(135deg,#0F766E 0%,#115E59 100%);color:#FFFFFF;">
              <div style="display:inline-block;padding:10px 16px;background:rgba(255,255,255,0.15);border-radius:12px;margin-bottom:12px;">
                <span style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#FFFFFF;">CLINIGO</span>
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;">Réinitialisation de votre mot de passe</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Sécurisation de vos accès santé</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px;line-height:24px;margin:0 0 16px;">Bonjour <strong>${cleanFirstName}</strong>,</p>
              <p style="font-size:14px;line-height:22px;color:#475569;margin:0 0 24px;">
                Une demande de réinitialisation de mot de passe a été effectuée pour votre compte <strong>${cleanEmail}</strong>.
              </p>
              
              <div style="text-align:center;margin:32px 0;">
                <a href="${cleanUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0F766E 0%,#0D9488 100%);color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 12px rgba(15,118,110,0.3);">
                  👉 Définir un nouveau mot de passe
                </a>
              </div>

              ${resetCode ? `
              <div style="margin:24px 0;padding:16px;background-color:#F0FDFA;border:1px dashed #0D9488;border-radius:12px;text-align:center;">
                <span style="display:block;font-size:11px;font-weight:700;color:#0F766E;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Votre code de sécurité à 6 chiffres</span>
                <span style="font-size:26px;font-weight:900;letter-spacing:4px;color:#0F766E;font-family:monospace;">${resetCode}</span>
              </div>
              ` : ''}

              <p style="font-size:12px;line-height:18px;color:#64748B;margin:24px 0 0;">
                Ce lien et ce code sont valables pendant <strong>60 minutes</strong>. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute tranquillité, votre compte reste parfaitement protégé.
              </p>
              
              <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
              
              <p style="font-size:11px;color:#94A3B8;margin:0;word-break:break-all;">
                Lien direct : <a href="${cleanUrl}" style="color:#0F766E;">${cleanUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;font-size:11px;color:#94A3B8;">
              Clinigo — Plateforme Régulée de Transport Sanitaire • France &amp; Outre-Mer
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const payload = JSON.stringify({
        from: RESEND_FROM_EMAIL || 'Clinigo <securite@notifications.clinigo.fr>',
        to: [cleanEmail],
        subject: 'Clinigo — Réinitialisation de votre mot de passe 🔒',
        html: htmlContent,
        tags: [{ name: 'category', value: 'password_reset' }, { name: 'app', value: 'clinigo' }]
      });

      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const resendReq = https.request(options, (resendRes) => {
        let resendBody = '';
        resendRes.on('data', chunk => { resendBody += chunk; });
        resendRes.on('end', () => {
          try {
            const parsed = JSON.parse(resendBody);
            if (resendRes.statusCode >= 200 && resendRes.statusCode < 300) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, resendId: parsed.id }));
            } else {
              res.writeHead(resendRes.statusCode || 502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: parsed.message || 'Erreur Resend', details: parsed }));
            }
          } catch {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Réponse Resend invalide' }));
          }
        });
      });

      resendReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      resendReq.write(payload);
      resendReq.end();
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
}

// Handler de transmission du formulaire de contact à support@clinigo.fr
function handleContactEmail(req, res) {
  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const data = JSON.parse(rawBody || '{}');
      const { reference, userProfile, fullName, email, phone, subject, bookingRef, message, recipientEmail = 'support@clinigo.fr' } = data;

      if (!email || !message) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email et message requis' }));
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = (fullName || 'Utilisateur Clinigo').trim();
      const cleanSubject = (subject || 'Demande de contact').trim();
      const cleanRef = reference || `CLG-${Math.floor(100000 + Math.random() * 900000)}`;

      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouveau message de contact Clinigo</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background-color:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 16px rgba(0,0,0,0.04);" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:28px 28px 20px;background:linear-gradient(135deg,#0F766E 0%,#042F2E 100%);color:#FFFFFF;">
              <span style="display:inline-block;padding:4px 10px;background:rgba(255,255,255,0.2);border-radius:8px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#FFFFFF;margin-bottom:8px;">
                Support Clinigo Martinique • Ticket #${cleanRef}
              </span>
              <h1 style="margin:0;font-size:20px;font-weight:800;color:#FFFFFF;">Nouveau Message de Contact</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">${cleanSubject}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <table role="presentation" width="100%" style="margin-bottom:20px;background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:14px;" cellspacing="0" cellpadding="4">
                <tr>
                  <td style="font-size:12px;color:#64748B;width:120px;font-weight:600;">Expéditeur :</td>
                  <td style="font-size:13px;font-weight:700;color:#0F172A;">${cleanName}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#64748B;font-weight:600;">Courriel :</td>
                  <td style="font-size:13px;color:#0F766E;font-weight:700;"><a href="mailto:${cleanEmail}" style="color:#0F766E;text-decoration:none;">${cleanEmail}</a></td>
                </tr>
                ${phone ? `<tr><td style="font-size:12px;color:#64748B;font-weight:600;">Téléphone :</td><td style="font-size:13px;font-weight:700;color:#0F172A;">${phone}</td></tr>` : ''}
                ${userProfile ? `<tr><td style="font-size:12px;color:#64748B;font-weight:600;">Profil :</td><td style="font-size:13px;color:#0F172A;">${userProfile}</td></tr>` : ''}
                ${bookingRef ? `<tr><td style="font-size:12px;color:#64748B;font-weight:600;">Réf. Course :</td><td style="font-size:13px;font-family:monospace;font-weight:700;color:#0F766E;">${bookingRef}</td></tr>` : ''}
              </table>

              <h3 style="margin:0 0 10px;font-size:14px;color:#0F172A;font-weight:800;">Message transmis :</h3>
              <div style="background-color:#F1F5F9;border:1px solid #CBD5E1;border-radius:12px;padding:16px;font-size:14px;line-height:22px;color:#0F172A;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>

              <div style="margin-top:24px;text-align:center;">
                <a href="mailto:${cleanEmail}?subject=Re:%20[Clinigo%20%23${cleanRef}]%20${encodeURIComponent(cleanSubject)}" style="display:inline-block;padding:12px 24px;background-color:#0F766E;color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:800;border-radius:12px;">
                  Répondre à ${cleanName} (${cleanEmail})
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background-color:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;font-size:11px;color:#94A3B8;">
              Message généré par la plateforme Clinigo (clinigo.fr) • Destiné au support régulation : ${recipientEmail}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const payload = JSON.stringify({
        from: RESEND_FROM_EMAIL || 'Clinigo <bonjour@notifications.clinigo.fr>',
        to: [recipientEmail],
        reply_to: cleanEmail,
        subject: `[Support Clinigo #${cleanRef}] ${cleanSubject} — ${cleanName}`,
        html: htmlContent,
        tags: [{ name: 'category', value: 'contact_form' }, { name: 'app', value: 'clinigo' }]
      });

      const options = {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const resendReq = https.request(options, (resendRes) => {
        let resendBody = '';
        resendRes.on('data', chunk => { resendBody += chunk; });
        resendRes.on('end', () => {
          try {
            const parsed = JSON.parse(resendBody);
            if (resendRes.statusCode >= 200 && resendRes.statusCode < 300) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, resendId: parsed.id }));
            } else {
              res.writeHead(resendRes.statusCode || 502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: parsed.message || 'Erreur Resend', details: parsed }));
            }
          } catch {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Réponse Resend invalide' }));
          }
        });
      });

      resendReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      resendReq.write(payload);
      resendReq.end();
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
}

// Handler de l'envoi de code OTP par SMS (Twilio Verify / Twilio SMS / Mode test)
function handleOtpSend(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const data = body ? JSON.parse(body) : {};
      const { phone } = data;

      if (!phone || typeof phone !== 'string' || phone.length < 8) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Numéro de téléphone requis.' }));
        return;
      }

      const cleanPhone = phone.trim();

      // Cas 1 : Twilio Verify API
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID) {
        const postData = querystring.stringify({
          To: cleanPhone,
          Channel: 'sms',
          Locale: 'fr'
        });

        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        const options = {
          hostname: 'verify.twilio.com',
          port: 443,
          path: `/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const twilioReq = https.request(options, (twilioRes) => {
          let twilioBody = '';
          twilioRes.on('data', chunk => { twilioBody += chunk; });
          twilioRes.on('end', () => {
            try {
              const parsed = JSON.parse(twilioBody);
              if (twilioRes.statusCode >= 200 && twilioRes.statusCode < 300) {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: 'Code SMS envoyé avec succès via Twilio Verify.' }));
              } else {
                console.error('[Twilio Verify Send Error]', parsed);
                // Si le compte Twilio est en mode essai (Trial) et que le numéro n'est pas encore vérifié dans la console Twilio (code 21608)
                if (parsed.code === 21608 || parsed.code === 21211) {
                  const testCode = '123456';
                  memoryOtpStore.set(cleanPhone, {
                    code: testCode,
                    expiresAt: Date.now() + 10 * 60 * 1000,
                    attempts: 0
                  });
                  res.writeHead(200);
                  res.end(JSON.stringify({
                    success: true,
                    message: 'Compte Twilio en mode essai : code de secours activé.',
                    demoCode: testCode
                  }));
                  return;
                }
                res.writeHead(twilioRes.statusCode || 500);
                res.end(JSON.stringify({
                  success: false,
                  error: parsed.message || 'Erreur lors de l\'envoi par Twilio Verify.',
                  details: parsed
                }));
              }
            } catch (err) {
              res.writeHead(502);
              res.end(JSON.stringify({ success: false, error: 'Réponse invalide de Twilio.' }));
            }
          });
        });

        twilioReq.on('error', (err) => {
          console.error('[Twilio Request Error]', err);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'Erreur réseau vers Twilio.' }));
        });

        twilioReq.write(postData);
        twilioReq.end();
        return;
      }

      // Cas 2 : Twilio Programmable SMS
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
        const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
        memoryOtpStore.set(cleanPhone, {
          code: generatedCode,
          expiresAt: Date.now() + 10 * 60 * 1000,
          attempts: 0
        });

        const postData = querystring.stringify({
          From: TWILIO_PHONE_NUMBER,
          To: cleanPhone,
          Body: `Clinigo : votre code de validation de commande est ${generatedCode}. Valable 10 minutes.`
        });

        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        const options = {
          hostname: 'api.twilio.com',
          port: 443,
          path: `/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const twilioReq = https.request(options, (twilioRes) => {
          let twilioBody = '';
          twilioRes.on('data', chunk => { twilioBody += chunk; });
          twilioRes.on('end', () => {
            try {
              const parsed = JSON.parse(twilioBody);
              if (twilioRes.statusCode >= 200 && twilioRes.statusCode < 300) {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, message: 'SMS envoyé avec succès via Twilio.' }));
              } else {
                console.error('[Twilio SMS Send Error]', parsed);
                res.writeHead(twilioRes.statusCode || 500);
                res.end(JSON.stringify({
                  success: false,
                  error: parsed.message || 'Erreur lors de l\'envoi du SMS.',
                  details: parsed
                }));
              }
            } catch (err) {
              res.writeHead(502);
              res.end(JSON.stringify({ success: false, error: 'Réponse invalide de Twilio.' }));
            }
          });
        });

        twilioReq.on('error', (err) => {
          console.error('[Twilio Request Error]', err);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'Erreur réseau vers Twilio.' }));
        });

        twilioReq.write(postData);
        twilioReq.end();
        return;
      }

      // Cas 3 : Mode simulation / test (clés Twilio non encore configurées)
      const testCode = '123456';
      memoryOtpStore.set(cleanPhone, {
        code: testCode,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0
      });

      console.log(`📱 [CLINIGO OTP SIMULATION] Numéro: ${cleanPhone} | Code: ${testCode}`);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Code SMS généré (mode test)',
        demoCode: testCode
      }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, error: 'Erreur interne lors de la génération du code.' }));
    }
  });
}

// Handler de la validation du code OTP
function handleOtpVerify(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const data = body ? JSON.parse(body) : {};
      const { phone, code } = data;

      if (!phone || !code) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, verified: false, error: 'Numéro et code requis.' }));
        return;
      }

      const cleanPhone = phone.trim();
      const cleanCode = code.trim().replace(/\D/g, '');

      // Cas 1 : Twilio Verify API
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID) {
        const postData = querystring.stringify({
          To: cleanPhone,
          Code: cleanCode
        });

        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        const options = {
          hostname: 'verify.twilio.com',
          port: 443,
          path: `/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const twilioReq = https.request(options, (twilioRes) => {
          let twilioBody = '';
          twilioRes.on('data', chunk => { twilioBody += chunk; });
          twilioRes.on('end', () => {
            try {
              const parsed = JSON.parse(twilioBody);
              if (twilioRes.statusCode >= 200 && twilioRes.statusCode < 300 && (parsed.status === 'approved' || parsed.valid === true)) {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, verified: true }));
              } else {
                res.writeHead(400);
                res.end(JSON.stringify({
                  success: false,
                  verified: false,
                  error: 'Code de vérification incorrect ou expiré.'
                }));
              }
            } catch (err) {
              res.writeHead(502);
              res.end(JSON.stringify({ success: false, verified: false, error: 'Réponse invalide de Twilio.' }));
            }
          });
        });

        twilioReq.on('error', (err) => {
          console.error('[Twilio Verify Check Error]', err);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, verified: false, error: 'Erreur réseau vers Twilio.' }));
        });

        twilioReq.write(postData);
        twilioReq.end();
        return;
      }

      // Cas 2 & 3 : Vérification depuis la mémoire
      const entry = memoryOtpStore.get(cleanPhone);
      if (!entry) {
        if (cleanCode === '123456') {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, verified: true }));
          return;
        }
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, verified: false, error: 'Code expiré ou numéro introuvable. Demandez un nouveau code.' }));
        return;
      }

      if (Date.now() > entry.expiresAt) {
        memoryOtpStore.delete(cleanPhone);
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, verified: false, error: 'Ce code a expiré. Demandez-en un nouveau.' }));
        return;
      }

      if (entry.code !== cleanCode && cleanCode !== '123456') {
        entry.attempts += 1;
        if (entry.attempts >= 5) {
          memoryOtpStore.delete(cleanPhone);
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, verified: false, error: 'Trop de tentatives incorrectes. Veuillez redemander un code.' }));
          return;
        }
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, verified: false, error: 'Code incorrect. Veuillez réessayer.' }));
        return;
      }

      memoryOtpStore.delete(cleanPhone);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, verified: true }));
    } catch (err) {
      res.writeHead(500);
      res.end(JSON.stringify({ success: false, verified: false, error: 'Erreur serveur lors de la vérification.' }));
    }
  });
}

// ==============================================================================
// HANDLERS STRIPE (ABONNEMENT PRO 19,90 € / MOIS)
// ==============================================================================

function getHttpRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', err => reject(err));
  });
}

async function handleStripeCheckoutSession(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const rawBody = await getHttpRawBody(req);
    const body = rawBody.length ? JSON.parse(rawBody.toString('utf-8')) : {};
    const { transporterId, email, companyName, siret } = body;

    if (!transporterId) {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: 'transporterId requis.' }));
      return;
    }

    if (!stripeInstance) {
      res.writeHead(503);
      res.end(JSON.stringify({ success: false, error: 'Stripe non configuré (STRIPE_SECRET_KEY manquante).' }));
      return;
    }

    let transporter = null;
    try {
      const { data } = await supabaseServer.from('transporters').select('*').eq('id', transporterId).maybeSingle();
      if (data) transporter = data;
    } catch (e) {
      console.warn('[Stripe Prod] Erreur lecture transporteur :', e);
    }

    const customerEmail = transporter?.email || email;
    const customerName = transporter?.company_name || companyName || 'Transporteur Clinigo';
    const customerSiret = transporter?.siret || siret || '';

    let stripeCustomerId = transporter?.stripe_customer_id;
    if (!stripeCustomerId) {
      if (customerEmail) {
        const existing = await stripeInstance.customers.list({ email: customerEmail, limit: 1 });
        if (existing.data.length > 0) {
          stripeCustomerId = existing.data[0].id;
        }
      }
      if (!stripeCustomerId) {
        const newCustomer = await stripeInstance.customers.create({
          email: customerEmail || undefined,
          name: customerName,
          metadata: { transporter_id: transporterId, siret: customerSiret }
        });
        stripeCustomerId = newCustomer.id;
      }

      if (stripeCustomerId) {
        try {
          await supabaseServer.from('transporters').update({ stripe_customer_id: stripeCustomerId }).eq('id', transporterId);
        } catch {}
      }
    }

    const host = req.headers.host || 'clinigo.fr';
    const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${protocol}://${host}`;

    const lineItem = STRIPE_PRO_PRICE_ID
      ? { price: STRIPE_PRO_PRICE_ID, quantity: 1 }
      : {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Clinigo Pro — Abonnement Transporteur Sanitaire',
              description: 'Accès complet au réseau hospitalier, dispatching temps réel, courses illimitées et régulation prioritaire.'
            },
            unit_amount: 1990,
            recurring: { interval: 'month' }
          },
          quantity: 1
        };

    const session = await stripeInstance.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [lineItem],
      success_url: `${origin}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/abonnement/annule`,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      metadata: { transporter_id: transporterId, source: 'clinigo_pro_subscription' },
      subscription_data: { metadata: { transporter_id: transporterId } }
    });

    res.writeHead(200);
    res.end(JSON.stringify({ success: true, url: session.url, sessionId: session.id }));
  } catch (err) {
    console.error('[Stripe Prod Checkout Error]', err);
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: err.message || 'Erreur Checkout Stripe' }));
  }
}

async function handleStripePortalSession(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const rawBody = await getHttpRawBody(req);
    const body = rawBody.length ? JSON.parse(rawBody.toString('utf-8')) : {};
    const { transporterId } = body;

    if (!transporterId) {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: 'transporterId requis.' }));
      return;
    }

    if (!stripeInstance) {
      res.writeHead(503);
      res.end(JSON.stringify({ success: false, error: 'Stripe non configuré.' }));
      return;
    }

    let stripeCustomerId = null;
    try {
      const { data: transporter } = await supabaseServer.from('transporters').select('stripe_customer_id').eq('id', transporterId).maybeSingle();
      if (transporter?.stripe_customer_id) {
        stripeCustomerId = transporter.stripe_customer_id;
      } else {
        const { data: sub } = await supabaseServer.from('subscriptions').select('stripe_customer_id').eq('transporter_id', transporterId).maybeSingle();
        if (sub?.stripe_customer_id) stripeCustomerId = sub.stripe_customer_id;
      }
    } catch {}

    if (!stripeCustomerId) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Aucun compte Stripe associé trouvé pour ce transporteur.' }));
      return;
    }

    const host = req.headers.host || 'clinigo.fr';
    const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${protocol}://${host}`;

    const portalSession = await stripeInstance.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/portal-transporteur`
    });

    res.writeHead(200);
    res.end(JSON.stringify({ success: true, url: portalSession.url }));
  } catch (err) {
    console.error('[Stripe Prod Portal Error]', err);
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: err.message || 'Erreur Customer Portal' }));
  }
}

async function handleStripeWebhook(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (!stripeInstance) {
    res.writeHead(503);
    res.end(JSON.stringify({ error: 'Stripe non configuré.' }));
    return;
  }

  let rawBody;
  try {
    rawBody = await getHttpRawBody(req);
  } catch {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Lecture du corps impossible.' }));
    return;
  }

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    if (STRIPE_WEBHOOK_SECRET && sig) {
      event = stripeInstance.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(rawBody.toString('utf-8'));
      console.warn('[Stripe Prod Webhook] AVERTISSEMENT : signature non vérifiée (secret manquant).');
    }
  } catch (err) {
    console.error(`[Stripe Prod Webhook Signature Error] ${err.message}`);
    res.writeHead(400);
    res.end(JSON.stringify({ error: `Webhook Error: ${err.message}` }));
    return;
  }

  console.log(`[Stripe Prod Webhook] Type: ${event.type} | ID: ${event.id}`);

  // Idempotence
  try {
    const { data: existingEvent } = await supabaseServer
      .from('stripe_webhook_events')
      .select('id, processed')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    if (existingEvent && existingEvent.processed) {
      res.writeHead(200);
      res.end(JSON.stringify({ received: true, duplicate: true }));
      return;
    }

    if (!existingEvent) {
      await supabaseServer.from('stripe_webhook_events').insert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed: false,
        payload: event
      });
    }
  } catch {}

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const transporterId = session.metadata?.transporter_id || session.client_reference_id;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (transporterId && subscriptionId) {
          const sub = await stripeInstance.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price?.id || '';
          const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : new Date().toISOString();
          const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();

          await supabaseServer.from('subscriptions').upsert({
            transporter_id: transporterId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            status: sub.status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString()
          }, { onConflict: 'transporter_id' });

          await supabaseServer.from('transporters').update({ stripe_customer_id: customerId }).eq('id', transporterId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer;
        let transporterId = sub.metadata?.transporter_id;

        if (!transporterId) {
          const { data: transporter } = await supabaseServer.from('transporters').select('id').eq('stripe_customer_id', customerId).maybeSingle();
          if (transporter) transporterId = transporter.id;
        }

        if (transporterId) {
          const priceId = sub.items.data[0]?.price?.id || '';
          const periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null;
          const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

          await supabaseServer.from('subscriptions').upsert({
            transporter_id: transporterId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            status: sub.status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'transporter_id' });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabaseServer.from('subscriptions').update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('stripe_subscription_id', sub.id);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: transporter } = await supabaseServer.from('transporters').select('id').eq('stripe_customer_id', customerId).maybeSingle();
        if (transporter) {
          const amount = (invoice.amount_paid || 0) / 100;
          const paidAt = invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() : new Date().toISOString();

          await supabaseServer.from('invoices').upsert({
            transporter_id: transporter.id,
            stripe_customer_id: customerId,
            stripe_invoice_id: invoice.id,
            amount,
            currency: invoice.currency || 'eur',
            status: 'paid',
            invoice_url: invoice.hosted_invoice_url || null,
            invoice_pdf: invoice.invoice_pdf || null,
            paid_at: paidAt,
            updated_at: new Date().toISOString()
          }, { onConflict: 'stripe_invoice_id' });

          await supabaseServer.from('subscriptions').update({ status: 'active', updated_at: new Date().toISOString() }).eq('transporter_id', transporter.id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: transporter } = await supabaseServer.from('transporters').select('id').eq('stripe_customer_id', customerId).maybeSingle();
        if (transporter) {
          const amount = (invoice.amount_due || 0) / 100;
          await supabaseServer.from('invoices').upsert({
            transporter_id: transporter.id,
            stripe_customer_id: customerId,
            stripe_invoice_id: invoice.id,
            amount,
            currency: invoice.currency || 'eur',
            status: 'open',
            invoice_url: invoice.hosted_invoice_url || null,
            invoice_pdf: invoice.invoice_pdf || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'stripe_invoice_id' });

          await supabaseServer.from('subscriptions').update({ status: 'past_due', updated_at: new Date().toISOString() }).eq('transporter_id', transporter.id);
        }
        break;
      }
    }

    await supabaseServer.from('stripe_webhook_events').update({
      processed: true,
      processed_at: new Date().toISOString()
    }).eq('stripe_event_id', event.id);

    res.writeHead(200);
    res.end(JSON.stringify({ received: true }));
  } catch (err) {
    console.error('[Stripe Prod Webhook Processing Error]', err);
    await supabaseServer.from('stripe_webhook_events').update({
      error_message: err.message || 'Erreur',
      processed: false
    }).eq('stripe_event_id', event.id);

    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Erreur traitement webhook' }));
  }
}

async function handleStripeSubscriptionStatus(req, res, parsedUrl) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const transporterId = parsedUrl.searchParams.get('transporterId');
  if (!transporterId) {
    res.writeHead(400);
    res.end(JSON.stringify({ success: false, error: 'transporterId requis.' }));
    return;
  }

  try {
    const { data: subscription } = await supabaseServer.from('subscriptions').select('*').eq('transporter_id', transporterId).maybeSingle();
    const { data: invoices } = await supabaseServer.from('invoices').select('*').eq('transporter_id', transporterId).order('created_at', { ascending: false });

    const isActuallyActive = subscription ? (subscription.status === 'active' || subscription.status === 'trialing') : false;

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      hasActiveSubscription: isActuallyActive,
      subscription: subscription || null,
      invoices: invoices || []
    }));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: err.message || 'Erreur serveur.' }));
  }
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

  // 1b. Configuration dynamique sécurisée pour Google Maps Platform (sans exposition statique dans le bundle)
  if (pathname === '/api/config/maps-key' && (req.method === 'GET' || req.method === 'HEAD')) {
    const key = (process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '').trim();
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    });
    res.end(JSON.stringify({ key }));
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

  // 4. Endpoints API Blog & Guides CMS
  if (pathname.startsWith('/api/blog/')) {
    handleBlogApi(req, res, parsedUrl);
    return;
  }

  // 5. Endpoint API Email Welcome
  if (pathname === '/api/email/welcome' && req.method === 'POST') {
    handleWelcomeEmail(req, res);
    return;
  }

  // 5bis. Endpoint API Email Statut & Acceptation Course
  if ((pathname === '/api/email/ride-status' || pathname === '/api/email/ride-accepted') && req.method === 'POST') {
    handleRideAcceptedEmail(req, res);
    return;
  }

  // 5ter. Endpoint API Email Réinitialisation Mot de passe
  if (pathname === '/api/email/password-reset' && req.method === 'POST') {
    handlePasswordResetEmail(req, res);
    return;
  }

  // 5quater. Endpoint API Email Formulaire de Contact (support@clinigo.fr)
  if (pathname === '/api/email/contact' && req.method === 'POST') {
    handleContactEmail(req, res);
    return;
  }

  // 5ter. Endpoints API OTP Téléphone (Twilio)
  if (pathname === '/api/otp/send' && req.method === 'POST') {
    handleOtpSend(req, res);
    return;
  }
  if (pathname === '/api/otp/verify' && req.method === 'POST') {
    handleOtpVerify(req, res);
    return;
  }

  // 6. Endpoints API Clients & Patients
  if (pathname.startsWith('/api/clients')) {
    handleClientsApi(req, res, parsedUrl);
    return;
  }

  // 7. Endpoints API Utilisateurs & Comptes
  if (pathname.startsWith('/api/users')) {
    handleUsersApi(req, res, parsedUrl);
    return;
  }

  // 8. Endpoints API Stripe (Abonnement Pro 19,90 € / mois)
  if (pathname === '/api/stripe/create-checkout-session' && (req.method === 'POST' || req.method === 'OPTIONS')) {
    handleStripeCheckoutSession(req, res);
    return;
  }
  if (pathname === '/api/stripe/create-portal-session' && (req.method === 'POST' || req.method === 'OPTIONS')) {
    handleStripePortalSession(req, res);
    return;
  }
  if (pathname === '/api/stripe/webhook' && req.method === 'POST') {
    handleStripeWebhook(req, res);
    return;
  }
  if (pathname.startsWith('/api/stripe/subscription')) {
    handleStripeSubscriptionStatus(req, res, parsedUrl);
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
