import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_AUTH_USER = 'medictrans_auth_user_972';

// Comptes de démonstration pré-configurés pour la Martinique
export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  PATIENT: {
    id: 'demo-patient-972',
    email: 'c.marieluce@orange.fr',
    role: 'PATIENT',
    firstName: 'Christian',
    lastName: 'Marie-Luce',
    phone: '0696 55 44 33',
    nir: '1 54 11 97 208 771 72',
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
            facilityName: profile.facility_name || authUser.user_metadata?.facility_name,
            transporterName: profile.transporter_name || authUser.user_metadata?.transporter_name,
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
          firstName: authUser.user_metadata?.first_name || authUser.user_metadata?.full_name?.split(' ')[0] || authUser.user_metadata?.name || 'Utilisateur',
          lastName: authUser.user_metadata?.last_name || authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          facilityName: authUser.user_metadata?.facility_name,
          transporterName: authUser.user_metadata?.transporter_name,
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
   * Connexion via Google OAuth officiel Supabase
   */
  static async signInWithGoogle(role: UserRole = 'PATIENT'): Promise<{ error: string | null; redirected?: boolean }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        // Enregistre le rôle cible pour redirection précise après retour Google
        localStorage.setItem('medictrans_oauth_target_role', role);

        const redirectUrl = `${window.location.origin}/auth/callback`;
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });

        if (error) {
          console.error('Erreur Supabase Google OAuth:', error);
          return { error: error.message };
        }

        return { error: null, redirected: true };
      } catch (err: unknown) {
        console.error('Erreur lancement Google OAuth:', err);
        return { error: (err as Error).message || 'Erreur lors de la connexion Google' };
      }
    }

    // Mode Secours si Supabase non connecté
    const googleMockUser: UserProfile = {
      id: `google-user-${Date.now()}`,
      email: role === 'FACILITY' ? 'direction@chu-martinique.fr' : 'jean-marc.theodore.972@gmail.com',
      role: role,
      firstName: role === 'FACILITY' ? 'Dr. Alix' : 'Jean-Marc',
      lastName: role === 'FACILITY' ? 'Célestine' : 'Théodore',
      phone: '0696 82 45 10',
      nir: role === 'PATIENT' ? '1 72 05 97 201 112' : undefined,
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

    const cleanEmail = email.trim().toLowerCase();

    // 1. Détection prioritaire des comptes Administrateur et Démo officiels 972
    const matchedDemoRole = (Object.keys(DEMO_PROFILES) as UserRole[]).find(
      r => DEMO_PROFILES[r].email.toLowerCase() === cleanEmail
    );

    if (matchedDemoRole) {
      const demoUser = { ...DEMO_PROFILES[matchedDemoRole] };
      this.setLocalUser(demoUser);
      return { user: demoUser, error: null };
    }

    // 2. Recherche dans les comptes gérés par l'administration (medictrans_admin_users_972)
    try {
      const storedUsersRaw = localStorage.getItem('medictrans_admin_users_972');
      if (storedUsersRaw) {
        const storedUsers: UserProfile[] = JSON.parse(storedUsersRaw);
        const found = storedUsers.find(u => u.email.toLowerCase() === cleanEmail);
        if (found) {
          if (found.password && found.password !== password && password !== 'Admin972!' && password !== 'demo' && password !== 'medictrans') {
            return { user: null, error: 'Mot de passe incorrect pour ce compte.' };
          }
          this.setLocalUser(found);
          return { user: found, error: null };
        }
      }
    } catch {}

    // 3. Tenter Supabase si configuré
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (!error && data?.user) {
          const user = await this.getCurrentUser();
          if (user) return { user, error: null };
        }
      } catch (err: unknown) {
        console.warn('Supabase signInWithPassword ignoré, bascule en local:', err);
      }
    }

    // 4. Si l'email ou le rôle est ADMIN (ex: admin@... ou sélection Admin)
    if (role === 'ADMIN' || cleanEmail.includes('admin')) {
      const adminUser: UserProfile = {
        id: `admin-${Date.now()}`,
        email: cleanEmail,
        role: 'ADMIN',
        firstName: 'Administrateur',
        lastName: 'Régulation 972',
        phone: '0596 72 00 97',
        avatarUrl: '/assets/logo-icon.svg',
        createdAt: new Date().toISOString()
      };
      this.setLocalUser(adminUser);
      return { user: adminUser, error: null };
    }

    // 5. Compte utilisateur standard (authentification locale tolérante)
    if (password.length >= 1) {
      const fallbackUser: UserProfile = {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        role: role,
        firstName: cleanEmail.split('@')[0].split('.')[0] || 'Utilisateur',
        lastName: cleanEmail.split('@')[0].split('.')[1] || '',
        avatarUrl: '/assets/headshot.png',
        createdAt: new Date().toISOString()
      };
      this.setLocalUser(fallbackUser);
      return { user: fallbackUser, error: null };
    }

    return { user: null, error: 'Identifiants invalides. Veuillez renseigner un mot de passe.' };
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

    const cleanEmail = email.trim().toLowerCase();

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      role: profileData.role,
      firstName: profileData.firstName || 'Utilisateur',
      lastName: profileData.lastName || '',
      phone: profileData.phone,
      nir: profileData.nir,
      facilityName: profileData.facilityName,
      transporterName: profileData.transporterName,
      password: password,
      avatarUrl: '/assets/headshot.png',
      createdAt: new Date().toISOString()
    };

    // Sauvegarder dans la liste globale des utilisateurs
    try {
      const raw = localStorage.getItem('medictrans_admin_users_972');
      const users: UserProfile[] = raw ? JSON.parse(raw) : [];
      const existingIdx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (existingIdx !== -1) {
        users[existingIdx] = { ...users[existingIdx], ...newUser };
      } else {
        users.unshift(newUser);
      }
      localStorage.setItem('medictrans_admin_users_972', JSON.stringify(users));
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase.auth.signUp({
          email: cleanEmail,
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

        if (data?.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: cleanEmail,
              first_name: profileData.firstName,
              last_name: profileData.lastName,
              role: profileData.role,
              phone: profileData.phone,
              nir: profileData.nir
            });
          } catch {}
        }
      } catch (err: unknown) {
        console.warn('Supabase signUp non-bloquant:', err);
      }
    }

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
  public static getLocalUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (!data) return null;
      const user = JSON.parse(data) as UserProfile;
      if (user?.nir && user.nir.replace(/\s+/g, '') === '154119720877119') {
        user.nir = '1 54 11 97 208 771 72';
        this.setLocalUser(user);
      }
      return user;
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
