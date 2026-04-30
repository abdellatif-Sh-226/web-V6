let _cache = {
  users: [],
  categories: [],
  transactions: [],
  budgets: [],
  sharedBudgets: []
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
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  };
  if (options.body && typeof options.body !== 'string') {
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch(path, init);
  if (!res.ok) {
    const errorText = await res.text();
    let message = errorText;
    try {
      const json = JSON.parse(errorText);
      message = json.error || errorText;
    } catch (e) {
      message = errorText;
    }
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
    await apiFetch(`api/save.php?entity=${encodeURIComponent(entity)}`, { method: 'POST', body: payload });
    _showSaveIndicator();
  } catch (e) {
    console.error('Failed to save entity', entity, e);
  }
}

async function loadAppData() {
  const data = await apiFetch('api/data.php', { method: 'GET' });
  _cache.users = data.users || [];
  _cache.categories = data.categories || [];
  _cache.transactions = data.transactions || [];
  _cache.budgets = data.budgets || [];
  _cache.sharedBudgets = data.sharedBudgets || [];
  currentUser = data.currentUser || null;
}

function getCurrentUser() {
  return currentUser;
}
