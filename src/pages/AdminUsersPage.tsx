import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { adminService } from '../services/adminService';
import { UserProfile, UserRole } from '../types';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Active target user
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Password Reset state
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Create User form
  const [newUser, setNewUser] = useState({
    role: 'ADMIN' as UserRole,
    firstName: '',
    lastName: '',
    email: '',
    phone: '06 ',
    facilityName: '',
    transporterName: '',
    nir: '',
    password: `CLINIGO-${Math.random().toString(36).slice(-5).toUpperCase()}!`
  });

  // Edit User form
  const [editForm, setEditForm] = useState<UserProfile | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.facilityName && u.facilityName.toLowerCase().includes(q)) ||
      (u.transporterName && u.transporterName.toLowerCase().includes(q)) ||
      (u.nir && u.nir.includes(q));

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Role Counts
  const countAdmin = users.filter(u => u.role === 'ADMIN').length;
  const countFacility = users.filter(u => u.role === 'FACILITY').length;
  const countTransporter = users.filter(u => u.role === 'TRANSPORTER').length;
  const countPatient = users.filter(u => u.role === 'PATIENT').length;

  const handleOpenCreate = () => {
    setNewUser({
      role: 'ADMIN',
      firstName: '',
      lastName: '',
      email: '',
      phone: '06 ',
      facilityName: '',
      transporterName: '',
      nir: '',
      password: `CLINIGO-${Math.random().toString(36).slice(-5).toUpperCase()}!`
    });
    setShowCreateModal(true);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email.trim() || !newUser.firstName.trim()) {
      alert('Veuillez renseigner au moins le prénom et une adresse email.');
      return;
    }
    try {
      const created = await adminService.createUser({
        role: newUser.role,
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim(),
        email: newUser.email.trim(),
        phone: newUser.phone.trim(),
        facilityName: newUser.facilityName ? newUser.facilityName.trim() : undefined,
        transporterName: newUser.transporterName ? newUser.transporterName.trim() : undefined,
        nir: newUser.nir ? newUser.nir.trim() : undefined,
        password: newUser.password
      });

      setShowCreateModal(false);
      setActionFeedback(`Compte ${created.email} (${created.role}) créé avec succès.`);
      await loadData();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création du compte');
    }
  };

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({ ...user });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm || !selectedUser) return;
    try {
      const updated = await adminService.updateUser(selectedUser.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        facilityName: editForm.facilityName,
        transporterName: editForm.transporterName,
        nir: editForm.nir
      });

      setShowEditModal(false);
      setActionFeedback(`Profil de ${updated.email} mis à jour avec succès.`);
      await loadData();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la modification');
    }
  };

  const handleOpenPasswordReset = (user: UserProfile) => {
    setSelectedUser(user);
    setGeneratedPassword(`CLINIGO-${Math.random().toString(36).slice(-5).toUpperCase()}!`);
    setPasswordCopied(false);
    setShowPasswordModal(true);
  };

  const handleConfirmPasswordReset = async () => {
    if (!selectedUser) return;
    try {
      await adminService.resetUserPassword(selectedUser.id, generatedPassword);
      setActionFeedback(`Nouveau mot de passe généré et appliqué pour ${selectedUser.email}`);
      setShowPasswordModal(false);
      await loadData();
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la réinitialisation');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await adminService.deleteUser(selectedUser.id);
      setActionFeedback(`Le compte ${selectedUser.email} a été supprimé.`);
      setShowDeleteModal(false);
      await loadData();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
            Administrateur
          </span>
        );
      case 'FACILITY':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
            Cadre Hospitalier
          </span>
        );
      case 'TRANSPORTER':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
            Transporteur / Dispatch
          </span>
        );
      case 'PATIENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Patient / Bénéficiaire
          </span>
        );
    }
  };

  return (
    <AdminLayout
      title="Gouvernance des Comptes & Sécurité — National & DOM"
      subtitle="Supervision globale de tous les comptes inscrits sur l'ensemble du territoire national et outre-mer (France entière)"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            <span>Nouveau Compte</span>
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
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Comptes Actifs</span>
          <div className="text-3xl font-extrabold text-primary font-mono mt-1">{users.length}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Identifiants sécurisés enregistrés</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Administrateurs Régulation</span>
          <div className="text-3xl font-extrabold text-purple-700 font-mono mt-1">{countAdmin}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Accès Super-Admin habilités</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Comptes Professionnels</span>
          <div className="text-3xl font-extrabold text-secondary font-mono mt-1">{countFacility + countTransporter}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {countFacility} Établissements • {countTransporter} Transporteurs
          </p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Comptes Patients</span>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono mt-1">{countPatient}</div>
          <p className="text-[11px] text-on-surface-variant mt-1">Bénéficiaires authentifiés</p>
        </div>
      </div>

      {actionFeedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline-variant/30 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, email, téléphone, NIR, établissement, société..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant/50 text-xs bg-surface-container-lowest outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                roleFilter === 'ALL'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Tous ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                roleFilter === 'ADMIN'
                  ? 'bg-purple-700 text-white'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Admins ({countAdmin})
            </button>
            <button
              onClick={() => setRoleFilter('FACILITY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                roleFilter === 'FACILITY'
                  ? 'bg-blue-700 text-white'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Établissements ({countFacility})
            </button>
            <button
              onClick={() => setRoleFilter('TRANSPORTER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                roleFilter === 'TRANSPORTER'
                  ? 'bg-amber-700 text-white'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Transporteurs ({countTransporter})
            </button>
            <button
              onClick={() => setRoleFilter('PATIENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                roleFilter === 'PATIENT'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Patients ({countPatient})
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 bg-surface-container-low text-on-surface-variant font-bold text-[11px] uppercase tracking-wider">
                <th className="p-4">Utilisateur / Identité</th>
                <th className="p-4">Rôle & Droits</th>
                <th className="p-4">Structure / Entité Rattachée</th>
                <th className="p-4">Contact</th>
                <th className="p-4 text-right">Actions de Sécurité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-container-lowest/80 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || '/assets/headshot.png'}
                        alt={user.firstName}
                        className="w-9 h-9 rounded-full object-cover border border-outline-variant/40 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div>
                        <div className="font-extrabold text-on-surface">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-[11px] font-mono text-on-surface-variant">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    {getRoleBadge(user.role)}
                  </td>

                  <td className="p-4">
                    {user.role === 'ADMIN' && (
                      <span className="text-[11px] font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                        Régulation Territoriale 972
                      </span>
                    )}
                    {user.role === 'FACILITY' && (
                      <span className="text-[11px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {user.facilityName || 'Établissement Hospitalier'}
                      </span>
                    )}
                    {user.role === 'TRANSPORTER' && (
                      <span className="text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                        {user.transporterName || 'Société Sanitaire'}
                      </span>
                    )}
                    {user.role === 'PATIENT' && (
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        {user.nir ? `NIR: ${user.nir.slice(0, 7)}...` : 'Patient Particulier'}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-on-surface">
                    <div className="font-semibold">{user.phone || 'Non renseigné'}</div>
                    <span className="text-[10px] text-on-surface-variant">
                      Inscrit le {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '01/01/2026'}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenPasswordReset(user)}
                        className="px-2.5 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-secondary text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Réinitialiser le mot de passe"
                      >
                        <span className="material-symbols-outlined text-base">lock_reset</span>
                        <span className="hidden sm:inline">MDP</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-on-surface transition-colors cursor-pointer"
                        title="Modifier profil & rôle"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                        title="Supprimer compte"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                    Aucun compte utilisateur ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full p-6 border border-outline-variant/40 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">person_add</span>
                <h3 className="text-base font-extrabold text-on-surface">Créer un Nouveau Compte Utilisateur</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Rôle et niveau d'habilitation *</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-bold focus:border-primary outline-none"
                >
                  <option value="ADMIN">ADMINISTRATEUR (Accès total Régulation & Paramètres)</option>
                  <option value="FACILITY">CADRE ÉTABLISSEMENT DE SANTÉ (Commandes & Suivi)</option>
                  <option value="TRANSPORTER">TRANSPORTEUR SANITAIRE (Bourse, Flotte, Missions)</option>
                  <option value="PATIENT">PATIENT / BÉNÉFICIAIRE (Réservations & Historique)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={newUser.firstName}
                    onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="Ex: Jean-Marc"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Nom</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Ex: Almont"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Adresse Email (Identifiant de connexion) *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="nom@domaine.mq"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Numéro de Téléphone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="0696 00 00 00"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              {newUser.role === 'FACILITY' && (
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Nom de l'Hôpital / Clinique rattaché</label>
                  <input
                    type="text"
                    value={newUser.facilityName}
                    onChange={e => setNewUser({ ...newUser, facilityName: e.target.value })}
                    placeholder="Ex: CHU de Martinique - Hôpital Pierre Zobda-Quitman"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              )}

              {newUser.role === 'TRANSPORTER' && (
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Société de transport sanitaire rattachée</label>
                  <input
                    type="text"
                    value={newUser.transporterName}
                    onChange={e => setNewUser({ ...newUser, transporterName: e.target.value })}
                    placeholder="Ex: Ambulances Madinina Secours"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              )}

              {newUser.role === 'PATIENT' && (
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Numéro de Sécurité Sociale (NIR)</label>
                  <input
                    type="text"
                    value={newUser.nir}
                    onChange={e => setNewUser({ ...newUser, nir: e.target.value })}
                    placeholder="15 chiffres (ex: 1 54 11 97 208 771 72)"
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-on-surface">Mot de Passe Initial</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="flex-1 p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest font-mono text-xs font-bold text-primary focus:border-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNewUser({ ...newUser, password: `MEDIC-972-${Math.random().toString(36).slice(-5).toUpperCase()}!` })}
                    className="px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container text-xs font-bold hover:bg-surface-container-high transition-colors"
                  >
                    Régénérer
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant">L'utilisateur pourra modifier ce mot de passe dès sa première connexion.</p>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors"
                >
                  Enregistrer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editForm && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-xl w-full p-6 border border-outline-variant/40 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">manage_accounts</span>
                <h3 className="text-base font-extrabold text-on-surface">Modifier le Compte Utilisateur</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-on-surface">Rôle</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-bold focus:border-primary outline-none"
                >
                  <option value="ADMIN">ADMINISTRATEUR</option>
                  <option value="FACILITY">CADRE ÉTABLISSEMENT DE SANTÉ</option>
                  <option value="TRANSPORTER">TRANSPORTEUR SANITAIRE</option>
                  <option value="PATIENT">PATIENT / BÉNÉFICIAIRE</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Prénom</label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Nom</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Email de Connexion</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Téléphone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              {editForm.role === 'FACILITY' && (
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Établissement</label>
                  <input
                    type="text"
                    value={editForm.facilityName || ''}
                    onChange={e => setEditForm({ ...editForm, facilityName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              )}

              {editForm.role === 'TRANSPORTER' && (
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Société de Transport</label>
                  <input
                    type="text"
                    value={editForm.transporterName || ''}
                    onChange={e => setEditForm({ ...editForm, transporterName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs focus:border-primary outline-none"
                  />
                </div>
              )}

              {editForm.role === 'PATIENT' && (
                <div className="space-y-1">
                  <label className="font-bold text-on-surface">Numéro NIR</label>
                  <input
                    type="text"
                    value={editForm.nir || ''}
                    onChange={e => setEditForm({ ...editForm, nir: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-mono focus:border-primary outline-none"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary/90 transition-colors"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 border border-outline-variant/40 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-2xl">lock_reset</span>
              <h3 className="text-base font-extrabold text-on-surface">Réinitialiser Mot de Passe Utilisateur</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Définir un nouveau mot de passe d'accès pour le compte <strong className="text-on-surface">{selectedUser.email}</strong> ({selectedUser.firstName} {selectedUser.lastName}).
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface">Nouveau mot de passe généré :</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedPassword}
                  onChange={e => setGeneratedPassword(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest font-mono text-xs font-bold text-primary outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    setPasswordCopied(true);
                    setTimeout(() => setPasswordCopied(false), 2000);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container text-xs font-bold hover:bg-surface-container-high transition-colors"
                >
                  {passwordCopied ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedPassword(`SEC972-${Math.random().toString(36).slice(-5).toUpperCase()}!`)}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Générer un autre mot de passe
              </button>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmPasswordReset}
                className="px-5 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold shadow-xs hover:bg-secondary/90 transition-colors"
              >
                Valider le Nouveau Mot de Passe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-md w-full p-6 border border-rose-200 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="text-base font-extrabold text-on-surface">Supprimer le Compte</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Êtes-vous certain de vouloir supprimer le compte de <strong className="text-on-surface">{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email}) ?
              Cette action révoquera immédiatement tous ses droits d'accès à la plateforme.
            </p>
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant/40 text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-xs hover:bg-rose-700 transition-colors"
              >
                Confirmer la Révocation
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
