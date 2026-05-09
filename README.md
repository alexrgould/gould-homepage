# Gould Family Homepage

A single-file Progressive Web App for family meal planning, grocery lists, parenting tools, and more — powered by Firebase real-time sync and Claude AI.

Built to run on **GitHub Pages** with no build step. Open `index.html` in a browser and you're live.

---

## Features

### Meal Planning
- **Weekly meal planner** with drag-and-drop recipe assignment across 7 days (dinner-focused)
- **Auto-fill meal plan** — randomly assigns recipes from your book, respecting cuisine variety and avoiding recent repeats
- **Smart Meal Planning (Claude AI)** — sends your recipe book, family ratings, recent meals, kids' ages, and current season to Claude for intelligent weekly picks
- **Cuisine filters** — filter recipes by cuisine when browsing or planning
- **Usage history** — tracks when each recipe was last made to avoid repetition

### Recipe Book
- **Full recipe management** — add, edit, delete recipes with name, cuisine, prep time, and ingredients
- **Ingredient list** per recipe with automatic grocery list integration
- **Family star ratings** — rate recipes 1-5 stars; ratings influence smart meal planning
- **Cuisine grouping** — recipes are organized by cuisine with collapsible groups
- **Recipe search** — filter recipes by name
- **URL import** — paste a recipe URL to auto-extract name, ingredients, and instructions via CORS proxy
- **Recipe Discovery** — built-in suggested recipes you can add to your book with one tap

### Recipe Chat (Claude AI)
- **Conversational recipe assistant** — ask questions about recipes, get cooking tips, request modifications
- **Context-aware** — the chat knows your full recipe book
- **Ingredient substitutions** — tap any ingredient in a recipe to get AI-suggested substitutes; "Use this" applies the swap in-place, automatically updating your grocery list

### Grocery List
- **Auto-generated** from your meal plan — pulls ingredients from all planned recipes for the selected date range
- **Configurable date range** — choose "Today onwards", "Full week", or a custom start/end date so previous days' items don't bleed in
- **Categorized** by aisle: Produce, Meat & Seafood, Dairy, Bakery, Pantry, Frozen, Beverages, Other
- **Checkable items** with strike-through — checked state syncs across devices in real time
- **Grocery extras** — add one-off items that aren't tied to a recipe
- **Staples list** — maintain a list of always-buy items that appear on every grocery run

### Google Calendar Integration
- **OAuth2 sign-in** — connect your Google Calendar directly in the app
- **Today's events** shown on the home screen with time and title
- **Calendar summaries (Claude AI)** — AI generates a natural-language summary of your day plus family logistics tips, cached per day

### Parenting Tools

#### AI-Powered Parenting Tips
- **Claude-generated tips** — personalized for your children's ages, your parenting philosophy, active consequences, and day of week
- **Batch generation** — generates 6 tips at a time, cyclable with Prev/Next buttons
- **Refresh button** — get a fresh batch of tips anytime
- **Links to parenting chat** for deeper follow-up questions

#### Parenting Advice Chat (Claude AI)
- **Dedicated parenting chat** — separate from the recipe chat
- **Context-aware** — knows your children's ages, your parenting philosophy, and active/resolved consequences
- **Evidence-based** — gives specific phrases to say and strategies to try, aligned with your stated philosophy

#### Consequences Tracker
- **Log consequences** with child name, description, duration, and start date
- **Active/resolved tracking** — mark consequences as resolved when complete
- **Integrated with AI** — active consequences inform both parenting tips and chat advice

#### Parenting Philosophy
- **Configurable in Settings** — write your family's parenting philosophy
- **Feeds into all AI features** — tips, chat, and calendar summaries align with your stated approach

### Weather Forecast
- **7-day forecast** on the home screen via Open-Meteo API (free, no API key needed)
- **Browser geolocation** — automatically fetches weather for your location
- **WMO weather codes** mapped to emoji icons with temperatures and rain probability
- **30-minute cache** to avoid excessive API calls

### Blog Feed Reader
- **Follow food blogs** — add blog URLs in Settings
- **Auto-discovery** — finds RSS/Atom feeds from blog homepages
- **Multiple fetch strategies** — tries RSS-to-JSON services (rss2json, feed2json), then falls back to client-side XML parsing via CORS proxies
- **Feed diagnostics** — "Test Feeds" button in Settings shows which services work for each blog
- **Recent posts** displayed on the home screen with links

### DoorDash Budget Tracker
- **Monthly budget & order target** — set spending limits and target order count
- **Order logging** — track each DoorDash order with restaurant, amount, and date
- **Restaurant list** — save favorite restaurants with cuisine tags
- **Budget visualization** — progress bars for spending and order count

### Data & Sync
- **Firebase Firestore real-time sync** — all data syncs across devices instantly via `onSnapshot`
- **Family code** — share a code so all family members see the same data
- **Race condition protection** — `savePending` flag prevents incoming Firestore snapshots from overwriting local changes during the 600ms debounce window
- **Local storage backup** — data persists locally even without internet
- **Export/Import** — download your data as JSON or import from a backup
- **Calendar export** — export your meal plan as an `.ics` file

---

## Architecture

### Single-File PWA
The entire app is one `index.html` file (~3700 lines) containing all HTML, CSS, and JavaScript. No build tools, no frameworks, no dependencies beyond Firebase and Google APIs loaded from CDN.

### File Structure

```
meal-planner/
  index.html          # The entire app — HTML + CSS + JS
  sw.js               # Service worker (network-first caching)
  manifest.json       # PWA manifest for install-to-homescreen
  claude-worker.js    # Cloudflare Worker source for Claude API proxy
  rss-test.html       # Standalone RSS feed service diagnostic tool
  README.md           # This file
```

### Data Model

All app state lives in a single `data` object synced to Firestore:

```js
{
  recipes: [],          // { id, name, cuisine, prepTime, ingredients[], instructions }
  mealPlan: {},         // { "2026-05-09": "Recipe Name", ... }
  staples: [],          // ["Milk", "Eggs", ...]
  checkedItems: {},     // { "ingredient-hash": true, ... }
  children: [],         // { name, birthday }
  cuisines: [],         // ["Italian", "Mexican", ...]
  usageHistory: [],     // { recipe, date }
  doordash: {},         // { orders[], monthlyBudget, monthlyTarget, restaurants[] }
  consequences: [],     // { child, description, days, startDate, resolved }
  groceryExtras: [],    // ["Paper towels", ...]
  blogs: []             // { name, url, feedUrl? }
}
```

### Key Technical Patterns

**Firestore Sync with Race Condition Protection:**
```
User taps checkbox → persist() sets savePending=true → debounce 600ms → save to Firestore → savePending=false
                                                         ↓
                          onSnapshot fires with old data → blocked by savePending flag
```

**Claude API via Cloudflare Worker:**
Browser can't call the Anthropic API directly (CORS). A tiny Cloudflare Worker (`claude-worker.js`) acts as a CORS proxy — it forwards POST requests to `api.anthropic.com/v1/messages` and adds the necessary CORS headers to the response.

**RSS Feed Fetching (multi-strategy):**
1. Try RSS-to-JSON services (rss2json.com, feed2json)
2. If those fail, fetch raw XML via CORS proxy (corsproxy.io, allorigins, codetabs)
3. Parse XML client-side with `DOMParser`, handling both RSS 2.0 and Atom formats

---

## Setup

### 1. Firebase (required for multi-device sync)

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable **Firestore Database** in production mode
3. Copy your Firebase config into the `firebaseConfig` object in `index.html` (around line 600)
4. Set Firestore rules to allow read/write for your family code document

### 2. GitHub Pages (hosting)

1. Push this folder to a GitHub repo
2. Go to **Settings → Pages → Source: main branch**
3. Your app will be live at `https://yourusername.github.io/repo-name/`

### 3. Claude AI (optional — enables smart features)

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Deploy `claude-worker.js` to [Cloudflare Workers](https://dash.cloudflare.com) (free tier, 100k requests/day):
   - Go to Workers & Pages → Create → "Hello World" template
   - Replace the code with the contents of `claude-worker.js`
   - Deploy and copy the worker URL
3. In the app's **Settings → Claude AI**:
   - Paste your API key
   - Paste the Cloudflare Worker URL
   - Choose your preferred model (Haiku 4.5 is fast and cheap, Opus 4.6 is most capable)
   - Click "Test Connection" to verify

### 4. Google Calendar (optional)

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google Calendar API**
3. Create an **OAuth 2.0 Client ID** (Web application type)
4. Add your GitHub Pages URL as an authorized JavaScript origin
5. Replace the `GCAL_CLIENT_ID` in `index.html` with your client ID

### 5. USDA Nutrition API (optional)

1. Get a free API key from [fdc.nal.usda.gov](https://fdc.nal.usda.gov/api-guide)
2. Enter it in **Settings → Nutrition API Key**

---

## Claude AI Models

The app supports four Claude models, configurable in Settings:

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| **Haiku 4.5** | Fastest | Cheapest | Quick tips, substitutions, daily use |
| **Sonnet 4.5** | Fast | Moderate | Good balance of speed and quality |
| **Sonnet 4.6** | Fast | Moderate | Latest Sonnet, improved reasoning |
| **Opus 4.6** | Slower | Highest | Complex meal planning, nuanced parenting advice |

---

## Service Worker

The service worker (`sw.js`) uses a **network-first** caching strategy:

- Tries to fetch from the network first
- If successful, caches the response for offline use
- If the network fails, falls back to the cached version
- Firebase, Google APIs, and CORS proxy requests are excluded from caching

Cache is versioned (currently `meal-planner-v9`). Bumping the version name automatically clears old caches on the next visit.

---

## Development

No build step needed. Edit `index.html` and push to GitHub Pages. The service worker will pick up changes on the next page load (may require a refresh due to SW caching).

For local development, serve the folder with any static server:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

### Testing RSS Feeds

Open `rss-test.html` in a browser to test which RSS-to-JSON services and CORS proxies are working. This runs entirely client-side — the results depend on your browser and network.

---

## Privacy & Security

- **No server-side code** — the app is entirely client-side
- **API keys stay in your browser** — stored in `localStorage`, never sent anywhere except directly to their respective APIs (via CORS proxy for Claude)
- **Firebase data** is scoped to your family code — only people with the code can read/write
- **The Cloudflare Worker** only forwards requests to Anthropic's API — it doesn't log or store anything
