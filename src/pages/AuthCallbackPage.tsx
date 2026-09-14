import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const targetRole = (localStorage.getItem('medictrans_oauth_target_role') as any) || 'PATIENT';
      localStorage.removeItem('medictrans_oauth_target_role');

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            setErrorMsg(error.message);
            return;
          }

          if (session?.user) {
            // Synchroniser le profil avec le rôle cible s'il n'existe pas encore
            try {
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

              if (!existingProfile) {
                const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
                const parts = fullName.split(' ');
                await supabase.from('profiles').insert({
                  id: session.user.id,
                  first_name: parts[0] || 'Utilisateur',
                  last_name: parts.slice(1).join(' ') || '',
                  role: targetRole,
                  nir: targetRole === 'PATIENT' ? '1 72 05 97 201 112' : null,
                });
              }
            } catch (pErr) {
              console.warn('Note profil:', pErr);
            }
          }

          await refreshUser();
        } catch (err: unknown) {
          setErrorMsg((err as Error).message || 'Erreur callback authentification');
          return;
        }
      }

      // Redirection immédiate et précise selon le rôle cible
      setTimeout(() => {
        if (targetRole === 'FACILITY') {
          navigate('/etablissements', { replace: true });
        } else if (targetRole === 'TRANSPORTER') {
          navigate('/transporteurs', { replace: true });
        } else if (targetRole === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/suivi', { replace: true });
        }
      }, 400);
    };

    handleAuthCallback();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl shadow-xl border border-outline-variant/30 text-center">
        {errorMsg ? (
          <div>
            <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl">error</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">Erreur d'authentification</h2>
            <p className="text-sm text-on-surface-variant mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate('/connexion')}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm"
            >
              Retour à la page de connexion
            </button>
          </div>
        ) : (
          <div>
            <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-on-surface mb-1">Authentification en cours</h2>
            <p className="text-sm text-on-surface-variant">
              Finalisation de votre connexion sécurisée Clinigo...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
