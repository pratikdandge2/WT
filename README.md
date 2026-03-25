<div align="center">

# 🛡️ ShieldBlock
### A Chrome Extension Ad Blocker — Built with Manifest V3

*Web Technology Subject Project*

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Manifest](https://img.shields.io/badge/manifest-v3-blue)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

</div>

---

## Table of Contents

1. [What is ShieldBlock?](#what-is-shieldblock)
2. [What It Blocks](#what-it-blocks)
3. [Features](#features)
4. [Installation](#installation)
5. [How to Use](#how-to-use)
6. [How It Works](#how-it-works)
7. [Architecture](#architecture)
8. [Project Structure](#project-structure)
9. [Component Deep-Dives](#component-deep-dives)
10. [Data Flows](#data-flows)
11. [How State is Stored](#how-state-is-stored)
12. [Message Passing Overview](#message-passing-overview)
13. [Extending ShieldBlock](#extending-shieldblock)
14. [Limitations](#limitations)
15. [Tech Stack](#tech-stack)

---

## What is ShieldBlock?

ShieldBlock is a fully featured browser extension that silently blocks ads, trackers, native sponsored content, sticky banners, and mid-article ads — before they ever appear on screen. It is built entirely with vanilla JavaScript, HTML, and CSS using Chrome's modern **Manifest V3** extension standard.

The extension works on **two independent layers** — one at the network level (blocking requests before they're even sent) and one at the DOM level (hiding ad containers already embedded in the page HTML). Together, these two layers cover ads that either layer alone would miss.

---

## What It Blocks

| Category | Examples |
|---|---|
| **Ad Network Requests** | Google Ads, DoubleClick, AppNexus, Criteo, Amazon DSP, Rubicon, PubMatic, OpenX and 30+ more |
| **Native / Sponsored Ads** | Taboola, Outbrain, Revcontent — the "Around the Web" widgets |
| **In-Content Banners** | Mid-article display ads, rectangle and leaderboard units |
| **Sticky / Anchor Ads** | Fixed bottom bars, floating overlays, adhesion units |
| **Cosmetic (DOM) Ads** | Ad containers, empty placeholder divs, ad iframes |
| **Tracker Pings** | QuantServe, Scoreboard, Google Analytics collect calls |

---

## Features

- **Global On/Off toggle** — persists across browser sessions
- **Per-site whitelist** — allow ads on sites you choose to support
- **Live statistics** — total blocked, blocked today, blocked on current tab
- **Toolbar badge** — shows `OFF` when disabled, clean when active
- **Instant CSS hide** — ads never flash before being removed
- **Dynamic ad protection** — catches ads injected after page load

---

## Installation

> **Requirements:** Google Chrome or Microsoft Edge (Chromium-based)

1. **Download** this repository as a ZIP and extract it to a folder on your computer
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer Mode** using the toggle in the top-right corner
4. Click **"Load unpacked"** and select the extracted project folder
5. ShieldBlock will appear in your extensions list — it is active immediately
6. **Pin it** to your toolbar by clicking the puzzle icon and pinning ShieldBlock for easy access

> No account needed. No sign-in. Works out of the box.

---

## How to Use

Once installed, ShieldBlock runs automatically in the background on every tab. Click the **ShieldBlock icon** in your toolbar to open the popup panel and control the extension.

---

### The Popup Panel

```
┌─────────────────────────────────────┐
│  🛡️ ShieldBlock        Ad Blocker  ●│  ← Header + Global Toggle
├─────────────────────────────────────┤
│  ● Protection Active                │  ← Status Bar
├──────────┬──────────┬───────────────┤
│  14,832  │   247    │      42       │
│  Total   │  Today   │   This Tab   │  ← Stats Panel
├─────────────────────────────────────┤
│  Current Site       news-site.com   │
│                     [ Allow Site ]  │  ← Per-site Whitelist Toggle
├─────────────────────────────────────┤
│  What We Block                      │
│  [Network Ads] [Native Ads] ...     │  ← Blocked Categories
├─────────────────────────────────────┤
│  Whitelist                       ▼  │  ← Expand to Manage Whitelist
├─────────────────────────────────────┤
│  ShieldBlock v1.0 · 50 rules active │  ← Footer
└─────────────────────────────────────┘
```

---

### 1. Turning Protection On or Off

The **toggle switch** in the top-right corner of the popup controls the extension globally.

| Toggle State | What Happens |
|---|---|
| **ON** (default) | All 50 network rules are active. Content scripts filter every page. Status bar shows green **"Protection Active"** |
| **OFF** | All network blocking is paused. Content scripts stop filtering. Status bar turns grey and shows **"Protection Disabled"**. Toolbar badge shows `OFF` |

> Your preference is saved automatically — the toggle state persists even after closing and reopening Chrome.

---

### 2. Understanding the Status Bar

The coloured bar just below the header shows your protection state at a glance.

| Colour | Message | Meaning |
|---|---|---|
| Green | Protection Active | ShieldBlock is running normally on this page |
| Amber | Site Whitelisted | This site is on your whitelist — ads are allowed here |
| Grey | Protection Disabled | The global toggle is turned off |

---

### 3. Reading Your Stats

The three stat cards show a live count of blocked ads and trackers.

| Card | What It Counts |
|---|---|
| **Total Blocked** | Every ad and tracker blocked since you installed ShieldBlock |
| **Today** | Ads blocked since midnight today — resets automatically each day |
| **This Tab** | Ads blocked on the tab you currently have open, since it was loaded |

---

### 4. Allowing Ads on a Specific Site

If you want to support a website by letting their ads through — for example, a favourite blog or an independent creator — you can whitelist just that one site without disabling ShieldBlock everywhere else.

**To whitelist the current site:**
1. Navigate to the site you want to allow
2. Open the ShieldBlock popup — the domain is shown under **"Current Site"**
3. Click **"Allow Site"**
4. The status bar turns amber and shows **"Site Whitelisted"**
5. Refresh the page — ads will now load normally on that domain only

**To remove a site from the whitelist:**
1. Open the popup while on the whitelisted site
2. The button now reads **"Remove"** — click it
3. Protection is restored for that site immediately

> Whitelisting one site has no effect on any other site. All other pages remain fully protected.

---

### 5. Managing the Full Whitelist

To view and manage all whitelisted sites at once:

1. Open the popup
2. Click the **Whitelist ▼** row at the bottom to expand the panel
3. Every whitelisted domain is listed — each has a **×** button to remove it
4. To manually add any domain without visiting it, type it in the input field (e.g. `example.com`) and click **Add**

```
┌─────────────────────────────────────┐
│  Whitelist                       ▲  │
│ ┌───────────────────────────────┐   │
│ │  news-site.com            [×] │   │
│ │  my-favourite-blog.com    [×] │   │
│ └───────────────────────────────┘   │
│  [ example.com              ] [Add] │
└─────────────────────────────────────┘
```

---

### 6. Quick Reference

| I want to… | How to do it |
|---|---|
| Pause all ad blocking | Toggle OFF in the popup header |
| Allow ads on one site only | Click "Allow Site" while on that site |
| Re-enable blocking on a whitelisted site | Click "Remove" while on that site |
| See how many ads were blocked today | Check the "Today" card in the popup |
| Add a site to the whitelist without visiting it | Expand Whitelist panel → type domain → Add |
| Remove a domain from the whitelist | Expand Whitelist panel → click × next to the domain |

---

## How It Works

### The Two-Layer Approach

```
 User visits a webpage
         │
         ▼
┌────────────────────────────────────────────┐
│  LAYER 1 — Network Blocking                │
│                                            │
│  Before the browser even sends a request,  │
│  Chrome checks it against 50 blocking      │
│  rules. Matching ad network URLs are       │
│  dropped instantly — saving bandwidth      │
│  and preventing tracking entirely.         │
└───────────────────┬────────────────────────┘
                    │ (same-domain ads pass through)
                    ▼
┌────────────────────────────────────────────┐
│  LAYER 2 — DOM / Cosmetic Filtering        │
│                                            │
│  As the page loads, ShieldBlock scans      │
│  the HTML for ~100 known ad container      │
│  selectors and hides them. A live          │
│  observer then watches for any new ad      │
│  elements injected after load.             │
└───────────────────┬────────────────────────┘
                    │
                    ▼
           Clean, ad-free page ✓
```

---

## Architecture

ShieldBlock follows Chrome's required **multi-process architecture** for extensions. Three separate contexts run independently and communicate only via Chrome's message-passing system — they cannot share memory directly.

```
╔══════════════════════════════════════════════════════════╗
║               SHIELDBLOCK EXTENSION RUNTIME              ║
║                                                          ║
║   ┌─────────────────────┐   ┌────────────────────────┐  ║
║   │   background.js     │◄──►│  popup.html / js       │  ║
║   │   (Service Worker)  │   │  (Toolbar UI)          │  ║
║   │                     │   │                        │  ║
║   │ • Manages on/off    │   │ • Toggle protection    │  ║
║   │ • Manages whitelist │   │ • Whitelist a site     │  ║
║   │ • Tracks stats      │   │ • View stats           │  ║
║   │ • Controls network  │   │ • Manage whitelist     │  ║
║   │   blocking rules    │   └────────────────────────┘  ║
║   └──────────┬──────────┘                               ║
║              │  message passing                          ║
║              ▼                                           ║
║   ┌──────────────────────┐                              ║
║   │   content.js         │  ← runs inside every webpage ║
║   │   (Content Script)   │                              ║
║   │                      │                              ║
║   │ • Hides ad elements  │                              ║
║   │ • Watches for new ads│                              ║
║   │ • Detects sticky ads │                              ║
║   └──────────────────────┘                              ║
║                                                          ║
║   ┌──────────────────────────────────────────────────┐  ║
║   │  declarativeNetRequest API  (rules.json)         │  ║
║   │  Blocks requests before they hit the network     │  ║
║   └──────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════╝
```

---

## Project Structure

```
ShieldBlock/
│
├── manifest.json        ← Extension config, permissions, entry points
├── rules.json           ← 50 network-level blocking rules
│
├── background.js        ← Service worker: state, whitelist, stats, DNR rules
│
├── content.js           ← DOM filtering: selector hide, MutationObserver, sticky detection
├── content.css          ← Instant CSS hide (runs before JS)
├── cosmetic.css         ← Additional cosmetic selector rules
│
├── popup.html           ← Toolbar popup UI layout
├── popup.css            ← Popup styles and animations
├── popup.js             ← Popup logic and message handling
│
└── icons/               ← Extension icons (16px, 48px, 128px)
```

---

## Component Deep-Dives

### `manifest.json` — The Entry Point
Every Chrome Extension starts here. It declares what permissions the extension needs, which scripts to run, when to run them, and what UI to show. ShieldBlock requests only what it needs — no access to page content beyond what is required to hide ads.

---

### `background.js` — The Brain
Runs as a **Service Worker** in the background (not a visible page). It holds all the stateful logic:

- Stores whether the extension is enabled or disabled
- Maintains the whitelist of user-trusted domains
- Counts how many ads have been blocked (total, today, per tab)
- Communicates with Chrome's network API to enable/disable blocking rules
- When a site is whitelisted, it creates a special high-priority **"allow" rule** that overrides all blocking rules for that domain

---

### `content.js` — The Page Filter
Injected invisibly into every webpage the user visits. It runs three filtering passes:

**Pass 1 — Selector Scan**
Checks the page DOM against a list of ~100 known CSS selectors used by ad networks (class names, IDs, data attributes, iframe sources). Any matching element is immediately hidden.

**Pass 2 — MutationObserver**
Many modern sites load ads *after* the initial page render via JavaScript. A `MutationObserver` watches the entire DOM tree for newly added elements and re-runs the selector scan whenever changes are detected — with a small debounce to avoid performance issues.

**Pass 3 — Sticky Ad Heuristic**
Uses computed CSS styles to detect elements that are `fixed` or `sticky` positioned, anchored near the bottom of the screen, and whose class or ID names contain ad-related keywords. These floating overlay ads are hidden regardless of whether they match a known selector.

---

### `cosmetic.css` — The Flash Preventer
Pure CSS injected at `document_start` — meaning it runs *before* the page HTML is even parsed. This prevents the brief "flash" where an ad appears for a fraction of a second before JavaScript hides it. It is a thin but important first line of visual defence.

---

### `popup.html / popup.js` — The UI
The panel that opens when you click the ShieldBlock icon. It fetches fresh state from the background service worker every time it opens, so the numbers and toggles always reflect reality. All user actions (toggle, whitelist) are sent as messages to the background script — the popup never directly touches storage.

---

### `rules.json` — Network Rules
A static list of 50 blocking rules in Chrome's `declarativeNetRequest` format. Each rule targets a specific ad or tracker domain and drops all requests to it (scripts, images, iframes, AJAX calls) before they leave the browser. These rules are evaluated natively by Chrome — faster and more private than JavaScript-based blocking.

---

## Data Flows

### Blocking an Ad

```
1. Browser is about to request a script from doubleclick.net
2. Chrome checks rules.json → match found → request BLOCKED
3. background.js is notified → increments blocked counter
4. Page HTML loads → content.js scans for ad containers
5. Empty banner divs are hidden so the layout stays clean
```

### Whitelisting a Site

```
1. User opens popup and clicks "Allow Site"
2. popup.js sends ADD_WHITELIST message to background.js
3. background.js saves domain to storage
4. background.js creates a high-priority "allow" rule via Chrome API
   (this allow rule overrides all block rules for that domain)
5. background.js tells content.js on the active tab to stop filtering
6. content.js restores all previously hidden elements
7. User refreshes → ads load normally on that site
```

---

## How State is Stored

ShieldBlock stores everything locally in the browser — nothing is ever sent to an external server.

| What | Where | Persists |
|---|---|---|
| On/Off toggle | `chrome.storage.local` | Across restarts |
| Whitelist domains | `chrome.storage.local` | Across restarts |
| Total & daily stats | `chrome.storage.local` | Across restarts |
| Per-tab block count | `chrome.storage.session` | Cleared on tab close |

The daily counter automatically resets at midnight by comparing the stored reset date to the current date each time an ad is blocked.

---

## Message Passing Overview

Since the three contexts (background, content script, popup) are isolated from each other, all communication happens through Chrome's messaging system.

| Message | From → To | Purpose |
|---|---|---|
| `GET_STATE` | Popup → Background | Fetch current status for UI render |
| `TOGGLE_ENABLED` | Popup → Background | Flip global on/off switch |
| `ADD_WHITELIST` | Popup → Background | Whitelist a domain |
| `REMOVE_WHITELIST` | Popup → Background | Remove a domain from whitelist |
| `GET_TAB_STATS` | Popup → Background | Get block count for current tab |
| `AD_BLOCKED` | Content → Background | Report a hidden ad (increment counter) |
| `STATE_CHANGED` | Background → Content | Notify tab of enable/disable change |

---

## Extending ShieldBlock

**To block a new ad domain** — add a new entry to `rules.json` following the existing rule format. Each rule needs a unique ID and specifies which domain to block and what types of requests to drop. Reload the unpacked extension in `chrome://extensions` to apply.

**To hide a new ad container** — add its CSS selector to the `AD_SELECTORS` array in `content.js`. This can be a class name, ID, data attribute, or any valid CSS selector.

---

## Limitations

| Limitation | Detail |
|---|---|
| Same-domain ads | If a site serves ads from its own domain, network blocking cannot help — only cosmetic filtering applies |
| Anti-adblock walls | Some sites detect ad blockers and show a warning; ShieldBlock does not bypass these |
| Service Worker lifecycle | Chrome may terminate the background worker when idle; it restarts automatically on demand |
| Rule budget | Chrome limits static `declarativeNetRequest` rules; ShieldBlock uses 50 of the 100 available slots |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Vanilla JavaScript (ES2020+) |
| Markup | HTML5 |
| Styling | CSS3 |
| Platform | Chrome Extension Manifest V3 |
| Storage | chrome.storage.local + chrome.storage.session |
| Network API | declarativeNetRequest |
| External libraries | None — pure browser APIs only |

---

<div align="center">

*Built for Web Technology subject · Chrome Extension · Manifest V3*

</div>
