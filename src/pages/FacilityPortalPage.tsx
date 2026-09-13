import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { rideService } from '../services/rideService';
import { Ride } from '../types';
import { exportRidesToExcel, exportRidesToPdf } from '../utils/exportUtils';

export const FacilityPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [selectedRideForPmt, setSelectedRideForPmt] = useState<Ride | null>(null);
  const [filterText, setFilterText] = useState('');
  const [rideToCancel, setRideToCancel] = useState<Ride | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('SORTIE_REPORTEE');
  const [cancelCustomNote, setCancelCustomNote] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadFacilityRides = async () => {
      setIsLoading(true);
      try {
        const all = await rideService.getAllRides();
        setRides(all);
      } catch (err) {
        console.warn('Erreur chargement sorties hôpital:', err);
        setRides([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFacilityRides();

    // Form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (window.location.pathname === '/') {
          navigate('/reserver');
        } else if (window.location.pathname === '/reserver') {
          navigate('/confirmation/MT-972-8821');
        } else if (window.location.pathname.startsWith('/inscription')) {
          alert("Votre dossier a bien été soumis à la régulation Médic'Trans 972.");
          navigate('/');
        }
      });
    });

    // Button navigation shortcuts
    document.querySelectorAll('button').forEach(btn => {
      const text = btn.textContent || '';
      if (text.includes('Étape 2') || text.includes('Continuer vers') || text.includes('Continuer ma réservation')) {
        btn.addEventListener('click', () => navigate('/reserver'));
      } else if (text.includes('Confirmer') || text.includes('Valider la demande') || text.includes('Valider la réservation')) {
        btn.addEventListener('click', () => navigate('/confirmation/MT-972-8821'));
      } else if (text.includes('Suivi') || text.includes('Suivre')) {
        btn.addEventListener('click', () => navigate('/suivi'));
      }
    });
  }, [navigate]);

  const activeMissions = useMemo(() => {
    return rides.filter(r => ['PENDING', 'ACCEPTED', 'EN_ROUTE', 'PICKED_UP'].includes(r.status));
  }, [rides]);

  const historyMissions = useMemo(() => {
    return rides.filter(r => ['COMPLETED', 'CANCELLED'].includes(r.status));
  }, [rides]);

  const displayedRides = useMemo(() => {
    const baseList = activeTab === 'ACTIVE'
      ? activeMissions
      : historyMissions.filter(r => {
          if (historyFilter === 'COMPLETED') return r.status === 'COMPLETED';
          if (historyFilter === 'CANCELLED') return r.status === 'CANCELLED';
          return true;
        });

    if (!filterText.trim()) return baseList;
    const q = filterText.toLowerCase();
    return baseList.filter(
      (r) =>
        r.reference.toLowerCase().includes(q) ||
        r.patient.firstName.toLowerCase().includes(q) ||
        r.patient.lastName.toLowerCase().includes(q) ||
        r.patient.nir.includes(q) ||
        r.dropoffCity.toLowerCase().includes(q) ||
        r.pickupCity.toLowerCase().includes(q) ||
        (r.facilityDepartment && r.facilityDepartment.toLowerCase().includes(q)) ||
        (r.bedDischargeNumber && r.bedDischargeNumber.toLowerCase().includes(q))
    );
  }, [activeTab, activeMissions, historyMissions, historyFilter, filterText]);

  // Export Handlers
  const handleExportExcel = () => {
    exportRidesToExcel(displayedRides, {
      filename: `Historique_Demandes_Hopital_${new Date().toISOString().slice(0, 10)}`,
      title: activeTab === 'ACTIVE' ? 'Demandes Sanitaires en Cours - Établissement' : 'Historique des Demandes de Transports - Établissement',
      userContext: 'CHU de Martinique / Régulation Hospitalière'
    });
    setToastMessage({
      title: 'Export Excel réussi',
      desc: `${displayedRides.length} demande(s) exportée(s) au format .csv pour Excel.`
    });
  };

  const handleExportPdf = () => {
    exportRidesToPdf(displayedRides, {
      filename: `Historique_Demandes_Hopital_${new Date().toISOString().slice(0, 10)}`,
      title: activeTab === 'ACTIVE' ? 'Demandes Sanitaires en Cours' : 'Historique des Demandes Sanitaires',
      subtitle: `Établissement : CHU de Martinique | Onglet : ${activeTab === 'ACTIVE' ? 'Missions en cours' : historyFilter === 'ALL' ? 'Toutes les archives' : historyFilter === 'COMPLETED' ? 'Terminées' : 'Annulées'} (${displayedRides.length} dossiers)`,
      userContext: 'Service Régulation & Sorties de Lit 972'
    });
    setToastMessage({
      title: 'Export PDF généré',
      desc: `Le registre PDF officiel de vos demandes a été téléchargé avec succès.`
    });
  };

  const assignedCount = rides.filter(
    (r) => r.status === 'ACCEPTED' || r.status === 'EN_ROUTE' || r.status === 'PICKED_UP'
  ).length;
  const pendingCount = rides.filter((r) => r.status === 'PENDING').length;

  const openCancelModal = (ride: Ride) => {
    setRideToCancel(ride);
    setCancelReason('SORTIE_REPORTEE');
    setCancelCustomNote('');
  };

  const confirmCancelRide = async () => {
    if (!rideToCancel) return;
    const ref = rideToCancel.reference;

    const reasonLabels: Record<string, string> = {
      SORTIE_REPORTEE: 'Sortie d\'hospitalisation décalée ou annulée par le médecin',
      ETAT_SANTE: 'Évolution clinique du patient / maintien en hospitalisation',
      PRISE_EN_CHARGE_FAMILLE: 'Patient raccompagné par un proche ou transport personnel',
      ERREUR_SAISIE: 'Erreur de saisie / doublon de prescription',
      AUTRE: 'Autre motif médical ou administratif'
    };

    const fullReason = cancelCustomNote.trim()
      ? `${reasonLabels[cancelReason] || cancelReason} (${cancelCustomNote.trim()})`
      : (reasonLabels[cancelReason] || cancelReason);

    // Optimistic update
    setRides((prev) =>
      prev.map((r) => (r.reference.toUpperCase() === ref.toUpperCase() ? { ...r, status: 'CANCELLED' } : r))
    );

    setToastMessage({
      title: 'Demande de transport annulée',
      desc: `La course #${ref} a été annulée avec succès.`
    });

    setRideToCancel(null);

    try {
      await rideService.cancelRide(ref, fullReason);
    } catch (err) {
      console.error('Erreur annulation transport hôpital:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-fixed selection:text-primary">
      <Header />
      <SEOHead
        title="Portail Établissements de Santé Martinique | Régulation Sorties d'Hospitalisation"
        description="Outil pour cadres de santé, médecins et secrétariats hospitaliers en Martinique. Automatisation des sorties et transferts sanitaires CHU Pierre Zobda-Quitman, Trinité, Marin."
        canonicalPath="/etablissements"
        ogImage="/assets/medictrans_hero_discover.jpg"
      />
      <main className="w-full pt-20 bg-background min-h-screen"><div className="flex flex-col w-full">

<section className="w-full bg-surface-container-lowest shadow-sm">
<div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-md flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary shadow-sm">
<span className="material-symbols-outlined text-[28px]">local_hospital</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">Portail Hospitalier Dédié</span>
<span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Raccordement ROR &amp; DPI Direct</span>
</div>
<h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">CHU Pierre Zobda-Quitman</h1>
<p className="font-body-sm text-body-sm text-on-surface-variant">Service Néphrologie, Dialyse &amp; Hémodialyse Lourde • Pavillon M - Niveau 3</p>
</div>
</div>

<div className="flex flex-wrap items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-xl">
<div className="flex items-center gap-space-xs text-primary">
<span className="material-symbols-outlined text-[20px]">ring_volume</span>
<span className="font-label-md text-label-md font-bold">Astreinte Cadre Régulateur :</span>
</div>
<a className="font-headline-sm text-headline-sm text-primary hover:text-primary-container transition-colors tracking-tight" href="tel:0596720097">
          05 96 72 00 97
        </a>
<span className="bg-secondary text-on-secondary px-space-xs py-0.5 rounded-full font-label-sm text-label-sm font-bold">LIGNE DIRECTE DÉDIÉE</span>
</div>
</div>
</section>

<section className="w-full max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-lg">
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Sorties Attendues</span>
<span className="material-symbols-outlined text-primary text-[22px]">calendar_today</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-sm">
<span className="font-headline-xl text-headline-xl text-primary font-bold">{rides.length}</span>
<span className="font-label-md text-label-md text-on-surface-variant">patients programmés</span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-sm overflow-hidden">
<div className="bg-primary h-full w-[100%] rounded-full"></div>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">Synchronisation directe réseau 972</span>
</div>

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Départs Assignés</span>
<span className="material-symbols-outlined text-secondary text-[22px]">check_circle</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-sm">
<span className="font-headline-xl text-headline-xl text-secondary font-bold">{assignedCount}</span>
<span className="font-label-md text-label-md text-secondary">transporteurs confirmés</span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-sm overflow-hidden">
<div className="bg-secondary h-full w-[100%] rounded-full"></div>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">Rotations sécurisées</span>
</div>

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary font-bold">En cours de dispatch</span>
<span className="material-symbols-outlined text-tertiary text-[22px] animate-spin">sync</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-sm">
<span className="font-headline-xl text-headline-xl text-tertiary font-bold">{pendingCount}</span>
<span className="font-label-md text-label-md text-on-surface-variant">recherches actives</span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-sm overflow-hidden">
<div className="bg-tertiary h-full w-[100%] rounded-full"></div>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">File d'attente automatisée 972</span>
</div>

<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
<div className="flex items-center justify-between">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-bold">Délai d'Affectation</span>
<span className="material-symbols-outlined text-primary text-[22px]">timer</span>
</div>
<div className="flex items-baseline gap-space-xs mt-space-sm">
<span className="font-headline-xl text-headline-xl text-primary font-bold">4<span className="font-headline-sm text-headline-sm font-normal">m</span> 12<span className="font-headline-sm text-headline-sm font-normal">s</span></span>
<span className="font-label-md text-label-md text-secondary font-bold">-18% vs moyenne</span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full mt-space-sm overflow-hidden">
<div className="bg-secondary h-full w-[82%] rounded-full"></div>
</div>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-space-xs">Optimisation réseau Fort-de-France</span>
</div>
</div>
</section>

<section className="w-full max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg mb-space-xl">

<div className="flex flex-wrap items-center justify-between gap-space-md mb-space-md">
<div className="flex items-center gap-space-xs bg-surface-container p-1 rounded-xl">
<button className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs bg-surface-container-lowest text-primary shadow-sm font-bold" id="tabBtnTransports">
<span className="material-symbols-outlined text-[18px]">departure_board</span>
<span className="">Départs &amp; File de Service</span>
<span className="bg-primary text-on-primary text-[11px] px-1.5 py-0.5 rounded-full">14</span>
</button>
<button className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs text-on-surface-variant hover:text-on-surface" id="tabBtnNewExpress">
<span className="material-symbols-outlined text-[18px]">add_circle</span>
<span className="">Sortie de Lit Express</span>
</button>
<button className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs text-on-surface-variant hover:text-on-surface" id="tabBtnBordereaux">
<span className="material-symbols-outlined text-[18px]">verified_user</span>
<span className="">Bordereaux &amp; Rapprochement PMT</span>
<span className="bg-surface-container-highest text-primary text-[11px] px-1.5 py-0.5 rounded-full">3 à signer</span>
</button>
</div>

<div className="flex items-center gap-space-sm">
<span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">Période :</span>
<div className="bg-surface-container-lowest px-space-sm py-space-xs rounded-lg shadow-sm flex items-center gap-space-xs">
<span className="material-symbols-outlined text-secondary text-[18px]">schedule</span>
<span className="font-label-md text-label-md font-bold text-on-surface">Aujourd'hui, Service Jour</span>
</div>
<button className="p-space-xs bg-surface-container-lowest hover:bg-surface-container rounded-lg shadow-sm text-on-surface-variant hover:text-primary transition-all"  title="Rafraîchir les statuts">
<span className="material-symbols-outlined text-[20px]">refresh</span>
</button>
</div>
</div>

<div className="flex flex-col gap-space-lg" id="viewTransports">

<div className="bg-surface-container-high/60 p-space-md rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md shadow-sm">
<div className="flex items-center gap-space-md">
<div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
<span className="material-symbols-outlined text-[22px]">alt_route</span>
</div>
<div className="flex flex-col">
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Régulation Territoriale Martinique Centre</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Liaisons maritimes et axes routiers Trinité/Fort-de-France fluides. Temps d'approche estimés fiables.</p>
</div>
</div>
<div className="flex items-center gap-space-sm">
<button className="bg-primary text-on-primary hover:bg-primary-container px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-space-xs shadow-sm transition-all" >
<span className="material-symbols-outlined text-[18px]">add_box</span>
<span className="">Programmer un départ</span>
</button>
</div>
</div>

<div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant/30">
  {/* En-tête avec Sélecteur d'onglets, Exports & Recherche */}
  <div className="p-space-md flex flex-col gap-space-sm border-b border-outline-variant/20">
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
      <div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">domain</span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold text-base md:text-lg">
            Régulation des Départs &amp; Sorties de Lit (972)
          </h2>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
          CHU Pierre Zobda-Quitman &amp; Établissements conventionnés ARS Martinique
        </p>
      </div>

      {/* Boutons d'export Excel & PDF */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExportExcel}
          className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          title="Exporter la liste sous format Excel (.csv)"
        >
          <span className="material-symbols-outlined text-base text-emerald-700">table_view</span>
          <span>Export Excel</span>
        </button>

        <button
          type="button"
          onClick={handleExportPdf}
          className="px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
          title="Générer un rapport PDF officiel"
        >
          <span className="material-symbols-outlined text-base text-primary">picture_as_pdf</span>
          <span>Export PDF</span>
        </button>

        <div className="relative">
          <input
            className="px-space-sm py-1.5 pl-8 rounded-xl bg-surface-container text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest w-52 sm:w-60 transition-all text-xs border border-outline-variant/30"
            placeholder="Filtrer patient, NIR, lit..."
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <span className="material-symbols-outlined text-outline absolute left-2 top-2 text-base">
            search
          </span>
        </div>
      </div>
    </div>

    {/* Onglets principaux : Missions en cours vs Historique */}
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ACTIVE'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-base">pending_actions</span>
          <span>Missions en cours</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {activeMissions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-primary text-white shadow-xs'
              : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
          }`}
        >
          <span className="material-symbols-outlined text-base">history</span>
          <span>Historique des demandes</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === 'HISTORY' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {historyMissions.length}
          </span>
        </button>
      </div>

      {/* Sous-filtres d'historique (Terminées / Annulées) */}
      {activeTab === 'HISTORY' && (
        <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-xl">
          {[
            { id: 'ALL', label: 'Toutes les archives', count: historyMissions.length },
            { id: 'COMPLETED', label: 'Terminées', count: rides.filter(r => r.status === 'COMPLETED').length },
            { id: 'CANCELLED', label: 'Annulées', count: rides.filter(r => r.status === 'CANCELLED').length }
          ].map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setHistoryFilter(sub.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                historyFilter === sub.id
                  ? 'bg-white text-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {sub.label} ({sub.count})
            </button>
          ))}
        </div>
      )}
    </div>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full text-left font-body-sm text-body-sm">
      <thead>
        <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider text-[10px]">
          <th className="py-space-sm px-space-md">Heure &amp; Lit</th>
          <th className="py-space-sm px-space-md">Patient &amp; NIR</th>
          <th className="py-space-sm px-space-md">Destination &amp; Trajet</th>
          <th className="py-space-sm px-space-md">Mode Prescrit</th>
          <th className="py-space-sm px-space-md">Prescription PMT</th>
          <th className="py-space-sm px-space-md">Transporteur Mandaté</th>
          <th className="py-space-sm px-space-md">Statut Régulation</th>
          <th className="py-space-sm px-space-md text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="text-on-surface text-xs">
        {displayedRides.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-14 text-center">
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1 shadow-xs">
                  <span className="material-symbols-outlined text-2xl">medical_services</span>
                </div>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  {activeTab === 'ACTIVE'
                    ? 'Aucune mission en cours'
                    : 'Aucune demande archivée'}
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant max-w-md mx-auto">
                  {activeTab === 'ACTIVE'
                    ? 'Toutes les sorties programmées ont été prises en charge ou clôturées.'
                    : 'Aucun transport sanitaire archivé ne correspond aux filtres appliqués.'}
                </p>
                {activeTab === 'ACTIVE' && (
                  <button
                    onClick={() => navigate('/reserver')}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary/90 transition-all"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Programmer une sortie de lit
                  </button>
                )}
              </div>
            </td>
          </tr>
        ) : (
          displayedRides.map((ride) => {
            const hasPmt = ride.patient.hasPmt || ride.patient.pmtUploaded || ride.patient.pmtFileUrl;
            return (
              <tr key={ride.id} className="hover:bg-surface-container-low/40 transition-colors border-b border-outline-variant/10">
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">
                      {new Date(ride.pickupDateTime).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded w-fit mt-0.5 font-mono text-[10px]">
                      {ride.bedDischargeNumber || ride.facilityDepartment || 'Service Jour'}
                    </span>
                  </div>
                </td>
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-bold">
                      {ride.patient.firstName} {ride.patient.lastName}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono text-[11px]">
                      NIR: {ride.patient.nir}
                    </span>
                  </div>
                </td>
                <td className="py-space-md px-space-md">
                  <div className="flex flex-col min-w-[170px]">
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      {ride.dropoffAddress}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {ride.dropoffCity}
                    </span>
                  </div>
                </td>
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <span className="bg-primary-container/60 text-on-primary font-label-md text-label-md px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-[15px]">
                      {ride.transportType === 'AMBULANCE'
                        ? 'airline_seat_flat'
                        : ride.transportType === 'TAXI_CONVENTIONNE'
                        ? 'local_taxi'
                        : 'directions_car'}
                    </span>
                    {ride.transportType === 'AMBULANCE'
                      ? 'Ambulance'
                      : ride.transportType === 'TAXI_CONVENTIONNE'
                      ? 'Taxi Conv.'
                      : 'VSL Médicalisé'}
                  </span>
                </td>
                <td className="py-space-md px-space-md whitespace-nowrap">
                  {hasPmt ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="material-symbols-outlined text-[13px] text-emerald-600">verified</span>
                      <span>PMT Jointe</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="material-symbols-outlined text-[13px] text-amber-600">description</span>
                      <span>Cerfa Papier</span>
                    </span>
                  )}
                </td>
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      {ride.assignedTransporter?.companyName || "En cours d'affectation"}
                    </span>
                    {ride.assignedTransporter?.driverPhone && (
                      <a
                        className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1 text-[11px]"
                        href={`tel:${ride.assignedTransporter.driverPhone}`}
                      >
                        <span className="material-symbols-outlined text-[13px]">phone</span>
                        {ride.assignedTransporter.driverPhone}
                      </a>
                    )}
                  </div>
                </td>
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <div
                    className={`flex items-center gap-space-xs px-2.5 py-1 rounded-full text-[11px] w-fit font-bold border ${
                      ride.status === 'ACCEPTED' || ride.status === 'EN_ROUTE'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : ride.status === 'COMPLETED'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : ride.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        ride.status === 'ACCEPTED' || ride.status === 'EN_ROUTE'
                          ? 'bg-emerald-500'
                          : ride.status === 'COMPLETED'
                          ? 'bg-blue-500'
                          : ride.status === 'CANCELLED'
                          ? 'bg-rose-500'
                          : 'bg-amber-500 animate-pulse'
                      }`}
                    ></span>
                    <span>
                      {ride.status === 'ACCEPTED'
                        ? 'Accepté'
                        : ride.status === 'EN_ROUTE'
                        ? 'En approche'
                        : ride.status === 'PICKED_UP'
                        ? 'Patient à bord'
                        : ride.status === 'COMPLETED'
                        ? 'Effectué'
                        : ride.status === 'CANCELLED'
                        ? 'Annulé'
                        : "En recherche"}
                    </span>
                  </div>
                </td>
                <td className="py-space-md px-space-md whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Bouton Fiche PMT & Dossier */}
                    <button
                      type="button"
                      onClick={() => setSelectedRideForPmt(ride)}
                      className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1 transition-all"
                      title="Consulter la prescription médicale et les consignes"
                    >
                      <span className="material-symbols-outlined text-sm">description</span>
                      <span className="hidden sm:inline">Fiche PMT</span>
                    </button>

                    <button
                      onClick={() => navigate('/suivi')}
                      className="bg-surface-container hover:bg-surface-container-high text-primary p-1.5 rounded-lg transition-all"
                      title="Suivi en direct"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                    </button>

                    {ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
                      <button
                        onClick={() => openCancelModal(ride)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg transition-all"
                        title="Annuler cette sortie de lit"
                      >
                        <span className="material-symbols-outlined text-base">cancel</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>

  <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-sm font-label-md text-label-md text-on-surface-variant">
<div className="flex items-center gap-space-sm">
<span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary"></span>
<span className="">Synchronisation automatique active toutes les 15s</span>
</div>
<div className="flex items-center gap-space-sm">
<span className="">Affichage : 4 sur 14 départs du jour</span>
<button className="text-primary hover:underline font-bold">Voir les 10 autres →</button>
</div>
</div>
</div>
</div>

<div className="hidden flex flex-col gap-space-lg" id="viewNewExpress">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">

<div className="lg:col-span-8 bg-surface-container-lowest p-space-xl rounded-xl shadow-sm">
<div className="flex items-center justify-between pb-space-md mb-space-md border-b border-surface-container">
<div>
<span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">Protocole Sortie Hospitalière Rapide</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-0.5">Demande de Sortie de Lit Express</h2>
</div>
<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[24px]">electric_bolt</span>
</div>
</div>
<form className="flex flex-col gap-space-lg" id="expressForm" >

<div className="flex flex-col gap-space-md">
<div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">1</span>
<span className="">Identification du Patient &amp; Localisation Lit</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">N° IPP / Dossier Patient *</label>
<div className="relative">
                  <input
                    className="w-full h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm"
                    defaultValue="972-0812903"
                    placeholder="Ex: 972-0488219"
                    required
                    type="text"
                  />
<button className="absolute right-2 top-2.5 text-primary text-[18px] material-symbols-outlined" title="Rapprocher avec DPI / Sillage" type="button">search</button>
</div>
<span className="font-label-sm text-label-sm text-secondary">Rapprochement DPI CHU actif</span>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">Nom &amp; Prénom du Patient *</label>
                <input
                  className="w-full h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm"
                  defaultValue="BERNARD Éliane"
                  placeholder="NOM Prénom"
                  required
                  type="text"
                />
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">Chambre / N° de Lit *</label>
                <input
                  className="w-full h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm"
                  defaultValue="Chambre 318 - Lit B"
                  placeholder="Ex: Ch 312 - Lit A"
                  required
                  type="text"
                />
</div>
</div>
</div>

<div className="flex flex-col gap-space-md">
<div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">2</span>
<span className="">Prescription Médicale de Transport (PMT)</span>
</div>

<div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            <label className="cursor-pointer">
              <input defaultChecked className="peer sr-only" name="transportMode" type="radio" value="ambulance" />
              <div className="p-space-md rounded-xl bg-surface-container-low peer-checked:bg-surface-container peer-checked:ring-2 peer-checked:ring-primary shadow-sm transition-all flex flex-col gap-space-xs relative">
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-primary text-[28px]">airline_seat_flat</span>
                  <span className="material-symbols-outlined text-secondary text-[20px] hidden peer-checked:block">check_circle</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Ambulance</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Position allongée ou demi-assise, surveillance constante</span>
                <span className="font-label-sm text-label-sm text-primary font-bold mt-1">100% Pris en Charge</span>
              </div>
            </label>
            <label className="cursor-pointer">
              <input className="peer sr-only" name="transportMode" type="radio" value="vsl" />
              <div className="p-space-md rounded-xl bg-surface-container-low peer-checked:bg-surface-container peer-checked:ring-2 peer-checked:ring-primary shadow-sm transition-all flex flex-col gap-space-xs relative">
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-secondary text-[28px]">directions_car</span>
                  <span className="material-symbols-outlined text-secondary text-[20px] hidden peer-checked:block">check_circle</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">VSL Médicalisé</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Position assise, aide technique à la marche requise</span>
                <span className="font-label-sm text-label-sm text-secondary font-bold mt-1">Conventionné CPAM</span>
              </div>
            </label>
            <label className="cursor-pointer">
              <input className="peer sr-only" name="transportMode" type="radio" value="taxi" />
              <div className="p-space-md rounded-xl bg-surface-container-low peer-checked:bg-surface-container peer-checked:ring-2 peer-checked:ring-primary shadow-sm transition-all flex flex-col gap-space-xs relative">
                <div className="flex items-center justify-between">
                  <span className="material-symbols-outlined text-tertiary text-[28px]">local_taxi</span>
                  <span className="material-symbols-outlined text-secondary text-[20px] hidden peer-checked:block">check_circle</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Taxi Conventionné</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Patient autonome pouvant voyager assis sans aide soignante</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-bold mt-1">Agrément 972</span>
              </div>
            </label>
</div>
</div>

<div className="flex flex-col gap-space-md">
<div className="flex items-center gap-space-xs text-primary font-headline-sm text-headline-sm">
<span className="w-6 h-6 rounded-full bg-primary text-on-primary text-[12px] flex items-center justify-center font-bold">3</span>
<span className="">Destination, Horaire &amp; Spécificités d'Étage</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">Heure de départ souhaitée du service *</label>
<div className="grid grid-cols-2 gap-space-xs">
<input className="h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm" defaultValue="2024-10-28" required type="date" />
<input className="h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm" defaultValue="13:30" required type="time" />
</div>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">Type d'Établissement / Arrivée *</label>
<select className="h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm">
<option >Retour au Domicile</option>
<option>Transfert EHPAD / Résidence Senior</option>
<option>Transfert SSR (Trinité / Saint-Esprit)</option>
<option>Clinique Sainte-Marie (Schoelcher)</option>
<option>Centre d'Hémodialyse externe</option>
</select>
</div>
<div className="sm:col-span-2 flex flex-col gap-1">
<label className="font-label-md text-label-md text-on-surface font-bold">Adresse Complète de Prise en Charge à l'Arrivée *</label>
<input className="w-full h-11 px-space-sm rounded-lg bg-surface-container text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest shadow-sm" defaultValue="Résidence Les Balisiers, Apt 24, 97233 Schoelcher" placeholder="Numéro, Rue, Résidence, Bâtiment, Ville, Code Postal" required type="text" />
</div>
</div>

<div className="bg-surface-container-low p-space-md rounded-xl flex flex-col sm:flex-row flex-wrap gap-space-md">
<label className="flex items-center gap-space-xs cursor-pointer">
<input defaultChecked className="w-5 h-5 rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-md text-label-md text-on-surface font-bold">Brancardage lourd / Étage sans ascenseur</span>
</label>
<label className="flex items-center gap-space-xs cursor-pointer">
<input className="w-5 h-5 rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-md text-label-md text-on-surface font-bold">Oxygénothérapie continue</span>
</label>
<label className="flex items-center gap-space-xs cursor-pointer">
<input defaultChecked className="w-5 h-5 rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-md text-label-md text-on-surface font-bold">Fauteuil roulant personnel à embarquer</span>
</label>
<label className="flex items-center gap-space-xs cursor-pointer">
<input className="w-5 h-5 rounded text-primary focus:ring-0" type="checkbox" />
<span className="font-label-md text-label-md text-on-surface font-bold">Isolement infectieux contact/gouttelettes</span>
</label>
</div>
</div>

<div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md">
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">security</span>
<span className="">Diffusion instantanée aux 42 ambulanciers &amp; taxis conventionnés 972</span>
</div>
<div className="flex items-center gap-space-sm w-full sm:w-auto">
<button className="w-full sm:w-auto px-space-lg h-12 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all"  type="button">
                  Annuler
                </button>
<button className="w-full sm:w-auto px-space-xl h-12 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-space-xs shadow-md transition-all" type="submit">
<span className="material-symbols-outlined text-[20px]">broadcast_on_personal</span>
<span className="">Diffuser la demande de sortie</span>
</button>
</div>
</div>
</form>
</div>

<div className="lg:col-span-4 flex flex-col gap-space-lg">

<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
<div className="flex items-center gap-space-xs text-primary">
<span className="material-symbols-outlined text-[24px]">verified</span>
<h3 className="font-headline-sm text-headline-sm font-bold">Rappel Bonnes Pratiques Cadres</h3>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
              En application de l'article R.322-10-1 du Code de la Sécurité Sociale, la prescription médicale de transport doit correspondre strictement à l'état d'autonomie du patient au jour du départ.
            </p>
<div className="flex flex-col gap-space-xs bg-surface-container-low p-space-sm rounded-lg">
<span className="font-label-md text-label-md text-primary font-bold">Sorties Avant 12h00 :</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Priorisées sur la tournée de libération des lits d'aval des urgences CHU.</span>
</div>
<div className="flex flex-col gap-space-xs bg-surface-container-low p-space-sm rounded-lg">
<span className="font-label-md text-label-md text-secondary font-bold">Navette Trinité &lt;-&gt; FDF :</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Départs réguliers coordonnées à 10h30, 14h00 et 17h30.</span>
</div>
</div>

<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<span className="font-headline-sm text-headline-sm text-on-surface font-bold">Disponibilité Flotte 972</span>
<span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
</div>
<div className="flex flex-col gap-space-sm">
<div className="flex justify-between items-center font-label-md text-label-md">
<span className="text-on-surface-variant">Ambulances disponibles Fort-de-France</span>
<span className="font-bold text-primary">7 actives</span>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-primary h-full w-[75%]"></div>
</div>
<div className="flex justify-between items-center font-label-md text-label-md mt-1">
<span className="text-on-surface-variant">VSL Secteur Lamentin / Schoelcher</span>
<span className="font-bold text-secondary">11 actifs</span>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-secondary h-full w-[90%]"></div>
</div>
<div className="flex justify-between items-center font-label-md text-label-md mt-1">
<span className="text-on-surface-variant">Taxis conventionnés Nord &amp; Sud</span>
<span className="font-bold text-tertiary">18 actifs</span>
</div>
<div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
<div className="bg-tertiary h-full w-[60%]"></div>
</div>
</div>
<div className="pt-space-sm text-center">
<span className="font-label-sm text-label-sm text-on-surface-variant">Délai estimé moyen de réponse : <strong className="text-on-surface">3 à 5 minutes</strong></span>
</div>
</div>
</div>
</div>
</div>

<div className="hidden flex flex-col gap-space-lg" id="viewBordereaux">
<div className="bg-surface-container-lowest p-space-xl rounded-xl shadow-sm flex flex-col gap-space-lg">
<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md border-b border-surface-container pb-space-md">
<div className="flex flex-col">
<span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Télétransmission BBD &amp; PECSE Titre Subrogatoire</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface mt-0.5">Bordereaux de Sortie &amp; Validation PMT</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant">Signature électronique des prescriptions de transport par les praticiens hospitaliers du service.</p>
</div>
<div className="flex items-center gap-space-sm">
<button className="bg-secondary text-on-secondary hover:bg-secondary/90 px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-space-xs shadow-sm transition-all">
<span className="material-symbols-outlined text-[18px]">draw</span>
<span className="">Signature Groupée (3 PMT)</span>
</button>
</div>
</div>

<div className="flex flex-col gap-space-md">

<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]">description</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-label-lg text-label-lg font-bold text-on-surface">PMT N° 972-2024-88190</span>
<span className="bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold">En attente signature Médecin</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Patient : Mme CÉLESTINE Ginette • Trajet : CHU Zobda-Quitman → Domicile Schoelcher</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Prescripteur : Dr. V. Lamartine (Néphrologue) • Motif : Sortie de dialyse bimensuelle</span>
</div>
</div>
<div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
<button className="bg-surface-container hover:bg-surface-container-high text-primary px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all">
                Aperçu Cerfa
              </button>
<button className="bg-primary text-on-primary hover:bg-primary-container px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-1 shadow-sm transition-all">
<span className="material-symbols-outlined text-[18px]">fingerprint</span>
                Signer PMT
              </button>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]">description</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-label-lg text-label-lg font-bold text-on-surface">PMT N° 972-2024-88194</span>
<span className="bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold">En attente signature Médecin</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Patient : Mme JOSEPH-MONROSE L. • Trajet : CHU → SSR Hôpital Louis Domergue Trinité</span>
<span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Prescripteur : Dr. P. Aliker (Chef de Clinique) • Motif : Transfert convalescence post-op</span>
</div>
</div>
<div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
<button className="bg-surface-container hover:bg-surface-container-high text-primary px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all">
                Aperçu Cerfa
              </button>
<button className="bg-primary text-on-primary hover:bg-primary-container px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-1 shadow-sm transition-all">
<span className="material-symbols-outlined text-[18px]">fingerprint</span>
                Signer PMT
              </button>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md opacity-90">
<div className="flex items-center gap-space-md">
<div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]">task_alt</span>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-space-xs">
<span className="font-label-lg text-label-lg font-bold text-on-surface">PMT N° 972-2024-88012</span>
<span className="bg-[#D1FAE5] text-[#065F46] px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold">Signé &amp; Télétransmis CPAM</span>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Patient : M. BELLAY Thierry • Société assignée : Taxi Médical Foyalais</span>
<span className="font-label-sm text-label-sm text-secondary mt-0.5">Accusé BBD reçu • CPAM Martinique 972 / N° Bordereau: BDX-24-9912</span>
</div>
</div>
<div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
<button className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-1 transition-all">
<span className="material-symbols-outlined text-[18px]">download</span>
                Télécharger Billet
              </button>
</div>
</div>
</div>
</div>
</div>
</section>

      {/* Modal Détails & Fiche PMT Établissement */}
      {selectedRideForPmt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn flex flex-col gap-4 my-8">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">description</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Dossier &amp; Fiche PMT #{selectedRideForPmt.reference}
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    Programmé pour le {new Date(selectedRideForPmt.pickupDateTime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(selectedRideForPmt.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRideForPmt(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Statut & Alertes */}
            {selectedRideForPmt.status === 'CANCELLED' && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-start gap-2.5">
                <span className="material-symbols-outlined text-rose-600 text-lg shrink-0 mt-0.5">cancel</span>
                <div>
                  <div className="font-bold text-rose-900">Demande de transport annulée.</div>
                  <p className="text-rose-800 text-[11px] mt-0.5">
                    {selectedRideForPmt.mobility.notes || 'Annulation enregistrée par le service hospitalier.'}
                  </p>
                </div>
              </div>
            )}

            {selectedRideForPmt.status === 'COMPLETED' && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">check_circle</span>
                <div>
                  <span className="font-bold text-emerald-900">Transport sanitaire effectué et clôturé.</span>{' '}
                  <span className="text-emerald-800 text-[11px]">Prise en charge réalisée conformément aux prescriptions.</span>
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Patient & Service */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/30">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Patient</span>
                  <p className="font-bold text-on-surface mt-1 text-sm">
                    {selectedRideForPmt.patient.firstName} {selectedRideForPmt.patient.lastName}
                  </p>
                  <p className="font-mono text-on-surface-variant text-[11px] mt-0.5">
                    NIR : {selectedRideForPmt.patient.nir}
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {selectedRideForPmt.patient.isAld ? 'PEC 100% ALD' : 'Sécurité Sociale 65%'}
                  </span>
                </div>

                <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/30">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Service &amp; Lit</span>
                  <p className="font-bold text-on-surface mt-1">
                    {selectedRideForPmt.facilityDepartment || 'Service Néphrologie & Dialyse'}
                  </p>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">
                    Emplacement : <strong className="text-primary">{selectedRideForPmt.bedDischargeNumber || 'Service Jour'}</strong>
                  </p>
                  <p className="text-on-surface-variant text-[10px] mt-1">
                    {selectedRideForPmt.isRoundTrip ? '🔄 Aller - Retour' : '➡️ Aller simple'}
                  </p>
                </div>
              </div>

              {/* Trajet */}
              <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/30 space-y-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Trajet &amp; Destination</span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-on-surface">{selectedRideForPmt.pickupAddress} ({selectedRideForPmt.pickupCity})</span>
                  <span className="text-secondary font-bold">➔</span>
                  <span className="font-semibold text-on-surface">{selectedRideForPmt.dropoffAddress} ({selectedRideForPmt.dropoffCity})</span>
                </div>
              </div>

              {/* Fiche PMT & Justificatif */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                    <span className="material-symbols-outlined text-base">verified</span>
                    <span>Prescription Médicale de Transport (Cerfa S3138)</span>
                  </div>
                  {selectedRideForPmt.patient.hasPmt || selectedRideForPmt.patient.pmtUploaded || selectedRideForPmt.patient.pmtFileUrl ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      PMT Numérique
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      Cerfa Papier
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-on-surface-variant block text-[10px]">Médecin Prescripteur :</span>
                    <strong className="text-on-surface">{selectedRideForPmt.patient.pmtPrescriberDoctor || 'Dr. Alix Célestine - CHU Martinique'}</strong>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[10px]">Mode de Transport Prescrit :</span>
                    <strong className="text-primary font-bold">
                      {selectedRideForPmt.transportType === 'AMBULANCE' ? 'Ambulance Type B' : selectedRideForPmt.transportType === 'TAXI_CONVENTIONNE' ? 'Taxi Conventionné' : 'VSL'}
                    </strong>
                  </div>
                </div>

                {selectedRideForPmt.patient.hasPmt || selectedRideForPmt.patient.pmtUploaded || selectedRideForPmt.patient.pmtFileUrl ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-emerald-700 text-lg shrink-0">attach_file</span>
                      <span className="text-[11px] text-emerald-950 font-semibold truncate">
                        {selectedRideForPmt.patient.pmtFileName || 'Prescription_Medicale_S3138.pdf'}
                      </span>
                    </div>
                    <a
                      href={selectedRideForPmt.patient.pmtFileUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shrink-0"
                    >
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                      <span>Consulter la PMT</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-700 text-base shrink-0 mt-0.5">info</span>
                    <span>
                      Prescription rédigée sur <strong>formulaire Cerfa S3138 papier</strong> par le praticien. Document remis en main propre à l'équipage sanitaire.
                    </span>
                  </div>
                )}
              </div>

              {/* Transporteur Mandaté */}
              <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30 space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Transporteur Sanitaire Mandaté</span>
                <p className="font-bold text-on-surface">
                  {selectedRideForPmt.assignedTransporter?.companyName || "En cours d'affectation par la régulation"}
                </p>
                {selectedRideForPmt.assignedTransporter && (
                  <p className="text-on-surface-variant text-[11px]">
                    Chauffeur : <strong>{selectedRideForPmt.assignedTransporter.driverName}</strong> ({selectedRideForPmt.assignedTransporter.vehiclePlate}) · Tél : <a href={`tel:${selectedRideForPmt.assignedTransporter.driverPhone}`} className="text-primary font-bold hover:underline">{selectedRideForPmt.assignedTransporter.driverPhone}</a>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-outline-variant/20">
              {selectedRideForPmt.status !== 'COMPLETED' && selectedRideForPmt.status !== 'CANCELLED' ? (
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedRideForPmt;
                    setSelectedRideForPmt(null);
                    openCancelModal(r);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">cancel</span>
                  <span>Annuler cette sortie</span>
                </button>
              ) : (
                <div></div>
              )}

              <button
                onClick={() => setSelectedRideForPmt(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : ANNULATION DE LA DEMANDE DE TRANSPORT PAR L'ÉTABLISSEMENT         */}
      {/* ========================================================================= */}
      {rideToCancel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-lg">cancel</span>
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">
                    Annuler la demande de transport
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    Course #{rideToCancel.reference}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRideToCancel(null)}
                className="text-on-surface-variant hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Récapitulatif Course & Patient */}
            <div className="bg-surface-container-low p-3.5 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-on-surface text-sm">
                Patient : {rideToCancel.patient.firstName} {rideToCancel.patient.lastName}
              </div>
              <div className="text-on-surface-variant">
                Trajet : <strong>{rideToCancel.pickupCity}</strong> ➔ <strong>{rideToCancel.dropoffCity}</strong>
              </div>
              <div className="text-on-surface-variant">
                Statut actuel : <strong className="text-secondary">{rideToCancel.status}</strong>
              </div>
            </div>

            {/* Choix du motif d'annulation */}
            <div className="space-y-2 text-xs">
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant">
                Motif de l'annulation hospitalière :
              </label>
              {[
                { id: 'SORTIE_REPORTEE', label: '📅 Sortie d\'hospitalisation décalée ou reportée' },
                { id: 'ETAT_SANTE', label: '🩺 Évolution clinique / Maintien en surveillance' },
                { id: 'PRISE_EN_CHARGE_FAMILLE', label: '🚗 Patient raccompagné par un proche / famille' },
                { id: 'ERREUR_SAISIE', label: '⚠️ Erreur de saisie / doublon de prescription' },
                { id: 'AUTRE', label: '📝 Autre motif médical ou administratif' }
              ].map((reason) => (
                <label
                  key={reason.id}
                  onClick={() => setCancelReason(reason.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    cancelReason === reason.id
                      ? 'border-rose-300 bg-rose-50/70 text-rose-900 font-semibold'
                      : 'border-outline-variant/30 hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="facilityCancelReason"
                    value={reason.id}
                    checked={cancelReason === reason.id}
                    onChange={() => setCancelReason(reason.id)}
                    className="accent-rose-600"
                  />
                  <span>{reason.label}</span>
                </label>
              ))}

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mt-2 mb-1">
                  Commentaire / Note au dossier (optionnel) :
                </label>
                <input
                  type="text"
                  value={cancelCustomNote}
                  onChange={(e) => setCancelCustomNote(e.target.value)}
                  placeholder="ex. Décision Dr. Aliker suite à bilan sanguin..."
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setRideToCancel(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all"
              >
                Garder la demande
              </button>
              <button
                type="button"
                onClick={confirmCancelRide}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">cancel</span>
                <span>Confirmer l'annulation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 max-w-md bg-surface-container-lowest text-on-surface p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 border border-secondary/30 animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base">cancel</span>
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-on-surface text-sm">{toastMessage.title}</div>
            <p className="text-on-surface-variant mt-0.5 leading-relaxed">{toastMessage.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

</div></main>
<Footer />
    </div>
  );
};
