import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { PhoneInput } from '../components/PhoneInput';
import { FileUpload } from '../components/FileUpload';
import { GoogleMapView } from '../components/GoogleMapView';

export const RegisterTransporterPage: React.FC = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('Zone Industrielle La Lézarde, 97232 Le Lamentin');
  const [phoneEmergency, setPhoneEmergency] = useState('05 96 51 00 00');

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
          alert("Votre dossier a bien été soumis à la régulation Clinigo.");
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
      <SEOHead
        title="Rejoindre le Réseau Ambulanciers & Taxis Conventionnés | Clinigo"
        description="Ambulances, VSL et Taxis conventionnés : inscrivez votre flotte sur Clinigo pour recevoir des missions régulées et certifiées CPAM."
        canonicalPath="/inscription-transporteur"
      />
      <Header />
      <main className="w-full pt-4 sm:pt-6 bg-surface"><div className="flex flex-col w-full">

<div className="w-full bg-surface-container-high px-margin lg:px-margin-lg py-space-sm text-on-surface">
<div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-space-xs">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary text-sm">verified_user</span>
<span className="font-label-sm text-label-sm">Protocole Régional 972 : Déploiement du guichet unique inter-établissements CHU Martinique &amp; Cliniques Conventionnées</span>
</div>
<div className="flex items-center gap-space-md text-on-surface-variant font-label-sm text-label-sm">
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary inline-block"></span> Serveur HDS Certifié</span>
<span className="hidden md:inline">|</span>
<span className="hidden md:inline">Contact Régulateur : 05 96 42 12 12</span>
</div>
</div>
</div>

<section className="w-full bg-surface-container-lowest shadow-sm">
<div className="max-w-[1280px] mx-auto px-margin lg:px-margin-lg py-space-xl">
<div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
<div className="flex flex-col gap-space-xs max-w-3xl">
<div className="inline-flex items-center gap-space-xs bg-secondary-container/40 text-on-secondary-container px-space-sm py-space-xs rounded-full w-fit">
<span className="material-symbols-outlined text-secondary text-base">local_hospital</span>
<span className="font-label-sm text-label-sm uppercase tracking-wider">Espace Professionnels du Transport Sanitaire - Martinique (972)</span>
</div>
<h1 className="font-headline-xl text-headline-xl text-primary tracking-tight">
            Devenez Partenaire Clinigo : Rejoignez le réseau conventionné
          </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant">
            Accédez aux missions régulées du CHU de Fort-de-France, du Centre Hospitalier de Trinité, des cliniques privées, des EHPAD et aux sorties d'hospitalisation programmées sur l'ensemble du territoire martiniquais.
          </p>
</div>

<div className="flex items-center gap-space-md bg-surface-container-low p-space-md rounded-xl">
<div className="flex flex-col">
<span className="font-headline-lg text-headline-lg text-primary">340+</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Courses régulées / jour</span>
</div>
<div className="w-px h-10 bg-outline-variant/30"></div>
<div className="flex flex-col">
<span className="font-headline-lg text-headline-lg text-secondary">24h</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Délai d'instruction ARS/972</span>
</div>
</div>
</div>

<div className="mt-space-xl pt-space-lg bg-surface-container-lowest">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">

<div className="flex items-center gap-space-sm p-space-sm bg-primary-fixed/30 rounded-lg">
<div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-md text-label-md shadow-sm shrink-0">
              1
            </div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md text-primary truncate">Société &amp; Agréments</span>
<span className="font-label-sm text-label-sm text-secondary font-semibold">En cours d'enregistrement</span>
</div>
</div>

<div className="flex items-center gap-space-sm p-space-sm bg-surface-container rounded-lg opacity-85">
<div className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-md text-label-md shrink-0">
              2
            </div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md text-on-surface truncate">Flotte &amp; Équipements</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Ambulances, VSL, TPMR</span>
</div>
</div>

<div className="flex items-center gap-space-sm p-space-sm bg-surface-container rounded-lg opacity-85">
<div className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-md text-label-md shrink-0">
              3
            </div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md text-on-surface truncate">Chauffeurs &amp; DEA/CCA</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Permis et cartes pro</span>
</div>
</div>

<div className="flex items-center gap-space-sm p-space-sm bg-surface-container rounded-lg opacity-85">
<div className="w-9 h-9 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-label-md text-label-md shrink-0">
              4
            </div>
<div className="flex flex-col min-w-0">
<span className="font-label-md text-label-md text-on-surface truncate">Pièces &amp; Validation</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Kbis, ARS, CGSS 972</span>
</div>
</div>
</div>
</div>
</div>
</section>

<div className="max-w-[1280px] mx-auto px-margin lg:px-margin-lg py-space-xl w-full">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">

<form className="lg:col-span-8 flex flex-col gap-space-xl" id="proRegistrationForm" >

<section className="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl shadow-[0_1px_3px_rgba(11,37,69,0.05)] flex flex-col gap-space-lg">
<div className="flex items-center gap-space-sm pb-space-xs">
<div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined">domain</span>
</div>
<div className="flex flex-col">
<h2 className="font-headline-md text-headline-md text-primary">1. Identification de l'entreprise</h2>
<span className="font-body-sm text-body-sm text-on-surface-variant">Renseignements légaux enregistrés auprès du greffe et de l'ARS Martinique</span>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">

<div className="flex flex-col gap-space-xs md:col-span-2">
<label className="font-label-md text-label-md text-on-surface" htmlFor="companyName">Raison Sociale / Enseigne commerciale <span className="text-error">*</span></label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" id="companyName" placeholder="Ex: Ambulances Madinina Secours SARL" required type="text" />
</div>

<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="siretNumber">Numéro SIRET (14 chiffres) <span className="text-error">*</span></label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" id="siretNumber" maxLength={14} placeholder="Ex: 849 201 938 00012" required type="text" />
</div>

<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="finessNumber">N° FINESS ou Convention CGSS Martinique <span className="text-error">*</span></label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" id="finessNumber" placeholder="Ex: 970 401 234" required type="text" />
</div>

<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="apeCode">Code APE / NAF <span className="text-error">*</span></label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" defaultValue="86.90A" id="apeCode" placeholder="86.90A (Ambulances) ou 49.32Z" required type="text" />
</div>

<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="communeSelect">Commune d'implantation / Garage <span className="text-error">*</span></label>
<div className="relative">
<select className="h-11 w-full px-space-sm pr-10 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md appearance-none focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" id="communeSelect" required>
<option value="">Sélectionnez la commune...</option>
<option  value="Fort-de-France">Fort-de-France (97200)</option>
<option value="Le Lamentin">Le Lamentin (97232)</option>
<option value="Schoelcher">Schoelcher (97233)</option>
<option value="Le Robert">Le Robert (97231)</option>
<option value="Ducos">Ducos (97224)</option>
<option value="Le François">Le François (97240)</option>
<option value="La Trinité">La Trinité (97220)</option>
<option value="Sainte-Marie">Sainte-Marie (97230)</option>
<option value="Le Marin">Le Marin (97290)</option>
<option value="Rivière-Salée">Rivière-Salée (97215)</option>
<option value="Saint-Joseph">Saint-Joseph (97212)</option>
<option value="Saint-Pierre">Saint-Pierre (97250)</option>
<option value="Les Trois-Îlets">Les Trois-Îlets (97229)</option>
<option value="Gros-Morne">Gros-Morne (97213)</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant pointer-events-none">expand_more</span>
</div>
</div>

<div className="flex flex-col gap-space-xs md:col-span-2">
  <AddressAutocomplete
    id="transporterAddress"
    label="Adresse du siège social / Dépôt des véhicules"
    required
    value={address}
    onChange={(val) => setAddress(val)}
    placeholder="Ex: Voie, Zone Industrielle, Code Postal ou Commune en Martinique..."
    helperText="Aide à la saisie de l'adresse en Martinique"
  />
</div>

<div className="flex flex-col gap-space-xs">
  <PhoneInput
    id="phoneEmergency"
    label="Ligne d'astreinte & régulation 24/7"
    required
    value={phoneEmergency}
    defaultDialCode="+596"
    onChange={(val) => setPhoneEmergency(val)}
  />
</div>

<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="emailPro">Courriel professionnel de dispatch <span className="text-error">*</span></label>
<div className="relative">
<input className="h-11 w-full pl-10 pr-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" id="emailPro" placeholder="regulation@ambulances-martinique.fr" required type="email" />
<span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant">mail</span>
</div>
</div>
</div>
</section>

<section className="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl shadow-[0_1px_3px_rgba(11,37,69,0.05)] flex flex-col gap-space-lg">
<div className="flex items-center gap-space-sm pb-space-xs">
<div className="w-10 h-10 rounded-lg bg-secondary-container/50 flex items-center justify-center text-secondary shrink-0">
<span className="material-symbols-outlined">badge</span>
</div>
<div className="flex flex-col">
<h2 className="font-headline-md text-headline-md text-primary">2. Licences d'exploitation &amp; Agréments</h2>
<span className="font-body-sm text-body-sm text-on-surface-variant">Cochez les catégories pour lesquelles votre structure dispose d'autorisations en cours de validité</span>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md" id="licenceSelectionGrid">

<label className="cursor-pointer flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all relative">
<input defaultChecked className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary accent-primary" type="checkbox" />
<div className="flex flex-col gap-1">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-xl">ambulance</span>
<span className="font-headline-sm text-headline-sm text-primary">Ambulance de Secours &amp; Soins</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Type A / B (Norme EN 1789)</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Transport allongé sous surveillance constante, oxygénothérapie, transferts inter-hospitaliers CHU/Trinité.</p>
</div>
</label>

<label className="cursor-pointer flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all relative">
<input defaultChecked className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary accent-primary" type="checkbox" />
<div className="flex flex-col gap-1">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-xl">directions_car</span>
<span className="font-headline-sm text-headline-sm text-primary">VSL (Véhicule Sanitaire Léger)</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Catégorie D - Agrément ARS</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Transport assis professionnalisé, consultations spécialisées, hémodialyse, radiothérapie.</p>
</div>
</label>

<label className="cursor-pointer flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all relative">
<input className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary accent-primary" type="checkbox" />
<div className="flex flex-col gap-1">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-xl">local_taxi</span>
<span className="font-headline-sm text-headline-sm text-primary">Taxi Conventionné CPAM / CGSS</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Autorisation de Stationnement (ADS) Locale</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Conventionnement direct CGSS Martinique actif pour télétransmission des bons de transport prescrit.</p>
</div>
</label>

<label className="cursor-pointer flex items-start gap-space-sm p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all relative">
<input className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary accent-primary" type="checkbox" />
<div className="flex flex-col gap-1">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-xl">accessible</span>
<span className="font-headline-sm text-headline-sm text-primary">Véhicule Adapté TPMR (Fauteuil)</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Rampe &amp; Ancrages certifiés</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Prise en charge de patients en fauteuil roulant manuel ou électrique sans transfert de siège.</p>
</div>
</label>
</div>
</section>

<section className="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl shadow-[0_1px_3px_rgba(11,37,69,0.05)] flex flex-col gap-space-lg">
<div className="flex items-center gap-space-sm pb-space-xs">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined">commute</span>
</div>
<div className="flex flex-col">
<h2 className="font-headline-md text-headline-md text-primary">3. Flotte de transport &amp; Équipements</h2>
<span className="font-body-sm text-body-sm text-on-surface-variant">Capacités matérielles déclarées sous contrôle de régulation sanitaire</span>
</div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">

<div className="flex flex-col gap-space-xs bg-surface-container-low p-space-md rounded-lg">
<span className="font-label-md text-label-md text-on-surface">Nombre d'Ambulances</span>
<div className="flex items-center justify-between mt-space-xs">
<button className="w-8 h-8 rounded-md bg-surface-container-highest text-on-surface font-headline-sm flex items-center justify-center hover:bg-surface-dim"  type="button">-</button>
<input className="w-16 text-center font-headline-md text-headline-md bg-transparent text-primary font-bold focus:outline-none" defaultValue={3} id="ambCount" min="0" type="number" />
<button className="w-8 h-8 rounded-md bg-surface-container-highest text-on-surface font-headline-sm flex items-center justify-center hover:bg-surface-dim"  type="button">+</button>
</div>
</div>

<div className="flex flex-col gap-space-xs bg-surface-container-low p-space-md rounded-lg">
<span className="font-label-md text-label-md text-on-surface">Nombre de VSL</span>
<div className="flex items-center justify-between mt-space-xs">
<button className="w-8 h-8 rounded-md bg-surface-container-highest text-on-surface font-headline-sm flex items-center justify-center hover:bg-surface-dim"  type="button">-</button>
<input className="w-16 text-center font-headline-md text-headline-md bg-primary font-bold focus:outline-none text-on-primary rounded" defaultValue={4} id="vslCount" min="0" type="number" />
<button className="w-8 h-8 rounded-md bg-surface-container-highest text-on-surface font-headline-sm flex items-center justify-center hover:bg-surface-dim"  type="button">+</button>
</div>
</div>

<div className="flex flex-col gap-space-xs bg-surface-container-low p-space-md rounded-lg">
<span className="font-label-md text-label-md text-on-surface">Taxis Conventionnés</span>
<div className="flex items-center justify-between mt-space-xs">
<button className="w-8 h-8 rounded-md bg-surface-container-highest text-on-surface font-headline-sm flex items-center justify-center hover:bg-surface-dim"  type="button">-</button>
<input className="w-16 text-center font-headline-md text-headline-md bg-transparent text-primary font-bold focus:outline-none" defaultValue={1} id="taxiCount" min="0" type="number" />
<button className="w-8 h-8 rounded-md bg-surface-container-highest text-on-surface font-headline-sm flex items-center justify-center hover:bg-surface-dim"  type="button">+</button>
</div>
</div>
</div>

<div className="flex flex-col gap-space-sm pt-space-xs">
<span className="font-label-lg text-label-lg text-on-surface">Équipements embarqués et télématique</span>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
<label className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer">
<input defaultChecked className="w-4 h-4 accent-secondary rounded" type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface">Système de géolocalisation GPS temps réel (API Clinigo)</span>
</label>
<label className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer">
<input defaultChecked className="w-4 h-4 accent-secondary rounded" type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface">Défibrillateur Automatisé Externe (DAE) certifié</span>
</label>
<label className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer">
<input defaultChecked className="w-4 h-4 accent-secondary rounded" type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface">Oxygénothérapie fixe et mobile vérifiée</span>
</label>
<label className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low cursor-pointer">
<input defaultChecked className="w-4 h-4 accent-secondary rounded" type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface">Matériel de désinfection COVID / Arboviroses renforcé</span>
</label>
</div>
</div>
</section>

<section className="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl shadow-[0_1px_3px_rgba(11,37,69,0.05)] flex flex-col gap-space-lg">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shrink-0">
<span className="material-symbols-outlined">cloud_upload</span>
</div>
<div className="flex flex-col">
<h2 className="font-headline-md text-headline-md text-primary">4. Pièces justificatives réglementaires</h2>
<span className="font-body-sm text-body-sm text-on-surface-variant">Formats acceptés : PDF, JPG, PNG cryptés (Max. 15 Mo par document)</span>
</div>
</div>
<span className="font-label-sm text-label-sm bg-surface-container px-space-sm py-1 rounded text-primary font-bold">HDS Crypté</span>
</div>

<FileUpload
  label="Pièces justificatives réglementaires (Agrément ARS, Kbis, Cartes Grises)"
  helpText="Formats acceptés : PDF, JPG, PNG cryptés HDS (Max. 15 Mo par document)"
  storageKey="transporter_reg_documents"
/>

<div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
<div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-xs min-w-0">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="font-body-sm text-body-sm text-on-surface truncate">Extrait Kbis (moins de 3 mois)</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Obligatoire</span>
</div>
<div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-xs min-w-0">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="font-body-sm text-body-sm text-on-surface truncate">Agrément Sanitaire ARS Martinique</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Obligatoire</span>
</div>
<div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-xs min-w-0">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="font-body-sm text-body-sm text-on-surface truncate">Convention CGSS 972 signée</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Obligatoire</span>
</div>
<div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low">
<div className="flex items-center gap-space-xs min-w-0">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="font-body-sm text-body-sm text-on-surface truncate">Cartes grises &amp; Contrôles conformité</span>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant">Obligatoire</span>
</div>
</div>
</section>

<section className="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl shadow-[0_1px_3px_rgba(11,37,69,0.05)] flex flex-col gap-space-lg">
<div className="flex items-center gap-space-sm pb-space-xs">
<div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">
<span className="material-symbols-outlined">admin_panel_settings</span>
</div>
<div className="flex flex-col">
<h2 className="font-headline-md text-headline-md text-primary">5. Gérant &amp; Référent d'exploitation Clinigo Pro</h2>
<span className="font-body-sm text-body-sm text-on-surface-variant">Identifiants d'accès au portail de dispatching en temps réel</span>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="adminLastName">Nom du titulaire / représentant légal <span className="text-error">*</span></label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" id="adminLastName" placeholder="Ex: CÉLESTE" required type="text" />
</div>
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="adminFirstName">Prénom <span className="text-error">*</span></label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" id="adminFirstName" placeholder="Ex: Jean-Marc" required type="text" />
</div>
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="adminFunction">Qualité / Fonction <span className="text-error">*</span></label>
<select className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" id="adminFunction" required>
<option value="Gerant">Gérant / Directeur d'exploitation</option>
<option value="ChefDeParc">Responsable de flotte / Régulateur principal</option>
<option value="Artisan">Artisan Taxi Conventionné indépendant</option>
</select>
</div>
<div className="flex flex-col gap-space-xs">
<label className="font-label-md text-label-md text-on-surface" htmlFor="adminDirectPhone">Téléphone mobile direct <span className="text-error">*</span></label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" id="adminDirectPhone" placeholder="06 96 00 00 00" required type="tel" />
</div>
<div className="flex flex-col gap-space-xs md:col-span-2">
<label className="font-label-md text-label-md text-on-surface" htmlFor="adminPassword">Créer un mot de passe sécurisé (Portail Pro) <span className="text-error">*</span></label>
<input className="h-11 px-space-sm rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/40 transition-all" id="adminPassword" placeholder="12 caractères minimum, majuscule, chiffre et symbole" required type="password" />
<span className="font-label-sm text-label-sm text-on-surface-variant">Conforme exigences ANS (Agence du Numérique en Santé)</span>
</div>
</div>

<div className="flex flex-col gap-space-xs pt-space-sm">
<label className="flex items-start gap-space-sm cursor-pointer">
<input className="mt-1 w-5 h-5 accent-primary rounded" required type="checkbox" />
<span className="font-body-sm text-body-sm text-on-surface">
                Je certifie l'exactitude des informations fournies et accepte la Charte d'Éthique &amp; de Déontologie du Transport Sanitaire Clinigo, ainsi que le contrôle aléatoire de géolocalisation pour l'optimisation des prises en charge urgentes.
              </span>
</label>
</div>

<div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md">
<button className="w-full sm:w-auto px-space-xl py-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm shadow-md transition-all flex items-center justify-center gap-space-xs" type="submit">
<span className="">Soumettre le dossier d'agrément</span>
<span className="material-symbols-outlined">arrow_forward</span>
</button>
<div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md">
<span className="material-symbols-outlined text-lg">timer</span>
<span className="">Validation sous 24h ouvrées par la régulation 972</span>
</div>
</div>
</section>
</form>

<aside className="lg:col-span-4 flex flex-col gap-space-lg">

<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(11,37,69,0.05)] flex flex-col gap-space-md">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
<h3 className="font-headline-sm text-headline-sm text-primary">Pourquoi rejoindre Clinigo ?</h3>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Une interface unique pensée pour décongestionner le trafic sanitaire en Martinique et rentabiliser vos tournées.
          </p>
<div className="flex flex-col gap-space-sm pt-space-xs">
<div className="flex items-start gap-space-sm">
<div className="w-7 h-7 rounded-full bg-secondary-container/40 text-secondary flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-sm">hub</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Flux garanti de réservations</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Accès prioritaire aux demandes CHUM (Clarac, Meynard, Mangot Vulcin) et Cliniques.</span>
</div>
</div>
<div className="flex items-start gap-space-sm">
<div className="w-7 h-7 rounded-full bg-secondary-container/40 text-secondary flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-sm">receipt_long</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Télétransmission BPEC / CGSS simplifiée</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Génération instantanée des bordereaux dématérialisés avec signature patient sur mobile.</span>
</div>
</div>
<div className="flex items-start gap-space-sm">
<div className="w-7 h-7 rounded-full bg-secondary-container/40 text-secondary flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-sm">route</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface font-semibold">Zéro retour à vide sur l'île</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Algorithme d'appariement Nord / Centre / Sud évitant les retours sans passager.</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-high/40 p-space-lg rounded-xl flex flex-col gap-space-sm relative overflow-hidden">
<div className="flex items-center gap-space-sm">
<img className="w-12 h-12 rounded-full object-cover border border-outline-variant/30" alt="Patrick M., Gérant d'ambulances" src="/assets/headshot.png" />
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-primary">Patrick M.</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Gérant de 6 ambulances (Trinité &amp; Fort-de-France)</span>
</div>
</div>
<p className="font-body-sm text-body-sm text-on-surface italic mt-space-xs">
            "Depuis notre conventionnement avec Clinigo, nous avons réduit nos temps d'attente à la sortie des urgences de 40%. La traçabilité pour la CGSS nous évite des semaines de litiges de facturation."
          </p>
<div className="flex items-center gap-1 text-secondary">
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="material-symbols-outlined text-sm" >star</span>
<span className="font-label-sm text-label-sm text-on-surface-variant ml-1 font-bold">Partenaire depuis 3 ans</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-[0_1px_3px_rgba(11,37,69,0.05)] flex flex-col gap-space-sm">
<span className="font-label-md text-label-md text-primary uppercase font-bold tracking-wider">Couverture Territoriale 972</span>
<div className="w-full h-44 rounded-xl overflow-hidden relative shadow-inner">
  <GoogleMapView mode="fleet" height="100%" />
</div>
<div className="grid grid-cols-2 gap-space-xs pt-1 text-on-surface-variant font-label-sm text-label-sm">
<div className="flex items-center gap-1">
<span className="material-symbols-outlined text-secondary text-sm">check</span>
              CHU Pierre Zobda-Quitman
            </div>
<div className="flex items-center gap-1">
<span className="material-symbols-outlined text-secondary text-sm">check</span>
              Hôpital Louis Domergue
            </div>
<div className="flex items-center gap-1">
<span className="material-symbols-outlined text-secondary text-sm">check</span>
              Clinique Saint-Paul
            </div>
<div className="flex items-center gap-1">
<span className="material-symbols-outlined text-secondary text-sm">check</span>
              Centre Emmaüs Sud
            </div>
</div>
</div>

<div className="bg-surface-container-low p-space-md rounded-xl flex flex-col gap-space-xs text-on-surface-variant">
<div className="flex items-center gap-space-xs text-primary font-label-md text-label-md">
<span className="material-symbols-outlined text-lg">shield</span>
<span className="">Sécurité des Données Médicales</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Les données transmises lors de l'enregistrement de votre entreprise sont chiffrées selon les normes de l'Agence Régionale de Santé (ARS) de Martinique et hébergées sur des serveurs souverains HDS.
          </p>
<div className="pt-space-xs flex items-center justify-between font-label-sm text-label-sm text-on-surface">
<span className="">Agrément R. 6312 CSP</span>
<span className="text-secondary font-bold">Conforme RGPD Santé</span>
</div>
</div>

<div className="p-space-md rounded-xl bg-primary text-on-primary flex items-center gap-space-sm">
<div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-xl">headset_mic</span>
</div>
<div className="flex flex-col">
<span className="font-label-md text-label-md font-semibold">Assistance Installation &amp; API</span>
<span className="font-body-sm text-body-sm text-primary-fixed-dim">Nos régulateurs vous assistent de 6h à 20h : 05 96 42 12 15</span>
</div>
</div>
</aside>
</div>
</div>
</div>
      </main>
      <Footer />
    </div>
  );
};
