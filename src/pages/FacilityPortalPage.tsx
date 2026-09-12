import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bed, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  MapPin, 
  User, 
  Car, 
  Ambulance, 
  Search,
  Filter,
  Check
} from 'lucide-react';
import { MAJOR_FACILITIES, rideService } from '../services/rideService';
import { Ride, TransportType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { TransportBadge } from '../components/TransportBadge';
import { CommuneSelect } from '../components/CommuneSelect';

export const FacilityPortalPage: React.FC = () => {
  const [selectedFacility, setSelectedFacility] = useState(MAJOR_FACILITIES[0].name);
  const [selectedDepartment, setSelectedDepartment] = useState('Néphrologie & Dialyse');
  const [rides, setRides] = useState<Ride[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Formulaire Sortie de Lit Express
  const [patientLastName, setPatientLastName] = useState('');
  const [patientFirstName, setPatientFirstName] = useState('');
  const [patientNir, setPatientNir] = useState('');
  const [patientPhone, setPatientPhone] = useState('0696 ');
  const [roomNumber, setRoomNumber] = useState('314');
  const [bedDischargeNumber, setBedDischargeNumber] = useState('SL-2026-972-12');
  const [dropoffCity, setDropoffCity] = useState('Le Lamentin');
  const [dropoffAddress, setDropoffAddress] = useState('Quartier Acajou, Bâtiment C');
  const [pickupTime, setPickupTime] = useState('14:30');
  const [transportType, setTransportType] = useState<TransportType>('VSL');
  const [stretcher, setStretcher] = useState(false);
  const [oxygen, setOxygen] = useState(false);
  const [stairs, setStairs] = useState(false);
  const [notes, setNotes] = useState('Perfusion retirée à 14h00. Prévoir bras d\'appui.');

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    const all = await rideService.getAllRides();
    setRides(all);
  };

  const handleCreateDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientLastName || !patientFirstName) return;

    const today = new Date().toISOString().split('T')[0];

    await rideService.createRide({
      pickupAddress: `${selectedFacility}, Service ${selectedDepartment}, Chambre ${roomNumber}`,
      pickupCity: 'Fort-de-France',
      dropoffAddress,
      dropoffCity,
      facilityName: selectedFacility,
      pickupDateTime: `${today}T${pickupTime}:00`,
      isRoundTrip: false,
      transportType,
      patient: {
        firstName: patientFirstName,
        lastName: patientLastName,
        birthDate: '1960-01-01',
        nir: patientNir || '1 60 01 97 200 000 00',
        phone: patientPhone,
        email: '',
        address: dropoffAddress,
        city: dropoffCity,
        postalCode: '97200',
        isAld: true,
        hasPmt: true,
        pmtPrescriberDoctor: 'Cadre Médical Hospitalier'
      },
      mobility: {
        wheelchair: false,
        stretcher,
        oxygen,
        stairsWithoutElevator: stairs,
        needsEscort: false,
        notes
      },
      source: 'FACILITY',
      facilityDepartment: selectedDepartment,
      bedDischargeNumber
    });

    setShowModal(false);
    // Reset fields
    setPatientLastName('');
    setPatientFirstName('');
    await loadRides();
  };

  const facilityRides = rides.filter(r => 
    r.facilityName?.includes('CHU') || r.facilityName?.includes('Hôpital') || r.source === 'FACILITY'
  );

  return (
    <div className="bg-surface py-8 space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Espace Hospitalier */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7 text-secondary-container" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1">
                Portail Professionnel Hospitalier
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {selectedFacility}
              </h1>
              <p className="text-xs text-slate-500">
                Régulation des Départs & Sorties d'Hospitalisation • FINESS 970200021
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="Néphrologie & Dialyse">Service Néphrologie & Dialyse</option>
              <option value="Oncologie & Chimiothérapie">Oncologie & Chimiothérapie</option>
              <option value="Chirurgie Ambulatoire">Chirurgie Ambulatoire</option>
              <option value="Cardiologie">Cardiologie</option>
              <option value="Gériatrie & Soins de Suite">Gériatrie & Soins de Suite</option>
            </select>

            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Demande Sortie de Lit Express</span>
            </button>
          </div>
        </div>

        {/* KPIs Départs du Jour */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">Départs programmés</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{facilityRides.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Pour le service actuel</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">En attente d'attribution</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {facilityRides.filter(r => r.status === 'PENDING').length}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Diffusé aux transporteurs</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">Chauffeurs en route</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {facilityRides.filter(r => ['ACCEPTED', 'EN_ROUTE'].includes(r.status)).length}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Véhicules en approche</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500">Sorties clôturées</div>
            <div className="text-2xl font-black text-slate-600 mt-1">
              {facilityRides.filter(r => r.status === 'COMPLETED').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Bordereaux validés</div>
          </div>
        </div>

        {/* Tableau des Sorties Hospitalières en cours */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Départs du Service : {selectedDepartment}
              </h2>
              <p className="text-xs text-slate-500">Mise à jour en temps réel avec les flottes conventionnées</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
              {facilityRides.length} patient(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Référence / Dossier</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Patient / Chambre</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Destination (972)</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Heure Prévue</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Mode</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Statut Course</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Transporteur Assigné</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facilityRides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-primary">
                      {ride.reference}
                      {ride.bedDischargeNumber && (
                        <div className="text-[10px] text-slate-400 font-sans">{ride.bedDischargeNumber}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{ride.patient.lastName} {ride.patient.firstName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{ride.patient.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{ride.dropoffCity}</div>
                      <div className="text-slate-500 text-[11px] truncate max-w-xs">{ride.dropoffAddress}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {new Date(ride.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <TransportBadge type={ride.transportType} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={ride.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      {ride.assignedTransporter ? (
                        <div>
                          <div className="font-bold text-slate-900">{ride.assignedTransporter.companyName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{ride.assignedTransporter.vehiclePlate} ({ride.assignedTransporter.driverName})</div>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-medium italic">Recherche d'un transporteur...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Demande de Sortie de Lit Express */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Demande de Sortie de Lit Express</h3>
                  <p className="text-xs text-slate-500">{selectedFacility} • {selectedDepartment}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDischarge} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom du Patient *</label>
                  <input
                    type="text"
                    value={patientLastName}
                    onChange={(e) => setPatientLastName(e.target.value)}
                    required
                    placeholder="Ex: TONY"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={patientFirstName}
                    onChange={(e) => setPatientFirstName(e.target.value)}
                    required
                    placeholder="Ex: Sylviane"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chambre n°</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Ex: 314"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone Contact</label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="0696 XX XX XX"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Heure de Sortie Prévue</label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <CommuneSelect
                  label="Commune du Domicile"
                  value={dropoffCity}
                  onChange={setDropoffCity}
                  required
                />
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adresse Domicile *</label>
                  <input
                    type="text"
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    required
                    placeholder="Quartier, N° rue, Bâtiment..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Mode de transport prescrit */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mode de Transport Prescrit sur la PMT</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransportType('VSL')}
                    className={`p-2.5 rounded-lg border font-bold text-xs ${
                      transportType === 'VSL' ? 'bg-teal-50 border-secondary text-secondary' : 'bg-white border-slate-200'
                    }`}
                  >
                    VSL (Assis)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransportType('AMBULANCE')}
                    className={`p-2.5 rounded-lg border font-bold text-xs ${
                      transportType === 'AMBULANCE' ? 'bg-red-50 border-error text-error' : 'bg-white border-slate-200'
                    }`}
                  >
                    Ambulance (Allongé)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransportType('TAXI_CONVENTIONNE')}
                    className={`p-2.5 rounded-lg border font-bold text-xs ${
                      transportType === 'TAXI_CONVENTIONNE' ? 'bg-amber-50 border-amber-600 text-amber-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    Taxi CPAM
                  </button>
                </div>
              </div>

              {/* Contraintes de soins */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stretcher}
                    onChange={(e) => {
                      setStretcher(e.target.checked);
                      if (e.target.checked) setTransportType('AMBULANCE');
                    }}
                    className="rounded text-primary"
                  />
                  <span className="font-semibold">Brancard</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={oxygen}
                    onChange={(e) => setOxygen(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span className="font-semibold">Oxygène</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stairs}
                    onChange={(e) => setStairs(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span className="font-semibold">Escalier étage</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consignes Médicales & Matériel</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary-container text-white font-bold rounded-xl shadow-xs"
                >
                  Diffuser la Sortie aux Flottes 972
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
