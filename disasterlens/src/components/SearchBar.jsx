import React, { useState } from 'react';
import { geocodeLocation } from '../services/geocoding';

function SearchBar({ onLocationFound, loading }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setError(null);
    try {
      const location = await geocodeLocation(query);
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
      {error && <p className="search-error">{error}</p>}
    </div>
  );
}

export default SearchBar;
