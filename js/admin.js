function renderAdmin() {
  const users = getUsers();
  const txs = DB.get('transactions') || [];
  const budgets = DB.get('budgets') || [];
  const shared = DB.get('sharedBudgets') || [];

  document.getElementById('adminCards').innerHTML = `
    <div class="card"><div class="card-label">Utilisateurs</div><div class="card-value accent">${users.length}</div></div>
    <div class="card"><div class="card-label">Transactions totales</div><div class="card-value accent">${txs.length}</div></div>
    <div class="card"><div class="card-label">Budgets</div><div class="card-value accent">${budgets.length}</div></div>
    <div class="card"><div class="card-label">Budgets partagés</div><div class="card-value accent">${shared.length}</div></div>
  `;

  document.getElementById('adminUsersBody').innerHTML = users.map(u => `
    <tr>
      <td style="font-weight:500">${u.name}${u.id === CU.id ? ' <span style="font-size:11px;color:var(--text-muted)">(vous)</span>' : ''}</td>
      <td style="color:var(--text-muted);font-size:13px">${u.email}</td>
      <td>${u.role === 'admin' ? '<span class="role-badge-admin">👑 Admin</span>' : '<span class="role-badge-user">👤 User</span>'}</td>
      <td><span style="color:${u.active !== false ? 'var(--success)' : 'var(--danger)'};font-size:13px">${u.active !== false ? '✓ Actif' : '✗ Inactif'}</span></td>
      <td><div class="actions">
        ${u.id !== CU.id ? `
          <button class="icon-btn" onclick="toggleRole('${u.id}')" title="Changer le rôle">${u.role === 'admin' ? '→ User' : '→ Admin'}</button>
          <button class="icon-btn" onclick="toggleActive('${u.id}')" title="${u.active !== false ? 'Désactiver' : 'Activer'}">${u.active !== false ? '🔒' : '🔓'}</button>
          <button class="icon-btn del" onclick="deleteUser('${u.id}')">🗑️</button>
        ` : '<span style="font-size:12px;color:var(--text-muted)">—</span>'}
      </div></td>
    </tr>`).join('');

  const reqs = users.filter(u => u.deleteRequest);
  document.getElementById('deleteRequests').innerHTML = reqs.length ? reqs.map(u => `
    <div class="delete-request-row">
      <div><strong>${u.name}</strong> <span style="color:var(--text-muted);font-size:13px">(${u.email})</span> demande la suppression de son compte</div>
      <div class="actions">
        <button class="btn btn-danger btn-sm" onclick="approveDelete('${u.id}')">Approuver</button>
        <button class="btn btn-secondary btn-sm" onclick="rejectDelete('${u.id}')">Rejeter</button>
      </div>
    </div>`).join('') : '<div style="color:var(--text-muted);font-size:14px">Aucune demande en attente</div>';

  const allTxsSorted = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  document.getElementById('adminTxBody').innerHTML = allTxsSorted.map(t => `
    <tr>
      <td class="text-muted">${new Date(t.date).toLocaleDateString('fr-TN')}</td>
      <td><span class="pill" style="font-size:12px">${getUserName(t.userId)}</span></td>
      <td>${t.desc}</td>
      <td><span class="badge" style="background:${getCatColor(t.catId)}22;color:${getCatColor(t.catId)}">${getCatName(t.catId)}</span></td>
      <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Revenu' : 'Dépense'}</span></td>
      <td style="font-weight:600;color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</td>
    </tr>`).join('');
}

function saveNewUser() {
  const name = document.getElementById('newUserName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim();
  const pwd = document.getElementById('newUserPwd').value;
  const role = document.getElementById('newUserRole').value;
  if (!name || !email || !pwd) {
    alert('Tous les champs sont requis.');
    return;
  }
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    alert('Cet email est déjà utilisé.');
    return;
  }
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
  if (!confirm('Supprimer définitivement cet utilisateur ?')) return;
  DB.set('users', getUsers().filter(u => u.id !== id));
  renderAdmin();
}

function approveDelete(id) {
  if (!confirm('Approuver et supprimer ce compte ?')) return;
  DB.set('users', getUsers().filter(u => u.id !== id));
  renderAdmin();
}

function rejectDelete(id) {
  DB.set('users', getUsers().map(u => u.id === id ? { ...u, deleteRequest: false } : u));
  renderAdmin();
}
