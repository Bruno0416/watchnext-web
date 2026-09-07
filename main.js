import { loadComponent } from "./src/core/components/loadComponent.js";
import { initRouter, loadInitialRoute } from "./src/core/router.js";
import { initTheme, syncThemeControls } from "./src/core/theme/theme.js";
import { loadContent } from "./src/data/content.js";
import { initUsers } from "./src/data/users.js";
import { initNavBar } from "./src/core/components/navbar/hook/NavBar.js";

// ---------- carga metodo 'main' cuando carga index.html ----------
document.addEventListener("DOMContentLoaded", main);

// ---------- metodo para inicializar la pagina -----------
async function main() {
  // 1. inicializar el tema
  initTheme();

  // 2. cargar los componentes globales
  await Promise.all([
    loadComponent(
      "#app-navbar",
      "./src/core/components/navbar/navbar.html",
    ),
    loadComponent(
      "#app-footer",
      "./src/core/components/footer/footer.html",
    ),
  ]);

  initNavBar();

  // 3. cargar los datos locales
  const content = await loadContent();
  await initUsers();

  // 4. inicializar el enrutador
  initRouter(content);

  // 5. cargar la vista inicial
  await loadInitialRoute();

  // 6. sincronizar los controles del tema
  syncThemeControls();
}
