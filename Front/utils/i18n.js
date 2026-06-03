let _lang = {};

function t(key) {
  return _lang[key] || key;
}

function setLanguage(lang) {
  _lang = lang || {};
  if (lang === LANG_FR) localStorage.setItem('monexa_lang', 'fr');
  else if (lang === LANG_EN) localStorage.setItem('monexa_lang', 'en');
}

function initLanguage() {
  const stored = localStorage.getItem('monexa_lang');
  if (stored === 'en') { setLanguage(LANG_EN); return 'en'; }
  setLanguage(LANG_FR);
  return 'fr';
}

function applyTranslations(root) {
  const els = (root || document).querySelectorAll('[data-i18n]');
  els.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (translation !== key) {
      if (el.hasAttribute('data-i18n-placeholder')) {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    }
  });
}

const CURRENCIES = {
  TND: { locale: 'fr-TN', suffix: ' TND' },
  EUR: { locale: 'fr-EU', suffix: '\u20AC' },
  USD: { locale: 'en-US', suffix: '$' }
};

function getCurrency() {
  const code = localStorage.getItem('monexa_currency') || 'TND';
  return CURRENCIES[code] || CURRENCIES.TND;
}

function setCurrency(code) {
  if (CURRENCIES[code]) localStorage.setItem('monexa_currency', code);
}

function fmt(n) {
  const cur = getCurrency();
  return parseFloat(n).toLocaleString(cur.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + cur.suffix;
}
