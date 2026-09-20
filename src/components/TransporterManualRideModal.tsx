import React, { useState, useEffect } from 'react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { PhoneInput } from './PhoneInput';
import { FileUpload } from './FileUpload';
import { Driver, VehicleFleet } from '../pages/TransporterPortalPage';
import { Ride, TransportType } from '../types';
import { rideService } from '../services/rideService';
import { calculateNationalRoadDistance, calculateMedicalRidePricing } from '../services/pricingService';
import { transporterFleetService, TransporterClientRecord } from '../services/transporterFleetService';

interface TransporterManualRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRide: Ride) => void;
  drivers: Driver[];
  fleet: VehicleFleet[];
  transporterName: string;
  transporterId?: string;
  defaultCity?: string;
  defaultTerritory?: string;
  initialDateTime?: string;
  initialDriverId?: string;
  initialRide?: Partial<Ride>;
}

export const TransporterManualRideModal: React.FC<TransporterManualRideModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  drivers,
  fleet,
  transporterName,
  transporterId,
  defaultCity = 'Fort-de-France',
  defaultTerritory = '972',
  initialDateTime,
  initialDriverId,
  initialRide,
}) => {
  // 1. Patient
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('1980-01-01');
  const [nir, setNir] = useState('');
  const [clientDirectory, setClientDirectory] = useState<TransporterClientRecord[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAld, setIsAld] = useState(true);

  // 2. Trajet & Date/Heure
  const getTomorrowDefaultTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [pickupDateTime, setPickupDateTime] = useState(getTomorrowDefaultTime);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState(defaultCity);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffCity, setDropoffCity] = useState('Fort-de-France');
  const [facilityName, setFacilityName] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDateTime, setReturnDateTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 5, 0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  });

  // 3. Transport & Flotte
  const [transportType, setTransportType] = useState<TransportType>('VSL');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedPlate, setSelectedPlate] = useState<string>('');

  // 4. Prescription Médicale (PMT)
  const [pmtMode, setPmtMode] = useState<'PAPER' | 'DIGITAL' | 'PENDING'>('PAPER');
  const [doctorName, setDoctorName] = useState('');
  const [uploadedPmtDoc, setUploadedPmtDoc] = useState<any>(null);

  // 5. Mobilité & Consignes
  const [wheelchair, setWheelchair] = useState(false);
  const [stretcher, setStretcher] = useState(false);
  const [oxygen, setOxygen] = useState(false);
  const [stairsWithoutElevator, setStairsWithoutElevator] = useState(false);
  const [floorNumber, setFloorNumber] = useState(0);
  const [internalNotes, setInternalNotes] = useState('');

  // États UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronisation du véhicule lorsque le chauffeur est sélectionné
  const handleDriverChange = (driverId: string) => {
    setSelectedDriverId(driverId);
    const foundDriver = drivers.find((d) => d.id === driverId);
    if (foundDriver?.assignedVehiclePlate) {
      setSelectedPlate(foundDriver.assignedVehiclePlate);
    } else {
      const matchVehicle = fleet.find((v) => v.driver?.includes(foundDriver?.lastName || '---'));
      if (matchVehicle) setSelectedPlate(matchVehicle.plate);
    }
  };

  // Chargement du répertoire de patients de l'entreprise
  useEffect(() => {
    if (isOpen && transporterId) {
      transporterFleetService.getClients(transporterId).then((list) => {
        setClientDirectory(list);
      }).catch(() => {});
    }
  }, [isOpen, transporterId]);

  // Pré-remplissage en cas de duplication de course
  useEffect(() => {
    if (initialRide && isOpen) {
      if (initialRide.patient?.firstName) setFirstName(initialRide.patient.firstName);
      if (initialRide.patient?.lastName) setLastName(initialRide.patient.lastName);
      if (initialRide.patient?.phone) setPhone(initialRide.patient.phone);
      if (initialRide.patient?.birthDate) setBirthDate(initialRide.patient.birthDate);
      if (initialRide.patient?.nir) setNir(initialRide.patient.nir);
      if (initialRide.patient?.isAld !== undefined) setIsAld(initialRide.patient.isAld);
      if (initialRide.pickupAddress) setPickupAddress(initialRide.pickupAddress);
      if (initialRide.pickupCity) setPickupCity(initialRide.pickupCity);
      if (initialRide.dropoffAddress) setDropoffAddress(initialRide.dropoffAddress);
      if (initialRide.dropoffCity) setDropoffCity(initialRide.dropoffCity);
      if (initialRide.facilityName) setFacilityName(initialRide.facilityName);
      if (initialRide.transportType) setTransportType(initialRide.transportType);
      if (initialRide.mobility?.wheelchair) setWheelchair(true);
      if (initialRide.mobility?.stretcher) setStretcher(true);
      if (initialRide.mobility?.oxygen) setOxygen(true);
      if (initialRide.mobility?.stairsWithoutElevator) setStairsWithoutElevator(true);
      if (initialRide.mobility?.notes) setInternalNotes(initialRide.mobility.notes);
    }
  }, [initialRide, isOpen]);

  const handleSelectPatient = (p: TransporterClientRecord) => {
    setFirstName(p.firstName || '');
    setLastName(p.lastName || '');
    if (p.phone) setPhone(p.phone);
    if (p.birthDate) setBirthDate(p.birthDate);
    if (p.nir) setNir(p.nir);
    if (p.pickupAddress) setPickupAddress(p.pickupAddress);
    if (p.pickupCity) setPickupCity(p.pickupCity);
    if (p.dropoffAddress) setDropoffAddress(p.dropoffAddress);
    if (p.dropoffCity) setDropoffCity(p.dropoffCity);
    if (p.referringFacility) setFacilityName(p.referringFacility);
    setShowSuggestions(false);
  };

  const patientSuggestions = (lastName.trim() || firstName.trim())
    ? clientDirectory.filter((c) =>
        c.lastName.toLowerCase().includes(lastName.trim().toLowerCase()) ||
        c.firstName.toLowerCase().includes(firstName.trim().toLowerCase())
      )
    : [];

  useEffect(() => {
    if (initialDateTime && isOpen) {
      setPickupDateTime(initialDateTime);
    }
  }, [initialDateTime, isOpen]);

  useEffect(() => {
    if (initialDriverId && isOpen) {
      handleDriverChange(initialDriverId);
    }
  }, [initialDriverId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!lastName.trim() || !firstName.trim()) {
      setErrorMsg('Veuillez renseigner le nom et le prénom du patient.');
      return;
    }
    if (!pickupAddress.trim()) {
      setErrorMsg('Veuillez renseigner l\'adresse de départ.');
      return;
    }
    if (!dropoffAddress.trim() && !facilityName.trim()) {
      setErrorMsg('Veuillez renseigner la destination ou l\'établissement médical.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Trouver chauffeur et véhicule assigné
      const assignedDriver = drivers.find((d) => d.id === selectedDriverId);
      const assignedVeh = fleet.find((v) => v.plate === selectedPlate);

      // Calcul estimatif de distance
      const finalPickupCity = pickupCity || pickupAddress.split(',')[1]?.trim() || defaultCity;
      const finalDropoffCity = dropoffCity || dropoffAddress.split(',')[1]?.trim() || 'Fort-de-France';

      const roadEst = calculateNationalRoadDistance(finalPickupCity, finalDropoffCity, defaultTerritory as any);
      const pricing = calculateMedicalRidePricing({
        transportType,
        originAddress: finalPickupCity,
        destinationAddress: finalDropoffCity,
        isAld,
        isRoundTrip,
        dateTimeStr: pickupDateTime
      });

      const newRidePayload: Partial<Ride> = {
        pickupAddress: pickupAddress.trim(),
        pickupCity: finalPickupCity,
        dropoffAddress: dropoffAddress.trim() || facilityName.trim(),
        dropoffCity: finalDropoffCity,
        facilityName: facilityName.trim() || undefined,
        pickupDateTime: new Date(pickupDateTime).toISOString(),
        returnDateTime: isRoundTrip && returnDateTime ? new Date(returnDateTime).toISOString() : undefined,
        isRoundTrip,
        transportType,
        status: 'ACCEPTED', // Course directe déjà acceptée par le transporteur
        source: 'TRANSPORTER_DIRECT', // Source explicite : course privée interne
        patient: {
          firstName: firstName.trim(),
          lastName: lastName.trim().toUpperCase(),
          birthDate,
          phone: phone.trim() || '06 00 00 00 00',
          email: `${firstName.toLowerCase().replace(/\s+/g, '')}@client-direct.fr`,
          address: pickupAddress.trim(),
          city: finalPickupCity,
          postalCode: defaultTerritory === '972' ? '97200' : '75000',
          isAld,
          hasPmt: pmtMode !== 'PENDING',
          pmtUploaded: !!uploadedPmtDoc,
          pmtFileName: uploadedPmtDoc?.name,
          pmtFileUrl: uploadedPmtDoc?.dataUrl,
          pmtPrescriberDoctor: doctorName.trim() || undefined
        },
        mobility: {
          wheelchair,
          stretcher,
          oxygen,
          stairsWithoutElevator,
          floorNumber,
          needsEscort: false,
          notes: internalNotes.trim() || undefined
        },
        assignedTransporter: assignedDriver
          ? {
              companyName: transporterName,
              driverName: `${assignedDriver.firstName} ${assignedDriver.lastName}`,
              driverPhone: assignedDriver.phone,
              vehiclePlate: selectedPlate || assignedDriver.assignedVehiclePlate || (assignedVeh?.plate || 'DISPO-972'),
              etaMinutes: 15,
              vehicleModel: assignedVeh?.name || undefined
            }
          : {
              companyName: transporterName,
              driverName: '',
              driverPhone: '',
              vehiclePlate: selectedPlate || (assignedVeh?.plate || ''),
              etaMinutes: 15
            },
        estimatedDistanceKm: roadEst.distanceKm,
        estimatedDurationMin: roadEst.durationMinutes,
        pricing
      };

      const created = await rideService.createRide(newRidePayload);

      // Enregistrement au répertoire patient de l'entreprise si configuré
      if (transporterId) {
        transporterFleetService.saveClient(transporterId, {
          firstName,
          lastName,
          phone,
          birthDate,
          nir,
          pickupAddress,
          pickupCity,
          dropoffAddress,
          dropoffCity,
          referringFacility: facilityName,
        }).catch(() => {});
      }

      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error('Erreur création course interne:', err);
      setErrorMsg(err.message || 'Impossible d\'enregistrer la course. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-2xl overflow-hidden my-auto">
        {/* En-tête du modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <span className="material-symbols-outlined text-2xl">add_circle</span>
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black">
                  {initialRide ? 'Dupliquer une Course' : 'Saisir une Course Interne / Directe'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30 text-[11px] font-bold">
                  {initialRide ? '📋 Copie Récurrente' : '📞 Client Privé / Téléphonique'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {initialRide
                  ? 'Ajustez la date et l\'horaire pour créer cette nouvelle course dans votre planning.'
                  : 'Enregistrez vos propres courses pour les intégrer directement dans votre planning flotte et l\'agenda de vos chauffeurs.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 text-red-900 border border-red-200 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 text-base">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1 : PATIENT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-on-surface uppercase tracking-wider">
                <span className="material-symbols-outlined text-primary text-base">person</span>
                <span>1. Informations du Patient</span>
              </div>
              {clientDirectory.length > 0 && (
                <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-semibold">
                  📂 {clientDirectory.length} patient{clientDirectory.length > 1 ? 's' : ''} en répertoire
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="relative">
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Nom du patient *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value.toUpperCase());
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Ex: DUPONT"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-hidden focus:border-primary"
                />

                {/* Suggestions du répertoire patient */}
                {showSuggestions && patientSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    <div className="p-2 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                      Patients existants (cliquer pour préremplir)
                    </div>
                    {patientSuggestions.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        className="p-2.5 hover:bg-teal-50/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-extrabold text-slate-900">
                            {p.lastName} {p.firstName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {p.pickupCity || 'Ville non définie'} • {p.phone || 'Pas de tél'}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-teal-600">Sélectionner ➔</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Prénom du patient *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Jean"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Téléphone de contact
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="06 96 00 00 00"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Date de naissance
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  NIR / Numéro Sécu (optionnel)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={nir}
                  onChange={(e) => setNir(e.target.value.replace(/\s+/g, ''))}
                  placeholder="1 80 01 97 200 000"
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-mono text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAld}
                    onChange={(e) => setIsAld(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span>Affection Longue Durée (ALD 100% CPAM)</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 2 : TRANSPORT & DATE/HEURE */}
          <div className="space-y-3 pt-3 border-t border-outline-variant/15">
            <div className="flex items-center gap-2 text-xs font-extrabold text-on-surface uppercase tracking-wider">
              <span className="material-symbols-outlined text-primary text-base">directions_car</span>
              <span>2. Mode de Transport & Date/Heure</span>
            </div>

            {/* Choix Véhicule */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { type: 'VSL' as TransportType, label: 'VSL', icon: 'directions_car', sub: 'Assis conventionné' },
                { type: 'AMBULANCE' as TransportType, label: 'Ambulance', icon: 'emergency', sub: 'Allongé / Soins' },
                { type: 'TAXI_CONVENTIONNE' as TransportType, label: 'Taxi Conv.', icon: 'local_taxi', sub: 'Conventionné CPAM' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setTransportType(item.type)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    transportType === item.type
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/20 text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span className="font-extrabold text-xs">{item.label}</span>
                  <span className={`text-[10px] ${transportType === item.type ? 'text-white/80' : 'text-on-surface-variant'}`}>
                    {item.sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Dates et Heures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Date et Heure de prise en charge *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={pickupDateTime}
                  onChange={(e) => setPickupDateTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 text-xs font-bold text-on-surface cursor-pointer p-2 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <input
                    type="checkbox"
                    checked={isRoundTrip}
                    onChange={(e) => setIsRoundTrip(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span>Course Aller-Retour (A/R)</span>
                </label>
              </div>

              {isRoundTrip && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-secondary mb-1">
                    Date et Heure estimée du retour
                  </label>
                  <input
                    type="datetime-local"
                    value={returnDateTime}
                    onChange={(e) => setReturnDateTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/5 border border-secondary/30 text-xs font-bold text-on-surface focus:outline-hidden focus:border-secondary"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3 : ITINÉRAIRE */}
          <div className="space-y-3 pt-3 border-t border-outline-variant/15">
            <div className="flex items-center gap-2 text-xs font-extrabold text-on-surface uppercase tracking-wider">
              <span className="material-symbols-outlined text-primary text-base">route</span>
              <span>3. Départ & Destination</span>
            </div>

            <div className="space-y-3">
              <div>
                <AddressAutocomplete
                  id="manual-pickup"
                  label="Lieu de départ (Domicile ou Clinique) *"
                  value={pickupAddress}
                  onChange={(val, suggestion) => {
                    setPickupAddress(val);
                    if (suggestion?.city) setPickupCity(suggestion.city);
                  }}
                  placeholder="Ex: 12 Rue des Flamboyants, Fort-de-France"
                  required
                />
              </div>

              <div>
                <AddressAutocomplete
                  id="manual-dropoff"
                  label="Destination (Établissement de santé, Cabinet ou Domicile) *"
                  value={dropoffAddress}
                  onChange={(val, suggestion) => {
                    setDropoffAddress(val);
                    if (suggestion?.city) setDropoffCity(suggestion.city);
                  }}
                  onSelectFacility={(name) => {
                    setFacilityName(name);
                  }}
                  isDestination={true}
                  placeholder="Ex: CHU Pierre Zobda-Quitman, Clinique Saint-Paul..."
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 4 : AFFECTATION CHAUFFEUR & VÉHICULE */}
          <div className="space-y-3 pt-3 border-t border-outline-variant/15">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-on-surface uppercase tracking-wider">
                <span className="material-symbols-outlined text-blue-600 text-base">badge</span>
                <span>4. Affectation Équipage (Optionnel)</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-medium">
                Peut être affecté maintenant ou plus tard dans le planning
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Chauffeur assigné
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-hidden focus:border-primary"
                >
                  <option value="">-- À affecter plus tard --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      👨‍✈️ {d.firstName} {d.lastName} ({d.role}) - {d.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                  Véhicule assigné (Immatriculation)
                </label>
                <select
                  value={selectedPlate}
                  onChange={(e) => setSelectedPlate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs font-bold text-on-surface focus:outline-hidden focus:border-primary"
                >
                  <option value="">-- Sélectionner un véhicule --</option>
                  {fleet.map((v) => (
                    <option key={v.id} value={v.plate}>
                      🚘 {v.name} ({v.plate}) [{v.type}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 5 : PMT & MOBILITÉ */}
          <div className="space-y-3 pt-3 border-t border-outline-variant/15">
            <div className="flex items-center gap-2 text-xs font-extrabold text-on-surface uppercase tracking-wider">
              <span className="material-symbols-outlined text-teal-600 text-base">description</span>
              <span>5. Prescription Médicale (PMT) & Besoins</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'PAPER', label: '📄 PMT Papier physique', desc: 'Remise au chauffeur à bord' },
                { id: 'DIGITAL', label: '📎 Document / Scan', desc: 'Fichier PDF ou photo' },
                { id: 'PENDING', label: '⏳ En attente prescripteur', desc: 'Délivrance lors du rdv' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPmtMode(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    pmtMode === opt.id
                      ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold'
                      : 'bg-surface-container-low border-outline-variant/20 text-on-surface'
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-[10px] text-on-surface-variant mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {pmtMode === 'DIGITAL' && (
              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                <FileUpload
                  category="PMT"
                  onDocumentChange={(doc) => setUploadedPmtDoc(doc)}
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Médecin prescripteur (optionnel)
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Ex: Dr. Martin (Cardiologie)"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            {/* Consignes particulières */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <label className="flex items-center gap-1.5 p-2 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wheelchair}
                  onChange={(e) => setWheelchair(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Fauteuil roulant</span>
              </label>
              <label className="flex items-center gap-1.5 p-2 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stretcher}
                  onChange={(e) => setStretcher(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Brancardage</span>
              </label>
              <label className="flex items-center gap-1.5 p-2 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oxygen}
                  onChange={(e) => setOxygen(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Oxygène</span>
              </label>
              <label className="flex items-center gap-1.5 p-2 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stairsWithoutElevator}
                  onChange={(e) => setStairsWithoutElevator(e.target.checked)}
                  className="rounded text-primary"
                />
                <span>Portage étages</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-on-surface-variant mb-1">
                Notes internes & Consignes chauffeur (étage, code, motif...)
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ex: Digicode 45B2, 3ème étage sans ascenseur, consultation dialyse..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface focus:outline-hidden focus:border-primary resize-none"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">add_task</span>
                  <span>Enregistrer & Ajouter au Planning</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
