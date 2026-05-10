import { Filter } from "lucide-react";
import { cn } from "@/utils/cn";
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
  activeSection?: string;
}

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
  activeSection,
}) => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="w-60 shrink-0 hidden lg:block no-print">
      <div className="sticky top-20 space-y-6">
        {/* Filter Card */}
        <div className="bg-bg-elevated border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-2 text-text font-semibold mb-4">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm uppercase tracking-wider font-ui">Filter</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-2 block font-ui">Developments</label>
              <FilterButtons currentFilter={filter} onFilterChange={onFilterChange} counts={counts} />
            </div>
            <div className="pt-4 border-t border-border">
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

        {/* Sections Navigation */}
        <nav className="bg-bg-elevated border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200" aria-label="Document sections">
          <div className="flex items-center gap-2 text-text font-semibold mb-4">
            <span className="text-sm uppercase tracking-wider font-ui">Sections</span>
          </div>
          <ul className="space-y-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      // Base styles
                      'w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2 font-ui',
                      // Transition
                      'transition-all duration-200 ease-out',
                      // Active state
                      isActive
                        ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                        : 'text-text-secondary hover:text-text hover:bg-bg-surface',
                      // Focus
                      'focus:outline-none focus:ring-2 focus:ring-primary/20',
                      // Active scale
                      'active:scale-[0.98]'
                    )}
                  >
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full transition-colors duration-200',
                      isActive ? 'bg-primary' : 'bg-border-strong',
                    )} />
                    <span className="truncate">{section.title}</span>
                    {/* Active indicator glow */}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Archive Links */}
        <div className="bg-bg-elevated border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-2 text-text font-semibold mb-3">
            <span className="text-sm uppercase tracking-wider font-ui">Archive</span>
          </div>
          <ul className="space-y-2 text-sm">
            {[
              { label: 'ASEAN Trade Briefs', href: '#' },
              { label: 'Tariff Monitoring', href: '#' },
              { label: 'Diplomatic Actions', href: '#' },
            ].map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className={cn(
                    // Base styles
                    'text-text-secondary font-ui block px-2 py-1 rounded-lg',
                    // Transition
                    'transition-all duration-200 ease-out',
                    // Hover states
                    'hover:text-primary hover:bg-primary/5 hover:translate-x-1',
                    // Active state
                    'active:translate-x-0'
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};
