import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Navigation, Crosshair } from 'lucide-react';
import { GuessResponse } from '../types';
import { formatCoordinates, formatDistance } from '../utils/formatters';

interface MapGuessProps {
  userGuess: { lat: number; lng: number } | null;
  onSelectCoordinates: (coords: { lat: number; lng: number }) => void;
  onSubmitGuess: () => void;
  revealData: GuessResponse | null;
  isSubmitting: boolean;
  disabled: boolean;
}

const DEFAULT_CENTER: L.LatLngExpression = [25, 10];
const DEFAULT_ZOOM = 3;

const pinHtml = (kind: 'guess' | 'target') => `
  <div class="pin pin-${kind}">
    <span class="pin-pulse"></span>
    <svg viewBox="0 0 28 38" width="28" height="38" aria-hidden="true">
      <path d="M14 1C7 1 1.5 6.4 1.5 13.2c0 9.4 12.5 23.8 12.5 23.8S26.5 22.6 26.5 13.2C26.5 6.4 21 1 14 1z" />
      <circle cx="14" cy="13.2" r="4.6" />
    </svg>
  </div>`;

export const MapGuess: React.FC<MapGuessProps> = ({
  userGuess,
  onSelectCoordinates,
  onSubmitGuess,
  revealData,
  isSubmitting,
  disabled,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const guessMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  // The click handler is bound once, so it reads live values through refs.
  const gateRef = useRef({ disabled, locked: !!revealData });
  const selectRef = useRef(onSelectCoordinates);
  gateRef.current = { disabled, locked: !!revealData };
  selectRef.current = onSelectCoordinates;

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Voyager tiles, toned to old-atlas sepia in CSS (.atlas-tiles). If tiles
    // cannot load, the graticule drawn behind the map keeps the plate readable.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      className: 'atlas-tiles',
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const gate = gateRef.current;
      if (gate.disabled || gate.locked) return;
      selectRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Guess Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userGuess) {
      if (!guessMarkerRef.current) {
        const icon = L.divIcon({
          className: 'pin-wrap',
          html: pinHtml('guess'),
          iconSize: [28, 38],
          iconAnchor: [14, 37],
        });
        guessMarkerRef.current = L.marker([userGuess.lat, userGuess.lng], { icon }).addTo(map);
      } else {
        guessMarkerRef.current.setLatLng([userGuess.lat, userGuess.lng]);
      }
    } else if (guessMarkerRef.current) {
      map.removeLayer(guessMarkerRef.current);
      guessMarkerRef.current = null;
    }
  }, [userGuess]);

  // Handle Post-Guess Reveal State
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (revealData) {
      if (!targetMarkerRef.current) {
        const icon = L.divIcon({
          className: 'pin-wrap',
          html: pinHtml('target'),
          iconSize: [28, 38],
          iconAnchor: [14, 37],
        });
        targetMarkerRef.current = L.marker(
          [revealData.target_latitude, revealData.target_longitude],
          { icon }
        )
          .addTo(map)
          .bindPopup(`<b>Documented location</b><br/>${revealData.artifact.title}`);
      }

      if (!polylineRef.current) {
        polylineRef.current = L.polyline(
          [
            [revealData.guess_latitude, revealData.guess_longitude],
            [revealData.target_latitude, revealData.target_longitude],
          ] as L.LatLngExpression[],
          { color: '#8c3b25', weight: 2.5, opacity: 0.9, dashArray: '2, 9', lineCap: 'round' }
        ).addTo(map);
      }

      const bounds = L.latLngBounds([
        [revealData.guess_latitude, revealData.guess_longitude],
        [revealData.target_latitude, revealData.target_longitude],
      ]);
      map.fitBounds(bounds, { padding: [90, 90], maxZoom: 10 });
    } else {
      if (targetMarkerRef.current) {
        map.removeLayer(targetMarkerRef.current);
        targetMarkerRef.current = null;
      }
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
    }
  }, [revealData]);

  return (
    <section className="map-pane" aria-label="Guess map">
      <div className="map-frame">
        <div ref={mapContainerRef} className="map-viewport" />

        {/* Plate furniture */}
        <span className="tick tl" aria-hidden="true" />
        <span className="tick tr" aria-hidden="true" />
        <span className="tick bl" aria-hidden="true" />
        <span className="tick br" aria-hidden="true" />

        <div className="cartouche">
          <div className="cartouche-kicker">Plate · the atlas</div>
          <div className="cartouche-title">Where does this begin?</div>
        </div>

        <svg className="compass-rose" viewBox="-50 -50 100 100" aria-hidden="true">
          <circle r="44" fill="none" />
          <circle r="34" fill="none" strokeDasharray="1 3" />
          <path className="rose-major" d="M0 -46 L6 -6 L46 0 L6 6 L0 46 L-6 6 L-46 0 L-6 -6 Z" />
          <path className="rose-minor" d="M0 -30 L3 -3 L30 0 L3 3 L0 30 L-3 3 L-30 0 L-3 -3 Z" transform="rotate(45)" />
          <text y="-50" textAnchor="middle" className="rose-n">N</text>
        </svg>

        <div className="readout" aria-live="polite">
          <Crosshair size={14} />
          <div>
            <div className="readout-label">
              {revealData ? 'Your deviation' : userGuess ? 'Pin placed' : 'No pin yet'}
            </div>
            <div className="readout-value">
              {revealData
                ? formatDistance(revealData.distance_km)
                : userGuess
                ? formatCoordinates(userGuess.lat, userGuess.lng)
                : 'Click the map to drop one'}
            </div>
          </div>
        </div>

        {!revealData && (
          <div className="submit-dock">
            <button
              className="seal-btn"
              onClick={onSubmitGuess}
              disabled={!userGuess || isSubmitting || disabled}
            >
              {isSubmitting ? (
                'Measuring the geodesic…'
              ) : (
                <>
                  <Navigation size={17} />
                  Seal your guess
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
