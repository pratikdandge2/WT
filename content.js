// ShieldBlock - Content Script
// Handles cosmetic filtering: removes ad containers, sticky banners, native ads, mid-article ads

(function () {
  'use strict';

  let isEnabled = true;
  let observer = null;
  let blockedCount = 0;

  // ─── COMPREHENSIVE AD SELECTORS ────────────────────────────────────────────

  const AD_SELECTORS = [
    // Google Ads
    'ins.adsbygoogle',
    '.adsbygoogle',
    '[data-ad-client]',
    '[data-ad-slot]',
    '#google_ads_frame',
    'iframe[id^="google_ads_iframe"]',
    'div[id^="google_ads_"]',

    // Generic Ad Classes
    '.ad', '.ads', '.ad-unit', '.ad-container', '.ad-wrapper',
    '.advert', '.advertisement', '.advertising',
    '.ad-block', '.ad-area', '.ad-section',
    '.ad-banner', '.banner-ad', '.banner-ads',
    '.display-ad', '.display-ads',

    // ID patterns
    '#ad', '#ads', '#ad-unit', '#advert', '#advertisement',
    '#ad-container', '#ad-wrapper', '#ad-banner',

    // Data attributes
    '[data-ad]', '[data-ads]', '[data-advertisement]',
    '[data-ad-unit]', '[data-adunit]', '[data-ad-zone]',
    '[data-ad-id]', '[data-ad-format]', '[data-ad-position]',
    '[data-google-query-id]',

    // Native / Sponsored / In-Feed Ads
    '.native-ad', '.native-ads', '.native-advertisement',
    '[class*="native-ad"]', '[id*="native-ad"]',
    '.sponsored', '.sponsored-content', '.sponsored-post',
    '.sponsored-link', '.sponsored-links',
    '[class*="sponsored"]', '[data-sponsored]',
    '.promoted', '.promoted-content', '.promoted-post',
    '[class*="promoted"]', '[data-promoted]',
    '.recommended', '[class*="recommended-ad"]',
    '.paid-content', '[data-paid]',
    '.content-recommendation',

    // Sticky / Anchor / Footer Ads
    '.sticky-ad', '.sticky-ads', '.sticky-banner',
    '[class*="sticky-ad"]', '[id*="sticky-ad"]',
    '.anchor-ad', '.anchor-ads', '.anchored-ad',
    '[class*="anchor-ad"]',
    '.adhesion-ad', '.adhesion-unit',
    '.footer-ad', '.footer-ads', '.footer-banner',
    '[class*="footer-ad"]', '[id*="footer-ad"]',
    '.fixed-ad', '.fixed-banner',
    '.bottom-banner', '.bottom-ad',
    '[id*="adhesion"]', '[class*="adhesion"]',

    // Mid-Article / In-Content Ads
    '.in-content-ad', '.in-article-ad', '.mid-article-ad',
    '[class*="in-content-ad"]', '[class*="in-article"]',
    '.article-ad', '.content-ad', '.post-ad',
    '[class*="article-ad"]', '[class*="content-ad"]',
    '.inline-ad', '.inline-ads', '[class*="inline-ad"]',
    '.interstitial-ad', '[class*="interstitial"]',

    // Outbrain & Taboola (Native Recommendation Widgets)
    '#outbrain_widget', '[id^="outbrain"]', '[class*="outbrain"]',
    '.OUTBRAIN', 'div[data-widget-id^="OB_"]',
    '#taboola-below', '[id^="taboola"]', '[class*="taboola"]',
    '.trc_related_container', 'div[data-placement^="Below Article"]',

    // Specific ad network containers
    '[class*="dfp-"]', '[id*="dfp-"]',       // DoubleClick for Publishers
    '[class*="prebid"]', '[id*="prebid"]',   // Prebid.js
    '[id*="div-gpt-ad"]',                    // GPT ads
    '.gpt-ad', '[class*="gpt-ad"]',
    '.adskeeper', '[class*="adskeeper"]',
    '[id^="banner_ad"]', '[id^="ad_banner"]',
    '[class*="adsense"]',
    '#adsense', '.adsense',

    // Video Ads (non-essential overlays)
    '.video-ad-overlay', '[class*="preroll"]',
    '.ad-overlay', '[class*="ad-overlay"]',

    // Survey/Interstitial popups (common ad patterns)
    '[class*="survey-wrapper"]:not(main)',
    '[id*="survey-modal"]',
    '.cookie-ad', '.gdpr-ad-notice',

    // Social proof / tracking widgets used for ads
    'div[class*="addthis"]',
    '[class*="ad_unit"]', '[id*="ad_unit"]',

    // Specific publisher patterns
    '[class*="widget-ads"]', '[id*="widget-ads"]',
    '.td-a-rec',                              // Tagdiv theme ads
    '[class*="td-adspot"]',
    '.mvp-ad-box',                            // MVP theme
    '.rll-youtube-player + .ad-unit',
    '[class*="ezoic-ad"]', '[id*="ezoic"]',  // Ezoic
    '.ezoic-adpicker-ad',
    '[class*="mediavine"]',                   // Mediavine
    '[id*="mediavine"]',
    '.mediavine-ad-label',
    '[class*="monumetric"]',                  // Monumetric
    '[data-monumetric]',
    '[class*="raptive"]',                     // Raptive (AdThrive)
    '[class*="adthrive"]', '[id*="adthrive"]',
    '.pwPartnerWidget',                       // PW ads
    '[class*="pw-widget"]',

    // Fallback patterns
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'iframe[src*="adnxs"]',
    'iframe[src*="taboola"]',
    'iframe[src*="outbrain"]',
    'iframe[src*="criteo"]',
    'iframe[src*="rubiconproject"]',
    'iframe[src*="media.net"]'
  ];

  // ─── STICKY ELEMENT DETECTION ─────────────────────────────────────────────

  const STICKY_SELECTORS = [
    '[class*="sticky"]', '[class*="fixed-bottom"]',
    '[class*="bottom-sticky"]', '[class*="floating-ad"]',
    '[class*="float-ad"]', '[id*="sticky-bottom"]',
    '#floating', '.floating-banner'
  ];

  function isStickyAd(el) {
    const style = window.getComputedStyle(el);
    if (style.position !== 'fixed' && style.position !== 'sticky') return false;
    const rect = el.getBoundingClientRect();
    const isBottomAnchored = rect.bottom > window.innerHeight * 0.7;
    const hasAdKeyword = /\b(ad|ads|advert|sponsor|banner|promo)\b/i.test(
      el.className + ' ' + el.id
    );
    return isBottomAnchored && hasAdKeyword;
  }

  // ─── ELEMENT HIDING ────────────────────────────────────────────────────────

  function hideElement(el) {
    if (!el || el._shieldblocked) return;
    el._shieldblocked = true;
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('height', '0', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
    blockedCount++;
    // Report block to background
    chrome.runtime.sendMessage({ type: 'AD_BLOCKED' }).catch(() => {});
  }

  function removeAds() {
    if (!isEnabled) return;

    // CSS selector based hiding
    for (const selector of AD_SELECTORS) {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (!isEssentialElement(el)) hideElement(el);
        });
      } catch (e) {}
    }

    // Detect sticky/fixed ads by position
    for (const selector of STICKY_SELECTORS) {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (isStickyAd(el)) hideElement(el);
        });
      } catch (e) {}
    }

    // Remove empty ad placeholder divs that break layout
    document.querySelectorAll('[class*="ad-placeholder"], [class*="ad-spacer"]').forEach(el => {
      if (el.offsetHeight < 5 || el.innerHTML.trim() === '') {
        hideElement(el);
      }
    });
  }

  function isEssentialElement(el) {
    const tag = el.tagName?.toLowerCase();
    const essential = ['body', 'html', 'head', 'main', 'header', 'nav', 'footer', 'article', 'section'];
    if (essential.includes(tag)) return true;
    // Avoid hiding elements that contain significant text content
    if (el.innerText && el.innerText.trim().length > 200) return true;
    return false;
  }

  // ─── MUTATION OBSERVER ────────────────────────────────────────────────────

  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutations) => {
      if (!isEnabled) return;
      let hasNewNodes = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) { hasNewNodes = true; break; }
      }
      if (hasNewNodes) {
        // Debounce
        clearTimeout(observer._timer);
        observer._timer = setTimeout(removeAds, 150);
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // ─── RESTORE ADS (when disabled) ──────────────────────────────────────────

  function restoreAds() {
    document.querySelectorAll('[data-shieldblocked]').forEach(el => {
      el.style.removeProperty('display');
      el.style.removeProperty('visibility');
      el.style.removeProperty('height');
      el.style.removeProperty('overflow');
    });
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────

  async function init() {
    try {
      const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
      isEnabled = state.enabled && !state.isWhitelisted;
    } catch (e) {
      isEnabled = true;
    }

    if (isEnabled) {
      removeAds();
      startObserver();
    }

    // Run again after DOM is ready
    if (document.readyState !== 'complete') {
      window.addEventListener('DOMContentLoaded', removeAds);
      window.addEventListener('load', removeAds);
    }
  }

  // Listen for state changes from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'STATE_CHANGED') {
      isEnabled = message.enabled;
      if (isEnabled) {
        removeAds();
        startObserver();
      } else {
        stopObserver();
      }
    }
  });

  init();
})();
