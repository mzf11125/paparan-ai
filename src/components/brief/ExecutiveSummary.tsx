interface ExecutiveSummaryProps {
  items: string[];
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ items }) => {
  return (
    <ul className="space-y-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
          <span className="text-accent text-lg leading-relaxed" aria-hidden="true">—</span>
          <span className="text-document-base leading-relaxed font-body flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
};
