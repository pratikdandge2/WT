# ShieldBlock Architecture

This document provides a technical overview of how the ShieldBlock ad blocker extension is structured under Manifest V3 and how its various components interact.

## Core Components

The extension is composed of four main parts:

### 1. `manifest.json` (Configuration)
The central configuration file required by Manifest V3. 
* Declares necessary permissions (`declarativeNetRequest`, `storage`, `scripting`, `tabs`).
* Registers the background service worker (`background.js`).
* Connects the popup UI (`popup.html`).
* Injects content scripts (`content.js`, `content.css`) into all webpages.
* Loads the static blocking rules (`rules.json`).

### 2. Network Filtering (`rules.json` & `background.js`)
At the core of the ad blocker is the **Declarative Net Request (DNR)** API, which intercepts and blocks network requests (like tracking scripts, ad images, and iframes) before they can even load.

* **`rules.json`**: Contains a static list of blocking rules (e.g., blocking `example-ad-network.com`).
* **`background.js`**: The service worker runs in the background. It:
  * Manages the global state (Enabled/Disabled) using `chrome.storage.local`.
  * Manages the **Whitelist**. When a site is whitelisted, it dynamically generates high-priority "allow" rules (`updateDynamicRules`) to override the blocking rules in `rules.json`.
  * Tracks statistics (ads blocked today, total blocked) and updates the extension toolbar badge.

### 3. Cosmetic Filtering (`content.js` & `cosmetic.css`)
Network blocking isn't always enough (some ads are served directly from the same domain as the content). Cosmetic filtering hides the ad elements directly on the page.

* **`content.js`**: Injected into every webpage. It has three main jobs:
  * **Static Hiding**: Uses a massive list of common ad CSS selectors (like `.adsbygoogle`, `.taboola`, `#ad-banner`) and immediately applies `display: none !important;` to them.
  * **Dynamic Hiding (MutationObserver)**: Watches the DOM for new elements being added after the page loads and continuously removes newly loaded ads.
  * **Heuristic Hiding**: Uses `window.getComputedStyle` to detect and hide intrusive "sticky" or "anchor" ads that follow you as you scroll down the page.
* **`cosmetic.css`**: Instantly injected CSS to hide known ad containers before the JavaScript even has a chance to run, preventing the "flash" of an ad before it is hidden.

### 4. User Interface (`popup.html`, `popup.css`, `popup.js`)
The menu you see when you click the extension icon.

* **`popup.js`**: Communicates with `background.js` via the Chrome Messaging API (`chrome.runtime.sendMessage`). It queries the current state (enabled/disabled, whitelisted, stats) to render the UI, and sends commands (like "Toggle Adblocker" or "Whitelist this site") back to the background script.

## Data Flow Example (Blocking an Ad)
1. A user visits `news-website.com`.
2. Chrome checks the `rules.json` network rules before any request is made. If the site requests a tracker (`doubleclick.net`), the DNR API blocks the request immediately.
3. The background service worker (`background.js`) is notified and increments the "Blocked" counter.
4. The page loads. `content.js` is injected and scans the HTML for ad containers (e.g., `<div class="banner-ad">`).
5. `content.js` hides the empty banner containers so the webpage layout looks clean.

## Data Flow Example (Whitelisting a Site)
1. User clicks the ShieldBlock icon and toggles the "Whitelist" switch in the `popup.html`.
2. `popup.js` sends an `ADD_WHITELIST` message to `background.js`.
3. `background.js` saves the domain in storage and tells the DNR API to create a dynamic "allow" rule for that domain.
4. `background.js` sends a message to the active tab's `content.js` to stop cosmetic filtering.
5. `content.js` restores all hidden ad elements.
6. The user refreshes the page, and all ads load normally.
