/**
 * Base de connaissances structurée pour l'assistant IA Médic'Trans 972
 * Utilisée pour l'injection de contexte (RAG) et les réponses spécialisées.
 */

export interface KnowledgeItem {
  id: string;
  category: 'transports' | 'documents' | 'cpam' | 'reservation' | 'faq' | 'etablissements' | 'securite';
  title: string;
  keywords: string[];
  content: string;
}

export const KNOWLEDGE_BASE: KnowledgeItem[] = [
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
    id: 'modes-transport',
    category: 'transports',
    title: "Modes de transport sanitaire (Ambulance, VSL, Taxi conventionné)",
    keywords: ["ambulance", "vsl", "taxi conventionné", "différence", "véhicule", "mode", "choisir", "brancard", "assis", "allongé"],
    content: `Il existe trois modes de transport sanitaire prescrits selon l'état d'autonomie et le besoin médical du patient :
1. Taxi Conventionné CPAM : Pour les patients autonomes pouvant voyager en position assise, sans besoin d'assistance médicale continue ni brancardage (ex. consultations médicales simples, examens réguliers).
2. VSL (Véhicule Sanitaire Léger) : Pour les patients nécessitant une aide technique ou humaine à la marche, ou un accompagnement soignant lors du déplacement, voyageant assis.
3. Ambulance : Pour les patients devant impérativement voyager en position allongée ou demi-assise, nécessitant un brancardage, un portage ou une surveillance paramédicale continue (avec équipage d'ambulanciers diplômés DEA / CCA).

Le mode de transport doit obligatoirement être spécifié par le médecin sur la Prescription Médicale de Transport (Cerfa S3138).`
  },
  {
    id: 'documents-requis-pmt',
    category: 'documents',
    title: "Documents obligatoires : Prescription Médicale de Transport (PMT)",
    keywords: ["pmt", "cerfa", "prescription", "bon de transport", "document", "ordonnance", "s3138", "fournir"],
    content: `Pour bénéficier de la prise en charge d'un transport médicalisé, le patient doit obligatoirement fournir :
1. La Prescription Médicale de Transport (PMT - Cerfa n° 11574 / S3138) établie et signée par le médecin traitant ou hospitalier AVANT le trajet (sauf cas d'urgence médicale avérée).
2. L'Attestation de droits à jour de la Sécurité Sociale (CPAM de Martinique) ou Carte Vitale.
3. Le Numéro d'Inscription au Répertoire (NIR / Numéro de Sécurité Sociale à 13 chiffres + 2 chiffres de clé).
4. Le cas échéant : la notification de prise en charge à 100% au titre d'une Affection de Longue Durée (ALD), d'un Accident du Travail (AT/MP), ou de la Complémentaire Santé Solidaire (CSS).`
  },
  {
    id: 'prise-en-charge-cpam',
    category: 'cpam',
    title: "Prise en charge et remboursement CPAM de Martinique",
    keywords: ["cpam", "remboursement", "tiers payant", "ald", "100%", "prise en charge", "prix", "gratuit", "payer"],
    content: `La prise en charge par la CPAM de Martinique :
- Prise en charge à 100% (Tiers-Payant intégral sans avance de frais) : pour les patients en ALD (Affection de Longue Durée en lien avec le transport), les transports liés à une hospitalisation (entrée/sortie), les accidents du travail / maladies professionnelles, et les bénéficiaires de la CSS.
- Taux standard (65% CPAM / 35% Mutuelle complémentaire) : si le transport ne relève pas d'une exonération du ticket modérateur.
Médic'Trans applique le tiers-payant subrogatoire avec les transporteurs conventionnés : lorsque la PMT et les droits sont en règle, le patient n'a aucune avance financière à faire pour les situations couvertes à 100%.
Pour les trajets de plus de 150 km ou les transports en série (au moins 4 transports de plus de 50 km sur 2 mois), un accord préalable de la CPAM est nécessaire.`
  },
  {
    id: 'demande-directe-24h',
    category: 'reservation',
    title: "Choix direct d'un transporteur et délai d'attribution de 24h00",
    keywords: ["choix transporteur", "demande directe", "24h", "délai", "pot commun", "bourse", "orange", "répondre"],
    content: `Sur Médic'Trans, le client peut :
- Soit diffuser sa demande à l'ensemble des transporteurs conventionnés (Bourse publique / Pot commun — premier transporteur disponible).
- Soit adresser directement sa demande à une société de transport sanitaire précise via le menu déroulant de commande.
En cas de demande directe nominative :
1. La société désignée dispose d'un délai exclusif de 24h00 pour accepter la mission.
2. La demande s'affiche en orange vif haute visibilité avec un compte à rebours en temps réel sur le portail du transporteur ciblé.
3. Si le transporteur ne répond pas dans les 24h00 ou s'il décline la demande, celle-ci bascule automatiquement dans le pot commun de la bourse publique pour une attribution immédiate par un autre transporteur.`
  },
  {
    id: 'modifications-annulations',
    category: 'reservation',
    title: "Modifications, Suivi et Annulations de transport",
    keywords: ["annuler", "modifier", "suivi", "retard", "changer heure", "horaire", "référence"],
    content: `Le suivi d'une réservation s'effectue via l'onglet « Mes Demandes » (/suivi) grâce au numéro de référence de commande (ex: MT-972-XXXX).
- Annulation : Possible directement en ligne depuis la fiche de suivi en renseignant le motif d'annulation. Si la course a déjà été acceptée par un transporteur, celui-ci est prévenu immédiatement.
- Renouvellement : Un trajet récurrent ou retour peut être reprogrammé en un clic depuis le suivi historique.
- En cas de modification d'horaire de dernière minute, il est recommandé de contacter directement le transporteur affecté ou la régulation.`
  },
  {
    id: 'etablissements-sante-martinique',
    category: 'etablissements',
    title: "Établissements hospitaliers et centres de soins en Martinique",
    keywords: ["chum", "ch de trinité", "clinique", "hopital", "mangot vulcin", "zobda", "dialyse", "marin"],
    content: `Médic'Trans dessert la totalité des 34 communes de Martinique et l'ensemble des pôles de soins du territoire :
- Centre Hospitalier Universitaire de Martinique (CHUM) — Pôle Pierre Zobda-Quitman (Fort-de-France)
- Maison de la Femme, de la Mère et de l'Enfant (MFME - Fort-de-France)
- Hôpital Mangot-Vulcin (Le Lamentin)
- Hôpital Louis-Daniel Beauperthuy (Pointe-de-Géry)
- Centre Hospitalier de Trinité (Nord Atlantique)
- Centre Hospitalier du Marin (Sud Martinique)
- Clinique Saint-Paul et Clinique Sainte-Marie (Schoelcher)
- Centres de dialyse AIDER, Calydial et cabinets de rééducation.`
  },
  {
    id: 'securite-urgences-vitales',
    category: 'securite',
    title: "Protocole d'urgence vitale et limites de l'assistant",
    keywords: ["urgence", "samu", "15", "112", "18", "pompiers", "infarctus", "avc", "détresse", "étouffement", "coma", "grave"],
    content: `RÈGLE ABSOLUE DE SÉCURITÉ :
Médic'Trans est une plateforme de transport sanitaire programmé ou régulé, elle ne se substitue JAMAIS aux services d'urgence vitale.
En cas de détresse respiratoire, douleur thoracique aiguë, suspicion d'AVC (bras tombant, visage asymétrique, troubles de la parole), hémorragie grave ou perte de connaissance :
IL FAUT APPELER IMMÉDIATEMENT LE 15 (SAMU) OU LE 112 (NUMÉRO D'URGENCE EUROPÉEN) OU LE 18 (POMPIERS).`
  }
];

/**
 * Recherche contextuelle dans la base de connaissances
 */
export function searchKnowledgeBase(query: string): KnowledgeItem[] {
  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const terms = normalizedQuery.split(/\s+/).filter(t => t.length > 2);

  if (terms.length === 0) return KNOWLEDGE_BASE.slice(0, 3);

  const scored = KNOWLEDGE_BASE.map(item => {
    let score = 0;
    const itemText = (item.title + " " + item.content + " " + item.keywords.join(" "))
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    for (const term of terms) {
      if (item.keywords.some(k => k.includes(term))) score += 5;
      if (item.title.toLowerCase().includes(term)) score += 4;
      if (itemText.includes(term)) score += 1;
    }
    return { item, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.item);
}
