import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { whatsappService } from '../services/whatsappService';

export const TrackingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const rides = [
    {
      id: 'MT-2024-8841',
      date: 'Demain · 15 Oct.',
      time: '08h15',
      route: 'Schoelcher ➔ CHU Zobda-Quitman',
      reason: 'Chirurgie Ambulatoire',
      vehicle: 'Ambulance Type B',
      company: 'Madinina Secours 972',
      status: 'confirmed',
      statusText: 'Confirmé',
    },
    {
      id: 'MT-2024-8840',
      date: "Aujourd'hui",
      time: '14h15',
      route: 'Schoelcher ➔ Centre Dillon',
      reason: 'Hémodialyse',
      vehicle: 'Taxi Conventionné',
      company: "En cours d'affectation",
      status: 'pending',
      statusText: 'En recherche',
    },
    {
      id: 'MT-2024-8832',
      date: 'Ven. 11 Oct.',
      time: '07h30',
      route: 'Schoelcher ➔ Centre Dillon',
      reason: 'Séance de Dialyse',
      vehicle: 'Taxi Conventionné',
      company: 'Taxi Madinina Express',
      status: 'completed',
      statusText: 'Effectué',
    },
    {
      id: 'MT-2024-8819',
      date: 'Mer. 09 Oct.',
      time: '13h45',
      route: 'Schoelcher ➔ CHU Zobda-Quitman',
      reason: 'Bilan Cardiologique Pré-Op',
      vehicle: 'VSL',
      company: 'Ambulances Caraïbes Santé',
      status: 'completed',
      statusText: 'Effectué',
    },
  ];

  const filteredRides = rides.filter(
    (r) =>
      r.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary flex flex-col">
      <Header />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* Network status ticker banner */}
        {showBanner && (
          <div className="w-full bg-surface-container-high px-margin md:px-margin-md lg:px-margin-lg py-space-sm shadow-xs border-b border-outline-variant/20">
            <div className="max-w-[1280px] w-full mx-auto flex flex-wrap items-center justify-between gap-space-sm text-xs md:text-sm">
              <div className="flex items-center gap-space-sm">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
                </span>
                <span className="font-label-md text-label-md text-on-surface">
                  Réseau Martinique Sud &amp; Centre actif : 42 ambulances et taxis conventionnés en liaison continue avec le SAMU 972.
                </span>
              </div>
              <div className="flex items-center gap-space-md">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[11px] font-bold">
                  Synchronisé avec CPAM 972
                </span>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-on-surface-variant hover:text-on-surface flex items-center p-1"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-[1280px] w-full mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-lg flex flex-col gap-space-xl">
          {/* Header Title */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
            <div className="flex flex-col gap-space-xs max-w-2xl">
              <div className="flex items-center gap-space-sm">
                <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold text-xs">
                  Espace Patient &amp; Coordonnateur Clinique
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                  Dossier ID: #MQ-97204-J
                </span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold text-2xl md:text-3xl">
                Tableau de bord de suivi - Transports en cours
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                Superviser la prise en charge sanitaire, la géolocalisation des équipages agréés ARS et
                les attestations 100% Tiers-Payant Sécurité Sociale.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            {/* Left Col: Active Card & History */}
            <div className="lg:col-span-8 flex flex-col gap-space-xl">
              {/* Active Search / Broadcast Card */}
              <div className="relative bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-md overflow-hidden border border-outline-variant/30">
                <div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-200/40 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-wrap items-center justify-between gap-space-sm relative z-10">
                  <div className="flex items-center gap-space-sm">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-label-md text-label-md font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                      RECHERCHE ACTIVE D'UN TRANSPORTEUR
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                      Départ estimé dans 1h45
                    </span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold text-sm">
                    Aujourd'hui · 14h15
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md relative z-10 pt-space-xs">
                  <div className="md:col-span-8 flex flex-col gap-space-md">
                    <div className="flex items-start gap-space-md">
                      <div className="flex flex-col items-center pt-1">
                        <span className="material-symbols-outlined text-primary text-xl">
                          radio_button_checked
                        </span>
                        <div className="w-0.5 h-12 bg-surface-container-high my-1"></div>
                        <span className="material-symbols-outlined text-secondary text-xl">
                          location_on
                        </span>
                      </div>
                      <div className="flex flex-col gap-space-md w-full">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[10px] font-bold">
                            Prise en charge à domicile
                          </span>
                          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                            Résidence Les Almadies, Bât B
                          </h2>
                          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                            97233 Schoelcher · Accès rampe PMR
                          </p>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[10px] font-bold">
                            Destination médicale
                          </span>
                          <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                            Centre d'Hémodialyse de Dillon
                          </h2>
                          <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                            Rue Raymond Hermence, 97200 Fort-de-France
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-surface-container-low p-space-md rounded-xl flex flex-col justify-between gap-space-sm border border-outline-variant/30">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                        Prescription Médicale
                      </span>
                      <span className="font-label-lg text-label-lg text-on-surface flex items-center gap-1.5 mt-1 font-bold text-xs">
                        <span className="material-symbols-outlined text-primary text-base">
                          local_taxi
                        </span>
                        Taxi Conventionné CPAM
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-[11px]">
                        Station assise / Patient autonome
                      </span>
                    </div>
                    <div className="pt-space-xs">
                      <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-bold text-xs">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        PEC 100% ALD n°03
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/80 rounded-xl p-space-md flex flex-col gap-space-sm relative z-10 border border-amber-200/60">
                  <div className="flex flex-wrap items-center justify-between gap-space-xs">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-amber-800 text-xl animate-spin">
                        sync
                      </span>
                      <span className="font-label-md text-label-md text-amber-900 font-semibold text-xs">
                        Demande diffusée à 18 chauffeurs agréés du secteur Centre/Nord Caraïbe
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-amber-800 font-bold text-xs">
                      Attente moyenne : ~6 min
                    </span>
                  </div>

                  <div className="w-full bg-amber-200/70 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full w-2/3 transition-all duration-1000 animate-pulse"></div>
                  </div>
                  <p className="font-body-sm text-body-sm text-amber-900/80 text-xs">
                    Notre algorithme interroge successivement les taxis sanitaires conventionnés en fin
                    de course à proximité de Schoelcher et Case-Pilote.
                  </p>
                </div>
              </div>

              {/* Confirmed Mission Card */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex flex-wrap items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-label-md text-label-md font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      MISSION ACCEPTÉE &amp; PLANIFIÉE
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                      Transport n°MT-2024-8841
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-headline-sm text-headline-sm text-secondary font-bold text-sm">
                      Demain · Mardi 15 Octobre
                    </span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                      Prise en charge à domicile : 08h15
                    </p>
                  </div>
                </div>

                <div className="bg-surface-container-low p-space-md rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/20">
                  <div className="flex items-center gap-space-md">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-2xl">medical_services</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant text-xs">
                        <span>Résidence Les Almadies (Schoelcher)</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        <span className="text-on-surface font-semibold">CHU Pierre Zobda-Quitman (FDF)</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5 font-bold text-sm">
                        Consultation Chirurgie Ambulatoire - Bâtiment C
                      </h3>
                      <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                        Convocation clinique fixée à 09h00 (Arrivée prévue 08h45)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end">
                    <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                      Type d'équipement
                    </span>
                    <span className="font-label-lg text-label-lg text-primary font-bold text-sm">
                      Ambulance Type B climatisée
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary text-xs">
                      Position allongée prescrite
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
                  {/* Assigned Driver Card */}
                  <div className="md:col-span-7 flex flex-col gap-space-sm bg-surface-container-low/50 p-space-md rounded-xl border border-outline-variant/30">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-[10px] font-bold">
                      Transporteur Sanitaire Agréé
                    </span>
                    <div className="flex items-center gap-space-md">
                      <img
                        className="w-14 h-14 rounded-full object-cover shadow-xs shrink-0 ring-2 ring-secondary/30"
                        alt="Chauffeur Frantz"
                        src="/assets/step3_care.jpg"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs">
                          <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                            Frantz M.
                          </h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-high text-secondary font-label-sm text-label-sm text-[10px]">
                            Agrément ARS n°972-2021-04
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                          Ambulances Madinina Secours 972
                        </span>
                        <div className="flex items-center gap-space-sm mt-1">
                          <span className="font-label-sm text-label-sm text-on-surface flex items-center gap-1 text-xs">
                            <span className="material-symbols-outlined text-sm text-amber-500">star</span>{' '}
                            4.97 (142 avis)
                          </span>
                          <span className="text-on-surface-variant font-label-sm text-label-sm text-xs">
                            · Conventionné CPAM 972
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-space-xs pt-space-xs text-xs">
                      <span className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-sm text-primary">directions_car</span>
                        GK-428-MQ
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-sm text-secondary">ac_unit</span>
                        Climatisé
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface font-label-sm text-label-sm flex items-center gap-1 text-xs">
                        <span className="material-symbols-outlined text-sm text-primary">airline_seat_flat</span>
                        Brancard coquille
                      </span>
                    </div>
                  </div>

                  {/* Arrival ETA */}
                  <div className="md:col-span-5 flex flex-col justify-between gap-space-sm bg-surface-container-low/50 p-space-md rounded-xl border border-outline-variant/30">
                    <div className="flex flex-col text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-on-surface-variant">Arrivée estimée au domicile</span>
                        <span className="text-secondary font-bold text-sm">08:15</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-on-surface-variant">Prise en charge</span>
                        <span className="text-on-surface font-semibold">08:30 au plus tard</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-on-surface-variant">Destination CHU</span>
                        <span className="text-on-surface font-semibold">08:45 à Fort-de-France</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-1">
                      <a
                        className="w-full h-10 px-3 rounded-xl bg-secondary text-on-secondary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-all truncate"
                        href="tel:0696884422"
                      >
                        <span className="material-symbols-outlined text-base shrink-0">call</span>
                        <span className="truncate">Appeler chauffeur (06 96 88 44 22)</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          whatsappService.openWhatsAppDirect(
                            '0696884422',
                            'DRIVER_APPROACHING',
                            {
                              patientName: 'Aimé GLISSANT',
                              driverName: 'Frantz M.',
                              vehiclePlate: 'GK-428-MQ',
                              etaMinutes: '15',
                              trackingUrl: window.location.href,
                            }
                          );
                        }}
                        className="w-full h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all truncate"
                      >
                        <span className="material-symbols-outlined text-base shrink-0">chat</span>
                        <span className="truncate">Échanger sur WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex flex-col">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">
                      Historique des transports sanitaires
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                      Suivi simplifié de vos demandes et transports programmés ou archivés.
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      className="h-10 pl-9 pr-3 rounded-xl bg-surface-container-low text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all w-64 text-xs border border-outline-variant/30"
                      placeholder="Rechercher un trajet, date..."
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="material-symbols-outlined text-outline absolute left-2.5 top-2.5 text-lg">
                      search
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4 rounded-l-lg">Date &amp; Heure</th>
                        <th className="py-3 px-4">Trajet / Destination</th>
                        <th className="py-3 px-4">Véhicule</th>
                        <th className="py-3 px-4">Statut</th>
                        <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-body-sm text-body-sm text-on-surface">
                      {filteredRides.map((ride) => (
                        <tr key={ride.id} className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-label-md text-label-md text-on-surface block font-semibold">
                              {ride.date}
                            </span>
                            <span className="text-on-surface-variant font-label-sm text-label-sm">
                              {ride.time}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-label-md text-label-md text-on-surface block font-semibold">
                              {ride.route}
                            </span>
                            <span className="text-on-surface-variant text-xs">{ride.reason}</span>
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-label-md text-label-md text-on-surface block font-semibold">
                              {ride.vehicle}
                            </span>
                            <span className="text-on-surface-variant text-xs">{ride.company}</span>
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                ride.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : ride.status === 'pending'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >
                              {ride.statusText}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 align-top text-right">
                            <button className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-sm text-xs font-bold transition-colors">
                              Détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Col: Stats & Support */}
            <aside className="lg:col-span-4 flex flex-col gap-space-lg">
              {/* Map Preview Card */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/30">
                <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">map</span>
                    <span className="font-bold text-sm text-primary">Régulation GPS 972</span>
                  </div>
                  <span className="text-xs text-secondary font-bold">En direct</span>
                </div>
                <div className="h-52 relative overflow-hidden">
                  <img
                    src="/assets/martinique_map.jpg"
                    alt="Régulation Martinique"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-xs text-xs font-semibold text-primary">
                    14 véhicules géolocalisés
                  </div>
                </div>
              </div>

              {/* Status breakdown */}
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg flex flex-col gap-space-md border border-outline-variant/30">
                <div className="flex items-center justify-between border-b border-surface-container-high pb-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-xl">analytics</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">
                      Statut de mes transports
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-semibold text-xs">
                    Temps réel
                  </span>
                </div>

                <div className="flex flex-col gap-space-sm text-xs">
                  <div className="flex items-center justify-between p- space-sm rounded-xl bg-surface-container-low p-2.5 border border-outline-variant/20">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          En diffusion
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                          Recherche transporteur active
                        </span>
                      </div>
                    </div>
                    <span className="font-headline-lg text-headline-lg text-amber-900 font-bold">1</span>
                  </div>

                  <div className="flex items-center justify-between p-space-sm rounded-xl bg-secondary-container/20 p-2.5 border border-secondary/20">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary text-base">
                          check_circle
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-secondary font-semibold">
                          Confirmé
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary text-[11px]">
                          Programmé pour demain
                        </span>
                      </div>
                    </div>
                    <span className="font-headline-lg text-headline-lg text-secondary font-bold">1</span>
                  </div>

                  <div className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low p-2.5 border border-outline-variant/20">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-outline text-base">history</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                          Archivés
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                          Courses passées réalisées
                        </span>
                      </div>
                    </div>
                    <span className="font-headline-lg text-headline-lg text-on-surface font-bold">12</span>
                  </div>
                </div>
              </div>

              {/* Assistance Helpline banner */}
              <div className="bg-primary text-on-primary rounded-2xl p-space-lg flex flex-col gap-space-md shadow-md relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-space-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold w-fit tracking-wide uppercase">
                    URGENCES RELATIVES &amp; TRANSFERTS
                  </span>
                  <h4 className="font-headline-sm text-headline-sm font-bold text-base">
                    Besoin d'un transport imprévu ?
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-primary-container text-xs leading-relaxed">
                    Notre centre de régulation en Martinique vous assiste 24h/24 et 7j/7 pour adapter
                    vos horaires ou organiser un rapatriement.
                  </p>
                </div>
                <div className="relative z-10 flex flex-col gap-space-sm pt-space-xs">
                  <a
                    className="w-full h-12 bg-white text-primary rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-2 hover:bg-surface-container-low transition-colors shadow-sm font-bold text-sm"
                    href="tel:0596720097"
                  >
                    <span className="material-symbols-outlined text-xl text-secondary">call</span>
                    <span>05 96 72 00 97</span>
                  </a>
                  <span className="font-label-sm text-label-sm text-center text-on-primary-container text-[11px]">
                    Numéro local non surtaxé · Coordination CHU / Cliniques
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
