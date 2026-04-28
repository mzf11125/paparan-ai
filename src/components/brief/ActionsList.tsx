import { Priority } from "@/types/paparan";

interface ActionsListProps {
  actions: { priority: Priority; text: string; owner?: string; deadline?: string }[];
}

export const ActionsList: React.FC<ActionsListProps> = ({ actions }) => {
  const priorityConfig = {
    HIGH: { variant: "bg-delta-escalated/20 text-delta-escalated border-delta-escalated/30", label: "HIGH" },
    MEDIUM: { variant: "bg-amber-100 text-amber-700 border-amber-200", label: "MED" },
    LOW: { variant: "bg-bg-surface text-text-tertiary border-border", label: "LOW" },
  } as const;

  return (
    <ol className="space-y-5">
      {actions.map((action, i) => (
        <li key={i} className="flex gap-4">
          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-accent text-white text-sm font-semibold rounded-md shadow-sm">
            {i + 1}
          </span>
          <div className="flex-1">
            <p className="text-document-base leading-relaxed font-body">{action.text}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold font-ui rounded border ${priorityConfig[action.priority].variant}`}>
                {priorityConfig[action.priority].label} PRIORITY
              </span>
              {action.owner && <span className="text-xs text-text-secondary font-ui">Owner: {action.owner}</span>}
              {action.deadline && <span className="text-xs text-text-secondary font-ui">Due: {action.deadline}</span>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};
