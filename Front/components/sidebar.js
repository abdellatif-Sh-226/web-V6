function buildSidebar() {
  const cu = STATE.CU;
  if (!cu) return '';
  const isAdmin = cu.role === 'admin';
  const navItems = isAdmin
    ? [
        { icon: '\uD83D\uDCCA', label: t('dashboard'), page: 'dashboard' },
        { icon: '\uD83D\uDCB8', label: t('transactions'), page: 'transactions' },
        { icon: '\uD83D\uDCCB', label: t('budgets'), page: 'budgets' },
        { icon: '\uD83C\uDFF7\uFE0F', label: t('categories'), page: 'categories' },
        { icon: '\uD83D\uDC65', label: t('sharedBudgets'), page: 'shared' },
        { icon: '\u2699\uFE0F', label: t('administration'), page: 'admin' },
        { icon: '\uD83D\uDD27', label: t('settings'), page: 'settings' }
      ]
    : [
        { icon: '\uD83D\uDCCA', label: t('dashboard'), page: 'dashboard' },
        { icon: '\uD83D\uDCB8', label: t('myTransactions'), page: 'transactions' },
        { icon: '\uD83D\uDCCB', label: t('myBudgets'), page: 'budgets' },
        { icon: '\uD83C\uDFF7\uFE0F', label: t('myCategories'), page: 'categories' },
        { icon: '\uD83D\uDC65', label: t('sharedBudgets'), page: 'shared' },
        { icon: '\uD83D\uDD27', label: t('settings'), page: 'settings' }
      ];

  return `
    <div class="sidebar-logo">\uD83D\uDCB0 ${t('appName')}</div>
    <div class="sidebar-user">
      <div class="avatar" id="sidebarAvatar">${cu.name.charAt(0).toUpperCase()}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebarName">${cu.name}</div>
        <div id="sidebarRoleBadge">${isAdmin
          ? '<span class="role-badge-admin">' + t('adminLabel') + '</span>'
          : '<span class="role-badge-user">' + t('userLabel') + '</span>'}</div>
      </div>
    </div>
    <nav class="nav" id="sidebarNav">
      ${navItems.map(n =>
        `<div class="nav-item" id="nav-${n.page}" onclick="showPage('${n.page}')">
          <span class="nav-icon">${n.icon}</span>${n.label}
        </div>`
      ).join('')}
    </nav>
    <div class="sidebar-bottom">
      <div class="notif-bell-wrap">${buildNotificationBell()}</div>
      <div class="nav-item" onclick="doLogout()">
        <span class="nav-icon">\uD83D\uDEAA</span>${t('logout')}
      </div>
    </div>`;
}

function updateSidebarUser() {
  const cu = STATE.CU;
  if (!cu) return;
  const avatar = document.getElementById('sidebarAvatar');
  const name = document.getElementById('sidebarName');
  const badge = document.getElementById('sidebarRoleBadge');
  if (avatar) avatar.textContent = cu.name.charAt(0).toUpperCase();
  if (name) name.textContent = cu.name;
  if (badge) {
    badge.innerHTML = cu.role === 'admin'
      ? '<span class="role-badge-admin">' + t('adminLabel') + '</span>'
      : '<span class="role-badge-user">' + t('userLabel') + '</span>';
  }
}
