import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';
import { FRENCH_HEALTHCARE_FACILITIES, HealthcareFacility } from '../data/facilities';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
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

  // Détermination automatique du profil selon le lien cliqué au préalable
  const selectedRole: UserRole = useMemo(() => {
    const qRole = searchParams.get('role')?.toUpperCase();
    if (qRole === 'FACILITY' || qRole === 'TRANSPORTER' || qRole === 'ADMIN' || qRole === 'PATIENT') {
      return qRole as UserRole;
    }
    if (locationState?.requiredRole) {
      return locationState.requiredRole;
    }
    const fromPath = locationState?.from?.pathname || '';
    if (fromPath.includes('etablissement')) return 'FACILITY';
    if (fromPath.includes('transporteur')) return 'TRANSPORTER';
    if (fromPath.includes('admin')) return 'ADMIN';
    return 'PATIENT';
  }, [searchParams, locationState]);

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(
    locationState?.mode || 'LOGIN'
  );
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (locationState?.mode) {
      setMode(locationState.mode);
    }
  }, [locationState?.mode]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [finess, setFiness] = useState('');
  const [matchedFacility, setMatchedFacility] = useState<HealthcareFacility | null>(null);
  const [finessMatches, setFinessMatches] = useState<HealthcareFacility[]>([]);
  const [transporterName, setTransporterName] = useState('');
  const [arsLicense, setArsLicense] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFinessChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    setFiness(digits);
    setFormError(null);

    if (!digits) {
      setMatchedFacility(null);
      setFinessMatches([]);
      return;
    }

    // Recherche des établissements correspondants au FINESS (France entière & DOM)
    const exactMatches = FRENCH_HEALTHCARE_FACILITIES.filter(f => f.finess === digits);
    if (exactMatches.length > 0) {
      setFinessMatches(exactMatches);
      setMatchedFacility(exactMatches[0]);
      setFacilityName(exactMatches[0].name);
      return;
    }

    // Recherche partielle si 4 chiffres ou plus
    if (digits.length >= 4) {
      const partial = FRENCH_HEALTHCARE_FACILITIES.filter(f => f.finess?.startsWith(digits));
      setFinessMatches(partial);
      if (partial.length === 1) {
        setMatchedFacility(partial[0]);
        setFacilityName(partial[0].name);
      } else {
        setMatchedFacility(null);
      }
    } else {
      setFinessMatches([]);
      setMatchedFacility(null);
    }
  };

  const selectFacility = (fac: HealthcareFacility) => {
    setMatchedFacility(fac);
    setFacilityName(fac.name);
    if (fac.finess) setFiness(fac.finess);
    setFinessMatches([]);
  };

  const getUserDashboardPath = (role?: UserRole): string => {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'FACILITY':
        return '/etablissements';
      case 'TRANSPORTER':
        return '/portal-transporteur';
      case 'PATIENT':
      default:
        return '/suivi';
    }
  };

  const redirectAfterAuth = (role: UserRole) => {
    const qRedirect = searchParams.get('redirect');
    const stateFrom = locationState?.from?.pathname;
    const target = qRedirect || stateFrom;

    if (target && target !== '/connexion' && target !== '/login') {
      // Vérifier si la cible n'est pas incompatible avec le rôle de l'utilisateur
      const isForbidden = 
        (target.includes('etablissement') && role !== 'FACILITY' && role !== 'ADMIN') ||
        (target.includes('transporteur') && role !== 'TRANSPORTER' && role !== 'ADMIN') ||
        (target.includes('admin') && role !== 'ADMIN');

      if (!isForbidden) {
        navigate(target, { replace: true });
        return;
      }
    }

    navigate(getUserDashboardPath(role), { replace: true });
  };

  // Contenus et métadonnées adaptés strictement à la catégorie cliquée
  const categoryConfig = useMemo(() => {
    switch (selectedRole) {
      case 'FACILITY':
        return {
          icon: 'local_hospital',
          badgeText: 'Portail Établissements & Soignants',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
          title: 'Connexion Portail Établissements',
          subtitle: 'Accès réservé aux soignants, cadres de santé et services de régulation des transports (CHU, hôpitaux, cliniques, dialyses en France métropolitaine & DOM).',
          seoTitle: 'Connexion Portail Établissements de Santé | Clinigo',
          placeholderCompany: 'CHU, Centre Hospitalier, Clinique, Centre de dialyse...',
          features: [] as Array<{ icon: string; title: string; desc: string }>
        };
      case 'TRANSPORTER':
        return {
          icon: 'ambulance',
          badgeText: '',
          badgeClass: '',
          title: 'Espace Transporteurs',
          subtitle: 'Accédez à votre dashboard et gérez vos courses et votre flotte.',
          seoTitle: 'Espace Transporteurs | Clinigo',
          placeholderCompany: 'Ambulances Médicales, VSL, Taxis conventionnés...',
          features: [] as Array<{ icon: string; title: string; desc: string }>
        };
      case 'ADMIN':
        return {
          icon: 'tune',
          badgeText: 'Tour de Contrôle & Régulation Territoriale',
          badgeClass: 'bg-purple-50 text-purple-800 border-purple-200/80',
          title: 'Supervision & Régulation Territoriale',
          subtitle: 'Console d\'administration réservée aux régulateurs territoriaux, délégations ARS et auditeurs CPAM / BPEC.',
          seoTitle: 'Supervision & Régulation Sanitaire | Clinigo',
          placeholderCompany: 'ARS / Cellule de Régulation Territoriale',
          features: [] as Array<{ icon: string; title: string; desc: string }>
        };
      case 'PATIENT':
      default:
        return {
          icon: 'lock',
          badgeText: 'Espace Sécurisé Patient & Tiers-Payant',
          badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/70',
          title: 'Connectez-vous pour voir vos demandes',
          subtitle: 'Pour des raisons de secret médical et de sécurité de vos données de santé, le récapitulatif de vos transports et le suivi en direct sont accessibles après identification.',
          seoTitle: 'Connexion Espace Sécurisé Patient | Clinigo',
          placeholderCompany: '',
          features: [] as Array<{ icon: string; title: string; desc: string }>
        };
    }
  }, [selectedRole]);

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
        setTimeout(() => redirectAfterAuth(selectedRole), 400);
      } else {
        setFormError(res.error || 'Adresse e-mail ou mot de passe incorrect.');
      }
    } else {
      if (!firstName || !lastName) {
        setFormError('Veuillez renseigner votre prénom et nom.');
        return;
      }
      if (selectedRole === 'FACILITY' && !facilityName && !finess) {
        setFormError("Veuillez renseigner le numéro FINESS et le nom de l'établissement de santé.");
        return;
      }
      if (selectedRole === 'TRANSPORTER') {
        if (!transporterName) {
          setFormError("Veuillez renseigner la raison sociale de votre société de transport.");
          return;
        }
        if (!arsLicense) {
          setFormError("Veuillez renseigner votre numéro d'agrément ARS.");
          return;
        }
      }

      const res = await registerWithEmail(email, password, {
        role: selectedRole,
        firstName,
        lastName,
        phone,
        facilityName: selectedRole === 'FACILITY' ? facilityName : undefined,
        facilityFiness: selectedRole === 'FACILITY' ? finess : undefined,
        transporterName: selectedRole === 'TRANSPORTER' ? transporterName : undefined,
        transporterLicense: selectedRole === 'TRANSPORTER' ? arsLicense : undefined
      });

      if (res.success) {
        setSuccessMessage('Compte créé avec succès ! Redirection...');
        setTimeout(() => redirectAfterAuth(selectedRole), 400);
      } else {
        setFormError(res.error || "Une erreur est survenue lors de la création du compte.");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFD] text-slate-900 relative selection:bg-teal-600 selection:text-white">
      <SEOHead
        title={categoryConfig.seoTitle}
        description={categoryConfig.subtitle}
        canonicalPath="/connexion"
      />
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex items-center justify-center min-h-[70vh]">
        {/* Carte Principale identique au gabarit de /suivi */}
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-200/80 p-6 sm:p-10 text-center animate-fadeIn card-silky">
          
          {/* Icône principale cerclée */}
          <div className="w-20 h-20 rounded-3xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-5 shadow-sm ring-8 ring-slate-100">
            <span className="material-symbols-outlined text-4xl">{categoryConfig.icon}</span>
          </div>

          {/* Badge de catégorie cliquée */}
          {categoryConfig.badgeText ? (
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-3 ${categoryConfig.badgeClass}`}>
              <span className="material-symbols-outlined text-sm">shield</span>
              {categoryConfig.badgeText}
            </span>
          ) : null}

          {/* Titre fort */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2.5">
            {categoryConfig.title}
          </h1>

          {/* Sous-titre explicatif adapté */}
          <p className="text-slate-500 max-w-md mx-auto text-xs sm:text-sm leading-relaxed mb-6">
            {categoryConfig.subtitle}
          </p>

          {/* Session déjà active : Option de continuer ou changer de compte */}
          {isAuthenticated && user && (
            <div className="mb-6 p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm ring-2 ring-teal-300 shrink-0">
                  {user.firstName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-xs text-slate-900 font-medium">
                    Déjà connecté en tant que <strong className="font-bold">{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.fullName || user.email)}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                <button
                  type="button"
                  id="btn-login-my-space"
                  onClick={() => navigate(getUserDashboardPath(user.role), { replace: true })}
                  className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">dashboard</span>
                  <span>Mon espace ({user.role === 'TRANSPORTER' ? 'Transporteur' : user.role === 'FACILITY' ? 'Établissement' : user.role === 'ADMIN' ? 'Admin' : 'Patient'})</span>
                </button>
                <button
                  type="button"
                  id="btn-login-my-profile"
                  onClick={() => navigate('/profil')}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Gérer mon profil et mes coordonnées"
                >
                  <span className="material-symbols-outlined text-sm text-teal-700">manage_accounts</span>
                  <span>Mon Profil</span>
                </button>
                <button
                  type="button"
                  onClick={async () => { await logout(); }}
                  className="px-3 py-1.5 rounded-full bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Se déconnecter pour changer de compte"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span>Changer</span>
                </button>
              </div>
            </div>
          )}


          {/* Bascule Créer un compte / Se connecter */}
          <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-6 border border-slate-200/60">
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
          </div>

          {/* Connexion Google pour les Patients */}
          {selectedRole === 'PATIENT' && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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

              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80"></div>
                </div>
                <span className="relative px-3 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ou avec votre adresse e-mail
                </span>
              </div>
            </div>
          )}

          {/* Formulaire de saisie */}
          <form onSubmit={handleEmailSubmit} className="space-y-4 text-left">
            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-base text-rose-600">error</span>
                <span>{formError}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-base text-teal-600">check_circle</span>
                <span>{successMessage}</span>
              </div>
            )}

            {mode === 'REGISTER' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      Nom de famille <span className="text-rose-600">*</span>
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro de portable
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 XX XX XX XX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                  />
                </div>



                {selectedRole === 'FACILITY' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Numéro FINESS (9 chiffres) <span className="text-rose-600">*</span>
                        </label>
                        <span className="text-[10px] text-teal-700 font-medium">Recherche automatique nationale (France & DOM)</span>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
                          badge
                        </span>
                        <input
                          type="text"
                          required
                          value={finess}
                          onChange={(e) => handleFinessChange(e.target.value)}
                          placeholder="Ex: 750100018, 970211145... (9 chiffres)"
                          maxLength={9}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Structure trouvée automatiquement */}
                    {matchedFacility && (
                      <div className="p-3 bg-teal-50/90 border border-teal-200/80 rounded-2xl flex items-center justify-between gap-2.5 text-xs text-teal-900 animate-fadeIn shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-base">domain_verification</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{matchedFacility.name}</span>
                            <span className="text-[11px] text-teal-700 block mt-0.5">
                              {matchedFacility.city} ({matchedFacility.postalCode}) • {matchedFacility.categoryLabel}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold shrink-0">
                          Identifié
                        </span>
                      </div>
                    )}

                    {/* Choix du site si plusieurs partagent le même FINESS */}
                    {finessMatches.length > 1 && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <span className="text-[11px] text-slate-500 font-medium block">
                          Plusieurs sites rattachés à ce FINESS. Précisez votre site :
                        </span>
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {finessMatches.map((fac) => (
                            <button
                              key={fac.id}
                              type="button"
                              onClick={() => selectFacility(fac)}
                              className={`p-2 rounded-xl text-left text-xs transition-all border flex items-center justify-between gap-2 cursor-pointer ${
                                matchedFacility?.id === fac.id
                                  ? 'bg-teal-50 border-teal-300 font-bold text-teal-950 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span className="truncate">{fac.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">{fac.city}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nom de l'établissement de santé <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={facilityName}
                        onChange={(e) => setFacilityName(e.target.value)}
                        placeholder="Ex: CHU, Centre Hospitalier, Clinique, Dialyse..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {selectedRole === 'TRANSPORTER' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Raison sociale de votre entreprise <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={transporterName}
                        onChange={(e) => setTransporterName(e.target.value)}
                        placeholder={categoryConfig.placeholderCompany}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Numéro d'agrément ARS / Préfectoral <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={arsLicense}
                        onChange={(e) => setArsLicense(e.target.value)}
                        placeholder="Ex: AMB-2024-01 ou N° Arrêté Préfectoral"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse e-mail professionnelle / personnelle <span className="text-rose-600">*</span>
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
                  placeholder="contact@exemple.fr"
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
                    onClick={() => alert("Pour réinitialiser votre mot de passe, contactez l'assistance Clinigo en ligne ou votre coordinateur de secteur.")}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
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
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Bouton Principal de Soumission */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-auth"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-800 via-teal-900 to-sky-900 hover:from-teal-700 hover:to-sky-800 text-white font-bold text-sm shadow-md shadow-teal-950/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">
                  {mode === 'LOGIN' ? 'login' : 'person_add'}
                </span>
                <span>
                  {mode === 'LOGIN' ? 'Accéder à mon espace sécurisé' : 'Créer mon compte'}
                </span>
              </button>
            </div>
          </form>

          {/* Garanties et Rassurance ARS / CPAM (comme sur /suivi) */}
          {categoryConfig.features && categoryConfig.features.length > 0 ? (
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {categoryConfig.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-teal-700 text-lg mt-0.5 shrink-0">
                    {feat.icon}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{feat.title}</span>
                    <span className="text-[11px] text-slate-500 leading-tight block">{feat.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

        </div>
      </main>

      <Footer />
    </div>
  );
};
