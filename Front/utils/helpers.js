function uid() {
  return 'id' + Date.now() + Math.random().toString(36).substr(2, 5);
}

// fmt is now in utils/i18n.js for currency-aware formatting

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function getCats() {
  return DB.get('categories') || [];
}

function getUsers() {
  return DB.get('users') || [];
}

function getCatName(id) {
  const c = getCats().find(c => c.id === id);
  return c ? c.name : '\u2014';
}

function getCatColor(id) {
  const c = getCats().find(c => c.id === id);
  return c ? c.color : '#888';
}

function getBaseCats() {
  return getCats().filter(c => !c.ownerId && !c.groupId);
}

function getUserCats() {
  return getCats().filter(c => c.ownerId === STATE.CU?.id && !c.groupId);
}

function getGroupCats(groupId) {
  return getCats().filter(c => c.groupId === groupId);
}

function getVisibleCats(dest) {
  if (dest && dest.startsWith('group-')) {
    const gid = dest.replace('group-', '');
    return [...getGroupCats(gid), ...getUserCats(), ...getBaseCats()];
  }
  if (dest && dest.startsWith('budget-')) {
    return [...getUserCats(), ...getBaseCats()];
  }
  return [...getUserCats(), ...getBaseCats()];
}

function getVisibleCatsForUser() {
  if (STATE.CU?.role === 'admin') return getCats();
  const groups = (DB.get('sharedBudgets') || []).filter(s => s.members.includes(STATE.CU?.id));
  const groupCats = groups.flatMap(s => getGroupCats(s.id));
  return [...getBaseCats(), ...getUserCats(), ...groupCats];
}

function getBudgetName(destId) {
  if (destId === 'wallet') return '\uD83D\uDCF1 Mon portefeuille';
  if (destId.startsWith('budget-')) {
    const bid = destId.replace('budget-', '');
    const b = (DB.get('budgets') || []).find(b => b.id === bid);
    return b ? `\uD83C\uDFAF ${b.name}` : '\uD83C\uDFAF Budget';
  }
  if (destId.startsWith('group-')) {
    const gid = destId.replace('group-', '');
    const g = (DB.get('sharedBudgets') || []).find(s => s.id === gid);
    return g ? `\uD83D\uDC65 ${g.name}` : '\uD83D\uDC65 Groupe';
  }
  return '\u2014';
}

function getScopedTxs() {
  const all = DB.get('transactions') || [];
  return STATE.CU?.role === 'admin' ? all : all.filter(t => t.userId === STATE.CU?.id);
}

function getUserName(id) {
  const u = getUsers().find(u => u.id === id);
  return u ? u.name : '?';
}
