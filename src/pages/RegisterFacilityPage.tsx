import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Bed, 
  Upload 
} from 'lucide-react';
import { CommuneSelect } from '../components/CommuneSelect';

export const RegisterFacilityPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const [facilityName, setFacilityName] = useState('');
  const [facilityType, setFacilityType] = useState('HOSPITAL');
  const [finess, setFiness] = useState('');
  const [city, setCity] = useState('Fort-de-France');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Cadre Supérieur de Santé');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [weeklyDischarges, setWeeklyDischarges] = useState('20-50');

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
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              Établissement Conventionné sur Médic'Trans 972 !
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Votre structure <strong>{facilityName}</strong> (FINESS {finess}) a été initialisée. Les secrétariats et cadres de santé peuvent dès maintenant émettre des demandes de sorties de lits express.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <Link to="/etablissements" className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs">
                Accéder au Portail Sorties Hospitalières
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md space-y-8">
            <div className="border-b border-slate-100 pb-6 space-y-2">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                Portail Établissements de Soins 972
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Conventionnez votre Établissement Médical
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Fluidifiez les sorties d'hospitalisation et les transferts inter-établissements en Martinique.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 text-xs">
              
              {/* Typologie */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  1. Typologie de la Structure Médicale
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'HOSPITAL', label: 'Centre Hospitalier Public' },
                    { id: 'CLINIC', label: 'Clinique Privée' },
                    { id: 'DIALYSIS', label: 'Centre de Dialyse' },
                    { id: 'EHPAD', label: 'EHPAD / Maison de Retraite' }
                  ].map((t) => (
                    <label 
                      key={t.id}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        facilityType === t.id 
                          ? 'border-primary bg-primary/5 font-bold text-primary ring-1 ring-primary' 
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="facilityType"
                        value={t.id}
                        checked={facilityType === t.id}
                        onChange={() => setFacilityType(t.id)}
                        className="sr-only"
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Identification */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-secondary" />
                  2. Identification Administrative & Géolocalisation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nom de l'Établissement *</label>
                    <input
                      type="text"
                      value={facilityName}
                      onChange={(e) => setFacilityName(e.target.value)}
                      required
                      placeholder="Ex: Clinique Sainte-Marie ou CHU Zobda-Quitman"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Numéro FINESS (9 chiffres) *</label>
                    <input
                      type="text"
                      value={finess}
                      onChange={(e) => setFiness(e.target.value)}
                      required
                      placeholder="Ex: 970200021"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <CommuneSelect
                      label="Commune d'Implantation *"
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
                      placeholder="Voie, Quartier, Entrée principale..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Référent */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-primary" />
                  3. Contact Référent des Admissions / Sorties
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nom & Prénom du Référent *</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      placeholder="Ex: Dr. Alix Célestine"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fonction *</label>
                    <input
                      type="text"
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ligne Téléphonique Directe *</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                      placeholder="0596 XX XX XX"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Professionnel *</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                      placeholder="sorties@etablissement-972.fr"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-primary hover:bg-primary-container text-white font-black rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Activer le Compte Établissement Hospitalier</span>
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
