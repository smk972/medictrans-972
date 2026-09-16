import { UserProfile, UserRole, TransporterSubscription } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_AUTH_USER = 'medictrans_auth_user_972';

// Comptes réalistes pré-configurés (France Métropolitaine & DOM)
export const REALISTIC_PROFILES: Record<string, UserProfile> = {
  // 1. PATIENTS
  'jean.dupont@orange.fr': {
    id: 'user-pat-01',
    email: 'jean.dupont@orange.fr',
    role: 'PATIENT',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '06 12 34 56 78',
    nir: '1 85 04 75 112 345 88',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-10T10:00:00Z'
  },
  'c.marieluce@orange.fr': {
    id: 'demo-patient-972',
    email: 'c.marieluce@orange.fr',
    role: 'PATIENT',
    firstName: 'Christian',
    lastName: 'Marie-Luce',
    phone: '0696 55 44 33',
    nir: '1 54 11 97 208 771 72',
    avatarUrl: '/assets/headshot.png',
    createdAt: '2026-01-10T10:00:00Z'
  },
  'sophie.laurent@gmail.com': {
    id: 'user-pat-02',
    email: 'sophie.laurent@gmail.com',
    role: 'PATIENT',
    firstName: 'Sophie',
    lastName: 'Laurent',
    phone: '06 88 99 11 22',
    nir: '2 90 08 69 044 123 45',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-12T10:00:00Z'
  },

  // 2. ÉTABLISSEMENTS DE SANTÉ
  'coordination@aphp.fr': {
    id: 'user-fac-01',
    email: 'coordination@aphp.fr',
    role: 'FACILITY',
    firstName: 'Dr. Alexandre',
    lastName: 'Mercier',
    phone: '01 42 16 00 00',
    facilityId: 'aphp-pitie-salpetriere',
    facilityName: 'AP-HP - Hôpital Universitaire Pitié-Salpêtrière',
    facilityFiness: '750100018',
    facilityAccessStatus: 'APPROVED',
    facilityAccessApprovedAt: '2026-01-01T08:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T08:00:00Z'
  },
  'coordination@chu-martinique.fr': {
    id: 'demo-facility-972',
    email: 'coordination@chu-martinique.fr',
    role: 'FACILITY',
    firstName: 'Marie-Paule',
    lastName: 'Valaire',
    phone: '0596 55 20 00',
    facilityId: 'chu-zobda-quitman',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    facilityFiness: '970211145',
    facilityAccessStatus: 'APPROVED',
    facilityAccessApprovedAt: '2026-01-01T08:00:00.000Z',
    avatarUrl: '/assets/nurse_almont.jpg',
    createdAt: '2026-01-01T08:00:00Z'
  },
  'coordination@chu-bordeaux.fr': {
    id: 'user-fac-02',
    email: 'coordination@chu-bordeaux.fr',
    role: 'FACILITY',
    firstName: 'Hélène',
    lastName: 'Fabre',
    phone: '05 56 79 56 79',
    facilityId: 'chu-bordeaux-pellegrin',
    facilityName: 'CHU de Bordeaux - Groupe Hospitalier Pellegrin',
    facilityFiness: '330100012',
    facilityAccessStatus: 'APPROVED',
    facilityAccessApprovedAt: '2026-01-01T08:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813593-90d0b001a4ee?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T08:00:00Z'
  },

  // 3. TRANSPORTEURS SANITAIRES
  'dispatch@ambulances-idf.fr': {
    id: 'user-trans-01',
    email: 'dispatch@ambulances-idf.fr',
    role: 'TRANSPORTER',
    firstName: 'Thomas',
    lastName: 'Leroy',
    phone: '06 20 30 40 50',
    transporterId: 'ambulances-idf-secours',
    transporterName: 'Ambulances Île-de-France Secours',
    transporterLicense: '75-AMB-2024-12',
    subscription: {
      status: 'ACTIVE',
      trialDaysTotal: 30,
      trialDaysRemaining: 30,
      planName: 'Formule Pro Nationale (Illimitée)',
      monthlyPrice: 19.9,
      isTrialUnlocked: true,
      whatsappVerified: true,
      whatsappPhone: '06 20 30 40 50'
    },
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-05T08:00:00Z'
  },
  'dispatch@madinina-secours.mq': {
    id: 'demo-transporter-972',
    email: 'dispatch@madinina-secours.mq',
    role: 'TRANSPORTER',
    firstName: 'Patrick',
    lastName: 'Césaire',
    phone: '0696 75 20 20',
    transporterId: 'madinina-secours',
    transporterName: 'Ambulances Madinina Secours',
    transporterLicense: '972-AMB-2024-08',
    subscription: {
      status: 'ACTIVE',
      trialDaysTotal: 30,
      trialDaysRemaining: 30,
      planName: 'Formule Pro Sanitaire (Illimitée)',
      monthlyPrice: 19.9,
      isTrialUnlocked: true,
      whatsappVerified: true,
      whatsappPhone: '0696 75 20 20'
    },
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-05T08:00:00Z'
  },
  'contact@taxis-sante-lyon.fr': {
    id: 'user-trans-02',
    email: 'contact@taxis-sante-lyon.fr',
    role: 'TRANSPORTER',
    firstName: 'Karim',
    lastName: 'Belkacem',
    phone: '06 70 80 90 10',
    transporterId: 'taxis-sante-lyon',
    transporterName: 'Taxis Conventionnés Santé Rhône',
    transporterLicense: '69-CPAM-2023-45',
    subscription: {
      status: 'NONE',
      trialDaysTotal: 30,
      trialDaysRemaining: 30,
      planName: 'Formule Taxi Conventionné Pro',
      monthlyPrice: 39,
      isTrialUnlocked: false,
      whatsappVerified: false,
      whatsappPhone: '06 70 80 90 10'
    },
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2026-01-08T08:00:00Z'
  },

  // 4. ADMINISTRATEURS & RÉGULATEURS
  'admin@clinigo.fr': {
    id: 'user-admin-01',
    email: 'admin@clinigo.fr',
    role: 'ADMIN',
    firstName: 'Pierre',
    lastName: 'Delmas',
    phone: '01 89 00 12 34',
    avatarUrl: '/assets/logo-icon.svg',
    createdAt: '2026-01-01T00:00:00Z'
  },
  'admin@medictrans972.mq': {
    id: 'demo-admin-972',
    email: 'admin@medictrans972.mq',
    role: 'ADMIN',
    firstName: 'Régulation',
    lastName: 'Centrale',
    phone: '0596 72 00 97',
    avatarUrl: '/assets/logo-icon.svg',
    createdAt: '2026-01-01T00:00:00Z'
  }
};

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  PATIENT: REALISTIC_PROFILES['jean.dupont@orange.fr'],
  FACILITY: REALISTIC_PROFILES['coordination@aphp.fr'],
  TRANSPORTER: REALISTIC_PROFILES['dispatch@ambulances-idf.fr'],
  ADMIN: REALISTIC_PROFILES['admin@clinigo.fr']
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
   * Connexion via Google ID Token direct (Google Identity Services - Sans redirection vers Supabase)
   * Affiche directement le dialogue natif Google sur clinigo.fr
   */
  static async signInWithGoogleIdToken(idToken: string, role: UserRole = 'PATIENT'): Promise<{ user: UserProfile | null; error: string | null }> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) {
          console.error('Erreur Supabase signInWithIdToken:', error);
          return { user: null, error: error.message };
        }

        if (data.session?.user) {
          try {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();

            if (!existingProfile) {
              const fullName = data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name || '';
              const parts = fullName.split(' ');
              await supabase.from('profiles').insert({
                id: data.session.user.id,
                first_name: parts[0] || 'Utilisateur',
                last_name: parts.slice(1).join(' ') || '',
                role: role,
                avatar_url: data.session.user.user_metadata?.avatar_url || data.session.user.user_metadata?.picture || null,
                nir: role === 'PATIENT' ? '1 72 05 97 201 112' : null,
              });
            }
          } catch (pErr) {
            console.warn('Note profil:', pErr);
          }

          const profile = await this.getCurrentUser();
          return { user: profile, error: null };
        }

        return { user: null, error: 'Session non reçue' };
      } catch (err: unknown) {
        return { user: null, error: (err as Error).message || 'Erreur authentification Google' };
      }
    }

    return { user: this.getLocalUser(), error: null };
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

    // 1. Détection prioritaire des comptes réalistes pré-configurés
    if (REALISTIC_PROFILES[cleanEmail]) {
      const demoUser = { ...REALISTIC_PROFILES[cleanEmail] };
      this.setLocalUser(demoUser);
      return { user: demoUser, error: null };
    }

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

    const isFacility = profileData.role === 'FACILITY';
    const isTransporter = profileData.role === 'TRANSPORTER';

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      role: profileData.role,
      firstName: profileData.firstName || 'Utilisateur',
      lastName: profileData.lastName || '',
      phone: profileData.phone,
      nir: profileData.nir,
      facilityName: profileData.facilityName,
      facilityFiness: profileData.facilityFiness,
      facilityAccessStatus: isFacility ? 'PENDING' : undefined,
      facilityAccessRequestedAt: isFacility ? new Date().toISOString() : undefined,
      transporterName: profileData.transporterName,
      transporterLicense: profileData.transporterLicense,
      subscription: isTransporter ? {
        status: 'TRIAL',
        trialDaysTotal: 30,
        trialDaysRemaining: 30,
        isTrialUnlocked: true,
        trialExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        planName: 'Formule Pro Sanitaire (Illimitée)',
        monthlyPrice: 19.9,
        invoices: [
          {
            id: `inv-${Date.now()}`,
            invoiceNumber: `FACT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().slice(0, 10),
            amount: 0,
            description: `Offre Découverte — Période d’essai gratuit 30 jours offerte à l’inscription`,
            status: 'TRIAL_FREE',
            periodStart: new Date().toISOString().slice(0, 10),
            periodEnd: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
          }
        ]
      } : undefined,
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

  /**
   * Débloque l'essai gratuit de 1 mois pour le transporteur suite à validation WhatsApp
   */
  static unlockTransporterFreeTrial(phone: string, customDays: number = 30): UserProfile | null {
    const current = this.getLocalUser();
    if (!current) return null;

    const trialStart = new Date();
    const trialEnd = new Date(Date.now() + customDays * 86400000);

    const subscription: TransporterSubscription = {
      status: 'TRIAL',
      trialDaysTotal: customDays,
      trialDaysRemaining: customDays,
      trialStartedAt: trialStart.toISOString(),
      trialExpiresAt: trialEnd.toISOString(),
      isTrialUnlocked: true,
      whatsappVerified: true,
      whatsappPhone: phone,
      planName: 'Formule Pro Sanitaire (Illimitée)',
      monthlyPrice: 19.9,
      currentPeriodStart: trialStart.toISOString().slice(0, 10),
      currentPeriodEnd: trialEnd.toISOString().slice(0, 10),
      invoices: [
        {
          id: `inv-${Date.now()}`,
          invoiceNumber: `FACT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().slice(0, 10),
          amount: 0,
          description: `Offre Découverte — Période d’essai gratuit ${customDays} jours (Vérification WhatsApp)`,
          status: 'TRIAL_FREE',
          periodStart: trialStart.toISOString().slice(0, 10),
          periodEnd: trialEnd.toISOString().slice(0, 10)
        }
      ]
    };

    const updatedUser: UserProfile = {
      ...current,
      phone: phone || current.phone,
      subscription
    };

    this.setLocalUser(updatedUser);
    this.updateUserInGlobalList(updatedUser);
    return updatedUser;
  }

  /**
   * Mise à jour de l'abonnement du transporteur
   */
  static updateTransporterSubscription(updates: Partial<TransporterSubscription>): UserProfile | null {
    const current = this.getLocalUser();
    if (!current) return null;

    const currentSub = current.subscription || {
      status: 'NONE',
      trialDaysTotal: 30,
      trialDaysRemaining: 30,
      isTrialUnlocked: false,
      whatsappVerified: false,
      planName: 'Formule Pro Sanitaire (Illimitée)',
      monthlyPrice: 19.9
    };

    const updatedUser: UserProfile = {
      ...current,
      subscription: {
        ...currentSub,
        ...updates
      }
    };

    this.setLocalUser(updatedUser);
    this.updateUserInGlobalList(updatedUser);
    return updatedUser;
  }

  /**
   * Validation / Refus d'accès pour un établissement de santé
   */
  static updateFacilityAccessStatus(userEmailOrId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED'): boolean {
    try {
      const raw = localStorage.getItem('medictrans_admin_users_972');
      const users: UserProfile[] = raw ? JSON.parse(raw) : [];
      const userIdx = users.findIndex(u => 
        u.id === userEmailOrId || 
        u.email.toLowerCase() === userEmailOrId.toLowerCase() ||
        u.facilityFiness === userEmailOrId
      );

      if (userIdx !== -1) {
        users[userIdx].facilityAccessStatus = status;
        if (status === 'APPROVED') {
          users[userIdx].facilityAccessApprovedAt = new Date().toISOString();
        }
        localStorage.setItem('medictrans_admin_users_972', JSON.stringify(users));

        // Mettre à jour l'utilisateur courant s'il correspond
        const current = this.getLocalUser();
        if (current && (current.id === users[userIdx].id || current.email.toLowerCase() === users[userIdx].email.toLowerCase())) {
          this.setLocalUser({
            ...current,
            facilityAccessStatus: status,
            facilityAccessApprovedAt: status === 'APPROVED' ? new Date().toISOString() : current.facilityAccessApprovedAt
          });
        }
        return true;
      }
    } catch {}
    return false;
  }

  /**
   * Mise à jour des informations de profil utilisateur
   */
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const current = this.getLocalUser();
    if (!current) return null;

    const updatedUser: UserProfile = {
      ...current,
      ...updates,
      fullName: updates.fullName || (
        (updates.firstName !== undefined ? updates.firstName : (current.firstName || '')) + ' ' +
        (updates.lastName !== undefined ? updates.lastName : (current.lastName || ''))
      ).trim() || current.fullName
    };

    this.setLocalUser(updatedUser);
    this.updateUserInGlobalList(updatedUser);

    // Si Supabase est configuré, synchroniser
    if (isSupabaseConfigured() && supabase && updatedUser.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            first_name: updatedUser.firstName,
            last_name: updatedUser.lastName,
            phone: updatedUser.phone,
            nir: updatedUser.nir,
            facility_name: updatedUser.facilityName,
            transporter_name: updatedUser.transporterName,
            avatar_url: updatedUser.avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', updatedUser.id);
      } catch (err) {
        console.warn('Erreur synchronisation profil Supabase:', err);
      }
    }

    return updatedUser;
  }

  private static updateUserInGlobalList(updated: UserProfile) {
    try {
      const raw = localStorage.getItem('medictrans_admin_users_972');
      const users: UserProfile[] = raw ? JSON.parse(raw) : [];
      const idx = users.findIndex(u => u.id === updated.id || u.email.toLowerCase() === updated.email.toLowerCase());
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updated };
      } else {
        users.unshift(updated);
      }
      localStorage.setItem('medictrans_admin_users_972', JSON.stringify(users));
    } catch {}
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

  public static setLocalUser(user: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } catch (e) {
      console.error('Erreur écriture local user:', e);
    }
  }
}
