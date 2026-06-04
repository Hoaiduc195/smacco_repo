import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronUp, Coffee, Compass, DollarSign, Heart, Layers, Map, Pin, Sparkles, X } from 'lucide-react';
import SearchResultsPanel from './SearchResultsPanel';
import ComparisonPanel from './ComparisonPanel';
import PinnedPlacesPanel from './PinnedPlacesPanel';
import ItineraryPanel from './ItineraryPanel';
import AreaInsightPanel from './AreaInsightPanel';
import BudgetPanel from './BudgetPanel';
import FoodRecommendationPanel from './FoodRecommendationPanel';

export default function AIWorkspacePanel({
  // Panel data
  searchPlaces = [],
  comparedPlaces = [],
  pinnedPlaces = [],
  itinerary = null,
  areaInsight = null,
  budget = null,
  foodRecommendations = [],
  
  // Selection/Hover states
  selectedPlaceId,
  pinnedPlaceIds = [],
  
  // Actions
  onSelectPlace,
  onPinPlace,
  onRemovePin,
  onComparePlace,
  onRemoveFromComparison,
  onAskAIAboutPlace,
  onHoverPlace,
  onOptimizeRoute,
  onAddFood,
  onMakeCheaper,
  onMakeRelaxing,
  onSelectFood,
  onAddToItinerary,
  onCreateItinerary,
  onDirections,
  
  // Panel management functions (if passed, or local state)
  activePanel,
  setActivePanel,
  onClosePanel,
  onCollapse,
}) {
  const [localActivePanel, setLocalActivePanel] = useState('search');
  const [pinnedPanels, setPinnedPanels] = useState([]);
  const [closedPanels, setClosedPanels] = useState([]);

  const currentActive = activePanel || localActivePanel;
  const handleSetActive = (id) => {
    if (setActivePanel) {
      setActivePanel(id);
    } else {
      setLocalActivePanel(id);
    }
  };

  // Auto-expand panels when their content gets populated
  useEffect(() => {
    if (comparedPlaces.length > 0 && !closedPanels.includes('comparison')) {
      handleSetActive('comparison');
    }
  }, [comparedPlaces.length]);

  useEffect(() => {
    if (itinerary && !closedPanels.includes('itinerary')) {
      handleSetActive('itinerary');
    }
  }, [itinerary]);

  useEffect(() => {
    if (areaInsight && !closedPanels.includes('insight')) {
      handleSetActive('insight');
    }
  }, [areaInsight]);

  useEffect(() => {
    if (budget && !closedPanels.includes('budget')) {
      handleSetActive('budget');
    }
  }, [budget]);

  useEffect(() => {
    if (foodRecommendations.length > 0 && !closedPanels.includes('food')) {
      handleSetActive('food');
    }
  }, [foodRecommendations.length]);

  // Determine which panels are available (have data and aren't closed)
  const availablePanels = [];

  if (comparedPlaces.length > 0 && !closedPanels.includes('comparison')) {
    availablePanels.push({
      id: 'comparison',
      title: 'So sánh địa điểm',
      subtitle: `${comparedPlaces.length} địa điểm`,
      icon: <Layers className="w-4 h-4" />,
      component: (
        <ComparisonPanel
          places={comparedPlaces}
          onRemoveFromComparison={onRemoveFromComparison}
          onSelectPlace={onSelectPlace}
        />
      )
    });
  }

  if (searchPlaces.length > 0 && !closedPanels.includes('search')) {
    availablePanels.push({
      id: 'search',
      title: 'Kết quả tìm kiếm',
      subtitle: `${searchPlaces.length} địa điểm`,
      icon: <Map className="w-4 h-4" />,
      component: (
        <SearchResultsPanel
          places={searchPlaces}
          selectedPlaceId={selectedPlaceId}
          pinnedPlaceIds={pinnedPlaceIds}
          onSelectPlace={onSelectPlace}
          onPinPlace={onPinPlace}
          onDirections={onDirections}
          onHoverPlace={onHoverPlace}
        />
      )
    });
  }

  if (pinnedPlaces.length > 0 && !closedPanels.includes('pinned')) {
    availablePanels.push({
      id: 'pinned',
      title: 'Địa điểm đã ghim',
      subtitle: `${pinnedPlaces.length} đã lưu`,
      icon: <Heart className="w-4 h-4" />,
      component: (
        <PinnedPlacesPanel
          pinnedPlaces={pinnedPlaces}
          onRemovePin={onRemovePin}
          onCompareSelected={(list) => {
            list.forEach(p => onComparePlace?.(p));
            handleSetActive('comparison');
          }}
          onAskAISelected={(list) => onAskAIAboutPlace?.(list[0])} // Ask about the first one for now
          onCreateItinerary={onCreateItinerary}
          onSelectPlace={onSelectPlace}
        />
      )
    });
  }

  if (itinerary && !closedPanels.includes('itinerary')) {
    availablePanels.push({
      id: 'itinerary',
      title: 'Lịch trình chi tiết',
      subtitle: '3 ngày 2 đêm',
      icon: <Calendar className="w-4 h-4" />,
      component: (
        <ItineraryPanel
          itinerary={itinerary}
          basePlace={pinnedPlaces[0] || searchPlaces[0]}
          onOptimizeRoute={onOptimizeRoute}
          onAddFood={onAddFood}
          onMakeCheaper={onMakeCheaper}
          onMakeRelaxing={onMakeRelaxing}
        />
      )
    });
  }

  if (areaInsight && !closedPanels.includes('insight')) {
    availablePanels.push({
      id: 'insight',
      title: 'Đánh giá khu vực',
      subtitle: 'Phân tích AI',
      icon: <Compass className="w-4 h-4" />,
      component: (
        <AreaInsightPanel
          location={areaInsight.location || 'Đà Lạt'}
          insights={areaInsight}
        />
      )
    });
  }

  if (budget && !closedPanels.includes('budget')) {
    availablePanels.push({
      id: 'budget',
      title: 'Dự toán chi phí',
      subtitle: 'Bảng phân tích',
      icon: <DollarSign className="w-4 h-4" />,
      component: (
        <BudgetPanel
          budgetData={budget}
          basePlaceName={pinnedPlaces[0]?.name || searchPlaces[0]?.name}
        />
      )
    });
  }

  if (foodRecommendations.length > 0 && !closedPanels.includes('food')) {
    availablePanels.push({
      id: 'food',
      title: 'Ăn uống lân cận',
      subtitle: `${foodRecommendations.length} gợi ý`,
      icon: <Coffee className="w-4 h-4" />,
      component: (
        <FoodRecommendationPanel
          foods={foodRecommendations}
          onSelectFood={onSelectFood}
          onAddToItinerary={onAddToItinerary}
          onAskAI={onAskAIAboutPlace}
        />
      )
    });
  }

  // Toggle pin/unpin panel (prevents collapsing when other panels expand)
  const togglePinPanel = (panelId, e) => {
    e.stopPropagation();
    setPinnedPanels(prev =>
      prev.includes(panelId) ? prev.filter(id => id !== panelId) : [...prev, panelId]
    );
  };

  // Close/remove panel from workspace
  const handleClosePanel = (panelId, e) => {
    e.stopPropagation();
    setClosedPanels(prev => [...prev, panelId]);
    if (currentActive === panelId) {
      // Find another panel to expand
      const remaining = availablePanels.filter(p => p.id !== panelId);
      if (remaining.length > 0) {
        handleSetActive(remaining[0].id);
      }
    }
    onClosePanel?.(panelId);
  };

  const handleHeaderClick = (panelId) => {
    if (currentActive === panelId) {
      // Collapse
      handleSetActive(null);
    } else {
      // Expand
      handleSetActive(panelId);
    }
  };

  // Empty State Layout
  if (availablePanels.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white/[0.90] border border-base-200/80 shadow-card backdrop-blur-xl rounded-3xl overflow-hidden text-left">
        {/* Title */}
        <div className="px-4 py-3 bg-ink-900 border-b border-base-200 text-white rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-xs font-black">AI Workspace Panel</span>
          </div>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="px-2 py-1 hover:bg-white/10 rounded-xl transition text-[10px] font-bold text-white/70 hover:text-white"
              title="Thu gọn Workspace"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center select-none">
          <h3 className="text-sm font-black text-ink-900">AI Workspace</h3>
          <p className="mt-1.5 text-xs text-ink-500 max-w-xs leading-normal font-medium">
            Kết quả tìm kiếm, bảng so sánh, lịch trình, bảng phân bổ ngân sách, và đánh giá khu vực do AI tạo ra sẽ hiển thị ở đây.
          </p>
          <div className="mt-6 border-t border-slate-100 pt-4 w-full">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gợi ý bắt đầu</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-700 italic">
              "Tìm homestay yên tĩnh ở Đà Lạt cho 2 người dưới 1 triệu VNĐ"
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white/[0.90] border border-base-200/80 shadow-card backdrop-blur-xl rounded-3xl overflow-hidden">
      {/* Title */}
      <div className="px-4 py-3 bg-ink-900 border-b border-base-200 text-white rounded-t-3xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-400" />
          <span className="text-xs font-black">AI Workspace Panel</span>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="px-2 py-1 hover:bg-white/10 rounded-xl transition text-[10px] font-bold text-white/70 hover:text-white"
            title="Thu gọn Workspace"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Accordion container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {availablePanels.map((panel) => {
          const isExpanded = currentActive === panel.id || pinnedPanels.includes(panel.id);
          const isPinned = pinnedPanels.includes(panel.id);
          const isSelectedTab = currentActive === panel.id;

          return (
            <div
              key={panel.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isSelectedTab
                  ? 'border-primary-300/80 shadow-soft bg-white ring-1 ring-primary-400/20'
                  : 'border-base-200 bg-white/70 hover:bg-white'
              }`}
            >
              {/* Header bar */}
              <div
                onClick={() => handleHeaderClick(panel.id)}
                className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition select-none ${
                  isSelectedTab ? 'bg-primary-50/20 border-b border-primary-100/60' : ''
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    isSelectedTab ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {panel.icon}
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-[11px] font-black text-ink-900 leading-tight">
                      {panel.title}
                    </h4>
                    <p className="text-[9px] text-slate-500 leading-none mt-0.5">
                      {panel.subtitle}
                    </p>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => togglePinPanel(panel.id, e)}
                    className={`px-1.5 py-1 rounded-lg hover:bg-slate-100 transition-colors text-[9px] font-black ${
                      isPinned ? 'text-primary-700' : 'text-slate-400'
                    }`}
                    title={isPinned ? 'Bỏ pin panel' : 'Pin panel cố định'}
                  >
                    <Pin className={`w-3 h-3 ${isPinned ? 'fill-primary-500 text-primary-600' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => handleClosePanel(panel.id, e)}
                    className="px-1.5 py-1 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors text-[9px] font-black"
                    title="Đóng panel"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                  )}
                </div>
              </div>

              {/* Panel content block */}
              {isExpanded && (
                <div className="p-3 border-t border-slate-50 bg-white/40 animate-soft-in">
                  {panel.component}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
