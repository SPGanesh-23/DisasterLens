export function getRiskLevel(score) {
  if (score <= 30) return { level: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.1)', text: '#10b981' };
  if (score <= 60) return { level: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' };
  return { level: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', text: '#ef4444' };
}

export const RISK_LABELS = {
  heatwave: { label: 'Heatwave Risk', icon: '🌡️' },
  flood: { label: 'Flood Risk', icon: '🌊' },
  drought: { label: 'Drought Risk', icon: '🏜️' },
  waterScarcity: { label: 'Water Scarcity', icon: '💧' },
  cyclone: { label: 'Cyclone Risk', icon: '🌀' },
  overallRisk: { label: 'Overall Risk', icon: '⚠️' }
};
