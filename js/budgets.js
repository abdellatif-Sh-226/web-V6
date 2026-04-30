function renderBudgets() {
  const budgets = (DB.get('budgets') || []).filter(b => CU.role === 'admin' || b.userId === CU.id);
  const txs = DB.get('transactions') || [];

  document.getElementById('budgetList').innerHTML = budgets.length ? budgets.map(b => {
    const budgetTxs = txs.filter(t => t.type === 'expense' && t.dest === `budget-${b.id}` && (!b.catId || t.catId === b.catId));
    const spent = budgetTxs.reduce((s, t) => s + parseFloat(t.amount), 0);
    const pct = Math.min((spent / parseFloat(b.limit)) * 100, 100);
    const color = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--success)';
    const status = pct >= 100 ? 'Dépassé' : pct >= 80 ? 'Proche limite' : 'Maîtrisé';
    return `<div class="section ${CU.role === 'admin' ? 'admin-scope' : 'user-scope'}" style="margin-bottom:16px">
      <div class="section-header">
        <div>
          <div class="section-title">${b.name}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
            ${b.period === 'monthly' ? 'Mensuel' : b.period === 'weekly' ? 'Hebdomadaire' : 'Personnalisé'} · ${b.start} → ${b.end}
            ${CU.role === 'admin' ? `<span class="pill" style="margin-left:8px;font-size:11px">${getUserName(b.userId)}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-sm btn-secondary" onclick="toggleBudgetDetails('${b.id}')">Voir détails</button>
          <span class="badge" style="background:${color}22;color:${color}">${status}</span>
          ${(b.userId === CU.id || CU.role === 'admin') ? `<button class="icon-btn del" onclick="deleteBudget('${b.id}')">🗑️</button>` : ''}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
        <span style="color:var(--text-muted)">Dépensé: <strong style="color:${color}">${fmt(spent)}</strong></span>
        <span style="color:var(--text-muted)">Plafond: <strong>${fmt(b.limit)}</strong></span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
      <div style="text-align:right;font-size:12px;color:var(--text-muted);margin-top:6px">${pct.toFixed(1)}%</div>
      <div id="budget-detail-${b.id}" style="display:none;margin-top:16px;border-top:1px solid var(--border);padding-top:14px;font-size:14px;">
        ${budgetTxs.length ? `
          <div style="margin-bottom:12px;font-size:13px;font-weight:600;color:var(--text)">Dépenses liées à ce budget</div>
          <table class="table"><thead><tr><th>Date</th><th>Description</th><th>Catégorie</th><th>Notes</th><th>Montant</th></tr></thead><tbody>
            ${budgetTxs.map(t => `<tr><td class="text-muted">${new Date(t.date).toLocaleDateString('fr-TN')}</td><td>${t.desc}</td><td><span class="badge" style="background:${getCatColor(t.catId)}22;color:${getCatColor(t.catId)}">${getCatName(t.catId)}</span></td><td class="text-muted">${t.notes || '—'}</td><td style="font-weight:600;color:var(--danger)">−${fmt(t.amount)}</td></tr>`).join('')}
          </tbody></table>` : '<div class="empty-state">Aucune dépense liée à ce budget.</div>'}
      </div>
    </div>`;
  }).join('') : '<div class="section"><div class="empty-state">Aucun budget</div></div>';
}

function openBudgetModal() {
  const cats = getCats();
  document.getElementById('budgetName').value = '';
  document.getElementById('budgetLimit').value = '';
  document.getElementById('budgetStart').value = new Date().toISOString().split('T')[0];
  const e = new Date();
  e.setMonth(e.getMonth() + 1);
  document.getElementById('budgetEnd').value = e.toISOString().split('T')[0];
  document.getElementById('budgetCat').innerHTML = '<option value="">Toutes les catégories</option>' + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const userRow = document.getElementById('budgetUserRow');
  if (CU.role === 'admin') {
    userRow.style.display = 'block';
    document.getElementById('budgetUser').innerHTML = getUsers().map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  } else {
    userRow.style.display = 'none';
  }
  document.getElementById('budgetModal').classList.add('open');
}

function saveBudget() {
  const name = document.getElementById('budgetName').value.trim();
  const limit = parseFloat(document.getElementById('budgetLimit').value);
  const period = document.getElementById('budgetPeriod').value;
  const catId = document.getElementById('budgetCat').value;
  const start = document.getElementById('budgetStart').value;
  const end = document.getElementById('budgetEnd').value;
  const userId = CU.role === 'admin' ? (document.getElementById('budgetUser')?.value || CU.id) : CU.id;
  if (!name || !limit) return;
  const budgets = DB.get('budgets') || [];
  budgets.push({ id: uid(), userId, name, period, limit, catId, start, end });
  DB.set('budgets', budgets);
  closeModal('budgetModal');
  renderBudgets();
}

function deleteBudget(id) {
  if (!confirm('Supprimer ce budget ?')) return;
  DB.set('budgets', (DB.get('budgets') || []).filter(b => b.id !== id));
  renderBudgets();
}

function toggleBudgetDetails(id) {
  const el = document.getElementById(`budget-detail-${id}`);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
