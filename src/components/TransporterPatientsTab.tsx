import React, { useState, useEffect, useMemo, useRef } from 'react';
import { transporterFleetService, TransporterClientRecord } from '../services/transporterFleetService';
import { Ride } from '../types';

interface TransporterPatientsTabProps {
  transporterId: string;
  rides: Ride[];
  onBookRideForPatient: (patient: Partial<TransporterClientRecord>) => void;
}

export const TransporterPatientsTab: React.FC<TransporterPatientsTabProps> = ({
  transporterId,
  rides,
  onBookRideForPatient,
}) => {
  const [clients, setClients] = useState<TransporterClientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<TransporterClientRecord | null>(null);

  // Modal d'ajout / modification manuelle de fiche patient
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formLastName, setFormLastName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('1980-01-01');
  const [formNir, setFormNir] = useState('');
  const [formPickupAddress, setFormPickupAddress] = useState('');
  const [formPickupCity, setFormPickupCity] = useState('');
  const [formDropoffAddress, setFormDropoffAddress] = useState('');
  const [formDropoffCity, setFormDropoffCity] = useState('');
  const [formFacility, setFormFacility] = useState('');
  const [formMobility, setFormMobility] = useState('Assis');
  const [formNotes, setFormNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modal d'importation de contacts CSV
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedRows, setImportedRows] = useState<Omit<TransporterClientRecord, 'id' | 'transporterId'>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback notification
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const loadClients = async () => {
    try {
      const list = await transporterFleetService.getClients(transporterId);
      setClients(list);
    } catch (err) {
      console.error('Erreur chargement clients:', err);
    }
  };

  // Synchronisation automatique des patients depuis les courses effectuées
  useEffect(() => {
    if (transporterId) {
      const init = async () => {
        setIsLoading(true);
        try {
          if (rides && rides.length > 0) {
            await transporterFleetService.syncClientsFromRides(transporterId, rides);
          }
          await loadClients();
        } catch (err) {
          console.error('Erreur synchronisation répertoire:', err);
        } finally {
          setIsLoading(false);
        }
      };
      init();
    }
  }, [transporterId, rides.length]);

  // Filtrage des patients par recherche
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.lastName.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.pickupCity && c.pickupCity.toLowerCase().includes(q)) ||
        (c.referringFacility && c.referringFacility.toLowerCase().includes(q))
    );
  }, [clients, searchQuery]);

  // Historique des courses du patient sélectionné
  const patientRidesHistory = useMemo(() => {
    if (!selectedPatientForHistory) return [];
    const last = selectedPatientForHistory.lastName.toLowerCase().trim();
    const first = selectedPatientForHistory.firstName.toLowerCase().trim();
    return rides.filter((r) => {
      const rLast = (r.patient?.lastName || '').toLowerCase().trim();
      const rFirst = (r.patient?.firstName || '').toLowerCase().trim();
      return rLast === last && (rFirst.includes(first) || first.includes(rFirst));
    });
  }, [rides, selectedPatientForHistory]);

  const handleOpenAddModal = () => {
    setEditingClientId(null);
    setFormLastName('');
    setFormFirstName('');
    setFormPhone('');
    setFormEmail('');
    setFormBirthDate('1980-01-01');
    setFormNir('');
    setFormPickupAddress('');
    setFormPickupCity('');
    setFormDropoffAddress('');
    setFormDropoffCity('');
    setFormFacility('');
    setFormMobility('Assis');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: TransporterClientRecord) => {
    setEditingClientId(client.id);
    setFormLastName(client.lastName);
    setFormFirstName(client.firstName);
    setFormPhone(client.phone || '');
    setFormEmail(client.email || '');
    setFormBirthDate(client.birthDate || '1980-01-01');
    setFormNir(client.nir || '');
    setFormPickupAddress(client.pickupAddress || '');
    setFormPickupCity(client.pickupCity || '');
    setFormDropoffAddress(client.dropoffAddress || '');
    setFormDropoffCity(client.dropoffCity || '');
    setFormFacility(client.referringFacility || '');
    setFormMobility(client.mobilityNeeds || 'Assis');
    setFormNotes(client.notes || '');
    setIsModalOpen(true);
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLastName.trim() || !formFirstName.trim()) return;

    // Détection de doublons lors de la création
    if (!editingClientId) {
      const isDuplicate = clients.some(
        (c) =>
          c.lastName.toLowerCase().trim() === formLastName.toLowerCase().trim() &&
          c.firstName.toLowerCase().trim() === formFirstName.toLowerCase().trim()
      );
      if (isDuplicate) {
        const confirmMerge = window.confirm(
          `Un patient nommé ${formLastName} ${formFirstName} existe déjà dans votre répertoire.\nSouhaitez-vous mettre à jour sa fiche avec ces nouvelles coordonnées ?`
        );
        if (!confirmMerge) return;
      }
    }

    setIsSaving(true);
    try {
      if (editingClientId) {
        await transporterFleetService.updateClient(editingClientId, {
          lastName: formLastName,
          firstName: formFirstName,
          phone: formPhone,
          email: formEmail,
          birthDate: formBirthDate,
          nir: formNir,
          pickupAddress: formPickupAddress,
          pickupCity: formPickupCity,
          dropoffAddress: formDropoffAddress,
          dropoffCity: formDropoffCity,
          referringFacility: formFacility,
          mobilityNeeds: formMobility,
          notes: formNotes,
        });
        showFeedback('success', `Fiche de ${formLastName} ${formFirstName} mise à jour avec succès.`);
      } else {
        await transporterFleetService.saveClient(transporterId, {
          lastName: formLastName,
          firstName: formFirstName,
          phone: formPhone,
          email: formEmail,
          birthDate: formBirthDate,
          nir: formNir,
          pickupAddress: formPickupAddress,
          pickupCity: formPickupCity,
          dropoffAddress: formDropoffAddress,
          dropoffCity: formDropoffCity,
          referringFacility: formFacility,
          mobilityNeeds: formMobility,
          notes: formNotes,
        });
        showFeedback('success', `Nouveau contact ${formLastName} ${formFirstName} ajouté au répertoire.`);
      }
      await loadClients();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur sauvegarde patient:', err);
      showFeedback('error', 'Erreur lors de la sauvegarde du contact.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchivePatient = async (clientId: string, name: string) => {
    if (
      window.confirm(
        `Confirmez-vous l'archivage de la fiche de ${name} ?\nConformément au RGPD, ce contact sera retiré du répertoire actif.`
      )
    ) {
      try {
        await transporterFleetService.archiveClient(clientId);
        await loadClients();
        showFeedback('success', `Contact ${name} archivé.`);
      } catch (err) {
        console.error('Erreur archivage patient:', err);
      }
    }
  };

  // =========================================================================
  // EXPORT CSV DU RÉPERTOIRE CONTACTS (UTF-8 avec BOM)
  // =========================================================================
  const handleExportContactsCSV = () => {
    if (clients.length === 0) {
      alert('Votre répertoire ne contient aucun contact à exporter.');
      return;
    }

    const headers = [
      'Nom',
      'Prénom',
      'Téléphone',
      'Email',
      'Date de Naissance',
      'NIR (Sécurité Sociale)',
      'Adresse Prise en Charge',
      'Commune Prise en Charge',
      'Adresse Destination Habituelle',
      'Commune Destination Habituelle',
      'Établissement Habituel',
      'Besoins Mobilité',
      'Notes et Consignes',
      'Date Ajout Répertoire',
    ];

    const escapeCsv = (val?: string) => {
      if (!val) return '""';
      const clean = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${clean}"`;
    };

    const rows = clients.map((c) => [
      escapeCsv(c.lastName),
      escapeCsv(c.firstName),
      escapeCsv(c.phone),
      escapeCsv(c.email),
      escapeCsv(c.birthDate),
      escapeCsv(c.nir),
      escapeCsv(c.pickupAddress),
      escapeCsv(c.pickupCity),
      escapeCsv(c.dropoffAddress),
      escapeCsv(c.dropoffCity),
      escapeCsv(c.referringFacility),
      escapeCsv(c.mobilityNeeds),
      escapeCsv(c.notes),
      escapeCsv(c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : ''),
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `repertoire_contacts_clinigo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFeedback('success', `${clients.length} contact(s) exporté(s) au format CSV compatible Excel.`);
  };

  // Téléchargement d'un fichier modèle CSV type pour l'import
  const handleDownloadSampleCSV = () => {
    const sampleHeaders = [
      'Nom',
      'Prénom',
      'Téléphone',
      'Email',
      'Date de Naissance',
      'NIR',
      'Adresse',
      'Commune',
      'Établissement',
      'Besoins',
      'Notes',
    ];
    const sampleRows = [
      ['DUPONT', 'Marie', '0696123456', 'marie.dupont@email.com', '1955-04-12', '2550497200123', '14 Rue des Flamboyants', 'Fort-de-France', 'CHU de Martinique', 'Assis', 'Interphone 4B'],
      ['JEAN-LOUIS', 'Pierre', '0696789012', 'p.jeanlouis@email.com', '1948-11-20', '1481197200456', '5 Allée des Alizés', 'Le Lamentin', 'Clinique Sainte-Marie', 'Fauteuil roulant', 'Bâtiment C'],
    ];
    const content = '\uFEFF' + [sampleHeaders.join(';'), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(';'))].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Modele_import_contacts_clinigo.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parsing du fichier CSV importé
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = (event.target?.result as string) || '';
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setImportError('Le fichier CSV est vide ou ne contient aucune ligne de données.');
          return;
        }

        // Détection du séparateur (; ou , ou tab)
        const headerLine = lines[0];
        const delimiter = headerLine.includes(';') ? ';' : headerLine.includes('\t') ? '\t' : ',';
        const headers = headerLine
          .split(delimiter)
          .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

        // Recherche des index de colonnes
        const findIndex = (patterns: string[]) =>
          headers.findIndex((h) => patterns.some((p) => h.includes(p)));

        const lastNameIdx = findIndex(['nom', 'last', 'family']);
        const firstNameIdx = findIndex(['prénom', 'prenom', 'first']);
        const phoneIdx = findIndex(['tél', 'tel', 'phone', 'mobile']);
        const emailIdx = findIndex(['mail', 'courriel']);
        const birthIdx = findIndex(['naissance', 'birth', 'né']);
        const nirIdx = findIndex(['nir', 'sécu', 'secu', 'social']);
        const addressIdx = findIndex(['adresse', 'addr', 'rue']);
        const cityIdx = findIndex(['commune', 'ville', 'city']);
        const facilityIdx = findIndex(['établiss', 'etabliss', 'hopital', 'hôpital', 'clinique']);
        const mobilityIdx = findIndex(['besoin', 'mobilité', 'mobilite', 'transport']);
        const notesIdx = findIndex(['note', 'consigne', 'remarque', 'comment']);

        if (lastNameIdx === -1) {
          setImportError("La colonne 'Nom' est obligatoire dans le fichier CSV.");
          return;
        }

        const parsedList: Omit<TransporterClientRecord, 'id' | 'transporterId'>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
          const lastName = row[lastNameIdx] || '';
          const firstName = firstNameIdx !== -1 ? row[firstNameIdx] : '';

          if (!lastName && !firstName) continue;

          parsedList.push({
            lastName: (lastName || 'INCONNU').toUpperCase(),
            firstName: firstName || '---',
            phone: phoneIdx !== -1 ? row[phoneIdx] : undefined,
            email: emailIdx !== -1 ? row[emailIdx] : undefined,
            birthDate: birthIdx !== -1 ? row[birthIdx] : undefined,
            nir: nirIdx !== -1 ? row[nirIdx] : undefined,
            pickupAddress: addressIdx !== -1 ? row[addressIdx] : undefined,
            pickupCity: cityIdx !== -1 ? row[cityIdx] : undefined,
            referringFacility: facilityIdx !== -1 ? row[facilityIdx] : undefined,
            mobilityNeeds: mobilityIdx !== -1 ? row[mobilityIdx] : 'Assis',
            notes: notesIdx !== -1 ? row[notesIdx] : undefined,
          });
        }

        if (parsedList.length === 0) {
          setImportError('Aucun contact valide trouvé dans le fichier.');
          return;
        }

        setImportedRows(parsedList);
      } catch (err: any) {
        setImportError(`Erreur lors de la lecture du fichier : ${err.message}`);
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleConfirmImport = async () => {
    if (importedRows.length === 0) return;
    setIsImporting(true);
    try {
      const res = await transporterFleetService.batchImportClients(transporterId, importedRows);
      await loadClients();
      setIsImportModalOpen(false);
      setImportedRows([]);
      setImportFileName('');
      showFeedback('success', `${res.imported} contact(s) importé(s) avec succès dans votre répertoire !`);
    } catch (err) {
      console.error('Erreur import contacts:', err);
      showFeedback('error', "Une erreur est survenue lors de l'enregistrement des contacts.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Toast de feedback notification */}
      {feedbackMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold animate-slideUp ${
            feedbackMessage.type === 'success'
              ? 'bg-slate-900 text-white border-teal-500/50'
              : 'bg-rose-900 text-white border-rose-500/50'
          }`}
        >
          <span className="material-symbols-outlined text-teal-400 text-lg">
            {feedbackMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 1. En-tête Répertoire Contacts avec Dégradé Vert Harmonisé */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
              <span className="material-symbols-outlined text-2xl">folder_shared</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Répertoire des Clients &amp; Patients</h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Les patients déjà transportés sont synchronisés automatiquement. Gérez vos contacts, créez des fiches, exportez et importez vos listes.
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'Action avec Dégradé Vert Harmonisé */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setImportedRows([]);
              setImportFileName('');
              setImportError(null);
              setIsImportModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Importer une liste de contacts depuis un fichier CSV"
          >
            <span className="material-symbols-outlined text-base text-teal-600">upload_file</span>
            <span>Importer (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleExportContactsCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Exporter tout votre répertoire au format CSV compatible Excel"
          >
            <span className="material-symbols-outlined text-base text-teal-600">download</span>
            <span>Exporter (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>+ Ajouter une fiche</span>
          </button>
        </div>
      </div>

      {/* 2. Barre de Recherche et Compteur */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, téléphone, commune, établissement..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            {filteredClients.length} contact{filteredClients.length > 1 ? 's' : ''} dans votre répertoire
          </span>
        </div>
      </div>

      {/* 3. Grille des Fiches Patients */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-2xl text-teal-600">sync</span>
          <span>Chargement et synchronisation du répertoire clients...</span>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <span className="material-symbols-outlined text-4xl text-slate-300">person_search</span>
          <h3 className="text-sm font-bold text-slate-700 mt-2">Aucun contact trouvé</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Vos clients déjà transportés s\'enregistrent automatiquement ici, ou vous pouvez en ajouter manuellement / en importer.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4 hover:border-teal-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-black text-sm">
                      {client.lastName.charAt(0)}{client.firstName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {client.lastName} {client.firstName}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {client.phone || 'Aucun numéro de téléphone'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(client)}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Modifier la fiche"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchivePatient(client.id, `${client.lastName} ${client.firstName}`)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Archiver cette fiche patient (RGPD)"
                    >
                      <span className="material-symbols-outlined text-base">archive</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  {client.pickupAddress && (
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-sm text-slate-400 shrink-0 mt-0.5">home</span>
                      <span className="truncate">{client.pickupAddress} ({client.pickupCity || '---'})</span>
                    </div>
                  )}

                  {client.referringFacility && (
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-sm text-slate-400 shrink-0 mt-0.5">local_hospital</span>
                      <span className="truncate">{client.referringFacility}</span>
                    </div>
                  )}

                  {client.mobilityNeeds && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        ♿ {client.mobilityNeeds}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPatientForHistory(client)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">history</span>
                  <span>Historique</span>
                </button>

                <button
                  type="button"
                  onClick={() => onBookRideForPatient(client)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">add_road</span>
                  <span>Créer une course</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Modal d'Historique des courses pour un patient */}
      {selectedPatientForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-teal-400 text-2xl">history_edu</span>
                <div>
                  <h3 className="text-base font-bold">
                    Historique des transports : {selectedPatientForHistory.lastName} {selectedPatientForHistory.firstName}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {patientRidesHistory.length} course{patientRidesHistory.length > 1 ? 's' : ''} enregistrée{patientRidesHistory.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientForHistory(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {patientRidesHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Aucune course enregistrée pour ce patient dans votre compte.
                </div>
              ) : (
                patientRidesHistory.map((ride) => (
                  <div key={ride.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">
                        {ride.pickupDateTime ? new Date(ride.pickupDateTime).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        {ride.pickupCity} → {ride.dropoffCity} ({ride.transportType})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                        {ride.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPatientForHistory(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal d'Ajout / Modification Manuelle Patient */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400 text-xl">contact_page</span>
                <h3 className="text-base font-black">
                  {editingClientId ? 'Modifier la Fiche Contact' : 'Nouvelle Fiche Contact'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="06 96 00 00 00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="contact@exemple.fr"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NIR (Sécurité Sociale)</label>
                  <input
                    type="text"
                    value={formNir}
                    onChange={(e) => setFormNir(e.target.value)}
                    placeholder="1 80 01 97 200..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Adresse de domicile / Prise en charge</label>
                <input
                  type="text"
                  value={formPickupAddress}
                  onChange={(e) => setFormPickupAddress(e.target.value)}
                  placeholder="Rue, numéro, quartier..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 mb-2"
                />
                <input
                  type="text"
                  value={formPickupCity}
                  onChange={(e) => setFormPickupCity(e.target.value)}
                  placeholder="Commune habituelle"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Établissement habituel de destination</label>
                <input
                  type="text"
                  value={formFacility}
                  onChange={(e) => setFormFacility(e.target.value)}
                  placeholder="Ex: CHU de Martinique, Hôpital Pierre Zobda Quitman..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Besoins de mobilité</label>
                <select
                  value={formMobility}
                  onChange={(e) => setFormMobility(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="Assis">Assis (autonome)</option>
                  <option value="Fauteuil roulant">Fauteuil roulant</option>
                  <option value="Allongé (brancard)">Allongé (brancard)</option>
                  <option value="O2 / Surveillance">Sous oxygène / surveillance</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes et consignes opérationnelles</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Étage 2 sans ascenseur, sonner à Kanor..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer la fiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal d'Importation de Fichier CSV */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400 text-xl">upload_file</span>
                <h3 className="text-base font-black">Importer une Liste de Contacts (CSV)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-teal-900 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs">Format de fichier attendu</h4>
                  <p className="text-[11px] text-teal-800 leading-relaxed">
                    Fichier au format <strong>.csv</strong> avec séparateur point-virgule (;) ou virgule (,).
                    Les colonnes reconnues sont : <em>Nom, Prénom, Téléphone, Email, Adresse, Commune, Établissement, Besoins, Notes</em>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="px-3 py-1.5 rounded-xl bg-white border border-teal-200 hover:bg-teal-100 text-teal-800 text-[11px] font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  Télécharger le modèle
                </button>
              </div>

              {/* Zone de sélection de fichier */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-4xl text-teal-600 block mb-1">cloud_upload</span>
                <p className="font-bold text-slate-800 text-xs">
                  {importFileName ? importFileName : 'Cliquez pour choisir un fichier .csv'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Glissez-déposez ou parcourez vos fichiers
                </p>
              </div>

              {/* Erreur de lecture */}
              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 text-base">error</span>
                  <span>{importError}</span>
                </div>
              )}

              {/* Aperçu des données détectées */}
              {importedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">
                      Aperçu des contacts détectés ({importedRows.length})
                    </span>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      ✓ Prêts pour importation
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">Nom</th>
                          <th className="p-2">Prénom</th>
                          <th className="p-2">Téléphone</th>
                          <th className="p-2">Commune</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importedRows.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">{row.lastName}</td>
                            <td className="p-2 text-slate-700">{row.firstName}</td>
                            <td className="p-2 text-slate-600">{row.phone || '---'}</td>
                            <td className="p-2 text-slate-600">{row.pickupCity || '---'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importedRows.length > 15 && (
                    <p className="text-[10px] text-slate-400 italic">
                      + {importedRows.length - 15} autres contacts seront également importés.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={importedRows.length === 0 || isImporting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isImporting ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    <span>Importation en cours...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check</span>
                    <span>Importer les {importedRows.length} contacts</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
