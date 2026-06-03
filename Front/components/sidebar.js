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
      { icon: '\uD83D\uDD14', label: t('notifications'), page: 'notifications' },
      { icon: '\u2699\uFE0F', label: t('administration'), page: 'admin' },
      { icon: '\uD83D\uDD27', label: t('settings'), page: 'settings' }
    ]
    : [
      { icon: '\uD83D\uDCCA', label: t('dashboard'), page: 'dashboard' },
      { icon: '\uD83D\uDCB8', label: t('myTransactions'), page: 'transactions' },
      { icon: '\uD83D\uDCCB', label: t('myBudgets'), page: 'budgets' },
      { icon: '\uD83C\uDFF7\uFE0F', label: t('myCategories'), page: 'categories' },
      { icon: '\uD83D\uDC65', label: t('sharedBudgets'), page: 'shared' },
      { icon: '\uD83D\uDD14', label: t('notifications'), page: 'notifications' },
      { icon: '\uD83D\uDD27', label: t('settings'), page: 'settings' }
    ];

  return `
    <div class="sidebar-logo">\uD83D\uDCB0 ${t('appName')}</div>
    <div class="sidebar-user" style="cursor:pointer" onclick="showPage('notifications')">
      <div class="avatar" id="sidebarAvatar">${cu.name.charAt(0).toUpperCase()}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebarName">${cu.name}</div>
        <div id="sidebarRoleBadge">${isAdmin
      ? '<span class="role-badge-admin">' + t('adminLabel') + '</span>'
      : '<span class="role-badge-user">' + t('userLabel') + '</span>'}</div>
      </div>
      <div class="notif-bell-sidebar" id="notifBellSidebar" onclick="event.stopPropagation();showPage('notifications')" style="position:relative;margin-left:auto;font-size:18px;padding:4px 8px;border-radius:6px;transition:background 0.2s">
        \uD83D\uDD14
        <span class="notif-badge-sidebar" id="notifBadgeSide" style="display:none">0</span>
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
      <div class="nav-item" onclick="toggleTheme()" style="border-top:1px solid var(--border);margin-bottom:4px">
        <span class="nav-icon theme-toggle-icon">\u2600\uFE0F</span><span data-i18n="theme">Theme</span>
      </div>
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