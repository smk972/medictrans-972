import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
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
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.06)]"><div className="h-20 max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex items-center justify-between gap-space-md"><div className="flex items-center gap-space-md shrink-0"><img alt="Logo Médic'Trans Martinique" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1XfD3evNv8jpKEQassyB67JCw2Z0av_XyxFzLWrX7T_Xx8sMiJ1T5FG_x_xt6Uc30fX_NkOLLu-QUvuyenXhvnYZv6QdHbyqsw8uiohhzRJs6OldzTsjmC8Jc25JWFEbRmRbZlFu9rcUI38KFr99-pARGS5nsX8yJ5qtCzmaS_McFBBZ_ihIZURxVPq-6QZZtNX4KjVd9NjlfYTvY4JmzROZ9rV53JUiOJxdMyuXkVuJZIn_EI-HUt4mw" /><div className="flex flex-col"><span className="font-headline-sm text-headline-sm text-primary tracking-tight">Médic'Trans</span><span className="font-label-sm text-label-sm text-secondary -mt-1">Martinique 972</span></div></div><nav className="hidden xl:flex items-center gap-space-sm" data-active-classes="bg-primary-container text-on-primary font-bold rounded-lg"><Link className="px-3 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="accueil-presentation" to="/">Accueil &amp; Présentation</Link><Link className="px-3 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="reserver-un-transport" to="/reserver">Réserver un transport</Link><Link className="px-3 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="mes-demandes" to="/suivi">Mes Demandes</Link><Link className="px-3 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors" data-path="espace-transporteurs" to="/transporteurs">Espace Transporteurs</Link></nav><div className="flex items-center gap-space-md shrink-0"><div className="hidden md:flex flex-col items-end"><div className="flex items-center gap-space-xs"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span><span className="font-label-sm text-label-sm text-secondary">Disponible 24/7</span></div><span className="font-label-lg text-label-lg text-primary tracking-tight">05 96 72 00 97</span></div><div className="flex items-center gap-space-sm pl-space-sm"><img alt="Profile" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4Ou_gXxYmMgUKkBpcflANalR_XKHPbHvwsPitIeGO2reHkEGUG103yn97linWcTa61QoMJdDmse0trP1AsufCLlho-yPDuOCqGLeBIVIZT_4DcmQXvYxyG73gclmKMBKdOVXjuBC04Hbop4SaJBiiXnbo_czHLOTKWDm5awphPacifmkMZm_j6Q0sy9g4tnTUta-Q64hDr91Qxby1dLSFHY54zcb_dLnGHO7YAxbylb9SwBxtqB6y" /><div className="hidden lg:flex flex-col text-left"><span className="font-label-md text-label-md text-on-surface leading-none">Coord. Clinique</span><span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-1">CHU P. Zobda-Quitman</span></div></div></div></div></header><main className="w-full pt-20 bg-surface min-h-screen"><div className="flex flex-col w-full">

<section className="relative w-full overflow-hidden bg-surface-container-lowest py-space-xl">

<div className="absolute -top-36 -right-24 w-96 h-96 rounded-full bg-surface-variant/40 blur-3xl pointer-events-none"></div>
<div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-secondary-container/30 blur-3xl pointer-events-none"></div>
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative z-10">

<div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-xl">

<h1 className="font-headline-xl text-headline-xl text-primary tracking-tight mb-space-sm">
          Votre transport médicalisé en Martinique, réservé en toute sérénité.
        </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Service conçu pour les patients, proches aidants et équipes soignantes.</p>

<div className="flex items-center flex-wrap justify-center gap-space-lg mt-space-md text-on-surface-variant font-label-md text-label-md">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary" >verified_user</span>
<span className="">85+ Transporteurs Certifiés</span>
</div>
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary" >local_hospital</span>
<span className="">Tous Établissements 972</span>
</div>
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary" >schedule</span>
<span className="">Régulation 24h/24 &amp; 7j/7</span>
</div>
</div>
</div>

<div className="w-full max-w-4xl mx-auto bg-surface-container-lowest rounded-xl shadow-xl p-space-md md:p-space-xl">
<div className="flex items-center justify-between pb-space-md mb-space-md bg-surface-container-low -mx-space-md md:-mx-space-xl -mt-space-md md:-mt-space-xl px-space-md md:px-space-xl pt-space-md md:pt-space-md rounded-t-xl">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
<span className="material-symbols-outlined">speed</span>
</div>
<div>
<span className="font-headline-sm text-headline-sm text-primary block">Réservation Express de Transport</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Prise en charge directe avec prescription médicale (PMT)</span>
</div>
</div>

</div>
<form className="space-y-space-lg" id="expressBookingForm" >

<div>
<div className="flex items-center justify-between mb-space-sm">
<label className="font-label-lg text-label-lg text-on-surface flex items-center gap-space-xs">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center">1</span>
                Sélectionnez le mode de transport prescrit
              </label>
<span className="font-label-sm text-label-sm text-on-surface-variant">Indiqué sur le volet 1 de votre bon</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-md" id="transportSelectorGroup">

<div className="transport-option-card relative cursor-pointer p-space-md rounded-xl transition-all duration-200 bg-surface-container-low ring-2 ring-primary-container shadow-sm hover:shadow-md" >
<div className="badge-selected absolute top-3 right-3 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
<span className="material-symbols-outlined text-sm font-bold">check</span>
</div>
<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-space-sm">
<span className="material-symbols-outlined text-2xl">local_taxi</span>
</div>
<h2 className="font-headline-sm text-headline-sm text-on-surface mb-1">Taxi Conventionné</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
  Patient autonome pouvant voyager assis. Transport médicalisé sans brancard.
</p>
<div className="flex items-center gap-1.5 pt-space-xs text-primary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-base">verified</span>
<span className="">Patient autonome</span>
</div>
</div>

<div className="transport-option-card relative cursor-pointer p-space-md rounded-xl transition-all duration-200 bg-surface-container-lowest shadow-sm hover:shadow-md" >
<div className="badge-selected hidden absolute top-3 right-3 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
<span className="material-symbols-outlined text-sm font-bold">check</span>
</div>
<div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-space-sm">
<span className="material-symbols-outlined text-2xl">airport_shuttle</span>
</div>
<h2 className="font-headline-sm text-headline-sm text-on-surface mb-1">VSL (Sanitaire Léger)</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
                  Transport assis professionnalisé, aide à la marche et accompagnement soignant.
                </p>
<div className="flex items-center gap-1.5 pt-space-xs text-secondary font-label-sm text-label-sm">
<span className="material-symbols-outlined text-base">verified</span>
<span className="">Aide au transfert</span>
</div>
</div>

<div className="transport-option-card relative cursor-pointer p-space-md rounded-xl transition-all duration-200 bg-surface-container-lowest shadow-sm hover:shadow-md" >
<div className="badge-selected hidden absolute top-3 right-3 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-sm">
<span className="material-symbols-outlined text-sm font-bold">check</span>
</div>
<div className="w-12 h-12 rounded-lg bg-error-container flex items-center justify-center text-error mb-space-sm">
<span className="material-symbols-outlined text-2xl" >emergency</span>
</div>
<h2 className="font-headline-sm text-headline-sm text-on-surface mb-1">Ambulance</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
                  Position allongée ou demi-assise, surveillance paramédicale continue &amp; brancardage.
                </p>
<div className="flex items-center gap-1.5 pt-space-xs text-error font-label-sm text-label-sm">
<span className="material-symbols-outlined text-base">health_and_safety</span>
<span className="">Surveillance requise</span>
</div>
</div>
</div>
<input id="selectedTransportType" type="hidden" value="taxi" />
</div>

<div>
<div className="flex items-center justify-between mb-space-sm">
<label className="font-label-lg text-label-lg text-on-surface flex items-center gap-space-xs">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center">2</span>
                Détails du trajet &amp; Établissement
              </label>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Martinique 972</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">

<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface flex items-center gap-1" htmlFor="pickupAddress">
<span className="material-symbols-outlined text-base text-primary">my_location</span>
                  Lieu de prise en charge (Départ)
                </label>
<div className="relative">
<input className="w-full h-12 px-4 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" id="pickupAddress" placeholder="Ex: 14 Rue des Flamboyants, Le Lamentin..." required type="text" />
<button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-secondary transition-colors"  title="Utiliser ma position actuelle" type="button">
<span className="material-symbols-outlined text-xl">near_me</span>
</button>
</div>
<div className="flex gap-1.5 flex-wrap">
<button className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-variant"  type="button">Le Lamentin</button>
<button className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-variant"  type="button">Fort-de-France</button>
<button className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-variant"  type="button">Schoelcher</button>
<button className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-variant"  type="button">Le Marin</button>
</div>
</div>

<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface flex items-center gap-1" htmlFor="destinationFacility">
<span className="material-symbols-outlined text-base text-secondary">domain</span>
                  Établissement de soins de destination
                </label>
<div className="relative">
<select className="w-full h-12 px-4 pr-10 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm appearance-none" id="destinationFacility" required>
<option disabled  value="">Sélectionnez un hôpital, clinique ou centre...</option>
<optgroup label="CHU &amp; Hôpitaux Publics">
<option value="CHU Fort-de-France (P. Zobda-Quitman)">CHU de Martinique - P. Zobda-Quitman (FDF)</option>
<option value="Hôpital Louis Domergue (Trinité)">Hôpital Louis Domergue (La Trinité)</option>
<option value="Hôpital Albert Clarac (Fort-de-France)">Hôpital Albert Clarac (Fort-de-France)</option>
<option value="Centre Hospitalier de Saint-Pierre">Centre Hospitalier de Saint-Pierre</option>
<option value="Hôpital de Proximité du Marin">Hôpital de Proximité (Le Marin)</option>
<option value="Hôpital d'Instruction des Armées">Centre Médical Armées (Clairière)</option>
</optgroup>
<optgroup label="Cliniques &amp; Centres Spécialisés">
<option value="Clinique Sainte-Marie (Schoelcher)">Clinique Sainte-Marie (Schoelcher)</option>
<option value="Clinique Saint-Paul (Clairière)">Clinique Saint-Paul (Clairière FDF)</option>
<option value="Centre d'Hémodialyse Martinique (Dillon)">Centre d'Hémodialyse AGDUC / Dillon</option>
<option value="Centre Oncologie &amp; Radiothérapie Clarion">Centre Oncologie Martinique (Clarion)</option>
<option value="Centre de Rééducation Fonctionnelle La Valériane">CRF La Valériane (Gros-Morne)</option>
</optgroup>
<optgroup label="Autre destination">
<option value="Cabinet Médical Privé">Cabinet Médical / Laboratoire Privé</option>
<option value="Retour à Domicile">Retour à Domicile (Sortie d'hospitalisation)</option>
</optgroup>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">arrow_drop_down</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Accès direct aux zones dépose-minute ambulance &amp; VSL</span>
</div>

<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface flex items-center gap-1" htmlFor="transportDate">
<span className="material-symbols-outlined text-base text-primary">calendar_month</span>
                  Date du transport
                </label>
<input className="w-full h-12 px-4 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-center" id="transportDate" required type="date" />
</div>

<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface flex items-center gap-1" htmlFor="transportTime">
<span className="material-symbols-outlined text-base text-primary">schedule</span>
                  Heure souhaitée sur place
                </label>
<input className="w-full h-12 px-4 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-center" id="transportTime" required type="time" value="09:30" />
</div>
</div>

<div className="mt-space-md bg-surface-container-low rounded-xl p-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md">
  <div className="flex flex-col sm:flex-row sm:items-center gap-space-md">
    <span className="font-label-md text-label-md text-on-surface whitespace-nowrap">Type de parcours :</span>
    <div className="inline-flex items-center p-1 bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/30 gap-1" role="radiogroup">
      <label className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
        <input type="radio" name="tripType" value="aller-simple" className="w-4 h-4 text-primary focus:ring-primary" />
        <span className="">Aller simple</span>
      </label>
      <label className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer font-label-md text-label-md text-primary font-semibold bg-surface-container transition-colors">
        <input type="radio" name="tripType" value="aller-retour" defaultChecked className="w-4 h-4 text-primary focus:ring-primary" />
        <span className="">Aller &amp; Retour</span>
      </label>
    </div>
  </div>
  <div className="flex items-center gap-2 text-secondary bg-surface-container-lowest px-3 py-2 rounded-lg shadow-sm shrink-0 border border-outline-variant/30 w-fit">
    <span className="material-symbols-outlined text-xl">description</span>
    <span className="font-label-sm text-label-sm font-bold">PMT Obligatoire pour Tiers Payant</span>
  </div>
</div>
</div>

<div className="pt-space-sm flex flex-col sm:flex-row items-center justify-between gap-space-md">
<div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">


</div>
<button className="w-full sm:w-auto px-8 h-14 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-space-sm shrink-0" type="submit">
<span className="">Continuer ma réservation</span>
<span className="material-symbols-outlined text-xl">arrow_forward</span>
</button>
</div>
</form>

<div className="hidden mt-space-md p-space-md rounded-xl bg-surface-container text-on-surface" id="bookingConfirmationBanner">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-secondary text-2xl">check_circle</span>
<div>
<span className="font-headline-sm text-headline-sm text-primary block">Demande envoyée au réseau de Martinique !</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Attribution du chauffeur en cours. Un SMS de confirmation avec suivi vous a été envoyé.</span>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface-container py-space-lg">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
<div className="flex items-start gap-space-sm p-space-sm bg-surface-container-lowest rounded-xl shadow-sm">
<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined">health_and_safety</span>
</div>
<div>
<h3 className="font-label-lg text-label-lg text-on-surface">100% Prise en Charge</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Tiers payant intégral avec votre Prescription Médicale (PMT) &amp; ALD.</p>
</div>
</div>
<div className="flex items-start gap-space-sm p-space-sm bg-surface-container-lowest rounded-xl shadow-sm">
<div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
<span className="material-symbols-outlined">verified</span>
</div>
<div>
<h3 className="font-label-lg text-label-lg text-on-surface">Conventionné CPAM</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Sécurité Sociale Martinique (CGSS 972) et mutuelles complémentaires.</p>
</div>
</div>
<div className="flex items-start gap-space-sm p-space-sm bg-surface-container-lowest rounded-xl shadow-sm">
<div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container shrink-0">
<span className="material-symbols-outlined">local_shipping</span>
</div>
<div>
<h3 className="font-label-lg text-label-lg text-on-surface">85+ Véhicules Actifs</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Flotte couvrant le Nord Caraïbe, Grand Sud, Centre et Atlantique.</p>
</div>
</div>
<div className="flex items-start gap-space-sm p-space-sm bg-surface-container-lowest rounded-xl shadow-sm">
<div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
<span className="material-symbols-outlined">support_agent</span>
</div>
<div>
<h3 className="font-label-lg text-label-lg text-on-surface">Régulateurs Locaux</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant">Plateforme d'écoute basée en Martinique disponible au 05 96 72 00 97.</p>
</div>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface-container-lowest py-space-xl">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="text-center max-w-2xl mx-auto mb-space-xl">
<span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">Processus Transparent</span>
<h2 className="font-headline-lg text-headline-lg text-primary mt-space-xs">
          Comment ça marche en 3 étapes simples ?
        </h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
          Une régulation fluide pensée pour vous épargner des heures d'appels téléphoniques aux compagnies d'ambulances.
        </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-xl relative">

<div className="relative bg-surface-container-low rounded-xl p-space-lg flex flex-col shadow-sm">
<div className="w-12 h-12 rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center mb-space-md shadow-md">
            1
          </div>
<div className="h-40 rounded-lg overflow-hidden mb-space-md bg-surface-container">
<img className="w-full h-full object-cover" data-alt="A close up photo of a medical transport prescription document on a clean desk with a pen and a smartphone showing a healthcare reservation application, soft warm lighting, professional medical atmosphere with blue tones." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXTKD_vfkQgLrsf11LAi1kGVyZtORo3EMxwBd-T_cPKAsMVn7PDUy7OqIQrXhbnSTnE9E6HTFz7MSySXCWfQsjp7Tw5u-ouGpNuUO492agDIGSzEc5wHKUsjByyFfN5LewCQ2VAzGRU3kXHh1w8ROdwLhWcvyC3Atq7eoJzAer1IOp1xCUM06Ruu-PYC1ArhaP8nDidm5xjwORqbihRxJ4RTWK11O-gsogUO08PcDRd5KEXDUG8Hb1" />
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">
            1. Réservez en ligne avec votre bon
          </h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
            Renseignez votre trajet et le type de transport indiqué sur votre Prescription Médicale de Transport (PMT) délivrée par votre médecin.
          </p>
<div className="mt-auto flex items-center gap-2 text-primary font-label-sm text-label-sm">


</div>
</div>

<div className="relative bg-surface-container-low rounded-xl p-space-lg flex flex-col shadow-sm">
<div className="w-12 h-12 rounded-full bg-secondary text-on-secondary font-headline-sm text-headline-sm flex items-center justify-center mb-space-md shadow-md">
            2
          </div>
<div className="h-40 rounded-lg overflow-hidden mb-space-md bg-surface-container">
<img className="w-full h-full object-cover" data-alt="A modern ambulance fleet dispatcher in Martinique reviewing dispatch coordinates on digital tablets, showing Caribbean transport logistics network with teal and deep blue ambient light." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHJ4vXSG4Qc-8m5IOcvtvP7revA6HklNoPuchvrobCVW8rrjUn5q3Fizdf5IOorU6kTRhMfQjaX0Vg1sGmwsmcyhJjz0CrZtm1aZ_HWE-vcldJKPS7ZTw8Vx1SLhFjPJdOL0PvxaO5sms6teZMkH7uCVpkF5_NEg7Et9x6dLqLofnEkUKxhvlrixQQOZOJRfrJBESuypmsnyBuwiYh9HAuOSXwvDNOcU9MjHlFXkcQ5Y_fcdNVM7wH" />
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">
            2. Diffusion instantanée aux transporteurs
          </h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
            Votre demande est diffusée en direct aux taxis conventionnés, VSL et ambulances certifiés de votre commune et de toute l'île.
          </p>

</div>

<div className="relative bg-surface-container-low rounded-xl p-space-lg flex flex-col shadow-sm">
<div className="w-12 h-12 rounded-full bg-tertiary text-on-tertiary font-headline-sm text-headline-sm flex items-center justify-center mb-space-md shadow-md">
            3
          </div>
<div className="h-40 rounded-lg overflow-hidden mb-space-md bg-surface-container">
<img className="w-full h-full object-cover" data-alt="A smiling professional paramedic and medical taxi driver helping an elderly patient comfortably enter a modern, clean sanitized vehicle in Fort-de-France Martinique, sunny day, respectful clinical care." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7d3eJkD--pSELNnYFOOubgpRGMCkMVFxcaPkLUVzj16gMeeBZWkxgpqiCN-mXVWUT86ZK30YOTVBml9Z4ML_cp3n9Vxlryysvg28kZp5Ah-p6C8zFSfp_0-dhRB4z8RYlNvOfwhr-CCIB3lDZFBcDixbhFPXeXEHDKjbaMrt-1us0Q7M2r2nm9q95NmmZ5uE3xXNGeHeWULUzws3ioHmWYTDGdAHWWXELzOTBkbmmsvgc2tsb8nZR" />
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs">
            3. Confirmation &amp; Suivi en temps réel
          </h3>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
            Dès l'acceptation, recevez le nom de votre chauffeur, son immatriculation, son heure d'arrivée et un lien de suivi GPS pour les proches.
          </p>
<div className="mt-auto flex items-center gap-2 text-tertiary font-label-sm text-label-sm">


</div>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface-container py-space-xl">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">

<div className="lg:col-span-5 flex flex-col gap-space-sm">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high w-fit">
<span className="material-symbols-outlined text-secondary text-base">travel_explore</span>
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Territoire 100% Couvert</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            De Grand'Rivière à Sainte-Anne, une régulation sans zone blanche.
          </h2>
<p className="font-body-md text-body-md text-on-surface-variant">
            Grâce à notre maillage territorial coordonné avec les groupements de taxis sanitaires et les compagnies ambulancières conventionnées, nous réduisons les temps d'approche même dans les communes du Nord montagneux ou les zones isolées du Sud.
          </p>
<div className="grid grid-cols-2 gap-space-sm mt-space-sm">
<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
<span className="font-headline-md text-headline-md text-primary block">34</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Communes de Martinique desservies</span>
</div>
<div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
<span className="font-headline-md text-headline-md text-secondary block">&lt; 15 min</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Délai d'approche moyen en agglomération</span>
</div>
</div>
<div className="mt-space-md">
<a className="inline-flex items-center gap-2 font-label-md text-label-md text-primary hover:text-primary-container transition-colors" href="#">


</a>
</div>
</div>

<div className="lg:col-span-7 relative">
<div className="w-full h-96 rounded-xl overflow-hidden shadow-lg relative bg-surface-container-highest" data-location="Fort-de-France, Martinique" >

<div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px] pointer-events-none"></div>
<div className="absolute top-4 left-4 bg-surface-container-lowest/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-md flex items-center gap-2">
<span className="w-3 h-3 rounded-full bg-secondary animate-ping"></span>
<span className="font-label-sm text-label-sm text-on-surface font-bold">Régulation CHU Pierre Zobda-Quitman : Active</span>
</div>

</div>
</div>
</div>
</div>
</section>

<section className="w-full bg-primary py-space-xl text-on-primary">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
<div className="lg:col-span-7 flex flex-col gap-space-md">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm w-fit">
<span className="material-symbols-outlined text-sm">badge</span>
<span className="">Espace Professionnels de Santé</span>
</div>
<h2 className="font-headline-xl text-headline-xl tracking-tight text-on-primary">
            Cadres de santé, médecins, secrétariats : automatisez vos sorties d'hospitalisation.
          </h2>
<p className="font-body-lg text-body-lg text-on-primary-container">
            Gagnez un temps soignant précieux. Finis les multiples coups de fil pour trouver une ambulance disponible. Programmez les départs simples ou réguliers en moins de 60 secondes depuis votre poste de soins.
          </p>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md mt-space-sm">
<div className="bg-primary-container/40 p-space-sm rounded-lg backdrop-blur-sm">
<span className="material-symbols-outlined text-secondary-fixed text-2xl mb-1">domain_verification</span>
<h4 className="font-label-md text-label-md font-bold mb-1">Bordereau Hospitalier</h4>
<p className="font-body-sm text-body-sm text-on-primary-container">Rapprochement automatique des prescriptions et bons de transport.</p>
</div>
<div className="bg-primary-container/40 p-space-sm rounded-lg backdrop-blur-sm">
<span className="material-symbols-outlined text-secondary-fixed text-2xl mb-1">alarm_on</span>
<h4 className="font-label-md text-label-md font-bold mb-1">Priorités Sorties de Lit</h4>
<p className="font-body-sm text-body-sm text-on-primary-container">Fluidifiez le turn-over de vos lits d'hospitalisation aiguë.</p>
</div>
<div className="bg-primary-container/40 p-space-sm rounded-lg backdrop-blur-sm"><div className="flex items-center justify-between mb-1"><span className="material-symbols-outlined text-secondary-fixed text-2xl">security</span><span className="px-2 py-0.5 rounded-full bg-secondary-container/30 text-secondary-fixed font-label-sm text-label-sm">Bientôt disponible</span></div><h4 className="font-label-md text-label-md font-bold mb-1">Connexion Pro Santé</h4><p className="font-body-sm text-body-sm text-on-primary-container">Bientôt disponible · Accès sécurisé par carte CPS, e-CPS ou identifiant certifié CHU.</p></div>
</div>
<div className="flex flex-wrap items-center gap-space-md mt-space-sm">
<Link className="px-6 h-12 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors flex items-center gap-2 shadow-sm" to="/etablissements">
<span className="material-symbols-outlined">login</span>
<span className="">Connexion Portail Établissements</span>
</Link>
<a className="px-6 h-12 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-2" href="#">
<span className="">Demander une démonstration de service</span>
</a>
</div>
</div>
<div className="lg:col-span-5">
<div className="bg-surface-container-lowest text-on-surface p-space-lg rounded-2xl shadow-xl flex flex-col gap-space-md">
<div className="flex items-center gap-space-sm">
<img className="w-12 h-12 rounded-full object-cover" data-alt="Portrait of a female hospital coordination nurse in Fort-de-France Martinique, wearing a medical uniform and warm confident professional smile." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDonXDAsgTKFttVu8Jvg6cjdq1YFOPmLCEH7_FjNbUEhHXieLU5Ul5ttpqDeUrL5PRttxIU-kKblowqbLOehH3xyaEdQK2gkfLU7aFBMvQktSrRjpkTEBjmXatjW1EjzAdpLNftM4xBveiNP4GEsl4PqIPR-l0YtrjusGkIQELQaXTS4wA7HNuhJygD2dQgiiZryMD4J5XKIVNPT_SY5-ldpKmi9F0IkLPHylbBO9WNf1PxBjjXPTn9" />
<div>
<span className="font-label-lg text-label-lg text-primary block">Mme C. Almont</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Cadre de Santé - Service Néphrologie, CHU</span>
</div>
</div>
<p className="font-body-md text-body-md text-on-surface-variant italic">
              “Médic'Trans a transformé notre gestion des transports dialyse. Nos patients ne patientent plus des heures dans les couloirs du centre, et notre équipe consacre son temps aux soins plutôt qu'aux recherches d'ambulances.”
            </p>
<div className="flex items-center justify-between pt-space-sm bg-surface-container-low rounded-lg p-3">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Indice de satisfaction CHU</span>
<span className="font-headline-sm text-headline-sm text-secondary font-bold">98.4%</span>
</div>
<span className="material-symbols-outlined text-secondary text-3xl">star</span>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface py-space-xl">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="text-center max-w-xl mx-auto mb-space-xl">
<span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">La Voix des Usagers</span>
<h2 className="font-headline-lg text-headline-lg text-primary mt-space-xs">
          Ils voyagent sereinement avec Médic'Trans
        </h2>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">

<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center gap-1 text-secondary">
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
              “Maman doit se rendre 3 fois par semaine en radiothérapie à Clarion. Les chauffeurs de taxi conventionné sont toujours à l'heure, bienveillants et l'aident jusqu'à la porte du cabinet.”
            </p>
</div>
<div className="flex items-center gap-3 mt-space-md pt-space-sm">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary">
              JL
            </div>
<div>
<span className="font-label-md text-label-md text-on-surface block">Jean-Luc B.</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Aidant familial · Sainte-Luce</span>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center gap-1 text-secondary">
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
              “J'avais une appréhension pour mon retour d'opération de la hanche à Sainte-Marie. L'ambulance est arrivée avec des ambulanciers très doux, brancardage impeccable au troisième étage sans ascenseur.”
            </p>
</div>
<div className="flex items-center gap-3 mt-space-md pt-space-sm">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary">
              MV
            </div>
<div>
<span className="font-label-md text-label-md text-on-surface block">Marie-Victoire T.</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Patiente hospitalisée · Schoelcher</span>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col justify-between">
<div className="flex flex-col gap-space-sm">
<div className="flex items-center gap-1 text-secondary">
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">
              “En tant que chauffeur de taxi conventionné indépendant au Lamentin, la plateforme me permet d'optimiser mes trajets quotidiens sans paperasse inutile. Tout est clair et réglé en tiers-payant.”
            </p>
</div>
<div className="flex items-center gap-3 mt-space-md pt-space-sm">
<div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-secondary">
              PT
            </div>
<div>
<span className="font-label-md text-label-md text-on-surface block">Patrice T.</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Artisan Taxi Conventionné · Le Lamentin</span>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="w-full bg-surface-container-lowest py-space-xl">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="bg-gradient-to-r from-surface-container-low to-surface-container p-space-lg md:p-space-xl rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-lg">
<div className="flex items-center gap-space-md">
<div className="w-14 h-14 rounded-full bg-error text-on-error flex items-center justify-center shrink-0 shadow-md">
<span className="material-symbols-outlined text-3xl">phone_in_talk</span>
</div>
<div>
<h3 className="font-headline-md text-headline-md text-primary">Besoin d'une prise en charge urgente non-programmée ?</h3>
<p className="font-body-md text-body-md text-on-surface-variant">Pour toute urgence vitale, contactez immédiatement le SAMU Centre 15. Pour un transfert inter-hospitalier urgent régulé, notre ligne dédiée répond 24/7.</p>
</div>
</div>
<div className="flex flex-col sm:flex-row items-center gap-space-sm shrink-0 w-full md:w-auto">
<a className="w-full sm:w-auto px-6 h-12 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm transition-all" href="tel:0596720097">
<span className="material-symbols-outlined">call</span>
<span className="">05 96 72 00 97</span>
</a>
<a className="w-full sm:w-auto px-6 h-12 rounded-lg bg-error hover:bg-error/90 text-on-error font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm transition-all" href="tel:15">
<span className="material-symbols-outlined">emergency</span>
<span className="">Composer le 15 (SAMU)</span>
</a>
</div>
</div>
</div>
</section>
</div>
</main><footer className="w-full bg-surface-container-low mt-space-xl"><div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-xl"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl mb-space-xl"><div className="flex flex-col gap-space-sm"><div className="flex items-center gap-space-sm mb-space-xs"><span className="font-headline-sm text-headline-sm text-primary">Médic'Trans Martinique</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Plateforme d'intermédiation et de régulation du transport sanitaire conventionné pour toute la Martinique.</p><div className="flex flex-col gap-space-xs mt-space-xs"><span className="font-label-md text-label-md text-on-surface"><br /></span><span className="font-body-sm text-body-sm text-on-surface-variant"><br /></span><span className="font-body-sm text-body-sm text-on-surface-variant"><br /></span></div></div><div className="flex flex-col gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface">Établissements Desservis</span><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="">CHU de Martinique (P. Zobda-Quitman) - Fort-de-France</li><li className="">Hôpital Louis Domergue - La Trinité</li><li className="">Hôpital Pierre Zobda-Quitman &amp; EHPAD - Le Lamentin</li><li className="">Centre Hospitalier de Saint-Pierre</li><li className="">Hôpital de Proximité - Le Marin</li><li className="">Clinique Sainte-Marie - Schoelcher</li></ul></div><div className="flex flex-col gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface">Services Sanitaires</span><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="">Ambulances conventionnées (Position allongée/soins)</li><li className="">VSL (Véhicule Sanitaire Léger)</li><li className="">Taxi Conventionné CPAM Martinique</li><li className="">Urgences relatives et rapatriements inter-îles</li><li className="">Transports ALD &amp; Séances régulières (Dialyse, Onco)</li></ul></div><div className="flex flex-col gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface">Assistance &amp; Régulation</span><p className="font-body-sm text-body-sm text-on-surface-variant">Permanence d'accès aux soins et transfert médicalisé 24h/24 et 7j/7.</p><span className="font-headline-sm text-headline-sm text-primary">05 96 72 00 97</span><span className="font-body-sm text-body-sm text-on-surface-variant">regulation@medtrans-mq.fr</span><span className="font-body-sm text-body-sm text-on-surface-variant">Région Martinique (972)</span></div></div><div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md"><span className="font-body-sm text-body-sm text-on-surface-variant">© 2024 Médic'Trans Martinique (972). Tous droits réservés. Mentions légales</span></div></div></footer>




    </div>
  );
};
