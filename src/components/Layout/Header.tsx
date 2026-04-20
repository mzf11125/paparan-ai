import { Copy, Download } from "lucide-react";

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
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 no-print">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-ui text-accent-dark uppercase tracking-widest">Confidential Briefing</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-ui text-text-secondary hover:text-text border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <Copy className="w-4 h-4" />
            {isCopied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-ui text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </header>
  );
};
