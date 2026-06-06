import { useCallback, useMemo, useState } from 'react';

/* ──────────────────────────────────────────
   Step definitions for each workflow type
   ────────────────────────────────────────── */

const SEARCH_STEPS = [
  {
    id: 'location',
    title: 'Bạn muốn tìm ở đâu?',
    subtitle: 'Chọn hoặc nhập tên thành phố',
    type: 'location',
    defaultValue: '',
  },
  {
    id: 'types',
    title: 'Loại chỗ ở?',
    subtitle: 'Chọn một hoặc nhiều loại',
    type: 'chip-multi',
    options: [
      { value: 'hotel', label: 'Khách sạn' },
      { value: 'homestay', label: 'Homestay' },
      { value: 'resort', label: 'Resort' },
      { value: 'villa', label: 'Villa' },
      { value: 'hostel', label: 'Nhà nghỉ' },
      { value: 'apartment', label: 'Căn hộ' },
      { value: 'camping', label: 'Camping' },
    ],
    defaultValue: [],
  },
  {
    id: 'guests',
    title: 'Mấy người ở?',
    subtitle: 'Số lượng khách lưu trú',
    type: 'stepper',
    defaultValue: 2,
  },
  {
    id: 'budget',
    title: 'Mức ngân sách?',
    subtitle: 'Chọn tầm giá phù hợp',
    type: 'card-radio',
    defaultValue: '',
  },
];

const COMPARE_STEPS = [
  {
    id: 'criteria',
    title: 'So sánh theo tiêu chí nào?',
    subtitle: 'Chọn các tiêu chí quan tâm',
    type: 'checklist',
    options: [
      { value: 'price', label: 'Giá cả' },
      { value: 'rating', label: 'Đánh giá khách' },
      { value: 'location', label: 'Vị trí' },
      { value: 'amenities', label: 'Tiện nghi phòng' },
      { value: 'quiet', label: 'Yên tĩnh' },
      { value: 'cleanliness', label: 'Sạch sẽ/chất lượng' },
    ],
    defaultValue: [],
  },
];

const ANALYZE_STEPS = [
  {
    id: 'criteria',
    title: 'Đánh giá theo tiêu chí nào?',
    subtitle: 'Chọn các tiêu chí bạn quan tâm',
    type: 'checklist',
    options: [
      { value: 'price', label: 'Giá cả hợp lý' },
      { value: 'location', label: 'Vị trí thuận tiện' },
      { value: 'cleanliness', label: 'Sạch sẽ/chất lượng phòng' },
      { value: 'view', label: 'View đẹp' },
      { value: 'amenities', label: 'Tiện ích (hồ bơi, gym, spa)' },
      { value: 'quiet', label: 'Yên tĩnh' },
      { value: 'parking', label: 'Bãi đỗ xe' },
    ],
    defaultValue: [],
  },
];

const WORKFLOW_STEPS_MAP = {
  SEARCH_PLACES: SEARCH_STEPS,
  COMPARE_PLACES: COMPARE_STEPS,
  ANALYZE_PLACE: ANALYZE_STEPS,
};

const WORKFLOW_META = {
  SEARCH_PLACES: { title: 'Tìm kiếm chỗ ở', verb: 'tìm kiếm' },
  COMPARE_PLACES: { title: 'So sánh địa điểm', verb: 'so sánh' },
  ANALYZE_PLACE: { title: 'Phân tích chi tiết', verb: 'phân tích' },
};

/* ──────────────────────────────────────────
   Hook: useWorkflowWizard
   State machine: idle → prompting → collecting → confirming → executing
   ────────────────────────────────────────── */

export { WORKFLOW_META };

export default function useWorkflowWizard() {
  const [wizardState, setWizardState] = useState('idle');
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [collectedData, setCollectedData] = useState({});

  // Derived step definitions for the active workflow
  const steps = useMemo(() => {
    if (!activeWorkflow?.workflowId) return [];
    return WORKFLOW_STEPS_MAP[activeWorkflow.workflowId] || [];
  }, [activeWorkflow?.workflowId]);

  // Current step object
  const currentStep = useMemo(() => {
    if (wizardState !== 'collecting' || currentStepIndex >= steps.length) return null;
    return steps[currentStepIndex];
  }, [wizardState, currentStepIndex, steps]);

  const isLastStep = currentStepIndex >= steps.length - 1;

  const progress = useMemo(() => ({
    current: currentStepIndex + 1,
    total: steps.length,
    percentage: steps.length > 0
      ? Math.round(((currentStepIndex + 1) / steps.length) * 100)
      : 0,
  }), [currentStepIndex, steps.length]);

  // Merged summary of initial params + collected data
  const summaryData = useMemo(() => {
    if (!activeWorkflow) return {};
    const params = activeWorkflow.initialParams || {};
    const merged = { ...params };

    for (const step of steps) {
      const val = collectedData[step.id];
      if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0)) {
        merged[step.id] = val;
      } else if (merged[step.id] === undefined) {
        merged[step.id] = step.defaultValue;
      }
    }

    return {
      query: merged.query || activeWorkflow.detectedQuery || '',
      location: merged.location || '',
      types: merged.types || (merged.type ? [merged.type] : []),
      guests: merged.guests ?? 2,
      budget: merged.budget || '',
      criteria: Array.isArray(merged.criteria)
        ? merged.criteria
        : (merged.criteria && merged.criteria !== 'overall' ? [merged.criteria] : []),
      preferences: merged.preferences || [],
    };
  }, [activeWorkflow, collectedData, steps]);

  // ── Actions ──────────────────────────────

  /** Propose a workflow — show confirmation prompt */
  const proposeWorkflow = useCallback((workflowId, params = {}, query = '') => {
    const workflowSteps = WORKFLOW_STEPS_MAP[workflowId];
    if (!workflowSteps) return;

    // Pre-fill collected data from router params
    const prefilled = {};
    for (const step of workflowSteps) {
      if (step.id === 'criteria') {
        const criteria = Array.isArray(params.criteria)
          ? params.criteria
          : (typeof params.criteria === 'string' && params.criteria !== 'overall' ? [params.criteria] : []);
        if (criteria.length > 0) prefilled.criteria = criteria;
      } else if (params[step.id] !== undefined && params[step.id] !== null && params[step.id] !== '') {
        prefilled[step.id] = params[step.id];
      }
    }

    setActiveWorkflow({ workflowId, initialParams: params, detectedQuery: query });
    setCollectedData(prefilled);
    setCurrentStepIndex(0);
    setWizardState('prompting');
  }, []);

  /** User accepted — start collecting step data */
  const acceptWorkflow = useCallback(() => {
    setWizardState('collecting');
    setCurrentStepIndex(0);
  }, []);

  /** User declined — back to idle */
  const declineWorkflow = useCallback(() => {
    setWizardState('idle');
    setActiveWorkflow(null);
    setCollectedData({});
    setCurrentStepIndex(0);
  }, []);

  /** Submit current step value */
  const submitStep = useCallback((stepId, value) => {
    setCollectedData(prev => ({ ...prev, [stepId]: value }));
    if (currentStepIndex >= steps.length - 1) {
      setWizardState('confirming');
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, steps.length]);

  /** Skip current step (use default) */
  const skipStep = useCallback(() => {
    const step = steps[currentStepIndex];
    if (step) {
      setCollectedData(prev => {
        if (prev[step.id] === undefined) {
          return { ...prev, [step.id]: step.defaultValue };
        }
        return prev;
      });
    }
    if (currentStepIndex >= steps.length - 1) {
      setWizardState('confirming');
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, steps]);

  /** Go back to previous step */
  const goBackStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  /** Edit a specific step from the summary card */
  const editFromSummary = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
      setWizardState('collecting');
    }
  }, [steps.length]);

  /** Final confirm — start executing */
  const confirmAndExecute = useCallback(() => {
    setWizardState('executing');
  }, []);

  /** Cancel wizard at any point */
  const cancelWizard = useCallback(() => {
    setWizardState('idle');
    setActiveWorkflow(null);
    setCollectedData({});
    setCurrentStepIndex(0);
  }, []);

  /** Full reset */
  const resetWizard = useCallback(() => {
    setWizardState('idle');
    setActiveWorkflow(null);
    setCollectedData({});
    setCurrentStepIndex(0);
  }, []);

  return {
    // State
    wizardState,
    activeWorkflow,
    currentStepIndex,
    steps,
    collectedData,
    // Actions
    proposeWorkflow,
    acceptWorkflow,
    declineWorkflow,
    submitStep,
    skipStep,
    goBackStep,
    editFromSummary,
    confirmAndExecute,
    cancelWizard,
    resetWizard,
    // Computed
    currentStep,
    summaryData,
    isLastStep,
    progress,
  };
}
