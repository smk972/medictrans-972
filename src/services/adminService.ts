import { ClientRecord, Facility, Transporter, UserProfile, UserRole, Ride, SystemSettings, AuditLog } from '../types';
import { rideService } from './rideService';
import { AuthService, REALISTIC_PROFILES } from './authService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_CLIENTS = 'medictrans_admin_clients_972';
const STORAGE_KEY_SETTINGS = 'medictrans_admin_settings_972';
const STORAGE_KEY_AUDIT_LOGS = 'medictrans_admin_audit_logs_972';
const STORAGE_KEY_USERS = 'medictrans_admin_users_972';
const STORAGE_KEY_AUTH_USER = 'medictrans_auth_user_972';
const STORAGE_KEY_DELETED_CLIENTS = 'medictrans_deleted_clients_972';

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
  },
  {
    id: 'client-6',
    firstName: 'Jean',
    lastName: 'Dupont',
    birthDate: '1985-04-12',
    nir: '1 85 04 75 112 345 88',
    phone: '06 12 34 56 78',
    email: 'jean.dupont@orange.fr',
    address: '45 Rue de Vaugirard',
    city: 'Paris',
    postalCode: '75006',
    isAld: true,
    aldReason: 'ALD 30 - Affection cardiovasculaire grave (Suivi HEGP)',
    hasPmt: true,
    pmtPrescriberDoctor: 'Dr. Mercier - Hôpital Européen Georges-Pompidou',
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Consultation cardiologie mensuelle'
    },
    status: 'ACTIVE',
    createdAt: '2026-01-10T10:00:00.000Z',
    notes: 'Prise en charge VSL conventionné CPAM Paris'
  },
  {
    id: 'client-7',
    firstName: 'Sophie',
    lastName: 'Laurent',
    birthDate: '1990-08-15',
    nir: '2 90 08 69 044 123 45',
    phone: '06 88 99 11 22',
    email: 'sophie.laurent@gmail.com',
    address: '12 Avenue des Frères Lumière',
    city: 'Lyon',
    postalCode: '69008',
    isAld: true,
    aldReason: 'ALD 4 - Diabète de type 1 sévère avec suivi néphrologie',
    hasPmt: true,
    pmtPrescriberDoctor: 'Dr. Faure - Hôpital Édouard Herriot Lyon',
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false
    },
    status: 'ACTIVE',
    createdAt: '2026-01-12T10:00:00.000Z',
    notes: 'Transport régulier pour séances de dialyse Lyon'
  },
  {
    id: 'client-8',
    firstName: 'Marie',
    lastName: 'Leroy',
    birthDate: '1975-03-20',
    nir: '2 75 03 31 555 432 10',
    phone: '06 45 67 89 01',
    email: 'marie.leroy@gmail.com',
    address: '8 Place du Capitole',
    city: 'Toulouse',
    postalCode: '31000',
    isAld: true,
    aldReason: 'ALD 23 - Maladie de Crohn et suivi gastro-entérologie',
    hasPmt: true,
    pmtPrescriberDoctor: 'Dr. Durand - CHU Purpan Toulouse',
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false
    },
    status: 'ACTIVE',
    createdAt: '2026-02-01T09:00:00.000Z',
    notes: 'Consultation spécialisée CHU Rangueil / Purpan'
  },
  {
    id: 'client-9',
    firstName: 'Jacqueline',
    lastName: 'Evariste',
    birthDate: '1962-11-14',
    nir: '2 62 11 97 105 321 54',
    phone: '0690 12 34 56',
    email: 'jacqueline.evariste@orange.fr',
    address: 'Section Lauricisque',
    city: 'Pointe-à-Pitre',
    postalCode: '97110',
    isAld: true,
    aldReason: 'ALD 19 - Insuffisance rénale chronique hémodialyse',
    hasPmt: true,
    pmtPrescriberDoctor: 'Dr. Bellerose - CHU Guadeloupe',
    mobility: {
      wheelchair: true,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: true
    },
    status: 'ACTIVE',
    createdAt: '2026-01-20T08:00:00.000Z',
    notes: 'Hémodialyse triterbienne CHU Pointe-à-Pitre'
  },
  {
    id: 'client-10',
    firstName: 'Denis',
    lastName: 'Golitin',
    birthDate: '1971-06-08',
    nir: '1 71 06 97 302 456 78',
    phone: '0694 22 33 44',
    email: 'denis.golitin@guyane.fr',
    address: 'Route de Montabo',
    city: 'Cayenne',
    postalCode: '97300',
    isAld: false,
    hasPmt: true,
    pmtPrescriberDoctor: 'Dr. Némorin - Centre Hospitalier Andrée Rosemon',
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false
    },
    status: 'ACTIVE',
    createdAt: '2026-02-15T10:00:00.000Z',
    notes: 'Prise en charge rééducation post-opératoire'
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
    let deletedIds: string[] = [];
    try {
      const rawDel = localStorage.getItem(STORAGE_KEY_DELETED_CLIENTS);
      if (rawDel) deletedIds = JSON.parse(rawDel);
    } catch {}

    const raw = localStorage.getItem(STORAGE_KEY_CLIENTS);
    let clients: ClientRecord[] = [];
    if (raw) {
      try { clients = JSON.parse(raw); } catch { clients = []; }
    }

    // 1. Récupérer les clients persistés sur le serveur (/api/clients)
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          for (const serverClient of json.data) {
            if (deletedIds.includes(serverClient.id)) continue;
            const idx = clients.findIndex(c => c.id === serverClient.id || (serverClient.email && c.email.toLowerCase() === serverClient.email.toLowerCase()));
            if (idx >= 0) {
              clients[idx] = { ...clients[idx], ...serverClient };
            } else {
              clients.unshift(serverClient);
            }
          }
        }
      }
    } catch (apiErr) {
      console.warn('[AdminService] Récupération API clients non-bloquante:', apiErr);
    }

    // 2. Fusionner les fiches de référence initiales Nationales & DOM
    for (const initClient of INITIAL_CLIENTS) {
      if (deletedIds.includes(initClient.id)) continue;
      if (!clients.some(c => c.email.toLowerCase() === initClient.email.toLowerCase() || c.id === initClient.id)) {
        clients.push(initClient);
      }
    }

    // 3. Synchroniser automatiquement avec tous les utilisateurs inscrits ayant le rôle PATIENT
    try {
      const allUsers = await this.getAllUsers();
      const patientUsers = allUsers.filter(u => u.role === 'PATIENT');

      for (const p of patientUsers) {
        if (deletedIds.includes(`client-${p.id}`) || (p.email && deletedIds.includes(p.email))) continue;
        const exists = clients.some(c => c.email.toLowerCase() === p.email.toLowerCase());
        if (!exists) {
          const dept = p.phone?.startsWith('0696') || p.phone?.startsWith('0596') ? '97200' :
                       p.phone?.startsWith('0690') || p.phone?.startsWith('0590') ? '97100' :
                       p.phone?.startsWith('0694') || p.phone?.startsWith('0594') ? '97300' :
                       p.phone?.startsWith('0692') || p.phone?.startsWith('0262') ? '97400' : '75000';
          const cityName = dept === '97200' ? 'Fort-de-France' :
                            dept === '97100' ? 'Pointe-à-Pitre' :
                            dept === '97300' ? 'Cayenne' :
                            dept === '97400' ? 'Saint-Denis' : 'Paris';

          const newPatientClient: ClientRecord = {
            id: `client-${p.id}`,
            firstName: p.firstName || 'Patient',
            lastName: p.lastName || '',
            birthDate: '1980-01-01',
            nir: p.nir || '1 80 01 75 000 000 00',
            phone: p.phone || '06 00 00 00 00',
            email: p.email,
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
            createdAt: p.createdAt || new Date().toISOString(),
            notes: 'Inscription en ligne sur Clinigo.fr'
          };

          clients.unshift(newPatientClient);

          // Persister sur l'API serveur
          try {
            fetch('/api/clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newPatientClient)
            }).catch(() => {});
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Sync clients depuis utilisateurs non-bloquante:', err);
    }

    // 4. Synchroniser automatiquement avec TOUTES les réservations de transport (Supervisions / Courses)
    try {
      const allRides = await rideService.getAllRides();
      for (const r of allRides) {
        if (!r.patient) continue;
        const p = r.patient;
        const pEmail = (p.email || '').trim().toLowerCase();
        const pNir = (p.nir || '').replace(/\s/g, '');
        const pFirst = (p.firstName || '').trim().toLowerCase();
        const pLast = (p.lastName || '').trim().toLowerCase();
        const pPhone = (p.phone || '').replace(/\s/g, '');

        // Ignorer les courses de test / dummy "Aimé GLISSANT" ou sans identité
        if (pFirst === 'aimé' && pLast === 'glissant') continue;
        if (!pFirst && !pLast && !pEmail && !pPhone) continue;

        const rideClientId = `client-ride-${r.id || r.reference}`;
        if (deletedIds.includes(rideClientId)) continue;
        if (pEmail && deletedIds.includes(pEmail)) continue;

        // Détection code postal & commune
        let detectedPostal = p.postalCode;
        if (!detectedPostal) {
          const m = ((r.pickupAddress || '') + ' ' + (p.address || '')).match(/\b(97[1-8]|2[ABab]|0[1-9]|[1-8]\d|9[0-5])\d{3}\b/);
          detectedPostal = m ? m[0] : (pPhone.startsWith('0696') || pPhone.startsWith('0596') || pPhone.startsWith('+330696') ? '97200' : '75000');
        }
        const cityName = p.city || r.pickupCity || (detectedPostal.startsWith('972') ? 'Fort-de-France' : 'Paris');

        // Recherche d'un client existant par email, NIR, nom+prénom ou téléphone
        const existingIdx = clients.findIndex(c => {
          if (pEmail && c.email && c.email.toLowerCase() === pEmail) return true;
          if (pNir && c.nir && c.nir.replace(/\s/g, '') === pNir && !pNir.includes('000000')) return true;
          if (pFirst && pLast && c.firstName.toLowerCase() === pFirst && c.lastName.toLowerCase() === pLast) return true;
          if (pPhone && c.phone && c.phone.replace(/\s/g, '') === pPhone && !pPhone.includes('000000')) return true;
          return false;
        });

        if (existingIdx === -1) {
          const clientFromRide: ClientRecord = {
            id: rideClientId,
            firstName: p.firstName || 'Client',
            lastName: p.lastName || '',
            birthDate: p.birthDate || '1975-01-01',
            nir: p.nir || '1 75 00 00 000 000 00',
            phone: p.phone || '06 00 00 00 00',
            email: p.email || `${pFirst || 'client'}.${pLast || 'nouveau'}@clinigo.fr`,
            address: p.address || r.pickupAddress || 'Adresse déclarée',
            city: cityName,
            postalCode: detectedPostal,
            isAld: p.isAld ?? true,
            aldReason: p.aldReason || (p.isAld ? 'Prise en charge ALD 100%' : undefined),
            hasPmt: p.hasPmt ?? true,
            pmtPrescriberDoctor: p.pmtPrescriberDoctor || 'Médecin prescripteur',
            pmtFileUrl: p.pmtFileUrl,
            pmtFileName: p.pmtFileName,
            mobility: r.mobility || {
              wheelchair: false,
              stretcher: false,
              oxygen: false,
              stairsWithoutElevator: false,
              needsEscort: false,
            },
            status: 'ACTIVE',
            createdAt: r.createdAt || new Date().toISOString(),
            notes: `Patient issu de la réservation ${r.reference} (${r.transportType || 'VSL'})`
          };

          clients.unshift(clientFromRide);

          // Persister sur l'API serveur
          try {
            fetch('/api/clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(clientFromRide)
            }).catch(() => {});
          } catch {}
        } else {
          // Enrichir la fiche existante si elle manquait d'informations
          const existing = clients[existingIdx];
          const hasGenericAddress = !existing.address || existing.address.includes('déclarée à l’inscription') || existing.address.includes('Adresse déclarée');
          const hasGenericPhone = !existing.phone || existing.phone.includes('00 00');
          const hasGenericDoctor = !existing.pmtPrescriberDoctor || existing.pmtPrescriberDoctor === 'Médecin traitant';

          clients[existingIdx] = {
            ...existing,
            phone: hasGenericPhone && p.phone ? p.phone : existing.phone,
            nir: (!existing.nir || existing.nir.includes('000 000')) && p.nir ? p.nir : existing.nir,
            address: hasGenericAddress && (p.address || r.pickupAddress) ? (p.address || r.pickupAddress) : existing.address,
            city: existing.city || cityName,
            postalCode: existing.postalCode || detectedPostal,
            isAld: existing.isAld || (p.isAld ?? false),
            aldReason: existing.aldReason || p.aldReason,
            hasPmt: existing.hasPmt || (p.hasPmt ?? false),
            pmtPrescriberDoctor: hasGenericDoctor && p.pmtPrescriberDoctor ? p.pmtPrescriberDoctor : existing.pmtPrescriberDoctor,
            pmtFileUrl: existing.pmtFileUrl || p.pmtFileUrl,
            pmtFileName: existing.pmtFileName || p.pmtFileName,
            mobility: existing.mobility || r.mobility
          };
        }
      }
    } catch (errRides) {
      console.warn('[AdminService] Synchro clients depuis courses non-bloquante:', errRides);
    }

    // Filtrer les éventuels clients supprimés
    const finalClients = clients.filter(c => !deletedIds.includes(c.id));
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(finalClients));
    return finalClients;
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

    // Persister sur l'API serveur
    try {
      fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      }).catch(() => {});
    } catch {}

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

    // Persister sur l'API serveur
    try {
      fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClient)
      }).catch(() => {});
    } catch {}

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
    try {
      const rawDel = localStorage.getItem(STORAGE_KEY_DELETED_CLIENTS);
      const deletedIds: string[] = rawDel ? JSON.parse(rawDel) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem(STORAGE_KEY_DELETED_CLIENTS, JSON.stringify(deletedIds));
      }
    } catch {}

    const clients = await this.getAllClients();
    const target = clients.find(c => c.id === id);
    const filtered = clients.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(filtered));

    // Supprimer sur l'API serveur
    try {
      fetch(`/api/clients/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

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

    // Si les véhicules sont mis à jour, recalculer automatiquement la flotte déclarée
    if (updates.vehicles) {
      updatedTransporter.fleetAmbulances = updates.vehicles.filter(v => v.type === 'AMBULANCE').length;
      updatedTransporter.fleetVsl = updates.vehicles.filter(v => v.type === 'VSL').length;
      updatedTransporter.fleetTaxis = updates.vehicles.filter(v => v.type === 'TAXI_CONVENTIONNE').length;
    }

    transporters[index] = updatedTransporter;
    localStorage.setItem('medictrans_transporters_972', JSON.stringify(transporters));

    // Si c'est le transporteur de démo principal, synchroniser aussi les clés du portail transporteur
    if (id === 'transporter-1' || id === 'madinina-secours') {
      if (updates.vehicles) {
        localStorage.setItem('medictrans_transporter_fleet_v2', JSON.stringify(updates.vehicles));
      }
      if (updates.drivers) {
        localStorage.setItem('medictrans_transporter_drivers_v2', JSON.stringify(updates.drivers));
      }
    }

    await this.logAdminAction(
      'MODIFICATION_TRANSPORTEUR',
      'TRANSPORTER',
      id,
      `Mise à jour complète de la fiche transporteur : ${updatedTransporter.companyName} (Flotte & Chauffeurs)`,
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

    // 0. Récupérer les utilisateurs persistés sur le serveur (/api/users)
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          for (const serverUser of json.data) {
            const idx = users.findIndex(u => u.id === serverUser.id || (serverUser.email && u.email.toLowerCase() === serverUser.email.toLowerCase()));
            if (idx >= 0) {
              users[idx] = { ...users[idx], ...serverUser };
            } else {
              users.unshift(serverUser);
            }
          }
        }
      }
    } catch (apiErr) {
      console.warn('[AdminService] Récupération API users non-bloquante:', apiErr);
    }

    // 1. Fusionner avec tous les comptes réalistes nationaux & DOM
    const realisticList = Object.values(REALISTIC_PROFILES);
    for (const rUser of realisticList) {
      const idx = users.findIndex(u => u.email.toLowerCase() === rUser.email.toLowerCase());
      if (idx === -1) {
        users.push(rUser);
      }
    }

    // 2. Interroger Supabase en direct pour récupérer toutes les nouvelles inscriptions
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: sbProfiles } = await supabase.from('profiles').select('*');
        if (sbProfiles && sbProfiles.length > 0) {
          for (const sp of sbProfiles) {
            const idx = users.findIndex(u => u.email.toLowerCase() === (sp.email || '').toLowerCase() || u.id === sp.id);
            const mappedUser: UserProfile = {
              id: sp.id,
              email: sp.email || '',
              firstName: sp.first_name || 'Utilisateur',
              lastName: sp.last_name || '',
              role: (sp.role ? sp.role.toUpperCase() : 'PATIENT') as UserRole,
              phone: sp.phone || undefined,
              avatarUrl: sp.avatar_url || '/assets/headshot.png',
              createdAt: sp.created_at || new Date().toISOString()
            };
            if (idx >= 0) {
              users[idx] = { ...users[idx], ...mappedUser };
            } else {
              users.unshift(mappedUser);
            }
          }
        }
      } catch (sbErr) {
        console.warn('[AdminService] Supabase profiles sync non-bloquante:', sbErr);
      }
    }

    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
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

    // Persister sur l'API serveur
    try {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      }).catch(() => {});
    } catch {}

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

    // Persister sur l'API serveur
    try {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      }).catch(() => {});
    } catch {}

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

