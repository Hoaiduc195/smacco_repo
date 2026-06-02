import React from 'react';
import { Calendar, Coffee, MapPin, MessageSquare, Star, Utensils } from 'lucide-react';

export default function FoodRecommendationPanel({
  foods = [],
  onSelectFood,
  onAddToItinerary,
  onAskAI,
}) {
  const defaultFoods = [
    {
      id: 'f1',
      name: 'Lẩu gà lá é Tao Ngộ - 3/4',
      cuisineType: 'Món ăn đặc sản',
      distance: '1.2 km từ homestay',
      priceRange: '100.000đ - 250.000đ',
      rating: 4.5,
      whyRecommended: 'Lẩu gà lá é nổi tiếng nhất Đà Lạt. Nước dùng thanh ngọt, nhiều gà ta dai ngọt thơm, lá é thơm nồng cực kỳ hợp với khí trời se lạnh.'
    },
    {
      id: 'f2',
      name: 'Bánh ướt lòng gà Long - Tăng Bạt Hổ',
      cuisineType: 'Món ăn sáng / ăn nhẹ',
      distance: '0.8 km từ homestay',
      priceRange: '35.000đ - 55.000đ',
      rating: 4.3,
      whyRecommended: 'Bánh ướt dẻo mịn kết hợp cùng lòng heo giòn sần sật, thịt gà xé phay bóp gỏi chua ngọt rắc hành phi thơm nức mũi.'
    },
    {
      id: 'f3',
      name: 'Quán Nướng Ngói Cu Đức',
      cuisineType: 'Nướng ngói đặc sản',
      distance: '2.1 km từ homestay',
      priceRange: '150.000đ - 300.000đ',
      rating: 4.4,
      whyRecommended: 'Thịt bò, lòng heo nướng trực tiếp trên ngói đất sét giúp chín đều thơm ngon mà không lo bị cháy tỏi hoặc bám muội than.'
    },
    {
      id: 'f4',
      name: 'Tiệm Cà Phê Túi Mơ To',
      cuisineType: 'Café & View đồi',
      distance: '4.5 km từ homestay',
      priceRange: '45.000đ - 80.000đ',
      rating: 4.6,
      whyRecommended: 'Quán cà phê có view thung lũng lồng kính ngắm hoàng hôn đỉnh nhất Đà Lạt, trồng vườn hoa cúc họa mi cực xinh để check-in.'
    }
  ];

  const data = foods.length > 0 ? foods : defaultFoods;

  return (
    <div className="space-y-3 p-1 max-h-[500px] overflow-y-auto pr-2">
      {data.map((food, index) => (
        <div
          key={food.id || index}
          onClick={() => onSelectFood?.(food)}
          className="p-3 bg-white border border-base-200 hover:border-primary-300 rounded-2xl cursor-pointer text-left transition space-y-2"
        >
          <div className="flex justify-between items-start gap-1">
            <div>
              <h4 className="text-xs font-black text-ink-900 leading-tight flex items-center gap-1">
                {food.cuisineType.includes('Café') ? (
                  <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ) : (
                  <Utensils className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                )}
                {food.name}
              </h4>
              <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {food.distance}
              </p>
            </div>
            
            {food.rating && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100 flex items-center gap-0.5 shrink-0">
                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                {food.rating}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Mức giá trung bình:</span>
            <span className="font-bold text-primary-700">{food.priceRange}</span>
          </div>

          {/* AI Comment */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/50 text-[10px] text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">AI review: </span>
            {food.whyRecommended}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToItinerary?.(food);
              }}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/40 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition"
            >
              <Calendar className="w-3 h-3 text-emerald-600" />
              Thêm vào lịch trình
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAskAI?.(food);
              }}
              className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[9px] font-bold flex items-center gap-1.5 transition"
            >
              <MessageSquare className="w-3 h-3 text-slate-500" />
              Hỏi AI
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
