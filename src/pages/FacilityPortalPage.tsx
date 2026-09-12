import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const FacilityPortalPage: React.FC = () => {
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

<section className="w-full bg-surface-container-lowest shadow-sm">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-md flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary shadow-sm">
<span className="material-symbols-outlined text-[28px]">local_hospital</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">Portail Hospitalier Dédié</span>
<span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Raccordement ROR &amp; DPI Direct</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">CHU Pierre Zobda-Quitman</h1>
<p className="font-body-sm text-body-sm text-on-surface-variant">Service Néphrologie, Dialyse &amp; Hémodialyse Lourde • Pavillon M - Niveau 3</p>
</div>
</div>

<div className="flex flex-wrap items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-xl">
<div className="flex items-center gap-space-xs text-primary">
<span className="material-symbols-outlined text-[20px]">ring_volume</span>
<span className="font-label-md text-label-md font-bold">Astreinte Cadre Régulateur :</span>
</div>
<a className="font-headline-sm text-headline-sm text-primary hover:text-primary-container transition-colors tracking-tight" href="tel:0596720097">
          05 96 72 00 97
        </a>
<span className="bg-secondary text-on-secondary px-space-xs py-0.5 rounded-full font-label-sm text-label-sm font-bold">LIGNE DIRECTE DÉDIÉE</span>
</div>
</div>
</section>

<section className="w-full max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-lg">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Sorties Attendues</span>
<span className="material-symbols-outlined text-primary text-[22px]">calendar_today</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-sm">
<span className="font-headline-xl text-headline-xl text-primary font-bold">14</span>
<span className="font-label-md text-label-md text-on-surface-variant">patients programmés</span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-sm overflow-hidden">
<div className="bg-primary h-full w-[100%] rounded-full"></div>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">Journée du 28 Octobre • Martinique</span>
</div>

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Départs Assignés</span>
<span className="material-symbols-outlined text-secondary text-[22px]">check_circle</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-sm">
<span className="font-headline-xl text-headline-xl text-secondary font-bold">9</span>
<span className="font-label-md text-label-md text-secondary">transporteurs confirmés</span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-sm overflow-hidden">
<div className="bg-secondary h-full w-[64%] rounded-full"></div>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">64% des rotations sécurisées</span>
</div>

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary font-bold">En cours de dispatch</span>
<span className="material-symbols-outlined text-tertiary text-[22px] animate-spin">sync</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-sm">
<span className="font-headline-xl text-headline-xl text-tertiary font-bold">5</span>
<span className="font-label-md text-label-md text-on-surface-variant">recherches actives</span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-sm overflow-hidden">
<div className="bg-tertiary h-full w-[36%] rounded-full"></div>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">File d'attente automatisée 972</span>
</div>

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-bold">Délai d'Affectation</span>
<span className="material-symbols-outlined text-primary text-[22px]">timer</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-sm">
<span className="font-headline-xl text-headline-xl text-primary font-bold">4<span className="font-headline-sm text-headline-sm font-normal">m</span> 12<span className="font-headline-sm text-headline-sm font-normal">s</span></span>
<span className="font-label-md text-label-md text-secondary font-bold">-18% vs moyenne</span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-sm overflow-hidden">
<div className="bg-secondary h-full w-[82%] rounded-full"></div>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">Optimisation réseau Fort-de-France</span>
</div>
</div>
</section>

<section className="w-full max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg mb-space-xl">

<div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md">
<div className="flex items-center gap-space-xs bg-surface-container p-1 rounded-xl">
<button className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs bg-surface-container-lowest text-primary shadow-sm font-bold" id="tabBtnTransports">
<span className="material-symbols-outlined text-[18px]">departure_board</span>
<span className="">Départs &amp; File de Service</span>
<span className="bg-primary text-on-primary text-[11px] px-1.5 py-0.5 rounded-full">14</span>
</button>
<button className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs text-on-surface-variant hover:text-on-surface" id="tabBtnNewExpress">
<span className="material-symbols-outlined text-[18px]">add_circle</span>
<span className="">Sortie de Lit Express</span>
</button>
<button className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs text-on-surface-variant hover:text-on-surface" id="tabBtnBordereaux">
<span className="material-symbols-outlined text-[18px]">verified_user</span>
<span className="">Bordereaux &amp; Rapprochement PMT</span>
<span className="bg-surface-container-highest text-primary text-[11px] px-1.5 py-0.5 rounded-full">3 à signer</span>
</button>
</div>

<div className="flex items-center gap-space-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">Période :</span>
<div className="bg-surface-container-lowest px-space-sm py-space-xs rounded-lg shadow-sm flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary text-[18px]">schedule</span>
<span className="font-label-md text-label-md font-bold text-on-surface">Aujourd'hui, Service Jour</span>
</div>
<button className="p-space-xs bg-surface-container-lowest hover:bg-surface-container rounded-lg shadow-sm text-on-surface-variant hover:text-primary transition-all"  title="Rafraîchir les statuts">
<span className="material-symbols-outlined text-[20px]">refresh</span>
</button>
</div>
</div>

<div className="flex flex-col gap-space-lg" id="viewTransports">

<div className="bg-surface-container-high/60 p-space-md rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-sm">
<div className="flex items-center gap-space-md">
<div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
<span className="material-symbols-outlined text-[22px]">alt_route</span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Régulation Territoriale Martinique Centre</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Liaisons maritimes et axes routiers Trinité/Fort-de-France fluides. Temps d'approche estimés fiables.</p>
</div>
</div>
<div className="flex items-center gap-space-sm">
<button className="bg-primary text-on-primary hover:bg-primary-container px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-space-xs shadow-sm transition-all" >
<span className="material-symbols-outlined text-[18px]">add_box</span>
<span className="">Programmer un départ</span>
</button>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
<div className="p-space-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm">
<div>
<h2 className="font-headline-md text-headline-md text-on-surface">Départs du Service Néphrologie &amp; Dialyse</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Suivi par télémétrie des véhicules médicalisés conventionnés ARS 972</p>
</div>
<div className="flex items-center gap-space-xs">
<input className="px-space-sm py-1.5 rounded-lg bg-surface-container text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest w-52 sm:w-64 transition-all" placeholder="Filtrer patient, IPP ou ville..." type="text" />
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left font-body-sm text-body-sm">
<thead>
<tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
<th className="py-space-sm px-space-md">Heure &amp; Lit</th>
<th className="py-space-sm px-space-md">Patient &amp; IPP</th>
<th className="py-space-sm px-space-md">Destination &amp; Trajet</th>
<th className="py-space-sm px-space-md">Mode Prescrit</th>
<th className="py-space-sm px-space-md">Transporteur Mandaté</th>
<th className="py-space-sm px-space-md">Statut Régulation</th>
<th className="py-space-sm px-space-md text-right">Actions</th>
</tr>
</thead>
<tbody className="text-on-surface">

<tr className="hover:bg-surface-container-low/40 transition-colors">
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm font-bold text-primary">10:45</span>
<span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded w-fit mt-0.5">Lit 314-B</span>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-bold">Mme CÉLESTINE Ginette</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">IPP: 972-0488219 • 74 ans</span>
</div>
</td>
<td className="py-space-md px-space-md">
<div className="flex flex-col min-w-[180px]">
<span className="font-label-md text-label-md font-bold text-on-surface">Domicile • Schoelcher</span>
<span className="font-label-sm text-label-sm text-on-surface-variant truncate">Anse Madame, 97233</span>
<span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5 mt-0.5">
<span className="material-symbols-outlined text-[14px]">stairs</span> 2ème étage sans ascenseur
                    </span>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<span className="bg-primary-container text-on-primary font-label-md text-label-md px-space-sm py-1 rounded-lg flex items-center gap-1 w-fit">
<span className="material-symbols-outlined text-[16px]">airline_seat_flat</span>
                    Ambulance Allongée
                  </span>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-label-md text-label-md font-bold text-on-surface">Ambulances Caraïbes Santé</span>
<a className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1" href="tel:0596614420">
<span className="material-symbols-outlined text-[14px]">phone</span>
                      05 96 61 44 20 (Équipage B4)
                    </a>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex items-center gap-space-xs bg-[#D1FAE5] text-[#065F46] px-space-sm py-1 rounded-full font-label-md text-label-md w-fit font-bold shadow-sm">
<span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
<span className="">En approche (6 min)</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant block mt-1">Au rond-point Chavoire</span>
</td>
<td className="py-space-md px-space-md whitespace-nowrap text-right">
<button className="bg-surface-container hover:bg-surface-container-high text-primary p-2 rounded-lg transition-all" title="Billet de sortie &amp; transmissions">
<span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
</button>
</td>
</tr>

<tr className="hover:bg-surface-container-low/40 transition-colors">
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm font-bold text-tertiary">11:15</span>
<span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded w-fit mt-0.5">Fauteuil D-04</span>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-bold">M. DUBOIS Raymond</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">IPP: 972-0319402 • 62 ans</span>
</div>
</td>
<td className="py-space-md px-space-md">
<div className="flex flex-col min-w-[180px]">
<span className="font-label-md text-label-md font-bold text-on-surface">EHPAD Les Hibiscus • Le Lamentin</span>
<span className="font-label-sm text-label-sm text-on-surface-variant truncate">Quartier Acajou, 97232</span>
<span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-0.5 mt-0.5">
<span className="material-symbols-outlined text-[14px]">accessible</span> Patient en fauteuil roulant
                    </span>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<span className="bg-secondary text-on-secondary font-label-md text-label-md px-space-sm py-1 rounded-lg flex items-center gap-1 w-fit">
<span className="material-symbols-outlined text-[16px]">directions_car</span>
                    VSL Conventionné
                  </span>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex items-center gap-space-xs text-on-surface-variant">
<span className="material-symbols-outlined text-[16px] animate-spin text-tertiary">hourglass_top</span>
<span className="font-label-sm text-label-sm italic">Diffusion réseau 972...</span>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex items-center gap-space-xs bg-[#FEF3C7] text-[#92400E] px-space-sm py-1 rounded-full font-label-md text-label-md w-fit font-bold shadow-sm">
<span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
<span className="">En attente d'attribution</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant block mt-1">Émis il y a 3 min</span>
</td>
<td className="py-space-md px-space-md whitespace-nowrap text-right">
<button className="bg-primary hover:bg-primary-container text-on-primary px-space-sm py-1.5 rounded-lg font-label-sm text-label-sm font-bold shadow-sm transition-all">
                    Relancer
                  </button>
</td>
</tr>

<tr className="hover:bg-surface-container-low/40 transition-colors">
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm font-bold text-primary">11:30</span>
<span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded w-fit mt-0.5">Lit 302-A</span>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-bold">Mme JOSEPH-MONROSE L.</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">IPP: 972-0921104 • 81 ans</span>
</div>
</td>
<td className="py-space-md px-space-md">
<div className="flex flex-col min-w-[180px]">
<span className="font-label-md text-label-md font-bold text-on-surface">SSR Hôpital Louis Domergue • La Trinité</span>
<span className="font-label-sm text-label-sm text-on-surface-variant truncate">Transfert Inter-Hospitalier CHU</span>
<span className="font-label-sm text-label-sm text-primary flex items-center gap-0.5 mt-0.5">
<span className="material-symbols-outlined text-[14px]">medical_services</span> Surveillance O2 requise (2L/min)
                    </span>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<span className="bg-primary-container text-on-primary font-label-md text-label-md px-space-sm py-1 rounded-lg flex items-center gap-1 w-fit">
<span className="material-symbols-outlined text-[16px]">airline_seat_flat</span>
                    Ambulance Cat. A
                  </span>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-label-md text-label-md font-bold text-on-surface">Transports Ambulanciers Madinina</span>
<a className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1" href="tel:0596541288">
<span className="material-symbols-outlined text-[14px]">phone</span>
                      05 96 54 12 88 (Régulateur)
                    </a>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex items-center gap-space-xs bg-surface-container text-primary px-space-sm py-1 rounded-full font-label-md text-label-md w-fit font-bold shadow-sm">
<span className="w-2 h-2 rounded-full bg-primary"></span>
<span className="">Accepté • En transit</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant block mt-1">Arrivée estimée 11:22</span>
</td>
<td className="py-space-md px-space-md whitespace-nowrap text-right">
<button className="bg-surface-container hover:bg-surface-container-high text-primary p-2 rounded-lg transition-all" title="Dossier de liaison">
<span className="material-symbols-outlined text-[18px]">folder_shared</span>
</button>
</td>
</tr>

<tr className="hover:bg-surface-container-low/40 transition-colors">
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm font-bold text-on-surface-variant">09:15</span>
<span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded w-fit mt-0.5">Dialyse Poste 8</span>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-label-lg text-label-lg font-bold text-on-surface-variant line-through">M. BELLAY Thierry</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">IPP: 972-0056122 • 58 ans</span>
</div>
</td>
<td className="py-space-md px-space-md">
<div className="flex flex-col min-w-[180px]">
<span className="font-label-md text-label-md font-bold text-on-surface-variant">Domicile • Fort-de-France</span>
<span className="font-label-sm text-label-sm text-on-surface-variant truncate">Cluny, 97200</span>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<span className="bg-surface-container-high text-on-surface-variant font-label-md text-label-md px-space-sm py-1 rounded-lg flex items-center gap-1 w-fit">
<span className="material-symbols-outlined text-[16px]">local_taxi</span>
                    Taxi Conventionné
                  </span>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex flex-col">
<span className="font-label-md text-label-md font-medium text-on-surface-variant">Taxi Médical Foyalais #12</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Chauffeur: A. Rose</span>
</div>
</td>
<td className="py-space-md px-space-md whitespace-nowrap">
<div className="flex items-center gap-space-xs bg-[#D1FAE5] text-[#065F46] px-space-sm py-1 rounded-full font-label-md text-label-md w-fit font-bold shadow-sm">
<span className="material-symbols-outlined text-[14px]">done_all</span>
<span className="">Prise en charge effectuée</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant block mt-1">Départ brancard 09:18</span>
</td>
<td className="py-space-md px-space-md whitespace-nowrap text-right">
<span className="font-label-sm text-label-sm text-secondary font-bold">Clôturé • PMT OK</span>
</td>
</tr>
</tbody>
</table>
</div>

<div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm font-label-md text-label-md text-on-surface-variant">
<div className="flex items-center gap-space-sm">
<span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary"></span>
<span className="">Synchronisation automatique active toutes les 15s</span>
</div>
<div className="flex items-center gap-space-sm">
<span className="">Affichage : 4 sur 14 départs du jour</span>
<button className="text-primary hover:underline font-bold">Voir les 10 autres →</button>
</div>
</div>
</div>
</div>

<div className="hidden flex flex-col gap-space-lg" id="viewNewExpress">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">

<div className="lg:col-span-8 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm">
<div className="flex items-center justify-between pb-space-md mb-space-md border-b border-surface-container">
<div>
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Protocole Sortie Hospitalière Rapide</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-0.5">Demande de Sortie de Lit Express</h2>
</div>
<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[24px]">electric_bolt</span>
</div>
</div>
<form className="flex flex-col gap-space-lg" id="expressForm" >

<div className="flex flex-col gap-space-md">
<div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">1</span>
<span className="">Identification du Patient &amp; Localisation Lit</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">N° IPP / Dossier Patient *</label>
<div className="relative">
<input className="w-full h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm" placeholder="Ex: 972-0488219" required type="text" value="972-0812903" />
<button className="absolute right-2 top-2.5 text-primary text-[18px] material-symbols-outlined" title="Rapprocher avec DPI / Sillage" type="button">search</button>
</div>
<span className="font-label-sm text-label-sm text-secondary">Rapprochement DPI CHU actif</span>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">Nom &amp; Prénom du Patient *</label>
<input className="w-full h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm" placeholder="NOM Prénom" required type="text" value="BERNARD Éliane" />
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">Chambre / N° de Lit *</label>
<input className="w-full h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm" placeholder="Ex: Ch 312 - Lit A" required type="text" value="Chambre 318 - Lit B" />
</div>
</div>
</div>

<div className="flex flex-col gap-space-md">
<div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">2</span>
<span className="">Prescription Médicale de Transport (PMT)</span>
</div>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
<label className="cursor-pointer">
<input defaultChecked className="peer sr-only" name="transportMode" type="radio" value="ambulance" />
<div className="p-space-md rounded-xl bg-surface-container-low peer-defaultChecked:bg-surface-container peer-defaultChecked:shadow-md transition-all flex flex-col gap-space-xs relative">
<div className="flex items-center justify-between">
<span className="material-symbols-outlined text-primary text-[28px]">airline_seat_flat</span>
<span className="material-symbols-outlined text-secondary text-[20px] hidden peer-defaultChecked:block">check_circle</span>
</div>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">Ambulance</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Position allongée ou demi-assise, surveillance constante</span>
<span className="font-label-sm text-label-sm text-primary font-bold mt-1">100% Pris en Charge</span>
</div>
</label>
<label className="cursor-pointer">
<input className="peer sr-only" name="transportMode" type="radio" value="vsl" />
<div className="p-space-md rounded-xl bg-surface-container-low peer-defaultChecked:bg-surface-container peer-defaultChecked:shadow-md transition-all flex flex-col gap-space-xs relative">
<div className="flex items-center justify-between">
<span className="material-symbols-outlined text-secondary text-[28px]">directions_car</span>
<span className="material-symbols-outlined text-secondary text-[20px] hidden peer-defaultChecked:block">check_circle</span>
</div>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">VSL Médicalisé</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Position assise, aide technique à la marche requise</span>
<span className="font-label-sm text-label-sm text-secondary font-bold mt-1">Conventionné CPAM</span>
</div>
</label>
<label className="cursor-pointer">
<input className="peer sr-only" name="transportMode" type="radio" value="taxi" />
<div className="p-space-md rounded-xl bg-surface-container-low peer-defaultChecked:bg-surface-container peer-defaultChecked:shadow-md transition-all flex flex-col gap-space-xs relative">
<div className="flex items-center justify-between">
<span className="material-symbols-outlined text-tertiary text-[28px]">local_taxi</span>
<span className="material-symbols-outlined text-secondary text-[20px] hidden peer-defaultChecked:block">check_circle</span>
</div>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">Taxi Conventionné</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Patient autonome pouvant voyager assis sans aide soignante</span>
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold mt-1">Agrément 972</span>
</div>
</label>
</div>
</div>

<div className="flex flex-col gap-space-md">
<div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">3</span>
<span className="">Destination, Horaire &amp; Spécificités d'Étage</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">Heure de départ souhaitée du service *</label>
<div className="grid grid-cols-2 gap-space-xs">
<input className="h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm" required type="date" value="2024-10-28" />
<input className="h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm" required type="time" value="13:30" />
</div>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">Type d'Établissement / Arrivée *</label>
<select className="h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm">
<option >Retour au Domicile</option>
<option>Transfert EHPAD / Résidence Senior</option>
<option>Transfert SSR (Trinité / Saint-Esprit)</option>
<option>Clinique Sainte-Marie (Schoelcher)</option>
<option>Centre d'Hémodialyse externe</option>
</select>
</div>
<div className="sm:col-span-2 flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">Adresse Complète de Prise en Charge à l'Arrivée *</label>
<input className="w-full h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm" placeholder="Numéro, Rue, Résidence, Bâtiment, Ville, Code Postal" required type="text" value="Résidence Les Balisiers, Apt 24, 97233 Schoelcher" />
</div>
</div>

<div className="bg-surface-container-low p-space-md rounded-xl flex flex-col sm:flex-row flex-wrap gap-space-md">
<label className="flex items-center gap-space-xs cursor-pointer">
<input defaultChecked className="w-5 h-5 rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-md text-label-md text-on-surface font-bold">Brancardage lourd / Étage sans ascenseur</span>
</label>
<label className="flex items-center gap-space-xs cursor-pointer">
<input className="w-5 h-5 rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-md text-label-md text-on-surface font-bold">Oxygénothérapie continue</span>
</label>
<label className="flex items-center gap-space-xs cursor-pointer">
<input defaultChecked className="w-5 h-5 rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-md text-label-md text-on-surface font-bold">Fauteuil roulant personnel à embarquer</span>
</label>
<label className="flex items-center gap-space-xs cursor-pointer">
<input className="w-5 h-5 rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-md text-label-md text-on-surface font-bold">Isolement infectieux contact/gouttelettes</span>
</label>
</div>
</div>

<div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">security</span>
<span className="">Diffusion instantanée aux 42 ambulanciers &amp; taxis conventionnés 972</span>
</div>
<div className="flex items-center gap-space-sm w-full sm:w-auto">
<button className="w-full sm:w-auto px-space-lg h-12 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all"  type="button">
                  Annuler
                </button>
<button className="w-full sm:w-auto px-space-xl h-12 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-space-xs shadow-md transition-all" type="submit">
<span className="material-symbols-outlined text-[20px]">broadcast_on_personal</span>
<span className="">Diffuser la demande de sortie</span>
</button>
</div>
</div>
</form>
</div>

<div className="lg:col-span-4 flex flex-col gap-space-lg">

<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
<div className="flex items-center gap-space-xs text-primary">
<span className="material-symbols-outlined text-[24px]">verified</span>
<h3 className="font-headline-sm text-headline-sm font-bold">Rappel Bonnes Pratiques Cadres</h3>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
              En application de l'article R.322-10-1 du Code de la Sécurité Sociale, la prescription médicale de transport doit correspondre strictement à l'état d'autonomie du patient au jour du départ.
            </p>
<div className="flex flex-col gap-space-xs bg-surface-container-low p-space-sm rounded-lg">
<span className="font-label-md text-label-md text-primary font-bold">Sorties Avant 12h00 :</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Priorisées sur la tournée de libération des lits d'aval des urgences CHU.</span>
</div>
<div className="flex flex-col gap-space-xs bg-surface-container-low p-space-sm rounded-lg">
<span className="font-label-md text-label-md text-secondary font-bold">Navette Trinité &lt;-&gt; FDF :</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Départs réguliers coordonnées à 10h30, 14h00 et 17h30.</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Disponibilité Flotte 972</span>
<span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
</div>
<div className="flex flex-col gap-space-sm">
<div className="flex justify-between items-center font-label-md text-label-md">
<span className="text-on-surface-variant">Ambulances disponibles Fort-de-France</span>
<span className="font-bold text-primary">7 actives</span>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-primary h-full w-[75%]"></div>
</div>
<div className="flex justify-between items-center font-label-md text-label-md mt-1">
<span className="text-on-surface-variant">VSL Secteur Lamentin / Schoelcher</span>
<span className="font-bold text-secondary">11 actifs</span>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-secondary h-full w-[90%]"></div>
</div>
<div className="flex justify-between items-center font-label-md text-label-md mt-1">
<span className="text-on-surface-variant">Taxis conventionnés Nord &amp; Sud</span>
<span className="font-bold text-tertiary">18 actifs</span>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-tertiary h-full w-[60%]"></div>
</div>
</div>
<div className="pt-space-sm text-center">
<span className="font-label-sm text-label-sm text-on-surface-variant">Délai estimé moyen de réponse : <strong className="text-on-surface">3 à 5 minutes</strong></span>
</div>
</div>
</div>
</div>
</div>

<div className="hidden flex flex-col gap-space-lg" id="viewBordereaux">
<div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col gap-space-lg">
<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border-b border-surface-container pb-space-md">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Télétransmission BBD &amp; PECSE Titre Subrogatoire</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-0.5">Bordereaux de Sortie &amp; Validation PMT</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Signature électronique des prescriptions de transport par les praticiens hospitaliers du service.</p>
</div>
<div className="flex items-center gap-space-sm">
<button className="bg-secondary text-on-secondary hover:bg-secondary/90 px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-space-xs shadow-sm transition-all">
<span className="material-symbols-outlined text-[18px]">draw</span>
<span className="">Signature Groupée (3 PMT)</span>
</button>
</div>
</div>

<div className="flex flex-col gap-space-md">

<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]">description</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-label-lg text-label-lg font-bold text-on-surface">PMT N° 972-2024-88190</span>
<span className="bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold">En attente signature Médecin</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Patient : Mme CÉLESTINE Ginette • Trajet : CHU Zobda-Quitman → Domicile Schoelcher</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Prescripteur : Dr. V. Lamartine (Néphrologue) • Motif : Sortie de dialyse bimensuelle</span>
</div>
</div>
<div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
<button className="bg-surface-container hover:bg-surface-container-high text-primary px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all">
                Aperçu Cerfa
              </button>
<button className="bg-primary text-on-primary hover:bg-primary-container px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-1 shadow-sm transition-all">
<span className="material-symbols-outlined text-[18px]">fingerprint</span>
                Signer PMT
              </button>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]">description</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-label-lg text-label-lg font-bold text-on-surface">PMT N° 972-2024-88194</span>
<span className="bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold">En attente signature Médecin</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Patient : Mme JOSEPH-MONROSE L. • Trajet : CHU → SSR Hôpital Louis Domergue Trinité</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Prescripteur : Dr. P. Aliker (Chef de Clinique) • Motif : Transfert convalescence post-op</span>
</div>
</div>
<div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
<button className="bg-surface-container hover:bg-surface-container-high text-primary px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all">
                Aperçu Cerfa
              </button>
<button className="bg-primary text-on-primary hover:bg-primary-container px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-1 shadow-sm transition-all">
<span className="material-symbols-outlined text-[18px]">fingerprint</span>
                Signer PMT
              </button>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md opacity-90">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]">task_alt</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-label-lg text-label-lg font-bold text-on-surface">PMT N° 972-2024-88012</span>
<span className="bg-[#D1FAE5] text-[#065F46] px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold">Signé &amp; Télétransmis CPAM</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Patient : M. BELLAY Thierry • Société assignée : Taxi Médical Foyalais</span>
<span className="font-label-sm text-label-sm text-secondary mt-0.5">Accusé BBD reçu • CPAM Martinique 972 / N° Bordereau: BDX-24-9912</span>
</div>
</div>
<div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
<button className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-1 transition-all">
<span className="material-symbols-outlined text-[18px]">download</span>
                Télécharger Billet
              </button>
</div>
</div>
</div>
</div>
</div>
</section>


</div></main><footer className="w-full bg-surface-container-lowest shadow-[0_1px_8px_rgba(11,37,69,0.04)] py-space-xl"><div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter-lg mb-space-xl"><div className="flex flex-col gap-space-sm"><div className="flex items-center gap-space-xs"><img alt="Brand logo. - Primary color: #0b5c9e
- Font: plusJakartaSans
- Mode: light
- Roundness: rounded-md
" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1XfD3evNv8jpKEQassyB67JCw2Z0av_XyxFzLWrX7T_Xx8sMiJ1T5FG_x_xt6Uc30fX_NkOLLu-QUvuyenXhvnYZv6QdHbyqsw8uiohhzRJs6OldzTsjmC8Jc25JWFEbRmRbZlFu9rcUI38KFr99-pARGS5nsX8yJ5qtCzmaS_McFBBZ_ihIZURxVPq-6QZZtNX4KjVd9NjlfYTvY4JmzROZ9rV53JUiOJxdMyuXkVuJZIn_EI-HUt4mw" /><span className="font-headline-sm text-headline-sm text-primary font-bold">Médic'Trans 972</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Dispositif territorial de coordination et régulation des transports sanitaires d'urgence et programmés de l'île de la Martinique.</p><div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md"><span className="material-symbols-outlined text-[18px]">verified</span><span className="">Opérateur Conventionné ARS Martinique</span></div></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Régulation &amp; Urgences 972</h3><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-primary">phone_in_talk</span><span className="font-bold text-on-surface">05 96 55 20 00</span> (Ligne directe 24/7)</li><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-secondary">support_agent</span>SAMU Centre 15 Martinique</li><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-on-surface-variant">mail</span>coordination@medictrans972.fr</li><li className="flex items-center gap-space-xs"><span className="material-symbols-outlined text-[18px] text-on-surface-variant">location_on</span>Plateau Technique, CHU Zobda-Quitman, 97200 Fort-de-France</li></ul></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Pôles Hospitaliers Desservis</h3><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="">CHU de Martinique (Zobda-Quitman / Mère-Enfant)</li><li className="">Hôpital Louis Domergue (La Trinité)</li><li className="">Hôpital du Saint-Esprit &amp; Pôle Sud Martinique</li><li className="">Clinique Sainte-Marie (Schoelcher)</li><li className="">Centre de Convalescence du Carbet</li></ul></div><div className="flex flex-col gap-space-sm"><h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Cadre Légal &amp; Conformité</h3><div className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><div className="bg-surface-container-low p-space-sm rounded-lg"><span className="font-label-md text-label-md text-primary font-bold block">CPAM Martinique 972</span><span className="font-label-sm text-label-sm">Télétransmission BBD &amp; PECSE Titre Subrogatoire</span></div><div className="bg-surface-container-low p-space-sm rounded-lg"><span className="font-label-md text-label-md text-secondary font-bold block">Agrément ARS N° 972-2024-SAN</span><span className="font-label-sm text-label-sm">Ambulances Catégorie A &amp; VSL Catégorie D</span></div></div></div></div><div className="pt-space-md bg-surface-container-low/50 rounded-lg p-space-md flex flex-col md:flex-row items-center justify-between gap-space-md"><span className="font-body-sm text-body-sm text-on-surface-variant">© 2024 Médic'Trans Martinique (972). Tous droits réservés. Mentions légales</span></div></div></footer>


    </div>
  );
};
