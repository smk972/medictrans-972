import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { HealthcareFacility, MARTINIQUE_HEALTHCARE_FACILITIES } from '../data/facilities';

export interface AddressSuggestion {
  id: string;
  label: string;
  secondaryText?: string;
  address: string;
  city: string;
  postalCode?: string;
  type: 'FACILITY' | 'GOOGLE_MAPS' | 'BAN_ADDRESS' | 'MANUAL';
  facility?: HealthcareFacility;
  categoryLabel?: string;
  coordinates?: { lat: number; lng: number };
}

// Bounds Martinique 972
const MARTINIQUE_BOUNDS = {
  north: 14.92,
  south: 14.38,
  west: -61.25,
  east: -60.78,
};

let googleMapsConfigured = false;

function initGoogleMapsConfig(): boolean {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return false;
  }
  if (!googleMapsConfigured) {
    try {
      setOptions({
        key: apiKey,
        v: 'weekly',
        language: 'fr',
        region: 'MQ',
      });
      googleMapsConfigured = true;
    } catch {
      return false;
    }
  }
  return true;
}

export const addressService = {
  // Recherche d'établissements de santé locaux en Martinique
  searchFacilities(query: string, categoryFilter?: string): AddressSuggestion[] {
    const q = query.trim().toLowerCase();
    let facilities = MARTINIQUE_HEALTHCARE_FACILITIES;

    if (categoryFilter && categoryFilter !== 'ALL') {
      facilities = facilities.filter(f => f.category === categoryFilter);
    }

    if (!q) {
      return facilities.slice(0, 10).map(f => ({
        id: `fac-${f.id}`,
        label: f.name,
        secondaryText: `${f.city} • ${f.address}`,
        address: `${f.name}, ${f.address}`,
        city: f.city,
        postalCode: f.postalCode,
        type: 'FACILITY',
        facility: f,
        categoryLabel: f.categoryLabel,
      }));
    }

    return facilities
      .filter(f => 
        f.name.toLowerCase().includes(q) ||
        (f.shortName && f.shortName.toLowerCase().includes(q)) ||
        f.city.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.categoryLabel.toLowerCase().includes(q)
      )
      .slice(0, 8)
      .map(f => ({
        id: `fac-${f.id}`,
        label: f.name,
        secondaryText: `${f.city} (${f.postalCode}) • ${f.ambulanceAccessNotes}`,
        address: `${f.name}, ${f.address}, ${f.postalCode} ${f.city}`,
        city: f.city,
        postalCode: f.postalCode,
        type: 'FACILITY',
        facility: f,
        categoryLabel: f.categoryLabel,
      }));
  },

  // Recherche via l'API Base Adresse Nationale (France & Martinique 972)
  async searchBanAddresses(query: string): Promise<AddressSuggestion[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Détecter un éventuel code postal à 5 chiffres dans la saisie (ex: 97200, 97232)
      const zipMatch = trimmed.match(/\b(97\d{3}|\d{5})\b/);
      const zipParam = zipMatch ? `&postcode=${zipMatch[1]}` : '';

      // Requête priorisée géographiquement sur la Martinique (lat 14.616, lon -61.058)
      const primaryUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
        trimmed
      )}&lat=14.616&lon=-61.058&limit=8${zipParam}`;

      const primaryPromise = fetch(primaryUrl, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : { features: [] }))
        .catch(() => ({ features: [] }));

      // Si la requête ne mentionne pas déjà Martinique ou 972, requêter également avec 'Martinique'
      const shouldQueryMartiniqueExplicit =
        !trimmed.toLowerCase().includes('martinique') && !trimmed.includes('972');

      const secondaryPromise = shouldQueryMartiniqueExplicit
        ? fetch(
            `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
              `${trimmed} Martinique`
            )}&limit=5`,
            { signal: controller.signal }
          )
            .then((res) => (res.ok ? res.json() : { features: [] }))
            .catch(() => ({ features: [] }))
        : Promise.resolve({ features: [] });

      const [primaryData, secondaryData] = await Promise.all([primaryPromise, secondaryPromise]);
      clearTimeout(timeoutId);

      const allFeatures = [
        ...(primaryData.features || []),
        ...(secondaryData.features || []),
      ];

      if (allFeatures.length === 0) return [];

      const seenIds = new Set<string>();
      const results: AddressSuggestion[] = [];

      for (const item of allFeatures) {
        const props = item.properties || {};
        const id = props.id || props.banId || `${props.label}-${props.postcode}`;
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const isMartinique =
          props.postcode?.startsWith('972') ||
          props.context?.includes('972') ||
          props.context?.toLowerCase().includes('martinique') ||
          props.city?.toLowerCase().includes('martinique');

        const coords = item.geometry?.coordinates;

        results.push({
          id: `ban-${id}`,
          label: props.label || props.name,
          secondaryText: `${props.postcode || ''} ${props.city || ''} • Base Adresse Nationale`,
          address: props.label || `${props.name}, ${props.postcode || ''} ${props.city || ''}`,
          city: props.city || 'Martinique',
          postalCode: props.postcode,
          type: 'BAN_ADDRESS',
          categoryLabel: isMartinique ? 'Base Adresse Nationale (972)' : 'Base Adresse Nationale',
          coordinates: coords ? { lng: coords[0], lat: coords[1] } : undefined,
        });
      }

      // Trier : Martinique (972) en premier, puis pertinence
      results.sort((a, b) => {
        const aIs972 = a.postalCode?.startsWith('972') ? 1 : 0;
        const bIs972 = b.postalCode?.startsWith('972') ? 1 : 0;
        return bIs972 - aIs972;
      });

      return results.slice(0, 8);
    } catch (err) {
      console.warn('BAN address search error:', err);
      return [];
    }
  },

  // Recherche via Google Maps Platform (Places Autocomplete) si une clé est configurée
  async searchGoogleMaps(query: string): Promise<AddressSuggestion[]> {
    if (!initGoogleMapsConfig() || !query || query.trim().length < 2) return [];

    try {
      const placesLib = (await importLibrary('places')) as any;
      const coreLib = (await importLibrary('core')) as any;

      return new Promise<AddressSuggestion[]>((resolve) => {
        const service = new placesLib.AutocompleteService();
        service.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: ['mq', 'fr'] },
            locationBias: new coreLib.LatLngBounds(
              new coreLib.LatLng(MARTINIQUE_BOUNDS.south, MARTINIQUE_BOUNDS.west),
              new coreLib.LatLng(MARTINIQUE_BOUNDS.north, MARTINIQUE_BOUNDS.east)
            ),
          },
          (predictions: any[] | null, status: any) => {
            if (status !== 'OK' || !predictions) {
              resolve([]);
              return;
            }

            const results: AddressSuggestion[] = predictions.map((p: any) => ({
              id: `gmaps-${p.place_id}`,
              label: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || 'Martinique',
              address: p.description,
              city: p.structured_formatting?.secondary_text?.split(',')[0]?.trim() || 'Martinique',
              type: 'GOOGLE_MAPS' as const,
              categoryLabel: 'Google Maps 972',
            }));
            resolve(results);
          }
        );
      });
    } catch (err) {
      console.warn('Google Maps Autocomplete failed, falling back to BAN:', err);
      return [];
    }
  },

  // Recherche combinée et dédupliquée
  async searchCombined(
    query: string,
    options: {
      includeFacilities?: boolean;
      categoryFilter?: string;
    } = { includeFacilities: true }
  ): Promise<AddressSuggestion[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return options.includeFacilities !== false ? this.searchFacilities('', options.categoryFilter) : [];
    }

    const promises: Promise<AddressSuggestion[]>[] = [];

    // 1. Établissements de soins internes
    if (options.includeFacilities !== false) {
      promises.push(Promise.resolve(this.searchFacilities(trimmed, options.categoryFilter)));
    }

    // 2. Google Maps (si clé dispo)
    if (initGoogleMapsConfig()) {
      promises.push(this.searchGoogleMaps(trimmed));
    }

    // 3. Base Adresse Nationale (couverture 100% rues et communes 972)
    promises.push(this.searchBanAddresses(trimmed));

    const resultsArray = await Promise.all(promises);
    const combined = resultsArray.flat();

    // Dédupliquer par libellé d'adresse
    const seen = new Set<string>();
    const unique: AddressSuggestion[] = [];

    for (const item of combined) {
      const key = item.label.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    return unique.slice(0, 10);
  },

  // Géolocalisation de l'utilisateur avec résolution d'adresse
  async getCurrentPositionAddress(): Promise<{ address: string; city: string } | null> {
    if (!navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}`
            );
            if (res.ok) {
              const data = await res.json();
              const feature = data.features?.[0];
              if (feature?.properties) {
                resolve({
                  address: feature.properties.label || `${feature.properties.name}, ${feature.properties.city}`,
                  city: feature.properties.city || 'Fort-de-France',
                });
                return;
              }
            }
          } catch (e) {
            console.warn('Reverse geocoding error:', e);
          }
          resolve({
            address: 'Position actuelle (Martinique)',
            city: 'Fort-de-France',
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  },

  // Récupérer tous les établissements
  getAllFacilities(): HealthcareFacility[] {
    return MARTINIQUE_HEALTHCARE_FACILITIES;
  },
};
