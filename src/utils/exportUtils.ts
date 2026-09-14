import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Ride } from '../types';

export interface ExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  userContext?: string;
}

// Libellé clair du type de véhicule
export function formatTransportTypeLabel(type: string): string {
  switch (type) {
    case 'AMBULANCE':
      return 'Ambulance Type B';
    case 'TAXI_CONVENTIONNE':
      return 'Taxi Conventionné CPAM';
    case 'VSL':
    default:
      return 'VSL (Véhicule Sanitaire Léger)';
  }
}

// Libellé lisible du statut
export function formatStatusLabel(status: string): string {
  switch (status) {
    case 'ACCEPTED':
      return 'Confirmé / Affecté';
    case 'EN_ROUTE':
      return 'Chauffeur en route';
    case 'PICKED_UP':
      return 'Patient à bord';
    case 'PENDING':
      return 'En attente d\'attribution';
    case 'COMPLETED':
      return 'Mission effectuée';
    case 'CANCELLED':
      return 'Annulée';
    default:
      return status;
  }
}

/**
 * Exporte une liste de courses vers un fichier Excel (.csv UTF-8 avec BOM)
 * Le point-virgule et le BOM UTF-8 permettent une ouverture directe et parfaite dans Excel en France / DOM.
 */
export function exportRidesToExcel(rides: Ride[], options: ExportOptions): void {
  const headers = [
    'Référence',
    'Date Transport',
    'Heure',
    'Patient - Nom',
    'Patient - Prénom',
    'Numéro Sécurité Sociale (NIR)',
    'Prise en charge CPAM',
    'Téléphone',
    'Adresse Départ',
    'Commune Départ',
    'Destination / Établissement',
    'Commune Arrivée',
    'Mode de Transport',
    'Statut',
    'Transporteur Mandaté',
    'Chauffeur',
    'Immatriculation',
    'Statut PMT',
    'Médecin Prescripteur',
    'Aller-Retour',
    'Service / Lit Hôpital',
    'Motif Annulation / Notes Mobilité'
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = rides.map((ride) => {
    const d = new Date(ride.pickupDateTime);
    const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('fr-FR') : '';
    const timeStr = !isNaN(d.getTime())
      ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '';

    const isPending = ride.status === 'PENDING';
    const patientLastName = isPending
      ? (ride.patient.lastName ? `${ride.patient.lastName.trim().charAt(0).toUpperCase()}.` : '')
      : ride.patient.lastName;
    const patientNir = isPending ? '•••••••• (après validation)' : `'${ride.patient.nir || ''}`;
    const patientPhone = isPending ? 'Confidentiel' : (ride.patient.phone || '');
    const prescriber = isPending ? 'Confidentiel (verrouillé)' : (ride.patient.pmtPrescriberDoctor || '-');

    const pmtStatus = isPending
      ? 'Confidentielle (verrouillée avant validation)'
      : (ride.patient.hasPmt || ride.patient.pmtUploaded || ride.patient.pmtFileUrl)
      ? 'PMT Téléversée (Numérique)'
      : 'PMT Papier (Cerfa S3138 à récupérer)';

    return [
      escapeCsv(ride.reference),
      escapeCsv(dateStr),
      escapeCsv(timeStr),
      escapeCsv(patientLastName),
      escapeCsv(ride.patient.firstName),
      // Préfixe apostrophe pour forcer Excel à traiter le NIR comme texte
      escapeCsv(patientNir),
      escapeCsv(ride.patient.isAld ? '100% ALD' : 'Conventionnée CPAM 65%'),
      escapeCsv(patientPhone),
      escapeCsv(ride.pickupAddress),
      escapeCsv(ride.pickupCity),
      escapeCsv(ride.facilityName || ride.dropoffAddress),
      escapeCsv(ride.dropoffCity),
      escapeCsv(formatTransportTypeLabel(ride.transportType)),
      escapeCsv(formatStatusLabel(ride.status)),
      escapeCsv(ride.assignedTransporter?.companyName || 'Non assigné'),
      escapeCsv(ride.assignedTransporter?.driverName || '-'),
      escapeCsv(ride.assignedTransporter?.vehiclePlate || '-'),
      escapeCsv(pmtStatus),
      escapeCsv(prescriber),
      escapeCsv(ride.isRoundTrip ? 'Oui (Aller-Retour)' : 'Non (Aller simple)'),
      escapeCsv(ride.bedDischargeNumber || ride.facilityDepartment || '-'),
      escapeCsv(ride.mobility.notes || '-')
    ].join(';');
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const cleanFilename = options.filename.endsWith('.csv') ? options.filename : `${options.filename}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporte une liste de courses vers un fichier PDF soigné en format Paysage (A4 Landscape)
 */
export function exportRidesToPdf(rides: Ride[], options: ExportOptions): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // En-tête Médic'Trans 972
  doc.setFillColor(15, 53, 87); // Deep Blue Primary
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("CLINIGO.FR - TRANSPORT MÉDICAL & SERVICES", 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("Coordination ARS Martinique & Transporteurs Sanitaires Agréés CPAM", 14, 18);

  // Date et métadonnées à droite de l'en-tête
  const nowStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  doc.setFontSize(8);
  doc.text(`Émis le : ${nowStr}`, pageWidth - 14, 11, { align: 'right' });
  doc.text(`Total : ${rides.length} dossier(s)`, pageWidth - 14, 18, { align: 'right' });

  // Titre du document
  doc.setTextColor(24, 30, 36);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title.toUpperCase(), 14, 34);

  if (options.subtitle || options.userContext) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const subText = [options.subtitle, options.userContext].filter(Boolean).join('  |  ');
    doc.text(subText, 14, 40);
  }

  // Ligne séparatrice
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 44, pageWidth - 14, 44);

  // Colonnes pour le tableau
  const tableHeaders = [
    'Réf.',
    'Date / Heure',
    'Patient & NIR',
    'Trajet & Destination',
    'Mode Prescrit',
    'Transporteur / Chauffeur',
    'Statut',
    'Fiche PMT'
  ];

  const tableBody = rides.map((r) => {
    const d = new Date(r.pickupDateTime);
    const dateFormatted = !isNaN(d.getTime())
      ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
        ' ' +
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '-';

    const isPending = r.status === 'PENDING';
    const patientLastName = isPending
      ? (r.patient.lastName ? `${r.patient.lastName.trim().charAt(0).toUpperCase()}.` : '')
      : r.patient.lastName;
    const patientNir = isPending ? 'Confidentiel' : (r.patient.nir || 'N/A');
    const patientText = isPending
      ? `${r.patient.firstName} ${patientLastName}\nNIR: ${patientNir}`
      : `${patientLastName} ${r.patient.firstName}\nNIR: ${patientNir}`;
    const destination = r.facilityName || r.dropoffAddress;
    const routeText = `${r.pickupCity} ➔ ${r.dropoffCity}\n${destination}`;

    const transporterInfo = r.assignedTransporter
      ? `${r.assignedTransporter.companyName}\n${r.assignedTransporter.driverName || 'Équipage'}`
      : 'Non assigné';

    const hasPmt = r.patient.hasPmt || r.patient.pmtUploaded || r.patient.pmtFileUrl;
    const pmtText = isPending
      ? 'Confidentielle\n(après validation)'
      : hasPmt
      ? `Numérique\n${r.patient.pmtPrescriberDoctor || 'Prescripteur validé'}`
      : 'Papier requis\n(Cerfa S3138)';

    let statusDisplay = formatStatusLabel(r.status);
    if (r.status === 'CANCELLED' && r.mobility.notes && r.mobility.notes.includes('Annulé')) {
      const match = r.mobility.notes.match(/\[Annulé[^:]*:\s*([^\]]+)\]/);
      if (match && match[1]) {
        statusDisplay += `\n(${match[1].slice(0, 35)}...)`;
      }
    }

    return [
      r.reference,
      dateFormatted,
      patientText,
      routeText,
      formatTransportTypeLabel(r.transportType),
      transporterInfo,
      statusDisplay,
      pmtText
    ];
  });

  autoTable(doc, {
    head: [tableHeaders],
    body: tableBody,
    startY: 48,
    margin: { left: 14, right: 14, bottom: 20 },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 26 }, // Ref
      1: { cellWidth: 25 },                   // Date
      2: { cellWidth: 38 },                   // Patient
      3: { cellWidth: 55 },                   // Trajet
      4: { cellWidth: 32 },                   // Mode
      5: { cellWidth: 38 },                   // Transporteur
      6: { cellWidth: 28 },                   // Statut
      7: { cellWidth: 27 }                    // PMT
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      // Colorer les statuts
      if (data.section === 'body' && data.column.index === 6) {
        const text = String(data.cell.raw || '');
        if (text.includes('Annulée')) {
          data.cell.styles.textColor = [190, 18, 60]; // Rose-700
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('effectuée')) {
          data.cell.styles.textColor = [21, 128, 61]; // Emerald-700
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('Confirmé') || text.includes('route')) {
          data.cell.styles.textColor = [13, 148, 136]; // Teal-600
        }
      }
      // Colorer les PMT
      if (data.section === 'body' && data.column.index === 7) {
        const text = String(data.cell.raw || '');
        if (text.includes('Papier requis')) {
          data.cell.styles.textColor = [180, 83, 9]; // Amber-700
        } else {
          data.cell.styles.textColor = [16, 116, 82]; // Emerald-800
        }
      }
    },
    didDrawPage: (data) => {
      // Pied de page
      const str = `Page ${data.pageNumber} sur ${(doc as any).internal.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Document officiel généré depuis Clinigo (clinigo.fr) - Tiers-Payant CPAM Martinique & Conformité ARS 972',
        14,
        pageHeight - 8
      );
      doc.text(str, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
  });

  const cleanFilename = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;
  doc.save(cleanFilename);
}
