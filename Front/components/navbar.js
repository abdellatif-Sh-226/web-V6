function buildPageHeader(title, subtitle, actions) {
  const sub = subtitle ? `<div class="page-subtitle">${subtitle}</div>` : '';
  const acts = actions
    ? `<div style="display:flex;align-items:center;gap:12px">${actions}</div>`
    : '';
  return `
    <div class="page-header">
      <div>
        <div class="page-title">${title}</div>
        ${sub}
      </div>
      ${acts}
    </div>`;
}
