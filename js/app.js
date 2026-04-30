let CU = null;
let editTxId = null;
let sharedMembers = [];
let editingSharedId = null;
let pieCI = null;
let lineCI = null;
let catModalGroupId = null;

function uid() {
  return 'id' + Date.now() + Math.random().toString(36).substr(2, 5);
}

function fmt(n) {
  return parseFloat(n).toLocaleString('fr-TN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TND';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function getUserName(id) {
  const u = getUsers().find(u => u.id === id);
  return u ? u.name : '?';
}

const NAV_ADMIN = [
  { icon: '📊', label: 'Tableau de bord', page: 'dashboard' },
  { icon: '💸', label: 'Transactions', page: 'transactions' },
  { icon: '📋', label: 'Budgets', page: 'budgets' },
  { icon: '🏷️', label: 'Catégories', page: 'categories' },
  { icon: '👥', label: 'Budgets partagés', page: 'shared' },
  { icon: '⚙️', label: 'Administration', page: 'admin' },
];

const NAV_USER = [
  { icon: '📊', label: 'Tableau de bord', page: 'dashboard' },
  { icon: '💸', label: 'Mes transactions', page: 'transactions' },
  { icon: '📋', label: 'Mes budgets', page: 'budgets' },
  { icon: '🏷️', label: 'Mes catégories', page: 'categories' },
  { icon: '👥', label: 'Budgets partagés', page: 'shared' },
];

function getCats() {
  return DB.get('categories') || [];
}

function getUsers() {
  return DB.get('users') || [];
}

function getCatName(id) {
  const c = getCats().find(c => c.id === id);
  return c ? c.name : '—';
}

function getCatColor(id) {
  const c = getCats().find(c => c.id === id);
  return c ? c.color : '#888';
}

function getBaseCats() {
  return getCats().filter(c => !c.ownerId && !c.groupId);
}

function getUserCats() {
  return getCats().filter(c => c.ownerId === CU?.id && !c.groupId);
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
  if (CU?.role === 'admin') return getCats();
  const groups = (DB.get('sharedBudgets') || []).filter(s => s.members.includes(CU?.id));
  const groupCats = groups.flatMap(s => getGroupCats(s.id));
  return [...getBaseCats(), ...getUserCats(), ...groupCats];
}

function getBudgetName(destId) {
  if (destId === 'wallet') return '📱 Mon portefeuille';
  if (destId.startsWith('budget-')) {
    const bid = destId.replace('budget-', '');
    const b = (DB.get('budgets') || []).find(b => b.id === bid);
    return b ? `🎯 ${b.name}` : '🎯 Budget';
  }
  if (destId.startsWith('group-')) {
    const gid = destId.replace('group-', '');
    const g = (DB.get('sharedBudgets') || []).find(s => s.id === gid);
    return g ? `👥 ${g.name}` : '👥 Groupe';
  }
  return '—';
}

function getScopedTxs() {
  const all = DB.get('transactions') || [];
  return CU?.role === 'admin' ? all : all.filter(t => t.userId === CU?.id);
}
