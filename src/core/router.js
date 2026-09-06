import { refreshNavBar } from "./components/navbar/hook/NavBar.js";
import { loadAuth } from "../features/auth/hook/auth.js";
import { loadHome } from "../features/home/hook/home.js";

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
export async function navigate(route) {
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
    console.log("enrutar a listas");
    return;
  }

  // 4. cargar perfil
  if (route === "profile") {
    setAppShellVisible(true);
    console.log("enrutar a perfil");
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

  // 4. navegar a la vista
  await navigate(route);
}

async function handleAuthSuccess() {
  // 1. actualizar el navbar con la nueva sesion
  await refreshNavBar();

  // 2. navegar a inicio despues de autenticar
  await navigate("home");
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