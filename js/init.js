async function initApp() {
  try {
    await loadAppData();
    CU = getCurrentUser();
    if (CU) {
      enterApp();
      return;
    }
  } catch (e) {
    console.warn('No active session or failed to load data', e);
  }
  document.getElementById('authPage').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
}

initApp();
