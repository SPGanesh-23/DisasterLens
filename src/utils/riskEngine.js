import { Thermometer, Waves, Sun, Droplets, Tornado, AlertTriangle } from 'lucide-react';

export function getRiskLevel(score) {
  if (score <= 30) return { level: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.1)', text: '#10b981' };
  if (score <= 60) return { level: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' };
  if (score <= 80) return { level: 'High', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', text: '#f43f5e' };
  return { level: 'Severe', color: '#db2777', bg: 'rgba(219,39,119,0.12)', text: '#db2777' };
}

// `icon` is the lucide-react component for the category; `emoji` is kept
// as a fallback for any place that still renders a plain string.
export const RISK_LABELS = {
  heatwave: { label: 'Heatwave Risk', icon: Thermometer, emoji: '🌡️' },
  flood: { label: 'Flood Risk', icon: Waves, emoji: '🌊' },
  drought: { label: 'Drought Risk', icon: Sun, emoji: '🏜️' },
  waterScarcity: { label: 'Water Scarcity', icon: Droplets, emoji: '💧' },
  cyclone: { label: 'Cyclone Risk', icon: Tornado, emoji: '🌀' },
  overallRisk: { label: 'Overall Risk', icon: AlertTriangle, emoji: '⚠️' }
};
