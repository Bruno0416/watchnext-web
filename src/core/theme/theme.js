// ---------- configuracion del tema ----------
const STORAGE_KEY = "theme";

export const Theme = Object.freeze({
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
});

const themeIcons = {
  [Theme.DARK]: "bi-moon-stars-fill",
  [Theme.LIGHT]: "bi-sun-fill",
  [Theme.SYSTEM]: "bi-circle-half",
};

// ---------- estado del tema ----------
let selectedTheme = Theme.DARK;
let initialized = false;

// ---------- api publica ----------
export function initTheme() {
  // 1. evitar una inicializacion duplicada
  if (initialized) {
    return;
  }

  // 2. recuperar y aplicar la preferencia guardada
  selectedTheme = getStoredTheme();
  applyTheme(selectedTheme);

  // 3. registrar los eventos de cambio de tema
  document.addEventListener("click", handleThemeSelection);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handleSystemThemeChange);

  // 4. marcar el tema como inicializado
  initialized = true;
}

export function syncThemeControls() {
  // 1. actualizar el icono del tema seleccionado
  const themeIcon = document.querySelector("#theme-icon");

  if (themeIcon) {
    themeIcon.className = `bi ${themeIcons[selectedTheme]}`;
  }

  // 2. sincronizar cada control con el tema seleccionado
  document.querySelectorAll("[data-theme-value]").forEach((button) => {
    const isActive = button.dataset.themeValue === selectedTheme;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));

    const check = button.querySelector("[data-theme-check]");
    check?.classList.toggle("opacity-0", !isActive);
  });
}

// --- helpers privados ---
function handleThemeSelection(event) {
  // 1. buscar el control de tema asociado al clic
  const button = event.target.closest("[data-theme-value]");

  // 2. ignorar clics fuera de los controles de tema
  if (!button) {
    return;
  }

  // 3. aplicar el tema seleccionado
  setTheme(button.dataset.themeValue);
}

function handleSystemThemeChange() {
  // 1. reaplicar el tema si depende de la configuracion del sistema
  if (selectedTheme === Theme.SYSTEM) {
    applyTheme(Theme.SYSTEM);
  }
}

function setTheme(theme) {
  // 1. validar que el tema sea permitido
  if (!Object.values(Theme).includes(theme)) {
    return;
  }

  // 2. guardar la nueva preferencia
  selectedTheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  // 3. aplicar el tema y sincronizar los controles
  applyTheme(theme);
  syncThemeControls();
}

function applyTheme(theme) {
  // 1. resolver el tema efectivo
  const resolvedTheme = resolveTheme(theme);
  const root = document.documentElement;

  // 2. aplicar los atributos y el esquema de color
  root.dataset.bsTheme = resolvedTheme;
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = theme;
  root.style.colorScheme = resolvedTheme;

  // 3. actualizar el color asociado al navegador
  const themeColor = document.querySelector('meta[name="theme-color"]');
  themeColor?.setAttribute("content", resolvedTheme === Theme.DARK ? "#101012" : "#fafaf8");
}

function resolveTheme(theme) {
  // 1. devolver directamente los temas explicitos
  if (theme !== Theme.SYSTEM) {
    return theme;
  }

  // 2. resolver la preferencia del sistema
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? Theme.DARK
    : Theme.LIGHT;
}

function getStoredTheme() {
  // 1. recuperar la preferencia almacenada
  const storedTheme = localStorage.getItem(STORAGE_KEY);

  // 2. devolver un valor valido o usar el tema por defecto
  return Object.values(Theme).includes(storedTheme) ? storedTheme : Theme.DARK;
}
