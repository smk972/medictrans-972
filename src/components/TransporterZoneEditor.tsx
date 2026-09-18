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
    return generateInitialPolygon(base, 25, 8);
  });
  const [historyStack, setHistoryStack] = useState<GeoPoint[][]>([]);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(25);

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
          disableDefaultUI: true, // Interface épurée, nous utilisons les contrôles personnalisés Stitch
          gestureHandling: 'greedy', // Très fluide sur tactile et souris
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5f5e0' }] },
            { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 100 }, { visibility: 'simplified' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bae6fd' }] },
          ],
        });

        mapInstanceRef.current = map;

        // 1. MARQUEUR DE LA BASE D'INTERVENTION (Déplaçable)
        const baseMarker = new google.maps.Marker({
          position: baseCoords,
          map: map,
          title: "Base d'intervention principale",
          draggable: true,
          optimized: false,
          zIndex: 9999,
          icon: {
            path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
            fillColor: '#e11d48', // Rouge rose contrasté
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 1.5,
            anchor: new google.maps.Point(12, 24),
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

        // 2. CERCLE DU RAYON ÉTENDU (+30 KM STRICTEMENT DEPUIS LA BASE)
        const extendedCircle = new google.maps.Circle({
          center: baseCoords,
          radius: 30000, // 30 km en mètres
          map: allowExtendedRadius ? map : null,
          strokeColor: '#d97706',
          strokeOpacity: 0.85,
          strokeWeight: 2,
          fillColor: '#fef3c7',
          fillOpacity: 0.12,
          clickable: false,
          zIndex: 1,
        });
        extendedCircleRef.current = extendedCircle;

        // 3. POLYGONE DE LA ZONE D'ACTION (ÉDITÉ VIA LES 8 ANCRES DÉPLAÇABLES)
        const poly = new google.maps.Polygon({
          paths: polygonCoords,
          map: map,
          strokeColor: '#0369a1',
          strokeOpacity: 0.95,
          strokeWeight: 2.5,
          fillColor: '#0ea5e9',
          fillOpacity: 0.25,
          clickable: false,
          editable: false, // 8 ancres personnalisées dédiées
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
      points = generateInitialPolygon(baseCoords, selectedRadiusKm, 8);
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
          title: `Point d'ancrage #${idx + 1} (glisser pour remodeler la zone)`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#0284c7', // Bleu sky-600 Stitch
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
  }, [polygonCoords, baseCoords, selectedRadiusKm]);

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

      // Déplacer la carte et régénérer un polygone centré
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newBase);
        mapInstanceRef.current.setZoom(12);
      }
      setPolygonCoords(generateInitialPolygon(newBase, selectedRadiusKm, 8));
    }
  };

  // EFFACER LA ZONE / RÉINITIALISER LES 8 ANCRES
  const handleResetZone = () => {
    pushHistory(polygonCoords);
    setPolygonCoords(generateInitialPolygon(baseCoords, selectedRadiusKm, 8));
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(baseCoords);
      mapInstanceRef.current.setZoom(12);
    }
  };

  // CONTRÔLES ZOOM CARTE PERSONNALISÉS
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 12) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 12) - 1);
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(baseCoords);
      mapInstanceRef.current.setZoom(12);
    }
  };

  // PRÉRÉGLER LE RAYON DES 8 ANCRES (10, 15, 25, 40 KM)
  const handleSetRadius = (radiusKm: number) => {
    setSelectedRadiusKm(radiusKm);
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
    <main
      className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto transition-all text-slate-900 font-sans"
      data-purpose="intervention-zone-modal"
    >
      {/* ========================================================================= */}
      {/* BEGIN: Modal Header (Reproduit fidèlement de Stitch)                     */}
      {/* ========================================================================= */}
      <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <svg className="w-5 h-5 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
              <path
                d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Mes zones d'intervention</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Actif en direct
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Définissez votre base opérationnelle et ajustez votre polygone d'activité pour recevoir les courses sanitaires adaptées.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="group p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            type="button"
          >
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block">Fermer</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </header>
      {/* END: Modal Header */}

      {/* ========================================================================= */}
      {/* BEGIN: Modal Content                                                      */}
      {/* ========================================================================= */}
      <div className="px-6 py-4 space-y-3.5 overflow-y-auto max-h-[calc(100vh-160px)]">
        {/* FEEDBACK NOTIFICATIONS */}
        {saveSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold text-xs flex items-center gap-2.5 animate-fadeIn shadow-xs">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 font-semibold text-xs flex items-center gap-2.5 animate-shake shadow-xs">
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BEGIN: Section 1 - Base d'opération                                       */}
        {/* ========================================================================= */}
        <section className="bg-slate-50 rounded-xl p-3.5 border border-slate-200" data-purpose="base-station-settings">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center">1</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Ma base d'intervention principale</h2>
            </div>
            <button
              onClick={handleGeolocate}
              disabled={isGeolocating}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-teal-800 bg-white hover:bg-emerald-50 border border-emerald-300 hover:border-emerald-400 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
              type="button"
            >
              <svg className={`w-3.5 h-3.5 text-emerald-600 ${isGeolocating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M12 2v2m0 16v2m10-10h-2M4 10H2m15.07 7.07l-1.414-1.414M6.343 6.343L4.93 4.93m14.14 0l-1.414 1.414M6.343 17.657l-1.414 1.414M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{isGeolocating ? 'Localisation...' : 'Me géolocaliser'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Région administrative */}
            <div className="md:col-span-3">
              <label htmlFor="select-region" className="block text-xs font-bold text-slate-700 mb-1">Région administrative</label>
              <div className="relative">
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
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 appearance-none text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-xs pr-8 cursor-pointer"
                >
                  <optgroup label="France Métropolitaine">
                    {FRENCH_REGIONS.filter((r) => !r.isDrom).map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="DROM">
                    {FRENCH_REGIONS.filter((r) => r.isDrom).map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Commune de rattachement */}
            <div className="md:col-span-4">
              <label htmlFor="select-city" className="block text-xs font-bold text-slate-700 mb-1">Commune de rattachement</label>
              <div className="relative">
                <select
                  id="select-city"
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={isLoadingCommunes}
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 appearance-none text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-xs pr-8 cursor-pointer disabled:opacity-50"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Adresse ou repère précis */}
            <div className="md:col-span-5 relative">
              <label htmlFor="input-base-address" className="block text-xs font-bold text-slate-700 mb-1">
                Adresse ou repère précis de stationnement
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" fillRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="input-base-address"
                  type="text"
                  value={addressQuery || baseAddress}
                  onChange={(e) => handleAddressSearch(e.target.value)}
                  placeholder="Numéro et nom de voie..."
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-xs"
                />
              </div>

              {/* Suggestions d'adresses nationales */}
              {addressSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {addressSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectAddressSuggestion(item)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-sky-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
                    >
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.departmentName && (
                        <div className="text-[11px] text-slate-500">{item.departmentName}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        {/* END: Section 1 */}

        {/* ========================================================================= */}
        {/* BEGIN: Section 2 - Interactive Map & Geometry                             */}
        {/* ========================================================================= */}
        <section className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm" data-purpose="interactive-map-zone">
          {/* Subheader Toolbar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[11px] flex items-center justify-center">2</span>
              <h2 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Zone d'action interactive
                <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                  Polygone 8 ancres ajustables
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-600 font-semibold text-xs hidden md:inline">Rayon suggéré :</span>
              {[10, 15, 25, 40].map((r) => {
                const isActive = selectedRadiusKm === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSetRadius(r)}
                    className={
                      isActive
                        ? 'px-2.5 py-1 rounded border border-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 cursor-pointer transition-all'
                        : 'px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer'
                    }
                    style={
                      isActive
                        ? { backgroundImage: 'linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(13, 148, 136) 100%)' }
                        : undefined
                    }
                  >
                    {r} km
                  </button>
                );
              })}

              <div className="h-4 w-px bg-slate-300 mx-1"></div>

              <button
                type="button"
                onClick={handleResetZone}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 font-semibold transition-colors text-xs cursor-pointer active:scale-95"
                title="Réinitialiser les 8 ancres"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>

          {/* Interactive Map Canvas */}
          <div className="relative w-full h-[280px] sm:h-[320px] md:h-[350px] bg-slate-100 overflow-hidden cursor-crosshair select-none" data-purpose="map-canvas-preview">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Custom Map Navigation Controls (Top Right) */}
            <div className="absolute right-3 top-3 flex flex-col gap-1 bg-white p-1 rounded-lg shadow-md border border-slate-300 z-10">
              <button
                onClick={handleZoomIn}
                className="p-1.5 text-slate-700 hover:text-sky-600 hover:bg-slate-100 rounded transition cursor-pointer"
                title="Zoom avant"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 text-slate-700 hover:text-sky-600 hover:bg-slate-100 rounded transition cursor-pointer"
                title="Zoom arrière"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M20 12H4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="h-px bg-slate-200"></div>
              <button
                onClick={handleRecenter}
                className="p-1.5 text-slate-700 hover:text-sky-600 hover:bg-slate-100 rounded transition cursor-pointer"
                title="Recentrer sur la base"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
                </svg>
              </button>
            </div>

            {/* Bottom Map Info (Stitch Replica) */}
            <div className="absolute left-3 bottom-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-300 text-[11px] text-slate-700 font-semibold flex items-center gap-2 shadow-sm pointer-events-none z-10">
              <span>© Google Maps • Clinigo Pro GeoEngine</span>
              <span className="text-slate-300">|</span>
              <span className="text-sky-700 font-bold">Déplacez les 8 points d'ancrage pour remodeler la zone</span>
            </div>
          </div>

          {/* Map Legend Bar */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-3.5 text-slate-700 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-200"></span>
              Base de départ
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-500/25 border-2 border-sky-600"></span>
              Zone d'intervention garantie
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-amber-600"></span>
              Rayon étendu opportunités (+30 km)
            </span>
          </div>

          {/* ENCART COMMUNES ENCADRÉ AVEC DÉGRADÉ DE COULEUR & ALIGNEMENT STRICT */}
          <div className="px-4 py-2.5 border-t border-teal-200/80 bg-gradient-to-r from-sky-100/90 via-teal-50 to-emerald-100/90 flex items-center gap-3 overflow-hidden shadow-2xs">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse shrink-0"></span>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider whitespace-nowrap">
                Communes couvertes :
              </span>
            </div>

            {/* Communes strictement alignées sur une seule ligne horizontale (jamais les unes sous les autres) */}
            <div
              className="flex items-center gap-2 overflow-x-auto whitespace-nowrap min-w-0 flex-1 py-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {nearbyCommunes.length > 0 ? (
                nearbyCommunes.map((c) => (
                  <button
                    key={c.insee}
                    type="button"
                    onClick={() => handleSnapClosestAnchorToCommune(c)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/95 hover:bg-white text-slate-800 hover:text-teal-700 font-bold text-xs border border-teal-300 hover:border-teal-500 shadow-xs transition-all whitespace-nowrap cursor-pointer active:scale-95"
                    title={`Ajuster l'ancre la plus proche sur ${c.name} (${c.distKm.toFixed(0)} km)`}
                  >
                    <span className="text-teal-600 font-extrabold">✓</span>
                    <span>{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({c.distKm.toFixed(0)} km)</span>
                  </button>
                ))
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/95 text-slate-800 font-bold text-xs border border-teal-300 shadow-xs whitespace-nowrap">
                  <span className="text-teal-600 font-extrabold">✓</span>
                  <span>{selectedCity}</span>
                </span>
              )}
            </div>
          </div>
        </section>
        {/* END: Section 2 */}

        {/* ========================================================================= */}
        {/* BEGIN: Section 3 - Expansion & Buffer Switch                              */}
        {/* ========================================================================= */}
        <section className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-purpose="extended-zone-switch">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={allowExtendedRadius}
                onChange={(e) => setAllowExtendedRadius(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Recevoir les opportunités au-delà de ma zone principale</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 border border-teal-300 px-2 py-0.5 rounded-full">
                  Recommandé
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Recevez les courses de liaison longue distance et retours à vide dans le cercle de tolérance orange (+30 km) autour de {selectedCity}.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg shadow-2xs">
              Rayon étendu : +30 km
            </span>
          </div>
        </section>
        {/* END: Section 3 */}
      </div>
      {/* END: Modal Content */}

      {/* ========================================================================= */}
      {/* BEGIN: Modal Footer (Reproduit fidèlement de Stitch)                     */}
      {/* ========================================================================= */}
      <footer className="px-6 py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
          <span className="text-slate-500">Base active :</span>
          <span className="font-bold text-slate-900">{selectedCity} ({selectedRegion.name})</span>
          <span className="text-slate-300">•</span>
          <span className="text-sky-700 font-semibold">8 ancres actives</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors shadow-2xs cursor-pointer"
              type="button"
            >
              Annuler
            </button>
          )}

          <button
            id="btn-save-transporter-zone"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 border border-emerald-400/30 cursor-pointer disabled:opacity-50 active:scale-95"
            style={{ backgroundImage: 'linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(13, 148, 136) 100%)' }}
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Enregistrer mes zones</span>
              </>
            )}
          </button>
        </div>
      </footer>
      {/* END: Modal Footer */}
    </main>
  );
};
