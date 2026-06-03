function renderShared() {
  const all = DB.get('sharedBudgets') || [];
  const users = getUsers();
  const txs = DB.get('transactions') || [];
  const mine = STATE.CU.role === 'admin' ? all : all.filter(s => s.members.includes(STATE.CU.id));

  document.getElementById('sharedList').innerHTML = mine.length ? mine.map(s => {
    const members = s.members.map(id => users.find(u => u.id === id)).filter(Boolean);
    const spent = txs.filter(t => s.members.includes(t.userId) && t.type === 'expense' && t.dest === `group-${s.id}`).reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const pct = Math.min((spent / (s.limit || 1)) * 100, 100);
    const color = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--success)';
    const recentTxs = txs.filter(t => s.members.includes(t.userId) && t.dest === `group-${s.id}`).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    const isOwner = s.ownerId === STATE.CU.id;

    return `<div class="section" style="margin-bottom:20px">
      <div class="section-header">
        <div>
          <div class="section-title">\uD83D\uDC65 ${s.name}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${s.desc}</div>
          ${s.locked ? `<div style="font-size:12px;color:var(--warning);margin-top:6px">\uD83D\uDD12 Groupe verrouill\u00E9 \u2014 seuls le cr\u00E9ateur et l'admin peuvent modifier</div>` : ''}
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
          ${getGroupCats(s.id).map(c => `<span class="pill" style="background:${c.color}22;color:${c.color}">${c.name}</span>`).join('') || '<span style="color:var(--text-muted);font-size:13px">Aucune cat\u00E9gorie groupe</span>'}
        </div>
        ${(isOwner || STATE.CU.role === 'admin') ? `<button class="btn btn-sm btn-secondary" onclick="openCatModal('${s.id}')">+ Cat\u00E9gorie groupe</button>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
        <span style="color:var(--text-muted)">D\u00E9pens\u00E9 ensemble: <strong style="color:${color}">${fmt(spent)}</strong></span>
        <span style="color:var(--text-muted)">Plafond: <strong>${fmt(s.limit || 0)}</strong></span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
      ${recentTxs.length ? `<div style="margin-top:16px;font-size:12px;color:var(--text-muted);margin-bottom:8px">Transactions du groupe :</div>
      ${recentTxs.map(t => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px"><span>${getUserName(t.userId)} \u00B7 ${t.desc}</span><span style="color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'}">${t.type === 'income' ? '+' : '\u2212'}${fmt(t.amount)}</span></div>`).join('')}` : ''}
    </div>`;
  }).join('') : '<div class="section"><div class="empty-state">Aucun budget partag\u00E9</div></div>';
}

function openSharedModal(id) {
  STATE.editingSharedId = id || null;
  const titleEl = document.querySelector('#sharedModal .modal-title');
  if (id) {
    const shared = (DB.get('sharedBudgets') || []).find(s => s.id === id);
    if (!shared) return;
    if (shared.ownerId !== STATE.CU.id && STATE.CU.role !== 'admin') return;
    titleEl.textContent = 'Modifier le budget partag\u00E9';
    document.getElementById('sharedName').value = shared.name;
    document.getElementById('sharedDesc').value = shared.desc;
    document.getElementById('sharedLimit').value = shared.limit;
    STATE.sharedMembers = [...shared.members];
  } else {
    titleEl.textContent = 'Cr\u00E9er un budget partag\u00E9';
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
  if (!u) { alert('Utilisateur introuvable'); return; }
  if (STATE.sharedMembers.includes(u.id)) { alert('D\u00E9j\u00E0 ajout\u00E9'); return; }
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
  if (!confirm('Supprimer ce budget partag\u00E9 ?')) return;
  DB.set('sharedBudgets', (DB.get('sharedBudgets') || []).filter(s => s.id !== id));
  renderShared();
}
