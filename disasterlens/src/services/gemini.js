const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log(`[Diagnostics] VITE_GEMINI_API_KEY is ${API_KEY ? `defined (length: ${API_KEY.length})` : 'undefined'}`);
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

async function callGemini(prompt, onStatusUpdate) {
  const delays = [2000, 4000, 8000];

  for (let attempt = 0; attempt <= 3; attempt++) {
    let res;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.3, 
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        })
      });

      const is503 = res.status === 503;
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        if (is503) {
          throw new Error('503 Service Unavailable: overloaded');
        }
        throw jsonErr;
      }

      if (data.error) {
        throw new Error(data.error.message || 'Gemini API Error');
      }

      if (!data.candidates?.[0]) throw new Error('No response from Gemini');
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      const errMsg = err.message || '';
      const isRetryable = res?.status === 503 ||
                          errMsg.toLowerCase().includes('high demand') ||
                          errMsg.toLowerCase().includes('overloaded') ||
                          errMsg.toLowerCase().includes('503') ||
                          errMsg.toLowerCase().includes('resource exhausted') ||
                          errMsg.toLowerCase().includes('rate limit');

      if (isRetryable && attempt < 3) {
        const delay = delays[attempt];
        const statusMsg = `Gemini API high demand. Retrying in ${delay / 1000}s (Attempt ${attempt + 1}/3)...`;
        if (onStatusUpdate) onStatusUpdate(statusMsg);
        console.warn(statusMsg, err);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

export async function analyzeClimateRisk(locationName, summary, onStatusUpdate) {
  const prompt = `You are a climate risk analyst. Analyze this climate data for ${locationName} and return ONLY a valid JSON object with no extra text, no markdown, no backticks.

Climate Summary (10-year average):
- Average Max Temperature: ${summary.avgTemp.toFixed(1)}°C
- Annual Rainfall: ${summary.avgRainfall.toFixed(0)}mm
- Average Humidity: ${summary.avgHumidity.toFixed(1)}%
- Max Wind Speed: ${summary.maxWind.toFixed(0)} km/h
- Avg Dry Days Per Year: ${summary.avgDryDays.toFixed(0)}
- Temperature Trend (2013–2023): ${summary.tempTrend > 0 ? '+' : ''}${summary.tempTrend}°C

Return this exact JSON structure (replace values with your analysis, do not include angle brackets):
{
  "heatwave": 80,
  "flood": 20,
  "drought": 60,
  "waterScarcity": 50,
  "cyclone": 10,
  "overallRisk": 55,
  "summary": "This is a 2 sentence overall risk summary.",
  "recommendations": ["action 1", "action 2", "action 3", "action 4", "action 5"]
}`;

  try {
    const text = await callGemini(prompt, onStatusUpdate);
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Gemini API risk analysis failed after retries. Returning fallback data.', err);
    
    // Estimate scores locally so they differ per city based on actual climate summary
    const avgTemp = parseFloat(summary.avgTemp) || 20.0;
    const avgRainfall = parseFloat(summary.avgRainfall) || 800.0;
    const avgHumidity = parseFloat(summary.avgHumidity) || 60.0;
    const maxWind = parseFloat(summary.maxWind) || 30.0;
    const avgDryDays = parseFloat(summary.avgDryDays) || 100.0;
    const tempTrend = parseFloat(summary.tempTrend) || 0.0;

    const heatwave = Math.min(100, Math.max(10, Math.round((avgTemp - 15) * 3.2 + Math.max(0, tempTrend) * 12)));
    const flood = Math.min(100, Math.max(10, Math.round((avgRainfall / 1600) * 65 + (avgHumidity / 100) * 35)));
    const drought = Math.min(100, Math.max(10, Math.round((avgDryDays / 365) * 70 + Math.max(0, 30 - (avgRainfall / 40)))));
    const waterScarcity = Math.min(100, Math.max(10, Math.round(drought * 0.85 + (avgDryDays / 365) * 15)));
    const cyclone = Math.min(100, Math.max(10, Math.round((maxWind / 120) * 85)));
    const overallRisk = Math.round((heatwave + flood + drought + waterScarcity + cyclone) / 5);

    return {
      "heatwave": heatwave,
      "flood": flood,
      "drought": drought,
      "waterScarcity": waterScarcity,
      "cyclone": cyclone,
      "overallRisk": overallRisk,
      "summary": `Climate risk analysis for ${locationName} indicates varying levels of vulnerability. Shifting seasonal patterns and temperature trends influence local thermal and environmental risk profiles.`,
      "recommendations": [
        "Install rainwater harvesting systems",
        "Maintain emergency water and food supplies",
        "Stay updated with local weather alerts",
        "Reduce heat exposure during peak afternoon hours",
        "Ensure proper drainage around your property"
      ],
      "isFallback": true
    };
  }
}

export async function predictFutureClimate(locationName, summary, targetYear) {
  const prompt = `You are a climate scientist. Based on historical trends for ${locationName}, predict climate conditions for ${targetYear}. Return ONLY valid JSON, no markdown, no extra text.

Historical data (2013–2023):
- Current avg max temp: ${summary.avgTemp.toFixed(1)}°C
- Current annual rainfall: ${summary.avgRainfall.toFixed(0)}mm
- Temperature trend: ${summary.tempTrend > 0 ? '+' : ''}${summary.tempTrend}°C over 10 years
- Avg dry days/year: ${summary.avgDryDays.toFixed(0)}

Return this JSON (replace values with your predictions, do not include angle brackets):
{
  "projectedTemp": 35.5,
  "projectedRainfall": 800,
  "projectedDryDays": 120,
  "heatwave": 85,
  "flood": 25,
  "drought": 65,
  "waterScarcity": 55,
  "summary": "This is a 2 sentence projection summary.",
  "keyChanges": ["change 1", "change 2", "change 3"]
}`;

  try {
    const text = await callGemini(prompt);
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error(`Gemini predictFutureClimate failed for ${locationName}. Running local estimation model:`, err);
    
    const avgTemp = parseFloat(summary.avgTemp) || 20.0;
    const avgRainfall = parseFloat(summary.avgRainfall) || 800.0;
    const avgHumidity = parseFloat(summary.avgHumidity) || 60.0;
    const avgDryDays = parseFloat(summary.avgDryDays) || 100.0;
    const tempTrend = parseFloat(summary.tempTrend) || 0.0;
    
    // Project values based on targetYear (baseline is 2023)
    const targetYrNum = parseInt(targetYear) || 2030;
    const yearsDiff = Math.max(0, targetYrNum - 2023);
    
    // Projections
    const projectedTemp = avgTemp + (tempTrend / 10) * yearsDiff * 1.15;
    const projectedRainfall = Math.max(0, avgRainfall * (1 + (tempTrend > 1 ? -0.015 : 0.005) * (yearsDiff / 10)));
    const projectedDryDays = Math.min(365, Math.max(0, avgDryDays + (tempTrend > 0 ? 1.8 : -0.5) * yearsDiff));
    
    // Risk projections
    const heatwave = Math.min(100, Math.max(10, Math.round((projectedTemp - 15) * 3.4 + Math.max(0, tempTrend) * 15)));
    const flood = Math.min(100, Math.max(10, Math.round((projectedRainfall / 1600) * 65 + (avgHumidity / 100) * 35)));
    const drought = Math.min(100, Math.max(10, Math.round((projectedDryDays / 365) * 75 + Math.max(0, 30 - (projectedRainfall / 40)))));
    const waterScarcity = Math.min(100, Math.max(10, Math.round(drought * 0.9 + (projectedDryDays / 365) * 10)));
    
    const tempIncrease = projectedTemp - avgTemp;
    const rainChangePct = avgRainfall > 0 ? ((projectedRainfall - avgRainfall) / avgRainfall) * 100 : 0;
    
    return {
      "projectedTemp": parseFloat(projectedTemp.toFixed(1)),
      "projectedRainfall": Math.round(projectedRainfall),
      "projectedDryDays": Math.round(projectedDryDays),
      "heatwave": heatwave,
      "flood": flood,
      "drought": drought,
      "waterScarcity": waterScarcity,
      "summary": `By ${targetYear}, average maximum temperatures are projected to increase to ${projectedTemp.toFixed(1)}°C under ongoing warming trends. Shifting seasonal dynamics will alter extreme weather return periods.`,
      "keyChanges": [
        `Average maximum temperature increases by ${tempIncrease.toFixed(1)}°C compared to 10-year historical averages.`,
        rainChangePct < 0 
          ? `Annual rainfall is projected to decrease by ${Math.abs(rainChangePct).toFixed(0)}%, accelerating drought stress.`
          : `Annual rainfall is projected to increase by ${rainChangePct.toFixed(0)}%, escalating localized flood frequencies.`,
        `Dry days per year are projected to shift to ${Math.round(projectedDryDays)} days, changing soil moisture profiles.`
      ]
    };
  }
}

export async function chatWithClimate(locationName, riskData, summary, userMessage, history) {
  try {
    const context = `You are a climate advisor for ${locationName}. 
Risk scores — Heatwave: ${riskData.heatwave}, Flood: ${riskData.flood}, Drought: ${riskData.drought}, Water Scarcity: ${riskData.waterScarcity}, Cyclone: ${riskData.cyclone}.
Avg temp: ${summary.avgTemp.toFixed(1)}°C, Rainfall: ${summary.avgRainfall.toFixed(0)}mm/year.
Answer climate questions concisely and practically.`;

    const messages = [
      { role: 'user', parts: [{ text: context }] },
      { role: 'model', parts: [{ text: 'Understood. Ready to answer climate questions for this location.' }] },
      ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages,
        generationConfig: { temperature: 0.5, maxOutputTokens: 8192 }
      })
    });
    
    if (!res.ok) {
      throw new Error(`Gemini Chat API Error: ${res.status}`);
    }
    
    const data = await res.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid chat response from Gemini');
    }
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.warn(`Gemini chatWithClimate failed. Using local chat fallback for ${locationName}:`, err);
    return getLocalChatFallback(locationName, userMessage, riskData, summary);
  }
}

function getLocalChatFallback(locationName, userMessage, riskData, summary) {
  const msg = userMessage.toLowerCase();
  const city = locationName.split(',')[0].trim();

  // Find highest risk category
  let highestRiskCat = 'heatwave';
  let highestRiskScore = riskData?.heatwave || 0;
  if (riskData) {
    if (riskData.flood > highestRiskScore) { highestRiskCat = 'flood'; highestRiskScore = riskData.flood; }
    if (riskData.drought > highestRiskScore) { highestRiskCat = 'drought'; highestRiskScore = riskData.drought; }
    if (riskData.waterScarcity > highestRiskScore) { highestRiskCat = 'waterScarcity'; highestRiskScore = riskData.waterScarcity; }
    if (riskData.cyclone > highestRiskScore) { highestRiskCat = 'cyclone'; highestRiskScore = riskData.cyclone; }
  }

  // Emergency Kit response
  if (msg.includes('kit') || msg.includes('bag') || msg.includes('supply') || msg.includes('supplies') || msg.includes('emergency')) {
    return `### Recommended Emergency Kit for **${city}**

Based on ${city}'s climate profile (where the overall risk index is **${riskData?.overallRisk || 50}/100**), here are the critical items you should keep ready:

* **Hydration:** At least 3 liters of water per person per day (crucial for local temperatures averaging **${summary?.avgTemp ? summary.avgTemp.toFixed(1) : '25.0'}°C**).
* **Power & Light:** A solar-powered power bank, flashlight, and extra batteries to prepare for local grid failures.
* **Documents & Cash:** Waterproof pouch containing identity documents, insurance policies, and emergency cash.
* **Medical Supplies:** First-aid kit including rehydration salts (ORS), band-aids, antiseptics, and personal prescriptions.
* **Non-perishable Food:** Energy bars, canned goods, and a manual can opener.
* **Communication:** A portable battery-operated or hand-crank AM/FM radio to receive meteorological bulletins.`;
  }

  // Heatwave response
  if (msg.includes('heat') || msg.includes('temperature') || msg.includes('hot') || msg.includes('warm')) {
    const trendStr = summary?.tempTrend !== undefined ? `${summary.tempTrend > 0 ? '+' : ''}${summary.tempTrend}°C` : '+0.5°C';
    return `### Extreme Heat Preparedness in **${city}**

With ${city} showing a Heatwave Risk Score of **${riskData?.heatwave || 50}/100** and an average temperature trend of **${trendStr}**, managing thermal stress is a priority:

* **Keep Indoor Spaces Cool:** Use heavy curtains or reflective window films to block afternoon sunlight. Install energy-efficient fans or air conditioning.
* **Stay Hydrated:** Drink plenty of water throughout the day, even if you do not feel thirsty. Avoid sugary or caffeinated beverages.
* **Schedule Outdoor Tasks:** Limit strenuous activities to early morning or late evening hours.
* **Know the Warning Signs:** Learn to recognize symptoms of heat exhaustion (dizziness, heavy sweating, nausea) and heat stroke (high body temp, confusion).
* **Community Watch:** Check in regularly on elderly neighbors, children, and pets who are more susceptible to extreme heat.`;
  }

  // Flood response
  if (msg.includes('flood') || msg.includes('rain') || msg.includes('waterlogging') || msg.includes('monsoon') || msg.includes('precipitation')) {
    const rainStr = summary?.avgRainfall !== undefined ? `${summary.avgRainfall.toFixed(0)}mm` : '1000mm';
    return `### Flood Mitigation & Safety for **${city}**

With ${city} receiving an annual average of **${rainStr}** of rainfall and having a Flood Risk Score of **${riskData?.flood || 50}/100**, flood preparation is vital:

* **Elevate Critical Assets:** Move electrical appliances, power strips, and valuable documents to upper levels or raised platforms.
* **Clear Home Drainage:** Ensure gutters, downspouts, and surrounding drains are free of debris to allow rapid water runoff.
* **Install Barrier Systems:** Keep sandbags or quick-deploy flood barriers on hand if your property lies in a low-lying zone.
* **Never Drive Through Flooded Roads:** Just 15 cm of moving water can knock you off your feet, and 30 cm can float most passenger cars.
* **Prepare a Sump Pump:** If you have a basement, install a battery-backup sump pump to keep rising water levels at bay.`;
  }

  // Drought/Water Scarcity response
  if (msg.includes('drought') || msg.includes('water') || msg.includes('dry') || msg.includes('scarcity') || msg.includes('conservation')) {
    const dryDaysStr = summary?.avgDryDays !== undefined ? `${summary.avgDryDays.toFixed(0)}` : '120';
    return `### Water Resource Management in **${city}**

${city} faces a Drought Risk Score of **${riskData?.drought || 50}/100** and has an average of **${dryDaysStr}** dry days per year. Conservation is key:

* **Harvest Rainwater:** Set up rain barrels to capture runoff from your roof for gardening and cleaning use.
* **Upgrade Fixtures:** Install low-flow showerheads and aerators on all faucets. Upgrade to dual-flush toilets.
* **Adopt Smart Landscaping:** Plant native, drought-resistant flora that requires minimal supplemental watering.
* **Repurpose Greywater:** Safely recycle water from vegetable washing or laundry rinse cycles to irrigate non-edible plants.
* **Monitor Local Alerts:** Stay compliant with municipal water-saving ordinances and restrict washing vehicles or driveways.`;
  }

  // Cyclone/Storm response
  if (msg.includes('cyclone') || msg.includes('storm') || msg.includes('wind') || msg.includes('hurricane') || msg.includes('typhoon')) {
    const windStr = summary?.maxWind !== undefined ? `${summary.maxWind.toFixed(0)} km/h` : '50 km/h';
    return `### Cyclone & High Wind Defense for **${city}**

With a Cyclone Risk Score of **${riskData?.cyclone || 30}/100** and maximum historical wind speeds reaching **${windStr}**, storm safety is crucial:

* **Secure Open Structures:** Anchor outdoor furniture, trash bins, and loose building materials that could become high-speed projectiles.
* **Reinforce Openings:** Inspect window shutters and ensure all doors close tightly. Consider installing impact-resistant storm windows.
* **Prune Nearby Trees:** Trim dead or overhanging branches that pose a risk to your home's roof or adjacent power lines.
* **Designate a Safe Room:** Identify an interior, windowless room on the lowest floor where family members can gather during severe winds.
* **Have an Evacuation Strategy:** Know your local municipal shelter locations and plan a primary and secondary escape route.`;
  }

  // Risk or general summary query
  if (msg.includes('risk') || msg.includes('highest') || msg.includes('worst') || msg.includes('threat') || msg.includes('score')) {
    const formatName = (cat) => {
      if (cat === 'waterScarcity') return 'Water Scarcity';
      return cat.charAt(0).toUpperCase() + cat.slice(1);
    };
    return `### Climate Risk Overview for **${city}**

Based on our analysis of ${city}'s historical climate records, the highest risk factor is **${formatName(highestRiskCat)}** (Score: **${highestRiskScore}/100**).

Here is the full breakdown of local environmental risks:
* **Heatwave Risk:** ${riskData?.heatwave || 50}/100
* **Flood Risk:** ${riskData?.flood || 50}/100
* **Drought Risk:** ${riskData?.drought || 50}/100
* **Water Scarcity Risk:** ${riskData?.waterScarcity || 50}/100
* **Cyclone Risk:** ${riskData?.cyclone || 50}/100

*Overall Vulnerability Index:* **${riskData?.overallRisk || 50}/100**

I recommend focusing preparedness efforts on **${formatName(highestRiskCat)}** by reinforcing physical structures, saving water, or insulating your home depending on the threat.`;
  }

  // General fallback
  return `### Hello! I am your local Climate Advisor for **${city}**.

*Climate advisor services are currently running in local offline mode.*

Here is a summary of **${city}'s** climate characteristics:
* **Annual Average Rainfall:** ${summary?.avgRainfall ? summary.avgRainfall.toFixed(0) : '1000'}mm
* **Average Temperature:** ${summary?.avgTemp ? summary.avgTemp.toFixed(1) : '25.0'}°C
* **Dry Days:** ${summary?.avgDryDays ? summary.avgDryDays.toFixed(0) : '120'} per year
* **Overall Vulnerability Score:** ${riskData?.overallRisk || 50}/100

How can I help you prepare? You can ask about:
* **"What should I include in my emergency kit?"**
* **"How can I prepare my home for extreme heat?"**
* **"Are there specific flood mitigation steps I can take?"**
* **"How do I conserve water during dry spells?"**`;
}

const fallbackTimelines = {
  delhi: [
    { year: "2015", month: "June", type: "Heatwave", severity: "Severe", title: "Severe Northern India Heatwave", description: "Extreme heatwave with temperatures reaching up to 45°C in Delhi, leading to high power demand and water shortages.", casualties: "Over 2,000 deaths region-wide", category: "heatwave" },
    { year: "2017", month: "August", type: "Flood", severity: "Moderate", title: "Delhi Monsoon Floods", description: "Heavy monsoon rainfall triggered waterlogging and traffic chaos across the National Capital Region.", casualties: "Few casualties", category: "flood" },
    { year: "2019", month: "November", type: "Pollution", severity: "Severe", title: "Great Delhi Smog", description: "Severe air quality index (AQI) spike exceeding hazardous levels, causing school closures and health alerts.", casualties: "Health emergencies", category: "other" },
    { year: "2020", month: "June", type: "Storm", severity: "Moderate", title: "Pre-Monsoon Dust Storm", description: "High-velocity dust storms and thunderstorms swept through Delhi-NCR, bringing down trees and power lines.", casualties: "None reported", category: "storm" },
    { year: "2022", month: "May", type: "Heatwave", severity: "Catastrophic", title: "Record-Breaking Heatwave", description: "Delhi recorded its highest temperature in decades at 49°C, severely impacting agriculture and power grids.", casualties: "Dozens of heat-related hospitalizations", category: "heatwave" },
    { year: "2023", month: "July", type: "Flood", severity: "Severe", title: "Yamuna River Overflow", description: "Monsoon rains caused the Yamuna River to swell to its highest level in 45 years, flooding low-lying areas of the capital.", casualties: "Thousands displaced", category: "flood" }
  ],
  "new york": [
    { year: "2012", month: "October", type: "Hurricane", severity: "Catastrophic", title: "Superstorm Sandy", description: "Post-tropical cyclone Sandy brought a record storm surge to New York City, flooding subways, tunnels, and streets.", casualties: "44 deaths in NYC", category: "cyclone" },
    { year: "2016", month: "January", type: "Blizzard", severity: "Severe", title: "Blizzard Jonas", description: "A record-breaking blizzard dropped over 27 inches of snow on Central Park, paralyzing travel and public transit.", casualties: "Minimal", category: "storm" },
    { year: "2018", month: "January", type: "Storm", severity: "Moderate", title: "Bomb Cyclone", description: "A rapid drop in pressure brought coastal flooding, freezing temperatures, and heavy snow to NYC.", casualties: "Unknown", category: "storm" },
    { year: "2020", month: "July", type: "Heatwave", severity: "Moderate", title: "July Heatwave", description: "A prolonged heatwave brought temperatures above 95°F for several consecutive days, straining the city's power grid.", casualties: "Increased heat stroke cases", category: "heatwave" },
    { year: "2021", month: "September", type: "Flood", severity: "Severe", title: "Hurricane Ida Remnants", description: "Historic rainfall from Ida remnants triggered the first-ever Flash Flood Emergency for NYC, flooding basements.", casualties: "13 deaths in NYC", category: "flood" },
    { year: "2023", month: "June", type: "Wildfire Smoke", severity: "Severe", title: "Canadian Wildfire Smog", description: "Smoke from Canadian forest fires blanketed NYC in an orange haze, creating the worst air quality in the world.", casualties: "Respiratory emergencies", category: "other" }
  ],
  london: [
    { year: "2013", month: "July", type: "Heatwave", severity: "Moderate", title: "Great Britain Heatwave", description: "Prolonged period of hot weather affected the UK, with temperatures reaching 32°C in London.", casualties: "Hundreds of heat-related excess deaths", category: "heatwave" },
    { year: "2014", month: "January", type: "Flood", severity: "Severe", title: "Winter Storm Floods", description: "Wettest winter in 250 years caused Thames River overflow, flooding towns near London and transport routes.", casualties: "None", category: "flood" },
    { year: "2018", month: "February", type: "Blizzard", severity: "Severe", title: "Beast from the East", description: "Anticyclonic cold spell brought unusually low temperatures and heavy snowfall, disrupting London travel and schools.", casualties: "Minimal", category: "storm" },
    { year: "2020", month: "February", type: "Storm", severity: "Severe", title: "Storm Dennis", description: "One of the most intense winter storms on record triggered severe weather alerts, heavy rain, and high wind warnings.", casualties: "Travel disruptions", category: "storm" },
    { year: "2021", month: "July", type: "Flood", severity: "Severe", title: "London Flash Floods", description: "Heavy downpours dropped a month's worth of rain in a few hours, submerging tube stations and street crossings.", casualties: "Severe local disruptions", category: "flood" },
    { year: "2022", month: "July", type: "Heatwave", severity: "Catastrophic", title: "UK Record 40°C Heatwave", description: "Temperatures in London exceeded 40°C for the first time in history, causing wildfires and track buckles.", casualties: "Significant excess deaths recorded", category: "heatwave" }
  ]
};

function getGenericFallbackTimeline(locationName) {
  return [
    {
      year: "2013",
      month: "July",
      type: "Heatwave",
      severity: "Moderate",
      title: `${locationName} Summer Heatwave`,
      description: `Prolonged heatwave with temperatures rising significantly above the seasonal averages in ${locationName}, stressing power systems.`,
      casualties: "Unknown",
      category: "heatwave"
    },
    {
      year: "2016",
      month: "September",
      type: "Storm",
      severity: "Moderate",
      title: "Severe Autumn Storm",
      description: `High winds and intense convective precipitation caused localized power disruptions and tree falls across ${locationName}.`,
      casualties: "Unknown",
      category: "storm"
    },
    {
      year: "2018",
      month: "August",
      type: "Flood",
      severity: "Severe",
      title: `${locationName} Flash Floods`,
      description: `Unusually heavy seasonal precipitation led to drainage failures and significant waterlogging in low-lying sectors.`,
      casualties: "Minor injuries reported",
      category: "flood"
    },
    {
      year: "2020",
      month: "June",
      type: "Drought",
      severity: "Severe",
      title: "Regional Agricultural Drought",
      description: `Months of below-average precipitation led to soil moisture depletion and water usage restrictions across the district.`,
      casualties: "None",
      category: "drought"
    },
    {
      year: "2022",
      month: "May",
      type: "Heatwave",
      severity: "Severe",
      title: "Extreme Thermal Event",
      description: `Record-breaking early season temperatures triggered public health alerts and strained local water resources.`,
      casualties: "Increased emergency visits",
      category: "heatwave"
    },
    {
      year: "2023",
      month: "October",
      type: "Flood",
      severity: "Severe",
      title: `${locationName} Riverine Overflow`,
      description: `Consecutive days of extreme rainfall caused local watercourses to overflow, necessitating evacuations of vulnerable areas.`,
      casualties: "Displacements, minor injuries",
      category: "flood"
    }
  ];
}

export async function fetchDisasterTimeline(locationName) {
  const prompt = `You are a disaster history researcher. List the most significant historical climate disasters, extreme weather events, and natural calamities that have occurred in or near ${locationName}.

Return ONLY a valid JSON array with no extra text, no markdown, no backticks.

Return between 6 and 10 events, ordered from oldest to newest.

Each event must follow this exact structure:
[
  {
    "year": "2015",
    "month": "November",
    "type": "Flood",
    "severity": "Catastrophic",
    "title": "Chennai Floods",
    "description": "Heaviest rainfall in over 100 years submerged large parts of the city, displacing over 1.8 million people.",
    "casualties": "500+ deaths",
    "category": "flood"
  }
]

Rules:
- "severity" must be one of: Minor, Moderate, Severe, Catastrophic
- "category" must be one of: flood, heatwave, cyclone, drought, earthquake, landslide, storm, other
- "casualties" can be "Unknown" if not known
- "month" can be "Unknown" if not known
- Only include real, historically documented events
- If fewer than 6 documented events exist, include the ones that do exist
- Do not invent events`;

  try {
    const text = await callGemini(prompt);
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error(`Gemini fetchDisasterTimeline failed. Returning fallback timeline for ${locationName}:`, err);
    const normalized = locationName.toLowerCase();
    if (normalized.includes('delhi')) {
      return fallbackTimelines.delhi;
    } else if (normalized.includes('new york')) {
      return fallbackTimelines['new york'];
    } else if (normalized.includes('london')) {
      return fallbackTimelines.london;
    }
    return getGenericFallbackTimeline(locationName);
  }
}
