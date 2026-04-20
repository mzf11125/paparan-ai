import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const Section: React.FC<SectionProps> = ({ id, title, children, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section id={id} className="py-8 border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-lg"
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
      >
        <h2 className="font-display text-xl text-text font-semibold group-hover:text-accent transition-colors">{title}</h2>
        <ChevronDown
          className={`w-5 h-5 text-text-tertiary transition-transform duration-300 ${
            isExpanded ? "rotate-0" : "-rotate-90"
          }`}
          aria-hidden="true"
        />
      </button>
      <div
        id={`${id}-content`}
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? "max-h-[2000px] opacity-100 mt-6" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </section>
  );
};
