import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, AlertCircle, Loader, 
  Star, Globe, Phone, Clock, Share2, Bookmark,
  ThumbsUp, ThumbsDown, MessageCircle, Navigation,
  Image as ImageIcon, Send, X, Edit3, Trash2,
  ChevronLeft, ChevronRight, ExternalLink, Maximize2
} from 'lucide-react';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import QASection from '../components/QASection';
import { getPlaceDetails, getPlaceMedia, createPlace, createReview, deleteReview } from '../services/placeService';
import { checkInAtPlace, leaveOnsiteStatus, getMyOnsiteStatus } from '../services/presenceService';
import { savePlace, unsavePlace, checkSavedStatus } from '../services/savedPlacesService';
import { useAuth } from '../contexts/AuthContext';
import { getRouteDetails } from '../services/routingService';

export default function PlaceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [place, setPlace] = useState(location.state?.place || null);
  const [reviews, setReviews] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(!place);
  const [error, setError] = useState('');
  const [vote, setVote] = useState(null); // 'up' or 'down'
  const [onsiteStatus, setOnsiteStatus] = useState(location.state?.place?.onsiteStatus || null);
  const [onsiteLoading, setOnsiteLoading] = useState(false);
  const [onsiteError, setOnsiteError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingLoading, setIsSavingLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  const [galleryPreviewIndex, setGalleryPreviewIndex] = useState(0);
  const syncInProgress = useRef({});
  const { currentUser } = useAuth();

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  // Derived state to determine if user is currently onsite
  const isCurrentlyOnsite = onsiteStatus?.isActive && 
    (onsiteStatus.placeId === id || (place && onsiteStatus.placeId === place.id));

  // Automatic database synchronization for external provider search results
  useEffect(() => {
    if (place && place.id && String(place.id).startsWith('local-')) return;
    if (place && place.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(place.id)) {
      if (syncInProgress.current[place.id]) return;
      syncInProgress.current[place.id] = true;

      const syncPlaceWithDb = async () => {
        try {
          const dashIndex = place.id.indexOf('-');
          const source = dashIndex !== -1 ? place.id.substring(0, dashIndex) : 'serpapi';
          const locationId = dashIndex !== -1 ? place.id.substring(dashIndex + 1) : place.id;
          
          const savedPlace = await createPlace({
            source: source,
            locationId: locationId,
            nameCache: place.name || place.placeName,
            addressCache: place.address || place.placeAddress,
            type: place.type,
            coordinates: place.lat && place.lng ? { lat: place.lat, lng: place.lng } : undefined,
            imageUrl: place.imageUrl || place.coverImageUrl || undefined,
          });
          setPlace(savedPlace);
          if (savedPlace.onsiteStatus) {
            setOnsiteStatus(savedPlace.onsiteStatus);
          }
        } catch (err) {
          console.error('Error syncing place with database:', err);
          delete syncInProgress.current[place.id];
        }
      };
      syncPlaceWithDb();
    }
  }, [place]);

  // Restore onsite status and saved status from backend on mount or when id changes
  useEffect(() => {
    const fetchOnsiteStatus = async () => {
      try {
        const currentStatus = await getMyOnsiteStatus();
        setOnsiteStatus(currentStatus);
      } catch (presErr) {
        console.warn('Failed to fetch current presence status:', presErr);
      }
    };
    const fetchSavedStatus = async () => {
      try {
        const status = await checkSavedStatus(id);
        setIsSaved(status.isSaved);
      } catch (err) {
        console.warn('Failed to fetch saved status:', err);
      }
    };
    if (id) {
      fetchOnsiteStatus();
      fetchSavedStatus();
    }
  }, [id]);

  const handleToggleSave = async () => {
    if (!id) return;
    setIsSavingLoading(true);
    try {
      if (isSaved) {
        await unsavePlace(id);
        setIsSaved(false);
      } else {
        await savePlace(id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle save status:', err);
      alert('Không thể cập nhật trạng thái lưu địa điểm. Vui lòng thử lại sau.');
    } finally {
      setIsSavingLoading(false);
    }
  };

  // Load place details if not provided via state
  useEffect(() => {
    if (!place && id) {
      loadPlaceDetails();
    } else if (place) {
      loadMedia();
    }
  }, [id, place]);

  const loadPlaceDetails = async () => {
    try {
      setIsLoading(true);
      setError('');
      const details = await getPlaceDetails(id);
      setPlace(details);

      await loadMedia();
    } catch (err) {
      console.error('Error loading place details:', err);
      setPlace(null);
      setError('Không thể tải thông tin địa điểm. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMedia = async () => {
    try {
      const media = await getPlaceMedia(id);
      setReviews(Array.isArray(media?.reviews) ? media.reviews : []);
      setPhotos(Array.isArray(media?.photos) ? media.photos : []);
    } catch (err) {
      console.error('Error loading place media:', err);
      setReviews([]);
      setPhotos([]);
    }
  };

  const requestCurrentLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ định vị'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (geoError) => reject(geoError),
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 15000,
        }
      );
    });

  const handleConfirmOnsiteStatus = async () => {
    try {
      setOnsiteLoading(true);
      setOnsiteError('');

      if (isCurrentlyOnsite) {
        const status = await leaveOnsiteStatus();
        setOnsiteStatus(status);
      } else {
        let currentLocation;
        try {
          currentLocation = await requestCurrentLocation();
        } catch (geoErr) {
          console.warn('Geolocation failed, falling back to place coordinates for demo/dev mode:', geoErr);
          if (place && place.lat && place.lng) {
            currentLocation = { lat: place.lat, lng: place.lng };
          } else {
            throw new Error(geoErr?.message || 'Không thể định vị vị trí của bạn và địa điểm này chưa có tọa độ.');
          }
        }
        const status = await checkInAtPlace(id, currentLocation);
        setOnsiteStatus(status);
      }
    } catch (err) {
      console.error('Error toggling onsite status:', err);
      setOnsiteError(err?.message || 'Không thể cập nhật trạng thái onsite.');
    } finally {
      setOnsiteLoading(false);
    }
  };

  const handleVote = (type) => {
    setVote(prev => prev === type ? null : type);
  };

  const handleSubmitReview = async () => {
    if (!currentUser) {
      setReviewError('Vui lòng đăng nhập để viết đánh giá.');
      return;
    }
    if (reviewRating === 0) {
      setReviewError('Vui lòng chọn số sao đánh giá.');
      return;
    }
    if (!reviewContent.trim()) {
      setReviewError('Vui lòng nhập nội dung đánh giá.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewError('');
      const newReview = await createReview({
        locationId: id,
        rating: reviewRating,
        content: reviewContent.trim(),
      });
      setReviews(prev => [newReview, ...prev]);
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewContent('');
    } catch (err) {
      setReviewError(err.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) return;
    try {
      setDeletingReviewId(reviewId);
      setReviewError('');
      await deleteReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err) {
      setReviewError(err.message || 'Không thể xóa đánh giá. Vui lòng thử lại.');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleBackToMap = () => {
    const returnToMapState = location.state?.returnToMapState || null;
    navigate('/app', returnToMapState ? { state: { homeState: returnToMapState } } : undefined);
  };

  const formatDistance = (meters) => {
    if (!Number.isFinite(Number(meters))) return null;
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds) => {
    if (!Number.isFinite(Number(seconds))) return null;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `${hours} giờ ${remainingMinutes} phút` : `${hours} giờ`;
  };

  const handleDirections = async () => {
    if (!place?.lat || !place?.lng) {
      setRouteError('Địa điểm này chưa có tọa độ để chỉ đường.');
      return;
    }

    try {
      setIsRouting(true);
      setRouteError('');
      setRoute([]);
      setRouteInfo(null);

      const origin = await requestCurrentLocation();
      const destination = { lat: Number(place.lat), lng: Number(place.lng) };
      const details = await getRouteDetails(origin, destination);

      setUserLocation(origin);
      setRoute(details.coordinates);
      setRouteInfo({
        distance: formatDistance(details.distanceMeters),
        duration: formatDuration(details.durationSeconds),
      });

      const baseMapState = location.state?.returnToMapState || {};
      navigate('/app', {
        state: {
          homeState: {
            ...baseMapState,
            userLocation: origin,
            route: details.coordinates,
            selectedPlaceId: place.id,
            isSidebarOpen: true,
            showPlaceDetailPanel: true,
            appState: 'routing',
            mapFocusTarget: {
              id: `route-${place.id}`,
              lat: Number(place.lat),
              lng: Number(place.lng),
              zoom: 15,
            },
          },
        },
      });
    } catch (err) {
      console.error('Error getting directions:', err);
      setRouteError(err?.message || 'Không thể lấy chỉ đường. Vui lòng cho phép truy cập vị trí và thử lại.');
    } finally {
      setIsRouting(false);
    }
  };

  const displayName = place 
    ? (place.name || place.placeName || place.title || `Địa điểm #${String(id || '').slice(0, 8)}`)
    : `Địa điểm #${String(id || '').slice(0, 8)}`;

  const galleryPhotos = place 
    ? Array.from(new Set([
        ...photos,
        place.coverImageUrl,
        place.imageUrl,
      ].filter(Boolean)))
    : [];

  useEffect(() => {
    if (galleryPreviewIndex >= galleryPhotos.length) {
      setGalleryPreviewIndex(0);
    }
  }, [galleryPhotos.length, galleryPreviewIndex]);

  const showPreviousGalleryPhoto = (event) => {
    event.stopPropagation();
    if (galleryPhotos.length <= 1) return;
    setGalleryPreviewIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length);
  };

  const showNextGalleryPhoto = (event) => {
    event.stopPropagation();
    if (galleryPhotos.length <= 1) return;
    setGalleryPreviewIndex((prev) => (prev + 1) % galleryPhotos.length);
  };

  const nextPhoto = () => {
    if (activePhotoIndex === null || galleryPhotos.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % galleryPhotos.length);
  };

  const prevPhoto = () => {
    if (activePhotoIndex === null || galleryPhotos.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev + 1) % galleryPhotos.length);
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length);
      } else if (e.key === 'Escape') {
        setActivePhotoIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, galleryPhotos.length]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-base-50">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader className="w-10 h-10 animate-spin mx-auto mb-4 text-primary-700" />
            <p className="text-slate-600 font-medium italic">Đang tải thông tin địa điểm...</p>
          </div>
        </div>
      </div>
    );
  }

  // If there's no place at all (even fallback failed), show a simple error
  if (!place) {
    return (
      <div className="flex flex-col min-h-screen bg-base-50">
        <Navbar />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-6">Không thể tải dữ liệu.</p>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary-600 text-white rounded-lg">Quay lại</button>
          </div>
        </div>
      </div>
    );
  }

  const rating = place.rating || place.averageRating || place.rawSerpApiPropertyDetails?.rating || 0;
  const reviewCount = place.reviewCount || place.review_count || place.userRatingsTotal || place.rawSerpApiPropertyDetails?.reviewCount || 0;
  
  const getPriceDisplay = () => {
    if (place.price) return place.price;
    if (place.priceLevel) {
      const levels = { 1: 'Giá rẻ ($)', 2: 'Bình dân ($$)', 3: 'Sang trọng ($$$)', 4: 'Cao cấp ($$$$)' };
      return levels[place.priceLevel] || '$'.repeat(place.priceLevel);
    }
    return null;
  };
  const priceDisplay = getPriceDisplay();

  const description = place.description || place.rawSerpApiPropertyDetails?.description || 'Địa điểm này chưa có mô tả chính thức. Các thông tin bên dưới được tổng hợp từ dữ liệu hiện có của hệ thống.';
  const amenities = place.amenities || place.rawSerpApiPropertyDetails?.amenities || [];
  const phone = place.phone || place.phoneNumber || place.rawSerpApiPropertyDetails?.phone || 'Đang cập nhật';
  const email = place.email || place.rawSerpApiPropertyDetails?.email || null;
  const website = place.website || place.rawSerpApiPropertyDetails?.website || 'Đang cập nhật';
  const openingHours = place.openingHours || place.opening_hours || place.rawSerpApiPropertyDetails?.openingHours || place.rawSerpApiPropertyDetails?.opening_hours || 'Đang cập nhật';
  const rooms = place.rooms || place.rawSerpApiPropertyDetails?.rooms || null;

  const placeholderImg = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200&h=400`;
  const visibleReviews = reviews.filter((review) => review.source !== 'google');
  const displayAddress = place.address || place.placeAddress || place.formattedAddress || place.rawSerpApiPropertyDetails?.address || '';
  const tabs = [
    { id: 'overview', label: 'Thông tin chung' },
    { id: 'qa', label: 'Hỏi đáp cộng đồng' },
    { id: 'reviews', label: 'Đánh giá' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-base-50 overflow-x-hidden">
      <Navbar className="sticky top-0 z-50 shadow-md" />

      {error && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-amber-800 text-sm font-medium animate-soft-in">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          {error}
        </div>
      )}

      {/* Hero Section */}
      <div className="relative h-[300px] sm:h-[450px] w-full overflow-hidden group bg-slate-200 flex items-center justify-center">
        <div className="absolute left-4 right-4 top-4 z-20 sm:left-6 sm:right-6">
          <div className="max-w-7xl mx-auto">
            <button
              type="button"
              onClick={handleBackToMap}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg backdrop-blur-md transition hover:bg-white hover:text-primary-700 hover:shadow-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại bản đồ
            </button>
          </div>
        </div>
        {(photos.length > 0 || place.coverImageUrl || place.imageUrl) ? (
          <img 
            src={photos[0] || place.coverImageUrl || place.imageUrl} 
            alt={displayName} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <>
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')]"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12">          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {place.categories?.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-semibold rounded-full uppercase tracking-wider border border-white/30">
                    {cat}
                  </span>
                )) || (
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-semibold rounded-full uppercase tracking-wider border border-white/30">
                    {place.type || 'Địa điểm'}
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight drop-shadow-lg tracking-tight inline-flex flex-wrap items-center gap-4">
                <span>{displayName}</span>
                {priceDisplay && (
                  <span className="text-lg sm:text-xl font-bold bg-emerald-500 text-white px-3.5 py-1.5 rounded-2xl shadow-xl shadow-emerald-500/20 border border-emerald-400 select-none shrink-0 self-center">
                    {priceDisplay}
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xl font-bold">{rating.toFixed(1)}</span>
                  <span className="text-white/60 text-sm font-medium">({reviewCount} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-white/20 pl-4">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-medium line-clamp-1">{displayAddress || 'Địa chỉ đang cập nhật'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleVote('up')}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
                  vote === 'up' ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white/95 text-slate-900 hover:bg-emerald-50'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${vote === 'up' ? 'fill-white' : ''}`} />
                <span>Thích</span>
              </button>
              <button 
                onClick={() => handleVote('down')}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
                  vote === 'down' ? 'bg-red-500 text-white shadow-red-200' : 'bg-white/95 text-slate-900 hover:bg-red-50'
                }`}
              >
                <ThumbsDown className={`w-5 h-5 ${vote === 'down' ? 'fill-white' : ''}`} />
                <span>Không thích</span>
              </button>
              <button 
                onClick={handleToggleSave}
                disabled={isSavingLoading}
                className={`p-3 rounded-2xl border transition-all shadow-lg active:scale-95 flex items-center justify-center ${
                  isSaved 
                    ? 'bg-rose-500 text-white border-rose-500 shadow-rose-200 hover:bg-rose-600' 
                    : 'bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30'
                }`}
                title={isSaved ? "Bỏ lưu địa điểm" : "Lưu địa điểm"}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-white' : ''}`} />
              </button>
              <button className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white border border-white/30 hover:bg-white/30 transition-all shadow-lg">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="relative z-10 -mt-8 mx-auto w-[min(92vw,80rem)] rounded-3xl border border-white/70 bg-white/95 px-5 py-4 shadow-xl backdrop-blur-md sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-700">Place detail</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{displayName}</h2>
            <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-600">{displayAddress || 'Địa chỉ đang cập nhật'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-2xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">
              {rating ? `${rating.toFixed(1)} ★` : 'Chưa có rating'}
            </span>
            {priceDisplay ? (
              <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">{priceDisplay}</span>
            ) : null}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition duration-200 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.45fr_0.9fr]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-700">Overview</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">Thông tin về {displayName}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                      <MapPin className="h-4 w-4 text-primary-600" />
                      Địa chỉ
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900">{displayAddress || 'Đang cập nhật'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      Rating
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900">
                      {rating ? `${rating.toFixed(1)}/5` : 'Chưa có rating'}
                      <span className="ml-2 font-medium text-slate-500">({visibleReviews.length} đánh giá cộng đồng)</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                      <Clock className="h-4 w-4 text-primary-600" />
                      Giờ hoạt động
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900">{openingHours}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                      <Phone className="h-4 w-4 text-primary-600" />
                      Liên hệ
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900">{phone}</p>
                  </div>
                  {email && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        Email
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-900 truncate">{email}</p>
                    </div>
                  )}
                  {rooms && (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><path d="M2 22h20"/><path d="M4 22V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v18"/><path d="M12 18h.01"/><path d="M12 14h.01"/><path d="M12 10h.01"/><path d="M12 6h.01"/><path d="M8 18h.01"/><path d="M8 14h.01"/><path d="M8 10h.01"/><path d="M8 6h.01"/><path d="M16 18h.01"/><path d="M16 14h.01"/><path d="M16 10h.01"/><path d="M16 6h.01"/></svg>
                        Số phòng
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-900">{rooms} phòng</p>
                    </div>
                  )}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                      <Globe className="h-4 w-4 text-primary-600" />
                      Website
                    </div>
                    <p className="mt-2 truncate text-sm font-bold text-slate-900">{website}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                      <ImageIcon className="h-4 w-4 text-primary-600" />
                      Hình ảnh
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900">{photos.length ? `${photos.length} ảnh` : 'Chưa có ảnh cộng đồng'}</p>
                  </div>
                </div>

                {amenities && amenities.length > 0 ? (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-600">Tiện ích được ghi nhận</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {amenities.map((amenity, idx) => (
                        <span key={idx} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              {/* Photo Gallery Grid */}
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {galleryPhotos.length ? (
                  <>
                    <div className="relative p-2">
                      <button
                        type="button"
                        onClick={() => setActivePhotoIndex(galleryPreviewIndex)}
                        className="group relative aspect-[16/9] w-full overflow-hidden rounded-[1.35rem] bg-slate-100 text-left transition hover:brightness-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200"
                      >
                        <img
                          src={galleryPhotos[galleryPreviewIndex] || galleryPhotos[0]}
                          alt={`${displayName} - ảnh ${galleryPreviewIndex + 1}`}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/5 to-transparent" />
                        <div className="absolute bottom-5 left-5 right-28">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/75">Ảnh địa điểm</p>
                          <p className="mt-1 line-clamp-1 text-lg font-black text-white sm:text-2xl">{displayName}</p>
                        </div>
                      </button>

                      {galleryPhotos.length > 1 ? (
                        <>
                          <button
                            type="button"
                            onClick={showPreviousGalleryPhoto}
                            className="absolute left-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg ring-1 ring-slate-200 transition hover:scale-105 hover:bg-white"
                            aria-label="Xem ảnh trước"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            type="button"
                            onClick={showNextGalleryPhoto}
                            className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-lg ring-1 ring-slate-200 transition hover:scale-105 hover:bg-white"
                            aria-label="Xem ảnh tiếp theo"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        </>
                      ) : null}

                      <div className="absolute right-5 top-5 rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
                        {galleryPreviewIndex + 1} / {galleryPhotos.length}
                      </div>

                      <button
                        type="button"
                        onClick={() => setActivePhotoIndex(galleryPreviewIndex)}
                        className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg ring-1 ring-slate-200 transition hover:scale-105 hover:bg-slate-50"
                        aria-label="Xem ảnh toàn màn hình"
                        title="Xem ảnh toàn màn hình"
                      >
                        <Maximize2 className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 px-5 pb-5 pt-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary-700">Ảnh địa điểm</p>
                        <h3 className="mt-1 text-xl font-black text-slate-950">Góc nhìn thực tế</h3>
                      </div>
                      <p className="text-sm font-semibold text-slate-500">{galleryPhotos.length} ảnh được lấy từ dữ liệu địa điểm.</p>
                    </div>
                  </>
                ) : (
                  <div className="p-6">
                    <div className="flex min-h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                      <ImageIcon className="mb-3 h-12 w-12 text-slate-300" />
                      <p className="font-bold text-slate-600">Chưa có ảnh để hiển thị</p>
                      <p className="mt-1 max-w-md text-sm text-slate-400">
                        Hình ảnh địa điểm sẽ tự động đồng bộ khi tính năng ảnh được bật trong cấu hình hệ thống.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">Xác nhận onsite</h3>
                    <p className="mt-1 text-sm text-slate-600">Dùng khi bạn đang ở địa điểm này để cộng đồng biết câu trả lời của bạn có ngữ cảnh thực tế.</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-black ${isCurrentlyOnsite ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {isCurrentlyOnsite ? 'Đang onsite' : 'Offsite'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmOnsiteStatus}
                  disabled={onsiteLoading}
                  className={`mt-5 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition active:scale-95 disabled:opacity-50 ${
                    isCurrentlyOnsite ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {onsiteLoading ? 'Đang cập nhật...' : isCurrentlyOnsite ? 'Rời khỏi địa điểm' : 'Xác nhận đang ở đây'}
                </button>
                {onsiteError ? <p className="mt-3 text-sm font-semibold text-rose-600">{onsiteError}</p> : null}
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-32">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="h-72 bg-slate-200">
                  {place.lat && place.lng ? (
                    <MapComponent
                      userLocation={userLocation || { lat: place.lat, lng: place.lng }}
                      places={[place]}
                      route={route}
                      onMarkerClick={() => {}}
                      onDirectionsRequested={handleDirections}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">Chưa có tọa độ</div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-black text-slate-950">Vị trí & tuyến đường</h3>
                  <p className="mt-1 text-sm text-slate-600">{displayAddress || 'Đang cập nhật'}</p>
                  {routeInfo ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-primary-50 px-3 py-2 text-sm font-black text-primary-800">
                        {routeInfo.distance || 'N/A'}
                        <span className="block text-xs font-medium text-primary-700">Quãng đường</span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                        {routeInfo.duration || 'N/A'}
                        <span className="block text-xs font-medium text-slate-500">Thời gian lái xe</span>
                      </div>
                    </div>
                  ) : null}
                  {routeError ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{routeError}</div> : null}
                  <button
                    type="button"
                    onClick={handleDirections}
                    disabled={isRouting}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-black text-white transition hover:bg-primary-700 disabled:opacity-60"
                  >
                    {isRouting ? <Loader className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                    {isRouting ? 'Đang lấy tuyến...' : 'Chỉ đường từ vị trí của tôi'}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'qa' && <QASection placeId={id} place={place} />}

        {activeTab === 'reviews' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Đánh giá từ cộng đồng</h2>
                <p className="mt-1 text-sm text-slate-500">{visibleReviews.length} đánh giá hiển thị</p>
              </div>
              <button
                onClick={() => {
                  if (!currentUser) {
                    setReviewError('Vui lòng đăng nhập để viết đánh giá.');
                    return;
                  }
                  setShowReviewForm((prev) => !prev);
                  setReviewError('');
                }}
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition active:scale-95 ${
                  showReviewForm ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {showReviewForm ? <><X className="h-4 w-4" /> Hủy</> : <><Edit3 className="h-4 w-4" /> Viết đánh giá</>}
              </button>
            </div>

            {showReviewForm && (
              <div className="mb-8 rounded-3xl border border-orange-100 bg-orange-50/70 p-5">
                <p className="mb-3 text-sm font-black text-slate-800">Đánh giá của bạn</p>
                <div className="mb-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      className="p-1 transition-transform hover:scale-125 active:scale-95"
                    >
                      <Star className={`h-8 w-8 ${star <= (reviewHoverRating || reviewRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm thực tế của bạn..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
                {reviewError ? <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{reviewError}</div> : null}
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewRating(0);
                      setReviewContent('');
                      setReviewError('');
                    }}
                    className="rounded-2xl px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview || reviewRating === 0 || !reviewContent.trim()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-sm font-black text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isSubmittingReview ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Gửi đánh giá
                  </button>
                </div>
              </div>
            )}

            {!showReviewForm && reviewError ? <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{reviewError}</div> : null}

            {visibleReviews.length ? (
              <div className="space-y-4">
                {visibleReviews.map((review) => {
                  const authorName = review.user?.displayName || review.author || 'Ẩn danh';
                  const authorInitial = authorName.charAt(0).toUpperCase();
                  const reviewDate = review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : review.date || '';
                  const reviewText = review.reviewText || review.text || '';
                  const isOwnReview = currentUser && review.user?.firebaseUid && review.user.firebaseUid === currentUser.uid;

                  return (
                    <article key={review.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-orange-100 text-sm font-black text-orange-700">
                            {authorInitial}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-950">{authorName}</p>
                            <p className="text-xs font-medium text-slate-500">{reviewDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {review.rating ? (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                              ))}
                            </div>
                          ) : null}
                          {isOwnReview ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(review.id)}
                              disabled={deletingReviewId === review.id}
                              className="rounded-xl px-2 py-1 text-xs font-bold text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingReviewId === review.id ? 'Đang xóa...' : 'Xóa'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {reviewText ? <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-7 text-slate-700">{reviewText}</p> : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
                <MessageCircle className="mx-auto mb-4 h-14 w-14 text-slate-300" />
                <p className="font-bold text-slate-600">Chưa có đánh giá nào</p>
                <p className="mt-1 text-sm text-slate-400">Hãy là người đầu tiên chia sẻ trải nghiệm.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Legacy layout kept hidden while tabs replace the detail surface. */}
      <main className="hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Column - Details, QA, Reviews */}
          <div className="lg:col-span-2 space-y-12">
            {/* About Section */}
            <section className="hidden">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                Thông tin chi tiết
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                {place.description || 'Chưa có mô tả chính thức cho địa điểm này.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-base-50 border border-slate-100">
                  <Clock className="w-6 h-6 text-primary-600 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Giờ mở cửa</p>
                    <p className="text-slate-600 text-sm">Đang cập nhật</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-base-50 border border-slate-100">
                  <Phone className="w-6 h-6 text-primary-600 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Điện thoại</p>
                    <p className="text-slate-600 text-sm">{place.phoneNumber || 'Đang cập nhật'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-base-50 border border-slate-100">
                  <Globe className="w-6 h-6 text-primary-600 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Website</p>
                    <p className="text-slate-600 text-sm truncate max-w-[200px]">{place.website || 'Đang cập nhật'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-base-50 border border-slate-100">
                  <ImageIcon className="w-6 h-6 text-primary-600 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Hình ảnh</p>
                    <p className="text-slate-600 text-sm">{photos.length ? `${photos.length} ảnh` : 'Chưa có ảnh cộng đồng'}</p>
                  </div>
                </div>
              </div>

              {place.amenities && place.amenities.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                    Tiện ích nổi bật
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {place.amenities.map((amenity, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-50 border border-slate-100 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-100/70 hover:border-slate-200 transition-colors"
                      >
                        <span className="text-primary-600 select-none">✦</span>
                        <span className="line-clamp-1">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* QA Section Placeholder */}
            <QASection placeId={id} place={place} />

            {/* Reviews Section */}
            <section className="surface-card-solid p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Đánh giá từ cộng đồng</h2>
                  <p className="text-sm text-slate-500 mt-1">{visibleReviews.length} đánh giá</p>
                </div>
                <button
                  onClick={() => {
                    if (!currentUser) {
                      setReviewError('Vui lòng đăng nhập để viết đánh giá.');
                      return;
                    }
                    setShowReviewForm(prev => !prev);
                    setReviewError('');
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm active:scale-95 shadow-sm ${
                    showReviewForm
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-amber-200'
                  }`}
                >
                  {showReviewForm ? (
                    <><X className="w-4 h-4" /> Hủy</>
                  ) : (
                    <><Edit3 className="w-4 h-4" /> Viết đánh giá</>
                  )}
                </button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="mb-8 p-6 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border border-amber-200/60 shadow-inner transition-all">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md">
                      {currentUser?.displayName?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{currentUser?.displayName || currentUser?.email || 'Người dùng'}</p>
                      <p className="text-xs text-slate-500">Đang viết đánh giá</p>
                    </div>
                  </div>

                  {/* Star Rating Picker */}
                  <div className="mb-5">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Đánh giá của bạn</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          className="p-1 transition-transform hover:scale-125 active:scale-95"
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              star <= (reviewHoverRating || reviewRating)
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                      {reviewRating > 0 && (
                        <span className="ml-3 text-sm font-bold text-amber-600">
                          {reviewRating === 1 && 'Tệ'}
                          {reviewRating === 2 && 'Không tốt'}
                          {reviewRating === 3 && 'Bình thường'}
                          {reviewRating === 4 && 'Tốt'}
                          {reviewRating === 5 && 'Tuyệt vời'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Textarea */}
                  <div className="mb-5">
                    <textarea
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn tại đây... Bạn thích điều gì? Có điều gì cần cải thiện không?"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white text-slate-800 placeholder-slate-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all shadow-sm"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-slate-400">{reviewContent.length}/500 ký tự</p>
                    </div>
                  </div>

                  {reviewError && (
                    <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {reviewError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewRating(0);
                        setReviewContent('');
                        setReviewError('');
                      }}
                      className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview || reviewRating === 0 || !reviewContent.trim()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm hover:from-amber-600 hover:to-orange-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-200/50"
                    >
                      {isSubmittingReview ? (
                        <><Loader className="w-4 h-4 animate-spin" /> Đang gửi...</>
                      ) : (
                        <><Send className="w-4 h-4" /> Gửi đánh giá</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Review error (when not showing form, e.g. not logged in) */}
              {!showReviewForm && reviewError && (
                <div className="mb-6 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {reviewError}
                </div>
              )}

              {/* Review List */}
              {visibleReviews.length > 0 ? (
                <div className="space-y-5">
                  {visibleReviews.map((review) => {
                    const authorName = review.user?.displayName || review.author || 'Ẩn danh';
                    const authorInitial = authorName.charAt(0).toUpperCase();
                    const reviewDate = review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : review.date || '';
                    const reviewText = review.reviewText || review.text || '';
                    const isOwnReview = currentUser && review.user?.firebaseUid && review.user.firebaseUid === currentUser.uid;

                    return (
                      <div key={review.id} className="p-6 bg-base-50 rounded-2xl border border-slate-100 transition-all hover:border-amber-200 hover:shadow-sm group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center font-bold text-amber-700 text-sm border border-amber-200/50">
                              {authorInitial}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{authorName}</p>
                              <p className="text-xs text-slate-500 font-medium">{reviewDate}</p>
                            </div>
                          </div>
                          {review.rating && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                          {isOwnReview && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReview(review.id)}
                              disabled={deletingReviewId === review.id}
                              className="flex items-center gap-1 ml-2 px-2 py-1 rounded-lg text-xs font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                              title="Xóa đánh giá của bạn"
                            >
                              {deletingReviewId === review.id ? (
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Xóa
                            </button>
                          )}
                        </div>
                        {reviewText && (
                          <p className="text-slate-700 leading-relaxed text-sm bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            {reviewText}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-amber-50/30 rounded-2xl border border-dashed border-slate-200">
                  <MessageCircle className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-semibold mb-1">Chưa có đánh giá nào</p>
                  <p className="text-slate-400 text-sm">Hãy là người đầu tiên chia sẻ trải nghiệm!</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Map & Quick Actions */}
          <div className="space-y-8 sticky top-32">
            <div className="surface-card-solid p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">Trạng thái onsite</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Bấm xác nhận khi bạn muốn bật trạng thái onsite cho place này.
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isCurrentlyOnsite
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isCurrentlyOnsite ? 'Đang ở đây' : 'Offsite'}
                </div>
              </div>
              {isCurrentlyOnsite ? (
                <p className="mt-3 text-sm text-slate-700">
                  Đã xác nhận bạn đang ở tại {onsiteStatus.placeName || place.name}.
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-700">Chưa xác nhận onsite. Bạn có thể làm việc đó sau bằng nút bên dưới.</p>
              )}
              <button
                type="button"
                onClick={handleConfirmOnsiteStatus}
                disabled={onsiteLoading}
                className={`mt-4 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-95 disabled:opacity-50 ${
                  isCurrentlyOnsite
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {onsiteLoading
                  ? 'Đang cập nhật...'
                  : isCurrentlyOnsite
                  ? 'Rời khỏi địa điểm (Hủy onsite)'
                  : 'Xác nhận đang ở đây'}
              </button>
              {onsiteError ? <p className="mt-3 text-sm text-red-600">{onsiteError}</p> : null}
            </div>

            {/* Map Preview */}
            <div className="surface-card-solid overflow-hidden">
              <div className="h-64 relative bg-slate-200">
                {place.lat && place.lng && (
                  <MapComponent
                    userLocation={userLocation || { lat: place.lat, lng: place.lng }}
                    places={[place]}
                    route={route}
                    onMarkerClick={() => {}}
                    onDirectionsRequested={handleDirections}
                  />
                )}
                <div className="absolute bottom-4 right-4 z-[400]">
                  <button
                    type="button"
                    onClick={handleDirections}
                    disabled={isRouting}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl shadow-lg font-bold hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-60"
                  >
                    {isRouting ? <Loader className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                    <span>{isRouting ? 'Đang lấy tuyến...' : 'Chỉ đường'}</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-2">Vị trí & tuyến đường</h3>
                <p className="text-slate-600 text-sm mb-4">{place.address}</p>
                {routeInfo ? (
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-primary-50 px-3 py-2 text-sm font-bold text-primary-800">
                      {routeInfo.distance || 'N/A'}
                      <span className="block text-xs font-medium text-primary-700">Quãng đường</span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
                      {routeInfo.duration || 'N/A'}
                      <span className="block text-xs font-medium text-slate-500">Thời gian lái xe</span>
                    </div>
                  </div>
                ) : null}
                {routeError ? (
                  <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                    {routeError}
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-4 border-t border-slate-50">
                  <span>LAT: {place.lat?.toFixed(4)}</span>
                  <span>LNG: {place.lng?.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions / Tips */}
            <div className="hidden">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                Mẹo du lịch
              </h3>
              <ul className="space-y-4 text-primary-50">
                <li className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary-200 rounded-full mt-1.5 shrink-0" />
                  Thời điểm tốt nhất để ghé thăm là từ 4h - 6h chiều để đón hoàng hôn.
                </li>
                <li className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary-200 rounded-full mt-1.5 shrink-0" />
                  Hãy chuẩn bị sẵn máy ảnh vì view ở đây cực kỳ lung linh.
                </li>
                <li className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary-200 rounded-full mt-1.5 shrink-0" />
                  Đặt chỗ trước nếu bạn đi vào cuối tuần.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Placeholder */}
      <footer className="bg-slate-900 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <img src="/favicon.svg" alt="Smacco Logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Smacco</span>
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Khám phá thế giới thông minh hơn với trợ lý du lịch AI Smacco. Mọi thông tin đều được cá nhân hóa cho chuyến đi của bạn.
          </p>
          <div className="mt-8 pt-8 border-t border-white/5 text-slate-600 text-xs">
            © 2026 Smacco. Made for the Future of Travel.
          </div>
        </div>
      </footer>

      {/* Fullscreen Photo Lightbox Overlay */}
      {activePhotoIndex !== null && galleryPhotos.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-fade-in">
          {/* Top Header */}
          <div className="flex items-center justify-between w-full text-white/90">
            <span className="text-sm font-bold bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
              Ảnh {activePhotoIndex + 1} / {galleryPhotos.length}
            </span>
            <div className="flex items-center gap-2">
              <a
                href={galleryPhotos[activePhotoIndex]}
                target="_blank"
                rel="noopener noreferrer"
                title="Mở ảnh gốc trong tab mới"
                className="p-2 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition border border-white/5 backdrop-blur-sm"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <button
                onClick={() => setActivePhotoIndex(null)}
                title="Đóng (Esc)"
                className="p-2 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition border border-white/5 backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Visual Display */}
          <div className="relative flex flex-1 items-center justify-center py-4 w-full h-[60vh] max-h-[75vh]">
            {/* Nav Arrows */}
            <button
              onClick={prevPhoto}
              className="absolute left-0 sm:left-4 z-50 p-3 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80 transition-all border border-white/10 backdrop-blur-sm active:scale-90"
              title="Ảnh trước (ArrowLeft)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={galleryPhotos[activePhotoIndex]}
              alt={`${displayName} - ảnh phóng to ${activePhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-all duration-300 transform scale-100 border border-white/5"
            />

            <button
              onClick={nextPhoto}
              className="absolute right-0 sm:right-4 z-50 p-3 rounded-full bg-slate-900/60 text-white hover:bg-slate-900/80 transition-all border border-white/10 backdrop-blur-sm active:scale-90"
              title="Ảnh tiếp theo (ArrowRight)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Thumbnails Navigation */}
          <div className="w-full max-w-4xl mx-auto mt-2">
            <div className="flex justify-center gap-2 overflow-x-auto py-3 px-4 max-w-full scrollbar-thin scrollbar-thumb-white/20">
              {galleryPhotos.map((photo, index) => (
                <button
                  key={`${photo}-${index}`}
                  onClick={() => setActivePhotoIndex(index)}
                  className={`relative h-14 w-20 sm:h-16 sm:w-24 overflow-hidden rounded-xl bg-slate-900 flex-shrink-0 transition duration-300 ${
                    index === activePhotoIndex
                      ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-950 scale-105 opacity-100'
                      : 'opacity-50 hover:opacity-80 hover:scale-105'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
