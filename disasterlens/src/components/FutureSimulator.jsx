import React, { useState } from 'react';
import { predictFutureClimate } from '../services/gemini';
import { getRiskLevel } from '../utils/riskEngine';

function FutureSimulator({ locationName, climateData, riskData }) {
  const [selectedYear, setSelectedYear] = useState('2030');
  const [loading, setLoading] = useState(false);
  const [projection, setProjection] = useState(null);
  const [error, setError] = useState(null);

  const years = ['2030', '2035', '2040', '2050'];

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictFutureClimate(locationName, climateData.summary, selectedYear);
      setProjection(data);
    } catch (err) {
      setError("Failed to generate simulation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentSummary = climateData.summary;

  return (
    <div className="future-simulator-section mt-8">
      <h3 className="section-title">Future Climate Simulator</h3>
      
      <div className="simulator-controls card p-6 mb-6 text-center">
        <p className="mb-4">Select a year to see AI-projected climate shifts based on 10-year historical trends.</p>
        <div className="year-selector mb-4">
          {years.map(year => (
            <button 
              key={year}
              className={`year-btn ${selectedYear === year ? 'active' : ''}`}
              onClick={() => setSelectedYear(year)}
              disabled={loading}
            >
              {year}
            </button>
          ))}
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

          <div className="comparison-grid">
            <div className="compare-col card p-6">
              <h4>Current (2023)</h4>
              <div className="compare-stats">
                <div className="stat-row">
                  <span>Avg Max Temp:</span>
                  <strong>{currentSummary.avgTemp.toFixed(1)}°C</strong>
                </div>
                <div className="stat-row">
                  <span>Annual Rainfall:</span>
                  <strong>{currentSummary.avgRainfall.toFixed(0)}mm</strong>
                </div>
                <div className="stat-row">
                  <span>Dry Days/Year:</span>
                  <strong>{currentSummary.avgDryDays.toFixed(0)}</strong>
                </div>
                <hr />
                <div className="stat-row"><span>Heatwave Risk:</span><strong>{riskData.heatwave}/100</strong></div>
                <div className="stat-row"><span>Flood Risk:</span><strong>{riskData.flood}/100</strong></div>
                <div className="stat-row"><span>Drought Risk:</span><strong>{riskData.drought}/100</strong></div>
                <div className="stat-row"><span>Water Scarcity:</span><strong>{riskData.waterScarcity}/100</strong></div>
              </div>
            </div>

            <div className="compare-col card p-6 future-col">
              <h4>Projected ({selectedYear})</h4>
              <div className="compare-stats">
                <div className="stat-row">
                  <span>Avg Max Temp:</span>
                  <strong className={projection.projectedTemp > currentSummary.avgTemp ? 'text-red' : ''}>
                    {projection.projectedTemp.toFixed(1)}°C
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Annual Rainfall:</span>
                  <strong>{projection.projectedRainfall.toFixed(0)}mm</strong>
                </div>
                <div className="stat-row">
                  <span>Dry Days/Year:</span>
                  <strong className={projection.projectedDryDays > currentSummary.avgDryDays ? 'text-amber' : ''}>
                    {projection.projectedDryDays.toFixed(0)}
                  </strong>
                </div>
                <hr />
                <div className="stat-row">
                  <span>Heatwave Risk:</span>
                  <strong style={{ color: getRiskLevel(projection.heatwave).color }}>{projection.heatwave}/100</strong>
                </div>
                <div className="stat-row">
                  <span>Flood Risk:</span>
                  <strong style={{ color: getRiskLevel(projection.flood).color }}>{projection.flood}/100</strong>
                </div>
                <div className="stat-row">
                  <span>Drought Risk:</span>
                  <strong style={{ color: getRiskLevel(projection.drought).color }}>{projection.drought}/100</strong>
                </div>
                <div className="stat-row">
                  <span>Water Scarcity:</span>
                  <strong style={{ color: getRiskLevel(projection.waterScarcity).color }}>{projection.waterScarcity}/100</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FutureSimulator;
