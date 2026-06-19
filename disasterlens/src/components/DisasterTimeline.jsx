import React, { useState, useEffect } from 'react';
import { fetchDisasterTimeline } from '../services/gemini';

const categoryIcons = {
  flood: '🌊',
  heatwave: '🌡️',
  cyclone: '🌀',
  drought: '🏜️',
  earthquake: '🌍',
  landslide: '⛰️',
  storm: '⛈️',
  other: '⚠️',
};

const severityColors = {
  Minor: '#10b981',
  Moderate: '#f59e0b',
  Severe: '#ef4444',
  Catastrophic: '#dc2626',
};

const categoryColors = {
  flood: '#3b82f6',
  heatwave: '#ef4444',
  cyclone: '#8b5cf6',
  drought: '#f59e0b',
  earthquake: '#6b7280',
  landslide: '#92400e',
  storm: '#06b6d4',
  other: '#94a3b8',
};

function DisasterTimeline({ locationName, riskData }) {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetched, setFetched] = useState(false);

  const loadTimeline = async (force = false) => {
    if (fetched && !force) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDisasterTimeline(locationName);
      // Sort oldest to newest if not already sorted, though Gemini was instructed to do so
      const sorted = (data || []).sort((a, b) => parseInt(a.year) - parseInt(b.year));
      setTimelineData(sorted);
      setFetched(true);
    } catch (err) {
      console.error(err);
      setError('Could not load historical data. This may be due to API load — the rest of your analysis is unaffected.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locationName) {
      setFetched(false);
      setTimelineData([]);
      // Call loadTimeline directly, forcing it as the location changed
      setLoading(true);
      setError(null);
      
      let isMounted = true;
      const fetchInitial = async () => {
        try {
          const data = await fetchDisasterTimeline(locationName);
          const sorted = (data || []).sort((a, b) => parseInt(a.year) - parseInt(b.year));
          if (isMounted) {
            setTimelineData(sorted);
            setFetched(true);
          }
        } catch (err) {
          console.error(err);
          if (isMounted) {
            setError('Could not load historical data. This may be due to API load — the rest of your analysis is unaffected.');
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      fetchInitial();
      return () => {
        isMounted = false;
      };
    }
  }, [locationName]);

  // Observer scroll animation
  useEffect(() => {
    if (timelineData.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('timeline-card-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const cards = document.querySelectorAll('.timeline-card');
    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, [timelineData]);

  if (loading) {
    return (
      <div className="timeline-section mt-8 card p-6">
        <div className="compare-header-row mb-6">
          <div>
            <h3 className="section-title">Historical Disaster Timeline</h3>
            <p className="section-subtitle">Researching historical disasters for {locationName}...</p>
          </div>
        </div>
        <div className="skeleton-timeline">
          <div className="timeline-center-line pulse-line"></div>
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className={`timeline-item ${idx % 2 === 0 ? 'even-item' : 'odd-item'}`}>
              <div className="timeline-dot skeleton-dot"></div>
              <div className="timeline-card skeleton-card">
                <div className="skeleton-shimmer"></div>
                <div className="skeleton-line skeleton-header"></div>
                <div className="skeleton-line skeleton-body-1"></div>
                <div className="skeleton-line skeleton-body-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timeline-section mt-8 card p-8 text-center error-state">
        <h3 className="section-title mb-2">Historical Disaster Timeline</h3>
        <p className="error-message text-red mb-4">{error}</p>
        <button onClick={() => loadTimeline(true)} className="search-button btn-small">
          Retry Analysis
        </button>
      </div>
    );
  }

  if (!timelineData || timelineData.length === 0) return null;

  return (
    <div className="timeline-section mt-8 card p-6">
      <div className="compare-header-row mb-6">
        <div>
          <h3 className="section-title">Historical Disaster Timeline</h3>
          <p className="section-subtitle">{locationName} — Documented climate events and natural disasters</p>
        </div>
        <div className="info-pill-container">
          <span className="info-pill">{timelineData.length} events documented</span>
        </div>
      </div>

      <div className="timeline-container relative">
        <div className="timeline-center-line"></div>

        {timelineData.map((event, idx) => {
          const sColor = severityColors[event.severity] || '#6b7280';
          const cColor = categoryColors[event.category] || '#94a3b8';
          const isCatastrophic = event.severity === 'Catastrophic';

          return (
            <div key={idx} className={`timeline-item ${idx % 2 === 0 ? 'even-item' : 'odd-item'}`}>
              <div
                className={`timeline-dot ${isCatastrophic ? 'catastrophic-glow' : ''}`}
                style={{
                  backgroundColor: cColor,
                  '--dot-color': cColor,
                }}
              ></div>
              <div className="timeline-card">
                <div className="timeline-card-top-row mb-2">
                  <div className="timeline-card-time">
                    <span className="timeline-year" style={{ color: sColor }}>
                      {event.year}
                    </span>
                    <span className="timeline-month text-muted ml-2">
                      {event.month && event.month !== 'Unknown' ? event.month : ''}
                    </span>
                  </div>
                  <span
                    className="severity-badge"
                    style={{
                      backgroundColor: `${sColor}1A`,
                      borderColor: `${sColor}4D`,
                      color: sColor,
                    }}
                  >
                    {event.severity}
                  </span>
                </div>

                <div className="timeline-card-title-row">
                  <span className="timeline-category-icon">{categoryIcons[event.category] || '⚠️'}</span>
                  <h4 className="timeline-event-title">{event.title}</h4>
                </div>

                <p className="timeline-event-desc mt-2">{event.description}</p>

                <div className="timeline-card-footer mt-4">
                  <span className="timeline-casualties">
                    👥 Casualties: {event.casualties && event.casualties !== 'Unknown' ? event.casualties : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DisasterTimeline;
