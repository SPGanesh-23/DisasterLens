const GNEWS_KEY = import.meta.env.VITE_GNEWS_KEY;

export async function fetchDisasterNews(locationName, category = 'all') {
  const locationShort = locationName.split(',')[0].trim();

  const queries = {
    all: `${locationShort} flood OR cyclone OR drought OR heatwave OR disaster OR climate`,
    flood: `${locationShort} flood OR rainfall OR waterlogging`,
    heatwave: `${locationShort} heatwave OR heat wave OR temperature record`,
    cyclone: `${locationShort} cyclone OR storm OR hurricane OR typhoon`,
    drought: `${locationShort} drought OR water scarcity OR dry spell`,
    climate: `${locationShort} climate change OR global warming OR environment`
  };

  const query = queries[category] || queries.all;

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=8&sortby=publishedAt&apikey=${GNEWS_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GNews API Error: ${res.status}`);
  }
  const data = await res.json();

  if (!data.articles) throw new Error('No news data returned');
  return data.articles;
}
