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

  // 3. POLYGONE & OUTILS D'ÉDITION
  const [polygonCoords, setPolygonCoords] = useState<GeoPoint[]>(() => {
    if (initialZone?.polygonCoordinates && initialZone.polygonCoordinates.length >= 3) {
      return initialZone.polygonCoordinates;
    }
    return generateInitialPolygon({ lat: 43.4608, lng: 1.3267 }, 15);
  });
  const [historyStack, setHistoryStack] = useState<GeoPoint[][]>([]);
  const [editMode, setEditMode] = useState<'IDLE' | 'DRAWING' | 'EDITING_VERTICES' | 'ADD_VERTEX' | 'DELETE_VERTEX'>('EDITING_VERTICES');
  const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);

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
  const drawingMarkersRef = useRef<any[]>([]);
  const mapClickListenerRef = useRef<any>(null);

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
          zIndex: 999,
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
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

        // 3. POLYGONE DE LA ZONE D'ACTION
        const poly = new google.maps.Polygon({
          paths: polygonCoords,
          map: map,
          strokeColor: '#0284c7',
          strokeOpacity: 0.95,
          strokeWeight: 3,
          fillColor: '#0ea5e9',
          fillOpacity: 0.25,
          clickable: true,
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

  // Synchronisation du tracé du polygone et des marqueurs de sommets
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (polygonInstanceRef.current) {
      polygonInstanceRef.current.setPaths(polygonCoords);
    }

    // Nettoyage des anciens marqueurs de sommets
    vertexMarkersRef.current.forEach((m) => m.setMap(null));
    vertexMarkersRef.current = [];

    // Affichage des sommets interactifs si mode édition actif
    if (editMode === 'EDITING_VERTICES' || editMode === 'DELETE_VERTEX') {
      const markers = polygonCoords.map((pt, idx) => {
        const isSelected = selectedVertexIdx === idx;
        const marker = new google.maps.Marker({
          position: pt,
          map: mapInstanceRef.current,
          draggable: editMode === 'EDITING_VERTICES',
          zIndex: 50 + idx,
          cursor: editMode === 'DELETE_VERTEX' ? 'not-allowed' : 'move',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 9 : 7,
            fillColor: editMode === 'DELETE_VERTEX' ? '#ef4444' : isSelected ? '#e11d48' : '#0284c7',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2.5,
          },
          title: `Sommet ${idx + 1}${editMode === 'DELETE_VERTEX' ? ' (Cliquer pour supprimer)' : ' (Glisser pour modifier)'}`,
        });

        // Déplacement du sommet
        marker.addListener('dragend', (e: any) => {
          if (e.latLng) {
            const nextCoords = [...polygonCoords];
            nextCoords[idx] = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            pushHistory(nextCoords);
          }
        });

        // Clic sur le sommet (pour sélection ou suppression)
        marker.addListener('click', () => {
          if (editMode === 'DELETE_VERTEX') {
            if (polygonCoords.length <= 3) {
              setErrorMessage('Un polygone doit conserver au minimum 3 sommets.');
              return;
            }
            const nextCoords = polygonCoords.filter((_, i) => i !== idx);
            pushHistory(nextCoords);
            setSelectedVertexIdx(null);
          } else {
            setSelectedVertexIdx(idx);
          }
        });

        return marker;
      });

      vertexMarkersRef.current = markers;
    }
  }, [polygonCoords, editMode, selectedVertexIdx, pushHistory]);

  // Gestion des clics sur la carte selon le mode actif
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (mapClickListenerRef.current) {
      google.maps.event.removeListener(mapClickListenerRef.current);
      mapClickListenerRef.current = null;
    }

    if (editMode === 'DRAWING') {
      mapClickListenerRef.current = mapInstanceRef.current.addListener(
        'click',
        (e: any) => {
          if (e.latLng) {
            const newPt = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setPolygonCoords((prev) => [...prev, newPt]);
          }
        }
      );
    } else if (editMode === 'ADD_VERTEX') {
      mapClickListenerRef.current = mapInstanceRef.current.addListener(
        'click',
        (e: any) => {
          if (e.latLng && polygonCoords.length >= 2) {
            const clickPt = { lat: e.latLng.lat(), lng: e.latLng.lng() };

            // Trouver le segment le plus proche pour insérer le sommet
            let minDistance = Infinity;
            let insertIndex = polygonCoords.length;

            for (let i = 0; i < polygonCoords.length; i++) {
              const p1 = polygonCoords[i];
              const p2 = polygonCoords[(i + 1) % polygonCoords.length];
              const d =
                calculateHaversineDistanceKm(p1.lat, p1.lng, clickPt.lat, clickPt.lng) +
                calculateHaversineDistanceKm(p2.lat, p2.lng, clickPt.lat, clickPt.lng);

              if (d < minDistance) {
                minDistance = d;
                insertIndex = i + 1;
              }
            }

            const next = [...polygonCoords];
            next.splice(insertIndex, 0, clickPt);
            pushHistory(next);
            setEditMode('EDITING_VERTICES');
          }
        }
      );
    }

    return () => {
      if (mapClickListenerRef.current) {
        google.maps.event.removeListener(mapClickListenerRef.current);
      }
    };
  }, [editMode, polygonCoords, pushHistory]);

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
      if (polygonCoords.length < 3) {
        setPolygonCoords(generateInitialPolygon(newBase, 15));
      }
    }
  };

  // DÉMARRER LE DESSIN DE LA ZONE
  const handleStartDrawing = () => {
    pushHistory(polygonCoords);
    setPolygonCoords([]);
    setEditMode('DRAWING');
    setErrorMessage(null);
  };

  // FERMER LE DESSIN
  const handleFinishDrawing = () => {
    if (polygonCoords.length < 3) {
      setErrorMessage('Veuillez cliquer au moins 3 fois sur la carte pour délimiter un polygone fermé.');
      return;
    }
    setEditMode('EDITING_VERTICES');
    setErrorMessage(null);
  };

  // ANNULER (UNDO)
  const handleUndo = () => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack((old) => old.slice(0, -1));
      setPolygonCoords(prev);
    }
  };

  // EFFACER LA ZONE
  const handleResetZone = () => {
    pushHistory(polygonCoords);
    setPolygonCoords(generateInitialPolygon(baseCoords, 15));
    setEditMode('EDITING_VERTICES');
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
    <div className="bg-surface rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden flex flex-col max-w-5xl mx-auto my-4 transition-all">
      {/* HEADER OFFICIEL */}
      <div className="px-5 py-4 border-b border-outline-variant/20 bg-surface-container-low flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-black text-on-surface flex items-center gap-2">
            <span className="text-primary text-xl">🗺️</span>
            <span>MES ZONES D'INTERVENTION</span>
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Définissez votre zone d'action et choisissez si vous souhaitez recevoir des offres à proximité de votre base.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            title="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[85vh]">
        {/* MESSAGES D'ALERTE / SUCCÈS */}
        {saveSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-2 animate-fadeIn">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-300 font-bold text-xs sm:text-sm flex items-center gap-2 animate-shake">
            <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 1 : 📍 MA BASE D'INTERVENTION                                    */}
        {/* ========================================================================= */}
        <div className="bg-surface-container-low/70 p-4 sm:p-5 rounded-2xl border border-outline-variant/30 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs sm:text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
              <span className="text-red-500 text-base">📍</span>
              <span>MA BASE D'INTERVENTION</span>
            </h3>
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={isGeolocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isGeolocating ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="22" y1="12" x2="18" y2="12" />
                <line x1="6" y1="12" x2="2" y2="12" />
                <line x1="12" y1="6" x2="12" y2="2" />
                <line x1="12" y1="22" x2="12" y2="18" />
              </svg>
              <span>{isGeolocating ? 'Localisation en cours...' : '📍 Me géolocaliser'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* SÉLECTEUR DE RÉGION (18 Régions avec identifiants INSEE officiels) */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
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
                className="w-full bg-surface-container rounded-xl border border-outline-variant/40 px-3.5 py-2.5 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <optgroup label="France Métropolitaine (13)">
                  {FRENCH_REGIONS.filter((r) => !r.isDrom).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="DROM (Outre-Mer - 5)">
                  {FRENCH_REGIONS.filter((r) => r.isDrom).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* SÉLECTEUR DE VILLE (Filtré par région) */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
                Ville / Commune de stationnement
              </label>
              <select
                id="select-city"
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={isLoadingCommunes}
                className="w-full bg-surface-container rounded-xl border border-outline-variant/40 px-3.5 py-2.5 text-xs font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer disabled:opacity-50"
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
          </div>

          {/* ADRESSE CONFIRMÉE DE LA BASE AVEC AUTOCOMPLÉTION */}
          <div className="relative">
            <label className="block text-[11px] font-black uppercase tracking-wider text-on-surface-variant mb-1.5">
              Position de ma base (Adresse ou repère)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="input-base-address"
                type="text"
                value={addressQuery || baseAddress}
                onChange={(e) => handleAddressSearch(e.target.value)}
                placeholder="Rechercher une adresse précise, une rue..."
                className="flex-1 bg-surface-container rounded-xl border border-outline-variant/40 px-3.5 py-2 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="text-[11px] text-on-surface-variant shrink-0 bg-surface-container px-2.5 py-1.5 rounded-lg border border-outline-variant/30 font-mono">
                {baseCoords.lat.toFixed(4)}, {baseCoords.lng.toFixed(4)}
              </span>
            </div>

            {/* Suggestions d'adresses */}
            {addressSuggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface-container-high rounded-xl border border-outline-variant/40 shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                {addressSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectAddressSuggestion(item)}
                    className="w-full text-left px-3.5 py-2 text-xs hover:bg-primary/10 transition-colors border-b border-outline-variant/20 last:border-0"
                  >
                    <div className="font-bold text-on-surface">{item.name}</div>
                    {item.departmentName && (
                      <div className="text-[10px] text-on-surface-variant">{item.departmentName}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1">
              <span>💡</span>
              <span>Vous pouvez déplacer directement le repère rouge au doigt ou à la souris sur la carte.</span>
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2 : 🗺️ MA ZONE D'ACTION (Polygone interactif Google Maps)         */}
        {/* ========================================================================= */}
        <div className="bg-surface-container-low/70 p-4 sm:p-5 rounded-2xl border border-outline-variant/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span className="text-primary text-base">🗺️</span>
                <span>MA ZONE D'ACTION</span>
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Polygone personnalisé avec sommets éditables ({polygonCoords.length} points définis)
              </p>
            </div>

            {/* BOÎTE À OUTILS D'ÉDITION DE POLYGONE */}
            <div className="flex flex-wrap items-center gap-1.5">
              {editMode === 'DRAWING' ? (
                <button
                  type="button"
                  onClick={handleFinishDrawing}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  ✓ Terminer le tracé ({polygonCoords.length} points)
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleStartDrawing}
                    className="px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-bold text-xs transition-all active:scale-95"
                    title="Redessiner un polygone complet clic par clic"
                  >
                    ✏️ Dessiner ma zone
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode(editMode === 'EDITING_VERTICES' ? 'IDLE' : 'EDITING_VERTICES')}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 border ${
                      editMode === 'EDITING_VERTICES'
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-container text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    Modifier les sommets
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode(editMode === 'ADD_VERTEX' ? 'EDITING_VERTICES' : 'ADD_VERTEX')}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 border ${
                      editMode === 'ADD_VERTEX'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-surface-container text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    ➕ Ajouter un point
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode(editMode === 'DELETE_VERTEX' ? 'EDITING_VERTICES' : 'DELETE_VERTEX')}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 border ${
                      editMode === 'DELETE_VERTEX'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-surface-container text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    🗑️ Supprimer un point
                  </button>

                  {historyStack.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 font-bold text-xs transition-all"
                      title="Annuler la dernière modification"
                    >
                      ↩️ Annuler
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetZone}
                    className="px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 border border-outline-variant/30 font-bold text-xs transition-all"
                    title="Réinitialiser la zone avec un cercle régulier"
                  >
                    Effacer
                  </button>
                </>
              )}
            </div>
          </div>

          {/* INSTRUCTION SELON LE MODE */}
          <div className="text-[11px] bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/20 text-on-surface-variant">
            {editMode === 'DRAWING' && (
              <span className="text-primary font-bold">
                🎯 Mode tracé : Cliquez sur la carte pour poser chaque sommet, puis cliquez sur "Terminer le tracé".
              </span>
            )}
            {editMode === 'EDITING_VERTICES' && (
              <span>
                👉 Déplacez chaque sommet bleu au doigt ou à la souris pour ajuster précisément votre périmètre.
              </span>
            )}
            {editMode === 'ADD_VERTEX' && (
              <span className="text-amber-600 font-bold">
                ➕ Mode ajout : Cliquez sur la carte à l'endroit où vous voulez insérer un nouveau sommet.
              </span>
            )}
            {editMode === 'DELETE_VERTEX' && (
              <span className="text-rose-600 font-bold">
                🗑️ Mode suppression : Cliquez sur le sommet que vous souhaitez retirer.
              </span>
            )}
            {editMode === 'IDLE' && <span>Zone verrouillée. Cliquez sur "Modifier les sommets" pour ajuster.</span>}
          </div>

          {/* CONTENEUR DE CARTE GOOGLE MAPS */}
          <div className="relative w-full h-[420px] sm:h-[480px] rounded-2xl overflow-hidden border border-outline-variant/40 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3 : 📢 OFFRES AU-DELÀ DE MA ZONE (30 KM FIXE DEPUIS LA BASE)      */}
        {/* ========================================================================= */}
        <div className="bg-surface-container-low/70 p-4 sm:p-5 rounded-2xl border border-outline-variant/30">
          <label htmlFor="checkbox-extended-radius" className="flex items-start gap-3.5 cursor-pointer select-none group">
            <input
              id="checkbox-extended-radius"
              type="checkbox"
              checked={allowExtendedRadius}
              onChange={(e) => setAllowExtendedRadius(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-outline-variant/50 text-primary focus:ring-primary/20 accent-primary cursor-pointer transition-transform group-hover:scale-110"
            />
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-black text-on-surface group-hover:text-primary transition-colors flex items-center gap-2">
                <span>📢</span>
                <span>Recevoir des offres au-delà de ma zone</span>
              </span>
              <p className="text-xs text-on-surface-variant">
                Vous pourrez recevoir des offres jusqu'à 30 km autour de votre base d'intervention.
              </p>
              <div className="inline-flex items-center gap-2 mt-2 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                <span>Rayon supplémentaire fixe :</span>
                <span className="font-mono">30 km (autour de {selectedCity})</span>
              </div>
            </div>
          </label>
        </div>

        {/* ========================================================================= */}
        {/* BOUTON D'ENREGISTREMENT OFFICIEL                                         */}
        {/* ========================================================================= */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high font-bold text-xs transition-colors cursor-pointer"
            >
              Annuler
            </button>
          )}

          <button
            id="btn-save-transporter-zone"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Enregistrement dans Supabase...</span>
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
