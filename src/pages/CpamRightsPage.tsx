import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const CpamRightsPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);

    // Form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (window.location.pathname === '/') {
          navigate('/reserver');
        } else if (window.location.pathname === '/reserver') {
          navigate('/confirmation/MT-972-8821');
        } else if (window.location.pathname.startsWith('/inscription')) {
          alert("Votre dossier a bien été soumis à la régulation Médic'Trans 972.");
          navigate('/');
        }
      });
    });

    // Button navigation shortcuts
    document.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('Étape 2') || text.includes('Continuer vers') || text.includes('Continuer ma réservation')) {
        btn.addEventListener('click', () => navigate('/reserver'));
      } else if (text.includes('Confirmer') || text.includes('Valider la demande') || text.includes('Valider la réservation')) {
        btn.addEventListener('click', () => navigate('/confirmation/MT-972-8821'));
      } else if (text.includes('Suivi') || text.includes('Suivre')) {
        btn.addEventListener('click', () => navigate('/suivi'));
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,37,69,0.06)]"><div className="h-20 max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex items-center justify-between gap-space-md"><div className="flex items-center gap-space-sm"><img alt="Brand logo. - Primary color: #0b5c9e
- Font: plusJakartaSans
- Mode: light
- Roundness: rounded-md
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1XfD3evNv8jpKEQassyB67JCw2Z0av_XyxFzLWrX7T_Xx8sMiJ1T5FG_x_xt6Uc30fX_NkOLLu-QUvuyenXhvnYZv6QdHbyqsw8uiohhzRJs6OldzTsjmC8Jc25JWFEbRmRbZlFu9rcUI38KFr99-pARGS5nsX8yJ5qtCzmaS_McFBBZ_ihIZURxVPq-6QZZtNX4KjVd9NjlfYTvY4JmzROZ9rV53JUiOJxdMyuXkVuJZIn_EI-HUt4mw" /><div className="flex flex-col"><span className="font-headline-sm text-headline-sm text-primary leading-tight tracking-tight">Médic'Trans 972</span><span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">Régulation Sanitaire Martinique</span></div></div><nav className="hidden xl:flex items-center gap-space-xs" data-active-classes="bg-surface-container-high text-primary font-label-lg rounded-lg"><Link className="px-space-sm py-space-xs rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="accueil-presentation" to="/">Accueil &amp; Présentation</Link><Link className="px-space-sm py-space-xs rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="reserver-un-transport" to="/reserver">Réserver un transport</Link><Link className="px-space-sm py-space-xs rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="mes-demandes" to="/suivi">Mes Demandes</Link><Link className="px-space-sm py-space-xs rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="portail-etablissements" to="/etablissements">Portail Établissements</Link><Link className="px-space-sm py-space-xs rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all" data-path="espace-transporteurs" to="/transporteurs">Espace Transporteurs</Link></nav><div className="flex items-center gap-space-md"><div className="hidden sm:flex items-center gap-space-xs bg-secondary-container/30 px-space-sm py-space-xs rounded-full shadow-[0_1px_3px_rgba(11,37,69,0.05)]"><span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span><div className="flex flex-col leading-none"><span className="font-label-sm text-label-sm text-on-secondary-container font-bold uppercase">Astreinte 24/7</span><span className="font-label-sm text-label-sm text-on-surface-variant">Régulation Active</span></div></div><div className="flex items-center gap-space-sm pl-space-xs"><div className="hidden md:flex flex-col text-right"><span className="font-label-md text-label-md text-on-surface font-bold">Dr. V. Lamartine</span><span className="font-label-sm text-label-sm text-on-surface-variant">CHU Zobda-Quitman</span></div><img alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-[0_1px_3px_rgba(11,37,69,0.08)]" src="https://lh3.googleusercontent.com/aida/AEtjO1X2YA9RgvL3D8j-HMWVDW68IqlJvZuHDfkgLowkQ2bCiu-vTE0hjy2_vMPyH6btVnFPHqXHU5OMPILuQzBeLmuPP38I1DBdGlYkjhKuwhc50KzYsG3aC14uH2gedrKv4smQqB7xs0Hf1oio4tLtzfKCfYwr5WYtWu4AKSTEBX7wGufC653RKL5_r6n6fv8JY5CsvfTKvvWtYV2fSfIyp8um4rDnKxsk3Fh_lXEJCJwow3LIXBupq14MRZk" /></div></div></div></header><main className="w-full pt-20 bg-background min-h-screen"><div className="flex flex-col w-full">
<section className="relative w-full overflow-hidden bg-surface-container-low py-space-xl lg:py-margin-lg">
<div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
<div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-secondary/5 blur-2xl pointer-events-none"></div>
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative z-10">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
<div className="lg:col-span-7 flex flex-col gap-space-md">
<div className="inline-flex items-center gap-space-xs self-start px-space-sm py-1 rounded-full bg-surface-container-highest text-primary">
<span className="material-symbols-outlined text-[18px]">verified_user</span>
<span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">Plateforme Régulée ARS &amp; CGSS Martinique 972</span>
</div>
<h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-tight">
            Le réseau unifié de transport sanitaire et de soins en <span className="text-primary underline decoration-secondary decoration-4 underline-offset-4">Martinique</span>
</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Coordination insulaire d'urgence et programmée. Bénéficiez d'une prise en charge conventionnée de Grand'Rivière à Sainte-Anne, en liaison directe avec le SAMU Centre 15 et le CHU de Fort-de-France.
          </p>
<div className="flex flex-wrap items-center gap-space-md pt-space-xs">
<Link className="inline-flex items-center justify-center gap-space-xs px-space-lg py-space-md rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container hover:shadow-lg transition-all" to="/reserver">
<span className="material-symbols-outlined">calendar_month</span>
<span className="">Réserver un transport dès maintenant</span>
</Link>
<Link className="inline-flex items-center justify-center gap-space-xs px-space-lg py-space-md rounded-xl bg-surface-container-highest text-primary font-label-lg text-label-lg hover:bg-surface-container-high transition-all" to="/etablissements">
<span className="material-symbols-outlined">health_and_safety</span>
<span className="">Accès professionnels de santé</span>
</Link>
</div>
<div className="grid grid-cols-3 gap-space-md pt-space-md">
<div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
<span className="font-headline-md text-headline-md text-primary font-bold">34 / 34</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Communes desservies</span>
</div>
<div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
<span className="font-headline-md text-headline-md text-secondary font-bold">100%</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Tiers-payant ALD/CSS</span>
</div>
<div className="flex flex-col p-space-sm bg-surface-container-lowest rounded-lg shadow-sm">
<span className="font-headline-md text-headline-md text-tertiary font-bold">&lt; 15 min</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Attribution moyenne</span>
</div>
</div>
</div>
<div className="lg:col-span-5 relative">
<div className="relative w-full h-[420px] rounded-xl overflow-hidden shadow-xl bg-surface-container">
<img className="w-full h-full object-cover" data-alt="Photographie médicale lumineuse montrant un ambulancier soignant aidant chaleureusement un patient âgé aux Antilles en Martinique à monter dans un véhicule sanitaire blanc immaculé avec logo médical bleu, sous la lumière naturelle tropicale caribéenne, hôpital moderne en arrière-plan avec palmiers discrets." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDamWWiDC5RwwVxuFe7-T4E0Z2F4G_dC546jBKtTaFOs_y71tS9UQDJ8sOvwf04YxG3d3JdOYRwTtH3U271AicX2DGKX2rkyqE-4rHpHGSShRCBYoIO7M2bSi8ubv8S8_3TrxWwlXBNzl_kO9bYDpRQg_wwPDrk3p9Iuh91GJQmAtymJwBbLJElKocMj6oAq_j1cYGXBGAqatIE-yquyvrUzlBObZ9PqI0t3sJzBcNXLIoDsTzyxFB3" />
<div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/95 backdrop-blur-md p-space-md rounded-lg shadow-lg flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
<span className="material-symbols-outlined">hub</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-bold">Coordination H24</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Flux direct SAMU 972 / CGSS</span>
</div>
</div>
<span className="inline-flex items-center px-space-xs py-0.5 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-bold">
                Opérationnel
              </span>
</div>
</div>
</div>
</div>
</div>
</section>
<section className="w-full py-space-xl bg-surface">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
<div className="flex flex-col gap-space-xs max-w-xl">
<span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">Offre Sanitaire Territoriale</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Les 3 modes de transport conventionnés</h2>
<p className="font-body-md text-body-md text-on-surface-variant">
            Le mode de transport est strictement déterminé par votre état de santé et précisé sur votre Prescription Médicale de Transport (PMT).
          </p>
</div>
<div className="flex items-center gap-space-xs bg-surface-container-high px-space-md py-space-sm rounded-lg text-primary font-label-md text-label-md">
<span className="material-symbols-outlined">receipt_long</span>
<span className="">Prise en charge CPAM 972 subrogatoire</span>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-md">
<div className="flex flex-col bg-surface-container-lowest rounded-xl p-space-lg shadow-md hover:shadow-xl transition-shadow relative overflow-hidden group">
<div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary mb-space-md">
<span className="material-symbols-outlined text-[28px]">local_taxi</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider mb-space-xs">Patient Autonome</span>
<h3 className="font-headline-md text-headline-md text-on-surface mb-space-sm">Taxi Conventionné</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex-1">
            Dédié aux patients pouvant marcher seuls sans aide physique et se déplaçant pour des soins récurrents : chimiothérapie, radiothérapie, dialyse ou consultations spécialisées.
          </p>
<div className="space-y-space-xs pt-space-sm border-t border-surface-container mb-space-md">
<div className="flex items-center gap-space-xs text-on-surface text-body-sm font-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
<span className="">Position assise standard</span>
</div>
<div className="flex items-center gap-space-xs text-on-surface text-body-sm font-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
<span className="">Chimiothérapie / Hémodialyse</span>
</div>
<div className="flex items-center gap-space-xs text-on-surface text-body-sm font-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
<span className="">Agrément spécifique CPAM 972</span>
</div>
</div>
<Link className="w-full py-space-sm rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors text-center font-label-md text-label-md" to="/reserver">Sélectionner Taxi Conventionné</Link>
</div>
<div className="flex flex-col bg-surface-container-lowest rounded-xl p-space-lg shadow-md hover:shadow-xl transition-shadow relative overflow-hidden group">
<div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary mb-space-md">
<span className="material-symbols-outlined text-[28px]">accessible_forward</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider mb-space-xs">Aide Technique &amp; Transfert</span>
<h3 className="font-headline-md text-headline-md text-on-surface mb-space-sm">VSL (Véhicule Sanitaire Léger)</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex-1">
            Transport assis professionnalisé avec chauffeur formé aux gestes d'urgence. Requis lorsque le patient nécessite une aide à la marche, un portage d'étage ou une désinfection stricte.
          </p>
<div className="space-y-space-xs pt-space-sm border-t border-surface-container mb-space-md">
<div className="flex items-center gap-space-xs text-on-surface text-body-sm font-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
<span className="">Aide active au déplacement</span>
</div>
<div className="flex items-center gap-space-xs text-on-surface text-body-sm font-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
<span className="">Assistance administrative au bureau d'entrée</span>
</div>
<div className="flex items-center gap-space-xs text-on-surface text-body-sm font-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
<span className="">Hygiène sanitaire renforcée</span>
</div>
</div>
<Link className="w-full py-space-sm rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors text-center font-label-md text-label-md" to="/reserver">Sélectionner un VSL</Link>
</div>
<div className="flex flex-col bg-surface-container-lowest rounded-xl p-space-lg shadow-md hover:shadow-xl transition-shadow relative overflow-hidden group">
<div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary mb-space-md">
<span className="material-symbols-outlined text-[28px]">emergency</span>
</div>
<span className="font-label-sm text-label-sm text-error font-bold uppercase tracking-wider mb-space-xs">Surveillance &amp; Brancardage</span>
<h3 className="font-headline-md text-headline-md text-on-surface mb-space-sm">Ambulance (Cat. A, B, C)</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md flex-1">
            Transport allongé ou demi-assis sous la veille permanente d'un équipage titulaire du Diplôme d'État d'Ambulancier (DEA). Matériel d'oxygénothérapie et monitoring embarqué.
          </p>
<div className="space-y-space-xs pt-space-sm border-t border-surface-container mb-space-md">
<div className="flex items-center gap-space-xs text-on-surface text-body-sm font-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
<span className="">Brancardage complet et portage</span>
</div>
<div className="flex items-center gap-space-xs text-on-surface text-body-sm font-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
<span className="">Oxygène médical &amp; surveillance continue</span>
</div>
<div className="flex items-center gap-space-xs text-on-surface text-body-sm font-body-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
<span className="">Équipage diplômé d'État (DEA + Auxiliaire)</span>
</div>
</div>
<Link className="w-full py-space-sm rounded-lg bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors text-center font-label-md text-label-md" to="/reserver">Sélectionner une Ambulance</Link>
</div>
</div>
</div>
</section>
<section className="w-full py-space-xl bg-surface-container-low">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="flex flex-col gap-space-xs mb-space-lg">
<span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">Droits &amp; Formalités</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Vos démarches de prise en charge en Martinique</h2>
<p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
          Comprendre le circuit de remboursement et les pièces obligatoires pour une dispensation totale d'avance de frais.
        </p>
</div>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter-md">
<div className="flex flex-col bg-surface-container-lowest p-space-lg rounded-xl shadow-sm gap-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold font-label-md">1</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Prescription Médicale (PMT)</h3>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Le formulaire Cerfa 11574*05 doit impérativement être signé et daté par le praticien <strong>antérieurement au trajet</strong> (sauf convocation médicale d'urgence).
          </p>
<div className="mt-auto pt-space-sm bg-surface-container-low p-space-sm rounded-lg">
<span className="font-label-sm text-label-sm text-primary font-bold block mb-1">Règle d'or CGSS 972 :</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Aucun bon de transport ne peut être régularisé a posteriori pour convenance personnelle.</p>
</div>
</div>
<div className="flex flex-col bg-surface-container-lowest p-space-lg rounded-xl shadow-sm gap-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold font-label-md">2</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Tiers-Payant à 100%</h3>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Vous ne déboursez rien si vous relevez de l'un des régimes suivants : Affection Longue Durée (ALD exonérante), Accident du Travail / Maladie Professionnelle (AT/MP), Complémentaire Santé Solidaire (CSS), ou Maternité (&gt; 6e mois).
          </p>
<div className="mt-auto pt-space-sm bg-surface-container-low p-space-sm rounded-lg">
<span className="font-label-sm text-label-sm text-secondary font-bold block mb-1">Documents requis :</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Carte Vitale à jour + Attestation de droits papier mentionnant l'exonération.</p>
</div>
</div>
<div className="flex flex-col bg-surface-container-lowest p-space-lg rounded-xl shadow-sm gap-space-sm">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold font-label-md">3</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Accord Préalable (&gt;150 km / Série)</h3>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Pour les transports itératifs (au moins 4 trajets de plus de 50 km sur une période de 2 mois) ou les transferts sanitaires hors territoire, une demande d'entente préalable doit être soumise au service médical de la CGSS 972 sous 15 jours.
          </p>
<div className="mt-auto pt-space-sm bg-surface-container-low p-space-sm rounded-lg">
<span className="font-label-sm text-label-sm text-tertiary font-bold block mb-1">Assistance Médic'Trans :</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Notre centrale numérise et télétransmet directement votre volet médical.</p>
</div>
</div>
</div>
</div>
</section>
<section className="w-full py-space-xl bg-surface" id="etablissements">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
<div className="lg:col-span-5 flex flex-col gap-space-md">
<span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">Cartographie des Soins 972</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Maillage intégral des 34 communes de Martinique</h2>
<p className="font-body-md text-body-md text-on-surface-variant">
            Nos flottes coordonnées couvrent l'intégralité des bassins Nord-Atlantique, Nord-Caraïbe, Centre et Sud avec des points de stationnement permanent.
          </p>
<div className="space-y-space-sm mt-space-xs">
<div className="p-space-sm bg-surface-container-lowest rounded-lg shadow-sm flex items-start gap-space-sm">
<span className="material-symbols-outlined text-primary mt-1">local_hospital</span>
<div>
<h4 className="font-headline-sm text-headline-sm text-on-surface">CHU de Martinique (Fort-de-France)</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">Plateaux P. Zobda-Quitman, Maison de la Femme, Hôpital Pierre Nouveau.</p>
</div>
</div>
<div className="p-space-sm bg-surface-container-lowest rounded-lg shadow-sm flex items-start gap-space-sm">
<span className="material-symbols-outlined text-secondary mt-1">domain</span>
<div>
<h4 className="font-headline-sm text-headline-sm text-on-surface">Pôle Nord &amp; Atlantique</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">Hôpital Louis Domergue (Trinité), Centre Hospitalier de Saint-Pierre, Carbet.</p>
</div>
</div>
<div className="p-space-sm bg-surface-container-lowest rounded-lg shadow-sm flex items-start gap-space-sm">
<span className="material-symbols-outlined text-tertiary mt-1">apartment</span>
<div>
<h4 className="font-headline-sm text-headline-sm text-on-surface">Pôle Sud &amp; Cliniques Conventionnées</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">Hôpital de Proximité du Marin, Clinique Sainte-Marie (Schoelcher), Saint-Esprit.</p>
</div>
</div>
</div>
</div>
<div className="lg:col-span-7 flex flex-col gap-space-sm">
<div className="w-full h-96 rounded-xl shadow-lg bg-cover bg-center overflow-hidden relative" data-location="CHU Fort-de-France, Martinique" >
<div className="absolute top-4 left-4 bg-surface-container-lowest/90 backdrop-blur-md px-space-sm py-1 rounded-lg text-primary font-label-sm text-label-sm font-bold shadow-md flex items-center gap-space-xs">
<span className="material-symbols-outlined text-[16px]">pin_drop</span>
<span className="">Couverture active SAMU / SAS 972</span>
</div>
</div>
<div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm px-space-xs">
<span className="">Réseau : Fort-de-France • Le Lamentin • Schoelcher • Ducos • Le François • Sainte-Luce • Saint-Pierre</span>
<span className="text-secondary font-bold">34 Communes Actives</span>
</div>
</div>
</div>
</div>
</section>
<section className="w-full py-space-xl bg-surface-container-low" id="reserver">
<div className="max-w-[1000px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="bg-surface-container-lowest rounded-2xl shadow-xl p-space-lg lg:p-space-xl">
<div className="flex flex-col text-center items-center gap-space-xs mb-space-lg">
<span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">Formulaire Régulé Express</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Réserver un transport sanitaire</h2>
<p className="font-body-md text-body-md text-on-surface-variant max-w-lg">
            Saisissez vos informations pour un aiguillage immédiat vers nos transporteurs partenaires disponibles.
          </p>
</div>
<form className="grid grid-cols-1 md:grid-cols-2 gap-space-md" >
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface">Nom et Prénom du patient</label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md outline-none focus:bg-surface-container-highest transition-colors" placeholder="ex: Céleste Émilie" required type="text" />
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface">N° Sécurité Sociale (13 ou 15 chiffres)</label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md outline-none focus:bg-surface-container-highest transition-colors" placeholder="ex: 2 85 06 97 2..." required type="text" />
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface">Lieu de prise en charge (Commune Martinique)</label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md outline-none focus:bg-surface-container-highest transition-colors" placeholder="ex: 12 Rue des Flamboyants, Schoelcher" required type="text" />
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface">Établissement de destination</label>
<select className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md outline-none focus:bg-surface-container-highest transition-colors" required>
<option value="">Sélectionnez l'établissement...</option>
<option>CHU Pierre Zobda-Quitman (Fort-de-France)</option>
<option>Maison de la Femme de la Mère et de l'Enfant (MFME)</option>
<option>Hôpital Louis Domergue (La Trinité)</option>
<option>Hôpital de Proximité du Marin</option>
<option>Clinique Sainte-Marie (Schoelcher)</option>
<option>Centre de Rééducation du Carbet</option>
<option>Centre de Dialyse Lamentin</option>
<option>Autre cabinet médical / spécialiste</option>
</select>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface">Type de véhicule prescrit (PMT)</label>
<select className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md outline-none focus:bg-surface-container-highest transition-colors" required>
<option value="taxi">Taxi Conventionné (Assis autonome)</option>
<option value="vsl">VSL (Assis avec aide à la marche / portage)</option>
<option value="ambulance">Ambulance (Couché / demi-assis sous oxygène)</option>
</select>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface">Date et heure du rendez-vous</label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md outline-none focus:bg-surface-container-highest transition-colors" required type="datetime-local" />
</div>
<div className="md:col-span-2 flex items-center gap-space-sm p-space-sm bg-surface-container-high rounded-lg">
<input className="w-4 h-4 rounded text-primary" id="pmtCheck" required type="checkbox" />
<label className="font-body-sm text-body-sm text-on-surface-variant cursor-pointer" htmlFor="pmtCheck">
              Je confirme détenir une <strong>Prescription Médicale de Transport (PMT)</strong> signée par un médecin avant le transport pour bénéficier du Tiers-Payant.
            </label>
</div>
<div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-sm">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-secondary">lock</span>
<span className="">Données chiffrées selon la norme HDS</span>
</div>
<button className="w-full sm:w-auto px-space-xl py-space-md rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary-container transition-all" type="submit">
              Valider et rechercher un véhicule
            </button>
</div>
</form>
</div>
</div>
</section>
<section className="w-full py-space-xl bg-surface">
<div className="max-w-[1000px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="flex flex-col items-center text-center gap-space-xs mb-space-lg">
<span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">Aide &amp; Renseignements</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Questions Fréquentes (FAQ Patients &amp; Familles)</h2>
</div>
<div className="space-y-space-sm">
<details className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm group">
<summary className="flex items-center justify-between font-headline-sm text-headline-sm text-on-surface cursor-pointer list-none">
<span className="">Quel est le délai recommandé pour réserver un transport programmé ?</span>
<span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<p className="font-body-sm text-body-sm text-on-surface-variant pt-space-sm leading-relaxed">
            Pour les consultations simples et bilans hospitaliers, il est conseillé de réserver <strong>24 à 48 heures à l'avance</strong>. Pour les protocoles chroniques de radiothérapie ou d'hémodialyse, la planification peut s'effectuer dès remise du calendrier médical auprès de notre régulateur.
          </p>
</details>
<details className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm group">
<summary className="flex items-center justify-between font-headline-sm text-headline-sm text-on-surface cursor-pointer list-none">
<span className="">Un proche ou accompagnateur peut-il voyager avec le patient ?</span>
<span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<p className="font-body-sm text-body-sm text-on-surface-variant pt-space-sm leading-relaxed">
            Oui, un accompagnateur est systématiquement autorisé et pris en charge pour un <strong>enfant mineur (moins de 16 ans)</strong> ou pour une personne en situation de perte d'autonomie majeure dont la PMT spécifie la présence indispensable d'un tiers aidant.
          </p>
</details>
<details className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm group">
<summary className="flex items-center justify-between font-headline-sm text-headline-sm text-on-surface cursor-pointer list-none">
<span className="">Puis-je emporter mon fauteuil roulant pliant et mes bagages ?</span>
<span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<p className="font-body-sm text-body-sm text-on-surface-variant pt-space-sm leading-relaxed">
            Absolument. Nos VSL et taxis conventionnés possèdent les volumes nécessaires pour embarquer un fauteuil roulant pliable, un déambulateur et un sac de séjour hospitalier. Veuillez le signaler lors de la confirmation pour adapter le gabarit du véhicule.
          </p>
</details>
<details className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm group">
<summary className="flex items-center justify-between font-headline-sm text-headline-sm text-on-surface cursor-pointer list-none">
<span className="">Comment procéder en cas de détresse vitale ou d'urgence non programmée ?</span>
<span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<p className="font-body-sm text-body-sm text-on-surface-variant pt-space-sm leading-relaxed">
            En situation d'urgence vitale, ne passez pas par une réservation programmée : composez immédiatement le <strong>15 (SAMU 972)</strong> ou le <strong>112</strong> depuis votre mobile. Le médecin régulateur du SAMU déclenchera une ambulance d'urgence ou le SMUR selon la gravité clinique.
          </p>
</details>
</div>
<div className="mt-space-xl p-space-lg rounded-xl bg-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-[24px]">support_agent</span>
</div>
<div>
<span className="font-headline-sm text-headline-sm text-on-surface block">Besoin d'une assistance directe ?</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Nos régulateurs sont disponibles 24h/24 pour guider votre prise en charge.</span>
</div>
</div>
<a className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-label-md text-label-md whitespace-nowrap shadow-sm hover:bg-primary-container transition-all" href="tel:0596552000">
<span className="material-symbols-outlined text-[18px]">phone</span>
<span className="">05 96 55 20 00</span>
</a>
</div>
</div>
</section>
</div></main><footer className="w-full bg-surface-container-lowest shadow-[0_1px_8px_rgba(11,37,69,0.04)] py-space-xl"><div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter-lg mb-space-xl"><div className="flex flex-col gap-space-sm"><div className="flex items-center gap-space-xs"><img alt="Brand logo. - Primary color: #0b5c9e
- Font: plusJakartaSans
- Mode: light
- Roundness: rounded-md
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1XfD3evNv8jpKEQassyB67JCw2Z0av_XyxFzLWrX7T_Xx8sMiJ1T5FG_x_xt6Uc30fX_NkOLLu-QUvuyenXhvnYZv6QdHbyqsw8uiohhzRJs6OldzTsjmC8Jc25JWFEbRmRbZlFu9rcUI38KFr99-pARGS5nsX8yJ5qtCzmaS_McFBBZ_ihIZURxVPq-6QZZtNX4KjVd9NjlfYTvY4JmzROZ9rV53JUiOJxdMyuXkVuJZIn_EI-HUt4mw" /><span className="font-headline-sm text-headline-sm text-primary font-bold">Médic'Trans 972</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Dispositif territorial de coordination et régulation des transports sanitaires d'urgence et programmés de l'île de la Martinique.</p><div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md"><span className="material-symbols-outlined text-[18px]">verified</span><span className="">Opérateur Conventionné ARS Martinique</span></div></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Régulation &amp; Urgences 972</h3><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-primary">phone_in_talk</span><span className="font-bold text-on-surface">05 96 55 20 00</span> (Ligne directe 24/7)</li><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-secondary">support_agent</span>SAMU Centre 15 Martinique</li><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-on-surface-variant">mail</span>coordination@medictrans972.fr</li><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-on-surface-variant">location_on</span>Plateau Technique, CHU Zobda-Quitman, 97200 Fort-de-France</li></ul></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Pôles Hospitaliers Desservis</h3><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="">CHU de Martinique (Zobda-Quitman / Mère-Enfant)</li><li className="">Hôpital Louis Domergue (La Trinité)</li><li className="">Hôpital du Saint-Esprit &amp; Pôle Sud Martinique</li><li className="">Clinique Sainte-Marie (Schoelcher)</li><li className="">Centre de Convalescence du Carbet</li></ul></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Cadre Légal &amp; Conformité</h3><div className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><div className="bg-surface-container-low p-space-sm rounded-lg"><span className="font-label-md text-label-md text-primary font-bold block">CPAM Martinique 972</span><span className="font-label-sm text-label-sm">Télétransmission BBD &amp; PECSE Titre Subrogatoire</span></div><div className="bg-surface-container-low p-space-sm rounded-lg"><span className="font-label-md text-label-md text-secondary font-bold block">Agrément ARS N° 972-2024-SAN</span><span className="font-label-sm text-label-sm">Ambulances Catégorie A &amp; VSL Catégorie D</span></div></div></div></div><div className="pt-space-md bg-surface-container-low/50 rounded-lg p-space-md flex flex-col md:flex-row items-center justify-between gap-space-md"><span className="font-body-sm text-body-sm text-on-surface-variant">© 2024 Médic'Trans Martinique (972). Tous droits réservés. <a className="hover:text-primary transition-colors underline ml-1" href="#">Mentions légales</a></span></div></div></footer>


    </div>
  );
};
