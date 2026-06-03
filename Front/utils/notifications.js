let _notifUnreadCount = 0;
let _notifList = [];

function initNotifications() {
  _notifUnreadCount = _cache.unreadCount || 0;
  _notifList = _cache.notifications || [];
  updateNotifBadge();
}

async function refreshNotifications() {
  try {
    const data = await apiFetch('notifications.php', { method: 'GET' });
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
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  if (_notifUnreadCount > 0) {
    badge.textContent = _notifUnreadCount > 99 ? '99+' : _notifUnreadCount;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
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
  renderNotifDropdown();
}

function toggleNotifDropdown() {
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;
  const open = dd.classList.contains('open');
  dd.classList.toggle('open');
  if (!open) {
    renderNotifDropdown();
  } else {
    markNotifRead('all');
  }
}

function renderNotifDropdown() {
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;
  const notifs = _notifList.slice(0, 20);
  dd.innerHTML = `
    <div class="notif-header">
      <span>Notifications</span>
      <span class="notif-count">${_notifUnreadCount} non lue(s)</span>
    </div>
    ${notifs.length ? notifs.map(n => {
      const icon = n.type === 'pending_approval' ? '\u23F3' : n.type === 'approved' ? '\u2705' : n.type === 'rejected' ? '\u274C' : '\uD83D\uDD14';
      return `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${n.id}','${n.type}','${n.relatedId || ''}')">
        <div class="notif-icon">${icon}</div>
        <div class="notif-body">
          <div class="notif-title">${n.title}</div>
          <div class="notif-msg">${n.message}</div>
          <div class="notif-time">${new Date(n.createdAt).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>`;
    }).join('') : '<div class="notif-empty">Aucune notification</div>'}
    <div class="notif-footer" onclick="markNotifRead('all')">Tout marquer comme lu</div>
  `;
}

function handleNotifClick(id, type, relatedId) {
  markNotifRead(id);
  if (type === 'pending_approval' && relatedId) {
    showPage('shared');
  }
}
