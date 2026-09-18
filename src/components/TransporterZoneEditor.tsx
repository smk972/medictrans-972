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
  const midpointMarkersRef = useRef<any[]>([]);
  const drawingMarkersRef = useRef<any[]>([]);
  const mapClickListenerRef = useRef<any>(null);

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

    // Nettoyage des anciens marqueurs
    vertexMarkersRef.current.forEach((m) => m.setMap(null));
    vertexMarkersRef.current = [];
    midpointMarkersRef.current.forEach((m) => m.setMap(null));
    midpointMarkersRef.current = [];
    drawingMarkersRef.current.forEach((m) => m.setMap(null));
    drawingMarkersRef.current = [];

    // 1. Affichage des repères numérotés en mode dessin
    if (editMode === 'DRAWING') {
      polygonCoords.forEach((pt, idx) => {
        const marker = new google.maps.Marker({
          position: pt,
          map: mapInstanceRef.current,
          label: {
            text: String(idx + 1),
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          title: `Point d'ancrage #${idx + 1}`,
        });
        drawingMarkersRef.current.push(marker);
      });
      return;
    }

    // 2. Affichage des sommets interactifs (Points d'ancrage principaux)
    if (editMode === 'EDITING_VERTICES' || editMode === 'DELETE_VERTEX' || editMode === 'ADD_VERTEX') {
      const markers = polygonCoords.map((pt, idx) => {
        const isSelected = selectedVertexIdx === idx;
        const marker = new google.maps.Marker({
          position: pt,
          map: mapInstanceRef.current,
          draggable: editMode === 'EDITING_VERTICES',
          zIndex: 60 + idx,
          cursor: editMode === 'DELETE_VERTEX' ? 'not-allowed' : 'grab',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: isSelected ? 10 : 7.5,
            fillColor: editMode === 'DELETE_VERTEX' ? '#ef4444' : isSelected ? '#e11d48' : '#2563eb',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: isSelected ? 3 : 2,
          },
          title: `Point d'ancrage #${idx + 1}${
            editMode === 'DELETE_VERTEX'
              ? ' (Cliquer pour supprimer)'
              : ' (Glisser pour modifier, cliquer pour sélectionner)'
          }`,
        });

        // Déplacement en temps réel pour fluidité maximale
        marker.addListener('drag', (e: any) => {
          if (e.latLng && polygonInstanceRef.current) {
            const liveCoords = [...polygonCoords];
            liveCoords[idx] = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            polygonInstanceRef.current.setPaths(liveCoords);
          }
        });

        // Fin du déplacement du sommet
        marker.addListener('dragend', (e: any) => {
          if (e.latLng) {
            const nextCoords = [...polygonCoords];
            nextCoords[idx] = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            pushHistory(nextCoords);
          }
        });

        // Clic sur le sommet (sélection ou suppression)
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
            setSelectedVertexIdx(isSelected ? null : idx);
          }
        });

        return marker;
      });

      vertexMarkersRef.current = markers;

      // 3. Points d'ancrage intermédiaires (Midpoints) pour étirer ou insérer un sommet
      if (editMode === 'EDITING_VERTICES' && polygonCoords.length >= 3) {
        const midMarkers: any[] = [];
        for (let i = 0; i < polygonCoords.length; i++) {
          const p1 = polygonCoords[i];
          const p2 = polygonCoords[(i + 1) % polygonCoords.length];
          const midPt = {
            lat: Number(((p1.lat + p2.lat) / 2).toFixed(6)),
            lng: Number(((p1.lng + p2.lng) / 2).toFixed(6)),
          };

          const midMarker = new google.maps.Marker({
            position: midPt,
            map: mapInstanceRef.current,
            draggable: true,
            zIndex: 40 + i,
            cursor: 'crosshair',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 5.5,
              fillColor: '#06b6d4', // Cyan éclatant
              fillOpacity: 0.95,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
            title: `Point d'ancrage intermédiaire (Glissez pour étirer la zone ou cliquez pour insérer un sommet)`,
          });

          // Aperçu fluide au drag
          midMarker.addListener('drag', (e: any) => {
            if (e.latLng && polygonInstanceRef.current) {
              const liveCoords = [...polygonCoords];
              liveCoords.splice(i + 1, 0, { lat: e.latLng.lat(), lng: e.latLng.lng() });
              polygonInstanceRef.current.setPaths(liveCoords);
            }
          });

          // Insertion finale au lâcher
          midMarker.addListener('dragend', (e: any) => {
            if (e.latLng) {
              const newPt = { lat: e.latLng.lat(), lng: e.latLng.lng() };
              const nextCoords = [...polygonCoords];
              nextCoords.splice(i + 1, 0, newPt);
              pushHistory(nextCoords);
              setSelectedVertexIdx(i + 1);
            }
          });

          // Insertion simple au clic
          midMarker.addListener('click', () => {
            const nextCoords = [...polygonCoords];
            nextCoords.splice(i + 1, 0, midPt);
            pushHistory(nextCoords);
            setSelectedVertexIdx(i + 1);
          });

          midMarkers.push(midMarker);
        }
        midpointMarkersRef.current = midMarkers;
      }
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
    setPolygonCoords(generateInitialPolygon(baseCoords, 15, 8));
    setEditMode('EDITING_VERTICES');
    setSelectedVertexIdx(null);
  };

  // PRÉRÉGLAGE DU NOMBRE DE POINTS D'ANCRAGE (4, 6, 8, 12 SOMMETS)
  const handleSetPresetVertices = (count: number, radiusKm: number = 15) => {
    pushHistory(polygonCoords);
    const newCoords = generateInitialPolygon(baseCoords, radiusKm, count);
    setPolygonCoords(newCoords);
    setEditMode('EDITING_VERTICES');
    setSelectedVertexIdx(null);
  };

  // MULTIPLIER / DOUBLER LES POINTS D'ANCRAGE (DOUBLER LA DENSITÉ DES ANCRES)
  const handleSubdivideVertices = () => {
    if (polygonCoords.length < 3) return;
    const newCoords: GeoPoint[] = [];
    for (let i = 0; i < polygonCoords.length; i++) {
      const p1 = polygonCoords[i];
      const p2 = polygonCoords[(i + 1) % polygonCoords.length];
      newCoords.push(p1);
      newCoords.push({
        lat: Number(((p1.lat + p2.lat) / 2).toFixed(6)),
        lng: Number(((p1.lng + p2.lng) / 2).toFixed(6)),
      });
    }
    pushHistory(newCoords);
    setEditMode('EDITING_VERTICES');
    setSelectedVertexIdx(null);
  };

  // AJOUTER UNE COMMUNE PROCHE COMME POINT D'ANCRAGE DANS LA ZONE
  const handleAddCommuneAnchor = (commune: RegionCommune) => {
    const communePt: GeoPoint = { lat: commune.lat, lng: commune.lng };

    if (polygonCoords.length < 3) {
      pushHistory([...polygonCoords, communePt]);
      return;
    }

    // Trouver le segment le plus proche pour insérer le point d'ancrage harmonieusement
    let minDistance = Infinity;
    let insertIndex = polygonCoords.length;

    for (let i = 0; i < polygonCoords.length; i++) {
      const p1 = polygonCoords[i];
      const p2 = polygonCoords[(i + 1) % polygonCoords.length];
      const d =
        calculateHaversineDistanceKm(p1.lat, p1.lng, communePt.lat, communePt.lng) +
        calculateHaversineDistanceKm(p2.lat, p2.lng, communePt.lat, communePt.lng);

      if (d < minDistance) {
        minDistance = d;
        insertIndex = i + 1;
      }
    }

    const next = [...polygonCoords];
    next.splice(insertIndex, 0, communePt);
    pushHistory(next);
    setSelectedVertexIdx(insertIndex);
    setEditMode('EDITING_VERTICES');

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
                <span>MA ZONE D'ACTION INTERACTIVE</span>
              </h3>
              <p className="text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 font-semibold text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  {polygonCoords.length} points d'ancrage actifs
                </span>
                <span>•</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                  {polygonCoords.length} ancres intermédiaires étirables
                </span>
              </p>
            </div>

            {/* BOÎTE À OUTILS D'ÉDITION DE POLYGONE */}
            <div className="flex flex-wrap items-center gap-1.5">
              {editMode === 'DRAWING' ? (
                <button
                  type="button"
                  onClick={handleFinishDrawing}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>✓</span>
                  <span>Terminer le tracé ({polygonCoords.length} points)</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleStartDrawing}
                    className="px-2.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                    title="Redessiner un polygone complet clic par clic"
                  >
                    ✏️ Nouveau tracé
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode(editMode === 'EDITING_VERTICES' ? 'IDLE' : 'EDITING_VERTICES')}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 border cursor-pointer ${
                      editMode === 'EDITING_VERTICES'
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-surface-container text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    {editMode === 'EDITING_VERTICES' ? '✓ Mode ancrage actif' : '🎯 Ajuster les ancres'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode(editMode === 'ADD_VERTEX' ? 'EDITING_VERTICES' : 'ADD_VERTEX')}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 border cursor-pointer ${
                      editMode === 'ADD_VERTEX'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-surface-container text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    ➕ Clic ajouter
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode(editMode === 'DELETE_VERTEX' ? 'EDITING_VERTICES' : 'DELETE_VERTEX')}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 border cursor-pointer ${
                      editMode === 'DELETE_VERTEX'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-surface-container text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                    }`}
                  >
                    🗑️ Supprimer
                  </button>

                  {historyStack.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 font-bold text-xs transition-all cursor-pointer"
                      title="Annuler la dernière modification"
                    >
                      ↩️ Annuler
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetZone}
                    className="px-2.5 py-1.5 rounded-xl bg-surface-container text-on-surface-variant hover:text-rose-600 hover:bg-rose-50 border border-outline-variant/30 font-bold text-xs transition-all cursor-pointer"
                    title="Réinitialiser la zone avec un cercle régulier"
                  >
                    Effacer
                  </button>
                </>
              )}
            </div>
          </div>

          {/* DENSITÉ DES POINTS D'ANCRAGE & FORMES PRÉCONFIGURÉES */}
          {editMode !== 'DRAWING' && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant/20">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                  Points d'ancrage :
                </span>
                <button
                  type="button"
                  onClick={() => handleSetPresetVertices(4)}
                  className="px-2 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-primary/15 text-[11px] font-bold border border-outline-variant/30 transition-colors cursor-pointer"
                  title="Zone carrée à 4 points"
                >
                  4 ancres
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetVertices(6)}
                  className="px-2 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-primary/15 text-[11px] font-bold border border-outline-variant/30 transition-colors cursor-pointer"
                  title="Zone hexagonale à 6 points"
                >
                  6 ancres
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetVertices(8)}
                  className="px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-black border border-primary/30 transition-colors cursor-pointer"
                  title="Octogone régulier (Recommandé pour un périmètre équilibré)"
                >
                  ★ 8 ancres (Idéal)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetVertices(12)}
                  className="px-2 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-primary/15 text-[11px] font-bold border border-outline-variant/30 transition-colors cursor-pointer"
                  title="Zone détaillée à 12 points pour épouser précisément les axes routiers"
                >
                  12 ancres
                </button>
                <button
                  type="button"
                  onClick={handleSubdivideVertices}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 text-[11px] font-black border border-cyan-500/30 transition-colors cursor-pointer"
                  title="Insérer automatiquement un point d'ancrage au milieu de chaque segment existant"
                >
                  ➕ Doubler les ancres (x2)
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
                  Rayon :
                </span>
                {[10, 15, 25, 40].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleSetPresetVertices(polygonCoords.length || 8, r)}
                    className="px-2 py-0.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary text-[10px] font-bold border border-outline-variant/30 transition-colors cursor-pointer"
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INSTRUCTION SELON LE MODE */}
          <div className="text-[11px] bg-surface-container px-3.5 py-2 rounded-xl border border-outline-variant/20 text-on-surface-variant flex items-center justify-between gap-2 flex-wrap">
            {editMode === 'DRAWING' && (
              <span className="text-primary font-bold">
                🎯 Mode tracé : Cliquez sur la carte pour poser chaque sommet, puis cliquez sur "Terminer le tracé".
              </span>
            )}
            {editMode === 'EDITING_VERTICES' && (
              <span className="flex items-center gap-1.5 flex-wrap">
                <span>💡 <strong>Astuce :</strong> Glissez les</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold">
                  🔵 sommets bleus
                </span>
                <span>pour déplacer les angles, et tirez les</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold">
                  🟢 points cyan
                </span>
                <span>pour étirer les segments et créer de nouvelles ancres !</span>
              </span>
            )}
            {editMode === 'ADD_VERTEX' && (
              <span className="text-amber-600 font-bold">
                ➕ Mode ajout : Cliquez sur la carte à l'endroit exact où vous voulez insérer une nouvelle ancre.
              </span>
            )}
            {editMode === 'DELETE_VERTEX' && (
              <span className="text-rose-600 font-bold">
                🗑️ Mode suppression : Cliquez sur le point d'ancrage que vous souhaitez retirer.
              </span>
            )}
            {editMode === 'IDLE' && <span>Zone verrouillée. Cliquez sur "Ajuster les ancres" pour modifier.</span>}
          </div>

          {/* CONTENEUR DE CARTE GOOGLE MAPS */}
          <div className="relative w-full h-[420px] sm:h-[480px] rounded-2xl overflow-hidden border border-outline-variant/40 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>

          {/* LÉGENDE INTERACTIVE DES POINTS D'ANCRAGE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-semibold text-on-surface-variant">
            <div className="flex items-center gap-1.5 bg-surface-container/60 px-2.5 py-1.5 rounded-lg border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shrink-0 shadow-xs" />
              <span>Sommet d'ancrage (glisser)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container/60 px-2.5 py-1.5 rounded-lg border border-outline-variant/20">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white shrink-0 shadow-xs" />
              <span>Ancre intermédiaire (étirer)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container/60 px-2.5 py-1.5 rounded-lg border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-white shrink-0 shadow-xs" />
              <span>Base départ (déplaçable)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container/60 px-2.5 py-1.5 rounded-lg border border-outline-variant/20">
              <span className="w-3 h-3 rounded-full border border-dashed border-amber-500 bg-amber-500/20 shrink-0" />
              <span>Rayon étendu +30 km</span>
            </div>
          </div>

          {/* ANCRAGE RAPIDE SUR LES COMMUNES LIMITROPHES */}
          {nearbyCommunes.length > 0 && (
            <div className="pt-2 border-t border-outline-variant/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <span>📍</span>
                  <span>Ancrer rapidement une commune limitrophe dans votre zone :</span>
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  Cliquer pour attacher la commune au contour
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {nearbyCommunes.map((c) => (
                  <button
                    key={c.insee}
                    type="button"
                    onClick={() => handleAddCommuneAnchor(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container hover:bg-primary/15 hover:text-primary text-[11px] font-bold border border-outline-variant/30 hover:border-primary/40 transition-all cursor-pointer shadow-xs active:scale-95"
                    title={`Ajouter ${c.name} (${c.distKm.toFixed(1)} km) comme point d'ancrage dans la zone`}
                  >
                    <span className="text-primary font-black">+</span>
                    <span>{c.name}</span>
                    <span className="text-[10px] text-on-surface-variant opacity-80 font-normal">
                      ({c.distKm.toFixed(0)} km)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
