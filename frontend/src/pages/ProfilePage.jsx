import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Star, 
  MessageSquare, 
  ChevronRight,
  Loader2,
  AlertCircle,
  Bookmark
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTravelData } from '../contexts/TravelDataContext';
import { getUserReviews } from '../services/placeService';
import { getMyOnsiteStatus, leaveOnsiteStatus } from '../services/presenceService';
import { getSavedPlaces, unsavePlace } from '../services/savedPlacesService';
import Navbar from '../components/Navbar';
import PlaceCard from '../components/PlaceCard';
import { navigateToPlaceDetail } from '../utils/placeNavigation';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { checkIns, removeCheckIn } = useTravelData();
  const [activeTab, setActiveTab] = useState('checkins'); // 'checkins', 'saved', or 'reviews'
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [error, setError] = useState('');
  const [onsiteStatus, setOnsiteStatus] = useState(null);
  const [onsiteLoading, setOnsiteLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.uid && activeTab === 'reviews') {
      loadUserReviews();
    } else if (currentUser?.uid && activeTab === 'saved') {
      loadSavedPlaces();
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadSavedPlaces();
      loadOnsiteStatus();
    }
  }, [currentUser]);

  const loadUserReviews = async () => {
    try {
      setIsLoadingReviews(true);
      setError('');
      const data = await getUserReviews(currentUser.uid);
      setReviews(data);
    } catch (err) {
      setError('Không thể tải danh sách đánh giá.');
      console.error(err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const loadSavedPlaces = async () => {
    try {
      setIsLoadingSaved(true);
      setError('');
      const data = await getSavedPlaces();
      setSavedPlaces(data);
    } catch (err) {
      setError('Không thể tải danh sách địa điểm đã lưu.');
      console.error(err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleUnsavePlace = async (placeId) => {
    try {
      await unsavePlace(placeId);
      setSavedPlaces((prev) => prev.filter((p) => p.id !== placeId));
    } catch (err) {
      console.error('Failed to unsave place:', err);
      alert('Không thể bỏ lưu địa điểm. Vui lòng thử lại sau.');
    }
  };

  const loadOnsiteStatus = async () => {
    try {
      const status = await getMyOnsiteStatus();
      setOnsiteStatus(status);
    } catch (err) {
      console.error(err);
      setOnsiteStatus(null);
    }
  };

  const handleLeaveOnsiteStatus = async () => {
    try {
      setOnsiteLoading(true);
      await leaveOnsiteStatus();
      await loadOnsiteStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setOnsiteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleBackToMap = () => {
    navigate('/app');
  };

  const openPlaceDetail = (placeId, place) => {
    navigateToPlaceDetail(navigate, placeId, { place });
  };

  const userInitial = currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U';
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Người dùng';

    return (
      <div className="page-shell flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:px-6 lg:py-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBackToMap}
              className="inline-flex items-center gap-2 rounded-2xl border border-base-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-200 hover:text-primary-700 hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại bản đồ
            </button>
            <div className="hidden sm:block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Hồ sơ cá nhân
            </div>
          </div>

          {/* Profile Header */}
          <section className="surface-card-solid p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-primary-600 to-accent-500 rounded-full flex items-center justify-center text-white text-4xl sm:text-5xl font-black shadow-glow ring-4 ring-white">
              {userInitial.toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">{userName}</h1>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-slate-500 text-sm">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {currentUser?.email}
                </div>
                {currentUser?.metadata?.creationTime && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Tham gia từ {new Date(currentUser.metadata.creationTime).getFullYear()}
                  </div>
                )}
              </div>
              <div className="pt-4 flex justify-center sm:justify-start gap-3">
                <div className="px-4 py-2 bg-primary-50 rounded-2xl text-primary-700 text-sm font-bold">
                  {checkIns.length} Check-ins
                </div>
                <div className="px-4 py-2 bg-rose-50 rounded-2xl text-rose-700 text-sm font-bold">
                  {savedPlaces.length} Đã lưu
                </div>
                <div className="px-4 py-2 bg-emerald-50 rounded-2xl text-emerald-700 text-sm font-bold">
                  {reviews.length || '...'} Đánh giá
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-card p-6 sm:p-7 mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary-700">Onsite status</p>
              {onsiteStatus?.isActive ? (
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Đang ở tại {onsiteStatus.placeName || 'một địa điểm'}
                </h2>
              ) : (
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Chưa bật trạng thái onsite</h2>
              )}
              <p className="mt-2 text-sm text-slate-600">
                Trạng thái này chỉ hiển thị khi bạn bật tại một địa điểm; trong thread, avatar của bạn sẽ được đánh dấu onsite.
              </p>
            </div>
            {onsiteStatus?.isActive ? (
              <button
                type="button"
                onClick={handleLeaveOnsiteStatus}
                disabled={onsiteLoading}
                className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-50"
              >
                {onsiteLoading ? 'Đang tắt...' : 'Tắt trạng thái onsite'}
              </button>
            ) : null}
          </div>
        </section>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('checkins')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'checkins'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Lịch sử Check-in
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'saved'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Địa điểm đã lưu
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Đánh giá của tôi
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'checkins' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checkIns.length > 0 ? (
                checkIns.map((ci) => (
                  <PlaceCard
                    key={ci.id}
                    place={{
                      id: ci.placeId,
                      name: ci.name,
                      address: ci.address,
                      type: ci.type,
                      rating: ci.rating,
                      lat: ci.lat,
                      lng: ci.lng,
                    }}
                    onSelect={() => openPlaceDetail(ci.placeId, {
                      id: ci.placeId,
                      name: ci.name,
                      address: ci.address,
                      type: ci.type,
                      rating: ci.rating,
                      lat: ci.lat,
                      lng: ci.lng,
                    })}
                    onNavigate={() => openPlaceDetail(ci.placeId, {
                      id: ci.placeId,
                      name: ci.name,
                      address: ci.address,
                      type: ci.type,
                      rating: ci.rating,
                      lat: ci.lat,
                      lng: ci.lng,
                    })}
                    onCheckIn={() => removeCheckIn(ci.id)}
                    isCheckedIn={true}
                    showActions={true}
                  />
                ))
              ) : (
                <div className="col-span-full py-16 text-center surface-card-solid border-dashed">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Bạn chưa check-in địa điểm nào.</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-4 text-primary-700 font-bold hover:underline"
                  >
                    Khám phá ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoadingSaved ? (
                <div className="col-span-full py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
                </div>
              ) : savedPlaces.length > 0 ? (
                savedPlaces.map((sp) => (
                  <PlaceCard
                    key={sp.id}
                    place={{
                      id: sp.id,
                      name: sp.placeName,
                      address: sp.placeAddress,
                      type: sp.categories?.[0] || 'hotel',
                      rating: sp.rating || 4.5,
                      lat: sp.lat,
                      lng: sp.lng,
                    }}
                    onSelect={() => openPlaceDetail(sp.id, {
                      id: sp.id,
                      name: sp.placeName,
                      address: sp.placeAddress,
                      type: sp.categories?.[0] || 'hotel',
                      rating: sp.rating || 4.5,
                      lat: sp.lat,
                      lng: sp.lng,
                    })}
                    onNavigate={() => openPlaceDetail(sp.id, {
                      id: sp.id,
                      name: sp.placeName,
                      address: sp.placeAddress,
                      type: sp.categories?.[0] || 'hotel',
                      rating: sp.rating || 4.5,
                      lat: sp.lat,
                      lng: sp.lng,
                    })}
                    onSave={() => handleUnsavePlace(sp.id)}
                    isSaved={true}
                    showActions={true}
                  />
                ))
              ) : (
                <div className="col-span-full py-16 text-center surface-card-solid border-dashed">
                  <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
                  <p className="text-slate-500 font-medium">Bạn chưa lưu địa điểm nào.</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-4 text-primary-700 font-bold hover:underline"
                  >
                    Khám phá và lưu ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {isLoadingReviews ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <div 
                    key={review.id}
                    className="surface-card-solid p-6 hover:border-primary-200 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <button
                        type="button"
                        className="cursor-pointer text-left"
                        onClick={() => openPlaceDetail(review.placeId, {
                          id: review.placeId,
                          name: review.place?.placeName || 'Địa điểm',
                        })}
                      >
                        <h3 className="font-bold text-ink-900 group-hover:text-primary-700 flex items-center gap-1 transition-colors">
                          {review.place?.placeName || 'Địa điểm'}
                          <ChevronRight className="w-4 h-4" />
                        </h3>
                        <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                      </button>
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-bold">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        {review.rating}
                      </div>
                    </div>
                    <p className="text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      "{review.reviewText}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center surface-card-solid border-dashed">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Bạn chưa viết đánh giá nào.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
