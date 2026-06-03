function buildNotificationBell() {
  return `
    <div class="notif-bell" onclick="toggleNotifDropdown()">
      <span class="notif-icon">\uD83D\uDD14</span>
      <span class="notif-badge" id="notifBadge" style="display:none">0</span>
    </div>
    <div class="notif-dropdown" id="notifDropdown"></div>`;
}
