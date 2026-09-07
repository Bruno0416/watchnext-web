import { refreshNavBar } from "./components/navbar/hook/NavBar.js";
import { loadAuth } from "../features/auth/hook/auth.js";
import { loadHome } from "../features/home/hook/home.js";
import { loadLists } from "../features/lists/hook/lists.js";
import { loadMedia } from "../features/media/hook/media.js";
import { loadProfile } from "../features/profile/hook/profile.js";

// ---------- enrutamiento de la pagina ----------
let content = null;

export function initRouter(appContent) {
  // 1. guardar los datos necesarios para las vistas
  content = appContent;

  // 2. escuchar la navegacion de la aplicacion
  document.addEventListener("click", handleRoute);

  // 3. escuchar autenticaciones completadas
  document.addEventListener("auth:success", handleAuthSuccess);
}

// ---------- carga inicial ----------
export async function loadInitialRoute() {
  // 1. iniciar la aplicacion desde autenticacion
  await navigate("auth");
}

// --- navegacion ---
export async function navigate(route, params = {}) {
  // 0. marcar en el navbar el enlace de la vista actual
  updateActiveLinks(route);

  // 1. cargar inicio
  if (route === "home") {
    setAppShellVisible(true);
    await loadHome(content);
    return;
  }

  // 2. cargar autenticacion
  if (route === "auth") {
    setAppShellVisible(false);
    await loadAuth();
    return;
  }

  // 3. cargar listas
  if (route === "lists") {
    setAppShellVisible(true);
    await loadLists();
    return;
  }

  // 4. cargar perfil
  if (route === "profile") {
    setAppShellVisible(true);
    await loadProfile();
    return;
  }

  // 5. cargar detalle de contenido
  if (route === "media") {
    setAppShellVisible(true);
    await loadMedia(params.mediaType, params.mediaId);
  }
}

// --- eventos ---
async function handleRoute(event) {
  // 1. buscar una ruta de la aplicacion
  const routeElement = event.target.closest("[data-app-route]");

  if (!routeElement) {
    return;
  }

  // 2. evitar la navegacion nativa
  event.preventDefault();

  // 3. obtener la ruta solicitada
  const route = routeElement.dataset.appRoute;

  // 4. recuperar parametros opcionales del contenido
  const params = route === "media"
    ? {
        mediaType: routeElement.dataset.mediaType,
        mediaId: routeElement.dataset.mediaId,
      }
    : {};

  // 5. navegar a la vista
  await navigate(route, params);
}

async function handleAuthSuccess() {
  // 1. actualizar el navbar con la nueva sesion
  await refreshNavBar();

  // 2. navegar a inicio despues de autenticar
  await navigate("home");
}

// --- enlace activo del navbar ---
function updateActiveLinks(route) {
  // 1. activar solo el enlace del navbar cuya ruta coincide
  document.querySelectorAll(".navbar-nav [data-app-route]").forEach((link) => {
    const isActive = link.dataset.appRoute === route;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// --- estructura global ---
function setAppShellVisible(visible) {
  // 1. obtener navbar y footer
  const navbar = document.querySelector("#app-navbar");
  const footer = document.querySelector("#app-footer");

  // 2. actualizar su visibilidad
  if (navbar) {
    navbar.hidden = !visible;
  }

  if (footer) {
    footer.hidden = !visible;
  }
}