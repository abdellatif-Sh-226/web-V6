async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pwd = document.getElementById('loginPwd').value;
  if (!email || !pwd) {
    document.getElementById('authErr').textContent = 'Email et mot de passe requis.';
    return;
  }

  try {
    await apiFetch('api/login.php', { method: 'POST', body: { email, password: pwd } });
    await loadAppData();
    CU = getCurrentUser();
    if (!CU) {
      throw new Error('Utilisateur introuvable après connexion.');
    }
    ensureDefaultPortfolio();
    document.getElementById('authErr').textContent = '';
    startAutoRefresh();
    enterApp();
  } catch (e) {
    document.getElementById('authErr').textContent = e.message || 'Email ou mot de passe incorrect.';
  }
}

async function doLogout() {
  stopAutoRefresh();
  try {
    await apiFetch('api/logout.php', { method: 'POST' });
  } catch (e) {
    console.error('Logout error', e);
  }
  CU = null;
  currentUser = null;
  document.getElementById('authPage').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPwd').value = '';
  document.getElementById('authErr').textContent = '';
}

function enterApp() {
  document.getElementById('authPage').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';
  const isAdmin = CU.role === 'admin';
  document.getElementById('sidebarAvatar').textContent = CU.name.charAt(0).toUpperCase();
  document.getElementById('sidebarName').textContent = CU.name;
  document.getElementById('sidebarRoleBadge').innerHTML = isAdmin
    ? '<span class="role-badge-admin">👑 Admin</span>'
    : '<span class="role-badge-user">👤 Utilisateur</span>';
  const nav = isAdmin ? NAV_ADMIN : NAV_USER;
  document.getElementById('sidebarNav').innerHTML = nav
    .map(n => `<div class="nav-item" id="nav-${n.page}" onclick="showPage('${n.page}')"><span class="nav-icon">${n.icon}</span>${n.label}</div>`)
    .join('');
  buildPages();
  showPage('dashboard');
}

function requestDeleteAccount() {
  if (!confirm('Soumettre une demande de suppression de compte ?')) return;
  DB.set('users', getUsers().map(u => (u.id === CU.id ? { ...u, deleteRequest: true } : u)));
  alert('Demande soumise. Un administrateur la traitera.');
}

let autoRefreshInterval = null;

function startAutoRefresh() {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(async () => {
    try {
      const data = await apiFetch('api/data.php', { method: 'GET' });
      const oldTxCount = (_cache.transactions || []).length;
      const newTxCount = (data.transactions || []).length;
      _cache.transactions = data.transactions || [];
      _cache.sharedBudgets = data.sharedBudgets || [];
      const currentPage = document.querySelector('.page.active')?.id;
      if (oldTxCount !== newTxCount || currentPage === 'transactions' || currentPage === 'shared' || currentPage === 'dashboard') {
        if (currentPage === 'transactions') renderTransactionsTable();
        if (currentPage === 'shared') renderShared();
        if (currentPage === 'dashboard') renderDashboard();
      }
    } catch (e) {
      console.log('Auto-refresh check failed', e);
    }
  }, 5000);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

function ensureDefaultPortfolio() {
  const budgets = DB.get('budgets') || [];
  const hasPortfolio = budgets.some(b => b.userId === CU.id);
  if (!hasPortfolio) {
    const s = new Date().toISOString().split('T')[0];
    const e = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split('T')[0];
    })();
    budgets.push({
      id: uid(),
      userId: CU.id,
      name: 'Portefeuille',
      period: 'monthly',
      limit: 99999,
      catId: '',
      start: s,
      end: e
    });
    DB.set('budgets', budgets);
  }
}
