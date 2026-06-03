function buildSidebar() {
  const cu = STATE.CU;
  if (!cu) return '';
  const isAdmin = cu.role === 'admin';
  const navItems = isAdmin
    ? [
        { icon: '\uD83D\uDCCA', label: 'Tableau de bord', page: 'dashboard' },
        { icon: '\uD83D\uDCB8', label: 'Transactions', page: 'transactions' },
        { icon: '\uD83D\uDCCB', label: 'Budgets', page: 'budgets' },
        { icon: '\uD83C\uDFF7\uFE0F', label: 'Cat\u00E9gories', page: 'categories' },
        { icon: '\uD83D\uDC65', label: 'Budgets partag\u00E9s', page: 'shared' },
        { icon: '\u2699\uFE0F', label: 'Administration', page: 'admin' }
      ]
    : [
        { icon: '\uD83D\uDCCA', label: 'Tableau de bord', page: 'dashboard' },
        { icon: '\uD83D\uDCB8', label: 'Mes transactions', page: 'transactions' },
        { icon: '\uD83D\uDCCB', label: 'Mes budgets', page: 'budgets' },
        { icon: '\uD83C\uDFF7\uFE0F', label: 'Mes cat\u00E9gories', page: 'categories' },
        { icon: '\uD83D\uDC65', label: 'Budgets partag\u00E9s', page: 'shared' }
      ];

  return `
    <div class="sidebar-logo">\uD83D\uDCB0 BudgetCollab</div>
    <div class="sidebar-user">
      <div class="avatar" id="sidebarAvatar">${cu.name.charAt(0).toUpperCase()}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name" id="sidebarName">${cu.name}</div>
        <div id="sidebarRoleBadge">${isAdmin
          ? '<span class="role-badge-admin">\uD83D\uDC51 Admin</span>'
          : '<span class="role-badge-user">\uD83D\uDC64 Utilisateur</span>'}</div>
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
      <div class="nav-item" onclick="doLogout()">
        <span class="nav-icon">\uD83D\uDEAA</span>D\u00E9connexion
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
      ? '<span class="role-badge-admin">\uD83D\uDC51 Admin</span>'
      : '<span class="role-badge-user">\uD83D\uDC64 Utilisateur</span>';
  }
}
