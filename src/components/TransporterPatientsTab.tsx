import React, { useState, useEffect, useMemo } from 'react';
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

  // Modal d'ajout / modification de patient
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formLastName, setFormLastName] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formPhone, setFormPhone] = useState('');
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

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const list = await transporterFleetService.getClients(transporterId);
      setClients(list);
    } catch (err) {
      console.error('Erreur chargement clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (transporterId) {
      loadClients();
    }
  }, [transporterId]);

  // Filtrage des patients par recherche
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.lastName.toLowerCase().includes(q) ||
        c.firstName.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.pickupCity && c.pickupCity.toLowerCase().includes(q))
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

    // Détection de doublons en création
    if (!editingClientId) {
      const isDuplicate = clients.some(
        (c) =>
          c.lastName.toLowerCase().trim() === formLastName.toLowerCase().trim() &&
          c.firstName.toLowerCase().trim() === formFirstName.toLowerCase().trim()
      );
      if (isDuplicate) {
        const confirmMerge = window.confirm(
          `Un patient nommé ${formLastName} ${formFirstName} existe déjà dans votre répertoire.\nSouhaitez-vous mettre à jour sa fiche existante avec ces coordonnées ?`
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
      } else {
        await transporterFleetService.saveClient(transporterId, {
          lastName: formLastName,
          firstName: formFirstName,
          phone: formPhone,
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
      }
      await loadClients();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erreur sauvegarde patient:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchivePatient = async (clientId: string, name: string) => {
    if (
      window.confirm(
        `Confirmez-vous l'archivage de la fiche patient de ${name} ?\nConformément aux règles de conservation et au RGPD, la fiche sera archivée et retirée de la liste active.`
      )
    ) {
      try {
        await transporterFleetService.archiveClient(clientId);
        await loadClients();
      } catch (err) {
        console.error('Erreur archivage patient:', err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* 1. En-tête Répertoire Patients */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-2xl">folder_shared</span>
            <h2 className="text-xl font-extrabold text-on-surface">Répertoire des Patients &amp; Usagers</h2>
          </div>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            Conservez les coordonnées de vos patients réguliers pour planifier leurs transports sans ressaisie manuelle.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>+ Ajouter une fiche patient</span>
        </button>
      </div>

      {/* 2. Barre de Recherche et Compteur */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, prénom, téléphone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-teal-600"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {filteredClients.length} patient{filteredClients.length > 1 ? 's' : ''} répertorié{filteredClients.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* 3. Grille des Fiches Patients */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Chargement du répertoire patients...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
          <span className="material-symbols-outlined text-4xl text-slate-300">person_search</span>
          <h3 className="text-sm font-bold text-slate-700 mt-2">Aucun patient trouvé</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Vos fiches patients s\'enregistrent automatiquement lors de la création de vos courses, ou manuellement via le bouton ci-dessus.'}
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
                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
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
                    Historique de transports : {selectedPatientForHistory.lastName} {selectedPatientForHistory.firstName}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {patientRidesHistory.length} course{patientRidesHistory.length > 1 ? 's' : ''} effectuée{patientRidesHistory.length > 1 ? 's' : ''} ou programmée{patientRidesHistory.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientForHistory(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
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
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal d'Ajout / Modification Patient */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-teal-900 text-white flex items-center justify-between">
              <h3 className="text-base font-black">
                {editingClientId ? 'Modifier la Fiche Patient' : 'Nouvelle Fiche Patient'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-teal-800 text-teal-200 hover:text-white flex items-center justify-center"
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={formBirthDate}
                    onChange={(e) => setFormBirthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Adresse de domicile</label>
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Établissement habituel</label>
                <input
                  type="text"
                  value={formFacility}
                  onChange={(e) => setFormFacility(e.target.value)}
                  placeholder="Ex: CHU Martinique, Clinique Sainte-Marie..."
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
                  <option value="O2 / Surveillance">Sous oxygène</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
