import React from 'react';
import { Car, Coffee, Compass, Shield, ThumbsDown, ThumbsUp, Users } from 'lucide-react';

export default function AreaInsightPanel({
  location = 'Đà Lạt',
  insights,
}) {
  const defaultInsights = {
    summary: 'Khu vực phường 3 và phường 4 là địa điểm lý tưởng cho khách du lịch ưa thích không gian tĩnh lặng, nhiều thông bao quanh và có view thung lũng đẹp. Tuy nhiên, đường sá ở đây dốc và quanh co hơn so với trung tâm thành phố.',
    pros: [
      'Không gian yên tĩnh, mát mẻ, nhiều cây xanh đồi thông.',
      'Sở hữu nhiều quán cà phê view đồi thông cực chill độc bản.',
      'Không khí cực kỳ thích hợp cho du lịch nghỉ dưỡng, chữa lành.'
    ],
    cons: [
      'Đường đi khá dốc, nhỏ và thỉnh thoảng hơi tối vào ban đêm.',
      'Cách xa các tụ điểm ăn uống đêm ở khu vực trung tâm.'
    ],
    safety: 'Mức độ an ninh cao, dân cư thân thiện. Lưu ý đi xe máy cẩn thận vào những ngày trời mưa dốc trơn trượt.',
    transportation: 'Khuyên dùng xe máy nếu tay lái vững. Nếu có trẻ em hoặc người lớn tuổi, đi taxi hoặc thuê ô tô riêng sẽ an toàn và thuận tiện hơn.',
    food: 'Nổi bật với các món nướng ngói, gà nướng cơm lam và quán cà phê nông trại yên bình.',
    attractions: 'Thác Datanla, Hồ Tuyền Lâm, Thiền Viện Trúc Lâm, Dinh 3 Bảo Đại.',
    suitableFor: 'Cặp đôi nghỉ dưỡng, gia đình nhỏ, khách du lịch một mình tìm khoảng lặng.'
  };

  const data = insights || defaultInsights;

  return (
    <div className="space-y-4 p-1 max-h-[500px] overflow-y-auto pr-2">
      {/* Overview Summary */}
      <div className="text-[11px] text-slate-700 leading-relaxed border-l-2 border-primary-500 pl-3">
        {data.summary}
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="space-y-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
          <h5 className="text-[10px] font-black text-emerald-800 flex items-center gap-1">
            <ThumbsUp className="w-3 h-3 text-emerald-600" />
            Ưu điểm khu vực
          </h5>
          <ul className="space-y-1 pl-1">
            {data.pros.map((pro, i) => (
              <li key={i} className="text-[9px] text-emerald-900 leading-normal">
                {pro}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 bg-rose-50/40 p-2.5 rounded-xl border border-rose-100">
          <h5 className="text-[10px] font-black text-rose-800 flex items-center gap-1">
            <ThumbsDown className="w-3 h-3 text-rose-500" />
            Nhược điểm / Lưu ý
          </h5>
          <ul className="space-y-1 pl-1">
            {data.cons.map((con, i) => (
              <li key={i} className="text-[9px] text-rose-900 leading-normal">
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Structured Insights Details */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-700">
        <div className="flex gap-2 items-start">
          <Shield className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-900">An ninh & An toàn</span>
            <span>{data.safety}</span>
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <Car className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-900">Giao thông di chuyển</span>
            <span>{data.transportation}</span>
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <Coffee className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-900">Ẩm thực lân cận</span>
            <span>{data.food}</span>
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <Compass className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-900">Địa điểm du lịch nổi tiếng xung quanh</span>
            <span>{data.attractions}</span>
          </div>
        </div>

        <div className="flex gap-2 items-start">
          <Users className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-900">Khuyên dùng cho đối tượng du khách</span>
            <span className="font-semibold text-teal-800">{data.suitableFor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
