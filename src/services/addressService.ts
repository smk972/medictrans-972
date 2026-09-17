import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { HealthcareFacility, MARTINIQUE_HEALTHCARE_FACILITIES, FRENCH_HEALTHCARE_FACILITIES } from '../data/facilities';

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

export interface AddressSearchOptions {
  includeFacilities?: boolean;
  categoryFilter?: string;
  referenceAddress?: string;
}

// Coordonnées de référence par département ou territoire pour centrer les recherches
const DEPARTMENT_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  // Occitanie / Toulouse
  '31': { lat: 43.6047, lng: 1.4442, name: 'Haute-Garonne (Toulouse)' },
  '34': { lat: 43.6108, lng: 3.8767, name: 'Hérault (Montpellier)' },
  // Île-de-France / Paris
  '75': { lat: 48.8566, lng: 2.3522, name: 'Paris (75)' },
  '92': { lat: 48.8924, lng: 2.2153, name: 'Hauts-de-Seine (92)' },
  '93': { lat: 48.9137, lng: 2.4846, name: 'Seine-Saint-Denis (93)' },
  '94': { lat: 48.7904, lng: 2.4556, name: 'Val-de-Marne (94)' },
  '77': { lat: 48.6056, lng: 2.8962, name: 'Seine-et-Marne (77)' },
  '78': { lat: 48.8049, lng: 2.1204, name: 'Yvelines (78)' },
  '91': { lat: 48.5323, lng: 2.2562, name: 'Essonne (91)' },
  '95': { lat: 49.0722, lng: 2.1386, name: "Val-d'Oise (95)" },
  // Auvergne-Rhône-Alpes / Lyon
  '69': { lat: 45.7640, lng: 4.8357, name: 'Rhône (Lyon)' },
  '38': { lat: 45.1885, lng: 5.7245, name: 'Isère (Grenoble)' },
  // PACA / Marseille / Nice
  '13': { lat: 43.2965, lng: 5.3698, name: 'Bouches-du-Rhône (Marseille)' },
  '06': { lat: 43.7102, lng: 7.2620, name: 'Alpes-Maritimes (Nice)' },
  // Nouvelle-Aquitaine / Bordeaux
  '33': { lat: 44.8378, lng: -0.5792, name: 'Gironde (Bordeaux)' },
  // Hauts-de-France / Lille
  '59': { lat: 50.6292, lng: 3.0573, name: 'Nord (Lille)' },
  '62': { lat: 50.5000, lng: 2.6000, name: 'Pas-de-Calais' },
  // Pays de la Loire / Nantes
  '44': { lat: 47.2184, lng: -1.5536, name: 'Loire-Atlantique (Nantes)' },
  // Bretagne / Rennes
  '35': { lat: 48.1173, lng: -1.6778, name: 'Ille-et-Vilaine (Rennes)' },
  // Grand Est / Strasbourg
  '67': { lat: 48.5734, lng: 7.7521, name: 'Bas-Rhin (Strasbourg)' },
  // DOM
  '971': { lat: 16.2411, lng: -61.5331, name: 'Guadeloupe (971)' },
  '972': { lat: 14.6161, lng: -61.0588, name: 'Martinique (972)' },
  '973': { lat: 4.9372, lng: -52.3260, name: 'Guyane (973)' },
  '974': { lat: -20.8789, lng: 55.4481, name: 'La Réunion (974)' },
  '976': { lat: -12.7806, lng: 45.2278, name: 'Mayotte (976)' },
};

/**
 * Normalise un texte (sans accents, sans ponctuation inutile, en minuscules)
 */
function normalizeStr(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_'/.,]/g, ' ')
    .trim();
}

/**
 * Détecte le département officiel ou code postal depuis une adresse ou commune
 */
export function extractDepartmentFromAddress(address: string): string | null {
  if (!address) return null;
  const str = address.trim();

  // 1. Code postal à 5 chiffres explicite
  const zipMatch = str.match(/\b(97[1-8]|2[ABab]|0[1-9]|[1-8]\d|9[0-5])(\d{3})\b/);
  if (zipMatch) {
    const code = zipMatch[1];
    return code.startsWith('97') ? code : code.toUpperCase();
  }

  // 2. Détection par nom de commune ou zone majeure
  const norm = normalizeStr(str);
  if (norm.includes('toulouse') || norm.includes('blagnac') || norm.includes('purpan') || norm.includes('colomiers') || norm.includes('rangueil')) return '31';
  if (norm.includes('paris') || norm.includes('salpetriere') || norm.includes('necker') || norm.includes('hegp') || norm.includes('bichat')) return '75';
  if (norm.includes('lyon') || norm.includes('villeurbanne') || norm.includes('herriot')) return '69';
  if (norm.includes('marseille') || norm.includes('timone') || norm.includes('aix')) return '13';
  if (norm.includes('bordeaux') || norm.includes('pellegrin') || norm.includes('merignac')) return '33';
  if (norm.includes('nantes')) return '44';
  if (norm.includes('lille')) return '59';
  if (norm.includes('strasbourg') || norm.includes('hautepierre')) return '67';
  if (norm.includes('rennes') || norm.includes('pontchaillou')) return '35';
  if (norm.includes('montpellier') || norm.includes('lapeyronie')) return '34';
  if (norm.includes('nice') || norm.includes('pasteur')) return '06';

  // DOM
  if (norm.includes('martinique') || norm.includes('fort de france') || norm.includes('lamentin') || norm.includes('schoelcher') || norm.includes('zobda') || norm.includes('trinite') || norm.includes('marin')) return '972';
  if (norm.includes('guadeloupe') || norm.includes('pointe a pitre') || norm.includes('abymes') || norm.includes('basse terre')) return '971';
  if (norm.includes('guyane') || norm.includes('cayenne') || norm.includes('kourou')) return '973';
  if (norm.includes('reunion') || norm.includes('saint denis') || norm.includes('saint paul') || norm.includes('saint pierre')) return '974';
  if (norm.includes('mayotte') || norm.includes('mamoudzou')) return '976';

  return null;
}

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
        region: 'FR',
      });
      googleMapsConfigured = true;
    } catch {
      return false;
    }
  }
  return true;
}

export const addressService = {
  /**
   * Recherche multi-critères des établissements de santé
   * Priorise automatiquement les établissements du même département que l'adresse de référence
   */
  searchFacilities(query: string, options?: AddressSearchOptions | string): AddressSuggestion[] {
    const opts: AddressSearchOptions = typeof options === 'string' ? { categoryFilter: options } : (options || {});
    const q = query.trim();
    const qNorm = normalizeStr(q);
    const tokens = qNorm.split(/\s+/).filter(Boolean);

    let facilities = FRENCH_HEALTHCARE_FACILITIES;

    const validCategories = ['HOSPITAL', 'CLINIC', 'DIALYSIS', 'SSR', 'ONCOLOGY', 'EHPAD', 'CABINET'];
    if (opts.categoryFilter && opts.categoryFilter !== 'ALL' && opts.categoryFilter !== 'etablissement' && validCategories.includes(opts.categoryFilter)) {
      facilities = facilities.filter(f => f.category === opts.categoryFilter);
    }

    const refDept = extractDepartmentFromAddress(opts.referenceAddress || '');

    // Si aucune saisie, retourner les établissements concordants avec le lieu du départ (ou grands CHU nationaux)
    if (!q) {
      const sorted = [...facilities].sort((a, b) => {
        const aDept = a.postalCode.startsWith('97') ? a.postalCode.slice(0, 3) : a.postalCode.slice(0, 2);
        const bDept = b.postalCode.startsWith('97') ? b.postalCode.slice(0, 3) : b.postalCode.slice(0, 2);

        if (refDept) {
          const aMatch = aDept === refDept ? 1 : 0;
          const bMatch = bDept === refDept ? 1 : 0;
          if (aMatch !== bMatch) return bMatch - aMatch;
        }
        return 0;
      });

      return sorted.slice(0, 10).map(f => {
        const dept = f.postalCode.startsWith('97') ? f.postalCode.slice(0, 3) : f.postalCode.slice(0, 2);
        return {
          id: `fac-${f.id}`,
          label: f.name,
          secondaryText: `${f.city} (${f.postalCode}) • ${f.ambulanceAccessNotes || f.address}`,
          address: `${f.name}, ${f.address}, ${f.postalCode} ${f.city}`,
          city: f.city,
          postalCode: f.postalCode,
          type: 'FACILITY',
          facility: f,
          categoryLabel: `${f.categoryLabel} (${dept})`,
        };
      });
    }

    // Filtrage multi-mots clés souple : chaque token de la saisie doit être présent dans le descriptif de l'établissement
    const matched = facilities.filter(f => {
      const target = normalizeStr(
        `${f.name} ${f.shortName || ''} ${f.city} ${f.address} ${f.postalCode} ${f.categoryLabel}`
      );
      return tokens.every(token => target.includes(token));
    });

    // Trier par pertinence et concordance géographique avec l'adresse du patient
    matched.sort((a, b) => {
      const aDept = a.postalCode.startsWith('97') ? a.postalCode.slice(0, 3) : a.postalCode.slice(0, 2);
      const bDept = b.postalCode.startsWith('97') ? b.postalCode.slice(0, 3) : b.postalCode.slice(0, 2);

      // 1. Bonus fort de proximité si même département que l'adresse entrée
      if (refDept) {
        const aMatch = aDept === refDept ? 10 : 0;
        const bMatch = bDept === refDept ? 10 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }

      // 2. Correspondance exacte du nom ou nom court
      const aNameNorm = normalizeStr(a.name);
      const bNameNorm = normalizeStr(b.name);
      const aExact = aNameNorm.includes(qNorm) ? 5 : 0;
      const bExact = bNameNorm.includes(qNorm) ? 5 : 0;
      if (aExact !== bExact) return bExact - aExact;

      return 0;
    });

    return matched.slice(0, 8).map(f => {
      const dept = f.postalCode.startsWith('97') ? f.postalCode.slice(0, 3) : f.postalCode.slice(0, 2);
      return {
        id: `fac-${f.id}`,
        label: f.name,
        secondaryText: `${f.city} (${f.postalCode}) • ${f.ambulanceAccessNotes || f.address}`,
        address: `${f.name}, ${f.address}, ${f.postalCode} ${f.city}`,
        city: f.city,
        postalCode: f.postalCode,
        type: 'FACILITY',
        facility: f,
        categoryLabel: `${f.categoryLabel} (${dept})`,
      };
    });
  },

  /**
   * Recherche via l'API officielle Base Adresse Nationale (data.gouv.fr)
   * Prise en compte de la concordance territoriale avec le point de départ
   */
  async searchBanAddresses(query: string, referenceAddress?: string): Promise<AddressSuggestion[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Détecter un code postal explicite dans la requête ou dans l'adresse de référence
      const queryZipMatch = trimmed.match(/\b(97\d{3}|\d{5})\b/);
      const refDept = extractDepartmentFromAddress(referenceAddress || '');

      let url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(trimmed)}&limit=10`;

      if (queryZipMatch) {
        url += `&postcode=${queryZipMatch[1]}`;
      } else if (refDept && DEPARTMENT_COORDINATES[refDept]) {
        // Centrer la recherche autour du secteur géographique de l'adresse de référence
        const coords = DEPARTMENT_COORDINATES[refDept];
        url += `&lat=${coords.lat}&lon=${coords.lng}`;
      }

      const res = await fetch(url, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { features: [] }))
        .catch(() => ({ features: [] }));

      clearTimeout(timeoutId);

      const features = res.features || [];
      if (features.length === 0) return [];

      const results: AddressSuggestion[] = [];
      const seenIds = new Set<string>();

      for (const item of features) {
        const props = item.properties || {};
        const id = props.id || props.banId || `${props.label}-${props.postcode}`;
        if (seenIds.has(id)) continue;
        seenIds.add(id);

        const postcode = props.postcode || '';
        const dept = postcode.startsWith('97') ? postcode.slice(0, 3) : postcode.slice(0, 2);
        const coords = item.geometry?.coordinates;

        // Contexte territorial fidèle (ex: 31, Haute-Garonne, Occitanie ou 972, Martinique)
        const contextText = props.context || (dept ? `Dépt ${dept}` : '');
        const secondary = [postcode, props.city, contextText].filter(Boolean).join(' • ');

        results.push({
          id: `ban-${id}`,
          label: props.label || props.name,
          secondaryText: secondary,
          address: props.label || `${props.name}, ${postcode} ${props.city || ''}`,
          city: props.city || '',
          postalCode: postcode,
          type: 'BAN_ADDRESS',
          categoryLabel: dept ? `${dept} • ${props.city || 'Adresse'}` : 'Adresse',
          coordinates: coords ? { lng: coords[0], lat: coords[1] } : undefined,
        });
      }

      // Trier : donner priorité aux adresses du même département que l'adresse renseignée
      if (refDept) {
        results.sort((a, b) => {
          const aMatch = (a.postalCode?.startsWith(refDept) || a.secondaryText?.includes(refDept)) ? 1 : 0;
          const bMatch = (b.postalCode?.startsWith(refDept) || b.secondaryText?.includes(refDept)) ? 1 : 0;
          return bMatch - aMatch;
        });
      }

      return results.slice(0, 8);
    } catch (err) {
      console.warn('BAN address search error:', err);
      return [];
    }
  },

  /**
   * Recherche via Google Maps Platform (Places Autocomplete)
   */
  async searchGoogleMaps(query: string, referenceAddress?: string): Promise<AddressSuggestion[]> {
    if (!initGoogleMapsConfig() || !query || query.trim().length < 2) return [];

    try {
      const placesLib = (await importLibrary('places')) as any;
      const coreLib = (await importLibrary('core')) as any;

      const refDept = extractDepartmentFromAddress(referenceAddress || '');
      const refCoords = refDept ? DEPARTMENT_COORDINATES[refDept] : undefined;

      return new Promise<AddressSuggestion[]>((resolve) => {
        const service = new placesLib.AutocompleteService();
        const requestOptions: any = {
          input: query,
          componentRestrictions: { country: ['fr', 'mq', 'gp', 'gf', 're', 'yt'] },
        };

        if (refCoords) {
          requestOptions.locationBias = new coreLib.LatLng(refCoords.lat, refCoords.lng);
        }

        service.getPlacePredictions(
          requestOptions,
          (predictions: any[] | null, status: any) => {
            if (status !== 'OK' || !predictions) {
              resolve([]);
              return;
            }

            const results: AddressSuggestion[] = predictions.map((p: any) => {
              const sec = p.structured_formatting?.secondary_text || '';
              return {
                id: `gmaps-${p.place_id}`,
                label: p.structured_formatting?.main_text || p.description,
                secondaryText: sec,
                address: p.description,
                city: sec.split(',')[0]?.trim() || '',
                type: 'GOOGLE_MAPS' as const,
                categoryLabel: 'Google Maps',
              };
            });
            resolve(results);
          }
        );
      });
    } catch (err) {
      console.warn('Google Maps Autocomplete failed, falling back to BAN:', err);
      return [];
    }
  },

  /**
   * Recherche combinée et dédupliquée en temps réel
   */
  async searchCombined(
    query: string,
    options: AddressSearchOptions = { includeFacilities: true }
  ): Promise<AddressSuggestion[]> {
    const trimmed = query.trim();

    if (!trimmed) {
      return options.includeFacilities !== false 
        ? this.searchFacilities('', options) 
        : [];
    }

    const promises: Promise<AddressSuggestion[]>[] = [];

    // 1. Établissements de santé nationaux et régionaux
    if (options.includeFacilities !== false) {
      promises.push(Promise.resolve(this.searchFacilities(trimmed, options)));
    }

    // 2. Google Maps Places (si API configurée)
    if (initGoogleMapsConfig()) {
      promises.push(this.searchGoogleMaps(trimmed, options.referenceAddress));
    }

    // 3. Base Adresse Nationale (couverture 100% France Métropolitaine & DOM)
    promises.push(this.searchBanAddresses(trimmed, options.referenceAddress));

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

  /**
   * Géolocalisation de l'utilisateur avec géocodage inversé précis
   */
  async getCurrentPositionAddress(): Promise<{ address: string; city: string; postalCode?: string } | null> {
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
                  city: feature.properties.city || '',
                  postalCode: feature.properties.postcode,
                });
                return;
              }
            }
          } catch (e) {
            console.warn('Reverse geocoding error:', e);
          }
          resolve({
            address: 'Position actuelle (GPS)',
            city: '',
          });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  },

  getAllFacilities(): HealthcareFacility[] {
    return FRENCH_HEALTHCARE_FACILITIES;
  },
};
