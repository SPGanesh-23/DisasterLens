export default async function handler(req, res) {
  const { query } = req.query;
  const GNEWS_KEY = process.env.VITE_GNEWS_KEY;

  if (!GNEWS_KEY) {
    return res.status(500).json({ error: "GNews API key is not configured in Vercel environment variables." });
  }

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=8&sortby=publishedAt&apikey=${GNEWS_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: `GNews API responded with status ${response.status}` });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
