import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { GoogleMapView } from '../components/GoogleMapView';
import { SEOHead } from '../components/SEOHead';

export const CpamRightsPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Simulateur de prise en charge CPAM
  const [activeRegime, setActiveRegime] = useState<'ald' | 'atmp' | 'maternite' | 'css' | 'general'>('ald');

  // Sélecteur de territoire pour la cartographie sanitaire
  const [selectedTerritory, setSelectedTerritory] = useState<'national' | '972' | '971' | '973' | '974'>('national');

  const regimeDetails = {
    ald: {
      title: 'Affection de Longue Durée (ALD 30 / ALD Hors Liste)',
      badge: 'Prise en charge à 100%',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      description: 'Pour les pathologies chroniques invalidantes (cancer, dialyse rénale, insuffisance cardiaque grave, AVC, diabète sévère, etc.).',
      cpamShare: '100 % (Exonération du ticket modérateur)',
      mutuelleShare: '0 % nécessaire',
      patientCost: '0,00 € (Tiers-payant intégral)',
      conditions: [
        'Prescription Médicale de Transport (PMT) établie en rapport direct avec l\'ALD',
        'Volet médical signé et daté avant la réalisation du trajet',
        'Carte Vitale à jour avec attestation de droits mentionnant l\'exonération ALD'
      ]
    },
    atmp: {
      title: 'Accident du Travail & Maladie Professionnelle (AT/MP)',
      badge: 'Prise en charge à 100%',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      description: 'Déplacements pour consultations, soins, expertises ou rééducation liés à un accident du travail ou une maladie professionnelle reconnue.',
      cpamShare: '100 % pris en charge',
      mutuelleShare: '0 % nécessaire',
      patientCost: '0,00 € (Aucune avance de frais)',
      conditions: [
        'Prescription Médicale de Transport (PMT) établie par le praticien traitant',
        'Feuille d\'accident du travail ou certificat initial fourni par l\'employeur / la CPAM',
        'Pas de franchise médicale applicable sur les trajets AT/MP'
      ]
    },
    maternite: {
      title: 'Maternité (À partir du 6e mois de grossesse)',
      badge: 'Prise en charge à 100%',
      badgeColor: 'bg-pink-100 text-pink-900 border-pink-300',
      description: 'Déplacements liés à la grossesse à partir du 1er jour du 6e mois et jusqu\'à 12 jours après l\'accouchement.',
      cpamShare: '100 % Assurance Maladie',
      mutuelleShare: '0 % nécessaire',
      patientCost: '0,00 € (Tiers-payant maternité)',
      conditions: [
        'Prescription Médicale de Transport (PMT) délivrée par l\'obstétricien ou la sage-femme',
        'Trajet entre le domicile et la maternité / centre hospitalier conventionné',
        'Attestation de droits à jour précisant le régime maternité'
      ]
    },
    css: {
      title: 'Complémentaire Santé Solidaire (CSS / ex-CMU-C)',
      badge: 'Prise en charge à 100%',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      description: 'Pour les bénéficiaires de la Complémentaire Santé Solidaire (avec ou sans participation financière).',
      cpamShare: '65 % Sécurité Sociale + 35 % part CSS',
      mutuelleShare: 'Intégrée automatiquement via la CSS',
      patientCost: '0,00 € (Dispense totale d\'avance de frais)',
      conditions: [
        'Prescription Médicale de Transport (PMT) valide',
        'Droits CSS ouverts et inscrits sur la puce de la Carte Vitale',
        'Transport par Taxi conventionné CPAM, VSL ou Ambulance agréée'
      ]
    },
    general: {
      title: 'Régime Général & Soins Courants (Hors ALD)',
      badge: 'Prise en charge à 65% + Mutuelle',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      description: 'Déplacements pour hospitalisation (entrée/sortie), soins itératifs ou examens médicaux sans exonération du ticket modérateur.',
      cpamShare: '65 % Assurance Maladie',
      mutuelleShare: '35 % Mutuelle complémentaire santé (télétransmission ROC/BPEC)',
      patientCost: '0,00 € avec mutuelle responsable conventionnée (ou ticket modérateur selon contrat)',
      conditions: [
        'Prescription Médicale de Transport (PMT) justifiant l\'incompatibilité avec les transports en commun',
        'Conventionnement direct avec votre mutuelle santé partenaire',
        'Franchise médicale légale de 4 € par trajet (plafonnée à 50 € par an)'
      ]
    }
  };

  const territoryInfo = {
    national: {
      name: 'France Métropolitaine & Réseau National',
      desc: 'Couverture intégrale des 96 départements métropolitains et des 5 départements d\'outre-mer. Conventionnement avec toutes les CPAM de France (Assurance Maladie).',
      hubs: [
        'Réseau AP-HP (Paris & Île-de-France) : Pitié-Salpêtrière, Necker, Georges-Pompidou, Saint-Louis, Bicêtre',
        'Grands CHU Régionaux : Hospices Civils de Lyon (HCL), CHU Bordeaux, Marseille (AP-HM), Lille, Toulouse, Nantes',
        'Instituts de Cancérologie & Dialyse : Gustave Roussy, Centre Léon Bérard, Institut Curie, centres AURA et Diaverum'
      ],
      mapCenter: 'Paris, France',
      badge: 'National • 101 Départements'
    },
    '972': {
      name: 'Martinique (972)',
      desc: 'Maillage sanitaire des 34 communes de Martinique en liaison avec la CGSS Martinique et l\'ARS.',
      hubs: [
        'CHU de Martinique (Plateaux Pierre Zobda-Quitman, MFME, Pierre Nouveau)',
        'Pôle Nord-Atlantique : Centre Hospitalier Louis Domergue (La Trinité), CH Saint-Pierre',
        'Pôle Sud & Cliniques : Hôpital du Marin, Clinique Sainte-Marie, Clinique Saint-Paul, centres de dialyse'
      ],
      mapCenter: 'CHU Pierre Zobda-Quitman, Fort-de-France',
      badge: 'Région 972 • 34 Communes'
    },
    '971': {
      name: 'Guadeloupe (971)',
      desc: 'Couverture sanitaire de Grande-Terre, Basse-Terre et dépendances en conventionnement CGSS Guadeloupe.',
      hubs: [
        'CHU de Guadeloupe (Pointe-à-Pitre / Les Abymes)',
        'Centre Hospitalier de Basse-Terre (CHBT)',
        'Cliniques conventionnées, centres d\'hémodialyse et de radiothérapie'
      ],
      mapCenter: 'CHU de Guadeloupe, Les Abymes',
      badge: 'Région 971 • 32 Communes'
    },
    '973': {
      name: 'Guyane (973)',
      desc: 'Régulation sanitaire du littoral et des bassins de vie en liaison avec la CGSS Guyane.',
      hubs: [
        'Centre Hospitalier Andrée Rosemon (CHAR - Cayenne)',
        'Centre Hospitalier de l\'Ouest Guyanais (CHOG - Saint-Laurent-du-Maroni)',
        'Centre Hospitalier de Kourou (CHK)'
      ],
      mapCenter: 'Centre Hospitalier de Cayenne, Guyane',
      badge: 'Région 973'
    },
    '974': {
      name: 'La Réunion (974)',
      desc: 'Flottes conventionnées CPAM / CGSS Réunion couvrant le Nord, l\'Ouest et le Sud de l\'île.',
      hubs: [
        'CHU de La Réunion - Site Nord (Félix Guyon, Saint-Denis)',
        'CHU de La Réunion - Site Sud (Saint-Pierre)',
        'Centre Hospitalier Ouest Réunion (CHOR) et cliniques conventionnées'
      ],
      mapCenter: 'CHU de La Réunion, Saint-Denis',
      badge: 'Région 974'
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary flex flex-col">
      <Header />
      <SEOHead
        title="Droits CPAM & Remboursement Transport Médical en France | Prise en Charge 100% ALD"
        description="Guide officiel du transport sanitaire conventionné en France : Prescription Médicale de Transport (PMT), Tiers-payant à 100% (ALD, AT/MP, CSS), remboursement Taxi conventionné, VSL et Ambulance par la CPAM / Assurance Maladie."
        canonicalPath="/droits-cpam"
        ogImage="/assets/medictrans_hero_discover.jpg"
        schemaJson={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Comment bénéficier d\'un transport médical pris en charge à 100% par l\'Assurance Maladie ?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Pour bénéficier du tiers-payant à 100% par la Sécurité Sociale (CPAM / Assurance Maladie / CGSS), le patient doit être reconnu en Affection Longue Durée (ALD 30, ex: hémodialyse, chimiothérapie, radiothérapie, rééducation), en accident du travail ou maladie professionnelle (AT/MP), ou en maternité (> 6e mois), et disposer d\'une Prescription Médicale de Transport (PMT) établie par son médecin avant le trajet.'
              }
            },
            {
              '@type': 'Question',
              name: 'Quelle est la différence entre une Ambulance, un VSL et un Taxi conventionné CPAM ?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'L\'Ambulance (Catégories A, B, C) est obligatoire pour les transports allongés, avec brancardage ou surveillance constante (oxygène, monitoring). Le Véhicule Sanitaire Léger (VSL) s\'adresse aux patients assis nécessitant une aide technique ou physique et des règles strictes d\'hygiène. Le Taxi conventionné CPAM s\'adresse aux patients assis autonomes se déplaçant pour des soins réguliers ou des hospitalisations.'
              }
            },
            {
              '@type': 'Question',
              name: 'Dois-je avancer les frais lors d\'un transport sanitaire conventionné ?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Non. Grâce au conventionnement officiel CPAM / Assurance Maladie et à la télétransmission subrogatoire (BPEC/ROC), le tiers-payant s\'applique directement : aucune avance de frais n\'est demandée au patient bénéficiant d\'une prise en charge à 100% ou avec mutuelle complémentaire santé conventionnée.'
              }
            },
            {
              '@type': 'Question',
              name: 'Quels établissements et territoires sont couverts par Clinigo en France ?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Clinigo couvre l\'ensemble du territoire national français (France métropolitaine et départements d\'outre-mer : Martinique, Guadeloupe, Guyane, La Réunion). Le réseau dessert l\'ensemble des Centres Hospitaliers Universitaires (CHU), hôpitaux publics, cliniques conventionnées, centres d\'hémodialyse et instituts de cancérologie.'
              }
            },
            {
              '@type': 'Question',
              name: 'Quand faut-il faire une demande d\'accord préalable à la CPAM ?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'L\'accord préalable du service médical de votre CPAM est obligatoire dans trois cas : les transports de plus de 150 km, les transports itératifs (au moins 4 trajets de plus de 50 km sur une période de 2 mois pour un même traitement), et les transports en avion ou bateau de ligne régulière.'
              }
            }
          ]
        }}
      />

      <main className="w-full pt-4 sm:pt-6 bg-background flex-1">
        <div className="flex flex-col w-full">
          {/* Hero Section */}
          <section className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50/90 via-white to-slate-50/40 py-12 lg:py-16 border-b border-slate-200/80">
            <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl pointer-events-none"></div>
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-slate-400/5 blur-2xl pointer-events-none"></div>

            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
                    <span className="material-symbols-outlined text-[18px] text-teal-700">verified_user</span>
                    <span className="uppercase tracking-wider font-bold text-xs">
                      Plateforme Nationale Conventionnée • Assurance Maladie (CPAM)
                    </span>
                  </div>

                  <h1 className="tracking-tight leading-tight font-extrabold text-3xl md:text-4xl lg:text-5xl text-slate-900">
                    Le réseau national de transport sanitaire et de soins conventionnés{' '}
                    <span className="text-teal-600 underline decoration-teal-300 decoration-4 underline-offset-4">
                      partout en France
                    </span>
                  </h1>

                  <p className="text-slate-600 max-w-2xl text-base leading-relaxed">
                    Coordination et régulation médicale de vos transports conventionnés en <strong>Taxi conventionné CPAM</strong>, <strong>VSL</strong> et <strong>Ambulance</strong>. 
                    Bénéficiez du <strong>tiers-payant direct sans avance de frais</strong> avec votre Prescription Médicale de Transport (PMT), en liaison avec tous les hôpitaux, cliniques et centres de dialyse en France métropolitaine et Outre-mer.
                  </p>

                  <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                    <Link
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                      to="/reserver"
                    >
                      <span className="material-symbols-outlined text-lg">calendar_month</span>
                      <span>Réserver un transport conventionné</span>
                    </Link>
                    <Link
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-800 font-bold hover:bg-slate-50 transition-all border border-slate-200 shadow-xs"
                      to="/etablissements"
                    >
                      <span className="material-symbols-outlined text-teal-600 text-lg">health_and_safety</span>
                      <span>Accès Établissements &amp; Soignants</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4">
                    <div className="flex flex-col p-3.5 sm:p-4 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                      <span className="font-extrabold text-slate-900 text-xl md:text-2xl">
                        101 Dép.
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        France Métropole &amp; DROM
                      </span>
                    </div>
                    <div className="flex flex-col p-3.5 sm:p-4 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                      <span className="font-extrabold text-teal-600 text-xl md:text-2xl">
                        100%
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Tiers-payant ALD / AT / CSS
                      </span>
                    </div>
                    <div className="flex flex-col p-3.5 sm:p-4 bg-white rounded-2xl shadow-sm border border-slate-200/80">
                      <span className="font-extrabold text-slate-900 text-xl md:text-2xl">
                        24/7
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Régulation Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="w-full h-96 rounded-2xl overflow-hidden shadow-xl relative border border-outline-variant/30">
                    <img
                      className="w-full h-full object-cover"
                      alt="Ambulancier et patient pris en charge en transport sanitaire conventionné"
                      src="/assets/step3_care.jpg"
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/95 backdrop-blur-md p-space-md rounded-xl shadow-lg flex items-center justify-between border border-outline-variant/30">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">hub</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-bold text-xs">
                            Régulation Sanitaire Nationale
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                            Télétransmission directe CPAM &amp; Mutuelles
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-bold text-xs">
                        Agréé ARS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Simulateur Interactif de Prise en Charge CPAM */}
          <section className="w-full py-12 bg-white border-b border-slate-200/80">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-teal-700 font-bold uppercase tracking-wider text-xs block mb-1">
                    Simulateur de Remboursement Sécurité Sociale
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                    Quelle est votre prise en charge par la CPAM ?
                  </h2>
                  <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                    Sélectionnez votre situation médicale pour connaître immédiatement votre taux de remboursement, les pièces requises et confirmer l'absence d'avance de frais.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold shrink-0 self-start md:self-auto">
                  <span className="material-symbols-outlined text-base text-teal-600">verified</span>
                  <span>Code de la Sécurité Sociale (Art. R. 322-10)</span>
                </div>
              </div>

              {/* Onglets de situation */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { id: 'ald', label: 'Affection Longue Durée (ALD)', icon: 'heart_check' },
                  { id: 'atmp', label: 'Accident du Travail (AT/MP)', icon: 'work' },
                  { id: 'maternite', label: 'Maternité (> 6e mois)', icon: 'pregnant_woman' },
                  { id: 'css', label: 'Complémentaire Santé Solidaire (CSS)', icon: 'shield_person' },
                  { id: 'general', label: 'Régime Général (Soins courants)', icon: 'medical_services' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRegime(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      activeRegime === tab.id
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Panneau de détails du régime sélectionné */}
              <div className="bg-slate-50/90 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border mb-2 ${regimeDetails[activeRegime].badgeColor}`}>
                      {regimeDetails[activeRegime].badge}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {regimeDetails[activeRegime].title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
                      {regimeDetails[activeRegime].description}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs shrink-0">
                    <span className="text-xs text-slate-500 font-medium">Votre reste à charge patient :</span>
                    <span className="text-2xl font-black text-teal-600">
                      {regimeDetails[activeRegime].patientCost}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Part Assurance Maladie (CPAM)
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {regimeDetails[activeRegime].cpamShare}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Part Mutuelle Complémentaire
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {regimeDetails[activeRegime].mutuelleShare}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Mode de facturation
                    </span>
                    <span className="text-base font-bold text-teal-700 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Tiers-Payant Télétransmis
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
                    Conditions obligatoires pour la dispense totale d'avance de frais :
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {regimeDetails[activeRegime].conditions.map((cond, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/70">
                        <span className="material-symbols-outlined text-teal-600 text-base shrink-0">task_alt</span>
                        <span>{cond}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Les 3 modes de transport */}
          <section className="w-full py-space-xl bg-surface">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
                <div className="flex flex-col gap-space-xs max-w-xl">
                  <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-xs">
                    Nomenclature Officielle Assurance Maladie
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold text-2xl md:text-3xl">
                    Les 3 modes de transport conventionnés par la CPAM
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    En France, le mode de transport est strictement déterminé par votre état clinique et obligatoirement précisé par votre médecin sur la Prescription Médicale de Transport (Cerfa S3138).
                  </p>
                </div>
                <div className="flex items-center gap-space-xs bg-surface-container-high px-4 py-2.5 rounded-xl text-primary font-label-md text-label-md border border-outline-variant/30 text-xs font-bold">
                  <span className="material-symbols-outlined text-base">receipt_long</span>
                  <span>Prise en charge Assurance Maladie (CPAM) subrogatoire</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
                {/* Taxi */}
                <div className="flex flex-col bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow border border-outline-variant/30 relative overflow-hidden group">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-space-md">
                    <span className="material-symbols-outlined text-[28px]">local_taxi</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider mb-space-xs text-xs">
                    Patient Autonome
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-space-sm font-bold text-lg">
                    Taxi Conventionné CPAM
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex-1 text-xs leading-relaxed">
                    Dédié aux patients pouvant marcher seuls sans aide physique lourde et se déplaçant pour des soins récurrents ou ponctuels : chimiothérapie, radiothérapie, hémodialyse, consultations spécialisées ou hospitalisations.
                  </p>
                  <div className="space-y-space-xs pt-space-sm border-t border-surface-container mb-space-md text-xs">
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Position assise standard</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Chimiothérapie / Hémodialyse / Soins réguliers</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Agrément officiel conventionné CPAM &amp; Préfecture</span>
                    </div>
                  </div>
                  <Link
                    className="w-full py-3 rounded-xl bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors text-center font-label-md text-label-md font-bold text-xs"
                    to="/reserver"
                  >
                    Sélectionner Taxi Conventionné
                  </Link>
                </div>

                {/* VSL */}
                <div className="flex flex-col bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow border border-outline-variant/30 relative overflow-hidden group">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary mb-space-md">
                    <span className="material-symbols-outlined text-[28px]">accessible_forward</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider mb-space-xs text-xs">
                    Aide Technique &amp; Transfert
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-space-sm font-bold text-lg">
                    VSL (Véhicule Sanitaire Léger)
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex-1 text-xs leading-relaxed">
                    Transport assis professionnalisé avec chauffeur sanitaire formé aux gestes d'urgence. Requis lorsque le patient nécessite une aide à la marche, un accompagnement administratif ou des conditions d'hygiène et désinfection strictes.
                  </p>
                  <div className="space-y-space-xs pt-space-sm border-t border-surface-container mb-space-md text-xs">
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Aide active au déplacement et à la marche</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Assistance administrative et accueil hospitalier</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Véhicule conforme aux normes sanitaires ARS</span>
                    </div>
                  </div>
                  <Link
                    className="w-full py-3 rounded-xl bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors text-center font-label-md text-label-md font-bold text-xs"
                    to="/reserver"
                  >
                    Sélectionner un VSL
                  </Link>
                </div>

                {/* Ambulance */}
                <div className="flex flex-col bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm hover:shadow-md transition-shadow border border-outline-variant/30 relative overflow-hidden group">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-space-md">
                    <span className="material-symbols-outlined text-[28px]">emergency</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-error font-bold uppercase tracking-wider mb-space-xs text-xs">
                    Surveillance &amp; Brancardage
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-space-sm font-bold text-lg">
                    Ambulance (Cat. A, B, C)
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex-1 text-xs leading-relaxed">
                    Transport allongé ou demi-assis sous la veille permanente d'un équipage diplômé d'État (DEA + Auxiliaire). Matériel d'oxygénothérapie, monitoring, aspiration et brancardage complet.
                  </p>
                  <div className="space-y-space-xs pt-space-sm border-t border-surface-container mb-space-md text-xs">
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Brancardage complet et portage d'étage</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Oxygène médical &amp; surveillance constante</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Équipage titulaire du Diplôme d'État d'Ambulancier</span>
                    </div>
                  </div>
                  <Link
                    className="w-full py-3 rounded-xl bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors text-center font-label-md text-label-md font-bold text-xs"
                    to="/reserver"
                  >
                    Sélectionner une Ambulance
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Démarches & Formalités Nationales */}
          <section className="w-full py-space-xl bg-surface-container-low border-y border-outline-variant/30">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="flex flex-col gap-space-xs mb-space-lg">
                <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-xs">
                  Droits &amp; Réglementation
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold text-2xl md:text-3xl">
                  Vos démarches de prise en charge CPAM en France
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm">
                  Comprendre le circuit officiel de l'Assurance Maladie et les documents indispensables pour une dispense totale d'avance de frais.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
                <div className="flex flex-col bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-outline-variant/30 gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold font-label-md text-sm">
                      1
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">
                      Prescription Médicale (PMT)
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                    Le formulaire Cerfa officiel (n° 11574*05 / S3138) doit impérativement être prescrit, daté et signé par votre médecin <strong>avant la réalisation du transport</strong> (sauf urgence médicale attestée).
                  </p>
                  <div className="mt-auto pt-space-sm bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-primary font-bold block mb-1 text-xs">
                      Règle d'or Assurance Maladie :
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                      Conformément à la réglementation CPAM, aucun bon de transport ne peut être régularisé a posteriori pour simple convenance personnelle.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-outline-variant/30 gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold font-label-md text-sm">
                      2
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">
                      Tiers-Payant Intégral à 100%
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                    Vous ne déboursez rien si vous relevez de l'un des régimes exonérants : Affection Longue Durée (ALD 30), Accident du Travail / Maladie Professionnelle (AT/MP), Complémentaire Santé Solidaire (CSS), ou Maternité (&gt; 6e mois).
                  </p>
                  <div className="mt-auto pt-space-sm bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-secondary font-bold block mb-1 text-xs">
                      Documents à remettre au chauffeur :
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                      Carte Vitale à jour + volet papier de la Prescription Médicale de Transport (PMT).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-outline-variant/30 gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold font-label-md text-sm">
                      3
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">
                      Accord Préalable (&gt;150 km / Série)
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                    Pour les transports de plus de 150 km aller, les transports en série (au moins 4 trajets de plus de 50 km sur une période de 2 mois pour un même traitement) ou l'avion/bateau, une entente préalable doit être validée par le service médical de votre CPAM.
                  </p>
                  <div className="mt-auto pt-space-sm bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-tertiary font-bold block mb-1 text-xs">
                      Assistance Clinigo :
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                      Notre plateforme vous guide pour transmettre votre demande d'entente préalable dans les délais réglementaires (15 jours).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cartographie et Réseau Hospitalier National */}
          <section className="w-full py-space-xl bg-surface">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                <div className="lg:col-span-5 flex flex-col gap-space-md">
                  <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-xs">
                    Réseau Hospitalier &amp; Territoires Desservis
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold text-2xl md:text-3xl">
                    Maillage sanitaire national : Métropole &amp; Outre-Mer
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Clinigo connecte les patients aux flottes sanitaires conventionnées à l'échelle nationale, en partenariat avec les Groupements Hospitaliers de Territoire (GHT) et les caisses d'Assurance Maladie.
                  </p>

                  {/* Sélecteur de territoire */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[
                      { id: 'national', label: 'France Métropole' },
                      { id: '972', label: 'Martinique' },
                      { id: '971', label: 'Guadeloupe' },
                      { id: '973', label: 'Guyane' },
                      { id: '974', label: 'La Réunion' },
                    ].map((terr) => (
                      <button
                        key={terr.id}
                        onClick={() => setSelectedTerritory(terr.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedTerritory === terr.id
                            ? 'bg-teal-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {terr.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-space-sm mt-space-xs">
                    <div className="p-space-sm bg-surface-container-lowest rounded-xl shadow-xs flex items-start gap-space-sm border border-outline-variant/30">
                      <span className="material-symbols-outlined text-primary mt-1">local_hospital</span>
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                          {territoryInfo[selectedTerritory].name}
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                          {territoryInfo[selectedTerritory].desc}
                        </p>
                      </div>
                    </div>

                    <div className="p-space-sm bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30">
                      <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block mb-1.5">
                        Principaux centres de soins &amp; hôpitaux reliés :
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {territoryInfo[selectedTerritory].hubs.map((hub, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="material-symbols-outlined text-teal-600 text-sm shrink-0 mt-0.5">domain</span>
                            <span>{hub}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col gap-space-sm">
                  <div className="w-full h-96 rounded-2xl shadow-lg overflow-hidden relative border border-outline-variant/30">
                    <GoogleMapView 
                      mode="fleet" 
                      destination={territoryInfo[selectedTerritory].mapCenter}
                      height="100%" 
                    />
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm px-1 text-xs">
                    <span>
                      Réseau conventionné : Ambulances de soins d'urgence • Véhicules Sanitaires Légers (VSL) • Taxis conventionnés CPAM
                    </span>
                    <span className="text-secondary font-bold shrink-0 ml-2">
                      {territoryInfo[selectedTerritory].badge}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Patients & Familles */}
          <section className="w-full py-space-xl bg-surface-container-low border-t border-outline-variant/30">
            <div className="max-w-[1000px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="flex flex-col items-center text-center gap-space-xs mb-space-lg">
                <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-xs">
                  Aide &amp; Renseignements CPAM
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold text-2xl md:text-3xl">
                  Questions Fréquentes sur vos Droits de Transport
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm max-w-xl">
                  Tout ce que vous devez savoir pour organiser vos transports médicaux sereinement avec l'Assurance Maladie.
                </p>
              </div>

              <div className="space-y-space-sm">
                {[
                  {
                    q: 'Quel est le délai recommandé pour réserver un transport sanitaire programmé ?',
                    a: "Pour les consultations simples et bilans hospitaliers, il est conseillé de réserver 24 à 48 heures à l'avance afin de garantir la disponibilité du véhicule adapté. Pour les protocoles chroniques (chimiothérapie, radiothérapie ou hémodialyse), la planification peut s'effectuer pour plusieurs semaines dès remise de votre calendrier de soins.",
                  },
                  {
                    q: 'Puis-je choisir librement mon entreprise de transport sanitaire conventionnée ?',
                    a: "Oui. Le principe du libre choix du transporteur est un droit fondamental garanti par le Code de la Santé Publique. Vous pouvez choisir librement votre taxi conventionné, VSL ou société d'ambulance conventionnée. Clinigo met à votre disposition des opérateurs agréés ARS et conventionnés CPAM sur tout le territoire.",
                  },
                  {
                    q: 'Un proche ou accompagnateur peut-il voyager avec le patient ?',
                    a: "Oui, un accompagnateur est systématiquement autorisé et pris en charge par l'Assurance Maladie pour un enfant mineur (moins de 16 ans) ou pour une personne en situation de perte d'autonomie majeure dont l'état nécessite l'assistance d'un tiers aidant mentionné sur la PMT.",
                  },
                  {
                    q: 'Comment s\'applique la franchise médicale sur les transports sanitaires ?',
                    a: "La franchise médicale légale est de 4 € par trajet (soit 8 € pour un aller-retour) en VSL ou taxi conventionné. Elle est plafonnée à 50 € par an et par assuré. Les enfants mineurs, les bénéficiaires de la Complémentaire Santé Solidaire (CSS), de l'AME et les victimes d'accidents du travail ou maternité en sont totalement exonérés.",
                  },
                  {
                    q: 'Puis-je emporter mon fauteuil roulant pliant et mes bagages ?',
                    a: 'Absolument. Les VSL et taxis conventionnés du réseau Clinigo disposent de coffres adaptés pour accueillir un fauteuil roulant pliable, un déambulateur et les bagages nécessaires à une hospitalisation. Précisez simplement vos besoins lors de votre réservation en ligne.',
                  },
                  {
                    q: "Comment procéder en cas de détresse vitale ou d'urgence médicale non programmée ?",
                    a: "En situation d'urgence vitale, ne passez pas par une réservation programmée : composez immédiatement le 15 (SAMU) ou le 112 depuis votre mobile. Le médecin régulateur du SAMU déclenchera une ambulance d'urgence ou une équipe médicale SMUR selon la gravité clinique.",
                  },
                ].map((item, idx) => (
                  <details
                    key={idx}
                    className="bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border border-outline-variant/30 group"
                  >
                    <summary className="flex items-center justify-between font-headline-sm text-headline-sm text-on-surface cursor-pointer list-none font-bold text-sm">
                      <span>{item.q}</span>
                      <span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">
                        expand_more
                      </span>
                    </summary>
                    <p className="font-body-sm text-body-sm text-on-surface-variant pt-space-sm leading-relaxed text-xs">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
