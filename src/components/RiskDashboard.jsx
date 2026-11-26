import { useEffect, useState } from 'react';
import { Share2, Printer } from 'lucide-react';
import { getRiskLevel, RISK_LABELS } from '../utils/riskEngine';
import { useCountUp } from '../hooks/useCountUp';
import RiskGauge from './RiskGauge';

const RISK_KEYS = ['heatwave', 'flood', 'drought', 'waterScarcity', 'cyclone'];

function RiskCategoryCard({ categoryKey, score, isBiggestThreat, mounted }) {
  const animatedScore = useCountUp(score);
  const level = getRiskLevel(score);
  const labelInfo = RISK_LABELS[categoryKey];
  const Icon = labelInfo.icon;

  return (
    <div className="risk-card">
      <div className="risk-card-header">
        <span className="risk-icon-tile" style={{ color: level.color, backgroundColor: level.bg }}>
          {Icon ? <Icon size={20} /> : labelInfo.emoji}
        </span>
        <span className="risk-label">{labelInfo.label}</span>
        {isBiggestThreat && <span className="biggest-threat-tag">Biggest threat</span>}
      </div>

      <div className="risk-score-row">
        <span className="risk-score" style={{ color: level.color }}>
          {animatedScore}<span className="risk-score-max">/100</span>
        </span>
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
            width: mounted ? `${score}%` : '0%',
            backgroundColor: level.color,
            boxShadow: `0 0 8px ${level.color}66`
          }}
        ></div>
      </div>
    </div>
  );
}

function RiskDashboard({ locationName, location, riskData }) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Bars start at width 0 and sweep to their score once mounted.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (!riskData) return null;

  const sortedCategories = RISK_KEYS
    .map((key) => ({ key, score: riskData[key] }))
    .sort((a, b) => b.score - a.score);
  const isFallback = riskData.isFallback || (riskData.summary && riskData.summary.includes('temporarily unavailable'));

  const handleShare = async () => {
    if (!location) return;
    const url = `${window.location.origin}${window.location.pathname}?lat=${location.lat}&lon=${location.lon}&name=${encodeURIComponent(location.name)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API unavailable (e.g. non-secure context): fall back
      // to a temporary textarea + execCommand.
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* copy failed; toast still shows */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
  };

  return (
    <div className="risk-dashboard">
      <div className="card text-center mb-4 p-6">
        <h2 className="location-title">{locationName}</h2>
        <p className="risk-subtitle">Overall Climate Risk Assessment</p>

        <RiskGauge score={riskData.overallRisk} />
        <p className="overall-label">Overall Risk Score</p>

        <p className="risk-summary mt-4">{riskData.summary}</p>
        {isFallback && (
          <p className="fallback-note">AI insight temporarily unavailable — scores below are calculated from 10 years of climate data.</p>
        )}

        <div className="dashboard-actions">
          <button type="button" className="dashboard-action-btn" onClick={handleShare} disabled={!location}>
            <Share2 size={15} /> Share
          </button>
          <button type="button" className="dashboard-action-btn" onClick={() => window.print()}>
            <Printer size={15} /> Download report
          </button>
        </div>
        {copied && <div className="share-toast" role="status">Copied!</div>}
      </div>

      <div className="risk-grid">
        {sortedCategories.map(({ key, score }, index) => (
          <RiskCategoryCard
            key={key}
            categoryKey={key}
            score={score}
            isBiggestThreat={index === 0}
            mounted={mounted}
          />
        ))}
      </div>
    </div>
  );
}

export default RiskDashboard;
