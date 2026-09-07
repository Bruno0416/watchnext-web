import { loadComponent } from "../../../core/components/loadComponent.js";
import { hasSession } from "../../../core/session.js";
import { initLogin } from "./login.js";
import { initRegister } from "./register.js";

// ---------- gate de autenticacion ----------
export async function loadAuth() {
  // 1. evitar mostrar auth cuando ya existe una sesion
  if (hasSession()) {
    document.dispatchEvent(new CustomEvent("auth:success"));
    return;
  }

  // 2. cargar la pantalla principal de autenticacion
  await loadComponent("#app", "./src/features/auth/auth.html");

  // 3. iniciar la navegacion interna del gate
  initAuthGate();
}

// --- navegacion interna ---
function initAuthGate() {
  // 1. obtener la vista de autenticacion
  const authView = document.querySelector(".auth-view");

  // 2. validar que la vista exista
  if (!authView) {
    return;
  }

  // 3. escuchar los cambios entre login y registro
  authView.addEventListener("click", async (event) => {
    const routeElement = event.target.closest("[data-auth-view]");

    if (!routeElement) {
      return;
    }

    event.preventDefault();
    await showAuthView(routeElement.dataset.authView);
  });

  // 4. escuchar cambio solicitado por form
  authView.addEventListener("auth:view", async (event) => {
    await showAuthView(event.detail);
  });
}

async function showAuthView(view) {
  // 1. ocultar la bienvenida
  const welcome = document.querySelector("#auth-welcome");

  if (welcome) {
    welcome.hidden = true;
  }

  // 2. cargar login cuando corresponda
  if (view === "login") {
    await loadComponent("#auth-content", "./src/features/auth/components/login.html");
    initLogin();
    return;
  }

  // 3. cargar registro cuando corresponda
  if (view === "register") {
    await loadComponent("#auth-content", "./src/features/auth/components/register.html");
    initRegister();
  }
}
