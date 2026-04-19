import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, AlertCircle, Loader, 
  Star, Globe, Phone, Clock, Share2, 
  ThumbsUp, ThumbsDown, MessageCircle, Navigation,
  Image as ImageIcon
} from 'lucide-react';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import QASection from '../components/QASection';
import { getPlaceDetails, getPlaceReviews } from '../services/placeService';

export default function PlaceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [place, setPlace] = useState(location.state?.place || null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(!place);
  const [error, setError] = useState('');
  const [vote, setVote] = useState(null); // 'up' or 'down'

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
      console.error('Error loading place details, using fallback:', err);
      // Use fallback mock data so the page still displays
      setPlace({
        id,
        name: `Địa điểm #${id.slice(0, 5)}`,
        address: 'Địa chỉ đang được cập nhật (Demo Mode)',
        type: 'restaurant',
        rating: 4.5,
        review_count: 128,
        lat: 21.0285,
        lng: 105.8542,
        categories: ['Ẩm thực', 'Gợi ý'],
        description: 'Thông tin này hiện đang được hiển thị ở chế độ Demo vì không thể kết nối với máy chủ. Bạn vẫn có thể khám phá giao diện của nền tảng Q&A bên dưới.'
      });
      setError('Không thể kết nối với máy chủ. Đang hiển thị dữ liệu mẫu.');
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
      // Fallback reviews
      setReviews([
        { id: 'r1', author: 'Người dùng mẫu', text: 'Địa điểm này rất tuyệt vời, tôi sẽ quay lại!', rating: 5, date: '19/04/2026' },
        { id: 'r2', author: 'Khách hàng 2', text: 'Dịch vụ tốt, không gian thoáng đãng.', rating: 4, date: '18/04/2026' }
      ]);
    }
  };

  const handleVote = (type) => {
    setVote(prev => prev === type ? null : type);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600 font-medium italic">Đang tải thông tin địa điểm...</p>
          </div>
        </div>
      </div>
    );
  }

  // If there's no place at all (even fallback failed), show a simple error
  if (!place) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-6">Không thể tải dữ liệu.</p>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Quay lại</button>
          </div>
        </div>
      </div>
    );
  }

  const rating = place.rating || 0;
  const ratingStars = Array.from({ length: 5 }, (_, i) => i < Math.floor(rating) ? '★' : '☆').join('');
  const placeholderImg = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200&h=400`;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
      <Navbar className="sticky top-0 z-50 shadow-md" />

      {error && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-amber-800 text-sm font-medium animate-soft-in">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          {error}
        </div>
      )}

      {/* Hero Section */}
      <div className="relative h-[300px] sm:h-[450px] w-full overflow-hidden group">
        <img 
          src={place.imageUrl || placeholderImg} 
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
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
              <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight drop-shadow-lg tracking-tight">
                {place.name}
              </h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-xl font-bold">{rating.toFixed(1)}</span>
                  <span className="text-white/60 text-sm font-medium">({place.review_count || 0} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-white/20 pl-4">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-medium line-clamp-1">{place.address}</span>
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
              <button className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white border border-white/30 hover:bg-white/30 transition-all shadow-lg">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Column - Details, QA, Reviews */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About Section */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                Thông tin chi tiết
              </h2>
              <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                {place.description || `Chào mừng bạn đến với ${place.name}! Một địa điểm tuyệt vời để trải nghiệm ${place.type || 'dịch vụ'} tại ${place.address}. Hãy cùng khám phá và chia sẻ những khoảnh khắc tuyệt vời của bạn tại đây.`}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Clock className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Giờ mở cửa</p>
                    <p className="text-slate-600 text-sm">Thứ 2 - Chủ Nhật: 08:00 - 22:00</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Phone className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Điện thoại</p>
                    <p className="text-slate-600 text-sm">{place.phoneNumber || 'Đang cập nhật'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Globe className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Website</p>
                    <p className="text-slate-600 text-sm truncate max-w-[200px]">{place.website || 'Đang cập nhật'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <ImageIcon className="w-6 h-6 text-blue-500 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Hình ảnh</p>
                    <p className="text-slate-600 text-sm">Xem thêm 24 ảnh từ cộng đồng</p>
                  </div>
                </div>
              </div>
            </section>

            {/* QA Section Placeholder */}
            <QASection placeId={id} />

            {/* Reviews Section */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Bình luận từ cộng đồng</h2>
                <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors text-sm">
                  Viết đánh giá
                </button>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-blue-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                            {review.author?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{review.author}</p>
                            <p className="text-xs text-slate-500 font-medium">{review.date}</p>
                          </div>
                        </div>
                        {review.rating && (
                          <div className="px-2 py-1 bg-white border border-slate-200 rounded-lg flex items-center gap-1 shadow-sm">
                            <span className="text-yellow-500 font-bold text-sm">★</span>
                            <span className="text-slate-700 text-sm font-bold">{review.rating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-700 leading-relaxed text-sm bg-white p-4 rounded-xl border border-slate-100 shadow-sm italic">
                        "{review.text}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">Chưa có bình luận nào cho địa điểm này.</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Map & Quick Actions */}
          <div className="space-y-8 sticky top-32">
            {/* Map Preview */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="h-64 relative bg-slate-200">
                {place.lat && place.lng && (
                  <MapComponent
                    userLocation={{ lat: place.lat, lng: place.lng }}
                    places={[place]}
                    onMarkerClick={() => {}}
                  />
                )}
                <div className="absolute bottom-4 right-4 z-[400]">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg font-bold hover:bg-blue-700 transition-all active:scale-95">
                    <Navigation className="w-4 h-4" />
                    <span>Chỉ đường</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-2">Vị trí</h3>
                <p className="text-slate-600 text-sm mb-4">{place.address}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-4 border-t border-slate-50">
                  <span>LAT: {place.lat?.toFixed(4)}</span>
                  <span>LNG: {place.lng?.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions / Tips */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                Mẹo du lịch
              </h3>
              <ul className="space-y-4 text-blue-50">
                <li className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 shrink-0" />
                  Thời điểm tốt nhất để ghé thăm là từ 4h - 6h chiều để đón hoàng hôn.
                </li>
                <li className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 shrink-0" />
                  Hãy chuẩn bị sẵn máy ảnh vì view ở đây cực kỳ lung linh.
                </li>
                <li className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full mt-1.5 shrink-0" />
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
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">AI Studio Maps</span>
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Khám phá thế giới thông minh hơn với trợ lý du lịch AI. Mọi thông tin đều được cá nhân hóa cho chuyến đi của bạn.
          </p>
          <div className="mt-8 pt-8 border-t border-white/5 text-slate-600 text-xs">
            © 2026 AI Studio Maps. Made for the Future of Travel.
          </div>
        </div>
      </footer>
    </div>
  );
}
