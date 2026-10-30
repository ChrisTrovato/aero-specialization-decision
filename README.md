# The Frontier Atlas

An interactive aerospace career explorer for a prospective 2033+ graduate. It connects 26 major specialties and 140 nested niches to real work, organizations, education routes, tradeoffs, and conditional 2034–2050 scenarios.

**Live:** https://www.christrovato.com/aero_specialization_decision

The central recommendation is spacecraft mechanisms and robotics, supported by dynamics, controls, and hands-on validation. The explorer also covers propulsion, habitats, thermal systems, power, avionics, manufacturing, ocean robotics, defense engineering, humanoids, and human spaceflight pathways.

## Explore

- Search and filter specialties by engineering family or interest.
- Open detailed field notes with work, deeper niches, degree routes, companies, benefits, costs, and sources.
- Compare up to three specialties.
- Save a shortlist and decision notes locally, with JSON export.
- Explore four interactive mission maps and six personal routes.
- Distinguish ground-based space careers from scarce crew-selection paths.
- Search the employer map and 112 reference records. Some records share a URL.

## Run locally

This is buildless HTML, CSS, and JavaScript with no runtime packages.

```sh
python -m http.server 8843 --directory dist --bind 127.0.0.1
```

Open `http://127.0.0.1:8843`. Google Fonts are optional; system fonts provide a fallback. For production the HTML sets an asset base only when served under `/aero_specialization_decision`. Internal hash navigation stays on the current path.

```sh
node check.mjs
```

The checker validates content integrity, citations, HTTPS links, JavaScript syntax, linked files, and accidental personal-data patterns. It does not claim to validate remote link availability or replace browser checks.

## Source layout

- `dist/index.html`: application shell and production asset base.
- `dist/styles.css`: responsive visual system.
- `dist/app.js`: routing, filters, dialogs, comparisons, local notes, and exports.
- `dist/data.js`: sourced specialty profiles and research records.
- `dist/editorial.js`: recommendations, scenarios, routes, and learning connections.
- `check.mjs`: offline integrity checks.
- `docs/DEPLOYMENT.md`: integration with the existing Vercel portfolio.
- `WORK_LOG.md`: dated project changes and verification.

## Research boundaries

Research snapshot: **30 October 2026**. Official agency, university, labor-statistics, research, and company sources support current facts. Company roadmaps are plans, not completed missions or guaranteed future employers. Career rankings are personal-fit judgments. Future scenarios are not forecasts of salary, hiring volume, or selection probability.

Current salary figures are U.S. May 2025 occupational medians across experience levels. They are not graduate starting salaries or 2034 offers. NASA astronaut requirements are dated and must be rechecked for future selection cycles.

Public source contains the website and its research synthesis. Original private conversations, family details, and unrelated workspace files are excluded. Saved notes stay in the visitor’s browser and are not sent to a server.
