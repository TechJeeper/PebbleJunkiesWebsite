# Pebble Junkies

The one-stop community hub for classic and new Pebble smartwatches.

**Live:** [pebblejunkies.com](https://pebblejunkies.com)

## Stack

- [Astro](https://astro.build) static site
- GitHub Pages deploy (custom domain via `public/CNAME`)
- Editable JSON content in `src/data/`

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Content

| File | Purpose |
| --- | --- |
| `src/data/timeline.json` | Interactive timeline milestones |
| `src/data/watches.json` | New + classic catalog |
| `src/data/news.json` | Curated + auto news pulse |
| `src/data/apps.json` | Most Loved store charts (watchapps + watchfaces) |
| `src/data/repairs.json` | Parts, docs, services |

## News + RSS

- Public feed: [`/rss.xml`](https://pebblejunkies.com/rss.xml)
- Refresh locally: `npm run update-news`
- Sources: Bluesky `@ericmigi.com` (Pebble-related posts), `https://repebble.com/blog/rss`, Rebble feeds when available
- Manual entries in `news.json` (without `"auto": true`) are never overwritten

## Full content refresh (Cursor agent)

Weekly GitHub Action (Mondays) launches a **Cursor cloud agent** (your API key) to research live Pebble sources and update:

- `src/data/watches.json`, `timeline.json`, `news.json`, `apps.json`, `repairs.json`
- Apps page UI when the store top lists change

Workflow: `.github/workflows/refresh-content.yml`  
Prompt: `scripts/content-refresh-prompt.md`  
Script: `npm run refresh-content` (opens a PR by default)

### One-time setup

1. Create a Cursor API key at [cursor.com/dashboard/integrations](https://cursor.com/dashboard/integrations)
2. In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `CURSOR_API_KEY`
   - Value: your key (never commit it)
3. Ensure the **Cursor GitHub App** can access this repo (needed for cloud agents / PRs)
4. Run **Actions → Refresh site content (Cursor agent) → Run workflow** once to verify

Local dry-run of the prompt only:

```bash
npm run refresh-content:dry
```

## Deploy

Push to `main`/`master`. `.github/workflows/deploy.yml` refreshes news, builds, and publishes to GitHub Pages.

Nightly scrapers / agents:

| Time (UTC) | Workflow | What it does |
| --- | --- | --- |
| Daily 06:15 | `update-news.yml` | Deterministic Bluesky + blog RSS → `news.json` commit |
| Mondays 07:00 | `refresh-content.yml` | Cursor agent deep refresh → PR |

Enable Pages → GitHub Actions in repo settings if needed.
