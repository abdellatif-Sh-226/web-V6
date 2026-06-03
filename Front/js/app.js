async function initApp() {
  initLanguage();
  try {
    await loadAppData();
    STATE.CU = getCurrentUser();
    if (STATE.CU) {
      enterApp();
      return;
    }
  } catch (e) {
    console.warn('No active session or failed to load data', e);
  }
  document.getElementById('authPage').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
  applyTranslations();
}

let _isRegisterMode = false;

function toggleAuthMode() {
  _isRegisterMode = !_isRegisterMode;
  const nameGroup = document.getElementById('authNameGroup');
  const confirmGroup = document.getElementById('authConfirmGroup');
  const btn = document.getElementById('authSubmitBtn');
  const link = document.getElementById('authToggleLink');
  const text = document.getElementById('authToggleText');
  const sub = document.getElementById('authSub');
  const pwdGroup = document.getElementById('authPwdGroup');

  if (_isRegisterMode) {
    nameGroup.style.display = '';
    confirmGroup.style.display = '';
    btn.textContent = t('signUp');
    btn.setAttribute('data-i18n', 'signUp');
    btn.onclick = doRegister;
    link.textContent = t('signInLink');
    link.setAttribute('data-i18n', 'signInLink');
    text.textContent = t('hasAccount');
    text.setAttribute('data-i18n', 'hasAccount');
    sub.textContent = t('signUpSub');
    sub.setAttribute('data-i18n', 'signUpSub');
  } else {
    nameGroup.style.display = 'none';
    confirmGroup.style.display = 'none';
    btn.textContent = t('login');
    btn.setAttribute('data-i18n', 'login');
    btn.onclick = doLogin;
    link.textContent = t('signUpLink');
    link.setAttribute('data-i18n', 'signUpLink');
    text.textContent = t('noAccount');
    text.setAttribute('data-i18n', 'noAccount');
    sub.textContent = t('loginSub');
    sub.setAttribute('data-i18n', 'loginSub');
  }
  document.getElementById('authErr').textContent = '';
}

async function doRegister() {
  const name = document.getElementById('authName').value.trim();
  const email = document.getElementById('loginEmail').value.trim();
  const pwd = document.getElementById('loginPwd').value;
  const confirm = document.getElementById('authConfirmPwd').value;
  if (!name || !email || !pwd || !confirm) {
    document.getElementById('authErr').textContent = t('allFieldsRequired');
    return;
  }
  if (pwd !== confirm) {
    document.getElementById('authErr').textContent = t('passwordMismatch');
    return;
  }
  try {
    await apiFetch('register.php', { method: 'POST', body: { name, email, password: pwd } });
    await loadAppData();
    STATE.CU = getCurrentUser();
    if (!STATE.CU) throw new Error(t('userNotFound'));
    ensureDefaultPortfolio();
    document.getElementById('authErr').textContent = '';
    startAutoRefresh();
    enterApp();
  } catch (e) {
    document.getElementById('authErr').textContent = e.message || t('authInvalid');
  }
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pwd = document.getElementById('loginPwd').value;
  if (!email || !pwd) {
    document.getElementById('authErr').textContent = t('authError');
    return;
  }
  try {
    await apiFetch('login.php', { method: 'POST', body: { email, password: pwd } });
    await loadAppData();
    STATE.CU = getCurrentUser();
    if (!STATE.CU) throw new Error(t('userNotFound'));
    ensureDefaultPortfolio();
    document.getElementById('authErr').textContent = '';
    startAutoRefresh();
    enterApp();
  } catch (e) {
    document.getElementById('authErr').textContent = e.message || t('authInvalid');
  }
}

async function doLogout() {
  stopAutoRefresh();
  try { await apiFetch('logout.php', { method: 'POST' }); } catch (e) { console.error('Logout error', e); }
  STATE.CU = null;
  currentUser = null;
  _isRegisterMode = true;
  toggleAuthMode();
  document.getElementById('authPage').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPwd').value = '';
  document.getElementById('authErr').textContent = '';
  document.getElementById('authName').value = '';
  document.getElementById('authConfirmPwd').value = '';
}

function enterApp() {
  document.getElementById('authPage').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';

  const sidebarEl = document.querySelector('.sidebar');
  const navPlaceholder = document.getElementById('sidebarPlaceholder');
  if (navPlaceholder) {
    sidebarEl.innerHTML = buildSidebar();
  }

  initNotifications();
  showPage('dashboard');
}

function ensureDefaultPortfolio() {
  const budgets = DB.get('budgets') || [];
  const hasPortfolio = budgets.some(b => b.userId === STATE.CU.id);
  if (!hasPortfolio) {
    const s = new Date().toISOString().split('T')[0];
    const e = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]; })();
    budgets.push({ id: uid(), userId: STATE.CU.id, name: 'Portefeuille', period: 'monthly', limit: 99999, catId: '', start: s, end: e });
    DB.set('budgets', budgets);
  }
}

function startAutoRefresh() {
  if (STATE.autoRefreshInterval) clearInterval(STATE.autoRefreshInterval);
  STATE.autoRefreshInterval = setInterval(async () => {
    try {
      const data = await apiFetch('data.php', { method: 'GET' });
      const currentPage = document.querySelector('.page.active')?.id;
      const oldTxCount = (_cache.transactions || []).length;
      const newTxCount = (data.transactions || []).length;
      _cache.transactions = data.transactions || [];
      _cache.sharedBudgets = data.sharedBudgets || [];
      if (oldTxCount !== newTxCount || currentPage === 'page-transactions' || currentPage === 'page-shared' || currentPage === 'page-dashboard') {
        if (currentPage === 'page-transactions') renderTransactionsTable();
        if (currentPage === 'page-shared') renderShared();
        if (currentPage === 'page-dashboard') renderDashboard();
      }
      refreshNotifications();
    } catch (e) { console.log('Auto-refresh check failed', e); }
  }, 5000);
}

function stopAutoRefresh() {
  if (STATE.autoRefreshInterval) {
    clearInterval(STATE.autoRefreshInterval);
    STATE.autoRefreshInterval = null;
  }
}

function requestDeleteAccount() {
  if (!confirm(t('confirmDeleteRequest'))) return;
  DB.set('users', getUsers().map(u => (u.id === STATE.CU.id ? { ...u, deleteRequest: true } : u)));
  alert(t('deleteRequestSent'));
}

async function showPage(page) {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;

  try {
    const resp = await fetch(`pages/${page}.html`);
    if (!resp.ok) throw new Error('Page not found');
    const html = await resp.text();
    mainContent.innerHTML = html;
    applyTranslations(mainContent);
  } catch (e) {
    mainContent.innerHTML = `<div class="empty-state">${t('noData')}</div>`;
    return;
  }

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n => n.classList.remove('active'));
  const activeNav = document.getElementById(`nav-${page}`);
  if (activeNav) activeNav.classList.add('active');

  const pageEls = mainContent.querySelectorAll('.page-section');
  pageEls.forEach(p => p.classList.remove('active'));

  const renderMap = {
    dashboard: () => { renderDashboard(); },
    transactions: () => {
      const isUser = STATE.CU.role === 'user';
      document.getElementById('txPageTitle').textContent = isUser ? t('myTransactions') : t('allTransactions');
      const sub = document.getElementById('txPageSub');
      if (sub) sub.style.display = isUser ? '' : 'none';
      renderTransactionsTable();
    },
    budgets: () => {
      const isUser = STATE.CU.role === 'user';
      document.getElementById('budgetPageTitle').textContent = isUser ? t('myBudgets') : t('allBudgets');
      const sub = document.getElementById('budgetPageSub');
      if (sub) sub.style.display = isUser ? '' : 'none';
      renderBudgets();
    },
    categories: () => {
      const isAdmin = STATE.CU.role === 'admin';
      document.getElementById('catPageTitle').textContent = isAdmin ? t('globalCategories') : t('myCategories');
      document.getElementById('catPageSub').textContent = isAdmin ? t('globalCategoriesDesc') : t('myCategoriesDesc');
      const note = document.getElementById('catPrivateNote');
      if (note) note.style.display = isAdmin ? 'none' : '';
      const section = document.getElementById('catSection');
      if (section) section.className = 'section ' + (isAdmin ? 'admin-scope' : 'user-scope');
      renderCategories();
    },
    shared: () => {
      document.getElementById('sharedPageSub').textContent =
        STATE.CU.role === 'admin' ? t('allSharedBudgets') : t('mySharedBudgets');
      renderShared();
    },
    admin: () => { renderAdmin(); },
    settings: () => { renderSettings(); },
    notifications: () => {
      renderNotificationsPage();
      markNotifRead('all');
    }
  };

  const renderFn = renderMap[page];
  if (renderFn) renderFn();
}

function renderAdmin() {
  const users = getUsers();
  const txs = DB.get('transactions') || [];
  const budgets = DB.get('budgets') || [];
  const shared = DB.get('sharedBudgets') || [];

  document.getElementById('adminCards').innerHTML = `
    <div class="card"><div class="card-label">${t('users')}</div><div class="card-value accent">${users.length}</div></div>
    <div class="card"><div class="card-label">${t('totalTx')}</div><div class="card-value accent">${txs.length}</div></div>
    <div class="card"><div class="card-label">${t('totalBudgets')}</div><div class="card-value accent">${budgets.length}</div></div>
    <div class="card"><div class="card-label">${t('totalShared')}</div><div class="card-value accent">${shared.length}</div></div>
  `;

  document.getElementById('adminUsersBody').innerHTML = users.map(u => `
    <tr>
      <td style="font-weight:500">${u.name}${u.id === STATE.CU.id ? ' <span style="font-size:11px;color:var(--text-muted)">(vous)</span>' : ''}</td>
      <td style="color:var(--text-muted);font-size:13px">${u.email}</td>
      <td>${u.role === 'admin' ? '<span class="role-badge-admin">' + t('adminLabel') + '</span>' : '<span class="role-badge-user">' + t('userLabel') + '</span>'}</td>
      <td><span style="color:${u.active !== false ? 'var(--success)' : 'var(--danger)'};font-size:13px">${u.active !== false ? '\u2713 ' + t('active') : '\u2717 ' + t('inactive')}</span></td>
      <td><div class="actions">
        ${u.id !== STATE.CU.id ? `
          <button class="icon-btn" onclick="toggleRole('${u.id}')" title="${t('role')}">${u.role === 'admin' ? '\u2192 User' : '\u2192 Admin'}</button>
          <button class="icon-btn" onclick="toggleActive('${u.id}')" title="${u.active !== false ? t('userDeactivated') : t('userActivated')}">${u.active !== false ? '\uD83D\uDD12' : '\uD83D\uDD13'}</button>
          <button class="icon-btn del" onclick="deleteUser('${u.id}')">\uD83D\uDDD1\uFE0F</button>
        ` : '<span style="font-size:12px;color:var(--text-muted)">\u2014</span>'}
      </div></td>
    </tr>`).join('');

  const reqs = users.filter(u => u.deleteRequest);
  document.getElementById('deleteRequests').innerHTML = reqs.length ? reqs.map(u => `
    <div class="delete-request-row">
      <div><strong>${u.name}</strong> <span style="color:var(--text-muted);font-size:13px">(${u.email})</span> ${t('deleteRequest')}</div>
      <div class="actions">
        <button class="btn btn-danger btn-sm" onclick="approveDelete('${u.id}')">${t('approve')}</button>
        <button class="btn btn-secondary btn-sm" onclick="rejectDelete('${u.id}')">${t('reject')}</button>
      </div>
    </div>`).join('') : '<div style="color:var(--text-muted);font-size:14px">' + t('noDeleteRequests') + '</div>';

  const allTxsSorted = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  document.getElementById('adminTxBody').innerHTML = allTxsSorted.map(tx => `
    <tr>
      <td class="text-muted">${new Date(tx.date).toLocaleDateString('fr-TN')}</td>
      <td><span class="pill" style="font-size:12px">${getUserName(tx.userId)}</span></td>
      <td>${tx.desc}</td>
      <td><span class="badge" style="background:${getCatColor(tx.catId)}22;color:${getCatColor(tx.catId)}">${getCatName(tx.catId)}</span></td>
      <td><span class="badge badge-${tx.type}">${tx.type === 'income' ? t('incomeLabel') : t('expenseLabel')}</span></td>
      <td style="font-weight:600;color:${tx.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${tx.type === 'income' ? '+' : '\u2212'}${fmt(tx.amount)}</td>
    </tr>`).join('');
}

function saveNewUser() {
  const name = document.getElementById('newUserName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim();
  const pwd = document.getElementById('newUserPwd').value;
  const role = document.getElementById('newUserRole').value;
  if (!name || !email || !pwd) { alert(t('allFieldsRequired')); return; }
  const users = getUsers();
  if (users.find(u => u.email === email)) { alert(t('emailTaken')); return; }
  users.push({ id: uid(), name, email, pwd, role, active: true, deleteRequest: false });
  DB.set('users', users);
  closeModal('addUserModal');
  renderAdmin();
}

function toggleRole(id) {
  DB.set('users', getUsers().map(u => u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
  renderAdmin();
}

function toggleActive(id) {
  DB.set('users', getUsers().map(u => u.id === id ? { ...u, active: u.active === false ? true : false } : u));
  renderAdmin();
}

function deleteUser(id) {
  if (!confirm(t('confirmDeleteUser'))) return;
  DB.set('users', getUsers().filter(u => u.id !== id));
  renderAdmin();
}

function approveDelete(id) {
  if (!confirm(t('confirmDeleteAccount'))) return;
  DB.set('users', getUsers().filter(u => u.id !== id));
  renderAdmin();
}

function rejectDelete(id) {
  DB.set('users', getUsers().map(u => u.id === id ? { ...u, deleteRequest: false } : u));
  renderAdmin();
}

document.addEventListener('DOMContentLoaded', initApp);
