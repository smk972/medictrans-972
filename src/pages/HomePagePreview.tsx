import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { GoogleMapView } from '../components/GoogleMapView';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../contexts/AuthContext';

export const HomePagePreview: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Booking form state
  const [transportType, setTransportType] = useState<'taxi' | 'vsl' | 'ambulance'>('taxi');
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationFacility, setDestinationFacility] = useState('CHU Fort-de-France (P. Zobda-Quitman)');
  const [transportDate, setTransportDate] = useState('');
  const [transportTime, setTransportTime] = useState('09:30');
  const [tripType, setTripType] = useState<'aller-simple' | 'aller-retour'>('aller-retour');
  const [savedFavorites, setSavedFavorites] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'conventionne' | 'urgence'>('all');

  useEffect(() => {
    window.scrollTo(0, 0);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTransportDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const toggleFavorite = (mode: string) => {
    setSavedFavorites(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const draftData = {
      transportType,
      pickupAddress: pickupAddress || 'Fort-de-France, Martinique',
      destinationFacility,
      transportDate,
      transportTime,
      appointmentTime: transportTime,
      tripType,
    };
    try {
      localStorage.setItem('medictrans_draft_booking', JSON.stringify(draftData));
    } catch {
      // ignore
    }

    if (!isAuthenticated || !user) {
      navigate('/connexion', {
        state: {
          from: { pathname: '/reserver' },
          requiredRole: 'PATIENT',
          isBookingFlow: true,
          mode: 'REGISTER',
          message: 'Pour continuer votre réservation de transport sanitaire et bénéficier du tiers-payant CPAM, veuillez créer votre compte ou vous connecter.'
        }
      });
      return;
    }

    navigate('/reserver', { state: draftData });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans antialiased selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <Header />
      <SEOHead
        title="Clinigo | Prévisualisation Nouveau Graphisme Bento — Inspiré de Nametastic"
        description="Prévisualisation du design moderne avec cartes bento, ombres douces et animations au survol."
        canonicalPath="/preview"
        ogImage="/assets/clinigo-logo.png"
      />

      {/* Top Notification Banner for Preview Mode */}
      <div className="w-full bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white text-xs font-semibold py-2.5 px-4 pt-24 text-center border-b border-blue-800 flex items-center justify-center gap-3 shadow-inner">
        <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-extrabold uppercase text-[10px] tracking-wider animate-pulse">
          Prévisualisation Active
        </span>
        <span>
          Nouveau style graphique inspiré de Nametastic : blocs modulaires bento, ombres soyeuses et micro-animations au survol.
        </span>
        <Link
          to="/"
          className="underline hover:text-blue-200 transition-colors ml-2 text-[11px] font-bold"
        >
          Retour à la version actuelle
        </Link>
      </div>

      <main className="w-full py-8 sm:py-12 flex-1">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Heading Hierarchy */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-4 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-bold text-slate-700 tracking-wide">
                Réseau Sanitaire Conventionné · Martinique 972
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-4">
              Votre transport médicalisé en Martinique,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-teal-600 to-emerald-600">
                réservé en toute sérénité.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Plateforme d'intermédiation pour les patients, proches aidants et soignants. Tiers-payant 100% avec Prescription Médicale (PMT).
            </p>
          </div>

          {/* ========================================================================= */}
          {/* THE NAMETASTIC BENTO GRID: 3 COLUMNS (LEFT / CENTER / RIGHT)               */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ----------------------------------------------------------------------- */}
            {/* LEFT COLUMN: Paramètres, Concept & Disponibilité Territoriale (3 cols)  */}
            {/* ----------------------------------------------------------------------- */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Box 1: Configuration Trajet (Like "Name Concept" in Nametastic) */}
              <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-base">Type de Trajet</h3>
                  <span className="material-symbols-outlined text-slate-400 text-lg">tune</span>
                </div>
                
                {/* Pill Selectors */}
                <div className="flex flex-col gap-2">
                  <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setTripType('aller-simple')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        tripType === 'aller-simple'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Aller simple
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripType('aller-retour')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        tripType === 'aller-retour'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Aller-Retour
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Statut PMT Cerfa S3138</span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full font-bold text-[11px]">
                      Obligatoire 100%
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Communes & Disponibilités en direct (Like "Search in Progress" in Nametastic) */}
              <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 className="font-bold text-slate-900 text-base">Réseau Disponible</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Surveillance des disponibilités en temps réel sur les pôles de soins de Martinique.
                </p>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
                    <span className="font-semibold text-slate-800 font-sans">Fort-de-France (CHU)</span>
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      &lt; 10 min
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
                    <span className="font-semibold text-slate-800 font-sans">Le Lamentin</span>
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      &lt; 12 min
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
                    <span className="font-semibold text-slate-800 font-sans">Schoelcher (Ste-Marie)</span>
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      &lt; 10 min
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
                    <span className="font-semibold text-slate-800 font-sans">Sud (Marin, Rivière-Salée)</span>
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      &lt; 15 min
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
                    <span className="font-semibold text-slate-800 font-sans">Nord (Trinité, Carbet)</span>
                    <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      &lt; 20 min
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 3: Analyse & Sécurité (Like "Concept Analysis" in Nametastic) */}
              <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out">
                <h3 className="font-bold text-slate-900 text-base mb-2">Conformité Sanitaire</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                  Engagements certifiés pour la régulation médicale :
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-[11px] font-semibold">
                    #Agrément-ARS-972
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-semibold">
                    #Tiers-Payant-CPAM
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/70 text-[11px] font-semibold">
                    #Hébergeur-HDS
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold">
                    #34-Communes
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 text-[11px] font-semibold">
                    #Régulation-24/7
                  </span>
                </div>
              </div>

            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* CENTER COLUMN: Main Transport Cards & Interactive Booking (6 cols)     */}
            {/* ----------------------------------------------------------------------- */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Header bar above main cards */}
              <div className="bg-white rounded-[20px] px-6 py-4 border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-700">
                  <span className="font-extrabold text-slate-900 text-base">3 modes prescrits</span> disponibles
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('conventionne')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      activeFilter === 'conventionne'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Assis (Taxi/VSL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('urgence')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      activeFilter === 'urgence'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Allongé (Ambulance)
                  </button>
                </div>
              </div>

              {/* CARD 1: Taxi Conventionné (Styled like Nametastic Card) */}
              {(activeFilter === 'all' || activeFilter === 'conventionne') && (
                <div 
                  onClick={() => setTransportType('taxi')}
                  className={`group bg-white rounded-[28px] p-6 sm:p-7 border transition-all duration-300 ease-out cursor-pointer relative ${
                    transportType === 'taxi'
                      ? 'border-blue-600 shadow-[0_12px_36px_rgba(37,99,235,0.12)] ring-2 ring-blue-600/20'
                      : 'border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          Taxi Conventionné
                        </h2>
                        <span className="text-sm font-bold text-blue-600 font-mono">.cpam</span>
                      </div>
                      <div className="mt-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                          <span className="material-symbols-outlined text-sm">directions_car</span>
                          Patient autonome · Voyage assis
                        </span>
                      </div>
                    </div>

                    {/* Score badge like 78/100 */}
                    <div className="flex flex-col items-end">
                      <div className="text-xl sm:text-2xl font-black text-slate-900">
                        100<span className="text-xs text-slate-400 font-bold">/100</span>
                      </div>
                      <div className="w-12 h-1 bg-emerald-500 rounded-full mt-1"></div>
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Tiers-payant</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 font-normal my-4 leading-relaxed">
                    Patient pouvant se déplacer sans assistance physique. Trajets pour consultations spécialisées, radiothérapie, examens et bilans réguliers.
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Disponible 24/7
                      </span>
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                        Agrément CGSS 972
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite('taxi');
                        }}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                          savedFavorites.includes('taxi')
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Favori"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {savedFavorites.includes('taxi') ? 'favorite' : 'favorite_border'}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm ${
                          transportType === 'taxi'
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>{transportType === 'taxi' ? 'Sélectionné' : 'Choisir ce mode'}</span>
                        <span className="material-symbols-outlined text-base">
                          {transportType === 'taxi' ? 'check' : 'arrow_forward'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 2: VSL (Sanitaire Léger) */}
              {(activeFilter === 'all' || activeFilter === 'conventionne') && (
                <div 
                  onClick={() => setTransportType('vsl')}
                  className={`group bg-white rounded-[28px] p-6 sm:p-7 border transition-all duration-300 ease-out cursor-pointer relative ${
                    transportType === 'vsl'
                      ? 'border-blue-600 shadow-[0_12px_36px_rgba(37,99,235,0.12)] ring-2 ring-blue-600/20'
                      : 'border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          VSL (Sanitaire Léger)
                        </h2>
                        <span className="text-sm font-bold text-teal-600 font-mono">.vsl</span>
                      </div>
                      <div className="mt-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/80">
                          <span className="material-symbols-outlined text-sm">airport_shuttle</span>
                          Aide au transfert · Véhicule désinfecté
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="text-xl sm:text-2xl font-black text-slate-900">
                        98<span className="text-xs text-slate-400 font-bold">/100</span>
                      </div>
                      <div className="w-12 h-1 bg-teal-500 rounded-full mt-1"></div>
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Indice ARS</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 font-normal my-4 leading-relaxed">
                    Patient voyageant assis mais nécessitant une aide soignante à la marche ou un accompagnement dans le véhicule sanitaire.
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Disponible 24/7
                      </span>
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                        Accompagnateur formé
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite('vsl');
                        }}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                          savedFavorites.includes('vsl')
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Favori"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {savedFavorites.includes('vsl') ? 'favorite' : 'favorite_border'}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm ${
                          transportType === 'vsl'
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>{transportType === 'vsl' ? 'Sélectionné' : 'Choisir ce mode'}</span>
                        <span className="material-symbols-outlined text-base">
                          {transportType === 'vsl' ? 'check' : 'arrow_forward'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 3: Ambulance ASSU */}
              {(activeFilter === 'all' || activeFilter === 'urgence') && (
                <div 
                  onClick={() => setTransportType('ambulance')}
                  className={`group bg-white rounded-[28px] p-6 sm:p-7 border transition-all duration-300 ease-out cursor-pointer relative ${
                    transportType === 'ambulance'
                      ? 'border-blue-600 shadow-[0_12px_36px_rgba(37,99,235,0.12)] ring-2 ring-blue-600/20'
                      : 'border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          Ambulance
                        </h2>
                        <span className="text-sm font-bold text-rose-600 font-mono">.urgence</span>
                      </div>
                      <div className="mt-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                          <span className="material-symbols-outlined text-sm">emergency</span>
                          Position allongée · Surveillance continue
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="text-xl sm:text-2xl font-black text-slate-900">
                        100<span className="text-xs text-slate-400 font-bold">/100</span>
                      </div>
                      <div className="w-12 h-1 bg-rose-500 rounded-full mt-1"></div>
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Matériel médical</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 font-normal my-4 leading-relaxed">
                    Patient nécessitant un brancardage ou portage, une oxygénothérapie continue et la surveillance par deux ambulanciers diplômés (DEA/CCA).
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Équipage Diplômé
                      </span>
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                        Brancard &amp; Oxygène
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite('ambulance');
                        }}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                          savedFavorites.includes('ambulance')
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Favori"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {savedFavorites.includes('ambulance') ? 'favorite' : 'favorite_border'}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm ${
                          transportType === 'ambulance'
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>{transportType === 'ambulance' ? 'Sélectionné' : 'Choisir ce mode'}</span>
                        <span className="material-symbols-outlined text-base">
                          {transportType === 'ambulance' ? 'check' : 'arrow_forward'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 4: Interactive Trajet & Validation Form */}
              <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">
                      Renseignez votre Trajet &amp; Rendez-vous
                    </h3>
                    <p className="text-xs text-slate-500">
                      Calcul automatique de l'heure de prise en charge avec marge trafic
                    </p>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AddressAutocomplete
                      id="pickupAddress"
                      label="Lieu de départ (Domicile ou service)"
                      placeholder="Ex : 14 Rue des Flamboyants, Cluny, Schoelcher..."
                      value={pickupAddress}
                      onChange={setPickupAddress}
                      required
                      icon="my_location"
                      helperText="Adresse en Martinique"
                      allowManualEntry={true}
                      showCategories={false}
                      showQuickCommunes={true}
                      onSelectSuggestion={(s) => setPickupAddress(s.label)}
                    />

                    <AddressAutocomplete
                      id="destinationFacility"
                      label="Établissement ou pôle de soins"
                      placeholder="Ex : CHU Zobda-Quitman, Clinique Sainte-Marie..."
                      value={destinationFacility}
                      onChange={setDestinationFacility}
                      required
                      icon="domain"
                      defaultFilter="etablissement"
                      helperText="Hôpital, clinique ou centre médical"
                      allowManualEntry={true}
                      showCategories={true}
                      showQuickCommunes={false}
                      onSelectSuggestion={(s) => setDestinationFacility(s.label)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Date de prise en charge
                      </label>
                      <input
                        type="date"
                        required
                        value={transportDate}
                        onChange={(e) => setTransportDate(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Heure du rendez-vous médical
                      </label>
                      <input
                        type="time"
                        required
                        value={transportTime}
                        onChange={(e) => setTransportTime(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Submit Button (Nametastic Big Red Action Button) */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-base shadow-[0_4px_16px_rgba(220,38,38,0.25)] hover:shadow-[0_8px_24px_rgba(220,38,38,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Valider &amp; Continuer ma réservation</span>
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-2 font-medium">
                      🔒 Transmission sécurisée HDS · Prise en charge 100% ALD / CPAM
                    </p>
                  </div>
                </form>
              </div>

            </div>

            {/* ----------------------------------------------------------------------- */}
            {/* RIGHT COLUMN: Badges de Qualité & Hôpitaux Partenaires (3 cols)        */}
            {/* ----------------------------------------------------------------------- */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Box 1: Badges de Qualité Sanitaire (Like "Domain Quality Badges" in Nametastic) */}
              <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out">
                <h3 className="font-bold text-slate-900 text-base mb-4">Garanties de Prise en Charge</h3>
                
                <div className="space-y-4">
                  {/* Badge 1 */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <span className="material-symbols-outlined text-lg">verified</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">Tiers-Payant CPAM</span>
                        <span className="text-[11px] text-slate-500">Sans avance de frais</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-extrabold">
                      100%
                    </span>
                  </div>

                  {/* Badge 2 */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                        <span className="material-symbols-outlined text-lg">local_hospital</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">Agrément ARS 972</span>
                        <span className="text-[11px] text-slate-500">Transporteurs audités</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-extrabold">
                      85+
                    </span>
                  </div>

                  {/* Badge 3 */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                        <span className="material-symbols-outlined text-lg">travel_explore</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">Couverture Territoire</span>
                        <span className="text-[11px] text-slate-500">Nord, Centre &amp; Sud</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-extrabold">
                      34/34
                    </span>
                  </div>

                  {/* Badge 4 */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                        <span className="material-symbols-outlined text-lg">star</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">Satisfaction Usagers</span>
                        <span className="text-[11px] text-slate-500">Avis vérifiés Martinique</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-extrabold">
                      98.4%
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Principaux Pôles Hospitaliers Desservis (Like "Domain Extensions" in Nametastic) */}
              <div className="bg-white rounded-[24px] p-6 border border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-300 ease-out">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-base">Pôles Hospitaliers</h3>
                  <span className="text-xs font-bold text-blue-600">34 Communes</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span className="text-xs font-bold text-slate-800">CHU Zobda-Quitman</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">FDF</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                      <span className="text-xs font-bold text-slate-800">Clinique Sainte-Marie</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">Schoelcher</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span className="text-xs font-bold text-slate-800">Hôpital Louis Domergue</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">Trinité</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      <span className="text-xs font-bold text-slate-800">Centres de Dialyse</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">Lamentin / Sud</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Urgence & Assistance */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-[24px] p-6 text-white shadow-[0_8px_30px_rgba(15,23,42,0.15)] hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
                  <span className="material-symbols-outlined text-base">emergency</span>
                  <span>Urgence Vitale</span>
                </div>
                <h4 className="font-extrabold text-base text-white mb-2">
                  Besoin d'une prise en charge non-programmée ?
                </h4>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  En cas d'urgence immédiate, contactez directement le SAMU Centre 15.
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href="tel:15"
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-base">phone_in_talk</span>
                    <span>Appeler le 15 (SAMU)</span>
                  </a>
                  <a
                    href="tel:0596720097"
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-white/10"
                  >
                    <span className="material-symbols-outlined text-base">support_agent</span>
                    <span>Régulation : 05 96 72 00 97</span>
                  </a>
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* BOTTOM SECTION: 3 Steps Process with Nametastic-style Cards               */}
          {/* ========================================================================= */}
          <section className="mt-16 sm:mt-20">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
                Processus Transparent
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Comment ça marche en 3 étapes simples ?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-black text-lg flex items-center justify-center mb-5 border border-blue-100 shadow-xs">
                    1
                  </div>
                  <div className="h-44 rounded-2xl overflow-hidden mb-5 bg-slate-100">
                    <img
                      src="/assets/step1_prescription.jpg"
                      alt="Prescription Médicale de Transport"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    1. Renseignez votre bon
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Indiquez votre point de départ, l'hôpital de destination et le mode de transport coché par votre médecin sur la PMT Cerfa S3138.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-blue-600 font-bold">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Saisie en 30 secondes</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 font-black text-lg flex items-center justify-center mb-5 border border-teal-100 shadow-xs">
                    2
                  </div>
                  <div className="h-44 rounded-2xl overflow-hidden mb-5 bg-slate-100">
                    <img
                      src="/assets/step2_dispatch.jpg"
                      alt="Centre de régulation des transports en Martinique"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    2. Diffusion instantanée
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Votre demande est transmise aux 85+ transporteurs agréés de votre commune ou de l'ensemble de la Martinique pour acceptation rapide.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-teal-600 font-bold">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  <span>Attribution automatique</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-lg flex items-center justify-center mb-5 border border-indigo-100 shadow-xs">
                    3
                  </div>
                  <div className="h-44 rounded-2xl overflow-hidden mb-5 bg-slate-100">
                    <img
                      src="/assets/step3_care.jpg"
                      alt="Ambulancier accueillant un patient en Martinique"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    3. Suivi &amp; Prise en charge
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    Recevez l'heure de passage exacte, l'immatriculation du véhicule et suivez l'approche du chauffeur en direct sur votre smartphone.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                  <span className="material-symbols-outlined text-sm">notifications_active</span>
                  <span>SMS &amp; WhatsApp direct</span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* MAP & TERRITORY COVERAGE (Bento Style)                                    */}
          {/* ========================================================================= */}
          <section className="mt-16 sm:mt-20">
            <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-slate-200/70 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold w-fit">
                    <span className="material-symbols-outlined text-teal-600 text-sm">travel_explore</span>
                    <span>Territoire 100% Couvert</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    De Grand'Rivière à Sainte-Anne, une régulation sans zone blanche.
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Grâce au maillage coordonné des artisans taxis sanitaires et des compagnies d'ambulances conventionnées, nous réduisons les temps d'attente sur toute la Martinique.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-2xl font-black text-blue-700 block">34</span>
                      <span className="text-xs text-slate-500 font-medium">Communes reliées</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-2xl font-black text-teal-600 block">&lt; 15 min</span>
                      <span className="text-xs text-slate-500 font-medium">Temps d'approche moyen</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/droits-cpam"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>Consulter les barèmes CPAM &amp; ALD</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="w-full h-[380px] rounded-[24px] overflow-hidden shadow-md border border-slate-200">
                    <GoogleMapView mode="fleet" height="100%" />
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
};
