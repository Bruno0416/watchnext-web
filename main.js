import { loadComponent } from "./src/core/components/loadComponent.js";
import { initTheme, syncThemeControls } from "./src/core/theme/theme.js";
import { loadContent } from "./src/data/content.js";
import { loadHome } from "./src/features/home/hook/home.js";
import { loadUsers } from "./src/data/users.js";

// ---------- inicializacion de la aplicacion ----------
async function main() {
  // 1. inicializar el tema antes de renderizar componentes
  initTheme();

  // 2. cargar los componentes globales de la aplicacion
  await Promise.all([
    loadComponent("#app-navbar", "./src/core/components/navbar/navbar.html"),
    loadComponent("#app-footer", "./src/core/components/footer/footer.html"),
  ]);

  // 3. cargar los datos locales antes de renderizar inicio
  const content = await loadContent();
  await loadHome(content);

  // 4. sincronizar los controles del tema despues de cargar la interfaz
  syncThemeControls();

}

document.addEventListener("DOMContentLoaded", main);
