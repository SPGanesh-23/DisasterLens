# DisasterLens AI

AI-powered climate risk assessment for any location on Earth. Search a city, town, or village and get risk scores for heatwaves, floods, drought, water scarcity, and cyclones — built from 10 years of real climate data, with AI-generated explanations and preparedness guidance.

**Live demo:** https://disaster-lens-ten.vercel.app/

## How it works

1. **Search** any location (OpenStreetMap geocoding).
2. **Climate data** — daily temperature, rainfall, humidity, and wind for 2013–2023 from the [Open-Meteo Archive API](https://open-meteo.com/).
3. **Risk scores** — calculated locally with rule-based thresholds in `src/utils/riskCalculator.js` (no AI needed for the numbers).
4. **AI insights** — Google Gemini explains *why* the scores are what they are, suggests preparedness steps, projects future climate, answers questions in the built-in chat, and builds a disaster timeline. If Gemini is unavailable, the app still shows the computed scores with a local fallback summary.
5. **Explore** — interactive map (Leaflet), 10-year charts (Recharts), disaster news, a future-climate simulator, and a side-by-side location comparison.

## Features

- Dashboard layout — sidebar navigation (Overview, Trends, Timeline, Prepare, Compare, Chat), one clean section at a time; bottom nav on phones
- Search any of 195+ countries, with one-tap chips for popular Indian cities and recent searches
- Live map in Overview — click anywhere to analyze that spot, pulsing risk marker, risk circle
- Pre-loads Chennai on first visit so the page is never empty
- Overall risk score (0–100) plus five category scores with severity badges (Low / Medium / High / Severe)
- Tappable 10-year charts (temperature, rainfall, dry days) with a year-detail strip
- Future simulator — slide to any year up to 2050 and compare projected vs current risk
- Disaster timeline, news feed, preparedness advisor, and climate chat
- City vs city comparison with "Safer" pills
- Shareable links (`?lat&lon&name`) and a printable report
- Responsive layout for phones and desktops

## Run it locally

```bash
npm install
```

Create a `.env` file with your Gemini API key:

```
VITE_GEMINI_API_KEY=your_key_here
```

Then:

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
```

> Note: the Gemini key is a client-side (`VITE_`) variable, so it is visible in the shipped JavaScript. This project is a learning/demo build — for production use, move the Gemini calls to a server.

## Tech stack

- React 19 + Vite
- Leaflet / react-leaflet — maps
- Recharts — climate charts
- lucide-react — icons, react-markdown — chat formatting
- Open-Meteo — historical climate data
- Google Gemini — AI insights, chat, and timeline

## Project structure

```
src/
  App.jsx                 # Dashboard shell, search flow, default location
  components/             # SearchBar, MapView, RiskDashboard, RiskGauge,
                          # DashboardNav, ClimateCharts, DisasterTimeline,
                          # DisasterNewsFeed, PrepAdvisor, FutureSimulator,
                          # ClimateChat, LocationCompare, InfoModal
  hooks/                  # useCountUp (animated score counters)
  services/               # climate.js (Open-Meteo), gemini.js, geocoding.js, news.js
  utils/                  # riskCalculator.js, riskEngine.js, sections.js
api/
  news.js                 # Serverless news endpoint
```

## About

Built as part of the 1M1B AI for Sustainability virtual internship, supporting **UN SDG 13 — Climate Action**.
