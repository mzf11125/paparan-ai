import { Delta } from "@/types/paparan";

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
  delta: Delta;
  impact?: "HIGH" | "MEDIUM" | "LOW";
  showImpact?: boolean;
}

export const DeltaBadge: React.FC<DeltaBadgeProps> = ({ delta, impact, showImpact = false }) => {
  const config = deltaConfig[delta];

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border ${config.bgColor} ${config.textColor} ${config.borderColor} text-xs font-semibold uppercase tracking-wider font-ui`}
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
