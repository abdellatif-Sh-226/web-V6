async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pwd = document.getElementById('loginPwd').value;
  if (!email || !pwd) {
    document.getElementById('authErr').textContent = 'Email et mot de passe requis.';
    return;
  }

  try {
    await apiFetch('api/login.php', { method: 'POST', body: { email, password: pwd } });
    await loadAppData();
    CU = getCurrentUser();
    if (!CU) {
      throw new Error('Utilisateur introuvable après connexion.');
    }
    document.getElementById('authErr').textContent = '';
    enterApp();
  } catch (e) {
    document.getElementById('authErr').textContent = e.message || 'Email ou mot de passe incorrect.';
  }
}

async function doLogout() {
  try {
    await apiFetch('api/logout.php', { method: 'POST' });
  } catch (e) {
    console.error('Logout error', e);
  }
  CU = null;
  currentUser = null;
  document.getElementById('authPage').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPwd').value = '';
  document.getElementById('authErr').textContent = '';
}

function enterApp() {
  document.getElementById('authPage').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';
  const isAdmin = CU.role === 'admin';
  document.getElementById('sidebarAvatar').textContent = CU.name.charAt(0).toUpperCase();
  document.getElementById('sidebarName').textContent = CU.name;
  document.getElementById('sidebarRoleBadge').innerHTML = isAdmin
    ? '<span class="role-badge-admin">👑 Admin</span>'
    : '<span class="role-badge-user">👤 Utilisateur</span>';
  const nav = isAdmin ? NAV_ADMIN : NAV_USER;
  document.getElementById('sidebarNav').innerHTML = nav
    .map(n => `<div class="nav-item" id="nav-${n.page}" onclick="showPage('${n.page}')"><span class="nav-icon">${n.icon}</span>${n.label}</div>`)
    .join('');
  buildPages();
  showPage('dashboard');
}

function requestDeleteAccount() {
  if (!confirm('Soumettre une demande de suppression de compte ?')) return;
  DB.set('users', getUsers().map(u => (u.id === CU.id ? { ...u, deleteRequest: true } : u)));
  alert('Demande soumise. Un administrateur la traitera.');
}
