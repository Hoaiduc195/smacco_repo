export const HOME_SEARCH_STATE_KEY = 'home_search_state';

export function readHomeSearchState() {
  if (typeof window === 'undefined') return null;

  try {
    const rawState = window.sessionStorage.getItem(HOME_SEARCH_STATE_KEY);
    if (!rawState) return null;
    return JSON.parse(rawState);
  } catch (error) {
    console.warn('Failed to read home search state:', error);
    return null;
  }
}

export function navigateToPlaceDetail(navigate, placeId, options = {}) {
  if (!placeId) return;

  const returnToMapState = options.returnToMapState ?? readHomeSearchState();
  navigate(`/places/${placeId}`, {
    state: {
      ...(options.place ? { place: options.place } : {}),
      ...(returnToMapState ? { returnToMapState } : {}),
    },
  });
}
