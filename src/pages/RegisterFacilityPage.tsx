import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const RegisterFacilityPage: React.FC = () => {
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
      <Header />
      <main className="w-full pt-20 bg-surface"><div className="flex flex-col w-full">

<div className="relative w-full overflow-hidden">
<div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-primary/10 via-secondary/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

<div className="max-w-[1280px] mx-auto px-margin lg:px-margin-lg pt-space-lg pb-space-md">
<div className="flex flex-col items-start gap-space-xs max-w-3xl">
<div className="inline-flex items-center gap-space-xs bg-primary-fixed px-space-sm py-space-xs rounded-full shadow-sm">
<span className="material-symbols-outlined text-on-primary-fixed text-sm" >local_hospital</span>
<span className="font-label-sm text-label-sm text-on-primary-fixed uppercase tracking-wider">Portail Établissements de Soins &amp; Cadres de Santé</span>
</div>
<h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mt-space-xs">
          Conventionnez votre Établissement de Soins sur Médic'Trans <span className="text-primary-container">972</span>
</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          Optimisez les sorties d'hospitalisation, transferts inter-sites et transports de dialyse ou chimiothérapie sans surcharge pour vos équipes soignantes en Martinique.
        </p>

<div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
<div className="flex items-center gap-space-xs bg-surface-container-high px-space-sm py-space-xs rounded-lg text-on-surface">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="font-label-md text-label-md">Accès 100% sans frais pour le personnel soignant</span>
</div>
<div className="flex items-center gap-space-xs bg-surface-container-high px-space-sm py-space-xs rounded-lg text-on-surface">
<span className="material-symbols-outlined text-secondary text-sm">verified_user</span>
<span className="font-label-md text-label-md">Agrément ARS Martinique &amp; HDS</span>
</div>
</div>
</div>
</div>
</div>

<div className="max-w-[1280px] mx-auto px-margin lg:px-margin-lg pb-space-xl w-full">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">

<div className="lg:col-span-7 flex flex-col gap-space-lg">

<div className="bg-surface-container-lowest rounded-xl p-space-md lg:p-space-lg shadow-md flex flex-col gap-space-lg">

<div className="flex flex-col gap-space-sm pb-space-sm bg-surface-container-low p-space-md rounded-lg">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">Parcours d'activation territorial</span>
<span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Étape 1 sur 3</span>
</div>
<div className="grid grid-cols-3 gap-space-xs pt-space-xs">

<div className="flex items-center gap-space-xs">
<div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md shrink-0">1</div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md text-primary font-bold truncate">Établissement</span>
<span className="font-label-sm text-label-sm text-secondary truncate">En cours</span>
</div>
</div>

<div className="flex items-center gap-space-xs opacity-75">
<div className="w-7 h-7 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-label-md text-label-md shrink-0">2</div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md text-on-surface truncate">Services &amp; Soins</span>
<span className="font-label-sm text-label-sm text-on-surface-variant truncate">Paramétrage</span>
</div>
</div>

<div className="flex items-center gap-space-xs opacity-75">
<div className="w-7 h-7 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-label-md text-label-md shrink-0">3</div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md text-on-surface truncate">Comptes Cadres</span>
<span className="font-label-sm text-label-sm text-on-surface-variant truncate">Accréditations</span>
</div>
</div>
</div>
<div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mt-space-xs">
<div className="bg-primary h-full w-1/3 rounded-full transition-all duration-300"></div>
</div>
</div>
<form className="flex flex-col gap-space-lg" id="hospitalOnboardingForm" >

<div className="flex flex-col gap-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-lg">domain</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Typologie de votre structure médicale</h2>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Sélectionnez la catégorie conventionnelle régie par l'Agence Régionale de Santé (ARS).</p>
<div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm pt-space-xs" id="typologySelector">
<button className="group p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex flex-col gap-space-xs transition-all ring-inset typology-pill active-pill shadow-sm"  type="button">
<div className="flex items-center justify-between w-full">
<span className="material-symbols-outlined text-primary text-xl">apartment</span>
<span className="material-symbols-outlined text-secondary text-sm check-indicator">check_circle</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">CHU / CH Public</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Ex: Fort-de-France, Trinité</span>
</button>
<button className="group p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex flex-col gap-space-xs transition-all ring-inset typology-pill"  type="button">
<div className="flex items-center justify-between w-full">
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-xl">medical_services</span>
<span className="material-symbols-outlined text-secondary text-sm check-indicator hidden">check_circle</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">Clinique MCO</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Médecine Chirurgie Obs.</span>
</button>
<button className="group p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex flex-col gap-space-xs transition-all ring-inset typology-pill"  type="button">
<div className="flex items-center justify-between w-full">
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-xl">water_drop</span>
<span className="material-symbols-outlined text-secondary text-sm check-indicator hidden">check_circle</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">Centre Dialyse</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Néphrologie &amp; Séances</span>
</button>
<button className="group p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex flex-col gap-space-xs transition-all ring-inset typology-pill"  type="button">
<div className="flex items-center justify-between w-full">
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-xl">accessible_forward</span>
<span className="material-symbols-outlined text-secondary text-sm check-indicator hidden">check_circle</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">SSR / Rééducation</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Soins de Suite &amp; Réadaptation</span>
</button>
<button className="group p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex flex-col gap-space-xs transition-all ring-inset typology-pill"  type="button">
<div className="flex items-center justify-between w-full">
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-xl">elderly</span>
<span className="material-symbols-outlined text-secondary text-sm check-indicator hidden">check_circle</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">EHPAD / USLD</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Résidence médicalisée</span>
</button>
<button className="group p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-left flex flex-col gap-space-xs transition-all ring-inset typology-pill"  type="button">
<div className="flex items-center justify-between w-full">
<span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-xl">radiology</span>
<span className="material-symbols-outlined text-secondary text-sm check-indicator hidden">check_circle</span>
</div>
<span className="font-label-md text-label-md text-on-surface font-semibold">Oncologie / Radio</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Chimiothérapie récurrente</span>
</button>
</div>
</div>

<div className="flex flex-col gap-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-lg">badge</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Identification Administrative &amp; Géolocalisation</h2>
</div>
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="etabName">Nom Officiel de la Structure de Soins <span className="text-error">*</span></label>
<input className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" defaultValue="CHU de Martinique - Hôpital Pierre Zobda-Quitman" id="etabName" placeholder="Ex: Centre Hospitalier Universitaire de Martinique - Site Pierre Zobda-Quitman" required type="text" />
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="finessGeo">N° FINESS Géographique (9 chiffres) <span className="text-error">*</span></label>
<input className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" defaultValue="970211145" id="finessGeo" maxLength={9} placeholder="970200000" required type="text" />
</div>
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="siret">Numéro SIRET (14 chiffres) <span className="text-error">*</span></label>
<input className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" defaultValue="26972008500018" id="siret" maxLength={14} placeholder="26972000000000" required type="text" />
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
<div className="md:col-span-2 flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="commune">Commune d'implantation en Martinique <span className="text-error">*</span></label>
<select className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" defaultValue="Fort-de-France" id="commune">
<option value="Fort-de-France">Fort-de-France (97200)</option>
<option value="La Trinité">La Trinité (97220)</option>
<option value="Le Marin">Le Marin (97290)</option>
<option value="Schoelcher">Schoelcher (97233)</option>
<option value="Le Lamentin">Le Lamentin (97232)</option>
<option value="Saint-Pierre">Saint-Pierre (97250)</option>
<option value="Le Robert">Le Robert (97231)</option>
<option value="Ducos">Ducos (97224)</option>
<option value="Sainte-Marie">Sainte-Marie (97230)</option>
<option value="Autre">Autre commune 972</option>
</select>
</div>
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="codePostal">Code Postal <span className="text-error">*</span></label>
<input className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" defaultValue="97200" id="codePostal" required type="text" />
</div>
</div>
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="pickupPoint">Point d'Enlèvement &amp; Sas Ambulancier Précis <span className="text-error">*</span></label>
<input className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" defaultValue="Quai Ambulances - Niveau 0, Sas Régulation Urgences" id="pickupPoint" placeholder="Ex: Hall Principal / Quai Ambulances - Sas Urgences Adultes / Bâtiment Femme-Mère-Enfant" required type="text" />
<span className="font-label-sm text-label-sm text-on-surface-variant">Cette consigne précise s'affichera directement sur le terminal embarqué de l'ambulancier ou chauffeur VSL.</span>
</div>
</div>

<div className="flex flex-col gap-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-lg">local_shipping</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Estimation de volumétrie et typologies requises</h2>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="weeklyTrips">Transferts hebdomadaires estimés</label>
<select className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" id="weeklyTrips">
<option value="1-15">1 à 15 transports / semaine (Centre de proximité)</option>
<option value="16-50">16 à 50 transports / semaine (Clinique moyenne)</option>
<option  value="50-150">50 à 150 transports / semaine (Pôle hospitalier)</option>
<option value="150+">Plus de 150 transports / semaine (Grand CHU / Urgences multiples)</option>
</select>
</div>
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface">Vecteurs de mobilité nécessaires</label>
<div className="flex flex-wrap gap-space-xs pt-1">
<label className="inline-flex items-center gap-space-xs bg-surface-container px-space-sm py-space-xs rounded cursor-pointer">
<input defaultChecked className="rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-sm text-label-sm text-on-surface">Ambulance (Allongé)</span>
</label>
<label className="inline-flex items-center gap-space-xs bg-surface-container px-space-sm py-space-xs rounded cursor-pointer">
<input defaultChecked className="rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-sm text-label-sm text-on-surface">VSL (Assis médicalisé)</span>
</label>
<label className="inline-flex items-center gap-space-xs bg-surface-container px-space-sm py-space-xs rounded cursor-pointer">
<input defaultChecked className="rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-sm text-label-sm text-on-surface">Taxi Conventionné</span>
</label>
<label className="inline-flex items-center gap-space-xs bg-surface-container px-space-sm py-space-xs rounded cursor-pointer">
<input defaultChecked className="rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-sm text-label-sm text-on-surface">TPMR (Fauteuil)</span>
</label>
</div>
</div>
</div>
</div>

<div className="flex flex-col gap-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-lg">supervisor_account</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Référent Cadre de Santé &amp; Contact Direct</h2>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Cette personne recevra les accès administrateur pour inviter les soignants, secrétaires et chefs de service.</p>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="cadreName">Nom &amp; Prénom du Cadre / Responsable <span className="text-error">*</span></label>
<input className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" defaultValue="Céline DEGRAS-MONTOUT" id="cadreName" placeholder="Mme Céline DEGRAS" required type="text" />
</div>
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="cadreFonction">Fonction au sein de l'établissement <span className="text-error">*</span></label>
<select className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" defaultValue="Cadre Supérieur de Santé" id="cadreFonction">
<option value="Cadre Supérieur de Santé">Cadre Supérieur de Santé / Gestion des lits</option>
<option value="Cadre de Santé de Service">Cadre de Santé de Service</option>
<option value="Régulateur Interne des Transports">Régulateur Interne des Transports</option>
<option value="Directeur des Soins">Direction des Soins Infirmiers (DSI)</option>
<option value="Chef de Service Médical">Chef de Pôle / Médecin Coordinateur</option>
<option value="Responsable Admissions">Responsable Bureau des Entrées &amp; Sorties</option>
</select>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="cadreEmail">Courriel Professionnel Sécurisé <span className="text-error">*</span></label>
<input className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" defaultValue="celine.degras@ch-martinique.fr" id="cadreEmail" placeholder="nom.prenom@ch-martinique.fr" required type="email" />
</div>
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="cadrePhone">Ligne Téléphonique Directe / DECT <span className="text-error">*</span></label>
<input className="h-11 px-space-md rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all" defaultValue="05 96 55 20 44" id="cadrePhone" placeholder="05 96 XX XX XX" required type="tel" />
</div>
</div>
</div>

<div className="bg-surface-container p-space-md rounded-lg flex flex-col gap-space-xs">
<label className="inline-flex items-start gap-space-sm cursor-pointer">
<input defaultChecked className="mt-1 rounded text-primary focus:ring-0" id="termsCheck" required type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface">
                  Je certifie être dûment habilité(e) par la direction de l'établissement à initier le conventionnement Médic'Trans 972 et confirme l'exactitude des identifiants FINESS et SIRET transmis.
                </span>
</label>
<div className="flex items-center gap-space-xs pl-6 text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-secondary text-sm">lock</span>
<span className="">Données hébergées en environnement certifié HDS (Santé France) et cryptées de bout en bout.</span>
</div>
</div>

<div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-xs">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="">Activation sous 24h ouvrées par la régulation territoriale 972</span>
</div>
<button className="w-full sm:w-auto h-12 px-space-xl rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md transition-all" type="submit">
<span className="">Valider la demande d'accès établissement</span>
<span className="material-symbols-outlined text-lg">arrow_forward</span>
</button>
</div>

<div className="hidden p-space-md rounded-lg bg-secondary-container text-on-secondary-container flex items-center gap-space-sm" id="formSuccessMessage">
<span className="material-symbols-outlined text-secondary text-2xl">check_circle</span>
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-bold">Demande enregistrée avec succès</span>
<span className="font-body-sm text-body-sm">Un lien d'activation a été envoyé au référent cadre. Notre pôle conventionnement prendra contact pour la configuration des services.</span>
</div>
</div>
</form>
</div>
</div>

<div className="lg:col-span-5 flex flex-col gap-space-md">

<div className="rounded-xl overflow-hidden shadow-md relative bg-surface-container-lowest">
<div className="bg-cover bg-center w-full h-44 relative" data-alt="A modern hospital facility in Fort-de-France Martinique with tropical palm trees in the courtyard, clear blue sky, ambulances lined up orderly in front of emergency bay with professional caregivers" >
<div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent"></div>
<div className="absolute bottom-space-md left-space-md right-space-md flex items-center justify-between text-on-primary">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">Réseau 972 Antilles</span>
<span className="font-headline-sm text-headline-sm font-bold">Coordination Sanitaire Martinique</span>
</div>
<span className="material-symbols-outlined text-secondary-fixed text-2xl">local_hospital</span>
</div>
</div>
<div className="p-space-md flex items-center justify-between bg-surface-container-low">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-xl">share_location</span>
<span className="font-label-md text-label-md text-on-surface">32 Sociétés Ambulancières connectées</span>
</div>
<span className="font-label-sm text-label-sm bg-secondary-container px-space-sm py-space-xs rounded-full text-on-secondary-container font-semibold">Temps réel</span>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md flex flex-col gap-space-sm relative overflow-hidden">
<div className="flex items-start justify-between">
<div className="flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm uppercase text-secondary font-bold tracking-wider">Impact Organisationnel Soignant</span>
<div className="flex items-baseline gap-space-xs">
<span className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-tight">45 min</span>
<span className="font-label-md text-label-md text-on-surface font-medium">économisées / jour / service</span>
</div>
</div>
<div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-2xl">timer</span>
</div>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Fin des dizaines d'appels téléphoniques fastidieux pour trouver une ambulance disponible à Fort-de-France, au Lamentin ou au Nord Atlantique. Le système dispatche automatiquement au transporteur conventionné le plus proche.
          </p>

<div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<svg className="w-10 h-10 -rotate-90 shrink-0" viewBox="0 0 36 36">
<path className="text-surface-container-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
<path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="88, 100" strokeLinecap="round" strokeWidth="3.5"></path>
</svg>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Taux de réponse moyen</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Sous 6 minutes ouvrées</span>
</div>
</div>
<span className="font-headline-sm text-headline-sm text-secondary font-bold">88%</span>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-xl">fact_check</span>
<h3 className="font-label-lg text-label-lg text-on-surface font-bold">Fonctionnalités incluses pour vos services</h3>
</div>
<span className="font-label-sm text-label-sm text-secondary bg-secondary/10 px-space-xs py-0.5 rounded font-bold">GRATUIT</span>
</div>
<div className="flex flex-col gap-space-sm">

<div className="flex items-start gap-space-sm p-space-xs rounded-lg hover:bg-surface-container-low transition-colors">
<div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0 mt-0.5">
<span className="material-symbols-outlined text-base">bolt</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Déclenchement express (&lt; 2 minutes)</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Saisie simplifiée par lit, chambre ou numéro d'admission patient (DPI).</span>
</div>
</div>

<div className="flex items-start gap-space-sm p-space-xs rounded-lg hover:bg-surface-container-low transition-colors">
<div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0 mt-0.5">
<span className="material-symbols-outlined text-base">radar</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Traçabilité radar &amp; ETA en temps réel</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Visualisez l'approche exacte de l'équipage sur le site hospitalier.</span>
</div>
</div>

<div className="flex items-start gap-space-sm p-space-xs rounded-lg hover:bg-surface-container-low transition-colors">
<div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0 mt-0.5">
<span className="material-symbols-outlined text-base">event_repeat</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Gestion groupée dialyse &amp; chimiothérapie</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Planification récurrente hebdomadaire en 1 clic pour les séries de séances.</span>
</div>
</div>

<div className="flex items-start gap-space-sm p-space-xs rounded-lg hover:bg-surface-container-low transition-colors">
<div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0 mt-0.5">
<span className="material-symbols-outlined text-base">assignment_turned_in</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Contrôle de conformité PMT (Prescription Médicale)</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Génération et validation télétransmise conforme aux règles CGSS Martinique.</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-md flex flex-col gap-space-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary text-xl">phone_in_talk</span>
<span className="font-label-lg text-label-lg text-on-surface font-bold">Ligne d'Assistance Cadres &amp; Régulateurs 972</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Un doute sur une prise en charge complexe ou un transfert sanitaire inter-îles (Guadeloupe / Hexagone EVASAN) ? Notre permanence régulatrice est disponible :
          </p>
<div className="bg-primary-fixed/50 p-space-sm rounded-lg flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-primary-fixed-variant">Ligne rouge Cadres Hospitaliers :</span>
<span className="font-headline-sm text-headline-sm text-primary font-bold">05 96 70 97 20</span>
</div>
<span className="font-label-sm text-label-sm bg-primary text-on-primary px-space-sm py-space-xs rounded font-semibold">7j/7 - 24h/24</span>
</div>
<div className="flex items-center gap-space-xs pt-space-xs text-on-surface-variant">
<span className="material-symbols-outlined text-primary text-sm">support_agent</span>
<span className="font-body-sm text-body-sm">Régulateur en chef référent : <strong>M. Alain JEAN-ELIE</strong> (CHU / Médic'Trans)</span>
</div>
</div>

<div className="bg-surface-container-high rounded-xl p-space-md flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Certifications &amp; Conformité Sanitaire</span>
<div className="grid grid-cols-2 gap-space-xs pt-space-xs">
<div className="bg-surface-container-lowest p-space-xs rounded flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary text-lg">verified</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-bold leading-tight">HDS Certifié</span>
<span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">ISO 27799 Santé</span>
</div>
</div>
<div className="bg-surface-container-lowest p-space-xs rounded flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-lg">health_and_safety</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-bold leading-tight">ARS Martinique</span>
<span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">Agrément R. 6312</span>
</div>
</div>
</div>
<p className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">
            Compatible avec le Dossier Médical Partagé (Mon Espace Santé) et interopérable avec les logiciels hospitaliers (Sillage, DxCare, Crossway).
          </p>
</div>
</div>
</div>
</div>
</div>
</main>
      <Footer />
    </div>
  );
};
