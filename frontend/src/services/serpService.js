const SERP_API_KEY = import.meta.env.VITE_SERP_API_KEY;

export const fetchPlaceImage = async (name, address) => {
  if (!SERP_API_KEY) return null;
  const query = encodeURIComponent(`${name} ${address || ''}`.trim());
  const url = `https://serpapi.com/search.json?engine=google&q=${query}&tbm=isch&ijn=0&api_key=${SERP_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const img = data.images_results?.[0]?.thumbnail || data.images_results?.[0]?.original;
  return img || null;
};

export default { fetchPlaceImage };
