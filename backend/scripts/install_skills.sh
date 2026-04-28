#!/bin/bash
set -e
echo "Installing Claude Code skills..."
npx skills add anthropics/financial-services-plugins
npx skills add https://github.com/hack23/riksdagsmonitor --skill global-government-analysis
echo "Skills installed."
