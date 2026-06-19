import fs from 'fs';

const API_KEY = 'your_api_key_here';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;

async function test() {
  const prompt = `You are a climate risk analyst. Analyze this climate data for Delhi and return ONLY a valid JSON object with no extra text, no markdown, no backticks.

Climate Summary (10-year average):
- Average Max Temperature: 35.0°C
- Annual Rainfall: 800mm
- Average Humidity: 50.0%
- Max Wind Speed: 40 km/h
- Avg Dry Days Per Year: 200
- Temperature Trend (2013–2023): +1.5°C

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

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.3, 
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    })
  });
  
  const data = await res.json();
  console.log("FULL RAW RESPONSE:\n", JSON.stringify(data, null, 2));
  const text = data.candidates[0].content.parts[0].text;
  console.log("RAW TEXT:\n", text);
  
  try {
    JSON.parse(text);
    console.log("JSON is VALID");
  } catch(e) {
    console.error("JSON PARSE ERROR:", e.message);
  }
}

test();
