// js/theme.js
// Modo claro/oscuro persistente

const STORAGE_KEY = 'gastos_theme';

function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

function updateButton(mode) {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = mode === 'dark';
  btn.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  btn.title = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
}

export function setTheme(mode) {
  const theme = mode === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('theme-dark', theme === 'dark');
  localStorage.setItem(STORAGE_KEY, theme);
  updateButton(theme);
}

export function toggleTheme() {
  setTheme(document.body.classList.contains('theme-dark') ? 'light' : 'dark');
}

export function initTheme() {
  setTheme(getSavedTheme());
}

window.toggleTheme = toggleTheme;
