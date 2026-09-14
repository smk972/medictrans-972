import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { rideService } from '../services/rideService';
import { Ride, TransportType } from '../types';
import { exportRidesToExcel, exportRidesToPdf } from '../utils/exportUtils';
import { FileUpload, UploadedFile } from '../components/FileUpload';
import { CPAM_TRANSPORT_MOTIFS } from '../data/cpamMotifs';

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

  // État Renouvellement
  const [rideToRenew, setRideToRenew] = useState<Ride | null>(null);
  const [renewDate, setRenewDate] = useState<string>('');
  const [renewAppointmentTime, setRenewAppointmentTime] = useState<string>('09:00');
  const [renewDepartment, setRenewDepartment] = useState<string>('');
  const [renewFloor, setRenewFloor] = useState<string>('');
  const [renewRoom, setRenewRoom] = useState<string>('');
  const [renewNotes, setRenewNotes] = useState<string>('');
  const [isRenewing, setIsRenewing] = useState<boolean>(false);

  // État Modal "Commander un transport"
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Champs du formulaire "Commander un transport"
  const [orderPatientLastName, setOrderPatientLastName] = useState('BERNARD');
  const [orderPatientFirstName, setOrderPatientFirstName] = useState('Éliane');
  const [orderPatientBirthDate, setOrderPatientBirthDate] = useState('1956-07-22');
  const [orderPatientNir, setOrderPatientNir] = useState('2 56 07 97 214 382 19');
  const [orderPatientPhone, setOrderPatientPhone] = useState('0696 34 56 78');
  const [orderIsAld, setOrderIsAld] = useState(true);

  // Localisation précise au sein de l'établissement (demandé impérativement par l'utilisateur)
  const [orderFacilityName, setOrderFacilityName] = useState('CHU de Martinique - Hôpital Pierre Zobda-Quitman');
  const [orderFacilityDepartment, setOrderFacilityDepartment] = useState('Cardiologie');
  const [orderFacilityFloor, setOrderFacilityFloor] = useState('2ème étage');
  const [orderFacilityStaircase, setOrderFacilityStaircase] = useState('Escalier B');
  const [orderFacilityRoom, setOrderFacilityRoom] = useState('Chambre 214');
  const [orderFacilityBed, setOrderFacilityBed] = useState('Lit A');

  // Contact référent (la personne à contacter si besoin)
  const [orderContactPhone, setOrderContactPhone] = useState('05 96 55 21 34');
  const [orderContactName, setOrderContactName] = useState('Cadre de santé - Service Jour');

  // Toute information supplémentaire jugée utile pour la prise en charge
  const [orderAdditionalNotes, setOrderAdditionalNotes] = useState('Sortie post-angioplastie. Patient à récupérer en chambre avec son dossier soignant et ses bagages. Repos assis conseillé.');

  // Paramètres transport & destination
  const [orderTransportType, setOrderTransportType] = useState<TransportType>('VSL');
  const [orderPickupDate, setOrderPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderPickupTime, setOrderPickupTime] = useState('11:30');
  const [orderDropoffAddress, setOrderDropoffAddress] = useState('Résidence Les Balisiers, Apt 24');
  const [orderDropoffCity, setOrderDropoffCity] = useState('Schœlcher');
  const [orderHasPmt, setOrderHasPmt] = useState(true);
  const [orderDoctor, setOrderDoctor] = useState('Dr. Alix Célestine - Cardiologue CHU');
  const [orderPmtDocument, setOrderPmtDocument] = useState<UploadedFile | null>(null);
  const [orderPmtTransmissionMode, setOrderPmtTransmissionMode] = useState<'UPLOAD' | 'PAPIER'>('UPLOAD');
  const [orderPmtMotif, setOrderPmtMotif] = useState<string>("Sortie d'hospitalisation / Retour à domicile");
  const [previewPmtDoc, setPreviewPmtDoc] = useState<{ name: string; url: string } | null>(null);

  // Contraintes de mobilité
  const [orderWheelchair, setOrderWheelchair] = useState(false);
  const [orderStretcher, setOrderStretcher] = useState(false);
  const [orderOxygen, setOrderOxygen] = useState(false);
  const [orderStairs, setOrderStairs] = useState(false);
  const [orderNeedsEscort, setOrderNeedsEscort] = useState(false);

  const loadFacilityRides = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadFacilityRides();
  }, [loadFacilityRides]);

  const openRenewModal = (ride: Ride) => {
    setRideToRenew(ride);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRenewDate(tomorrow.toISOString().split('T')[0]);
    setRenewAppointmentTime(
      ride.appointmentTime ||
      (ride.pickupDateTime ? new Date(ride.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '09:00')
    );
    setRenewDepartment(ride.facilityDepartment || '');
    setRenewFloor(ride.facilityFloor || '');
    setRenewRoom(ride.facilityRoom || '');
    setRenewNotes('');
  };

  const handleConfirmRenew = async () => {
    if (!rideToRenew || !renewDate || !renewAppointmentTime) return;
    setIsRenewing(true);
    try {
      const newPickupDateTime = new Date(`${renewDate}T${renewAppointmentTime}:00`).toISOString();
      const payload: Omit<Ride, 'id' | 'reference' | 'createdAt' | 'status'> = {
        pickupAddress: rideToRenew.pickupAddress,
        pickupCity: rideToRenew.pickupCity,
        dropoffAddress: rideToRenew.dropoffAddress,
        dropoffCity: rideToRenew.dropoffCity,
        facilityName: rideToRenew.facilityName,
        facilityDepartment: renewDepartment.trim() || rideToRenew.facilityDepartment,
        facilityFloor: renewFloor.trim() || rideToRenew.facilityFloor,
        facilityRoom: renewRoom.trim() || rideToRenew.facilityRoom,
        facilityStaircase: rideToRenew.facilityStaircase,
        facilityBed: rideToRenew.facilityBed,
        facilityContactName: rideToRenew.facilityContactName,
        facilityContactPhone: rideToRenew.facilityContactPhone,
        pickupDateTime: newPickupDateTime,
        returnDateTime: rideToRenew.isRoundTrip ? new Date(new Date(newPickupDateTime).getTime() + 4 * 3600000).toISOString() : undefined,
        isRoundTrip: Boolean(rideToRenew.isRoundTrip),
        transportType: rideToRenew.transportType,
        source: 'FACILITY',
        appointmentTime: renewAppointmentTime,
        patient: { ...rideToRenew.patient },
        mobility: {
          ...rideToRenew.mobility,
          notes: renewNotes.trim()
            ? `${renewNotes.trim()} (Renouvellement hospitalier #${rideToRenew.reference})`
            : `Renouvellement du transport hospitalier #${rideToRenew.reference}`
        }
      };

      const newRide = await rideService.createRide(payload);
      await loadFacilityRides();

      setToastMessage({
        title: 'Commande renouvelée avec succès',
        desc: `La nouvelle demande #${newRide.reference} a été créée pour le ${new Date(renewDate).toLocaleDateString('fr-FR')} à ${renewAppointmentTime}.`
      });

      setRideToRenew(null);
    } catch (err) {
      console.error('Erreur renouvellement:', err);
      alert('Une erreur est survenue lors du renouvellement.');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleCreateFacilityRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderPatientLastName.trim() || !orderPatientFirstName.trim()) {
      alert("Veuillez renseigner le nom et le prénom du patient.");
      return;
    }

    const bedComposite = `Ch. ${orderFacilityRoom || 'N/A'} - Lit ${orderFacilityBed || 'N/A'} (${orderFacilityFloor || 'RDC'}, ${orderFacilityStaircase || 'Esc. Principal'})`;

    const newRideData = {
      pickupAddress: `${orderFacilityName}, ${orderFacilityDepartment}`,
      pickupCity: 'Fort-de-France',
      dropoffAddress: orderDropoffAddress || 'Quartier Cluny, Résidence Les Alizés',
      dropoffCity: orderDropoffCity || 'Schœlcher',
      facilityName: orderFacilityName,
      pickupDateTime: `${orderPickupDate}T${orderPickupTime}:00`,
      isRoundTrip: false,
      transportType: orderTransportType,
      source: 'FACILITY' as const,
      facilityDepartment: orderFacilityDepartment,
      bedDischargeNumber: bedComposite,
      facilityFloor: orderFacilityFloor,
      facilityStaircase: orderFacilityStaircase,
      facilityRoom: orderFacilityRoom,
      facilityBed: orderFacilityBed,
      facilityContactPhone: orderContactPhone,
      facilityContactName: orderContactName,
      additionalNotes: orderAdditionalNotes,
      hasPmt: true,
      pmtUploaded: orderPmtTransmissionMode === 'UPLOAD' && !!orderPmtDocument,
      pmtFileName: orderPmtDocument?.name || (orderPmtTransmissionMode === 'PAPIER' ? 'PMT_Cerfa_Papier_S3138.pdf' : undefined),
      pmtFileUrl: orderPmtDocument?.dataUrl,
      pmtPrescriberDoctor: orderDoctor,
      patient: {
        firstName: orderPatientFirstName,
        lastName: orderPatientLastName.toUpperCase(),
        birthDate: orderPatientBirthDate,
        nir: orderPatientNir || '1 60 01 97 212 345 67',
        phone: orderPatientPhone,
        email: `${orderPatientFirstName.toLowerCase().replace(/\s+/g, '')}@chu-martinique.fr`,
        address: orderDropoffAddress || 'Fort-de-France',
        city: orderDropoffCity,
        postalCode: '97200',
        isAld: orderIsAld,
        hasPmt: true,
        pmtPrescriberDoctor: orderDoctor,
        pmtDate: orderPickupDate,
        pmtUploaded: orderPmtTransmissionMode === 'UPLOAD' && !!orderPmtDocument,
        pmtFileName: orderPmtDocument?.name || (orderPmtTransmissionMode === 'PAPIER' ? 'PMT_Cerfa_Papier_S3138.pdf' : undefined),
        pmtFileUrl: orderPmtDocument?.dataUrl,
      },
      mobility: {
        wheelchair: orderWheelchair,
        stretcher: orderStretcher || orderTransportType === 'AMBULANCE',
        oxygen: orderOxygen,
        stairsWithoutElevator: orderStairs,
        needsEscort: orderNeedsEscort,
        notes: orderAdditionalNotes,
      },
    };

    try {
      const created = await rideService.createRide(newRideData as any);
      setRides((prev) => [created, ...prev]);
      setIsOrderModalOpen(false);
      setOrderPmtDocument(null);
      setActiveTab('ACTIVE');
      setToastMessage({
        title: 'Transport commandé avec succès !',
        desc: `La demande #${created.reference} a été transmise en direct au réseau des transporteurs conventionnés.`
      });
    } catch (err) {
      console.error('Erreur commande transport:', err);
      alert('Erreur lors de la création du transport.');
    }
  };

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
<button
  type="button"
  onClick={() => setIsOrderModalOpen(true)}
  className="px-space-md py-space-xs rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-xs text-on-surface-variant hover:text-primary cursor-pointer"
  id="tabBtnNewExpress"
>
<span className="material-symbols-outlined text-[18px]">add_circle</span>
<span className="">Commander un transport</span>
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
<button
  type="button"
  onClick={() => setIsOrderModalOpen(true)}
  className="bg-primary text-on-primary hover:bg-primary/90 px-space-md py-space-xs rounded-lg font-label-md text-label-md flex items-center gap-space-xs shadow-sm transition-all cursor-pointer"
>
<span className="material-symbols-outlined text-[18px]">add_box</span>
<span className="font-bold">Commander un transport</span>
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

  {/* Indicateur de défilement horizontal et vue complète */}
  <div className="px-space-md py-2.5 bg-surface-container-low/70 border-b border-outline-variant/20 flex flex-wrap items-center justify-between text-xs text-on-surface-variant gap-2">
    <div className="flex items-center gap-1.5 font-bold text-primary">
      <span className="material-symbols-outlined text-base">view_column</span>
      <span>Registre des Transports Hospitaliers (9 colonnes complètes)</span>
    </div>
    <div className="flex items-center gap-1 text-[11px] text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg font-medium border border-outline-variant/20">
      <span className="material-symbols-outlined text-xs">swap_horiz</span>
      <span>Défilement horizontal disponible pour voir toutes les colonnes</span>
    </div>
  </div>

  <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-outline-variant/50">
    <table className="min-w-[1380px] w-full text-left font-body-sm text-body-sm">
      <thead>
        <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider text-[10px]">
          <th className="py-space-sm px-space-md">Heure &amp; Service</th>
          <th className="py-space-sm px-space-md">Étage, Esc., Ch., Lit</th>
          <th className="py-space-sm px-space-md">Patient &amp; NIR</th>
          <th className="py-space-sm px-space-md">Destination</th>
          <th className="py-space-sm px-space-md">Mode Prescrit</th>
          <th className="py-space-sm px-space-md">Prescription PMT</th>
          <th className="py-space-sm px-space-md">Transporteur Mandaté</th>
          <th className="py-space-sm px-space-md">Contact Référent</th>
          <th className="py-space-sm px-space-md text-right">Statut &amp; Actions</th>
        </tr>
      </thead>
      <tbody className="text-on-surface text-xs">
        {displayedRides.length === 0 ? (
          <tr>
            <td colSpan={9} className="py-14 text-center">
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
                    onClick={() => setIsOrderModalOpen(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">add_box</span>
                    <span>Commander un transport</span>
                  </button>
                )}
              </div>
            </td>
          </tr>
        ) : (
          displayedRides.map((ride) => {
            const hasPmt = ride.patient.hasPmt || ride.patient.pmtUploaded || ride.patient.pmtFileUrl;
            return (
              <tr
                key={ride.id}
                onClick={() => setSelectedRideForPmt(ride)}
                className="hover:bg-primary/5 cursor-pointer transition-colors border-b border-outline-variant/10 group"
              >
                {/* 1. Heure & Service */}
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">
                      {new Date(ride.pickupDateTime).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded w-fit mt-0.5 font-mono text-[10px]">
                      {ride.facilityDepartment || 'Service Jour'}
                    </span>
                  </div>
                </td>

                {/* 2. Étage, Escalier, Chambre, Lit */}
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 font-semibold text-on-surface text-[11px]">
                      <span className="material-symbols-outlined text-xs text-primary">layers</span>
                      <span>{ride.facilityFloor || '2ème étage'}</span>
                      <span className="text-outline-variant">•</span>
                      <span>{ride.facilityStaircase || 'Escalier B'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-mono">
                      <span className="material-symbols-outlined text-xs text-secondary">hotel</span>
                      <span>{ride.facilityRoom || 'Ch. 214'}</span>
                      <span className="text-outline-variant">•</span>
                      <span className="text-primary font-bold">{ride.facilityBed || 'Lit A'}</span>
                    </div>
                  </div>
                </td>

                {/* 3. Patient & NIR */}
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-bold">
                      {ride.patient.firstName} {ride.patient.lastName}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono text-[11px]">
                      NIR: {ride.patient.nir}
                    </span>
                    {ride.patient.isAld && (
                      <span className="w-fit text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded mt-0.5">
                        PEC 100% ALD
                      </span>
                    )}
                  </div>
                </td>

                {/* 4. Destination */}
                <td className="py-space-md px-space-md">
                  <div className="flex flex-col min-w-[180px]">
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      {ride.dropoffAddress}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {ride.dropoffCity}
                    </span>
                  </div>
                </td>

                {/* 5. Mode Prescrit */}
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

                {/* 6. Prescription PMT */}
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

                {/* 7. Transporteur Mandaté */}
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      {ride.assignedTransporter?.companyName || "En cours d'affectation"}
                    </span>
                    {ride.assignedTransporter?.driverPhone && (
                      <a
                        onClick={(e) => e.stopPropagation()}
                        className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1 text-[11px]"
                        href={`tel:${ride.assignedTransporter.driverPhone}`}
                      >
                        <span className="material-symbols-outlined text-[13px]">phone</span>
                        {ride.assignedTransporter.driverPhone}
                      </a>
                    )}
                  </div>
                </td>

                {/* 8. Contact Référent */}
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-on-surface">
                      {ride.facilityContactName || 'Cadre de service'}
                    </span>
                    <a
                      onClick={(e) => e.stopPropagation()}
                      className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1 text-[11px] font-mono mt-0.5"
                      href={`tel:${ride.facilityContactPhone || '0596720097'}`}
                    >
                      <span className="material-symbols-outlined text-[13px]">phone_in_talk</span>
                      <span>{ride.facilityContactPhone || '05 96 72 00 97'}</span>
                    </a>
                  </div>
                </td>

                {/* 9. Statut Régulation & Actions */}
                <td className="py-space-md px-space-md whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div
                      className={`flex items-center gap-space-xs px-2.5 py-1 rounded-full text-[11px] font-bold border ${
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
                          : 'En recherche'}
                      </span>
                    </div>

                    {/* Bouton Fiche de Demande */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRideForPmt(ride);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      title="Consulter la fiche de demande, la localisation et les consignes soignants"
                    >
                      <span className="material-symbols-outlined text-sm text-primary">assignment</span>
                      <span className="hidden sm:inline">Fiche</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/suivi');
                      }}
                      className="bg-surface-container hover:bg-surface-container-high text-primary p-1.5 rounded-lg transition-all cursor-pointer"
                      title="Suivi en direct"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                    </button>

                    {/* Renouveler si course terminée */}
                    {ride.status === 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenewModal(ride);
                        }}
                        className="bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        title="Renouveler ce transport avec nouvelle date et service"
                      >
                        <span className="material-symbols-outlined text-sm">replay</span>
                        <span className="hidden sm:inline">Renouveler</span>
                      </button>
                    )}

                    {/* Annuler si course active */}
                    {ride.status !== 'COMPLETED' && ride.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCancelModal(ride);
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg transition-all cursor-pointer"
                        title="Annuler cette demande de transport"
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

      {/* ========================================================================= */}
      {/* MODAL : FICHE DE DEMANDE & DOSSIER PMT ÉTABLISSEMENT                      */}
      {/* ========================================================================= */}
      {selectedRideForPmt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn flex flex-col gap-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 sticky top-0 bg-surface-container-lowest z-10">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">assignment</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Fiche de Demande &amp; Dossier PMT #{selectedRideForPmt.reference}
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    Programmé pour le {new Date(selectedRideForPmt.pickupDateTime).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(selectedRideForPmt.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRideForPmt(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
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

            <div className="space-y-3.5 text-xs">
              {/* Patient & Droits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Patient Bénéficiaire</span>
                    {selectedRideForPmt.patient.isAld ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        PEC 100% ALD
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-on-surface-variant">
                        Régime général 65%
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-on-surface text-sm">
                    {selectedRideForPmt.patient.firstName} {selectedRideForPmt.patient.lastName}
                  </p>
                  <p className="font-mono text-on-surface-variant text-[11px] mt-0.5">
                    NIR : <strong>{selectedRideForPmt.patient.nir}</strong>
                  </p>
                  {selectedRideForPmt.patient.phone && (
                    <p className="text-on-surface-variant text-[11px] mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">phone</span>
                      <span>Tél patient : {selectedRideForPmt.patient.phone}</span>
                    </p>
                  )}
                </div>

                {/* Localisation interne spécifique : Service, Étage, Escalier, Chambre, Lit */}
                <div className="bg-surface-container-low p-3.5 rounded-2xl border border-primary/20 space-y-1.5">
                  <div className="flex items-center gap-1 text-primary font-bold text-[10px] uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">apartment</span>
                    <span>Localisation Interne Établissement</span>
                  </div>
                  <p className="font-bold text-on-surface text-xs">
                    {selectedRideForPmt.facilityName || 'CHU Pierre Zobda-Quitman'}
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[11px] bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/20">
                    <div>
                      <span className="text-on-surface-variant text-[10px] block">Service :</span>
                      <strong className="text-primary">{selectedRideForPmt.facilityDepartment || 'Cardiologie'}</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[10px] block">Étage :</span>
                      <strong className="text-on-surface">{selectedRideForPmt.facilityFloor || '2ème étage'}</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[10px] block">Escalier :</span>
                      <strong className="text-on-surface">{selectedRideForPmt.facilityStaircase || 'Escalier B'}</strong>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[10px] block">Chambre &amp; Lit :</span>
                      <strong className="text-secondary">{selectedRideForPmt.facilityRoom || 'Chambre 214'} · {selectedRideForPmt.facilityBed || 'Lit A'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personne à contacter si besoin */}
              <div className="bg-primary/5 p-3.5 rounded-2xl border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">support_agent</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Personne à contacter si besoin (Soignant référent)</span>
                    <span className="font-bold text-on-surface text-xs">
                      {selectedRideForPmt.facilityContactName || 'Cadre de santé - Service Jour'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <a
                    href={`tel:${selectedRideForPmt.facilityContactPhone || '0596720097'}`}
                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                    <span>{selectedRideForPmt.facilityContactPhone || '05 96 72 00 97'}</span>
                  </a>
                </div>
              </div>

              {/* Toute information supplémentaire jugée utile pour la prise en charge */}
              <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-on-surface-variant font-bold text-[10px] uppercase tracking-wider">
                  <span className="material-symbols-outlined text-sm text-secondary">clinical_notes</span>
                  <span>Informations supplémentaires utiles pour la prise en charge</span>
                </div>
                <div className="p-2.5 bg-surface-container-lowest rounded-xl border border-outline-variant/20 text-on-surface text-xs leading-relaxed">
                  {selectedRideForPmt.additionalNotes || selectedRideForPmt.mobility?.notes || 'Aucune consigne particulière spécifiée pour cette prise en charge.'}
                </div>
                {/* Badges de mobilité */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedRideForPmt.mobility?.wheelchair && (
                    <span className="px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-semibold text-[10px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">accessible</span> Fauteuil roulant
                    </span>
                  )}
                  {selectedRideForPmt.mobility?.stretcher && (
                    <span className="px-2 py-0.5 rounded-md bg-primary-container text-on-primary font-semibold text-[10px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">airline_seat_flat</span> Brancardage requis
                    </span>
                  )}
                  {selectedRideForPmt.mobility?.oxygen && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-semibold text-[10px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">air</span> Oxygénothérapie
                    </span>
                  )}
                  {selectedRideForPmt.mobility?.stairsWithoutElevator && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-[10px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">stairs</span> Escalier sans ascenseur
                    </span>
                  )}
                </div>
              </div>

              {/* Trajet & Destination */}
              <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/30 space-y-1.5">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Trajet &amp; Destination</span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div>
                    <span className="text-on-surface-variant text-[10px] block">Départ :</span>
                    <span className="font-semibold text-on-surface">{selectedRideForPmt.pickupAddress} ({selectedRideForPmt.pickupCity})</span>
                  </div>
                  <span className="text-secondary font-bold hidden sm:inline">➔</span>
                  <div>
                    <span className="text-on-surface-variant text-[10px] block">Arrivée :</span>
                    <span className="font-semibold text-on-surface">{selectedRideForPmt.dropoffAddress} ({selectedRideForPmt.dropoffCity})</span>
                  </div>
                </div>
              </div>

              {/* Fiche PMT & Justificatif */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary/20 space-y-2">
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
                      {selectedRideForPmt.transportType === 'AMBULANCE' ? 'Ambulance Type B' : selectedRideForPmt.transportType === 'TAXI_CONVENTIONNE' ? 'Taxi Conventionné' : 'VSL Médicalisé'}
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
                    <button
                      type="button"
                      onClick={() => {
                        const fileUrl = selectedRideForPmt.patient.pmtFileUrl || (selectedRideForPmt as any).pmtFileUrl;
                        const fileName = selectedRideForPmt.patient.pmtFileName || (selectedRideForPmt as any).pmtFileName || 'Prescription_Medicale_S3138.pdf';
                        if (fileUrl) {
                          setPreviewPmtDoc({ name: fileName, url: fileUrl });
                        } else {
                          window.open('/Guide_Administrateur_MedicTrans_972.pdf', '_blank');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">visibility</span>
                      <span>Consulter la PMT</span>
                    </button>
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
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Transporteur Sanitaire Mandaté</span>
                <p className="font-bold text-on-surface text-xs">
                  {selectedRideForPmt.assignedTransporter?.companyName || "En cours d'affectation par la régulation hospitalière"}
                </p>
                {selectedRideForPmt.assignedTransporter && (
                  <p className="text-on-surface-variant text-[11px]">
                    Chauffeur : <strong>{selectedRideForPmt.assignedTransporter.driverName}</strong> ({selectedRideForPmt.assignedTransporter.vehiclePlate}) · Tél : <a href={`tel:${selectedRideForPmt.assignedTransporter.driverPhone}`} className="text-primary font-bold hover:underline">{selectedRideForPmt.assignedTransporter.driverPhone}</a>
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-outline-variant/20 sticky bottom-0 bg-surface-container-lowest">
              {selectedRideForPmt.status !== 'COMPLETED' && selectedRideForPmt.status !== 'CANCELLED' ? (
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedRideForPmt;
                    setSelectedRideForPmt(null);
                    openCancelModal(r);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">cancel</span>
                  <span>Annuler ce transport</span>
                </button>
              ) : selectedRideForPmt.status === 'COMPLETED' ? (
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedRideForPmt;
                    setSelectedRideForPmt(null);
                    openRenewModal(r);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">replay</span>
                  <span>Renouveler ce transport</span>
                </button>
              ) : (
                <div></div>
              )}

              <button
                onClick={() => setSelectedRideForPmt(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : COMMANDER UN TRANSPORT (DEMANDE ÉTABLISSEMENT)                    */}
      {/* ========================================================================= */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn flex flex-col gap-4 my-8 max-h-[92vh] overflow-y-auto">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 sticky top-0 bg-surface-container-lowest z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">local_hospital</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Commander un transport sanitaire</h3>
                  <p className="text-xs text-on-surface-variant">
                    Établissement : {orderFacilityName} • Régulation Martinique 972
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Formulaire de commande */}
            <form onSubmit={handleCreateFacilityRide} className="space-y-4 text-xs">
              {/* Section 1 : Localisation Précise dans l'Établissement */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/20 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">domain</span>
                  <span>1. Localisation au sein de l'Établissement</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Établissement de santé *
                    </label>
                    <input
                      type="text"
                      value={orderFacilityName}
                      onChange={(e) => setOrderFacilityName(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Service hospitalier *
                    </label>
                    <input
                      type="text"
                      value={orderFacilityDepartment}
                      onChange={(e) => setOrderFacilityDepartment(e.target.value)}
                      placeholder="Ex: Cardiologie, Néphrologie, Urgences..."
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* Étage, Escalier, Chambre, Lit */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase">
                      Étage *
                    </label>
                    <input
                      type="text"
                      value={orderFacilityFloor}
                      onChange={(e) => setOrderFacilityFloor(e.target.value)}
                      placeholder="Ex: 2ème étage, RDC"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase">
                      Escalier / Aile *
                    </label>
                    <input
                      type="text"
                      value={orderFacilityStaircase}
                      onChange={(e) => setOrderFacilityStaircase(e.target.value)}
                      placeholder="Ex: Escalier B, Aile Nord"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase">
                      Chambre *
                    </label>
                    <input
                      type="text"
                      value={orderFacilityRoom}
                      onChange={(e) => setOrderFacilityRoom(e.target.value)}
                      placeholder="Ex: Ch. 214"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant mb-1 uppercase">
                      Lit *
                    </label>
                    <input
                      type="text"
                      value={orderFacilityBed}
                      onChange={(e) => setOrderFacilityBed(e.target.value)}
                      placeholder="Ex: Lit A, Lit 2"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 : Contact Référent Soignant (demandé par l'utilisateur) */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">support_agent</span>
                  <span>2. Personne à contacter si besoin (Soignant référent)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Numéro de la personne à contacter si besoin *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={orderContactPhone}
                        onChange={(e) => setOrderContactPhone(e.target.value)}
                        placeholder="Ex: 05 96 55 21 34 ou 06 96 ..."
                        required
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                      />
                      <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-base text-secondary">
                        phone
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant mt-0.5 block">Ligne directe ou DECT du soignant responsable</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Nom / Qualité du contact référent
                    </label>
                    <input
                      type="text"
                      value={orderContactName}
                      onChange={(e) => setOrderContactName(e.target.value)}
                      placeholder="Ex: Cadre de santé - Service Jour / IDE Référente"
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3 : Informations supplémentaires pour la prise en charge (demandé par l'utilisateur) */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
                <div className="flex items-center gap-2 text-tertiary font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">clinical_notes</span>
                  <span>3. Informations supplémentaires utiles pour la prise en charge</span>
                </div>
                <label className="block text-[11px] font-bold text-on-surface">
                  Consignes particulières, matériel spécifique, état du patient, consignes de sortie :
                </label>
                <textarea
                  rows={2}
                  value={orderAdditionalNotes}
                  onChange={(e) => setOrderAdditionalNotes(e.target.value)}
                  placeholder="Ex: Patient à récupérer en chambre avec ses bagages et son dossier soignant. Repos assis conseillé, surveillance post-op..."
                  className="w-full p-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none leading-relaxed"
                />

                {/* Options rapides de mobilité */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orderWheelchair}
                      onChange={(e) => setOrderWheelchair(e.target.checked)}
                      className="w-4 h-4 rounded text-primary"
                    />
                    <span className="text-[11px] font-semibold text-on-surface">Fauteuil roulant</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orderStretcher}
                      onChange={(e) => setOrderStretcher(e.target.checked)}
                      className="w-4 h-4 rounded text-primary"
                    />
                    <span className="text-[11px] font-semibold text-on-surface">Brancardage</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orderOxygen}
                      onChange={(e) => setOrderOxygen(e.target.checked)}
                      className="w-4 h-4 rounded text-primary"
                    />
                    <span className="text-[11px] font-semibold text-on-surface">Oxygénothérapie</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orderStairs}
                      onChange={(e) => setOrderStairs(e.target.checked)}
                      className="w-4 h-4 rounded text-primary"
                    />
                    <span className="text-[11px] font-semibold text-on-surface">Étage s/ ascenseur</span>
                  </label>
                </div>
              </div>

              {/* Section 4 : Identification du Patient */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-on-surface font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base text-primary">person</span>
                    <span>4. Identification du Patient</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={orderIsAld}
                      onChange={(e) => setOrderIsAld(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span className="text-xs font-bold text-emerald-800">Prise en charge 100% ALD</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Nom du patient *</label>
                    <input
                      type="text"
                      value={orderPatientLastName}
                      onChange={(e) => setOrderPatientLastName(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Prénom du patient *</label>
                    <input
                      type="text"
                      value={orderPatientFirstName}
                      onChange={(e) => setOrderPatientFirstName(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">NIR (Sécurité Sociale 15 ch.) *</label>
                    <input
                      type="text"
                      value={orderPatientNir}
                      onChange={(e) => setOrderPatientNir(e.target.value)}
                      placeholder="1 ou 2 XX XX XX XXX XXX XX"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-mono font-medium focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Téléphone du patient / proche</label>
                    <input
                      type="tel"
                      value={orderPatientPhone}
                      onChange={(e) => setOrderPatientPhone(e.target.value)}
                      placeholder="0696 XX XX XX"
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Date de naissance</label>
                    <input
                      type="date"
                      value={orderPatientBirthDate}
                      onChange={(e) => setOrderPatientBirthDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5 : Prescription Médicale de Transport (PMT Cerfa S3138) & Téléversement Document */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    <span>5. Prescription Médicale de Transport (PMT Cerfa S3138)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                    Pièce Médico-Administrative
                  </span>
                </div>

                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Le bon de transport (PMT Cerfa S3138) est indispensable pour le remboursement CPAM/CGSS 972 et le tiers-payant. Vous pouvez téléverser la PMT scannée ou spécifier qu'elle sera remise en main propre.
                </p>

                {/* Sélecteur de mode de transmission de la PMT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOrderPmtTransmissionMode('UPLOAD')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      orderPmtTransmissionMode === 'UPLOAD'
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs'
                        : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">upload_file</span>
                    </span>
                    <div>
                      <span className="font-bold text-xs block">Téléverser la PMT numérique</span>
                      <span className="text-[10px] text-on-surface-variant block">PDF, scan ou photo du bon Cerfa</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderPmtTransmissionMode('PAPIER')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      orderPmtTransmissionMode === 'PAPIER'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                        : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">description</span>
                    </span>
                    <div>
                      <span className="font-bold text-xs block">PMT Papier remise au chauffeur</span>
                      <span className="text-[10px] text-on-surface-variant block">Remise physique en chambre lors du départ</span>
                    </div>
                  </button>
                </div>

                {/* Zone de téléversement si UPLOAD */}
                {orderPmtTransmissionMode === 'UPLOAD' && (
                  <div className="pt-1 animate-fadeIn">
                    <FileUpload
                      label="Joindre la Prescription Médicale de Transport (PMT)"
                      description="Fichier PDF, scan ou photo lisible du bon Cerfa signé (max 10 Mo). Chiffrement conforme HDS / ARS Martinique."
                      category="PMT_FACILITY"
                      initialDocument={orderPmtDocument}
                      onDocumentChange={(doc) => setOrderPmtDocument(doc)}
                    />
                  </div>
                )}

                {/* Info si PAPIER */}
                {orderPmtTransmissionMode === 'PAPIER' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <span className="material-symbols-outlined text-amber-700 text-lg shrink-0 mt-0.5">info</span>
                    <div>
                      <strong className="block text-amber-900">Consigne équipage ambulancier :</strong>
                      L'original du formulaire Cerfa S3138 papier devra être impérativement remis à l'ambulancier ou au chauffeur de taxi conventionné par l'équipe soignante lors de la prise en charge du patient dans le service.
                    </div>
                  </div>
                )}

                {/* Médecin Prescripteur et Motif CPAM */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Médecin prescripteur hospitalier *
                    </label>
                    <input
                      type="text"
                      value={orderDoctor}
                      onChange={(e) => setOrderDoctor(e.target.value)}
                      placeholder="Ex: Dr. Alix Célestine - Cardiologue CHU"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Motif de prise en charge CPAM 972 *
                    </label>
                    <select
                      value={orderPmtMotif}
                      onChange={(e) => setOrderPmtMotif(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    >
                      {CPAM_TRANSPORT_MOTIFS.map((group) => (
                        <optgroup key={group.category} label={`${group.category} ${group.badge ? `(${group.badge})` : ''}`}>
                          {group.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 6 : Mode de transport, Date/Heure & Destination */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-base">directions_car</span>
                  <span>6. Transport Prescrit &amp; Destination</span>
                </div>

                {/* Sélecteur de mode */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'VSL' as TransportType, label: 'VSL Médicalisé', icon: 'directions_car' },
                    { type: 'AMBULANCE' as TransportType, label: 'Ambulance', icon: 'airline_seat_flat' },
                    { type: 'TAXI_CONVENTIONNE' as TransportType, label: 'Taxi Conventionné', icon: 'local_taxi' },
                  ].map((m) => (
                    <button
                      key={m.type}
                      type="button"
                      onClick={() => setOrderTransportType(m.type)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        orderTransportType === m.type
                          ? 'border-primary bg-primary text-white font-bold shadow-xs'
                          : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{m.icon}</span>
                      <span className="text-xs">{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Date de départ souhaitée *</label>
                    <input
                      type="date"
                      value={orderPickupDate}
                      onChange={(e) => setOrderPickupDate(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Heure de départ souhaitée *</label>
                    <input
                      type="time"
                      value={orderPickupTime}
                      onChange={(e) => setOrderPickupTime(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Adresse d'arrivée / Destination *</label>
                    <input
                      type="text"
                      value={orderDropoffAddress}
                      onChange={(e) => setOrderDropoffAddress(e.target.value)}
                      placeholder="Ex: Résidence Les Balisiers, Apt 24"
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Commune d'arrivée *</label>
                    <input
                      type="text"
                      value={orderDropoffCity}
                      onChange={(e) => setOrderDropoffCity(e.target.value)}
                      placeholder="Ex: Schœlcher, Fort-de-France..."
                      required
                      className="w-full h-10 px-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-medium focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 sticky bottom-0 bg-surface-container-lowest">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Diffuser la commande de transport</span>
                </button>
              </div>
            </form>
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

      {/* ========================================================================= */}
      {/* MODAL : RENOUVELER UN TRANSPORT COMPLÉTÉ (ÉTABLISSEMENT)                  */}
      {/* ========================================================================= */}
      {rideToRenew && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-lg w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-2xs">
                  <span className="material-symbols-outlined text-xl">autorenew</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Renouveler la demande de transport
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    Basé sur la course #{rideToRenew.reference} • {rideToRenew.patient.firstName} {rideToRenew.patient.lastName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRideToRenew(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Synthèse trajet & patient */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-primary">
                <span>Patient : {rideToRenew.patient.firstName} {rideToRenew.patient.lastName} ({rideToRenew.patient.nir})</span>
                <span>{rideToRenew.transportType === 'AMBULANCE' ? 'Ambulance' : rideToRenew.transportType === 'TAXI_CONVENTIONNE' ? 'Taxi Conv.' : 'VSL Médicalisé'}</span>
              </div>
              <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                <span className="font-semibold text-on-surface">{rideToRenew.pickupAddress}</span>
                <span>➔</span>
                <span className="font-semibold text-on-surface">{rideToRenew.dropoffAddress} ({rideToRenew.dropoffCity})</span>
              </div>
              <div className="pt-1.5 border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-emerald-700 font-semibold">
                <span className="inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Dossier PMT &amp; Tiers-Payant conservés
                </span>
                <span>{rideToRenew.patient.isAld ? 'PEC 100% ALD' : 'Conventionné CPAM'}</span>
              </div>
            </div>

            {/* Formulaire de renouvellement avec correction de date & service */}
            <form onSubmit={(e) => { e.preventDefault(); handleConfirmRenew(); }} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Date du transport à corriger */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
                    <span>Date du transport *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={renewDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRenewDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                  />
                  <span className="text-[10px] text-on-surface-variant mt-0.5 block">
                    Corrigez la date de la nouvelle intervention
                  </span>
                </div>

                {/* 2. Heure de prise en charge / RDV */}
                <div>
                  <label className="block text-[11px] font-bold text-on-surface mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-sm">alarm</span>
                    <span>Heure souhaitée / RDV *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={renewAppointmentTime}
                    onChange={(e) => setRenewAppointmentTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono font-bold text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                  />
                  <span className="text-[10px] text-on-surface-variant mt-0.5 block">
                    Heure programmée de prise en charge
                  </span>
                </div>
              </div>

              {/* 3. Service hospitalier éventuellement à corriger */}
              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-secondary text-sm">local_hospital</span>
                  <span>Service hospitalier (éventuellement à corriger)</span>
                </label>
                <input
                  type="text"
                  value={renewDepartment}
                  onChange={(e) => setRenewDepartment(e.target.value)}
                  placeholder="ex: Cardiologie, Hémodialyse, Oncologie, Chirurgie Ambulatoire..."
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
                />
                <span className="text-[10px] text-on-surface-variant mt-0.5 block">
                  Modifiez le service hospitalier si le patient a changé de département
                </span>
              </div>

              {/* 4. Localisation précise dans le service */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                    Étage / Bâtiment (optionnel)
                  </label>
                  <input
                    type="text"
                    value={renewFloor}
                    onChange={(e) => setRenewFloor(e.target.value)}
                    placeholder="ex: 3ème étage, Bât. B..."
                    className="w-full p-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                    Chambre / Lit (optionnel)
                  </label>
                  <input
                    type="text"
                    value={renewRoom}
                    onChange={(e) => setRenewRoom(e.target.value)}
                    placeholder="ex: Ch. 312 - Lit B..."
                    className="w-full p-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* 5. Consignes particulières */}
              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">
                  Consignes et notes pour le transporteur (optionnel) :
                </label>
                <textarea
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  placeholder="Nouvelles consignes de prise en charge, état du patient..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-medium text-xs text-on-surface outline-none focus:border-primary shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setRideToRenew(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isRenewing}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isRenewing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Création en cours...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Confirmer et créer la demande</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 max-w-md bg-surface-container-lowest text-on-surface p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 border border-outline-variant/40 animate-fadeIn">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toastMessage.title.toLowerCase().includes('annul') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
            <span className="material-symbols-outlined text-base">
              {toastMessage.title.toLowerCase().includes('annul') ? 'cancel' : 'check_circle'}
            </span>
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-on-surface text-sm">{toastMessage.title}</div>
            <p className="text-on-surface-variant mt-0.5 leading-relaxed">{toastMessage.desc}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Modal Aperçu Document PMT */}
      {previewPmtDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[90vh] rounded-3xl p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-emerald-600">description</span>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">{previewPmtDoc.name}</h4>
                  <span className="text-[10px] text-on-surface-variant font-mono">Prescription Médicale de Transport certifiée HDS / ARS 972</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPmtDoc(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="flex-1 min-h-[400px] max-h-[65vh] bg-surface-container-low rounded-2xl overflow-hidden flex items-center justify-center p-2">
              {previewPmtDoc.url.startsWith('data:image/') ? (
                <img src={previewPmtDoc.url} alt="PMT" className="max-w-full max-h-full object-contain rounded-xl" />
              ) : (
                <iframe src={previewPmtDoc.url} title="PMT Document" className="w-full h-full border-0 rounded-xl" />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setPreviewPmtDoc(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container"
              >
                Fermer
              </button>
              <a
                href={previewPmtDoc.url}
                download={previewPmtDoc.name}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Télécharger</span>
              </a>
            </div>
          </div>
        </div>
      )}

</div></main>
<Footer />
    </div>
  );
};
