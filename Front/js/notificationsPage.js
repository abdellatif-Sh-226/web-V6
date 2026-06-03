function renderNotificationsPage() {
  const allNotifs = _cache.notifications || [];
  const unread = allNotifs.filter(n => !n.read).length;
  document.getElementById('notifPageSub').textContent = unread > 0
    ? unread + ' non lue(s)'
    : t('noData');

  document.getElementById('notifList').innerHTML = allNotifs.length
    ? allNotifs.map(n => {
        const icon = n.type === 'pending_approval' ? '\u23F3' : n.type === 'approved' ? '\u2705' : n.type === 'rejected' ? '\u274C' : '\uD83D\uDD14';
        return `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotifClick('${n.id}','${n.type}','${n.relatedId || ''}')" style="border-radius:8px;margin-bottom:4px">
          <div class="notif-icon">${icon}</div>
          <div class="notif-body">
            <div class="notif-title">${n.title}</div>
            <div class="notif-msg">${n.message}</div>
            <div class="notif-time">${new Date(n.createdAt).toLocaleDateString('fr-TN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>`;
      }).join('')
    : '<div class="empty-state">' + t('noData') + '</div>';
}