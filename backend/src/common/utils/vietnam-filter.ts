const VIETNAM_BOUNDS = {
  minLat: 8.2, maxLat: 23.5,
  minLng: 102.1, maxLng: 109.9,
};

export function isInVietnam(place: any): boolean {
  const lat = place.location?.lat ?? place.lat;
  const lng = place.location?.lng ?? place.lng;

  if (lat != null && lng != null) {
    if (lat >= VIETNAM_BOUNDS.minLat && lat <= VIETNAM_BOUNDS.maxLat &&
        lng >= VIETNAM_BOUNDS.minLng && lng <= VIETNAM_BOUNDS.maxLng) {
      return true;
    }
  }

  const address = (place.address || place.placeAddress || '').toLowerCase();
  const vnKeywords = ['việt nam', 'vietnam', 'hà nội', 'hồ chí minh', 'đà nẵng',
    'hải phòng', 'cần thơ', 'nha trang', 'đà lạt', 'huế', 'vũng tàu',
    'phan thiết', 'hạ long', 'sapa', 'phú quốc', 'hội an', 'việt', 'vn'];

  return vnKeywords.some(kw => address.includes(kw));
}

export function filterVietnam(places: any[]): any[] {
  return places.filter(isInVietnam);
}
