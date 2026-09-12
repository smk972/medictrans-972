import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Copy, 
  Check, 
  Printer, 
  Calendar, 
  MapPin, 
  User, 
  ShieldCheck, 
  Phone, 
  ArrowRight, 
  QrCode, 
  Car, 
  Ambulance, 
  FileText 
} from 'lucide-react';
import { rideService } from '../services/rideService';
import { Ride } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TransportBadge } from '../components/TransportBadge';

export const ConfirmationPage: React.FC = () => {
  const { ref } = useParams<{ ref: string }>();
  const location = useLocation();
  const [ride, setRide] = useState<Ride | null>(location.state?.ride || null);
  const [loading, setLoading] = useState(!ride);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ride && ref) {
      rideService.getRideByReference(ref).then((res) => {
        setRide(res);
        setLoading(false);
      });
    }
  }, [ref, ride]);

  const handleCopyRef = () => {
    if (ride?.reference) {
      navigator.clipboard.writeText(ride.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-slate-600">Chargement de votre confirmation de transport...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
          <h2 className="text-lg font-bold">Dossier introuvable</h2>
          <p className="text-xs mt-1">La référence {ref} n'a pas été trouvée dans le système de régulation.</p>
        </div>
        <Link to="/" className="inline-block px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl">
          Retourner à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* En-tête de confirmation */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/60 text-emerald-800 text-[11px] font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Dossier validé & transmis aux transporteurs
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Demande n° {ride.reference} enregistrée avec succès !
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Un SMS et un email de confirmation ont été envoyés à {ride.patient.phone}.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-2">
            <button
              onClick={handleCopyRef}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier le numéro'}</span>
            </button>
            <StatusBadge status={ride.status} size="lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne Principale (2/3) : Détails itinéraire & patient */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Itinéraire */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Détails de l'Itinéraire Sanitaire
                </h3>
                <TransportBadge type={ride.transportType} />
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-100" />
                  <div>
                    <span className="font-bold text-slate-700">Départ :</span>
                    <p className="font-medium text-slate-900 text-sm mt-0.5">{ride.pickupAddress}</p>
                    <p className="text-slate-500">{ride.pickupCity} (972)</p>
                  </div>
                </div>

                <div className="ml-1.5 pl-4 border-l-2 border-dashed border-slate-200 py-1 text-[11px] text-slate-400">
                  Prise en charge programmée le {new Date(ride.pickupDateTime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(ride.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary mt-1 shrink-0 ring-4 ring-primary/20" />
                  <div>
                    <span className="font-bold text-slate-700">Destination :</span>
                    <p className="font-medium text-slate-900 text-sm mt-0.5">{ride.dropoffAddress}</p>
                    <p className="text-slate-500">{ride.dropoffCity} {ride.facilityName && `• ${ride.facilityName}`}</p>
                  </div>
                </div>
              </div>

              {ride.isRoundTrip && (
                <div className="mt-3 p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-secondary shrink-0" />
                  <span>Trajet Aller-Retour inclus : Le chauffeur assurera également le voyage retour.</span>
                </div>
              )}
            </div>

            {/* Bénéficiaire & Prise en charge */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <User className="w-4 h-4 text-secondary" />
                Bénéficiaire du Transport
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Nom & Prénom</span>
                  <div className="font-bold text-slate-900 mt-0.5">{ride.patient.lastName} {ride.patient.firstName}</div>
                </div>
                <div>
                  <span className="text-slate-500">Né(e) le</span>
                  <div className="font-bold text-slate-900 mt-0.5">{new Date(ride.patient.birthDate).toLocaleDateString('fr-FR')}</div>
                </div>
                <div>
                  <span className="text-slate-500">Téléphone</span>
                  <div className="font-bold text-slate-900 mt-0.5">{ride.patient.phone}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">N° Sécurité Sociale (NIR)</span>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">{ride.patient.nir}</div>
                </div>
                <div>
                  <span className="text-slate-500">Régime / Taux</span>
                  <div className="font-bold text-emerald-700 mt-0.5">
                    {ride.patient.isAld ? '100% (ALD Exonérante)' : 'Tiers-payant CPAM'}
                  </div>
                </div>
              </div>

              {/* Mobilité */}
              <div className="pt-3 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-700">Contraintes physiques déclarées :</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ride.mobility.wheelchair && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">♿ Fauteuil roulant</span>
                  )}
                  {ride.mobility.stretcher && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">🛏️ Brancardage obligatoire</span>
                  )}
                  {ride.mobility.oxygen && (
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded font-semibold">💨 Oxygène</span>
                  )}
                  {ride.mobility.stairsWithoutElevator && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                      🪜 Portage ({ride.mobility.floorNumber}e étage sans ascenseur)
                    </span>
                  )}
                  {ride.mobility.needsEscort && (
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-semibold">👥 Accompagnateur</span>
                  )}
                  {!ride.mobility.wheelchair && !ride.mobility.stretcher && !ride.mobility.oxygen && !ride.mobility.stairsWithoutElevator && (
                    <span className="text-slate-500 italic">Aucune contrainte de mobilité particulière</span>
                  )}
                </div>
              </div>
            </div>

            {/* Chauffeur affecté */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <Car className="w-4 h-4 text-primary" />
                Transporteur & Véhicule Sanitaire
              </h3>

              {ride.assignedTransporter ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900 text-sm">{ride.assignedTransporter.companyName}</div>
                    <div className="text-slate-600">Chauffeur référent : <strong>{ride.assignedTransporter.driverName}</strong></div>
                    <div className="text-slate-500">Immatriculation : <strong className="font-mono">{ride.assignedTransporter.vehiclePlate}</strong> {ride.assignedTransporter.vehicleModel && `(${ride.assignedTransporter.vehicleModel})`}</div>
                  </div>
                  <a
                    href={`tel:${ride.assignedTransporter.driverPhone}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Appeler {ride.assignedTransporter.driverPhone}
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                  <div className="font-bold">Attribution en cours sur le réseau Martinique</div>
                  <p className="text-amber-800 leading-relaxed">
                    Votre demande a été diffusée auprès des 18 sociétés d'ambulances et taxis conventionnés couvrant la zone de {ride.pickupCity}. Vous recevrez le numéro d'immatriculation par SMS dès validation.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Colonne Droite (1/3) : QR Code Admission & Actions */}
          <div className="space-y-6">
            
            {/* QR Code Admission Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md text-center space-y-4">
              <div className="inline-flex p-3 bg-primary/10 text-primary rounded-2xl mx-auto">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Pass Sanitaire d'Admission</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Présentez ce code au chauffeur ou à l'accueil hospitalier</p>
              </div>

              {/* QR Code SVG / Visual Simulation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
                <div className="w-40 h-40 bg-white p-2 border border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1">
                  <div className="grid grid-cols-5 gap-1 w-full h-full p-1 opacity-80">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-xs ${
                          (i % 2 === 0 || i % 5 === 0) ? 'bg-slate-900' : 'bg-slate-200'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-2 text-[11px] font-mono font-bold text-slate-700">
                  {ride.reference}
                </div>
              </div>

              <div className="text-[10px] text-slate-400">
                Certifié conforme CGSS Martinique & ARS
              </div>
            </div>

            {/* Actions Rapides */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
              <Link
                to={`/suivi?ref=${ride.reference}`}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>Accéder au Suivi en Direct</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={handlePrint}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer le Bon Récapitulatif</span>
              </button>

              <Link
                to="/droits-cpam"
                className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Vérifier mes justificatifs CPAM
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
