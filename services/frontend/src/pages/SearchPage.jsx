import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertCircle, MapPin } from 'lucide-react';
import { searchPlaces } from '../services/placeService';
import { useDebounce } from '../hooks/useDebounce';
import MapComponent from '../components/MapComponent';
import Navbar from '../components/Navbar';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const debouncedQuery = useDebounce(query, 500);
  const navigate = useNavigate();

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Default to Hanoi if location not available
          setUserLocation({ lat: 21.0285, lng: 105.8542 });
        }
      );
    }
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setPlaces([]);
      setError('');
      return;
    }

    if (!userLocation) return;

    const performSearch = async () => {
      setIsLoading(true);
      setError('');
      try {
        const results = await searchPlaces(debouncedQuery, userLocation.lat, userLocation.lng);
        setPlaces(results);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, userLocation]);

  // Handle place selection from results list
  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    navigate(`/places/${place.id}`, { state: { place } });
  };

  // Handle marker click on map
  const handleMarkerClick = (place) => {
    setSelectedPlace(place);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Search Results */}
        <div className="w-96 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white">
          {/* Search Form */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm chỗ ở..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              {isLoading && (
                <div className="flex items-center px-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto">
            {places.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {query ? 'Không tìm thấy kết quả' : 'Nhập từ khóa để tìm kiếm'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {places.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => handlePlaceClick(place)}
                    className={`w-full p-4 text-left hover:bg-blue-50 transition-colors ${
                      selectedPlace?.id === place.id ? 'bg-blue-100' : ''
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{place.name}</h3>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600 line-clamp-2">{place.address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative bg-gray-100">
          {userLocation && (
            <MapComponent
              userLocation={userLocation}
              places={places}
              onMarkerClick={handleMarkerClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
