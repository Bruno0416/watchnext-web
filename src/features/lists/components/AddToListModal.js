// ---------- modal "agregar a lista" ----------
// se inyecta una sola vez en el body y se reutiliza desde cualquier vista.

import { getSession } from "../../../core/session.js";
import { getUserLists, addItemToList, removeItemFromList, toListItem, } from "../../../data/lists.js";

const MODAL_ID = "add-to-list-modal";

let currentItem = null;

// --- api publica ---

export async function openAddToListModal(content) {
  // 1. asegurar que el modal exista en el documento
  const modal = ensureModal();

  // 2. guardar el titulo que se quiere agregar
  currentItem = toListItem(content);
  modal.querySelector("#add-to-list-title").textContent = content.title;

  // 3. renderizar segun haya sesion o no
  const session = getSession();
  const body = modal.querySelector("#add-to-list-body");

  if (!session) {
    body.innerHTML = `
      <p class="mb-3">Inicia sesión para guardar títulos en tus listas.</p>
      <a class="btn btn-primary" href="#auth" data-app-route="auth">Iniciar sesión</a>
    `;
  } else {
    const lists = await getUserLists(session.userId);
    body.innerHTML = renderOptions(lists);
  }

  // 4. mostrar
  window.bootstrap.Modal.getOrCreateInstance(modal).show();
}

// --- helpers privados ---

function ensureModal() {
  let modal = document.getElementById(MODAL_ID);
  if (modal) {
    return modal;
  }

  // 1. crear la estructura del modal (bootstrap)
  modal = document.createElement("div");
  modal.id = MODAL_ID;
  modal.className = "modal fade";
  modal.tabIndex = -1;
  modal.setAttribute("aria-labelledby", "add-to-list-heading");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content add-to-list-content">
        <div class="modal-header border-0">
          <h2 id="add-to-list-heading" class="h6 mb-0">
            Agregar a lista
            <span class="d-block text-secondary fw-normal small" id="add-to-list-title"></span>
          </h2>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body pt-0" id="add-to-list-body"></div>
        <div class="modal-footer border-0 pt-0">
          <a class="btn btn-sm btn-outline-secondary" href="#lists" data-app-route="lists">Ver mis listas</a>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // 2. escuchar los cambios de las casillas
  modal.addEventListener("change", handleToggle);

  // 3. cerrar el modal al navegar con un enlace (bootstrap cancela la
  //    navegacion si el <a> lleva data-bs-dismiss, por eso se hace a mano)
  modal.addEventListener("click", (event) => {
    if (event.target.closest("a[href]") || event.target.closest("[data-app-route]")) {
      window.bootstrap.Modal.getInstance(modal)?.hide();
    }
  });

  return modal;
}

function renderOptions(lists) {
  // 1. una casilla por lista, marcada si el titulo ya esta dentro
  return `
    <ul class="list-unstyled d-grid gap-2 mb-0">
      ${lists
      .map((list) => {
        const checked = list.items.some(
          (item) => item.id === currentItem.id && item.mediaType === currentItem.mediaType,
        );
        return `
            <li>
              <label class="add-to-list-option">
                <input class="form-check-input" type="checkbox" value="${list.id}" ${checked ? "checked" : ""}>
                <span class="flex-grow-1 text-truncate">${escapeHtml(list.name)}</span>
                <span class="text-secondary small">${list.items.length}</span>
              </label>
            </li>
          `;
      })
      .join("")}
    </ul>
    <p id="add-to-list-feedback" class="form-message small mt-3 mb-0" role="status" aria-live="polite"></p>
  `;
}

async function handleToggle(event) {
  const checkbox = event.target;
  if (checkbox.type !== "checkbox" || !currentItem) {
    return;
  }

  const session = getSession();
  const feedback = document.getElementById("add-to-list-feedback");

  // 1. agregar o quitar segun el estado de la casilla
  if (checkbox.checked) {
    const result = await addItemToList(session.userId, checkbox.value, currentItem);
    feedback.textContent = result.ok ? "Agregado a la lista." : result.message;
    feedback.className = `form-message small mt-3 mb-0 ${result.ok ? "form-message-success" : "form-message-error"}`;
  } else {
    await removeItemFromList(session.userId, checkbox.value, currentItem.id, currentItem.mediaType);
    feedback.textContent = "Quitado de la lista.";
    feedback.className = "form-message small mt-3 mb-0";
  }

  // 2. actualizar el contador de la opcion
  const lists = await getUserLists(session.userId);
  const list = lists.find((entry) => entry.id === checkbox.value);
  checkbox.closest("label").querySelector(".text-secondary").textContent = list?.items.length ?? 0;
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character],
  );
}
