# Gould Family Homepage

Single-file PWA hosted on GitHub Pages from `main`. No build step, no package.json, no tests. See README.md for features and setup.

## Files
- `index.html`: the whole app. CSS in the `<style>` block near the top, markup, then one big inline `<script>` (~5,700 lines) at the bottom.
- `sw.js`: service worker, network-first, versioned cache.
- `manifest.json`: PWA manifest.
- README mentions `claude-worker.js`, `anova-proxy-worker.js`, `firestore.rules`, and `rss-test.html`, but they are not in this repo. They are deployed separately (Cloudflare Workers, Firebase console).

## Rules for every change
- Any change to `index.html` or `sw.js` ships with a version bump: `CACHE_NAME` in `sw.js` (`meal-planner-vN`) and `APP_VERSION` near the bottom of `index.html` (`'vN'`) must match. Otherwise installed devices keep the old cached app.
- Keep it one file. Don't add frameworks, bundlers, or npm deps. External libs only via CDN `<script>` tags.
- Never hardcode secrets (Anthropic, Anova, Sonos, Google client secret). They live as Cloudflare Worker secrets or in the user's localStorage.
- All app state is the single `data` object synced to Firestore. Call `persist()` after mutating it; don't write to Firestore directly. `persist()` debounces and sets `savePending` so incoming snapshots don't clobber local edits.
- Claude API calls go through the Worker URL from Settings, not `api.anthropic.com` directly (CORS).
- Match the existing style: plain functions, template-string HTML, compact code.
- Update README.md when a user-visible feature changes.

## Checking a change
Syntax-check the inline script (no other automated checks exist):

```bash
awk '/^<script>$/{f=1;next} /^<\/script>$/{f=0} f' index.html > /tmp/app.js && node --check /tmp/app.js
```

To see it run: `python3 -m http.server 8000` and open `http://localhost:8000/`. Firebase, Google sign-in, and the Worker won't work from localhost without config, so UI checks are limited to what renders without sync.

## Git
- Feature work on a branch, PR into `main`. Merging to `main` deploys.
