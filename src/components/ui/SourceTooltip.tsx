import { Confidence } from "@/types/paparan";

const confidenceConfig = {
  HIGH: { color: "text-green-700", bg: "bg-green-100", label: "HIGH" },
  MEDIUM: { color: "text-amber-700", bg: "bg-amber-100", label: "MED" },
  LOW: { color: "text-red-700", bg: "bg-red-100", label: "LOW" },
} as const;

interface SourceTooltipProps {
  title: string;
  confidence: Confidence;
  date: string;
  children: React.ReactNode;
}

export const SourceTooltip: React.FC<SourceTooltipProps> = ({ title, confidence, date, children }) => {
  const config = confidenceConfig[confidence];

  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-64">
        <p className="text-sm font-medium text-text font-display leading-tight mb-1">{title}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${config.bg} ${config.color} font-ui`}>
            {config.label} CONFIDENCE
          </span>
          <span className="text-xs text-text-tertiary font-ui">{date}</span>
        </div>
        <div className="absolute top-full left-3 w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45 -mt-1" />
      </div>
    </div>
  );
};
