import React from 'react';
import { getRiskLevel, RISK_LABELS } from '../utils/riskEngine';

// Default fallback recommendations per risk if AI doesn't provide specific grouped ones
// Wait, the requirements say:
// "AI-generated recommendations list (from Gemini output) shown first"
// "Then risk-specific action plans grouped by High Priority (red) and Medium Priority (amber)"
// "Each risk category shows 4 specific local actions"
// The Gemini output provides `recommendations` as a flat array. So we'll map that,
// and for the grouping, we'll check the `riskData` scores.

const GENERIC_ACTIONS = {
  heatwave: [
    "Install cool roofs or reflective coatings",
    "Establish community cooling centers",
    "Plant shade trees in urban areas",
    "Develop early warning SMS systems"
  ],
  flood: [
    "Clear drainage systems regularly",
    "Elevate critical infrastructure",
    "Create natural water retention areas",
    "Prepare emergency evacuation routes"
  ],
  drought: [
    "Implement rainwater harvesting",
    "Switch to drought-resistant crops",
    "Enforce water conservation policies",
    "Build community water reservoirs"
  ],
  waterScarcity: [
    "Fix leaks in municipal pipelines",
    "Promote greywater recycling",
    "Install low-flow fixtures in public buildings",
    "Monitor groundwater levels"
  ],
  cyclone: [
    "Reinforce roofs and structural joints",
    "Stockpile emergency supplies and first aid",
    "Identify secure community shelters",
    "Protect coastal areas with mangroves"
  ]
};

function PrepAdvisor({ riskData }) {
  if (!riskData || !riskData.recommendations) return null;

  const highRisks = [];
  const mediumRisks = [];

  ['heatwave', 'flood', 'drought', 'waterScarcity', 'cyclone'].forEach(risk => {
    const score = riskData[risk];
    if (score > 60) highRisks.push(risk);
    else if (score > 30) mediumRisks.push(risk);
  });

  return (
    <div className="prep-advisor-section mt-8">
      <h3 className="section-title">Disaster Preparedness Advisor</h3>
      
      <div className="card p-6 mb-6 ai-recommendations">
        <h4>AI Primary Recommendations</h4>
        <ul>
          {riskData.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>

      <div className="priority-plans-grid">
        {highRisks.length > 0 && (
          <div className="priority-column high-priority">
            <h4 className="priority-title" style={{ color: '#dc2626' }}>High Priority Actions</h4>
            {highRisks.map(risk => (
              <div key={risk} className="action-card card border-red">
                <div className="action-header">
                  <span>{RISK_LABELS[risk].icon}</span>
                  <h5>{RISK_LABELS[risk].label} Plan</h5>
                </div>
                <ul>
                  {GENERIC_ACTIONS[risk].map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {mediumRisks.length > 0 && (
          <div className="priority-column medium-priority">
            <h4 className="priority-title" style={{ color: '#d97706' }}>Medium Priority Actions</h4>
            {mediumRisks.map(risk => (
              <div key={risk} className="action-card card border-amber">
                <div className="action-header">
                  <span>{RISK_LABELS[risk].icon}</span>
                  <h5>{RISK_LABELS[risk].label} Plan</h5>
                </div>
                <ul>
                  {GENERIC_ACTIONS[risk].map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PrepAdvisor;
