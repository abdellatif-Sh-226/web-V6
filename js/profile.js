function openProfileModal() {
  document.getElementById('profName').value = CU.name;
  document.getElementById('profEmail').value = CU.email;
  document.getElementById('profPwd').value = '';
  document.getElementById('profMsg').textContent = '';
  document.getElementById('profMsg').className = 'auth-err';
  document.getElementById('profileModal').classList.add('open');
}

function saveProfile() {
  const name = document.getElementById('profName').value.trim();
  const email = document.getElementById('profEmail').value.trim();
  const pwd = document.getElementById('profPwd').value;
  if (!name || !email) {
    document.getElementById('profMsg').className = 'auth-err err';
    document.getElementById('profMsg').textContent = 'Nom et email requis.';
    return;
  }
  DB.set('users', getUsers().map(u => u.id === CU.id ? { ...u, name, email, pwd: pwd || u.pwd } : u));
  CU = { ...CU, name, email, pwd: pwd || CU.pwd };
  document.getElementById('sidebarAvatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('sidebarName').textContent = name;
  document.getElementById('profMsg').className = 'auth-err ok';
  document.getElementById('profMsg').textContent = 'Profil mis à jour !';
  setTimeout(() => closeModal('profileModal'), 1000);
}
