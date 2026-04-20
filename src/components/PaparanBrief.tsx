import { useState, useEffect } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { ContextPanel } from "@/components/Layout/ContextPanel";
import { ScrollProgress } from "@/components/Layout/ScrollProgress";
import { Section } from "@/components/brief/Section";
import { ExecutiveSummary } from "@/components/brief/ExecutiveSummary";
import { CurrentSituation } from "@/components/brief/CurrentSituation";
import { DevelopmentsList } from "@/components/brief/DevelopmentsList";
import { StrategicImplications } from "@/components/brief/StrategicImplications";
import { RisksOpportunities } from "@/components/brief/RisksOpportunities";
import { ActionsList } from "@/components/brief/ActionsList";
import { SourcesList } from "@/components/brief/SourcesList";
import { Paparan, FilterType } from "@/types/paparan";

interface PaparanBriefProps {
  paparan: Paparan;
}

export const PaparanBrief: React.FC<PaparanBriefProps> = ({ paparan }) => {
  const [highlightMode, setHighlightMode] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isCopied, setIsCopied] = useState(false);

  const sections = [
    { id: "executive-summary", title: "Executive Summary" },
    { id: "current-situation", title: "Current Situation" },
    { id: "key-developments", title: "Key Developments" },
    { id: "strategic-implications", title: "Strategic Implications" },
    { id: "risks-opportunities", title: "Risks & Opportunities" },
    { id: "recommended-actions", title: "Recommended Actions" },
    { id: "sources", title: "Sources" },
  ];

  const highCount = paparan.developments.filter((d) => d.impact === "HIGH").length;

  const handleCopy = () => {
    const text = `
PAPARAN BRIEF — ${paparan.title}
${paparan.date} | ${paparan.region}

EXECUTIVE SUMMARY
${paparan.executiveSummary.map((item, i) => `${i + 1}. ${item}`).join("\n")}

CURRENT SITUATION
${paparan.currentSituation}

KEY DEVELOPMENTS
${paparan.developments.map((d) => `[${d.delta} | ${d.impact}] ${d.text}`).join("\n")}

STRATEGIC IMPLICATIONS
${paparan.implications}

RISKS
${paparan.risks.map((r, i) => `${i + 1}. ${r}`).join("\n")}

OPPORTUNITIES
${paparan.opportunities.map((o, i) => `${i + 1}. ${o}`).join("\n")}

RECOMMENDED ACTIONS
${paparan.actions.map((a, i) => `${i + 1}. [${a.priority}] ${a.text}`).join("\n")}

SOURCES
${paparan.sources.map((s, i) => `${i + 1}. ${s.title} (${s.confidence} confidence)`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExport = () => {
    window.print();
  };

  useEffect(() => {
    if (highlightMode) {
      document.body.classList.add("highlight-mode");
    } else {
      document.body.classList.remove("highlight-mode");
    }
  }, [highlightMode]);

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Header title={paparan.title} date={paparan.date} region={paparan.region} onCopy={handleCopy} onExport={handleExport} isCopied={isCopied} />

      <div className="max-w-[1920px] mx-auto">
        <div className="flex">
          <Sidebar
            highlightMode={highlightMode}
            onToggleHighlight={() => setHighlightMode(!highlightMode)}
            filter={filter}
            onFilterChange={setFilter}
            counts={{ all: paparan.developments.length, high: highCount }}
            sections={sections}
          />

          <main className="flex-1 min-w-0 max-w-[820px] mx-auto px-6 py-8 lg:px-12">
            <div className="mb-8">
              <p className="text-sm font-ui text-text-secondary uppercase tracking-widest mb-2">Policy Intelligence Brief</p>
              <h1 className="font-display text-4xl font-bold text-text mb-3 leading-tight">{paparan.title}</h1>
              <div className="flex items-center gap-4 text-sm text-text-secondary font-ui">
                <span className="font-medium">{paparan.region}</span>
                <span className="w-px h-4 bg-gray-300" />
                <time>{paparan.date}</time>
              </div>
            </div>

            <Section id="executive-summary" title="Executive Summary">
              <ExecutiveSummary items={paparan.executiveSummary} />
            </Section>

            <Section id="current-situation" title="Current Situation">
              <CurrentSituation text={paparan.currentSituation} />
            </Section>

            <Section id="key-developments" title="Key Developments">
              <DevelopmentsList developments={paparan.developments} filter={filter} highlightMode={highlightMode} onFilterChange={setFilter} />
            </Section>

            <Section id="strategic-implications" title="Strategic Implications">
              <StrategicImplications text={paparan.implications} />
            </Section>

            <Section id="risks-opportunities" title="Risks & Opportunities">
              <RisksOpportunities risks={paparan.risks} opportunities={paparan.opportunities} />
            </Section>

            <Section id="recommended-actions" title="Recommended Actions">
              <ActionsList actions={paparan.actions} />
            </Section>

            <Section id="sources" title="Sources">
              <SourcesList sources={paparan.sources} />
            </Section>

            <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-text-tertiary font-ui no-print">
              <p>Paparan Policy Intelligence Brief — {paparan.date}</p>
              <p className="mt-1">Generated by Paparan Brief — Confidential</p>
            </footer>
          </main>

          <ContextPanel paparan={paparan} />
        </div>
      </div>
    </div>
  );
};
