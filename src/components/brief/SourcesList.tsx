import { SourceTooltip } from "@/components/ui/SourceTooltip";
import { Source } from "@/types/paparan";

interface SourcesListProps {
  sources: Source[];
}

export const SourcesList: React.FC<SourcesListProps> = ({ sources }) => {
  const typeConfig = {
    government: { variant: "bg-blue-100 text-blue-700 border-blue-200", label: "GOV" },
    news: { variant: "bg-amber-100 text-amber-700 border-amber-200", label: "NEWS" },
    research: { variant: "bg-purple-100 text-purple-700 border-purple-200", label: "RSCH" },
  } as const;

  return (
    <div className="space-y-4">
      {sources.map((source, i) => (
        <article key={i} className="flex items-start gap-3">
          <span className="text-text-tertiary shrink-0 font-ui text-sm">[{i + 1}]</span>
          <div className="flex-1 min-w-0">
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-text hover:text-accent transition-colors underline decoration-1 underline-offset-2 font-display"
              >
                {source.title}
              </a>
            ) : (
              <span className="font-medium text-text font-display">{source.title}</span>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <SourceTooltip title={source.title} confidence={source.confidence} date={source.date}>
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold font-ui rounded border ${typeConfig[source.url?.includes("gov") ? "government" : source.url?.includes("reuters") || source.url?.includes("jakarta") ? "news" : "research"].variant}`}>
                  {typeConfig[source.url?.includes("gov") ? "government" : source.url?.includes("reuters") || source.url?.includes("jakarta") ? "news" : "research"].label}
                </span>
              </SourceTooltip>
              <span className="text-xs text-text-tertiary font-ui">{source.date}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};
