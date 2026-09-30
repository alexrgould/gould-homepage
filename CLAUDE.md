# Gould Family Homepage

Static PWA hosted on GitHub Pages from `main`. No build step, no package.json, no tests. See README.md for features and setup.

## Files
- `index.html`: the main app's markup.
- `kitchen.html`: standalone kitchen display for the wall iPad. Only the display, cook mode and appliance/music panels. Sets `window.KITCHEN_PAGE = true` before loading `app.js`.
- `app.js`: all app logic (~5,700 lines), shared by both pages. `IS_KITCHEN` picks the boot path at the bottom. Guard any DOM lookup that only exists on one page.
- `app.css`: all styles, shared by both pages.
- `sw.js`: service worker, network-first, versioned cache. List new files in `ASSETS`.
- `manifest.json`, `kitchen-manifest.json`: PWA manifests (the kitchen one starts at `kitchen.html`).
- README mentions `claude-worker.js`, `anova-proxy-worker.js`, `firestore.rules`, and `rss-test.html`, but they are not in this repo. They are deployed separately (Cloudflare Workers, Firebase console).

## Rules for every change
- Any change to the app files ships with a version bump: `CACHE_NAME` in `sw.js` (`meal-planner-vN`) and `APP_VERSION` near the bottom of `app.js` (`'vN'`) must match. Otherwise installed devices keep the old cached app.
- Keep it plain files. Don't add frameworks, bundlers, or npm deps. External libs only via CDN `<script>` tags.
- Never hardcode secrets (Anthropic, Anova, Sonos, Google client secret). They live as Cloudflare Worker secrets or in the user's localStorage.
- All app state is the single `data` object synced to Firestore. Call `persist()` after mutating it; don't write to Firestore directly. `persist()` debounces and sets `savePending` so incoming snapshots don't clobber local edits.
- Claude API calls go through the Worker URL from Settings, not `api.anthropic.com` directly (CORS).
- Match the existing style: plain functions, template-string HTML, compact code.
- Update README.md when a user-visible feature changes.

## Checking a change
Syntax-check the script (no other automated checks exist):

```bash
node --check app.js
```

To see it run: `python3 -m http.server 8000` and open `http://localhost:8000/` or `/kitchen.html`. Firebase, Google sign-in, and the Worker won't work from localhost without config, so UI checks are limited to what renders without sync.

## Git
- Feature work on a branch, PR into `main`. Merging to `main` deploys.
