import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  BlogPost,
  BlogCategory,
  BlogTag,
  SeoKeyword,
  SeoIdea,
  SeoSettings,
  BlogRedirect,
  AiGenerationLog,
  SeoAuditReport,
  SeoAuditCheckItem,
  PostStatus,
  ContentSensitivity,
} from '../types/blog';

const STORAGE_KEY_POSTS = 'clinigo_blog_posts_v1';
const STORAGE_KEY_CATEGORIES = 'clinigo_blog_categories_v1';
const STORAGE_KEY_TAGS = 'clinigo_blog_tags_v1';
const STORAGE_KEY_KEYWORDS = 'clinigo_seo_keywords_v1';
const STORAGE_KEY_IDEAS = 'clinigo_seo_ideas_v1';
const STORAGE_KEY_SETTINGS = 'clinigo_seo_settings_v1';
const STORAGE_KEY_REDIRECTS = 'clinigo_blog_redirects_v1';
const STORAGE_KEY_AI_LOGS = 'clinigo_ai_logs_v1';

// Catégories initiales de référence
export const INITIAL_CATEGORIES: BlogCategory[] = [
  {
    id: 'cat-remboursement',
    name: 'Remboursement & Démarches CPAM',
    slug: 'remboursement-cpam',
    description: 'Tout savoir sur la prise en charge à 100% ALD, la prescription médicale de transport (PMT) et le tiers-payant.',
    seoTitle: 'Remboursement Transport Médical & CPAM | Guides Clinigo',
    metaDescription: 'Comprendre les règles de prise en charge par l\'Assurance Maladie des transports en ambulance, VSL et taxi conventionné.',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'cat-types-transport',
    name: 'Ambulance, VSL & Taxi Conventionné',
    slug: 'types-de-transport',
    description: 'Comparatifs, équipements sanitaires et critères de choix entre ambulance allongée, demi-assise, VSL et taxi conventionné.',
    seoTitle: 'Ambulance, VSL ou Taxi Conventionné : Lequel Choisir ? | Clinigo',
    metaDescription: 'Découvrez les différences réglementaires et médicales entre les modes de transport sanitaire conventionné.',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'cat-pathologies',
    name: 'Pathologies & Prise en Charge ALD',
    slug: 'pathologies-ald',
    description: 'Trajets récurrents pour dialyse, chimiothérapie, radiothérapie, rééducation ou consultations hospitalières.',
    seoTitle: 'Transport Sanitaire & Affections Longue Durée (ALD) | Clinigo',
    metaDescription: 'Guides patients pour l\'organisation des transports fréquents liés aux soins chroniques et affections de longue durée.',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'cat-territoires',
    name: 'Transport Sanitaire & Territoires',
    slug: 'territoires-sante',
    description: 'Spécificités de la régulation en Martinique, Guadeloupe, Guyane, La Réunion et France métropolitaine.',
    seoTitle: 'Régulation Sanitaire et Transport Médical en Région | Clinigo',
    metaDescription: 'Les réseaux hospitaliers régionaux (CHUM, cliniques) et les règles de transport sanitaire local.',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
];

// Tags initiaux
export const INITIAL_TAGS: BlogTag[] = [
  { id: 'tag-1', name: 'VSL', slug: 'vsl', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'tag-2', name: 'Ambulance', slug: 'ambulance', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'tag-3', name: 'Taxi conventionné', slug: 'taxi-conventionne', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'tag-4', name: 'PMT', slug: 'pmt', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'tag-5', name: 'ALD 100%', slug: 'ald-100', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'tag-6', name: 'Dialyse', slug: 'dialyse', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'tag-7', name: 'Hôpital', slug: 'hopital', createdAt: '2026-09-01T00:00:00Z' },
  { id: 'tag-8', name: 'Bon de transport', slug: 'bon-de-transport', createdAt: '2026-09-01T00:00:00Z' },
];

// Articles initiaux de démonstration (TOUS EN STATUS = DRAFT pour contrôle humain, règle absolue #3)
export const INITIAL_POSTS: BlogPost[] = [
  {
    id: 'post-demo-1',
    title: 'VSL ou Ambulance : Quelles Différences et Quel Transport Choisir ?',
    slug: 'vsl-ou-ambulance-quelles-differences',
    excerpt: 'Comprendre les différences majeures entre un Véhicule Sanitaire Léger (VSL) et une Ambulance pour faire le bon choix selon votre prescription médicale.',
    content: `## Pourquoi la distinction entre VSL et ambulance est-elle essentielle ?

Le choix entre un **Véhicule Sanitaire Léger (VSL)** et une **Ambulance** n'est pas libre : il relève exclusivement de la décision de votre médecin prescripteur, matérialisée sur votre **Prescription Médicale de Transport (PMT)**. 

Chaque véhicule répond à des critères d'équipement, de personnel et d'état de santé du patient strictement encadrés par le Code de la santé publique.

---

## 1. Le VSL (Véhicule Sanitaire Léger) : pour le transport assis

Le VSL est conçu pour le **transport assis professionnalisé (TAP)**. Il s'adresse aux personnes qui ne nécessitent ni brancardage ni surveillance médicale active pendant le trajet.

### Caractéristiques principales du VSL :
* **Position de voyage** : Uniquement en position assise.
* **Capacité** : Peut transporter de 1 à 3 patients simultanément dans le cadre de trajets partagés.
* **Équipage** : Confié à un ambulancier diplômé d'État ou titulaire du brevet auxiliaire ambulancier.
* **Équipements à bord** : Trousse de secours d'urgence, solution hydroalcoolique, désinfection rigoureuse entre chaque trajet.
* **Profil patient typique** : Patient autonome pour la marche ou nécessitant une aide légère, se rendant à des consultations, des séances de dialyse ou de rééducation.

---

## 2. L'Ambulance : pour le transport allongé ou sous surveillance

L'ambulance est requise dès lors que l'état clinique du patient exige un brancardage, un portage ou une surveillance permanente par du personnel qualifié.

### Caractéristiques de l'ambulance :
* **Position de voyage** : Allongée sur brancard ou demi-assise.
* **Équipage réglementaire** : **Deux professionnels de santé**, dont au moins un Ambulancier Diplômé d'État (ADE).
* **Équipements médicaux lourds** : Oxygénothérapie fixe et mobile, matériel d'aspiration de mucosités, défibrillateur automatisé externe (DAE), matériel d'immobilisation rachidienne.
* **Profil patient typique** : Sortie d'hospitalisation chirurgicale, transfert inter-hospitalier urgent, patient perfusé ou sous oxygène, personne grabataire.

---

## 3. Tableau comparatif synthétique

| Critère | Véhicule Sanitaire Léger (VSL) | Ambulance Médicalisée |
| :--- | :--- | :--- |
| **Position patient** | Assise | Allongée ou demi-assise sur brancard |
| **Équipage à bord** | 1 ambulancier / auxiliaire | 2 ambulanciers (dont 1 diplômé d'État) |
| **Oxygénothérapie** | Non | Oui (système fixe + portable) |
| **Transport partagé** | Oui (jusqu'à 3 personnes) | Non (transport individuel strict) |
| **Nécessité de portage** | Aide à la marche simple | Brancardage et portage complexes |

---

## Comment réserver votre transport avec Clinigo ?

Sur **Clinigo.fr**, il vous suffit d'indiquer le mode prescrit sur votre PMT (Ambulance ou VSL). La plateforme attribue automatiquement votre trajet à un transporteur sanitaire agréé par l'Agence Régionale de Santé (ARS) et conventionné par l'Assurance Maladie.`,
    featuredImage: '/assets/step2_dispatch.jpg',
    featuredImageAlt: 'Ambulance et VSL prêts pour une mission sanitaire',
    categoryId: 'cat-types-transport',
    authorName: 'Équipe Rédactionnelle Clinigo',
    seoTitle: 'VSL ou Ambulance : Différences, Règles et Choix du Véhicule | Clinigo',
    metaDescription: 'Découvrez les différences fondamentales entre VSL et ambulance : équipements, position du patient, équipage et règles de prise en charge CPAM.',
    focusKeyword: 'vsl ou ambulance',
    secondaryKeywords: ['différence vsl ambulance', 'transport assis professionnalisé', 'pmt ambulance'],
    status: 'draft', // RÈGLE ABSOLUE : DRAFT POUR CONTRÔLE HUMAIN
    contentSensitivity: 'GENERAL_INFO',
    publishedAt: null,
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-15T14:30:00Z',
    readingTime: 4,
    wordCount: 520,
    canonicalUrl: 'https://clinigo.fr/blog/vsl-ou-ambulance-quelles-differences',
    seoScore: 94,
    schemaType: 'Article',
    faq: [
      {
        question: 'Puis-je choisir une ambulance si mon médecin a prescrit un VSL ?',
        answer: 'Non. La Sécurité sociale rembourse uniquement sur la base du mode prescrit par le médecin. Si vous utilisez une ambulance alors qu\'un VSL était prescrit, la différence de coût reste à votre charge.',
      },
      {
        question: 'Le VSL permet-il le transport de plusieurs patients en même temps ?',
        answer: 'Oui, le transport partagé en VSL est encouragé par la CPAM pour optimiser les trajets des patients ayant des créneaux de rendez-vous compatibles.',
      },
    ],
    sources: [
      {
        title: 'Assurance Maladie - Frais de transport : prise en charge et remboursements',
        url: 'https://www.ameli.fr/assure/remboursements/rembourse/transport',
        organization: 'Caisse Nationale d\'Assurance Maladie (Ameli)',
        checkedAt: '2026-09-10',
        verified: true,
      },
      {
        title: 'Service-Public.fr - Prise en charge des frais de transport d\'un assuré',
        url: 'https://www.service-public.fr/particuliers/vosdroits/F751',
        organization: 'Direction de l\'information légale et administrative',
        checkedAt: '2026-09-10',
        verified: true,
      },
    ],
    aiGenerated: false,
    aiReviewed: true,
  },
  {
    id: 'post-demo-2',
    title: 'Bon de Transport et PMT : Comment Obtenir le Remboursement à 100% CPAM ?',
    slug: 'bon-de-transport-prescription-medicale-guide-complet',
    excerpt: 'Guide pratique pour obtenir et utiliser votre Prescription Médicale de Transport (PMT). Délais, conditions d\'éligibilité et démarches pour le tiers-payant.',
    content: `## Qu'est-ce qu'une Prescription Médicale de Transport (PMT) ?

Le document communément appelé **« bon de transport »** porte le nom réglementaire de **Prescription Médicale de Transport (Cerfa n° 11574*05)**. 

C'est le seul document légal permettant à l'Assurance Maladie (CPAM ou CGSS) de prendre en charge tout ou partie des frais liés à votre déplacement pour raisons de santé.

---

## 1. La règle d'or : la prescription doit être préalable

Dans la très grande majorité des situations, la prescription doit être établie **AVANT la réalisation du transport**. 

> **Important** : Un médecin ne peut pas délivrer de bon de transport a posteriori, sauf en cas d'urgence médicale avérée attestée sur le volet médical.

---

## 2. Dans quelles situations le transport est-il pris en charge ?

Le transport sanitaire n'est pas un confort mais une prestation de soins remboursée dans des cas strictement délimités par l'article R. 322-10 du Code de la sécurité sociale :

1. **Transports liés à une hospitalisation** (entrée et/ou sortie, quelle que soit la durée).
2. **Soins en rapport avec une Affection de Longue Durée (ALD)**, si le patient présente une incapacité ou déficience attestée.
3. **Traitements en rapport avec un Accident du Travail ou une Maladie Professionnelle (AT/MP)**.
4. **Transports de longue distance** (déplacement de plus de 150 km aller).
5. **Transports en série** (au moins 4 trajets de plus de 50 km sur une période de 2 mois pour un même traitement).
6. **Transports pour se rendre à une convocation du contrôle médical**.

---

## 3. Quand une entente préalable de la CPAM est-elle exigée ?

Pour certains trajets spécifiques, l'accord préalable du service médical de votre Caisse Primaire est obligatoire avant le voyage :
* Transports de **plus de 150 km**.
* Transports en **série**.
* Transports en **avion ou bateau** de ligne régulière.

Le médecin remplit alors une demande d'accord préalable que vous devez faire parvenir à votre caisse au moins **15 jours avant la date du transport**. L'absence de réponse sous 15 jours vaut accord.

---

## 4. Tiers-payant intégral avec Clinigo

Lorsque vous présentez votre PMT valide et votre attestation de droits à jour mentionnant une prise en charge à 100% (ALD, AT/MP ou maternité), vous bénéficiez de la **dispense totale d'avance de frais** auprès des transporteurs conventionnés du réseau Clinigo.`,
    featuredImage: '/assets/step1_prescription.jpg',
    featuredImageAlt: 'Médecin complétant une prescription médicale de transport Cerfa',
    categoryId: 'cat-remboursement',
    authorName: 'Équipe Régulation Clinigo',
    seoTitle: 'Bon de Transport (PMT) : Remboursement 100% CPAM & Démarches | Clinigo',
    metaDescription: 'Tout savoir sur le bon de transport médicalisé : conditions de prise en charge CPAM, accord préalable, ALD et tiers-payant intégral.',
    focusKeyword: 'bon de transport',
    secondaryKeywords: ['pmt cerfa transport', 'prescription médicale transport', 'remboursement 100% cpam'],
    status: 'draft', // RÈGLE ABSOLUE : DRAFT POUR CONTRÔLE HUMAIN
    contentSensitivity: 'REGULATORY_INFO',
    publishedAt: null,
    createdAt: '2026-09-08T09:00:00Z',
    updatedAt: '2026-09-14T11:20:00Z',
    readingTime: 5,
    wordCount: 640,
    canonicalUrl: 'https://clinigo.fr/blog/bon-de-transport-prescription-medicale-guide-complet',
    seoScore: 96,
    schemaType: 'Article',
    faq: [
      {
        question: 'Le médecin peut-il me faire un bon de transport après le trajet ?',
        answer: 'Non, sauf cas d\'urgence médicale immédiate. La réglementation impose que la PMT soit rédigée avant le transport.',
      },
      {
        question: 'Suis-je remboursé à 100% si je suis en ALD ?',
        answer: 'Le transport doit être directement lié à votre pathologie ALD et vous devez présenter une incapacité ou une déficience répondant aux critères du référentiel de l\'Assurance Maladie.',
      },
    ],
    sources: [
      {
        title: 'Ameli.fr - La prescription médicale de transport',
        url: 'https://www.ameli.fr/assure/remboursements/rembourse/transport/prescription-medicale-transport',
        organization: 'Caisse Nationale d\'Assurance Maladie (Ameli)',
        checkedAt: '2026-09-08',
        verified: true,
      },
      {
        title: 'Légifrance - Article R. 322-10 du Code de la sécurité sociale',
        url: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000038612140',
        organization: 'République Française (Légifrance)',
        checkedAt: '2026-09-08',
        verified: true,
      },
    ],
    aiGenerated: false,
    aiReviewed: true,
  },
  {
    id: 'post-demo-3',
    title: 'Transport Médical et ALD : Droits, Tiers-Payant et Démarches Pratiques',
    slug: 'transport-sanitaire-ald-affections-longue-duree',
    excerpt: 'Les personnes reconnues en Affection de Longue Durée (ALD) bénéficient de dispositions spécifiques pour leurs transports récurrents. Explications détaillées.',
    content: `## Qu'est-ce que l'exonération du ticket modérateur en ALD ?

Les personnes atteintes d'une **Affection de Longue Durée (ALD 30 ou ALD hors liste)** bénéficient de la prise en charge à 100% du tarif de responsabilité de l'Assurance Maladie pour les soins et transports liés à leur affection.

Cependant, l'ALD n'ouvre pas un droit automatique et systématique à un transport sanitaire pour n'importe quel motif.

---

## 1. Les conditions médicales cumulatives

Pour qu'un transport en ALD soit remboursé par la Sécurité sociale, deux conditions doivent être remplies simultanément :
1. Le déplacement doit être **directement en rapport avec les soins de l'ALD exonérante**.
2. Le patient doit présenter une **déficience ou incapacité physique** attestée par le médecin, l'empêchant d'utiliser les transports collectifs ou son véhicule personnel.

---

## 2. Traitements fréquents et transports récurrents

Certaines pathologies chroniques imposent des rythmes de soins soutenus :
* **Insuffisance rénale terminale** : Séances d'hémodialyse 3 fois par semaine.
* **Oncologie** : Séances de chimiothérapie et de radiothérapie.
* **Rééducation fonctionnelle** : Soins post-AVC ou traumatologie lourde.

Dans ces situations, les médecins rédigent généralement une prescription pour des **transports itératifs ou en série**, permettant une programmation sereine sur plusieurs semaines ou mois.

---

## 3. Comment Clinigo simplifie le quotidien des patients en ALD

La répétition des trajets sanitaires peut devenir une source d'épuisement logistique pour le patient et ses proches aidants.

Avec **Clinigo**, vous planifiez l'ensemble de vos séances en quelques clics :
* Attribution à un transporteur sanitaire conventionné de confiance.
* Respect rigoureux des horaires de convocation médicale et des retours.
* Facturation directe avec la CPAM sans avance de frais.`,
    featuredImage: '/assets/step3_care.jpg',
    featuredImageAlt: 'Patient et soignant lors d\'un transport sanitaire sécurisé',
    categoryId: 'cat-pathologies',
    authorName: 'Dr. Équipe Conseil Clinigo',
    seoTitle: 'Transport Médical en ALD : Prise en Charge 100% & Démarches | Clinigo',
    metaDescription: 'Guide complet du transport sanitaire pour les patients en ALD : critères d\'exonération, dialyse, chimiothérapie et dispense d\'avance de frais.',
    focusKeyword: 'transport medical ald',
    secondaryKeywords: ['transport dialyse', 'vsl chimiotherapie', 'prise en charge 100% ald'],
    status: 'draft', // RÈGLE ABSOLUE : DRAFT POUR CONTRÔLE HUMAIN
    contentSensitivity: 'MEDICAL_INFO',
    publishedAt: null,
    createdAt: '2026-09-05T08:30:00Z',
    updatedAt: '2026-09-12T16:45:00Z',
    readingTime: 4,
    wordCount: 490,
    canonicalUrl: 'https://clinigo.fr/blog/transport-sanitaire-ald-affections-longue-duree',
    seoScore: 92,
    schemaType: 'Article',
    faq: [
      {
        question: 'L\'ALD donne-t-elle droit à un transport sanitaire pour voir mon généraliste ?',
        answer: 'Uniquement si la consultation concerne directement la pathologie prise en charge au titre de l\'ALD et que vous ne pouvez pas vous déplacer par vos propres moyens.',
      },
    ],
    sources: [
      {
        title: 'Ministère de la Santé - Affections de longue durée (ALD)',
        url: 'https://sante.gouv.fr/soins-et-maladies/maladies/maladies-chroniques-et-ald/',
        organization: 'Ministère du Travail, de la Santé et des Solidarités',
        checkedAt: '2026-09-05',
        verified: true,
      },
      {
        title: 'Ameli.fr - Affection de longue durée (ALD) : démarches et prise en charge',
        url: 'https://www.ameli.fr/assure/droits-demarches/maladie-accident-hospitalisation/affection-longue-duree-ald',
        organization: 'Caisse Nationale d\'Assurance Maladie (Ameli)',
        checkedAt: '2026-09-05',
        verified: true,
      },
    ],
    aiGenerated: false,
    aiReviewed: true,
  },
];

// Idées SEO initiales (en statut 'pending', règle #45)
export const INITIAL_IDEAS: SeoIdea[] = [
  {
    id: 'idea-1',
    topic: 'Séances de dialyse',
    keyword: 'transport dialyse',
    searchIntent: 'informationnelle',
    suggestedTitle: 'Comment réserver un transport sanitaire récurrent pour une séance de dialyse ?',
    priority: 'HIGH',
    status: 'pending',
    createdAt: '2026-09-16T10:00:00Z',
    updatedAt: '2026-09-16T10:00:00Z',
  },
  {
    id: 'idea-2',
    topic: 'Prescription Cerfa',
    keyword: 'bon de transport cerfa',
    searchIntent: 'informationnelle',
    suggestedTitle: 'Prescription Médicale de Transport : Comment remplir et valider le Cerfa 11574 ?',
    priority: 'HIGH',
    status: 'pending',
    createdAt: '2026-09-16T10:00:00Z',
    updatedAt: '2026-09-16T10:00:00Z',
  },
  {
    id: 'idea-3',
    topic: 'Sortie d\'hôpital',
    keyword: 'sortie hopital transporteur',
    searchIntent: 'commerciale',
    suggestedTitle: 'Sortie d\'hospitalisation : Qui contacte l\'ambulancier et quel délai prévoir ?',
    priority: 'HIGH',
    status: 'pending',
    createdAt: '2026-09-16T10:00:00Z',
    updatedAt: '2026-09-16T10:00:00Z',
  },
  {
    id: 'idea-4',
    topic: 'Ambulance allongée',
    keyword: 'ambulance allongée critères',
    searchIntent: 'informationnelle',
    suggestedTitle: 'Transport en ambulance allongée : Quels sont les critères médicaux d\'éligibilité ?',
    priority: 'MEDIUM',
    status: 'pending',
    createdAt: '2026-09-16T10:00:00Z',
    updatedAt: '2026-09-16T10:00:00Z',
  },
  {
    id: 'idea-5',
    topic: 'Taxi conventionné CPAM',
    keyword: 'taxi conventionné tiers payant',
    searchIntent: 'transactionnelle',
    suggestedTitle: 'Taxi conventionné CPAM : Comment bénéficier de la dispense totale d\'avance de frais ?',
    priority: 'HIGH',
    status: 'pending',
    createdAt: '2026-09-16T10:00:00Z',
    updatedAt: '2026-09-16T10:00:00Z',
  },
  {
    id: 'idea-6',
    topic: 'Accompagnant médical',
    keyword: 'remboursement accompagnant transport',
    searchIntent: 'informationnelle',
    suggestedTitle: 'Remboursement des frais de transport pour les proches aidants : Les règles en vigueur',
    priority: 'MEDIUM',
    status: 'pending',
    createdAt: '2026-09-16T10:00:00Z',
    updatedAt: '2026-09-16T10:00:00Z',
  },
  {
    id: 'idea-7',
    topic: 'Longue distance',
    keyword: 'accord préalable 150 km',
    searchIntent: 'informationnelle',
    suggestedTitle: 'Transport médicalisé de plus de 150 km : Obtenir l\'accord préalable de l\'Assurance Maladie',
    priority: 'HIGH',
    status: 'pending',
    createdAt: '2026-09-16T10:00:00Z',
    updatedAt: '2026-09-16T10:00:00Z',
  },
  {
    id: 'idea-8',
    topic: 'Oncologie',
    keyword: 'transport chimiothérapie',
    searchIntent: 'informationnelle',
    suggestedTitle: 'Chimiothérapie et radiothérapie : Organiser ses trajets quotidiens sans fatigue',
    priority: 'HIGH',
    status: 'pending',
    createdAt: '2026-09-16T10:00:00Z',
    updatedAt: '2026-09-16T10:00:00Z',
  },
];

// Mots-clés initiaux (Volumes = NULL, pas d'estimation artificielle)
export const INITIAL_KEYWORDS: SeoKeyword[] = [
  {
    id: 'kw-1',
    keyword: 'transport médical',
    searchIntent: 'informationnelle',
    category: 'Général',
    priority: 'HIGH',
    status: 'ACTIVE',
    searchVolume: null,
    competition: null,
    relatedKeywords: ['transport sanitaire', 'taxi vsl ambulance'],
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'kw-2',
    keyword: 'bon de transport',
    searchIntent: 'informationnelle',
    category: 'Remboursement',
    priority: 'HIGH',
    status: 'ACTIVE',
    searchVolume: null,
    competition: null,
    relatedKeywords: ['pmt cerfa transport', 'prescription medicale transport'],
    articleId: 'post-demo-2',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'kw-3',
    keyword: 'vsl ou ambulance',
    searchIntent: 'informationnelle',
    category: 'Véhicules',
    priority: 'HIGH',
    status: 'ACTIVE',
    searchVolume: null,
    competition: null,
    relatedKeywords: ['différence vsl ambulance', 'choisir transport sanitaire'],
    articleId: 'post-demo-1',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'kw-4',
    keyword: 'transport medical ald',
    searchIntent: 'informationnelle',
    category: 'Pathologies',
    priority: 'HIGH',
    status: 'ACTIVE',
    searchVolume: null,
    competition: null,
    relatedKeywords: ['prise en charge ald 100%', 'transport dialyse'],
    articleId: 'post-demo-3',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'kw-5',
    keyword: 'taxi conventionne cpam',
    searchIntent: 'commerciale',
    category: 'Véhicules',
    priority: 'HIGH',
    status: 'ACTIVE',
    searchVolume: null,
    competition: null,
    relatedKeywords: ['réserver taxi conventionné', 'taxi sanitaire agréé'],
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
];

export const INITIAL_SETTINGS: SeoSettings = {
  siteName: 'Clinigo',
  siteUrl: 'https://clinigo.fr',
  defaultAuthor: 'Équipe Rédactionnelle & Médicale Clinigo',
  defaultOgImage: '/assets/clinigo-logo.png',
  defaultMetaDescription: 'Guides et actualités officiels sur le transport sanitaire conventionné en France et dans les DOM. Ambulances, VSL et taxis conventionnés.',
  defaultLanguage: 'fr-FR',
};

/**
 * MOTEUR D'AUDIT DU SCORE SEO INTERNE (SUR 100)
 * Note : Score interne d'optimisation rédactionnelle, non présenté comme un score Google.
 */
export function calculateInternalSeoScore(post: Partial<BlogPost>): SeoAuditReport {
  const checks: SeoAuditCheckItem[] = [];
  const focus = (post.focusKeyword || '').trim().toLowerCase();
  const title = (post.title || '').trim();
  const metaDesc = (post.metaDescription || post.excerpt || '').trim();
  const content = (post.content || '').trim();
  const words = content.split(/\s+/).filter(Boolean).length;

  // 1. Longueur et présence du Titre (10 pts)
  const titleLen = title.length;
  const titleOk = titleLen >= 35 && titleLen <= 70;
  checks.push({
    id: 'title_length',
    label: 'Longueur du titre (35 à 70 caractères)',
    passed: titleOk,
    score: titleOk ? 10 : titleLen > 0 ? 5 : 0,
    maxScore: 10,
    feedback: titleOk
      ? `Titre parfaitement dimensionné (${titleLen} car.).`
      : titleLen === 0
      ? 'Veuillez saisir un titre d\'article.'
      : `Longueur actuelle : ${titleLen} car. Idéalement entre 35 et 70 caractères.`,
  });

  // 2. Mot-clé dans le Titre (10 pts)
  const kwInTitle = focus.length > 0 && title.toLowerCase().includes(focus);
  checks.push({
    id: 'keyword_in_title',
    label: 'Mot-clé principal dans le titre',
    passed: kwInTitle,
    score: kwInTitle ? 10 : 0,
    maxScore: 10,
    feedback: kwInTitle
      ? `Le mot-clé "${focus}" apparaît bien dans le titre.`
      : focus
      ? `Le mot-clé "${focus}" n'apparaît pas dans le titre.`
      : 'Aucun mot-clé principal défini.',
  });

  // 3. Mot-clé dans l\'introduction / extrait (10 pts)
  const intro = (post.excerpt || content.slice(0, 300)).toLowerCase();
  const kwInIntro = focus.length > 0 && intro.includes(focus);
  checks.push({
    id: 'keyword_in_intro',
    label: 'Mot-clé dans l\'introduction ou l\'extrait',
    passed: kwInIntro,
    score: kwInIntro ? 10 : 0,
    maxScore: 10,
    feedback: kwInIntro
      ? `Le mot-clé apparaît dès les premières lignes.`
      : 'Placez votre mot-clé cible dans les 200 premiers mots.',
  });

  // 4. Meta description optimale (10 pts)
  const descLen = metaDesc.length;
  const descOk = descLen >= 110 && descLen <= 165;
  checks.push({
    id: 'meta_description',
    label: 'Meta description rédigée (110 à 165 caractères)',
    passed: descOk,
    score: descOk ? 10 : descLen > 0 ? 5 : 0,
    maxScore: 10,
    feedback: descOk
      ? `Meta description optimale (${descLen} car.).`
      : descLen === 0
      ? 'Aucune meta description renseignée.'
      : `Longueur : ${descLen} car. Idéal entre 110 et 165 caractères.`,
  });

  // 5. Structure H2 / H3 (10 pts)
  const h2Count = (content.match(/^##\s+.+$/gm) || []).length;
  const h3Count = (content.match(/^###\s+.+$/gm) || []).length;
  const structureOk = h2Count >= 2;
  checks.push({
    id: 'heading_structure',
    label: 'Structure en sous-titres H2 et H3',
    passed: structureOk,
    score: structureOk ? 10 : h2Count === 1 ? 5 : 0,
    maxScore: 10,
    feedback: structureOk
      ? `Bonne structuration : ${h2Count} H2 et ${h3Count} H3 détectés.`
      : `Insérez au moins 2 sous-titres H2 (actuellement : ${h2Count}).`,
  });

  // 6. Richesse du contenu & longueur (10 pts)
  const wordsOk = words >= 400;
  checks.push({
    id: 'word_count',
    label: 'Volume de contenu suffisant (≥ 400 mots)',
    passed: wordsOk,
    score: words >= 600 ? 10 : words >= 350 ? 7 : words > 100 ? 4 : 0,
    maxScore: 10,
    feedback: words >= 600
      ? `Article riche et exhaustif (${words} mots).`
      : wordsOk
      ? `Volume correct (${words} mots). Visez 600+ mots pour un guide de référence.`
      : `Contenu court (${words} mots). Développez pour répondre aux intentions de recherche.`,
  });

  // 7. Image mise en avant & Balise ALT (10 pts)
  const hasImage = Boolean(post.featuredImage);
  const hasAlt = Boolean(post.featuredImageAlt && post.featuredImageAlt.trim().length > 5);
  const imageOk = hasImage && hasAlt;
  checks.push({
    id: 'featured_image',
    label: 'Image principale avec texte alternatif descriptif (ALT)',
    passed: imageOk,
    score: imageOk ? 10 : hasImage ? 5 : 0,
    maxScore: 10,
    feedback: imageOk
      ? 'Image et balise ALT descriptive valides.'
      : hasImage
      ? 'Image présente mais le texte alternatif ALT est manquant ou trop court.'
      : 'Ajoutez une image mise en avant.',
  });

  // 8. Liens internes (10 pts)
  const internalLinks = (content.match(/\[([^\]]+)\]\((?:\/|https?:\/\/clinigo\.fr)[^\)]+\)/g) || []).length;
  const linksOk = internalLinks >= 1;
  checks.push({
    id: 'internal_links',
    label: 'Maillage interne (liens vers d\'autres pages Clinigo)',
    passed: linksOk,
    score: internalLinks >= 2 ? 10 : internalLinks === 1 ? 6 : 0,
    maxScore: 10,
    feedback: internalLinks >= 2
      ? `Excellent maillage interne (${internalLinks} liens internes).`
      : internalLinks === 1
      ? '1 lien interne détecté. Ajoutez-en un second pour renforcer le maillage.'
      : 'Aucun lien interne vers Clinigo.fr détecté.',
  });

  // 9. Foire Aux Questions FAQ structurée (10 pts)
  const faqCount = (post.faq || []).length;
  const faqOk = faqCount >= 1;
  checks.push({
    id: 'faq_section',
    label: 'Section FAQ intégrée (éligible Schema FAQPage)',
    passed: faqOk,
    score: faqCount >= 2 ? 10 : faqCount === 1 ? 6 : 0,
    maxScore: 10,
    feedback: faqCount >= 2
      ? `${faqCount} questions/réponses FAQ configurées pour enrichir les résultats Google.`
      : faqCount === 1
      ? '1 question FAQ. Ajoutez une seconde question fréquente.'
      : 'Ajoutez une section FAQ pour répondre aux interrogations des patients.',
  });

  // 10. Sources et vérification réglementaire (10 pts)
  const sourcesCount = (post.sources || []).length;
  const verifiedSources = (post.sources || []).filter((s) => s.verified).length;
  const sourcesOk = sourcesCount > 0;
  checks.push({
    id: 'sources_attribution',
    label: 'Sources institutionnelles référencées (Ameli, ARS, etc.)',
    passed: sourcesOk,
    score: verifiedSources >= 1 ? 10 : sourcesCount > 0 ? 6 : 0,
    maxScore: 10,
    feedback: verifiedSources >= 1
      ? `${verifiedSources} source(s) officielle(s) vérifiée(s).`
      : sourcesCount > 0
      ? 'Sources présentes mais non cochées comme vérifiées.'
      : 'Ajoutez des sources officielles pour asseoir l\'autorité du contenu.',
  });

  const totalScore = checks.reduce((acc, c) => acc + c.score, 0);

  let level: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL' = 'CRITICAL';
  if (totalScore >= 85) level = 'EXCELLENT';
  else if (totalScore >= 70) level = 'GOOD';
  else if (totalScore >= 50) level = 'NEEDS_IMPROVEMENT';

  return {
    score: totalScore,
    checks,
    level,
  };
}

/**
 * SERVICE PRINCIPAL CLINIGO CONTENT HUB
 * Supabase est la source de vérité prioritaire. Fallback localStorage si non connecté.
 */
export class BlogService {
  // --------------------------------------------------------------------------
  // ARTICLES : LECTURE
  // --------------------------------------------------------------------------

  static async getAllPosts(includeUnpublished = false): Promise<BlogPost[]> {
    // 1. Supabase prioritaire
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            category:blog_categories(*)
          `)
          .order('created_at', { ascending: false });

        if (!includeUnpublished) {
          query = query
            .eq('status', 'published')
            .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(this.mapSupabasePost);
        }
      } catch (err) {
        console.warn('[BlogService] Erreur lecture Supabase, repli local :', err);
      }
    }

    // 2. Fallback LocalStorage
    return this.getLocalPosts(includeUnpublished);
  }

  static async getPostBySlug(slug: string, allowDraft = false): Promise<BlogPost | null> {
    const cleanSlug = slug.trim().toLowerCase();

    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            category:blog_categories(*)
          `)
          .eq('slug', cleanSlug);

        if (!allowDraft) {
          query = query
            .eq('status', 'published')
            .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`);
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          return this.mapSupabasePost(data);
        }
      } catch (err) {
        console.warn('[BlogService] Erreur lecture slug Supabase :', err);
      }
    }

    const localPosts = this.getLocalPosts(allowDraft);
    const found = localPosts.find((p) => p.slug === cleanSlug);
    if (found) {
      if (!allowDraft && found.status !== 'published') return null;
      return found;
    }
    return null;
  }

  static async getPostById(id: string): Promise<BlogPost | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select(`
            *,
            category:blog_categories(*)
          `)
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return this.mapSupabasePost(data);
        }
      } catch (err) {
        console.warn('[BlogService] Erreur lecture id Supabase :', err);
      }
    }

    const localPosts = this.getLocalPosts(true);
    return localPosts.find((p) => p.id === id) || null;
  }

  static async getPostsByCategory(categorySlug: string): Promise<BlogPost[]> {
    const all = await this.getAllPosts(false);
    return all.filter((p) => p.category?.slug === categorySlug);
  }

  static async getPostsByTag(tagSlug: string): Promise<BlogPost[]> {
    const all = await this.getAllPosts(false);
    return all.filter((p) => (p.tags || []).some((t) => t.slug === tagSlug));
  }

  static async getRelatedPosts(currentPost: BlogPost, limit = 3): Promise<BlogPost[]> {
    const all = await this.getAllPosts(false);
    return all
      .filter((p) => p.id !== currentPost.id)
      .filter((p) => {
        const sameCategory = p.categoryId === currentPost.categoryId;
        const sharedTags = (p.tags || []).some((t) =>
          (currentPost.tags || []).some((ct) => ct.id === t.id)
        );
        return sameCategory || sharedTags;
      })
      .slice(0, limit);
  }

  // --------------------------------------------------------------------------
  // ARTICLES : ÉCRITURE & MODIFICATIONS
  // --------------------------------------------------------------------------

  static async savePost(postData: Partial<BlogPost>, authorName = 'Équipe Rédactionnelle Clinigo'): Promise<BlogPost> {
    const now = new Date().toISOString();
    const isNew = !postData.id;
    const existing = !isNew ? await this.getPostById(postData.id!) : null;
    const merged = { ...(existing || {}), ...postData };

    const id = merged.id || `post-${Date.now()}`;
    const slug = (merged.slug || this.generateSlug(merged.title || 'article')).toLowerCase();

    // Gestion des redirections si le slug a changé
    if (existing && existing.slug !== slug && existing.status === 'published') {
      await this.addRedirect(existing.slug, slug);
    }

    const wordCount = (merged.content || '').split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 180));
    const audit = calculateInternalSeoScore(merged);

    const fullPost: BlogPost = {
      id,
      title: merged.title || 'Sans titre',
      slug,
      excerpt: merged.excerpt || '',
      content: merged.content || '',
      featuredImage: merged.featuredImage || merged.featured_image || '/assets/step2_dispatch.jpg',
      featuredImageAlt: merged.featuredImageAlt || merged.title || '',
      categoryId: merged.categoryId || merged.category_id,
      category_id: merged.categoryId || merged.category_id,
      authorName: merged.authorName || authorName,
      seoTitle: merged.seoTitle || merged.meta_title || merged.title || '',
      metaDescription: merged.metaDescription || merged.meta_description || merged.excerpt || '',
      focusKeyword: merged.focusKeyword || merged.target_keyword || '',
      target_keyword: merged.target_keyword || merged.focusKeyword || '',
      secondaryKeywords: merged.secondaryKeywords || [],
      status: merged.status || 'draft',
      contentSensitivity: merged.contentSensitivity || merged.content_sensitivity || 'GENERAL_INFO',
      content_sensitivity: merged.contentSensitivity || merged.content_sensitivity || 'GENERAL_INFO',
      publishedAt: merged.status === 'published' ? merged.publishedAt || merged.published_at || now : null,
      published_at: merged.status === 'published' ? merged.published_at || merged.publishedAt || now : null,
      createdAt: merged.createdAt || merged.created_at || now,
      created_at: merged.createdAt || merged.created_at || now,
      updatedAt: now,
      updated_at: now,
      readingTime,
      reading_time_minutes: readingTime,
      wordCount,
      canonicalUrl: merged.canonicalUrl || merged.canonical_url || `https://clinigo.fr/blog/${slug}`,
      canonical_url: merged.canonicalUrl || merged.canonical_url || `https://clinigo.fr/blog/${slug}`,
      seoScore: audit.score,
      seo_score: audit.score,
      schemaType: merged.schemaType || 'Article',
      faq: merged.faq || [],
      sources: merged.sources || [],
      aiGenerated: merged.aiGenerated || false,
      aiReviewed: merged.aiReviewed || false,
    };

    // 1. Sauvegarde Supabase prioritaire
    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = {
          id: fullPost.id.startsWith('post-') ? undefined : fullPost.id,
          title: fullPost.title,
          slug: fullPost.slug,
          excerpt: fullPost.excerpt,
          content: fullPost.content,
          featured_image: fullPost.featuredImage,
          featured_image_alt: fullPost.featuredImageAlt,
          category_id: fullPost.categoryId,
          author_name: fullPost.authorName,
          seo_title: fullPost.seoTitle,
          meta_description: fullPost.metaDescription,
          focus_keyword: fullPost.focusKeyword,
          secondary_keywords: fullPost.secondaryKeywords,
          status: fullPost.status,
          content_sensitivity: fullPost.contentSensitivity,
          published_at: fullPost.publishedAt,
          reading_time: fullPost.readingTime,
          word_count: fullPost.wordCount,
          canonical_url: fullPost.canonicalUrl,
          seo_score: fullPost.seoScore,
          schema_type: fullPost.schemaType,
          faq: fullPost.faq,
          sources: fullPost.sources,
          ai_generated: fullPost.aiGenerated,
          ai_reviewed: fullPost.aiReviewed,
          updated_at: now,
        };

        const { data, error } = await supabase
          .from('blog_posts')
          .upsert(payload)
          .select()
          .single();

        if (!error && data) {
          fullPost.id = data.id;
        }
      } catch (err) {
        console.warn('[BlogService] Erreur écriture Supabase, sauvegarde locale :', err);
      }
    }

    // 2. Synchronisation LocalStorage
    this.savePostLocally(fullPost);

    return fullPost;
  }

  static async updatePostStatus(id: string, status: PostStatus): Promise<BlogPost | null> {
    const post = await this.getPostById(id);
    if (!post) return null;

    const now = new Date().toISOString();
    post.status = status;
    post.updatedAt = now;
    if (status === 'published' && !post.publishedAt) {
      post.publishedAt = now;
    }

    return this.savePost(post);
  }

  static async duplicatePost(id: string): Promise<BlogPost | null> {
    const post = await this.getPostById(id);
    if (!post) return null;

    const newSlug = `${post.slug}-copie-${Date.now().toString().slice(-4)}`;
    const duplicateData: Partial<BlogPost> = {
      ...post,
      id: undefined,
      title: `${post.title} (Copie)`,
      slug: newSlug,
      status: 'draft', // Toujours dupliquer en brouillon
      publishedAt: null,
      createdAt: undefined,
      updatedAt: undefined,
    };

    return this.savePost(duplicateData);
  }

  static async deletePost(id: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('blog_posts').delete().eq('id', id);
      } catch (err) {
        console.warn('[BlogService] Erreur suppression Supabase :', err);
      }
    }

    const posts = this.getLocalPosts(true).filter((p) => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
      return true;
    } catch {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // CATÉGORIES & TAGS
  // --------------------------------------------------------------------------

  static async getCategories(): Promise<BlogCategory[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('blog_categories')
          .select('*')
          .order('name');
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return INITIAL_CATEGORIES;
  }

  static async saveCategory(cat: Partial<BlogCategory>): Promise<BlogCategory> {
    const now = new Date().toISOString();
    const fullCat: BlogCategory = {
      id: cat.id || `cat-${Date.now()}`,
      name: cat.name || '',
      slug: (cat.slug || this.generateSlug(cat.name || '')).toLowerCase(),
      description: cat.description || '',
      seoTitle: cat.seoTitle || `${cat.name} | Clinigo`,
      metaDescription: cat.metaDescription || cat.description || '',
      createdAt: cat.createdAt || now,
      updatedAt: now,
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('blog_categories').upsert({
          id: fullCat.id.startsWith('cat-') ? undefined : fullCat.id,
          name: fullCat.name,
          slug: fullCat.slug,
          description: fullCat.description,
          seo_title: fullCat.seoTitle,
          meta_description: fullCat.metaDescription,
          updated_at: now,
        });
      } catch (e) {}
    }

    const all = await this.getCategories();
    const updated = [fullCat, ...all.filter((c) => c.id !== fullCat.id)];
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));
    return fullCat;
  }

  static async getTags(): Promise<BlogTag[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('blog_tags').select('*').order('name');
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_TAGS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return INITIAL_TAGS;
  }

  static async saveTag(name: string): Promise<BlogTag> {
    const slug = this.generateSlug(name);
    const tag: BlogTag = {
      id: `tag-${Date.now()}`,
      name,
      slug,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('blog_tags').upsert({ name: tag.name, slug: tag.slug });
      } catch (e) {}
    }

    const all = await this.getTags();
    const updated = [tag, ...all.filter((t) => t.slug !== slug)];
    localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(updated));
    return tag;
  }

  // --------------------------------------------------------------------------
  // IDÉES SEO & MOTS-CLÉS
  // --------------------------------------------------------------------------

  static async getSeoIdeas(): Promise<SeoIdea[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('seo_ideas')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_IDEAS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return INITIAL_IDEAS;
  }

  static async updateIdeaStatus(id: string, status: SeoIdea['status']): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('seo_ideas').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      } catch (e) {}
    }
    const all = await this.getSeoIdeas();
    const idx = all.findIndex((i) => i.id === id);
    if (idx !== -1) {
      all[idx].status = status;
      all[idx].updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_IDEAS, JSON.stringify(all));
    }
  }

  static async addSeoIdea(idea: Omit<SeoIdea, 'id' | 'createdAt' | 'updatedAt'>): Promise<SeoIdea> {
    const full: SeoIdea = {
      ...idea,
      id: `idea-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('seo_ideas').insert({
          topic: full.topic,
          keyword: full.keyword,
          search_intent: full.searchIntent,
          suggested_title: full.suggestedTitle,
          priority: full.priority,
          status: full.status,
        });
      } catch (e) {}
    }

    const all = await this.getSeoIdeas();
    const updated = [full, ...all];
    localStorage.setItem(STORAGE_KEY_IDEAS, JSON.stringify(updated));
    return full;
  }

  static async getSeoKeywords(): Promise<SeoKeyword[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('seo_keywords')
          .select('*')
          .order('priority');
        if (!error && data && data.length > 0) return data;
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_KEYWORDS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return INITIAL_KEYWORDS;
  }

  // --------------------------------------------------------------------------
  // REDIRECTIONS 301
  // --------------------------------------------------------------------------

  static async addRedirect(oldSlug: string, newSlug: string): Promise<void> {
    if (oldSlug === newSlug) return;
    const redirect: BlogRedirect = {
      id: `redir-${Date.now()}`,
      oldSlug,
      newSlug,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('blog_redirects').upsert({
          old_slug: redirect.oldSlug,
          new_slug: redirect.newSlug,
        });
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_REDIRECTS);
      const list: BlogRedirect[] = raw ? JSON.parse(raw) : [];
      // Éviter les boucles
      const filtered = list.filter((r) => r.oldSlug !== oldSlug);
      filtered.push(redirect);
      localStorage.setItem(STORAGE_KEY_REDIRECTS, JSON.stringify(filtered));
    } catch (e) {}
  }

  static async checkRedirect(slug: string): Promise<string | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase
          .from('blog_redirects')
          .select('new_slug')
          .eq('old_slug', slug)
          .maybeSingle();
        if (data) return data.new_slug;
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_REDIRECTS);
      if (raw) {
        const list: BlogRedirect[] = JSON.parse(raw);
        const match = list.find((r) => r.oldSlug === slug || r.old_slug === slug);
        if (match) return match.newSlug || match.new_slug || null;
      }
    } catch (e) {}
    return null;
  }

  // --------------------------------------------------------------------------
  // PROGRAMMATION & RUNNER IDEMPOTENT
  // --------------------------------------------------------------------------

  static async publishScheduledPosts(): Promise<BlogPost[]> {
    const all = await this.getAllPosts(true);
    const now = new Date();
    const newlyPublished: BlogPost[] = [];

    for (const post of all) {
      if (post.status === 'scheduled' && post.publishedAt) {
        const pubDate = new Date(post.publishedAt);
        if (pubDate <= now) {
          const updated = await this.updatePostStatus(post.id, 'published');
          if (updated) newlyPublished.push(updated);
        }
      }
    }

    return newlyPublished;
  }

  // --------------------------------------------------------------------------
  // MAILLAGE INTERNE INTELLIGENT
  // --------------------------------------------------------------------------

  static async suggestInternalLinks(currentContent: string, currentPostId?: string): Promise<{ title: string; slug: string; url: string }[]> {
    const allPosts = await this.getAllPosts(false); // Articles publiés uniquement
    const suggestions: { title: string; slug: string; url: string }[] = [];

    const lowerContent = currentContent.toLowerCase();

    for (const post of allPosts) {
      if (post.id === currentPostId) continue;

      const words = [post.focusKeyword, post.title]
        .filter(Boolean)
        .map((w) => w!.toLowerCase());

      const matches = words.some((w) => w.length > 4 && lowerContent.includes(w));
      const alreadyLinked = currentContent.includes(post.slug);

      if (matches && !alreadyLinked) {
        suggestions.push({
          title: post.title,
          slug: post.slug,
          url: `/blog/${post.slug}`,
        });
      }
    }

    return suggestions.slice(0, 5);
  }

  // --------------------------------------------------------------------------
  // STATISTIQUES DASHBOARD
  // --------------------------------------------------------------------------

  static async getOverviewStats() {
    const all = await this.getAllPosts(true);
    const published = all.filter((p) => p.status === 'published');
    const drafts = all.filter((p) => p.status === 'draft');
    const scheduled = all.filter((p) => p.status === 'scheduled');
    const reviews = all.filter((p) => p.status === 'review');

    const totalWords = all.reduce((acc, p) => acc + (p.wordCount || 0), 0);
    const avgSeo = all.length > 0 ? Math.round(all.reduce((acc, p) => acc + (p.seoScore || 0), 0) / all.length) : 0;

    // Détection Content Decay (articles modifiés il y a plus de 6 mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const decayArticles = published.filter((p) => new Date(p.updatedAt) < sixMonthsAgo);

    // Alertes qualité
    const missingMeta = all.filter((p) => !p.metaDescription || p.metaDescription.length < 50);
    const missingImage = all.filter((p) => !p.featuredImage);
    const lowSeo = all.filter((p) => (p.seoScore || p.seo_score || 0) < 70);

    return {
      totalPosts: all.length,
      publishedCount: published.length,
      draftsCount: drafts.length,
      scheduledCount: scheduled.length,
      reviewsCount: reviews.length,
      totalWords,
      avgSeo,
      decayArticles,
      missingMeta,
      missingImage,
      lowSeo,
      recentPosts: all.slice(0, 5),
    };
  }

  // --------------------------------------------------------------------------
  // LOGS D'AUDIT IA
  // --------------------------------------------------------------------------

  static async logAiGeneration(log: Omit<AiGenerationLog, 'id' | 'createdAt'>): Promise<void> {
    const fullLog: AiGenerationLog = {
      ...log,
      id: `ai-log-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('ai_generation_logs').insert({
          operation: fullLog.operation,
          article_id: fullLog.articleId,
          model: fullLog.model,
          tokens_input: fullLog.tokensInput,
          tokens_output: fullLog.tokensOutput,
          duration_ms: fullLog.durationMs,
          status: fullLog.status,
          error: fullLog.error,
        });
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_AI_LOGS);
      const list: AiGenerationLog[] = raw ? JSON.parse(raw) : [];
      list.unshift(fullLog);
      localStorage.setItem(STORAGE_KEY_AI_LOGS, JSON.stringify(list.slice(0, 100)));
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // UTILITAIRES PRIVÉS
  // --------------------------------------------------------------------------

  private static getLocalPosts(includeUnpublished = false): BlogPost[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_POSTS);
      let posts: BlogPost[] = raw ? JSON.parse(raw) : INITIAL_POSTS;
      if (!includeUnpublished) {
        posts = posts.filter((p) => p.status === 'published');
      }
      return posts;
    } catch {
      return includeUnpublished ? INITIAL_POSTS : [];
    }
  }

  private static savePostLocally(post: BlogPost): void {
    try {
      const posts = this.getLocalPosts(true);
      const idx = posts.findIndex((p) => p.id === post.id);
      if (idx !== -1) {
        posts[idx] = post;
      } else {
        posts.unshift(post);
      }
      localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
    } catch (e) {
      console.error('Erreur sauvegarde locale du post', e);
    }
  }

  private static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 80);
  }

  private static mapSupabasePost(row: any): BlogPost {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      featuredImage: row.featured_image,
      featuredImageAlt: row.featured_image_alt,
      categoryId: row.category_id,
      category: row.category,
      authorId: row.author_id,
      authorName: row.author_name || 'Équipe Rédactionnelle Clinigo',
      seoTitle: row.seo_title,
      metaDescription: row.meta_description,
      focusKeyword: row.focus_keyword,
      secondaryKeywords: row.secondary_keywords || [],
      status: row.status,
      contentSensitivity: row.content_sensitivity || 'GENERAL_INFO',
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      updated_at: row.updated_at,
      readingTime: row.reading_time || 5,
      reading_time_minutes: row.reading_time || 5,
      wordCount: row.word_count || 0,
      canonicalUrl: row.canonical_url || `https://clinigo.fr/blog/${row.slug}`,
      canonical_url: row.canonical_url || `https://clinigo.fr/blog/${row.slug}`,
      seoScore: row.seo_score || 0,
      seo_score: row.seo_score || 0,
      schemaType: row.schema_type || 'Article',
      faq: row.faq || [],
      sources: row.sources || [],
      aiGenerated: row.ai_generated,
      aiReviewed: row.ai_reviewed,
      featured_image: row.featured_image,
      category_id: row.category_id,
      meta_title: row.meta_title || row.seo_title,
      metaTitle: row.meta_title || row.seo_title,
      meta_description: row.meta_description,
      target_keyword: row.target_keyword || row.focus_keyword,
      targetKeyword: row.target_keyword || row.focus_keyword,
      content_sensitivity: row.content_sensitivity || 'GENERAL_INFO',
      published_at: row.published_at,
      created_at: row.created_at,
    };
  }

  // --- Convenience aliases for Admin & Public pages ---

  static async getPosts(options?: { status?: string; categoryId?: string; tagId?: string }): Promise<BlogPost[]> {
    const all = await this.getAllPosts(true);
    let filtered = all;
    if (options?.status && options.status !== 'all') {
      filtered = filtered.filter((p) => p.status === options.status);
    }
    if (options?.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === options.categoryId || p.category_id === options.categoryId);
    }
    if (options?.tagId) {
      filtered = filtered.filter((p) => p.tags?.some((t) => t.id === options.tagId));
    }
    return filtered;
  }

  static async createPost(postData: Partial<BlogPost>): Promise<BlogPost> {
    return this.savePost(postData);
  }

  static async updatePost(id: string, postData: Partial<BlogPost>): Promise<BlogPost> {
    return this.savePost({ id, ...postData });
  }

  static async syncPostTags(postId: string, tagIds: string[]): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('blog_post_tags').delete().eq('post_id', postId);
        if (tagIds.length > 0) {
          const inserts = tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId }));
          await supabase.from('blog_post_tags').insert(inserts);
        }
      } catch (e) {}
    }
  }

  static async getIdeas(): Promise<SeoIdea[]> {
    return this.getSeoIdeas();
  }

  static async createIdea(idea: any): Promise<SeoIdea> {
    return this.addSeoIdea(idea);
  }

  static async updateIdea(id: string, updates: Partial<SeoIdea>): Promise<void> {
    if (updates.status) {
      await this.updateIdeaStatus(id, updates.status);
    }
  }

  static async getKeywords(): Promise<SeoKeyword[]> {
    return this.getSeoKeywords();
  }

  static async createKeyword(kw: any): Promise<SeoKeyword> {
    const newKw: SeoKeyword = {
      id: `kw-${Date.now()}`,
      keyword: kw.keyword,
      searchIntent: kw.intent || kw.searchIntent || 'informationnelle',
      intent: kw.intent,
      category: kw.category,
      priority: kw.priority || 'MEDIUM',
      status: 'active',
      searchVolume: kw.search_volume ?? null,
      search_volume: kw.search_volume ?? null,
      competition: kw.competition ?? null,
      target_audience: kw.target_audience,
      relatedKeywords: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('seo_keywords').insert({
          keyword: newKw.keyword,
          search_volume: newKw.search_volume,
          competition: newKw.competition,
          target_audience: newKw.target_audience,
          intent: newKw.intent,
        });
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem('clinigo_seo_keywords_v1');
      const list: SeoKeyword[] = raw ? JSON.parse(raw) : [];
      list.push(newKw);
      localStorage.setItem('clinigo_seo_keywords_v1', JSON.stringify(list));
    } catch (e) {}

    return newKw;
  }

  static async createCategory(cat: Partial<BlogCategory>): Promise<BlogCategory> {
    return this.saveCategory(cat);
  }

  static async createTag(tag: { name: string; slug: string }): Promise<BlogTag> {
    return this.saveTag(tag.name);
  }

  static async getRedirects(): Promise<BlogRedirect[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase.from('blog_redirects').select('*');
        if (data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            oldSlug: r.old_slug,
            old_slug: r.old_slug,
            newSlug: r.new_slug,
            new_slug: r.new_slug,
            sourcePath: r.source_path || `/blog/${r.old_slug}`,
            source_path: r.source_path || `/blog/${r.old_slug}`,
            targetPath: r.target_path || `/blog/${r.new_slug}`,
            target_path: r.target_path || `/blog/${r.new_slug}`,
            statusCode: r.status_code || 301,
            status_code: r.status_code || 301,
            createdAt: r.created_at,
          }));
        }
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_REDIRECTS);
      if (raw) {
        const list = JSON.parse(raw);
        return list.map((r: any) => ({
          ...r,
          source_path: r.sourcePath || r.source_path || `/blog/${r.oldSlug || r.old_slug}`,
          target_path: r.targetPath || r.target_path || `/blog/${r.newSlug || r.new_slug}`,
          status_code: r.statusCode || r.status_code || 301,
        }));
      }
    } catch (e) {}
    return [];
  }

  static async createRedirect(sourcePath: string, targetPath: string): Promise<void> {
    const cleanOld = sourcePath.replace(/^\/blog\//, '');
    const cleanNew = targetPath.replace(/^\/blog\//, '');
    await this.addRedirect(cleanOld, cleanNew);
  }

  static async getRedirect(path: string): Promise<BlogRedirect | null> {
    const slug = path.replace(/^\/blog\//, '');
    const targetSlug = await this.checkRedirect(slug);
    if (targetSlug) {
      return {
        id: `redir-${Date.now()}`,
        oldSlug: slug,
        newSlug: targetSlug,
        sourcePath: path,
        targetPath: `/blog/${targetSlug}`,
        statusCode: 301,
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }

  static calculateSeoScore(post: Partial<BlogPost>): number {
    return calculateInternalSeoScore(post).score;
  }

  static async getSettings(): Promise<SeoSettings> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase.from('seo_settings').select('*').limit(1).maybeSingle();
        if (data) {
          return {
            id: data.id,
            siteName: data.site_name,
            site_name: data.site_name,
            siteUrl: data.site_url,
            canonical_base_url: data.canonical_base_url || 'https://clinigo.fr',
            title_template: data.title_template || '%s | Clinigo',
            defaultMetaDescription: data.default_meta_description,
            default_meta_description: data.default_meta_description,
            defaultOgImage: data.default_og_image,
            default_og_image: data.default_og_image,
            auto_sitemap_ping: data.auto_sitemap_ping,
          };
        }
      } catch (e) {}
    }
    return {
      site_name: 'Clinigo',
      canonical_base_url: 'https://clinigo.fr',
      title_template: '%s | Clinigo',
      default_meta_description: 'Guides et conseils sur le transport médical et les droits CPAM.',
      default_og_image: '/assets/medictrans_hero_discover.jpg',
      auto_sitemap_ping: true,
    };
  }

  static async updateSettings(settings: SeoSettings): Promise<SeoSettings> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('seo_settings').upsert({
          id: settings.id || 'global',
          site_name: settings.site_name || settings.siteName,
          canonical_base_url: settings.canonical_base_url || settings.canonicalBaseUrl,
          title_template: settings.title_template || settings.titleTemplate,
          default_meta_description: settings.default_meta_description || settings.defaultMetaDescription,
          default_og_image: settings.default_og_image || settings.defaultOgImage,
          auto_sitemap_ping: settings.auto_sitemap_ping,
        });
      } catch (e) {}
    }
    return settings;
  }
}

export const blogService = BlogService;

