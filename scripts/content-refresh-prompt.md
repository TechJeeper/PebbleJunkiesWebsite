# Pebble Junkies — scheduled content refresh

You are updating the **Pebble Junkies** static site (Astro + GitHub Pages) so it stays the one-stop shop for classic and new Pebbles.

## Hard rules

- Edit **data + copy only** unless a page template is clearly broken for new fields.
- Prefer updating JSON under `src/data/` and short page copy; keep the existing design system (`src/styles/`, layouts, components).
- Do **not** invent fake product prices, ship dates, or part numbers. If unsure, keep the old value and note uncertainty in the PR body / commit message.
- Do **not** remove curated manual news items that lack `"auto": true`.
- Do **not** commit secrets, API keys, or `.env` files.
- Keep the site building: `npm run build` should still succeed.
- Attribute sources with real URLs (rePebble blog, Rebble, Bluesky, iFixit, Wikipedia, store API).

## Sources to check (live)

1. https://repebble.com/watch — new hardware status, prices, specs (Time 2, Round 2, Duo, Index if relevant)
2. https://repebble.com/blog and https://repebble.com/blog/rss
3. https://bsky.app/profile/ericmigi.com — Eric Migicovsky updates
4. https://rebble.io/ — Rebble ecosystem posts
5. https://appstore-api.repebble.com/ — top apps / watchfaces:
   - `/api/v1/apps/collection/most-loved/watchapps-and-companions?limit=12`
   - `/api/v1/apps/collection/most-loved/watchfaces?limit=12`
   - Also useful: `top-used`, `top-hearted` with `hardware=emery` when filtering for Time 2
6. Repair: iFixit Pebble guides/parts, community repair notes (Discord/Reddit mentions only if you can cite a public URL)
7. https://developer.repebble.com/ — notable SDK / PebbleOS changes worth mentioning on Developers or News

## Files to update

| File | What to refresh |
| --- | --- |
| `src/data/watches.json` | Status pills, prices, battery claims, shop links, new models |
| `src/data/timeline.json` | Add milestones only when a clear public event happened; never rewrite history casually |
| `src/data/news.json` | Merge fresh items; keep ids stable when possible; mark bot-fetched items with `"auto": true` |
| `src/data/apps.json` | Replace kits with top store picks: title, author, hearts, short description, store URL, screenshot if available |
| `src/data/repairs.json` | New part numbers, guides, services — only with citations |
| `src/pages/news.astro` / `apps.astro` / `watches.astro` | Only if the UI needs a small tweak to show new fields |
| `README.md` | Only if automation docs drifted |

## Apps data shape (target)

Write `src/data/apps.json` roughly like:

```json
{
  "updatedAt": "YYYY-MM-DD",
  "stores": [ { "label": "...", "href": "..." } ],
  "notes": ["..."],
  "watchapps": [
    {
      "id": "...",
      "rank": 1,
      "title": "...",
      "author": "...",
      "hearts": 0,
      "category": "...",
      "description": "2–4 sentence Junkies-voice summary of what it does and why people love it",
      "href": "https://apps.repebble.com/...",
      "image": "https://...",
      "platforms": ["emery", "basalt"]
    }
  ],
  "watchfaces": [ { "...same fields..." } ]
}
```

If the store API field names differ, map them cleanly. Descriptions should be readable site copy, not a raw dump of the entire listing.

## Process

1. Research the live sources above.
2. Update the JSON files with accurate changes.
3. Adjust `src/pages/apps.astro` if needed so watchapps + watchfaces render as a rich card UI (image, rank, hearts, description, store link).
4. Run `npm run build` and fix any breakages you introduced.
5. Commit with a clear message like `chore(content): scheduled pulse refresh` and open/keep the PR.

## Voice

Keep Pebble Junkies tone: enthusiastic community hub, honest about rough edges, not corporate marketing, not claiming to be Core Devices or Rebble.
