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
    title: 'Bạn muốn mình ưu tiên điều gì khi so sánh?',
    subtitle: 'Chọn vài điểm bạn đang phân vân, mình sẽ tự cân bằng phần còn lại.',
    summaryLabel: 'Ưu tiên so sánh',
    skipLabel: 'Mình tự cân nhắc',
    type: 'checklist',
    options: [
      { value: 'price', label: 'Giá có đáng tiền không' },
      { value: 'rating', label: 'Review và mức độ tin cậy' },
      { value: 'location', label: 'Vị trí có tiện không' },
      { value: 'amenities', label: 'Tiện nghi nổi bật' },
      { value: 'quiet', label: 'Không gian yên tĩnh' },
      { value: 'cleanliness', label: 'Độ sạch và chất lượng phòng' },
    ],
    defaultValue: [],
  },
];

const INSIGHT_TRAVEL_CRITERION = 'Khoảng cách đi lại';

const ANALYZE_CRITERIA_STEP = {
  id: 'criteria',
  title: 'Bạn muốn mình đánh giá theo tiêu chí nào?',
  subtitle: 'Insight sẽ chỉ tập trung vào các tiêu chí bạn chọn ở đây.',
  summaryLabel: 'Tiêu chí insight',
  hideSkip: true,
  required: true,
  requiredHint: 'Chọn ít nhất 1 tiêu chí để mình phân tích đúng trọng tâm.',
  submitLabel: 'Xác nhận tiêu chí',
  type: 'checklist',
  options: [
    { value: INSIGHT_TRAVEL_CRITERION, label: 'Khoảng cách đi lại' },
    { value: 'Giá trị so với giá tiền', label: 'Giá trị so với giá tiền' },
    { value: 'Tiện nghi', label: 'Tiện nghi' },
    { value: 'Độ sạch sẽ', label: 'Độ sạch sẽ' },
    { value: 'Độ yên tĩnh', label: 'Độ yên tĩnh' },
  ],
  defaultValue: [],
};

const ANALYZE_START_LOCATION_STEP = {
  id: 'startLocation',
  title: 'Bạn muốn tính khoảng cách từ đâu?',
  subtitle: 'Mình chỉ hỏi bước này vì bạn đã chọn tiêu chí khoảng cách đi lại.',
  summaryLabel: 'Điểm xuất phát',
  skipLabel: 'Bỏ qua vị trí',
  type: 'location',
  suggestions: ['Vị trí hiện tại', 'Trung tâm thành phố', 'Sân bay', 'Bến xe'],
  defaultValue: '',
};

const ANALYZE_CRITERIA_ALIASES = {
  travel_time: INSIGHT_TRAVEL_CRITERION,
  travel_distance: INSIGHT_TRAVEL_CRITERION,
  distance: INSIGHT_TRAVEL_CRITERION,
  location: INSIGHT_TRAVEL_CRITERION,
  'khoảng cách đi lại': INSIGHT_TRAVEL_CRITERION,
  price: 'Giá trị so với giá tiền',
  budget: 'Giá trị so với giá tiền',
  value: 'Giá trị so với giá tiền',
  value_for_money: 'Giá trị so với giá tiền',
  'giá trị so với giá tiền': 'Giá trị so với giá tiền',
  amenities: 'Tiện nghi',
  'tiện nghi': 'Tiện nghi',
  cleanliness: 'Độ sạch sẽ',
  clean: 'Độ sạch sẽ',
  'độ sạch sẽ': 'Độ sạch sẽ',
  quiet: 'Độ yên tĩnh',
  quietness: 'Độ yên tĩnh',
  'độ yên tĩnh': 'Độ yên tĩnh',
};

const ANALYZE_STEPS = [ANALYZE_CRITERIA_STEP, ANALYZE_START_LOCATION_STEP];

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

function normalizeCriteriaInput(criteria) {
  if (Array.isArray(criteria)) return criteria;
  if (typeof criteria === 'string' && criteria !== 'overall') {
    return criteria.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeCriteriaForWorkflow(workflowId, criteria) {
  const values = normalizeCriteriaInput(criteria);
  if (workflowId !== 'ANALYZE_PLACE') return values;

  const allowed = new Set(ANALYZE_CRITERIA_STEP.options.map((option) => option.value));
  return Array.from(new Set(values
    .map((value) => {
      const raw = String(value || '').trim();
      return ANALYZE_CRITERIA_ALIASES[raw] || ANALYZE_CRITERIA_ALIASES[raw.toLowerCase()] || raw;
    })
    .filter((value) => allowed.has(value))));
}

function includesTravelDistance(criteria) {
  return normalizeCriteriaForWorkflow('ANALYZE_PLACE', criteria).includes(INSIGHT_TRAVEL_CRITERION);
}

function getWorkflowSteps(workflowId, data = {}) {
  if (workflowId === 'ANALYZE_PLACE') {
    return includesTravelDistance(data.criteria)
      ? ANALYZE_STEPS
      : [ANALYZE_CRITERIA_STEP];
  }
  return WORKFLOW_STEPS_MAP[workflowId] || [];
}

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
    return getWorkflowSteps(activeWorkflow.workflowId, collectedData);
  }, [activeWorkflow?.workflowId, collectedData]);

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

    const criteria = normalizeCriteriaForWorkflow(activeWorkflow.workflowId, merged.criteria);
    const shouldUseStartLocation = activeWorkflow.workflowId !== 'ANALYZE_PLACE' || includesTravelDistance(criteria);

    return {
      query: merged.query || activeWorkflow.detectedQuery || '',
      location: merged.location || '',
      types: merged.types || (merged.type ? [merged.type] : []),
      guests: merged.guests ?? 2,
      budget: merged.budget || '',
      criteria,
      preferences: merged.preferences || [],
      startLocation: shouldUseStartLocation ? (merged.startLocation || '') : '',
      tripPurposes: Array.isArray(merged.tripPurposes) ? merged.tripPurposes : [],
    };
  }, [activeWorkflow, collectedData, steps]);

  // ── Actions ──────────────────────────────

  /** Propose a workflow — show confirmation prompt */
  const proposeWorkflow = useCallback((workflowId, params = {}, query = '', rawUserMessage = '') => {
    const normalizedParams = {
      ...params,
      criteria: normalizeCriteriaForWorkflow(workflowId, params.criteria),
    };
    const workflowSteps = getWorkflowSteps(workflowId, normalizedParams);
    if (!workflowSteps) return;

    // Pre-fill collected data from router params
    const prefilled = {};
    for (const step of workflowSteps) {
      if (step.id === 'criteria') {
        const criteria = normalizeCriteriaForWorkflow(workflowId, normalizedParams.criteria);
        if (criteria.length > 0) prefilled.criteria = criteria;
      } else if (normalizedParams[step.id] !== undefined && normalizedParams[step.id] !== null && normalizedParams[step.id] !== '') {
        prefilled[step.id] = normalizedParams[step.id];
      }
    }

    setActiveWorkflow({
      workflowId,
      initialParams: normalizedParams,
      detectedQuery: query,
      rawUserMessage: rawUserMessage || query || normalizedParams?.query || '',
    });
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
    const nextCollectedData = { ...collectedData, [stepId]: value };
    const nextSteps = getWorkflowSteps(activeWorkflow?.workflowId, nextCollectedData);

    setCollectedData(nextCollectedData);
    if (currentStepIndex >= nextSteps.length - 1) {
      setWizardState('confirming');
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [activeWorkflow?.workflowId, collectedData, currentStepIndex]);

  /** Skip current step (use default) */
  const skipStep = useCallback(() => {
    const step = steps[currentStepIndex];
    let nextCollectedData = collectedData;
    if (step) {
      nextCollectedData = collectedData[step.id] === undefined
        ? { ...collectedData, [step.id]: step.defaultValue }
        : collectedData;
    }
    const nextSteps = getWorkflowSteps(activeWorkflow?.workflowId, nextCollectedData);

    setCollectedData(nextCollectedData);
    if (currentStepIndex >= nextSteps.length - 1) {
      setWizardState('confirming');
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [activeWorkflow?.workflowId, collectedData, currentStepIndex, steps]);

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
