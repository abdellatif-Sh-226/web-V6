function renderCategories() {
  const isAdmin = STATE.CU.role === 'admin';
  const txs = DB.get('transactions') || [];
  const cats = isAdmin ? getBaseCats() : getUserCats();
  document.getElementById('catBody').innerHTML = cats.length ? cats.map(c => {
    const count = txs.filter(t => t.catId === c.id).length;
    return `<tr>
      <td style="font-weight:500">${c.name}</td>
      <td><div class="category-color"><div class="color-swatch" style="background:${c.color}"></div><span class="color-label">${c.color}</span></div></td>
      <td><span class="badge" style="background:rgba(255,255,255,0.08);color:var(--text-muted)">${count} transaction${count > 1 ? 's' : ''}</span></td>
      <td><div class="actions"><button class="icon-btn del" onclick="deleteCat('${c.id}')">\uD83D\uDDD1\uFE0F</button></div></td>
    </tr>`;
  }).join('') : '<tr><td colspan="4" class="empty-state">' + t('noCategory') + '</td></tr>';
}

function openCatModal(groupId) {
  STATE.catModalGroupId = groupId || null;
  document.getElementById('catName').value = '';
  document.getElementById('catColor').value = '#e94560';
  document.getElementById('catModal').classList.add('open');
}

function saveCat() {
  const name = document.getElementById('catName').value.trim();
  const color = document.getElementById('catColor').value;
  if (!name) return;
  const cats = getCats();
  const newCat = { id: uid(), name, color };
  if (STATE.catModalGroupId) newCat.groupId = STATE.catModalGroupId;
  else if (STATE.CU.role !== 'admin') newCat.ownerId = STATE.CU.id;
  cats.push(newCat);
  DB.set('categories', cats);
  closeModal('catModal');
  renderCategories();
  STATE.catModalGroupId = null;
}

function deleteCat(id) {
  if (!confirm(t('confirmDeleteCategory'))) return;
  DB.set('categories', getCats().filter(c => c.id !== id));
  renderCategories();
}
