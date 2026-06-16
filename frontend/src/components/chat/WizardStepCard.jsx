import { useState, useEffect } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { LocationInput, ChipMultiSelector, BudgetCardSelector, CriteriaChecklist, GuestStepper } from './wizard-inputs';

const INPUT_MAP = {
  'location': LocationInput,
  'chip-multi': ChipMultiSelector,
  'card-radio': BudgetCardSelector,
  'checklist': CriteriaChecklist,
  'stepper': GuestStepper,
};

export default function WizardStepCard({
  step,
  stepIndex,
  totalSteps,
  value,
  onSubmit,
  onSkip,
  onBack,
  onCancel,
}) {
  const [localValue, setLocalValue] = useState(value ?? step.defaultValue);

  // Reset local value when step changes
  useEffect(() => {
    setLocalValue(value ?? step.defaultValue);
  }, [step.id, value, step.defaultValue]);

  const handleSubmit = () => {
    onSubmit(localValue);
  };

  // Build props for the input component
  const inputProps = {
    value: localValue,
    onChange: setLocalValue,
  };

  if (step.options) inputProps.options = step.options;
  if (step.suggestions) inputProps.suggestions = step.suggestions;
  if (step.type === 'checklist') inputProps.maxSelect = 5;

  const InputComponent = INPUT_MAP[step.type];
  const isEmptyValue = Array.isArray(localValue) ? localValue.length === 0 : !localValue;
  const isSubmitDisabled = Boolean(step.required && isEmptyValue);

  return (
    <div className="border border-base-200 bg-white rounded-2xl p-4 shadow-soft space-y-3 animate-soft-in">
      {/* Progress dots */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? 'w-5 h-1.5 bg-primary-600'
                  : i < stepIndex
                  ? 'w-1.5 h-1.5 bg-primary-400'
                  : 'w-1.5 h-1.5 bg-base-300'
              }`}
            />
          ))}
        </div>
        <span className="text-[9px] font-semibold text-ink-400">
          Bước {stepIndex + 1}/{totalSteps}
        </span>
      </div>

      {/* Title */}
      <div>
        <h4 className="text-xs font-black text-ink-900">{step.title}</h4>
        {step.subtitle && (
          <p className="text-[10px] text-ink-500 font-medium mt-0.5">{step.subtitle}</p>
        )}
      </div>

      {/* Input component */}
      <div className="py-1">
        {InputComponent ? (
          <InputComponent {...inputProps} />
        ) : (
          <p className="text-xs text-ink-500">Unsupported input type: {step.type}</p>
        )}
        {isSubmitDisabled && step.requiredHint ? (
          <p className="mt-2 text-[10px] font-semibold leading-4 text-amber-700">
            {step.requiredHint}
          </p>
        ) : null}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between pt-1 border-t border-base-100">
        <div className="flex items-center gap-2">
          {!step.hideSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="text-[10px] font-semibold text-ink-500 hover:text-ink-700 transition px-2 py-1"
            >
              {step.skipLabel || 'Bỏ qua'}
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-0.5 text-[10px] font-semibold text-ink-500 hover:text-ink-700 transition px-2 py-1.5 rounded-lg hover:bg-base-50"
            >
              <ChevronLeft className="w-3 h-3" />
              Quay lại
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="px-3 py-1.5 bg-primary-600 text-white text-[10px] font-black rounded-xl hover:bg-primary-700 transition shadow-sm disabled:cursor-not-allowed disabled:bg-base-200 disabled:text-ink-500"
          >
            {step.submitLabel || 'Tiếp tục →'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-ink-400 hover:text-ink-600 hover:bg-base-100 rounded-lg transition"
            title="Hủy"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
