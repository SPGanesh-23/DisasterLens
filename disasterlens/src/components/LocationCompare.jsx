import React, { useState } from 'react';
import { geocodeLocation } from '../services/geocoding';
import { fetchClimateData } from '../services/climate';
import { generateRiskInsights } from '../services/gemini';
import { calculateAllRisks } from '../utils/riskCalculator';
import { getRiskLevel, RISK_LABELS } from '../utils/riskEngine';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function LocationCompare({ primaryLocation, primaryClimateData, primaryRiskData }) {
  const [secondQuery, setSecondQuery] = useState('');
  const [secondLocation, setSecondLocation] = useState(null);
  const [secondClimateData, setSecondClimateData] = useState(null);
  const [secondRiskData, setSecondRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('risks');

  const truncate = (name, limit = 18) => {
    if (!name) return '';
    return name.length > limit ? name.substring(0, limit) + '...' : name;
  };

  const handleCompareSubmit = async (e) => {
    e.preventDefault();
    if (!secondQuery.trim()) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Geocode
      const location = await geocodeLocation(secondQuery);

      // Check if same as primary
      const isSameName = location.name.toLowerCase() === primaryLocation.name.toLowerCase();
      const isSameCoords = Math.abs(location.lat - primaryLocation.lat) < 0.01 && 
                           Math.abs(location.lon - primaryLocation.lon) < 0.01;

      if (isSameName || isSameCoords) {
        setError('Please choose a different city to compare');
        setLoading(false);
        return;
      }

      // 2. Climate Data
      const climate = await fetchClimateData(location.lat, location.lon);

      // 3. Gemini Analysis
      const riskScores = calculateAllRisks(climate.summary);
      const risk = await generateRiskInsights(location.name, climate.summary, riskScores);

      // Set state
      setSecondLocation(location);
      setSecondClimateData(climate);
      setSecondRiskData(risk);
    } catch (err) {
      setError(err.message || 'Location not found or analysis failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSecondQuery('');
    setSecondLocation(null);
    setSecondClimateData(null);
    setSecondRiskData(null);
    setError(null);
    setLoading(false);
    setActiveTab('risks');
  };

  // Pre-calculations for comparisons
  const isComparisonLoaded = secondLocation && secondClimateData && secondRiskData;

  // Tab 1: Risk Winner
  const primaryOverall = primaryRiskData?.overallRisk || 0;
  const secondOverall = secondRiskData?.overallRisk || 0;
  let winnerText = '';
  if (isComparisonLoaded) {
    if (primaryOverall < secondOverall) {
      winnerText = `✅ ${primaryLocation.name} is safer overall`;
    } else if (secondOverall < primaryOverall) {
      winnerText = `✅ ${secondLocation.name} is safer overall`;
    } else {
      winnerText = `⚖️ Both locations have equal overall risk`;
    }
  }

  // Tab 2: Combined charts data
  const combinedChartData = isComparisonLoaded
    ? primaryClimateData.yearlyData.map((pYear) => {
        const sYear = secondClimateData.yearlyData.find((y) => y.year === pYear.year) || {};
        return {
          year: pYear.year,
          primaryTemp: pYear.avgTemp,
          secondTemp: sYear.avgTemp,
          primaryRain: pYear.totalRain,
          secondRain: sYear.totalRain,
        };
      })
    : [];

  const tooltipStyle = {
    backgroundColor: '#0c1e36',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#f1f5f9'
  };

  // Risk Types
  const riskTypes = ['heatwave', 'flood', 'drought', 'waterScarcity', 'cyclone'];

  const formatTableVal = (val, metricKey) => {
    const num = parseFloat(val);
    if (metricKey === 'avgTemp') return `${num.toFixed(1)}°C`;
    if (metricKey === 'avgRainfall') return `${num.toFixed(0)}mm`;
    if (metricKey === 'avgHumidity') return `${num.toFixed(0)}%`;
    if (metricKey === 'avgDryDays') return `${num.toFixed(0)}`;
    if (metricKey === 'tempTrend') return `${num > 0 ? '+' : ''}${num.toFixed(1)}°C`;
    return val;
  };

  const getBetterCity = (pVal, sVal, metricKey) => {
    const pNum = parseFloat(pVal);
    const sNum = parseFloat(sVal);
    if (pNum === sNum) return 'Equal';
    const higherIsBetter = metricKey === 'avgRainfall';
    if (higherIsBetter) {
      return pNum > sNum ? primaryLocation.name : secondLocation.name;
    } else {
      return pNum < sNum ? primaryLocation.name : secondLocation.name;
    }
  };

  return (
    <div className="location-compare-section mt-8 card p-6">
      <div className="compare-header-row">
        <div>
          <h3 className="section-title">Compare Two Locations</h3>
          <p className="section-subtitle">Analyze and compare climate risks between two cities side by side</p>
        </div>
        <div className="info-pill-container">
          <span className="info-pill">Primary location is locked. Search a second city to compare.</span>
        </div>
      </div>

      <div className="compare-search-container mt-4">
        <form onSubmit={handleCompareSubmit} className="search-form">
          <input
            type="text"
            placeholder="Search a second city to compare..."
            value={secondQuery}
            onChange={(e) => setSecondQuery(e.target.value)}
            disabled={loading}
            className="search-input"
          />
          <button type="submit" disabled={loading || !secondQuery.trim()} className="search-button">
            {loading ? 'Analyzing...' : 'Compare'}
          </button>
        </form>
        {error && <p className="search-error">{error}</p>}
      </div>

      {loading && (
        <div className="compare-loading mt-6">
          <div className="loading-pulse"></div>
          <p className="loading-text text-center">Fetching comparison data and analyzing risks...</p>
        </div>
      )}

      {isComparisonLoaded && !loading && (
        <div className="comparison-content-area mt-6">
          <div className="clear-row">
            <button className="clear-btn" onClick={handleClear}>✕ Clear comparison</button>
          </div>

          <div className="tabs-bar">
            <div
              className={`tab-item ${activeTab === 'risks' ? 'active' : ''}`}
              onClick={() => setActiveTab('risks')}
            >
              Risk Scores
            </div>
            <div
              className={`tab-item ${activeTab === 'trends' ? 'active' : ''}`}
              onClick={() => setActiveTab('trends')}
            >
              Climate Trends
            </div>
            <div
              className={`tab-item ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              Recommendations
            </div>
          </div>

          {activeTab === 'risks' && (
            <div className="tab-pane-risks">
              <div className="winner-banner-container text-center">
                <span className="winner-banner">{winnerText}</span>
              </div>

              <div className="head-to-head-container mt-6">
                {riskTypes.map((key) => {
                  const score1 = primaryRiskData[key];
                  const score2 = secondRiskData[key];
                  const level1 = getRiskLevel(score1);
                  const level2 = getRiskLevel(score2);
                  const labelInfo = RISK_LABELS[key];

                  return (
                    <div key={key} className="risk-comp-row">
                      <div className="risk-comp-header">
                        <div className="risk-comp-city1">
                          <span className="city-name-label">{truncate(primaryLocation.name, 15)}</span>
                          <span className="risk-score-value" style={{ color: level1.color }}>
                            {score1}
                            {score1 < score2 && <span className="better-badge">✓</span>}
                          </span>
                        </div>
                        <div className="risk-comp-center">
                          <span className="risk-comp-icon">{labelInfo.icon}</span>
                          <span className="risk-comp-label">{labelInfo.label}</span>
                        </div>
                        <div className="risk-comp-city2">
                          <span className="risk-score-value" style={{ color: level2.color }}>
                            {score2 < score1 && <span className="better-badge">✓</span>}
                            {score2}
                          </span>
                          <span className="city-name-label">{truncate(secondLocation.name, 15)}</span>
                        </div>
                      </div>
                      <div className="risk-comp-bars">
                        <div className="progress-bar-bg left-bar-container">
                          <div
                            className="progress-bar-fill left-bar-fill"
                            style={{
                              width: `${score1}%`,
                              backgroundColor: level1.color,
                              boxShadow: `0 0 8px ${level1.color}66`,
                            }}
                          ></div>
                        </div>
                        <div className="progress-bar-bg right-bar-container">
                          <div
                            className="progress-bar-fill right-bar-fill"
                            style={{
                              width: `${score2}%`,
                              backgroundColor: level2.color,
                              boxShadow: `0 0 8px ${level2.color}66`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="overall-comp-grid mt-8">
                <div className={`overall-comp-card card ${primaryOverall < secondOverall ? 'safer-card' : ''}`}>
                  <h4 className="overall-comp-city">{primaryLocation.name}</h4>
                  <div className="overall-score-display" style={{ color: getRiskLevel(primaryOverall).color }}>
                    {primaryOverall}
                  </div>
                  <div
                    className="badge"
                    style={{
                      backgroundColor: getRiskLevel(primaryOverall).bg,
                      color: getRiskLevel(primaryOverall).text,
                      borderColor: `${getRiskLevel(primaryOverall).color}4D`,
                    }}
                  >
                    {getRiskLevel(primaryOverall).level} Risk
                  </div>
                  <p className="overall-comp-summary mt-4">{primaryRiskData.summary}</p>
                </div>

                <div className={`overall-comp-card card ${secondOverall < primaryOverall ? 'safer-card' : ''}`}>
                  <h4 className="overall-comp-city">{secondLocation.name}</h4>
                  <div className="overall-score-display" style={{ color: getRiskLevel(secondOverall).color }}>
                    {secondOverall}
                  </div>
                  <div
                    className="badge"
                    style={{
                      backgroundColor: getRiskLevel(secondOverall).bg,
                      color: getRiskLevel(secondOverall).text,
                      borderColor: `${getRiskLevel(secondOverall).color}4D`,
                    }}
                  >
                    {getRiskLevel(secondOverall).level} Risk
                  </div>
                  <p className="overall-comp-summary mt-4">{secondRiskData.summary}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="tab-pane-trends">
              <div className="charts-grid">
                <div className="chart-card card">
                  <h4 className="chart-title">Temperature Trend Comparison (°C)</h4>
                  <div className="chart-container" style={{ height: '260px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={combinedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#f1f5f9' }} />
                        <Legend wrapperStyle={{ fontSize: 12, marginTop: 5 }} />
                        <Line
                          type="monotone"
                          dataKey="primaryTemp"
                          name={truncate(primaryLocation.name, 18)}
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          dot={{ fill: '#3b82f6', r: 3 }}
                          activeDot={{ r: 6, fill: '#3b82f6', stroke: '#020817', strokeWidth: 2 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="secondTemp"
                          name={truncate(secondLocation.name, 18)}
                          stroke="#f59e0b"
                          strokeWidth={2.5}
                          dot={{ fill: '#f59e0b', r: 3 }}
                          activeDot={{ r: 6, fill: '#f59e0b', stroke: '#020817', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="chart-card card">
                  <h4 className="chart-title">Annual Rainfall Comparison (mm)</h4>
                  <div className="chart-container" style={{ height: '260px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={combinedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#f1f5f9' }} />
                        <Legend wrapperStyle={{ fontSize: 12, marginTop: 5 }} />
                        <Bar dataKey="primaryRain" name={truncate(primaryLocation.name, 18)} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="secondRain" name={truncate(secondLocation.name, 18)} fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="comparison-table-wrapper mt-8 card">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>{truncate(primaryLocation.name, 18)}</th>
                      <th>{truncate(secondLocation.name, 18)}</th>
                      <th>Better</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Avg Max Temp', key: 'avgTemp' },
                      { name: 'Annual Rainfall', key: 'avgRainfall' },
                      { name: 'Avg Humidity', key: 'avgHumidity' },
                      { name: 'Avg Dry Days/yr', key: 'avgDryDays' },
                      { name: 'Temp Trend (10yr)', key: 'tempTrend' },
                    ].map((row) => {
                      const pVal = primaryClimateData.summary[row.key];
                      const sVal = secondClimateData.summary[row.key];
                      const betterCity = getBetterCity(pVal, sVal, row.key);

                      return (
                        <tr key={row.key}>
                          <td>{row.name}</td>
                          <td>{formatTableVal(pVal, row.key)}</td>
                          <td>{formatTableVal(sVal, row.key)}</td>
                          <td className="better-cell">
                            {betterCity === 'Equal' ? (
                              <span className="equal-label">Equal</span>
                            ) : (
                              <span className="better-label">{truncate(betterCity, 15)} ✓</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="tab-pane-recommendations">
              <div className="recommendations-cols">
                <div className="rec-column">
                  <h4 className="rec-col-header">
                    <span className="dot-indicator primary-dot"></span>
                    {primaryLocation.name}
                  </h4>
                  <div className="rec-list">
                    {(primaryRiskData.recommendations || []).map((rec, i) => (
                      <div key={i} className="rec-card primary-rec-card">
                        <div className="rec-number">{i + 1}</div>
                        <div className="rec-text">{rec}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rec-column">
                  <h4 className="rec-col-header">
                    <span className="dot-indicator second-dot"></span>
                    {secondLocation.name}
                  </h4>
                  <div className="rec-list">
                    {(secondRiskData.recommendations || []).map((rec, i) => (
                      <div key={i} className="rec-card second-rec-card">
                        <div className="rec-number">{i + 1}</div>
                        <div className="rec-text">{rec}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LocationCompare;
