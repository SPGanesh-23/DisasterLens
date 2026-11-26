import { useState } from 'react';
import { geocodeLocation } from '../services/geocoding';

// One-tap cities so visitors (e.g. at a stall) can jump straight to a
// result without typing. Coordinates match the geocoder's { name, lat, lon } shape.
const POPULAR_CITIES = [
  { name: 'Chennai, Tamil Nadu, India', label: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Thoothukudi, Tamil Nadu, India', label: 'Thoothukudi', lat: 8.7642, lon: 78.1348 },
  { name: 'Madurai, Tamil Nadu, India', label: 'Madurai', lat: 9.9252, lon: 78.1198 },
  { name: 'Coimbatore, Tamil Nadu, India', label: 'Coimbatore', lat: 11.0168, lon: 76.9558 },
  { name: 'Mumbai, Maharashtra, India', label: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Delhi, India', label: 'Delhi', lat: 28.6139, lon: 77.2090 },
];

const RECENT_KEY = 'disasterlens-recent-searches';
const MAX_RECENT = 5;

function loadRecent() {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable (e.g. private mode) — recents just won't persist.
  }
}

function SearchBar({ onLocationFound, loading }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState(loadRecent);

  const recordRecent = (place) => {
    setRecent((prev) => {
      const next = [
        { name: place.name, lat: place.lat, lon: place.lon },
        ...prev.filter((p) => p.name.toLowerCase() !== place.name.toLowerCase()),
      ].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    try {
      const location = await geocodeLocation(query);
      recordRecent(location);
      onLocationFound(location);
    } catch (err) {
      setError(err.message || 'Location not found. Please try again.');
    }
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          placeholder="Enter a city, town, or village..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="search-input"
        />
        <button type="submit" disabled={loading || !query.trim()} className="search-button">
          {loading ? 'Analyzing...' : 'Analyze Risk'}
        </button>
      </form>
      <div className="city-chips">
        <span className="city-chips-label">Try:</span>
        {POPULAR_CITIES.map((city) => (
          <button
            key={city.label}
            type="button"
            className="city-chip"
            disabled={loading}
            onClick={() => { setError(null); recordRecent(city); onLocationFound(city); }}
          >
            {city.label}
          </button>
        ))}
      </div>
      {recent.length > 0 && (
        <div className="city-chips recent-searches">
          <span className="city-chips-label">Recent:</span>
          {recent.map((place) => (
            <button
              key={place.name}
              type="button"
              className="city-chip"
              disabled={loading}
              onClick={() => { setError(null); recordRecent(place); onLocationFound(place); }}
            >
              {place.name.split(',')[0]}
            </button>
          ))}
          <button
            type="button"
            className="recent-clear-btn"
            disabled={loading}
            onClick={() => { setRecent([]); saveRecent([]); }}
            aria-label="Clear recent searches"
          >
            ✕ Clear
          </button>
        </div>
      )}
      {error && <p className="search-error">{error}</p>}
    </div>
  );
}

export default SearchBar;
