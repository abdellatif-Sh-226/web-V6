function renderSettings() {
  const cu = STATE.CU;
  document.getElementById('settingsName').value = cu.name;
  document.getElementById('settingsEmail').value = cu.email;

  const currentLang = localStorage.getItem('monexa_lang') || 'fr';
  const langRadio = document.querySelector(`input[name="lang"][value="${currentLang}"]`);
  if (langRadio) langRadio.checked = true;

  const curCode = localStorage.getItem('monexa_currency') || 'TND';
  document.getElementById('settingsCurrency').value = curCode;
  updateCurrencyPreview(curCode);

  const isAutoRefresh = STATE.autoRefreshInterval !== null;
  document.getElementById('settingsAutoRefresh').checked = isAutoRefresh;

  document.getElementById('settingsProfileMsg').textContent = '';
  document.getElementById('settingsPwdMsg').textContent = '';
}

function saveSettingsProfile() {
  const name = document.getElementById('settingsName').value.trim();
  const email = document.getElementById('settingsEmail').value.trim();
  const msg = document.getElementById('settingsProfileMsg');
  if (!name || !email) {
    msg.className = 'auth-err err';
    msg.textContent = t('profileRequired');
    return;
  }
  DB.set('users', getUsers().map(u => u.id === STATE.CU.id ? { ...u, name, email } : u));
  STATE.CU = { ...STATE.CU, name, email };
  updateSidebarUser();
  msg.className = 'auth-err ok';
  msg.textContent = t('profileSaved');
}

function changeLanguage(code) {
  if (code === 'en') setLanguage(LANG_EN);
  else setLanguage(LANG_FR);
  location.reload();
}

function changeCurrency(code) {
  setCurrency(code);
  updateCurrencyPreview(code);
  const msg = document.getElementById('settingsProfileMsg');
  msg.className = 'auth-err ok';
  msg.textContent = t('currencyUpdated');
}

function updateCurrencyPreview(code) {
  const el = document.getElementById('currencyPreview');
  const cur = CURRENCIES[code] || CURRENCIES.TND;
  el.textContent = parseFloat(1234.56).toLocaleString(cur.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + cur.suffix;
}

function toggleAutoRefresh(enabled) {
  if (enabled) startAutoRefresh();
  else stopAutoRefresh();
}

function changeSettingsPassword() {
  const old = document.getElementById('settingsOldPwd').value;
  const pwd = document.getElementById('settingsNewPwd').value;
  const confirm = document.getElementById('settingsConfirmPwd').value;
  const msg = document.getElementById('settingsPwdMsg');

  if (!old || !pwd || !confirm) {
    msg.className = 'auth-err err';
    msg.textContent = t('passwordRequired');
    return;
  }
  if (pwd !== confirm) {
    msg.className = 'auth-err err';
    msg.textContent = t('passwordMismatch');
    return;
  }
  if (old !== STATE.CU.pwd) {
    msg.className = 'auth-err err';
    msg.textContent = t('wrongPassword');
    return;
  }
  DB.set('users', getUsers().map(u => u.id === STATE.CU.id ? { ...u, pwd } : u));
  STATE.CU = { ...STATE.CU, pwd };
  msg.className = 'auth-err ok';
  msg.textContent = t('passwordChanged');
  document.getElementById('settingsOldPwd').value = '';
  document.getElementById('settingsNewPwd').value = '';
  document.getElementById('settingsConfirmPwd').value = '';
}
