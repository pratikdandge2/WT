// ShieldBlock - Popup Logic

document.addEventListener('DOMContentLoaded', async () => {
  const enabledCheckbox = document.getElementById('enabledCheckbox');
  const statusBar = document.getElementById('statusBar');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const shieldIcon = document.getElementById('shieldIcon');
  const totalBlocked = document.getElementById('totalBlocked');
  const todayBlocked = document.getElementById('todayBlocked');
  const tabBlocked = document.getElementById('tabBlocked');
  const currentDomain = document.getElementById('currentDomain');
  const whitelistBtn = document.getElementById('whitelistBtn');
  const whitelistBtnText = document.getElementById('whitelistBtnText');
  const whitelistedBadge = document.getElementById('whitelistedBadge');
  const expandBtn = document.getElementById('expandWhitelist');
  const whitelistPanel = document.getElementById('whitelistPanel');
  const whitelistList = document.getElementById('whitelistList');
  const whitelistInput = document.getElementById('whitelistInput');
  const addWhitelistBtn = document.getElementById('addWhitelistBtn');

  let state = { enabled: true, whitelist: [], stats: {}, currentDomain: '', isWhitelisted: false };
  let currentTab = null;

  // Get current tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tabs[0] || null;

  // Load state
  await loadState();

  // ─── MAIN TOGGLE ───────────────────────────────────────────────────────────
  enabledCheckbox.addEventListener('change', async () => {
    const result = await chrome.runtime.sendMessage({ type: 'TOGGLE_ENABLED' });
    state.enabled = result.enabled;
    updateUI();
  });

  // ─── WHITELIST CURRENT SITE ────────────────────────────────────────────────
  whitelistBtn.addEventListener('click', async () => {
    if (!state.currentDomain) return;
    if (state.isWhitelisted) {
      await chrome.runtime.sendMessage({ type: 'REMOVE_WHITELIST', domain: state.currentDomain });
      state.isWhitelisted = false;
      state.whitelist = state.whitelist.filter(d => d !== state.currentDomain);
    } else {
      await chrome.runtime.sendMessage({ type: 'ADD_WHITELIST', domain: state.currentDomain });
      state.isWhitelisted = true;
      state.whitelist.push(state.currentDomain);
    }
    updateUI();
    renderWhitelistItems();
  });

  // ─── EXPAND WHITELIST ──────────────────────────────────────────────────────
  expandBtn.addEventListener('click', () => {
    const isOpen = whitelistPanel.style.display !== 'none';
    whitelistPanel.style.display = isOpen ? 'none' : 'block';
    expandBtn.classList.toggle('open', !isOpen);
    if (!isOpen) renderWhitelistItems();
  });

  // ─── ADD TO WHITELIST ──────────────────────────────────────────────────────
  addWhitelistBtn.addEventListener('click', addDomain);
  whitelistInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addDomain(); });

  async function addDomain() {
    let domain = whitelistInput.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
    if (!domain) return;
    if (!state.whitelist.includes(domain)) {
      await chrome.runtime.sendMessage({ type: 'ADD_WHITELIST', domain });
      state.whitelist.push(domain);
      if (domain === state.currentDomain) state.isWhitelisted = true;
      renderWhitelistItems();
      updateUI();
    }
    whitelistInput.value = '';
  }

  // ─── RENDER WHITELIST ──────────────────────────────────────────────────────
  function renderWhitelistItems() {
    const list = state.whitelist;
    if (!list.length) {
      whitelistList.innerHTML = '<div class="empty-state">No whitelisted sites</div>';
      return;
    }
    whitelistList.innerHTML = list.map(d => `
      <div class="whitelist-item">
        <span class="whitelist-domain">${escapeHtml(d)}</span>
        <button class="remove-btn" data-domain="${escapeHtml(d)}" title="Remove">×</button>
      </div>
    `).join('');

    whitelistList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const domain = btn.dataset.domain;
        await chrome.runtime.sendMessage({ type: 'REMOVE_WHITELIST', domain });
        state.whitelist = state.whitelist.filter(d => d !== domain);
        if (domain === state.currentDomain) state.isWhitelisted = false;
        renderWhitelistItems();
        updateUI();
      });
    });
  }

  // ─── LOAD STATE ────────────────────────────────────────────────────────────
  async function loadState() {
    try {
      state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });

      // Get tab-specific block count
      if (currentTab) {
        const tabCount = await chrome.runtime.sendMessage({ type: 'GET_TAB_STATS', tabId: currentTab.id });
        state.tabCount = tabCount || 0;
      }
    } catch (e) {
      console.error('ShieldBlock: Failed to load state', e);
    }
    updateUI();
  }

  // ─── UPDATE UI ─────────────────────────────────────────────────────────────
  function updateUI() {
    const { enabled, isWhitelisted, currentDomain: domain, stats, tabCount } = state;
    const effectivelyEnabled = enabled && !isWhitelisted;

    // Checkbox
    enabledCheckbox.checked = enabled;

    // Shield icon
    shieldIcon.classList.toggle('disabled', !effectivelyEnabled);

    // Status bar
    statusBar.className = 'status-bar' + (isWhitelisted ? ' whitelisted' : !enabled ? ' disabled' : '');
    statusDot.className = 'status-dot' + (isWhitelisted ? ' warn' : !enabled ? ' disabled' : '');
    statusText.className = 'status-text' + (isWhitelisted ? ' warn' : !enabled ? ' disabled' : '');

    if (!enabled) {
      statusText.textContent = 'Protection Disabled';
    } else if (isWhitelisted) {
      statusText.textContent = 'Site Whitelisted';
    } else {
      statusText.textContent = 'Protection Active';
    }

    // Stats
    animateStat(totalBlocked, formatNum(stats?.total || 0));
    animateStat(todayBlocked, formatNum(stats?.today || 0));
    animateStat(tabBlocked, formatNum(tabCount || 0));

    // Current domain
    currentDomain.textContent = domain || '—';

    // Whitelist button
    whitelistBtn.classList.toggle('active', isWhitelisted);
    whitelistBtnText.textContent = isWhitelisted ? 'Remove' : 'Allow Site';
    whitelistBtn.style.display = domain ? 'flex' : 'none';

    // Whitelisted badge
    whitelistedBadge.style.display = isWhitelisted ? 'flex' : 'none';
  }

  function animateStat(el, value) {
    if (el.textContent !== value) {
      el.textContent = value;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  }

  function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
});
