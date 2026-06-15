const MAX_STRING_LENGTH = {
  id: 240,
  name: 400,
  address: 800,
  type: 160,
  price: 240,
  source: 80,
  sourcePlaceId: 240,
  amenity: 160,
};

const firstPresent = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const truncate = (value, maxLength) => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
};

const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const normalizePrice = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string' || typeof value === 'number') {
    return truncate(value, MAX_STRING_LENGTH.price);
  }
  if (typeof value !== 'object') return undefined;

  return truncate(
    firstPresent(
      value.lowest,
      value.extracted_lowest,
      value.price,
      value.text,
      value.display,
      value.formatted,
    ),
    MAX_STRING_LENGTH.price,
  );
};

const normalizeAmenity = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string' || typeof value === 'number') {
    return truncate(value, MAX_STRING_LENGTH.amenity);
  }
  if (typeof value !== 'object') return undefined;

  return truncate(
    firstPresent(value.name, value.title, value.label, value.text, value.value),
    MAX_STRING_LENGTH.amenity,
  );
};

export const normalizeChatPlacePayload = (place = {}) => {
  const amenities = firstPresent(place.amenities, place.rawSerpApiPropertyDetails?.amenities);
  const normalizedAmenities = Array.isArray(amenities)
    ? amenities.map(normalizeAmenity).filter(Boolean).slice(0, 8)
    : undefined;

  const normalized = {
    id: truncate(firstPresent(place.id, place.locationId), MAX_STRING_LENGTH.id),
    name: truncate(firstPresent(place.name, place.placeName, place.title), MAX_STRING_LENGTH.name),
    address: truncate(firstPresent(place.address, place.placeAddress, place.displayAddress, place.formattedAddress), MAX_STRING_LENGTH.address),
    latitude: finiteNumber(firstPresent(place.latitude, place.lat, place.coordinates?.lat, place.location?.lat)),
    longitude: finiteNumber(firstPresent(place.longitude, place.lng, place.coordinates?.lng, place.location?.lng)),
    rating: finiteNumber(firstPresent(place.rating, place.averageRating)),
    type: truncate(firstPresent(place.type, Array.isArray(place.categories) ? place.categories[0] : undefined), MAX_STRING_LENGTH.type),
    amenities: normalizedAmenities?.length ? normalizedAmenities : undefined,
    price: normalizePrice(firstPresent(place.price, place.priceRange, place.priceText, place.ratePerNight)),
    reviewCount: finiteNumber(firstPresent(place.reviewCount, place.reviewsCount, place.userRatingsTotal)),
    source: truncate(place.source, MAX_STRING_LENGTH.source),
    sourcePlaceId: truncate(place.sourcePlaceId, MAX_STRING_LENGTH.sourcePlaceId),
  };

  return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined));
};

export const buildChatPlacesPayload = (places = [], limit = 12) => {
  const activePlaces = Array.isArray(places) ? places.slice(0, limit) : [];
  const payload = activePlaces.map(normalizeChatPlacePayload).filter((place) => place.id || place.name);
  return {
    ids: payload.map((place) => place.id).filter(Boolean),
    payload,
  };
};
