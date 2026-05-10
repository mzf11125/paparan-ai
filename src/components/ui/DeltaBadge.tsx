import { Delta, Impact, Confidence } from "@/types/paparan";
import { cn } from "@/utils/cn";

// Export type aliases for convenience
export type DeltaType = Delta;
export type ImpactLevel = Impact;
export type ConfidenceLevel = Confidence;

const deltaConfig = {
  NEW: {
    label: "NEW",
    bgColor: "bg-delta-new-light",
    textColor: "text-delta-new",
    borderColor: "border-delta-new/20",
  },
  UPDATED: {
    label: "UPDATED",
    bgColor: "bg-delta-updated-light",
    textColor: "text-delta-updated",
    borderColor: "border-delta-updated/20",
  },
  ESCALATED: {
    label: "ESCALATED",
    bgColor: "bg-delta-escalated-light",
    textColor: "text-delta-escalated",
    borderColor: "border-delta-escalated/20",
  },
  "DE-ESCALATED": {
    label: "DE-ESCALATED",
    bgColor: "bg-delta-deescalated-light",
    textColor: "text-delta-deescalated",
    borderColor: "border-delta-deescalated/20",
  },
} as const;

interface DeltaBadgeProps {
  delta?: Delta;
  type?: Delta; // Backward compatibility
  impact?: "HIGH" | "MEDIUM" | "LOW";
  showImpact?: boolean;
  variant?: 'default' | 'compact' | 'minimal' | 'dot'; // Added 'dot' variant
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = ({ delta, type, impact, showImpact = false, variant = 'default' }) => {
  const deltaValue = delta || type || 'NEW'
  const config = deltaConfig[deltaValue];

  // Dot variant (minimal inline indicator)
  if (variant === 'dot') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold font-ui',
          config.textColor
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', config.bgColor.replace('-light', ''))} />
        <span>{config.label}</span>
      </span>
    )
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold font-ui', config.textColor)}>
        <span className={cn('w-1 h-1 rounded-full bg-current animate-pulse')} />
        <span>{config.label}</span>
      </span>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold font-ui transition-colors',
          config.bgColor, config.textColor, config.borderColor, 'border'
        )}
      >
        {config.label}
      </span>
    )
  }

  // Default variant
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-semibold uppercase tracking-wider font-ui transition-colors',
        config.bgColor, config.textColor, config.borderColor
      )}
    >
      <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
      <span>{config.label}</span>
      {showImpact && impact && (
        <>
          <span className="w-px h-3 bg-current/20" />
          <span className="font-medium">{impact}</span>
        </>
      )}
    </span>
  );
};

/* ============================================
   IMPACT BADGE — Impact Level Display
   ============================================ */

const impactConfig = {
  HIGH: {
    label: "HIGH",
    bgColor: "bg-impact-high-light",
    textColor: "text-impact-high",
    borderColor: "border-impact-high/20",
  },
  MEDIUM: {
    label: "MEDIUM",
    bgColor: "bg-impact-medium-light",
    textColor: "text-impact-medium",
    borderColor: "border-impact-medium/20",
  },
  LOW: {
    label: "LOW",
    bgColor: "bg-impact-low-light",
    textColor: "text-impact-low",
    borderColor: "border-impact-low/20",
  },
} as const;

interface ImpactBadgeProps {
  impact?: Impact;
  level?: Impact; // Backward compatibility
  variant?: "default" | "compact" | "minimal" | "dot";
}

export const ImpactBadge: React.FC<ImpactBadgeProps> = ({ impact, level, variant = "default" }) => {
  const impactValue = impact || level || 'LOW'
  const config = impactConfig[impactValue];

  // Dot variant (minimal inline indicator)
  if (variant === "dot") {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold font-ui',
          config.textColor
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', config.bgColor.replace('-light', ''))} />
        <span>{config.label}</span>
      </span>
    )
  }

  if (variant === "minimal") {
    return (
      <span className={`inline-flex items-center gap-1.5 ${config.textColor} text-xs font-semibold font-ui`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.bgColor.replace("-light", "")}`} />
        <span>{config.label}</span>
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${config.bgColor} ${config.textColor} ${config.borderColor} border text-xs font-semibold font-ui`}
      >
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border ${config.bgColor} ${config.textColor} ${config.borderColor} text-xs font-semibold uppercase tracking-wider font-ui`}
    >
      <span className="w-1 h-1 rounded-full bg-current" />
      <span>{config.label}</span>
    </span>
  );
};

/* ============================================
   CONFIDENCE BADGE — Source Confidence Display
   ============================================ */

const confidenceConfig = {
  HIGH: {
    label: "HIGH",
    bgColor: "bg-confidence-high-light",
    textColor: "text-confidence-high",
    borderColor: "border-confidence-high/20",
    dots: 3,
  },
  MEDIUM: {
    label: "MEDIUM",
    bgColor: "bg-confidence-medium-light",
    textColor: "text-confidence-medium",
    borderColor: "border-confidence-medium/20",
    dots: 2,
  },
  LOW: {
    label: "LOW",
    bgColor: "bg-confidence-low-light",
    textColor: "text-confidence-low",
    borderColor: "border-confidence-low/20",
    dots: 1,
  },
} as const;

interface ConfidenceBadgeProps {
  confidence?: Confidence;
  level?: Confidence; // Backward compatibility
  variant?: "default" | "compact" | "dots";
  showLabel?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  level,
  variant = "default",
  showLabel = true,
}) => {
  const confidenceValue = confidence || level || 'MEDIUM'
  const config = confidenceConfig[confidenceValue];

  if (variant === "dots") {
    return (
      <div className="flex items-center gap-1" title={`Confidence: ${config.label}`}>
        {[...Array(config.dots)].map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < config.dots ? config.textColor.replace("text-", "bg-") : "bg-border-strong"
            }`}
          />
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${config.bgColor} ${config.textColor} ${config.borderColor} border text-xs font-semibold font-ui`}
      >
        {showLabel && config.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border ${config.bgColor} ${config.textColor} ${config.borderColor} text-xs font-semibold uppercase tracking-wider font-ui`}
    >
      <span className="w-1 h-1 rounded-full bg-current" />
      <span>{config.label}</span>
    </span>
  );
};
