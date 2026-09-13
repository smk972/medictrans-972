import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { FileUpload, UploadedFile } from '../components/FileUpload';
import { PhoneInput } from '../components/PhoneInput';
import { GoogleMapView } from '../components/GoogleMapView';
import { whatsappService } from '../services/whatsappService';
import { rideService } from '../services/rideService';
import { calculateMedicalRidePricing } from '../services/pricingService';
import { TransportType } from '../types';

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve initial state from home page or defaults
  const stateData = location.state || {};
  let storedDraft: any = {};
  try {
    const raw = localStorage.getItem('medictrans_draft_booking');
    if (raw) storedDraft = JSON.parse(raw);
  } catch {
    // ignore
  }

  const initialTransport = stateData.transportType || storedDraft.transportType || 'vsl';
  const initialPickup = stateData.pickupAddress || storedDraft.pickupAddress || 'Résidence Les Alizés, Cluny, Schoelcher';
  const initialDest = stateData.destinationFacility || storedDraft.destinationFacility || 'CHU Pierre Zobda-Quitman - Pôle Oncologie, FdF';
  const initialDate = stateData.transportDate || storedDraft.transportDate || '2026-10-24';
  const initialTime = stateData.transportTime || storedDraft.transportTime || '08:30';

  // Form states - Trajet & Véhicule
  const [pickupAddress, setPickupAddress] = useState(initialPickup);
  const [destinationFacility, setDestinationFacility] = useState(initialDest);
  const [transportType, setTransportType] = useState<'taxi' | 'vsl' | 'ambulance'>(initialTransport);
  const [transportDate, setTransportDate] = useState(initialDate);
  const [transportTime, setTransportTime] = useState(initialTime);
  const [isEditingRoute, setIsEditingRoute] = useState(false);

  // Form states - Patient & Médical
  const [lastName, setLastName] = useState('GLISSANT');
  const [firstName, setFirstName] = useState('Aimé');
  const [nir, setNir] = useState('1 54 08 97 213 456 82');
  const [phone, setPhone] = useState('06 96 44 20 18');
  const [birthDate, setBirthDate] = useState('1954-08-14');
  const [isAld, setIsAld] = useState(true);
  const [mobility, setMobility] = useState<'assis' | 'marche' | 'fauteuil' | 'allonge'>('assis');
  const [oxygen, setOxygen] = useState(false);
  const [floor, setFloor] = useState('Rez-de-chaussée / Plain-pied');
  const [hasElevator, setHasElevator] = useState(true);
  const [hasCompanion, setHasCompanion] = useState(true);
  const [hasPmt, setHasPmt] = useState<'already' | 'later'>('already');
  const [uploadedPmtDoc, setUploadedPmtDoc] = useState<UploadedFile | null>(null);
  const [motif, setMotif] = useState('Consultation spécialisée / Bilan');
  const [doctor, setDoctor] = useState('Dr. J-M Lafontaine - Oncologie CHU');
  
  // WhatsApp notification automation states
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [whatsappPhone, setWhatsappPhone] = useState('06 96 44 20 18');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Moteur réglementaire de calcul du prix & de la distance en Martinique
  const mappedTransportType: TransportType =
    transportType === 'taxi'
      ? 'TAXI_CONVENTIONNE'
      : transportType === 'ambulance'
      ? 'AMBULANCE'
      : 'VSL';

  const ridePricing = useMemo(() => {
    return calculateMedicalRidePricing({
      transportType: mappedTransportType,
      originAddress: pickupAddress,
      destinationAddress: destinationFacility,
      isAld,
      isRoundTrip: false,
      dateTimeStr: `${transportDate}T${transportTime}:00`,
      mobility: {
        wheelchair: mobility === 'fauteuil',
        stretcher: mobility === 'allonge',
        oxygen,
        stairsWithoutElevator: !hasElevator,
        needsEscort: hasCompanion,
      },
    });
  }, [mappedTransportType, pickupAddress, destinationFacility, isAld, transportDate, transportTime, mobility, oxygen, hasElevator, hasCompanion]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalRef = `MT-972-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const createdRide = await rideService.createRide({
        pickupAddress,
        pickupCity: pickupAddress.includes(',') ? pickupAddress.split(',')[1].trim() : 'Schœlcher',
        dropoffAddress: destinationFacility,
        dropoffCity: 'Fort-de-France',
        facilityName: destinationFacility,
        pickupDateTime: `${transportDate}T${transportTime}:00`,
        isRoundTrip: true,
        returnDateTime: `${transportDate}T17:00:00`,
        transportType: transportType === 'taxi' ? 'TAXI_CONVENTIONNE' : transportType === 'ambulance' ? 'AMBULANCE' : 'VSL',
        patient: {
          firstName,
          lastName,
          birthDate,
          nir,
          phone,
          email: `${firstName.toLowerCase().replace(/\s+/g, '')}@example.fr`,
          address: pickupAddress,
          city: pickupAddress.includes(',') ? pickupAddress.split(',')[1].trim() : 'Schœlcher',
          postalCode: '97233',
          isAld,
          hasPmt: hasPmt === 'already',
          pmtPrescriberDoctor: doctor,
        },
        mobility: {
          wheelchair: mobility === 'fauteuil',
          stretcher: mobility === 'allonge',
          oxygen,
          stairsWithoutElevator: !hasElevator && floor !== 'Rez-de-chaussée / Plain-pied',
          floorNumber: floor === 'Rez-de-chaussée / Plain-pied' ? 0 : 2,
          needsEscort: hasCompanion,
          notes: `Motif: ${motif}`,
        },
        source: 'PATIENT',
        estimatedDistanceKm: ridePricing.distanceKm,
        estimatedDurationMin: ridePricing.durationMinutes,
        pricing: ridePricing,
      });

      const actualRef = createdRide?.reference || finalRef;
      const bookingRecord = {
        ref: actualRef,
        pickupAddress,
        destinationFacility,
        transportType,
        transportDate,
        transportTime,
        patientName: `${firstName} ${lastName}`,
        nir,
        phone,
        whatsappOptIn,
        whatsappPhone: whatsappPhone || phone,
        uploadedPmtDoc,
      };
      try {
        localStorage.setItem('medictrans_last_booking', JSON.stringify(bookingRecord));
      } catch {
        // ignore
      }

      setTimeout(() => {
        navigate(`/confirmation/${actualRef}`);
      }, 500);
    } catch {
      const bookingRecord = {
        ref: finalRef,
        pickupAddress,
        destinationFacility,
        transportType,
        transportDate,
        transportTime,
        patientName: `${firstName} ${lastName}`,
        nir,
        phone,
        whatsappOptIn,
        whatsappPhone: whatsappPhone || phone,
        uploadedPmtDoc,
      };
      try {
        localStorage.setItem('medictrans_last_booking', JSON.stringify(bookingRecord));
      } catch {
        // ignore
      }

      setTimeout(() => {
        navigate(`/confirmation/${finalRef}`);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary flex flex-col">
      <Header />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* Step Indicator Header */}
        <section className="w-full bg-surface-container-low py-space-lg shadow-sm border-b border-outline-variant/30">
          <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary tracking-widest uppercase font-bold">
                  Demande Réf. MT-972-8821
                </span>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold text-2xl md:text-3xl">
                  Réservation de Transport Sanitaire
                </h1>
              </div>

              <div className="flex items-center gap-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-md text-label-md">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </span>
                  <div className="hidden sm:flex flex-col">
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Étape 1</span>
                    <span className="font-label-md text-label-md text-on-surface">Trajet &amp; Véhicule</span>
                  </div>
                </div>

                <div className="w-8 md:w-12 h-0.5 bg-secondary"></div>

                <div className="flex items-center gap-space-xs">
                  <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-md text-label-md shadow-md font-bold">
                    2
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-primary font-bold">Étape active</span>
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
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            {/* Left Column: Patient Details, Mobility & PMT */}
            <div className="lg:col-span-7 flex flex-col gap-space-xl">
              {/* Card 0: Itinéraire Sanitaire & Destination */}
              <div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-2xl shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">route</span>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Itinéraire &amp; Établissement de Soins
                      </h2>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Suggestions Google Maps &amp; Répertoire Hospitalier 972
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingRoute(!isEditingRoute)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high font-label-sm text-label-sm font-bold flex items-center gap-1 text-xs border border-outline-variant/30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isEditingRoute ? 'done' : 'edit'}
                    </span>
                    <span>{isEditingRoute ? 'Valider' : 'Modifier le trajet'}</span>
                  </button>
                </div>

                {isEditingRoute ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs animate-fadeIn">
                    <AddressAutocomplete
                      id="booking-pickup"
                      label="Point de départ (Prise en charge)"
                      placeholder="Adresse personnelle, clinique, cabinet..."
                      value={pickupAddress}
                      onChange={setPickupAddress}
                      required
                      icon="my_location"
                      helperText="Écrivez une adresse ou sélectionnez une suggestion"
                      allowManualEntry={true}
                      showCategories={false}
                      showQuickCommunes={true}
                      onSelectSuggestion={(s) => setPickupAddress(s.label)}
                    />

                    <AddressAutocomplete
                      id="booking-dest"
                      label="Établissement ou Destination de soins"
                      placeholder="Hôpital, clinique, dialyse ou adresse libre..."
                      value={destinationFacility}
                      onChange={setDestinationFacility}
                      required
                      icon="domain"
                      defaultFilter="etablissement"
                      helperText="Tous les CHU, hôpitaux, centres spécialisés Martinique"
                      allowManualEntry={true}
                      showCategories={true}
                      showQuickCommunes={false}
                      onSelectSuggestion={(s) => setDestinationFacility(s.label)}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm p-space-sm rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <div className="flex items-start gap-2 p-2">
                      <span className="material-symbols-outlined text-primary text-base mt-0.5">
                        my_location
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                          Départ
                        </span>
                        <span className="font-semibold text-xs text-on-surface truncate">
                          {pickupAddress}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2">
                      <span className="material-symbols-outlined text-secondary text-base mt-0.5">
                        domain
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                          Destination
                        </span>
                        <span className="font-semibold text-xs text-on-surface truncate">
                          {destinationFacility}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 1: Fiche d'identité */}
              <div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-2xl shadow-sm flex flex-col gap-space-lg border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Fiche d'identité du Patient
                      </h2>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Données confidentielles sécurisées HDS / ARS
                      </span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm bg-surface-container text-primary px-2.5 py-1 rounded-full font-bold">
                    Requis
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                      Nom de naissance
                    </label>
                    <input
                      className="h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-primary outline-none transition-all shadow-xs"
                      placeholder="Ex. DUPONT"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                      Prénom usuel
                    </label>
                    <input
                      className="h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-primary outline-none transition-all shadow-xs"
                      placeholder="Ex. Jean"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                        Numéro de Sécurité Sociale (NIR)
                      </label>
                      <span className="font-label-sm text-label-sm text-secondary font-bold text-xs">
                        15 chiffres (Clé comprise)
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        className="w-full h-11 px-3 pl-10 pr-10 bg-surface-container-lowest rounded-xl font-mono text-body-md text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-primary outline-none transition-all shadow-xs"
                        maxLength={21}
                        placeholder="1 XX XX XX XXX XXX XX"
                        type="text"
                        required
                        value={nir}
                        onChange={(e) => setNir(e.target.value)}
                      />
                      <span className="material-symbols-outlined text-outline absolute left-3 text-[20px]">
                        badge
                      </span>
                      <span className="material-symbols-outlined text-secondary absolute right-3 text-[20px]">
                        check_circle
                      </span>
                    </div>
                  </div>

                  <PhoneInput
                    id="patientPhone"
                    label="Téléphone portable (SMS suivi)"
                    required
                    value={phone}
                    defaultDialCode="+596"
                    onChange={(full) => {
                      setPhone(full);
                      if (!whatsappPhone || whatsappPhone === phone) {
                        setWhatsappPhone(full);
                      }
                    }}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                      Date de naissance
                    </label>
                    <input
                      className="h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-primary outline-none transition-all shadow-xs"
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* ALD Switch */}
                <div className="p-space-md rounded-xl bg-surface-container-low/60 border border-outline-variant/30 flex items-center justify-between gap-space-md hover:bg-surface-container-low transition-colors">
                  <div className="flex items-start sm:items-center gap-space-sm">
                    <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          Patient bénéficiaire d'une ALD
                        </span>
                        <span className="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
                          Exonération 100%
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 text-xs">
                        Prise en charge intégrale par la Sécurité Sociale / CGSS Martinique au titre de l'ALD 30
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      checked={isAld}
                      onChange={(e) => setIsAld(e.target.checked)}
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                  </label>
                </div>
              </div>

              {/* Card 2: Mobilité & Condition Physique */}
              <div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-2xl shadow-sm flex flex-col gap-space-lg border border-outline-variant/30">
                <div className="flex items-center gap-space-sm">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined">accessible</span>
                  </div>
                  <div className="flex flex-col">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Mobilité &amp; Condition Physique
                    </h2>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                      Précisions pour adapter l'assistance humaine et l'équipement
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                  {[
                    {
                      id: 'assis',
                      title: 'Patient assis autonome',
                      desc: 'Marche sans difficulté majeure, montée autonome dans le véhicule.',
                    },
                    {
                      id: 'marche',
                      title: 'Aide à la marche / Béquilles',
                      desc: "Déplacement lent, soutien d'un ambulancier nécessaire pour s'installer.",
                    },
                    {
                      id: 'fauteuil',
                      title: 'Fauteuil personnel pliable',
                      desc: 'Fauteuil transférable dans le coffre, transfert actif ou semi-aidé.',
                    },
                    {
                      id: 'allonge',
                      title: 'Position allongée stricte',
                      desc: 'Nécessite impérativement ambulance catégorie A ou C avec brancard.',
                    },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setMobility(item.id as any)}
                      className={`cursor-pointer flex items-start gap-space-sm p-space-md rounded-xl transition-all border-2 ${
                        mobility === item.id
                          ? 'bg-surface-container-low border-primary shadow-xs ring-2 ring-primary/20'
                          : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mobility_mode"
                        checked={mobility === item.id}
                        onChange={() => setMobility(item.id as any)}
                        className="mt-1 accent-primary"
                      />
                      <div className="flex flex-col">
                        <span className={`font-label-md text-label-md font-bold ${mobility === item.id ? 'text-primary' : 'text-on-surface'}`}>
                          {item.title}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Additional assistance toggles */}
                <div className="pt-space-sm flex flex-col gap-space-md">
                  {/* Oxygénothérapie */}
                  <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">air</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                          Oxygénothérapie continue
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                          Le patient dispose de sa propre bouteille ou nécessite un appoint embarqué.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        checked={oxygen}
                        onChange={(e) => setOxygen(e.target.checked)}
                        className="sr-only peer"
                        type="checkbox"
                      />
                      <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                  </div>

                  {/* Étage & Ascenseur */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md bg-surface-container-low/50 p-space-md rounded-xl border border-outline-variant/30">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                        Étage du départ (domicile)
                      </label>
                      <select
                        value={floor}
                        onChange={(e) => setFloor(e.target.value)}
                        className="h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 outline-none"
                      >
                        <option>Rez-de-chaussée / Plain-pied</option>
                        <option>1er étage</option>
                        <option>2ème étage</option>
                        <option>3ème étage ou plus</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                        Présence d'ascenseur
                      </label>
                      <div className="grid grid-cols-2 gap-space-xs h-11">
                        <button
                          type="button"
                          onClick={() => setHasElevator(false)}
                          className={`rounded-xl font-label-md text-label-md transition-colors ${
                            !hasElevator
                              ? 'bg-primary text-on-primary font-bold'
                              : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                          }`}
                        >
                          Non
                        </button>
                        <button
                          type="button"
                          onClick={() => setHasElevator(true)}
                          className={`rounded-xl font-label-md text-label-md transition-colors ${
                            hasElevator
                              ? 'bg-primary text-on-primary font-bold'
                              : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                          }`}
                        >
                          Oui (conforme)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Accompagnateur */}
                  <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-low border border-outline-variant/30">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[18px]">group</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                          Accompagnateur autorisé
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                          Autorisé si enfant mineur ou mention expresse portée sur la PMT.
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        checked={hasCompanion}
                        onChange={(e) => setHasCompanion(e.target.checked)}
                        className="sr-only peer"
                        type="checkbox"
                      />
                      <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 3: Prescription Médicale de Transport (PMT) */}
              <div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-2xl shadow-sm flex flex-col gap-space-lg border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Prescription Médicale de Transport (PMT)
                      </h2>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Condition indispensable pour le Tiers-Payant Sécurité Sociale
                      </span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full font-bold">
                    100% Remboursé
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasPmt('already')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-label-md text-xs font-bold transition-all border ${
                      hasPmt === 'already'
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    J'ai déjà mon bon de transport
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPmt('later')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-label-md text-xs font-bold transition-all border ${
                      hasPmt === 'later'
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    Le médecin me le remettra à l'hôpital
                  </button>
                </div>

                {hasPmt === 'already' && (
                  <div className="pt-space-xs">
                    <FileUpload
                      label="Prescription Médicale de Transport (Cerfa S3138 / PMT)"
                      helpText="Prenez en photo votre bon de transport Cerfa ou téléversez votre document numérique (PDF, JPEG, PNG)"
                      storageKey="booking_pmt_document"
                      onDocumentChange={(doc) => setUploadedPmtDoc(doc)}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                      Motif de la prise en charge
                    </label>
                    <select
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      className="h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 outline-none"
                    >
                      <option>Consultation spécialisée / Bilan</option>
                      <option>Séance d'Hémodialyse / Chimiothérapie (ALD)</option>
                      <option>Sortie d'hospitalisation / Convalescence</option>
                      <option>Séance de Radiothérapie</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                      Médecin prescripteur / Service
                    </label>
                    <input
                      type="text"
                      value={doctor}
                      onChange={(e) => setDoctor(e.target.value)}
                      className="h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Automatisation & Notifications WhatsApp */}
              <div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-2xl shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[24px]">chat</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          Suivi &amp; Alertes Automatiques WhatsApp
                        </h2>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Recommandé 972
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Suivi d'approche du véhicule, coordonnées chauffeur et récapitulatif direct sur WhatsApp
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      checked={whatsappOptIn}
                      onChange={(e) => setWhatsappOptIn(e.target.checked)}
                      className="sr-only peer"
                      type="checkbox"
                    />
                    <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {whatsappOptIn && (
                  <div className="flex flex-col gap-space-md pt-space-xs animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md items-center">
                      <PhoneInput
                        id="whatsappPhone"
                        label="Numéro WhatsApp (Alertes temps-réel)"
                        variant="whatsapp"
                        value={whatsappPhone}
                        defaultDialCode="+596"
                        onChange={(full) => setWhatsappPhone(full)}
                      />

                      <div className="bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-xl flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                          <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                          3 notifications automatiques programmées :
                        </div>
                        <ul className="text-emerald-800/90 text-[11px] list-disc list-inside space-y-0.5">
                          <li>Confirmation immédiate de prise en charge</li>
                          <li>Attribution du transporteur &amp; immatriculation</li>
                          <li>Alerte départ 15 min avant arrivée avec lien GPS live</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-surface-container-low p-space-sm rounded-xl border border-outline-variant/20 text-xs">
                      <span className="text-on-surface-variant text-[11px]">
                        Tester immédiatement le lien WhatsApp direct :
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          whatsappService.openWhatsAppDirect(
                            whatsappPhone || phone,
                            'BOOKING_CONFIRMATION',
                            {
                              patientName: `${firstName} ${lastName}`,
                              bookingRef: 'MT-972-SIMUL',
                              pickupAddress,
                              facilityName: destinationFacility,
                              transportType: transportType.toUpperCase(),
                              pickupTime: transportTime,
                              pickupDate: transportDate,
                            }
                          );
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 transition-all shadow-xs"
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                        <span>Tester notification WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Sticky Ride Recap Card & Dispatch Button */}
            <aside className="lg:col-span-5 flex flex-col gap-space-md lg:sticky lg:top-24">
              <div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-2xl shadow-lg flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex items-center justify-between pb-space-xs">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Récapitulatif Course
                  </h3>
                  <span className="font-label-sm text-label-sm bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-xs">
                    En direct
                  </span>
                </div>

                {/* Real Interactive Google Maps Route Card */}
                <div className="flex flex-col rounded-2xl overflow-hidden bg-surface-container-low shadow-sm border border-outline-variant/30">
                  <div className="w-full h-44 relative">
                    <GoogleMapView
                      mode="route"
                      origin={pickupAddress}
                      destination={destinationFacility}
                      height="100%"
                    />
                  </div>

                  <div className="p-space-md flex flex-col gap-space-sm bg-surface-container-lowest border-t border-outline-variant/20">
                    <div className="flex items-start gap-space-sm">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">home</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                          Départ (Prise en charge)
                        </span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate text-xs">
                          {pickupAddress}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-space-sm">
                      <div className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">local_hospital</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                          Destination
                        </span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold truncate text-xs">
                          {destinationFacility}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Pills */}
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="p-space-sm bg-surface-container-low rounded-xl flex flex-col gap-0.5 border border-outline-variant/30">
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                      Date &amp; Heure
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-bold text-xs">
                      {transportDate}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      {transportTime}
                    </span>
                  </div>

                  <div className="p-space-sm bg-surface-container-low rounded-xl flex flex-col gap-0.5 border border-outline-variant/30">
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                      Type de Véhicule
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-bold text-xs capitalize">
                      {transportType === 'taxi'
                        ? 'Taxi Conventionné'
                        : transportType === 'ambulance'
                        ? 'Ambulance A/C'
                        : 'VSL Sanitaire Léger'}
                    </span>
                    <span className="font-body-sm text-body-sm text-secondary font-semibold text-xs">
                      {ridePricing.distanceKm} km • ~{ridePricing.durationMinutes} min
                    </span>
                  </div>
                </div>

                {/* Official CPAM Tariffs & Tiers Payant breakdown */}
                <div className="p-space-md rounded-2xl bg-surface-container-low/80 flex flex-col gap-space-xs border border-outline-variant/30 text-xs shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
                    <span className="font-bold text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">receipt_long</span>
                      Tarif Conventionné CPAM 972
                    </span>
                    <span className="font-extrabold text-on-surface font-mono text-sm text-primary">
                      {ridePricing.totalPrestation.toFixed(2)} €
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-on-surface-variant pt-1">
                    <span>Forfait départemental Martinique</span>
                    <span className="font-mono">{ridePricing.baseForfait.toFixed(2)} €</span>
                  </div>

                  <div className="flex justify-between items-center text-on-surface-variant">
                    <span>Distance ({ridePricing.distanceKm} km × {ridePricing.distanceTarifKm.toFixed(2)} €/km)</span>
                    <span className="font-mono">{ridePricing.distanceAmount.toFixed(2)} €</span>
                  </div>

                  {ridePricing.surcharges.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-amber-700">
                      <span>{s.label}</span>
                      <span className="font-mono">+{s.amount.toFixed(2)} €</span>
                    </div>
                  ))}

                  <div className="pt-1 border-t border-outline-variant/20 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary font-semibold">
                        Part Assurance Maladie ({ridePricing.cpamCoveragePercent}%)
                      </span>
                      <span className="font-bold text-secondary font-mono">
                        -{ridePricing.cpamAmount.toFixed(2)} €
                      </span>
                    </div>

                    {!isAld && (
                      <div className="flex justify-between items-center text-on-surface-variant">
                        <span>Part Mutuelle / Complémentaire (35%)</span>
                        <span className="font-mono">-{ridePricing.mutuelleAmount.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-space-xs flex justify-between items-center border-t border-outline-variant/30 mt-1">
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold text-xs">
                        Reste à charge patient
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Tiers-payant intégral activé
                      </span>
                    </div>
                    <span className="font-headline-lg text-headline-lg text-emerald-700 font-bold text-2xl font-mono">
                      0,00 €
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex flex-col gap-space-sm pt-space-xs">
                  <button
                    disabled={isSubmitting}
                    className="w-full h-14 bg-primary hover:bg-primary-container active:scale-[0.99] transition-all text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-sm shadow-lg shadow-primary/20 hover:scale-[1.01]"
                    type="submit"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Diffusion en cours...
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[24px]">send</span>
                        <span>Diffuser ma demande aux transporteurs</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-start gap-space-xs p-space-sm bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                      radar
                    </span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed text-xs">
                      <strong className="text-on-surface">Diffusion instantanée :</strong> Alerte
                      transmise par SMS et console télématique aux{' '}
                      <span className="text-primary font-bold">professionnels certifiés</span> du secteur.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};
