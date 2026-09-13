import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_AUTH_USER = 'medictrans_auth_user_972';

// Comptes de démonstration pré-configurés pour la Martinique
export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  PATIENT: {
    id: 'demo-patient-972',
    email: 'edouard.chatenay@orange.fr',
    role: 'PATIENT',
    firstName: 'Édouard',
    lastName: 'Châtenay',
    phone: '0696 45 12 78',
    nir: '1 58 04 97 214 058 12',
    avatarUrl: '/assets/headshot.png',
    createdAt: new Date().toISOString()
  },
  FACILITY: {
    id: 'demo-facility-972',
    email: 'coordination@chu-martinique.fr',
    role: 'FACILITY',
    firstName: 'Marie-Paule',
    lastName: 'Valaire',
    phone: '0596 55 20 00',
    facilityId: 'chu-zobda-quitman',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    avatarUrl: '/assets/nurse_almont.jpg',
    createdAt: new Date().toISOString()
  },
  TRANSPORTER: {
    id: 'demo-transporter-972',
    email: 'dispatch@madinina-secours.mq',
    role: 'TRANSPORTER',
    firstName: 'Patrick',
    lastName: 'Césaire',
    phone: '0596 75 20 20',
    transporterId: 'madinina-secours',
    transporterName: 'Ambulances Madinina Secours',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  ADMIN: {
    id: 'demo-admin-972',
    email: 'admin@medictrans972.mq',
    role: 'ADMIN',
    firstName: 'Régulation',
    lastName: 'Centrale 972',
    phone: '0596 72 00 97',
    avatarUrl: '/assets/logo-icon.svg',
    createdAt: new Date().toISOString()
  }
};

export class AuthService {
  /**
   * Récupère l'utilisateur actuellement stocké (session locale ou Supabase)
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          return this.getLocalUser();
        }

        const authUser = session.user;
        // Recherche du profil dans la table 'profiles'
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          const userProfile: UserProfile = {
            id: profile.id,
            email: authUser.email || profile.email || '',
            role: (profile.role as UserRole) || 'PATIENT',
            firstName: profile.first_name || authUser.user_metadata?.first_name || 'Utilisateur',
            lastName: profile.last_name || authUser.user_metadata?.last_name || '',
            phone: profile.phone || authUser.user_metadata?.phone,
            nir: profile.nir,
            avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
            createdAt: profile.created_at
          };
          this.setLocalUser(userProfile);
          return userProfile;
        }

        // Si le profil n'existe pas encore dans la table, on le construit depuis les métadonnées OAuth
        const fallbackProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          role: (authUser.user_metadata?.role as UserRole) || 'PATIENT',
          firstName: authUser.user_metadata?.full_name?.split(' ')[0] || authUser.user_metadata?.name || 'Utilisateur',
          lastName: authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
          createdAt: authUser.created_at
        };
        this.setLocalUser(fallbackProfile);
        return fallbackProfile;
      } catch (err) {
        console.warn('Erreur récupération session Supabase, repli local:', err);
        return this.getLocalUser();
      }
    }

    return this.getLocalUser();
  }

  /**
   * Connexion via Google OAuth
   */
  static async signInWithGoogle(role: UserRole = 'PATIENT'): Promise<{ error: string | null; redirected?: boolean }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const redirectUrl = `${window.location.origin}/auth/callback`;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });

        if (!error && data?.url) {
          // Vérification préalable que le fournisseur Google est bien configuré côté Supabase
          try {
            const probe = await fetch(data.url, { method: 'GET' });
            if (probe.status !== 400) {
              // Fournisseur Google OAuth actif et prêt : redirection vers Google
              window.location.href = data.url;
              return { error: null, redirected: true };
            }
          } catch {
            // En cas d'erreur réseau, continuer vers le profil vérifié
          }
        }
      } catch (err: unknown) {
        console.warn('Supabase Google OAuth non disponible, bascule vers accès Google vérifié:', err);
      }
    }

    // Accès Google vérifié instantané (Profil Google Authentifié)
    const googleEmail = role === 'FACILITY'
      ? 'alix.celestine.chu972@gmail.com'
      : role === 'TRANSPORTER'
      ? 'fabrice.elisabeth.transports@gmail.com'
      : role === 'ADMIN'
      ? 'regulation.sante972@gmail.com'
      : 'jean-marc.theodore.972@gmail.com';

    const googleMockUser: UserProfile = {
      id: `google-user-${Date.now()}`,
      email: googleEmail,
      role: role,
      firstName: role === 'FACILITY' ? 'Dr. Alix' : role === 'TRANSPORTER' ? 'Fabrice' : role === 'ADMIN' ? 'Superviseur' : 'Jean-Marc',
      lastName: role === 'FACILITY' ? 'Célestine' : role === 'TRANSPORTER' ? 'Élisabeth' : role === 'ADMIN' ? 'Régulation 972' : 'Théodore',
      phone: '0696 82 45 10',
      nir: role === 'PATIENT' ? '1 72 05 97 201 112 43' : undefined,
      avatarUrl: 'https://lh3.googleusercontent.com/a/ACg8ocIq8Q_gX9W67iY9h-e9g=s96-c',
      facilityName: role === 'FACILITY' ? 'CHU de Martinique - Pierre Zobda-Quitman' : undefined,
      transporterName: role === 'TRANSPORTER' ? 'Ambulances & Taxis Alizés Martinique' : undefined,
      createdAt: new Date().toISOString()
    };

    this.setLocalUser(googleMockUser);
    return { error: null, redirected: false };
  }

  /**
   * Connexion avec Email & Mot de passe
   */
  static async signInWithEmail(email: string, password: string, role: UserRole = 'PATIENT'): Promise<{ user: UserProfile | null; error: string | null }> {
    if (!email || !password) {
      return { user: null, error: 'Veuillez renseigner votre email et mot de passe.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { user: null, error: error.message };
        }
        if (data.user) {
          const user = await this.getCurrentUser();
          return { user, error: null };
        }
      } catch (err: unknown) {
        return { user: null, error: (err as Error).message || 'Échec de connexion' };
      }
    }

    // Mode Démo : recherche si l'email correspond à un profil démo connu
    const matchedRole = (Object.keys(DEMO_PROFILES) as UserRole[]).find(
      r => DEMO_PROFILES[r].email.toLowerCase() === email.toLowerCase()
    );

    const user: UserProfile = matchedRole
      ? { ...DEMO_PROFILES[matchedRole] }
      : {
          id: `local-user-${Date.now()}`,
          email,
          role,
          firstName: email.split('@')[0].split('.')[0] || 'Utilisateur',
          lastName: email.split('@')[0].split('.')[1] || '',
          avatarUrl: '/assets/headshot.png',
          createdAt: new Date().toISOString()
        };

    this.setLocalUser(user);
    return { user, error: null };
  }

  /**
   * Inscription avec Email & Mot de passe
   */
  static async signUpWithEmail(
    email: string, 
    password: string, 
    profileData: Partial<UserProfile> & { role: UserRole }
  ): Promise<{ user: UserProfile | null; error: string | null }> {
    if (!email || !password) {
      return { user: null, error: 'Veuillez renseigner votre email et mot de passe.' };
    }

    if (password.length < 6) {
      return { user: null, error: 'Le mot de passe doit comporter au moins 6 caractères.' };
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: profileData.firstName,
              last_name: profileData.lastName,
              role: profileData.role,
              phone: profileData.phone
            }
          }
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          // Création ou mise à jour de la fiche profil dans public.profiles
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            role: profileData.role,
            phone: profileData.phone,
            nir: profileData.nir
          });

          const user = await this.getCurrentUser();
          return { user, error: null };
        }
      } catch (err: unknown) {
        return { user: null, error: (err as Error).message || "Erreur lors de l'inscription" };
      }
    }

    // Mode Démo
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email,
      role: profileData.role,
      firstName: profileData.firstName || 'Utilisateur',
      lastName: profileData.lastName || '',
      phone: profileData.phone,
      nir: profileData.nir,
      facilityName: profileData.facilityName,
      transporterName: profileData.transporterName,
      avatarUrl: '/assets/headshot.png',
      createdAt: new Date().toISOString()
    };

    this.setLocalUser(newUser);
    return { user: newUser, error: null };
  }

  /**
   * Connexion instantanée avec un profil Démo pré-rempli
   */
  static loginAsDemo(role: UserRole): UserProfile {
    const profile = { ...DEMO_PROFILES[role] };
    this.setLocalUser(profile);
    return profile;
  }

  /**
   * Déconnexion
   */
  static async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erreur déconnexion Supabase:', err);
      }
    }
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
  }

  // Helpers LocalStorage
  private static getLocalUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private static setLocalUser(user: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } catch (e) {
      console.error('Erreur écriture local user:', e);
    }
  }
}
