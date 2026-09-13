/**
 * Nomenclature officielle des motifs de prise en charge des transports sanitaires
 * remboursables par l'Assurance Maladie / Sécurité Sociale (CPAM & CGSS Martinique 972)
 * 
 * Fondement juridique :
 * - Articles L. 322-5 et R. 322-10 à R. 322-10-9 du Code de la Sécurité Sociale
 * - Formulaire Cerfa n° 11574*05 (S3138b) - Prescription Médicale de Transport (PMT)
 */

export interface CpamMotifCategory {
  category: string;
  badge?: string;
  options: {
    value: string;
    label: string;
    description?: string;
    isAldOrExonere?: boolean;
  }[];
}

export const CPAM_TRANSPORT_MOTIFS: CpamMotifCategory[] = [
  {
    category: '🏥 Hospitalisation & Transferts Sanitaires',
    badge: 'Art. R. 322-10 1°',
    options: [
      {
        value: 'Entrée en hospitalisation (complète ou ambulatoire)',
        label: 'Entrée en hospitalisation (complète, de semaine ou chirurgie ambulatoire)',
        description: 'Prise en charge pour admission hospitalière prescrite par un médecin.',
      },
      {
        value: "Sortie d'hospitalisation / Retour à domicile",
        label: "Sortie d'hospitalisation / Retour à domicile ou structure de convalescence",
        description: 'Transport de retour après un séjour hospitalier.',
      },
      {
        value: 'Transfert inter-hospitalier (plateau technique ou rapprochement)',
        label: 'Transfert inter-hospitalier (spécialité technique ou rapprochement familial)',
        description: 'Déplacement entre deux établissements de santé.',
      },
      {
        value: 'Séjour en Soins Médicaux et de Réadaptation (SMR / SSR)',
        label: 'Séjour en Soins Médicaux et de Réadaptation (SMR / SSR)',
        description: 'Rééducation et convalescence post-opératoire ou post-AVC.',
      },
      {
        value: 'Séance de chimiothérapie ou chirurgie en Hôpital de Jour (HDJ)',
        label: 'Séance ou bilan en Hôpital de Jour (HDJ)',
        description: 'Soins ambulatoires programmés sur la journée.',
      },
    ],
  },
  {
    category: '🩺 Affection de Longue Durée (ALD 30 / Exonération 100%)',
    badge: 'ALD 100% Tiers-Payant',
    options: [
      {
        value: "Séance d'Hémodialyse rénale (ALD 19)",
        label: "Séance d'Hémodialyse rénale / Dialyse péritonéale (ALD 19)",
        description: 'Séances répétitives hebdomadaires en centre ou autodialyse.',
        isAldOrExonere: true,
      },
      {
        value: 'Séance de Chimiothérapie anticancéreuse (ALD 30)',
        label: 'Séance de Chimiothérapie anticancéreuse (ALD 30)',
        description: 'Perfusion ou immunothérapie en cancérologie.',
        isAldOrExonere: true,
      },
      {
        value: 'Séance de Radiothérapie / Curiethérapie (ALD 30)',
        label: 'Séance de Radiothérapie / Curiethérapie (ALD 30)',
        description: 'Séances de rayons programmées en oncologie.',
        isAldOrExonere: true,
      },
      {
        value: "Consultation spécialisée en rapport avec l'ALD",
        label: "Consultation spécialisée ou examen de suivi en rapport avec l'ALD",
        description: 'Suivi régulier (oncologie, cardiologie, diabétologie, neurologie...).',
        isAldOrExonere: true,
      },
      {
        value: 'Bilan ou imagerie de suivi ALD (Scanner, IRM, TEP-Scan)',
        label: 'Examen d\'imagerie médicale de suivi ALD (IRM, Scanner, PET-Scan)',
        description: 'Imagerie prescrite dans le cadre du protocole de soins ALD.',
        isAldOrExonere: true,
      },
    ],
  },
  {
    category: '💼 Accident du Travail & Maladie Professionnelle (AT/MP 100%)',
    badge: 'AT/MP 100% Sans Avance',
    options: [
      {
        value: 'Soins et consultations suite à Accident du Travail (AT)',
        label: 'Soins et consultations suite à Accident du Travail (AT)',
        description: 'Déplacements pour soins consécutifs à l\'accident de travail reconnu.',
        isAldOrExonere: true,
      },
      {
        value: 'Soins et examens liés à une Maladie Professionnelle (MP)',
        label: 'Soins et examens liés à une Maladie Professionnelle (MP)',
        description: 'Prise en charge intégrale au titre du risque professionnel.',
        isAldOrExonere: true,
      },
      {
        value: 'Séance de rééducation fonctionnelle consécutive à un AT/MP',
        label: 'Séance de rééducation fonctionnelle ou kinésithérapie post-AT/MP',
        description: 'Récupération motrice prescrite suite à un accident du travail.',
        isAldOrExonere: true,
      },
    ],
  },
  {
    category: '🔄 Transports en Série & Traitements Itératifs',
    badge: 'Au moins 4 transports',
    options: [
      {
        value: 'Transports en série (au moins 4 transports > 50 km sur 2 mois)',
        label: 'Transports en série (au moins 4 trajets > 50 km sur 2 mois pour un même traitement)',
        description: 'Nécessite une demande d\'accord préalable auprès de la CGSS Martinique.',
      },
      {
        value: 'Séances répétées de rééducation motrice lourde en centre spécialisé',
        label: 'Séances répétées de rééducation motrice lourde en centre spécialisé',
        description: 'Kinésithérapie et réadaptation physique intensive.',
      },
      {
        value: 'Prise en charge itérative en Centre Médico-Psychologique (CMP / CATTP)',
        label: 'Prise en charge itérative en Centre Médico-Psychologique (CMP / CATTP)',
        description: 'Soins et suivi ambulatoire psychiatrique ou psychothérapeutique.',
      },
    ],
  },
  {
    category: '🤰 Maternité & Petite Enfance',
    badge: 'Maternité 100%',
    options: [
      {
        value: 'Grossesse pathologique / Risque obstétrical élevé',
        label: 'Grossesse pathologique / Risque obstétrical élevé (surveillance renforcée)',
        description: 'Prescription pour menace d\'accouchement prématuré ou pathologie associée.',
        isAldOrExonere: true,
      },
      {
        value: 'Accouchement et hospitalisation de maternité (100% dès le 6e mois)',
        label: 'Accouchement et hospitalisation de maternité (100% Sécurité Sociale)',
        description: 'Prise en charge intégrale à compter du premier jour du 6e mois de grossesse.',
        isAldOrExonere: true,
      },
      {
        value: 'Bilan ou soins précoces en CAMSP / CMPP pour enfant ou nourrisson',
        label: 'Bilan ou soins précoces en CAMSP / CMPP (enfants et adolescents)',
        description: 'Action Médico-Sociale Précoce pour dépistage ou rééducation de l\'enfant.',
      },
    ],
  },
  {
    category: '⚖️ Convocations Légales, Expertises & Contrôles Médicaux',
    badge: 'Convocations Officielles',
    options: [
      {
        value: "Convocation du Service Médical de l'Assurance Maladie (Médecin-Conseil CGSS)",
        label: "Convocation du Service Médical de l'Assurance Maladie (Médecin-Conseil CGSS 972)",
        description: 'Convocation officielle pour contrôle des arrêts, invalidité ou ALD.',
        isAldOrExonere: true,
      },
      {
        value: 'Convocation pour expertise médicale judiciaire ou légale',
        label: 'Convocation pour expertise médicale judiciaire ordonnée par un tribunal',
        description: 'Déplacement obligatoire ordonné par autorité judiciaire.',
      },
      {
        value: "Rendez-vous pour délivrance ou réglage d'appareillage lourd (fauteuil, prothèse)",
        label: "Rendez-vous pour fourniture d'appareillage lourd (fauteuil roulant, prothèse, orthèse)",
        description: 'Essai, livraison ou adaptation d\'un appareillage prescrit.',
      },
      {
        value: 'Transport de longue distance (> 150 km aller avec entente préalable)',
        label: 'Transport de longue distance (> 150 km aller avec accord préalable)',
        description: 'Nécessite la validation préalable du médecin-conseil de la caisse.',
      },
      {
        value: 'Évacuation Sanitaire (EVASAN Martinique ➔ Guadeloupe / Hexagone)',
        label: 'Évacuation Sanitaire (EVASAN Martinique ➔ Guadeloupe / France Hexagonale)',
        description: 'Prise en charge d\'urgence ou hautement spécialisée non réalisable sur le territoire.',
        isAldOrExonere: true,
      },
    ],
  },
];
