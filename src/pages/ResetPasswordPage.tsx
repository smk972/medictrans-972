import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/authService';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SEOHead } from '../components/SEOHead';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlToken = searchParams.get('token') || searchParams.get('code') || '';
  const urlEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(urlEmail);
  const [tokenOrCode, setTokenOrCode] = useState(urlToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (urlToken) setTokenOrCode(urlToken);
    if (urlEmail) setEmail(urlEmail);
  }, [urlToken, urlEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Veuillez renseigner une adresse e-mail valide.');
      return;
    }

    if (!tokenOrCode.trim()) {
      setErrorMessage('Veuillez renseigner votre code à 6 chiffres ou utiliser le lien reçu par email.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.confirmPasswordReset({
        email,
        tokenOrCode,
        newPassword,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(res.error || 'Échec de la réinitialisation. Vérifiez votre code ou lien.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de la mise à jour du mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFD] text-slate-900 selection:bg-teal-600 selection:text-white">
      <SEOHead
        title="Réinitialisation du mot de passe | Clinigo"
        description="Définissez un nouveau mot de passe pour accéder à votre espace Clinigo en toute sécurité."
        canonicalPath="/reinitialisation-mot-de-passe"
      />
      <Header />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-200/80 p-6 sm:p-10 text-center animate-fadeIn">
          
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-5 shadow-md shadow-teal-700/20">
            <span className="material-symbols-outlined text-3xl">lock_reset</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
            Entrez votre adresse email, votre code unique et choisissez votre nouveau mot de passe sécurisé.
          </p>

          {isSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3 text-emerald-800 font-bold text-base">
                <span className="material-symbols-outlined text-2xl text-emerald-600">check_circle</span>
                <span>Mot de passe modifié avec succès !</span>
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed">
                Votre nouveau mot de passe a bien été enregistré. Vous pouvez dès à présent vous connecter à votre compte Clinigo.
              </p>
              <button
                type="button"
                onClick={() => navigate('/connexion')}
                className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <span>Accéder à la page de connexion</span>
                <span className="material-symbols-outlined text-base">login</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                  <span className="material-symbols-outlined text-rose-600 text-base shrink-0 mt-0.5">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail associée <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@exemple.fr"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Code ou Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Code de sécurité ou clé unique <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Reçu par e-mail</span>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">key</span>
                  <input
                    type="text"
                    required
                    value={tokenOrCode}
                    onChange={(e) => setTokenOrCode(e.target.value)}
                    placeholder="Ex: 123456 ou clé unique du lien"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all font-mono tracking-wider"
                  />
                </div>
              </div>

              {/* Nouveau Mot de passe */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nouveau mot de passe (min. 6 caractères) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">lock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              {/* Confirmer Mot de passe */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmer le nouveau mot de passe <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-xl">lock_clock</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-sm bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Bouton de confirmation */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-teal-700 to-sky-800 hover:from-teal-800 hover:to-sky-900 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Mise à jour en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Valider mon nouveau mot de passe</span>
                    <span className="material-symbols-outlined text-base">check</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link to="/connexion" className="text-xs text-slate-500 hover:text-teal-700 font-semibold inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Retourner à la connexion</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
