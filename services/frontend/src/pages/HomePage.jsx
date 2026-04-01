import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation2, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { searchPlaces, getNearbyPlaces } from '../services/placeService';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [places, setPlaces] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setLocationStatus('loading');
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(newLocation);
        setLocationStatus('success');
        loadNearbyPlaces(newLocation);
      },
      (error) => {
        setLocationStatus('error');
        setError('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trị trong trình duyệt.');
        console.error('Geolocation error:', error);
      }
    );
  };

  // Load nearby places
  const loadNearbyPlaces = async (location) => {
    try {
      setIsSearching(true);
      const nearbyPlaces = await getNearbyPlaces(location.lat, location.lng);
      setPlaces(nearbyPlaces);
      setError('');
    } catch (err) {
      setError(err.message);
      console.error('Error loading nearby places:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setPlaces([]);
      setError('');
      return;
    }

    if (!userLocation) {
      setError('Vui lòng bật định vị trước khi tìm kiếm');
      return;
    }

    try {
      setIsSearching(true);
      setError('');
      const searchResults = await searchPlaces(query, userLocation.lat, userLocation.lng);
      setPlaces(searchResults);
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search submission from navbar
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  }, [searchQuery]);

  // Handle marker click - navigate to place detail
  const handleMarkerClick = (place) => {
    navigate(`/places/${place.id}`, { state: { place } });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      {/* Navbar */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100 flex flex-col">
          {/* Error Message */}
          {error && (
            <div className="absolute top-4 right-4 z-20 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 max-w-sm shadow-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-700 hover:text-red-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Location Button */}
          <button
            onClick={getCurrentLocation}
            disabled={locationStatus === 'loading'}
            title={locationStatus === 'loading' ? 'Đang tìm vị trí...' : 'Tìm vị trí hiện tại'}
            className="absolute top-4 left-4 z-10 p-3 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Navigation2 className={`w-5 h-5 ${locationStatus === 'loading' ? 'animate-spin' : ''}`} />
          </button>

          {/* Loading Indicator */}
          {isSearching && (
            <div className="absolute bottom-4 left-4 z-20 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm">Đang tải...</span>
            </div>
          )}

          {/* Map Component */}
          <MapComponent 
            userLocation={userLocation} 
            places={places}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>
    </div>
  );
}
