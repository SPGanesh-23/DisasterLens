import React from 'react';
import { getRiskLevel, RISK_LABELS } from '../utils/riskEngine';

function RiskDashboard({ locationName, riskData, onRetry }) {
  if (!riskData) return null;

  const overallRiskLevel = getRiskLevel(riskData.overallRisk);
  
  const riskCategories = ['heatwave', 'flood', 'drought', 'waterScarcity', 'cyclone'];
  const isFallback = riskData.isFallback || (riskData.summary && riskData.summary.includes("temporarily unavailable"));

  return (
    <div className="risk-dashboard">
      {isFallback && (
        <div className="fallback-warning-banner" onClick={onRetry}>
          ⚠️ AI analysis temporarily unavailable — showing estimated scores. <span className="retry-link">Click here to retry.</span>
        </div>
      )}
      <div className="card text-center mb-4 p-6">
        <h2 className="location-title">{locationName}</h2>
        <p className="risk-subtitle">Overall Climate Risk Assessment</p>
        
        <div className="overall-score-container" style={{ color: overallRiskLevel.color }}>
          <span className="overall-score">{riskData.overallRisk}</span>
          <span className="overall-max">/100</span>
        </div>
        <p className="overall-label">Overall Risk Score</p>
        
        <div 
          className="badge" 
          style={{ 
            backgroundColor: overallRiskLevel.bg, 
            color: overallRiskLevel.text,
            borderColor: `${overallRiskLevel.color}4D`
          }}
        >
          {overallRiskLevel.level} Risk
        </div>
        
        <p className="risk-summary mt-4">{riskData.summary}</p>
      </div>

      <div className="risk-grid">
        {riskCategories.map(key => {
          const score = riskData[key];
          const level = getRiskLevel(score);
          const labelInfo = RISK_LABELS[key];
          
          return (
            <div key={key} className="risk-card">
              <div className="risk-card-header">
                <span className="risk-icon">{labelInfo.icon}</span>
                <span className="risk-label">{labelInfo.label}</span>
              </div>
              
              <div className="risk-score-row">
                <span className="risk-score" style={{ color: level.color }}>{score}<span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 400 }}>/100</span></span>
                <span 
                  className="badge" 
                  style={{ 
                    backgroundColor: level.bg, 
                    color: level.text,
                    borderColor: `${level.color}4D`
                  }}
                >
                  {level.level}
                </span>
              </div>
              
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${score}%`, 
                    backgroundColor: level.color,
                    boxShadow: `0 0 8px ${level.color}66`
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RiskDashboard;
