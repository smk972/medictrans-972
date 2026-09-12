import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const TransporterPortalPage: React.FC = () => {
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
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex flex-col pt-space-md pb-space-lg shadow-[0_1px_8px_rgba(11,28,48,0.04)]"><div className="px-space-md pb-space-md flex items-center gap-space-sm"><img alt="Logo Médic'Trans Martinique" className="h-7 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1XfD3evNv8jpKEQassyB67JCw2Z0av_XyxFzLWrX7T_Xx8sMiJ1T5FG_x_xt6Uc30fX_NkOLLu-QUvuyenXhvnYZv6QdHbyqsw8uiohhzRJs6OldzTsjmC8Jc25JWFEbRmRbZlFu9rcUI38KFr99-pARGS5nsX8yJ5qtCzmaS_McFBBZ_ihIZURxVPq-6QZZtNX4KjVd9NjlfYTvY4JmzROZ9rV53JUiOJxdMyuXkVuJZIn_EI-HUt4mw" /><div className="flex flex-col"><span className="font-headline-sm text-headline-sm text-primary">Médic'Trans</span><span className="font-label-sm text-label-sm text-secondary">Plateforme Régionale 972</span></div></div><nav className="flex-1 px-space-sm flex flex-col gap-space-xs mt-space-sm" data-active-classes="bg-primary-container text-on-primary font-bold rounded-lg"><Link className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="suivi-des-courses" to="/suivi"><span className="material-symbols-outlined">alt_route</span><span className="font-label-md text-label-md">Suivi des courses</span></Link><a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="planning-et-disponibilites" href="#"><span className="material-symbols-outlined">calendar_month</span><span className="font-label-md text-label-md">Planning Véhicules</span></a><a className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="flotte-ambulances" href="#"><span className="material-symbols-outlined">airport_shuttle</span><span className="font-label-md text-label-md">Flotte sanitaire</span></a></nav><div className="px-space-md pt-space-md bg-surface-container-low mx-space-sm rounded-lg"><div className="flex items-center gap-space-xs mb-1"><span className="w-2 h-2 rounded-full bg-secondary"></span><span className="font-label-sm text-label-sm text-secondary font-bold">Permanence Régul. 972</span></div><p className="font-body-sm text-body-sm text-on-surface-variant mb-1">CHU Zobda-Quitman &amp; SAMU</p><span className="font-label-md text-label-md text-primary font-bold">05 96 72 00 97</span></div></aside><div className="pl-72"><header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.04)] z-40 flex items-center justify-between px-space-lg"><div className="flex items-center gap-space-sm"><span className="font-label-md text-label-md text-on-surface-variant">Secteur Régional :</span><span className="font-label-md text-label-md text-primary font-bold">Martinique Centre &amp; Nord/Sud</span></div><div className="flex items-center gap-space-md"><div className="flex items-center gap-space-xs"><span className="w-2 h-2 rounded-full bg-secondary"></span><span className="font-label-sm text-label-sm text-secondary">24/7 En ligne</span></div><img alt="Profile" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4Ou_gXxYmMgUKkBpcflANalR_XKHPbHvwsPitIeGO2reHkEGUG103yn97linWcTa61QoMJdDmse0trP1AsufCLlho-yPDuOCqGLeBIVIZT_4DcmQXvYxyG73gclmKMBKdOVXjuBC04Hbop4SaJBiiXnbo_czHLOTKWDm5awphPacifmkMZm_j6Q0sy9g4tnTUta-Q64hDr91Qxby1dLSFHY54zcb_dLnGHO7YAxbylb9SwBxtqB6y" /><div className="flex flex-col text-left"><span className="font-label-md text-label-md text-on-surface leading-none">Coord. Zobda-Quitman</span><span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-1">CHU Martinique</span></div></div></header><main className="relative pt-16 bg-surface w-full px-space-lg py-space-lg min-h-screen"><div className="flex flex-col w-full gap-space-lg">
<div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
<div className="flex flex-col gap-space-xs">
<div className="flex items-center gap-space-sm flex-wrap">
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          Flux Direct Régulation 972
        </span>

</div>
<h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
        Portail Transporteur — Régulation &amp; Opportunités de courses
      </h1>

</div>
<div className="flex items-center gap-space-md bg-surface-container-low p-space-md rounded-xl">
<div className="w-12 h-12 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-md">
<span className="material-symbols-outlined text-2xl">local_shipping</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-space-xs">
<span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">Ambulances Caraïbes Express</span>
<span className="material-symbols-outlined text-secondary text-base" title="Agréé ARS &amp; CPAM">verified</span>
</div>
<div className="flex items-center gap-2 flex-wrap text-on-surface-variant">
<span className="font-label-sm text-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface font-semibold">Conventionné CPAM 972</span>
<span className="font-label-sm text-label-sm flex items-center gap-1 text-secondary font-bold">
<span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            4 véhicules en service
          </span>
</div>
</div>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between h-full border-surface-container">
<div className="flex flex-col justify-between h-full gap-1">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">Missions dispo.</span>
<div className="font-headline-lg text-headline-lg text-primary font-bold">8</div>
<span className="font-body-sm text-body-sm text-secondary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-sm">bolt</span> 1 urgente à pourvoir
</span>
</div>
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-2xl">radar</span>
</div>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between h-full border-surface-container">
<div className="flex flex-col justify-between h-full gap-1">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">Planning du jour</span>
<div className="font-headline-lg text-headline-lg text-on-surface font-bold">5</div>
<span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-sm text-secondary">check_circle</span> 3 réalisées • 2 à venir
</span>
</div>
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
<span className="material-symbols-outlined text-2xl">task_alt</span>
</div>
</div>
<div className="bg-primary text-on-primary p-space-md rounded-xl shadow-sm flex items-center justify-between h-full">
<div className="flex flex-col justify-between h-full gap-1">
<span className="font-label-sm text-label-sm text-on-primary-container uppercase font-bold tracking-wider">Régul. SAMU 972</span>
<div className="font-headline-md text-headline-md font-bold text-white">Ligne Ouverte</div>
<span className="font-body-sm text-body-sm text-surface-variant font-medium flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span> Canal Prioritaire Dédié
</span>
</div>
<div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-inner">
<span className="material-symbols-outlined text-2xl">phone_in_talk</span>
</div>
</div>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-md">
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-xs text-on-surface">
<span className="material-symbols-outlined text-primary text-xl">tune</span>
<span className="font-headline-sm text-headline-sm font-bold">Filtrer les opportunités</span>
</div>
<div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
        Actualisation automatique (5s)
      </div>
</div>
<div className="flex flex-col gap-space-sm">
<div className="flex flex-wrap items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase mr-1">Secteur :</span>
<button className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm" type="button">
          Tous (8)
        </button>
<button className="px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md" type="button">
          Centre (FDF / Lamentin) (4)
        </button>
<button className="px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md" type="button">
          Sud (Ducos, Rivière-Salée, Marin) (2)
        </button>
<button className="px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md" type="button">
          Nord Atlantique / Caraïbe (2)
        </button>
</div>
<div className="flex flex-wrap items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase mr-1">Véhicule :</span>
<button className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md font-bold flex items-center gap-1.5" type="button">
<span className="">🚑</span> Ambulance (3)
        </button>
<button className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-1.5" type="button">
<span className="">🚐</span> VSL (3)
        </button>
<button className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md flex items-center gap-1.5" type="button">
<span className="">🚗</span> Taxi conventionné (2)
        </button>
</div>
</div>
</div>
<div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
<div className="xl:col-span-8 flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<h2 className="font-headline-md text-headline-md text-on-surface font-bold">Missions disponibles immédiatement</h2>
<span className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold flex items-center justify-center">3</span>
</div>
<span className="font-label-md text-label-md text-primary font-semibold cursor-pointer hover:underline flex items-center gap-1">
<span className="material-symbols-outlined text-base">refresh</span> Actualiser
        </span>
</div>
<article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col gap-space-md relative overflow-hidden transition-all duration-200" id="card-mission-urgent">
<div className="w-2 absolute left-0 top-0 bottom-0 bg-error"></div>
<div className="flex flex-wrap items-center justify-between gap-space-sm pl-2">
<div className="flex items-center gap-space-xs flex-wrap">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold animate-pulse">
<span className="w-2 h-2 rounded-full bg-error"></span>
              URGENT • Demande reçue il y a 3 minutes - En attente
            </span>
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm font-bold">
<span className="">🚑</span> Ambulance Allongée
            </span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-mono">REF: 972-MED-8492</span>
</div>
<div className="pl-2 flex flex-col lg:flex-row lg:items-start justify-between gap-space-md bg-surface-container-low p-space-md rounded-lg">
<div className="flex flex-col gap-1 min-w-0">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary">person</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">M. Marcel L. (82 ans)</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-secondary text-base">verified</span>
              Bon de transport 100% ALD joint • Prescription Médicale de Transport n°9720491
            </p>
<div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container text-on-surface font-label-sm text-label-sm">
<span className="material-symbols-outlined text-base text-primary">stairs</span>
<strong>Spécificité :</strong> Brancardage 1er étage sans ascenseur (2 ambulanciers requis)
            </div>
</div>
<div className="flex flex-col items-end shrink-0">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Prise en charge</span>
<span className="font-headline-md text-headline-md text-primary font-bold">Sortie à 16:30</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">Aujourd'hui</span>
</div>
</div>
<div className="pl-2 grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
<div className="md:col-span-7 flex flex-col gap-space-sm">
<div className="flex items-start gap-3">
<div className="flex flex-col items-center mt-1">
<span className="w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center ring-4 ring-primary-fixed"></span>
<span className="w-0.5 h-10 bg-surface-container-highest my-0.5"></span>
<span className="w-3.5 h-3.5 rounded-full bg-secondary flex items-center justify-center ring-4 ring-secondary-container"></span>
</div>
<div className="flex flex-col justify-between h-full gap-3 min-w-0">
<div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">Départ</span>
<p className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">Hôpital de Trinité • Service Gériatrie Aigue</p>
<span className="font-body-sm text-body-sm text-on-surface-variant">Boulevard Général de Gaulle, 97220 La Trinité</span>
</div>
<div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">Arrivée</span>
<p className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">Domicile • Le Robert (Pointe Lynch)</p>
<span className="font-body-sm text-body-sm text-on-surface-variant">Chemin des Frangipaniers, 97231 Le Robert</span>
</div>
</div>
</div>
</div>
<div className="md:col-span-5 bg-surface-container p-space-md rounded-lg flex flex-col justify-center gap-space-xs">
<div className="flex items-center justify-between text-on-surface">
<span className="font-label-md text-label-md text-on-surface-variant">Trajet estimé :</span>
<span className="font-headline-sm text-headline-sm font-bold text-primary">14 km (22 min)</span>
</div>
<div className="flex items-center justify-between text-on-surface">
<span className="font-label-md text-label-md text-on-surface-variant">Prise en charge CPAM :</span>
<span className="font-label-md text-label-md font-bold text-secondary">100% Tiers payant</span>
</div>
<div className="flex items-center justify-between text-on-surface">
<span className="font-label-md text-label-md text-on-surface-variant">Tarif conventionnel :</span>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">94,80 €</span>
</div>
</div>
</div>
<div className="pl-2 pt-space-xs flex flex-col sm:flex-row items-center justify-end gap-space-sm">
<button className="w-full sm:w-auto px-5 py-3 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2"  type="button">
<span className="material-symbols-outlined text-lg">close</span>
            Décliner / Pas disponible
          </button>
<button className="w-full sm:w-auto px-7 py-3 rounded-lg bg-secondary text-on-secondary hover:bg-on-secondary-container transition-all shadow-md hover:shadow-lg font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 text-white"  type="button">
<span className="material-symbols-outlined text-xl">check_circle</span>
            Accepter cette mission
          </button>
</div>
</article>
<article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md relative overflow-hidden transition-all duration-200" id="card-mission-taxi">
<div className="flex flex-wrap items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-xs flex-wrap">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
              Nouveau • Consultation programmée
            </span>
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold">
<span className="">🚗</span> Taxi conventionné (Assis)
            </span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-mono">REF: 972-TX-1044</span>
</div>
<div className="flex flex-col md:flex-row md:items-start justify-between gap-space-md bg-surface-container-low p-space-md rounded-lg">
<div>
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary">person</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Mme Roselyne B. (59 ans)</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-secondary text-base">verified</span>
              ALD Cardiologie • Accord préalable CPAM validé
            </p>
</div>
<div className="text-left md:text-right">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Prise en charge</span>
<div className="font-headline-md text-headline-md text-primary font-bold">Demain à 07:45</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">RDV Clinique : 08:30</span>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
<div className="md:col-span-8 flex flex-col gap-space-sm">
<div className="flex items-start gap-3">
<div className="flex flex-col items-center mt-1">
<span className="w-3 h-3 rounded-full bg-primary"></span>
<span className="w-0.5 h-8 bg-surface-container-highest my-0.5"></span>
<span className="w-3 h-3 rounded-full bg-secondary"></span>
</div>
<div className="flex flex-col justify-between h-full gap-2 min-w-0">
<div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">Départ</span>
<p className="font-body-lg text-body-lg text-on-surface font-semibold truncate">Le François • Quartier Presqu'île</p>
</div>
<div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">Arrivée</span>
<p className="font-body-lg text-body-lg text-on-surface font-semibold truncate">CHU Pierre Zobda-Quitman • Consultations Cardiologie</p>
</div>
</div>
</div>
</div>
<div className="md:col-span-4 bg-surface-container p-space-md rounded-lg flex flex-col justify-center gap-1 text-on-surface">
<span className="font-label-md text-label-md text-on-surface-variant">Distance : 26 km (~35 min)</span>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">58,20 € CPAM</span>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Télétrans. Noémie active</span>
</div>
</div>
<div className="flex flex-col sm:flex-row items-center justify-end gap-space-sm pt-space-xs">
<button className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-lg text-label-lg font-semibold"  type="button">
            Décliner
          </button>
<button className="w-full sm:w-auto px-7 py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-all font-label-lg text-label-lg font-bold flex items-center justify-center gap-2"  type="button">
<span className="material-symbols-outlined text-lg">check_circle</span>
            Accepter cette mission
          </button>
</div>
</article>
<article className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md relative overflow-hidden transition-all duration-200" id="card-mission-vsl">
<div className="flex flex-wrap items-center justify-between gap-space-sm">
<div className="flex items-center gap-space-xs flex-wrap">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
              Consultation Oncologie • Récurrent
            </span>
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold">
<span className="">🚐</span> VSL (Véhicule Sanitaire Léger)
            </span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-mono">REF: 972-VSL-3312</span>
</div>
<div className="flex flex-col md:flex-row md:items-start justify-between gap-space-md bg-surface-container-low p-space-md rounded-lg">
<div>
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary">person</span>
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">M. Christian V. (71 ans)</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-secondary text-base">accessible</span>
              Aide à la marche • Fauteuil roulant pliable dans le coffre
            </p>
</div>
<div className="text-left md:text-right">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Prise en charge</span>
<div className="font-headline-md text-headline-md text-primary font-bold">Demain à 13:15</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Retour prévu à 17:00</span>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
<div className="md:col-span-8 flex flex-col gap-space-sm">
<div className="flex items-start gap-3">
<div className="flex flex-col items-center mt-1">
<span className="w-3 h-3 rounded-full bg-primary"></span>
<span className="w-0.5 h-8 bg-surface-container-highest my-0.5"></span>
<span className="w-3 h-3 rounded-full bg-secondary"></span>
</div>
<div className="flex flex-col justify-between h-full gap-2 min-w-0">
<div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">Départ</span>
<p className="font-body-lg text-body-lg text-on-surface font-semibold truncate">Sainte-Marie • Bourg</p>
</div>
<div>
<span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">Arrivée</span>
<p className="font-body-lg text-body-lg text-on-surface font-semibold truncate">Clinique Sainte-Marie • Schoelcher</p>
</div>
</div>
</div>
</div>
<div className="md:col-span-4 bg-surface-container p-space-md rounded-lg flex flex-col justify-center gap-1 text-on-surface">
<span className="font-label-md text-label-md text-on-surface-variant">Distance : 33 km (~42 min)</span>
<span className="font-headline-sm text-headline-sm font-bold text-on-surface">67,40 € CPAM</span>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Trajet Aller &amp; Retour</span>
</div>
</div>
<div className="flex flex-col sm:flex-row items-center justify-end gap-space-sm pt-space-xs">
<button className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-lg text-label-lg font-semibold"  type="button">
            Décliner
          </button>
<button className="w-full sm:w-auto px-7 py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-all font-label-lg text-label-lg font-bold flex items-center justify-center gap-2"  type="button">
<span className="material-symbols-outlined text-lg">check_circle</span>
            Accepter cette mission
          </button>
</div>
</article>
</div>
<div className="xl:col-span-4 flex flex-col gap-space-md">
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary">calendar_today</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Missions acceptées du jour</h3>
</div>
<span className="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container font-bold px-2.5 py-0.5 rounded-full">
            3 en cours / finies
          </span>
</div>
<div className="flex flex-col gap-space-md relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-surface-container-highest" id="accepted-missions-container">
<div className="flex gap-space-sm relative pl-7">
<span className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm font-bold absolute left-0 top-0 ring-4 ring-surface-container-lowest">
<span className="material-symbols-outlined text-xs">done</span>
</span>
<div className="flex-1 bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-bold">08:15 • Mme Yolande D.</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">Terminée</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Lamentin ➔ CHU Zobda-Quitman</p>
<div className="flex items-center justify-between mt-1 pt-1 border-t border-surface-container text-on-surface-variant font-label-sm text-label-sm">
<span className="flex items-center gap-1 text-secondary font-semibold">
<span className="material-symbols-outlined text-sm">draw</span> Bon signé numériquement
                </span>
<span className="font-mono font-bold">42,50 €</span>
</div>
</div>
</div>
<div className="flex gap-space-sm relative pl-7">
<span className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm font-bold absolute left-0 top-0 ring-4 ring-surface-container-lowest">
<span className="material-symbols-outlined text-xs">done</span>
</span>
<div className="flex-1 bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-bold">11:00 • M. Henri T.</span>
<span className="font-label-sm text-label-sm text-secondary font-bold">Terminée</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">Ducos ➔ Centre Dialyse Schoelcher</p>
<div className="flex items-center justify-between mt-1 pt-1 border-t border-surface-container text-on-surface-variant font-label-sm text-label-sm">
<span className="flex items-center gap-1 text-secondary font-semibold">
<span className="material-symbols-outlined text-sm">draw</span> Bon signé numériquement
                </span>
<span className="font-mono font-bold">54,00 €</span>
</div>
</div>
</div>
<div className="flex gap-space-sm relative pl-7">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm font-bold absolute left-0 top-0 ring-4 ring-surface-container-lowest animate-pulse">
<span className="material-symbols-outlined text-xs">directions_car</span>
</span>
<div className="flex-1 bg-surface-container-high p-space-sm rounded-lg flex flex-col gap-1">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-on-surface font-bold">14:00 • Mme Nicole F.</span>
<span className="font-label-sm text-label-sm bg-primary text-on-primary px-2 py-0.5 rounded font-bold">En Route</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface">Fort-de-France ➔ Hôpital Mangot-Vulcin</p>
<div className="flex items-center justify-between mt-1 pt-1 border-t border-surface-variant text-on-surface-variant font-label-sm text-label-sm">
<span className="flex items-center gap-1 text-on-surface font-medium">
<span className="material-symbols-outlined text-sm text-primary">pin_drop</span> Chauffeur: Kevin (Amb. 02)
                </span>
<span className="text-primary font-bold">Attente signature</span>
</div>
</div>
</div>
</div>
</div>
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold flex items-center gap-2">
<span className="material-symbols-outlined text-secondary">map</span> Carte • Véhicules en direct
          </h3>
<span className="font-label-sm text-label-sm text-on-surface-variant font-mono">Martinique (972)</span>
</div>
<div className="w-full h-44 bg-surface-container rounded-lg relative overflow-hidden flex flex-col justify-end p-space-sm shadow-inner" data-location="Fort-de-France, Martinique" >
<div className="bg-surface-container-lowest/90 backdrop-blur-md p-2 rounded-md flex items-center justify-between shadow-sm">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping"></span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">4 véhicules localisés GPS</span>
</div>
<span className="font-label-sm text-label-sm text-primary font-semibold">Ouvrir plein écran</span>
</div>
</div>
<div className="grid grid-cols-2 gap-2">
<div className="bg-surface-container-low p-2 rounded flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Amb-01 (Trinité)</span>
<span className="font-label-md text-label-md text-on-surface font-bold">Disponible</span>
</div>
<div className="bg-surface-container-low p-2 rounded flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Amb-02 (FDF)</span>
<span className="font-label-md text-label-md text-primary font-bold">En mission</span>
</div>
<div className="bg-surface-container-low p-2 rounded flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">VSL-01 (Lamentin)</span>
<span className="font-label-md text-label-md text-on-surface font-bold">Disponible</span>
</div>
<div className="bg-surface-container-low p-2 rounded flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Taxi-01 (Ducos)</span>
<span className="font-label-md text-label-md text-secondary font-bold">Attente retour</span>
</div>
</div>
</div>
<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center gap-space-md">
<img className="w-16 h-16 rounded-xl object-cover shrink-0 shadow" data-alt="Photo professionnelle d'un ambulancier antillais souriant et équipé en uniforme d'intervention sanitaire en Martinique, tenant une tablette de télétransmission numérique devant une ambulance blanche et bleue Caraïbes Express" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS_Cx5oWrcoUc6yLbuS3kFZZM2ubrxZg96tS8rLHoZuebV1akbgJtuuUbqDQ4zxKWNmTnSguktqcgKxkWn8rpY-GlIG16ElalhHDzdAaIlGzOEQTYPh_-vNb8PpMjB_v_iyoyqDN5OMSSGbjkduMBVH1b5IljgFhD8is0A77VCMkfc6iiM68Er1pUS2isZSZp0_XsBtOWetJ3nJ0U61ZHT2_ptARlWHJM1rUgciWW_A-wfyU5KST-T" />
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md text-on-surface font-bold">Permanence de Garde 972</span>
<span className="font-body-sm text-body-sm text-on-surface-variant truncate">Astricte préfecture week-end activée</span>
<span className="font-label-sm text-label-sm text-primary font-bold mt-1">Équipes de renfort prêtes • N° 05 96 72 00 97</span>
</div>
</div>
</div>
</div>
<div className="fixed bottom-6 right-6 max-w-md bg-surface-container-lowest text-on-surface p-space-md rounded-xl shadow-xl z-50 flex items-start gap-space-sm transform translate-y-20 opacity-0 pointer-events-none transition-all duration-300" id="toast-confirmation">
<div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-secondary">check_circle</span>
</div>
<div className="flex flex-col flex-1">
<span className="font-headline-sm text-headline-sm font-bold text-on-surface" id="toast-title">Mission acceptée !</span>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5" id="toast-msg">
        La course a été verrouillée pour Ambulances Caraïbes Express. Le bon de transport et l'itinéraire sont synchronisés sur les terminaux des équipages.
      </p>
</div>
<button className="text-on-surface-variant hover:text-on-surface"  type="button">
<span className="material-symbols-outlined text-lg">close</span>
</button>
</div>
<footer className="w-full py-space-sm text-center text-on-surface-variant font-body-sm text-body-sm"><p className="">© 2024 Médic'Trans Martinique (972). Tous droits réservés. Mentions légales</p></footer></div>
</main></div>




    </div>
  );
};
