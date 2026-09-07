import { loadComponent } from "../../../core/components/loadComponent.js";
import { escapeHtml } from "../../../core/utils/html.js";
import { getSession } from "../../../core/session.js";
import {
  addItemToList,
  getUserLists,
  removeItemFromList,
  toListItem,
} from "../../../data/lists.js";

// ---------- modal agregar a lista ----------
const MODAL_ID = "add-to-list-modal";
let currentItem = null;

// ---------- api publica ----------
export async function openAddToListModal(content) {
  // 1. asegurar que el componente exista en el documento
  const modal = await ensureModal();

  // 2. preparar el titulo seleccionado
  currentItem = toListItem(content);
  modal.querySelector("#add-to-list-title").textContent = content.title;

  // 3. renderizar el estado segun la sesion
  await renderModalState(modal);

  // 4. mostrar el modal de bootstrap
  window.bootstrap.Modal.getOrCreateInstance(modal).show();
}

// ---------- estado del modal ----------
async function renderModalState(modal) {
  const session = getSession();
  const guest = modal.querySelector("#add-to-list-guest");
  const user = modal.querySelector("#add-to-list-user");
  const options = modal.querySelector("#add-to-list-options");
  const feedback = modal.querySelector("#add-to-list-feedback");

  // 1. limpiar el estado anterior
  feedback.textContent = "";
  feedback.className = "form-message small mt-3 mb-0";

  // 2. mostrar el acceso a auth para invitados
  if (!session) {
    guest.hidden = false;
    user.hidden = true;
    options.innerHTML = "";
    return;
  }

  // 3. cargar las listas del usuario autenticado
  guest.hidden = true;
  user.hidden = false;

  const lists = await getUserLists(session.userId);
  options.innerHTML = renderOptions(lists);
}

// ---------- eventos ----------
async function handleToggle(event) {
  const checkbox = event.target;

  if (checkbox.type !== "checkbox" || !currentItem) {
    return;
  }

  const session = getSession();
  const feedback = document.querySelector("#add-to-list-feedback");

  if (!session || !feedback) {
    return;
  }

  // 1. agregar o quitar segun el estado de la casilla
  if (checkbox.checked) {
    const result = await addItemToList(
      session.userId,
      checkbox.value,
      currentItem,
    );

    feedback.textContent = result.ok ? "Agregado a la lista." : result.message;
    feedback.className = `form-message small mt-3 mb-0 ${result.ok ? "form-message-success" : "form-message-error"
      }`;
  } else {
    await removeItemFromList(
      session.userId,
      checkbox.value,
      currentItem.id,
      currentItem.mediaType,
    );

    feedback.textContent = "Quitado de la lista.";
    feedback.className = "form-message small mt-3 mb-0";
  }

  // 2. actualizar el contador de la lista modificada
  const lists = await getUserLists(session.userId);
  const list = lists.find((entry) => entry.id === checkbox.value);
  checkbox.closest("label").querySelector(".add-to-list-count").textContent =
    list?.items.length ?? 0;
}

// ---------- renderizado ----------
function renderOptions(lists) {
  // 1. crear una opcion por cada lista disponible
  return lists
    .map((list) => {
      const checked = list.items.some(
        (item) =>
          item.id === currentItem.id &&
          item.mediaType === currentItem.mediaType,
      );

      return `
        <li>
          <label class="add-to-list-option">
            <input
              class="form-check-input"
              type="checkbox"
              value="${list.id}"
              ${checked ? "checked" : ""}
            >
            <span class="flex-grow-1 text-truncate">${escapeHtml(list.name)}</span>
            <span class="add-to-list-count text-secondary small">${list.items.length}</span>
          </label>
        </li>
      `;
    })
    .join("");
}

// --- helpers privados ---
async function ensureModal() {
  // 1. reutilizar el componente si ya fue cargado
  let modal = document.getElementById(MODAL_ID);

  if (modal) {
    return modal;
  }

  // 2. cargar la estructura html del modal
  await loadComponent(
    "#app-modal",
    "./src/features/lists/components/add-to-list-modal.html",
  );

  modal = document.getElementById(MODAL_ID);

  if (!modal) {
    throw new Error("No se pudo cargar el modal de listas");
  }

  // 3. conectar los eventos propios del modal
  modal.addEventListener("change", handleToggle);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-app-route]")) {
      window.bootstrap.Modal.getInstance(modal)?.hide();
    }
  });

  return modal;
}
