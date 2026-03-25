// ShieldBlock - Background Service Worker
// Handles: whitelist management, stats tracking, dynamic rules, tab state

const STORAGE_KEYS = {
  ENABLED: 'shieldblock_enabled',
  WHITELIST: 'shieldblock_whitelist',
  STATS: 'shieldblock_stats',
  TAB_STATS: 'shieldblock_tab_stats'
};

// Initialize storage defaults on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get([STORAGE_KEYS.ENABLED, STORAGE_KEYS.WHITELIST, STORAGE_KEYS.STATS]);
  if (data[STORAGE_KEYS.ENABLED] === undefined) {
    await chrome.storage.local.set({ [STORAGE_KEYS.ENABLED]: true });
  }
  if (!data[STORAGE_KEYS.WHITELIST]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: [] });
  }
  if (!data[STORAGE_KEYS.STATS]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: { total: 0, today: 0, lastReset: Date.now() } });
  }
  updateBadge();
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATE') {
    getState(sender.tab?.id).then(sendResponse);
    return true;
  }
  if (message.type === 'TOGGLE_ENABLED') {
    toggleEnabled().then(sendResponse);
    return true;
  }
  if (message.type === 'ADD_WHITELIST') {
    addToWhitelist(message.domain).then(sendResponse);
    return true;
  }
  if (message.type === 'REMOVE_WHITELIST') {
    removeFromWhitelist(message.domain).then(sendResponse);
    return true;
  }
  if (message.type === 'GET_WHITELIST') {
    chrome.storage.local.get(STORAGE_KEYS.WHITELIST).then(data => {
      sendResponse(data[STORAGE_KEYS.WHITELIST] || []);
    });
    return true;
  }
  if (message.type === 'AD_BLOCKED') {
    recordBlock(sender.tab?.id).then(sendResponse);
    return true;
  }
  if (message.type === 'GET_TAB_STATS') {
    getTabStats(message.tabId).then(sendResponse);
    return true;
  }
});

async function getState(tabId) {
  const data = await chrome.storage.local.get([STORAGE_KEYS.ENABLED, STORAGE_KEYS.WHITELIST, STORAGE_KEYS.STATS]);
  const enabled = data[STORAGE_KEYS.ENABLED] !== false;
  const whitelist = data[STORAGE_KEYS.WHITELIST] || [];
  const stats = data[STORAGE_KEYS.STATS] || { total: 0, today: 0 };

  let currentDomain = '';
  let isWhitelisted = false;
  if (tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      currentDomain = extractDomain(tab.url);
      isWhitelisted = whitelist.includes(currentDomain);
    } catch (e) {}
  }

  return { enabled, whitelist, stats, currentDomain, isWhitelisted };
}

async function toggleEnabled() {
  const data = await chrome.storage.local.get(STORAGE_KEYS.ENABLED);
  const newState = !(data[STORAGE_KEYS.ENABLED] !== false);
  await chrome.storage.local.set({ [STORAGE_KEYS.ENABLED]: newState });
  updateBadge(newState);

  // Enable/disable static ruleset
  try {
    if (newState) {
      await chrome.declarativeNetRequest.enableRulesets({ enableRulesetIds: ['ad_rules'] });
    } else {
      await chrome.declarativeNetRequest.disableRulesets({ disableRulesetIds: ['ad_rules'] });
    }
  } catch (e) { console.log('Ruleset toggle:', e.message); }

  // Notify all tabs to update content script state
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      chrome.tabs.sendMessage(tab.id, { type: 'STATE_CHANGED', enabled: newState });
    } catch (e) {}
  }

  return { enabled: newState };
}

async function addToWhitelist(domain) {
  if (!domain) return;
  const data = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
  const list = data[STORAGE_KEYS.WHITELIST] || [];
  if (!list.includes(domain)) {
    list.push(domain);
    await chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: list });
  }
  updateDynamicRules(list);
  return { whitelist: list };
}

async function removeFromWhitelist(domain) {
  const data = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
  const list = (data[STORAGE_KEYS.WHITELIST] || []).filter(d => d !== domain);
  await chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: list });
  updateDynamicRules(list);
  return { whitelist: list };
}

// Add allow rules for whitelisted domains (overrides block rules)
async function updateDynamicRules(whitelist) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map(r => r.id);

  const newRules = whitelist.map((domain, i) => ({
    id: 1000 + i,
    priority: 100, // Higher priority overrides block rules
    action: { type: 'allow' },
    condition: {
      requestDomains: [domain],
      resourceTypes: ['script', 'image', 'xmlhttprequest', 'sub_frame', 'media', 'other']
    }
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: newRules
  });
}

async function recordBlock(tabId) {
  const data = await chrome.storage.local.get(STORAGE_KEYS.STATS);
  const stats = data[STORAGE_KEYS.STATS] || { total: 0, today: 0, lastReset: Date.now() };

  // Reset today counter if new day
  const lastReset = new Date(stats.lastReset);
  const now = new Date();
  if (lastReset.toDateString() !== now.toDateString()) {
    stats.today = 0;
    stats.lastReset = now.getTime();
  }

  stats.total = (stats.total || 0) + 1;
  stats.today = (stats.today || 0) + 1;

  await chrome.storage.local.set({ [STORAGE_KEYS.STATS]: stats });

  // Track per-tab
  if (tabId) {
    const tabKey = `tab_${tabId}`;
    const tabData = await chrome.storage.session.get(tabKey).catch(() => ({}));
    const count = ((tabData[tabKey] || 0)) + 1;
    await chrome.storage.session.set({ [tabKey]: count }).catch(() => {});
  }

  return stats;
}

async function getTabStats(tabId) {
  if (!tabId) return 0;
  const tabKey = `tab_${tabId}`;
  try {
    const data = await chrome.storage.session.get(tabKey);
    return data[tabKey] || 0;
  } catch (e) { return 0; }
}

function updateBadge(enabled) {
  if (enabled === false) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#666666' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

// Clean up tab stats when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  const tabKey = `tab_${tabId}`;
  chrome.storage.session.remove(tabKey).catch(() => {});
});
