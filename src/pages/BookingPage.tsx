import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { FileUpload, UploadedFile } from '../components/FileUpload';
import { PhoneInput } from '../components/PhoneInput';
import { GoogleMapView } from '../components/GoogleMapView';
import { rideService, getTransporterDepartment } from '../services/rideService';
import { extractDepartmentFromAddress } from '../services/addressService';
import { calculateMedicalRidePricing } from '../services/pricingService';
import { TransportType, Transporter } from '../types';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../contexts/AuthContext';
import { NirInput } from '../components/NirInput';
import { validateNir, autoFixNir } from '../utils/nirValidator';
import { CPAM_TRANSPORT_MOTIFS } from '../data/cpamMotifs';
import { useAiChat, FormDraftData } from '../context/AiChatContext';

export const BookingPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { openChat, consumePendingDraft } = useAiChat();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirection automatique si le visiteur tente d'accéder à la réservation sans être authentifié
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      navigate('/connexion', {
        replace: true,
        state: {
          from: { pathname: '/reserver' },
          requiredRole: 'PATIENT',
          isBookingFlow: true,
          mode: 'REGISTER',
          message: 'Pour finaliser votre réservation de transport sanitaire et bénéficier du tiers-payant CPAM, veuillez créer votre compte ou vous connecter.'
        }
      });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

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
  const initialPickup = stateData.pickupAddress || storedDraft.pickupAddress || user?.address || 'Résidence Les Alizés, Cluny, Schoelcher';
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

  // Synchronisation avec l'adresse du profil utilisateur dès son chargement
  useEffect(() => {
    if (user?.address && !stateData.pickupAddress && !storedDraft.pickupAddress) {
      setPickupAddress(user.address);
    }
  }, [user?.address]);

  // Form states - Rendez-vous & Récurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDates, setRecurringDates] = useState<string[]>([initialDate]);
  const [newDateInput, setNewDateInput] = useState('');

  const handleAddRecurringDate = () => {
    if (!newDateInput) return;
    if (!recurringDates.includes(newDateInput)) {
      const updated = [...recurringDates, newDateInput].sort();
      setRecurringDates(updated);
      setNewDateInput('');
    }
  };

  const handleRemoveRecurringDate = (dateToRemove: string) => {
    if (recurringDates.length <= 1) return;
    setRecurringDates(recurringDates.filter((d) => d !== dateToRemove));
  };

  const handleApplyPreset = (type: 'dialyse' | 'semaine') => {
    const base = new Date(transportDate);
    const dates: string[] = [];
    if (type === 'dialyse') {
      for (let i = 0; i < 3; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i * 2);
        dates.push(d.toISOString().slice(0, 10));
      }
    } else {
      for (let i = 0; i < 5; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
      }
    }
    setRecurringDates(dates);
    setIsRecurring(true);
  };

  // Form states - Patient & Médical
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [guestEmail, setGuestEmail] = useState('');
  const [nir, setNir] = useState(() => {
    const raw = user?.nir || '';
    if (!raw) return '';
    const val = validateNir(raw);
    if (!val.isValid && val.canAutoCalculateKey) {
      return autoFixNir(raw);
    }
    return raw;
  });
  // NIR optionnel : Ne bloque jamais si non renseigné
  const nirValidation = useMemo(() => {
    if (!nir.trim()) {
      return { isValid: true, errorMessage: undefined, canAutoCalculateKey: false };
    }
    return validateNir(nir);
  }, [nir]);
  const isNirInvalid = nir.trim().length > 0 && !nirValidation.isValid;
  const [nirSubmitAttempted, setNirSubmitAttempted] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthDate, setBirthDate] = useState('1980-01-01');
  const [isAld, setIsAld] = useState(true);
  const [mobility, setMobility] = useState<'assis' | 'marche' | 'fauteuil' | 'allonge'>('assis');
  const [oxygen, setOxygen] = useState(false);

  // Adaptation automatique du véhicule selon les contraintes réglementaires CPAM
  const handleMobilityChange = (newMobility: 'assis' | 'marche' | 'fauteuil' | 'allonge') => {
    setMobility(newMobility);
    if (newMobility === 'allonge' || oxygen) {
      setTransportType('ambulance');
    } else if (newMobility === 'fauteuil' || newMobility === 'marche') {
      setTransportType('vsl');
    } else if (newMobility === 'assis') {
      if (transportType === 'ambulance') {
        setTransportType('vsl');
      }
    }
  };

  const handleOxygenChange = (newOxygen: boolean) => {
    setOxygen(newOxygen);
    if (newOxygen || mobility === 'allonge') {
      setTransportType('ambulance');
    } else if (mobility === 'fauteuil' || mobility === 'marche') {
      setTransportType('vsl');
    } else if (mobility === 'assis') {
      if (transportType === 'ambulance') {
        setTransportType('vsl');
      }
    }
  };
  const [floor, setFloor] = useState('Rez-de-chaussée / Plain-pied');
  const [hasElevator, setHasElevator] = useState(true);
  const [hasCompanion, setHasCompanion] = useState(true);
  const [hasPmt, setHasPmt] = useState<'already' | 'later'>('already');
  const [uploadedPmtDoc, setUploadedPmtDoc] = useState<UploadedFile | null>(null);
  const [motif, setMotif] = useState(CPAM_TRANSPORT_MOTIFS[1].options[0].value);
  const [doctor, setDoctor] = useState('Dr. J-M Lafontaine - Oncologie CHU');
  const handleMotifChange = (newMotif: string) => {
    setMotif(newMotif);
    const found = CPAM_TRANSPORT_MOTIFS.flatMap((c) => c.options).find((o) => o.value === newMotif);
    if (found?.isAldOrExonere) {
      setIsAld(true);
    }
  };
  
  // Attribution directe nominative (délai 24h) ou diffusion générale (pot commun)
  const [transportersList, setTransportersList] = useState<Transporter[]>([]);
  const [selectedTransporterId, setSelectedTransporterId] = useState<string>('');

  useEffect(() => {
    rideService.getAllTransporters().then((list) => {
      const active = list.filter((t) => t.verified !== false && t.status !== 'SUSPENDED');
      setTransportersList(active);
    });
  }, []);

  // Détection du département patient depuis l'adresse de départ ou de destination ou profil utilisateur
  const patientDept = useMemo(() => {
    const fromPickup = extractDepartmentFromAddress(pickupAddress);
    if (fromPickup) return fromPickup;
    if (user?.address) {
      const fromUser = extractDepartmentFromAddress(user.address);
      if (fromUser) return fromUser;
    }
    const fromDest = extractDepartmentFromAddress(destinationFacility);
    if (fromDest) return fromDest;
    return '972';
  }, [pickupAddress, user?.address, destinationFacility]);

  const deptLabel = useMemo(() => {
    const names: Record<string, string> = {
      '31': 'Haute-Garonne (31)',
      '33': 'Gironde (33)',
      '34': 'Hérault (34)',
      '75': 'Paris (75)',
      '92': 'Hauts-de-Seine (92)',
      '93': 'Seine-Saint-Denis (93)',
      '94': 'Val-de-Marne (94)',
      '77': 'Seine-et-Marne (77)',
      '78': 'Yvelines (78)',
      '91': 'Essonne (91)',
      '95': "Val-d'Oise (95)",
      '69': 'Rhône (69)',
      '13': 'Bouches-du-Rhône (13)',
      '59': 'Nord (59)',
      '44': 'Loire-Atlantique (44)',
      '67': 'Bas-Rhin (67)',
      '35': 'Ille-et-Vilaine (35)',
      '06': 'Alpes-Maritimes (06)',
      '971': 'Guadeloupe (971)',
      '972': 'Martinique (972)',
      '973': 'Guyane (973)',
      '974': 'La Réunion (974)',
      '976': 'Mayotte (976)',
    };
    return names[patientDept] || `Secteur ${patientDept}`;
  }, [patientDept]);

  // Filtrage strict des compagnies de transport conventionnées du département du patient
  const departmentTransporters = useMemo(() => {
    const list = transportersList.filter((t) => getTransporterDepartment(t) === patientDept);
    // Si aucun transporteur spécifique n'est encore enregistré pour ce département,
    // on replie sur l'ensemble pour garantir le service tout en informant le patient
    if (list.length === 0) {
      return transportersList;
    }
    return list;
  }, [transportersList, patientDept]);

  // Réinitialisation automatique du choix direct si le département de prise en charge change
  useEffect(() => {
    if (selectedTransporterId) {
      const isValidInDept = departmentTransporters.some((t) => t.id === selectedTransporterId);
      if (!isValidInDept) {
        setSelectedTransporterId('');
      }
    }
  }, [patientDept, departmentTransporters, selectedTransporterId]);

  const selectedTransporter = useMemo(() => {
    if (!selectedTransporterId) return null;
    return departmentTransporters.find((t) => t.id === selectedTransporterId) || transportersList.find((t) => t.id === selectedTransporterId) || null;
  }, [selectedTransporterId, departmentTransporters, transportersList]);

  // Consommation automatique d'un brouillon pré-rempli par Eva
  useEffect(() => {
    const draft = consumePendingDraft();
    if (draft) {
      if (draft.transportType) setTransportType(draft.transportType);
      if (draft.pickupAddress) setPickupAddress(draft.pickupAddress);
      if (draft.destinationFacility) setDestinationFacility(draft.destinationFacility);
      if (draft.transportDate) setTransportDate(draft.transportDate);
      if (draft.transportTime) setTransportTime(draft.transportTime);
      if (draft.patientNir) setNir(draft.patientNir);
      if (draft.mobility) setMobility(draft.mobility);
      if (draft.oxygen !== undefined) setOxygen(draft.oxygen);
      if (draft.hasCompanion !== undefined) setHasCompanion(draft.hasCompanion);
      if (draft.isAld !== undefined) setIsAld(draft.isAld);
    }
  }, [consumePendingDraft]);

  const [liveUpdatedFields, setLiveUpdatedFields] = useState<string | null>(null);

  // Synchronisation directe et instantanée des champs au fil de la conversation avec Eva
  useEffect(() => {
    const handleDirectUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<FormDraftData>;
      const draft = customEvent.detail;
      if (!draft) return;

      const updatedNames: string[] = [];
      if (draft.transportType) {
        setTransportType(draft.transportType);
        updatedNames.push('Mode ' + draft.transportType.toUpperCase());
      }
      if (draft.mobility) {
        setMobility(draft.mobility);
      }
      if (draft.oxygen !== undefined) {
        setOxygen(draft.oxygen);
      }
      if (draft.pickupAddress) {
        setPickupAddress(draft.pickupAddress);
        updatedNames.push('Départ (' + draft.pickupAddress.split(',')[0] + ')');
      }
      if (draft.destinationFacility) {
        setDestinationFacility(draft.destinationFacility);
        updatedNames.push('Destination (' + draft.destinationFacility.split('-')[0].trim() + ')');
      }
      if (draft.transportDate) {
        setTransportDate(draft.transportDate);
        updatedNames.push('Date (' + draft.transportDate + ')');
      }
      if (draft.transportTime) {
        setTransportTime(draft.transportTime);
        updatedNames.push('Heure (' + draft.transportTime + ')');
      }
      if (draft.patientNir) {
        setNir(draft.patientNir);
        updatedNames.push('NIR');
      }
      if (draft.hasCompanion !== undefined) {
        setHasCompanion(draft.hasCompanion);
      }
      if (draft.isAld !== undefined) {
        setIsAld(draft.isAld);
      }

      if (updatedNames.length > 0) {
        setLiveUpdatedFields(updatedNames.join(', '));
        setTimeout(() => setLiveUpdatedFields(null), 6000);
      }
    };

    window.addEventListener('medictrans:direct_form_update', handleDirectUpdate);
    return () => {
      window.removeEventListener('medictrans:direct_form_update', handleDirectUpdate);
    };
  }, []);

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

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.phone) {
        setPhone(user.phone);
      }
      if (user.nir) {
        const val = validateNir(user.nir);
        if (!val.isValid && val.canAutoCalculateKey) {
          setNir(autoFixNir(user.nir));
        } else {
          setNir(user.nir);
        }
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si un NIR est renseigné, validation de conformité
    let currentNir = nir.trim();
    if (currentNir) {
      if (!nirValidation.isValid && nirValidation.canAutoCalculateKey) {
        currentNir = autoFixNir(currentNir);
        setNir(currentNir);
      } else if (!nirValidation.isValid) {
        setNirSubmitAttempted(true);
        const el = document.getElementById('patientNir');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
        return;
      }
    }

    setIsSubmitting(true);

    const deptMatch = (pickupAddress + ' ' + destinationFacility).match(/\b(97[1-8]|2[ABab]|0[1-9]|[1-8]\d|9[0-5])\d{3}\b/);
    const deptCode = deptMatch ? deptMatch[1] : 'FR';
    const finalRef = `MT-${deptCode}-${Math.floor(1000 + Math.random() * 9000)}`;

    const zipMatch = pickupAddress.match(/\b\d{5}\b/);
    const detectedPostal = zipMatch ? zipMatch[0] : (deptMatch ? `${deptMatch[1]}000` : '75000');

    try {
      const createdRide = await rideService.createRide({
        pickupAddress,
        pickupCity: pickupAddress.includes(',') ? pickupAddress.split(',')[1].trim() : 'Domicile',
        dropoffAddress: destinationFacility,
        dropoffCity: destinationFacility.includes(',') ? destinationFacility.split(',')[1].trim() : 'Centre de soins',
        facilityName: destinationFacility,
        pickupDateTime: `${transportDate}T${transportTime}:00`,
        isRoundTrip: true,
        returnDateTime: `${transportDate}T17:00:00`,
        transportType: transportType === 'taxi' ? 'TAXI_CONVENTIONNE' : transportType === 'ambulance' ? 'AMBULANCE' : 'VSL',
        patient: {
          firstName,
          lastName,
          birthDate,
          nir: currentNir || undefined,
          phone,
          email: user?.email || guestEmail || `${firstName.toLowerCase().replace(/\s+/g, '')}@example.fr`,
          address: pickupAddress,
          city: pickupAddress.includes(',') ? pickupAddress.split(',')[1].trim() : 'Ville',
          postalCode: detectedPostal,
          isAld,
          hasPmt: hasPmt === 'already' && !!uploadedPmtDoc,
          pmtUploaded: hasPmt === 'already' && !!uploadedPmtDoc,
          pmtFileName: uploadedPmtDoc?.name,
          pmtFileUrl: uploadedPmtDoc?.dataUrl,
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
        appointmentTime: transportTime,
        isRecurring,
        recurringDates: isRecurring ? recurringDates : undefined,
        pricing: ridePricing,
        isDirectRequest: !!selectedTransporter,
        targetTransporterId: selectedTransporter?.id,
        targetTransporterName: selectedTransporter?.companyName,
      });

      const actualRef = createdRide?.reference || finalRef;
      const bookingRecord = {
        ref: actualRef,
        pickupAddress,
        destinationFacility,
        transportType,
        transportDate,
        transportTime,
        appointmentTime: transportTime,
        isRecurring,
        recurringDates: isRecurring ? recurringDates : undefined,
        patientName: `${firstName} ${lastName}`,
        nir: currentNir,
        phone,
        uploadedPmtDoc,
        isDirectRequest: !!selectedTransporter,
        targetTransporterId: selectedTransporter?.id,
        targetTransporterName: selectedTransporter?.companyName,
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
        appointmentTime: transportTime,
        isRecurring,
        recurringDates: isRecurring ? recurringDates : undefined,
        patientName: `${firstName} ${lastName}`,
        nir: currentNir,
        phone,
        uploadedPmtDoc,
        isDirectRequest: !!selectedTransporter,
        targetTransporterId: selectedTransporter?.id,
        targetTransporterName: selectedTransporter?.companyName,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500 font-semibold">
              Vérification de la session en cours...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFD] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500 font-semibold">
              Redirection vers la page de connexion...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary flex flex-col">
      <Header />
      <SEOHead
        title="Réservation Transport Sanitaire | Ambulance, VSL & Taxi CPAM (France & DOM)"
        description="Réservez en ligne votre transport médical partout en France hexagonale et dans les DOM : Ambulance conventionnée, VSL sanitaire léger ou Taxi conventionné CPAM. Calcul de trajet et tiers-payant 100%."
        canonicalPath="/reserver"
        ogImage="/assets/medictrans_hero_discover.jpg"
      />

      <main className="w-full pt-4 sm:pt-6 bg-surface flex-1">
        {/* Step Indicator Header */}
        <section className="w-full bg-slate-50/80 py-5 shadow-xs border-b border-slate-200/80">
          <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="flex flex-col">
                <span className="text-[11px] text-teal-700 uppercase tracking-widest font-bold">
                  Demande Réf. MT-972-8821
                </span>
                <h1 className="text-slate-900 tracking-tight font-extrabold text-2xl md:text-3xl">
                  Réservation de Transport Sanitaire
                </h1>
              </div>

              <div className="flex items-center gap-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </span>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-[11px] text-teal-700 font-bold">Étape 1</span>
                    <span className="text-xs font-semibold text-slate-700">Trajet &amp; Véhicule</span>
                  </div>
                </div>

                <div className="w-8 md:w-12 h-0.5 bg-teal-600/40 rounded-full"></div>

                <div className="flex items-center gap-space-xs">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    2
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-900 font-bold">Étape active</span>
                    <span className="text-xs font-bold text-slate-900">Patient &amp; PMT</span>
                  </div>
                </div>

                <div className="w-8 md:w-12 h-0.5 bg-slate-200 rounded-full"></div>

                <div className="flex items-center gap-space-xs opacity-50">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs">
                    3
                  </span>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-[11px] text-slate-500 font-medium">Étape 3</span>
                    <span className="text-xs font-medium text-slate-500">Confirmation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-xl w-full flex flex-col gap-6">
          {/* Toast de confirmation en direct lorsqu'Eva modifie un champ */}
          {liveUpdatedFields && (
            <aside
              aria-label="Notification de mise à jour automatique"
              className="fixed top-24 right-4 sm:right-8 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-300/40 animate-fadeIn"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg animate-spin">sync</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight">
                  ⚡ Mise à jour automatique appliquée
                </span>
                <span className="text-[11px] text-emerald-100 leading-tight mt-0.5">
                  Champs renseignés : {liveUpdatedFields}
                </span>
              </div>
            </aside>
          )}

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
                        Suggestions Google Maps &amp; Répertoire Hospitalier National &amp; DOM
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
                      referenceAddress={destinationFacility}
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
                      defaultFilter="ALL"
                      helperText="Tous les CHU, hôpitaux, cliniques et centres de soins"
                      allowManualEntry={true}
                      showCategories={true}
                      showQuickCommunes={false}
                      referenceAddress={pickupAddress}
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

              {/* Card 0-bis: Date du transport, Heure du rendez-vous médical & Récurrence */}
              <div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-2xl shadow-sm flex flex-col gap-space-lg border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Rendez-vous Médical &amp; Programmation
                      </h2>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Heure de votre convocation et options de transports récurrents
                      </span>
                    </div>
                  </div>
                  <span className="font-label-sm text-label-sm bg-surface-container text-primary px-2.5 py-1 rounded-full font-bold">
                    Ponctualité garantie
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  {/* Date du transport */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="bookingTransportDate"
                      className="font-label-md text-label-md text-on-surface font-semibold text-xs flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
                      <span>Date du premier transport</span>
                      <span className="text-error ml-0.5">*</span>
                    </label>
                    <input
                      id="bookingTransportDate"
                      className="h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-primary outline-none transition-all shadow-xs"
                      type="date"
                      required
                      value={transportDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setTransportDate(newDate);
                        if (!isRecurring) {
                          setRecurringDates([newDate]);
                        } else if (!recurringDates.includes(newDate)) {
                          setRecurringDates([newDate, ...recurringDates.slice(1)]);
                        }
                      }}
                    />
                  </div>

                  {/* Heure de rendez-vous médical */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="bookingAppointmentTime"
                      className="font-label-md text-label-md text-on-surface font-semibold text-xs flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm text-primary">alarm</span>
                      <span>Heure de votre rendez-vous médical</span>
                      <span className="text-error ml-0.5">*</span>
                    </label>
                    <input
                      id="bookingAppointmentTime"
                      className="h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-primary outline-none transition-all shadow-xs text-center font-bold"
                      type="time"
                      required
                      value={transportTime}
                      onChange={(e) => setTransportTime(e.target.value)}
                    />
                  </div>

                  {/* Bannière explicative obligatoire pour le client */}
                  <div className="md:col-span-2 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-on-surface flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">info</span>
                    <div className="leading-relaxed">
                      <strong className="text-primary font-bold">Rappel ponctualité :</strong> Veuillez indiquer ci-dessus l'<strong>heure de votre convocation médicale</strong> à l'établissement ou chez le spécialiste. Votre transporteur sanitaire calculera automatiquement l'<strong>heure de prise en charge à votre domicile</strong> en fonction de la durée du trajet et de la circulation, et vous la notifiera dès acceptation de la course.
                    </div>
                  </div>
                </div>

                {/* Section Transports Récurrents */}
                <div className="p-space-md rounded-xl bg-surface-container-low/60 border border-outline-variant/30 flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg">event_repeat</span>
                      <div>
                        <span className="font-bold text-xs text-on-surface block">
                          Transport Récurrent / Série de soins
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          Dialyse (3x/semaine), chimiothérapie, radiothérapie, rééducation SSR...
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="isRecurringToggle"
                        checked={isRecurring}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsRecurring(checked);
                          if (checked && !recurringDates.includes(transportDate)) {
                            setRecurringDates([transportDate]);
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                    </label>
                  </div>

                  {isRecurring && (
                    <div className="mt-2 pt-3 border-t border-outline-variant/20 flex flex-col gap-3 animate-fadeIn">
                      <p className="text-xs text-on-surface-variant">
                        Sélectionnez les dates des transports pour planifier l'ensemble de vos séances régulières :
                      </p>

                      {/* Raccourcis rapides de récurrence */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-on-surface-variant">Raccourcis :</span>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('dialyse')}
                          className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-semibold text-secondary hover:bg-surface-container-high border border-outline-variant/30 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">healing</span>
                          <span>Série Dialyse (3 séances)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('semaine')}
                          className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-semibold text-primary hover:bg-surface-container-high border border-outline-variant/30 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">date_range</span>
                          <span>Semaine continue (5 jours)</span>
                        </button>
                      </div>

                      {/* Sélecteur d'ajout de date individuelle */}
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={newDateInput}
                          onChange={(e) => setNewDateInput(e.target.value)}
                          className="h-10 px-3 bg-surface-container-lowest rounded-xl font-body-sm text-body-sm text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-primary outline-none transition-all shadow-xs text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddRecurringDate}
                          disabled={!newDateInput}
                          className="px-3 py-2 rounded-xl bg-secondary text-white font-bold text-xs hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          <span>Ajouter cette date</span>
                        </button>
                      </div>

                      {/* Liste des badges de dates programmées */}
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-on-surface">
                            {recurringDates.length} date(s) de transport sélectionnée(s) :
                          </span>
                          <span className="text-[11px] text-secondary font-semibold">
                            Tous vos trajets seront confirmés
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {recurringDates.map((dateStr, idx) => (
                            <div
                              key={dateStr}
                              className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-secondary/30 text-secondary text-xs font-semibold flex items-center gap-2 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-xs">event</span>
                              <span>
                                Séance #{idx + 1} : {new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                              {recurringDates.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRecurringDate(dateStr)}
                                  className="text-on-surface-variant hover:text-error ml-1"
                                  title="Retirer cette date"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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

                  <NirInput
                    id="patientNir"
                    label="Numéro de Sécurité Sociale (NIR) (Optionnel)"
                    value={nir}
                    required={false}
                    onChange={(formattedVal) => setNir(formattedVal)}
                    className="md:col-span-2"
                  />

                  <PhoneInput
                    id="patientPhone"
                    label="Téléphone portable"
                    required
                    value={phone}
                    defaultDialCode="+33"
                    showValidation={false}
                    onChange={(full) => setPhone(full)}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="patientBirthDate"
                      className="font-label-md text-label-md text-on-surface font-semibold text-xs flex items-center h-5"
                    >
                      Date de naissance <span className="text-error ml-1">*</span>
                    </label>
                    <input
                      id="patientBirthDate"
                      className="w-full h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-primary outline-none transition-all shadow-xs"
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label
                      htmlFor="patientEmailInput"
                      className="font-label-md text-label-md text-on-surface font-semibold text-xs flex items-center justify-between"
                    >
                      <span>Adresse e-mail (pour confirmation &amp; suivi en direct)</span>
                      <span className="text-primary text-[11px] font-medium">{user?.email ? 'Compte connecté' : 'Notification en temps réel'}</span>
                    </label>
                    <input
                      id="patientEmailInput"
                      className="w-full h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 focus:ring-2 focus:ring-primary outline-none transition-all shadow-xs"
                      placeholder="nom.prenom@email.com"
                      type="email"
                      value={user?.email || guestEmail}
                      disabled={!!user?.email}
                      onChange={(e) => setGuestEmail(e.target.value)}
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
                        Prise en charge intégrale par l'Assurance Maladie (CPAM / CGSS) au titre de l'ALD 30
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
                      onClick={() => handleMobilityChange(item.id as any)}
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
                        onChange={() => handleMobilityChange(item.id as any)}
                        className="mt-1 accent-primary"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-label-md text-label-md font-bold ${mobility === item.id ? 'text-primary' : 'text-on-surface'}`}>
                            {item.title}
                          </span>
                          {item.id === 'allonge' && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded-full">
                              Ambulance
                            </span>
                          )}
                          {(item.id === 'fauteuil' || item.id === 'marche') && (
                            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold px-1.5 py-0.2 rounded-full">
                              VSL
                            </span>
                          )}
                        </div>
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
                  <div className={`flex items-center justify-between p-space-md rounded-xl border transition-all ${
                    oxygen
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-xs'
                      : 'bg-surface-container-low border-outline-variant/30'
                  }`}>
                    <div className="flex items-center gap-space-sm">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        oxygen ? 'bg-amber-500 text-white' : 'bg-surface-container-highest text-primary'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">air</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                            Oxygénothérapie continue
                          </span>
                          {oxygen && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold border border-amber-400">
                              Ambulance requise
                            </span>
                          )}
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                          Le patient dispose de sa propre bouteille ou nécessite un appoint embarqué (Impose une ambulance).
                        </span>
                      </div>
                    </div>
                    <label htmlFor="oxygenToggle" className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="oxygenToggle"
                        checked={oxygen}
                        onChange={(e) => handleOxygenChange(e.target.checked)}
                        className="sr-only peer"
                        type="checkbox"
                      />
                      <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
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

                  {/* Résultat de l'adaptation automatique du véhicule */}
                  <div className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    transportType === 'ambulance'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-950'
                      : 'bg-primary/10 border-primary/20 text-on-surface'
                  }`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      transportType === 'ambulance' ? 'bg-amber-600 text-white' : 'bg-primary text-white'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {transportType === 'ambulance' ? 'emergency' : transportType === 'vsl' ? 'airport_shuttle' : 'local_taxi'}
                      </span>
                    </div>
                    <div className="flex flex-col text-xs min-w-0">
                      <div className="flex items-center gap-2 flex-wrap font-bold">
                        <span>Véhicule sélectionné : {
                          transportType === 'ambulance' ? 'Ambulance de soins (Catégorie A/C)' :
                          transportType === 'vsl' ? 'VSL (Véhicule Sanitaire Léger)' : 'Taxi Conventionné CPAM'
                        }</span>
                        {(mobility === 'allonge' || oxygen) ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-400 font-extrabold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">lock</span>
                            Ambulance obligatoire
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">check</span>
                            Conforme mobilité
                          </span>
                        )}
                      </div>
                      <p className="text-on-surface-variant text-[11px] mt-0.5 leading-relaxed">
                        {transportType === 'ambulance' && (mobility === 'allonge' || oxygen)
                          ? `Réglementation Sécurité Sociale (art. R. 322-10) : ${[
                              mobility === 'allonge' && 'la position allongée stricte sur brancard',
                              oxygen && "l'oxygénothérapie continue"
                            ].filter(Boolean).join(' et ')} impose${(mobility === 'allonge' && oxygen) ? 'nt' : ''} impérativement une ambulance médicalisée avec équipage qualifié.`
                          : transportType === 'vsl' && (mobility === 'fauteuil' || mobility === 'marche')
                          ? `Prise en charge adaptée : ${mobility === 'fauteuil' ? 'le fauteuil roulant pliable' : "l'aide à la marche"} requiert un transport en VSL avec assistance d'un ambulancier.`
                          : "Véhicule adapté pour patient autonome assis sans assistance brancard."}
                      </p>
                    </div>
                  </div>

                  {/* Sélecteur de véhicule interactif avec verrouillage réglementaire */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
                    <span className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                      Type de transport sanitaire conventionné
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Option 1: Taxi conventionné */}
                      <button
                        type="button"
                        disabled={mobility === 'allonge' || oxygen}
                        onClick={() => setTransportType('taxi')}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                          transportType === 'taxi'
                            ? 'bg-white border-teal-600 ring-2 ring-teal-500/20 shadow-md card-silky'
                            : (mobility === 'allonge' || oxygen)
                            ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs card-silky-subtle'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="material-symbols-outlined text-teal-700 text-xl">local_taxi</span>
                          {transportType === 'taxi' ? (
                            <span className="material-symbols-outlined text-teal-700 text-base">check_circle</span>
                          ) : (mobility === 'allonge' || oxygen) ? (
                            <span className="material-symbols-outlined text-slate-400 text-sm" title="Incompatible avec position allongée ou oxygène">lock</span>
                          ) : null}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">Taxi Conventionné</div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Patient assis autonome, sans équipement lourd.</div>
                        </div>
                      </button>

                      {/* Option 2: VSL */}
                      <button
                        type="button"
                        disabled={mobility === 'allonge' || oxygen}
                        onClick={() => setTransportType('vsl')}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                          transportType === 'vsl'
                            ? 'bg-white border-teal-600 ring-2 ring-teal-500/20 shadow-md card-silky'
                            : (mobility === 'allonge' || oxygen)
                            ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs card-silky-subtle'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="material-symbols-outlined text-teal-700 text-xl">airport_shuttle</span>
                          {transportType === 'vsl' ? (
                            <span className="material-symbols-outlined text-teal-700 text-base">check_circle</span>
                          ) : (mobility === 'allonge' || oxygen) ? (
                            <span className="material-symbols-outlined text-slate-400 text-sm" title="Incompatible avec position allongée ou oxygène">lock</span>
                          ) : null}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">VSL Sanitaire</div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Assis avec aide, fauteuil pliable, désinfection.</div>
                        </div>
                      </button>

                      {/* Option 3: Ambulance */}
                      <button
                        type="button"
                        onClick={() => setTransportType('ambulance')}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                          transportType === 'ambulance'
                            ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-md card-silky'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs card-silky-subtle'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="material-symbols-outlined text-amber-600 text-xl">emergency</span>
                          {transportType === 'ambulance' && (
                            <span className="material-symbols-outlined text-amber-600 text-base">check_circle</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                            Ambulance A/C
                            {(mobility === 'allonge' || oxygen) && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-extrabold">OBLIGATOIRE</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Position allongée, brancard, oxygène, équipage.</div>
                        </div>
                      </button>
                    </div>
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
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="booking-motif" className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                        Motif de la prise en charge Sécurité Sociale
                      </label>
                      <span className="text-[10px] font-bold text-secondary flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        Nomenclature Cerfa S3138
                      </span>
                    </div>
                    <select
                      id="booking-motif"
                      value={motif}
                      onChange={(e) => handleMotifChange(e.target.value)}
                      className="h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 outline-none focus:ring-2 focus:ring-primary shadow-xs transition-all"
                    >
                      {CPAM_TRANSPORT_MOTIFS.map((group) => (
                        <optgroup key={group.category} label={`${group.category} ${group.badge ? `(${group.badge})` : ''}`}>
                          {group.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        Tous les motifs remboursables Assurance Maladie (CPAM / CGSS)
                      </span>
                      {motif && (
                        <span className="italic text-on-surface-variant/80 truncate max-w-sm">
                          {CPAM_TRANSPORT_MOTIFS.flatMap((c) => c.options).find((o) => o.value === motif)?.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-label-md text-label-md text-on-surface font-semibold text-xs">
                      Médecin prescripteur / Service hospitalier
                    </label>
                    <input
                      type="text"
                      value={doctor}
                      onChange={(e) => setDoctor(e.target.value)}
                      placeholder="Ex. Dr. Martin - Oncologie CHU"
                      className="h-11 px-3 bg-surface-container-lowest rounded-xl font-body-md text-body-md text-on-surface border border-outline-variant/40 outline-none focus:ring-2 focus:ring-primary transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3 bis: Choix du Transporteur Sanitaire (Demande nominative 24h ou Bourse publique) */}
              <div className="bg-surface-container-lowest p-space-lg md:p-space-xl rounded-2xl shadow-sm flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          Choix du Transporteur Sanitaire
                        </h2>
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          Attribution
                        </span>
                        <span className="bg-secondary/10 text-secondary text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-secondary/20">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          <span>Secteur {deptLabel}</span>
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Adressez directement votre demande à un transporteur agréé de votre département ou diffusez-la à l'ensemble du réseau local
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-space-sm pt-space-xs">
                  <div className="flex items-center justify-between">
                    <label htmlFor="transporter-select" className="font-label-md text-label-md text-on-surface font-semibold text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-primary">domain</span>
                      <span>Transporteur conventionné du secteur ({departmentTransporters.length} disponibles) :</span>
                    </label>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Bassin : <strong className="text-on-surface">{deptLabel}</strong>
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      id="transporter-select"
                      value={selectedTransporterId}
                      onChange={(e) => setSelectedTransporterId(e.target.value)}
                      className="w-full pl-3 pr-10 py-3 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="">
                        🌐 Diffusion générale (Bourse publique — {deptLabel} — Premier disponible)
                      </option>
                      {departmentTransporters.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fleetAmbulances > 0 ? '🚑' : '🚖'} {t.companyName} ({t.city || deptLabel}) — Conventionné ARS & CPAM ({t.fleetAmbulances} amb., {t.fleetVsl} VSL)
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>

                  {selectedTransporter ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 text-xs flex flex-col gap-2.5 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                        <span className="material-symbols-outlined text-amber-600 text-xl">local_fire_department</span>
                        <span>Demande directe nominative adressée à : {selectedTransporter.companyName} ({selectedTransporter.city || deptLabel})</span>
                      </div>
                      <p className="text-[12px] text-amber-950/90 leading-relaxed">
                        Cette demande apparaîtra <strong>en orange vif</strong> dans le terminal de gestion de <strong>{selectedTransporter.companyName}</strong> avec un <strong>délai prioritaire de 24h00</strong> pour accepter et confirmer la prise en charge.
                      </p>
                      <div className="flex items-start gap-2 text-[11px] text-amber-900 bg-amber-500/15 p-2.5 rounded-lg font-medium border border-amber-500/20">
                        <span className="material-symbols-outlined text-sm text-amber-700 shrink-0 mt-0.5">sync_alt</span>
                        <span>
                          <strong>Garantie de prise en charge :</strong> Si {selectedTransporter.companyName} ne répond pas dans ce délai de 24h00 (ou s'il décline), votre demande sera immédiatement rebasculée dans le <em>pot commun</em> du secteur <strong>{deptLabel}</strong> pour être prise par le premier véhicule conventionné disponible.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs flex items-start gap-2.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">hub</span>
                      <div className="text-[11px] leading-relaxed">
                        <strong>Diffusion générale optimale ({deptLabel}) :</strong> Votre demande sera transmise simultanément à l'ensemble des compagnies de transport sanitaire conventionnées ({departmentTransporters.length} sociétés agréées) de votre secteur pour une attribution instantanée au premier disponible.
                      </div>
                    </div>
                  )}
                </div>
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
                      RDV Médical sur place
                    </span>
                    <span className="font-label-md text-label-md text-on-surface font-bold text-xs">
                      {transportDate}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      {transportTime}
                    </span>
                    <span className="text-[10px] text-secondary font-medium leading-tight mt-0.5">
                      Prise en charge calculée par le transporteur
                    </span>
                    {isRecurring && (
                      <span className="mt-1 px-1.5 py-0.5 bg-secondary/15 text-secondary rounded text-[10px] font-bold text-center">
                        Récurrent ({recurringDates.length} séances)
                      </span>
                    )}
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

                {/* Transporteur ciblé / Attribution */}
                <div className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between border border-outline-variant/30 text-xs">
                  <span className="font-label-sm text-label-sm text-on-surface-variant text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">local_shipping</span>
                    <span>Attribution :</span>
                  </span>
                  <div className="text-right">
                    {selectedTransporter ? (
                      <span className="font-bold text-amber-700 flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-xs">local_fire_department</span>
                        <span>{selectedTransporter.companyName} (24h)</span>
                      </span>
                    ) : (
                      <span className="font-bold text-secondary flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-xs">public</span>
                        <span>Bourse publique ({deptLabel} — 1er dispo)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Official CPAM Tariffs & Tiers Payant breakdown */}
                <div className="p-space-md rounded-2xl bg-surface-container-low/80 flex flex-col gap-space-xs border border-outline-variant/30 text-xs shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
                    <span className="font-bold text-on-surface flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">receipt_long</span>
                      Tarif Conventionné Assurance Maladie
                    </span>
                    <span className="font-extrabold text-on-surface font-mono text-sm text-primary">
                      {ridePricing.totalPrestation.toFixed(2)} €
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-on-surface-variant pt-1">
                    <span>Forfait départemental réglementaire</span>
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
                  {isNirInvalid && nirSubmitAttempted && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 text-xs">
                      <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0 mt-0.5">
                        badge
                      </span>
                      <div className="flex flex-col">
                        <strong className="text-amber-900 font-bold">Numéro de Sécurité Sociale (NIR) incomplet :</strong>
                        <span className="text-[11px] text-amber-800 leading-tight mt-0.5">
                          {nirValidation.errorMessage || "Le NIR doit comporter 13 chiffres valides."}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    disabled={isSubmitting || isNirInvalid}
                    className={`w-full h-14 transition-all text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-space-sm shadow-lg ${
                      isNirInvalid
                        ? 'bg-outline/50 text-on-surface-variant/70 cursor-not-allowed shadow-none'
                        : selectedTransporter
                        ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:opacity-95 active:scale-[0.99] shadow-amber-600/30 hover:scale-[1.01]'
                        : 'bg-gradient-to-r from-teal-800 via-teal-900 to-sky-900 hover:from-teal-700 hover:to-sky-800 text-white active:scale-[0.99] shadow-lg shadow-teal-950/20 hover:scale-[1.01]'
                    }`}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        {selectedTransporter ? 'Transmission directe en cours...' : 'Diffusion en cours...'}
                      </span>
                    ) : isNirInvalid ? (
                      <>
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                        <span>NIR incomplet ou non valide</span>
                      </>
                    ) : selectedTransporter ? (
                      <>
                        <span className="material-symbols-outlined text-[24px]">send</span>
                        <span className="truncate">Adresser la demande à {selectedTransporter.companyName}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[24px]">send</span>
                        <span>Diffuser ma demande aux transporteurs</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-start gap-space-xs p-space-sm bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                      {selectedTransporter ? 'timer' : 'radar'}
                    </span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed text-xs">
                      {selectedTransporter ? (
                        <>
                          <strong className="text-on-surface">Demande directe nominative :</strong> Transmise en priorité exclusive à <strong className="text-amber-900">{selectedTransporter.companyName}</strong> avec un délai de réponse de 24h00 avant rebasculement automatique au pot commun.
                        </>
                      ) : (
                        <>
                          <strong className="text-on-surface">Diffusion instantanée :</strong> Alerte
                          transmise par SMS et console télématique aux{' '}
                          <span className="text-primary font-bold">professionnels conventionnés</span> du secteur {deptLabel}.
                        </>
                      )}
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
