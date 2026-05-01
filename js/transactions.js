function renderDashboard() {
  const now = new Date();
  document.getElementById('dashDate').textContent = now.toLocaleDateString('fr-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('dashRoleInfo').innerHTML = CU.role === 'admin'
    ? '<span class="role-badge-admin">👑 Admin — vue globale</span>'
    : '<span class="role-badge-user">👤 Vos données uniquement</span>';

  const txs = getScopedTxs();
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const balance = income - expense;
  const savingRate = income > 0 ? ((balance / income) * 100).toFixed(0) : 0;

  document.getElementById('dashCards').innerHTML = `
    <div class="card"><div class="card-label">Total revenus</div><div class="card-value success">${fmt(income)}</div></div>
    <div class="card"><div class="card-label">Total dépenses</div><div class="card-value danger">${fmt(expense)}</div></div>
    <div class="card"><div class="card-label">Solde</div><div class="card-value ${balance >= 0 ? 'success' : 'danger'}">${fmt(balance)}</div></div>
    <div class="card"><div class="card-label">Taux d'épargne</div><div class="card-value ${savingRate >= 20 ? 'success' : savingRate >= 0 ? 'warning' : 'danger'}">${savingRate}%</div></div>
  `;

  const myBudgets = (DB.get('budgets') || []).filter(b => b.userId === CU.id);
  const myTxs = CU.role === 'admin' ? txs : (DB.get('transactions') || []).filter(t => t.userId === CU.id);
  let alerts = '';

  myBudgets.forEach(b => {
    const spent = myTxs
      .filter(t => t.type === 'expense' && t.dest === `budget-${b.id}` && (!b.catId || t.catId === b.catId))
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const pct = (spent / parseFloat(b.limit)) * 100;
    if (pct >= 100) alerts += `<div class="alert alert-danger">⚠️ Budget "${b.name}" dépassé ! (${fmt(spent)} / ${fmt(b.limit)})</div>`;
    else if (pct >= 80) alerts += `<div class="alert alert-warning">⚡ Budget "${b.name}" à ${pct.toFixed(0)}% — proche de la limite</div>`;
  });

  document.getElementById('dashAlerts').innerHTML = alerts;

  const cats = getCats();
  const expByCat = cats
    .map(c => ({ name: c.name, color: c.color, total: txs.filter(t => t.type === 'expense' && t.catId === c.id).reduce((s, t) => s + parseFloat(t.amount), 0) }))
    .filter(c => c.total > 0);

  if (pieCI) pieCI.destroy();
  pieCI = new Chart(document.getElementById('pieChart'), {
    type: 'doughnut',
    data: { labels: expByCat.map(c => c.name), datasets: [{ data: expByCat.map(c => c.total), backgroundColor: expByCat.map(c => c.color), borderWidth: 0 }] },
    options: { plugins: { legend: { labels: { color: '#e0e0e0', font: { size: 11 } } } }, cutout: '65%', responsive: true, maintainAspectRatio: false }
  });

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleDateString('fr-TN', { month: 'short' }), y: d.getFullYear(), m: d.getMonth() });
  }

  const iByM = months.map(m => txs.filter(t => t.type === 'income' && new Date(t.date).getMonth() === m.m && new Date(t.date).getFullYear() === m.y).reduce((s, t) => s + parseFloat(t.amount), 0));
  const eByM = months.map(m => txs.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === m.m && new Date(t.date).getFullYear() === m.y).reduce((s, t) => s + parseFloat(t.amount), 0));

  if (lineCI) lineCI.destroy();
  lineCI = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: { labels: months.map(m => m.label), datasets: [
      { label: 'Revenus', data: iByM, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)', tension: .4, fill: true },
      { label: 'Dépenses', data: eByM, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)', tension: .4, fill: true }
    ] },
    options: { plugins: { legend: { labels: { color: '#e0e0e0', font: { size: 11 } } } }, scales: { x: { ticks: { color: '#8892b0' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#8892b0' }, grid: { color: 'rgba(255,255,255,0.05)' } } }, responsive: true, maintainAspectRatio: false }
  });

  const recent = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  document.getElementById('dashTxBody').innerHTML = recent.map(t => `
    <tr>
      <td class="text-muted">${new Date(t.date).toLocaleDateString('fr-TN')}</td>
      <td>${t.desc}</td>
      <td><span class="badge" style="background:${getCatColor(t.catId)}22;color:${getCatColor(t.catId)}">${getCatName(t.catId)}</span></td>
      ${CU.role === 'admin' ? `<td><span class="pill" style="font-size:12px">${getUserName(t.userId)}</span></td>` : ''}
      <td style="font-weight:600;color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</td>
    </tr>`).join('') || '<tr><td colspan="5" class="empty-state">Aucune transaction</td></tr>';
}

function renderTransactionsTable() {
  const cats = getVisibleCatsForUser();
  const catSel = document.getElementById('txFilterCat');
  if (catSel) {
    const prev = catSel.value;
    catSel.innerHTML = '<option value="">Toutes catégories</option>' + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (prev) catSel.value = prev;
  }

  const filterType = document.getElementById('txFilterType')?.value || '';
  const filterCat = document.getElementById('txFilterCat')?.value || '';
  const filterUser = document.getElementById('txFilterUser')?.value || '';
  let txs = getScopedTxs().sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filterType) txs = txs.filter(t => t.type === filterType);
  if (filterCat) txs = txs.filter(t => t.catId === filterCat);
  if (filterUser) txs = txs.filter(t => t.userId === filterUser);

  document.getElementById('txBody').innerHTML = txs.map(t => `
    <tr>
      <td class="text-muted">${new Date(t.date).toLocaleDateString('fr-TN')}</td>
      <td>${t.desc}${t.notes ? `<div class="note-text">${t.notes}</div>` : ''}</td>
      <td><span class="badge" style="background:${getCatColor(t.catId)}22;color:${getCatColor(t.catId)}">${getCatName(t.catId)}</span></td>
      <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Revenu' : 'Dépense'}</span></td>
      <td><span class="badge" style="background:rgba(255,255,255,0.08);color:var(--text-muted);font-size:11px">${getBudgetName(t.dest)}</span></td>
      ${CU.role === 'admin' ? `<td><span class="pill" style="font-size:12px">${getUserName(t.userId)}</span></td>` : ''}
      <td style="font-weight:600;color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</td>
      <td><div class="actions">
        ${(t.userId === CU.id || CU.role === 'admin') ? `<button class="icon-btn" onclick="editTx('${t.id}')">✏️</button><button class="icon-btn del" onclick="deleteTx('${t.id}')">🗑️</button>` : '<span class="text-muted">—</span>'}
      </div></td>
    </tr>`).join('') || `<tr><td colspan="${CU.role === 'admin' ? 8 : 7}" class="empty-state">Aucune transaction</td></tr>`;
}

function openTxModal(id) {
  editTxId = id || null;
  const cats = getVisibleCats('wallet');
  document.getElementById('txCat').innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  const budgets = (DB.get('budgets') || []).filter(b => CU.role === 'admin' || b.userId === CU.id);
  const shared = (DB.get('sharedBudgets') || []).filter(s => s.members.includes(CU.id));
  let destHTML = '<option value="wallet">📱 Mon portefeuille</option>';
  destHTML += budgets.map(b => `<option value="budget-${b.id}">🎯 ${b.name}</option>`).join('');
  destHTML += shared.map(s => `<option value="group-${s.id}">👥 ${s.name}</option>`).join('');
  document.getElementById('txDest').innerHTML = destHTML;

  if (id) {
    const tx = (DB.get('transactions') || []).find(t => t.id === id);
    if (!tx) return;
    document.getElementById('txModalTitle').textContent = 'Modifier la transaction';
    document.getElementById('txType').value = tx.type;
    document.getElementById('txDesc').value = tx.desc;
    document.getElementById('txAmount').value = tx.amount;
    document.getElementById('txDate').value = tx.date;
    document.getElementById('txDest').value = tx.dest || 'wallet';
    updateTxCategoryOptions(tx.dest || 'wallet', tx.catId);
    document.getElementById('txNotes').value = tx.notes || '';
  } else {
    document.getElementById('txModalTitle').textContent = 'Ajouter une transaction';
    document.getElementById('txType').value = 'expense';
    document.getElementById('txDesc').value = '';
    document.getElementById('txAmount').value = '';
    document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('txDest').value = 'wallet';
    updateTxCategoryOptions('wallet');
    document.getElementById('txNotes').value = '';
  }
  syncTxTypeToDestination();
  document.getElementById('txModal').classList.add('open');
}

function updateTxCategoryOptions(dest, selectedCat) {
  const cats = getVisibleCats(dest);
  const catSelect = document.getElementById('txCat');
  catSelect.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  if (selectedCat && cats.find(c => c.id === selectedCat)) catSelect.value = selectedCat;
  else catSelect.value = cats[0]?.id || '';
}

function syncTxTypeToDestination() {
  const dest = document.getElementById('txDest').value;
  const typeEl = document.getElementById('txType');
  if (dest.startsWith('group-') || dest.startsWith('budget-')) {
    typeEl.value = 'expense';
    typeEl.disabled = true;
  } else {
    typeEl.disabled = false;
  }
  updateTxCategoryOptions(dest, document.getElementById('txCat')?.value);
}

function saveTx() {
  let type = document.getElementById('txType').value;
  const desc = document.getElementById('txDesc').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date = document.getElementById('txDate').value;
  const catId = document.getElementById('txCat').value;
  const notes = document.getElementById('txNotes').value.trim();
  const dest = document.getElementById('txDest').value;
  if (!desc || !amount || !date || !dest) return;
  if (dest.startsWith('group-') || dest.startsWith('budget-')) type = 'expense';
  let txs = DB.get('transactions') || [];
  if (editTxId) {
    txs = txs.map(t => t.id === editTxId ? { ...t, type, desc, amount, date, catId, notes, dest } : t);
  } else {
    txs.push({ id: uid(), userId: CU.id, type, desc, amount, date, catId, notes, dest });
  }
  DB.set('transactions', txs);
  closeModal('txModal');
  renderTransactionsTable();
  // Also refresh shared budgets if this transaction is for a group
  if (dest.startsWith('group-') && typeof renderShared === 'function') {
    renderShared();
  }
}

function editTx(id) {
  openTxModal(id);
}

function deleteTx(id) {
  if (!confirm('Supprimer cette transaction ?')) return;
  const txs = DB.get('transactions') || [];
  const tx = txs.find(t => t.id === id);
  DB.set('transactions', txs.filter(t => t.id !== id));
  renderTransactionsTable();
  // Also refresh shared budgets if this transaction was for a group
  if (tx && tx.dest && tx.dest.startsWith('group-') && typeof renderShared === 'function') {
    renderShared();
  }
}
