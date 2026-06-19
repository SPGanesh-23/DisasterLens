export async function fetchClimateData(lat, lon) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2013-01-01&end_date=2023-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_max&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.daily) throw new Error('Climate data not available for this location');

  const daily = data.daily;
  const years = {};

  for (let i = 0; i < daily.time.length; i++) {
    const year = daily.time[i].slice(0, 4);
    if (!years[year]) years[year] = { temps: [], rain: [], wind: [], humidity: [] };
    if (daily.temperature_2m_max[i] !== null) years[year].temps.push(daily.temperature_2m_max[i]);
    if (daily.precipitation_sum[i] !== null) years[year].rain.push(daily.precipitation_sum[i]);
    if (daily.windspeed_10m_max[i] !== null) years[year].wind.push(daily.windspeed_10m_max[i]);
    if (daily.relative_humidity_2m_max[i] !== null) years[year].humidity.push(daily.relative_humidity_2m_max[i]);
  }

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const sum = arr => arr.reduce((a, b) => a + b, 0);

  const yearlyData = Object.entries(years).map(([year, vals]) => ({
    year,
    avgTemp: avg(vals.temps),
    totalRain: sum(vals.rain),
    maxWind: Math.max(...vals.wind),
    avgHumidity: avg(vals.humidity),
    dryDays: vals.rain.filter(r => r < 1).length
  }));

  const allTemps = yearlyData.map(y => y.avgTemp);
  const tempTrend = allTemps[allTemps.length - 1] - allTemps[0];

  return {
    yearlyData,
    summary: {
      avgTemp: avg(yearlyData.map(y => y.avgTemp)),
      avgRainfall: avg(yearlyData.map(y => y.totalRain)),
      avgHumidity: avg(yearlyData.map(y => y.avgHumidity)),
      maxWind: Math.max(...yearlyData.map(y => y.maxWind)),
      avgDryDays: avg(yearlyData.map(y => y.dryDays)),
      tempTrend: tempTrend.toFixed(2)
    }
  };
}
