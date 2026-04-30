function buildPages() {
  const isAdmin = CU.role === 'admin';
  document.getElementById('mainContent').innerHTML = `
    <div class="page" id="page-dashboard">${pageDashboard()}</div>
    <div class="page" id="page-transactions">${pageTransactions()}</div>
    <div class="page" id="page-budgets">${pageBudgets()}</div>
    <div class="page" id="page-categories">${pageCategories()}</div>
    <div class="page" id="page-shared">${pageShared()}</div>
    ${isAdmin ? `<div class="page" id="page-admin">${pageAdmin()}</div>` : ''}
  `;
}

function pageDashboard() {
  return `
  <div class="page-header">
    <div><div class="page-title">Tableau de bord</div><div class="page-subtitle" id="dashDate"></div></div>
    <div style="display:flex;align-items:center;gap:12px">
      <span id="dashRoleInfo"></span>
      <button class="btn btn-secondary btn-sm" onclick="openProfileModal()">✏️ Mon profil</button>
    </div>
  </div>
  <div id="dashAlerts"></div>
  <div class="cards-grid" id="dashCards"></div>
  <div class="two-col">
    <div class="section"><div class="section-title" style="margin-bottom:16px">Répartition des dépenses</div><div class="chart-wrap"><canvas id="pieChart"></canvas></div></div>
    <div class="section"><div class="section-title" style="margin-bottom:16px">Évolution mensuelle</div><div class="chart-wrap"><canvas id="lineChart"></canvas></div></div>
  </div>
  <div class="section">
    <div class="section-header"><span class="section-title">Transactions récentes</span></div>
    <table class="table"><thead><tr><th>Date</th><th>Description</th><th>Catégorie</th>${CU.role === 'admin' ? '<th>Utilisateur</th>' : ''}<th>Montant</th></tr></thead><tbody id="dashTxBody"></tbody></table>
  </div>`;
}

function pageTransactions() {
  return `
  <div class="page-header">
    <div><div class="page-title">${CU.role === 'admin' ? 'Toutes les transactions' : 'Mes transactions'}</div>
    ${CU.role === 'user' ? '<div class="page-subtitle">Vous ne voyez que vos propres transactions</div>' : ''}</div>
    <button class="btn btn-sm" onclick="openTxModal()">+ Ajouter</button>
  </div>
  <div class="section">
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <select id="txFilterType" onchange="renderTransactionsTable()" class="filter-select">
        <option value="">Tous les types</option><option value="income">Revenus</option><option value="expense">Dépenses</option>
      </select>
      <select id="txFilterCat" onchange="renderTransactionsTable()" class="filter-select">
        <option value="">Toutes catégories</option>
      </select>
      ${CU.role === 'admin' ? `<select id="txFilterUser" onchange="renderTransactionsTable()" class="filter-select">
        <option value="">Tous les utilisateurs</option>
        ${(DB.get('users') || []).map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
      </select>` : ''}
    </div>
    <table class="table"><thead><tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Type</th><th>Destination</th>${CU.role === 'admin' ? '<th>Par</th>' : ''}<th>Montant</th><th>Actions</th></tr></thead><tbody id="txBody"></tbody></table>
  </div>`;
}

function pageBudgets() {
  return `
  <div class="page-header">
    <div><div class="page-title">${CU.role === 'admin' ? 'Tous les budgets' : 'Mes budgets'}</div>
    ${CU.role === 'user' ? '<div class="page-subtitle">Vous gérez uniquement vos propres budgets</div>' : ''}</div>
    <button class="btn btn-sm" onclick="openBudgetModal()">+ Nouveau budget</button>
  </div>
  <div id="budgetList"></div>`;
}

function pageCategories() {
  const isAdmin = CU.role === 'admin';
  return `
  <div class="page-header">
    <div><div class="page-title">${isAdmin ? 'Catégories globales' : 'Mes catégories'}</div>
    <div class="page-subtitle">${isAdmin ? 'Gestion globale — visible par tous les utilisateurs' : 'Vos catégories privées — visibles uniquement par vous'}</div></div>
    <button class="btn btn-sm" onclick="openCatModal()">+ Ajouter</button>
  </div>
  <div class="section ${isAdmin ? 'admin-scope' : 'user-scope'}">
    ${!isAdmin ? '<div style="margin-bottom:16px;font-size:13px;color:var(--text-muted)">Ajoutez des catégories privées à votre compte. Elles ne seront visibles que par vous.</div>' : ''}
    <table class="table"><thead><tr><th>Nom</th><th>Couleur</th><th>Utilisée dans</th><th>Actions</th></tr></thead><tbody id="catBody"></tbody></table>
  </div>`;
}

function pageShared() {
  return `
  <div class="page-header">
    <div><div class="page-title">Budgets partagés</div>
    <div class="page-subtitle">${CU.role === 'admin' ? 'Tous les budgets partagés' : 'Les budgets dont vous faites partie'}</div></div>
    <button class="btn btn-sm" onclick="openSharedModal()">+ Créer</button>
  </div>
  <div id="sharedList"></div>`;
}

function pageAdmin() {
  return `
  <div class="page-header"><div><div class="page-title">⚙️ Administration</div><div class="page-subtitle">Gestion complète du système</div></div></div>
  <div class="admin-note">
    👑 <strong>Zone Admin exclusive</strong> — Seuls les administrateurs ont accès à cette page.
    Ici vous pouvez créer des comptes, gérer les rôles, et superviser tout le système.
  </div>
  <div class="cards-grid" id="adminCards"></div>
  <div class="section admin-scope">
    <div class="section-header">
      <span class="section-title">Gestion des utilisateurs</span>
      <button class="btn btn-sm" onclick="document.getElementById('addUserModal').classList.add('open')">+ Créer un compte</button>
    </div>
    <table class="table"><thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="adminUsersBody"></tbody></table>
  </div>
  <div class="section admin-scope">
    <div class="section-header"><span class="section-title">Demandes de suppression de compte</span></div>
    <div id="deleteRequests"></div>
  </div>
  <div class="section admin-scope">
    <div class="section-header"><span class="section-title">Vue globale — Toutes les transactions</span></div>
    <table class="table"><thead><tr><th>Date</th><th>Utilisateur</th><th>Description</th><th>Catégorie</th><th>Type</th><th>Montant</th></tr></thead><tbody id="adminTxBody"></tbody></table>
  </div>`;
}

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (!el) return;
  el.classList.add('active');
  const ni = document.getElementById('nav-' + page);
  if (ni) ni.classList.add('active');
  if (page === 'dashboard') renderDashboard();
  if (page === 'transactions') renderTransactionsTable();
  if (page === 'budgets') renderBudgets();
  if (page === 'categories') renderCategories();
  if (page === 'shared') renderShared();
  if (page === 'admin') renderAdmin();
}
