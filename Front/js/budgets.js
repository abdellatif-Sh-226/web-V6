function renderBudgets() {
  const isAdmin = STATE.CU.role === 'admin';
  const budgets = (DB.get('budgets') || []).filter(b => isAdmin || b.userId === STATE.CU.id);
  const txs = DB.get('transactions') || [];

  document.getElementById('budgetList').innerHTML = budgets.length ? budgets.map(b => {
    const budgetTxs = txs.filter(t => t.type === 'expense' && t.dest === `budget-${b.id}` && (!b.catId || t.catId === b.catId));
    const spent = budgetTxs.reduce((s, t) => s + parseFloat(t.amount), 0);
    const pct = Math.min((spent / parseFloat(b.limit)) * 100, 100);
    const color = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--success)';
    const statusLabel = pct >= 100 ? t('overspent') : pct >= 80 ? t('nearLimit') : t('controlled');
    const periodLabel = b.period === 'monthly' ? t('monthly') : b.period === 'weekly' ? t('weekly') : t('custom');
    return `<div class="section ${isAdmin ? 'admin-scope' : 'user-scope'}" style="margin-bottom:16px">
      <div class="section-header">
        <div>
          <div class="section-title">${b.name}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
            ${periodLabel} \u00B7 ${b.start} \u2192 ${b.end}
            ${isAdmin ? `<span class="pill" style="margin-left:8px;font-size:11px">${getUserName(b.userId)}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-sm btn-secondary" onclick="toggleBudgetDetails('${b.id}')">${t('seeDetails')}</button>
          <span class="badge" style="background:${color}22;color:${color}">${statusLabel}</span>
          ${(b.userId === STATE.CU.id || isAdmin) ? `<button class="icon-btn del" onclick="deleteBudget('${b.id}')">\uD83D\uDDD1\uFE0F</button>` : ''}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
        <span style="color:var(--text-muted)">${t('spent')}: <strong style="color:${color}">${fmt(spent)}</strong></span>
        <span style="color:var(--text-muted)">${t('limit')}: <strong>${fmt(b.limit)}</strong></span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
      <div style="text-align:right;font-size:12px;color:var(--text-muted);margin-top:6px">${pct.toFixed(1)}%</div>
      <div id="budget-detail-${b.id}" style="display:none;margin-top:16px;border-top:1px solid var(--border);padding-top:14px;font-size:14px;">
        ${budgetTxs.length ? `
          <div style="margin-bottom:12px;font-size:13px;font-weight:600;color:var(--text)">${t('expensesForBudget')}</div>
          <table class="table"><thead><tr><th>${t('date')}</th><th>${t('description')}</th><th>${t('category')}</th><th>${t('notes')}</th><th>${t('amount')}</th></tr></thead><tbody>
            ${budgetTxs.map(t => `<tr><td class="text-muted">${new Date(t.date).toLocaleDateString('fr-TN')}</td><td>${t.desc}</td><td><span class="badge" style="background:${getCatColor(t.catId)}22;color:${getCatColor(t.catId)}">${getCatName(t.catId)}</span></td><td class="text-muted">${t.notes || '\u2014'}</td><td style="font-weight:600;color:var(--danger)">\u2212${fmt(t.amount)}</td></tr>`).join('')}
          </tbody></table>` : '<div class="empty-state">' + t('noExpensesForBudget') + '</div>'}
      </div>
    </div>`;
  }).join('') : '<div class="section"><div class="empty-state">' + t('noBudget') + '</div></div>';
}

function openBudgetModal() {
  const cats = getCats();
  document.getElementById('budgetName').value = '';
  document.getElementById('budgetLimit').value = '';
  document.getElementById('budgetStart').value = new Date().toISOString().split('T')[0];
  const e = new Date();
  e.setMonth(e.getMonth() + 1);
  document.getElementById('budgetEnd').value = e.toISOString().split('T')[0];
  document.getElementById('budgetCat').innerHTML = '<option value="">' + t('filterAllCats') + '</option>' + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const userRow = document.getElementById('budgetUserRow');
  if (STATE.CU.role === 'admin') {
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
  const userId = STATE.CU.role === 'admin' ? (document.getElementById('budgetUser')?.value || STATE.CU.id) : STATE.CU.id;
  if (!name || !limit) return;
  const budgets = DB.get('budgets') || [];
  budgets.push({ id: uid(), userId, name, period, limit, catId, start, end });
  DB.set('budgets', budgets);
  closeModal('budgetModal');
  renderBudgets();
}

function deleteBudget(id) {
  if (!confirm(t('confirmDeleteBudget'))) return;
  DB.set('budgets', (DB.get('budgets') || []).filter(b => b.id !== id));
  renderBudgets();
}

function toggleBudgetDetails(id) {
  const el = document.getElementById(`budget-detail-${id}`);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
