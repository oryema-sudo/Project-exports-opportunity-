import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  guidance?: string;
  badge?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  guidance,
  badge
}) => {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs my-6">
      
      {/* Icon */}
      <div className="w-14 h-14 mx-auto rounded-full bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-emerald-800" />
      </div>

      {badge && (
        <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
          {badge}
        </div>
      )}

      {/* Title & Description */}
      <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
        {description}
      </p>

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg border border-stone-300 flex items-center gap-2 transition-colors cursor-pointer"
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 text-stone-600" />}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}

      {/* Guidance Note */}
      {guidance && (
        <div className="mt-6 pt-4 border-t border-stone-100 text-left bg-stone-50/80 p-3 rounded-lg border border-stone-200/80 text-[11px] text-stone-600 flex items-start gap-2 max-w-lg mx-auto">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-stone-800 font-semibold">Operational Guidance: </strong>
            <span>{guidance}</span>
          </div>
        </div>
      )}

    </div>
  );
};
