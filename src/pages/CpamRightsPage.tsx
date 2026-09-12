import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileCheck, 
  AlertCircle, 
  Car, 
  Ambulance, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { MARTINIQUE_COMMUNES } from '../services/rideService';

export const CpamRightsPage: React.FC = () => {
  // Simulateur éligibilité
  const [situation, setSituation] = useState<'ald' | 'at' | 'maternity' | 'standard'>('ald');
  const [hasPrescription, setHasPrescription] = useState(true);

  return (
    <div className="bg-surface py-10 space-y-16">
      
      {/* Hero Guide Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary to-primary-container rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-secondary-container" />
              Réglementation Sécurité Sociale & CGSS Martinique
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Vos Droits & Prise en Charge CPAM en Martinique
            </h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              Comprendre les règles officielles de remboursement, le rôle de la Prescription Médicale de Transport (PMT) et bénéficier du tiers-payant sans avance de frais.
            </p>
          </div>
        </div>
      </section>

      {/* Simulateur d'Éligibilité & Prise en Charge */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Simulateur de Remboursement CPAM 972</h2>
              <p className="text-xs text-slate-500">Testez votre taux de prise en charge en 2 clics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Votre situation médicale
              </label>
              <div className="space-y-2">
                {[
                  { id: 'ald', label: 'Affection de Longue Durée (ALD 30, dialyse, cancer)', desc: 'Prise en charge à 100%' },
                  { id: 'at', label: 'Accident du Travail / Maladie Professionnelle (AT/MP)', desc: 'Prise en charge à 100%' },
                  { id: 'maternity', label: 'Maternité (à partir du 6ème mois)', desc: 'Prise en charge à 100%' },
                  { id: 'standard', label: 'Soins courants / Consultation simple', desc: 'Prise en charge à 65% + Mutuelle' },
                ].map((item) => (
                  <label 
                    key={item.id}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      situation === item.id 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="situation"
                      value={item.id}
                      checked={situation === item.id}
                      onChange={() => setSituation(item.id as any)}
                      className="sr-only"
                    />
                    <div className="font-bold text-xs text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Avez-vous une prescription médicale ?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHasPrescription(true)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                      hasPrescription ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Oui, j'ai une PMT
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasPrescription(false)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                      !hasPrescription ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Pas encore
                  </button>
                </div>
              </div>

              {/* Résultat calculé */}
              <div className="p-5 bg-surface-container rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Résultat de votre estimation :</div>
                
                {hasPrescription ? (
                  situation !== 'standard' ? (
                    <div className="space-y-1">
                      <div className="text-xl font-black text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Prise en charge à 100% (Tiers-Payant Intégral)
                      </div>
                      <p className="text-xs text-slate-600">
                        Aucune avance de frais. Le transporteur facture directement la Caisse Générale de Sécurité Sociale de Martinique sur présentation de votre carte Vitale et de l'original de votre PMT.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-xl font-black text-sky-800 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Prise en charge à 65% CPAM + 35% Mutuelle
                      </div>
                      <p className="text-xs text-slate-600">
                        La part Sécurité Sociale (65%) est télétransmise directement. Le ticket modérateur (35%) est couvert par votre mutuelle ou complémentaire santé solidaire (C2S).
                      </p>
                    </div>
                  )
                ) : (
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-error flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Prescription Médicale Obligatoire
                    </div>
                    <p className="text-xs text-slate-600">
                      Sans ordonnance médicale préalable signée par un médecin, la Sécurité Sociale ne pourra rembourser le trajet. Demandez votre bon de transport à votre praticien avant de commander.
                    </p>
                  </div>
                )}
              </div>

              <Link
                to="/reserver"
                className="w-full py-3 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <span>Commander avec mon taux calculé</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Guide des Démarches & Règles d'Or */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Les 4 Règles d'Or pour être Remboursé</h2>
          <p className="text-xs text-slate-500">Procédure officielle CPAM / CGSS Martinique</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-base flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">Prescription Antérieure</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              La prescription doit impérativement être datée <strong>avant</strong> le jour du transport, sauf cas d'urgence médicale manifeste.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary font-black text-base flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">Respect du Mode Prescrit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vous ne pouvez pas voyager en Ambulance si le médecin a coché Taxi ou VSL, et inversement. Le transporteur vérifie la conformité légale.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-base flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900">Accord Préalable</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Requis pour les trajets répétés (&gt; 4 transports de plus de 50 km dans un délai de 2 mois) ou tout trajet supérieur à 150 km.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary font-black text-base flex items-center justify-center">
              4
            </div>
            <h3 className="font-bold text-sm text-slate-900">Documents à bord</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Présentez au chauffeur votre carte Vitale à jour, l'attestation de droits papier et l'original du volet de transport.
            </p>
          </div>
        </div>
      </section>

      {/* Accord Préalable Spécial Martinique */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface-container rounded-3xl p-8 border border-outline-variant/30 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary">Quand faut-il demander un Accord Préalable en Martinique ?</h2>
              <p className="text-xs text-slate-600">Formulaire S3139 à envoyer au médecin conseil de la CGSS Martinique</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900">Transports en Série</div>
              <p className="text-slate-600">
                Au moins 4 transports de plus de 50 km aller au cours d'une période de 2 mois pour un même traitement (ex: chimiothérapie ou hémodialyse).
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900">Longue Distance (&gt; 150 km)</div>
              <p className="text-slate-600">
                Transports spécifiques nécessitant des transferts éloignés ou consultations hors département (évacuation sanitaire / EVASAN vers la métropole ou Guadeloupe).
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900">Transports par Avion de Ligne / Bateau</div>
              <p className="text-slate-600">
                Trajets sanitaires nécessitant un vol commercial régulier (Martinique - Guadeloupe - Saint-Martin) prescrit par l'équipe hospitalière.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 34 Communes de Martinique */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Maillage Sanitaire Intégral des 34 Communes</h2>
          <p className="text-xs text-slate-500">Un transporteur conventionné disponible où que vous soyez sur l'île</p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
            {MARTINIQUE_COMMUNES.map((commune) => (
              <div key={commune} className="p-2 bg-slate-50 rounded-lg text-slate-700 font-medium flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-secondary shrink-0" />
                <span className="truncate">{commune}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
