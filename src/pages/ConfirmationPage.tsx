import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const ConfirmationPage: React.FC = () => {
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
<div className="max-w-[1280px] w-full mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-md lg:py-space-xl flex flex-col gap-space-lg">

<section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md md:p-space-lg">
<div className="flex flex-col md:flex-row items-center justify-between gap-space-md">

<div className="flex items-center gap-space-sm w-full md:w-auto">
<div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
<span className="material-symbols-outlined text-[20px]" >check</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">Étape 01</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Trajet validé</span>
</div>
</div>
<div className="hidden md:block h-0.5 flex-1 mx-space-md bg-secondary/30 rounded-full"></div>

<div className="flex items-center gap-space-sm w-full md:w-auto">
<div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
<span className="material-symbols-outlined text-[20px]" >check</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">Étape 02</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Patient &amp; PMT</span>
</div>
</div>
<div className="hidden md:block h-0.5 flex-1 mx-space-md bg-secondary/30 rounded-full"></div>

<div className="flex items-center gap-space-sm w-full md:w-auto">
<div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md animate-pulse">
<span className="material-symbols-outlined text-[20px]">task_alt</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Étape 03</span>
<span className="font-headline-sm text-headline-sm text-primary font-bold">Confirmation active</span>
</div>
</div>
</div>
</section>

<section className="bg-gradient-to-r from-primary via-primary-container to-primary text-on-primary rounded-xl p-space-md md:p-space-lg shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md relative overflow-hidden">
<div className="flex items-start gap-space-md relative z-10">
<div className="p-space-sm bg-on-primary/10 rounded-xl backdrop-blur-md">
<span className="material-symbols-outlined text-[36px] text-secondary-fixed">verified</span>
</div>
<div className="flex flex-col">
<div className="flex flex-wrap items-center gap-space-xs">
<span className="font-label-sm text-label-sm bg-secondary px-space-xs py-0.5 rounded text-on-secondary font-bold tracking-wider uppercase">Dossier Validé</span>
<span className="font-label-sm text-label-sm text-surface-container-high tracking-wider">Plateforme ARS 972</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-primary mt-1">Demande n° MT-972-8821 enregistrée avec succès !</h1>
<p className="font-body-sm text-body-sm text-surface-variant max-w-2xl mt-0.5">Le dossier médical et les garanties de couverture subrogatoire CPAM ont été télétransmis au serveur de dispatch territorial.</p>
</div>
</div>
<div className="bg-surface-container-lowest/15 backdrop-blur-md rounded-lg p-space-sm flex items-center gap-space-sm self-stretch md:self-auto relative z-10 shadow-sm">
<div className="w-3 h-3 rounded-full bg-secondary-fixed animate-ping"></div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-surface-container-high uppercase">Régulation live</span>
<span className="font-label-md text-label-md text-on-primary font-bold">Centre 15 &amp; Médic'Trans</span>
</div>
</div>
</section>

<div className="bg-surface-container-high rounded-xl p-space-md shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-sm">
<div className="relative flex items-center justify-center">
<span className="material-symbols-outlined text-[28px] text-secondary">broadcast_on_personal</span>
<span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-secondary"></span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Réseau Opérationnel Martinique</span>
<p className="font-headline-sm text-headline-sm text-on-surface">Demande diffusée à <span className="text-primary font-bold">18 transporteurs sanitaires agréés</span></p>
<span className="font-body-sm text-body-sm text-on-surface-variant">Zone prioritaire : Secteur Fort-de-France / Le Lamentin / Schoelcher</span>
</div>
</div>
<div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-md py-space-xs rounded-lg shadow-sm">
<span className="material-symbols-outlined text-[20px] text-secondary animate-spin">sync</span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Attribution en cours (1/18)</span>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">

<div className="lg:col-span-8 flex flex-col gap-space-lg">

<div className="bg-surface-container-lowest rounded-xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-[24px] text-primary">person</span>
<h2 className="font-headline-md text-headline-md text-on-surface">Bénéficiaire du transport</h2>
</div>
<span className="bg-secondary-container/40 text-on-secondary-container px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-secondary"></span> ALD 100% Exonérante
            </span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-md">
<div className="flex flex-col p-space-sm rounded-lg bg-surface-container-low">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Identité Patient</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Aimé GLISSANT</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">70 ans (Né le 12/04/1954)</span>
</div>
<div className="flex flex-col p-space-sm rounded-lg bg-surface-container-low">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">N° Sécurité Sociale (NIR)</span>
<span className="font-label-lg text-label-lg font-bold text-on-surface tracking-wide">1 54 08 97 213 456 82</span>
<span className="font-body-sm text-body-sm text-secondary font-bold">Régime Général - CGSS 972</span>
</div>
<div className="flex flex-col p-space-sm rounded-lg bg-surface-container-low">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Type de véhicule prescrit</span>
<div className="flex items-center gap-1">
<span className="material-symbols-outlined text-[20px] text-primary">directions_car</span>
<span className="font-headline-sm text-headline-sm text-primary font-bold">VSL Conventionné</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Trajet Aller &amp; Retour</span>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-[24px] text-primary">route</span>
<h2 className="font-headline-md text-headline-md text-on-surface">Détails de l'itinéraire sanitaire</h2>
</div>
<span className="font-label-md text-label-md text-primary font-bold bg-surface-container-high px-space-sm py-1 rounded-lg">Mardi 24 Octobre 2024</span>
</div>

<div className="flex flex-col sm:flex-row items-center justify-between p-space-sm bg-surface-container-low rounded-lg gap-space-sm">
<div className="flex items-center gap-space-sm">
<div className="p-space-xs rounded-md bg-primary text-on-primary">
<span className="material-symbols-outlined text-[22px]">schedule</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Rendez-vous départ</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Prise en charge à 08h30</span>
</div>
</div>
<div className="h-6 w-px bg-surface-variant hidden sm:block"></div>
<div className="flex items-center gap-space-sm">
<div className="p-space-xs rounded-md bg-secondary text-on-secondary">
<span className="material-symbols-outlined text-[22px]">event_available</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Convocation médicale</span>
<span className="font-headline-sm text-headline-sm text-secondary font-bold">Séance d'hémodialyse 09h00</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">

<div className="p-space-md bg-surface-container-low/60 rounded-xl flex flex-col justify-between gap-space-sm">
<div className="flex items-start gap-space-sm">
<div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold shadow-sm">
<span className="material-symbols-outlined text-[18px]">home_pin</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Point de Départ (Domicile)</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Résidence Les Almadies</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Bâtiment B, Apt 14 (Rez-de-chaussée)</span>
<span className="font-label-md text-label-md text-primary font-bold mt-1">97233 Schoelcher</span>
</div>
</div>
<div className="text-on-surface-variant font-body-sm text-body-sm bg-surface-container-lowest p-space-xs rounded flex items-center gap-1 mt-2">
<span className="material-symbols-outlined text-[16px] text-secondary">info</span>
<span className="">Accès direct via Allée des Hibiscus</span>
</div>
</div>

<div className="p-space-md bg-surface-container-low/60 rounded-xl flex flex-col justify-between gap-space-sm">
<div className="flex items-start gap-space-sm">
<div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary font-bold shadow-sm">
<span className="material-symbols-outlined text-[18px]">local_hospital</span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Destination Spécialisée</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Centre d'Hémodialyse Dillon</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Service de Néphrologie - Entrée Sanitaire Nord</span>
<span className="font-label-md text-label-md text-secondary font-bold mt-1">97200 Fort-de-France</span>
</div>
</div>
<div className="text-on-surface-variant font-body-sm text-body-sm bg-surface-container-lowest p-space-xs rounded flex items-center gap-1 mt-2">
<span className="material-symbols-outlined text-[16px] text-primary">local_parking</span>
<span className="">Dépose-minute réservée ambulances &amp; VSL</span>
</div>
</div>
</div>

<div className="relative w-full h-56 rounded-xl overflow-hidden shadow-inner">
<div className="w-full h-full bg-cover bg-center" data-location="Schoelcher to Dillon Fort-de-France Martinique" ></div>
<div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-space-sm py-1 rounded-lg text-on-surface flex items-center gap-space-xs shadow-md">
<span className="material-symbols-outlined text-[18px] text-primary">near_me</span>
<span className="font-label-md text-label-md font-bold">Distance : 7,4 km · Env. 18 min via Rocade N2</span>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-[24px] text-primary">description</span>
<h2 className="font-headline-md text-headline-md text-on-surface">Prescription Médicale de Transport (PMT)</h2>
</div>
<span className="font-label-sm text-label-sm bg-secondary-container/50 text-on-secondary-container px-space-sm py-0.5 rounded font-bold">
              Télétransmission Valide
            </span>
</div>
<div className="flex flex-col md:flex-row items-center justify-between p-space-md bg-surface-container-low rounded-xl gap-space-md">
<div className="flex items-center gap-space-md w-full md:w-auto">
<div className="p-space-sm rounded-lg bg-error-container text-on-error-container flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]">picture_as_pdf</span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">PMT_Signee_Dr_Lafontaine.pdf</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Signature électronique certifiée · Réf : MED-972-00412</span>
<span className="font-label-sm text-label-sm text-primary font-bold">Prescripteur : Dr. Lafontaine (Néphrologie CHU)</span>
</div>
</div>
<div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-1">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Reste à charge patient</span>
<span className="font-headline-lg text-headline-lg text-secondary font-bold">0,00 €</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Tiers-payant intégral 100% CPAM</span>
</div>
</div>
</div>
</div>

<div className="lg:col-span-4 flex flex-col gap-space-md">

<div className="bg-surface-container-lowest rounded-xl p-space-md md:p-space-lg shadow-sm flex flex-col gap-space-md">
<h2 className="font-headline-md text-headline-md text-on-surface">Actions &amp; Suivi</h2>
<div className="flex flex-col gap-space-sm">

<a className="w-full bg-primary hover:bg-primary-container text-on-primary py-space-md px-space-md rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-space-xs shadow-md transition-all" href="#">
<span className="material-symbols-outlined text-[22px]">monitoring</span>
<span className="">Suivre en temps réel</span>
</a>

<button className="w-full bg-surface-container-low hover:bg-surface-container text-primary py-space-sm px-space-md rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-space-xs transition-all">
<span className="material-symbols-outlined text-[20px]">download</span>
<span className="">Télécharger le récapitulatif PDF</span>
</button>
<button className="w-full bg-surface-container-low hover:bg-surface-container text-on-surface py-space-sm px-space-md rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-space-xs transition-all">
<span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
<span className="">Ajouter au calendrier (Google / Apple)</span>
</button>
<button className="w-full bg-surface-container-low hover:bg-error-container/40 text-error py-space-sm px-space-md rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-space-xs transition-all">
<span className="material-symbols-outlined text-[20px]">edit_calendar</span>
<span className="">Modifier ou Annuler sans frais</span>
</button>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
<div className="flex items-center gap-space-xs text-primary">
<span className="material-symbols-outlined text-[24px]">sms</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Notifications du trajet</h3>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Un <strong className="text-on-surface">SMS de confirmation</strong> avec le numéro d'immatriculation et l'heure précise d'arrivée du véhicule vous sera transmis dès l'attribution finale par un chauffeur du réseau Martinique.
          </p>
<div className="p-space-sm rounded-lg bg-surface-container-low flex items-center gap-space-sm">
<span className="material-symbols-outlined text-[24px] text-secondary">phone_iphone</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Numéro de contact enregistré</span>
<span className="font-label-lg text-label-lg text-on-surface font-bold">06 96 •• •• 42</span>
</div>
</div>
</div>

<div className="bg-surface-container-high rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
<div className="flex items-center gap-space-xs text-primary">
<span className="material-symbols-outlined text-[24px]">support_agent</span>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">Assistance Régulation 972</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Une question ou un retard imprévu ? Les régulateurs du plateau territorial sont joignables 24h/24.
          </p>
<a className="mt-space-xs p-space-sm rounded-lg bg-surface-container-lowest flex items-center justify-center gap-space-sm text-primary hover:text-primary-container shadow-sm transition-colors" href="tel:0596720097">
<span className="material-symbols-outlined text-[22px] text-secondary">call</span>
<span className="font-headline-sm text-headline-sm font-bold">05 96 72 00 97</span>
</a>
<span className="font-label-sm text-label-sm text-center text-on-surface-variant">Appel gratuit depuis la Martinique</span>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center gap-space-sm">
<img className="w-12 h-12 rounded-full object-cover" data-alt="A professional medical transport assistant smiling in uniform standing by a medical ambulance vehicle under bright daylight in Martinique, conveying trust, safety, and clinical professionalism." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbYubnmBr6OUi_xRN3d1S69y7zs2JwH9oV1EGzEe5TwVGR12BlPX9l7RP5iGc_w2_EYo-2Wc52jx-OpFyXxJAhSLf6WQ8NuO8nkLyJSIXrYnSGf7oJY87HhxdWFgJ01ihEybNc8z_JWkyb1rQdXRMvmK0MrQyM4iRHlA4NOryupvq3EdmvqpHYbonQRO_N50UipRbDmdI85WmhEuaLR8PZqMv5f2YXO3tKwC3kjEd1Sqg8qy63aSmp" />
<div className="flex flex-col">
<span className="font-label-md text-label-md font-bold text-on-surface">Prise en charge personnalisée</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Aide à la marche et accompagnement jusqu'au box de soin.</span>
</div>
</div>
</div>
</div>
</div>
</div></main><footer className="w-full bg-surface-container-lowest shadow-[0_1px_8px_rgba(11,37,69,0.04)] py-space-xl"><div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter-lg mb-space-xl"><div className="flex flex-col gap-space-sm"><div className="flex items-center gap-space-xs"><img alt="Brand logo. - Primary color: #0b5c9e
- Font: plusJakartaSans
- Mode: light
- Roundness: rounded-md
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1XfD3evNv8jpKEQassyB67JCw2Z0av_XyxFzLWrX7T_Xx8sMiJ1T5FG_x_xt6Uc30fX_NkOLLu-QUvuyenXhvnYZv6QdHbyqsw8uiohhzRJs6OldzTsjmC8Jc25JWFEbRmRbZlFu9rcUI38KFr99-pARGS5nsX8yJ5qtCzmaS_McFBBZ_ihIZURxVPq-6QZZtNX4KjVd9NjlfYTvY4JmzROZ9rV53JUiOJxdMyuXkVuJZIn_EI-HUt4mw" /><span className="font-headline-sm text-headline-sm text-primary font-bold">Médic'Trans 972</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Dispositif territorial de coordination et régulation des transports sanitaires d'urgence et programmés de l'île de la Martinique.</p><div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md"><span className="material-symbols-outlined text-[18px]">verified</span><span className="">Opérateur Conventionné ARS Martinique</span></div></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Régulation &amp; Urgences 972</h3><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-primary">phone_in_talk</span><span className="font-bold text-on-surface">05 96 55 20 00</span> (Ligne directe 24/7)</li><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-secondary">support_agent</span>SAMU Centre 15 Martinique</li><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-on-surface-variant">mail</span>coordination@medictrans972.fr</li><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-on-surface-variant">location_on</span>Plateau Technique, CHU Zobda-Quitman, 97200 Fort-de-France</li></ul></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Pôles Hospitaliers Desservis</h3><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="">CHU de Martinique (Zobda-Quitman / Mère-Enfant)</li><li className="">Hôpital Louis Domergue (La Trinité)</li><li className="">Hôpital du Saint-Esprit &amp; Pôle Sud Martinique</li><li className="">Clinique Sainte-Marie (Schoelcher)</li><li className="">Centre de Convalescence du Carbet</li></ul></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Cadre Légal &amp; Conformité</h3><div className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><div className="bg-surface-container-low p-space-sm rounded-lg"><span className="font-label-md text-label-md text-primary font-bold block">CPAM Martinique 972</span><span className="font-label-sm text-label-sm">Télétransmission BBD &amp; PECSE Titre Subrogatoire</span></div><div className="bg-surface-container-low p-space-sm rounded-lg"><span className="font-label-md text-label-md text-secondary font-bold block">Agrément ARS N° 972-2024-SAN</span><span className="font-label-sm text-label-sm">Ambulances Catégorie A &amp; VSL Catégorie D</span></div></div></div></div><div className="pt-space-md bg-surface-container-low/50 rounded-lg p-space-md flex flex-col md:flex-row items-center justify-between gap-space-md"><span className="font-body-sm text-body-sm text-on-surface-variant">© 2024 Médic'Trans Martinique (972). Tous droits réservés.</span><div className="flex items-center gap-space-md font-label-md text-label-md text-on-surface-variant"><a className="hover:text-primary transition-colors" href="#">Mentions légales</a></div></div></div></footer>


    </div>
  );
};
