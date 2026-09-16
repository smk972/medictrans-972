import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { TerritoryId } from '../data/nationalTerritoriesData';
import { loadTerritoryGeoJson, reverseGeocode } from '../services/nationalGeoDatabase';

export interface D3InteractiveGeoMapProps {
  territoryId: TerritoryId;
  baseCoordinates: [number, number]; // [lng, lat]
  baseName: string;
  exactAddress?: string;
  radiusKm: number;
  selectedDepartmentCode?: string | null;
  onSelectEntity?: (entity: {
    name: string;
    code: string;
    coordinates: [number, number];
    type?: 'commune' | 'department' | 'street';
    street?: string;
  }) => void;
  onSelectDepartment?: (dept: { code: string; name: string; coordinates: [number, number] }) => void;
  onGeolocate?: () => void;
  width?: number;
  height?: number;
}

export const D3InteractiveGeoMap: React.FC<D3InteractiveGeoMapProps> = ({
  territoryId,
  baseCoordinates,
  baseName,
  exactAddress,
  radiusKm,
  selectedDepartmentCode,
  onSelectEntity,
  onSelectDepartment,
  onGeolocate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [loadingStatus, setLoadingStatus] = useState<'loading' | 'cached' | 'loaded'>('loading');
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [hoveredEntity, setHoveredEntity] = useState<{
    name: string;
    code: string;
    distKm: number;
    x: number;
    y: number;
  } | null>(null);

  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const pathGenRef = useRef<d3.GeoPath<any, d3.GeoPermissibleObjects> | null>(null);
  const featuresRef = useRef<any[]>([]);

  // Formule de calcul de distance géodésique Haversine (km)
  const calcHaversineDistanceKm = useCallback((lon1: number, lat1: number, lon2: number, lat2: number) => {
    const R = 6371; // Rayon terrestre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }, []);

  // Rendu de la carte vectorielle via D3
  useEffect(() => {
    let isCancelled = false;
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 520;

    // 1. Chargement progressif des contours GeoJSON simplifiés
    loadTerritoryGeoJson(territoryId, (status) => {
      if (!isCancelled) setLoadingStatus(status);
    })
      .then((geojson) => {
        if (isCancelled || !geojson || !geojson.features) return;

        featuresRef.current = geojson.features;

        // Nettoyer l'ancien contenu SVG
        const svg = d3.select(svgEl);
        svg.selectAll('*').remove();

        svg
          .attr('viewBox', `0 0 ${width} ${height}`)
          .attr('width', '100%')
          .attr('height', '100%')
          .style('touch-action', 'none');

        // Définition des filtres d'effet radar et gradients
        const defs = svg.append('defs');

        // Glow filter
        const filter = defs.append('filter').attr('id', 'radar-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
        filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
        filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

        // Gradient radar circle
        const radGrad = defs.append('radialGradient').attr('id', 'radius-gradient');
        radGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0284c7').attr('stop-opacity', '0.28');
        radGrad.append('stop').attr('offset', '75%').attr('stop-color', '#0284c7').attr('stop-opacity', '0.14');
        radGrad.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8').attr('stop-opacity', '0.04');

        // Projection Mercator calibrée sur le GeoJSON simplifié
        const projection = d3.geoMercator().fitSize([width - 40, height - 40], geojson);
        const currentTranslation = projection.translate();
        projection.translate([currentTranslation[0] + 20, currentTranslation[1] + 20]);
        projectionRef.current = projection;

        const pathGen = d3.geoPath().projection(projection);
        pathGenRef.current = pathGen;

        // Groupes de rendu (layers)
        const rootGroup = svg.append('g').attr('class', 'map-root');
        const oceanGridLayer = rootGroup.append('g').attr('class', 'ocean-grid');
        const polygonLayer = rootGroup.append('g').attr('class', 'polygons');
        const radiusLayer = rootGroup.append('g').attr('class', 'radius-coverage');
        const labelLayer = rootGroup.append('g').attr('class', 'labels');
        const markerLayer = rootGroup.append('g').attr('class', 'markers');

        // Grille radar subtile
        for (let x = 0; x < width; x += 60) {
          oceanGridLayer.append('line').attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', height).attr('stroke', '#1e293b').attr('stroke-width', 0.5).attr('stroke-dasharray', '2,6').attr('opacity', 0.4);
        }
        for (let y = 0; y < height; y += 60) {
          oceanGridLayer.append('line').attr('x1', 0).attr('y1', y).attr('x2', width).attr('y2', y).attr('stroke', '#1e293b').attr('stroke-width', 0.5).attr('stroke-dasharray', '2,6').attr('opacity', 0.4);
        }

        const features = geojson.features || [];

        // Résolution des coordonnées de la commune/base
        let effectiveCoords = baseCoordinates;
        const matched = features.find((f: any) => {
          const nom = (f.properties?.nom || f.properties?.name || '').toLowerCase();
          const code = (f.properties?.code || f.properties?.code_insee || '').toLowerCase();
          return nom === baseName.toLowerCase() || code === baseName.toLowerCase() || nom.includes(baseName.toLowerCase());
        });

        if (matched && (!baseCoordinates || (baseCoordinates[0] === 0 && baseCoordinates[1] === 0))) {
          const c = pathGen.centroid(matched);
          if (!isNaN(c[0]) && !isNaN(c[1]) && projection.invert) {
            const inv = projection.invert(c);
            if (inv) effectiveCoords = inv as [number, number];
          }
        }

        // Calcul du centre de base projeté en pixels SVG
        const basePixel = projection(effectiveCoords) || [width / 2, height / 2];

        // Calcul du rayon en pixels
        const latRad = (effectiveCoords[1] * Math.PI) / 180;
        const kmPerLngDegree = 111.32 * Math.cos(latRad);
        const deltaLng = radiusKm / (kmPerLngDegree || 111);
        const radiusEdgePixel = projection([effectiveCoords[0] + deltaLng, effectiveCoords[1]]) || [basePixel[0] + 50, basePixel[1]];
        const pixelRadius = Math.max(15, Math.hypot(radiusEdgePixel[0] - basePixel[0], radiusEdgePixel[1] - basePixel[1]));

        // 2. Tracé des polygones avec calcul dynamique de couverture
        polygonLayer
          .selectAll('path')
          .data(features)
          .join('path')
          .attr('d', pathGen as any)
          .attr('vector-effect', 'non-scaling-stroke')
          .attr('class', 'territory-zone-path')
          .each(function (d: any) {
            const centroid = pathGen.centroid(d);
            const centroidGeo = projection.invert ? projection.invert(centroid) : null;
            let distKm = 999;
            if (centroidGeo) {
              distKm = calcHaversineDistanceKm(effectiveCoords[0], effectiveCoords[1], centroidGeo[0], centroidGeo[1]);
            }
            d._distKm = distKm;
            d._centroid = centroid;
            d._isInside = distKm <= radiusKm;
            d._name = d.properties?.nom || d.properties?.name || 'Zone';
            d._code = (d.properties?.code || d.properties?.code_insee || '').toString();
            d._isSelectedDep = selectedDepartmentCode ? d._code === selectedDepartmentCode : false;
            d._isBase = d._name.toLowerCase() === baseName.toLowerCase() || d._isSelectedDep || d._distKm < 8;
          })
          .attr('fill', (d: any) => {
            if (d._isSelectedDep) return '#0369a1'; // Département en cours de sélection
            if (d._isBase) return '#0284c7'; // Bleu ciel pour la base
            if (d._isInside) return '#047857'; // Vert émeraude (zone couverte)
            return '#1e293b'; // Gris ardoise soutenu (hors zone)
          })
          .attr('stroke', (d: any) => {
            if (d._isSelectedDep) return '#38bdf8';
            if (d._isBase) return '#38bdf8';
            if (d._isInside) return '#34d399';
            return '#475569'; // Frontières bien découpées
          })
          .attr('stroke-width', (d: any) => (d._isSelectedDep ? 2.5 : d._isBase ? 1.8 : 0.85))
          .attr('cursor', 'pointer')
          .on('mouseenter', function (event: MouseEvent, d: any) {
            d3.select(this)
              .transition()
              .duration(120)
              .attr('fill', d._isSelectedDep ? '#0284c7' : d._isBase ? '#0369a1' : d._isInside ? '#047857' : '#1e293b')
              .attr('stroke', '#38bdf8')
              .attr('stroke-width', 2);

            const rect = container.getBoundingClientRect();
            setHoveredEntity({
              name: d._name,
              code: d._code,
              distKm: d._distKm,
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            });
          })
          .on('mouseleave', function (_, d: any) {
            d3.select(this)
              .transition()
              .duration(150)
              .attr('fill', d._isSelectedDep ? '#0369a1' : d._isBase ? '#0284c7' : d._isInside ? '#064e3b' : '#0f172a')
              .attr('stroke', d._isSelectedDep ? '#38bdf8' : d._isBase ? '#38bdf8' : d._isInside ? '#10b981' : '#334155')
              .attr('stroke-width', d._isSelectedDep ? 2.5 : d._isBase ? 1.5 : 0.75);

            setHoveredEntity(null);
          })
          .on('click', function (_, d: any) {
            // 🎯 ZOOM DIRECT SUR LE DÉPARTEMENT / COMMUNE CLIQUÉ
            const bounds = pathGen.bounds(d);
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            const x = (bounds[0][0] + bounds[1][0]) / 2;
            const y = (bounds[0][1] + bounds[1][1]) / 2;

            if (zoomBehaviorRef.current && svgRef.current && !isNaN(dx) && !isNaN(dy) && dx > 0 && dy > 0) {
              const scale = Math.max(1.8, Math.min(10, 0.82 / Math.max(dx / width, dy / height)));
              const translate = [width / 2 - scale * x, height / 2 - scale * y];

              d3.select(svgRef.current)
                .transition()
                .duration(750)
                .ease(d3.easeCubicInOut)
                .call(
                  zoomBehaviorRef.current.transform,
                  d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                );
            }

            const centroidGeo = projection.invert ? projection.invert(d._centroid) : baseCoordinates;

            // Déclenchement de l'événement département
            if (onSelectDepartment && territoryId === 'METROPOLE') {
              onSelectDepartment({
                code: d._code,
                name: d._name,
                coordinates: centroidGeo as [number, number],
              });
            }

            // Déclenchement de l'événement d'entité
            if (onSelectEntity) {
              onSelectEntity({
                name: d._name,
                code: d._code,
                coordinates: centroidGeo as [number, number],
                type: territoryId === 'METROPOLE' ? 'department' : 'commune',
              });
            }
          });

        // 3. Dessin du cercle radar de rayon d'action
        const radiusGroup = radiusLayer.append('g').attr('class', 'radius-indicator');

        // Disque translucide
        radiusGroup
          .append('circle')
          .attr('class', 'radius-disc')
          .attr('cx', basePixel[0])
          .attr('cy', basePixel[1])
          .attr('r', pixelRadius)
          .attr('fill', 'url(#radius-gradient)')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 1.8)
          .attr('stroke-dasharray', '6,4')
          .attr('filter', 'url(#radar-glow)')
          .attr('pointer-events', 'none');

        // Anneau kilométrique intermédiaire (50% du rayon)
        if (pixelRadius > 40) {
          radiusGroup
            .append('circle')
            .attr('class', 'radius-half')
            .attr('cx', basePixel[0])
            .attr('cy', basePixel[1])
            .attr('r', pixelRadius / 2)
            .attr('fill', 'none')
            .attr('stroke', '#38bdf8')
            .attr('stroke-width', 0.8)
            .attr('stroke-dasharray', '2,4')
            .attr('opacity', 0.6)
            .attr('pointer-events', 'none');

          radiusGroup
            .append('text')
            .attr('class', 'radius-half-label')
            .attr('x', basePixel[0] + pixelRadius / 2 + 4)
            .attr('y', basePixel[1] - 4)
            .attr('fill', '#7dd3fc')
            .attr('font-size', '9px')
            .attr('font-family', 'monospace')
            .attr('font-weight', 'bold')
            .attr('opacity', 0.9)
            .text(`${Math.round(radiusKm / 2)} km`);
        }

        // Étiquette sur le bord extérieur du cercle
        radiusGroup
          .append('text')
          .attr('class', 'radius-label')
          .attr('x', basePixel[0] + pixelRadius + 6)
          .attr('y', basePixel[1] + 4)
          .attr('fill', '#38bdf8')
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .attr('pointer-events', 'none')
          .text(`${radiusKm} km`);

        // 4. Marqueur central du transporteur (Base ou Rue précise)
        const markerGroup = markerLayer.append('g').attr('class', 'center-marker');

        // Onde radar pulsante
        markerGroup
          .append('circle')
          .attr('class', 'beacon')
          .attr('cx', basePixel[0])
          .attr('cy', basePixel[1])
          .attr('r', 16)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2)
          .attr('opacity', 0.8);

        // Point central
        markerGroup
          .append('circle')
          .attr('class', 'pin')
          .attr('cx', basePixel[0])
          .attr('cy', basePixel[1])
          .attr('r', exactAddress ? 6 : 5)
          .attr('fill', exactAddress ? '#10b981' : '#38bdf8')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);

        // Étiquette permanente de la base
        const labelText = exactAddress || baseName;
        markerGroup
          .append('rect')
          .attr('class', 'marker-badge')
          .attr('x', basePixel[0] - (labelText.length * 3 + 8))
          .attr('y', basePixel[1] - 22)
          .attr('width', labelText.length * 6 + 16)
          .attr('height', 16)
          .attr('rx', 4)
          .attr('fill', '#090d16')
          .attr('fill-opacity', 0.92)
          .attr('stroke', exactAddress ? '#10b981' : '#38bdf8')
          .attr('stroke-width', 1);

        markerGroup
          .append('text')
          .attr('class', 'marker-text')
          .attr('x', basePixel[0])
          .attr('y', basePixel[1] - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '9.5px')
          .attr('font-weight', '700')
          .attr('letter-spacing', '0.2px')
          .text(labelText);

        // 5. Affichage dynamique des noms selon le niveau de zoom
        const labelNodes = labelLayer
          .selectAll('g.zone-label')
          .data(features)
          .join('g')
          .attr('class', 'zone-label')
          .attr('transform', (d: any) => `translate(${d._centroid[0]}, ${d._centroid[1]})`)
          .style('display', 'none');

        labelNodes
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('font-size', 9)
          .attr('font-weight', 'bold')
          .attr('fill', (d: any) => (d._isInside ? '#6ee7b7' : '#94a3b8'))
          .attr('pointer-events', 'none')
          .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.95))')
          .text((d: any) => d._name);

        // 6. Gestionnaire de Zoom D3 fluide avec mise à l'échelle inverse constante
        const zoom = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 30])
          .on('zoom', (event) => {
            const { transform } = event;
            const k = transform.k;
            setCurrentZoom(k);

            rootGroup.attr('transform', transform.toString());

            // Taille écran constante pour le marqueur
            markerGroup.selectAll('circle.beacon').attr('r', 14 / k).attr('stroke-width', 1.8 / k);
            markerGroup.selectAll('circle.pin').attr('r', (exactAddress ? 6 : 5) / k).attr('stroke-width', 2 / k);

            markerGroup.selectAll('rect.marker-badge')
              .attr('x', basePixel[0] - (labelText.length * 3 + 8) / k)
              .attr('y', basePixel[1] - 22 / k)
              .attr('width', (labelText.length * 6 + 16) / k)
              .attr('height', 16 / k)
              .attr('rx', 4 / k)
              .attr('stroke-width', 1 / k);

            markerGroup.selectAll('text.marker-text')
              .attr('x', basePixel[0])
              .attr('y', basePixel[1] - 10 / k)
              .attr('font-size', `${9.5 / k}px`);

            // Taille écran constante pour les étiquettes et bordures radar
            radiusGroup.selectAll('circle.radius-disc').attr('stroke-width', 1.6 / k);
            radiusGroup.selectAll('circle.radius-half').attr('stroke-width', 0.8 / k);
            radiusGroup.selectAll('text.radius-label')
              .attr('x', basePixel[0] + pixelRadius + 6 / k)
              .attr('y', basePixel[1] + 4 / k)
              .attr('font-size', `${10 / k}px`);
            radiusGroup.selectAll('text.radius-half-label')
              .attr('x', basePixel[0] + pixelRadius / 2 + 4 / k)
              .attr('y', basePixel[1] - 4 / k)
              .attr('font-size', `${8.5 / k}px`);

            // Affichage des noms des zones à zoom élevé avec taille constante
            const showLabels = k >= 2.0;
            labelNodes.style('display', showLabels ? 'block' : 'none');

            if (showLabels) {
              labelNodes.selectAll('text').attr('font-size', `${8.5 / k}px`);
            }
            polygonLayer.selectAll('path').attr('stroke-width', (d: any) => {
              if (d._isSelectedDep) return 2.2 / k;
              return d._isBase ? 1.4 / k : 0.75 / k;
            });
          });

        zoomBehaviorRef.current = zoom;
        svg.call(zoom);

        // 7. Clic sur la carte en zoom profond pour sélectionner une rue / adresse
        svg.on('click', async (event: MouseEvent) => {
          // Si le zoom est supérieur à 2.8, un clic libre sur la carte interroge le reverse-geocoding
          if (event.defaultPrevented) return;
          const target = event.target as HTMLElement;
          if (target && target.classList.contains('territory-zone-path')) {
            // Le clic sur le polygone est déjà géré
            return;
          }

          if (currentZoom >= 2.5 && projection.invert) {
            const rect = svgEl.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
            const geo = projection.invert([clickX, clickY]);
            if (geo) {
              const res = await reverseGeocode(geo[0], geo[1]);
              if (res && onSelectEntity) {
                onSelectEntity({
                  name: res.city || res.label,
                  code: res.departmentCode,
                  coordinates: res.coordinates,
                  type: res.street ? 'street' : 'commune',
                  street: res.street || res.label,
                });
              }
            }
          }
        });

        // Zoom initial ou centrage
        if (selectedDepartmentCode && territoryId === 'METROPOLE') {
          const depFeature = features.find((f: any) => {
            const code = (f.properties?.code || f.properties?.code_insee || '').toString();
            return code === selectedDepartmentCode;
          });
          if (depFeature) {
            const bounds = pathGen.bounds(depFeature);
            const dx = bounds[1][0] - bounds[0][0];
            const dy = bounds[1][1] - bounds[0][1];
            const x = (bounds[0][0] + bounds[1][0]) / 2;
            const y = (bounds[0][1] + bounds[1][1]) / 2;
            const scale = Math.max(1.8, Math.min(10, 0.82 / Math.max(dx / width, dy / height)));
            const translate = [width / 2 - scale * x, height / 2 - scale * y];
            svg.transition().duration(650).call(
              zoom.transform,
              d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
            return;
          }
        }

        // Si adresse précise présente : zoomer dessus
        if (exactAddress && effectiveCoords[0] !== 0) {
          const pt = projection(effectiveCoords);
          if (pt) {
            svg.transition().duration(750).call(
              zoom.transform,
              d3.zoomIdentity.translate(width / 2 - 12 * pt[0], height / 2 - 12 * pt[1]).scale(12)
            );
            return;
          }
        }

        // Recentrage par défaut
        svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);
      })
      .catch((err) => {
        console.error('Erreur chargement carte D3:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    territoryId,
    baseCoordinates,
    baseName,
    exactAddress,
    radiusKm,
    selectedDepartmentCode,
    calcHaversineDistanceKm,
    onSelectEntity,
    onSelectDepartment,
  ]);

  // Commandes manuelles de Zoom (+, -, Reset)
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.5);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.67);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[480px] bg-slate-950 rounded-2xl overflow-hidden select-none">
      {/* Canevas SVG D3 */}
      <svg id="d3-interactive-geomap-svg" ref={svgRef} className="d3-interactive-geomap w-full h-full block" />

      {/* Indicateur de chargement progressif */}
      {loadingStatus === 'loading' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-30 animate-in fade-in duration-200">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <span className="text-xs font-mono font-bold text-sky-300">Chargement des contours géographiques...</span>
        </div>
      )}

      {/* Contrôles de Zoom chirurgicaux en overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-lg shadow-lg cursor-pointer transition-colors"
          title="Zoomer (+)"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-lg shadow-lg cursor-pointer transition-colors"
          title="Dézoomer (-)"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="w-8 h-8 rounded-lg bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-mono shadow-lg cursor-pointer transition-colors"
          title="Recadrer la carte (Vue d'ensemble)"
        >
          <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="22" y1="12" x2="18" y2="12" />
            <line x1="6" y1="12" x2="2" y2="12" />
            <line x1="12" y1="6" x2="12" y2="2" />
            <line x1="12" y1="22" x2="12" y2="18" />
          </svg>
        </button>
        {onGeolocate && (
          <button
            id="btn-map-geolocate"
            type="button"
            onClick={onGeolocate}
            className="w-8 h-8 rounded-lg bg-sky-600/90 hover:bg-sky-500 text-white border border-sky-400/80 flex items-center justify-center text-xs shadow-lg cursor-pointer transition-colors"
            title="Me géolocaliser sur la carte (GPS)"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Bouton de recadrage direct si l'utilisateur est en zoom rapproché */}
      {currentZoom > 1.4 && (
        <button
          type="button"
          onClick={handleResetZoom}
          className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-500/40 text-[11px] font-bold shadow-xl backdrop-blur-sm flex items-center gap-1.5 cursor-pointer transition-all animate-fadeIn"
        >
          <span className="material-symbols-outlined text-sm">zoom_out_map</span>
          <span>Vue d'ensemble (Dézoomer)</span>
        </button>
      )}

      {/* Badge indicateur de niveau de zoom & affichage des noms */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5 shadow-md">
          <span>Zoom: {currentZoom.toFixed(1)}x</span>
          <span>•</span>
          <span className={currentZoom >= 2.0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
            {currentZoom >= 2.0 ? 'Villes & rues actives' : 'Cliquez sur un département pour zoomer'}
          </span>
        </div>
      </div>

      {/* Tooltip flottant au survol */}
      {hoveredEntity && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2.5 bg-slate-900/95 text-white border border-slate-700 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-75 text-xs font-medium"
          style={{ left: `${hoveredEntity.x}px`, top: `${hoveredEntity.y}px` }}
        >
          <div className="flex items-center gap-2 font-bold text-sky-300">
            <span>{hoveredEntity.name}</span>
            {hoveredEntity.code && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                {hoveredEntity.code}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
            <span className="text-slate-400">Distance :</span>
            <span className="font-mono font-bold text-emerald-400">{hoveredEntity.distKm} km</span>
            <span className="text-slate-500">
              ({hoveredEntity.distKm <= radiusKm ? 'Couvert' : 'Hors zone'})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
