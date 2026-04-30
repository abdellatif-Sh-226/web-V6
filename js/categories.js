function renderCategories() {
  const txs = DB.get('transactions') || [];
  const cats = CU.role === 'admin' ? getBaseCats() : getUserCats();
  document.getElementById('catBody').innerHTML = cats.length ? cats.map(c => {
    const count = txs.filter(t => t.catId === c.id).length;
    return `<tr>
      <td style="font-weight:500">${c.name}</td>
      <td><div class="category-color"><div class="color-swatch" style="background:${c.color}"></div><span class="color-label">${c.color}</span></div></td>
      <td><span class="badge" style="background:rgba(255,255,255,0.08);color:var(--text-muted)">${count} transaction${count > 1 ? 's' : ''}</span></td>
      <td><div class="actions"><button class="icon-btn del" onclick="deleteCat('${c.id}')">🗑️</button></div></td>
    </tr>`;
  }).join('') : '<tr><td colspan="4" class="empty-state">Aucune catégorie</td></tr>';
}

function openCatModal(groupId = null) {
  catModalGroupId = groupId;
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
  if (catModalGroupId) newCat.groupId = catModalGroupId;
  else if (CU.role !== 'admin') newCat.ownerId = CU.id;
  cats.push(newCat);
  DB.set('categories', cats);
  closeModal('catModal');
  renderCategories();
  catModalGroupId = null;
}

function deleteCat(id) {
  if (!confirm('Supprimer cette catégorie ?')) return;
  DB.set('categories', getCats().filter(c => c.id !== id));
  renderCategories();
}
