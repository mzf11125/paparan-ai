#!/bin/bash
# Install Claude Code skills for Paparan AI backend
# These skills provide specialized prompts for financial and government analysis

set -e

echo "🔧 Installing Claude Code skills for Paparan AI..."

# Financial services plugins (for Analyst Agent)
echo "📊 Installing financial-services-plugins..."
npx skills add anthropics/financial-services-plugins || echo "⚠️  Warning: Failed to install financial-services-plugins"

# Riksdagsmonitor - Swedish parliament monitoring (adapted for government intelligence)
echo "🏛️  Installing global-government-analysis skill..."
npx skills add https://github.com/hack23/riksdagsmonitor --skill global-government-analysis || echo "⚠️  Warning: Failed to install global-government-analysis"

echo "✅ Skills installation complete!"
echo ""
echo "Installed skills:"
echo "  - earnings-analysis: Financial earnings analysis"
echo "  - macro-rates-monitor: Macro economic rates monitoring"
echo "  - equity-research: Equity research analysis"
echo "  - competitive-analysis: Competitive landscape analysis"
echo "  - global-government-analysis: Government/parliamentary monitoring"
echo ""
echo "Skills are located in: .claude/skills/"
