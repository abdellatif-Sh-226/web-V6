function openTxModal(id) {
  STATE.editTxId = id || null;
  const cats = getVisibleCats('wallet');
  document.getElementById('txCat').innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  const budgets = (DB.get('budgets') || []).filter(b => STATE.CU.role === 'admin' || b.userId === STATE.CU.id);
  const shared = (DB.get('sharedBudgets') || []).filter(s => s.members.includes(STATE.CU.id));
  let destHTML = '<option value="wallet">\uD83D\uDCF1 ' + t('wallet') + '</option>';
  destHTML += budgets.map(b => `<option value="budget-${b.id}">\uD83C\uDFAF ${b.name}</option>`).join('');
  destHTML += shared.map(s => `<option value="group-${s.id}">\uD83D\uDC65 ${s.name}</option>`).join('');
  document.getElementById('txDest').innerHTML = destHTML;

  if (id) {
    const tx = (DB.get('transactions') || []).find(t => t.id === id);
    if (!tx) return;
    document.getElementById('txModalTitle').textContent = t('editTx');
    document.getElementById('txType').value = tx.type;
    document.getElementById('txDesc').value = tx.desc;
    document.getElementById('txAmount').value = tx.amount;
    document.getElementById('txDate').value = tx.date;
    document.getElementById('txDest').value = tx.dest || 'wallet';
    updateTxCategoryOptions(tx.dest || 'wallet', tx.catId);
    document.getElementById('txNotes').value = tx.notes || '';
  } else {
    document.getElementById('txModalTitle').textContent = t('newTx');
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
  if (STATE.editTxId) {
    txs = txs.map(t => t.id === STATE.editTxId ? { ...t, type, desc, amount, date, catId, notes, dest } : t);
  } else {
    txs.push({ id: uid(), userId: STATE.CU.id, type, desc, amount, date, catId, notes, dest });
  }
  DB.set('transactions', txs);
  closeModal('txModal');
  renderTransactionsTable();
  if (dest.startsWith('group-') && typeof renderShared === 'function') {
    renderShared();
  }
}

function editTx(id) {
  openTxModal(id);
}

function deleteTx(id) {
  if (!confirm(t('confirmDelete'))) return;
  apiFetch(`delete_transaction.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    .then(() => {
      const txs = DB.get('transactions') || [];
      const tx = txs.find(t => t.id === id);
      DB.set('transactions', txs.filter(t => t.id !== id));
      renderTransactionsTable();
      if (tx && tx.dest && tx.dest.startsWith('group-') && typeof renderShared === 'function') {
        renderShared();
      }
    })
    .catch(error => {
      console.error('Failed to delete transaction:', error);
      alert(t('deleteError'));
    });
}
