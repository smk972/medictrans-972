import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const BookingPage: React.FC = () => {
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

<section className="w-full bg-surface-container-low py-space-lg shadow-sm">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase">Demande Réf. MT-972-8821</span>
<h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Réservation de Transport Sanitaire</h1>
</div>

<div className="flex items-center gap-space-sm">

<div className="flex items-center gap-space-xs">
<span className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-md text-label-md">
<span className="material-symbols-outlined text-[18px]">check</span>
</span>
<div className="hidden sm:flex flex-col">
<span className="font-label-sm text-label-sm text-secondary">Étape 1</span>
<span className="font-label-md text-label-md text-on-surface">Trajet &amp; Véhicule</span>
</div>
</div>
<div className="w-8 md:w-12 h-0.5 bg-secondary"></div>

<div className="flex items-center gap-space-xs">
<span className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-md text-label-md shadow-md">
              2
            </span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-primary">Étape active</span>
<span className="font-label-md text-label-md text-primary font-bold">Patient &amp; PMT</span>
</div>
</div>
<div className="w-8 md:w-12 h-0.5 bg-surface-container-highest"></div>

<div className="flex items-center gap-space-xs opacity-60">
<span className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-label-md text-label-md">
              3
            </span>
<div className="hidden sm:flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Étape 3</span>
<span className="font-label-md text-label-md text-on-surface-variant">Confirmation</span>
</div>
</div>
</div>
</div>
</div>
</section>

<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-xl w-full">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">

<form className="lg:col-span-7 flex flex-col gap-space-xl" >

<div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-xl shadow-sm flex flex-col gap-space-lg">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
<span className="material-symbols-outlined">person</span>
</div>
<div className="flex flex-col">
<h2 className="font-headline-sm text-headline-sm text-on-surface">Fiche d'identité du Patient</h2>
<span className="font-body-sm text-body-sm text-on-surface-variant">Données confidentielles sécurisées HDS / ARS</span>
</div>
</div>
<span className="font-label-sm text-label-sm bg-surface-container text-primary px-2.5 py-1 rounded-full">Requis</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface">Nom de naissance</label>
<input className="h-11 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-low transition-colors shadow-[inset_0_0_0_1px_#CBD5E1] focus:shadow-[inset_0_0_0_2px_#0B5C9E]" placeholder="Ex. DUPONT" type="text" value="GLISSANT" />
</div>
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface">Prénom usuel</label>
<input className="h-11 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-low transition-colors shadow-[inset_0_0_0_1px_#CBD5E1] focus:shadow-[inset_0_0_0_2px_#0B5C9E]" placeholder="Ex. Jean" type="text" value="Aimé" />
</div>
<div className="md:col-span-2 flex flex-col gap-1.5">
<div className="flex justify-between items-center">
<label className="font-label-md text-label-md text-on-surface">Numéro de Sécurité Sociale (NIR)</label>
<span className="font-label-sm text-label-sm text-secondary font-medium">15 chiffres (Clé comprise)</span>
</div>
<div className="relative flex items-center">
<input className="w-full h-11 px-3 pl-10 bg-surface-container-lowest rounded-lg font-mono text-body-md text-on-surface outline-none focus:bg-surface-container-low transition-colors shadow-[inset_0_0_0_1px_#CBD5E1] focus:shadow-[inset_0_0_0_2px_#0B5C9E]" maxLength={15} placeholder="1 XX XX XX XXX XXX XX" type="text" value="1 54 08 97 213 456 82" />
<span className="material-symbols-outlined text-outline absolute left-3 text-[20px]">badge</span>
<span className="material-symbols-outlined text-secondary absolute right-3 text-[20px]">check_circle</span>
</div>
</div>
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface">Téléphone portable (SMS suivi)</label>
<div className="relative flex items-center">
<span className="absolute left-3 font-label-md text-label-md text-outline-variant">+596</span>
<input className="w-full h-11 pl-14 pr-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-low transition-colors shadow-[inset_0_0_0_1px_#CBD5E1] focus:shadow-[inset_0_0_0_2px_#0B5C9E]" type="tel" value="06 96 44 20 18" />
</div>
</div>
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface">Date de naissance</label>
<input className="h-11 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface outline-none focus:bg-surface-container-low transition-colors shadow-[inset_0_0_0_1px_#CBD5E1] focus:shadow-[inset_0_0_0_2px_#0B5C9E]" type="date" value="1954-08-14" />
</div>
</div><div className="p-space-md rounded-xl bg-surface-container-low/60 border-0 flex items-center justify-between gap-space-md hover:bg-surface-container-low transition-colors"><div className="flex items-start sm:items-center gap-space-sm"><div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"><span className="material-symbols-outlined text-[18px]">verified_user</span></div><div className="flex flex-col"><div className="flex items-center gap-2 flex-wrap"><span className="font-label-md text-label-md text-on-surface font-semibold">Patient bénéficiaire d'une ALD</span><span className="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">Exonération 100%</span></div><span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Prise en charge intégrale par la Sécurité Sociale / CGSS Martinique au titre de l'ALD 30</span></div></div><label className="relative inline-flex items-center cursor-pointer shrink-0"><input defaultChecked className="sr-only peer" type="checkbox" /><div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-defaultChecked:after:translate-x-full peer-defaultChecked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-defaultChecked:bg-secondary"></div></label></div>
</div>

<div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-xl shadow-sm flex flex-col gap-space-lg">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
<span className="material-symbols-outlined">accessible</span>
</div>
<div className="flex flex-col">
<h2 className="font-headline-sm text-headline-sm text-on-surface">Mobilité &amp; Condition Physique</h2>
<span className="font-body-sm text-body-sm text-on-surface-variant">Précisions pour adapter l'assistance humaine et l'équipement</span>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
<label className="cursor-pointer flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-low shadow-[inset_0_0_0_2px_#0B5C9E] transition-all">
<input defaultChecked className="mt-1 accent-primary" name="mobility_mode" type="radio" />
<div className="flex flex-col">
<span className="font-label-md text-label-md text-primary font-bold">Patient assis autonome</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Marche sans difficulté majeure, montée autonome dans le véhicule.</span>
</div>
</label>
<label className="cursor-pointer flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-lowest shadow-[inset_0_0_0_1px_#E2E8F0] hover:bg-surface-container-low transition-all">
<input className="mt-1 accent-primary" name="mobility_mode" type="radio" />
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">Aide à la marche / Béquilles</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Déplacement lent, soutien d'un ambulancier nécessaire pour s'installer.</span>
</div>
</label>
<label className="cursor-pointer flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-lowest shadow-[inset_0_0_0_1px_#E2E8F0] hover:bg-surface-container-low transition-all">
<input className="mt-1 accent-primary" name="mobility_mode" type="radio" />
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">Fauteuil personnel pliable</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Fauteuil transférable dans le coffre, transfert actif ou semi-aidé.</span>
</div>
</label>
<label className="cursor-pointer flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-lowest shadow-[inset_0_0_0_1px_#E2E8F0] hover:bg-surface-container-low transition-all">
<input className="mt-1 accent-primary" name="mobility_mode" type="radio" />
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">Position allongée stricte</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Nécessite impérativement ambulance catégorie A ou C avec brancard.</span>
</div>
</label>
</div>

<div className="pt-space-sm flex flex-col gap-space-md">

<div className="flex items-center justify-between p-space-md rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[18px]">air</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">Oxygénothérapie continue</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Le patient dispose de sa propre bouteille ou nécessite un appoint embarqué.</span>
</div>
</div>
<label className="relative inline-flex items-center cursor-pointer">
<input className="sr-only peer" type="checkbox" />
<div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-defaultChecked:after:translate-x-full peer-defaultChecked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-defaultChecked:bg-secondary"></div>
</label>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md bg-surface-container-low/50 p-space-md rounded-lg">
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface">Étage du départ (domicile)</label>
<select className="h-11 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface outline-none shadow-[inset_0_0_0_1px_#CBD5E1]">
<option>Rez-de-chaussée / Plain-pied</option>
<option >1er étage</option>
<option>2ème étage</option>
<option>3ème étage ou plus</option>
</select>
</div>
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface">Présence d'ascenseur</label>
<div className="grid grid-cols-2 gap-space-xs h-11">
<button className="rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors" type="button">Non</button>
<button className="rounded-lg bg-primary text-on-primary font-label-md text-label-md" type="button">Oui (conforme)</button>
</div>
</div>
</div>

<div className="flex items-center justify-between p-space-md rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-sm">
<div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[18px]">group</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface">Accompagnateur autorisé</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Autorisé si enfant mineur ou mention expresse portée sur la PMT.</span>
</div>
</div>
<label className="relative inline-flex items-center cursor-pointer">
<input defaultChecked className="sr-only peer" type="checkbox" />
<div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-defaultChecked:after:translate-x-full peer-defaultChecked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-defaultChecked:bg-primary-container"></div>
</label>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-xl shadow-sm flex flex-col gap-space-lg">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
<span className="material-symbols-outlined">description</span>
</div>
<div className="flex flex-col">
<h2 className="font-headline-sm text-headline-sm text-on-surface">Prescription Médicale de Transport (PMT)</h2>
<span className="font-body-sm text-body-sm text-on-surface-variant">Condition indispensable pour le Tiers-Payant Sécurité Sociale</span>
</div>
</div>
<span className="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full font-bold">100% Remboursé</span>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm p-1 bg-surface-container-low rounded-xl">
<button className="py-2.5 px-3 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm text-center" type="button">
              J'ai déjà mon bon de transport
            </button>
<button className="py-2.5 px-3 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md text-center transition-colors" type="button">
              Le médecin me le remettra à l'hôpital
            </button>
</div>

<div className="p-space-lg rounded-xl bg-surface-container-low/40 flex flex-col items-center justify-center text-center gap-space-sm cursor-pointer hover:bg-surface-container-low transition-colors">
<div className="w-14 h-14 rounded-full bg-surface-container-high text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]">cloud_upload</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-primary font-bold">Glissez votre bon de transport signé ou prenez une photo</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Formats acceptés : PDF, JPG, PNG (Max 10 Mo)</span>
</div>
<div className="flex items-center gap-space-xs bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm">
<span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
<span className="font-label-sm text-label-sm text-on-surface">PMT_Signee_Dr_Lafontaine.pdf (1.2 MB)</span>
<button className="text-error ml-2 hover:opacity-80" type="button">
<span className="material-symbols-outlined text-[16px]">close</span>
</button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface">Motif de la prise en charge</label>
<select className="h-11 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface outline-none shadow-[inset_0_0_0_1px_#CBD5E1]">
<option >Consultation spécialisée / Bilan</option>
<option>Séance de chimiothérapie / Dialyse</option>
<option>Entrée en hospitalisation programmée</option>
<option>Sortie d'hospitalisation</option>
<option>Séance de rééducation fonctionnelle</option>
</select>
</div>
<div className="flex flex-col gap-1.5">
<label className="font-label-md text-label-md text-on-surface">Médecin prescripteur / Service</label>
<input className="h-11 px-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface outline-none shadow-[inset_0_0_0_1px_#CBD5E1]" placeholder="Nom du médecin ou pôle médical" type="text" value="Dr. J-M Lafontaine - Oncologie CHU" />
</div>
</div>
</div>
</form>

<aside className="lg:col-span-5 flex flex-col gap-space-lg lg:sticky lg:top-24">

<div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md">
<div className="flex items-center justify-between pb-space-xs">
<h3 className="font-headline-sm text-headline-sm text-primary">Récapitulatif Course</h3>
<span className="font-label-sm text-label-sm bg-secondary/15 text-secondary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              En direct
            </span>
</div>

<div className="flex flex-col rounded-xl overflow-hidden bg-surface-container-low shadow-sm">
<div className="w-full h-36 bg-cover bg-center relative" data-location="Fort-de-France, Martinique" >
<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-space-sm">
<span className="font-label-sm text-label-sm text-white flex items-center gap-1">
<span className="material-symbols-outlined text-[16px]">navigation</span>
                  Distance estimée : 7.8 km (18 min)
                </span>
</div>
</div>

<div className="p-space-md flex flex-col gap-space-md">
<div className="flex items-start gap-space-sm">
<div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[14px]">home</span>
</div>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm text-on-surface-variant">Départ (Prise en charge)</span>
<span className="font-label-md text-label-md text-on-surface truncate">Résidence Les Alizés, Bat C - Cluny, Schoelcher</span>
</div>
</div>
<div className="flex items-start gap-space-sm">
<div className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-[14px]">local_hospital</span>
</div>
<div className="flex flex-col min-w-0">
<span className="font-label-sm text-label-sm text-on-surface-variant">Destination</span>
<span className="font-label-md text-label-md text-on-surface truncate">CHU Pierre Zobda-Quitman - Pôle Oncologie, FdF</span>
</div>
</div>
</div>
</div>

<div className="grid grid-cols-2 gap-space-sm">
<div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-0.5">
<span className="font-label-sm text-label-sm text-on-surface-variant">Date &amp; Heure</span>
<span className="font-label-md text-label-md text-on-surface font-bold">Mar. 24 Oct. 2024</span>
<span className="font-headline-sm text-headline-sm text-primary">08:30</span>
</div>
<div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-0.5">
<span className="font-label-sm text-label-sm text-on-surface-variant">Type de Véhicule</span>
<span className="font-label-md text-label-md text-on-surface font-bold">VSL Conventionné</span>
<span className="font-body-sm text-body-sm text-secondary font-medium">Climatisé • 1 valise</span>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-high/60 flex flex-col gap-space-xs">
<div className="flex justify-between items-center">
<span className="font-label-md text-label-md text-on-surface">Prise en charge Sécurité Sociale</span>
<span className="font-label-md text-label-md text-secondary font-bold">100% (ALD 30)</span>
</div>
<div className="flex justify-between items-center">
<span className="font-body-sm text-body-sm text-on-surface-variant">Ticket modérateur / Avance</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">0,00 €</span>
</div>
<div className="pt-space-xs flex justify-between items-center border-t-0">
<span className="font-headline-sm text-headline-sm text-on-surface">Reste à charge estimé</span>
<span className="font-headline-lg text-headline-lg text-secondary font-bold">0,00 €</span>
</div>
</div>

<div className="flex flex-col gap-space-sm pt-space-xs">
<button className="w-full h-14 bg-primary hover:bg-primary-container active:scale-[0.99] transition-all text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-sm shadow-lg shadow-primary/20" type="button">
<span className="material-symbols-outlined text-[24px]">send</span>
<span className="">Diffuser ma demande aux transporteurs</span>
</button>

<div className="flex items-start gap-space-xs p-space-sm bg-surface-container-low rounded-lg">
<span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">radar</span>
<p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed">
<strong className="text-on-surface">Diffusion instantanée :</strong> Alerte transmise par SMS et console télématique aux&amp;nbsp;<span className="text-primary font-bold">&amp;nbsp;professionnels certifiés</span> du secteur.
              </p>
</div>
</div>
</div>


</aside>
</div>
</div>
</div></main><footer className="w-full bg-surface-container-low mt-space-xl"><div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-xl"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl mb-space-xl"><div className="flex flex-col gap-space-sm"><div className="flex items-center gap-space-sm mb-space-xs"><span className="font-headline-sm text-headline-sm text-primary">Médic'Trans Martinique</span></div><p className="font-body-sm text-body-sm text-on-surface-variant">Plateforme d'intermédiation et de régulation du transport sanitaire conventionné pour toute la Martinique.</p><div className="flex flex-col gap-space-xs mt-space-xs"><span className="font-label-md text-label-md text-on-surface">Agréments &amp; Certifications</span><span className="font-body-sm text-body-sm text-on-surface-variant">Agrément ARS Martinique n°972-2024-T</span><span className="font-body-sm text-body-sm text-on-surface-variant">Conventionnement CPAM 100% Tiers Payant</span></div></div><div className="flex flex-col gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface">Établissements Desservis</span><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="">CHU de Martinique (P. Zobda-Quitman) - Fort-de-France</li><li className="">Hôpital Louis Domergue - La Trinité</li><li className="">Hôpital Pierre Zobda-Quitman &amp; EHPAD - Le Lamentin</li><li className="">Centre Hospitalier de Saint-Pierre</li><li className="">Hôpital de Proximité - Le Marin</li><li className="">Clinique Sainte-Marie - Schoelcher</li></ul></div><div className="flex flex-col gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface">Services Sanitaires</span><ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant"><li className="">Ambulances conventionnées (Position allongée/soins)</li><li className="">VSL (Véhicule Sanitaire Léger)</li><li className="">Taxi Conventionné CPAM Martinique</li><li className="">Urgences relatives et rapatriements inter-îles</li><li className="">Transports ALD &amp; Séances régulières (Dialyse, Onco)</li></ul></div><div className="flex flex-col gap-space-sm"><span className="font-label-lg text-label-lg text-on-surface">Assistance &amp; Régulation</span><p className="font-body-sm text-body-sm text-on-surface-variant">Permanence d'accès aux soins et transfert médicalisé 24h/24 et 7j/7.</p><span className="font-headline-sm text-headline-sm text-primary">05 96 72 00 97</span><span className="font-body-sm text-body-sm text-on-surface-variant">regulation@medtrans-mq.fr</span><span className="font-body-sm text-body-sm text-on-surface-variant">Région Martinique (972)</span></div></div><div className="pt-space-lg flex flex-col md:flex-row items-center justify-between gap-space-md"><span className="font-body-sm text-body-sm text-on-surface-variant">© 2024 Médic'Trans Martinique (972). Tous droits réservés. <a className="hover:text-on-surface transition-colors" href="#">Mentions légales</a></span></div></div></footer>




    </div>
  );
};
