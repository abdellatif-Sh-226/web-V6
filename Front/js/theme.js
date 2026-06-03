function toggleTheme() {
  const root = document.documentElement;
  root.classList.toggle('light-mode');
  const isLight = root.classList.contains('light-mode');
  localStorage.setItem('monexa_theme', isLight ? 'light' : 'dark');

  const saved = localStorage.getItem('monexa_theme');
  if (saved === 'light') {
    root.classList.add('light-mode');
    root.style.colorScheme = 'light';
  } else {
    root.style.colorScheme = 'dark';
  }
  updateThemeIcons();
}

function updateThemeIcons() {
  const isLight = document.documentElement.classList.contains('light-mode');
  document.querySelectorAll('.theme-toggle-icon').forEach(el => {
    el.textContent = isLight ? '\uD83C\uDF19' : '\u2600\uFE0F';
  });
}
