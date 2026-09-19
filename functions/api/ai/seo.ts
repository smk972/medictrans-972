/**
 * Cloudflare Pages Functions Handler pour /api/ai/seo
 * Moteur d'assistance à la rédaction SEO et vérification factuelle pour Clinigo.fr
 */

export interface SeoGeneratePlanRequest {
  topic: string;
  focusKeyword: string;
  targetCity?: string;
  contentType: string; // 'Guide' | 'Article informatif' | 'FAQ' | 'Comparatif' | 'Guide local'
  tone?: string;       // 'Professionnel' | 'Pédagogique' | 'Direct'
  wordCountTarget?: number;
}

export interface SeoGenerateArticleRequest {
  plan: {
    title: string;
    focusKeyword: string;
    intent: string;
    headings: string[];
    suggestedQuestions: string[];
    sourcesToVerify: string[];
  };
  contentType: string;
  tone?: string;
  wordCountTarget?: number;
  existingArticles?: { title: string; slug: string }[];
}

// Prompts système spécialisés
const SYSTEM_SEO_PROMPT = `Tu es l'assistant éditorial en chef et expert SEO de Clinigo (clinigo.fr), plateforme de référence en France pour la réservation et la régulation de transports sanitaires (Ambulances, VSL et Taxis Conventionnés).

RÈGLES DÉONTOLOGIQUES & ÉDITORIALES STRICTES :
1. Tu ne dois JAMAIS inventer de tarifs officiels, de pourcentages de remboursement erronés, d'articles de loi fictifs ou de données médicales inventées.
2. Privilégie TOUJOURS les références officielles : Caisse Nationale d'Assurance Maladie (ameli.fr), Ministère de la Santé (sante.gouv.fr), Service-Public.fr, Légifrance.
3. Distingue clairement les faits établis des conseils pratiques. Si une règle dépend de la caisse ou de la situation clinique, écris "Selon les critères définis par votre caisse d'Assurance Maladie" ou "Sous réserve d'accord préalable".
4. Évite le bourrage de mots-clés (keyword stuffing). Écris dans un français irréprochable, clair, humain, bienveillant et professionnel.
5. Structure tes réponses en Markdown impeccable avec H2 (##) et H3 (###).
6. Ne crée des liens internes QUE vers des URLs existantes fournies explicitement dans la liste fournie.`;

export async function onRequestPost(context: any): Promise<Response> {
  const request = context.request;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { action, payload } = body;
  const geminiApiKey = context.env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');

  const startTime = Date.now();

  try {
    let resultData: any;

    if (action === 'generatePlan') {
      resultData = await handleGeneratePlan(payload, geminiApiKey);
    } else if (action === 'generateArticle') {
      resultData = await handleGenerateArticle(payload, geminiApiKey);
    } else if (action === 'generateMeta') {
      resultData = await handleGenerateMeta(payload, geminiApiKey);
    } else if (action === 'generateFAQ') {
      resultData = await handleGenerateFAQ(payload, geminiApiKey);
    } else if (action === 'generateIdeas') {
      resultData = await handleGenerateIdeas(payload, geminiApiKey);
    } else if (action === 'transformText') {
      resultData = await handleTransformText(payload, geminiApiKey);
    } else if (action === 'generateImage') {
      const prompt = (payload?.prompt || (body as any)?.prompt || '').trim();
      const lower = prompt.toLowerCase();
      const categories = [
        {
          file: '/assets/gallery/regulation_ambulance_dispatch.jpg',
          keywords: ['régulation', 'regulation', 'salle de régulation', 'salle de regulation', 'dispatch', 'centre de régulation', 'standard', 'permanence', 'opérateur', 'coordination', 'écran'],
          weight: 3.0
        },
        {
          file: '/assets/gallery/transport_pmr_fauteuil.jpg',
          keywords: ['pmr', 'fauteuil', 'roulant', 'handicap', 'rampe', 'ufr', 'mobilité', 'mobilite', 'invalide', 'marcheur'],
          weight: 2.5
        },
        {
          file: '/assets/gallery/dialyse_centre_soins.jpg',
          keywords: ['dialyse', 'hémodialyse', 'hemodialyse', 'rein', 'néphrologie', 'nephrologie', 'chimio', 'chimiothérapie', 'oncologie', 'séance', 'régulier'],
          weight: 2.5
        },
        {
          file: '/assets/gallery/pediatrie_maternite.jpg',
          keywords: ['enfant', 'pédiatrie', 'pediatrie', 'bébé', 'bebe', 'nourrisson', 'maternité', 'maternite', 'mère', 'mere', 'maman', 'enceinte', 'grossesse', 'accouchement', 'naissance', 'pédiatrique'],
          weight: 2.5
        },
        {
          file: '/assets/gallery/evasan_helicoptere_chu.jpg',
          keywords: ['hélicoptère', 'helicoptere', 'dragon', 'dragon 972', 'évasan', 'evasan', 'évacuation', 'evacuation', 'héliport', 'heliport', 'aérien', 'aerien'],
          weight: 2.5
        },
        {
          file: '/assets/gallery/clinique_accueil_urgences.jpg',
          keywords: ['clinique', 'accueil', 'secrétaire', 'secretaire', 'admission', 'rendez-vous', 'rdv', 'bureau', 'guichet', 'sainte-marie', 'saint-paul'],
          weight: 2.0
        },
        {
          file: '/assets/gallery/taxi_conventionne_aidant.jpg',
          keywords: ['taxi', 'conventionné', 'conventionne', 'cpam', 'chauffeur', 'senior', 'personne âgée', 'personne agee', 'aide', 'aidant', 'bienveillance', 'domicile'],
          weight: 2.0
        },
        {
          file: '/assets/gallery/vsl_transport_cote.jpg',
          keywords: ['vsl', 'véhicule sanitaire léger', 'vehicule sanitaire leger', 'assis', 'berline', 'voiture', 'côte', 'cote', 'route', 'littoral'],
          weight: 2.0
        },
        {
          file: '/assets/gallery/brancardiers_soins_hopital.jpg',
          keywords: ['brancard', 'brancardier', 'civière', 'civiere', 'allongé', 'allonge', 'couché', 'couche', 'perfusion', 'soins', 'transfert'],
          weight: 2.0
        },
        {
          file: '/assets/gallery/medecin_prescription_pmt.jpg',
          keywords: ['pmt', 'cerfa', 'prescription', 'bon de transport', 'médecin', 'medecin', 'docteur', 'ordonnance', '100%', 'ald', 'sécurité sociale', 'remboursement', 'ameli'],
          weight: 2.0
        },
        {
          file: '/assets/gallery/ambulance_martinique_chu.jpg',
          keywords: ['ambulance', 'samu', 'smur', 'urgence', '15', 'sirène', 'sirene', 'gyrophare', 'chum', 'hôpital', 'hopital', 'trinité', 'fort-de-france', 'lamentin'],
          weight: 1.5
        }
      ];

      let bestFile = '/assets/gallery/ambulance_martinique_chu.jpg';
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
          bestFile = '/assets/gallery/vsl_transport_cote.jpg';
        } else if (lower.includes('médecin') || lower.includes('papier') || lower.includes('droit')) {
          bestFile = '/assets/gallery/medecin_prescription_pmt.jpg';
        } else {
          bestFile = '/assets/gallery/ambulance_martinique_chu.jpg';
        }
      }

      resultData = {
        imageUrl: bestFile,
        prompt
      };
    } else {
      return new Response(JSON.stringify({ error: `Action inconnue : ${action}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: resultData,
        durationMs,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Erreur lors de la génération IA',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * ÉTAPE 1 : GÉNÉRATION DU PLAN (OUTLINE)
 */
async function handleGeneratePlan(payload: SeoGeneratePlanRequest, apiKey: string) {
  const { topic, focusKeyword, targetCity, contentType, tone = 'Professionnel', wordCountTarget = 1000 } = payload;

  const prompt = `Génère le PLAN DÉTAILLÉ (Outline) pour un futur article SEO de haute qualité sur Clinigo.fr.
Sujet : "${topic}"
Mot-clé principal : "${focusKeyword}"
${targetCity ? `Zone ciblée : "${targetCity}"` : ''}
Type de contenu : ${contentType}
Ton : ${tone}
Longueur cible : ${wordCountTarget} mots

Fournis une réponse JSON strictement valide au format suivant :
{
  "title": "Titre optimisé percutant (50-65 caractères)",
  "slug": "slug-optimise-sans-accents",
  "focusKeyword": "${focusKeyword}",
  "intent": "informationnelle ou commerciale ou transactionnelle",
  "headings": [
    "## 1. Titre H2",
    "### 1.1 Sous-titre H3",
    "## 2. Titre H2",
    "## 3. Titre H2"
  ],
  "suggestedQuestions": [
    "Question fréquente 1 ?",
    "Question fréquente 2 ?"
  ],
  "sourcesToVerify": [
    "Ameli.fr - Frais de transport",
    "Service-Public.fr - Bon de transport Cerfa"
  ]
}`;

  if (!apiKey) {
    // Réponse déterministe hors ligne
    return {
      title: `${topic} : Guide Complet & Démarches Pratiques`,
      slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
      focusKeyword,
      intent: 'informationnelle',
      headings: [
        `## 1. Qu'est-ce que ${focusKeyword} ?`,
        `## 2. Dans quels cas pouvez-vous en bénéficier ?`,
        `## 3. Modalités de prise en charge et démarches avec la CPAM`,
        `## 4. Comment réserver sereinement avec Clinigo ?`
      ],
      suggestedQuestions: [
        `Qui a droit au remboursement pour ${focusKeyword} ?`,
        `Quelle est la différence entre VSL et taxi conventionné ?`
      ],
      sourcesToVerify: [
        'ameli.fr - Prise en charge des transports sanitaires',
        'service-public.fr - Prescription Médicale de Transport'
      ]
    };
  }

  return await callGeminiJson(prompt, apiKey);
}

/**
 * ÉTAPE 2 : RÉDACTION COMPLÈTE DE L'ARTICLE
 */
async function handleGenerateArticle(payload: SeoGenerateArticleRequest, apiKey: string) {
  const { plan, contentType, tone = 'Professionnel', existingArticles = [] } = payload;

  const prompt = `Rédige l'ARTICLE COMPLET en respectant scrupuleusement ce plan validé :
Titre : ${plan.title}
Mot-clé : ${plan.focusKeyword}
Intention : ${plan.intent}
Plan des sous-titres :
${plan.headings.join('\n')}

Questions FAQ prévues :
${plan.suggestedQuestions.join('\n')}

Articles existants sur Clinigo pour le maillage interne :
${existingArticles.map(a => `- [${a.title}](/blog/${a.slug})`).join('\n') || 'Aucun article existant'}

Consignes de rédaction strictes :
1. Rédige un article complet, approfondi et directement publiable (au moins 800 à 1200 mots).
2. Utilise des balises H2 et H3, des listes à puces et des encadrés réglementaires détaillés.
3. L'article DOIT OBLIGATOIREMENT se terminer par une section de conclusion avec un lien vers le site : [www.clinigo.fr](https://www.clinigo.fr).

Génère une réponse JSON valide avec cette structure :
{
  "title": "${plan.title}",
  "slug": "${plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}",
  "excerpt": "Résumé incitatif de 130 à 160 caractères contenant le mot-clé.",
  "metaTitle": "${plan.title} | Clinigo",
  "metaDescription": "Description percutante de 140 à 160 caractères pour Google.",
  "content": "Texte intégral rédigé en Markdown avec H2, H3, listes à puces et se terminant obligatoirement par le lien [www.clinigo.fr](https://www.clinigo.fr).",
  "faq": [
    { "question": "Question 1", "answer": "Réponse précise et sourcée" },
    { "question": "Question 2", "answer": "Réponse précise et sourcée" }
  ],
  "suggestedCta": "Réserver un transport conventionné",
  "suggestedImageAlt": "Description textuelle pour l'image d'illustration",
  "sources": [
    { "title": "Assurance Maladie Ameli.fr", "url": "https://www.ameli.fr/assure/remboursements/rembourse/transport", "organization": "CPAM", "verified": true }
  ]
}`;

  if (!apiKey) {
    const kw = plan.focusKeyword || 'transport sanitaire conventionné';
    return {
      title: plan.title,
      slug: plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
      excerpt: `Découvrez notre guide complet sur ${kw} : conditions d'éligibilité, démarches administratives et conseils pour votre transport sanitaire.`,
      metaTitle: `${plan.title} | Clinigo`,
      metaDescription: `Guide complet sur ${kw} : règles de prise en charge CPAM, bon de transport et conseils pour réserver votre véhicule sanitaire.`,
      content: `## Introduction

Le recours à un **transport sanitaire** pour **${kw}** constitue une composante clé de votre prise en charge médicale. Encadré par le Code de la santé publique et l'Assurance Maladie, ce déplacement répond à des normes strictes de confort et de sécurité.

---

## 1. Cadre légal et Prescription Médicale de Transport (PMT)

Tout transport pris en charge requiert impérativement une **Prescription Médicale de Transport (PMT Cerfa)** établie par votre praticien avant le déplacement.

### Situations prises en charge :
- Entrées et sorties d'hospitalisation ;
- Traitements pour Affections de Longue Durée (ALD 100%) ;
- Soins récurrents (séances de dialyse, chimiothérapie, rééducation) ;
- Transports en série ou de longue distance (avec accord préalable CPAM).

---

## 2. Ambulance, VSL ou Taxi conventionné : quel véhicule choisir ?

Le choix du véhicule relève de la décision médicale en fonction de votre autonomie :
- **Ambulance** : pour les patients nécessitant une position allongée ou une surveillance permanente.
- **VSL ou Taxi conventionné** : pour le transport assis professionnalisé sans surveillance médicale lourde.

---

## 3. Prise en charge financière et Tiers Payant

Avec une ALD ou une exonération du ticket modérateur, vous bénéficiez du tiers payant à 100% sans avance de frais.

---

### Réservez votre transport conventionné en toute simplicité

Pour planifier sereinement vos déplacements médicaux en ambulance, VSL ou taxi conventionné avec prise en charge Sécurité sociale, réservez directement votre transport sur [www.clinigo.fr](https://www.clinigo.fr).`,
      faq: plan.suggestedQuestions.map(q => ({
        question: q,
        answer: 'Consultez les recommandations officielles de l\'Assurance Maladie et votre médecin traitant.'
      })),
      suggestedCta: 'Réserver un transport sanitaire',
      suggestedImageAlt: `Illustration professionnelle pour ${plan.focusKeyword}`,
      sources: [
        {
          title: 'Ameli.fr - Frais de transport sanitaire',
          url: 'https://www.ameli.fr/assure/remboursements/rembourse/transport',
          organization: 'Assurance Maladie',
          verified: true
        }
      ]
    };
  }

  const generatedData = await callGeminiJson(prompt, apiKey);
  if (generatedData && generatedData.content) {
    const endingRegex = /\[www\.clinigo\.fr\]\(https?:\/\/(www\.)?clinigo\.fr\/?\)\s*$/i;
    if (!endingRegex.test(generatedData.content.trim()) && !generatedData.content.slice(-250).includes('[www.clinigo.fr](')) {
      generatedData.content = generatedData.content.trim() + `\n\n---\n\n### Réservez votre transport conventionné en toute simplicité\n\nPour planifier sereinement vos déplacements médicaux en ambulance, VSL ou taxi conventionné avec prise en charge Sécurité sociale, réservez directement votre transport sur [www.clinigo.fr](https://www.clinigo.fr).`;
    }
  }
  return generatedData;
}

/**
 * GÉNÉRATION DE METAS
 */
async function handleGenerateMeta(payload: { title: string; content: string; focusKeyword: string }, apiKey: string) {
  const prompt = `Rédige les balises SEO optimales pour cet article :
Titre : ${payload.title}
Mot-clé : ${payload.focusKeyword}
Extrait : ${payload.content.slice(0, 500)}

Format JSON attendu :
{
  "seoTitle": "Titre optimisé entre 50 et 65 caractères",
  "metaDescription": "Description incitative entre 120 et 155 caractères avec le mot-clé"
}`;

  if (!apiKey) {
    return {
      seoTitle: `${payload.title} | Clinigo`,
      metaDescription: `Guide pratique : ${payload.title}. Tout savoir sur la prise en charge, les démarches et la réservation sur Clinigo.fr.`
    };
  }

  return await callGeminiJson(prompt, apiKey);
}

/**
 * GÉNÉRATION DE FAQ
 */
async function handleGenerateFAQ(payload: { topic: string; content: string }, apiKey: string) {
  const prompt = `Génère 3 questions/réponses pertinentes et sourcées sur le sujet : "${payload.topic}" pour Clinigo.fr.
Format JSON :
{
  "faq": [
    { "question": "Question 1 ?", "answer": "Réponse factuelle claire" },
    { "question": "Question 2 ?", "answer": "Réponse factuelle claire" },
    { "question": "Question 3 ?", "answer": "Réponse factuelle claire" }
  ]
}`;

  if (!apiKey) {
    return {
      faq: [
        {
          question: `Comment obtenir une prise en charge pour ${payload.topic} ?`,
          answer: 'La prise en charge nécessite une prescription médicale de transport établie au préalable par votre médecin traitant ou hospitalier.'
        },
        {
          question: 'Dois-je avancer les frais lors du transport ?',
          answer: 'Si vous êtes en ALD à 100% ou bénéficiaire du tiers-payant, vous n\'avez aucune avance de frais auprès de nos transporteurs conventionnés.'
        }
      ]
    };
  }

  return await callGeminiJson(prompt, apiKey);
}

/**
 * GÉNÉRATION DE NOUVELLES IDÉES SEO
 */
async function handleGenerateIdeas(payload: { seedKeyword?: string; count?: number }, apiKey: string) {
  const count = payload.count || 5;
  const prompt = `Propose ${count} idées d'articles SEO stratégiques pour Clinigo.fr autour du transport sanitaire, médical, ambulance, VSL, dialyse, ALD.
Format JSON :
{
  "ideas": [
    {
      "topic": "Thématique",
      "keyword": "mot cle cible",
      "searchIntent": "informationnelle ou commerciale",
      "suggestedTitle": "Titre d'article suggéré",
      "priority": "HIGH ou MEDIUM"
    }
  ]
}`;

  if (!apiKey) {
    return {
      ideas: [
        {
          topic: 'Prise en charge rééducation',
          keyword: 'transport kiné rééducation',
          searchIntent: 'informationnelle',
          suggestedTitle: 'Séances de rééducation : Conditions de remboursement du transport',
          priority: 'MEDIUM'
        },
        {
          topic: 'Accord préalable CPAM',
          keyword: 'délai accord préalable transport',
          searchIntent: 'informationnelle',
          suggestedTitle: 'Accord préalable de transport médical : Délais et démarches avec la CPAM',
          priority: 'HIGH'
        }
      ]
    };
  }

  return await callGeminiJson(prompt, apiKey);
}

/**
 * TRANSFORMATION DE TEXTE SÉLECTIONNÉ (IA INLINE & TABLEAUX)
 */
async function handleTransformText(payload: any, apiKey: string): Promise<{ text: string }> {
  const { text, instruction, customPrompt, targetKeyword } = payload || {};
  if (!text || !text.trim()) {
    throw new Error('Texte source manquant pour la transformation');
  }

  if (apiKey) {
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
2. Ne commence JAMAIS par des formules de politesse ni de bavardage.
3. Rends DIRECTEMENT et UNIQUEMENT le texte ou tableau transformé en Markdown prêt à être inséré.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: 'Tu es un assistant éditorial expert en rédaction médicale et SEO. Rends uniquement le texte final sans bavardage.' }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 }
        })
      });

      if (response.ok) {
        const d: any = await response.json();
        const output = d.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (output) return { text: output };
      }
    } catch (e) {
      console.warn('Fallback local transformText Cloudflare :', e);
    }
  }

  // Fallback local algorithmique
  if (instruction === 'transformer_en_tableau') {
    const rawLines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
    let table = `| Critère / Élément | Détails & Spécificités | Prise en charge Clinigo |\n| :--- | :--- | :--- |\n`;
    rawLines.forEach((line: string, idx: number) => {
      const parts = line.split(/[:;\-\t|]/).map((p: string) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        table += `| ${parts[0]} | ${parts.slice(1).join(' - ')} | Conforme CPAM |\n`;
      } else {
        table += `| Point ${idx + 1} | ${line.replace(/^[-*•\d.]\s*/, '')} | Inclus |\n`;
      }
    });
    return { text: table };
  }

  if (instruction === 'raccourcir') {
    return {
      text: text
        .split('\n')
        .filter(Boolean)
        .map((l: string) => `• ${l.replace(/^[-*•\d.]\s*/, '').trim()}`)
        .slice(0, 4)
        .join('\n')
    };
  }

  if (instruction === 'simplifier') {
    return {
      text: `**En résumé simple pour le patient :**\n${text}\n\n*Note Clinigo : Les démarches sont simplifiées grâce au tiers-payant automatique.*`
    };
  }

  if (instruction === 'developper') {
    return {
      text: `${text}\n\nEn pratique, l'accès à ce dispositif nécessite une prescription médicale de transport établie avant le déplacement par votre praticien, garantissant une prise en charge optimale conforme aux barèmes légaux.`
    };
  }

  return { text };
}

/**
 * APPEL REST VERS GEMINI API
 */
async function callGeminiJson(userPrompt: string, apiKey: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_SEO_PROMPT }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const data: any = await response.json();
  const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Aucune réponse générée par le modèle');
  }

  try {
    return JSON.parse(textOutput);
  } catch (e) {
    // Si le modèle a entouré de ```json
    const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }
}
