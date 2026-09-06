import { loadComponent } from "../../loadComponent.js";
import {
    clearSession,
    hasSession,
} from "../../../session.js";

// ---------- navbar ----------
export async function initNavBar() {
    // 1. renderizar el estado inicial de la cuenta
    await renderAccount();

    // 2. escuchar las acciones propias del navbar
    document.addEventListener("click", handleNavBarAction);
}

export async function refreshNavBar() {
    // 1. actualizar el estado de la cuenta
    await renderAccount();
}

// --- renderizado de cuenta ---
async function renderAccount() {
    // 1. seleccionar el componente segun la sesion
    const component = hasSession()
        ? "./src/core/components/navbar/components/user-account.html"
        : "./src/core/components/navbar/components/guest-account.html";

    // 2. cargar el componente seleccionado
    await loadComponent("#navbar-account", component);
}

// --- eventos ---
async function handleNavBarAction(event) {
    // 1. buscar una accion propia del navbar
    const actionElement = event.target.closest("[data-navbar-action]");

    if (!actionElement) {
        return;
    }

    // 2. obtener la accion solicitada
    const action = actionElement.dataset.navbarAction;

    // 3. cerrar sesion
    if (action === "logout") {
        clearSession();
        await renderAccount();

        document.dispatchEvent(
            new CustomEvent("auth:logout"),
        );
    }
}