import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Ambulance, 
  Car, 
  ShieldCheck, 
  User, 
  FileText, 
  Heart, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Upload, 
  MapPin, 
  Calendar, 
  Clock 
} from 'lucide-react';
import { CommuneSelect } from '../components/CommuneSelect';
import { TransportType, PatientInfo, MobilityNeeds } from '../types';
import { rideService } from '../services/rideService';
import confetti from 'canvas-confetti';

export const BookingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const prefill = location.state || {};

  // Trajet Details
  const [pickupCity, setPickupCity] = useState(prefill.pickupCity || 'Fort-de-France');
  const [pickupAddress, setPickupAddress] = useState('14 Rue des Flamboyants');
  const [dropoffLocation, setDropoffLocation] = useState(prefill.dropoffLocation || 'CHU de Martinique - Hôpital Pierre Zobda-Quitman, Fort-de-France');
  const [dropoffAddress, setDropoffAddress] = useState('Route de Châteauboeuf, Entrée Consultations Externes');
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const [pickupDate, setPickupDate] = useState<string>(prefill.pickupDate || getDefaultDate());
  const [pickupTime, setPickupTime] = useState(prefill.pickupTime || '09:00');
  const [isRoundTrip, setIsRoundTrip] = useState(prefill.isRoundTrip !== undefined ? prefill.isRoundTrip : true);
  const [transportType, setTransportType] = useState<TransportType>(prefill.transportType || 'VSL');

  // Patient Details
  const [firstName, setFirstName] = useState('Marie-Hélène');
  const [lastName, setLastName] = useState('Désirée');
  const [birthDate, setBirthDate] = useState('1964-07-18');
  const [nir, setNir] = useState('2 64 07 97 202 018 77');
  const [phone, setPhone] = useState('0696 22 33 44');
  const [email, setEmail] = useState('mh.desiree@gmail.com');
  const [isAld, setIsAld] = useState(true);
  const [aldReason, setAldReason] = useState('ALD 30 - Affection cardiovasculaire');
  const [hasPmt, setHasPmt] = useState(true);
  const [pmtPrescriberDoctor, setPmtPrescriberDoctor] = useState('Dr. Philippe Marbot');
  const [pmtDate, setPmtDate] = useState(new Date().toISOString().split('T')[0]);

  // Mobility & Constraints
  const [wheelchair, setWheelchair] = useState(false);
  const [stretcher, setStretcher] = useState(false);
  const [oxygen, setOxygen] = useState(false);
  const [stairsWithoutElevator, setStairsWithoutElevator] = useState(false);
  const [floorNumber, setFloorNumber] = useState<number>(1);
  const [needsEscort, setNeedsEscort] = useState(false);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // If stretcher is checked, force Ambulance
  const handleStretcherChange = (checked: boolean) => {
    setStretcher(checked);
    if (checked) {
      setTransportType('AMBULANCE');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const newRide = await rideService.createRide({
        pickupAddress,
        pickupCity,
        dropoffAddress,
        dropoffCity: dropoffLocation.includes('Fort-de-France') ? 'Fort-de-France' : 'Schœlcher',
        facilityName: dropoffLocation.includes('CHU') ? 'CHU Pierre Zobda-Quitman' : 'Centre Hospitalier',
        pickupDateTime: `${pickupDate}T${pickupTime}:00`,
        isRoundTrip,
        transportType,
        patient: {
          firstName,
          lastName,
          birthDate,
          nir,
          phone,
          email,
          address: pickupAddress,
          city: pickupCity,
          postalCode: '97200',
          isAld,
          aldReason,
          hasPmt,
          pmtPrescriberDoctor,
          pmtDate
        },
        mobility: {
          wheelchair,
          stretcher,
          oxygen,
          stairsWithoutElevator,
          floorNumber: stairsWithoutElevator ? floorNumber : undefined,
          needsEscort,
          notes
        },
        source: 'PATIENT'
      });

      // Confetti feedback
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      navigate(`/confirmation/${newRide.reference}`, { state: { ride: newRide } });
    } catch (err) {
      console.error('Erreur lors de la réservation:', err);
      alert('Une erreur est survenue lors de la confirmation. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation retour & Stepper */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary">
                Réservation de Transport Sanitaire
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Étape 2 sur 2 : Renseignements médicaux, PMT et contraintes physiques
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              Agrément CPAM 972
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Bloc 1: Récapitulatif du Trajet & Mode de Transport */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">1. Itinéraire & Véhicule Prescrit</h2>
                <p className="text-xs text-slate-500">Vérifiez les informations relatives à votre transport</p>
              </div>
            </div>

            {/* Mode selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Type de véhicule conventionné
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label 
                  className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    transportType === 'VSL' 
                      ? 'border-secondary bg-teal-50/50 ring-2 ring-secondary/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="transportType"
                    checked={transportType === 'VSL'}
                    onChange={() => setTransportType('VSL')}
                    className="text-secondary focus:ring-secondary"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-secondary" /> VSL
                    </div>
                    <div className="text-xs text-slate-500">Assistance / Position assise</div>
                  </div>
                </label>

                <label 
                  className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    transportType === 'AMBULANCE' 
                      ? 'border-error bg-red-50/50 ring-2 ring-error/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="transportType"
                    checked={transportType === 'AMBULANCE'}
                    onChange={() => setTransportType('AMBULANCE')}
                    className="text-error focus:ring-error"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Ambulance className="w-4 h-4 text-error" /> Ambulance
                    </div>
                    <div className="text-xs text-slate-500">Allongé / Surveillance / Brancard</div>
                  </div>
                </label>

                <label 
                  className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    transportType === 'TAXI_CONVENTIONNE' 
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="transportType"
                    checked={transportType === 'TAXI_CONVENTIONNE'}
                    onChange={() => setTransportType('TAXI_CONVENTIONNE')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-amber-600" /> Taxi CPAM
                    </div>
                    <div className="text-xs text-slate-500">Patient autonome assis</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Départ & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <CommuneSelect
                  label="Commune de Prise en Charge"
                  value={pickupCity}
                  onChange={setPickupCity}
                  required
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Adresse Précise (Rue, Résidence, Bâtiment)
                  </label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    required
                    placeholder="Ex: 14 Rue des Flamboyants, Bât B"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <CommuneSelect
                  label="Destination Médicale"
                  value={dropoffLocation}
                  onChange={setDropoffLocation}
                  includeFacilities
                  required
                />
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Précision Service ou Pavillon
                  </label>
                  <input
                    type="text"
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    required
                    placeholder="Ex: Consultations Externes, 2ème étage"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Horaires */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date du Trajet
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Heure de Prise en Charge
                </label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl w-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRoundTrip}
                    onChange={(e) => setIsRoundTrip(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Trajet Aller - Retour
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Bloc 2: Fiche Patient & Droits CPAM */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">2. Bénéficiaire & Droits CPAM</h2>
                <p className="text-xs text-slate-500">Informations indispensables pour la facturation en tiers-payant</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nom du Patient <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Ex: DÉSIRÉE"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Prénom <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Ex: Marie-Hélène"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date de Naissance <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Numéro de Sécurité Sociale (NIR 13 ou 15 chiffres) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={nir}
                  onChange={(e) => setNir(e.target.value)}
                  required
                  placeholder="Ex: 2 64 07 97 202 018 77"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Numéro de Téléphone (Patient ou Proche) <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="0696 XX XX XX"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adresse Email (Pour confirmation et suivi)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@exemple.mq"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Prise en charge ALD */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAld}
                  onChange={(e) => setIsAld(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-sm font-bold text-slate-900">
                  Patient en Affection de Longue Durée (ALD 30) - Prise en charge 100%
                </span>
              </label>

              {isAld && (
                <div className="pl-6">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Motif / Pathologie en rapport avec l'ALD :
                  </label>
                  <input
                    type="text"
                    value={aldReason}
                    onChange={(e) => setAldReason(e.target.value)}
                    placeholder="Ex: Chimiothérapie, Insuffisance rénale (dialyse), Diabète sévère..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Prescription Médicale PMT */}
            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-bold text-teal-900">
                    Prescription Médicale de Transport (Cerfa S3138)
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-white text-secondary rounded border border-secondary/30">
                  Obligatoire
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Médecin Prescripteur :</label>
                  <input
                    type="text"
                    value={pmtPrescriberDoctor}
                    onChange={(e) => setPmtPrescriberDoctor(e.target.value)}
                    placeholder="Nom du médecin traitant ou hospitalier"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date de la Prescription :</label>
                  <input
                    type="date"
                    value={pmtDate}
                    onChange={(e) => setPmtDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="border-2 border-dashed border-teal-300 rounded-xl p-4 text-center bg-white/70 hover:bg-white transition-colors cursor-pointer">
                <Upload className="w-5 h-5 text-secondary mx-auto mb-1" />
                <div className="text-xs font-bold text-slate-700">Téléverser une photo ou scan de la PMT</div>
                <div className="text-[10px] text-slate-500">PDF, JPG ou PNG (Le chauffeur pourra aussi récupérer l'original papier)</div>
              </div>
            </div>
          </div>

          {/* Bloc 3: Mobilité & Spécificités sanitaires */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">3. Mobilité & Besoins Particuliers</h2>
                <p className="text-xs text-slate-500">Permet au transporteur d'anticiper le matériel adapté</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wheelchair}
                  onChange={(e) => setWheelchair(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 mt-0.5"
                />
                <div>
                  <div className="text-sm font-bold text-slate-800">Fauteuil Roulant</div>
                  <div className="text-xs text-slate-500">Patient en fauteuil manuel pliable</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stretcher}
                  onChange={(e) => handleStretcherChange(e.target.checked)}
                  className="rounded text-error focus:ring-error h-4 w-4 mt-0.5"
                />
                <div>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    Brancardage Obligatoire <span className="text-[10px] text-error font-bold">(Ambulance)</span>
                  </div>
                  <div className="text-xs text-slate-500">Position allongée stricte requise</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oxygen}
                  onChange={(e) => setOxygen(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 mt-0.5"
                />
                <div>
                  <div className="text-sm font-bold text-slate-800">Oxygénothérapie</div>
                  <div className="text-xs text-slate-500">Besoin d'apport en oxygène durant le trajet</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsEscort}
                  onChange={(e) => setNeedsEscort(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 mt-0.5"
                />
                <div>
                  <div className="text-sm font-bold text-slate-800">Accompagnateur Présent</div>
                  <div className="text-xs text-slate-500">Une personne autorisée voyagera avec le patient</div>
                </div>
              </label>
            </div>

            {/* Portage escaliers */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stairsWithoutElevator}
                  onChange={(e) => setStairsWithoutElevator(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-sm font-bold text-slate-900">
                  Escaliers sans ascenseur au domicile (Besoin de portage)
                </span>
              </label>

              {stairsWithoutElevator && (
                <div className="pl-6 flex items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-700">Nombre d'étages à monter/descendre :</span>
                  <select
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value={1}>1er étage</option>
                    <option value={2}>2ème étage</option>
                    <option value={3}>3ème étage</option>
                    <option value={4}>4ème étage ou plus</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Consignes spécifiques pour le chauffeur / ambulancier
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Code portail, interphone, état de fatigue particulier, besoin d'aide pour fermer la porte..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Validation & Soumission */}
          <div className="p-6 bg-surface-container-high rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-sm font-bold text-primary">
                Prise en charge directe avec Tiers-Payant
              </div>
              <div className="text-xs text-slate-600">
                Votre dossier sera instantanément transmis aux transporteurs agréés de votre secteur en Martinique.
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary-container text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Transmission en cours...</span>
              ) : (
                <>
                  <span>Confirmer la Réservation</span>
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
