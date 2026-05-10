import { Copy, Download, Check } from "lucide-react";
import { cn } from "@/utils/cn";

interface HeaderProps {
  title: string;
  date: string;
  region: string;
  onCopy: () => void;
  onExport: () => void;
  isCopied: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onCopy, onExport, isCopied }) => {
  return (
    <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-6 py-4 no-print">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary motion-safe:animate-pulse-slow" aria-hidden="true" />
          <span className="editorial-eyebrow text-primary">Confidential Briefing</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-ui rounded-md border transition-colors duration-fast',
              isCopied
                ? 'bg-success/10 text-success border-success/30'
                : 'text-text-secondary border-border hover:text-text hover:bg-bg-subtle hover:border-border-strong',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
            )}
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {isCopied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={onExport}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-ui font-semibold rounded-md',
              'text-bg bg-primary hover:bg-primary-hover transition-colors duration-fast',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
            )}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </header>
  );
};
