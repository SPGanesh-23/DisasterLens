import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location && location.lat && location.lon) {
      map.flyTo([location.lat, location.lon], 11, {
        animate: true,
        duration: 1.5
      });
    }
  }, [location, map]);
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

function MapView({ location, riskData }) {
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  const center = location ? [location.lat, location.lon] : defaultCenter;
  
  const [isMobile, setIsMobile] = useState(false);
  const [interactionsEnabled, setInteractionsEnabled] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Lock map when location changes
    setInteractionsEnabled(false);
  }, [location]);

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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(2, 8, 23, 0.65)',
            backdropFilter: 'blur(2px)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            textAlign: 'center',
            padding: '16px',
            borderRadius: '12px'
          }}
        >
          <span style={{ fontSize: '24px', marginBottom: '8px' }}>📍</span>
          <strong style={{ fontSize: '0.95rem', fontWeight: 600 }}>Tap to interact with the map</strong>
          <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px' }}>Prevents accidental page scrolling</span>
        </div>
      )}

      {isMobile && interactionsEnabled && (
        <button
          onClick={() => setInteractionsEnabled(false)}
          className="map-lock-btn"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1002,
            background: 'var(--bg-card, #0c1e36)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            color: 'white',
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
        >
          🔒 Lock Map
        </button>
      )}

      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        className="leaflet-map-container"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater location={location} />
        <MapInteractionHandler interactionsEnabled={interactionsEnabled} isMobile={isMobile} />
        {location && (
          <Marker position={center}>
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
