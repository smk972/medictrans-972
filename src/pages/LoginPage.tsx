import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsDemo,
    isLoading,
    error: authError,
    user,
    isAuthenticated,
    logout
  } = useAuth();

  const locationState = location.state as {
    from?: { pathname: string };
    requiredRole?: UserRole;
    message?: string;
    mode?: 'LOGIN' | 'REGISTER';
  } | null;

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(
    locationState?.mode || 'LOGIN'
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    locationState?.requiredRole || 'PATIENT'
  );
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (locationState?.requiredRole) {
      setSelectedRole(locationState.requiredRole);
    }
    if (locationState?.mode) {
      setMode(locationState.mode);
    }
  }, [locationState?.requiredRole, locationState?.mode]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [nir, setNir] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const redirectAfterAuth = (role: UserRole) => {
    const from = locationState?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    switch (role) {
      case 'ADMIN':
        navigate('/admin', { replace: true });
        break;
      case 'FACILITY':
        navigate('/etablissements', { replace: true });
        break;
      case 'TRANSPORTER':
        navigate('/transporteurs', { replace: true });
        break;
      case 'PATIENT':
      default:
        navigate('/suivi', { replace: true });
        break;
    }
  };

  const getHeaderInfo = () => {
    switch (selectedRole) {
      case 'FACILITY':
        return {
          title: "Connexion Portail Établissements",
          subtitle: "Accès réservé aux soignants, cadres de santé et régulation des sorties de lit (CHU, Cliniques, Dialyses 972)",
          icon: "local_hospital",
          iconBg: "bg-gradient-to-tr from-slate-800 to-slate-900 text-white shadow-md shadow-slate-900/20"
        };
      case 'TRANSPORTER':
        return {
          title: "Connexion Espace Transporteurs",
          subtitle: "Courses disponibles et dispatch en direct pour les ambulanciers, VSL et taxis conventionnés 972",
          icon: "ambulance",
          iconBg: "bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-md shadow-amber-900/20"
        };
      case 'ADMIN':
        return {
          title: "Tour de Contrôle & Régulation 972",
          subtitle: "Supervision territoriale réservée aux régulateurs ARS Martinique et auditeurs BPEC",
          icon: "tune",
          iconBg: "bg-gradient-to-tr from-purple-700 to-indigo-800 text-white shadow-md shadow-purple-900/20"
        };
      case 'PATIENT':
      default:
        return {
          title: "Espace d'Identification Patient",
          subtitle: "Connectez-vous ou créez votre compte pour suivre vos transports sanitaires et vos prises en charge CPAM",
          icon: "personal_injury",
          iconBg: "bg-gradient-to-tr from-teal-800 to-sky-700 text-white shadow-md shadow-teal-900/20"
        };
    }
  };

  const headerInfo = getHeaderInfo();

  const handleGoogleLogin = async () => {
    setFormError(null);
    setSuccessMessage(null);
    const res = await loginWithGoogle(selectedRole);
    if (!res.success) {
      setFormError(res.error || 'Erreur lors de la connexion Google');
    } else if (!res.redirected) {
      setSuccessMessage('Connexion Google réussie ! Redirection...');
      setTimeout(() => redirectAfterAuth(selectedRole), 600);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (mode === 'LOGIN') {
      const res = await loginWithEmail(email, password, selectedRole);
      if (res.success) {
        setSuccessMessage('Connexion réussie ! Redirection...');
        setTimeout(() => redirectAfterAuth(selectedRole), 500);
      } else {
        setFormError(res.error || 'Identifiants invalides');
      }
    } else {
      // Inscription
      if (!firstName || !lastName) {
        setFormError('Veuillez renseigner votre prénom et nom.');
        return;
      }

      const res = await registerWithEmail(email, password, {
        role: selectedRole,
        firstName,
        lastName,
        phone,
        nir: selectedRole === 'PATIENT' ? nir : undefined,
        facilityName: selectedRole === 'FACILITY' ? facilityName : undefined,
        transporterName: selectedRole === 'TRANSPORTER' ? transporterName : undefined,
      });

      if (res.success) {
        setSuccessMessage('Compte créé avec succès ! Redirection...');
        setTimeout(() => redirectAfterAuth(selectedRole), 600);
      } else {
        setFormError(res.error || 'Erreur lors de la création du compte');
      }
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    setFormError(null);
    setSelectedRole(role);
    loginAsDemo(role);
    setSuccessMessage(`Connexion démo activée (${role}) ! Redirection...`);
    setTimeout(() => redirectAfterAuth(role), 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 via-teal-50/70 to-sky-100/60 text-slate-900 relative selection:bg-teal-600 selection:text-white overflow-x-hidden">
      {/* Ambient gradient meshes */}
      <div 
        aria-hidden="true" 
        className="fixed top-0 right-0 w-[600px] h-[500px] bg-gradient-to-b from-teal-200/35 via-sky-200/25 to-transparent rounded-full blur-3xl pointer-events-none z-0" 
      />
      <div 
        aria-hidden="true" 
        className="fixed bottom-0 left-0 w-[500px] h-[450px] bg-gradient-to-tr from-teal-100/35 via-slate-200/40 to-transparent rounded-full blur-3xl pointer-events-none z-0" 
      />

      <SEOHead
        title="Connexion Espaces Professionnels & Patients | Clinigo"
        description="Accédez à votre espace sécurisé Clinigo : Patients, Hôpitaux et Établissements de santé, ou Entreprises de transport sanitaire conventionnées CPAM."
        canonicalPath="/connexion"
      />
      <Header />

      <main className="flex-1 pt-8 sm:pt-12 pb-16 flex items-center justify-center px-4 sm:px-6 relative z-10">
        <div className="w-full max-w-xl">
          {/* Header Card */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-md mb-4 ring-4 ring-white/60 transition-all ${headerInfo.iconBg}`}>
              <span className="material-symbols-outlined text-3xl">{headerInfo.icon}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {headerInfo.title}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-md mx-auto">
              {headerInfo.subtitle}
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-200/80 p-6 sm:p-8 card-silky">
            {/* Session déjà active : Option de déconnexion immédiate à tout moment */}
            {isAuthenticated && user && (
              <div className="mb-6 p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm ring-2 ring-teal-300 shrink-0">
                    {user.firstName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-xs text-slate-900 font-medium">
                      Connecté en tant que <strong className="font-bold">{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.fullName || user.email)}</strong> ({user.facilityName || user.transporterName || user.role})
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => redirectAfterAuth(user.role)}
                    className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
                  >
                    Mon espace
                  </button>
                  <button
                    id="btn-login-page-logout"
                    type="button"
                    onClick={async () => {
                      await logout();
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-rose-800 hover:to-rose-900 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Se déconnecter de cette session"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}

            {/* Message informatif éventuel de redirection */}
            {locationState?.message && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 shadow-xs animate-fadeIn">
                <span className="material-symbols-outlined text-amber-600 text-xl shrink-0 mt-0.5">lock</span>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Identification Préalable Requise
                  </div>
                  <div className="text-xs sm:text-sm font-medium mt-0.5">
                    {locationState.message}
                  </div>
                </div>
              </div>
            )}

            {/* Mode Switch (Créer un compte / Se connecter) */}
            <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-6 border border-slate-200/60">
              <button
                id="tab-mode-register"
                type="button"
                onClick={() => { setMode('REGISTER'); setFormError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'REGISTER'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Créer un compte</span>
              </button>
              <button
                id="tab-mode-login"
                type="button"
                onClick={() => { setMode('LOGIN'); setFormError(null); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'LOGIN'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-base">login</span>
                <span>Se connecter</span>
              </button>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Sélectionnez votre profil
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('PATIENT')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                    selectedRole === 'PATIENT'
                      ? 'border-teal-600 bg-teal-50/70 text-teal-900 shadow-sm ring-2 ring-teal-600/20'
                      : 'border-slate-200/80 hover:border-teal-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl mb-1 text-teal-700">
                    personal_injury
                  </span>
                  <span className="font-bold text-xs leading-tight">Patient</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 hidden sm:inline">Trajets & ALD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('FACILITY')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                    selectedRole === 'FACILITY'
                      ? 'border-slate-800 bg-slate-100 text-slate-900 shadow-sm ring-2 ring-slate-800/20'
                      : 'border-slate-200/80 hover:border-slate-400 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl mb-1 text-slate-800">
                    local_hospital
                  </span>
                  <span className="font-bold text-xs leading-tight">Établissement</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 hidden sm:inline">CHU, Cliniques</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('TRANSPORTER')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                    selectedRole === 'TRANSPORTER'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-500/20'
                      : 'border-slate-200/80 hover:border-amber-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl mb-1 text-amber-600">
                    ambulance
                  </span>
                  <span className="font-bold text-xs leading-tight">Transporteur</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 hidden sm:inline">Ambulances 972</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                    selectedRole === 'ADMIN'
                      ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm ring-2 ring-purple-600/20'
                      : 'border-slate-200/80 hover:border-purple-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl mb-1 text-purple-600">
                    tune
                  </span>
                  <span className="font-bold text-xs leading-tight">Régulation</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 hidden sm:inline">Admin ARS</span>
                </button>
              </div>
            </div>

            {/* Error or Success alerts */}
            {(formError || authError) && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs sm:text-sm font-medium">
                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5 text-rose-600">error</span>
                <div>{formError || authError}</div>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-xs sm:text-sm font-medium">
                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5 text-emerald-600">check_circle</span>
                <div>{successMessage}</div>
              </div>
            )}

            {/* Google Sign In Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuer avec Google</span>
              </button>
            </div>

            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                ou avec votre adresse e-mail
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              {mode === 'REGISTER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prénom <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Aimé"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nom <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Césaire"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {mode === 'REGISTER' && selectedRole === 'PATIENT' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro de Sécurité Sociale (NIR) <span className="text-slate-400 font-normal">(Optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={nir}
                    onChange={(e) => setNir(e.target.value)}
                    placeholder="1 84 10 97 214 021 45"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all font-mono"
                  />
                </div>
              )}

              {mode === 'REGISTER' && selectedRole === 'FACILITY' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom de l'établissement <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    placeholder="CHU Pierre Zobda-Quitman, Clinique Ste-Marie..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                  />
                </div>
              )}

              {mode === 'REGISTER' && selectedRole === 'TRANSPORTER' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Société de transport / Ambulance <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transporterName}
                    onChange={(e) => setTransporterName(e.target.value)}
                    placeholder="Ambulances Madinina Secours..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                  />
                </div>
              )}

              {/* Raccourcis de remplissage rapide selon le profil sélectionné */}
              {mode === 'LOGIN' && selectedRole === 'FACILITY' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                  <div>
                    <span className="font-extrabold block text-slate-900">Identifiants Cadre Hospitalier (CHU) :</span>
                    <span className="font-mono text-[11px] text-slate-600">coordination@chu-martinique.fr</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('coordination@chu-martinique.fr');
                      setPassword('CH972-Valaire!');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    Remplir
                  </button>
                </div>
              )}
              {mode === 'LOGIN' && selectedRole === 'TRANSPORTER' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                  <div>
                    <span className="font-extrabold block text-amber-900">Identifiants Dispatch Ambulances :</span>
                    <span className="font-mono text-[11px] text-amber-800">dispatch@madinina-secours.mq</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('dispatch@madinina-secours.mq');
                      setPassword('AMB972-Madinina!');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    Remplir
                  </button>
                </div>
              )}
              {mode === 'LOGIN' && selectedRole === 'PATIENT' && (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                  <div>
                    <span className="font-extrabold block text-teal-900">Identifiants Patient Référent (ALD) :</span>
                    <span className="font-mono text-[11px] text-teal-800">c.marieluce@orange.fr</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('c.marieluce@orange.fr');
                      setPassword('Patient972!');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    Remplir
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'ADMIN'
                        ? 'admin@medictrans972.mq'
                        : selectedRole === 'FACILITY'
                          ? 'coordination@chu-martinique.fr'
                          : selectedRole === 'TRANSPORTER'
                            ? 'dispatch@ambulances-972.mq'
                            : 'patient@exemple.mq'
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mot de passe <span className="text-rose-600">*</span>
                  </label>
                  {mode === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => alert("Un email de réinitialisation sécurisé peut être envoyé à votre adresse.")}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Téléphone de contact
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">
                      call
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0696 12 34 56"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-800 via-teal-900 to-sky-900 text-white font-bold shadow-lg shadow-teal-950/20 hover:from-teal-700 hover:to-sky-800 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Vérification en cours...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">
                      {mode === 'LOGIN' ? 'login' : 'how_to_reg'}
                    </span>
                    <span>
                      {mode === 'LOGIN' ? 'Accéder à mon espace' : 'Valider mon inscription'}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Accès Démo 1 Clic (Test rapide)
                </span>
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                  Sans mot de passe
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('PATIENT')}
                  className="px-3 py-2.5 rounded-2xl text-left bg-slate-50 hover:bg-teal-50/70 border border-slate-200/80 hover:border-teal-300 transition-all group flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    🩺
                  </span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">Christian M.</div>
                    <div className="text-[10px] text-slate-500 truncate">Patient (ALD)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('FACILITY')}
                  className="px-3 py-2.5 rounded-2xl text-left bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-400 transition-all group flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    🏥
                  </span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">Cadre CHU</div>
                    <div className="text-[10px] text-slate-500 truncate">Zobda-Quitman</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('TRANSPORTER')}
                  className="px-3 py-2.5 rounded-2xl text-left bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-300 transition-all group flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    🚑
                  </span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">Madinina Sec.</div>
                    <div className="text-[10px] text-slate-500 truncate">Ambulancier</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('ADMIN')}
                  className="px-3 py-2.5 rounded-2xl text-left bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-300 transition-all group flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    🛡️
                  </span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-900 truncate">Régulateur</div>
                    <div className="text-[10px] text-slate-500 truncate">ARS Martinique</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Links to Dedicated Sign up Forms */}
            <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span>Vous êtes une structure ?</span>
              <Link
                to="/inscription/etablissement"
                className="font-bold text-teal-700 hover:text-teal-900 hover:underline"
              >
                Inscription Établissement de Santé (FINESS)
              </Link>
              <span>•</span>
              <Link
                to="/inscription/transporteur"
                className="font-bold text-amber-700 hover:text-amber-900 hover:underline"
              >
                Adhésion Société d'Ambulance (ARS 972)
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
