import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Ambulance, 
  Car, 
  ShieldCheck, 
  Clock, 
  HeartHandshake, 
  CheckCircle2, 
  ArrowRight, 
  PhoneCall, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { CommuneSelect } from '../components/CommuneSelect';
import { TransportType } from '../types';
import { MAJOR_FACILITIES, MARTINIQUE_COMMUNES } from '../services/rideService';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Express booking state
  const [pickupCity, setPickupCity] = useState('Fort-de-France');
  const [dropoffLocation, setDropoffLocation] = useState('CHU de Martinique - Hôpital Pierre Zobda-Quitman, Fort-de-France');
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [pickupTime, setPickupTime] = useState('08:30');
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [transportType, setTransportType] = useState<TransportType>('VSL');

  const handleStartBooking = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to /reserver with prefilled query state
    navigate('/reserver', {
      state: {
        pickupCity,
        dropoffLocation,
        pickupDate,
        pickupTime,
        isRoundTrip,
        transportType
      }
    });
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section with Express Booking Widget */}
      <section className="relative bg-gradient-to-b from-primary/5 via-surface to-background pt-10 pb-16 border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Text */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/30 border border-secondary/30 text-secondary text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                Réseau Conventionné CPAM Martinique
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight leading-tight">
                Votre transport médicalisé en Martinique, réservé en toute sérénité.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Accédez facilement au réseau d'ambulances, VSL et taxis conventionnés agréés ARS. Prise en charge à 100% avec tiers-payant CPAM pour vos consultations, dialyses et sorties d'hospitalisation.
              </p>

              {/* Badges de réassurance */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
                  <div className="text-primary font-black text-lg">100%</div>
                  <div className="text-xs text-slate-600 font-medium">Tiers-payant CPAM</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
                  <div className="text-secondary font-black text-lg">34</div>
                  <div className="text-xs text-slate-600 font-medium">Communes 972</div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs text-center">
                  <div className="text-primary font-black text-lg">H24</div>
                  <div className="text-xs text-slate-600 font-medium">Régulation continue</div>
                </div>
              </div>

              {/* Coordinatrice photo & quote */}
              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-slate-200/80">
                <img 
                  src="/assets/headshot.png" 
                  alt="Coordinatrice Médicale Martinique" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary shadow-xs"
                />
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">
                    Conseil de notre Régulatrice Sanitaire
                  </p>
                  <p className="text-xs text-slate-600 italic">
                    « N'oubliez pas votre Prescription Médicale de Transport (PMT) signée par votre médecin avant le départ pour bénéficier du tiers-payant intégral. »
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Express Booking Card */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Réservation Express</h2>
                      <p className="text-xs text-slate-500">Prise en charge sanitaire partout en Martinique</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Disponibilité directe
                  </span>
                </div>

                <form onSubmit={handleStartBooking} className="mt-6 space-y-5">
                  {/* Trajet Aller simple / Aller-retour */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIsRoundTrip(false)}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        !isRoundTrip ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Aller Simple
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRoundTrip(true)}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${
                        isRoundTrip ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Aller - Retour (Recommandé)
                    </button>
                  </div>

                  {/* Commune de Départ */}
                  <CommuneSelect
                    id="pickupCity"
                    label="Commune ou Lieu de Départ"
                    value={pickupCity}
                    onChange={setPickupCity}
                    placeholder="Choisir votre commune..."
                    required
                  />

                  {/* Destination / Établissement */}
                  <CommuneSelect
                    id="dropoffLocation"
                    label="Destination (Hôpital, Clinique, Cabinet)"
                    value={dropoffLocation}
                    onChange={setDropoffLocation}
                    placeholder="Choisir l'établissement ou la ville..."
                    includeFacilities
                    required
                  />

                  {/* Date & Heure */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pickupDate" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Date de transport <span className="text-error">*</span>
                      </label>
                      <input
                        id="pickupDate"
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="pickupTime" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Heure de prise en charge <span className="text-error">*</span>
                      </label>
                      <input
                        id="pickupTime"
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Choix du mode de transport */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Mode prescrit sur votre PMT <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {/* VSL */}
                      <button
                        type="button"
                        onClick={() => setTransportType('VSL')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          transportType === 'VSL'
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <Car className={`w-5 h-5 mb-1 ${transportType === 'VSL' ? 'text-primary' : 'text-slate-500'}`} />
                        <div className="text-xs font-bold text-slate-900">VSL</div>
                        <div className="text-[10px] text-slate-500">Assis / Aide</div>
                      </button>

                      {/* Ambulance */}
                      <button
                        type="button"
                        onClick={() => setTransportType('AMBULANCE')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          transportType === 'AMBULANCE'
                            ? 'border-error bg-error/5 ring-2 ring-error/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <Ambulance className={`w-5 h-5 mb-1 ${transportType === 'AMBULANCE' ? 'text-error' : 'text-slate-500'}`} />
                        <div className="text-xs font-bold text-slate-900">Ambulance</div>
                        <div className="text-[10px] text-slate-500">Allongé / Soins</div>
                      </button>

                      {/* Taxi Conventionné */}
                      <button
                        type="button"
                        onClick={() => setTransportType('TAXI_CONVENTIONNE')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          transportType === 'TAXI_CONVENTIONNE'
                            ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <Car className={`w-5 h-5 mb-1 ${transportType === 'TAXI_CONVENTIONNE' ? 'text-amber-600' : 'text-slate-500'}`} />
                        <div className="text-xs font-bold text-slate-900">Taxi CPAM</div>
                        <div className="text-[10px] text-slate-500">Autonome assis</div>
                      </button>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-primary hover:bg-primary-container shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Continuer ma réservation (Étape 2)</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <p className="text-center text-[11px] text-slate-500">
                    🔒 Données médicales sécurisées HDS • Aucune avance de frais en cas d'ALD 100%
                  </p>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Les 3 Modes de Transport conventionnés */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-block text-xs font-bold text-secondary uppercase tracking-wider bg-secondary/10 px-3 py-1 rounded-full">
            Typologies de transport sanitaire
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quel mode de transport correspond à votre prescription ?
          </h2>
          <p className="text-sm text-slate-600">
            Le choix du mode dépend exclusivement de la mention cochée par votre médecin sur la Prescription Médicale de Transport (formulaire Cerfa S3138).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 : VSL */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-secondary hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-teal-50 text-secondary flex items-center justify-center">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">VSL (Véhicule Sanitaire Léger)</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Réservé aux patients pouvant voyager en position assise mais nécessitant une aide technique ou humaine à la marche, ou des règles d'hygiène strictes.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  Séances de chimiothérapie ou radiothérapie
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  Dialyses récurrentes (Dillon, Lamentin)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                  Aide au déplacement et formalités
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link to="/reserver" state={{ transportType: 'VSL' }} className="text-xs font-bold text-secondary hover:underline flex items-center gap-1">
                Réserver un VSL <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2 : Ambulance */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-error hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-red-50 text-error flex items-center justify-center">
                <Ambulance className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Ambulance Conventionnée</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Indispensable lorsque l'état du patient exige une position allongée, un brancardage, une oxygénothérapie continue ou une surveillance soignante active.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-error shrink-0" />
                  Sorties de lit d'hospitalisation lourde
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-error shrink-0" />
                  Brancardage et portage en étages
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-error shrink-0" />
                  Équipage de 2 ambulanciers diplômés d'État
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link to="/reserver" state={{ transportType: 'AMBULANCE' }} className="text-xs font-bold text-error hover:underline flex items-center gap-1">
                Réserver une Ambulance <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3 : Taxi Conventionné */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Car className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Taxi Conventionné CPAM</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Adapté aux personnes autonomes capables de marcher seules et de s'asseoir sans aide médicale particulière, munies d'une prescription conforme.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  Consultations spécialistes et bilans
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  Véhicules confortables et climatisés
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  Prise en charge directe avec carte Vitale
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100">
              <Link to="/reserver" state={{ transportType: 'TAXI_CONVENTIONNE' }} className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
                Réserver un Taxi Conventionné <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Droits CPAM 972 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary to-primary-container rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              Tiers-Payant Intégral Martinique
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Comment fonctionne la prise en charge par la Sécurité Sociale ?
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              En cas d'Affection Longue Durée (ALD 30), d'accident du travail ou de soins en lien avec une maternité, vos trajets sanitaires sont remboursés à 100% par la Caisse Générale de Sécurité Sociale (CGSS / CPAM Martinique).
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary-container" />
                Dispense d'avance de frais
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary-container" />
                Télétransmission CPAM 972
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-secondary-container" />
                Accompagnement accord préalable
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              to="/droits-cpam"
              className="px-6 py-3.5 rounded-xl font-bold text-primary bg-white hover:bg-slate-100 shadow-md transition-colors text-center text-sm"
            >
              Consulter le Guide CPAM
            </Link>
            <Link
              to="/reserver"
              className="px-6 py-3.5 rounded-xl font-bold text-white bg-secondary hover:bg-secondary/90 shadow-md transition-colors text-center text-sm"
            >
              Faire une demande
            </Link>
          </div>
        </div>
      </section>

      {/* Section Établissements Partenaires en Martinique */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 bg-surface-container rounded-3xl border border-outline-variant/30 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-primary">
                Liaisons Sanitaires Quotidiennes vers les Établissements de Martinique
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Nos transporteurs partenaires desservent chaque jour les principaux pôles hospitaliers et cliniques de l'île.
              </p>
            </div>
            <Link 
              to="/etablissements" 
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              Portail Dédié Soignants & Sorties <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MAJOR_FACILITIES.slice(0, 4).map((f) => (
              <div key={f.name} className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                <div className="text-xs font-bold text-slate-900 truncate">{f.name}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-secondary" />
                  {f.city}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Rapide */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Questions Fréquentes</h2>
          <p className="text-xs text-slate-500">Tout savoir sur le transport sanitaire en Martinique</p>
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Dois-je obligatoirement avoir une prescription médicale avant la course ?
            </h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Oui, la Prescription Médicale de Transport (PMT) doit impérativement être établie par votre médecin avant la réalisation du trajet, sauf en cas d'urgence médicale avérée.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Combien de temps à l'avance dois-je réserver ?
            </h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Pour des rendez-vous programmés (dialyse, chimiothérapie, consultations spécialisées), nous vous recommandons de réserver au moins 24h à 48h à l'avance pour garantir la disponibilité optimale de votre transporteur.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Mon accompagnateur peut-il voyager avec moi ?
            </h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Un accompagnateur est autorisé si la présence d'une tierce personne est mentionnée sur la prescription médicale (mineurs, personnes dépendantes, troubles cognitifs).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
