import { useScrollProgress } from "@/hooks/useScrollProgress";

export const ScrollProgress: React.FC = () => {
  const progress = useScrollProgress();

  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-border no-print">
      <div
        className="h-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-100 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Document reading progress: ${Math.round(progress)}%`}
      />
    </div>
  );
};
