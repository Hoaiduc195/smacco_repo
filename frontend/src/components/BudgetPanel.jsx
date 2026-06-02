import React from 'react';
import { PiggyBank } from 'lucide-react';

export default function BudgetPanel({
  budgetData,
  basePlaceName = 'Moc House Homestay',
}) {
  const defaultBudget = {
    accommodation: {
      label: 'Chi phí lưu trú (3 ngày 2 đêm)',
      cost: 1600000,
      detail: 'Moc House Homestay - 800.000đ/đêm x 2 đêm'
    },
    transportation: {
      label: 'Phương tiện di chuyển (xe máy + xăng)',
      cost: 450000,
      detail: 'Thuê xe máy 150.000đ/ngày x 3 ngày + 100.000đ xăng xe'
    },
    food: {
      label: 'Chi phí ăn uống (3 bữa chính + ăn vặt)',
      cost: 900000,
      detail: 'Lẩu gà lá é, bánh ướt lòng gà, nướng ngói, sữa đậu nành... trung bình 300.000đ/ngày/người'
    },
    attractions: {
      label: 'Vé tham quan & Quà lưu niệm',
      cost: 500000,
      detail: 'Vé cáp treo, vé cổng ga Đà Lạt cổ, thác Datanla, mua mứt hoa quả đặc sản'
    },
    total: 3450000,
    suggestions: [
      'Gặp gỡ và chia sẻ nồi lẩu gà lá é nhóm đông người sẽ tiết kiệm chi phí hơn đi 2 người.',
      'Săn vé tham quan trực tuyến trên các app du lịch thường được giảm giá 10-15%.',
      'Đại đa số các homestay đều cung cấp bếp nấu nướng chung miễn phí, bạn có thể tự mua đồ ăn về làm tiệc nướng BBQ thay vì ăn ngoài quán đắt đỏ.'
    ]
  };

  const data = budgetData || defaultBudget;

  const formatCost = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-4 p-1 max-h-[500px] overflow-y-auto pr-2">
      {/* Total Display */}
      <div className="bg-primary-900 text-white rounded-2xl p-4 text-center border border-primary-950 shadow-soft">
        <p className="text-[10px] uppercase font-bold tracking-wide text-primary-300">Tổng chi phí dự tính</p>
        <h4 className="text-xl font-black mt-1 text-white">{formatCost(data.total)}</h4>
        <p className="text-[9px] text-primary-200/80 mt-1">Ước tính cho 1 người du lịch tự túc 3 ngày 2 đêm</p>
      </div>

      {/* Cost Breakdowns */}
      <div className="space-y-2.5">
        {[data.accommodation, data.transportation, data.food, data.attractions].map((item, idx) => (
          <div key={idx} className="p-2.5 bg-white border border-base-200 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-800">{item.label}</span>
              <span className="font-black text-primary-700">{formatCost(item.cost)}</span>
            </div>
            <p className="text-[9px] text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Saving Tips */}
      <div className="p-3 bg-teal-50/50 border border-teal-200/60 rounded-2xl space-y-2">
        <h5 className="text-[10px] font-black text-teal-800 flex items-center gap-1">
          <PiggyBank className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          Mẹo tiết kiệm chi phí từ AI
        </h5>
        <div className="text-[9px] space-y-1.5 text-slate-700 leading-normal pl-1">
          {data.suggestions.map((sug, i) => (
            <p key={i}>
              • {sug}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
