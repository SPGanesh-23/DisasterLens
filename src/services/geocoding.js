export async function geocodeLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'DisasterLensApp/1.0' }
  });
  const data = await res.json();
  if (!data || data.length === 0) throw new Error('Location not found');
  return {
    name: data[0].display_name.split(',').slice(0, 2).join(','),
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}

// Reverse-geocode a map click: turn lat/lon into the nearest place name.
export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'DisasterLensApp/1.0' }
  });
  const data = await res.json();
  if (data?.display_name) {
    return {
      name: data.display_name.split(',').slice(0, 2).join(','),
      lat,
      lon
    };
  }
  throw new Error('No place name found for this location');
}
