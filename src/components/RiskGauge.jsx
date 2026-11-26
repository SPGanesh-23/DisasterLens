import { useEffect, useState } from 'react';
import { getRiskLevel } from '../utils/riskEngine';
import { useCountUp } from '../hooks/useCountUp';

// SVG radial gauge: circular track + colored arc that sweeps from 0 to
// the score, with the counting number in the center and the risk level
// badge below. Colors come from getRiskLevel. With reduced motion the
// arc snaps to its final position (see index.css) and the number
// appears instantly (see useCountUp).
function RiskGauge({ score, size = 180, strokeWidth = 12, showBadge = true }) {
  const level = getRiskLevel(score);
  const animatedScore = useCountUp(score);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (mounted ? score : 0) / 100);

  return (
    <div className="risk-gauge-wrap">
      <div className="risk-gauge" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 200 200"
          className="risk-gauge-svg"
          role="img"
          aria-label={`Overall risk ${score} out of 100`}
        >
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
          <circle
            cx="100" cy="100" r={radius} fill="none"
            stroke={level.color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 100 100)"
            className="risk-gauge-arc"
          />
        </svg>
        <div className="risk-gauge-center">
          <span className="risk-gauge-score" style={{ color: level.color, fontSize: Math.round(size * 0.26) }}>
            {animatedScore}
          </span>
          <span className="risk-gauge-max">/100</span>
        </div>
      </div>
      {showBadge && (
        <span
          className="badge"
          style={{
            backgroundColor: level.bg,
            color: level.text,
            borderColor: `${level.color}4D`,
          }}
        >
          {level.level} Risk
        </span>
      )}
    </div>
  );
}

export default RiskGauge;
