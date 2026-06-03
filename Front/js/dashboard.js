function renderDashboard() {
  const now = new Date();
  document.getElementById('dashDate').textContent = now.toLocaleDateString('fr-TN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const roleInfo = document.getElementById('dashRoleInfo');
  if (roleInfo) {
    roleInfo.innerHTML = STATE.CU.role === 'admin'
      ? '<span class="role-badge-admin">\uD83D\uDC51 ' + t('adminView') + '</span>'
      : '<span class="role-badge-user">\uD83D\uDC64 ' + t('yourDataOnly') + '</span>';
  }

  const userHeader = document.getElementById('dashUserHeader');
  if (userHeader) userHeader.style.display = STATE.CU.role === 'admin' ? '' : 'none';

  const txs = getScopedTxs();
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const balance = income - expense;
  const savingRate = income > 0 ? ((balance / income) * 100).toFixed(0) : 0;

  document.getElementById('dashCards').innerHTML = `
    <div class="card"><div class="card-label">${t('totalRevenue')}</div><div class="card-value success">${fmt(income)}</div></div>
    <div class="card"><div class="card-label">${t('totalExpenses')}</div><div class="card-value danger">${fmt(expense)}</div></div>
    <div class="card"><div class="card-label">${t('balance')}</div><div class="card-value ${balance >= 0 ? 'success' : 'danger'}">${fmt(balance)}</div></div>
    <div class="card"><div class="card-label">${t('savingRate')}</div><div class="card-value ${savingRate >= 20 ? 'success' : savingRate >= 0 ? 'warning' : 'danger'}">${savingRate}%</div></div>
  `;

  const myBudgets = (DB.get('budgets') || []).filter(b => b.userId === STATE.CU.id);
  const myTxs = STATE.CU.role === 'admin' ? txs : (DB.get('transactions') || []).filter(t => t.userId === STATE.CU.id);
  let alerts = '';

  myBudgets.forEach(b => {
    const spent = myTxs
      .filter(t => t.type === 'expense' && t.dest === `budget-${b.id}` && (!b.catId || t.catId === b.catId))
      .reduce((s, t) => s + parseFloat(t.amount), 0);
    const pct = (spent / parseFloat(b.limit)) * 100;
    if (pct >= 100) alerts += `<div class="alert alert-danger">\u26A0\uFE0F ${t('budgetOverspent')} "${b.name}" (${fmt(spent)} / ${fmt(b.limit)})</div>`;
    else if (pct >= 80) alerts += `<div class="alert alert-warning">\u26A1 ${t('budgetNearLimit')} "${b.name}" ${pct.toFixed(0)}%</div>`;
  });

  document.getElementById('dashAlerts').innerHTML = alerts;

  const cats = getCats();
  const expByCat = cats
    .map(c => ({ name: c.name, color: c.color, total: txs.filter(t => t.type === 'expense' && t.catId === c.id).reduce((s, t) => s + parseFloat(t.amount), 0) }))
    .filter(c => c.total > 0);

  if (STATE.pieCI) STATE.pieCI.destroy();
  STATE.pieCI = new Chart(document.getElementById('pieChart'), {
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

  if (STATE.lineCI) STATE.lineCI.destroy();
  STATE.lineCI = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        { label: t('revenue'), data: iByM, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)', tension: .4, fill: true },
        { label: t('expenses'), data: eByM, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.1)', tension: .4, fill: true }
      ]
    },
    options: {
      plugins: { legend: { labels: { color: '#e0e0e0', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#8892b0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#8892b0' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      },
      responsive: true, maintainAspectRatio: false
    }
  });

  const recent = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  document.getElementById('dashTxBody').innerHTML = recent.map(t => `
    <tr>
      <td class="text-muted">${new Date(t.date).toLocaleDateString('fr-TN')}</td>
      <td>${t.desc}</td>
      <td><span class="badge" style="background:${getCatColor(t.catId)}22;color:${getCatColor(t.catId)}">${getCatName(t.catId)}</span></td>
      ${STATE.CU.role === 'admin' ? `<td><span class="pill" style="font-size:12px">${getUserName(t.userId)}</span></td>` : ''}
      <td style="font-weight:600;color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '\u2212'}${fmt(t.amount)}</td>
    </tr>`).join('') || '<tr><td colspan="5" class="empty-state">' + t('noTransaction') + '</td></tr>';
}
