import { ClientRecord, Facility, Transporter, UserProfile, UserRole, Ride, SystemSettings, AuditLog } from '../types';
import { rideService } from './rideService';
import { AuthService } from './authService';

const STORAGE_KEY_CLIENTS = 'medictrans_admin_clients_972';
const STORAGE_KEY_SETTINGS = 'medictrans_admin_settings_972';
const STORAGE_KEY_AUDIT_LOGS = 'medictrans_admin_audit_logs_972';
const STORAGE_KEY_USERS = 'medictrans_admin_users_972';
const STORAGE_KEY_AUTH_USER = 'medictrans_auth_user_972';

// Clients initiaux de référence en Martinique
const INITIAL_CLIENTS: ClientRecord[] = [
  {
    id: 'client-1',
    firstName: 'Christian',
    lastName: 'Marie-Luce',
    birthDate: '1954-11-03',
    nir: '1 54 11 97 208 771 72',
    phone: '0696 55 44 33',
    email: 'c.marieluce@orange.fr',
    address: 'Quartier Cap Est, Morne Calebasse',
    city: 'Le Marin',
    postalCode: '97290',
    isAld: true,
    aldReason: 'ALD 19 - Insuffisance Rénale Chronique Terminale (Hémodialyse)',
    hasPmt: true,
    pmtPrescriberDoctor: 'Dr. Sylvie Brival - Hôpital Trinité',
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Patient autonome pour la marche, surveillance post-séance de dialyse'
    },
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z',
    notes: 'Transport récurrent bi-hebdomadaire pour dialyse'
  },
  {
    id: 'client-2',
    firstName: 'Maryse',
    lastName: 'Brival',
    birthDate: '1968-09-27',
    nir: '2 68 09 97 205 119 46',
    phone: '0696 44 88 99',
    email: 'maryse.brival@gmail.com',
    address: 'Quartier Morne Pavillon, Route des Religieuses',
    city: 'Fort-de-France',
    postalCode: '97200',
    isAld: true,
    aldReason: 'ALD 30 - Affection cardiovasculaire grave (Post-opératoire)',
    hasPmt: true,
    pmtPrescriberDoctor: 'Dr. Joseph Rénier - Cardiologue CHU',
    mobility: {
      wheelchair: true,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: true,
      floorNumber: 2,
      needsEscort: true,
      notes: 'Fauteuil roulant pliant. Portage nécessaire au départ (2 étages sans ascenseur).'
    },
    status: 'ACTIVE',
    createdAt: '2026-02-10T10:30:00.000Z',
    notes: 'Prise en charge avec portage escaliers déclarée'
  },
  {
    id: 'client-3',
    firstName: 'Gérard',
    lastName: 'Théodore',
    birthDate: '1947-03-12',
    nir: '1 47 03 97 212 663 81',
    phone: '0696 23 88 77',
    email: 'gerard.theodore@wanadoo.fr',
    address: 'Lotissement Les Hauts de Tartane',
    city: 'La Trinité',
    postalCode: '97220',
    isAld: true,
    aldReason: 'ALD 4 - Diabète de type 1 sévère avec complications',
    hasPmt: true,
    pmtPrescriberDoctor: 'Dr. Alix Célestine - CHU Martinique',
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: true,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Brancardage impératif et oxygénothérapie 2L/min en cours de route'
    },
    status: 'ACTIVE',
    createdAt: '2026-03-01T09:15:00.000Z',
    notes: 'Prescription Ambulance Type B obligatoire'
  },
  {
    id: 'client-4',
    firstName: 'Éliane',
    lastName: 'Bernard',
    birthDate: '1956-07-22',
    nir: '2 56 07 97 214 382 69',
    phone: '0696 34 56 78',
    email: 'eliane.bernard972@gmail.com',
    address: 'Résidence Les Balisiers, Apt 24',
    city: 'Schœlcher',
    postalCode: '97233',
    isAld: true,
    aldReason: 'ALD 3 - Cardiopathie ischémique chronique',
    hasPmt: true,
    pmtPrescriberDoctor: 'Dr. Célestine - Service Cardiologie',
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Sortie post-angioplastie'
    },
    status: 'ACTIVE',
    createdAt: '2026-04-12T14:00:00.000Z',
    notes: 'Patient régulier consultation de cardiologie CHU'
  },
  {
    id: 'client-5',
    firstName: 'Victor',
    lastName: 'Marie-Luce',
    birthDate: '1982-12-05',
    nir: '1 82 12 97 201 445 28',
    phone: '0696 77 88 99',
    email: 'victor.mluce@outremer.mq',
    address: 'Rue de la République',
    city: 'Fort-de-France',
    postalCode: '97200',
    isAld: false,
    hasPmt: true,
    pmtPrescriberDoctor: 'Dr. Joseph Rénier',
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false
    },
    status: 'ACTIVE',
    createdAt: '2026-05-18T11:20:00.000Z',
    notes: 'Conventionné CPAM Régime Général 65%'
  }
];

// Paramètres par défaut de la plateforme
const DEFAULT_SETTINGS: SystemSettings = {
  bannerActive: true,
  bannerLevel: 'INFO',
  bannerText: 'Régulation Sanitaire 972 : Réseau actif en direct. Synchronisation continue avec la CPAM et le SAMU 972.',
  cancellationThresholdHours: 24,
  defaultDispatchRadiusKm: 25,
  cpamBaseForfaitAmbulance: 58.50,
  cpamBaseForfaitVsl: 32.20,
  cpamRatePerKm: 2.15,
  cpamNightSundaySurchargePercent: 25,
  lastUpdatedBy: 'admin@medictrans972.mq',
  lastUpdatedAt: new Date().toISOString()
};

// Journal d'audit initial
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    adminEmail: 'admin@medictrans972.mq',
    action: 'INITIALISATION_PLATEFORME',
    targetType: 'SETTINGS',
    details: 'Initialisation de la console de régulation et des barèmes CPAM Martinique.'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    adminEmail: 'admin@medictrans972.mq',
    action: 'VALIDATION_AGREMENT_ARS',
    targetType: 'TRANSPORTER',
    targetId: 'transporter-1',
    details: 'Contrôle annuel validé pour Ambulances Madinina Secours (Agrément 972-AMB-2021-04).'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    adminEmail: 'admin@medictrans972.mq',
    action: 'HABILITATION_CADRE',
    targetType: 'FACILITY',
    targetId: 'chu-zobda-quitman',
    details: 'Ajout et confirmation des accès coordinateur pour le CHU Pierre Zobda-Quitman.'
  }
];

export class AdminService {
  // =========================================================================
  // 1. GESTION DES FICHES CLIENTS / PATIENTS
  // =========================================================================
  static async getAllClients(): Promise<ClientRecord[]> {
    const raw = localStorage.getItem(STORAGE_KEY_CLIENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(INITIAL_CLIENTS));
      return INITIAL_CLIENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CLIENTS;
    }
  }

  static async getClientById(id: string): Promise<ClientRecord | null> {
    const clients = await this.getAllClients();
    return clients.find(c => c.id === id) || null;
  }

  static async createClient(data: Omit<ClientRecord, 'id' | 'createdAt' | 'status'>, adminEmail = 'admin@medictrans972.mq'): Promise<ClientRecord> {
    const clients = await this.getAllClients();
    const newClient: ClientRecord = {
      ...data,
      id: `client-${Date.now()}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    const updated = [newClient, ...clients];
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(updated));

    // Créer également le compte utilisateur correspondant si nécessaire
    await this.syncClientToUserAccount(newClient);

    await this.logAdminAction(
      'CREATION_CLIENT',
      'CLIENT',
      newClient.id,
      `Création de la fiche patient : ${newClient.firstName} ${newClient.lastName} (NIR: ${newClient.nir})`,
      adminEmail
    );

    return newClient;
  }

  static async updateClient(id: string, updates: Partial<ClientRecord>, adminEmail = 'admin@medictrans972.mq'): Promise<ClientRecord> {
    const clients = await this.getAllClients();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Client ${id} introuvable`);

    const updatedClient: ClientRecord = {
      ...clients[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    clients[index] = updatedClient;
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));

    await this.syncClientToUserAccount(updatedClient);

    await this.logAdminAction(
      'MODIFICATION_CLIENT',
      'CLIENT',
      id,
      `Mise à jour de la fiche patient : ${updatedClient.firstName} ${updatedClient.lastName}`,
      adminEmail
    );

    return updatedClient;
  }

  static async deleteClient(id: string, adminEmail = 'admin@medictrans972.mq'): Promise<boolean> {
    const clients = await this.getAllClients();
    const target = clients.find(c => c.id === id);
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(filtered));

    await this.logAdminAction(
      'SUPPRESSION_CLIENT',
      'CLIENT',
      id,
      `Suppression / archivage de la fiche patient : ${target?.firstName} ${target?.lastName}`,
      adminEmail
    );
    return true;
  }

  static async resetClientPassword(id: string, customPassword?: string, adminEmail = 'admin@medictrans972.mq'): Promise<{ password: string }> {
    const clients = await this.getAllClients();
    const client = clients.find(c => c.id === id);
    if (!client) throw new Error('Client introuvable');

    const generatedPass = customPassword || `MT972-${Math.random().toString(36).slice(-5).toUpperCase()}!`;
    client.password = generatedPass;
    client.temporaryPassword = generatedPass;
    client.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));

    // Synchroniser avec l'annuaire des utilisateurs
    await this.updateUserPasswordByEmail(client.email, generatedPass);

    await this.logAdminAction(
      'REINITIALISATION_MDP_CLIENT',
      'CLIENT',
      id,
      `Réinitialisation du mot de passe pour le patient ${client.firstName} ${client.lastName} (${client.email})`,
      adminEmail
    );

    return { password: generatedPass };
  }

  static async toggleClientStatus(id: string, adminEmail = 'admin@medictrans972.mq'): Promise<ClientRecord> {
    const clients = await this.getAllClients();
    const client = clients.find(c => c.id === id);
    if (!client) throw new Error('Client introuvable');

    client.status = client.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    client.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));

    await this.logAdminAction(
      'CHANGEMENT_STATUT_CLIENT',
      'CLIENT',
      id,
      `Statut du patient ${client.firstName} ${client.lastName} modifié en : ${client.status}`,
      adminEmail
    );

    return client;
  }

  static async getClientRides(client: ClientRecord): Promise<Ride[]> {
    const allRides = await rideService.getAllRides();
    const cleanNir = client.nir ? client.nir.replace(/\s/g, '') : '';
    const cleanPhone = client.phone ? client.phone.replace(/\s/g, '') : '';
    const clientEmail = client.email ? client.email.toLowerCase().trim() : '';
    const clientLastName = client.lastName ? client.lastName.toLowerCase().trim() : '';

    return allRides.filter(r => {
      const matchNir = r.patient?.nir && cleanNir && r.patient.nir.replace(/\s/g, '') === cleanNir;
      const matchEmail = r.patient?.email && clientEmail && r.patient.email.toLowerCase().trim() === clientEmail;
      const matchPhone = r.patient?.phone && cleanPhone && r.patient.phone.replace(/\s/g, '') === cleanPhone;
      const matchName = r.patient?.lastName && clientLastName && r.patient.lastName.toLowerCase().trim() === clientLastName;
      return matchNir || matchEmail || matchPhone || matchName;
    });
  }

  // =========================================================================
  // 2. GESTION DES FICHES ÉTABLISSEMENTS DE SANTÉ
  // =========================================================================
  static async getAllFacilities(): Promise<Facility[]> {
    return rideService.getAllFacilities();
  }

  static async createFacility(data: Omit<Facility, 'id'>, adminEmail = 'admin@medictrans972.mq'): Promise<Facility> {
    const facilities = await rideService.getAllFacilities();
    const id = `fac-${Date.now()}`;
    const created: Facility = { ...data, id };
    facilities.unshift(created);
    localStorage.setItem('medictrans_facilities_972', JSON.stringify(facilities));

    await this.logAdminAction(
      'CREATION_ETABLISSEMENT',
      'FACILITY',
      created.id,
      `Création de l'établissement : ${created.name} (${created.city} - FINESS: ${created.finess})`,
      adminEmail
    );
    return created;
  }

  static async updateFacility(id: string, updates: Partial<Facility>, adminEmail = 'admin@medictrans972.mq'): Promise<Facility> {
    const facilities = await rideService.getAllFacilities();
    const index = facilities.findIndex(f => f.id === id);
    if (index === -1) throw new Error('Établissement introuvable');

    const updatedFacility = { ...facilities[index], ...updates };
    facilities[index] = updatedFacility;
    localStorage.setItem('medictrans_facilities_972', JSON.stringify(facilities));

    await this.logAdminAction(
      'MODIFICATION_ETABLISSEMENT',
      'FACILITY',
      id,
      `Mise à jour de l'établissement : ${updatedFacility.name}`,
      adminEmail
    );

    return updatedFacility;
  }

  static async deleteFacility(id: string, adminEmail = 'admin@medictrans972.mq'): Promise<boolean> {
    const facilities = await rideService.getAllFacilities();
    const target = facilities.find(f => f.id === id);
    const filtered = facilities.filter(f => f.id !== id);
    localStorage.setItem('medictrans_facilities_972', JSON.stringify(filtered));

    await this.logAdminAction(
      'SUPPRESSION_ETABLISSEMENT',
      'FACILITY',
      id,
      `Suppression de l'établissement : ${target?.name}`,
      adminEmail
    );
    return true;
  }

  static async addFacilityDepartment(id: string, department: string, adminEmail = 'admin@medictrans972.mq'): Promise<Facility> {
    const facilities = await rideService.getAllFacilities();
    const facility = facilities.find(f => f.id === id);
    if (!facility) throw new Error('Établissement introuvable');

    if (!facility.departments.includes(department.trim())) {
      facility.departments.push(department.trim());
      localStorage.setItem('medictrans_facilities_972', JSON.stringify(facilities));
      await this.logAdminAction(
        'AJOUT_SERVICE_ETABLISSEMENT',
        'FACILITY',
        id,
        `Ajout du service "${department.trim()}" à l'établissement ${facility.name}`,
        adminEmail
      );
    }
    return facility;
  }

  static async removeFacilityDepartment(id: string, department: string, adminEmail = 'admin@medictrans972.mq'): Promise<Facility> {
    const facilities = await rideService.getAllFacilities();
    const facility = facilities.find(f => f.id === id);
    if (!facility) throw new Error('Établissement introuvable');

    facility.departments = facility.departments.filter(d => d !== department);
    localStorage.setItem('medictrans_facilities_972', JSON.stringify(facilities));

    await this.logAdminAction(
      'SUPPRESSION_SERVICE_ETABLISSEMENT',
      'FACILITY',
      id,
      `Retrait du service "${department}" de l'établissement ${facility.name}`,
      adminEmail
    );
    return facility;
  }

  static async resetFacilityPassword(id: string, customPassword?: string, adminEmail = 'admin@medictrans972.mq'): Promise<{ email: string; password: string }> {
    const facilities = await rideService.getAllFacilities();
    const facility = facilities.find(f => f.id === id);
    if (!facility) throw new Error('Établissement introuvable');

    const email = facility.contactEmail || `coordination@${facility.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.mq`;
    const password = customPassword || `CH972-${Math.random().toString(36).slice(-5).toUpperCase()}!`;

    await this.updateUserPasswordByEmail(email, password, 'FACILITY', facility.contactName, facility.name);

    await this.logAdminAction(
      'REINITIALISATION_MDP_ETABLISSEMENT',
      'FACILITY',
      id,
      `Nouveau mot de passe généré pour le cadre coordinateur de ${facility.name} (${email})`,
      adminEmail
    );

    return { email, password };
  }

  // =========================================================================
  // 3. GESTION DES FICHES TRANSPORTEURS CONVENTIONNÉS
  // =========================================================================
  static async getAllTransporters(): Promise<Transporter[]> {
    return rideService.getAllTransporters();
  }

  static async createTransporter(data: Omit<Transporter, 'id'>, adminEmail = 'admin@medictrans972.mq'): Promise<Transporter> {
    const transporters = await rideService.getAllTransporters();
    const id = `trans-${Date.now()}`;
    const created: Transporter = { ...data, id };
    transporters.unshift(created);
    localStorage.setItem('medictrans_transporters_972', JSON.stringify(transporters));

    await this.logAdminAction(
      'CREATION_TRANSPORTEUR',
      'TRANSPORTER',
      created.id,
      `Création de l'entreprise sanitaire : ${created.companyName} (SIRET: ${created.siret} - Agrément: ${created.arsLicense})`,
      adminEmail
    );
    return created;
  }

  static async updateTransporter(id: string, updates: Partial<Transporter>, adminEmail = 'admin@medictrans972.mq'): Promise<Transporter> {
    const transporters = await rideService.getAllTransporters();
    const index = transporters.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transporteur introuvable');

    const updatedTransporter = { ...transporters[index], ...updates };
    transporters[index] = updatedTransporter;
    localStorage.setItem('medictrans_transporters_972', JSON.stringify(transporters));

    await this.logAdminAction(
      'MODIFICATION_TRANSPORTEUR',
      'TRANSPORTER',
      id,
      `Mise à jour du transporteur : ${updatedTransporter.companyName}`,
      adminEmail
    );

    return updatedTransporter;
  }

  static async deleteTransporter(id: string, adminEmail = 'admin@medictrans972.mq'): Promise<boolean> {
    const transporters = await rideService.getAllTransporters();
    const target = transporters.find(t => t.id === id);
    const filtered = transporters.filter(t => t.id !== id);
    localStorage.setItem('medictrans_transporters_972', JSON.stringify(filtered));

    await this.logAdminAction(
      'SUPPRESSION_TRANSPORTEUR',
      'TRANSPORTER',
      id,
      `Suppression du transporteur : ${target?.companyName}`,
      adminEmail
    );
    return true;
  }

  static async toggleTransporterVerification(id: string, adminEmail = 'admin@medictrans972.mq'): Promise<Transporter> {
    const transporters = await rideService.getAllTransporters();
    const transporter = transporters.find(t => t.id === id);
    if (!transporter) throw new Error('Transporteur introuvable');

    const newStatus = !transporter.verified;
    transporter.verified = newStatus;
    localStorage.setItem('medictrans_transporters_972', JSON.stringify(transporters));

    await this.logAdminAction(
      newStatus ? 'VALIDATION_AGREMENT_ARS' : 'SUSPENSION_AGREMENT_ARS',
      'TRANSPORTER',
      id,
      `Agrément ARS pour ${transporter.companyName} : ${newStatus ? 'VALIDÉ ET ACTIF' : 'SUSPENDU'}`,
      adminEmail
    );

    return transporter;
  }

  static async resetTransporterPassword(id: string, customPassword?: string, adminEmail = 'admin@medictrans972.mq'): Promise<{ email: string; password: string }> {
    const transporters = await rideService.getAllTransporters();
    const transporter = transporters.find(t => t.id === id);
    if (!transporter) throw new Error('Transporteur introuvable');

    const email = transporter.email || `dispatch@${transporter.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.mq`;
    const password = customPassword || `AMB972-${Math.random().toString(36).slice(-5).toUpperCase()}!`;

    await this.updateUserPasswordByEmail(email, password, 'TRANSPORTER', transporter.companyName, undefined, transporter.companyName);

    await this.logAdminAction(
      'REINITIALISATION_MDP_TRANSPORTEUR',
      'TRANSPORTER',
      id,
      `Nouveau mot de passe dispatching pour ${transporter.companyName} (${email})`,
      adminEmail
    );

    return { email, password };
  }

  // =========================================================================
  // 4. GESTION CENTRALISÉE DES COMPTES ET DES MOTS DE PASSE
  // =========================================================================
  static async getAllUsers(): Promise<UserProfile[]> {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    let users: UserProfile[] = [];
    if (raw) {
      try { users = JSON.parse(raw); } catch { users = []; }
    }

    if (users.length === 0) {
      // Pré-charger les comptes de base
      users = [
        {
          id: 'usr-admin-1',
          email: 'admin@medictrans972.mq',
          role: 'ADMIN',
          firstName: 'Régulation',
          lastName: 'Centrale 972',
          phone: '0596 72 00 97',
          avatarUrl: '/assets/logo-icon.svg',
          createdAt: '2026-01-01T00:00:00.000Z'
        },
        {
          id: 'usr-facility-chu',
          email: 'coordination@chu-martinique.fr',
          role: 'FACILITY',
          firstName: 'Marie-Paule',
          lastName: 'Valaire',
          phone: '0596 55 20 00',
          facilityId: 'chu-zobda-quitman',
          facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
          facilityFiness: '970211145',
          facilityAccessStatus: 'APPROVED',
          facilityAccessApprovedAt: '2026-01-05T00:00:00.000Z',
          avatarUrl: '/assets/nurse_almont.jpg',
          createdAt: '2026-01-05T00:00:00.000Z'
        },
        {
          id: 'usr-facility-pending-1',
          email: 'direction@clinique-stpaul.mq',
          role: 'FACILITY',
          firstName: 'Dr. Jean-Marc',
          lastName: 'Sainte-Rose',
          phone: '0596 39 40 00',
          facilityName: 'Clinique Sainte-Marie - Pôle Oncologie',
          facilityFiness: '970200054',
          facilityAccessStatus: 'PENDING',
          facilityAccessRequestedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
          createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
        },
        {
          id: 'usr-transporter-madinina',
          email: 'dispatch@madinina-secours.mq',
          role: 'TRANSPORTER',
          firstName: 'Patrick',
          lastName: 'Césaire',
          phone: '0696 75 20 20',
          transporterId: 'madinina-secours',
          transporterName: 'Ambulances Madinina Secours',
          subscription: {
            status: 'TRIAL',
            trialDaysTotal: 30,
            trialDaysRemaining: 28,
            trialStartedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            trialExpiresAt: new Date(Date.now() + 28 * 86400000).toISOString(),
            isTrialUnlocked: true,
            whatsappVerified: true,
            whatsappPhone: '0696 75 20 20',
            planName: 'Formule Pro Sanitaire (Illimitée)',
            monthlyPrice: 19.9,
            currentPeriodStart: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
            currentPeriodEnd: new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10),
            invoices: [
              {
                id: 'inv-1',
                invoiceNumber: 'FACT-2026-0089',
                date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
                amount: 0,
                description: 'Période d’essai gratuit 30 jours (Vérification WhatsApp activée)',
                status: 'TRIAL_FREE',
                periodStart: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
                periodEnd: new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10)
              }
            ]
          },
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          createdAt: '2026-01-10T00:00:00.000Z'
        },
        {
          id: 'usr-patient-christian',
          email: 'c.marieluce@orange.fr',
          role: 'PATIENT',
          firstName: 'Christian',
          lastName: 'Marie-Luce',
          phone: '0696 55 44 33',
          nir: '1 54 11 97 208 771 72',
          avatarUrl: '/assets/headshot.png',
          createdAt: '2026-01-15T00:00:00.000Z'
        }
      ];
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }
    return users;
  }

  static async createUser(data: Partial<UserProfile> & { role: UserRole; password?: string }, adminEmail = 'admin@medictrans972.mq'): Promise<UserProfile> {
    const users = await this.getAllUsers();
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: data.email || `user-${Date.now()}@medictrans972.mq`,
      role: data.role,
      firstName: data.firstName || 'Utilisateur',
      lastName: data.lastName || 'Martinique',
      phone: data.phone || '0596 00 00 00',
      facilityName: data.facilityName,
      transporterName: data.transporterName,
      nir: data.nir,
      avatarUrl: data.avatarUrl || '/assets/headshot.png',
      createdAt: new Date().toISOString()
    };

    users.unshift(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    await this.logAdminAction(
      'CREATION_UTILISATEUR',
      'USER',
      newUser.id,
      `Création du compte [${newUser.role}] pour ${newUser.firstName} ${newUser.lastName} (${newUser.email})`,
      adminEmail
    );

    return newUser;
  }

  static async updateUser(id: string, updates: Partial<UserProfile>, adminEmail = 'admin@medictrans972.mq'): Promise<UserProfile> {
    const users = await this.getAllUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Utilisateur introuvable');

    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    await this.logAdminAction(
      'MODIFICATION_UTILISATEUR',
      'USER',
      id,
      `Mise à jour du profil utilisateur : ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.email})`,
      adminEmail
    );

    return updatedUser;
  }

  static async resetUserPassword(id: string, customPassword?: string, adminEmail = 'admin@medictrans972.mq'): Promise<{ email: string; password: string }> {
    const users = await this.getAllUsers();
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('Utilisateur introuvable');

    const newPass = customPassword || `SEC972-${Math.random().toString(36).slice(-5).toUpperCase()}!`;

    // Si l'utilisateur actuel connecté est celui-ci, mettre à jour la session
    const currentRaw = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (currentRaw) {
      try {
        const current = JSON.parse(currentRaw);
        if (current.id === user.id || current.email.toLowerCase() === user.email.toLowerCase()) {
          current.password = newPass;
          localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(current));
        }
      } catch {}
    }

    await this.logAdminAction(
      'REINITIALISATION_MDP_UTILISATEUR',
      'USER',
      id,
      `Mot de passe réinitialisé pour le compte [${user.role}] ${user.email}`,
      adminEmail
    );

    return { email: user.email, password: newPass };
  }

  static async deleteUser(id: string, adminEmail = 'admin@medictrans972.mq'): Promise<boolean> {
    const users = await this.getAllUsers();
    const target = users.find(u => u.id === id);
    if (target?.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length <= 1) {
      throw new Error('Sécurité : impossible de supprimer le dernier compte administrateur.');
    }

    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(filtered));

    await this.logAdminAction(
      'SUPPRESSION_UTILISATEUR',
      'USER',
      id,
      `Suppression du compte utilisateur : ${target?.firstName} ${target?.lastName} (${target?.email})`,
      adminEmail
    );
    return true;
  }

  private static async syncClientToUserAccount(client: ClientRecord) {
    try {
      const users = await this.getAllUsers();
      const existing = users.find(u => u.email.toLowerCase() === client.email.toLowerCase() || (u.nir && client.nir && u.nir.replace(/\s/g, '') === client.nir.replace(/\s/g, '')));
      if (existing) {
        existing.firstName = client.firstName;
        existing.lastName = client.lastName;
        existing.phone = client.phone;
        existing.nir = client.nir;
      } else {
        users.push({
          id: `usr-client-${Date.now()}`,
          email: client.email,
          role: 'PATIENT',
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
          nir: client.nir,
          avatarUrl: '/assets/headshot.png',
          createdAt: new Date().toISOString()
        });
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch {}
  }

  private static async updateUserPasswordByEmail(email: string, password: string, role: UserRole = 'PATIENT', firstName = 'Utilisateur', facilityName?: string, transporterName?: string) {
    try {
      const users = await this.getAllUsers();
      let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        // user exists
      } else {
        user = {
          id: `usr-${Date.now()}`,
          email,
          role,
          firstName,
          lastName: '',
          facilityName,
          transporterName,
          createdAt: new Date().toISOString()
        };
        users.push(user);
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch {}
  }

  // =========================================================================
  // 5. PARAMÈTRES SYSTÈME ET AUDIT TRAIL
  // =========================================================================
  static async getSettings(): Promise<SystemSettings> {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static async updateSettings(updates: Partial<SystemSettings>, adminEmail = 'admin@medictrans972.mq'): Promise<SystemSettings> {
    const current = await this.getSettings();
    const updated: SystemSettings = {
      ...current,
      ...updates,
      lastUpdatedBy: adminEmail,
      lastUpdatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));

    await this.logAdminAction(
      'MISE_A_JOUR_PARAMETRES',
      'SETTINGS',
      undefined,
      `Mise à jour des paramètres généraux (Bannière: ${updated.bannerActive ? 'Active' : 'Inactive'}, Délai annulation: ${updated.cancellationThresholdHours}h)`,
      adminEmail
    );

    return updated;
  }

  // =========================================================================
  // GESTION DES DEMANDES D'ACCÈS ÉTABLISSEMENTS DE SANTÉ
  // =========================================================================
  static async getFacilityAccessRequests(): Promise<UserProfile[]> {
    const users = await this.getAllUsers();
    return users.filter(u => u.role === 'FACILITY');
  }

  static async approveFacilityAccess(userIdOrEmail: string, adminEmail = 'admin@medictrans972.mq'): Promise<boolean> {
    const success = AuthService.updateFacilityAccessStatus(userIdOrEmail, 'APPROVED');
    if (success) {
      await this.logAdminAction(
        'VALIDATION_ACCES_ETABLISSEMENT',
        'FACILITY',
        userIdOrEmail,
        `Validation des habilitations d'accès pour l'établissement : ${userIdOrEmail}`,
        adminEmail
      );
    }
    return success;
  }

  static async rejectFacilityAccess(userIdOrEmail: string, adminEmail = 'admin@medictrans972.mq'): Promise<boolean> {
    const success = AuthService.updateFacilityAccessStatus(userIdOrEmail, 'REJECTED');
    if (success) {
      await this.logAdminAction(
        'REFUS_ACCES_ETABLISSEMENT',
        'FACILITY',
        userIdOrEmail,
        `Refus ou suspension des habilitations pour l'établissement : ${userIdOrEmail}`,
        adminEmail
      );
    }
    return success;
  }

  // =========================================================================
  // GESTION DE LA GRATUITÉ ET DES JOURS D'ESSAI DES TRANSPORTEURS
  // =========================================================================
  static async updateTransporterTrialDays(
    transporterIdOrPhone: string,
    days: number,
    adminEmail = 'admin@medictrans972.mq'
  ): Promise<boolean> {
    try {
      // 1. Mise à jour dans medictrans_transporters_972
      const transporters = await this.getAllTransporters();
      const targetTrans = transporters.find(t => 
        t.id === transporterIdOrPhone || 
        t.phone === transporterIdOrPhone || 
        t.companyName === transporterIdOrPhone ||
        t.email === transporterIdOrPhone
      );
      if (targetTrans) {
        const currentSub = targetTrans.subscription || {
          status: 'TRIAL',
          trialDaysTotal: days,
          trialDaysRemaining: days,
          isTrialUnlocked: true,
          whatsappVerified: true,
          planName: 'Formule Pro Sanitaire (Illimitée)',
          monthlyPrice: 19.9
        };
        targetTrans.subscription = {
          ...currentSub,
          status: days > 0 ? 'TRIAL' : 'EXPIRED',
          trialDaysTotal: Math.max(currentSub.trialDaysTotal, days),
          trialDaysRemaining: days,
          isTrialUnlocked: days > 0,
          trialExpiresAt: new Date(Date.now() + days * 86400000).toISOString()
        };
        localStorage.setItem('medictrans_transporters_972', JSON.stringify(transporters));
      }

      // 2. Mise à jour dans medictrans_admin_users_972
      const users = await this.getAllUsers();
      const user = users.find(u => 
        u.id === transporterIdOrPhone || 
        u.transporterId === transporterIdOrPhone || 
        u.transporterName === transporterIdOrPhone ||
        u.phone === transporterIdOrPhone ||
        u.email === transporterIdOrPhone
      );

      if (user) {
        const currentSub = user.subscription || {
          status: 'TRIAL',
          trialDaysTotal: days,
          trialDaysRemaining: days,
          isTrialUnlocked: true,
          whatsappVerified: true,
          planName: 'Formule Pro Sanitaire (Illimitée)',
          monthlyPrice: 19.9
        };
        user.subscription = {
          ...currentSub,
          status: days > 0 ? 'TRIAL' : 'EXPIRED',
          trialDaysTotal: Math.max(currentSub.trialDaysTotal, days),
          trialDaysRemaining: days,
          isTrialUnlocked: days > 0,
          trialExpiresAt: new Date(Date.now() + days * 86400000).toISOString()
        };
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

        // Mettre à jour la session courante si c'est le transporteur connecté
        const currentLocal = AuthService.getLocalUser();
        if (currentLocal && (currentLocal.id === user.id || currentLocal.email === user.email)) {
          AuthService.updateTransporterSubscription(user.subscription);
        }
      }

      await this.logAdminAction(
        'MODIFICATION_JOURS_GRATUITE',
        'TRANSPORTER',
        transporterIdOrPhone,
        `Attribution de ${days} jours d'essai gratuit pour le transporteur (${transporterIdOrPhone})`,
        adminEmail
      );
      return true;
    } catch {
      return false;
    }
  }

  static async getAuditLogs(): Promise<AuditLog[]> {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  static async logAdminAction(
    action: string,
    targetType: AuditLog['targetType'],
    targetId: string | undefined,
    details: string,
    adminEmail = 'admin@medictrans972.mq'
  ): Promise<AuditLog> {
    const logs = await this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      adminEmail,
      action,
      targetType,
      targetId,
      details
    };

    const updated = [newLog, ...logs].slice(0, 150); // Garder les 150 dernières actions
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(updated));
    return newLog;
  }
}

export const adminService = AdminService;

