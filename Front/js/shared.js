function renderShared() {
  const all = DB.get('sharedBudgets') || [];
  const users = getUsers();
  const txs = DB.get('transactions') || [];
  const pending = DB.get('pendingTransactions') || [];
  const mine = STATE.CU.role === 'admin' ? all : all.filter(s => s.members.includes(STATE.CU.id));

  const sharedList = document.getElementById('sharedList');
  if (!sharedList) return;
  sharedList.innerHTML = mine.length ? mine.map(s => {
    const members = s.members.map(id => users.find(u => u.id === id)).filter(Boolean);
    const spent = txs.filter(t => s.members.includes(t.userId) && t.type === 'expense' && t.dest === `group-${s.id}`).reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const pct = Math.min((spent / (s.limit || 1)) * 100, 100);
    const color = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--success)';
    const recentTxs = txs.filter(t => s.members.includes(t.userId) && t.dest === `group-${s.id}`).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    const isOwner = s.ownerId === STATE.CU.id;

    // Pending items for this group
    const groupPending = pending.filter(p => p.groupId === s.id && p.status === 'pending');
    const myPendingApprovals = groupPending.filter(p =>
      p.approvals && p.approvals.some(a => a.user_id === STATE.CU.id && a.status === 'pending')
    );

    return `<div class="section" style="margin-bottom:20px">
      <div class="section-header">
        <div>
          <div class="section-title">\uD83D\uDC65 ${s.name}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${s.desc}</div>
          ${s.locked ? `<div style="font-size:12px;color:var(--warning);margin-top:6px">\uD83D\uDD12 ${t('groupLocked')}</div>` : ''}
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${(isOwner || STATE.CU.role === 'admin') ? `<button class="icon-btn" onclick="openSharedModal('${s.id}')">\u270F\uFE0F</button>` : ''}
          ${(isOwner || STATE.CU.role === 'admin') ? `<button class="icon-btn del" onclick="deleteShared('${s.id}')">\uD83D\uDDD1\uFE0F</button>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        ${members.map(m => `<div class="pill"><div class="avatar" style="width:22px;height:22px;font-size:10px">${m.name.charAt(0)}</div>${m.name}${m.id === s.ownerId ? '<span style="color:var(--accent);font-size:10px">\u2605</span>' : ''}</div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${getGroupCats(s.id).map(c => `<span class="pill" style="background:${c.color}22;color:${c.color}">${c.name}</span>`).join('') || '<span style="color:var(--text-muted);font-size:13px">' + t('noGroupCats') + '</span>'}
        </div>
        ${(isOwner || STATE.CU.role === 'admin') ? `<button class="btn btn-sm btn-secondary" onclick="openCatModal('${s.id}')">+ ${t('category')}</button>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
        <span style="color:var(--text-muted)">${t('spentTogether')}: <strong style="color:${color}">${fmt(spent)}</strong></span>
        <span style="color:var(--text-muted)">${t('limit')}: <strong>${fmt(s.limit || 0)}</strong></span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
      
      ${myPendingApprovals.length ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
        <div style="font-size:14px;font-weight:600;margin-bottom:12px;color:var(--warning)">\u23F3 ${t('pendingApprovals')}</div>
        ${myPendingApprovals.map(p => `
          <div class="pending-item">
            <div class="pending-info">
              <div><strong>${p.desc}</strong></div>
              <div style="font-size:13px;color:var(--text-muted)">${fmt(p.amount)} \u00B7 ${getUserName(p.userId)} \u00B7 ${new Date(p.date).toLocaleDateString('fr-TN')}</div>
            </div>
            <div class="pending-actions">
              <button class="btn btn-sm btn-success" onclick="respondPending('${p.id}','approve')">${t('approve')}</button>
              <button class="btn btn-sm btn-danger" onclick="respondPending('${p.id}','reject')">${t('reject')}</button>
            </div>
          </div>`).join('')}
      </div>` : ''}

      ${groupPending.filter(p => p.userId === STATE.CU.id).length ? `<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text-muted)">${t('myPendingRequests')}</div>
        ${groupPending.filter(p => p.userId === STATE.CU.id).map(p => {
          const total = p.approvals ? p.approvals.length : 0;
          const done = p.approvals ? p.approvals.filter(a => a.status !== 'pending').length : 0;
          return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
            <span>${p.desc} \u2014 ${fmt(p.amount)}</span>
            <span style="color:var(--text-muted)">${done}/${total} ${t('approved')}</span>
          </div>`;
        }).join('')}
      </div>` : ''}

      ${recentTxs.length ? `<div style="margin-top:16px;font-size:12px;color:var(--text-muted);margin-bottom:8px">${t('groupTransactions')}</div>
      ${recentTxs.map(t => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${getUserName(t.userId)} \u00B7 ${t.desc}</span><span style="color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '\u2212'}${fmt(t.amount)}</span></div>`).join('')}` : ''}
    </div>`;
  }).join('') : '<div class="section"><div class="empty-state">' + t('noSharedBudget') + '</div></div>';
}

async function respondPending(pendingId, action) {
  try {
    const result = await apiFetch('approve.php', {
      method: 'POST',
      body: { id: pendingId, action }
    });
    // Reload pending transactions
    const data = await apiFetch('data.php', { method: 'GET' });
    _cache.pendingTransactions = data.pendingTransactions || [];
    _cache.transactions = data.transactions || [];
    _cache.notifications = data.notifications || [];
    _cache.unreadCount = data.unreadCount || 0;
    updateNotifBadge();
    renderShared();
    if (result.status === 'approved') {
      renderShared();
    }
  } catch (e) {
    alert(e.message || 'Erreur');
  }
}

function openSharedModal(id) {
  STATE.editingSharedId = id || null;
  const titleEl = document.querySelector('#sharedModal .modal-title');
  if (id) {
    const shared = (DB.get('sharedBudgets') || []).find(s => s.id === id);
    if (!shared) return;
    if (shared.ownerId !== STATE.CU.id && STATE.CU.role !== 'admin') return;
    titleEl.textContent = t('editShared');
    document.getElementById('sharedName').value = shared.name;
    document.getElementById('sharedDesc').value = shared.desc;
    document.getElementById('sharedLimit').value = shared.limit;
    STATE.sharedMembers = [...shared.members];
  } else {
    titleEl.textContent = t('newShared');
    document.getElementById('sharedName').value = '';
    document.getElementById('sharedDesc').value = '';
    document.getElementById('sharedLimit').value = '';
    STATE.sharedMembers = [STATE.CU.id];
  }
  document.getElementById('sharedMemberEmail').value = '';
  renderSharedMembersUI();
  document.getElementById('sharedModal').classList.add('open');
}

function addSharedMember() {
  const email = document.getElementById('sharedMemberEmail').value.trim();
  const u = getUsers().find(u => u.email === email);
  if (!u) { alert(t('memberNotFound')); return; }
  if (STATE.sharedMembers.includes(u.id)) { alert(t('memberAlreadyAdded')); return; }
  STATE.sharedMembers.push(u.id);
  document.getElementById('sharedMemberEmail').value = '';
  renderSharedMembersUI();
}

function renderSharedMembersUI() {
  document.getElementById('sharedMembersList').innerHTML = STATE.sharedMembers.map(id => {
    const u = getUsers().find(u => u.id === id);
    return `<div class="pill">${u?.name || id}${id !== STATE.CU.id ? `<span style="cursor:pointer;color:var(--danger);margin-left:4px" onclick="removeSharedMember('${id}')">\u00D7</span>` : ' (vous)'}</div>`;
  }).join('');
}

function removeSharedMember(id) {
  STATE.sharedMembers = STATE.sharedMembers.filter(m => m !== id);
  renderSharedMembersUI();
}

function saveShared() {
  const name = document.getElementById('sharedName').value.trim();
  const desc = document.getElementById('sharedDesc').value.trim();
  const limit = parseFloat(document.getElementById('sharedLimit').value) || 0;
  if (!name || STATE.sharedMembers.length === 0) return;
  const all = DB.get('sharedBudgets') || [];
  if (STATE.editingSharedId) {
    DB.set('sharedBudgets', all.map(s => s.id === STATE.editingSharedId ? { ...s, name, desc, limit, members: [...STATE.sharedMembers], locked: true } : s));
  } else {
    all.push({ id: uid(), ownerId: STATE.CU.id, name, desc, limit, members: [...STATE.sharedMembers], createdAt: new Date().toISOString(), locked: true });
    DB.set('sharedBudgets', all);
  }
  STATE.editingSharedId = null;
  closeModal('sharedModal');
  renderShared();
}

function deleteShared(id) {
  if (!confirm(t('confirmDeleteShared'))) return;
  DB.set('sharedBudgets', (DB.get('sharedBudgets') || []).filter(s => s.id !== id));
  renderShared();
}
