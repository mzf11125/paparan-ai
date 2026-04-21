import { FilterType } from "@/types/paparan";

interface FilterButtonsProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: { all: number; high: number };
}

export const FilterButtons: React.FC<FilterButtonsProps> = ({ currentFilter, onFilterChange, counts }) => {
  return (
    <div className="inline-flex gap-2" role="group" aria-label="Filter developments by impact">
      <button
        onClick={() => onFilterChange("all")}
        className={`px-3 py-1.5 text-sm font-ui font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
          currentFilter === "all"
            ? "bg-accent text-white"
            : "bg-bg-elevated border border-border text-text-secondary hover:bg-bg-surface"
        }`}
        aria-pressed={currentFilter === "all"}
      >
        All <span className="ml-1 opacity-75">({counts.all})</span>
      </button>
      <button
        onClick={() => onFilterChange("high")}
        className={`px-3 py-1.5 text-sm font-ui font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
          currentFilter === "high"
            ? "bg-accent text-white"
            : "bg-bg-elevated border border-border text-text-secondary hover:bg-bg-surface"
        }`}
        aria-pressed={currentFilter === "high"}
      >
        HIGH <span className="ml-1 opacity-75">({counts.high})</span>
      </button>
    </div>
  );
};
