import { AlertTriangle, TrendingUp } from "lucide-react";

interface RisksOpportunitiesProps {
  risks: string[];
  opportunities: string[];
}

export const RisksOpportunities: React.FC<RisksOpportunitiesProps> = ({ risks, opportunities }) => {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-delta-escalated font-semibold mb-4">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-display text-lg">Risks</h3>
        </div>
        {risks.map((risk, i) => (
          <article key={i} className="p-4 bg-white border border-delta-escalated/20 rounded-lg border-l-4 border-l-delta-escalated">
            <p className="text-document-sm text-text font-body">{risk}</p>
          </article>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-delta-deescalated font-semibold mb-4">
          <TrendingUp className="h-5 w-5" />
          <h3 className="font-display text-lg">Opportunities</h3>
        </div>
        {opportunities.map((opportunity, i) => (
          <article key={i} className="p-4 bg-white border border-delta-deescalated/20 rounded-lg border-l-4 border-l-delta-deescalated">
            <p className="text-document-sm text-text font-body">{opportunity}</p>
          </article>
        ))}
      </div>
    </div>
  );
};
