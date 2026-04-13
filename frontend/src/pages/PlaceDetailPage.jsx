import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, AlertCircle, Loader } from 'lucide-react';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { getPlaceDetails, getPlaceReviews } from '../services/placeService';

export default function PlaceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [place, setPlace] = useState(location.state?.place || null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(!place);
  const [error, setError] = useState('');

  // Load place details if not provided via state
  useEffect(() => {
    if (!place && id) {
      loadPlaceDetails();
    } else if (place) {
      loadReviews();
    }
  }, [id, place]);

  const loadPlaceDetails = async () => {
    try {
      setIsLoading(true);
      setError('');
      const details = await getPlaceDetails(id);
      setPlace(details);
      loadReviews();
    } catch (err) {
      setError(err.message);
      console.error('Error loading place details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const reviewsData = await getPlaceReviews(id);
      setReviews(reviewsData);
    } catch (err) {
      console.error('Error loading reviews:', err);
      // Don't show error for reviews, as they're secondary
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full bg-white">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="flex flex-col h-screen w-full bg-white">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-gray-600 mb-4">{error || 'Không tìm thấy địa điểm'}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rating = place.rating || 0;
  const ratingStars = Array.from({ length: 5 }, (_, i) => i < Math.floor(rating) ? '★' : '☆').join('');

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Place Info */}
        <div className="w-96 flex-shrink-0 border-r border-gray-200 flex flex-col overflow-y-auto bg-white">
          {/* Header with Back Button */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center gap-3 z-10">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold flex-1 truncate">{place.name}</h1>
          </div>

          {/* Place Details */}
          <div className="p-4 space-y-4">
            {/* Rating */}
            {place.rating && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{rating.toFixed(1)}</span>
                <span className="text-yellow-500 text-lg">{ratingStars}</span>
                {place.review_count && (
                  <span className="text-gray-600 text-sm">({place.review_count} reviews)</span>
                )}
              </div>
            )}

            {/* Address */}
            {place.address && (
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Địa chỉ</p>
                  <p className="text-gray-900">{place.address}</p>
                </div>
              </div>
            )}

            {/* Coordinates */}
            {place.lat && place.lng && (
              <div className="p-3 bg-gray-100 rounded-lg text-sm">
                <p className="text-gray-600">Tọa độ</p>
                <p className="text-gray-900">
                  {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                </p>
              </div>
            )}

            {/* Type */}
            {place.type && (
              <div className="text-sm">
                <p className="text-gray-600">Loại địa điểm</p>
                <p className="text-gray-900 capitalize">{place.type}</p>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <div className="border-t border-gray-200 p-4">
              <h2 className="font-semibold mb-3">Bình luận</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reviews.map((review) => (
                  <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm">{review.author}</p>
                      {review.rating && (
                        <span className="text-yellow-500 text-sm">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{review.date}</p>
                    <p className="text-sm text-gray-700 mt-2">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative bg-gray-100">
          {place.lat && place.lng && (
            <MapComponent
              userLocation={{ lat: place.lat, lng: place.lng }}
              places={[place]}
              onMarkerClick={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}
