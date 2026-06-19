import React, { useEffect, useRef } from 'react';

function InfoModal({ isOpen, onClose, type }) {
  const modalRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Close on clicking outside the modal content
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalRef}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        {type === 'how-it-works' && (
          <div className="how-it-works-content">
            <div className="modal-icon">⚙️</div>
            <h3 className="modal-title">How DisasterLens AI Works</h3>
            <p className="modal-subtitle">From a city name to a complete climate risk report in seconds</p>

            <div className="how-it-works-flow">
              <div className="how-it-works-step">
                <div className="step-number">1</div>
                <div>
                  <h4 className="step-title">Step 1 — Location Search</h4>
                  <p className="step-description">
                    Type any city, town, or village. We use OpenStreetMap's Nominatim service to convert that name into precise coordinates — completely free, no API key required.
                  </p>
                </div>
              </div>

              <div className="how-it-works-step">
                <div className="step-number">2</div>
                <div>
                  <h4 className="step-title">Step 2 — Historical Climate Data</h4>
                  <p className="step-description">
                    We pull 10 years of real climate records — temperature, rainfall, humidity, and wind speed — from the Open-Meteo Archive API for those exact coordinates.
                  </p>
                </div>
              </div>

              <div className="how-it-works-step">
                <div className="step-number">3</div>
                <div>
                  <h4 className="step-title">Step 3 — AI Risk Analysis</h4>
                  <p className="step-description">
                    That climate data is sent to Google's Gemini 1.5 Flash model, which analyzes the patterns and returns structured risk scores for heatwave, flood, drought, water scarcity, and cyclone risk — each from 0 to 100.
                  </p>
                </div>
              </div>

              <div className="how-it-works-step">
                <div className="step-number">4</div>
                <div>
                  <h4 className="step-title">Step 4 — Context & Preparedness</h4>
                  <p className="step-description">
                    We layer in a historical disaster timeline, live news headlines, and AI-generated preparedness recommendations — turning raw data into something genuinely actionable.
                  </p>
                </div>
              </div>

              <div className="how-it-works-step">
                <div className="step-number">5</div>
                <div>
                  <h4 className="step-title">Step 5 — Look Ahead & Compare</h4>
                  <p className="step-description">
                    Use the Future Simulator to project risk into 2030, 2040, or 2050, or compare two locations side-by-side to make informed decisions.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer-note">
              All data sources are free and publicly available — no paid APIs, no data scraping, no user data collection.
            </div>
          </div>
        )}

        {type === 'about' && (
          <div className="about-content">
            <div className="modal-icon">🌍</div>
            <h3 className="modal-title">About DisasterLens AI</h3>
            <p className="modal-subtitle">AI-Powered Climate Risk Intelligence</p>

            <div className="about-section-block">
              <h4 className="about-section-label">What it is</h4>
              <p className="about-section-text">
                DisasterLens AI is an AI-powered climate risk assessment platform that helps people understand local disaster risk before it becomes an emergency — combining real historical climate data with AI reasoning to deliver location-specific insights.
              </p>
            </div>

            <div className="about-section-block">
              <h4 className="about-section-label">The mission</h4>
              <p className="about-section-text">
                Built as part of an AI for Sustainability internship with 1M1B, in partnership with AICTE, this project is aligned with UN Sustainable Development Goal 13 (Climate Action) and Goal 11 (Sustainable Cities and Communities).
              </p>
            </div>

            <div className="about-section-block">
              <h4 className="about-section-label">Built by</h4>
              <p className="about-section-text">
                Shree Pranava Ganesh N R — a first-year BCA student at Kamaraj College, Thoothukudi, India.
              </p>
            </div>

            <div className="about-section-block">
              <h4 className="about-section-label">Tech stack</h4>
              <div className="tech-pills-row">
                <span className="tech-pill">React</span>
                <span className="tech-pill">Vite</span>
                <span className="tech-pill">Leaflet</span>
                <span className="tech-pill">Open-Meteo</span>
                <span className="tech-pill">Gemini AI</span>
                <span className="tech-pill">GNews</span>
                <span className="tech-pill">Recharts</span>
              </div>
            </div>

            <div className="about-section-block">
              <h4 className="about-section-label">SDG Alignment</h4>
              <div className="sdg-badges-row">
                <div className="sdg-badge">
                  🌍 SDG 13 — Climate Action
                </div>
                <div className="sdg-badge">
                  🏙️ SDG 11 — Sustainable Cities
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InfoModal;
