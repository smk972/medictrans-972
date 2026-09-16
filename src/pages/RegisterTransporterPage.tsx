import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { PhoneInput } from '../components/PhoneInput';
import { GoogleMapView } from '../components/GoogleMapView';

export const RegisterTransporterPage: React.FC = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState('Zone Industrielle La Lézarde, 97232 Le Lamentin');
  const [phoneEmergency, setPhoneEmergency] = useState('05 96 51 00 00');
  const [ambCount, setAmbCount] = useState(3);
  const [vslCount, setVslCount] = useState(2);
  const [taxiCount, setTaxiCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-slate-900 font-sans selection:bg-teal-600 selection:text-white flex flex-col relative overflow-x-hidden">
      <SEOHead
        title="Inscription Transporteur Pro • 30 Jours Offerts | Clinigo"
        description="Rejoignez le 1er réseau de dispatch sanitaire. 30 jours d'essai sans CB, 0% de commission, régulation de flotte et missions certifiées CPAM."
        canonicalPath="/inscription-transporteur"
      />

      {/* Halos lumineux d'ambiance en arrière-plan */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] sm:w-[1400px] h-[600px] bg-gradient-to-b from-teal-100/50 via-sky-50/40 to-transparent rounded-full blur-3xl opacity-90" />
        <div className="absolute top-[35%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-br from-cyan-100/35 via-teal-50/25 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute bottom-[10%] left-[-10%] w-[750px] h-[750px] bg-gradient-to-tr from-emerald-100/35 via-teal-50/25 to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      <div className="relative z-50">
        <Header />
      </div>

      <main className="relative z-10 flex-grow pt-4 pb-20">
        {/* ========================================================================= */}
        {/* BANDEAU SUPÉRIEUR DE CONFIANCE (Micro Trust Strip)                        */}
        {/* ========================================================================= */}
        <div className="w-full bg-white/80 border-b border-slate-200/80 backdrop-blur-md px-4 sm:px-6 py-2.5 text-xs text-slate-600">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-teal-700 text-base">verified_user</span>
              <span>Réseau Sanitaire Officiel : Déploiement inter-établissements CHU, Hôpitaux &amp; Cliniques</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-[11px] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Serveurs HDS Données de Santé
              </span>
              <span className="hidden md:inline text-slate-300">•</span>
              <span className="hidden md:inline">Support Régulation Partenaires 7j/7</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO SECTION DE LA PAGE D'INSCRIPTION                                     */}
        {/* ========================================================================= */}
        <section className="pt-8 pb-10 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200/80">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-extrabold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
                <span>Offre Pro • 30 Jours d'Essai Offerts • Sans Engagement</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Activez votre flotte sur le réseau Clinigo Pro.
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                Accédez en direct aux missions régulées des hôpitaux, cliniques privées, centres de dialyse et retours d'hospitalisation sur votre secteur. Gardez 100% de vos gains pour 19,90 € HT/mois.
              </p>
            </div>

            {/* Badges Avantages Rapides */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm shrink-0">
              <div className="text-center px-3">
                <span className="text-2xl font-black text-teal-800 font-mono block">0 %</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Commission</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center px-3">
                <span className="text-2xl font-black text-emerald-600 font-mono block">30 j</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Essai Sans CB</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center px-3">
                <span className="text-2xl font-black text-slate-900 font-mono block">19,90€</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">HT / mois fixe</span>
              </div>
            </div>
          </div>

          {/* Étapes d'enregistrement (3 étapes claires et fluides) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                1
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 truncate">Société &amp; Agréments</div>
                <div className="text-[10px] text-teal-700 font-semibold">Étape en cours</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 text-slate-600 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">Flotte &amp; Véhicules</div>
                <div className="text-[10px] text-slate-500">Ambulances, VSL, Taxis</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 text-slate-600 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 font-black text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">Gérant &amp; Accès Dispatch</div>
                <div className="text-[10px] text-slate-500">Activation immédiate</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CONTENU PRINCIPAL : FORMULAIRE PRO + SIDEBAR DE RÉASSURANCE               */}
        {/* ========================================================================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Formulaire Principal (8 colonnes) */}
            <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
              {/* ----------------------------------------------------------------- */}
              {/* SECTION 1 : IDENTIFICATION DE L'ENTREPRISE                        */}
              {/* ----------------------------------------------------------------- */}
              <div className="p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200 shrink-0">
                    <span className="material-symbols-outlined text-xl">domain</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">1. Identification de l'entreprise</h2>
                    <p className="text-xs text-slate-500">Renseignements légaux enregistrés auprès du greffe et de l'ARS / Préfecture</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="companyName">
                      Raison Sociale / Enseigne commerciale <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
                      id="companyName"
                      placeholder="Ex: Ambulances & VSL Santé SARL"
                      required
                      type="text"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="siretNumber">
                      Numéro SIRET (14 chiffres) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all font-mono"
                      id="siretNumber"
                      maxLength={14}
                      placeholder="Ex: 849 201 938 00012"
                      required
                      type="text"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="finessNumber">
                      N° FINESS ou Agrément ARS / CPAM <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all font-mono"
                      id="finessNumber"
                      placeholder="Ex: 970100234 ou N° Agrément"
                      required
                      type="text"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="apeCode">
                      Code APE / NAF <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all font-mono"
                      defaultValue="86.90A"
                      id="apeCode"
                      placeholder="86.90A (Ambulances) ou 49.32Z (Taxis)"
                      required
                      type="text"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="communeSelect">
                      Commune principale d'implantation <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
                      id="communeSelect"
                      placeholder="Ex: Le Lamentin, Fort-de-France, Paris, Lyon..."
                      required
                      type="text"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <AddressAutocomplete
                      id="transporterAddress"
                      label="Adresse du dépôt / Siège social"
                      required
                      value={address}
                      onChange={(val) => setAddress(val)}
                      placeholder="Ex: Voie, Zone industrielle, Code Postal ou Commune..."
                      helperText="Aide à la saisie de l'adresse (France métropolitaine & DOM)"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <PhoneInput
                      id="phoneEmergency"
                      label="Ligne d'astreinte & régulation 24/7"
                      required
                      value={phoneEmergency}
                      defaultDialCode="+33"
                      onChange={(val) => setPhoneEmergency(val)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="emailPro">
                      Courriel professionnel de dispatch <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
                        id="emailPro"
                        placeholder="regulation@ambulances.fr"
                        required
                        type="email"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-base">
                        mail
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* SECTION 2 : CATÉGORIES & AGRÉMENTS D'EXPLOITATION                 */}
              {/* ----------------------------------------------------------------- */}
              <div className="p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center border border-sky-200 shrink-0">
                    <span className="material-symbols-outlined text-xl">badge</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">2. Catégories d'agrément</h2>
                    <p className="text-xs text-slate-500">Cochez les types de véhicules autorisés au sein de votre structure</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <label className="cursor-pointer flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/80 hover:border-teal-300 transition-all">
                    <input defaultChecked className="mt-1 w-4 h-4 accent-teal-700 rounded cursor-pointer" type="checkbox" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-700 text-lg">ambulance</span>
                        <span className="font-extrabold text-xs text-slate-900">Ambulance de Soins</span>
                      </div>
                      <span className="text-[11px] font-bold text-teal-800 block">Type A / B (Norme EN 1789)</span>
                      <p className="text-xs text-slate-500 leading-relaxed">Transport allongé sous surveillance, transferts inter-hospitaliers d'urgence.</p>
                    </div>
                  </label>

                  <label className="cursor-pointer flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/80 hover:border-teal-300 transition-all">
                    <input defaultChecked className="mt-1 w-4 h-4 accent-teal-700 rounded cursor-pointer" type="checkbox" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-700 text-lg">directions_car</span>
                        <span className="font-extrabold text-xs text-slate-900">VSL (Véhicule Sanitaire Léger)</span>
                      </div>
                      <span className="text-[11px] font-bold text-teal-800 block">Catégorie D - Agrément ARS</span>
                      <p className="text-xs text-slate-500 leading-relaxed">Transport assis professionnalisé, dialyse, radiothérapie, consultations.</p>
                    </div>
                  </label>

                  <label className="cursor-pointer flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/80 hover:border-teal-300 transition-all">
                    <input className="mt-1 w-4 h-4 accent-teal-700 rounded cursor-pointer" type="checkbox" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-700 text-lg">local_taxi</span>
                        <span className="font-extrabold text-xs text-slate-900">Taxi Conventionné CPAM</span>
                      </div>
                      <span className="text-[11px] font-bold text-teal-800 block">Autorisation ADS active</span>
                      <p className="text-xs text-slate-500 leading-relaxed">Conventionnement direct CPAM ou CGSS actif pour prise en charge ALD 100%.</p>
                    </div>
                  </label>

                  <label className="cursor-pointer flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/80 hover:border-teal-300 transition-all">
                    <input className="mt-1 w-4 h-4 accent-teal-700 rounded cursor-pointer" type="checkbox" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-700 text-lg">accessible</span>
                        <span className="font-extrabold text-xs text-slate-900">Véhicule Adapté TPMR</span>
                      </div>
                      <span className="text-[11px] font-bold text-teal-800 block">Rampe &amp; ancrages certifiés</span>
                      <p className="text-xs text-slate-500 leading-relaxed">Prise en charge de patients en fauteuil roulant sans transfert de siège.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* SECTION 3 : FLOTTE & ÉQUIPEMENTS EMBARQUÉS                         */}
              {/* ----------------------------------------------------------------- */}
              <div className="p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 shrink-0">
                    <span className="material-symbols-outlined text-xl">commute</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">3. Flotte &amp; Équipements</h2>
                    <p className="text-xs text-slate-500">Un seul abonnement à 19,90 € couvre l'ensemble de vos véhicules et chauffeurs</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Ambulances</span>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAmbCount(Math.max(0, ambCount - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-2xl font-black text-slate-900 font-mono w-10 text-center">{ambCount}</span>
                      <button
                        type="button"
                        onClick={() => setAmbCount(ambCount + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">VSL</span>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setVslCount(Math.max(0, vslCount - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-2xl font-black text-slate-900 font-mono w-10 text-center">{vslCount}</span>
                      <button
                        type="button"
                        onClick={() => setVslCount(vslCount + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Taxis</span>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTaxiCount(Math.max(0, taxiCount - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-2xl font-black text-slate-900 font-mono w-10 text-center">{taxiCount}</span>
                      <button
                        type="button"
                        onClick={() => setTaxiCount(taxiCount + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 block">Télématique &amp; Équipements certifiés</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer">
                      <input defaultChecked className="w-4 h-4 accent-teal-700 rounded cursor-pointer" type="checkbox" />
                      <span>Géolocalisation GPS en direct sur application chauffeur</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer">
                      <input defaultChecked className="w-4 h-4 accent-teal-700 rounded cursor-pointer" type="checkbox" />
                      <span>Défibrillateur Automatisé Externe (DAE) vérifié</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer">
                      <input defaultChecked className="w-4 h-4 accent-teal-700 rounded cursor-pointer" type="checkbox" />
                      <span>Oxygénothérapie fixe et mobile vérifiée</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 cursor-pointer">
                      <input defaultChecked className="w-4 h-4 accent-teal-700 rounded cursor-pointer" type="checkbox" />
                      <span>Matériel de désinfection sanitaire renforcé</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* SECTION 4 : GÉRANT & CRÉATION DES IDENTIFIANTS DISPATCH           */}
              {/* ----------------------------------------------------------------- */}
              <div className="p-6 sm:p-8 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 shrink-0">
                    <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">4. Gérant &amp; Référent d'exploitation</h2>
                    <p className="text-xs text-slate-500">Identifiants de connexion au dashboard de régulation Clinigo Pro</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="adminLastName">
                      Nom du titulaire / représentant légal <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
                      id="adminLastName"
                      placeholder="Ex: CÉLESTE"
                      required
                      type="text"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="adminFirstName">
                      Prénom <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
                      id="adminFirstName"
                      placeholder="Ex: Jean-Marc"
                      required
                      type="text"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="adminFunction">
                      Qualité / Fonction <span className="text-rose-600">*</span>
                    </label>
                    <select
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
                      id="adminFunction"
                      required
                    >
                      <option value="Gerant">Gérant / Directeur d'exploitation</option>
                      <option value="ChefDeParc">Responsable de flotte / Régulateur</option>
                      <option value="Artisan">Artisan Taxi Conventionné</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="adminDirectPhone">
                      Téléphone mobile direct (Validation WhatsApp) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all font-mono"
                      id="adminDirectPhone"
                      placeholder="06 96 00 00 00"
                      required
                      type="tel"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-800" htmlFor="adminPassword">
                      Créer votre mot de passe sécurisé <span className="text-rose-600">*</span>
                    </label>
                    <input
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all"
                      id="adminPassword"
                      placeholder="12 caractères minimum (lettres, chiffres et symboles)"
                      required
                      type="password"
                    />
                    <span className="text-[11px] text-slate-500 block">Conforme aux recommandations de l'Agence du Numérique en Santé (ANS).</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200/80 cursor-pointer">
                    <input className="mt-1 w-4 h-4 accent-teal-700 rounded cursor-pointer shrink-0" required type="checkbox" />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      Je certifie l'exactitude des informations fournies et accepte la Charte d'Éthique &amp; de Déontologie du Transport Sanitaire Clinigo. Je bénéficie de 30 jours d'essai offerts sans engagement.
                    </span>
                  </label>
                </div>

                {/* ========================================================================= */}
                {/* BOUTON DE SOUMISSION HAUTE GAMME AVEC ANIMATION LUMINEUSE (SHIMMER + AURA) */}
                {/* ========================================================================= */}
                <div className="pt-4 flex flex-col items-center sm:items-stretch">
                  <div className="relative w-full group">
                    {/* Halo lumineux respirant en arrière-plan */}
                    <div className="absolute -inset-1 rounded-2xl sm:rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 opacity-60 blur-md animate-cta-aura group-hover:opacity-95 transition-opacity duration-500" />

                    <div className="relative p-1 rounded-2xl sm:rounded-full bg-white/95 border border-teal-100 shadow-[0_12px_36px_rgba(13,148,136,0.18)] backdrop-blur-xl">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full relative overflow-hidden group/btn px-6 sm:px-10 py-4 rounded-xl sm:rounded-full bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 hover:from-teal-800 hover:via-teal-700 hover:to-emerald-700 text-white font-black text-sm sm:text-base transition-all duration-300 shadow-lg shadow-teal-700/30 hover:shadow-xl hover:shadow-teal-700/40 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-between gap-4 cursor-pointer disabled:opacity-75"
                      >
                        {/* Shimmer lumineux balayant en continu */}
                        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-btn-shimmer pointer-events-none" />

                        <span className="relative z-10 flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-lg sm:text-xl text-emerald-200 animate-pulse">
                            verified
                          </span>
                          <span>
                            {isSubmitting ? 'Activation en cours...' : 'Soumettre le dossier (Activer mes 30 jours offerts)'}
                          </span>
                        </span>

                        <span className="relative z-10 w-9 h-9 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center font-bold text-sm shadow-xs backdrop-blur-sm transition-all duration-300 group-hover/btn:translate-x-1.5 group-hover/btn:scale-110 group-hover/btn:bg-white group-hover/btn:text-teal-900 shrink-0">
                          ➔
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="text-center text-[11px] text-slate-500 font-medium pt-3">
                    ✦ Activation immédiate • Sans carte bancaire • 19,90 € HT/mois résiliable en 1 clic
                  </div>
                </div>
              </div>
            </form>

            {/* Sidebar Droite : Pourquoi nous rejoindre, Carte et Garanties */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Card 1 : Pourquoi Clinigo ? */}
              <div className="p-6 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                  <span className="material-symbols-outlined text-teal-700 text-xl">trending_up</span>
                  <span>Pourquoi rejoindre Clinigo Pro ?</span>
                </div>

                <div className="space-y-3.5 pt-1">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">0% de commission sur vos courses</strong>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Vous conservez 100% de vos gains CPAM et des tarifs réglementés.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">Priorité 24h sur vos clients</strong>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Délai exclusif pour valider les demandes nominatives avant le pot commun.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">Application chauffeur instantanée</strong>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                        Aucune application lourde : vos ambulanciers reçoivent les missions sur leur smartphone.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 : Carte dynamique des établissements connectés */}
              <div className="p-6 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                  Couverture Territoriale &amp; CHU
                </span>
                <div className="w-full h-44 rounded-xl overflow-hidden relative shadow-inner border border-slate-200/80">
                  <GoogleMapView mode="fleet" height="100%" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600 text-[11px]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-teal-700 text-sm">check</span>
                    <span>Hôpitaux &amp; CHU</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-teal-700 text-sm">check</span>
                    <span>Cliniques &amp; Dialyse</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-teal-700 text-sm">check</span>
                    <span>Centres EHPAD</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="material-symbols-outlined text-teal-700 text-sm">check</span>
                    <span>Rapatriements EVASAN</span>
                  </div>
                </div>
              </div>

              {/* Card 3 : Sécurité des données */}
              <div className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2">
                <div className="flex items-center gap-2 text-teal-950 font-bold text-xs">
                  <span className="material-symbols-outlined text-teal-700 text-lg">shield</span>
                  <span>Sécurité des Données Médicales</span>
                </div>
                <p className="text-[11px] text-teal-900 leading-relaxed">
                  Toutes les prescriptions de transport et données sanitaires sont chiffrées de bout en bout sur des serveurs certifiés HDS (Hébergement de Données de Santé) agréés ARS.
                </p>
              </div>

              {/* Card 4 : Témoignage terrain */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <img className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="Patrick M." src="/assets/headshot.png" />
                  <div>
                    <div className="text-xs font-black text-slate-900">Patrick M.</div>
                    <div className="text-[10px] text-slate-500">Gérant d'ambulances partenaire</div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  « Pour 19,90 € par mois, c'est rentabilisé dès le premier trajet. Nos 3 véhicules tournent sans retour à vide et la télétransmission CPAM est limpide. »
                </p>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <span>★ ★ ★ ★ ★</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-1">Partenaire vérifié</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Modal de Confirmation Post-Soumission */}
      {submitted && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Dossier Validé !</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Votre période d'essai de <strong>30 jours offerts</strong> a bien été initialisée. Vous recevez un code d'activation par WhatsApp pour vous connecter directement à votre console de régulation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-950 font-medium text-left space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-700 text-sm">lock_open</span>
                <strong>Accès Immédiat au Dispatch</strong>
              </div>
              <div>Votre numéro d'astreinte est prêt à recevoir les premières alertes de courses hospitalières.</div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/connexion?category=transporter')}
                className="w-full py-3.5 px-6 rounded-full bg-teal-700 hover:bg-teal-800 text-white font-black text-sm shadow-md transition-all cursor-pointer"
              >
                Accéder à mon espace de régulation ➔
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
