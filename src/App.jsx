import { useState, useEffect, useRef, useCallback } from 'react';
import { Waves, Flame, Tornado, Thermometer } from 'lucide-react';
import SearchBar from './components/SearchBar';
import MapView from './components/MapView';
import RiskDashboard from './components/RiskDashboard';
import RiskGauge from './components/RiskGauge';
import { Sidebar, BottomNav } from './components/DashboardNav';
import { getSection } from './utils/sections';
import { getRiskLevel, RISK_LABELS } from './utils/riskEngine';
import DisasterTimeline from './components/DisasterTimeline';
import DisasterNewsFeed from './components/DisasterNewsFeed';
import ClimateCharts from './components/ClimateCharts';
import PrepAdvisor from './components/PrepAdvisor';
import FutureSimulator from './components/FutureSimulator';
import ClimateChat from './components/ClimateChat';
import LocationCompare from './components/LocationCompare';
import InfoModal from './components/InfoModal';
import { fetchClimateData } from './services/climate';
import { generateRiskInsights } from './services/gemini';
import { calculateAllRisks } from './utils/riskCalculator';
import './App.css';

// Default location shown on first load so the page is never empty.
const DEFAULT_LOCATION = { name: 'Chennai, Tamil Nadu, India', lat: 13.0827, lon: 80.2707 };

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
  // Dashboard section: only one is visible at a time; the rest stay
  // mounted (so their fetched data and state survive switching) and
  // are hidden with CSS.
  const [activeSection, setActiveSection] = useState('overview');

  // Defined before the effects that call it (and memoized: it only
  // uses stable setState functions, so its identity never changes).
  const handleLocationFound = useCallback(async (loc) => {
    setLocation(loc);
    setClimateData(null);
    setRiskData(null);
    setError(null);
    setLoading(true);

    try {
      setLoadingStep('Fetching 10 years of climate data...');
      const climate = await fetchClimateData(loc.lat, loc.lon);
      setClimateData(climate);

      // Scores are computed locally from the climate data, so they are
      // always available. Only the AI explanation can fail — if it does,
      // show the computed scores with a local summary instead of an
      // empty error screen.
      const riskScores = calculateAllRisks(climate.summary);
      setLoadingStep('Running AI risk analysis...');
      try {
        const risk = await generateRiskInsights(loc.name, climate.summary, riskScores, (msg) => setLoadingStep(msg));
        setRiskData(risk);
      } catch (aiErr) {
        console.warn('AI insights unavailable, showing computed scores.', aiErr);
        setRiskData({
          ...riskScores,
          summary: `Climate risk analysis for ${loc.name} indicates varying levels of vulnerability. Shifting seasonal patterns and temperature trends influence local thermal and environmental risk profiles.`,
          recommendations: [
            'Install rainwater harvesting systems',
            'Maintain emergency water and food supplies',
            'Stay updated with local weather alerts',
            'Reduce heat exposure during peak afternoon hours',
            'Ensure proper drainage around your property',
          ],
          isFallback: true,
        });
      }
    } catch (err) {
      setError(err.message || 'An error occurred during analysis. Please check the console for more details.');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, []);

  // Show the "scroll to top" button once the user has scrolled
  // past the hero/search area.
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 480);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Pre-load a default location on first visit so the page is never
  // empty while waiting for a search. A shared link (?lat&lon&name)
  // wins over the default.
  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (autoLoadedRef.current) return;
    autoLoadedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get('lat') || '');
    const lon = parseFloat(params.get('lon') || '');
    const name = params.get('name');
    if (Number.isFinite(lat) && Number.isFinite(lon) && name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial analysis on first load is this effect's job
      handleLocationFound({ name, lat, lon });
    } else {
      handleLocationFound(DEFAULT_LOCATION);
    }
  }, [handleLocationFound]);

  // Switching sections jumps back to the top of the content area.
  const handleSectionSelect = useCallback((id) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Highest-scoring risk category, for the live hero panel.
  const topThreatKey = riskData
    ? ['heatwave', 'flood', 'drought', 'waterScarcity', 'cyclone'].reduce((a, b) => (riskData[b] > riskData[a] ? b : a))
    : null;
  const TopThreatIcon = topThreatKey ? RISK_LABELS[topThreatKey].icon : null;
  const topThreatLevel = topThreatKey ? getRiskLevel(riskData[topThreatKey]) : null;

  const hasAnalysis = !loading && riskData && climateData;
  const activeSectionMeta = getSection(activeSection);
  const sectionClass = (id) => `dash-section ${activeSection === id ? 'active' : ''}`;
  const emptyState = !loading && !riskData && !error;

  return (
    <div className="app-container dashboard-layout">
      <Sidebar activeSection={activeSection} onSelect={handleSectionSelect} onOpenModal={setActiveModal} />

      <div className="dashboard-main">
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
          <div className="topbar-section-title" aria-live="polite">
            <h2>{activeSectionMeta.label}</h2>
            <p>{activeSectionMeta.description}</p>
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

        <main className="app-main dashboard-content">
          {loading && (
            <div className="loading-skeletons mt-8" aria-live="polite">
              <p className="loading-text">{loadingStep}</p>
              <div className="skeleton-card skeleton-gauge" />
              <div className="skeleton-grid">
                <div className="skeleton-card skeleton-mini" />
                <div className="skeleton-card skeleton-mini" />
                <div className="skeleton-card skeleton-mini" />
              </div>
              <div className="skeleton-card skeleton-chart" />
            </div>
          )}

          {error && (
            <div className="error-state card text-center p-8 mt-8">
              <p>{error}</p>
            </div>
          )}

          {/* Overview — hero is the live risk overview: gauge, top threat,
              key stats, search and city chips all live here. */}
          <section className={sectionClass('overview')} aria-label="Overview">
            <div className="hero-section">
              <div className="hero-rain" aria-hidden="true" />
              <div className="hero-floaters" aria-hidden="true">
                <span className="hero-floater"><Waves size={28} /></span>
                <span className="hero-floater"><Flame size={24} /></span>
                <span className="hero-floater"><Tornado size={28} /></span>
                <span className="hero-floater"><Thermometer size={26} /></span>
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

              <div className="search-section hero-search">
                <SearchBar onLocationFound={handleLocationFound} loading={loading} />
              </div>

              {!loading && riskData && climateData && location && topThreatKey && (
                <div className="hero-live card" aria-live="polite">
                  <RiskGauge score={riskData.overallRisk} size={120} />
                  <div className="hero-live-stats">
                    <p className="hero-live-location">{location.name}</p>
                    <div className="hero-live-stat-row">
                      <div className="hero-live-stat">
                        <span className="hero-live-stat-label">Top threat</span>
                        <span className="hero-live-stat-value" style={{ color: topThreatLevel.color }}>
                          {TopThreatIcon && <TopThreatIcon size={16} />}
                          {RISK_LABELS[topThreatKey].label.replace(' Risk', '')} · {riskData[topThreatKey]}
                        </span>
                      </div>
                      <div className="hero-live-stat">
                        <span className="hero-live-stat-label">Avg max temp</span>
                        <span className="hero-live-stat-value">{climateData.summary.avgTemp.toFixed(1)}°C</span>
                      </div>
                      <div className="hero-live-stat">
                        <span className="hero-live-stat-label">Annual rainfall</span>
                        <span className="hero-live-stat-value">{Math.round(climateData.summary.avgRainfall)} mm</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Map lives in Overview now, right under the hero — search a
                place, see it on the map, then the scores below. */}
            <div className="map-section-fullbleed">
              <div className="map-header">
                <p className="map-section-label">Live Location Map</p>
              </div>
              <MapView location={location} riskData={riskData} onMapClick={handleLocationFound} active={activeSection === 'overview'} />
            </div>

            {hasAnalysis && (
              <RiskDashboard
                locationName={location?.name}
                location={location}
                riskData={riskData}
              />
            )}
          </section>

          {/* Trends — 10-year charts and the future simulator. */}
          <section className={sectionClass('trends')} aria-label="Trends">
            {hasAnalysis && (
              <>
                <ClimateCharts climateData={climateData} />
                <FutureSimulator locationName={location?.name} climateData={climateData} riskData={riskData} />
              </>
            )}
            {emptyState && (
              <div className="card section-empty">
                <p>Search a location in Overview to see climate trends here.</p>
              </div>
            )}
          </section>

          {/* Timeline — historical disasters and live news. */}
          <section className={sectionClass('timeline')} aria-label="Timeline">
            {hasAnalysis && location && (
              <>
                <DisasterTimeline
                  locationName={location.name}
                  riskData={riskData}
                />
                <DisasterNewsFeed
                  locationName={location.name}
                  riskData={riskData}
                />
              </>
            )}
            {emptyState && (
              <div className="card section-empty">
                <p>Search a location in Overview to see its disaster timeline here.</p>
              </div>
            )}
          </section>

          {/* Prepare — preparedness advisor. */}
          <section className={sectionClass('prepare')} aria-label="Prepare">
            {hasAnalysis && <PrepAdvisor riskData={riskData} />}
            {emptyState && (
              <div className="card section-empty">
                <p>Search a location in Overview to see preparedness plans here.</p>
              </div>
            )}
          </section>

          {/* Compare — side-by-side location comparison. */}
          <section className={sectionClass('compare')} aria-label="Compare">
            {hasAnalysis && location && (
              <LocationCompare
                primaryLocation={location}
                primaryClimateData={climateData}
                primaryRiskData={riskData}
              />
            )}
            {emptyState && (
              <div className="card section-empty">
                <p>Search a location in Overview to compare it with another city here.</p>
              </div>
            )}
          </section>

          {/* Chat — the climate advisor. */}
          <section className={sectionClass('chat')} aria-label="Chat">
            {hasAnalysis && location && (
              <ClimateChat locationName={location?.name} riskData={riskData} climateData={climateData} />
            )}
            {emptyState && (
              <div className="card section-empty">
                <p>Search a location in Overview to ask the climate advisor about it here.</p>
              </div>
            )}
          </section>
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
              <button className="nav-pill" onClick={() => setActiveModal('how-it-works')}>How it works</button>
              <button className="nav-pill" onClick={() => setActiveModal('about')}>About</button>
              <a href="https://github.com/SPGanesh-23/DisasterLens" target="_blank" rel="noopener noreferrer" className="nav-pill">GitHub</a>
            </div>
            <p className="footer-credit">
              Built with Gemini AI • Open-Meteo • OpenStreetMap — SDG 13 Climate Action
            </p>
          </div>
        </footer>
      </div>

      <BottomNav activeSection={activeSection} onSelect={handleSectionSelect} />

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
