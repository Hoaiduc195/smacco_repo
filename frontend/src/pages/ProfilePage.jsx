import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Star, 
  MessageSquare, 
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTravelData } from '../contexts/TravelDataContext';
import { getUserReviews } from '../services/placeService';
import Navbar from '../components/Navbar';
import PlaceCard from '../components/PlaceCard';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { checkIns, removeCheckIn } = useTravelData();
  const [activeTab, setActiveTab] = useState('checkins'); // 'checkins' or 'reviews'
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.uid && activeTab === 'reviews') {
      loadUserReviews();
    }
  }, [currentUser, activeTab]);

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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const userInitial = currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U';
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Người dùng';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:px-6 lg:py-12">
        {/* Profile Header */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-4xl sm:text-5xl font-black shadow-lg shadow-blue-100 ring-4 ring-white">
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
                <div className="px-4 py-2 bg-blue-50 rounded-2xl text-blue-700 text-sm font-bold">
                  {checkIns.length} Check-ins
                </div>
                <div className="px-4 py-2 bg-emerald-50 rounded-2xl text-emerald-700 text-sm font-bold">
                  {reviews.length || '...'} Đánh giá
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('checkins')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'checkins'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Lịch sử Check-in
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-blue-600 text-blue-600'
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
                    onSelect={() => navigate(`/places/${ci.placeId}`)}
                    onNavigate={() => window.open(`/places/${ci.placeId}`, '_blank')}
                    onCheckIn={() => removeCheckIn(ci.id)}
                    isCheckedIn={true}
                    showActions={true}
                  />
                ))
              ) : (
                <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Bạn chưa check-in địa điểm nào.</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-4 text-blue-600 font-bold hover:underline"
                  >
                    Khám phá ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {isLoadingReviews ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div 
                        className="cursor-pointer"
                        onClick={() => navigate(`/places/${review.placeId}`)}
                      >
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1 transition-colors">
                          {review.place?.placeName || 'Địa điểm'}
                          <ChevronRight className="w-4 h-4" />
                        </h3>
                        <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                      </div>
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
                <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
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
