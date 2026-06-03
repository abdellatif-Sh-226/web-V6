function createTable(headers, rows, emptyMsg) {
  const thead = headers.map(h => `<th>${h}</th>`).join('');
  const tbody = rows.length
    ? rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${headers.length}" class="empty-state">${emptyMsg || 'Aucune donn\u00E9e'}</td></tr>`;
  return `<table class="table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}
