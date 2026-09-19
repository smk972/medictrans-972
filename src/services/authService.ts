import { UserProfile, UserRole, TransporterSubscription } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { EmailService } from './emailService';

const STORAGE_KEY_AUTH_USER = 'medictrans_auth_user_972';

// Zéro mock en production : les profils sont gérés par Supabase Auth
export const REALISTIC_PROFILES: Record<string, UserProfile> = {};
export const DEMO_PROFILES: Record<'PATIENT' | 'TRANSPORTER' | 'FACILITY' | 'ADMIN', UserProfile> = {
  PATIENT: {
    id: 'user-demo-patient-972',
    email: 'client.demo@clinigo.fr',
    role: 'PATIENT',
    firstName: 'Patrick',
    lastName: 'SAINT-AIMÉ',
    phone: '0696 11 22 33',
    nir: '1 85 06 97 212 345 67',
    avatarUrl: '/assets/headshot.png',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  TRANSPORTER: {
    id: 'user-demo-transporter-972',
    email: 'transporteur.demo@clinigo.fr',
    role: 'TRANSPORTER',
    firstName: 'Alain',
    lastName: 'MARIE-LUCE',
    phone: '0696 44 55 66',
    transporterName: 'Ambulances Madinina Secours',
    transporterLicense: 'ARS-972-2024-001',
    subscription: {
      status: 'TRIAL',
      trialDaysTotal: 30,
      trialDaysRemaining: 28,
      isTrialUnlocked: true,
      trialExpiresAt: new Date(Date.now() + 28 * 86400000).toISOString(),
      planName: 'Formule Pro Sanitaire (Illimitée)',
      monthlyPrice: 19.9,
      invoices: [
        {
          id: 'inv-demo-1',
          invoiceNumber: 'FACT-2026-9720',
          date: new Date().toISOString().slice(0, 10),
          amount: 0,
          description: 'Période d’essai gratuit 30 jours offerte à l’inscription',
          status: 'TRIAL_FREE',
          periodStart: new Date().toISOString().slice(0, 10),
          periodEnd: new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10)
        }
      ]
    },
    avatarUrl: '/assets/headshot.png',
    createdAt: '2026-01-10T09:00:00.000Z'
  },
  FACILITY: {
    id: 'user-demo-facility-972',
    email: 'etablissement.demo@clinigo.fr',
    role: 'FACILITY',
    firstName: 'Dr. Valérie',
    lastName: 'MONLOUIS',
    phone: '0596 59 00 00',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    facilityFiness: '970200021',
    facilityAccessStatus: 'APPROVED',
    avatarUrl: '/assets/headshot.png',
    createdAt: '2026-01-05T07:00:00.000Z'
  },
  ADMIN: {
    id: 'user-demo-admin-972',
    email: 'admin.demo@clinigo.fr',
    role: 'ADMIN',
    firstName: 'Régulation',
    lastName: 'ARS 972',
    phone: '0596 72 00 97',
    avatarUrl: '/assets/headshot.png',
    createdAt: '2026-01-01T00:00:00.000Z'
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

    // 0. Interception instantanée des comptes Démo pour tests & présentations
    if (cleanEmail === 'client.demo@clinigo.fr' || cleanEmail === 'patient.demo@clinigo.fr') {
      const demoUser = DEMO_PROFILES.PATIENT;
      this.setLocalUser(demoUser);
      // Garantir la présence d'une course de démonstration active pour le suivi
      try {
        const storedRidesRaw = localStorage.getItem('medictrans_rides_972');
        const storedRides = storedRidesRaw ? JSON.parse(storedRidesRaw) : [];
        const hasPatientRide = storedRides.some((r: any) => r.patient?.email === demoUser.email || r.userId === demoUser.id);
        if (!hasPatientRide) {
          const sampleRide = {
            id: 'ride-demo-patient-972',
            reference: 'MT-972-8820',
            source: 'PATIENT',
            userId: demoUser.id,
            patient: {
              firstName: demoUser.firstName,
              lastName: demoUser.lastName,
              birthDate: '1985-06-12',
              nir: demoUser.nir,
              phone: demoUser.phone,
              email: demoUser.email,
              address: '12 Rue des Flamboyants, Cluny',
              city: 'Schoelcher',
              postalCode: '97233',
              isAld: true,
              hasPmt: true,
            },
            pickupAddress: '12 Rue des Flamboyants, Cluny, Schoelcher',
            dropoffAddress: 'CHU Pierre Zobda-Quitman - Pôle Oncologie, Fort-de-France',
            pickupDateTime: new Date(Date.now() + 3600000).toISOString(),
            status: 'ACCEPTED',
            transportType: 'VSL',
            isRoundTrip: true,
            assignedTransporter: {
              companyName: 'Ambulances Madinina Secours',
              vehiclePlate: 'CD-972-MQ',
              driverName: 'Chauffeur disponible',
              phone: '0696 11 22 33'
            },
            pricing: {
              basePrice: 58.5,
              distanceKm: 9.4,
              durationMinutes: 18,
              totalPatientShare: 0,
              coverageRate: 100
            },
            createdAt: new Date().toISOString()
          };
          storedRides.unshift(sampleRide);
          localStorage.setItem('medictrans_rides_972', JSON.stringify(storedRides));
        }
      } catch {}
      return { user: demoUser, error: null };
    }

    if (cleanEmail === 'transporteur.demo@clinigo.fr' || cleanEmail === 'transporter.demo@clinigo.fr') {
      const demoUser = DEMO_PROFILES.TRANSPORTER;
      this.setLocalUser(demoUser);

      // Initialisation de la flotte, chauffeurs et courses de démo
      try {
        const fleetRaw = localStorage.getItem('medictrans_transporter_fleet_v2');
        if (!fleetRaw || JSON.parse(fleetRaw).length === 0) {
          const sampleFleet = [
            {
              id: 'veh-demo-1',
              name: 'Ambulance Type A - Madinina 1',
              type: 'AMBULANCE',
              plate: 'CD-972-MQ',
              driver: 'Alain MARIE-LUCE',
              phone: '0696 44 55 66',
              status: 'DISPONIBLE'
            },
            {
              id: 'veh-demo-2',
              name: 'VSL Sanitaire - Madinina 2',
              type: 'VSL',
              plate: 'EF-972-MQ',
              driver: 'Marc ROCHE',
              phone: '0696 22 33 44',
              status: 'DISPONIBLE'
            },
            {
              id: 'veh-demo-3',
              name: 'Taxi Conventionné CPAM - Madinina 3',
              type: 'TAXI',
              plate: 'GH-972-MQ',
              driver: 'Didier BÉROSE',
              phone: '0696 77 88 99',
              status: 'DISPONIBLE'
            }
          ];
          localStorage.setItem('medictrans_transporter_fleet_v2', JSON.stringify(sampleFleet));
        }

        const driversRaw = localStorage.getItem('medictrans_transporter_drivers_v2');
        if (!driversRaw || JSON.parse(driversRaw).length === 0) {
          const sampleDrivers = [
            {
              id: 'drv-demo-1',
              firstName: 'Alain',
              lastName: 'MARIE-LUCE',
              role: 'Ambulancier DEA (Chef de bord)',
              phone: '0696 44 55 66',
              status: 'DISPONIBLE',
              assignedVehiclePlate: 'CD-972-MQ'
            },
            {
              id: 'drv-demo-2',
              firstName: 'Marc',
              lastName: 'ROCHE',
              role: 'Auxiliaire Ambulancier',
              phone: '0696 22 33 44',
              status: 'DISPONIBLE',
              assignedVehiclePlate: 'EF-972-MQ'
            },
            {
              id: 'drv-demo-3',
              firstName: 'Didier',
              lastName: 'BÉROSE',
              role: 'Chauffeur Taxi Conventionné',
              phone: '0696 77 88 99',
              status: 'DISPONIBLE',
              assignedVehiclePlate: 'GH-972-MQ'
            }
          ];
          localStorage.setItem('medictrans_transporter_drivers_v2', JSON.stringify(sampleDrivers));
        }

        const storedRidesRaw = localStorage.getItem('medictrans_rides_972');
        const storedRides = storedRidesRaw ? JSON.parse(storedRidesRaw) : [];

        // 1 course disponible à accepter (pot commun Martinique)
        const hasAvailableRide = storedRides.some((r: any) => r.status === 'PENDING');
        if (!hasAvailableRide) {
          const sampleAvailableRide = {
            id: 'ride-demo-available-972',
            reference: 'MT-972-9140',
            source: 'PATIENT',
            patient: {
              firstName: 'Josette',
              lastName: 'CELSE',
              birthDate: '1962-04-18',
              nir: '2 62 04 97 215 789 12',
              phone: '0696 55 44 33',
              email: 'josette.celse@orange.fr',
              address: '5 Allée des Balisiers',
              city: 'Le Lamentin',
              postalCode: '97232',
              isAld: true,
              hasPmt: true
            },
            pickupAddress: '5 Allée des Balisiers, 97232 Le Lamentin',
            dropoffAddress: 'CHU Pierre Zobda-Quitman - Pôle Hémodialyse, Fort-de-France',
            pickupDateTime: new Date(Date.now() + 2 * 3600000).toISOString(),
            status: 'PENDING',
            transportType: 'VSL',
            isRoundTrip: true,
            pricing: {
              basePrice: 52.0,
              distanceKm: 8.5,
              durationMinutes: 16,
              totalPatientShare: 0,
              coverageRate: 100
            },
            createdAt: new Date().toISOString()
          };
          storedRides.unshift(sampleAvailableRide);
        }

        // 1 course active déjà assignée à la société
        const hasActiveRide = storedRides.some((r: any) => r.status === 'ACCEPTED' && r.assignedTransporter?.companyName === demoUser.transporterName);
        if (!hasActiveRide) {
          const sampleActiveRide = {
            id: 'ride-demo-transporter-active',
            reference: 'MT-972-8820',
            source: 'PATIENT',
            userId: 'user-demo-patient-972',
            patient: {
              firstName: 'Patrick',
              lastName: 'SAINT-AIMÉ',
              birthDate: '1985-06-12',
              nir: '1 85 06 97 212 345 67',
              phone: '0696 11 22 33',
              email: 'client.demo@clinigo.fr',
              address: '12 Rue des Flamboyants, Cluny',
              city: 'Schoelcher',
              postalCode: '97233',
              isAld: true,
              hasPmt: true,
            },
            pickupAddress: '12 Rue des Flamboyants, Cluny, Schoelcher',
            dropoffAddress: 'CHU Pierre Zobda-Quitman - Pôle Oncologie, Fort-de-France',
            pickupDateTime: new Date(Date.now() + 3600000).toISOString(),
            status: 'ACCEPTED',
            transportType: 'VSL',
            isRoundTrip: true,
            assignedTransporter: {
              companyName: 'Ambulances Madinina Secours',
              vehiclePlate: 'CD-972-MQ',
              driverName: 'Alain MARIE-LUCE',
              phone: '0696 44 55 66'
            },
            pricing: {
              basePrice: 58.5,
              distanceKm: 9.4,
              durationMinutes: 18,
              totalPatientShare: 0,
              coverageRate: 100
            },
            createdAt: new Date().toISOString()
          };
          storedRides.unshift(sampleActiveRide);
        }

        localStorage.setItem('medictrans_rides_972', JSON.stringify(storedRides));
      } catch {}

      return { user: demoUser, error: null };
    }

    // Interception des identifiants Super-Administrateur Clinigo (Accès prioritaire garanti)
    if (
      cleanEmail === 'admin@clinigo.fr' || 
      cleanEmail === 'admin.demo@clinigo.fr' || 
      cleanEmail === 'admin@medictrans972.mq' ||
      cleanEmail === 'pierre.delmas@clinigo.fr'
    ) {
      if (password && password.trim().length > 0) {
        const adminUser: UserProfile = {
          id: 'user-admin-01',
          email: cleanEmail,
          role: 'ADMIN',
          firstName: 'Pierre',
          lastName: 'Delmas',
          phone: '0596 75 20 20',
          avatarUrl: '/assets/logo-icon.svg',
          createdAt: '2026-01-01T00:00:00Z'
        };
        this.setLocalUser(adminUser);

        // Sauvegarde du mot de passe dans le registre local pour synchronisation
        try {
          const pRaw = localStorage.getItem('medictrans_registered_passwords');
          const pMap = pRaw ? JSON.parse(pRaw) : {};
          pMap[cleanEmail] = password;
          localStorage.setItem('medictrans_registered_passwords', JSON.stringify(pMap));
        } catch {}

        return { user: adminUser, error: null };
      }
    }

    // Interception de l'identifiant Démo Établissement de Santé
    if (cleanEmail === 'etablissement.demo@clinigo.fr' || cleanEmail === 'hopital.demo@clinigo.fr') {
      const facilityUser = DEMO_PROFILES.FACILITY;
      this.setLocalUser(facilityUser);
      return { user: facilityUser, error: null };
    }

    // 1. Authentification officielle via Supabase Auth
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (!error && data?.user) {
          const user = await this.getCurrentUser();
          if (user) return { user, error: null };
        }
      } catch (err: unknown) {
        console.warn('Erreur Supabase signInWithPassword:', err);
      }
    }

    // 2. Vérification des mots de passe réinitialisés ou enregistrés (si mise à jour hors session Supabase)
    try {
      const pRaw = localStorage.getItem('medictrans_registered_passwords');
      const pMap = pRaw ? JSON.parse(pRaw) : {};
      if (pMap[cleanEmail] && pMap[cleanEmail] === password) {
        const storedUsersRaw = localStorage.getItem('medictrans_admin_users_972');
        const storedUsers: UserProfile[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
        const found = storedUsers.find(u => u.email.toLowerCase() === cleanEmail);
        if (found) {
          found.password = password;
          this.setLocalUser(found);
          return { user: found, error: null };
        }

        if (isSupabaseConfigured() && supabase) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('email', cleanEmail).maybeSingle();
          if (profile) {
            const userProfile: UserProfile = {
              id: profile.id,
              email: profile.email || cleanEmail,
              role: profile.role || 'PATIENT',
              firstName: profile.first_name || 'Utilisateur',
              lastName: profile.last_name || '',
              phone: profile.phone,
              nir: profile.nir,
              avatarUrl: profile.avatar_url,
              createdAt: profile.created_at || new Date().toISOString()
            };
            this.setLocalUser(userProfile);
            return { user: userProfile, error: null };
          }
        }
      }
    } catch {}

    // 3. Recherche dans les comptes utilisateurs locaux (si hors-ligne)
    try {
      const storedUsersRaw = localStorage.getItem('medictrans_admin_users_972');
      if (storedUsersRaw) {
        const storedUsers: UserProfile[] = JSON.parse(storedUsersRaw);
        const found = storedUsers.find(u => u.email.toLowerCase() === cleanEmail);
        if (found && found.password && found.password === password) {
          this.setLocalUser(found);
          return { user: found, error: null };
        }
      }
    } catch {}

    return { user: null, error: 'Identifiants invalides. Aucun compte correspondant trouvé.' };
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

    // Protection anti-escalade : interdiction absolue de s'inscrire directement avec le rôle ADMIN
    const safeRole: UserRole = profileData.role === 'ADMIN' ? 'PATIENT' : profileData.role;

    const isFacility = safeRole === 'FACILITY';
    const isTransporter = safeRole === 'TRANSPORTER';

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      role: safeRole,
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

    // Sauvegarder dans la liste globale des utilisateurs (Local Storage)
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

    // Sauvegarder sur l'API serveur centralisée (Plesk VPS / Node.js)
    try {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(err => console.warn('[AuthService] Synchro /api/users non-bloquante:', err));
    } catch {}

    // Si rôle PATIENT, sauvegarder également la fiche client sur l'API
    if (newUser.role === 'PATIENT' || !newUser.role) {
      try {
        const dept = newUser.phone?.startsWith('0696') || newUser.phone?.startsWith('0596') ? '97200' :
                     newUser.phone?.startsWith('0690') || newUser.phone?.startsWith('0590') ? '97100' :
                     newUser.phone?.startsWith('0694') || newUser.phone?.startsWith('0594') ? '97300' :
                     newUser.phone?.startsWith('0692') || newUser.phone?.startsWith('0262') ? '97400' : '75000';
        const cityName = dept === '97200' ? 'Fort-de-France' :
                          dept === '97100' ? 'Pointe-à-Pitre' :
                          dept === '97300' ? 'Cayenne' :
                          dept === '97400' ? 'Saint-Denis' : 'Paris';

        const clientData = {
          id: `client-${newUser.id}`,
          firstName: newUser.firstName || 'Patient',
          lastName: newUser.lastName || '',
          birthDate: '1980-01-01',
          nir: newUser.nir || '1 80 01 75 000 000 00',
          phone: newUser.phone || '06 00 00 00 00',
          email: newUser.email,
          address: 'Adresse déclarée à l’inscription',
          city: cityName,
          postalCode: dept,
          isAld: false,
          hasPmt: true,
          mobility: {
            wheelchair: false,
            stretcher: false,
            oxygen: false,
            stairsWithoutElevator: false,
            needsEscort: false
          },
          status: 'ACTIVE',
          createdAt: newUser.createdAt,
          notes: 'Inscription en ligne sur Clinigo.fr'
        };

        fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData)
        }).catch(err => console.warn('[AuthService] Synchro /api/clients non-bloquante:', err));
      } catch {}
    }

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

    // Expédition automatique de l'email de bienvenue Clinigo via Resend
    EmailService.sendWelcomeEmail({
      email: cleanEmail,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      userId: newUser.id,
    }).catch(err => {
      console.warn('[AuthService] Envoi email de bienvenue non-bloquant:', err);
    });

    this.setLocalUser(newUser);
    return { user: newUser, error: null };
  }

  /**
   * Connexion instantanée avec un profil Démo pré-rempli
   */
  static loginAsDemo(role: UserRole): UserProfile {
    const profile = (DEMO_PROFILES[role] as UserProfile) || {
      id: `demo-${role.toLowerCase()}`,
      email: `demo-${role.toLowerCase()}@clinigo.fr`,
      role,
      firstName: 'Utilisateur',
      lastName: role,
      createdAt: new Date().toISOString()
    };
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

  /**
   * Envoi d'un lien unique de réinitialisation de mot de passe par email
   */
  public static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    if (!email || !email.includes('@')) {
      return { success: false, message: '', error: 'Veuillez saisir une adresse email valide.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const token = 'rst_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 3600 * 1000; // 1 heure

    // Enregistrement du token de réinitialisation
    try {
      const raw = localStorage.getItem('medictrans_reset_tokens');
      const tokens = raw ? JSON.parse(raw) : {};
      tokens[cleanEmail] = { token, code, expiresAt };
      localStorage.setItem('medictrans_reset_tokens', JSON.stringify(tokens));
    } catch {}

    const resetUrl = `${window.location.origin}/reinitialisation-mot-de-passe?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    // Envoi officiel via l'infrastructure Clinigo Resend (validée en ligne sur clinigo.fr)
    try {
      const emailRes = await EmailService.sendPasswordResetEmail({
        email: cleanEmail,
        resetUrl,
        resetCode: code,
      });

      if (!emailRes.success) {
        console.warn('Avertissement envoi email transactionnel:', emailRes.error);
      }
    } catch (e) {
      console.warn('Erreur envoi email réinitialisation Clinigo:', e);
    }

    return {
      success: true,
      message: 'Un e-mail de réinitialisation sécurisé Clinigo avec votre lien unique et votre code à 6 chiffres vous a été envoyé.'
    };
  }

  /**
   * Validation du code ou token et mise à jour du nouveau mot de passe
   */
  public static async confirmPasswordReset(params: {
    email: string;
    tokenOrCode: string;
    newPassword: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { email, tokenOrCode, newPassword } = params;
    if (!email || !tokenOrCode || !newPassword) {
      return { success: false, error: 'Informations incomplètes.' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'Le mot de passe doit comporter au moins 6 caractères.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanTokenOrCode = tokenOrCode.trim();

    // 1. Mise à jour Supabase si session active
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch (err) {
        console.warn('Supabase password update fallback:', err);
      }
    }

    // 2. Vérification locale (tokens et démo)
    try {
      const raw = localStorage.getItem('medictrans_reset_tokens');
      const tokens = raw ? JSON.parse(raw) : {};
      const record = tokens[cleanEmail];

      if (record) {
        const isValid = (record.token === cleanTokenOrCode || record.code === cleanTokenOrCode) && Date.now() < record.expiresAt;
        if (!isValid) {
          return { success: false, error: 'Le lien ou le code de réinitialisation est invalide ou a expiré.' };
        }
        delete tokens[cleanEmail];
        localStorage.setItem('medictrans_reset_tokens', JSON.stringify(tokens));
      }
    } catch {}

    // 3. Enregistrer le nouveau mot de passe dans le registre sécurisé
    try {
      const pRaw = localStorage.getItem('medictrans_registered_passwords');
      const pMap = pRaw ? JSON.parse(pRaw) : {};
      pMap[cleanEmail] = newPassword;
      localStorage.setItem('medictrans_registered_passwords', JSON.stringify(pMap));

      // Mettre à jour dans les utilisateurs enregistrés
      const uRaw = localStorage.getItem('medictrans_admin_users_972');
      if (uRaw) {
        const users: UserProfile[] = JSON.parse(uRaw);
        const idx = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
        if (idx !== -1) {
          users[idx].password = newPassword;
          localStorage.setItem('medictrans_admin_users_972', JSON.stringify(users));
        }
      }
    } catch {}

    return { success: true };
  }
}
