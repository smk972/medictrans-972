import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const CpamRightsPage: React.FC = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState('');
  const [nir, setNir] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('CHU Pierre Zobda-Quitman (Fort-de-France)');
  const [vehicle, setVehicle] = useState('vsl');
  const [dateTime, setDateTime] = useState('');
  const [hasPmt, setHasPmt] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleQuickBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPmt) {
      alert('Veuillez cocher la confirmation de détention de votre PMT.');
      return;
    }
    navigate('/reserver', {
      state: {
        transportType: vehicle,
        pickupAddress: pickup,
        destinationFacility: destination,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary flex flex-col">
      <Header />

      <main className="w-full pt-20 bg-background flex-1">
        <div className="flex flex-col w-full">
          {/* Hero Section */}
          <section className="relative w-full overflow-hidden bg-surface-container-low py-space-xl lg:py-margin-lg border-b border-outline-variant/30">
            <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
            <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-secondary/5 blur-2xl pointer-events-none"></div>

            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-space-xs self-start px-3 py-1 rounded-full bg-surface-container-highest text-primary border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-xs">
                      Plateforme Régulée ARS &amp; CGSS Martinique 972
                    </span>
                  </div>

                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-tight font-bold text-3xl md:text-4xl">
                    Le réseau unifié de transport sanitaire et de soins en{' '}
                    <span className="text-primary underline decoration-secondary decoration-4 underline-offset-4">
                      Martinique
                    </span>
                  </h1>

                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl text-base leading-relaxed">
                    Coordination insulaire d'urgence et programmée. Bénéficiez d'une prise en charge
                    conventionnée de Grand'Rivière à Sainte-Anne, en liaison directe avec le SAMU
                    Centre 15 et le CHU de Fort-de-France.
                  </p>

                  <div className="flex flex-wrap items-center gap-space-md pt-space-xs">
                    <Link
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:bg-primary-container hover:shadow-lg transition-all"
                      to="/reserver"
                    >
                      <span className="material-symbols-outlined">calendar_month</span>
                      <span>Réserver un transport dès maintenant</span>
                    </Link>
                    <Link
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface-container-highest text-primary font-label-lg text-label-lg font-bold hover:bg-surface-container-high transition-all border border-outline-variant/30"
                      to="/etablissements"
                    >
                      <span className="material-symbols-outlined">health_and_safety</span>
                      <span>Accès professionnels de santé</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-space-md pt-space-md">
                    <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30">
                      <span className="font-headline-md text-headline-md text-primary font-bold text-xl md:text-2xl">
                        34 / 34
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                        Communes desservies
                      </span>
                    </div>
                    <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30">
                      <span className="font-headline-md text-headline-md text-secondary font-bold text-xl md:text-2xl">
                        100%
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                        Tiers-payant ALD/CSS
                      </span>
                    </div>
                    <div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/30">
                      <span className="font-headline-md text-headline-md text-primary font-bold text-xl md:text-2xl">
                        24/7
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                        Régulation Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="w-full h-96 rounded-2xl overflow-hidden shadow-xl relative border border-outline-variant/30">
                    <img
                      className="w-full h-full object-cover"
                      alt="Ambulancier et patient en Martinique"
                      src="/assets/step3_care.jpg"
                    />
                    <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/95 backdrop-blur-md p-space-md rounded-xl shadow-lg flex items-center justify-between border border-outline-variant/30">
                      <div className="flex items-center gap-space-sm">
                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">hub</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md text-on-surface font-bold text-xs">
                            Coordination H24
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                            Flux direct SAMU 972 / CGSS
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-bold text-xs">
                        Opérationnel
                      </span>
                    </div>
                  </div>
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
                    Offre Sanitaire Territoriale
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold text-2xl md:text-3xl">
                    Les 3 modes de transport conventionnés
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Le mode de transport est strictement déterminé par votre état de santé et précisé sur
                    votre Prescription Médicale de Transport (PMT).
                  </p>
                </div>
                <div className="flex items-center gap-space-xs bg-surface-container-high px-4 py-2.5 rounded-xl text-primary font-label-md text-label-md border border-outline-variant/30 text-xs font-bold">
                  <span className="material-symbols-outlined text-base">receipt_long</span>
                  <span>Prise en charge CPAM 972 subrogatoire</span>
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
                    Taxi Conventionné
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex-1 text-xs leading-relaxed">
                    Dédié aux patients pouvant marcher seuls sans aide physique et se déplaçant pour
                    des soins récurrents : chimiothérapie, radiothérapie, dialyse ou consultations
                    spécialisées.
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
                      <span>Chimiothérapie / Hémodialyse</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Agrément spécifique CPAM 972</span>
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
                    Transport assis professionnalisé avec chauffeur formé aux gestes d'urgence. Requis
                    lorsque le patient nécessite une aide à la marche, un portage d'étage ou une
                    désinfection stricte.
                  </p>
                  <div className="space-y-space-xs pt-space-sm border-t border-surface-container mb-space-md text-xs">
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Aide active au déplacement</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Assistance administrative à l'accueil</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Hygiène sanitaire renforcée</span>
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
                    Transport allongé ou demi-assis sous la veille permanente d'un équipage titulaire
                    du Diplôme d'État d'Ambulancier (DEA). Matériel d'oxygénothérapie et monitoring
                    embarqué.
                  </p>
                  <div className="space-y-space-xs pt-space-sm border-t border-surface-container mb-space-md text-xs">
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Brancardage complet et portage</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Oxygène médical &amp; surveillance continue</span>
                    </div>
                    <div className="flex items-center gap-space-xs text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        check_circle
                      </span>
                      <span>Équipage diplômé d'État (DEA + Auxiliaire)</span>
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

          {/* Démarches & Formalités */}
          <section className="w-full py-space-xl bg-surface-container-low border-y border-outline-variant/30">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="flex flex-col gap-space-xs mb-space-lg">
                <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-xs">
                  Droits &amp; Formalités
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold text-2xl md:text-3xl">
                  Vos démarches de prise en charge en Martinique
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl text-sm">
                  Comprendre le circuit de remboursement et les pièces obligatoires pour une dispensation
                  totale d'avance de frais.
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
                    Le formulaire Cerfa 11574*05 doit impérativement être signé et daté par le
                    praticien <strong>antérieurement au trajet</strong> (sauf convocation médicale
                    d'urgence).
                  </p>
                  <div className="mt-auto pt-space-sm bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-primary font-bold block mb-1 text-xs">
                      Règle d'or CGSS 972 :
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                      Aucun bon de transport ne peut être régularisé a posteriori pour convenance
                      personnelle.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-outline-variant/30 gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold font-label-md text-sm">
                      2
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">
                      Tiers-Payant à 100%
                    </h3>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                    Vous ne déboursez rien si vous relevez de l'un des régimes suivants : Affection
                    Longue Durée (ALD exonérante), Accident du Travail / Maladie Professionnelle (AT/MP),
                    Complémentaire Santé Solidaire (CSS), ou Maternité (&gt; 6e mois).
                  </p>
                  <div className="mt-auto pt-space-sm bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-secondary font-bold block mb-1 text-xs">
                      Documents requis :
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                      Carte Vitale à jour + Attestation de droits papier mentionnant l'exonération.
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
                    Pour les transports itératifs (au moins 4 trajets de plus de 50 km sur une période
                    de 2 mois) ou les transferts sanitaires hors territoire, une demande d'entente
                    préalable doit être soumise au service médical de la CGSS 972.
                  </p>
                  <div className="mt-auto pt-space-sm bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-tertiary font-bold block mb-1 text-xs">
                      Assistance Médic'Trans :
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                      Notre centrale numérise et télétransmet directement votre volet médical.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cartographie */}
          <section className="w-full py-space-xl bg-surface">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                <div className="lg:col-span-5 flex flex-col gap-space-md">
                  <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-xs">
                    Cartographie des Soins 972
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold text-2xl md:text-3xl">
                    Maillage intégral des 34 communes de Martinique
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                    Nos flottes coordonnées couvrent l'intégralité des bassins Nord-Atlantique,
                    Nord-Caraïbe, Centre et Sud avec des points de stationnement permanent.
                  </p>
                  <div className="space-y-space-sm mt-space-xs">
                    <div className="p-space-sm bg-surface-container-lowest rounded-xl shadow-xs flex items-start gap-space-sm border border-outline-variant/30">
                      <span className="material-symbols-outlined text-primary mt-1">local_hospital</span>
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                          CHU de Martinique (Fort-de-France)
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                          Plateaux P. Zobda-Quitman, Maison de la Femme, Hôpital Pierre Nouveau.
                        </p>
                      </div>
                    </div>
                    <div className="p-space-sm bg-surface-container-lowest rounded-xl shadow-xs flex items-start gap-space-sm border border-outline-variant/30">
                      <span className="material-symbols-outlined text-secondary mt-1">domain</span>
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                          Pôle Nord &amp; Atlantique
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                          Hôpital Louis Domergue (Trinité), Centre Hospitalier de Saint-Pierre, Carbet.
                        </p>
                      </div>
                    </div>
                    <div className="p-space-sm bg-surface-container-lowest rounded-xl shadow-xs flex items-start gap-space-sm border border-outline-variant/30">
                      <span className="material-symbols-outlined text-tertiary mt-1">apartment</span>
                      <div>
                        <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                          Pôle Sud &amp; Cliniques Conventionnées
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                          Hôpital de Proximité du Marin, Clinique Sainte-Marie (Schoelcher), Saint-Esprit.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col gap-space-sm">
                  <div className="w-full h-96 rounded-2xl shadow-lg overflow-hidden relative border border-outline-variant/30">
                    <img
                      src="/assets/martinique_map.jpg"
                      alt="Carte Martinique"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-primary font-label-sm text-label-sm font-bold shadow-md flex items-center gap-space-xs text-xs border border-outline-variant/30">
                      <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                      <span>Couverture active SAMU / SAS 972</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm px-1 text-xs">
                    <span>
                      Réseau : Fort-de-France • Le Lamentin • Schoelcher • Ducos • Le François •
                      Sainte-Luce • Saint-Pierre
                    </span>
                    <span className="text-secondary font-bold">34 Communes Actives</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="w-full py-space-xl bg-surface-container-low border-t border-outline-variant/30">
            <div className="max-w-[1000px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="flex flex-col items-center text-center gap-space-xs mb-space-lg">
                <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-xs">
                  Aide &amp; Renseignements
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold text-2xl md:text-3xl">
                  Questions Fréquentes (FAQ Patients &amp; Familles)
                </h2>
              </div>

              <div className="space-y-space-sm">
                {[
                  {
                    q: 'Quel est le délai recommandé pour réserver un transport programmé ?',
                    a: "Pour les consultations simples et bilans hospitaliers, il est conseillé de réserver 24 à 48 heures à l'avance. Pour les protocoles chroniques de radiothérapie ou d'hémodialyse, la planification peut s'effectuer dès remise du calendrier médical auprès de notre régulateur.",
                  },
                  {
                    q: 'Un proche ou accompagnateur peut-il voyager avec le patient ?',
                    a: "Oui, un accompagnateur est systématiquement autorisé et pris en charge pour un enfant mineur (moins de 16 ans) ou pour une personne en situation de perte d'autonomie majeure dont la PMT spécifie la présence indispensable d'un tiers aidant.",
                  },
                  {
                    q: 'Puis-je emporter mon fauteuil roulant pliant et mes bagages ?',
                    a: 'Absolument. Nos VSL et taxis conventionnés possèdent les volumes nécessaires pour embarquer un fauteuil roulant pliable, un déambulateur et un sac de séjour hospitalier. Veuillez le signaler lors de la confirmation pour adapter le gabarit du véhicule.',
                  },
                  {
                    q: "Comment procéder en cas de détresse vitale ou d'urgence non programmée ?",
                    a: "En situation d'urgence vitale, ne passez pas par une réservation programmée : composez immédiatement le 15 (SAMU 972) ou le 112 depuis votre mobile. Le médecin régulateur du SAMU déclenchera une ambulance d'urgence ou le SMUR selon la gravité clinique.",
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
