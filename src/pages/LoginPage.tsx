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
  } | null;

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    locationState?.requiredRole || 'PATIENT'
  );
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (locationState?.requiredRole) {
      setSelectedRole(locationState.requiredRole);
    }
  }, [locationState?.requiredRole]);

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
    // Si l'utilisateur venait d'une page protégée
    const from = locationState?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    // Redirection naturelle selon le rôle
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
          iconBg: "bg-secondary text-white"
        };
      case 'TRANSPORTER':
        return {
          title: "Connexion Espace Transporteurs",
          subtitle: "Courses disponibles et dispatch en direct pour les ambulanciers, VSL et taxis conventionnés 972",
          icon: "ambulance",
          iconBg: "bg-amber-600 text-white"
        };
      case 'ADMIN':
        return {
          title: "Tour de Contrôle & Régulation 972",
          subtitle: "Supervision territoriale réservée aux régulateurs ARS Martinique et auditeurs BPEC",
          icon: "tune",
          iconBg: "bg-purple-600 text-white"
        };
      case 'PATIENT':
      default:
        return {
          title: "Espace d'Identification Patient",
          subtitle: "Plateforme de régulation et réservation de transport sanitaire en Martinique (972)",
          icon: "personal_injury",
          iconBg: "bg-primary-container text-on-primary"
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
        setFormError(res.error || "Erreur lors de l'inscription");
      }
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    loginAsDemo(role);
    setSuccessMessage(`Connexion démo activée (${role}) ! Redirection...`);
    setTimeout(() => redirectAfterAuth(role), 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <SEOHead
        title="Connexion Espaces Professionnels & Patients | Médic'Trans 972"
        description="Accédez à votre espace sécurisé Médic'Trans 972 : Patients, Hôpitaux et Établissements de santé de Martinique, ou Entreprises de transport sanitaire conventionnées CPAM."
        canonicalPath="/connexion"
      />
      <Header />

      <main className="flex-1 pt-28 pb-16 flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-xl">
          {/* Header Card */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-md mb-4 ring-4 ring-primary-container/20 transition-all ${headerInfo.iconBg}`}>
              <span className="material-symbols-outlined text-3xl">{headerInfo.icon}</span>
            </div>
            <h1 className="font-headline-md text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              {headerInfo.title}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-on-surface-variant max-w-md mx-auto">
              {headerInfo.subtitle}
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-surface-container-lowest rounded-3xl shadow-[0_8px_30px_rgb(11,28,48,0.08)] border border-outline-variant/30 p-6 sm:p-8">
            {/* Session déjà active : Option de déconnexion immédiate à tout moment */}
            {isAuthenticated && user && (
              <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-2 ring-primary/20 shrink-0">
                    {user.firstName[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-xs text-on-surface">
                      Connecté en tant que <strong className="font-bold">{user.firstName} {user.lastName}</strong> ({user.facilityName || user.transporterName || user.role})
                    </div>
                    <div className="text-[11px] text-on-surface-variant font-mono">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => redirectAfterAuth(user.role)}
                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all"
                  >
                    Mon espace
                  </button>
                  <button
                    id="btn-login-page-logout"
                    type="button"
                    onClick={async () => {
                      await logout();
                    }}
                    className="px-3 py-1.5 rounded-xl border border-error/30 text-error hover:bg-error/10 text-xs font-bold transition-all flex items-center gap-1"
                    title="Se déconnecter de cette session"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Se déconnecter</span>
                  </button>
                </div>
              </div>
            )}

            {/* Required Login Notice */}
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

            {/* Mode Switch (Connexion / Inscription) */}
            <div className="flex rounded-xl bg-surface-container p-1 mb-6">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setFormError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'LOGIN'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => { setMode('REGISTER'); setFormError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'REGISTER'
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                Créer un compte
              </button>
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5">
                Sélectionnez votre profil
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('PATIENT')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${selectedRole === 'PATIENT'
                      ? 'border-primary bg-primary/5 text-primary shadow-xs ring-2 ring-primary/20'
                      : 'border-outline-variant/40 hover:border-primary/40 bg-surface-container-lowest text-on-surface-variant'
                    }`}
                >
                  <span className="material-symbols-outlined text-2xl mb-1 text-primary">
                    personal_injury
                  </span>
                  <span className="font-bold text-xs leading-tight">Patient</span>
                  <span className="text-[10px] text-on-surface-variant/80 mt-0.5 hidden sm:inline">Trajets & ALD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('FACILITY')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${selectedRole === 'FACILITY'
                      ? 'border-secondary bg-secondary/5 text-secondary shadow-xs ring-2 ring-secondary/20'
                      : 'border-outline-variant/40 hover:border-secondary/40 bg-surface-container-lowest text-on-surface-variant'
                    }`}
                >
                  <span className="material-symbols-outlined text-2xl mb-1 text-secondary">
                    local_hospital
                  </span>
                  <span className="font-bold text-xs leading-tight">Établissement</span>
                  <span className="text-[10px] text-on-surface-variant/80 mt-0.5 hidden sm:inline">CHU, Cliniques</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('TRANSPORTER')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${selectedRole === 'TRANSPORTER'
                      ? 'border-amber-600 bg-amber-500/5 text-amber-700 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-outline-variant/40 hover:border-amber-600/40 bg-surface-container-lowest text-on-surface-variant'
                    }`}
                >
                  <span className="material-symbols-outlined text-2xl mb-1 text-amber-600">
                    ambulance
                  </span>
                  <span className="font-bold text-xs leading-tight">Transporteur</span>
                  <span className="text-[10px] text-on-surface-variant/80 mt-0.5 hidden sm:inline">Ambulances 972</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${selectedRole === 'ADMIN'
                      ? 'border-purple-600 bg-purple-500/5 text-purple-700 shadow-xs ring-2 ring-purple-500/20'
                      : 'border-outline-variant/40 hover:border-purple-600/40 bg-surface-container-lowest text-on-surface-variant'
                    }`}
                >
                  <span className="material-symbols-outlined text-2xl mb-1 text-purple-600">
                    tune
                  </span>
                  <span className="font-bold text-xs leading-tight">Régulation</span>
                  <span className="text-[10px] text-on-surface-variant/80 mt-0.5 hidden sm:inline">Admin ARS</span>
                </button>
              </div>
            </div>

            {/* Error or Success alerts */}
            {(formError || authError) && (
              <div className="mb-5 p-3.5 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 text-error">
                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5">error</span>
                <div className="text-sm font-medium">{formError || authError}</div>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800">
                <span className="material-symbols-outlined text-xl shrink-0 mt-0.5 text-emerald-600">check_circle</span>
                <div className="text-sm font-medium">{successMessage}</div>
              </div>
            )}

            {/* Google Sign In Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-outline-variant/60 hover:border-on-surface/30 bg-surface-container-lowest hover:bg-surface-container-high transition-all shadow-xs group font-label-lg font-semibold text-on-surface active:scale-[0.99] disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>
                  {mode === 'LOGIN' ? 'Continuer avec Google' : 'S\'inscrire avec Google'}
                </span>
              </button>
              <div className="text-center mt-1.5">
                <span className="text-[11px] text-on-surface-variant/70">
                  Connexion instantanée et sécurisée via votre compte Google
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-outline-variant/40 w-full"></div>
              <div className="bg-surface-container-lowest px-3 text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider shrink-0">
                ou avec votre email
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === 'REGISTER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Prénom <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean-Luc"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-surface-container-lowest text-on-surface outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Nom <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Césaire"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-surface-container-lowest text-on-surface outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {mode === 'REGISTER' && selectedRole === 'PATIENT' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Numéro de Sécurité Sociale (NIR) <span className="text-on-surface-variant font-normal">(Optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={nir}
                    onChange={(e) => setNir(e.target.value)}
                    placeholder="1 84 10 97 214 021 45"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-surface-container-lowest text-on-surface outline-none transition-all font-mono"
                  />
                </div>
              )}

              {mode === 'REGISTER' && selectedRole === 'FACILITY' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Nom de l'établissement <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={facilityName}
                    onChange={(e) => setFacilityName(e.target.value)}
                    placeholder="CHU Pierre Zobda-Quitman, Clinique Ste-Marie..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-surface-container-lowest text-on-surface outline-none transition-all"
                  />
                </div>
              )}

              {mode === 'REGISTER' && selectedRole === 'TRANSPORTER' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Société de transport / Ambulance <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transporterName}
                    onChange={(e) => setTransporterName(e.target.value)}
                    placeholder="Ambulances Madinina Secours..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-surface-container-lowest text-on-surface outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Adresse e-mail <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-xl">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      selectedRole === 'FACILITY'
                        ? 'coordination@chu-martinique.fr'
                        : selectedRole === 'TRANSPORTER'
                          ? 'dispatch@ambulances-972.mq'
                          : 'patient@exemple.mq'
                    }
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-surface-container-lowest text-on-surface outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-on-surface">
                    Mot de passe <span className="text-error">*</span>
                  </label>
                  {mode === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => alert("Un email de réinitialisation sécurisé peut être envoyé à votre adresse.")}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-xl">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-surface-container-lowest text-on-surface outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Téléphone de contact
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-xl">
                      call
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0696 12 34 56"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-outline-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-surface-container-lowest text-on-surface outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-primary text-on-primary font-label-lg font-bold shadow-sm hover:bg-primary-container hover:text-on-primary transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    <span>Vérification en cours...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">
                      {mode === 'LOGIN' ? 'login' : 'how_to_reg'}
                    </span>
                    <span>{mode === 'LOGIN' ? 'Accéder à mon espace' : 'Valider mon inscription'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="mt-8 pt-6 border-t border-outline-variant/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Accès Démo 1 Clic (Test rapide)
                </span>
                <span className="text-[11px] font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">
                  Sans mot de passe
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('PATIENT')}
                  className="px-3 py-2 rounded-xl text-left bg-surface-container hover:bg-primary/10 border border-outline-variant/30 hover:border-primary/40 transition-all group flex items-center gap-2.5"
                >
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    🩺
                  </span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-on-surface truncate">Christian M.</div>
                    <div className="text-[10px] text-on-surface-variant truncate">Patient (ALD)</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('FACILITY')}
                  className="px-3 py-2 rounded-xl text-left bg-surface-container hover:bg-secondary/10 border border-outline-variant/30 hover:border-secondary/40 transition-all group flex items-center gap-2.5"
                >
                  <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                    🏥
                  </span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-on-surface truncate">Cadre CHU</div>
                    <div className="text-[10px] text-on-surface-variant truncate">Zobda-Quitman</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('TRANSPORTER')}
                  className="px-3 py-2 rounded-xl text-left bg-surface-container hover:bg-amber-500/10 border border-outline-variant/30 hover:border-amber-500/40 transition-all group flex items-center gap-2.5"
                >
                  <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    🚑
                  </span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-on-surface truncate">Madinina Sec.</div>
                    <div className="text-[10px] text-on-surface-variant truncate">Ambulancier</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('ADMIN')}
                  className="px-3 py-2 rounded-xl text-left bg-surface-container hover:bg-purple-600/10 border border-outline-variant/30 hover:border-purple-600/40 transition-all group flex items-center gap-2.5"
                >
                  <span className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    🛡️
                  </span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-on-surface truncate">Régulation</div>
                    <div className="text-[10px] text-on-surface-variant truncate">Admin ARS</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Links to Dedicated Sign up Forms */}
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
              <span>Vous êtes une structure ?</span>
              <Link
                to="/inscription/etablissement"
                className="font-semibold text-secondary hover:underline"
              >
                Inscription Établissement de Santé (FINESS)
              </Link>
              <span>•</span>
              <Link
                to="/inscription/transporteur"
                className="font-semibold text-amber-700 hover:underline"
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
