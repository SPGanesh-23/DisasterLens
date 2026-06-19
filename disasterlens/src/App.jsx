import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import MapView from './components/MapView';
import RiskDashboard from './components/RiskDashboard';
import DisasterTimeline from './components/DisasterTimeline';
import DisasterNewsFeed from './components/DisasterNewsFeed';
import ClimateCharts from './components/ClimateCharts';
import PrepAdvisor from './components/PrepAdvisor';
import FutureSimulator from './components/FutureSimulator';
import ClimateChat from './components/ClimateChat';
import LocationCompare from './components/LocationCompare';
import InfoModal from './components/InfoModal';
import { fetchClimateData } from './services/climate';
import { analyzeClimateRisk } from './services/gemini';
import './App.css';

function App() {
  const [location, setLocation] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // null | 'how-it-works' | 'about'
  const [climateData, setClimateData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show the "scroll to top" button once the user has scrolled
  // past the hero/search area.
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 480);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLocationFound = async (loc) => {
    setLocation(loc);
    setClimateData(null);
    setRiskData(null);
    setError(null);
    setLoading(true);

    try {
      setLoadingStep('Fetching 10 years of climate data...');
      const climate = await fetchClimateData(loc.lat, loc.lon);
      setClimateData(climate);

      setLoadingStep('Running AI risk analysis...');
      const risk = await analyzeClimateRisk(loc.name, climate.summary, (msg) => setLoadingStep(msg));
      setRiskData(risk);
    } catch (err) {
      setError(err.message || 'An error occurred during analysis. Please check the console for more details.');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="header-logo">
            <img src="/logo.png" alt="DisasterLens Logo" className="logo-img" />
          </div>
          <div className="header-text">
            <h1>DisasterLens AI</h1>
            <p>AI-Powered Climate Risk Assessment</p>
          </div>
        </div>
        <div className={`header-links ${menuOpen ? 'open' : ''}`}>
          <button className="nav-pill" onClick={() => { setActiveModal('how-it-works'); setMenuOpen(false); }}>How it works</button>
          <button className="nav-pill" onClick={() => { setActiveModal('about'); setMenuOpen(false); }}>About</button>
          <a href="https://github.com/SPGanesh-23/DisasterLens" target="_blank" rel="noopener noreferrer" className="nav-pill" onClick={() => setMenuOpen(false)}>GitHub</a>
        </div>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      <section className="hero-section">
        <div className="hero-floaters" aria-hidden="true">
          <span className="hero-floater">🌊</span>
          <span className="hero-floater">🔥</span>
          <span className="hero-floater">🌪️</span>
          <span className="hero-floater">🌡️</span>
        </div>
        <h2 className="hero-headline">
          Understand Your <span className="gradient-text">Climate</span> Risk
        </h2>
        <p className="hero-subtitle">
          Search any location to get AI-powered risk analysis, 10-year climate trends, and disaster preparedness guidance.
        </p>
        <div className="hero-pills">
          <span className="hero-pill">🌍 195+ Countries</span>
          <span className="hero-pill">📊 10 Years Data</span>
          <span className="hero-pill">🤖 Gemini AI Powered</span>
        </div>
      </section>

      <section className="search-section">
        <SearchBar onLocationFound={handleLocationFound} loading={loading} />
      </section>

      <section className="map-section-fullbleed">
        <div className="map-header">
          <p className="map-section-label">Live Location Map</p>
        </div>
        <MapView location={location} riskData={riskData} />
      </section>

      <main className="app-main">

        {loading && (
          <div className="loading-state card mt-8">
            <div className="loading-pulse"></div>
            <p className="loading-text">{loadingStep}</p>
            <div className="loading-shimmer"></div>
          </div>
        )}

        {error && (
          <div className="error-state card text-center p-8 mt-8">
            <p>{error}</p>
          </div>
        )}

        {!loading && riskData && climateData && (
          <div className="results-section">
            <RiskDashboard 
              locationName={location?.name} 
              riskData={riskData} 
              onRetry={() => handleLocationFound(location)} 
            />
            {riskData && location && (
              <DisasterTimeline
                locationName={location.name}
                riskData={riskData}
              />
            )}
            {riskData && location && (
              <DisasterNewsFeed
                locationName={location.name}
                riskData={riskData}
              />
            )}
            <ClimateCharts climateData={climateData} />
            <PrepAdvisor riskData={riskData} />
            <FutureSimulator locationName={location?.name} climateData={climateData} riskData={riskData} />
            <ClimateChat locationName={location?.name} riskData={riskData} climateData={climateData} />
            {riskData && climateData && location && (
              <LocationCompare
                primaryLocation={location}
                primaryClimateData={climateData}
                primaryRiskData={riskData}
              />
            )}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="header-logo small">⚡</span>
            <span>DisasterLens AI</span>
          </div>
          <p className="footer-tagline">
            AI-powered climate risk intelligence for any location on Earth.
          </p>
          <div className="footer-links">
            <a href="#" className="nav-pill">How it works</a>
            <a href="#" className="nav-pill">About</a>
            <a href="#" className="nav-pill">GitHub</a>
          </div>
          <p className="footer-credit">
            Built with Gemini AI • Open-Meteo • OpenStreetMap — SDG 13 Climate Action
          </p>
        </div>
      </footer>

      <button
        className={`scroll-top-btn ${showScrollTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
      >
        ↑
      </button>
      <InfoModal 
        isOpen={activeModal !== null} 
        onClose={() => setActiveModal(null)} 
        type={activeModal} 
      />
    </div>
  );
}

export default App;