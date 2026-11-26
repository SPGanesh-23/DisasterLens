import { useState, useEffect } from 'react';
import { ComposedChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Metric tabs: temperature (area + 10-yr avg line), rainfall (bars),
// dry days (bars). Tapping a dot/bar selects that year and shows its
// numbers vs the 10-year average in the detail strip below.
const METRICS = {
  temp: { label: 'Temperature', key: 'avgTemp', unit: '°C', title: 'Average Maximum Temperature (°C)' },
  rain: { label: 'Rainfall', key: 'totalRain', unit: 'mm', title: 'Annual Rainfall (mm)' },
  dry: { label: 'Dry Days', key: 'dryDays', unit: ' days', title: 'Dry Days per Year' },
};

function ClimateCharts({ climateData }) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [activeMetric, setActiveMetric] = useState('temp');
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    const checkScreen = () => setIsSmallScreen(window.innerWidth < 768);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // A new location means new data — clear the selected year.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the selected year when the location changes is this effect's job
    setSelectedYear(null);
  }, [climateData]);

  if (!climateData || !climateData.yearlyData || climateData.yearlyData.length === 0) return null;

  const data = climateData.yearlyData;

  const tooltipStyle = {
    backgroundColor: '#1e293b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#f1f5f9'
  };

  // Plain-language insights, computed from the yearly data.
  const first = data[0];
  const last = data[data.length - 1];

  const trendText = (diff, unit, what, decimals = 1) => {
    if (data.length < 2) return `${what} trend based on the available yearly data.`;
    if (Math.abs(diff) < 0.05) return `${what} stayed roughly steady between ${first.year} and ${last.year}.`;
    const verb = diff > 0 ? 'rose' : 'fell';
    return `${what} ${verb} ${Math.abs(diff).toFixed(decimals)}${unit} between ${first.year} and ${last.year}.`;
  };

  const tempDiff = last.avgTemp - first.avgTemp;
  const tempInsight = `Average maximum temperature ${data.length < 2 ? 'trend based on the available yearly data.' : Math.abs(tempDiff) < 0.05 ? `stayed roughly steady between ${first.year} and ${last.year}.` : `${tempDiff > 0 ? 'rose' : 'fell'} ${Math.abs(tempDiff).toFixed(1)}°C between ${first.year} and ${last.year}.`}`;

  const rainDiff = last.totalRain - first.totalRain;
  const rainInsight = data.length < 2
    ? 'Rainfall trend based on the available yearly data.'
    : Math.abs(rainDiff) < 1
      ? `Annual rainfall stayed roughly steady between ${first.year} and ${last.year}.`
      : rainDiff > 0
        ? `Annual rainfall rose from ${Math.round(first.totalRain)} mm in ${first.year} to ${Math.round(last.totalRain)} mm in ${last.year}.`
        : `Annual rainfall fell from ${Math.round(first.totalRain)} mm in ${first.year} to ${Math.round(last.totalRain)} mm in ${last.year}.`;

  const dryDiff = last.dryDays - first.dryDays;
  const dryInsight = trendText(dryDiff, '', 'Dry days per year', 0);

  const insights = { temp: tempInsight, rain: rainInsight, dry: dryInsight };

  // 10-year averages + extremes.
  const avgOf = (key) => data.reduce((sum, d) => sum + d[key], 0) / data.length;
  const avgTemp10 = avgOf('avgTemp');
  const avgRain10 = avgOf('totalRain');
  const avgDry10 = avgOf('dryDays');
  const avgs = { temp: avgTemp10, rain: avgRain10, dry: avgDry10 };
  const hottest = data.reduce((a, b) => (b.avgTemp > a.avgTemp ? b : a), data[0]);
  const driest = data.reduce((a, b) => (b.totalRain < a.totalRain ? b : a), data[0]);
  const mostDryDays = data.reduce((a, b) => (b.dryDays > a.dryDays ? b : a), data[0]);

  // Tapping a dot/bar selects that year.
  const handleChartClick = (e) => {
    const payload = e?.activePayload?.[0]?.payload;
    if (payload?.year) setSelectedYear(payload.year);
  };

  const selected = selectedYear ? data.find((d) => d.year === selectedYear) : null;
  const metric = METRICS[activeMetric];
  const formatValue = (key, value) => {
    if (key === 'avgTemp') return `${value.toFixed(1)}°C`;
    if (key === 'totalRain') return `${Math.round(value)} mm`;
    return `${Math.round(value)} days`;
  };
  // Delta vs the 10-year average, colored by whether the direction is
  // worse (hotter/drier) or better for that metric.
  const deltaInfo = selected ? (() => {
    const value = selected[metric.key];
    const avg = avgs[activeMetric];
    const delta = value - avg;
    const abs = Math.abs(delta);
    const text = abs < 0.05
      ? 'right at the 10-year average'
      : `${delta > 0 ? '+' : '−'}${metric.key === 'avgTemp' ? abs.toFixed(1) : Math.round(abs)}${metric.unit === ' days' ? ' days' : metric.unit} vs the 10-year average`;
    // Hotter/drier than average is worse (red); cooler/wetter is better.
    // Rainfall direction is neutral — more rain is flood risk, less is drought.
    const color = activeMetric === 'rain'
      ? (delta < -0.05 ? 'var(--accent-amber)' : 'var(--accent-cyan)')
      : (delta > 0.05 ? 'var(--risk-high)' : delta < -0.05 ? 'var(--risk-low)' : 'var(--accent-cyan)');
    return { text, color, avg };
  })() : null;

  const axisTick = { fill: '#7d8ea6', fontSize: isSmallScreen ? 10 : 12 };
  const axisLine = { stroke: 'rgba(255,255,255,0.08)' };

  return (
    <div className="climate-charts-section mt-8">
      <h3 className="section-title">10-Year Climate Trends</h3>

      <div className="chart-card card">
        <div className="tabs-bar chart-tabs">
          {Object.entries(METRICS).map(([key, m]) => (
            <div
              key={key}
              role="tab"
              aria-selected={activeMetric === key}
              tabIndex={0}
              className={`tab-item ${activeMetric === key ? 'active' : ''}`}
              onClick={() => setActiveMetric(key)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveMetric(key); } }}
            >
              {m.label}
            </div>
          ))}
        </div>

        <h4 className="chart-title">{metric.title}</h4>
        <p className="chart-insight">{insights[activeMetric]}</p>
        <div className="chart-container" style={{ cursor: 'pointer' }}>
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === 'temp' ? (
              <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} onClick={handleChartClick}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" tick={axisTick} axisLine={axisLine} />
                <YAxis domain={['auto', 'auto']} tick={axisTick} axisLine={axisLine} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#f1f5f9' }} />
                <ReferenceLine
                  y={avgTemp10}
                  stroke="rgba(56,189,248,0.6)"
                  strokeDasharray="4 4"
                  label={{ value: '10-yr avg', position: 'insideTopRight', fill: '#38bdf8', fontSize: 11 }}
                />
                <Area
                  type="monotone"
                  dataKey="avgTemp"
                  name="Avg Max Temp"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fill="url(#tempGradient)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const isHottest = payload.year === hottest.year;
                    const isSelected = payload.year === selectedYear;
                    return (
                      <circle
                        cx={cx} cy={cy}
                        r={isSelected ? 7 : isHottest ? 6 : 3}
                        fill={isSelected ? '#38bdf8' : isHottest ? '#f59e0b' : '#ef4444'}
                        stroke="#020817" strokeWidth={1.5}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedYear(payload.year)}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: '#ef4444', stroke: '#020817', strokeWidth: 2 }}
                  isAnimationActive={!reducedMotion}
                />
              </ComposedChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} onClick={handleChartClick}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" tick={axisTick} axisLine={axisLine} />
                <YAxis tick={axisTick} axisLine={axisLine} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#f1f5f9' }} />
                <Bar
                  dataKey={metric.key}
                  name={metric.label}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!reducedMotion}
                >
                  {data.map((d) => {
                    const isHighlight = activeMetric === 'rain'
                      ? d.year === driest.year
                      : d.year === mostDryDays.year;
                    const isSelected = d.year === selectedYear;
                    return (
                      <Cell
                        key={d.year}
                        fill={isSelected ? '#38bdf8' : isHighlight ? '#f59e0b' : activeMetric === 'rain' ? 'rgba(59,130,246,0.8)' : 'rgba(245,158,11,0.8)'}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {selected && deltaInfo ? (
          <div className="chart-year-detail">
            <p className="chart-year-detail-title">
              <strong>{selected.year}</strong> · {metric.label} {formatValue(metric.key, selected[metric.key])}
              {' — '}
              <span style={{ color: deltaInfo.color }}>{deltaInfo.text}</span>
              {' '}({formatValue(metric.key, deltaInfo.avg)} avg)
            </p>
            <div className="chart-year-detail-chips">
              <span className="chart-detail-chip">Avg max temp: {formatValue('avgTemp', selected.avgTemp)}</span>
              <span className="chart-detail-chip">Rainfall: {formatValue('totalRain', selected.totalRain)}</span>
              <span className="chart-detail-chip">Dry days: {formatValue('dryDays', selected.dryDays)}</span>
            </div>
          </div>
        ) : (
          <p className="chart-year-hint">Tap a dot or bar to see that year&apos;s numbers.</p>
        )}
      </div>
    </div>
  );
}

export default ClimateCharts;
