/**
 * Base de connaissances Médic'Trans Martinique 972 — Niveau 2
 * Utilisée côté client (Copilote de réservation, suggestions, FAQ) et côté serveur (RAG & Validation)
 */

export interface KnowledgeDoc {
  id: string;
  category: 'transports' | 'documents' | 'cpam' | 'reservation' | 'faq' | 'etablissements' | 'securite' | 'guidage' | 'verification';
  title: string;
  keywords: string[];
  content: string;
}

export const KNOWLEDGE_BASE: KnowledgeDoc[] = [
  {
    id: 'presentation-plateforme',
    category: 'reservation',
    title: "Présentation de la plateforme Médic'Trans Martinique",
    keywords: ["medictrans", "qui êtes-vous", "plateforme", "service", "martinique", "fonctionnement"],
    content: `Médic'Trans Martinique 972 est la plateforme numérique de régulation et de réservation de transports sanitaires en Martinique.
Elle met en relation directe les patients, leurs proches, les établissements de santé (CHU de Martinique, cliniques, centres de dialyse) et les sociétés de transport sanitaire agréées par l'ARS Martinique (ambulances, véhicules sanitaires légers VSL, et taxis conventionnés CPAM).
Le service est accessible 24h/24 et 7j/7 pour la saisie et la régulation des transports.`
  },
  {
    id: 'modes-transport-comparatif',
    category: 'transports',
    title: "Comparatif & Critères d'orientation : Taxi conventionné vs VSL vs Ambulance",
    keywords: ["ambulance", "vsl", "taxi conventionné", "différence", "véhicule", "mode", "choisir", "brancard", "assis", "allongé", "critères"],
    content: `Le choix du mode de transport est strictement médical et dépend de l'autonomie du patient :
1. Taxi Conventionné CPAM :
   • Profil : Patient entièrement autonome pouvant se déplacer et voyager assis sans aide physique ni assistance continue.
   • Équipement : Véhicule standard conventionné avec chauffeur agréé CPAM.
   • Exemples : Consultations spécialisées de routine, séances de radiothérapie simples, examens biologiques.
2. VSL (Véhicule Sanitaire Léger) :
   • Profil : Patient pouvant voyager assis mais nécessitant une aide technique ou humaine à la marche, ou un accompagnement soignant / brancardier lors de l'accès au véhicule.
   • Équipement : Véhicule sanitaire adapté, désinfecté selon les normes sanitaires ARS, trousse de secours de bord.
   • Exemples : Retour d'hospitalisation de jour, patient sous perfusion autonome, personne âgée nécessitant un bras d'appui.
3. Ambulance :
   • Profil : Patient devant impérativement voyager en position allongée ou demi-assise, nécessitant un brancardage ou portage, une oxygénothérapie continue ou une surveillance constante par des ambulanciers diplômés (DEA/CCA).
   • Équipement : Matériel paramédical complet (brancard, oxygène, tensiomètre, saturomètre, DEA, aspirateur de mucosités).
   • Exemples : Sorties de réanimation ou chirurgie lourde, fractures, transferts inter-hospitaliers (CHUM, Trinité, Mangot-Vulcin).

⚠️ Règle légale CPAM : Le médecin est le seul habilité à prescrire le mode adapté sur le volet 1 de la PMT (Cerfa S3138). En cas de discordance entre le mode prescrit et le véhicule utilisé, la CPAM peut refuser le remboursement.`
  },
  {
    id: 'etapes-reservation',
    category: 'guidage',
    title: "Les 5 étapes pour commander un transport sanitaire sur Médic'Trans",
    keywords: ["étapes", "comment réserver", "processus", "déroulement", "étapes réservation", "guide"],
    content: `Voici le déroulement pas-à-pas d'une commande sur Médic'Trans 972 :
• Étape 1 — Sélection du mode : Choisissez Taxi conventionné, VSL ou Ambulance en vous référant exactement à la case cochée par votre médecin sur la PMT.
• Étape 2 — Trajet & Horaires : Indiquez l'adresse de prise en charge (domicile ou service), l'établissement de soins de destination, la date et l'heure du rendez-vous médical.
• Étape 3 — Informations Patient & PMT : Renseignez l'identité du patient, son numéro NIR (15 chiffres de sécurité sociale) et joignez la PMT (scan/photo ou option bon papier remis au chauffeur).
• Étape 4 — Choix du transporteur : Choisissez soit une société précise de votre choix (délai exclusif de 24h) soit la diffusion publique immédiate (pot commun pour le premier transporteur disponible).
• Étape 5 — Confirmation & Suivi : Validation immédiate avec numéro de référence (MT-972-XXXX). Vous recevez un SMS/WhatsApp et pouvez suivre l'attribution en direct dans l'onglet « Mes Demandes ».`
  },
  {
    id: 'aide-remplissage-formulaire',
    category: 'guidage',
    title: "Aide au remplissage des champs du formulaire (/reserver)",
    keywords: ["remplir", "formulaire", "champ", "case", "aide formulaire", "guider", "saisie"],
    content: `Comment remplir chaque champ de la réservation :
• « Mode de transport » : Cochez l'icône correspondant au volet 1 de votre ordonnance de transport.
• « Lieu de départ » : Saisissez l'adresse complète (numéro, rue, commune de Martinique) ou le nom de la résidence.
• « Établissement de destination » : Sélectionnez votre pôle de soins (ex: CHU Pierre Zobda-Quitman, MFME, Clinique Sainte-Marie, Centre de dialyse).
• « Heure de prise en charge » : Attention aux embouteillages du matin en Martinique ! Prévoyez 45 à 60 min de marge sur l'axe Lamentin/Fort-de-France.
• « Numéro de Sécurité Sociale (NIR) » : Les 13 chiffres de votre carte Vitale suivis des 2 chiffres de clé (ex: 1 85 06 97 212 345 67).
• « Prescription Médicale (PMT) » : Vous pouvez téléverser un PDF ou une photo nette du Cerfa S3138, ou cocher « PMT Papier » si vous remettez le volet physique au chauffeur.`
  },
  {
    id: 'verification-nir',
    category: 'verification',
    title: "Audit & Vérification de validité du Numéro de Sécurité Sociale (NIR)",
    keywords: ["nir", "sécurité sociale", "carte vitale", "vérifier", "chiffres", "clé", "formule", "contrôle"],
    content: `Structure d'un Numéro de Sécurité Sociale (NIR) français :
• 1er chiffre : Sexe (1 = Homme, 2 = Femme).
• Chiffres 2-3 : Deux derniers chiffres de l'année de naissance.
• Chiffres 4-5 : Mois de naissance (01 à 12).
• Chiffres 6-7 : Département de naissance (ex: 97 pour l'Outre-Mer).
• Chiffre 8 : Complément départemental (ex: 2 pour la Martinique 972).
• Chiffres 9-11 : Numéro d'ordre de la commune de naissance.
• Chiffres 12-13 : Numéro d'ordre de l'acte à l'état civil.
• Chiffres 14-15 (Clé de contrôle) : La clé officielle est calculée par la formule mathématique : Clé = 97 - (Numéro à 13 chiffres % 97).

Eva (votre assistante d'aide à la réservation) peut vérifier instantanément la conformité de votre clé NIR sans jamais enregistrer votre numéro personnel.`
  },
  {
    id: 'verification-horaires-trafic',
    category: 'verification',
    title: "Audit des Horaires & Trafic Routier en Martinique",
    keywords: ["horaire", "embouteillage", "bouchon", "retard", "temps de trajet", "rocade", "lamentin", "marge"],
    content: `Recommandations de marge horaire selon les axes de Martinique :
• Axe Sud vers Fort-de-France (Rivière-Salée, Ducos, Lamentin -> CHUM) : Entre 06h30 et 08h45, comptez minimum 45 à 75 minutes de temps de trajet en raison des ralentissements fréquents à l'échangeur de Carrère et à la Lézarde.
• Axe Nord Caraïbe / Nord Atlantique vers Fort-de-France (Case-Pilote, Schoelcher ou Trinité, Robert) : Prévoyez 30 à 45 minutes de marge supplémentaire.
• Pour un rendez-vous hospitalier à 09h00 au CHUM Zobda-Quitman, votre heure de prise en charge doit être fixée au plus tard à 07h45 (départ Lamentin) ou 07h15 (départ Sud ou Nord).`
  },
  {
    id: 'checklist-pmt-conformite',
    category: 'documents',
    title: "Checklist de conformité de la Prescription Médicale de Transport (Cerfa S3138)",
    keywords: ["checklist", "conformité", "pmt", "refus cpam", "bon de transport", "cerfa s3138", "obligatoire"],
    content: `Pour qu'un bon de transport soit accepté à 100% sans rejet par la CPAM de Martinique, vérifiez les 5 points suivants :
1. ✅ Date de prescription : Le bon doit impérativement être daté et signé par le médecin AVANT la date de réalisation du transport (sauf urgence médicale).
2. ✅ Identité du patient : Nom, prénom et numéro NIR à 15 chiffres parfaitement lisibles.
3. ✅ Mode de transport coché : Le praticien doit avoir coché explicitement Taxi, VSL ou Ambulance (les bons vierges sans case cochée sont rejetés).
4. ✅ Établissement de soins et motif : L'adresse de consultation/hospitalisation et le motif (ALD, dialyse, chimio, hospitalisation) doivent être renseignés.
5. ✅ Signature & Tampon : Le cachet avec le numéro RPPS ou ADELI du praticien prescripteur doit être présent.`
  },
  {
    id: 'faq-avancee',
    category: 'faq',
    title: "FAQ Approfondie : Accompagnateur, Trajets > 150 km, Dialyse & Annulations",
    keywords: ["faq", "accompagnateur", "150 km", "entente préalable", "dialyse", "série", "enfant", "annuler"],
    content: `Réponses aux questions fréquemment posées :
• Présence d'un accompagnateur : Autorisée et prise en charge pour les mineurs de moins de 16 ans ou les patients dont l'état nécessite l'assistance d'une tierce personne (mention « Présence d'un accompagnateur nécessaire » sur la PMT).
• Transports de plus de 150 km ou en série (+ de 4 trajets de plus de 50 km sur 2 mois) : Nécessitent une demande d'entente préalable à envoyer au médecin conseil de la CPAM au moins 15 jours avant.
• Séances récurrentes (Dialyse, Chimiothérapie) : Vous pouvez programmer vos dates récurrentes en un clic sur le formulaire (bouton « Préréglage Dialyse »).
• En cas d'annulation : Annulation gratuite directement depuis « Mes Demandes » (/suivi). Le transporteur affecté est libéré immédiatement pour d'autres patients.`
  }
];

export function searchKnowledge(query: string): KnowledgeDoc[] {
  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const terms = normalizedQuery.split(/\s+/).filter(t => t.length > 2);

  if (terms.length === 0) return KNOWLEDGE_BASE.slice(0, 4);

  const scored = KNOWLEDGE_BASE.map(item => {
    let score = 0;
    const itemText = (item.title + " " + item.content + " " + item.keywords.join(" "))
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    for (const term of terms) {
      if (item.keywords.some(k => k.includes(term))) score += 6;
      if (item.title.toLowerCase().includes(term)) score += 5;
      if (itemText.includes(term)) score += 1.5;
    }
    return { item, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item);
}
