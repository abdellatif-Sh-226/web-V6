function renderTransactionsTable() {
  const isAdmin = STATE.CU.role === 'admin';

  const userHeader = document.getElementById('txUserHeader');
  if (userHeader) userHeader.style.display = isAdmin ? '' : 'none';

  const userFilter = document.getElementById('txFilterUser');
  if (userFilter) {
    userFilter.style.display = isAdmin ? '' : 'none';
    if (isAdmin) {
      const prev = userFilter.value;
      userFilter.innerHTML = '<option value="">' + t('filterAllUsers') + '</option>' +
        (DB.get('users') || []).map(u => `<option value="${u.id}">${u.name}</option>`).join('');
      if (prev) userFilter.value = prev;
    }
  }

  const cats = getVisibleCatsForUser();
  const catSel = document.getElementById('txFilterCat');
  if (catSel) {
    const prev = catSel.value;
    catSel.innerHTML = '<option value="">' + t('filterAllCats') + '</option>' + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (prev) catSel.value = prev;
  }

  const filterType = document.getElementById('txFilterType')?.value || '';
  const filterCat = document.getElementById('txFilterCat')?.value || '';
  const filterUser = document.getElementById('txFilterUser')?.value || '';
  let txs = getScopedTxs().sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filterType) txs = txs.filter(t => t.type === filterType);
  if (filterCat) txs = txs.filter(t => t.catId === filterCat);
  if (filterUser) txs = txs.filter(t => t.userId === filterUser);

  const colspan = isAdmin ? 8 : 7;
  document.getElementById('txBody').innerHTML = txs.length
    ? txs.map(t => `
    <tr>
      <td class="text-muted">${new Date(t.date).toLocaleDateString('fr-TN')}</td>
      <td>${t.desc}${t.notes ? `<div class="note-text">${t.notes}</div>` : ''}</td>
      <td><span class="badge" style="background:${getCatColor(t.catId)}22;color:${getCatColor(t.catId)}">${getCatName(t.catId)}</span></td>
      <td><span class="badge badge-${t.type}">${t.type === 'income' ? t('incomeLabel') : t('expenseLabel')}</span></td>
      <td><span class="badge" style="background:rgba(255,255,255,0.08);color:var(--text-muted);font-size:11px">${getBudgetName(t.dest)}</span></td>
      ${isAdmin ? `<td><span class="pill" style="font-size:12px">${getUserName(t.userId)}</span></td>` : ''}
      <td style="font-weight:600;color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '\u2212'}${fmt(t.amount)}</td>
      <td><div class="actions">
        ${(t.userId === STATE.CU.id || isAdmin) ? `<button class="icon-btn" onclick="editTx('${t.id}')">\u270F\uFE0F</button><button class="icon-btn del" onclick="deleteTx('${t.id}')">\uD83D\uDDD1\uFE0F</button>` : '<span class="text-muted">\u2014</span>'}
      </div></td>
    </tr>`).join('')
    : `<tr><td colspan="${colspan}" class="empty-state">${t('noTransaction')}</td></tr>`;
}
