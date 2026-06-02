import React, { useState } from 'react';
import { Clock, Coffee, MapPin, PiggyBank, Shuffle, Smile } from 'lucide-react';

export default function ItineraryPanel({
  itinerary,
  basePlace,
  onOptimizeRoute,
  onAddFood,
  onMakeCheaper,
  onMakeRelaxing,
}) {
  const [activeDay, setActiveDay] = useState(1);

  const defaultItinerary = {
    basePlaceName: basePlace?.name || 'Moc House Homestay',
    days: [
      {
        dayNum: 1,
        title: 'Nhận phòng & Khám phá trung tâm',
        activities: [
          {
            time: '08:00 - 12:00',
            activity: 'Di chuyển đến Đà Lạt, check-in sớm hoặc gửi đồ tại chỗ ở.',
            location: basePlace?.name || 'Moc House Homestay',
            notes: 'Nên thuê xe máy từ chỗ ở để tiện di chuyển (khoảng 120k-150k/ngày).'
          },
          {
            time: '12:00 - 13:30',
            activity: 'Ăn trưa lẩu gà lá é Tao Ngộ tại đường 3/4.',
            location: 'Lẩu gà lá é Tao Ngộ',
            notes: 'Cách chỗ ở 1.5 km, giá từ 200k/nồi lẩu cực nhiều gà.'
          },
          {
            time: '14:00 - 17:00',
            activity: 'Check-in quán cà phê yên tĩnh và tham quan ga Đà Lạt cổ.',
            location: 'Quán cà phê Vườn Yên / Ga Đà Lạt',
            notes: 'Cách trung tâm 2km, không gian đậm chất vintage thơ mộng.'
          },
          {
            time: '18:00 - 21:00',
            activity: 'Ăn tối bánh ướt lòng gà Tăng Bạt Hổ, dạo quanh Hồ Xuân Hương và uống sữa đậu nành nóng.',
            location: 'Chợ Đà Lạt & Hồ Xuân Hương',
            notes: 'Buổi tối trời lạnh tầm 15-17 độ, mang theo áo khoác ấm.'
          }
        ]
      },
      {
        dayNum: 2,
        title: 'Săn mây & Trải nghiệm thiên nhiên',
        activities: [
          {
            time: '04:30 - 07:30',
            activity: 'Đi săn mây tại đồi chè Cầu Đất hoặc thảm gỗ săn mây.',
            location: 'Đồi chè Cầu Đất',
            notes: 'Cách trung tâm 24km, đi sáng sớm lạnh nên mặc ấm. Có thể đi taxi hoặc xe máy.'
          },
          {
            time: '08:30 - 11:30',
            activity: 'Tham quan Chùa Linh Phước (Chùa Ve Chai) độc đáo.',
            location: 'Chùa Linh Phước',
            notes: 'Nằm trên cung đường đi Cầu Đất về lại trung tâm.'
          },
          {
            time: '12:00 - 13:30',
            activity: 'Ăn trưa cơm lam gà nướng tại khu du lịch Thung Lũng Vàng.',
            location: 'Cơm lam gà nướng Thung Lũng Vàng',
            notes: 'Gà nướng mọi vàng ươm, cơm lam dẻo thơm ăn cùng muối mè.'
          },
          {
            time: '14:30 - 17:30',
            activity: 'Ngắm hoàng hôn lãng mạn tại đồi thông bên hồ Tuyền Lâm.',
            location: 'Hồ Tuyền Lâm / Đồi thông',
            notes: 'Gần homestay chỉ khoảng 10 phút chạy xe máy.'
          }
        ]
      },
      {
        dayNum: 3,
        title: 'Chữa lành & Tạm biệt Đà Lạt',
        activities: [
          {
            time: '08:00 - 10:00',
            activity: 'Thưởng thức bữa sáng bánh mì xíu mại Hoàng Diệu, uống cà phê sáng ngắm thung lũng.',
            location: 'Bánh mì xíu mại Hoàng Diệu',
            notes: 'Nên đi sớm trước 8h30 để tránh xếp hàng lâu.'
          },
          {
            time: '10:30 - 12:00',
            activity: 'Mua sắm đặc sản Đà Lạt tại L\'angfarm hoặc chợ Đà Lạt.',
            location: 'L\'angfarm / Chợ Đà Lạt',
            notes: 'Mứt hồng treo gió, trà atiso, rau củ quả sấy khô là những món khuyên mua.'
          },
          {
            time: '12:00 - 13:00',
            activity: 'Trở về homestay, dọn hành lý và làm thủ tục check-out.',
            location: basePlace?.name || 'Moc House Homestay',
            notes: 'Check-out muộn có thể tính thêm phí tùy chính sách.'
          }
        ]
      }
    ]
  };

  const data = itinerary || defaultItinerary;

  return (
    <div className="space-y-4 p-1 max-h-[500px] overflow-y-auto pr-2">
      {/* Base Stay Reference info */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-[9px] uppercase font-black text-slate-400 leading-none">Chỗ ở nền tảng</p>
          <p className="text-[11px] font-bold text-slate-800 truncate mt-0.5">{data.basePlaceName}</p>
        </div>
      </div>

      {/* Day Selector Segmented tab */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {data.days.map((day) => (
          <button
            key={day.dayNum}
            onClick={() => setActiveDay(day.dayNum)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition ${
              activeDay === day.dayNum
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ngày {day.dayNum}
          </button>
        ))}
      </div>

      {/* Activities Timeline */}
      <div className="space-y-3 pl-1 border-l-2 border-primary-200/60 ml-2">
        {data.days
          .find((d) => d.dayNum === activeDay)
          ?.activities.map((act, index) => (
            <div key={index} className="relative pl-5 pb-1">
              {/* Timeline dot */}
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-primary-500 bg-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary-700">
                  <Clock className="w-3 h-3 text-primary-600" />
                  <span>{act.time}</span>
                </div>
                <h5 className="text-[11px] font-black text-ink-900 leading-snug">{act.activity}</h5>
                <p className="text-[9px] text-slate-500 font-semibold flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {act.location}
                </p>
                {act.notes && (
                  <p className="text-[9px] text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-200/50 leading-relaxed">
                    {act.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
        <button
          onClick={onOptimizeRoute}
          className="px-2.5 py-2 border border-primary-200 hover:bg-primary-50 text-primary-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Tối ưu hóa đường đi
        </button>
        <button
          onClick={onAddFood}
          className="px-2.5 py-2 border border-amber-200 hover:bg-amber-50 text-amber-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition"
        >
          <Coffee className="w-3.5 h-3.5" />
          Thêm quán ăn gần đó
        </button>
        <button
          onClick={onMakeCheaper}
          className="px-2.5 py-2 border border-teal-200 hover:bg-teal-50 text-teal-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition"
        >
          <PiggyBank className="w-3.5 h-3.5" />
          Lịch trình tiết kiệm hơn
        </button>
        <button
          onClick={onMakeRelaxing}
          className="px-2.5 py-2 border border-sky-200 hover:bg-sky-50 text-sky-700 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition"
        >
          <Smile className="w-3.5 h-3.5" />
          Nghỉ dưỡng & thảnh thơi
        </button>
      </div>
    </div>
  );
}
