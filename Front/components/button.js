function createButton(label, opts) {
  const variant = opts?.variant || '';
  const size = opts?.size || '';
  const onClick = opts?.onClick || '';
  const extra = opts?.extra || '';
  const cls = ['btn', variant ? `btn-${variant}` : '', size ? `btn-${size}` : ''].filter(Boolean).join(' ');
  return `<button class="${cls}" onclick="${onClick}" ${extra}>${label}</button>`;
}

function createIconBtn(icon, onClick, cls) {
  return `<button class="icon-btn ${cls || ''}" onclick="${onClick}">${icon}</button>`;
}
