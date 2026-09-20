import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Driver, VehicleFleet, FLEET_STORAGE_KEY, DRIVERS_STORAGE_KEY, DEFAULT_DRIVERS, DEFAULT_FLEET } from '../pages/TransporterPortalPage';
import { TransportType, Ride } from '../types';

export interface TransporterClientRecord {
  id: string;
  transporterId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  nir?: string;
  pickupAddress?: string;
  pickupCity?: string;
  dropoffAddress?: string;
  dropoffCity?: string;
  mobilityNeeds?: string;
  referringFacility?: string;
  emergencyContact?: string;
  notes?: string;
  isArchived?: boolean;
  createdAt?: string;
}

export const transporterFleetService = {
  // =========================================================================
  // CHAUFFEURS (DRIVERS) - Migration progressive et contrôlée depuis localStorage
  // =========================================================================
  async getDrivers(transporterId: string): Promise<Driver[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('transporter_drivers')
          .select('*')
          .eq('transporter_id', transporterId)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          // Données existantes vérifiées dans Supabase : purge sécurisée du localStorage
          try {
            if (localStorage.getItem(DRIVERS_STORAGE_KEY)) {
              localStorage.removeItem(DRIVERS_STORAGE_KEY);
            }
          } catch {}

          return data.map((d: any) => ({
            id: d.id,
            firstName: d.first_name,
            lastName: d.last_name,
            role: d.role,
            phone: d.phone,
            status: d.status as Driver['status'],
            assignedVehiclePlate: d.assigned_vehicle_plate || undefined,
            cardExpiryDate: d.card_expiry_date || undefined,
            medicalCertExpiryDate: d.medical_certificate_expiry || undefined,
          }));
        }

        // Si la base est encore vide pour ce transporteur, vérifier si des données existent dans le localStorage
        let localDrivers: Driver[] = [];
        try {
          const raw = localStorage.getItem(DRIVERS_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localDrivers = parsed;
            }
          }
        } catch {}

        if (localDrivers.length === 0) {
          localDrivers = DEFAULT_DRIVERS;
        }

        // Migration contrôlée : Insertion dans Supabase
        const rowsToInsert = localDrivers.map((d) => ({
          transporter_id: transporterId,
          first_name: d.firstName,
          last_name: d.lastName,
          role: d.role || "Ambulancier Diplômé d'État (ADE)",
          phone: d.phone,
          status: d.status || 'DISPONIBLE',
          assigned_vehicle_plate: d.assignedVehiclePlate || null,
          is_active: true,
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('transporter_drivers')
          .insert(rowsToInsert)
          .select('*');

        if (!insertError && inserted && inserted.length > 0) {
          // Sauvegarde confirmée dans Supabase : suppression du localStorage
          try {
            localStorage.removeItem(DRIVERS_STORAGE_KEY);
          } catch {}

          return inserted.map((d: any) => ({
            id: d.id,
            firstName: d.first_name,
            lastName: d.last_name,
            role: d.role,
            phone: d.phone,
            status: d.status as Driver['status'],
            assignedVehiclePlate: d.assigned_vehicle_plate || undefined,
          }));
        }
      } catch (err) {
        console.warn('[transporterFleetService] Erreur chargement chauffeurs Supabase:', err);
      }
    }

    // Fallback mémoire / local temporaire si Supabase n'est pas joignable
    try {
      const raw = localStorage.getItem(DRIVERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_DRIVERS;
  },

  async addDriver(transporterId: string, driver: Omit<Driver, 'id'>): Promise<Driver> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('transporter_drivers')
          .insert({
            transporter_id: transporterId,
            first_name: driver.firstName,
            last_name: driver.lastName,
            role: driver.role,
            phone: driver.phone,
            status: driver.status || 'DISPONIBLE',
            assigned_vehicle_plate: driver.assignedVehiclePlate || null,
            is_active: true,
          })
          .select('*')
          .single();

        if (!error && data) {
          return {
            id: data.id,
            firstName: data.first_name,
            lastName: data.last_name,
            role: data.role,
            phone: data.phone,
            status: data.status,
            assignedVehiclePlate: data.assigned_vehicle_plate || undefined,
          };
        }
      } catch (err) {
        console.error('[transporterFleetService] addDriver error:', err);
      }
    }

    const fallback: Driver = { ...driver, id: `drv-${Date.now()}` };
    return fallback;
  },

  async updateDriver(id: string, updates: Partial<Driver>): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.firstName !== undefined) payload.first_name = updates.firstName;
        if (updates.lastName !== undefined) payload.last_name = updates.lastName;
        if (updates.role !== undefined) payload.role = updates.role;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.assignedVehiclePlate !== undefined) payload.assigned_vehicle_plate = updates.assignedVehiclePlate;

        await supabase.from('transporter_drivers').update(payload).eq('id', id);
      } catch (err) {
        console.error('[transporterFleetService] updateDriver error:', err);
      }
    }
  },

  async deleteDriver(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('transporter_drivers')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.error('[transporterFleetService] deleteDriver error:', err);
      }
    }
  },

  // =========================================================================
  // VÉHICULES (FLEET) - Migration progressive et contrôlée depuis localStorage
  // =========================================================================
  async getVehicles(transporterId: string): Promise<VehicleFleet[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('transporter_vehicles')
          .select('*')
          .eq('transporter_id', transporterId)
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          // Données vérifiées dans Supabase : purge sécurisée du localStorage
          try {
            if (localStorage.getItem(FLEET_STORAGE_KEY)) {
              localStorage.removeItem(FLEET_STORAGE_KEY);
            }
          } catch {}

          return data.map((v: any) => ({
            id: v.id,
            name: v.name,
            type: v.type as TransportType,
            plate: v.plate,
            driver: v.driver || '',
            phone: v.phone || '',
            status: v.status as VehicleFleet['status'],
            technicalInspectionDate: v.technical_inspection_date || undefined,
            sanitaryApprovalExpiry: v.sanitary_approval_expiry || undefined,
          }));
        }

        // Si la base est encore vide, vérifier le localStorage
        let localFleet: VehicleFleet[] = [];
        try {
          const raw = localStorage.getItem(FLEET_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localFleet = parsed;
            }
          }
        } catch {}

        if (localFleet.length === 0) {
          localFleet = DEFAULT_FLEET;
        }

        // Migration contrôlée : Insertion dans Supabase
        const rowsToInsert = localFleet.map((v) => ({
          transporter_id: transporterId,
          name: v.name,
          type: v.type || 'VSL',
          plate: v.plate,
          driver: v.driver || null,
          phone: v.phone || null,
          status: v.status || 'DISPONIBLE',
          is_active: true,
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('transporter_vehicles')
          .insert(rowsToInsert)
          .select('*');

        if (!insertError && inserted && inserted.length > 0) {
          try {
            localStorage.removeItem(FLEET_STORAGE_KEY);
          } catch {}

          return inserted.map((v: any) => ({
            id: v.id,
            name: v.name,
            type: v.type as TransportType,
            plate: v.plate,
            driver: v.driver || '',
            phone: v.phone || '',
            status: v.status as VehicleFleet['status'],
          }));
        }
      } catch (err) {
        console.warn('[transporterFleetService] Erreur chargement véhicules Supabase:', err);
      }
    }

    try {
      const raw = localStorage.getItem(FLEET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_FLEET;
  },

  async addVehicle(transporterId: string, vehicle: Omit<VehicleFleet, 'id'>): Promise<VehicleFleet> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('transporter_vehicles')
          .insert({
            transporter_id: transporterId,
            name: vehicle.name,
            type: vehicle.type,
            plate: vehicle.plate,
            driver: vehicle.driver || null,
            phone: vehicle.phone || null,
            status: vehicle.status || 'DISPONIBLE',
            is_active: true,
          })
          .select('*')
          .single();

        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            type: data.type,
            plate: data.plate,
            driver: data.driver || '',
            phone: data.phone || '',
            status: data.status,
          };
        }
      } catch (err) {
        console.error('[transporterFleetService] addVehicle error:', err);
      }
    }

    const fallback: VehicleFleet = { ...vehicle, id: `veh-${Date.now()}` };
    return fallback;
  },

  async updateVehicle(id: string, updates: Partial<VehicleFleet>): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.plate !== undefined) payload.plate = updates.plate;
        if (updates.driver !== undefined) payload.driver = updates.driver;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.status !== undefined) payload.status = updates.status;

        await supabase.from('transporter_vehicles').update(payload).eq('id', id);
      } catch (err) {
        console.error('[transporterFleetService] updateVehicle error:', err);
      }
    }
  },

  async deleteVehicle(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('transporter_vehicles')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.error('[transporterFleetService] deleteVehicle error:', err);
      }
    }
  },

  // =========================================================================
  // CLIENTS / PATIENTS (RÉPERTOIRE DE L'ENTREPRISE)
  // =========================================================================
  async getClients(transporterId: string, search?: string): Promise<TransporterClientRecord[]> {
    const isValidUUID = (str?: string): boolean => {
      if (!str) return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    };

    const getLocalClients = (): TransporterClientRecord[] => {
      try {
        const raw = localStorage.getItem(`medictrans_transporter_clients_${transporterId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
      return [];
    };

    const saveLocalClients = (list: TransporterClientRecord[]) => {
      try {
        localStorage.setItem(`medictrans_transporter_clients_${transporterId}`, JSON.stringify(list));
      } catch {}
    };

    let localList = getLocalClients();

    if (isSupabaseConfigured() && supabase && isValidUUID(transporterId)) {
      try {
        let query = supabase
          .from('transporter_clients')
          .select('*')
          .eq('transporter_id', transporterId)
          .eq('is_archived', false)
          .order('last_name', { ascending: true });

        if (search && search.trim().length > 0) {
          const s = search.trim();
          query = query.or(`last_name.ilike.%${s}%,first_name.ilike.%${s}%,phone.ilike.%${s}%`);
        }

        const { data, error } = await query;
        if (!error && data) {
          const remoteList: TransporterClientRecord[] = data.map((c: any) => ({
            id: c.id,
            transporterId: c.transporter_id,
            firstName: c.first_name,
            lastName: c.last_name,
            phone: c.phone || '',
            email: c.email || '',
            birthDate: c.birth_date || '',
            nir: c.nir || '',
            pickupAddress: c.pickup_address || '',
            pickupCity: c.pickup_city || '',
            dropoffAddress: c.dropoff_address || '',
            dropoffCity: c.dropoff_city || '',
            mobilityNeeds: c.mobility_needs || '',
            referringFacility: c.referring_facility || '',
            emergencyContact: c.emergency_contact || '',
            notes: c.notes || '',
            isArchived: c.is_archived,
            createdAt: c.created_at,
          }));

          const mergedMap = new Map<string, TransporterClientRecord>();
          for (const l of localList) {
            const key = `${(l.lastName || '').trim().toLowerCase()}_${(l.firstName || '').trim().toLowerCase()}`;
            mergedMap.set(key, l);
          }
          for (const r of remoteList) {
            const key = `${(r.lastName || '').trim().toLowerCase()}_${(r.firstName || '').trim().toLowerCase()}`;
            mergedMap.set(key, r);
          }
          const merged = Array.from(mergedMap.values()).filter((c) => !c.isArchived);
          saveLocalClients(merged);
          return merged;
        }
      } catch (err) {
        console.error('[transporterFleetService] getClients error:', err);
      }
    }

    if (search && search.trim().length > 0) {
      const s = search.trim().toLowerCase();
      return localList.filter(
        (c) =>
          !c.isArchived &&
          ((c.lastName && c.lastName.toLowerCase().includes(s)) ||
            (c.firstName && c.firstName.toLowerCase().includes(s)) ||
            (c.phone && c.phone.includes(s)))
      );
    }

    return localList.filter((c) => !c.isArchived);
  },

  async saveClient(
    transporterId: string,
    client: Omit<TransporterClientRecord, 'id' | 'transporterId'>
  ): Promise<TransporterClientRecord | null> {
    const isValidUUID = (str?: string): boolean => {
      if (!str) return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    };

    let localList: TransporterClientRecord[] = [];
    try {
      const raw = localStorage.getItem(`medictrans_transporter_clients_${transporterId}`);
      if (raw) localList = JSON.parse(raw) || [];
    } catch {}

    const existingIndex = localList.findIndex(
      (c) =>
        c.lastName.trim().toLowerCase() === client.lastName.trim().toLowerCase() &&
        c.firstName.trim().toLowerCase() === client.firstName.trim().toLowerCase()
    );

    let savedRecord: TransporterClientRecord;

    if (existingIndex >= 0) {
      savedRecord = {
        ...localList[existingIndex],
        ...client,
        phone: client.phone || localList[existingIndex].phone,
        pickupAddress: client.pickupAddress || localList[existingIndex].pickupAddress,
        pickupCity: client.pickupCity || localList[existingIndex].pickupCity,
        dropoffAddress: client.dropoffAddress || localList[existingIndex].dropoffAddress,
        dropoffCity: client.dropoffCity || localList[existingIndex].dropoffCity,
        mobilityNeeds: client.mobilityNeeds || localList[existingIndex].mobilityNeeds,
        referringFacility: client.referringFacility || localList[existingIndex].referringFacility,
        notes: client.notes || localList[existingIndex].notes,
        isArchived: false,
      };
      localList[existingIndex] = savedRecord;
    } else {
      savedRecord = {
        ...client,
        id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        transporterId,
        isArchived: false,
        createdAt: new Date().toISOString(),
      };
      localList.push(savedRecord);
    }

    try {
      localStorage.setItem(`medictrans_transporter_clients_${transporterId}`, JSON.stringify(localList));
    } catch {}

    if (isSupabaseConfigured() && supabase && isValidUUID(transporterId)) {
      try {
        const { data: existing } = await supabase
          .from('transporter_clients')
          .select('id')
          .eq('transporter_id', transporterId)
          .ilike('last_name', client.lastName.trim())
          .ilike('first_name', client.firstName.trim())
          .limit(1);

        if (existing && existing.length > 0) {
          const existingId = existing[0].id;
          await supabase
            .from('transporter_clients')
            .update({
              phone: client.phone || undefined,
              pickup_address: client.pickupAddress || undefined,
              pickup_city: client.pickupCity || undefined,
              dropoff_address: client.dropoffAddress || undefined,
              dropoff_city: client.dropoffCity || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingId);
          savedRecord.id = existingId;
        } else {
          const { data, error } = await supabase
            .from('transporter_clients')
            .insert({
              transporter_id: transporterId,
              first_name: client.firstName.trim(),
              last_name: client.lastName.trim(),
              phone: client.phone || null,
              email: client.email || null,
              birth_date: client.birthDate || null,
              nir: client.nir ? client.nir.trim() : null,
              pickup_address: client.pickupAddress || null,
              pickup_city: client.pickupCity || null,
              dropoff_address: client.dropoffAddress || null,
              dropoff_city: client.dropoffCity || null,
              mobility_needs: client.mobilityNeeds || null,
              referring_facility: client.referringFacility || null,
              emergency_contact: client.emergencyContact || null,
              notes: client.notes || null,
            })
            .select('*')
            .single();

          if (!error && data) {
            savedRecord.id = data.id;
          }
        }
      } catch (err) {
        console.error('[transporterFleetService] saveClient error:', err);
      }
    }

    return savedRecord;
  },

  async updateClient(
    clientId: string,
    updates: Partial<Omit<TransporterClientRecord, 'id' | 'transporterId'>>
  ): Promise<void> {
    const isValidUUID = (str?: string): boolean => {
      if (!str) return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    };

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('medictrans_transporter_clients_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: TransporterClientRecord[] = JSON.parse(raw);
            const idx = list.findIndex((c) => c.id === clientId);
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...updates };
              localStorage.setItem(key, JSON.stringify(list));
              break;
            }
          }
        }
      }
    } catch {}

    if (isSupabaseConfigured() && supabase && isValidUUID(clientId)) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.firstName !== undefined) payload.first_name = updates.firstName.trim();
        if (updates.lastName !== undefined) payload.last_name = updates.lastName.trim();
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;
        if (updates.nir !== undefined) payload.nir = updates.nir;
        if (updates.pickupAddress !== undefined) payload.pickup_address = updates.pickupAddress;
        if (updates.pickupCity !== undefined) payload.pickup_city = updates.pickupCity;
        if (updates.dropoffAddress !== undefined) payload.dropoff_address = updates.dropoffAddress;
        if (updates.dropoffCity !== undefined) payload.dropoff_city = updates.dropoffCity;
        if (updates.mobilityNeeds !== undefined) payload.mobility_needs = updates.mobilityNeeds;
        if (updates.referringFacility !== undefined) payload.referring_facility = updates.referringFacility;
        if (updates.emergencyContact !== undefined) payload.emergency_contact = updates.emergencyContact;
        if (updates.notes !== undefined) payload.notes = updates.notes;

        await supabase.from('transporter_clients').update(payload).eq('id', clientId);
      } catch (err) {
        console.error('[transporterFleetService] updateClient error:', err);
      }
    }
  },

  async archiveClient(clientId: string): Promise<void> {
    const isValidUUID = (str?: string): boolean => {
      if (!str) return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    };

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('medictrans_transporter_clients_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: TransporterClientRecord[] = JSON.parse(raw);
            const idx = list.findIndex((c) => c.id === clientId);
            if (idx >= 0) {
              list[idx].isArchived = true;
              localStorage.setItem(key, JSON.stringify(list));
              break;
            }
          }
        }
      }
    } catch {}

    if (isSupabaseConfigured() && supabase && isValidUUID(clientId)) {
      try {
        await supabase
          .from('transporter_clients')
          .update({ is_archived: true, updated_at: new Date().toISOString() })
          .eq('id', clientId);
      } catch (err) {
        console.error('[transporterFleetService] archiveClient error:', err);
      }
    }
  },

  async syncClientsFromRides(transporterId: string, rides: Ride[]): Promise<void> {
    if (!rides || rides.length === 0) return;
    try {
      const isValidUUID = (str?: string): boolean => {
        if (!str) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      };

      let localList: TransporterClientRecord[] = [];
      try {
        const raw = localStorage.getItem(`medictrans_transporter_clients_${transporterId}`);
        if (raw) localList = JSON.parse(raw) || [];
      } catch {}

      const existingKeys = new Set(
        localList.map((c) => `${(c.lastName || '').trim().toLowerCase()}_${(c.firstName || '').trim().toLowerCase()}`)
      );

      for (const r of rides) {
        if (!r.patient?.lastName || !r.patient?.firstName) continue;
        const key = `${r.patient.lastName.trim().toLowerCase()}_${r.patient.firstName.trim().toLowerCase()}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          localList.push({
            id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            transporterId,
            lastName: r.patient.lastName.trim().toUpperCase(),
            firstName: r.patient.firstName.trim(),
            phone: r.patient.phone || undefined,
            birthDate: r.patient.birthDate || '1980-01-01',
            nir: r.patient.nir || undefined,
            pickupAddress: r.pickupAddress || r.patient.address || undefined,
            pickupCity: r.pickupCity || r.patient.city || undefined,
            dropoffAddress: r.dropoffAddress || undefined,
            dropoffCity: r.dropoffCity || undefined,
            mobilityNeeds: r.transportType === 'AMBULANCE' ? 'Allongé (brancard)' : r.transportType === 'VSL' ? 'Assis' : undefined,
            referringFacility: r.facilityName || undefined,
            notes: r.additionalNotes || r.mobility?.notes || undefined,
            isArchived: false,
            createdAt: r.createdAt || r.pickupDateTime || new Date().toISOString(),
          });
        }
      }

      try {
        localStorage.setItem(`medictrans_transporter_clients_${transporterId}`, JSON.stringify(localList));
      } catch {}

      if (isSupabaseConfigured() && supabase && isValidUUID(transporterId)) {
        const { data: existingClients } = await supabase
          .from('transporter_clients')
          .select('last_name, first_name')
          .eq('transporter_id', transporterId);

        const remoteKeys = new Set(
          (existingClients || []).map((c: any) => `${(c.last_name || '').trim().toLowerCase()}_${(c.first_name || '').trim().toLowerCase()}`)
        );

        const toInsert: any[] = [];
        for (const l of localList) {
          const key = `${(l.lastName || '').trim().toLowerCase()}_${(l.firstName || '').trim().toLowerCase()}`;
          if (!remoteKeys.has(key)) {
            toInsert.push({
              transporter_id: transporterId,
              last_name: l.lastName,
              first_name: l.firstName,
              phone: l.phone || null,
              pickup_address: l.pickupAddress || null,
              pickup_city: l.pickupCity || null,
              dropoff_address: l.dropoffAddress || null,
              dropoff_city: l.dropoffCity || null,
              mobility_needs: l.mobilityNeeds || null,
              referring_facility: l.referringFacility || null,
              notes: l.notes || null,
            });
          }
        }

        if (toInsert.length > 0) {
          await supabase.from('transporter_clients').insert(toInsert);
        }
      }
    } catch (err) {
      console.error('[transporterFleetService] syncClientsFromRides error:', err);
    }
  },

  async batchImportClients(
    transporterId: string,
    clientsList: Omit<TransporterClientRecord, 'id' | 'transporterId'>[]
  ): Promise<{ imported: number; updated: number }> {
    let imported = 0;
    let updated = 0;
    if (!clientsList || clientsList.length === 0) {
      return { imported: 0, updated: 0 };
    }

    try {
      for (const c of clientsList) {
        if (!c.lastName || !c.firstName) continue;
        const res = await this.saveClient(transporterId, c);
        if (res) {
          imported++;
        }
      }
    } catch (err) {
      console.error('[transporterFleetService] batchImportClients error:', err);
    }

    return { imported, updated };
  },
};
