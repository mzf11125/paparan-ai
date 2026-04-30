High-Value Bellingcat Categories for Paparan.ai
🛰️ Maps & Satellites → Spatial Policy Agent
Most relevant for ASEAN. Policy decisions have geography — infrastructure corridors, maritime disputes, deforestation zones, flood-affected districts. Right now Paparan has zero spatial awareness.
What to add:

Google Earth / Sentinel Hub integration — pull satellite imagery for a policy area (e.g. IKN construction progress, South China Sea developments)
OpenStreetMap — geocode policy locations mentioned in briefs
Output: every brief gets a spatial_context field — affected regions, coordinates, map embed

Concrete agent tool: geolocate_policy_area(brief_text) → {coordinates, region, map_url}

✈️ Transport → Strategic Movement Agent
Critical for ASEAN diplomatic intelligence.

MarineTraffic — track vessel movements in contested waters (South China Sea, Malacca Strait), relevant for trade policy briefs
FlightAware / Flightradar24 — diplomatic flight patterns (which ministers are flying where) as soft signals for upcoming negotiations

Concrete agent tool: track_maritime_activity(region, date_range) → {vessel_count, anomalies, source_url}

💹 Companies & Finance → Corporate Actor Agent
Policy doesn't happen in a vacuum — companies lobby and shape it.

OpenCorporates — identify corporate entities named in policy documents, check registrations across ASEAN jurisdictions
EDGAR — for US-listed companies with ASEAN exposure
Useful for: who benefits from this infrastructure contract? Who owns the concession?

Concrete agent tool: identify_corporate_actors(policy_text) → [{company, jurisdiction, registration_id}]

🌿 Environment & Wildlife → Environmental Policy Agent
Huge for Indonesia specifically — deforestation, fishing, palm oil, carbon credits.

Global Forest Watch — deforestation alerts by region, ties directly to Bappenas planning data
Global Fishing Watch — illegal fishing in Indonesian waters, relevant for maritime policy
FIRMS — fire/hotspot data for haze policy (Singapore-Indonesia relations)

Concrete agent tool: get_environmental_indicators(region) → {deforestation_rate, fire_alerts, fishing_anomalies}

🗂️ Archiving → Source Preservation Agent
This one is underrated. Government pages disappear, ministers delete statements.

Auto Archiver / Wayback Machine — when the scraper ingests a source, auto-archive it to Wayback Machine or archive.today
Gives every brief a archived_sources list — the intelligence doesn't disappear

Concrete agent tool: archive_source(url) → {archive_url, timestamp}

📊 Data Org & Analysis → Conflict & Event Data Agent

ACLED — Armed Conflict Location & Event Data, has ASEAN coverage. Relevant for Myanmar, Philippines, Papua policy briefs
Datawrapper — generate embeddable charts from policy data directly in briefs


What to Skip (for now)
CategoryWhy SkipImage/Video verificationNot relevant to text-based policy briefsPeople/OSINT (Sherlock, Blackbird)Privacy concerns, out of scopeSocial Media scrapingTavily already covers this indirectlyGeohints / SuncalcToo tactical for policy work