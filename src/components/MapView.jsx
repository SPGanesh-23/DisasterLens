import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRiskLevel } from '../utils/riskEngine';
import { reverseGeocode } from '../services/geocoding';

function MapUpdater({ location, active }) {
  const map = useMap();
  useEffect(() => {
    // The map was initialized while its section was hidden, so Leaflet
    // still holds a cached 0x0 size (getSize only re-reads the container
    // after invalidateSize). Flying on that stale size makes Leaflet's
    // flyTo math divide by zero and crash the whole app — so invalidate
    // first, then fly after a short delay, once the now-visible section
    // has been laid out and the cached size is real.
    if (!active) return;
    if (location && Number.isFinite(location.lat) && Number.isFinite(location.lon)) {
      map.invalidateSize();
      const timer = setTimeout(() => {
        map.flyTo([location.lat, location.lon], 11, {
          animate: true,
          duration: 1.5
        });
      }, 120);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [location, map, active]);
  return null;
}

function MapInteractionHandler({ interactionsEnabled, isMobile }) {
  const map = useMap();
  useEffect(() => {
    if (!isMobile) {
      map.dragging.enable();
      if (map.touchZoom) map.touchZoom.enable();
      if (map.doubleClickZoom) map.doubleClickZoom.enable();
      return;
    }

    if (interactionsEnabled) {
      map.dragging.enable();
      if (map.touchZoom) map.touchZoom.enable();
      if (map.doubleClickZoom) map.doubleClickZoom.enable();
    } else {
      map.dragging.disable();
      if (map.touchZoom) map.touchZoom.disable();
      if (map.doubleClickZoom) map.doubleClickZoom.disable();
    }
  }, [interactionsEnabled, isMobile, map]);
  return null;
}

// Click anywhere on the map to analyze that spot: reverse-geocode the
// clicked point and hand the place up to the app. Clicks on the marker,
// popup, or zoom control are ignored so they don't re-trigger analysis.
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: async (e) => {
      if (!onMapClick) return;
      const target = e.originalEvent?.target;
      if (target?.closest?.('.leaflet-marker-icon, .leaflet-popup, .leaflet-control')) return;
      const { lat, lng } = e.latlng;
      try {
        const place = await reverseGeocode(lat, lng);
        onMapClick(place);
      } catch {
        onMapClick({ name: `${lat.toFixed(2)}, ${lng.toFixed(2)}`, lat, lon: lng });
      }
    },
  });
  return null;
}

// Desktop scroll behaviour: the map only zooms with Ctrl/Cmd + scroll so
// normal page scrolling still works. Holding the modifier enables Leaflet
// scroll zoom; a plain scroll over the map shows a brief hint instead.
function MapScrollHandler({ onUnmodifiedScroll }) {
  const map = useMap();
  useEffect(() => {
    const enableZoom = () => map.scrollWheelZoom.enable();
    const disableZoom = () => map.scrollWheelZoom.disable();
    const onKeyDown = (e) => { if (e.ctrlKey || e.metaKey) enableZoom(); };
    const onKeyUp = (e) => { if (!e.ctrlKey && !e.metaKey) disableZoom(); };
    const onBlur = () => disableZoom();
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) onUnmodifiedScroll();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    const container = map.getContainer();
    container.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      container.removeEventListener('wheel', onWheel);
      disableZoom();
    };
  }, [map, onUnmodifiedScroll]);
  return null;
}

// The map lives in a dashboard section that is hidden (display: none)
// until the user opens it. Leaflet measures its container at mount,
// so a map mounted while hidden renders at 0×0 — invalidate its size
// once the section becomes visible so tiles draw correctly.
function MapResizeHandler({ active }) {
  const map = useMap();
  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => { map.invalidateSize(); }, 60);
    return () => clearTimeout(timer);
  }, [active, map]);
  return null;
}

function MapView({ location, riskData, onMapClick, active = true }) {
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  const center = location ? [location.lat, location.lon] : defaultCenter;

  const [isMobile, setIsMobile] = useState(false);
  const [interactionsEnabled, setInteractionsEnabled] = useState(false);
  const [zoomHintVisible, setZoomHintVisible] = useState(false);
  const zoomHintTimer = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    return () => {
      if (zoomHintTimer.current) clearTimeout(zoomHintTimer.current);
    };
  }, []);

  // Reset the mobile lock whenever the analyzed location changes.
  // (Render-time state adjustment — the documented React pattern for
  // resetting state when a prop changes.)
  const [prevLocation, setPrevLocation] = useState(location);
  if (prevLocation !== location) {
    setPrevLocation(location);
    setInteractionsEnabled(false);
  }

  const showZoomHint = useCallback(() => {
    if (window.innerWidth <= 768) return;
    setZoomHintVisible(true);
    if (zoomHintTimer.current) clearTimeout(zoomHintTimer.current);
    zoomHintTimer.current = setTimeout(() => setZoomHintVisible(false), 1800);
  }, []);

  // Marker color follows the overall risk level; grey while the
  // analysis is still loading.
  const markerColor = riskData ? getRiskLevel(riskData.overallRisk).color : '#64748b';
  const riskIcon = L.divIcon({
    className: 'risk-marker-icon',
    html: `<div class="risk-marker" style="--marker-color: ${markerColor}"><span class="risk-marker-ping"></span><span class="risk-marker-dot"></span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

  // Get top 3 risks if riskData is available
  const topRisks = riskData ?
    Object.entries(riskData)
      .filter(([key]) => ['heatwave', 'flood', 'drought', 'waterScarcity', 'cyclone'].includes(key))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    : [];

  return (
    <div className="map-wrapper card" style={{ position: 'relative' }}>
      {isMobile && !interactionsEnabled && (
        <div
          className="map-mobile-overlay"
          onClick={() => setInteractionsEnabled(true)}
        >
          <span className="map-mobile-overlay-icon">📍</span>
          <strong className="map-mobile-overlay-title">Tap to interact with the map</strong>
          <span className="map-mobile-overlay-sub">Prevents accidental page scrolling</span>
        </div>
      )}

      {isMobile && interactionsEnabled && (
        <button
          onClick={() => setInteractionsEnabled(false)}
          className="map-lock-btn"
        >
          🔒 Lock Map
        </button>
      )}

      <div className="map-click-hint">Click anywhere on the map to analyze</div>

      {zoomHintVisible && (
        <div className="map-zoom-hint">Use Ctrl + scroll to zoom</div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="leaflet-map-container"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater location={location} active={active} />
        <MapResizeHandler active={active} />
        <MapInteractionHandler interactionsEnabled={interactionsEnabled} isMobile={isMobile} />
        <MapClickHandler onMapClick={onMapClick} />
        <MapScrollHandler onUnmodifiedScroll={showZoomHint} />
        {location && (
          <Circle
            center={center}
            radius={8000}
            pathOptions={{ color: markerColor, weight: 1.5, fillColor: markerColor, fillOpacity: 0.12 }}
          />
        )}
        {location && (
          <Marker position={center} icon={riskIcon}>
            <Popup>
              <strong>{location.name}</strong>
              {riskData && (
                <div className="popup-risks">
                  <p>Top Risks:</p>
                  <ul>
                    {topRisks.map(([risk, score]) => (
                      <li key={risk}>{risk.charAt(0).toUpperCase() + risk.slice(1)}: {score}/100</li>
                    ))}
                  </ul>
                </div>
              )}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default MapView;
