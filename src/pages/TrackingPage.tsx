import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const TrackingPage: React.FC = () => {
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
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.06)]"><div className="h-20 max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex items-center justify-between gap-space-md"><div className="flex items-center gap-space-md shrink-0"><img alt="Logo Médic'Trans Martinique" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1XfD3evNv8jpKEQassyB67JCw2Z0av_XyxFzLWrX7T_Xx8sMiJ1T5FG_x_xt6Uc30fX_NkOLLu-QUvuyenXhvnYZv6QdHbyqsw8uiohhzRJs6OldzTsjmC8Jc25JWFEbRmRbZlFu9rcUI38KFr99-pARGS5nsX8yJ5qtCzmaS_McFBBZ_ihIZURxVPq-6QZZtNX4KjVd9NjlfYTvY4JmzROZ9rV53JUiOJxdMyuXkVuJZIn_EI-HUt4mw" /><div className="flex flex-col"><span className="font-headline-sm text-headline-sm text-primary tracking-tight">Médic'Trans</span><span className="font-label-sm text-label-sm text-secondary -mt-1">Martinique 972</span></div></div><nav className="hidden xl:flex items-center gap-space-sm" data-active-classes="bg-primary-container text-on-primary font-bold rounded-lg"><Link className="px-3 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="accueil-presentation" to="/">Accueil &amp; Présentation</Link><Link className="px-3 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="reserver-un-transport" to="/reserver">Réserver un transport</Link><Link aria-current="page" className="px-3 py-2 transition-colors bg-primary-container text-on-primary font-bold rounded-lg" data-path="mes-demandes" to="/suivi">Mes Demandes</Link><Link className="px-3 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="espace-transporteurs" to="/transporteurs">Espace Transporteurs</Link></nav><div className="flex items-center gap-space-md shrink-0"><div className="hidden md:flex flex-col items-end"><div className="flex items-center gap-space-xs"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span><span className="font-label-sm text-label-sm text-secondary">Disponible 24/7</span></div><span className="font-label-lg text-label-lg text-primary tracking-tight">05 96 72 00 97</span></div><div className="flex items-center gap-space-sm pl-space-sm"><img alt="Profile" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4Ou_gXxYmMgUKkBpcflANalR_XKHPbHvwsPitIeGO2reHkEGUG103yn97linWcTa61QoMJdDmse0trP1AsufCLlho-yPDuOCqGLeBIVIZT_4DcmQXvYxyG73gclmKMBKdOVXjuBC04Hbop4SaJBiiXnbo_czHLOTKWDm5awphPacifmkMZm_j6Q0sy9g4tnTUta-Q64hDr91Qxby1dLSFHY54zcb_dLnGHO7YAxbylb9SwBxtqB6y" /><div className="hidden lg:flex flex-col text-left"><span className="font-label-md text-label-md text-on-surface leading-none">Coord. Clinique</span><span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-1">CHU P. Zobda-Quitman</span></div></div></div></div></header><main className="w-full pt-20 bg-surface min-h-screen"><div className="flex flex-col w-full">

<div className="w-full bg-surface-container-high px-margin md:px-margin-md lg:px-margin-lg py-space-sm flex items-center justify-between shadow-sm" id="dispatch-banner">
<div className="max-w-[1280px] w-full mx-auto flex flex-wrap items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-sm">
<span className="flex h-2.5 w-2.5 relative">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
</span>
<span className="font-label-md text-label-md text-on-surface">Réseau Martinique Sud &amp; Centre actif : 42 ambulances et taxis conventionnés en liaison continue avec le SAMU 972.</span>
</div>
<div className="flex items-center gap-space-md">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Synchronisé avec CPAM 972</span>
<button className="text-on-surface-variant hover:text-on-surface flex items-center" >
<span className="material-symbols-outlined text-sm">close</span>
</button>
</div>
</div>
</div>
<div className="max-w-[1280px] w-full mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-lg flex flex-col gap-space-xl">

<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
<div className="flex flex-col gap-space-xs max-w-2xl">
<div className="flex items-center gap-space-sm">
<span className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">Espace Patient &amp; Coordonnateur Clinique</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Dossier ID: #MQ-97204-J</span>
</div>
<h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Tableau de bord de suivi - Transports en cours</h1>
<p className="font-body-md text-body-md text-on-surface-variant">Superviser la prise en charge sanitaire, la géolocalisation des équipages agréés ARS et les attestations 100% Tiers-Payant Sécurité Sociale.</p>
</div>


</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

<div className="lg:col-span-8 flex flex-col gap-space-xl">

<div className="relative bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md overflow-hidden">

<div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-200/40 rounded-full blur-3xl pointer-events-none"></div>

<div className="flex flex-wrap items-center justify-between gap-space-sm relative z-10">
<div className="flex items-center gap-space-sm">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-label-md text-label-md">
<span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                RECHERCHE ACTIVE D'UN TRANSPORTEUR
              </span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Départ estimé dans 1h45</span>
</div>
<span className="font-headline-sm text-headline-sm text-primary font-bold">Aujourd'hui · 14h15</span>
</div>

<div className="grid grid-cols-1 md:grid-cols-12 gap-space-md relative z-10 pt-space-xs">

<div className="md:col-span-8 flex flex-col gap-space-md">
<div className="flex items-start gap-space-md">
<div className="flex flex-col items-center pt-1">
<span className="material-symbols-outlined text-primary text-xl">radio_button_checked</span>
<div className="w-0.5 h-12 bg-surface-container-high my-1"></div>
<span className="material-symbols-outlined text-secondary text-xl">location_on</span>
</div>
<div className="flex flex-col gap-space-md w-full">
<div>
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Prise en charge à domicile</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Résidence Les Almadies, Bât B</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">97233 Schoelcher · Accès rampe PMR</p>
</div>
<div>
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Destination médicale</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface">Centre d'Hémodialyse de Dillon</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Rue Raymond Hermence, 97200 Fort-de-France</p>
</div>
</div>
</div>
</div>

<div className="md:col-span-4 bg-surface-container-low p-space-md rounded-lg flex flex-col justify-between gap-space-sm">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Prescription Médicale</span>
<span className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 mt-1">
<span className="material-symbols-outlined text-primary">local_taxi</span>
                  Taxi Conventionné CPAM
                </span>
<span className="font-body-sm text-body-sm text-on-surface-variant mt-1">Station assise / Patient autonome sans oxygénothérapie</span>
</div>
<div className="pt-space-xs">
<span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-sm">verified</span>
                  PEC 100% ALD n°03
                </span>
</div>
</div>
</div>

<div className="bg-amber-50/80 rounded-lg p-space-md flex flex-col gap-space-sm relative z-10">
<div className="flex flex-wrap items-center justify-between gap-space-xs">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-amber-800 text-xl animate-spin">sync</span>
<span className="font-label-md text-label-md text-amber-900">Demande diffusée à 18 chauffeurs agréés du secteur Centre/Nord Caraïbe</span>
</div>
<span className="font-label-sm text-label-sm text-amber-800 font-semibold" id="search-timer">Attente moyenne : ~6 min</span>
</div>

<div className="w-full bg-amber-200/70 h-2 rounded-full overflow-hidden">
<div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full w-2/3 transition-all duration-1000 animate-pulse"></div>
</div>
<p className="font-body-sm text-body-sm text-amber-900/80">Notre algorithme interroge successivement les taxis sanitaires conventionnés en fin de course à proximité de Schoelcher et Case-Pilote.</p>
</div>

<div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs relative z-10">
<div className="flex items-center gap-space-sm">
<button className="px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1.5">
<span className="material-symbols-outlined text-lg">edit</span>
                Modifier la demande
              </button>
<button className="px-4 py-2.5 rounded-lg bg-error-container hover:bg-red-100 text-error font-label-md text-label-md transition-colors flex items-center gap-1.5" >
<span className="material-symbols-outlined text-lg">cancel</span>
                Annuler sans frais
              </button>
</div>
<a className="px-4 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md shadow-sm transition-colors flex items-center gap-1.5" href="tel:0596720097">
<span className="material-symbols-outlined text-lg">support_agent</span>
              Appeler la régulation Médic'Trans (24/7)
            </a>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md">

<div className="flex flex-wrap items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-sm">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-label-md text-label-md">
<span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                MISSION ACCEPTÉE &amp; PLANIFIÉE
              </span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Transport n°MT-2024-8841</span>
</div>
<div className="text-right">
<span className="font-headline-sm text-headline-sm text-secondary font-bold">Demain · Mardi 15 Octobre</span>
<p className="font-label-sm text-label-sm text-on-surface-variant">Prise en charge à domicile : 08h15</p>
</div>
</div>

<div className="bg-surface-container-low p-space-md rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
<span className="material-symbols-outlined text-2xl">medical_services</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
<span className="">Résidence Les Almadies (Schoelcher)</span>
<span className="material-symbols-outlined text-xs">arrow_forward</span>
<span className="text-on-surface font-semibold">CHU Pierre Zobda-Quitman (FDF)</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5">Consultation Chirurgie Ambulatoire - Bâtiment C</h3>
<span className="font-body-sm text-body-sm text-on-surface-variant">Convocation clinique fixée à 09h00 (Arrivée prévue 08h45)</span>
</div>
</div>
<div className="flex flex-col md:items-end">
<span className="font-label-sm text-label-sm text-on-surface-variant">Type d'équipement</span>
<span className="font-label-lg text-label-lg text-primary font-bold">Ambulance Type B climatisée</span>
<span className="font-label-sm text-label-sm text-secondary">Position allongée prescrite</span>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">

<div className="md:col-span-7 flex flex-col gap-space-sm bg-surface-container-lowest p-space-sm rounded-lg">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Transporteur Sanitaire Agréé</span>
<div className="flex items-center gap-space-md">
<img className="w-16 h-16 rounded-full object-cover shadow-sm shrink-0" data-alt="Portrait photograph of professional ambulance driver Frantz in clean white medical uniform with friendly, reassuring expression against tropical clinic backdrop in Martinique" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpVZku5SDvKcS2GL-hC17fve4CPhzvLuJv-fBnnJAKvIL0UhSIA4ZID-ZLI9gRBYkapceZZmSQ7WLRwrNykAaOdYgXgFtS-iS0gwmT_PFPNpnfqUXpNsRbFdgaQWmTqp3UBZtS6dXSNnzVd4qTuRlcndlNTuSWPMaaDumceVnnWHklfLaihNhDwjOsaJsLUpUDUsHA_XhtWvjqZk5HLUZG37IGhfdNrSB3RAuw_xITyYVprQ3C8dib" />
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<h4 className="font-headline-sm text-headline-sm text-on-surface">Frantz M.</h4>
<span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm">Agrément ARS n°972-2021-04</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Ambulances Madinina Secours 972</span>
<div className="flex items-center gap-space-sm mt-1">
<span className="font-label-sm text-label-sm text-on-surface flex items-center gap-1">
<span className="material-symbols-outlined text-sm text-amber-500">star</span> 4.97 (142 avis)
                    </span>
<span className="text-on-surface-variant font-label-sm text-label-sm">· Conventionné CPAM 972</span>
</div>
</div>
</div>

<div className="flex flex-wrap gap-space-xs pt-space-xs">
<span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-sm text-primary">directions_car</span>
                  Immatriculation : GK-428-MQ
                </span>
<span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-sm text-secondary">ac_unit</span>
                  Climatisation médicale filtrée
                </span>
<span className="px-2.5 py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1">
<span className="material-symbols-outlined text-sm text-primary">airline_seat_flat</span>
                  Brancard coquille disponible
                </span>
</div>
</div>

<div className="md:col-span-5 flex flex-col justify-between gap-space-sm bg-surface-container-high/40 p-space-md rounded-lg">
<div className="flex flex-col">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">Arrivée estimée au domicile</span>
<span className="font-label-md text-label-md text-secondary font-bold">08:15</span>
</div>
<div className="flex items-center justify-between mt-1">
<span className="font-label-sm text-label-sm text-on-surface-variant">Prise en charge</span>
<span className="font-label-md text-label-md text-on-surface">08:30 au plus tard</span>
</div>
<div className="flex items-center justify-between mt-1">
<span className="font-label-sm text-label-sm text-on-surface-variant">Destination CHU</span>
<span className="font-label-md text-label-md text-on-surface">08:45 à Fort-de-France</span>
</div>
</div>
<div className="flex flex-col gap-space-xs pt-space-xs">
<a className="w-full h-11 px-3 rounded-lg bg-secondary text-on-secondary text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-all truncate" href="tel:0696884422"><span className="material-symbols-outlined text-base shrink-0">call</span><span className="truncate">Appeler chauffeur (06 96 88 44 22)</span></a>
<button className="w-full h-10 px-4 rounded-lg bg-surface-container-high text-primary hover:bg-surface-container-highest font-label-md text-label-md flex items-center justify-center gap-2 transition-colors" >
<span className="material-symbols-outlined text-lg">download</span>
                  Télécharger bon de transport validé
                </button>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-lg"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
  <div className="flex flex-col">
    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Historique des transports sanitaires</h2>
    <p className="font-body-sm text-body-sm text-on-surface-variant">Suivi simplifié de vos demandes et transports programmés ou archivés.</p>
  </div>
  <div className="flex items-center gap-space-sm">
    <div className="relative">
      <input className="h-10 pl-9 pr-3 rounded-lg bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:bg-surface-container transition-colors w-64 placeholder:text-on-surface-variant" placeholder="Rechercher un trajet, date..." type="text" />
      <span className="material-symbols-outlined text-outline absolute left-2.5 top-2.5 text-lg">search</span>
    </div>
    <button className="h-10 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-container-highest flex items-center gap-1.5 transition-colors shrink-0" >
      <span className="material-symbols-outlined text-lg">file_download</span>
      Export
    </button>
  </div>
</div>

<div className="overflow-x-auto">
  <table className="w-full text-left">
    <thead>
      <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
        <th className="py-3 px-4 rounded-l-lg">Date &amp; Heure</th>
        <th className="py-3 px-4">Trajet / Destination</th>
        <th className="py-3 px-4">Véhicule</th>
        <th className="py-3 px-4">Statut</th>
        <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y-0 font-body-sm text-body-sm text-on-surface">
      
      <tr className="hover:bg-surface-container-low/60 transition-colors">
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Aujourd'hui</span>
          <span className="text-on-surface-variant font-label-sm text-label-sm">14h15</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Schoelcher ➔ Centre Dillon</span>
          <span className="text-on-surface-variant text-body-sm block">Hémodialyse</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Taxi Conventionné</span>
          <span className="text-on-surface-variant text-body-sm">En cours d'affectation</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            En attente
          </span>
        </td>
        <td className="py-3.5 px-4 align-top text-right">
          <div className="flex items-center justify-end gap-2">
            <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-label-sm transition-colors" >
              <span className="material-symbols-outlined text-base">visibility</span>
              Voir la demande
            </button>
            <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-error-container hover:bg-red-100 text-error font-label-sm text-label-sm transition-colors" >
              <span className="material-symbols-outlined text-base">close</span>
              Annuler
            </button>
          </div>
        </td>
      </tr>
      
      <tr className="hover:bg-surface-container-low/60 transition-colors">
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Demain (15 Oct.)</span>
          <span className="text-on-surface-variant font-label-sm text-label-sm">08h15</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Schoelcher ➔ CHU Zobda-Quitman</span>
          <span className="text-on-surface-variant text-body-sm block">Chirurgie Ambulatoire</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Ambulance Type B</span>
          <span className="text-on-surface-variant text-body-sm">Madinina Secours 972</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Accepté
          </span>
        </td>
        <td className="py-3.5 px-4 align-top text-right">
          <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-label-sm transition-colors" >
            <span className="material-symbols-outlined text-base">visibility</span>
            Voir la demande
          </button>
        </td>
      </tr>
      
      <tr className="hover:bg-surface-container-low/60 transition-colors">
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Ven. 11 Octobre</span>
          <span className="text-on-surface-variant font-label-sm text-label-sm">07h30</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Schoelcher ➔ Centre Dillon</span>
          <span className="text-on-surface-variant text-body-sm block">Séance de Dialyse</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Taxi Conventionné</span>
          <span className="text-on-surface-variant text-body-sm">Taxi Madinina Express</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined text-xs">check_circle</span>
            Effectué
          </span>
        </td>
        <td className="py-3.5 px-4 align-top text-right">
          <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-label-sm transition-colors" >
            <span className="material-symbols-outlined text-base">visibility</span>
            Voir la demande
          </button>
        </td>
      </tr>
      
      <tr className="hover:bg-surface-container-low/60 transition-colors">
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Mer. 09 Octobre</span>
          <span className="text-on-surface-variant font-label-sm text-label-sm">13h45</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">Schoelcher ➔ CHU Zobda-Quitman</span>
          <span className="text-on-surface-variant text-body-sm block">Bilan Cardiologique Pré-Op</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="font-label-md text-label-md text-on-surface block">VSL</span>
          <span className="text-on-surface-variant text-body-sm">Ambulances Caraïbes Santé</span>
        </td>
        <td className="py-3.5 px-4 align-top">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined text-xs">check_circle</span>
            Effectué
          </span>
        </td>
        <td className="py-3.5 px-4 align-top text-right">
          <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-label-sm transition-colors" >
            <span className="material-symbols-outlined text-base">visibility</span>
            Voir la demande
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<div className="flex items-center justify-between pt-space-xs">
  <span className="font-body-sm text-body-sm text-on-surface-variant">Affichage de 4 sur 12 transports conventionnés</span>
  <button className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors">
    Voir tous les transports archivés
  </button>
</div></div>
</div>

<div className="lg:col-span-4 flex flex-col gap-space-lg">

<div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md"><div className="flex items-center justify-between border-b border-surface-container-high pb-space-sm"><div className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-primary text-xl">analytics</span><h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Statut des transports</h3></div><span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold">Temps réel</span></div><div className="flex flex-col gap-space-sm"><div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low"><div className="flex items-center gap-space-sm"><div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span></div><div className="flex flex-col"><span className="font-label-md text-label-md text-on-surface font-semibold">En diffusion</span><span className="font-label-sm text-label-sm text-on-surface-variant">Recherche transporteur active</span></div></div><div className="text-right"><span className="font-headline-lg text-headline-lg text-amber-900 font-bold leading-none">1</span></div></div><div className="flex items-center justify-between p-space-sm rounded-lg bg-secondary-container/20"><div className="flex items-center gap-space-sm"><div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span></div><div className="flex flex-col"><span className="font-label-md text-label-md text-secondary font-semibold">Confirmé</span><span className="font-label-sm text-label-sm text-secondary">Programmé pour demain</span></div></div><div className="text-right"><span className="font-headline-lg text-headline-lg text-secondary font-bold leading-none">1</span></div></div><div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low"><div className="flex items-center gap-space-sm"><div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-outline text-lg">history</span></div><div className="flex flex-col"><span className="font-label-md text-label-md text-on-surface font-semibold">Archivés</span><span className="font-label-sm text-label-sm text-on-surface-variant">Courses passées réalisées</span></div></div><div className="text-right"><span className="font-headline-lg text-headline-lg text-on-surface font-bold leading-none">12</span></div></div></div></div>



<div className="bg-primary text-on-primary rounded-xl p-space-lg flex flex-col gap-space-md shadow-md relative overflow-hidden">
<div className="relative z-10 flex flex-col gap-space-xs">
<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold w-fit tracking-wide">
              URGENCES RELATIVES &amp; TRANSFERTS
            </span>
<h4 className="font-headline-sm text-headline-sm font-bold">Besoin d'un transport imprévu ?</h4>
<p className="font-body-sm text-body-sm text-on-primary-container">Notre centre de régulation en Martinique vous assiste 24h/24 et 7j/7 pour adapter vos horaires ou organiser un rapatriement.</p>
</div>
<div className="relative z-10 flex flex-col gap-space-sm pt-space-xs">
<a className="w-full h-12 bg-white text-primary rounded-lg font-headline-sm text-headline-sm flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm font-bold" href="tel:0596720097">
<span className="material-symbols-outlined text-xl text-secondary">call</span>
              05 96 72 00 97
            </a>
<span className="font-label-sm text-label-sm text-center text-on-primary-container">Numéro local non surtaxé · Coordination CHU / Cliniques</span>
</div>

<div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
<span className="material-symbols-outlined text-9xl">emergency</span>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm">
<h5 className="font-label-lg text-label-lg text-on-surface">Une question sur vos droits ?</h5>
<ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="">Différence entre VSL, Ambulance &amp; Taxi</span>
</li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="">Comment obtenir l'accord préalable CPAM ?</span>
</li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="">Droits d'accompagnement pour mineur ou PMR</span>
</li>
</ul>
<a className="font-label-md text-label-md text-primary hover:underline pt-space-xs flex items-center gap-1" href="#">
            Consulter le guide des transports remboursés
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
</a>
</div>
</div>
</div>
</div>
</div>
</main><footer className="w-full bg-surface-container-low mt-space-xl"><div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-xl"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl mb-space-xl"><div className="flex flex-col gap-space-sm"><div className="flex items-center gap-space-sm mb-space-xs"><span className="font-headline-sm text-headline-sm text-primary">Médic'Trans Martinique</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Plateforme d'intermédiation et de régulation du transport sanitaire conventionné pour toute la Martinique.</p><div className="flex flex-col gap-space-xs mt-space-xs"><span className="font-label-md text-label-md text-on-surface">Agréments &amp; Certifications</span><span className="font-body-sm text-body-sm text-on-surface-variant">Agrément ARS Martinique n°972-2024-T</span><span className="font-body-sm text-body-sm text-on-surface-variant">Conventionnement CPAM 100% Tiers Payant</span></div></div><div className="flex flex-col gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface">Établissements Desservis</span><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="">CHU de Martinique (P. Zobda-Quitman) - Fort-de-France</li><li className="">Hôpital Louis Domergue - La Trinité</li><li className="">Hôpital Pierre Zobda-Quitman &amp; EHPAD - Le Lamentin</li><li className="">Centre Hospitalier de Saint-Pierre</li><li className="">Hôpital de Proximité - Le Marin</li><li className="">Clinique Sainte-Marie - Schoelcher</li></ul></div><div className="flex flex-col gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface">Services Sanitaires</span><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="">Ambulances conventionnées (Position allongée/soins)</li><li className="">VSL (Véhicule Sanitaire Léger)</li><li className="">Taxi Conventionné CPAM Martinique</li><li className="">Urgences relatives et rapatriements inter-îles</li><li className="">Transports ALD &amp; Séances régulières (Dialyse, Onco)</li></ul></div><div className="flex flex-col gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface">Assistance &amp; Régulation</span><p className="font-body-sm text-body-sm text-on-surface-variant">Permanence d'accès aux soins et transfert médicalisé 24h/24 et 7j/7.</p><span className="font-headline-sm text-headline-sm text-primary">05 96 72 00 97</span><span className="font-body-sm text-body-sm text-on-surface-variant">regulation@medtrans-mq.fr</span><span className="font-body-sm text-body-sm text-on-surface-variant">Région Martinique (972)</span></div></div><div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md"><span className="font-body-sm text-body-sm text-on-surface-variant">© 2024 Médic'Trans Martinique (972). Tous droits réservés. <a className="hover:text-on-surface transition-colors underline" href="#">Mentions légales</a></span></div></div></footer>


    </div>
  );
};
