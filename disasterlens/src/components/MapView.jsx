import React, { useEffect, useRef } from 'react';
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

function MapView({ location, riskData }) {
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  const center = location ? [location.lat, location.lon] : defaultCenter;
  
  // Get top 3 risks if riskData is available
  const topRisks = riskData ? 
    Object.entries(riskData)
      .filter(([key]) => ['heatwave', 'flood', 'drought', 'waterScarcity', 'cyclone'].includes(key))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    : [];

  return (
    <div className="map-wrapper card">
      <MapContainer center={defaultCenter} zoom={defaultZoom} style={{ height: '420px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater location={location} />
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
