const API_BASE = '../api/';

let _cache = {
  users: [],
  categories: [],
  transactions: [],
  budgets: [],
  sharedBudgets: [],
  pendingTransactions: [],
  notifications: [],
  unreadCount: 0
};
let currentUser = null;

const DB = {
  get: k => (_cache[k] !== undefined ? _cache[k] : null),
  set: (k, v) => {
    _cache[k] = v;
    saveEntity(k, v);
  }
};

async function apiFetch(path, options = {}) {
  const init = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  if (options.body && typeof options.body !== 'string') {
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch(API_BASE + path, init);
  if (!res.ok) {
    const errorText = await res.text();
    let message = errorText;
    try { const json = JSON.parse(errorText); message = json.error || errorText; } catch (e) { message = errorText; }
    throw new Error(message || `HTTP ${res.status}`);
  }
  return res.json();
}

function _showSaveIndicator() {
  const ind = document.getElementById('_saveInd');
  if (!ind) return;
  ind.style.opacity = '1';
  clearTimeout(ind._t);
  ind._t = setTimeout(() => (ind.style.opacity = '0'), 1200);
}

async function saveEntity(entity, payload) {
  try {
    await apiFetch(`save.php?entity=${encodeURIComponent(entity)}`, { method: 'POST', body: payload });
    _showSaveIndicator();
  } catch (e) {
    console.error('Failed to save entity', entity, e);
  }
}

async function loadAppData() {
  const data = await apiFetch('data.php', { method: 'GET' });
  _cache.users = data.users || [];
  _cache.categories = data.categories || [];
  _cache.transactions = data.transactions || [];
  _cache.budgets = data.budgets || [];
  _cache.sharedBudgets = data.sharedBudgets || [];
  _cache.pendingTransactions = data.pendingTransactions || [];
  _cache.notifications = data.notifications || [];
  _cache.unreadCount = data.unreadCount || 0;
  currentUser = data.currentUser || null;
}

function getCurrentUser() {
  return currentUser;
}
