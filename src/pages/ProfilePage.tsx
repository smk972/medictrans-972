import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { validateNir } from '../utils/nirValidator';

// Avatars de démonstration soignés et professionnels
const AVATAR_PRESETS = [
  { label: 'Homme 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Femme 1', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { label: 'Médecin', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80' },
  { label: 'Soignante', url: 'https://images.unsplash.com/photo-1594824813593-90d0b001a4ee?w=150&auto=format&fit=crop&q=80' },
  { label: 'Chauffeur Pro', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { label: 'Portrait Martinique', url: '/assets/headshot.png' },
];

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Si non connecté, rediriger vers la page de connexion
  useEffect(() => {
    if (!isAuthenticated && !user) {
      navigate('/connexion?redirect=/profil');
    }
  }, [isAuthenticated, user, navigate]);

  // Onglet actif
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ROLE_SPECIFIC' | 'SECURITY' | 'PREFERENCES'>('GENERAL');

  // Champs modifiables communs
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || 'Fort-de-France');
  const [postalCode, setPostalCode] = useState(user?.postalCode || '97200');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Champs Patient
  const [nir, setNir] = useState(user?.nir || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [isAld, setIsAld] = useState(user?.isAld || false);
  const [aldReason, setAldReason] = useState(user?.aldReason || '');
  const [emergencyContactName, setEmergencyContactName] = useState(user?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.emergencyContactPhone || '');

  // Champs Transporteur
  const [transporterName, setTransporterName] = useState(user?.transporterName || '');
  const [siret, setSiret] = useState(user?.siret || '');
  const [transporterLicense, setTransporterLicense] = useState(user?.transporterLicense || '');
  const [cpamConventionNumber, setCpamConventionNumber] = useState(user?.cpamConventionNumber || '');
  const [whatsappPhone, setWhatsappPhone] = useState(user?.subscription?.whatsappPhone || '');

  // Champs Établissement
  const [facilityName, setFacilityName] = useState(user?.facilityName || '');
  const [facilityFiness, setFacilityFiness] = useState(user?.facilityFiness || '');
  const [facilityDepartment, setFacilityDepartment] = useState(user?.facilityDepartment || '');

  // Mot de passe (simulation)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Préférences de notification
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);

  // État de sauvegarde & messages
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchroniser l'état initial quand l'utilisateur se charge
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || 'Fort-de-France');
      setPostalCode(user.postalCode || '97200');
      setAvatarUrl(user.avatarUrl || '');

      setNir(user.nir || '');
      setBirthDate(user.birthDate || '');
      setIsAld(user.isAld || false);
      setAldReason(user.aldReason || '');
      setEmergencyContactName(user.emergencyContactName || '');
      setEmergencyContactPhone(user.emergencyContactPhone || '');

      setTransporterName(user.transporterName || '');
      setSiret(user.siret || '');
      setTransporterLicense(user.transporterLicense || '');
      setCpamConventionNumber(user.cpamConventionNumber || '');
      setWhatsappPhone(user.subscription?.whatsappPhone || '');

      setFacilityName(user.facilityName || '');
      setFacilityFiness(user.facilityFiness || '');
      setFacilityDepartment(user.facilityDepartment || '');
    }
  }, [user]);

  // Calcul du badge de rôle
  const getRoleInfo = () => {
    switch (user?.role) {
      case 'TRANSPORTER':
        return {
          label: 'Transporteur Sanitaire Conventionné',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: 'ambulance',
          dashboardUrl: '/portal-transporteur',
          dashboardLabel: 'Mon Tableau de Bord Transporteur'
        };
      case 'FACILITY':
        return {
          label: 'Établissement Hospitalier / Clinique',
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: 'local_hospital',
          dashboardUrl: '/etablissements',
          dashboardLabel: 'Mon Portail Établissement'
        };
      case 'ADMIN':
        return {
          label: 'Régulateur ARS / Superviseur 972',
          badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: 'tune',
          dashboardUrl: '/admin',
          dashboardLabel: 'Tour de Contrôle Régionale'
        };
      case 'PATIENT':
      default:
        return {
          label: 'Patient & Bénéficiaire Conventionné',
          badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
          icon: 'person',
          dashboardUrl: '/suivi',
          dashboardLabel: 'Mes Demandes & Trajets'
        };
    }
  };

  const roleInfo = getRoleInfo();

  // Enregistrement des données de profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToastMessage(null);

    // Validation du NIR pour les patients si renseigné
    if (user?.role === 'PATIENT' && nir) {
      const nirCheck = validateNir(nir);
      if (!nirCheck.isValid) {
        setToastMessage({
          type: 'error',
          text: nirCheck.errorMessage || 'Numéro de Sécurité Sociale (NIR) invalide.'
        });
        setIsSaving(false);
        return;
      }
    }

    // Validation mot de passe si rempli
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setToastMessage({
          type: 'error',
          text: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.'
        });
        setIsSaving(false);
        return;
      }
      if (newPassword.length < 6) {
        setToastMessage({
          type: 'error',
          text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
        });
        setIsSaving(false);
        return;
      }
    }

    try {
      const updates = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        avatarUrl,
        // Spécifique Patient
        ...(user?.role === 'PATIENT' && {
          nir: nir.trim(),
          birthDate,
          isAld,
          aldReason: isAld ? aldReason.trim() : undefined,
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
        }),
        // Spécifique Transporteur
        ...(user?.role === 'TRANSPORTER' && {
          transporterName: transporterName.trim(),
          siret: siret.trim(),
          transporterLicense: transporterLicense.trim(),
          cpamConventionNumber: cpamConventionNumber.trim(),
          subscription: user.subscription ? {
            ...user.subscription,
            whatsappPhone: whatsappPhone.trim()
          } : undefined
        }),
        // Spécifique Établissement
        ...(user?.role === 'FACILITY' && {
          facilityName: facilityName.trim(),
          facilityFiness: facilityFiness.trim(),
          facilityDepartment: facilityDepartment.trim()
        })
      };

      const result = await updateUserProfile(updates);

      if (result.success) {
        setToastMessage({
          type: 'success',
          text: 'Vos informations de profil ont été mises à jour avec succès !'
        });
        // Réinitialiser les champs mot de passe
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setToastMessage({
          type: 'error',
          text: result.error || 'Erreur lors de la mise à jour de votre profil.'
        });
      }
    } catch {
      setToastMessage({
        type: 'error',
        text: 'Une erreur imprévue est survenue.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm font-medium">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SEOHead
        title="Mon Profil | Clinigo Martinique"
        description="Gérez et mettez à jour vos informations personnelles, coordonnées conventionnées et préférences de compte sur Clinigo."
      />
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Toast de Notification */}
        {toastMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-sm animate-fadeIn ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl">
                {toastMessage.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span className="text-sm font-semibold">{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs font-bold hover:underline opacity-70 hover:opacity-100"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Hero Card Profil */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md shadow-slate-900/5 p-6 sm:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-teal-500/10 to-sky-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Avatar & Infos Principales */}
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.firstName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-teal-100 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-black text-2xl sm:text-3xl flex items-center justify-center ring-4 ring-teal-100 shadow-md">
                    {firstName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute -bottom-1.5 -right-1.5 bg-teal-600 text-white p-1.5 rounded-full shadow border-2 border-white flex items-center justify-center" title="Compte Actif">
                  <span className="material-symbols-outlined text-xs">verified</span>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {firstName ? `${firstName} ${lastName || ''}`.trim() : (user.fullName || 'Mon Profil')}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badgeClass}`}>
                    <span className="material-symbols-outlined text-sm">{roleInfo.icon}</span>
                    <span>{roleInfo.label}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-slate-500">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="material-symbols-outlined text-base text-slate-400">mail</span>
                    <span>{user.email}</span>
                  </span>
                  {phone && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <span className="material-symbols-outlined text-base text-slate-400">phone</span>
                      <span>{phone}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="material-symbols-outlined text-base">badge</span>
                    <span>ID: <code className="font-mono text-slate-600">{user.id.slice(0, 14)}</code></span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Rapides du Header */}
            <div className="flex flex-wrap items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
              <Link
                to={roleInfo.dashboardUrl}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-950/10 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-base text-teal-400">dashboard</span>
                <span>{roleInfo.dashboardLabel}</span>
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 text-rose-700 text-xs sm:text-sm font-semibold border border-rose-200 transition-colors"
                title="Se déconnecter"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>

          {/* Sélecteur Rapide d'Avatar */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Changer ma photo de profil :
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset.url)}
                  className={`relative p-0.5 rounded-xl border-2 transition-all ${
                    avatarUrl === preset.url
                      ? 'border-teal-600 ring-2 ring-teal-200 scale-105'
                      : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                  }`}
                  title={preset.label}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  {avatarUrl === preset.url && (
                    <span className="absolute -top-1.5 -right-1.5 bg-teal-600 text-white rounded-full p-0.5 shadow">
                      <span className="material-symbols-outlined text-[10px] block">check</span>
                    </span>
                  )}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Ou collez l'URL d'une image..."
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-56 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation par Onglets */}
        <div className="flex border-b border-slate-200 gap-2 mb-8 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('GENERAL')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'GENERAL'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-lg">person</span>
            <span>Coordonnées Générales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ROLE_SPECIFIC')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'ROLE_SPECIFIC'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{roleInfo.icon}</span>
            <span>Données Professionnelles & Droits</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'SECURITY'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-lg">lock</span>
            <span>Sécurité & Mot de Passe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PREFERENCES')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'PREFERENCES'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            <span>Notifications</span>
          </button>
        </div>

        {/* Formulaire Principal de Mise à Jour */}
        <form onSubmit={handleSaveProfile}>
          {/* ONGLET 1: Coordonnées Générales */}
          {activeTab === 'GENERAL' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Identité & Coordonnées Personnelles</h2>
                <p className="text-xs text-slate-500">Ces informations figurent sur vos bons de transport et vos facturations CPAM.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Prénom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    placeholder="Ex: Jean"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nom de famille <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    placeholder="Ex: Dupont"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Adresse Email (Identifiant de connexion)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-500 cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Vérifié
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">L'adresse email est liée à votre compte sécurisé.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Téléphone de contact / Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    placeholder="Ex: 0696 55 44 33"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Utilisé par le régulateur et le chauffeur pour vous notifier.</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Adresse de Résidence / Base Habituelle</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Adresse (Numéro et nom de rue)
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                      placeholder="Ex: 12 Rue des Flamboyants, Cluny"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Code Postal
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                      placeholder="Ex: 97200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ville / Commune (Martinique 972)
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                      placeholder="Ex: Fort-de-France"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 2: Données Professionnelles & Droits Spécifiques au Rôle */}
          {activeTab === 'ROLE_SPECIFIC' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              {/* CAS 1: PATIENT */}
              {user.role === 'PATIENT' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Droits d'Assurance Maladie & Sécurité Sociale</h2>
                    <p className="text-xs text-slate-500">Ces éléments permettent la prise en charge à 100% sans avance de frais.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Numéro de Sécurité Sociale (NIR - 13 ou 15 chiffres)
                      </label>
                      <input
                        type="text"
                        value={nir}
                        onChange={(e) => setNir(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                        placeholder="Ex: 1 85 04 75 112 345 88"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Inscrit sur votre carte Vitale ou attestation de droits CGSS.</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Date de Naissance
                      </label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/60">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAld}
                        onChange={(e) => setIsAld(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-teal-900 block">
                          Patient bénéficiaire d'une Affection de Longue Durée (ALD - Prise en charge 100%)
                        </span>
                        <span className="text-[11px] text-teal-700 block mt-0.5">
                          Exonération du ticket modérateur pour les transports en rapport avec l'affection exonérante.
                        </span>
                      </div>
                    </label>

                    {isAld && (
                      <div className="mt-3 pt-3 border-t border-teal-200/60">
                        <label className="block text-xs font-semibold text-teal-900 mb-1">
                          Motif / Libellé ALD (Optionnel - ex: Diabète, Oncologie, Dialyse)
                        </label>
                        <input
                          type="text"
                          value={aldReason}
                          onChange={(e) => setAldReason(e.target.value)}
                          placeholder="Ex: Protocole ALD 30 - Séance de dialyse CHU"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-teal-200 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Personne de Confiance / Contact d'Urgence</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom & Prénom de la personne de contact</label>
                        <input
                          type="text"
                          value={emergencyContactName}
                          onChange={(e) => setEmergencyContactName(e.target.value)}
                          placeholder="Ex: Marie Dupont (Fille)"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Numéro de téléphone d'urgence</label>
                        <input
                          type="tel"
                          value={emergencyContactPhone}
                          onChange={(e) => setEmergencyContactPhone(e.target.value)}
                          placeholder="Ex: 0696 12 34 56"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* CAS 2: TRANSPORTEUR */}
              {user.role === 'TRANSPORTER' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Informations Entreprise & Agrément ARS</h2>
                    <p className="text-xs text-slate-500">Données de régulation certifiées pour la prise en charge des bons de transport.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Raison Sociale / Nom Commercial de l'Entreprise <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={transporterName}
                        onChange={(e) => setTransporterName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                        placeholder="Ex: Ambulances Caraïbes Express"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Numéro SIRET (14 chiffres)
                      </label>
                      <input
                        type="text"
                        value={siret}
                        onChange={(e) => setSiret(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                        placeholder="Ex: 849 203 192 00014"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Agrément ARS Martinique
                      </label>
                      <input
                        type="text"
                        value={transporterLicense}
                        onChange={(e) => setTransporterLicense(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                        placeholder="Ex: 972-AMB-2024-08"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Numéro Conventionné CPAM 972
                      </label>
                      <input
                        type="text"
                        value={cpamConventionNumber}
                        onChange={(e) => setCpamConventionNumber(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                        placeholder="Ex: 972-CPAM-CONV-1204"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Numéro WhatsApp Chauffeur / Dispatch Immédiat
                      </label>
                      <input
                        type="tel"
                        value={whatsappPhone}
                        onChange={(e) => setWhatsappPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
                        placeholder="Ex: 0696 70 80 90"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">Permet de recevoir les alertes de courses instantanées sur mobile.</span>
                    </div>
                  </div>

                  {/* Statut Abonnement */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-700">stars</span>
                        <span className="text-xs font-bold text-amber-900">
                          {user.subscription?.planName || 'Formule Pro Sanitaire (0% Commission)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Statut : <span className="font-bold">{user.subscription?.status === 'TRIAL' ? 'Essai gratuit 30 jours' : 'Abonnement Actif'}</span> (19,90 € / mois - zéros frais cachés)
                      </p>
                    </div>
                    <Link
                      to="/offre-pro"
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      Détails de l'offre
                    </Link>
                  </div>
                </>
              )}

              {/* CAS 3: ÉTABLISSEMENT */}
              {user.role === 'FACILITY' && (
                <>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Établissement Hospitalier & Service Demandeur</h2>
                    <p className="text-xs text-slate-500">Rattachement hospitalier officiel pour les bons de transport informatisés.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nom de l'Établissement Hospitalier <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                        placeholder="Ex: CHU de Martinique - Hôpital Pierre Zobda-Quitman"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Numéro FINESS (9 chiffres)
                      </label>
                      <input
                        type="text"
                        value={facilityFiness}
                        onChange={(e) => setFacilityFiness(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                        placeholder="Ex: 970211145"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Service / Département Médical de Rattachement
                      </label>
                      <input
                        type="text"
                        value={facilityDepartment}
                        onChange={(e) => setFacilityDepartment(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                        placeholder="Ex: Coordination des Sorties / Oncologie"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-700 text-2xl">verified_user</span>
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Accès Professionnel Certifié ARS</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Votre compte dispose des habilitations pour commander des transports sanitaires avec télétransmission PMT directe.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* CAS 4: ADMIN */}
              {user.role === 'ADMIN' && (
                <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 space-y-3">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                    <span className="material-symbols-outlined">shield_person</span>
                    <span>Habilitations Tour de Contrôle & Régulation Centrale 972</span>
                  </div>
                  <p className="text-xs text-purple-800 leading-relaxed">
                    Vous disposez d'un compte Administrateur / Régulateur certifié. Vous avez un accès direct à la supervision globale de la flotte, aux audits des courses, et à la gestion des comptes agréés.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ONGLET 3: Sécurité & Mot de Passe */}
          {activeTab === 'SECURITY' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Sécurité du Compte & Mot de Passe</h2>
                <p className="text-xs text-slate-500">Pour votre sécurité, choisissez un mot de passe robuste d'au moins 6 caractères.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mot de passe actuel (si modification)
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    placeholder="Au moins 6 caractères"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirmer le nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
                    placeholder="Confirmez le mot de passe"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ONGLET 4: Préférences de Notification */}
          {activeTab === 'PREFERENCES' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Préférences de Notification & Alertes</h2>
                <p className="text-xs text-slate-500">Choisissez les canaux par lesquels vous souhaitez être informé en temps réel.</p>
              </div>

              <div className="space-y-4 max-w-2xl">
                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <span className="material-symbols-outlined">sms</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Notifications SMS</p>
                      <p className="text-xs text-slate-500">Suivi d'arrivée du véhicule, confirmation de prise en charge.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifySms}
                    onChange={(e) => setNotifySms(e.target.checked)}
                    className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                      <span className="material-symbols-outlined">mark_email_read</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Notifications Email</p>
                      <p className="text-xs text-slate-500">Bons de transport, récapitulatifs mensuels et factures acquittées.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <span className="material-symbols-outlined">chat</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Alertes WhatsApp Direct</p>
                      <p className="text-xs text-slate-500">Contact direct avec la régulation 972 et le chauffeur assigné.</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWhatsapp}
                    onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                    className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Barre d'Action & Bouton Enregistrer */}
          <div className="mt-8 bg-white rounded-2xl border border-slate-200/80 shadow-md p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-40">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-teal-600 text-base">lock</span>
              <span>Données chiffrées et conformes aux protocoles HDS (Hébergeur Données de Santé) &amp; RGPD.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                id="btn-save-profile"
                disabled={isSaving}
                className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-800 to-sky-900 hover:from-teal-700 hover:to-sky-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-950/15 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>Enregistrer les modifications</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};
