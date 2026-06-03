function openProfileModal() {
  document.getElementById('profName').value = STATE.CU.name;
  document.getElementById('profEmail').value = STATE.CU.email;
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
    document.getElementById('profMsg').textContent = t('profileRequired');
    return;
  }
  DB.set('users', getUsers().map(u => u.id === STATE.CU.id ? { ...u, name, email, pwd: pwd || u.pwd } : u));
  STATE.CU = { ...STATE.CU, name, email, pwd: pwd || STATE.CU.pwd };
  updateSidebarUser();
  document.getElementById('profMsg').className = 'auth-err ok';
  document.getElementById('profMsg').textContent = t('profileSaved');
  setTimeout(() => closeModal('profileModal'), 1000);
}
