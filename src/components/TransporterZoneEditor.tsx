import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getGoogleMapsApi } from '../services/googleMapsLoader';
import {
  FRENCH_REGIONS,
  FrenchRegion,
  RegionCommune,
  InterventionZone,
  GeoPoint,
  fetchCommunesForRegion,
  calculateHaversineDistanceKm,
  generateInitialPolygon,
  saveTransporterZone,
  loadTransporterZone,
} from '../services/transporterZoneService';
import { reverseGeocode, searchNationalDatabase } from '../services/nationalGeoDatabase';

// Source: Google Maps Platform Code Assist
declare const google: any;

export interface TransporterZoneEditorProps {
  transporterId: string;
  initialBaseAddress?: string;
  initialCity?: string;
  initialZone?: InterventionZone | null;
  onSaved?: (zone: InterventionZone) => void;
  onClose?: () => void;
}

export const TransporterZoneEditor: React.FC<TransporterZoneEditorProps> = ({
  transporterId,
  initialBaseAddress = '',
  initialCity = '',
  initialZone = null,
  onSaved,
  onClose,
}) => {
  // 1. ÉTATS DE SÉLECTION DE RÉGION ET VILLE
  const [selectedRegion, setSelectedRegion] = useState<FrenchRegion>(() => {
    if (initialZone?.regionCode) {
      const match = FRENCH_REGIONS.find((r) => r.code === initialZone.regionCode);
      if (match) return match;
    }
    // Détection DROM par défaut si adresse contient 972/Martinique
    const addr = (initialBaseAddress + ' ' + initialCity).toLowerCase();
    if (addr.includes('972') || addr.includes('martinique')) {
      return FRENCH_REGIONS.find((r) => r.code === '02') || FRENCH_REGIONS[0];
    }
    if (addr.includes('971') || addr.includes('guadeloupe')) {
      return FRENCH_REGIONS.find((r) => r.code === '01') || FRENCH_REGIONS[0];
    }
    if (addr.includes('973') || addr.includes('guyane')) {
      return FRENCH_REGIONS.find((r) => r.code === '03') || FRENCH_REGIONS[0];
    }
    if (addr.includes('974') || addr.includes('réunion') || addr.includes('reunion')) {
      return FRENCH_REGIONS.find((r) => r.code === '04') || FRENCH_REGIONS[0];
    }
    if (addr.includes('976') || addr.includes('mayotte')) {
      return FRENCH_REGIONS.find((r) => r.code === '06') || FRENCH_REGIONS[0];
    }
    // Par défaut : Occitanie ou première région métropolitaine
    return FRENCH_REGIONS.find((r) => r.code === '76') || FRENCH_REGIONS[0];
  });

  const [communesList, setCommunesList] = useState<RegionCommune[]>([]);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity || 'Muret');
  const [cityInsee, setCityInsee] = useState<string | undefined>(initialZone?.cityInsee);

  // 2. POSITION DE LA BASE D'INTERVENTION
  const [baseCoords, setBaseCoords] = useState<GeoPoint>(() => {
    if (initialZone?.baseLat && initialZone?.baseLng) {
      return { lat: initialZone.baseLat, lng: initialZone.baseLng };
    }
    return { lat: 43.4608, lng: 1.3267 }; // Muret (Occitanie) par défaut
  });
  const [baseAddress, setBaseAddress] = useState<string>(
    initialZone?.baseAddress || initialBaseAddress || 'Muret, Occitanie'
  );
  const [baseSource, setBaseSource] = useState<'GPS' | 'ADDRESS' | 'MANUAL'>(
    initialZone?.baseSource || 'MANUAL'
  );
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // 3. ZONE D'ACTION : STRICTEMENT 8 POINTS D'ANCRAGE
  const [polygonCoords, setPolygonCoords] = useState<GeoPoint[]>(() => {
    if (initialZone?.polygonCoordinates && initialZone.polygonCoordinates.length === 8) {
      return initialZone.polygonCoordinates;
    }
    const base = (initialZone?.baseLat && initialZone?.baseLng)
      ? { lat: initialZone.baseLat, lng: initialZone.baseLng }
      : { lat: 43.4608, lng: 1.3267 };
    return generateInitialPolygon(base, 15, 8);
  });
  const [historyStack, setHistoryStack] = useState<GeoPoint[][]>([]);

  // 4. OFFRES ÉTENDUES (+30 KM DEPUIS LA BASE)
  const [allowExtendedRadius, setAllowExtendedRadius] = useState<boolean>(
    initialZone ? initialZone.allowExtendedRadius : true
  );

  // 5. ÉTAT DE SAUVEGARDE
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // RÉFÉRENCES GOOGLE MAPS
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const baseMarkerRef = useRef<any>(null);
  const polygonInstanceRef = useRef<any>(null);
  const extendedCircleRef = useRef<any>(null);
  const vertexMarkersRef = useRef<any[]>([]);
  const isInternalDragRef = useRef<boolean>(false);

  // Communes proches pour ancrage rapide
  const nearbyCommunes = React.useMemo(() => {
    if (!communesList.length) return [];
    return communesList
      .map((c) => ({
        ...c,
        distKm: calculateHaversineDistanceKm(baseCoords.lat, baseCoords.lng, c.lat, c.lng),
      }))
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 8);
  }, [communesList, baseCoords]);

  // Sauvegarde dans l'historique d'annulation
  const pushHistory = useCallback((newCoords: GeoPoint[]) => {
    setHistoryStack((prev) => [...prev.slice(-15), polygonCoords]);
    setPolygonCoords(newCoords);
  }, [polygonCoords]);

  // Chargement des communes à chaque changement de région
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingCommunes(true);

    fetchCommunesForRegion(selectedRegion.code)
      .then((communes) => {
        if (!isCancelled) {
          setCommunesList(communes);
          setIsLoadingCommunes(false);

          // Si la commune actuelle n'est pas dans la nouvelle région, choisir la 1ère
          const found = communes.find((c) => c.name.toLowerCase() === selectedCity.toLowerCase());
          if (found) {
            setCityInsee(found.insee);
          } else if (communes.length > 0) {
            const first = communes[0];
            setSelectedCity(first.name);
            setCityInsee(first.insee);
            setBaseCoords({ lat: first.lat, lng: first.lng });
            setBaseAddress(`${first.name} (${first.postalCode || selectedRegion.name})`);

            // Recentrer la carte
            if (mapInstanceRef.current) {
              mapInstanceRef.current.panTo({ lat: first.lat, lng: first.lng });
              mapInstanceRef.current.setZoom(12);
            }
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Erreur chargement communes:', err);
          setIsLoadingCommunes(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedRegion]);

  // Initialisation de la carte Google Maps
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    getGoogleMapsApi().then((mapsLib) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = new mapsLib.Map(mapContainerRef.current, {
          center: baseCoords,
          zoom: 12,
          mapTypeId: 'roadmap',
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: false,
          gestureHandling: 'greedy', // Très fluide sur tactile mobile
          zoomControl: true,
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
          ],
        });

        mapInstanceRef.current = map;

        // 1. MARQUEUR DE LA BASE D'INTERVENTION (Déplaçable au doigt/souris)
        const baseMarker = new google.maps.Marker({
          position: baseCoords,
          map: map,
          title: "Base d'intervention",
          draggable: true,
          optimized: false,
          zIndex: 9999,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 7,
            fillColor: '#dc2626',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        baseMarker.addListener('dragend', async (e: any) => {
          if (e.latLng) {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            setBaseCoords({ lat: newLat, lng: newLng });
            setBaseSource('MANUAL');

            // Reverse geocoding de la nouvelle position
            const rev = await reverseGeocode(newLng, newLat);
            if (rev) {
              setBaseAddress(rev.label || `${rev.city} (${rev.postalCode})`);
              if (rev.city) setSelectedCity(rev.city);
            } else {
              setBaseAddress(`Position manuelle (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`);
            }
          }
        });

        baseMarkerRef.current = baseMarker;

        // 2. CERCLE POINTILLÉ DU RAYON SUPPLÉMENTAIRE (30 KM STRICTEMENT DEPUIS LA BASE)
        const extendedCircle = new google.maps.Circle({
          center: baseCoords,
          radius: 30000, // 30 km en mètres
          map: allowExtendedRadius ? map : null,
          strokeColor: '#f59e0b',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#fef3c7',
          fillOpacity: 0.12,
          clickable: false,
          zIndex: 1,
        });
        extendedCircleRef.current = extendedCircle;

        // 3. POLYGONE DE LA ZONE D'ACTION (ÉDITÉ STRICTEMENT VIA LES 8 ANCRES DÉPLAÇABLES)
        const poly = new google.maps.Polygon({
          paths: polygonCoords,
          map: map,
          strokeColor: '#0284c7',
          strokeOpacity: 0.95,
          strokeWeight: 3,
          fillColor: '#0ea5e9',
          fillOpacity: 0.22,
          clickable: false,
          editable: false, // Strictement 8 ancres : désactive les poignées intermédiaires parasites de Google Maps
          draggable: false,
          zIndex: 10,
        });

        polygonInstanceRef.current = poly;
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Mise à jour de la position de la base sur la carte
  useEffect(() => {
    if (baseMarkerRef.current) {
      baseMarkerRef.current.setPosition(baseCoords);
    }
    if (extendedCircleRef.current) {
      extendedCircleRef.current.setCenter(baseCoords);
      extendedCircleRef.current.setMap(allowExtendedRadius ? mapInstanceRef.current : null);
    }
  }, [baseCoords, allowExtendedRadius]);

  // Synchronisation des 8 marqueurs d'ancrage déplaçables et du tracé du polygone
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // S'assurer de manipuler strictement 8 points
    let points = polygonCoords;
    if (points.length !== 8) {
      points = generateInitialPolygon(baseCoords, 15, 8);
      setPolygonCoords(points);
      return;
    }

    // Mise à jour du polygone s'il n'est pas en cours de glissement direct
    if (polygonInstanceRef.current && !isInternalDragRef.current) {
      polygonInstanceRef.current.setPaths(points);
    }

    // Création initiale des 8 marqueurs d'ancrage
    if (vertexMarkersRef.current.length !== 8) {
      vertexMarkersRef.current.forEach((m) => m.setMap(null));
      vertexMarkersRef.current = [];

      points.forEach((pt, idx) => {
        const marker = new google.maps.Marker({
          position: pt,
          map: map,
          draggable: true,
          optimized: false,
          zIndex: 2000 + idx,
          cursor: 'grab',
          title: `Point d'ancrage #${idx + 1} (glisser pour délimiter)`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#2563eb', // Bleu royal éclatant
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2.5,
          },
        });

        // Mise à jour fluide du tracé en temps réel pendant le glissement de l'ancre
        marker.addListener('drag', (e: any) => {
          if (!e.latLng || !polygonInstanceRef.current) return;
          isInternalDragRef.current = true;
          const currentPath = polygonInstanceRef.current.getPath();
          currentPath.setAt(idx, e.latLng);
        });

        // Enregistrement de la position finale au relâchement
        marker.addListener('dragend', (e: any) => {
          isInternalDragRef.current = false;
          if (!e.latLng) return;
          const newPt: GeoPoint = {
            lat: Number(e.latLng.lat().toFixed(6)),
            lng: Number(e.latLng.lng().toFixed(6)),
          };
          setPolygonCoords((prev) => {
            const next = [...prev];
            next[idx] = newPt;
            setHistoryStack((old) => [...old.slice(-15), prev]);
            return next;
          });
        });

        vertexMarkersRef.current.push(marker);
      });
    } else {
      // Les 8 marqueurs existent déjà : synchroniser leurs positions si pas de drag en cours
      if (!isInternalDragRef.current) {
        points.forEach((pt, idx) => {
          const m = vertexMarkersRef.current[idx];
          if (m) {
            m.setPosition(pt);
          }
        });
      }
    }
  }, [polygonCoords, baseCoords]);

  // Nettoyage des 8 marqueurs lors du démontage du composant
  useEffect(() => {
    return () => {
      vertexMarkersRef.current.forEach((m) => m.setMap(null));
      vertexMarkersRef.current = [];
    };
  }, []);

  // GÉOLOCALISATION GPS DU TRANSPORTEUR
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setErrorMessage("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsGeolocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setBaseCoords({ lat, lng });
        setBaseSource('GPS');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(13);
        }

        // Reverse Geocode
        const rev = await reverseGeocode(lng, lat);
        if (rev) {
          setBaseAddress(rev.label || `${rev.city} (${rev.postalCode})`);
          if (rev.city) setSelectedCity(rev.city);
          if (rev.departmentCode) {
            // Trouver la région correspondante
            const reg = FRENCH_REGIONS.find((r) => {
              if (rev.departmentCode.startsWith('971')) return r.code === '01';
              if (rev.departmentCode.startsWith('972')) return r.code === '02';
              if (rev.departmentCode.startsWith('973')) return r.code === '03';
              if (rev.departmentCode.startsWith('974')) return r.code === '04';
              if (rev.departmentCode.startsWith('976')) return r.code === '06';
              return false;
            });
            if (reg) setSelectedRegion(reg);
          }
        } else {
          setBaseAddress(`Position GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }

        setIsGeolocating(false);
      },
      (err) => {
        console.warn('Erreur géolocalisation:', err);
        setErrorMessage("Impossible d'obtenir votre position GPS. Veuillez sélectionner votre ville manuellement.");
        setIsGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // RECHERCHE D'ADRESSE
  const handleAddressSearch = async (val: string) => {
    setAddressQuery(val);
    if (val.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    setIsSearchingAddress(true);
    const results = await searchNationalDatabase(val);
    setAddressSuggestions(results);
    setIsSearchingAddress(false);
  };

  const selectAddressSuggestion = (item: any) => {
    const lat = item.coordinates[1];
    const lng = item.coordinates[0];
    setBaseCoords({ lat, lng });
    setBaseAddress(item.name);
    setBaseSource('ADDRESS');
    setAddressQuery('');
    setAddressSuggestions([]);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat, lng });
      mapInstanceRef.current.setZoom(13);
    }
  };

  // CHANGEMENT DE VILLE
  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    const match = communesList.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
    if (match) {
      setCityInsee(match.insee);
      const newBase = { lat: match.lat, lng: match.lng };
      setBaseCoords(newBase);
      setBaseAddress(`${match.name} (${match.postalCode || selectedRegion.name})`);
      setBaseSource('MANUAL');

      // Déplacer la carte et régénérer un polygone centré si vide
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newBase);
        mapInstanceRef.current.setZoom(12);
      }
      if (polygonCoords.length !== 8) {
        setPolygonCoords(generateInitialPolygon(newBase, 15, 8));
      }
    }
  };

  // ANNULER (UNDO)
  const handleUndo = () => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack((old) => old.slice(0, -1));
      setPolygonCoords(prev);
    }
  };

  // EFFACER LA ZONE / RÉINITIALISER LES 8 ANCRES
  const handleResetZone = () => {
    pushHistory(polygonCoords);
    setPolygonCoords(generateInitialPolygon(baseCoords, 15, 8));
  };

  // PRÉRÉGLER LE RAYON DES 8 ANCRES (10, 15, 25, 40 KM)
  const handleSetRadius = (radiusKm: number) => {
    pushHistory(polygonCoords);
    const newCoords = generateInitialPolygon(baseCoords, radiusKm, 8);
    setPolygonCoords(newCoords);
  };

  // ANCRER UNE COMMUNE PROCHE SUR L'ANCRE LA PLUS PROCHE (MAINTIENT STRICTEMENT 8 ANCRES)
  const handleSnapClosestAnchorToCommune = (commune: RegionCommune) => {
    const communePt: GeoPoint = { lat: commune.lat, lng: commune.lng };
    let closestIdx = 0;
    let minDistance = Infinity;

    polygonCoords.forEach((pt, idx) => {
      const d = calculateHaversineDistanceKm(pt.lat, pt.lng, communePt.lat, communePt.lng);
      if (d < minDistance) {
        minDistance = d;
        closestIdx = idx;
      }
    });

    const next = [...polygonCoords];
    next[closestIdx] = communePt;
    pushHistory(next);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(communePt);
    }
  };

  // SAUVEGARDE DANS SUPABASE
  const handleSave = async () => {
    if (polygonCoords.length < 3) {
      setErrorMessage('Veuillez définir un polygone valide comportant au minimum 3 sommets.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    const zoneData: InterventionZone = {
      transporterId,
      regionCode: selectedRegion.code,
      regionName: selectedRegion.name,
      cityName: selectedCity,
      cityInsee: cityInsee,
      baseAddress: baseAddress || selectedCity,
      baseLat: baseCoords.lat,
      baseLng: baseCoords.lng,
      baseSource,
      polygonCoordinates: polygonCoords,
      allowExtendedRadius,
      extendedRadiusKm: 30, // 30 km fixe
    };

    try {
      const saved = await saveTransporterZone(zoneData);
      setIsSaving(false);
      setSaveSuccessMessage('✓ Vos zones d’intervention ont été enregistrées avec succès.');
      if (onSaved) onSaved(saved);

      setTimeout(() => {
        setSaveSuccessMessage(null);
        if (onClose) onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      setIsSaving(false);
      setErrorMessage(err.message || 'Une erreur est survenue lors de l’enregistrement.');
    }
  };

  return (
    <div className="bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-w-5xl mx-auto my-auto transition-all">
      {/* HEADER OFFICIEL COMPACT */}
      <div className="px-4 py-2.5 border-b border-outline-variant/20 bg-surface-container-low flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-black text-on-surface flex items-center gap-2">
            <span className="text-primary text-base sm:text-lg">🗺️</span>
            <span>MES ZONES D'INTERVENTION</span>
          </h2>
          <p className="text-[11px] text-on-surface-variant">
            Ajustez votre base et façonnez votre zone d'action interactivement.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            title="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto max-h-[88vh]">
        {/* MESSAGES D'ALERTE / SUCCÈS */}
        {saveSuccessMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 animate-fadeIn">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-300 font-bold text-xs flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 1 : 📍 MA BASE D'INTERVENTION (Ligne compacte)                   */}
        {/* ========================================================================= */}
        <div className="bg-surface-container-low/80 p-2.5 sm:p-3 rounded-xl border border-outline-variant/30 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-black text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-red-500 text-sm">📍</span>
              <span>1. MA BASE D'INTERVENTION</span>
            </h3>
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={isGeolocating}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-bold text-[11px] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isGeolocating ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="22" y1="12" x2="18" y2="12" />
                <line x1="6" y1="12" x2="2" y2="12" />
                <line x1="12" y1="6" x2="12" y2="2" />
                <line x1="12" y1="22" x2="12" y2="18" />
              </svg>
              <span>{isGeolocating ? 'Localisation...' : '📍 Me géolocaliser'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {/* Région */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-0.5">
                Région administrative
              </label>
              <select
                id="select-region"
                value={selectedRegion.code}
                onChange={(e) => {
                  const reg = FRENCH_REGIONS.find((r) => r.code === e.target.value);
                  if (reg) {
                    setSelectedRegion(reg);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.panTo(reg.defaultCenter);
                      mapInstanceRef.current.setZoom(reg.defaultZoom);
                    }
                  }
                }}
                className="w-full bg-surface-container rounded-lg border border-outline-variant/40 px-2.5 py-1.5 text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <optgroup label="France Métropolitaine (13)">
                  {FRENCH_REGIONS.filter((r) => !r.isDrom).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="DROM (5)">
                  {FRENCH_REGIONS.filter((r) => r.isDrom).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Ville */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-0.5">
                Ville de rattachement
              </label>
              <select
                id="select-city"
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={isLoadingCommunes}
                className="w-full bg-surface-container rounded-lg border border-outline-variant/40 px-2.5 py-1.5 text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-50"
              >
                {isLoadingCommunes ? (
                  <option>Chargement des communes...</option>
                ) : (
                  <>
                    {!communesList.some((c) => c.name.toLowerCase() === selectedCity.toLowerCase()) && (
                      <option value={selectedCity}>📍 {selectedCity}</option>
                    )}
                    {communesList.map((c) => (
                      <option key={c.insee} value={c.name}>
                        {c.name} {c.postalCode ? `(${c.postalCode})` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Adresse / GPS */}
            <div className="relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface-variant mb-0.5">
                Adresse ou repère précis
              </label>
              <input
                id="input-base-address"
                type="text"
                value={addressQuery || baseAddress}
                onChange={(e) => handleAddressSearch(e.target.value)}
                placeholder="Rechercher une adresse, rue..."
                className="w-full bg-surface-container rounded-lg border border-outline-variant/40 px-2.5 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {/* Suggestions d'adresses */}
              {addressSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface-container-high rounded-xl border border-outline-variant/40 shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                  {addressSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectAddressSuggestion(item)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary/10 transition-colors border-b border-outline-variant/20 last:border-0"
                    >
                      <div className="font-bold text-on-surface">{item.name}</div>
                      {item.departmentName && (
                        <div className="text-[10px] text-on-surface-variant">{item.departmentName}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2 : 🗺️ CARTE ET ZONE D'ACTION (STRICTEMENT 8 ANCRES)               */}
        {/* ========================================================================= */}
        <div className="bg-surface-container-low/80 p-2.5 sm:p-3 rounded-xl border border-outline-variant/30 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="text-primary text-sm">🗺️</span>
                <span>2. MA ZONE D'ACTION INTERACTIVE</span>
              </h3>
              <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  8 points d'ancrage déplaçables
                </span>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  8 ancres étirables
                </span>
              </p>
            </div>

            {/* BOÎTE D'ACTIONS */}
            <div className="flex items-center gap-1.5">
              {historyStack.length > 0 && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Annuler le dernier déplacement"
                >
                  <span>↩️</span>
                  <span>Annuler</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetZone}
                className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 border border-outline-variant/30 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title="Recentrer les 8 ancres à 15km autour de votre base"
              >
                <span>🔄</span>
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>

          {/* SÉLECTEUR DE RAYON INITIAL DES 8 ANCRES */}
          <div className="flex items-center justify-between gap-1.5 py-1 border-t border-b border-outline-variant/20 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="font-bold text-on-surface-variant">Zone :</span>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-black border border-primary/20">
                8 ancres
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-bold text-on-surface-variant">Rayon d'action :</span>
              {[10, 15, 25, 40].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleSetRadius(r)}
                  className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant hover:text-primary hover:border-primary/40 font-bold border border-outline-variant/30 transition-colors cursor-pointer"
                  title={`Formater les 8 ancres sur un cercle de ${r} km`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>

          {/* CONTENEUR DE CARTE GOOGLE MAPS : HAUTEUR COMPACTE ET OPTIMISÉE */}
          <div className="relative w-full h-[220px] sm:h-[260px] md:h-[275px] rounded-xl overflow-hidden border border-outline-variant/40 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* LÉGENDE RAPIDE & COMMUNES LIMITROPHES */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-on-surface-variant">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shrink-0 shadow-xs" />
                <span>8 ancres (glisser pour délimiter la zone)</span>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-red-700 dark:text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-white shrink-0 shadow-xs" />
                <span>Base départ (déplaçable)</span>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600 shrink-0 shadow-xs" />
                <span>Rayon +30km</span>
              </span>
            </div>

            {nearbyCommunes.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-bold text-on-surface-variant">Ancrer commune :</span>
                {nearbyCommunes.slice(0, 4).map((c) => (
                  <button
                    key={c.insee}
                    type="button"
                    onClick={() => handleSnapClosestAnchorToCommune(c)}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-container hover:bg-primary/15 hover:text-primary text-[10px] font-bold border border-outline-variant/30 transition-all cursor-pointer"
                    title={`Ajuster l'ancre la plus proche sur ${c.name} (${c.distKm.toFixed(0)} km)`}
                  >
                    <span className="text-primary font-bold">+</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3 : 📢 OFFRES AU-DELÀ DE MA ZONE (Ligne compacte)                 */}
        {/* ========================================================================= */}
        <div className="bg-surface-container-low/80 px-3 py-2 rounded-xl border border-outline-variant/30 flex items-center justify-between flex-wrap gap-2">
          <label htmlFor="checkbox-extended-radius" className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              id="checkbox-extended-radius"
              type="checkbox"
              checked={allowExtendedRadius}
              onChange={(e) => setAllowExtendedRadius(e.target.checked)}
              className="w-4 h-4 rounded border-outline-variant/50 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-on-surface">📢 Recevoir les offres au-delà de ma zone</span>
              <span className="text-on-surface-variant text-[11px] ml-1.5 hidden sm:inline">
                (Rayon étendu de 30 km autour de {selectedCity})
              </span>
            </div>
          </label>
          <div className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
            Fixe : +30 km
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOUTONS D'ACTION                                                         */}
        {/* ========================================================================= */}
        <div className="pt-1 flex items-center justify-end gap-2.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-bold text-xs transition-colors cursor-pointer"
            >
              Annuler
            </button>
          )}

          <button
            id="btn-save-transporter-zone"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>ENREGISTRER MES ZONES</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
