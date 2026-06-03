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
  const txBody = document.getElementById('txBody');
  if (!txBody) return;
  txBody.innerHTML = txs.length
    ? txs.map(tx => `
    <tr>
      <td class="text-muted">${new Date(tx.date).toLocaleDateString('fr-TN')}</td>
      <td>${tx.desc}${tx.notes ? `<div class="note-text">${tx.notes}</div>` : ''}</td>
      <td><span class="badge" style="background:${getCatColor(tx.catId)}22;color:${getCatColor(tx.catId)}">${getCatName(tx.catId)}</span></td>
      <td><span class="badge badge-${tx.type}">${tx.type === 'income' ? t('incomeLabel') : t('expenseLabel')}</span></td>
      <td><span class="badge" style="background:rgba(255,255,255,0.08);color:var(--text-muted);font-size:11px">${getBudgetName(tx.dest)}</span></td>
      ${isAdmin ? `<td><span class="pill" style="font-size:12px">${getUserName(tx.userId)}</span></td>` : ''}
      <td style="font-weight:600;color:${tx.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${tx.type === 'income' ? '+' : '\u2212'}${fmt(tx.amount)}</td>
      <td><div class="actions">
        ${(tx.userId === STATE.CU.id || isAdmin) ? `<button class="icon-btn" onclick="editTx('${tx.id}')">\u270F\uFE0F</button><button class="icon-btn del" onclick="deleteTx('${tx.id}')">\uD83D\uDDD1\uFE0F</button>` : '<span class="text-muted">\u2014</span>'}
      </div></td>
    </tr>`).join('')
    : `<tr><td colspan="${colspan}" class="empty-state">${t('noTransaction')}</td></tr>`;
}
