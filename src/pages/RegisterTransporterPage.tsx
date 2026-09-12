import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Truck, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  Car, 
  Ambulance, 
  Upload 
} from 'lucide-react';
import { CommuneSelect } from '../components/CommuneSelect';

export const RegisterTransporterPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [arsLicense, setArsLicense] = useState('');
  const [cpamNumber, setCpamNumber] = useState('');
  const [city, setCity] = useState('Le Lamentin');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fleetAmbulances, setFleetAmbulances] = useState(2);
  const [fleetVsl, setFleetVsl] = useState(4);
  const [fleetTaxis, setFleetTaxis] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-surface py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        {submitted ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              Dossier de Conventionnement Enregistré !
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Votre demande d'intégration au réseau Médic'Trans Martinique pour <strong>{companyName}</strong> a été transmise à notre cellule de régulation. Nos équipes vérifieront votre agrément ARS ({arsLicense}) sous 24h ouvrées.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <Link to="/transporteurs" className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs">
                Accéder au Dispatch de Démonstration
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md space-y-8">
            <div className="border-b border-slate-100 pb-6 space-y-2">
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                Agrément Médic'Trans 972
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Devenez Partenaire Médic'Trans Martinique
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Rejoignez le réseau unifié des sociétés d'ambulances et taxis conventionnés de l'île.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 text-xs">
              
              {/* Section 1: Identification */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  1. Identification de l'Entreprise
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Raison Sociale *</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      placeholder="Ex: Ambulances Madinina Secours SARL"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Numéro SIRET (14 chiffres) *</label>
                    <input
                      type="text"
                      value={siret}
                      onChange={(e) => setSiret(e.target.value)}
                      required
                      placeholder="Ex: 481 294 029 00018"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <CommuneSelect
                      label="Commune du Siège d'Exploitation *"
                      value={city}
                      onChange={setCity}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Adresse Complète *</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      placeholder="Zone Industrielle, Rue, Bâtiment..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Téléphone de Régulation H24 *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="0596 XX XX XX"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Professionnel *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="dispatch@entreprise.mq"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Agréments */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-secondary" />
                  2. Licences d'Exploitation & Agréments ARS
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">N° d'Agrément ARS Martinique *</label>
                    <input
                      type="text"
                      value={arsLicense}
                      onChange={(e) => setArsLicense(e.target.value)}
                      required
                      placeholder="Ex: 972-AMB-2021-04"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">N° de Conventionnement CPAM *</label>
                    <input
                      type="text"
                      value={cpamNumber}
                      onChange={(e) => setCpamNumber(e.target.value)}
                      required
                      placeholder="Ex: 972-CPAM-881"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <div className="font-bold text-slate-700">Déposer copie de l'arrêté d'agrément ARS & Attestation CPAM</div>
                  <div className="text-[10px] text-slate-500">Formats acceptés : PDF, PNG (Max 10 Mo)</div>
                </div>
              </div>

              {/* Section 3: Flotte */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  3. Flotte de Véhicules Conventionnés
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <label className="block font-bold text-slate-700 mb-1">Ambulances</label>
                    <input
                      type="number"
                      min={0}
                      value={fleetAmbulances}
                      onChange={(e) => setFleetAmbulances(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold mx-auto block"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <label className="block font-bold text-slate-700 mb-1">VSL</label>
                    <input
                      type="number"
                      min={0}
                      value={fleetVsl}
                      onChange={(e) => setFleetVsl(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold mx-auto block"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <label className="block font-bold text-slate-700 mb-1">Taxis Conventionnés</label>
                    <input
                      type="number"
                      min={0}
                      value={fleetTaxis}
                      onChange={(e) => setFleetTaxis(Number(e.target.value))}
                      className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold mx-auto block"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-secondary hover:bg-secondary/90 text-white font-black rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Valider mon Inscription Partenaire Médic'Trans 972</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
