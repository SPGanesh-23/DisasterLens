import { useState } from 'react';
import { predictFutureClimate } from '../services/gemini';
import { getRiskLevel } from '../utils/riskEngine';
import RiskGauge from './RiskGauge';

// One metric, two bars: the current value (muted) and the projected
// value (colored by direction). Arrows show the direction of change.
function CompareBar({ label, current, projected, unit, decimals = 0, upColor = '#f43f5e', downColor = '#10b981', yearLabel }) {
  const diff = projected - current;
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
  const color = direction === 'up' ? upColor : direction === 'down' ? downColor : '#64748b';
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const max = Math.max(current, projected, 1);
  const fmt = (v) => v.toFixed(decimals);

  return (
    <div className="compare-bar-row">
      <div className="compare-bar-head">
        <span className="compare-bar-label">{label}</span>
        <span className="compare-bar-delta" style={{ color }}>
          {arrow} {diff > 0 ? '+' : ''}{fmt(diff)}{unit}
        </span>
      </div>
      <div className="compare-bar-line">
        <span className="compare-bar-tag">Now</span>
        <div className="compare-bar-track">
          <div className="compare-bar-fill current" style={{ width: `${(current / max) * 100}%` }} />
        </div>
        <span className="compare-bar-value">{fmt(current)}{unit}</span>
      </div>
      <div className="compare-bar-line">
        <span className="compare-bar-tag">{yearLabel}</span>
        <div className="compare-bar-track">
          <div className="compare-bar-fill projected" style={{ width: `${(projected / max) * 100}%`, backgroundColor: color }} />
        </div>
        <span className="compare-bar-value">{fmt(projected)}{unit}</span>
      </div>
    </div>
  );
}

function FutureSimulator({ locationName, climateData, riskData }) {
  const [selectedYear, setSelectedYear] = useState('2030');
  const [loading, setLoading] = useState(false);
  const [projection, setProjection] = useState(null);
  const [error, setError] = useState(null);
  // Cache projections per year so revisiting a year never calls Gemini again.
  const [cache, setCache] = useState({});

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    setError(null);
    setProjection(cache[year] || null);
  };

  const handleSimulate = async () => {
    if (cache[selectedYear]) {
      setProjection(cache[selectedYear]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await predictFutureClimate(locationName, climateData.summary, selectedYear);
      setCache((prev) => ({ ...prev, [selectedYear]: data }));
      setProjection(data);
    } catch {
      setError("Failed to generate simulation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentSummary = climateData.summary;

  // The projection has no cyclone score, so the projected overall is the
  // mean of the four projected risk scores.
  const projectedOverall = projection
    ? Math.round((projection.heatwave + projection.flood + projection.drought + projection.waterScarcity) / 4)
    : null;

  const riskChanges = projection ? [
    { label: 'Heatwave Risk', current: riskData.heatwave, projected: projection.heatwave },
    { label: 'Flood Risk', current: riskData.flood, projected: projection.flood },
    { label: 'Drought Risk', current: riskData.drought, projected: projection.drought },
    { label: 'Water Scarcity', current: riskData.waterScarcity, projected: projection.waterScarcity },
  ] : [];

  return (
    <div className="future-simulator-section mt-8">
      <h3 className="section-title">Future Climate Simulator</h3>

      <div className="simulator-controls card p-6 mb-6 text-center">
        <p className="mb-4">Drag the slider to a year and simulate AI-projected climate shifts based on 10-year historical trends.</p>
        <div className="year-slider-wrap">
          <span className="year-slider-label">{selectedYear}</span>
          <input
            type="range"
            min="2025"
            max="2050"
            step="5"
            value={parseInt(selectedYear, 10)}
            onChange={handleYearChange}
            disabled={loading}
            className="year-slider"
            aria-label="Target year for simulation"
          />
          <div className="year-slider-ticks">
            {['2025', '2030', '2035', '2040', '2045', '2050'].map((y) => (
              <span key={y}>{y}</span>
            ))}
          </div>
        </div>
        <button
          className="simulate-btn"
          onClick={handleSimulate}
          disabled={loading}
        >
          {loading ? 'Running Simulation...' : `Simulate ${selectedYear} ➔`}
        </button>
        {error && <p className="error-text mt-2">{error}</p>}
      </div>

      {projection && (
        <div className="simulation-results">
          <div className="sim-summary card p-6 mb-6">
            <h4>{selectedYear} Projection Summary</h4>
            <p>{projection.summary}</p>
            <ul className="mt-4">
              {projection.keyChanges.map((change, i) => <li key={i}>{change}</li>)}
            </ul>
          </div>

          <div className="overall-change-row card p-6 mb-6">
            <div className="overall-change-item">
              <RiskGauge score={riskData.overallRisk} size={110} strokeWidth={10} showBadge={false} />
              <span className="overall-change-label">Now · {riskData.overallRisk}/100</span>
            </div>
            <span className="overall-change-arrow" aria-hidden="true">→</span>
            <div className="overall-change-item">
              <RiskGauge score={projectedOverall} size={110} strokeWidth={10} showBadge={false} />
              <span className="overall-change-label">{selectedYear} · {projectedOverall}/100</span>
            </div>
            <p className="overall-change-note">Projected overall is the average of the four projected risk scores.</p>
          </div>

          <div className="comparison-bars card p-6 mb-6">
            <CompareBar
              label="Avg Max Temperature"
              current={currentSummary.avgTemp}
              projected={projection.projectedTemp}
              unit="°C"
              decimals={1}
              yearLabel={selectedYear}
            />
            <CompareBar
              label="Annual Rainfall"
              current={currentSummary.avgRainfall}
              projected={projection.projectedRainfall}
              unit=" mm"
              upColor="#f43f5e"
              downColor="#f59e0b"
              yearLabel={selectedYear}
            />
            <CompareBar
              label="Dry Days / Year"
              current={currentSummary.avgDryDays}
              projected={projection.projectedDryDays}
              unit=""
              yearLabel={selectedYear}
            />
          </div>

          <div className="risk-change-grid card p-6">
            {riskChanges.map(({ label, current, projected }) => (
              <div className="risk-change-row" key={label}>
                <span>{label}</span>
                <span>
                  <strong style={{ color: getRiskLevel(current).color }}>{current}</strong>
                  {' → '}
                  <strong style={{ color: getRiskLevel(projected).color }}>{projected}</strong>
                  <span className="risk-change-max">/100</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FutureSimulator;
