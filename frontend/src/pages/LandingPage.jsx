import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Lock,
  Mail,
  Map,
  MapPin,
  MessageSquareText,
  Navigation,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navLinks = [
  { label: 'Tính năng', href: '#features' },
  { label: 'Quy trình', href: '#workflow' },
  { label: 'Trải nghiệm', href: '#demo' },
  { label: 'Hỏi đáp', href: '#faq' },
];

const proofItems = ['Khách sạn tiện nghi', 'Boutique Homestay', 'Căn hộ dịch vụ', 'Khu nghỉ dưỡng gia đình', 'Lưu trú dài ngày'];

const benefits = [
  {
    icon: Bot,
    title: 'Tìm kiếm bằng AI hiểu ý bạn',
    text: 'Không còn gò bó trong các bộ lọc cứng nhắc. Bạn chỉ cần mô tả ý tưởng chuyến đi, trợ lý AI sẽ tự động phân tích ngân sách, phong cách ở, tiện ích và các yếu tố đánh đổi để đưa ra gợi ý phù hợp.',
  },
  {
    icon: Map,
    title: 'So sánh trực quan trên bản đồ',
    text: 'Xem ngay thứ tự ưu tiên của các điểm lưu trú, vị trí xung quanh, thời gian di chuyển và lộ trình thực tế trên cùng một không gian làm việc tập trung.',
  },
  {
    icon: MessageSquareText,
    title: 'Hỏi đáp sâu về từng địa điểm',
    text: 'Giải đáp nhanh các thắc mắc thực tế như: mức độ ồn, chất lượng bàn làm việc, mức độ phù hợp với trẻ nhỏ, hàng quán xung quanh hay phản hồi gần nhất từ khách lưu trú.',
  },
  {
    icon: Users,
    title: 'Thông tin thực chứng từ cộng đồng',
    text: 'Kết hợp đánh giá thực tế, hỏi đáp trực tiếp và lịch sử check-in để giúp bạn đưa ra quyết định đặt phòng chính xác, đúng với kỳ vọng thực tế.',
  },
];

const workflow = [
  ['Lên kế hoạch', 'Mô tả nhu cầu lưu trú, ngân sách và các yêu cầu đặc biệt bằng ngôn ngữ tự nhiên.'],
  ['Khảo sát', 'So sánh các địa điểm tiềm năng trực tiếp trên bản đồ và để trợ lý AI tối ưu hóa bộ lọc.'],
  ['Lựa chọn', 'Lưu lại các lựa chọn ưng ý, xem xét kỹ lưỡng và quản lý danh sách ngay tại trang cá nhân.'],
  ['Tích lũy', 'Sử dụng tính năng check-in và đóng góp câu hỏi để tối ưu hóa gợi ý cho các hành trình tiếp theo.'],
];

const testimonials = [
  ['Thùy Linh', 'Làm việc từ xa', 'Smacco giúp tôi thu hẹp danh sách tìm kiếm rườm rà xuống còn 3 chỗ ở thực sự đáp ứng đúng nhu cầu về góc làm việc và ngân sách.'],
  ['Minh Phạm', 'Du lịch gia đình', 'Bản đồ trực quan cùng tính năng hỏi đáp chi tiết giúp gia đình tôi dễ dàng chọn được một căn homestay yên tĩnh, an toàn cho trẻ nhỏ.'],
  ['An Nguyễn', 'Chủ homestay boutique', 'Trang thông tin chi tiết của Smacco giúp hiển thị rõ ràng những câu hỏi thực tế mà khách lưu trú thường quan tâm trước khi quyết định đặt phòng.'],
];

const faqs = [
  ['Smacco chỉ dành cho khách sạn thôi sao?', 'Không. Smacco hỗ trợ đa dạng loại hình lưu trú bao gồm khách sạn, homestay, căn hộ, biệt thự, resort, nhà khách và nhiều loại hình khác.'],
  ['Trợ lý AI có hỗ trợ đặt phòng trực tiếp không?', 'Hiện tại, sản phẩm tập trung vào tính năng tìm kiếm thông minh, so sánh trực quan, phân tích dữ liệu địa điểm để hỗ trợ bạn đưa ra quyết định đặt phòng tối ưu nhất.'],
  ['Dữ liệu nào được dùng để cải thiện đề xuất lưu trú?', 'Bộ lọc tìm kiếm, lịch sử lưu địa điểm, câu hỏi đáp Q&A, lượt check-in thực tế và các phản hồi về tiện ích sẽ được phân tích để xếp hạng điểm đến phù hợp nhất với bạn.'],
  ['Tôi có thể sử dụng Smacco trên điện thoại không?', 'Có. Trang giới thiệu và không gian làm việc bản đồ được thiết kế đáp ứng tốt trên mọi kích thước màn hình di động.'],
];

const mockPlaces = [
  ['Moss Courtyard Stay', 'Ngõ yên tĩnh, có bếp nhỏ, Wi-Fi tốc độ cao', '4.9', '1.050.000đ'],
  ['Harborline Hotel', 'Vị trí trung tâm, nhận phòng muộn, view thành phố', '4.8', '1.700.000đ'],
  ['Palm House Villa', 'Phòng gia đình rộng rãi, bể bơi, ăn sáng bản địa', '4.7', '2.350.000đ'],
];

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [prompt, setPrompt] = useState('Tìm homestay yên tĩnh ở Đà Lạt, có bàn làm việc, bếp nhỏ và đường rộng dễ đón xe, ngân sách dưới 1.200.000đ/đêm');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser, login, loginWithGoogle, logout } = useAuth();

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
      console.error('Landing email login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await loginWithGoogle();
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      console.error('Landing Google login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-ink-900 bg-ink-900/90 shadow-soft backdrop-blur-2xl">
        <div className="section-shell flex h-20 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 hover-lift-sm" aria-label="Smacco home">
            <img src="/favicon.svg" alt="Smacco Logo" className="h-8 w-8 object-contain transition-transform hover:scale-105" />
            <span>
              <span className="block text-lg font-black leading-5 text-white">Smacco</span>
              <span className="hidden text-xs font-bold uppercase tracking-wide text-white/70 sm:block">Tìm kiếm chỗ ở bằng AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-ink-800 bg-ink-950/70 p-1 shadow-soft backdrop-blur xl:flex" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-bold text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink-800 hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex btn-secondary hover-lift-sm px-4 py-2.5">
              Đăng nhập
            </Link>
            {currentUser ? (
              <Link to="/app" className="btn-primary hover-lift-sm shrink-0 px-3 py-2.5 sm:px-4">
                <span className="sm:hidden">Mở</span>
                <span className="hidden sm:inline">Truy cập ứng dụng</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <a href="#signin" className="btn-primary hover-lift-sm shrink-0 px-3 py-2.5 sm:px-4">
                <span className="sm:hidden">Bắt đầu</span>
                <span className="hidden sm:inline">Bắt đầu tìm kiếm</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative border-b border-base-200/70">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_18%,rgba(47,183,156,0.22),transparent_28rem),radial-gradient(circle_at_85%_12%,rgba(249,115,22,0.18),transparent_26rem)]" />
          <div className="section-shell grid min-h-[calc(100vh-5rem)] items-center gap-12 py-12 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="max-w-3xl">
              <div className="badge-soft mb-5">
                <Sparkles className="h-3.5 w-3.5" />
                Trợ lý AI hỗ trợ quyết định lưu trú tối ưu
              </div>
              <h1 className="heading-xl">
                Chọn nơi ở vừa vặn với trải nghiệm, không chỉ khớp thời gian trống.
              </h1>
              <p className="body-muted mt-6 max-w-2xl text-base sm:text-lg">
                Smacco tích hợp tìm kiếm hội thoại bằng AI, bản đồ so sánh trực quan, hỏi đáp thực chứng và phản hồi cộng đồng — giúp bạn tìm ra lựa chọn tối ưu mà không cần mở hàng chục tab trình duyệt.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#signin" className="btn-primary hover-lift-sm min-h-[3.25rem]">
                  Lên kế hoạch ngay
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#demo" className="btn-secondary hover-lift-sm min-h-[3.25rem]">
                  Trải nghiệm thử
                  <Search className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ['Thực chứng', 'Đánh giá, Hỏi & Đáp, Check-in'],
                  ['Không gian', 'Trợ lý AI, Bản đồ, Địa điểm lưu'],
                  ['Độ tương thích', 'Tối ưu hóa theo nhu cầu thực'],
                ].map(([label, value]) => (
                  <div key={label} className="surface-panel hover-lift-sm p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-primary-700">{label}</p>
                    <p className="mt-2 text-sm font-bold text-ink-700">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="surface-card hover-lift overflow-hidden p-3">
                <div className="rounded-[1.35rem] border border-base-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-200 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                        <Map className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-ink-900">Không gian tìm kiếm thông minh</p>
                        <p className="text-xs font-semibold text-ink-500">Đà Lạt · yên tĩnh · làm việc từ xa</p>
                      </div>
                    </div>
                    <span className="badge-warm normal-case tracking-normal">AI xếp hạng</span>
                  </div>

                  <div className="grid min-h-[31rem] bg-base-50 lg:grid-cols-[1fr_20rem]">
                    <div className="group relative overflow-hidden bg-[linear-gradient(135deg,#d6f4ec_0%,#fbf8f3_48%,#ffedd5_100%)]">
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(34,28,23,0.06)_1px,transparent_1px),linear-gradient(rgba(34,28,23,0.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
                      <div className="absolute left-10 top-12 h-28 w-44 rounded-[42%] bg-white/70 shadow-soft transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:rotate-1 group-hover:shadow-card" />
                      <div className="absolute bottom-10 right-8 h-36 w-52 rounded-[45%] bg-primary-100/70 shadow-soft transition-all duration-300 group-hover:-translate-y-2 group-hover:translate-x-1 group-hover:shadow-card" />
                      <div className="absolute left-[12%] top-[42%] h-3 w-[70%] rotate-[-15deg] rounded-full bg-white/95 shadow-soft transition-all duration-300 group-hover:translate-x-1 group-hover:scale-x-105" />
                      <div className="absolute bottom-[22%] left-[18%] h-3 w-[66%] rotate-[9deg] rounded-full bg-white/95 shadow-soft transition-all duration-300 group-hover:-translate-x-1 group-hover:scale-x-105" />
                      {[
                        ['left-[25%] top-[35%]', 'Homestay', Home],
                        ['left-[60%] top-[29%]', 'Khách sạn', KeyRound],
                        ['left-[70%] top-[68%]', 'Villa', Wifi],
                      ].map(([position, label, Icon], index) => (
                        <div key={label} className={`absolute ${position} -translate-x-1/2 -translate-y-1/2`}>
                          <span className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-card ring-4 ring-white/80 transition-all duration-300 hover:-translate-y-1 hover:scale-110 ${index === 1 ? 'bg-accent-500' : 'bg-primary-600'}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="absolute left-1/2 top-14 -translate-x-1/2 whitespace-nowrap rounded-full border border-base-200 bg-white px-3 py-1 text-xs font-black text-ink-700 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-base-200 bg-white/90 p-4 lg:border-l lg:border-t-0">
                      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-base-200 bg-base-50 px-3 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-primary-50">
                        <Search className="h-4 w-4 text-primary-700" />
                        <span className="text-sm font-bold text-ink-700">chỗ ở yên tĩnh có bếp nhỏ</span>
                      </div>
                      <div className="space-y-3">
                        {mockPlaces.map(([name, detail, rating, price]) => (
                          <div key={name} className="hover-lift-sm rounded-2xl border border-base-200 bg-white p-3 shadow-soft">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-ink-900">{name}</p>
                                <p className="mt-1 text-xs font-semibold leading-5 text-ink-500">{detail}</p>
                              </div>
                              <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-black text-primary-700">{price}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs font-bold text-ink-500">
                              <span className="inline-flex items-center gap-1 text-accent-600">
                                <Star className="h-3.5 w-3.5 fill-accent-500" />
                                {rating}
                              </span>
                              <span>Độ phù hợp 92%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-pad border-b border-base-200/70 bg-white/45">
          <div className="section-shell">
            <p className="text-center text-sm font-black uppercase tracking-wide text-ink-500">Hỗ trợ tìm kiếm đa dạng loại hình lưu trú</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {proofItems.map((item) => (
                <span key={item} className="hover-lift-sm rounded-full border border-base-200 bg-white/75 px-4 py-2 text-sm font-black text-ink-700 shadow-soft">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="section-pad">
          <div className="section-shell">
            <div className="max-w-2xl">
              <p className="badge-soft">Lợi ích sản phẩm</p>
              <h2 className="heading-lg mt-4">Lựa chọn nơi lưu trú thông minh, trực quan và thảnh thơi hơn.</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <article key={benefit.title} className="surface-card-solid hover-lift hover-glow p-5">
                    <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-black text-ink-900">{benefit.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-ink-500">{benefit.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section-pad border-y border-base-200/70 bg-white/50">
          <div className="section-shell space-y-16">
            {[
              ['Bộ lọc tối ưu', 'Kết hợp linh hoạt giữa bộ lọc truyền thống và ngữ cảnh ngôn ngữ tự nhiên từ câu lệnh của bạn.', SlidersHorizontal],
              ['Chi tiết minh bạch', 'Xem đầy đủ đánh giá, tiện ích, trạng thái thực tế, Hỏi & Đáp và vị trí bản đồ trên một trang duy nhất.', CalendarCheck],
            ].map(([title, text, Icon], index) => (
              <div key={title} className={`grid items-center gap-8 lg:grid-cols-2 ${index % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                <div>
                  <p className="badge-warm">Không gian trải nghiệm</p>
                  <h2 className="heading-lg mt-4">{title}</h2>
                  <p className="body-muted mt-4">{text}</p>
                </div>
                <div className="surface-card hover-lift p-5">
                  <div className="rounded-2xl border border-base-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-black text-ink-900">{title}</p>
                        <p className="text-sm font-semibold text-ink-500">Tích hợp đầy đủ thông tin, tiện ích và thao tác nhanh</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {['Không gian yên tĩnh', 'Wi-Fi tốc độ cao', 'Nhận phòng linh hoạt'].map((item) => (
                        <div key={item} className="flex items-center justify-between rounded-2xl bg-base-50 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-50 hover:shadow-soft">
                          <span className="text-sm font-bold text-ink-700">{item}</span>
                          <CheckCircle2 className="h-4 w-4 text-primary-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="section-pad">
          <div className="section-shell">
            <div className="max-w-2xl">
              <p className="badge-soft">Quy trình</p>
              <h2 className="heading-lg mt-4">Đồng hành cùng bạn trước, trong, sau và giữa các quyết định lưu trú.</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {workflow.map(([step, text], index) => (
                <article key={step} className="surface-card-solid hover-lift-sm p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-sm font-black text-white">{index + 1}</span>
                  <h3 className="mt-5 text-xl font-black text-ink-900">{step}</h3>
                  <p className="mt-3 text-sm leading-7 text-ink-500">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="section-pad border-y border-base-200/70 bg-primary-50/45">
          <div className="section-shell grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="badge-soft">Trải nghiệm Câu lệnh (Prompt)</p>
              <h2 className="heading-lg mt-4">Bắt đầu bằng cách giao tiếp tự nhiên của riêng bạn.</h2>
              <p className="body-muted mt-4">Hệ thống tự động chuyển hóa ý định tìm kiếm thành các bộ lọc thực tế, xếp hạng mức độ phù hợp và gợi ý các câu hỏi chuyên sâu trên bản đồ.</p>
            </div>
            <div className="surface-card hover-lift p-5">
              <label htmlFor="demo-prompt" className="text-sm font-black text-ink-700">Câu lệnh mô tả chỗ ở mong muốn</label>
              <textarea
                id="demo-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                className="mt-3 min-h-32 w-full rounded-2xl border border-base-200 bg-white/90 p-4 text-sm font-semibold leading-7 text-ink-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="btn-primary hover-lift-sm">
                  Tạo danh sách gợi ý
                  <Sparkles className="h-4 w-4" />
                </button>
                <button type="button" className="btn-secondary hover-lift-sm">
                  Định vị trên bản đồ
                  <MapPin className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="security" className="section-pad">
          <div className="section-shell grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="badge-soft">Bảo mật & Tin cậy</p>
              <h2 className="heading-lg mt-4">Bảo mật tài khoản cá nhân và minh bạch hóa thông tin thực chứng.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [ShieldCheck, 'Xác thực tài khoản qua Firebase giúp bảo vệ dữ liệu cá nhân.'],
                [Lock, 'Danh sách địa điểm đã lưu và thông tin cá nhân được mã hóa an toàn.'],
                [Users, 'Đánh giá chân thực từ cộng đồng giúp kiểm chứng thông tin thực tế.'],
                [Navigation, 'Tính năng định vị chỉ kích hoạt khi được bạn cấp quyền truy cập.'],
              ].map(([Icon, text]) => (
                <div key={text} className="surface-card-solid hover-lift-sm flex gap-3 p-5">
                  <Icon className="mt-1 h-5 w-5 text-primary-700" />
                  <p className="text-sm font-bold leading-7 text-ink-700">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-pad border-y border-base-200/70 bg-white/50">
          <div className="section-shell">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="badge-warm">Đánh giá từ khách hàng</p>
                <h2 className="heading-lg mt-4">Đồng hành cùng du khách loại bỏ những băn khoăn trước mỗi chuyến đi.</h2>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-black text-accent-600">
                <Star className="h-4 w-4 fill-accent-500" />
                Đánh giá trung bình 4.8 sao
              </div>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {testimonials.map(([name, role, quote]) => (
                <article key={name} className="surface-card-solid hover-lift p-6">
                  <p className="text-sm leading-7 text-ink-700">"{quote}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-black text-primary-700">{name[0]}</span>
                    <div>
                      <p className="text-sm font-black text-ink-900">{name}</p>
                      <p className="text-xs font-semibold text-ink-500">{role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="section-pad border-y border-base-200/70 bg-white/50">
          <div className="section-shell grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="badge-soft">FAQ</p>
              <h2 className="heading-lg mt-4">Câu hỏi thường gặp.</h2>
            </div>
            <div className="space-y-3">
              {faqs.map(([question, answer]) => (
                <details key={question} className="surface-card-solid group hover-lift-sm p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-ink-900">
                    {question}
                    <ChevronDown className="h-4 w-4 transition duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-ink-500">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="signin" className="section-pad">
          <div className="section-shell grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="badge-warm">Khởi hành ngay</p>
              <h2 className="heading-lg mt-4">Bắt đầu hành trình tìm kiếm chỗ ở lý tưởng cùng Smacco.</h2>
              <p className="body-muted mt-4">Đăng nhập để sử dụng không gian bản đồ tương tác, lưu trữ địa điểm yêu thích và đồng bộ hóa lịch trình.</p>
            </div>
            <div className="surface-card p-6 sm:p-8">
              {currentUser ? (
                <div className="flex min-h-[18rem] flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt={currentUser.displayName || 'Khách du lịch'}
                          className="h-16 w-16 rounded-full object-cover ring-4 ring-primary-100 shadow-soft"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-2xl font-black text-white shadow-soft">
                          {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                        </span>
                      )}
                      <div>
                        <span className="badge-warm inline-flex items-center gap-1 mb-1 text-xs py-0.5">
                          <Sparkles className="h-3 w-3" /> Thành viên Smacco
                        </span>
                        <h3 className="text-xl font-black text-ink-900 leading-tight">
                          {currentUser.displayName || 'Khách du lịch'}
                        </h3>
                        <p className="text-sm font-semibold text-ink-500">{currentUser.email}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-base-200 bg-base-50/50 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:bg-base-50 hover:shadow-soft">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <p className="mt-2 text-xs font-bold text-ink-500">Bản đồ tương tác</p>
                        <p className="text-sm font-black text-ink-900 mt-0.5">Sẵn sàng</p>
                      </div>
                    <div className="rounded-2xl border border-base-200 bg-base-50/50 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-accent-200 hover:bg-base-50 hover:shadow-soft">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-50 text-accent-700">
                          <Bot className="h-4 w-4" />
                        </span>
                        <p className="mt-2 text-xs font-bold text-ink-500">Trợ lý tìm kiếm</p>
                        <p className="text-sm font-black text-ink-900 mt-0.5">Trực tuyến</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link to="/app" className="btn-primary hover-lift-sm flex-grow min-h-[3rem]">
                      Truy cập ứng dụng Smacco
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await logout();
                        } catch (err) {
                          console.error('Logout error:', err);
                        }
                      }}
                      className="btn-secondary hover-lift-sm px-5 min-h-[3rem]"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-black text-ink-900">Đăng nhập</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-500">Đăng nhập để vào không gian tìm kiếm địa điểm.</p>

                  {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}

                  <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="landing-email" className="mb-2 block text-sm font-black text-ink-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500/55" />
                        <input id="landing-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isLoading} placeholder="you@example.com" className="input-field pl-12" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="landing-password" className="mb-2 block text-sm font-black text-ink-700">Mật khẩu</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500/55" />
                        <input id="landing-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isLoading} placeholder="••••••••" className="input-field pl-12 pr-12" />
                        <button type="button" onClick={() => setShowPassword((value) => !value)} disabled={isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-ink-500 transition-all duration-200 hover:-translate-y-1/2 hover:bg-base-100 hover:text-ink-900" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}>
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary w-full">
                      {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập & Tìm kiếm'}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>

                  <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-base-200" />
                    <span className="text-xs font-black uppercase text-ink-500">Hoặc</span>
                    <div className="h-px flex-1 bg-base-200" />
                  </div>

                  <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="btn-secondary hover-lift-sm w-full">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-xs font-black text-white">G</span>
                    {isLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-base-200 bg-ink-900 py-12 text-white">
        <div className="section-shell flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <img src="/favicon.svg" alt="" className="h-7 w-7" />
            </span>
            <div>
              <p className="text-lg font-black">Smacco</p>
              <p className="text-sm text-white/60">Nền tảng tìm kiếm chỗ ở thông minh và so sánh trực quan trên bản đồ.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-bold text-white/70">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:-translate-y-0.5 hover:text-white">{link.label}</a>
            ))}
            <Link to="/login" className="transition hover:-translate-y-0.5 hover:text-white">Đăng nhập</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
