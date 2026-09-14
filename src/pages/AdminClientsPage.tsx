import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { AdminService } from '../services/adminService';
import { ClientRecord, Ride } from '../types';
import { MARTINIQUE_COMMUNES } from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';

export const AdminClientsPage: React.FC = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAld, setFilterAld] = useState<'ALL' | 'ALD' | 'NON_ALD'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [filterCity, setFilterCity] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);
  const [passwordModalClient, setPasswordModalClient] = useState<ClientRecord | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [generatedPasswordFeedback, setGeneratedPasswordFeedback] = useState<string | null>(null);
  const [ridesModalClient, setRidesModalClient] = useState<ClientRecord | null>(null);
  const [clientRides, setClientRides] = useState<Ride[]>([]);
  const [isLoadingRides, setIsLoadingRides] = useState(false);

  // Formulaire Création / Édition
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('1970-01-01');
  const [formNir, setFormNir] = useState('');
  const [formPhone, setFormPhone] = useState('0696 ');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('Fort-de-France');
  const [formPostalCode, setFormPostalCode] = useState('97200');
  const [formIsAld, setFormIsAld] = useState(true);
  const [formAldReason, setFormAldReason] = useState('ALD 30 - Affection cardiovasculaire');
  const [formHasPmt, setFormHasPmt] = useState(true);
  const [formDoctor, setFormDoctor] = useState('Dr. Célestine - CHU Martinique');
  const [formWheelchair, setFormWheelchair] = useState(false);
  const [formStretcher, setFormStretcher] = useState(false);
  const [formOxygen, setFormOxygen] = useState(false);
  const [formStairs, setFormStairs] = useState(false);
  const [formFloorNumber, setFormFloorNumber] = useState<number>(0);
  const [formNeedsEscort, setFormNeedsEscort] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [formInitialPassword, setFormInitialPassword] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await AdminService.getAllClients();
      setClients(data);
    } catch (err) {
      console.error('Erreur chargement clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.nir.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q);

      const matchAld =
        filterAld === 'ALL' ||
        (filterAld === 'ALD' && c.isAld) ||
        (filterAld === 'NON_ALD' && !c.isAld);

      const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
      const matchCity = filterCity === 'ALL' || c.city === filterCity;

      return matchSearch && matchAld && matchStatus && matchCity;
    });
  }, [clients, searchQuery, filterAld, filterStatus, filterCity]);

  // Statistiques
  const totalAld = clients.filter(c => c.isAld).length;
  const totalWithPmt = clients.filter(c => c.hasPmt).length;
  const totalActive = clients.filter(c => c.status === 'ACTIVE').length;

  const openCreateModal = () => {
    setFormFirstName('');
    setFormLastName('');
    setFormBirthDate('1970-01-01');
    setFormNir('');
    setFormPhone('0696 ');
    setFormEmail('');
    setFormAddress('');
    setFormCity('Fort-de-France');
    setFormPostalCode('97200');
    setFormIsAld(true);
    setFormAldReason('ALD 30 - Affection de longue durée exonérante');
    setFormHasPmt(true);
    setFormDoctor('Dr. Praticien Hospitalier CHU 972');
    setFormWheelchair(false);
    setFormStretcher(false);
    setFormOxygen(false);
    setFormStairs(false);
    setFormFloorNumber(0);
    setFormNeedsEscort(false);
    setFormNotes('');
    setFormInitialPassword(`MT972-${Math.random().toString(36).slice(-5).toUpperCase()}!`);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (client: ClientRecord) => {
    setEditingClient(client);
    setFormFirstName(client.firstName);
    setFormLastName(client.lastName);
    setFormBirthDate(client.birthDate || '1970-01-01');
    setFormNir(client.nir);
    setFormPhone(client.phone);
    setFormEmail(client.email);
    setFormAddress(client.address);
    setFormCity(client.city);
    setFormPostalCode(client.postalCode);
    setFormIsAld(client.isAld);
    setFormAldReason(client.aldReason || '');
    setFormHasPmt(client.hasPmt);
    setFormDoctor(client.pmtPrescriberDoctor || '');
    setFormWheelchair(client.mobility.wheelchair);
    setFormStretcher(client.mobility.stretcher);
    setFormOxygen(client.mobility.oxygen);
    setFormStairs(client.mobility.stairsWithoutElevator);
    setFormFloorNumber(client.mobility.floorNumber || 0);
    setFormNeedsEscort(client.mobility.needsEscort);
    setFormNotes(client.notes || client.mobility.notes || '');
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName.trim() || !formLastName.trim() || !formNir.trim()) {
      alert('Veuillez remplir le nom, prénom et numéro de sécurité sociale.');
      return;
    }

    try {
      const payload = {
        firstName: formFirstName.trim(),
        lastName: formLastName.trim().toUpperCase(),
        birthDate: formBirthDate,
        nir: formNir.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim().toLowerCase(),
        address: formAddress.trim(),
        city: formCity,
        postalCode: formPostalCode.trim(),
        isAld: formIsAld,
        aldReason: formIsAld ? formAldReason : undefined,
        hasPmt: formHasPmt,
        pmtPrescriberDoctor: formDoctor.trim(),
        mobility: {
          wheelchair: formWheelchair,
          stretcher: formStretcher,
          oxygen: formOxygen,
          stairsWithoutElevator: formStairs,
          floorNumber: formFloorNumber,
          needsEscort: formNeedsEscort,
          notes: formNotes.trim()
        },
        notes: formNotes.trim(),
        password: formInitialPassword || undefined
      };

      if (editingClient) {
        await AdminService.updateClient(editingClient.id, payload, user?.email);
        setToastMessage({
          title: 'Fiche Patient Mise à Jour',
          desc: `Les modifications pour ${payload.firstName} ${payload.lastName} ont été enregistrées avec succès.`
        });
        setEditingClient(null);
      } else {
        const created = await AdminService.createClient(payload, user?.email);
        setToastMessage({
          title: 'Nouveau Patient Enregistré',
          desc: `La fiche de ${created.firstName} ${created.lastName} (NIR: ${created.nir}) a été créée avec mot de passe initial.`
        });
        setIsCreateModalOpen(false);
      }
      await loadData();
    } catch (err) {
      console.error('Erreur sauvegarde client:', err);
      alert('Erreur lors de la sauvegarde de la fiche client.');
    }
  };

  const handleDeleteClient = async (client: ClientRecord) => {
    if (!confirm(`Confirmez-vous la suppression de la fiche patient de ${client.firstName} ${client.lastName} ?`)) return;
    try {
      await AdminService.deleteClient(client.id, user?.email);
      setToastMessage({
        title: 'Fiche Patient Supprimée',
        desc: `La fiche de ${client.firstName} ${client.lastName} a été archivée.`
      });
      await loadData();
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression.');
    }
  };

  const handleToggleStatus = async (client: ClientRecord) => {
    try {
      const updated = await AdminService.toggleClientStatus(client.id, user?.email);
      setToastMessage({
        title: updated.status === 'ACTIVE' ? 'Compte Réactivé' : 'Compte Suspendu',
        desc: `Le compte de ${client.firstName} ${client.lastName} est désormais ${updated.status === 'ACTIVE' ? 'actif' : 'suspendu'}.`
      });
      await loadData();
    } catch (err) {
      console.error('Erreur bascule statut:', err);
    }
  };

  const handleOpenPasswordModal = (client: ClientRecord) => {
    setPasswordModalClient(client);
    setNewPasswordValue(`MT972-${Math.random().toString(36).slice(-5).toUpperCase()}!`);
    setGeneratedPasswordFeedback(null);
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalClient || !newPasswordValue.trim()) return;

    try {
      const res = await AdminService.resetClientPassword(passwordModalClient.id, newPasswordValue.trim(), user?.email);
      setGeneratedPasswordFeedback(res.password);
      setToastMessage({
        title: 'Mot de Passe Réinitialisé',
        desc: `Nouveau mot de passe enregistré pour ${passwordModalClient.firstName} ${passwordModalClient.lastName} (${passwordModalClient.email}).`
      });
      await loadData();
    } catch (err) {
      console.error('Erreur réinitialisation mdp:', err);
      alert('Erreur lors de la réinitialisation du mot de passe.');
    }
  };

  const handleOpenRidesModal = async (client: ClientRecord) => {
    setRidesModalClient(client);
    setIsLoadingRides(true);
    try {
      const rides = await AdminService.getClientRides(client);
      setClientRides(rides);
    } catch (err) {
      console.error('Erreur chargement courses patient:', err);
      setClientRides([]);
    } finally {
      setIsLoadingRides(false);
    }
  };

  return (
    <AdminLayout
      title="Fiches Clients & Patients 972"
      subtitle="Répertoire complet des patients, vérification NIR CPAM, prise en charge ALD et gestion des accès"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>+ Nouveau Patient</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant transition-colors"
            title="Rafraîchir"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      }
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Patients Enregistrés</span>
          <div className="text-3xl font-extrabold text-primary font-mono mt-1">{clients.length}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Bénéficiaires actifs en Martinique</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Exonération ALD 100%</span>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono mt-1">{totalAld}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Tiers-payant intégral CPAM garanti</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Dossiers avec PMT</span>
          <div className="text-3xl font-extrabold text-secondary font-mono mt-1">{totalWithPmt}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Prescriptions médicales numérisées</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Comptes Actifs</span>
          <div className="text-3xl font-extrabold text-on-surface font-mono mt-1">{totalActive}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">{clients.length - totalActive} compte(s) suspendu(s)</p>
        </div>
      </div>

      {/* Barre de recherche & Filtres */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, NIR (15 chiffres), téléphone, email, commune..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-outline-variant/40 bg-surface-container-low/40 focus:bg-surface-container-lowest focus:border-primary outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filtre ALD */}
          <select
            value={filterAld}
            onChange={(e) => setFilterAld(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-semibold text-on-surface outline-none"
          >
            <option value="ALL">Tous régimes CPAM</option>
            <option value="ALD">Exonération ALD 100%</option>
            <option value="NON_ALD">Régime Général (65%)</option>
          </select>

          {/* Filtre Statut */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-semibold text-on-surface outline-none"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actifs uniquement</option>
            <option value="SUSPENDED">Suspendus uniquement</option>
          </select>

          {/* Filtre Commune */}
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="px-3 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest text-xs font-semibold text-on-surface outline-none max-w-[160px]"
          >
            <option value="ALL">Toutes communes</option>
            {MARTINIQUE_COMMUNES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau des Fiches Patients */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-low/60 border-b border-outline-variant/20 text-on-surface-variant font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Patient / Identité</th>
                <th className="py-3.5 px-4">Sécurité Sociale (NIR)</th>
                <th className="py-3.5 px-4">Coordonnées & Ville</th>
                <th className="py-3.5 px-4">Besoins Spécifiques</th>
                <th className="py-3.5 px-4">Statut Compte</th>
                <th className="py-3.5 px-4 text-right">Actions Administration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant font-semibold">
                    Chargement des fiches patients...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                    Aucune fiche patient ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  return (
                    <tr key={client.id} className="hover:bg-primary/5 transition-colors group">
                      {/* Patient Identité */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                            {client.firstName?.[0]?.toUpperCase() || ''}{client.lastName?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                              <span>{client.firstName} {client.lastName}</span>
                            </div>
                            <div className="text-[11px] text-on-surface-variant">
                              Né(e) le {new Date(client.birthDate).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sécurité Sociale & ALD */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-on-surface text-[11px]">
                            {client.nir}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {client.isAld ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                PEC 100% ALD
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-surface-container text-on-surface-variant">
                                CPAM 65%
                              </span>
                            )}
                            {client.hasPmt && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[10px]">description</span>
                                PMT
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Coordonnées */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <a href={`tel:${client.phone}`} className="font-mono font-semibold text-primary hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">phone</span>
                            <span>{client.phone}</span>
                          </a>
                          <span className="text-[11px] text-on-surface-variant truncate max-w-[200px]" title={client.email}>
                            {client.email}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-medium">
                            📍 {client.city} ({client.postalCode})
                          </span>
                        </div>
                      </td>

                      {/* Besoins spécifiques */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                          {client.mobility.wheelchair && (
                            <span className="px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-bold flex items-center gap-0.5" title="Fauteuil roulant">
                              <span className="material-symbols-outlined text-xs">accessible</span>
                              Fauteuil
                            </span>
                          )}
                          {client.mobility.stretcher && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 text-[10px] font-bold flex items-center gap-0.5" title="Brancardage obligatoire">
                              <span className="material-symbols-outlined text-xs">airline_seat_flat</span>
                              Brancard
                            </span>
                          )}
                          {client.mobility.oxygen && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 text-[10px] font-bold flex items-center gap-0.5" title="Oxygénothérapie">
                              <span className="material-symbols-outlined text-xs">air</span>
                              Oxygène
                            </span>
                          )}
                          {client.mobility.stairsWithoutElevator && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold flex items-center gap-0.5" title="Portage escaliers">
                              <span className="material-symbols-outlined text-xs">stairs</span>
                              Portage ({client.mobility.floorNumber || '1'} ét.)
                            </span>
                          )}
                          {!client.mobility.wheelchair && !client.mobility.stretcher && !client.mobility.oxygen && !client.mobility.stairsWithoutElevator && (
                            <span className="text-on-surface-variant text-[11px]">Marche autonome</span>
                          )}
                        </div>
                      </td>

                      {/* Statut Compte */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(client)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            client.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Cliquer pour changer le statut"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${client.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span>{client.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Voir les courses */}
                          <button
                            type="button"
                            onClick={() => handleOpenRidesModal(client)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Historique des courses du patient"
                          >
                            <span className="material-symbols-outlined text-sm">history</span>
                            <span className="hidden xl:inline">Courses</span>
                          </button>

                          {/* Modifier */}
                          <button
                            type="button"
                            onClick={() => openEditModal(client)}
                            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Modifier la fiche patient"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span className="hidden xl:inline">Modifier</span>
                          </button>

                          {/* Mot de passe */}
                          <button
                            type="button"
                            onClick={() => handleOpenPasswordModal(client)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs flex items-center gap-1 transition-all cursor-pointer"
                            title="Réinitialiser ou générer le mot de passe"
                          >
                            <span className="material-symbols-outlined text-sm">lock_reset</span>
                            <span className="hidden xl:inline">Accès</span>
                          </button>

                          {/* Supprimer */}
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(client)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-700 text-xs transition-all cursor-pointer"
                            title="Supprimer la fiche"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL : CRÉER / MODIFIER UN PATIENT                                      */}
      {/* ========================================================================= */}
      {(isCreateModalOpen || editingClient) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-2xl w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">
                    {editingClient ? 'edit_document' : 'person_add'}
                  </span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    {editingClient ? `Modifier la fiche : ${editingClient.firstName} ${editingClient.lastName}` : 'Créer une nouvelle fiche patient'}
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    Identité administrative, droits CPAM Martinique et besoins de mobilité sanitaire
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsCreateModalOpen(false); setEditingClient(null); }}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
              {/* État civil & NIR */}
              <div className="p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 space-y-3">
                <div className="font-bold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">badge</span>
                  <span>1. Identité Civile & Sécurité Sociale (Martinique)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={formFirstName}
                      onChange={(e) => setFormFirstName(e.target.value)}
                      placeholder="ex. Christian"
                      className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Nom de famille *</label>
                    <input
                      type="text"
                      required
                      value={formLastName}
                      onChange={(e) => setFormLastName(e.target.value)}
                      placeholder="ex. MARIE-LUCE"
                      className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Date de naissance *</label>
                    <input
                      type="date"
                      required
                      value={formBirthDate}
                      onChange={(e) => setFormBirthDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">
                      Numéro Sécurité Sociale (NIR 13 ou 15 chiffres) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formNir}
                      onChange={(e) => setFormNir(e.target.value)}
                      placeholder="1 54 11 97 208 771 72"
                      className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono font-bold text-xs text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Coordonnées & Résidence en Martinique */}
              <div className="p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 space-y-3">
                <div className="font-bold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">home_pin</span>
                  <span>2. Coordonnées & Résidence en Martinique</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Téléphone de contact *</label>
                    <input
                      type="tel"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="0696 55 44 33"
                      className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="patient@email.mq"
                      className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Adresse postale / Quartier *</label>
                    <input
                      type="text"
                      required
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Quartier Cap Est, Morne Calebasse"
                      className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-on-surface mb-1">Commune 972 *</label>
                    <select
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                    >
                      {MARTINIQUE_COMMUNES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Droits CPAM & Prescription */}
              <div className="p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 space-y-3">
                <div className="font-bold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span>3. Droits CPAM Martinique & Prescripteur</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={formIsAld}
                      onChange={(e) => setFormIsAld(e.target.checked)}
                      className="accent-primary h-4 w-4"
                    />
                    <div>
                      <span className="font-bold text-on-surface block">Exonération ALD 100%</span>
                      <span className="text-[10px] text-on-surface-variant">Prise en charge intégrale Sécurité Sociale</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={formHasPmt}
                      onChange={(e) => setFormHasPmt(e.target.checked)}
                      className="accent-primary h-4 w-4"
                    />
                    <div>
                      <span className="font-bold text-on-surface block">Prescription PMT Validée</span>
                      <span className="text-[10px] text-on-surface-variant">Cerfa S3138 présent au dossier</span>
                    </div>
                  </label>
                </div>

                {formIsAld && (
                  <div>
                    <label className="block text-[11px] font-medium text-on-surface mb-1">Motif ALD (facultatif)</label>
                    <input
                      type="text"
                      value={formAldReason}
                      onChange={(e) => setFormAldReason(e.target.value)}
                      placeholder="ex: ALD 19 - Insuffisance rénale, ALD 30..."
                      className="w-full p-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-on-surface mb-1">Médecin prescripteur / Spécialiste</label>
                  <input
                    type="text"
                    value={formDoctor}
                    onChange={(e) => setFormDoctor(e.target.value)}
                    placeholder="Dr. Célestine - CHU Martinique"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Besoins de mobilité */}
              <div className="p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 space-y-3">
                <div className="font-bold text-primary text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">accessible_forward</span>
                  <span>4. Besoins de Mobilité & Prise en Charge</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formWheelchair}
                      onChange={(e) => setFormWheelchair(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="font-medium text-xs">Fauteuil roulant</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formStretcher}
                      onChange={(e) => setFormStretcher(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="font-medium text-xs">Brancardage</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formOxygen}
                      onChange={(e) => setFormOxygen(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="font-medium text-xs">Oxygène</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formStairs}
                      onChange={(e) => setFormStairs(e.target.checked)}
                      className="accent-primary"
                    />
                    <span className="font-medium text-xs">Portage escaliers</span>
                  </label>
                </div>

                {formStairs && (
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-medium text-on-surface">Nombre d'étages sans ascenseur :</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formFloorNumber}
                      onChange={(e) => setFormFloorNumber(Number(e.target.value))}
                      className="w-16 p-1 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-xs text-center"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-on-surface mb-1">Consignes médicales spécifiques :</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Consignes particulières, code d'accès portail, aide à la marche..."
                    rows={2}
                    className="w-full p-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              {!editingClient && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">key</span>
                    <span>Mot de Passe Initial Généré pour le Patient</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formInitialPassword}
                      onChange={(e) => setFormInitialPassword(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-amber-300 bg-white font-mono font-bold text-xs text-amber-950"
                    />
                    <button
                      type="button"
                      onClick={() => setFormInitialPassword(`MT972-${Math.random().toString(36).slice(-5).toUpperCase()}!`)}
                      className="px-3 py-2 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs cursor-pointer"
                    >
                      Régénérer
                    </button>
                  </div>
                  <span className="text-[10px] text-amber-800">
                    Ce mot de passe pourra être communiqué au patient lors de la confirmation de son compte.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => { setIsCreateModalOpen(false); setEditingClient(null); }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>{editingClient ? 'Mettre à jour la fiche' : 'Créer la fiche patient'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : GESTION DU MOT DE PASSE PATIENT                                  */}
      {/* ========================================================================= */}
      {passwordModalClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 my-8">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 shadow-2xs">
                  <span className="material-symbols-outlined text-xl">lock_reset</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Gestion du Mot de Passe</h3>
                  <span className="text-[11px] text-on-surface-variant">
                    {passwordModalClient.firstName} {passwordModalClient.lastName} ({passwordModalClient.email})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalClient(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmPasswordReset} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-on-surface mb-1">
                  Nouveau mot de passe ou code temporaire sécurisé :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-mono font-bold text-xs text-on-surface outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPasswordValue(`MT972-${Math.random().toString(36).slice(-5).toUpperCase()}!`)}
                    className="px-3 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs cursor-pointer shrink-0"
                    title="Générer un mot de passe aléatoire"
                  >
                    <span className="material-symbols-outlined text-base">autorenew</span>
                  </button>
                </div>
              </div>

              {generatedPasswordFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1 text-emerald-800">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>Mot de passe appliqué avec succès !</span>
                  </div>
                  <div className="font-mono text-xs font-bold bg-white p-2 rounded-lg border border-emerald-200 select-all">
                    {generatedPasswordFeedback}
                  </div>
                  <span className="text-[10px] text-emerald-700 block">
                    Vous pouvez copier ce code pour le transmettre au patient.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setPasswordModalClient(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-outline-variant/40 text-xs font-bold hover:bg-surface-container transition-all cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  <span>Enregistrer le mot de passe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : HISTORIQUE DES COURSES DU PATIENT                                */}
      {/* ========================================================================= */}
      {ridesModalClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-3xl w-full bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col gap-4 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">history_edu</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Historique des Transports : {ridesModalClient.firstName} {ridesModalClient.lastName}
                  </h3>
                  <span className="text-[11px] text-on-surface-variant">
                    NIR : {ridesModalClient.nir} • {ridesModalClient.city} • {clientRides.length} course(s) enregistrée(s)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRidesModalClient(null)}
                className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {isLoadingRides ? (
              <div className="py-12 text-center text-on-surface-variant font-semibold text-xs">
                Chargement des courses associées au patient...
              </div>
            ) : clientRides.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant text-xs">
                Aucune course enregistrée pour ce patient actuellement.
              </div>
            ) : (
              <div className="space-y-3">
                {clientRides.map((ride) => (
                  <div key={ride.id} className="p-4 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary text-sm">#{ride.reference}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-on-surface">
                          {ride.transportType === 'AMBULANCE' ? '🚑 Ambulance' : ride.transportType === 'TAXI_CONVENTIONNE' ? '🚗 Taxi Conv.' : '🚐 VSL'}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {new Date(ride.pickupDateTime).toLocaleDateString('fr-FR')} à {new Date(ride.pickupDateTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ride.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ride.status === 'CANCELLED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ride.status === 'COMPLETED' ? 'Terminé' : ride.status === 'CANCELLED' ? 'Annulé' : 'En cours'}
                      </span>
                    </div>

                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                      <span className="font-semibold text-on-surface">{ride.pickupAddress} ({ride.pickupCity})</span>
                      <span>➔</span>
                      <span className="font-semibold text-on-surface">{ride.facilityName || ride.dropoffAddress} ({ride.dropoffCity})</span>
                    </div>

                    <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between text-[11px]">
                      <span className="text-on-surface-variant">
                        Transporteur : <strong>{ride.assignedTransporter?.companyName || 'Non assigné'}</strong>
                        {ride.assignedTransporter?.driverName && ` (${ride.assignedTransporter.driverName})`}
                      </span>
                      {ride.pricing && (
                        <span className="font-mono font-bold text-primary">
                          Total : {ride.pricing.totalPrestation.toFixed(2)} € (PEC CPAM : {ride.pricing.cpamAmount.toFixed(2)} €)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-outline-variant/20 flex justify-end">
              <button
                type="button"
                onClick={() => setRidesModalClient(null)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 max-w-md bg-surface-container-lowest text-on-surface p-4 rounded-2xl shadow-2xl z-50 flex items-start gap-3 border border-outline-variant/40 animate-fadeIn">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base">check_circle</span>
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
    </AdminLayout>
  );
};
