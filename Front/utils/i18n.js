let _lang = {};

function t(key) {
  return _lang[key] || key;
}

function setLanguage(lang) {
  _lang = lang || {};
}
