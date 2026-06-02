import React from 'react';
import { Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';

export default function ComparisonPanel({
  places = [],
  onRemoveFromComparison,
  onSelectPlace,
}) {
  if (!places || places.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-400">
        Chưa có địa điểm nào được chọn để so sánh. Hãy ghim/chọn các chỗ ở và nhấn "So sánh".
      </div>
    );
  }

  // Define some mock features for compared places if they are not defined in the real database
  const getMockedComparisonData = (place, index) => {
    const defaultData = [
      {
        distance: '1.2 km đến trung tâm',
        quietness: 'Rất cao (9/10)',
        amenities: ['Wifi tốc độ cao', 'Bếp chung', 'Ban công ngắm view', 'Bãi đỗ xe', 'Coffee bar'],
        bestFor: 'Cặp đôi thích lãng mạn, yên tĩnh',
        pros: 'Không gian tách biệt, yên tĩnh tuyệt đối, view đồi thông cực đẹp.',
        cons: 'Đường vào hơi dốc và nhỏ, xa chợ Đà Lạt.',
        recommendation: 'Chọn nơi này nếu bạn muốn tận hưởng không khí nghỉ dưỡng bình yên.'
      },
      {
        distance: '2.5 km đến trung tâm',
        quietness: 'Cao (8/10)',
        amenities: ['Wifi', 'Nướng BBQ', 'Sân vườn rộng', 'Chỗ thuê xe máy', 'Máy giặt'],
        bestFor: 'Nhóm bạn trẻ, gia đình nhỏ',
        pros: 'Sân vườn nướng BBQ rộng rãi, anh chị chủ homestay siêu nhiệt tình.',
        cons: 'Nước nóng thỉnh thoảng yếu khi nhiều người dùng cùng lúc.',
        recommendation: 'Chọn nơi này nếu bạn đi theo nhóm và thích giao lưu nướng BBQ.'
      },
      {
        distance: '0.8 km đến trung tâm',
        quietness: 'Trung bình (6/10)',
        amenities: ['Wifi', 'Smart TV', 'Bàn làm việc', 'Nước suối miễn phí', 'Lễ tân 24/7'],
        bestFor: 'Khách công tác, đi lại nhiều',
        pros: 'Vị trí siêu trung tâm, đi bộ ra hồ Xuân Hương chỉ 5 phút.',
        cons: 'Hơi ồn ào vào ban đêm do gần mặt phố.',
        recommendation: 'Chọn nơi này nếu bạn đặt tiêu chí di chuyển thuận tiện lên hàng đầu.'
      }
    ];
    return {
      distance: place.distance || defaultData[index % 3].distance,
      quietness: place.quietness || defaultData[index % 3].quietness,
      amenities: place.amenities || defaultData[index % 3].amenities,
      bestFor: place.bestFor || defaultData[index % 3].bestFor,
      pros: place.pros || defaultData[index % 3].pros,
      cons: place.cons || defaultData[index % 3].cons,
      recommendation: place.recommendation || defaultData[index % 3].recommendation,
    };
  };

  return (
    <div className="space-y-4 p-1 max-h-[500px] overflow-y-auto pr-2">
      {/* Side by side cards */}
      <div className="grid grid-cols-2 gap-2">
        {places.slice(0, 2).map((place, idx) => {
          const detail = getMockedComparisonData(place, idx);
          return (
            <div
              key={place.id || idx}
              onClick={() => onSelectPlace?.(place)}
              className="p-2.5 rounded-xl border border-base-200 bg-white hover:border-primary-300 cursor-pointer text-left transition relative"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromComparison?.(place.id);
                }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]"
                title="Bỏ so sánh"
              >
                ✕
              </button>
              <h4 className="text-[11px] font-black text-ink-900 truncate leading-tight pr-4">{place.name}</h4>
              <p className="text-[10px] text-primary-700 font-bold mt-1">{place.price || '800.000đ/đêm'}</p>
              
              <div className="mt-2 space-y-2 text-[10px] text-slate-700">
                <div>
                  <span className="font-bold block text-slate-500">Vị trí & Khoảng cách</span>
                  <span>{detail.distance}</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">Độ yên tĩnh</span>
                  <span className="text-emerald-700 font-medium">{detail.quietness}</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">Phù hợp nhất</span>
                  <span>{detail.bestFor}</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">Tiện nghi chính</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {detail.amenities.slice(0, 3).map((am, aIdx) => (
                      <span key={aIdx} className="bg-slate-50 border border-slate-200 text-[9px] px-1 rounded text-slate-600">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Pros and Cons */}
                <div className="pt-1.5 border-t border-slate-100 space-y-1">
                  <span className="font-bold block text-slate-500">Ưu & Nhược điểm</span>
                  <div className="flex gap-1 items-start text-emerald-800">
                    <ThumbsUp className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="leading-tight text-[9px]">{detail.pros}</span>
                  </div>
                  <div className="flex gap-1 items-start text-rose-800">
                    <ThumbsDown className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                    <span className="leading-tight text-[9px]">{detail.cons}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Recommendation Summary */}
      {places.length >= 2 && (
        <div className="p-3 bg-primary-50/50 border border-primary-200/80 rounded-2xl space-y-2">
          <h5 className="text-[10px] font-black text-primary-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary-600" />
            Đánh giá gợi ý của AI
          </h5>
          <div className="text-[10px] space-y-1.5 text-slate-700 leading-normal pl-1">
            <p>
              • <strong className="text-primary-900">Ưu tiên thư giãn:</strong> {getMockedComparisonData(places[0], 0).recommendation}
            </p>
            <p>
              • <strong className="text-primary-900">Ưu tiên trải nghiệm:</strong> {getMockedComparisonData(places[1], 1).recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
