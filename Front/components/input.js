function createInput(opts) {
  const { type = 'text', id, label, placeholder, value, onChange, extra } = opts;
  const val = value !== undefined ? `value="${value}"` : '';
  const change = onChange ? `onchange="${onChange}"` : '';
  return `
    <div class="form-group">
      ${label ? `<label for="${id}">${label}</label>` : ''}
      <input type="${type}" id="${id}" placeholder="${placeholder || ''}" ${val} ${change} ${extra || ''}>
    </div>`;
}

function createSelect(opts) {
  const { id, label, options, value, onChange } = opts;
  const change = onChange ? `onchange="${onChange}"` : '';
  const optsHtml = options.map(o =>
    `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
  return `
    <div class="form-group">
      ${label ? `<label for="${id}">${label}</label>` : ''}
      <select id="${id}" ${change}>${optsHtml}</select>
    </div>`;
}

function createTextarea(opts) {
  const { id, label, placeholder, value, rows } = opts;
  return `
    <div class="form-group">
      ${label ? `<label for="${id}">${label}</label>` : ''}
      <textarea id="${id}" rows="${rows || 2}" placeholder="${placeholder || ''}">${value || ''}</textarea>
    </div>`;
}
