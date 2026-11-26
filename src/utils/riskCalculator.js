// Deterministic risk scoring engine
// Replaces AI-generated scores with rule-based formulas using
// established climate science thresholds. AI is used only for
// explanation/recommendations, not score calculation.

export function calculateHeatwaveRisk(summary) {
  let score = 0;

  // Average max temperature thresholds (India context)
  if (summary.avgTemp >= 40) score += 45;
  else if (summary.avgTemp >= 37) score += 35;
  else if (summary.avgTemp >= 34) score += 22;
  else if (summary.avgTemp >= 30) score += 10;

  // Warming trend over 10 years
  const trend = parseFloat(summary.tempTrend);
  if (trend >= 1.5) score += 25;
  else if (trend >= 0.8) score += 15;
  else if (trend >= 0.3) score += 8;

  // High humidity worsens perceived heat stress
  if (summary.avgHumidity >= 70) score += 15;
  else if (summary.avgHumidity >= 55) score += 8;

  // Dry days indicate prolonged heat exposure days
  if (summary.avgDryDays >= 200) score += 15;
  else if (summary.avgDryDays >= 150) score += 8;

  return Math.min(Math.round(score), 100);
}

export function calculateFloodRisk(summary) {
  let score = 0;

  // Annual rainfall thresholds (mm)
  if (summary.avgRainfall >= 2000) score += 40;
  else if (summary.avgRainfall >= 1200) score += 30;
  else if (summary.avgRainfall >= 800) score += 18;
  else if (summary.avgRainfall >= 400) score += 8;

  // High humidity correlates with monsoon intensity
  if (summary.avgHumidity >= 75) score += 20;
  else if (summary.avgHumidity >= 60) score += 10;

  // High wind speed often accompanies severe storm systems
  if (summary.maxWind >= 60) score += 20;
  else if (summary.maxWind >= 40) score += 12;
  else if (summary.maxWind >= 25) score += 5;

  // Fewer dry days = more concentrated/frequent rain events
  if (summary.avgDryDays <= 100) score += 20;
  else if (summary.avgDryDays <= 150) score += 10;

  return Math.min(Math.round(score), 100);
}

export function calculateDroughtRisk(summary) {
  let score = 0;

  // Low rainfall is the primary driver
  if (summary.avgRainfall <= 400) score += 40;
  else if (summary.avgRainfall <= 700) score += 28;
  else if (summary.avgRainfall <= 1000) score += 15;
  else if (summary.avgRainfall <= 1300) score += 5;

  // High dry day count
  if (summary.avgDryDays >= 250) score += 30;
  else if (summary.avgDryDays >= 200) score += 20;
  else if (summary.avgDryDays >= 150) score += 10;

  // Rising temperature trend accelerates evaporation/drought stress
  const trend = parseFloat(summary.tempTrend);
  if (trend >= 1.2) score += 20;
  else if (trend >= 0.6) score += 10;

  // Low humidity reinforces dry conditions
  if (summary.avgHumidity <= 40) score += 10;
  else if (summary.avgHumidity <= 55) score += 5;

  return Math.min(Math.round(score), 100);
}

export function calculateWaterScarcityRisk(summary) {
  // Water scarcity correlates strongly with drought risk plus
  // population/demand pressure, which we approximate using
  // rainfall reliability and dry day frequency
  let score = 0;

  if (summary.avgRainfall <= 500) score += 35;
  else if (summary.avgRainfall <= 800) score += 25;
  else if (summary.avgRainfall <= 1100) score += 12;

  if (summary.avgDryDays >= 220) score += 30;
  else if (summary.avgDryDays >= 170) score += 18;
  else if (summary.avgDryDays >= 120) score += 8;

  if (summary.avgHumidity <= 45) score += 15;
  else if (summary.avgHumidity <= 60) score += 8;

  const trend = parseFloat(summary.tempTrend);
  if (trend >= 1.0) score += 20;
  else if (trend >= 0.5) score += 10;

  return Math.min(Math.round(score), 100);
}

export function calculateCycloneRisk(summary) {
  let score = 0;

  // Max wind speed is the primary cyclone indicator
  if (summary.maxWind >= 90) score += 50;
  else if (summary.maxWind >= 70) score += 38;
  else if (summary.maxWind >= 50) score += 22;
  else if (summary.maxWind >= 35) score += 10;

  // High humidity + high rainfall = cyclone-favorable conditions
  if (summary.avgHumidity >= 75 && summary.avgRainfall >= 1200) score += 30;
  else if (summary.avgHumidity >= 65 && summary.avgRainfall >= 900) score += 18;
  else if (summary.avgRainfall >= 700) score += 8;

  return Math.min(Math.round(score), 100);
}

export function calculateAllRisks(summary) {
  const heatwave = calculateHeatwaveRisk(summary);
  const flood = calculateFloodRisk(summary);
  const drought = calculateDroughtRisk(summary);
  const waterScarcity = calculateWaterScarcityRisk(summary);
  const cyclone = calculateCycloneRisk(summary);

  const overallRisk = Math.round(
    (heatwave + flood + drought + waterScarcity + cyclone) / 5
  );

  return { heatwave, flood, drought, waterScarcity, cyclone, overallRisk };
}