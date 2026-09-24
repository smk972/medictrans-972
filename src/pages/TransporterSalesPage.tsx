import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { TransporterSimulatedConsole } from '../components/TransporterSimulatedConsole';
import { useAuth } from '../contexts/AuthContext';

export const TransporterSalesPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Si le transporteur est déjà connecté, il accède immédiatement à son dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role === 'TRANSPORTER') {
      navigate('/portal-transporteur', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Onglet interactif Démo (Plateforme Bureau vs Site Mobile Chauffeur)
  const [activeDeviceView, setActiveDeviceView] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');

  // Simulateur de Rentabilité
  const [monthlyRides, setMonthlyRides] = useState<number>(50);
  const avgRidePrice = 55; // Prix moyen d'une course sanitaire conventionnée
  const competitorCommissionPercent = 20; // 20% en moyenne sur plateformes classiques

  const competitorCost = Math.round((monthlyRides * avgRidePrice * competitorCommissionPercent) / 100);
  const clinigoCost = 19.9;
  const netSavings = Math.max(0, competitorCost - clinigoCost);

  // FAQ Accordéon
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Effets au Scroll : Barre de progression, CTA flottant, inclinaison 3D et révélations progressives
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showFloatingCta, setShowFloatingCta] = useState<boolean>(false);
  const [deviceTilt, setDeviceTilt] = useState<{ rotateX: number; scale: number }>({ rotateX: 3, scale: 0.99 });

  useEffect(() => {
    // 1. Intersection Observer pour animer les blocs avec la classe .scroll-reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach((el) => observer.observe(el));

    // 2. Gestionnaire de défilement fluide
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      setScrollProgress(progress);

      // Affichage du CTA flottant au-delà du Hero
      setShowFloatingCta(scrollY > 550);

      // Inclinaison 3D dynamique sur le mockup au scroll
      if (scrollY < 1200) {
        const tilt = Math.max(0, (500 - scrollY) * 0.006);
        const scale = Math.min(1, 0.985 + scrollY * 0.00003);
        setDeviceTilt({ rotateX: tilt, scale });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-slate-900 font-sans selection:bg-teal-600 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Barre de progression fluide au scroll */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 z-[100] transition-all duration-75 pointer-events-none"
        style={{ width: `${scrollProgress}%` }}
      />

      <SEOHead
        title="Espace Transporteurs | Clinigo"
        description="Rejoignez le 1er réseau de dispatch sanitaire. Dashboard de régulation pour votre bureau et application pour vos chauffeurs en tournée. 19,90 €/mois, 0% de commission, 30 jours offerts sans CB."
      />

      {/* Halo lumineux d'ambiance en arrière-plan (Identique à la page d'accueil) */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] sm:w-[1400px] h-[650px] bg-gradient-to-b from-teal-100/50 via-sky-50/40 to-transparent rounded-full blur-3xl opacity-90" />
        <div className="absolute top-[35%] right-[-10%] w-[700px] h-[700px] bg-gradient-to-br from-cyan-100/35 via-teal-50/25 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute bottom-[10%] left-[-10%] w-[750px] h-[750px] bg-gradient-to-tr from-emerald-100/35 via-teal-50/25 to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      {/* Navigation Header Globale (Island navbar élégante) */}
      <div className="relative z-50">
        <Header />
      </div>

      <main className="relative z-10 flex-grow pt-4 pb-16">
        {/* ========================================================================= */}
        {/* HERO SECTION : LUXURY EDITORIAL TECH SUR FOND CLAIR                      */}
        {/* ========================================================================= */}
        <section className="pt-10 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-extrabold uppercase tracking-[0.18em] shadow-xs animate-fadeIn mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
            <span>Offre Partenaire Pro • Sans Engagement • 0% de Commission</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-5xl leading-[1.12] mb-6">
            Développez votre activité sanitaire avec l'abonnement unique à{' '}
            <span className="bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 bg-clip-text text-transparent">
              19,90 €
            </span>
            <span className="text-2xl sm:text-3xl text-slate-500 font-bold"> /mois</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 max-w-3xl leading-relaxed mb-10 font-normal">
            Accédez en direct aux flux de courses hospitalières et privées sur toute votre région.{' '}
            <strong className="text-slate-900 font-semibold">Dashboard de régulation</strong> pour votre bureau et{' '}
            <strong className="text-slate-900 font-semibold">application</strong> pour vos chauffeurs en tournée.
          </p>

          {/* Double-Bezel CTA Hero Enclosure avec animation lumineuse et couleur en harmonie */}
          <div className="relative max-w-md w-full group">
            {/* Halo lumineux respirant en arrière-plan */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 opacity-60 blur-md animate-cta-aura group-hover:opacity-95 transition-opacity duration-500" />

            <div className="relative p-2 rounded-full bg-white/95 border border-teal-100 shadow-[0_12px_36px_rgba(13,148,136,0.18)] backdrop-blur-xl">
              <Link
                to="/inscription-transporteur"
                className="w-full relative overflow-hidden group/btn px-8 py-4 rounded-full bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 hover:from-teal-800 hover:via-teal-700 hover:to-emerald-700 text-white font-black text-sm sm:text-base transition-all duration-300 shadow-lg shadow-teal-700/30 hover:shadow-xl hover:shadow-teal-700/40 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-between gap-4 cursor-pointer"
              >
                {/* Rayon lumineux balayant (Shimmer continu) */}
                <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-btn-shimmer pointer-events-none" />

                <span className="relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-emerald-200 animate-pulse">verified</span>
                  <span>Activer mes 30 jours offerts</span>
                </span>

                <span className="relative z-10 w-9 h-9 rounded-full bg-white/20 border border-white/30 text-white flex items-center justify-center font-bold text-sm shadow-xs backdrop-blur-sm transition-all duration-300 group-hover/btn:translate-x-1.5 group-hover/btn:scale-110 group-hover/btn:bg-white group-hover/btn:text-teal-900">
                  ➔
                </span>
              </Link>
            </div>
          </div>

          {/* Micro Trust Strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-8 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-700 text-base">check_circle</span>
              <span>30 jours d'essai sans carte bancaire</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-700 text-base">verified_user</span>
              <span>Conforme CPAM &amp; Agréé ARS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-700 text-base">lock</span>
              <span>Chiffrement HDS Données de Santé</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-700 text-base">cancel</span>
              <span>Résiliable en 1 clic sans préavis</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2 : DOUBLE ÉCRAN INTERACTIF (PLATEFORME WEB VS SITE MOBILE)       */}
        {/* ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 scroll-reveal">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80">
              Deux Expériences Conçues Pour Votre Métier
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 tracking-tight">
              Au bureau sur grand écran, sur le terrain sur smartphone.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
              Vos régulateurs pilotent la flotte depuis leur ordinateur. Vos ambulanciers et chauffeurs reçoivent et valident les missions directement depuis leur téléphone sans installer d'application lourde.
            </p>

            {/* Interactive Switcher Buttons */}
            <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm mt-8">
              <button
                type="button"
                onClick={() => setActiveDeviceView('DESKTOP')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  activeDeviceView === 'DESKTOP'
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-base">computer</span>
                <span>Console Web Bureau</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDeviceView('MOBILE')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  activeDeviceView === 'MOBILE'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-base">smartphone</span>
                <span>App Mobile Ambulancier</span>
              </button>
            </div>
          </div>

          {/* Double-Bezel Interactive Hardware Container (Palette claire) avec inclinaison 3D au scroll */}
          <div
            className="p-3 sm:p-5 rounded-[2.5rem] bg-white border border-slate-200/90 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-transform duration-500 ease-out scroll-reveal delay-100"
            style={{
              transform: `perspective(1200px) rotateX(${deviceTilt.rotateX}deg) scale(${deviceTilt.scale})`
            }}
          >
            <div className="rounded-[calc(2.5rem-0.75rem)] bg-slate-50/70 border border-slate-200/70 overflow-hidden p-4 sm:p-8">
              {activeDeviceView === 'DESKTOP' ? (
                /* Simulation animée de la console bureau avec déplacement de souris */
                <TransporterSimulatedConsole />
              ) : (
                /* Vue Smartphone Chauffeur / Ambulancier Réel */
                <div className="flex flex-col items-center py-4 animate-fadeIn">
                  <div className="w-full max-w-[320px] sm:max-w-sm rounded-[3rem] bg-slate-950 border-[8px] sm:border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(2,132,199,0.35)] relative overflow-hidden text-white">
                    {/* Smartphone Dynamic Island */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-between px-2.5 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-slate-900 ring-1 ring-white/10" />
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-bold text-sky-400">AMB-402</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                    </div>

                    {/* Screenshot Container */}
                    <div className="relative w-full aspect-[9/19.5] overflow-hidden bg-slate-950">
                      <img 
                        src="/assets/capture-cockpit-ambulancier.png" 
                        alt="Application Clinigo Mobile Ambulancier — Cockpit Chauffeur Réel" 
                        className="w-full h-full object-cover object-top hover:scale-[1.02] transition-transform duration-500"
                      />
                      {/* Ambient edge shadow */}
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/50 rounded-full z-20 pointer-events-none" />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 mt-4 text-center max-w-md">
                    Application mobile dédiée aux équipages d'ambulance : gestion de disponibilité en temps réel, courses prioritaires SAMU 15, contraintes médicales et guidage GPS intégré.
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3 : LA PROPOSITION DE VALEUR 19,90 € VS COMMISSIONS              */}
        {/* ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Colonne Gauche : Argumentaire Chiffré */}
            <div className="space-y-6 scroll-reveal">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80">
                Transparence Totale &amp; Respect de Votre Marge
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Pourquoi payer 20% de commission quand un forfait fixe suffit ?
              </h2>

              <p className="text-slate-600 text-base leading-relaxed">
                Les centrales traditionnelles prélèvent entre 15% et 25% sur chaque course effectuée par vos équipages. Sur une course à 70 €, vous perdez jusqu'à 17,50 € à chaque voyage !
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-bold border border-rose-200">
                    ✕
                  </div>
                  <div>
                    <strong className="text-slate-900 text-sm">Les centrales à commission :</strong>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Plus vous travaillez, plus vous payez. Sur 60 courses/mois, vous perdez plus de 660 € de chiffre d'affaires prélevé par l'intermédiaire.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 flex items-start gap-3 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 font-bold">
                    ✓
                  </div>
                  <div>
                    <strong className="text-teal-950 text-sm">Le modèle Clinigo Pro :</strong>
                    <p className="text-xs text-teal-900 mt-0.5">
                      <strong>19,90 € HT par mois, un point c'est tout.</strong> 100% du montant CPAM et des règlements reste dans votre trésorerie, que vous fassiez 10 ou 200 courses.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne Droite : Simulateur de Rentabilité Interactif */}
            <div className="p-3 sm:p-5 rounded-[2.5rem] bg-gradient-to-br from-teal-100/60 via-sky-50/50 to-white border border-teal-200 shadow-xl scroll-reveal delay-150">
              <div className="rounded-[calc(2.5rem-0.75rem)] bg-white border border-slate-200/80 p-6 sm:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Simulateur de Gain Net
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold font-mono border border-teal-200">
                    0% commission
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 mb-2">
                    <span>Nombre de courses traitées par mois :</span>
                    <span className="text-2xl font-black text-teal-800 font-mono">{monthlyRides}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={monthlyRides}
                    onChange={(e) => setMonthlyRides(Number(e.target.value))}
                    className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                    <span>10 courses</span>
                    <span>100 courses</span>
                    <span>200 courses</span>
                  </div>
                </div>

                {/* Chiffres Comparatifs */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 text-center">
                    <span className="text-[11px] text-rose-700 block font-semibold">Coût Centrale (20%)</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-700 font-mono mt-1 block">
                      -{competitorCost} €
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">prélevés chaque mois</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 text-center">
                    <span className="text-[11px] text-teal-800 block font-semibold">Formule Clinigo</span>
                    <span className="text-xl sm:text-2xl font-black text-teal-900 font-mono mt-1 block">
                      19,90 €
                    </span>
                    <span className="text-[10px] text-slate-600 mt-0.5 block">fixe sans mauvaise surprise</span>
                  </div>
                </div>

                {/* Bénéfice Net Sauvegardé */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white text-center space-y-1 shadow-md shadow-teal-700/20">
                  <span className="text-xs font-bold text-teal-100 uppercase tracking-wide">
                    Vous préservez chaque mois :
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                    +{netSavings.toFixed(2).replace('.', ',')} € <span className="text-sm font-normal text-emerald-200">dans votre poche</span>
                  </div>
                  <p className="text-[11px] text-teal-100 font-medium pt-1">
                    ✦ L'abonnement est rentabilisé dès la 1ère course du mois !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4 : BENTO GRID DES FONCTIONNALITÉS EXCLUSIVES                     */}
        {/* ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 scroll-reveal">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80">
              Tout Est Inclus Sans Supplément
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 tracking-tight">
              Une suite complète pour réguler et rouler sereinement.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 : Radar & Géolocalisation */}
            <div className="p-2 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow scroll-reveal delay-100">
              <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-50/70 border border-slate-100 h-full flex flex-col justify-between space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">radar</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Radar en Temps Réel</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Détection instantanée des départs hospitaliers dans votre rayon kilométrique paramétrable (10 km, 25 km, 40 km ou toute l'île).
                  </p>
                </div>
                <div className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                  <span>Temps de notification : &lt; 1 seconde</span>
                </div>
              </div>
            </div>

            {/* Card 2 : Fiches PMT Dématérialisées */}
            <div className="p-2 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow scroll-reveal delay-150">
              <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-50/70 border border-slate-100 h-full flex flex-col justify-between space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">description</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Fiches PMT Dématérialisées</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Visualisez les prescriptions médicales de transport validées par les praticiens avant d'accepter. Fini les courses contestées par la CPAM.
                  </p>
                </div>
                <div className="text-[11px] text-sky-700 font-bold flex items-center gap-1">
                  <span>Conforme Cerfa S3138 &amp; Tiers-payant ALD</span>
                </div>
              </div>
            </div>

            {/* Card 3 : Flotte & Équipages Illimités */}
            <div className="p-2 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow scroll-reveal delay-200">
              <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-50/70 border border-slate-100 h-full flex flex-col justify-between space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">groups</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Chauffeurs &amp; Flotte Illimités</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Un seul forfait de 19,90 € couvre l'ensemble de votre société. Connectez 2, 5 ou 20 ambulanciers et véhicules sans payer un centime de plus.
                  </p>
                </div>
                <div className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                  <span>Pas de coût par licence ou par siège</span>
                </div>
              </div>
            </div>

            {/* Card 4 : Priorité 24h Nominative */}
            <div className="p-2 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow scroll-reveal delay-250">
              <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-50/70 border border-slate-100 h-full flex flex-col justify-between space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">lock_clock</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Priorité 24h sur vos Clients</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Lorsqu'un patient ou un service hospitalier sélectionne votre nom, vous disposez d'un délai exclusif de 24h00 pour la valider avant bascule dans le pot commun.
                  </p>
                </div>
                <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <span>Fidélisation de votre patientèle</span>
                </div>
              </div>
            </div>

            {/* Card 5 : Factures Automatiques & Comptabilité */}
            <div className="p-2 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow scroll-reveal delay-300">
              <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-50/70 border border-slate-100 h-full flex flex-col justify-between space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Facturation &amp; Export PDF</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Téléchargement en 1 clic de vos factures d'abonnement au format PDF professionnel avec mentions légales, SIRET et numéro de TVA pour votre expert-comptable.
                  </p>
                </div>
                <div className="text-[11px] text-indigo-700 font-bold flex items-center gap-1">
                  <span>Historique comptable 100% traçable</span>
                </div>
              </div>
            </div>

            {/* Card 6 : Support WhatsApp & Ligne Dédiée */}
            <div className="p-2 rounded-[2rem] bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow scroll-reveal delay-350">
              <div className="p-6 rounded-[calc(2rem-0.5rem)] bg-slate-50/70 border border-slate-100 h-full flex flex-col justify-between space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">headset_mic</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Support Dédié 7j/7</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Une équipe de régulateurs sanitaires disponibles au téléphone et par WhatsApp pour vous aider en cas d'imprévu, de panne véhicule ou de transfert urgent.
                  </p>
                </div>
                <div className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">confirmation_number</span>
                  <span>Tickets support disponibles 24h/24h</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5 : TÉMOIGNAGES PROFESSIONNELS                                   */}
        {/* ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 scroll-reveal">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80">
              Retours du Terrain
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-4 tracking-tight">
              Adopté par les compagnies d'ambulances et taxis de référence.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between scroll-reveal delay-100">
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                « Avec l'abonnement à 19,90 €, on a arrêté de payer des commissions astronomiques chaque fin de mois. Le site mobile est ultra fluide pour mes 3 ambulanciers sur le terrain : ils cliquent, ils ont Waze et la fiche patient directement. »
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm border border-amber-200">
                  PC
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Patrick Césaire</div>
                  <div className="text-[10px] text-slate-500">Gérant Ambulances Madinina Secours (972)</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between scroll-reveal delay-200">
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                « La priorité de 24h sur les demandes directes nous permet de garder nos patients réguliers tout en captant les retours d'hospitalisation du CHU lorsqu'on a un créneau vide. C'est le meilleur investissement de notre société. »
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-black flex items-center justify-center text-sm border border-sky-200">
                  TL
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Thomas Leroy</div>
                  <div className="text-[10px] text-slate-500">Responsable Dispatch Île-de-France Secours (75)</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between scroll-reveal delay-300">
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                « En tant que taxi conventionné seul dans mon véhicule, je n'avais pas envie d'une usine à gaz. Là, aucune appli à installer, je reçois le WhatsApp, je valide sur le site mobile, et le tarif CPAM est calculé automatiquement. »
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-sm border border-teal-200">
                  KB
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Karim Belkacem</div>
                  <div className="text-[10px] text-slate-500">Chauffeur Taxi Conventionné Rhône (69)</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6 : FAQ ACCORDÉON                                                */}
        {/* ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="text-center mb-10 scroll-reveal">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80">
              Questions Fréquentes
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 tracking-tight">
              Tout ce que vous devez savoir avant de commencer.
            </h2>
          </div>

          <div className="space-y-3 scroll-reveal delay-100">
            {[
              {
                q: "Ai-je besoin d'installer une application sur les téléphones de mes chauffeurs ?",
                a: "Non, absolument aucune. Clinigo fonctionne comme une Progressive Web App ultra-rapide. Il suffit d'ouvrir le lien sur le navigateur de n'importe quel smartphone (iPhone, Samsung, etc.). Vous pouvez ajouter l'icône sur l'écran d'accueil en 1 clic."
              },
              {
                q: "Comment fonctionne la période d'essai gratuit de 30 jours ?",
                a: "Votre essai de 30 jours est 100% gratuit et s'active immédiatement après vérification de votre numéro de mobile par WhatsApp. Aucune carte bancaire n'est demandée pour commencer à tester le dispatching et valider vos premières courses."
              },
              {
                q: "Puis-je connecter plusieurs véhicules et chauffeurs avec un seul forfait à 19,90 € ?",
                a: "Oui ! Le tarif de 19,90 € HT par mois est unique par entreprise (numéro SIRET/Agrément ARS). Il inclut un nombre illimité de véhicules (Ambulances, VSL, Taxis) et de chauffeurs connectés simultanément."
              },
              {
                q: "Y a-t-il un engagement de durée ou des frais cachés ?",
                a: "Aucun engagement. Vous pouvez interrompre votre abonnement à tout moment d'un simple clic depuis votre onglet 'Mon abonnement'. Il n'y a aucun frais de dossier, aucun frais de résiliation et aucune commission sur vos courses."
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 cursor-pointer hover:bg-slate-50/50"
                >
                  <span>{item.q}</span>
                  <span className="material-symbols-outlined text-teal-700 text-lg shrink-0 transition-transform duration-200" style={{
                    transform: openFaqIndex === idx ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    keyboard_arrow_down
                  </span>
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fadeIn">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 7 : BANNIÈRE FINALE DE CONVERSION                                 */}
        {/* ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto text-center scroll-reveal delay-100">
          <div className="p-8 sm:p-14 rounded-[3rem] bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <span className="text-xs font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-3.5 py-1 rounded-full shadow-md inline-block">
                ✦ 30 Jours d'Essai Gratuit Sans CB
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Rejoignez le 1er réseau de transport sanitaire dès maintenant.
              </h2>

              <p className="text-sm sm:text-base text-teal-100 font-normal leading-relaxed">
                Connectez votre flotte, visualisez les courses hospitalières en temps réel et gardez 100% de vos gains pour seulement 19,90 € HT par mois.
              </p>

              <div className="pt-4 flex justify-center">
                <div className="relative max-w-md w-full group">
                  {/* Halo lumineux respirant en arrière-plan */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200 opacity-60 blur-md animate-cta-aura group-hover:opacity-95 transition-opacity duration-500" />

                  <div className="relative p-1.5 rounded-full bg-slate-950/90 border border-white/20 shadow-2xl backdrop-blur-xl">
                    <Link
                      to="/inscription-transporteur"
                      className="w-full relative overflow-hidden group/btn px-8 py-4 rounded-full bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 hover:from-black hover:to-slate-900 text-white font-black text-sm sm:text-base transition-all duration-300 shadow-xl hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-between gap-4 cursor-pointer"
                    >
                      {/* Shimmer lumineux balayant en continu */}
                      <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-btn-shimmer pointer-events-none" />

                      <span className="relative z-10 flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-amber-300 text-xl animate-pulse">rocket_launch</span>
                        <span className="tracking-wide">Créer mon compte transporteur</span>
                      </span>

                      <span className="relative z-10 w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 group-hover/btn:translate-x-1.5 group-hover/btn:scale-110 group-hover/btn:bg-amber-300">
                        ➔
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-teal-100/90 font-medium pt-2">
                Aucun engagement • Activation immédiate par WhatsApp • Agrément ARS requis
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quick-CTA Flottant au scroll au-delà du Hero */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 w-[92%] max-w-lg ${
          showFloatingCta ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-12 opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-2 sm:p-2.5 rounded-full bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-[0_12px_40px_rgba(15,23,42,0.35)] flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5 pl-3 sm:pl-4">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-left leading-tight">
              <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>19,90 € HT</span>
                <span className="text-[10px] text-teal-300 font-bold bg-teal-500/20 px-1.5 py-0.5 rounded-full">0% com.</span>
              </div>
              <div className="text-[10px] text-slate-300 hidden sm:block">30 jours offerts sans CB</div>
            </div>
          </div>

          <Link
            to="/inscription-transporteur"
            className="px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>Activer l'offre</span>
            <span className="font-bold">➔</span>
          </Link>
        </div>
      </div>

      {/* Footer Global */}
      <Footer />
    </div>
  );
};
