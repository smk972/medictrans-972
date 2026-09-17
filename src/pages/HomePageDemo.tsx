import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SEOHead } from '../components/SEOHead';
import { Footer } from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useAiChat } from '../context/AiChatContext';
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Car, 
  HeartHandshake, 
  FileText, 
  PhoneCall, 
  Sparkles, 
  Star, 
  Building2, 
  BadgeCheck, 
  Navigation, 
  Stethoscope, 
  Compass,
  ArrowUpRight,
  ChevronRight,
  UserCheck,
  Check,
  Percent,
  Sliders,
  LogIn,
  ChevronLeft,
  Smartphone,
  Laptop,
  Play,
  Pause,
  Download,
  ExternalLink,
  Lock
} from 'lucide-react';

export const HomePageDemo: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { openChat } = useAiChat();

  // Interactive Fleet preview tab
  const [activeFleetTab, setActiveFleetTab] = useState<'vsl' | 'taxi' | 'ambulance'>('vsl');

  // Interactive CPAM Simulator state
  const [coverageRegime, setCoverageRegime] = useState<'ald' | 'atmp' | 'maternite' | 'general'>('ald');

  // Ecosystem Showcase Carousel state (3 rotating objects: App Patient, App Ambulance, Commande Web)
  const [carouselSlide, setCarouselSlide] = useState<number>(0);
  const [carouselAutoPlay, setCarouselAutoPlay] = useState<boolean>(true);
  const [carouselProgress, setCarouselProgress] = useState<number>(0);

  // Auto-play timer for the 3-object carousel
  useEffect(() => {
    if (!carouselAutoPlay) return;

    const intervalTime = 50;
    const totalDuration = 5500; // 5.5s per object
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setCarouselProgress((prev) => {
        if (prev >= 100) {
          setCarouselSlide((curr) => (curr + 1) % 3);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [carouselAutoPlay, carouselSlide]);

  const handleSelectSlide = (idx: number) => {
    setCarouselSlide(idx);
    setCarouselProgress(0);
  };

  // Storytelling texts for each slide requested by user
  const slidesContent = [
    {
      id: 0,
      badge: 'Application Mobile Patients',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200/80',
      title: 'Une application mobile dédiée aux patients.',
      description: "Commandez votre transport en moins d'une minute. Plus aucun rendez-vous médical manqué.",
    },
    {
      id: 1,
      badge: 'Site Internet & Console Web',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200/80',
      title: 'Un site internet simple et intuitif.',
      description: 'Il n\'a jamais été aussi simple de commander un transport près de chez vous.',
    },
    {
      id: 2,
      badge: 'Application Mobile Professionnels',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
      title: 'Une application mobile dédiée aux professionnels de transport.',
      description: 'Recevez en temps réel des demandes de transport dans un périmètre défini par vos soins.',
    },
  ];

  const getDeviceStyle = (index: number) => {
    const diff = (index - carouselSlide + 3) % 3;
    const isMacBookCenter = carouselSlide === 1;
    const sideOffset = isMacBookCenter ? 'clamp(280px, 32vw, 440px)' : 'clamp(260px, 28vw, 380px)';

    if (diff === 0) {
      return {
        transform: index === 1 ? 'translate(-50%, calc(-50% - 20px)) scale(1)' : 'translate(-50%, -50%) scale(1)',
        zIndex: 30,
        opacity: 1,
        filter: 'blur(0px)',
        pointerEvents: 'auto' as const,
        cursor: 'default',
        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      };
    } else if (diff === 1) {
      return {
        transform: `translate(calc(-50% + ${sideOffset}), -50%) scale(0.80)`,
        zIndex: 10,
        opacity: 0.45,
        filter: 'blur(1.5px)',
        pointerEvents: 'auto' as const,
        cursor: 'pointer',
        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      };
    } else {
      return {
        transform: `translate(calc(-50% - ${sideOffset}), -50%) scale(0.80)`,
        zIndex: 10,
        opacity: 0.45,
        filter: 'blur(1.5px)',
        pointerEvents: 'auto' as const,
        cursor: 'pointer',
        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      };
    }
  };

  const isSideDeviceHiddenOnMobile = (index: number) => {
    const diff = (index - carouselSlide + 3) % 3;
    return diff !== 0 ? 'hidden sm:block' : 'block';
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    // Progressive scroll reveal observer
    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px',
    });

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const fleetDetails = {
    vsl: {
      title: 'VSL (Véhicule Sanitaire Léger)',
      subtitle: 'Pour patients autonomes pouvant voyager assis sans surveillance constante.',
      badge: 'Prescription VSL requise',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200/70',
      features: [
        'Climatisation régulée & confort d’assise ergonomique',
        'Aide à l’installation et accompagnement jusqu’en salle d’attente',
        'Désinfection virucide stricte entre chaque patient',
        'Tiers-payant direct Sécurité Sociale'
      ],
      idealFor: 'Consultations spécialisées, examens d’imagerie, bilans de santé'
    },
    taxi: {
      title: 'Taxi Conventionné CPAM',
      subtitle: 'Transport assis professionnalisé agréé par la Caisse Générale de Sécurité Sociale.',
      badge: 'Agrément Préfectoral & CPAM',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200/70',
      features: [
        'Chauffeur certifié et conventionné Sécurité Sociale',
        'Prise en charge au domicile et dépose au service de soins',
        'Ponctualité garantie pour consultations et examens',
        'Zéro avance de frais sur présentation du bon Cerfa'
      ],
      idealFor: 'Séances de kinésithérapie, dialyses légères, consultations régulières'
    },
    ambulance: {
      title: 'Ambulance Médicalisée (ASSU)',
      subtitle: 'Pour transport allongé ou semi-assis nécessitant une surveillance paramédicale continue.',
      badge: 'Ambulancier Diplômé d’État (DEA)',
      badgeColor: 'bg-red-50 text-red-800 border-red-200/70',
      features: [
        'Brancard ergonomique Ferno & équipement d’oxygénothérapie',
        'Surveillance continue par un équipage de 2 ambulanciers dont 1 DEA',
        'Brancardage complet au domicile (étages, ascenseur, lit)',
        'Liaison radio directe avec la régulation SAMU / 15 si urgence'
      ],
      idealFor: 'Sorties d’hospitalisation, transferts inter-hôpitaux, chimiothérapie lourde'
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-slate-900 font-sans selection:bg-teal-600 selection:text-white flex flex-col relative overflow-x-hidden">
      <SEOHead
        title="Clinigo — Démo Haute Performance Visuelle | Transport Médicalisé Conventionné"
        description="Nouveau standard visuel Clinigo : réservation d'Ambulances, VSL et Taxis conventionnés CPAM avec architecture Double-Bezel et prise en charge 100% ALD."
      />

      {/* =========================================================================
          TOP DEMO CONTROL BANNER
          ========================================================================= */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-950 via-teal-950 to-slate-950 text-white border-b border-teal-500/25 px-4 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 font-medium">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
            <span className="font-bold text-teal-300 uppercase tracking-wider text-[11px]">Mode Démo / Refonte Visuelle :</span>
            <span className="hidden sm:inline text-slate-300">Présentation du nouveau design system Clinigo</span>
          </div>

          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors text-[11px] font-semibold border border-white/15"
            >
              ← Revenir au site actuel
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DYNAMIC ISLAND FLOATING NAVIGATION
          ========================================================================= */}
      <div className="sticky top-11 z-40 px-4 sm:px-6 lg:px-8 pt-3 pb-2 pointer-events-none">
        <nav 
          aria-label="Navigation principale" 
          className="max-w-6xl mx-auto h-16 sm:h-[68px] rounded-full bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-4 sm:px-6 flex items-center justify-between pointer-events-auto transition-all duration-300"
        >
          {/* Brand Logo & Tag */}
          <Link to="/demo" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-800 to-sky-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-teal-900/20 group-hover:scale-105 transition-transform">
              C
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
                  clinigo<span className="text-teal-600">.fr</span>
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-600 tracking-wide">Réseau Médical Conventionné</span>
            </div>
          </Link>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-bold text-slate-600">
            <Link 
              to="/suivi" 
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Mes Demandes
            </Link>
            <Link 
              to="/etablissements" 
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Portail Établissements
            </Link>
            <Link 
              to="/transporteurs" 
              className="px-3 py-1.5 rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Espace Transporteurs
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">

            {isAuthenticated ? (
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Déconnexion
              </button>
            ) : (
              <Link
                to="/connexion"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-800 to-sky-900 hover:from-teal-700 hover:to-sky-800 text-white text-xs font-bold shadow-md shadow-teal-950/10 active:scale-95 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Connexion</span>
              </Link>
            )}
          </div>

        </nav>
      </div>

      <main className="flex-grow pt-8 pb-20">
        
        {/* =========================================================================
            1. HERO SECTION : L'Alliance du Raffinement & de la Sérénité Médicale
            ========================================================================= */}
        <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pb-24 overflow-hidden">
          
          {/* Subtle Ambient Meshes */}
          <div 
            aria-hidden="true" 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] sm:w-[1300px] h-[600px] bg-gradient-to-b from-teal-100/45 via-sky-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" 
          />

          <div className="max-w-7xl mx-auto">
            
            {/* Header Content : Titre & sous-titre */}
            <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10 scroll-reveal">
              {/* H1 Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.14] mb-4">
                <span className="inline-block text-slate-900 animate-hero-title">
                  Votre transport médicalisé,{' '}
                </span>
                <span className="relative inline-block mt-1 sm:mt-0">
                  {/* Glowing Ambient Aura behind the animated gradient */}
                  <span 
                    aria-hidden="true" 
                    className="absolute -inset-x-6 -inset-y-3 bg-gradient-to-r from-teal-400/20 via-cyan-400/25 to-sky-400/20 rounded-full blur-2xl -z-10 animate-hero-aura pointer-events-none" 
                  />
                  <span className="animate-title-gradient font-black">
                    réservé en toute sérénité.
                  </span>
                </span>
              </h1>

              {/* Sous-titre demandé */}
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-medium leading-relaxed max-w-3xl mx-auto">
                Service conçu pour les patients, proches aidants et équipes soignantes.
              </p>
            </div>

            {/* =========================================================================
                SANTEMOBILE-STYLE 3D DEVICE SHOWCASE : 3 Objets en perspective 3D
                1. App Mobile Patient (iPhone - logo clinigo.fr Patient)
                2. Commande Web (MacBook Pro - capture commande)
                3. App Mobile Ambulance PRO (iPhone Cockpit Sombre - logo clinigo.fr Ambulance)
                ========================================================================= */}
            <div className="max-w-6xl mx-auto scroll-reveal delay-100 mb-4 sm:mb-6">
              
              {/* Dynamic Slide Title & Description with Entrance Animation */}
              <div 
                key={carouselSlide} 
                className="text-center max-w-3xl mx-auto mb-3 sm:mb-4 px-4 animate-slide-text"
              >
                <div className={`inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold mb-2 border shadow-2xs ${slidesContent[carouselSlide].badgeColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span>{slidesContent[carouselSlide].badge}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                  {slidesContent[carouselSlide].title}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                  {slidesContent[carouselSlide].description}
                </p>
              </div>

              {/* 3D Depth Stage with balanced spacing */}
              <div 
                className="relative w-full overflow-hidden flex items-center justify-center min-h-[530px] sm:min-h-[570px] md:min-h-[600px] select-none"
                onMouseEnter={() => setCarouselAutoPlay(false)}
                onMouseLeave={() => setCarouselAutoPlay(true)}
              >
                {/* Ground Ellipse Radial Shadow (identique santemobile) */}
                <div 
                  aria-hidden="true" 
                  className="absolute bottom-3 left-1/2 h-8 w-[420px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(15,23,42,0.18),transparent_70%)] blur-md pointer-events-none -z-0" 
                />

                {/* =========================================================================
                    DEVICE 0 : APPLICATION MOBILE PATIENT (iPhone Titanium)
                    ========================================================================= */}
                <div
                  style={getDeviceStyle(0)}
                  onClick={() => {
                    if ((0 - carouselSlide + 3) % 3 !== 0) handleSelectSlide(0);
                  }}
                  className={`absolute top-1/2 left-1/2 will-change-transform ${isSideDeviceHiddenOnMobile(0)}`}
                >
                  <div className="relative w-[250px] sm:w-[275px] md:w-[290px] h-[520px] sm:h-[560px] md:h-[590px] bg-gradient-to-b from-[#18181b] via-[#27272a] to-[#18181b] rounded-[48px] p-[7px] sm:p-[8px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.38)] border border-slate-700/50">
                    {/* Metallic bezel ring reflection */}
                    <div className="absolute inset-0 rounded-[48px] bg-gradient-to-r from-[#3a3a3a] via-[#4a4a4a] to-[#3a3a3a] opacity-30 pointer-events-none" />
                    {/* Hardware side buttons */}
                    <div className="absolute -left-[3px] top-[90px] w-[3px] h-[24px] bg-[#3a3a3a] rounded-l-sm" />
                    <div className="absolute -left-[3px] top-[125px] w-[3px] h-[36px] bg-[#3a3a3a] rounded-l-sm" />
                    <div className="absolute -left-[3px] top-[170px] w-[3px] h-[36px] bg-[#3a3a3a] rounded-l-sm" />
                    <div className="absolute -right-[3px] top-[135px] w-[3px] h-[55px] bg-[#3a3a3a] rounded-r-sm" />

                    {/* Screen Frame */}
                    <div className="relative w-full h-full bg-[#0e1726] rounded-[42px] overflow-hidden flex flex-col text-white select-none">
                      {/* Dynamic Island */}
                      <div className="w-[88px] h-[24px] bg-black rounded-full mx-auto mt-2 flex items-center justify-between px-2.5 z-30 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#111] ring-1 ring-white/10" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>

                      {/* Screen Content */}
                      <div className="flex-1 flex flex-col p-3.5 pt-2 text-left justify-between overflow-hidden">
                        {/* App Top Bar */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <img 
                              src="/assets/logo-clinigo-patient.jpg" 
                              alt="Clinigo Patient" 
                              className="w-8 h-8 rounded-xl object-cover shadow-xs border border-white/20" 
                            />
                            <div>
                              <p className="text-[11px] font-black leading-none text-white">clinigo.fr</p>
                              <p className="text-[9px] font-bold text-teal-400">Espace Patient</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full">
                            Sarah M.
                          </span>
                        </div>

                        {/* Live Approach Status Card */}
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-950/80 to-slate-900 border border-teal-500/30 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-extrabold uppercase text-teal-400 tracking-wider">Véhicule en approche</span>
                            <span className="font-black bg-teal-500/30 text-teal-300 px-2 py-0.5 rounded-full text-[9px]">7 min</span>
                          </div>
                          <p className="text-xs font-black text-white">Taxi Conventionné #972</p>
                          <p className="text-[10px] text-slate-300">Chauffeur : Marc D. • Toyota RAV4</p>
                        </div>

                        {/* Route Card */}
                        <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-[10px] space-y-1 text-slate-200">
                          <div className="flex items-center justify-between text-slate-400 text-[9px]">
                            <span>Itinéraire Médical</span>
                            <span>2.8 km</span>
                          </div>
                          <p className="font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                            <span className="truncate">14 rue Lamartine, FdF</span>
                          </p>
                          <p className="font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            <span className="truncate">CHU Zobda-Quitman</span>
                          </p>
                        </div>

                        {/* CPAM Badge */}
                        <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between text-[9px] text-emerald-300 font-bold">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Prise en charge CPAM 100%</span>
                          </span>
                          <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-200">0 € à avancer</span>
                        </div>

                        {/* Call Driver Button */}
                        <button 
                          type="button"
                          className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-teal-900/40 transition-all cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Appeler le chauffeur</span>
                        </button>

                        {/* Bottom Home Indicator */}
                        <div className="w-20 h-1 bg-white/40 rounded-full mx-auto mt-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* =========================================================================
                    DEVICE 1 : COMMANDE WEB SUR LE SITE (MacBook Pro Mockup)
                    ========================================================================= */}
                <div
                  style={getDeviceStyle(1)}
                  onClick={() => {
                    if ((1 - carouselSlide + 3) % 3 !== 0) {
                      handleSelectSlide(1);
                    } else {
                      navigate('/reserver');
                    }
                  }}
                  className={`absolute top-1/2 left-1/2 will-change-transform ${isSideDeviceHiddenOnMobile(1)}`}
                >
                  {/* Complete MacBook Pro Assembly */}
                  <div className="relative w-[320px] sm:w-[490px] md:w-[620px] lg:w-[690px] flex flex-col items-center select-none group cursor-pointer">
                    
                    {/* MacBook Pro Display Lid */}
                    <div className="relative w-full aspect-[16/10] bg-[#111216] rounded-t-[18px] sm:rounded-t-[22px] p-[6px] sm:p-[9px] pb-0 border border-slate-700/80 shadow-[0_28px_65px_-12px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col">
                      
                      {/* Aluminum Bezel Reflection */}
                      <div className="absolute inset-0 rounded-t-[18px] sm:rounded-t-[22px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-35" />

                      {/* MacBook Pro Top Camera Notch */}
                      <div className="absolute top-[6px] sm:top-[9px] left-1/2 -translate-x-1/2 w-14 sm:w-20 h-2.5 sm:h-3.5 bg-black rounded-b-md z-30 flex items-center justify-center gap-1 shadow-xs pointer-events-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1c1c1f] ring-1 ring-white/15" />
                        <div className="w-1 h-1 rounded-full bg-emerald-500/80 animate-pulse" />
                      </div>

                      {/* Screen Glass Area */}
                      <div className="relative w-full h-full bg-[#f8fafc] rounded-t-[12px] sm:rounded-t-[14px] overflow-hidden flex flex-col border border-slate-300/40">
                        
                        {/* Safari Browser Chrome */}
                        <div className="h-7 sm:h-8 bg-gradient-to-b from-slate-100 to-slate-200/85 flex items-center px-2.5 sm:px-3 border-b border-slate-200/90 gap-2 shrink-0">
                          {/* Traffic Lights */}
                          <div className="flex gap-1.5 shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] shadow-inner" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e] shadow-inner" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840] shadow-inner" />
                          </div>

                          {/* Navigation Arrows */}
                          <div className="hidden sm:flex items-center gap-1 text-slate-400 ml-1">
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                          </div>

                          {/* Safari URL Bar */}
                          <div className="flex-1 mx-1 sm:mx-2 max-w-sm mx-auto">
                            <div className="h-5 sm:h-5.5 bg-white/95 rounded-md px-2 text-[9px] sm:text-[11px] text-slate-600 flex items-center gap-1.5 border border-slate-300/70 shadow-inner">
                              <Lock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span className="text-slate-400">https://</span>
                              <span className="text-slate-800 font-bold truncate">clinigo.fr/reserver</span>
                            </div>
                          </div>

                          {/* Platform Badge */}
                          <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                            Site Officiel
                          </span>
                        </div>

                        {/* Screen Viewport with capture-commande-site.png */}
                        <div className="flex-1 overflow-hidden bg-slate-100 relative">
                          <img 
                            src="/assets/capture-commande-site.png" 
                            alt="Capture de la phase de commande sur le site Clinigo" 
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                          />

                          {/* Hover Action Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3 sm:p-5">
                            <span className="px-4 py-2 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-black shadow-xl flex items-center gap-2 transform group-hover:translate-y-0 translate-y-2 transition-transform">
                              <span>Commander en direct sur le site</span>
                              <ArrowRight className="w-4 h-4 text-teal-600" />
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* MacBook Pro Hinge */}
                    <div className="w-full h-1 bg-[#121316] border-t border-slate-700/60" />

                    {/* MacBook Pro Unibody Base / Keyboard Deck Lip */}
                    <div className="relative w-[106%] h-3.5 sm:h-4.5 bg-gradient-to-b from-[#343842] via-[#22252c] to-[#14161b] rounded-b-[14px] sm:rounded-b-[18px] border-t border-slate-400/50 shadow-[0_20px_35px_-5px_rgba(0,0,0,0.6)] flex items-start justify-center">
                      {/* Central Thumb Notch for opening screen */}
                      <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-[#0a0b0d] rounded-b-md shadow-inner border-b border-white/10" />
                    </div>

                    {/* MacBook Pro Desk Shadow */}
                    <div className="w-[94%] h-2 bg-black/40 blur-md rounded-full mt-0.5" />

                  </div>
                </div>

                {/* =========================================================================
                    DEVICE 2 : APPLICATION MOBILE AMBULANCE PRO (iPhone Cockpit Sombre)
                    ========================================================================= */}
                <div
                  style={getDeviceStyle(2)}
                  onClick={() => {
                    if ((2 - carouselSlide + 3) % 3 !== 0) handleSelectSlide(2);
                  }}
                  className={`absolute top-1/2 left-1/2 will-change-transform ${isSideDeviceHiddenOnMobile(2)}`}
                >
                  <div className="relative w-[250px] sm:w-[275px] md:w-[290px] h-[520px] sm:h-[560px] md:h-[590px] bg-gradient-to-b from-[#18181b] via-[#27272a] to-[#18181b] rounded-[48px] p-[7px] sm:p-[8px] shadow-[0_25px_60px_-15px_rgba(2,132,199,0.38)] border border-cyan-800/60">
                    {/* Metallic bezel ring reflection */}
                    <div className="absolute inset-0 rounded-[48px] bg-gradient-to-r from-[#3a3a3a] via-[#4a4a4a] to-[#3a3a3a] opacity-30 pointer-events-none" />
                    {/* Hardware side buttons */}
                    <div className="absolute -left-[3px] top-[90px] w-[3px] h-[24px] bg-[#3a3a3a] rounded-l-sm" />
                    <div className="absolute -left-[3px] top-[125px] w-[3px] h-[36px] bg-[#3a3a3a] rounded-l-sm" />
                    <div className="absolute -left-[3px] top-[170px] w-[3px] h-[36px] bg-[#3a3a3a] rounded-l-sm" />
                    <div className="absolute -right-[3px] top-[135px] w-[3px] h-[55px] bg-[#3a3a3a] rounded-r-sm" />

                    {/* Screen Frame Dark Cockpit */}
                    <div className="relative w-full h-full bg-[#0a0f1d] rounded-[42px] overflow-hidden flex flex-col text-white select-none">
                      {/* Dynamic Island with Emergency Beacon */}
                      <div className="w-[100px] h-[24px] bg-black rounded-full mx-auto mt-2 flex items-center justify-between px-2 text-[8px] text-cyan-400 font-bold z-30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span className="text-cyan-200">MISSION ACTIVE</span>
                        <span className="text-white">🚨 #402</span>
                      </div>

                      {/* Screen Content */}
                      <div className="flex-1 flex flex-col p-3.5 pt-2 text-left justify-between overflow-hidden">
                        {/* App Top Bar */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <img 
                              src="/assets/logo-clinigo-ambulance.jpg" 
                              alt="Clinigo Ambulance" 
                              className="w-8 h-8 rounded-xl object-cover shadow-xs border border-white/20" 
                            />
                            <div>
                              <p className="text-[11px] font-black leading-none text-white">clinigo.fr</p>
                              <p className="text-[9px] font-bold text-cyan-400">Ambulance PRO</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-600/50 px-2 py-0.5 rounded-full">
                            ● En Service
                          </span>
                        </div>

                        {/* Mission Card PRO */}
                        <div className="p-3 rounded-2xl bg-slate-800/90 border border-cyan-500/30 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-black uppercase text-cyan-400 tracking-wider">Mission Régulée #AMB-972</span>
                            <span className="font-extrabold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded text-[9px]">Ambulance</span>
                          </div>
                          <p className="text-xs font-black text-white">M. Henri B. (82 ans) • ALD 100%</p>
                          <div className="text-[10px] text-slate-300 space-y-0.5 pt-1 border-t border-slate-700/60">
                            <p className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>Clinique Sainte-Marie</span>
                            </p>
                            <p className="flex items-center gap-1.5 truncate">
                              <Building2 className="w-3 h-3 text-sky-400 shrink-0" />
                              <span>CHU Zobda (Néphrologie)</span>
                            </p>
                          </div>
                        </div>

                        {/* Clinical Checklist */}
                        <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[9px] space-y-1">
                          <p className="font-bold uppercase tracking-wider text-slate-400 text-[8px]">Exigences Médicales</p>
                          <div className="grid grid-cols-2 gap-1 font-semibold text-slate-200">
                            <span>✓ Brancardage</span>
                            <span>✓ Oxygène prêt</span>
                            <span>✓ Équipage DEA</span>
                            <span>✓ Bon Cerfa validé</span>
                          </div>
                        </div>

                        {/* GPS Button */}
                        <button 
                          type="button"
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:brightness-110 text-white text-[11px] font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/40 transition-all cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Lancer le guidage Waze / Maps</span>
                        </button>

                        {/* Bottom Home Indicator */}
                        <div className="w-20 h-1 bg-white/40 rounded-full mx-auto mt-1" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Subtle Slide Indicators */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {slidesContent.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSlide(idx)}
                    className={`transition-all duration-300 rounded-full h-2 cursor-pointer ${
                      carouselSlide === idx 
                        ? 'w-8 bg-teal-600 shadow-xs' 
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Afficher ${s.badge}`}
                  />
                ))}
              </div>

              {/* Call to Actions (style SanteMobile) */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-6">
                <Link
                  to="/reserver"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-black bg-gradient-to-r from-teal-700 via-teal-600 to-sky-700 hover:from-teal-800 hover:to-sky-800 text-white shadow-xl shadow-teal-900/20 text-base hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                >
                  <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                  <span>Réserver un transport en ligne</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/transporteurs"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-extrabold border border-slate-300/80 bg-white hover:bg-slate-50 text-slate-800 shadow-xs text-base hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <span>Espace Ambulanciers & Taxis</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            2. ASYMMETRICAL BENTO GRID : L'Excellence Clinigo
            ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white border-y border-slate-200/60">
          <div className="max-w-7xl mx-auto">
            
            {/* Section Header with Large Title above the phrase as requested */}
            <div className="max-w-4xl mb-14 scroll-reveal">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold tracking-widest uppercase mb-5 border border-teal-200/60 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Performance & Normes Sanitaires</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] mb-4">
                Pourquoi choisir <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-700 via-teal-600 to-sky-700">clinigo.fr</span> ?
              </h2>
              
              <p className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-snug">
                Une coordination haute fidélité pensée pour les patients et soignants.
              </p>
              
              <p className="text-slate-600 text-base sm:text-lg mt-3 font-normal max-w-3xl leading-relaxed">
                Chaque étape de votre parcours de soins est sécurisée par notre protocole de régulation sanitaire et la garantie de tiers-payant intégral.
              </p>
            </div>

            {/* The Bento Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Card 1 : Live Dispatch & Radar (Col-span 7) */}
              <div className="md:col-span-7 p-2 rounded-[2.2rem] bg-gradient-to-br from-slate-100 to-slate-200/60 border border-slate-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/5 group scroll-reveal delay-100">
                <div className="h-full rounded-[calc(2.2rem-0.5rem)] bg-white p-7 sm:p-9 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <span className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/70 flex items-center justify-center text-teal-700 shadow-xs">
                        <Navigation className="w-6 h-6" />
                      </span>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Réseau Opérationnel en Direct</span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      Régulation & Affectation Prioritaire
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      Notre algorithme de répartition attribue instantanément votre course au transporteur conventionné 
                      le plus proche et le plus adapté à votre pathologie (fauteuil, civière ou assise ergonomique).
                    </p>
                  </div>

                  {/* Real-time mini status box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold block">Transporteurs</span>
                      <span className="text-xl font-extrabold text-slate-900">85+ Véhicules</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold block">Délai moyen</span>
                      <span className="text-xl font-extrabold text-teal-700">&lt; 4 minutes</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold block">Fiabilité ARS</span>
                      <span className="text-xl font-extrabold text-sky-700">99.8%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 : Tiers-Payant & Zéro Avance (Col-span 5) */}
              <div className="md:col-span-5 p-2 rounded-[2.2rem] bg-gradient-to-br from-teal-50 to-emerald-100/50 border border-teal-200/60 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-teal-900/5 group scroll-reveal delay-200">
                <div className="h-full rounded-[calc(2.2rem-0.5rem)] bg-gradient-to-b from-teal-900 to-slate-950 text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-300 mb-6 backdrop-blur-md">
                      <ShieldCheck className="w-6 h-6" />
                    </div>

                    <div className="inline-block px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold mb-3 uppercase tracking-wider">
                      Prise en charge Sécurité Sociale
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3">
                      0 € à avancer avec votre ALD
                    </h3>
                    <p className="text-teal-100/80 text-sm leading-relaxed mb-6">
                      La télétransmission directe avec la CPAM et votre mutuelle garantit une prise en charge totale 
                      sans sortir votre carte bancaire. Munissez-vous simplement de votre bon Cerfa 11574.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-teal-300 pt-4 border-t border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Conventionné CPAM, CGSS, MGEN & Mutuelles</span>
                  </div>
                </div>
              </div>

              {/* Card 3 : VSL & Taxi (Col-span 4) */}
              <div className="md:col-span-4 p-2 rounded-[2.2rem] bg-slate-100/80 border border-slate-200/70 shadow-sm scroll-reveal delay-100">
                <div className="rounded-[calc(2.2rem-0.5rem)] bg-white p-6 sm:p-8 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-700 mb-5">
                      <Car className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">VSL & Taxi Agréé</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                      Pour les patients pouvant voyager assis. Climatisation régulée, confort lombaire et désinfection stricte après chaque transport.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium pt-3 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Assistance à la marche</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Accompagnement en salle d'attente</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 4 : Ambulances ASSU (Col-span 4) */}
              <div className="md:col-span-4 p-2 rounded-[2.2rem] bg-slate-100/80 border border-slate-200/70 shadow-sm scroll-reveal delay-200">
                <div className="rounded-[calc(2.2rem-0.5rem)] bg-white p-6 sm:p-8 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200/60 flex items-center justify-center text-red-600 mb-5">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Ambulance Médicalisée</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                      Position demi-assise ou allongée sous surveillance continue par un ambulancier diplômé d'État (DEA) avec équipement de secours.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium pt-3 border-t border-slate-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Brancard ergonomique & oxygène</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Brancardage complet au domicile</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Card 5 : Assistance & Régulation 24h/24 (Col-span 4) */}
              <div className="md:col-span-4 p-2 rounded-[2.2rem] bg-slate-100/80 border border-slate-200/70 shadow-sm scroll-reveal delay-300">
                <div className="rounded-[calc(2.2rem-0.5rem)] bg-white p-6 sm:p-8 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 mb-5">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Régulation & Permanence 24h/24</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                      Une permanence de régulateurs sanitaires réactive pour coordonner vos trajets et ajuster vos horaires de retour en lien avec les hôpitaux.
                    </p>
                  </div>
                  <a
                    href="tel:0596720097"
                    className="w-full py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200/70 transition-colors flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Permanence : 05 96 72 00 97</span>
                  </a>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            3. INTERACTIVE FLOTTE SHOWCASE : Découverte Détaillée des Véhicules
            ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 max-w-7xl mx-auto">
          <div className="mb-10 sm:mb-12 scroll-reveal">
            <span className="inline-block px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold tracking-widest uppercase border border-teal-200/60 mb-3">
              Flotte Conventionnée
            </span>
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight sm:whitespace-nowrap">
                Quel véhicule correspond à votre bon de transport ?
              </h2>

              {/* Switcher Tabs */}
              <div className="flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 shrink-0 self-start xl:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveFleetTab('vsl')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFleetTab === 'vsl'
                      ? 'bg-white text-teal-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  VSL Assis
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFleetTab('taxi')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFleetTab === 'taxi'
                      ? 'bg-white text-teal-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Taxi CPAM
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFleetTab('ambulance')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFleetTab === 'ambulance'
                      ? 'bg-white text-teal-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ambulance ASSU
                </button>
              </div>
            </div>
          </div>

          {/* Active Fleet Showcase Card */}
          <div className="p-3 rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-slate-200/50 border border-slate-200/80 shadow-sm scroll-reveal delay-150">
            <div className="rounded-[calc(2.5rem-0.625rem)] bg-white p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-7 space-y-6">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${fleetDetails[activeFleetTab].badgeColor}`}>
                  {fleetDetails[activeFleetTab].badge}
                </span>

                <h3 className="text-3xl font-extrabold text-slate-900">
                  {fleetDetails[activeFleetTab].title}
                </h3>

                <p className="text-slate-600 text-base leading-relaxed">
                  {fleetDetails[activeFleetTab].subtitle}
                </p>

                <div className="space-y-3 pt-2">
                  {fleetDetails[activeFleetTab].features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                      <div className="w-5 h-5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
                  <strong className="text-slate-800">Indication médicale type :</strong> {fleetDetails[activeFleetTab].idealFor}.
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-teal-50/40 border border-slate-200/60 text-center">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-md border border-slate-200/80 flex items-center justify-center text-teal-700 mb-6">
                  {activeFleetTab === 'vsl' && <Car className="w-10 h-10" />}
                  {activeFleetTab === 'taxi' && <Navigation className="w-10 h-10" />}
                  {activeFleetTab === 'ambulance' && <Activity className="w-10 h-10 text-red-600" />}
                </div>

                <h4 className="text-lg font-bold text-slate-900 mb-1">
                  100% Conventionné CPAM
                </h4>
                <p className="text-xs text-slate-600 mb-6">
                  Prise en charge intégrale avec bon Cerfa n° 11574
                </p>

                <Link
                  to="/reserver"
                  state={{ transportType: activeFleetTab }}
                  className="px-6 py-3 rounded-full bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-900/15 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Réserver ce véhicule</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            4. WORKFLOW EN 3 ÉTAPES : Clarté & Sérénité
            ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 bg-white border-y border-slate-200/60">
          <div className="max-w-7xl mx-auto">
            
            <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal">
              <span className="px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 text-[11px] font-bold uppercase tracking-widest">
                Comment ça fonctionne ?
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
                Un transport médicalisé en 3 étapes simples
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-3">
                Créez votre compte en 30 secondes ou réservez directement pour transmettre votre prescription médicale.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Step 1 */}
              <div className="p-2.5 rounded-[2.2rem] bg-gradient-to-b from-slate-100 to-slate-200/50 border border-slate-200/70 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 scroll-reveal delay-100">
                <div className="h-full rounded-[calc(2.2rem-0.5rem)] bg-white p-7 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 font-extrabold text-lg flex items-center justify-center border border-teal-200/70 mb-6 shadow-xs">
                      01
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      Demande en 30 secondes
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      Renseignez vos adresses de départ et de consultation médicale, la date et le type de transport prescrit par votre médecin.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-teal-700">
                    <FileText className="w-4 h-4" />
                    <span>Prescription médicale (Cerfa) acceptée</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 rounded-[2.2rem] bg-gradient-to-b from-slate-100 to-slate-200/50 border border-slate-200/70 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 scroll-reveal delay-200">
                <div className="h-full rounded-[calc(2.2rem-0.5rem)] bg-white p-7 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-800 font-extrabold text-lg flex items-center justify-center border border-sky-200/70 mb-6 shadow-xs">
                      02
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      Attribution Certifiée
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      Le réseau Clinigo affecte un transporteur conventionné CPAM certifié. Vous recevez une confirmation par SMS avec l'heure exacte.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-sky-700">
                    <BadgeCheck className="w-4 h-4" />
                    <span>Chauffeurs formés & contrôlés</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 rounded-[2.2rem] bg-gradient-to-b from-slate-100 to-slate-200/50 border border-slate-200/70 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 scroll-reveal delay-300">
                <div className="h-full rounded-[calc(2.2rem-0.5rem)] bg-white p-7 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 font-extrabold text-lg flex items-center justify-center border border-emerald-200/70 mb-6 shadow-xs">
                      03
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      Prise en charge & Tiers-Payant
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      Le chauffeur vous prend en charge au pied de votre porte, vous conduit à votre RDV médical et assure votre retour serein.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Zéro avance de frais en ALD 100%</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            5. ENGAGEMENTS ET GARANTIES RÉGLEMENTAIRES
            ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 bg-[#F8FAFD]">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 scroll-reveal">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-teal-800">
                  Garanties Officielles
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                  Nos engagements pour votre transport sanitaire
                </h2>
              </div>
              
              <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-extrabold text-slate-900 block">Agrément ARS &amp; CPAM</span>
                  <span className="text-xs text-slate-600">Régulation sanitaire officielle</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Engagement 1 */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/70 shadow-xs scroll-reveal delay-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                    <span className="material-symbols-outlined text-lg">credit_card</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Tiers-Payant Intégral</h4>
                    <p className="text-xs text-slate-600">Prise en charge Sécurité Sociale</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Aucune avance de frais pour les patients en ALD (100%), accident du travail ou hospitalisation sur présentation de la prescription médicale de transport (Cerfa).
                </p>
              </div>

              {/* Engagement 2 */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/70 shadow-xs scroll-reveal delay-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-sm">
                    <span className="material-symbols-outlined text-lg">verified</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Transporteurs Agréés ARS</h4>
                    <p className="text-xs text-slate-600">Ambulances, VSL &amp; Taxis</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Tous les professionnels du réseau disposent d'un agrément préfectoral délivré par l'ARS et sont conventionnés par l'Assurance Maladie.
                </p>
              </div>

              {/* Engagement 3 */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/70 shadow-xs scroll-reveal delay-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    <span className="material-symbols-outlined text-lg">lock</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Secret Médical &amp; RGPD</h4>
                    <p className="text-xs text-slate-600">Données de santé protégées</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Vos informations personnelles et médicales sont traitées dans le respect strict du secret médical et des réglementations applicables aux données de santé.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            6. FINAL CALL TO ACTION : Double-Bezel Grand Format
            ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 max-w-7xl mx-auto scroll-reveal delay-100">
          <div className="p-3 sm:p-4 rounded-[3rem] bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 border border-teal-500/20 shadow-2xl relative overflow-hidden">
            <div className="rounded-[calc(3rem-0.75rem)] p-8 sm:p-12 md:p-16 text-center text-white relative z-10 flex flex-col items-center">
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-teal-300 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5" />
                Service Disponible Immédiatement
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mb-6">
                Préparez votre prochain transport médical en quelques clics.
              </h2>
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
                Rejoignez les milliers de patients et professionnels de santé qui font confiance à Clinigo chaque jour.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link
                  to="/connexion"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-teal-400 to-cyan-300 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-teal-400/20 hover:shadow-teal-400/30 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                >
                  <span>Créer mon compte patient</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/reserver"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base backdrop-blur-md transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-teal-400" />
                  <span>Réserver un transport</span>
                </Link>
              </div>

            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};
