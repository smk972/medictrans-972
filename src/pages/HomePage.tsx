import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { GoogleMapView } from '../components/GoogleMapView';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../contexts/AuthContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Booking form state
  const [transportType, setTransportType] = useState<'taxi' | 'vsl' | 'ambulance'>('taxi');
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationFacility, setDestinationFacility] = useState('CHU Fort-de-France (P. Zobda-Quitman)');
  const [transportDate, setTransportDate] = useState('');
  const [transportTime, setTransportTime] = useState('09:30');
  const [tripType, setTripType] = useState<'aller-simple' | 'aller-retour'>('aller-retour');
  const [geoLocating, setGeoLocating] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Initialize default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTransportDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleQuickCommune = (commune: string) => {
    setPickupAddress(`${commune}, Martinique`);
  };

  const handleGeolocation = () => {
    setGeoLocating(true);
    setPickupAddress('Localisation GPS en cours...');
    setTimeout(() => {
      setPickupAddress('12 Boulevard de la Marne, 97200 Fort-de-France (Position GPS)');
      setGeoLocating(false);
    }, 500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store in draft storage so BookingPage receives it seamlessly
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

    // Si la personne n'est pas connectée / n'a pas de compte, l'inviter à créer un compte ou se connecter
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
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary flex flex-col">
      <Header />
      <SEOHead
        title="Médic'Trans Martinique | Transport Sanitaire, VSL & Ambulance Conventionnée 972"
        description="Plateforme de régulation et réservation de transport médicalisé en Martinique : Ambulance ASSU, VSL et Taxi Conventionné CPAM / CGSS 972. Tiers-payant 100% ALD sur les 34 communes."
        canonicalPath="/"
        ogImage="/assets/medictrans_hero_discover.jpg"
      />

      <main className="w-full pt-20 bg-surface flex-1">
        <div className="flex flex-col w-full">
          {/* Dynamic Atmospheric Hero & Express Booking Engine */}
          <section className="relative w-full overflow-hidden bg-surface-container-lowest py-space-xl">
            {/* Atmospheric ambient light circles */}
            <div className="absolute -top-36 -right-24 w-96 h-96 rounded-full bg-surface-variant/40 blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-secondary-container/30 blur-3xl pointer-events-none"></div>

            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative z-10">
              {/* Top Badges & Heading Hierarchy */}
              <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-xl">
                <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight mb-space-sm font-bold text-3xl md:text-4xl lg:text-5xl">
                  Votre transport médicalisé en Martinique, réservé en toute sérénité.
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl text-lg">
                  Service conçu pour les patients, proches aidants et équipes soignantes.
                </p>

                {/* Quick island metrics counter bar */}
                <div className="flex items-center flex-wrap justify-center gap-space-lg mt-space-md text-on-surface-variant font-label-md text-label-md">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary">verified_user</span>
                    <span>85+ Transporteurs Certifiés</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary">local_hospital</span>
                    <span>Tous Établissements 972</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary">schedule</span>
                    <span>Régulation 24h/24 &amp; 7j/7</span>
                  </div>
                </div>
              </div>

              {/* Main Express Reservation Bento Card */}
              <div className="w-full max-w-4xl mx-auto bg-surface-container-lowest rounded-2xl shadow-xl p-space-md md:p-space-xl border border-outline-variant/30">
                <div className="flex items-center justify-between pb-space-md mb-space-md bg-surface-container-low -mx-space-md md:-mx-space-xl -mt-space-md md:-mt-space-xl px-space-md md:px-space-xl pt-space-md md:pt-space-md rounded-t-2xl border-b border-outline-variant/30">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                      <span className="material-symbols-outlined">speed</span>
                    </div>
                    <div>
                      <span className="font-headline-sm text-headline-sm text-primary block font-bold">
                        Réservation Express de Transport
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Prise en charge directe avec prescription médicale (PMT)
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-secondary bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline-variant/40">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    Régulation Directe 972
                  </div>
                </div>

                <form className="space-y-space-lg" onSubmit={handleFormSubmit}>
                  {/* STEP 1: Interactive Transport Mode Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-space-xs font-bold">
                        <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center font-bold">
                          1
                        </span>
                        Sélectionnez le mode de transport prescrit
                      </label>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Indiqué sur le volet 1 de votre bon
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                      {/* Option 1: Taxi conventionné */}
                      <div
                        onClick={() => setTransportType('taxi')}
                        className={`transport-option-card relative cursor-pointer p-space-md rounded-xl transition-all duration-200 border-2 ${
                          transportType === 'taxi'
                            ? 'bg-surface-container-low border-primary shadow-md ring-2 ring-primary/20'
                            : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline hover:shadow-sm'
                        }`}
                      >
                        {transportType === 'taxi' && (
                          <div className="badge-selected absolute top-3 right-3 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-sm animate-scaleIn">
                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                          </div>
                        )}
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-space-sm">
                          <span className="material-symbols-outlined text-2xl">local_taxi</span>
                        </div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-1 font-bold">
                          Taxi Conventionné
                        </h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm text-sm">
                          Patient autonome pouvant voyager assis. Transport médicalisé sans brancard.
                        </p>
                        <div className="flex items-center gap-1.5 pt-space-xs text-primary font-label-sm text-label-sm font-semibold">
                          <span className="material-symbols-outlined text-base">verified</span>
                          <span>Patient autonome</span>
                        </div>
                      </div>

                      {/* Option 2: VSL */}
                      <div
                        onClick={() => setTransportType('vsl')}
                        className={`transport-option-card relative cursor-pointer p-space-md rounded-xl transition-all duration-200 border-2 ${
                          transportType === 'vsl'
                            ? 'bg-surface-container-low border-secondary shadow-md ring-2 ring-secondary/20'
                            : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline hover:shadow-sm'
                        }`}
                      >
                        {transportType === 'vsl' && (
                          <div className="badge-selected absolute top-3 right-3 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-sm animate-scaleIn">
                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                          </div>
                        )}
                        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-space-sm">
                          <span className="material-symbols-outlined text-2xl">airport_shuttle</span>
                        </div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-1 font-bold">
                          VSL (Sanitaire Léger)
                        </h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm text-sm">
                          Transport assis professionnalisé, aide à la marche et accompagnement soignant.
                        </p>
                        <div className="flex items-center gap-1.5 pt-space-xs text-secondary font-label-sm text-label-sm font-semibold">
                          <span className="material-symbols-outlined text-base">verified</span>
                          <span>Aide au transfert</span>
                        </div>
                      </div>

                      {/* Option 3: Ambulance */}
                      <div
                        onClick={() => setTransportType('ambulance')}
                        className={`transport-option-card relative cursor-pointer p-space-md rounded-xl transition-all duration-200 border-2 ${
                          transportType === 'ambulance'
                            ? 'bg-surface-container-low border-error shadow-md ring-2 ring-error/20'
                            : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline hover:shadow-sm'
                        }`}
                      >
                        {transportType === 'ambulance' && (
                          <div className="badge-selected absolute top-3 right-3 w-6 h-6 rounded-full bg-error flex items-center justify-center text-on-error shadow-sm animate-scaleIn">
                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                          </div>
                        )}
                        <div className="w-12 h-12 rounded-xl bg-error-container/40 flex items-center justify-center text-error mb-space-sm">
                          <span className="material-symbols-outlined text-2xl">emergency</span>
                        </div>
                        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-1 font-bold">
                          Ambulance
                        </h2>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm text-sm">
                          Position allongée ou demi-assise, surveillance paramédicale continue &amp; brancardage.
                        </p>
                        <div className="flex items-center gap-1.5 pt-space-xs text-error font-label-sm text-label-sm font-semibold">
                          <span className="material-symbols-outlined text-base">health_and_safety</span>
                          <span>Surveillance requise</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: Trajet & Établissement */}
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <label className="font-label-lg text-label-lg text-on-surface flex items-center gap-space-xs font-bold">
                        <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-label-sm text-label-sm flex items-center justify-center font-bold">
                          2
                        </span>
                        Détails du trajet &amp; Établissement
                      </label>
                      <span className="font-label-sm text-label-sm text-secondary font-bold">
                        Martinique 972
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                      {/* Prise en charge */}
                      <AddressAutocomplete
                        id="pickupAddress"
                        label="Lieu de prise en charge (Départ Martinique)"
                        placeholder="Ex : 14 Rue des Flamboyants, Cluny, Schoelcher..."
                        value={pickupAddress}
                        onChange={setPickupAddress}
                        required
                        icon="my_location"
                        helperText="Saisissez librement ou choisissez une adresse suggérée en Martinique"
                        allowManualEntry={true}
                        showCategories={false}
                        showQuickCommunes={true}
                        onSelectSuggestion={(s) => setPickupAddress(s.label)}
                      />

                      {/* Établissement destination */}
                      <AddressAutocomplete
                        id="destinationFacility"
                        label="Établissement de soins ou destination"
                        placeholder="Ex : CHU Zobda-Quitman, Clinique Sainte-Marie, Cabinet médical..."
                        value={destinationFacility}
                        onChange={setDestinationFacility}
                        required
                        icon="domain"
                        defaultFilter="etablissement"
                        helperText="Sélectionnez un hôpital, clinique, dialyse, ou écrivez une adresse libre"
                        allowManualEntry={true}
                        showCategories={true}
                        showQuickCommunes={false}
                        onSelectSuggestion={(s) => setDestinationFacility(s.label)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mt-space-md">
                      {/* Date */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="font-label-md text-label-md text-on-surface flex items-center gap-1 font-semibold"
                          htmlFor="transportDate"
                        >
                          <span className="material-symbols-outlined text-base text-primary">
                            calendar_month
                          </span>
                          Date du transport
                        </label>
                        <input
                          className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-center"
                          id="transportDate"
                          required
                          type="date"
                          value={transportDate}
                          onChange={(e) => setTransportDate(e.target.value)}
                        />
                      </div>

                      {/* Heure de rendez-vous médical */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          className="font-label-md text-label-md text-on-surface flex items-center gap-1 font-semibold"
                          htmlFor="transportTime"
                        >
                          <span className="material-symbols-outlined text-base text-primary">
                            schedule
                          </span>
                          Heure de votre rendez-vous médical
                        </label>
                        <input
                          className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest text-on-surface font-body-md text-body-md border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-center"
                          id="transportTime"
                          required
                          type="time"
                          value={transportTime}
                          onChange={(e) => setTransportTime(e.target.value)}
                        />
                        <p className="text-[11px] text-on-surface-variant leading-tight">
                          Indiquez l'heure de votre convocation ou rendez-vous. Votre transporteur calculera et confirmera l'heure de prise en charge à domicile.
                        </p>
                      </div>
                    </div>

                    {/* Aller simple vs Aller & Retour */}
                    <div className="mt-space-md bg-surface-container-low rounded-xl p-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/30">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-space-md">
                        <span className="font-label-md text-label-md text-on-surface whitespace-nowrap font-semibold">
                          Type de parcours :
                        </span>
                        <div
                          className="inline-flex items-center p-1 bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/30 gap-1"
                          role="radiogroup"
                        >
                          <button
                            type="button"
                            onClick={() => setTripType('aller-simple')}
                            className={`px-3 py-1.5 rounded font-label-md text-label-md transition-colors ${
                              tripType === 'aller-simple'
                                ? 'bg-primary text-on-primary font-bold'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                            }`}
                          >
                            Aller simple
                          </button>
                          <button
                            type="button"
                            onClick={() => setTripType('aller-retour')}
                            className={`px-3 py-1.5 rounded font-label-md text-label-md transition-colors ${
                              tripType === 'aller-retour'
                                ? 'bg-primary text-on-primary font-bold'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                            }`}
                          >
                            Aller &amp; Retour
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-secondary bg-surface-container-lowest px-3 py-2 rounded-lg shadow-sm shrink-0 border border-outline-variant/30 w-fit">
                        <span className="material-symbols-outlined text-xl">description</span>
                        <span className="font-label-sm text-label-sm font-bold">
                          PMT Obligatoire pour Tiers Payant
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bouton Continuer */}
                  <div className="pt-space-sm flex flex-col sm:flex-row items-center justify-between gap-space-md">
                    <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm text-sm">
                      <span className="material-symbols-outlined text-secondary text-lg">shield</span>
                      <span>Données de santé confidentielles sécurisées HDS</span>
                    </div>

                    <button
                      className="w-full sm:w-auto px-8 h-14 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-space-sm shrink-0 hover:scale-[1.02] active:scale-[0.99]"
                      type="submit"
                    >
                      <span>Continuer ma réservation</span>
                      <span className="material-symbols-outlined text-xl">arrow_forward</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* Value propositions banner */}
          <section className="w-full bg-surface-container py-space-lg border-y border-outline-variant/20">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="flex items-start gap-space-sm p-space-sm bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined">health_and_safety</span>
                  </div>
                  <div>
                    <h3 className="font-label-lg text-label-lg text-on-surface font-bold">
                      100% Prise en Charge
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                      Tiers payant intégral avec votre Prescription Médicale (PMT) &amp; ALD.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-space-sm p-space-sm bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined">verified</span>
                  </div>
                  <div>
                    <h3 className="font-label-lg text-label-lg text-on-surface font-bold">
                      Conventionné CPAM
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                      Sécurité Sociale Martinique (CGSS 972) et mutuelles complémentaires.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-space-sm p-space-sm bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20">
                  <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container shrink-0">
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div>
                    <h3 className="font-label-lg text-label-lg text-on-surface font-bold">
                      85+ Véhicules Actifs
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                      Flotte couvrant le Nord Caraïbe, Grand Sud, Centre et Atlantique.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-space-sm p-space-sm bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/20">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined">support_agent</span>
                  </div>
                  <div>
                    <h3 className="font-label-lg text-label-lg text-on-surface font-bold">
                      Régulateurs Locaux
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                      Plateforme d'écoute basée en Martinique disponible au 05 96 72 00 97.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Processus 3 étapes */}
          <section className="w-full bg-surface-container-lowest py-space-xl">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="text-center max-w-2xl mx-auto mb-space-xl">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                  Processus Transparent
                </span>
                <h2 className="font-headline-lg text-headline-lg text-primary mt-space-xs font-bold text-2xl md:text-3xl">
                  Comment ça marche en 3 étapes simples ?
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                  Une régulation fluide pensée pour vous épargner des heures d'appels téléphoniques
                  aux compagnies d'ambulances.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-xl relative">
                {/* Step 1 */}
                <div className="relative bg-surface-container-low rounded-2xl p-space-lg flex flex-col shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center mb-space-md shadow-md font-bold">
                    1
                  </div>
                  <div className="h-48 rounded-xl overflow-hidden mb-space-md bg-surface-container shadow-inner">
                    <img
                      className="w-full h-full object-cover"
                      alt="Prescription Médicale de Transport"
                      src="/assets/step1_prescription.jpg"
                    />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs font-bold">
                    1. Réservez en ligne avec votre bon
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md leading-relaxed">
                    Renseignez votre trajet et le type de transport indiqué sur votre Prescription
                    Médicale de Transport (PMT) délivrée par votre médecin.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative bg-surface-container-low rounded-2xl p-space-lg flex flex-col shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary font-headline-sm text-headline-sm flex items-center justify-center mb-space-md shadow-md font-bold">
                    2
                  </div>
                  <div className="h-48 rounded-xl overflow-hidden mb-space-md bg-surface-container shadow-inner">
                    <img
                      className="w-full h-full object-cover"
                      alt="Centre de régulation des transports en Martinique"
                      src="/assets/step2_dispatch.jpg"
                    />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs font-bold">
                    2. Diffusion instantanée aux transporteurs
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md leading-relaxed">
                    Votre demande est diffusée en direct aux taxis conventionnés, VSL et ambulances
                    certifiés de votre commune et de toute l'île.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative bg-surface-container-low rounded-2xl p-space-lg flex flex-col shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-tertiary text-on-tertiary font-headline-sm text-headline-sm flex items-center justify-center mb-space-md shadow-md font-bold">
                    3
                  </div>
                  <div className="h-48 rounded-xl overflow-hidden mb-space-md bg-surface-container shadow-inner">
                    <img
                      className="w-full h-full object-cover"
                      alt="Ambulancier accueillant un patient en Martinique"
                      src="/assets/step3_care.jpg"
                    />
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-space-xs font-bold">
                    3. Confirmation &amp; Suivi en temps réel
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md leading-relaxed">
                    Dès l'acceptation, recevez le nom de votre chauffeur, son immatriculation, son heure
                    d'arrivée et un lien de suivi GPS pour les proches.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Territoire 100% couvert & Carte de Martinique */}
          <section className="w-full bg-surface-container py-space-xl border-y border-outline-variant/20">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                <div className="lg:col-span-5 flex flex-col gap-space-sm">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high w-fit border border-outline-variant/30">
                    <span className="material-symbols-outlined text-secondary text-base">
                      travel_explore
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                      Territoire 100% Couvert
                    </span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold text-2xl md:text-3xl">
                    De Grand'Rivière à Sainte-Anne, une régulation sans zone blanche.
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Grâce à notre maillage territorial coordonné avec les groupements de taxis sanitaires
                    et les compagnies ambulancières conventionnées, nous réduisons les temps d'approche
                    même dans les communes du Nord montagneux ou les zones isolées du Sud.
                  </p>
                  <div className="grid grid-cols-2 gap-space-sm mt-space-sm">
                    <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-xs border border-outline-variant/30">
                      <span className="font-headline-md text-headline-md text-primary block font-bold text-2xl">
                        34
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                        Communes de Martinique desservies
                      </span>
                    </div>
                    <div className="bg-surface-container-lowest p-space-sm rounded-xl shadow-xs border border-outline-variant/30">
                      <span className="font-headline-md text-headline-md text-secondary block font-bold text-2xl">
                        &lt; 15 min
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                        Délai d'approche moyen en agglomération
                      </span>
                    </div>
                  </div>
                  <div className="mt-space-md">
                    <Link
                      to="/droits-cpam"
                      className="inline-flex items-center gap-2 font-label-md text-label-md text-primary hover:text-primary-container font-bold transition-colors"
                    >
                      <span>Consulter le barème de prise en charge CPAM</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-7 relative">
                  <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-lg relative border border-outline-variant/30">
                    <GoogleMapView mode="fleet" height="100%" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cadres de santé & Hôpitaux */}
          <section className="w-full bg-primary py-space-xl text-on-primary">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
                <div className="lg:col-span-7 flex flex-col gap-space-md">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container text-on-primary font-label-sm text-label-sm w-fit font-bold">
                    <span className="material-symbols-outlined text-sm">badge</span>
                    <span>Espace Professionnels de Santé</span>
                  </div>
                  <h2 className="font-headline-xl text-headline-xl tracking-tight text-on-primary font-bold text-2xl md:text-3xl">
                    Cadres de santé, médecins, secrétariats : automatisez vos sorties d'hospitalisation.
                  </h2>
                  <p className="font-body-lg text-body-lg text-on-primary-container text-base md:text-lg leading-relaxed">
                    Gagnez un temps soignant précieux. Finis les multiples coups de fil pour trouver une
                    ambulance disponible. Programmez les départs simples ou réguliers en moins de 60
                    secondes depuis votre poste de soins.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md mt-space-sm">
                    <div className="bg-primary-container/40 p-space-sm rounded-xl backdrop-blur-sm border border-white/10">
                      <span className="material-symbols-outlined text-secondary-fixed text-2xl mb-1">
                        domain_verification
                      </span>
                      <h4 className="font-label-md text-label-md font-bold mb-1">
                        Bordereau Hospitalier
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-primary-container text-xs">
                        Rapprochement automatique des prescriptions et bons de transport.
                      </p>
                    </div>

                    <div className="bg-primary-container/40 p-space-sm rounded-xl backdrop-blur-sm border border-white/10">
                      <span className="material-symbols-outlined text-secondary-fixed text-2xl mb-1">
                        alarm_on
                      </span>
                      <h4 className="font-label-md text-label-md font-bold mb-1">
                        Priorités Sorties de Lit
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-primary-container text-xs">
                        Fluidifiez le turn-over de vos lits d'hospitalisation aiguë.
                      </p>
                    </div>

                    <div className="bg-primary-container/40 p-space-sm rounded-xl backdrop-blur-sm border border-white/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="material-symbols-outlined text-secondary-fixed text-2xl">
                          security
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container/30 text-secondary-fixed font-label-sm text-label-sm text-[10px]">
                          Bientôt disponible
                        </span>
                      </div>
                      <h4 className="font-label-md text-label-md font-bold mb-1">
                        Connexion Pro Santé
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-primary-container text-xs">
                        Bientôt disponible · Accès sécurisé par carte CPS, e-CPS ou identifiant certifié CHU.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-space-md mt-space-sm">
                    <Link
                      className="px-6 h-12 rounded-xl bg-surface-container-lowest text-primary font-label-md text-label-md font-bold hover:bg-surface-container-high transition-colors flex items-center gap-2 shadow-sm"
                      to="/etablissements"
                    >
                      <span className="material-symbols-outlined">login</span>
                      <span>Accéder au Portail Établissements</span>
                    </Link>
                    <Link
                      to="/inscription/etablissement"
                      className="px-6 h-12 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary-container/80 transition-colors flex items-center gap-2"
                    >
                      <span>Demander un compte service hospitalier</span>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-surface-container-lowest text-on-surface p-space-lg rounded-2xl shadow-xl flex flex-col gap-space-md border border-outline-variant/30">
                    <div className="flex items-center gap-space-sm">
                      <img
                        className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
                        alt="Mme C. Almont"
                        src="/assets/nurse_almont.jpg"
                      />
                      <div>
                        <span className="font-label-lg text-label-lg text-primary block font-bold">
                          Mme C. Almont
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                          Cadre de Santé - Service Néphrologie, CHU
                        </span>
                      </div>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant italic text-sm leading-relaxed">
                      “Médic'Trans a transformé notre gestion des transports dialyse. Nos patients ne
                      patientent plus des heures dans les couloirs du centre, et notre équipe consacre
                      son temps aux soins plutôt qu'aux recherches d'ambulances.”
                    </p>
                    <div className="flex items-center justify-between pt-space-sm bg-surface-container-low rounded-xl p-3 border border-outline-variant/20">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                          Indice de satisfaction CHU
                        </span>
                        <span className="font-headline-sm text-headline-sm text-secondary font-bold text-xl">
                          98.4%
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-secondary text-3xl">star</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Témoignages Usagers */}
          <section className="w-full bg-surface py-space-xl">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="text-center max-w-xl mx-auto mb-space-xl">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                  La Voix des Usagers
                </span>
                <h2 className="font-headline-lg text-headline-lg text-primary mt-space-xs font-bold text-2xl md:text-3xl">
                  Ils voyagent sereinement avec Médic'Trans
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
                {/* Review 1 */}
                <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-sm transition-shadow">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center gap-1 text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-sm">
                          star
                        </span>
                      ))}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">
                      “Maman doit se rendre 3 fois par semaine en radiothérapie à Clarion. Les
                      chauffeurs de taxi conventionné sont toujours à l'heure, bienveillants et
                      l'aident jusqu'à la porte du cabinet.”
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-space-md pt-space-sm border-t border-outline-variant/20">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      JL
                    </div>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface block font-bold text-sm">
                        Jean-Luc B.
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                        Aidant familial · Sainte-Luce
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review 2 */}
                <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-sm transition-shadow">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center gap-1 text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-sm">
                          star
                        </span>
                      ))}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">
                      “J'avais une appréhension pour mon retour d'opération de la hanche à
                      Sainte-Marie. L'ambulance est arrivée avec des ambulanciers très doux,
                      brancardage impeccable au troisième étage sans ascenseur.”
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-space-md pt-space-sm border-t border-outline-variant/20">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary text-sm">
                      MV
                    </div>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface block font-bold text-sm">
                        Marie-Victoire T.
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                        Patiente hospitalisée · Schoelcher
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review 3 */}
                <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between hover:shadow-sm transition-shadow">
                  <div className="flex flex-col gap-space-sm">
                    <div className="flex items-center gap-1 text-secondary">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-sm">
                          star
                        </span>
                      ))}
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">
                      “En tant que chauffeur de taxi conventionné indépendant au Lamentin, la
                      plateforme me permet d'optimiser mes trajets quotidiens sans paperasse
                      inutile. Tout est clair et réglé en tiers-payant.”
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-space-md pt-space-sm border-t border-outline-variant/20">
                    <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center font-bold text-tertiary text-sm">
                      PT
                    </div>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface block font-bold text-sm">
                        Patrice T.
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                        Artisan Taxi Conventionné · Le Lamentin
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Emergency CTA Banner */}
          <section className="w-full bg-surface-container-lowest py-space-xl">
            <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
              <div className="bg-gradient-to-r from-surface-container-low to-surface-container p-space-lg md:p-space-xl rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-lg border border-outline-variant/30">
                <div className="flex items-center gap-space-md">
                  <div className="w-14 h-14 rounded-2xl bg-error text-on-error flex items-center justify-center shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-3xl">phone_in_talk</span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-primary font-bold text-xl">
                      Besoin d'une prise en charge urgente non-programmée ?
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-1">
                      Pour toute urgence vitale, contactez immédiatement le SAMU Centre 15. Pour un
                      transfert inter-hospitalier urgent régulé, notre ligne dédiée répond 24/7.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-space-sm shrink-0 w-full md:w-auto">
                  <a
                    className="w-full sm:w-auto px-6 h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm transition-all font-bold"
                    href="tel:0596720097"
                  >
                    <span className="material-symbols-outlined">call</span>
                    <span>05 96 72 00 97</span>
                  </a>
                  <a
                    className="w-full sm:w-auto px-6 h-12 rounded-xl bg-error hover:bg-error/90 text-on-error font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm transition-all font-bold"
                    href="tel:15"
                  >
                    <span className="material-symbols-outlined">emergency</span>
                    <span>Composer le 15 (SAMU)</span>
                  </a>
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
