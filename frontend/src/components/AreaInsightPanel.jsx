import React from 'react';
import { Car, Coffee, Compass, Lightbulb, Shield, ThumbsDown, ThumbsUp, Users } from 'lucide-react';

const fallbackText = 'Mình chưa thấy đủ thông tin rõ để đánh giá chắc mục này.';

const defaultInsights = {
  title: 'Insight địa điểm',
  summary: 'Khu vực phường 3 và phường 4 là địa điểm lý tưởng cho khách du lịch ưa thích không gian tĩnh lặng, nhiều rừng thông bao quanh và có view thung lũng đẹp. Tuy nhiên, đường sá ở đây dốc và quanh co hơn so với trung tâm thành phố.',
  pros: [
    'Không gian yên tĩnh, mát mẻ, nhiều cây xanh đồi thông.',
    'Sở hữu nhiều quán cà phê view đồi thông cực chill độc bản.',
    'Không khí cực kỳ thích hợp cho du lịch nghỉ dưỡng, chữa lành.',
  ],
  cons: [
    'Đường đi khá dốc, nhỏ và thỉnh thoảng hơi tối vào ban đêm.',
    'Cách xa các tụ điểm ăn uống đêm ở khu vực trung tâm.',
  ],
  safety: 'Mức độ an ninh cao, dân cư thân thiện. Lưu ý đi xe máy cẩn thận vào những ngày trời mưa dốc trơn trượt.',
  transportation: 'Khuyên dùng xe máy nếu tay lái vững. Nếu có trẻ em hoặc người lớn tuổi, đi taxi hoặc thuê ô tô riêng sẽ an toàn và thuận tiện hơn.',
  food: 'Nổi bật với các món nướng ngói, gà nướng cơm lam và quán cà phê nông trại yên bình.',
  attractions: 'Thác Datanla, Hồ Tuyền Lâm, Thiền Viện Trúc Lâm, Dinh 3 Bảo Đại.',
  suitableFor: 'Cặp đôi nghỉ dưỡng, gia đình nhỏ, khách du lịch một mình tìm khoảng lặng.',
};

function toText(value, fallback = fallbackText) {
  return String(value || '').trim() || fallback;
}

function toList(value, fallback = []) {
  const list = Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];

  return list.length ? list : fallback;
}

export default function AreaInsightPanel({
  location = 'Khu vực',
  insights,
}) {
  const data = insights || defaultInsights;
  const pros = toList(data.pros, ['Mình chưa thấy đủ điểm mạnh rõ để kết luận chắc.']);
  const cons = toList(data.cons, ['Mình chưa thấy điểm cần cân nhắc rõ, nhưng vẫn nên kiểm tra giá và review mới nhất.']);
  const notes = toList(data.dataNotes);
  const headerSubtitle = toText(data.title, location);
  const detailItems = [
    {
      key: 'safety',
      label: 'An ninh & An toàn',
      value: toText(data.safety),
      Icon: Shield,
      iconClass: 'bg-primary-50 text-primary-700',
    },
    {
      key: 'transportation',
      label: 'Giao thông di chuyển',
      value: toText(data.transportation),
      Icon: Car,
      iconClass: 'bg-indigo-50 text-indigo-700',
    },
    {
      key: 'food',
      label: 'Ẩm thực lân cận',
      value: toText(data.food),
      Icon: Coffee,
      iconClass: 'bg-amber-50 text-amber-700',
    },
    {
      key: 'attractions',
      label: 'Địa điểm du lịch nổi bật xung quanh',
      value: toText(data.attractions),
      Icon: Compass,
      iconClass: 'bg-sky-50 text-sky-700',
    },
    {
      key: 'suitableFor',
      label: 'Khuyên dùng cho đối tượng du khách',
      value: toText(data.suitableFor, 'Mình chưa đủ cơ sở để khuyến nghị nhóm du khách phù hợp nhất.'),
      Icon: Users,
      iconClass: 'bg-teal-50 text-teal-700',
      strong: true,
    },
  ];

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-base-200 bg-white text-ink-900 shadow-soft">
      <div className="border-b border-base-200 bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-primary-600 p-1.5 text-white shadow-soft">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-ink-900">Đánh giá chi tiết</h3>
            <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-slate-500">
              {headerSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="rounded-2xl border border-primary-100 bg-primary-50/70 px-3 py-2.5 text-xs font-semibold leading-5 text-slate-700">
          {toText(data.summary, 'Mình chưa đủ cơ sở để tóm tắt chắc về địa điểm này.')}
        </div>

        <div className="grid gap-3">
          <section className="rounded-2xl border border-emerald-100 bg-emerald-50/45 p-3">
            <h5 className="flex items-center gap-1.5 text-[11px] font-black text-emerald-800">
              <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
              Điểm mạnh
            </h5>
            <ul className="mt-2 space-y-1.5">
              {pros.slice(0, 4).map((pro, index) => (
                <li key={index} className="text-[11px] font-semibold leading-5 text-emerald-900">
                  {pro}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-rose-100 bg-rose-50/45 p-3">
            <h5 className="flex items-center gap-1.5 text-[11px] font-black text-rose-800">
              <ThumbsDown className="h-3.5 w-3.5 text-rose-500" />
              Cần cân nhắc
            </h5>
            <ul className="mt-2 space-y-1.5">
              {cons.slice(0, 4).map((con, index) => (
                <li key={index} className="text-[11px] font-semibold leading-5 text-rose-900">
                  {con}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-2 border-t border-base-200 pt-3">
          {detailItems.map(({ key, label, value, Icon, iconClass, strong }) => (
            <div key={key} className="flex items-start gap-3 rounded-2xl border border-base-200 bg-base-50/65 p-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <span className="block text-[11px] font-black text-ink-900">{label}</span>
                <span className={`mt-0.5 block text-[11px] leading-5 ${strong ? 'font-bold text-teal-800' : 'font-semibold text-slate-600'}`}>
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {notes.length ? (
        <div className="space-y-1 border-t border-base-200 bg-base-50/80 px-4 py-3 text-[10px] font-semibold leading-4 text-slate-500">
          {notes.slice(0, 3).map((note, index) => (
            <div key={index}>Lưu ý: {note}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
