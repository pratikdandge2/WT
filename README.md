# 🛡️ ShieldBlock – Ad Blocker Extension

A fully featured Chrome/Edge ad blocker built with Manifest V3.

## What It Blocks

| Type | Examples |
|------|---------|
| **Ad Network Requests** | Google Ads, DoubleClick, AppNexus, Criteo, Amazon DSP, OpenX, Rubicon, PubMatic, and 40+ more |
| **Native / Sponsored Ads** | Taboola, Outbrain, Revcontent, MGID, "Around the Web" widgets |
| **In-Content Banners** | Mid-article display ads, rectangle/leaderboard units |
| **Sticky / Anchor Ads** | Fixed bottom bars, floating overlays, adhesion units |
| **Cosmetic (DOM)** | Removes ad containers, iframes, and placeholder divs |
| **Tracker Pings** | Scoreboard, QuantServe, Google Analytics collect calls |

## Installation

1. **Download/unzip** this folder somewhere on your computer.
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top right toggle).
4. Click **"Load unpacked"** and select this folder.
5. The ShieldBlock icon will appear in your toolbar. Done!

## Features

- ✅ On/Off toggle (persists across sessions)
- ✅ Per-site whitelist (allow ads on sites you want to support)
- ✅ Total blocked counter + badge
- ✅ Live popup UI showing protection status
- ✅ 50 network-level blocking rules (declarativeNetRequest)
- ✅ JS cosmetic filter (MutationObserver for dynamic content)
- ✅ CSS cosmetic filter (instant-hide before JS loads)

## Adding More Rules

Edit `rules.json` to add more ad domains. Each rule follows this format:

```json
{
  "id": 51,
  "priority": 1,
  "action": { "type": "block" },
  "condition": {
    "urlFilter": "||example-ad-network.com^",
    "resourceTypes": ["script","image","xmlhttprequest","sub_frame"]
  }
}
```

## Adding More Cosmetic Selectors

Edit `content.js` under `NETWORK_SELECTORS`, `NATIVE_AD_SELECTORS`, or `STICKY_SELECTORS`
to target site-specific ad elements by CSS selector.

## Files

```
adblock-extension/
├── manifest.json      ← Extension config (MV3)
├── rules.json         ← 50 network blocking rules
├── background.js      ← Service worker (whitelist, toggle, badge)
├── content.js         ← DOM cosmetic filtering
├── cosmetic.css       ← CSS instant-hide layer
├── popup.html         ← Extension popup UI
├── popup.css          ← Popup styles
├── popup.js           ← Popup logic
└── icons/             ← Extension icons
```
