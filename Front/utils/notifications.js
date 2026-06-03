let _notifUnreadCount = 0;
let _notifList = [];

function initNotifications() {
  _notifUnreadCount = _cache.unreadCount || 0;
  _notifList = _cache.notifications || [];
  updateNotifBadge();
}

async function refreshNotifications() {
  try {
    const data = await apiFetch('notifications.php?all=1', { method: 'GET' });
    _cache.notifications = data.notifications || [];
    _cache.unreadCount = data.unreadCount || 0;
    _notifList = _cache.notifications;
    _notifUnreadCount = _cache.unreadCount;
    updateNotifBadge();
  } catch (e) {
    console.log('Notification refresh failed', e);
  }
}

function updateNotifBadge() {
  const badges = ['notifBadge', 'notifBadgeSide'];
  badges.forEach(id => {
    const badge = document.getElementById(id);
    if (!badge) return;
    if (_notifUnreadCount > 0) {
      badge.textContent = _notifUnreadCount > 99 ? '99+' : _notifUnreadCount;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  });
  const sub = document.getElementById('notifPageSub');
  if (sub) {
    sub.textContent = _notifUnreadCount > 0
      ? _notifUnreadCount + ' non lue(s)'
      : t('noData');
  }
}

function getUnreadCount() {
  return _notifUnreadCount;
}

async function markNotifRead(id) {
  await apiFetch('notifications.php', { method: 'POST', body: { id } });
  if (id === 'all') {
    _notifList.forEach(n => n.read = true);
    _notifUnreadCount = 0;
  } else {
    const n = _notifList.find(n => n.id === id);
    if (n) { n.read = true; _notifUnreadCount = Math.max(0, _notifUnreadCount - 1); }
  }
  updateNotifBadge();
}

function handleNotifClick(id, type, relatedId) {
  markNotifRead(id);
  if (type === 'pending_approval' && relatedId) {
    showPage('shared');
  }
}