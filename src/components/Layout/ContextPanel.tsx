import { FileText, AlertTriangle, TrendingUp } from "lucide-react";
import { Paparan } from "@/types/paparan";

interface ContextPanelProps {
  paparan: Paparan;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ paparan }) => {
  const highImpactCount = paparan.developments.filter((d) => d.impact === "HIGH").length;
  const riskCount = paparan.risks.length;
  const opportunityCount = paparan.opportunities.length;
  const actionCount = paparan.actions.filter((a) => a.priority === "HIGH").length;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "HIGH": return "bg-delta-escalated";
      case "MEDIUM": return "bg-amber-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <aside className="w-72 shrink-0 hidden xl:block no-print">
      <div className="sticky top-20 space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="font-display text-lg text-text font-semibold mb-4 pb-3 border-b border-gray-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary font-ui">Total Developments</span>
              <span className="font-semibold text-text">{paparan.developments.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary font-ui">High Impact</span>
              <span className="font-semibold text-delta-escalated">{highImpactCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary font-ui flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Risks
              </span>
              <span className="font-semibold text-delta-escalated">{riskCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary font-ui flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Opportunities
              </span>
              <span className="font-semibold text-delta-deescalated">{opportunityCount}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-sm text-text-secondary font-ui">Priority Actions</span>
              <span className="font-semibold text-accent">{actionCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="font-display text-sm text-text font-semibold mb-4 uppercase tracking-wider">Document Details</h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs text-text-tertiary uppercase tracking-wide font-ui block mb-1">Region</span>
              <p className="text-sm font-medium text-text font-display">{paparan.region}</p>
            </div>
            <div>
              <span className="text-xs text-text-tertiary uppercase tracking-wide font-ui block mb-1">Brief Date</span>
              <p className="text-sm font-medium text-text font-display">{paparan.date}</p>
            </div>
            {paparan.lastUpdated && (
              <div>
                <span className="text-xs text-text-tertiary uppercase tracking-wide font-ui block mb-1">Last Updated</span>
                <p className="text-sm font-medium text-text font-display">{paparan.lastUpdated}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="font-display text-sm text-text font-semibold mb-4 uppercase tracking-wider">Recent Timeline</h3>
          <div className="space-y-4">
            {paparan.developments.slice(0, 4).map((dev, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getImpactColor(dev.impact)}`} />
                <div className="flex-1 min-w-0">
                  {dev.date && <p className="text-xs text-text-tertiary font-ui mb-0.5">{dev.date}</p>}
                  <p className="text-sm text-text font-body line-clamp-2 leading-snug">{dev.text}</p>
                </div>
              </div>
            ))}
            {paparan.developments.length > 4 && (
              <p className="text-xs text-text-tertiary text-center font-ui pt-2">
                +{paparan.developments.length - 4} more developments
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
