import { Filter } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import { FilterButtons } from "@/components/ui/FilterButtons";
import { FilterType } from "@/types/paparan";

interface SidebarProps {
  highlightMode: boolean;
  onToggleHighlight: () => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: { all: number; high: number };
  sections: Array<{ id: string; title: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  highlightMode,
  onToggleHighlight,
  filter,
  onFilterChange,
  counts,
  sections,
}) => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="w-60 shrink-0 hidden lg:block no-print">
      <div className="sticky top-20 space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-text font-semibold mb-4">
            <Filter className="w-4 h-4 text-accent" />
            <span className="text-sm uppercase tracking-wider font-ui">Filter</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-2 block font-ui">Developments</label>
              <FilterButtons currentFilter={filter} onFilterChange={onFilterChange} counts={counts} />
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-secondary uppercase tracking-wide font-ui">Highlight Mode</span>
                <Toggle checked={highlightMode} onChange={onToggleHighlight} ariaLabel="Toggle highlight mode for high impact items" />
              </div>
              <p className="text-xs text-text-tertiary font-ui leading-relaxed">
                {highlightMode ? "Showing HIGH impact items prominently" : "Show all items equally"}
              </p>
            </div>
          </div>
        </div>

        <nav className="bg-white border border-gray-200 rounded-lg p-4" aria-label="Document sections">
          <div className="flex items-center gap-2 text-text font-semibold mb-4">
            <span className="text-sm uppercase tracking-wider font-ui">Sections</span>
          </div>
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => scrollToSection(section.id)}
                  className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-text hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 font-ui"
                >
                  <span className="w-1 h-1 rounded-full bg-accent/50" />
                  <span className="truncate">{section.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-text font-semibold mb-3">
            <span className="text-sm uppercase tracking-wider font-ui">Archive</span>
          </div>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#" className="text-text-secondary hover:text-accent transition-colors font-ui">ASEAN Trade Briefs</a>
            </li>
            <li>
              <a href="#" className="text-text-secondary hover:text-accent transition-colors font-ui">Tariff Monitoring</a>
            </li>
            <li>
              <a href="#" className="text-text-secondary hover:text-accent transition-colors font-ui">Diplomatic Actions</a>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
};
