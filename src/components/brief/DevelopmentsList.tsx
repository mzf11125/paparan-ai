import { DeltaBadge } from "@/components/ui/DeltaBadge";
import { FilterButtons } from "@/components/ui/FilterButtons";
import { Development, FilterType } from "@/types/paparan";

interface DevelopmentsListProps {
  developments: Development[];
  filter: FilterType;
  highlightMode: boolean;
  onFilterChange: (filter: FilterType) => void;
}

export const DevelopmentsList: React.FC<DevelopmentsListProps> = ({
  developments,
  filter,
  highlightMode,
  onFilterChange,
}) => {
  const filteredDevelopments = filter === "high" ? developments.filter((d) => d.impact === "HIGH") : developments;
  const highCount = developments.filter((d) => d.impact === "HIGH").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200 lg:hidden">
        <span className="text-sm text-text font-semibold uppercase tracking-wider font-ui">Filter</span>
        <FilterButtons currentFilter={filter} onFilterChange={onFilterChange} counts={{ all: developments.length, high: highCount }} />
      </div>

      <div className={`space-y-4 ${highlightMode ? "highlight-mode" : ""}`}>
        {filteredDevelopments.map((dev) => (
          <article
            key={dev.id}
            data-impact={dev.impact}
            className={`development-item p-5 rounded-xl border transition-all duration-200 ${
              dev.impact === "HIGH"
                ? "border-delta-escalated/30 bg-delta-escalated-light/50"
                : "border-gray-200 bg-gray-50/50"
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <DeltaBadge delta={dev.delta} impact={dev.impact} showImpact={false} />
              {dev.date && <time className="text-xs text-text-tertiary font-ui whitespace-nowrap">{dev.date}</time>}
            </div>
            <p className={`text-document-base leading-relaxed font-body ${dev.impact === "HIGH" ? "font-semibold" : ""}`}>
              {dev.text}
            </p>
            {dev.entities && dev.entities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {dev.entities.map((entity, i) => (
                  <span key={i} className="inline-flex px-2.5 py-1 text-xs font-medium font-ui bg-white border border-gray-200 text-text-secondary rounded-md">
                    {entity}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
        {filteredDevelopments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-text-secondary font-ui">No developments match the current filter.</p>
            <button
              onClick={() => onFilterChange("all")}
              className="mt-3 text-sm text-accent hover:text-accent-dark font-ui underline underline-offset-2"
            >
              Show all developments
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
