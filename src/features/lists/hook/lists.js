// ---------- vista de listas ----------

import { getSession } from "../../../core/session.js";
import { getProfileByUserId } from "../../../data/profiles.js";
import { getUserById } from "../../../data/users.js";
import {
  getUserLists,
  createList,
  deleteList,
  removeItemFromList,
  validateListName,
  validateListDescription,
} from "../../../data/lists.js";
import { getImageUrl } from "../../../data/content.js";

// --- estado de la vista ---

const state = {
  userId: null,
  lists: [],
  activeListId: null,
  sort: "added",
};

// ---------- carga de la vista ----------

export async function loadLists() {
  // 1. cargar el fragmento html de listas
  const response = await fetch("./src/features/lists/lists.html");

  // 2. validar que la vista se haya cargado
  if (!response.ok) {
    throw new Error("No se pudo cargar la vista de listas");
  }

  // 3. inyectar la vista en el contenedor principal
  const app = document.querySelector("#app");
  app.innerHTML = await response.text();

  // 4. decidir que mostrar segun la sesion
  const session = getSession();
  const guest = document.querySelector("#lists-guest");
  const content = document.querySelector("#lists-content");

  if (!session) {
    guest.hidden = false;
    content.hidden = true;
    return;
  }

  guest.hidden = true;
  content.hidden = false;

  // 5. cargar datos del usuario y sus listas
  state.userId = session.userId;
  state.lists = await getUserLists(session.userId);
  state.activeListId = resolveActiveList(state.activeListId);

  const profile = await getProfileByUserId(session.userId);
  const user = getUserById(session.userId);
  document.querySelector("#lists-owner-name").textContent =
    profile?.displayName ?? user?.email ?? "usuario";

  // 6. renderizar y conectar eventos
  renderTabs();
  renderDetail();
  bindTabs();
  bindCreateForm();
  bindDetailControls();
}

// ---------- renderizado ----------

function renderTabs() {
  // 1. construir una pestaña (enlace real) por cada lista
  const tabs = document.querySelector("#lists-tabs");

  tabs.innerHTML = state.lists
    .map((list) => {
      const isActive = list.id === state.activeListId;
      return `
        <li class="nav-item" role="presentation">
          <a class="nav-link lists-tab ${isActive ? "active" : ""}"
             href="#lists"
             data-list-id="${list.id}"
             ${isActive ? 'aria-current="page"' : ""}>
            ${list.locked ? '<i class="bi bi-heart-fill me-1" aria-hidden="true"></i>' : ""}
            ${escapeHtml(list.name)}
            <span class="lists-tab-count">${list.items.length}</span>
          </a>
        </li>
      `;
    })
    .join("");
}

function renderDetail() {
  // 1. obtener la lista activa
  const list = getActiveList();
  const detail = document.querySelector("#list-detail");

  if (!list) {
    detail.hidden = true;
    return;
  }
  detail.hidden = false;

  // 2. encabezado
  document.querySelector("#list-detail-title").textContent = list.name;
  document.querySelector("#list-detail-description").textContent = list.description;
  document.querySelector("#list-detail-count").textContent = formatCount(list.items.length);

  // 3. la lista de favoritos no se puede eliminar
  const deleteButton = document.querySelector("#list-delete-button");
  deleteButton.hidden = Boolean(list.locked);
  resetDeleteButton(deleteButton);

  // 4. grilla de titulos y estado vacio
  const grid = document.querySelector("#list-items");
  const empty = document.querySelector("#list-empty");
  const items = sortItems(list.items, state.sort);

  grid.innerHTML = "";
  items.forEach((item) => grid.appendChild(createItemCard(item)));

  empty.hidden = items.length > 0;
}

function createItemCard(item) {
  // 1. clonar la plantilla definida en lists.html
  const template = document.querySelector("#list-item-template");
  const card = template.content.firstElementChild.cloneNode(true);

  // 2. rellenar los campos
  card.dataset.contentId = item.id;
  card.dataset.mediaType = item.mediaType;

  const image = card.querySelector("img");
  image.src = getImageUrl(item.backdropPath || item.posterPath);
  image.alt = `Imagen de ${item.title}`;

  card.querySelector('[data-field="title"]').textContent = item.title;
  card.querySelector('[data-field="title"]').title = item.title;
  card.querySelector('[data-field="type"]').textContent =
    item.mediaType === "TV" ? "Serie" : "Película";
  card.querySelector('[data-field="year"]').textContent = item.releaseDate
    ? item.releaseDate.slice(0, 4)
    : "S/F";
  card.querySelector('[data-field="rating"]').textContent = Number(item.rating ?? 0).toFixed(1);

  card.querySelector('[data-action="remove"]').setAttribute(
    "aria-label",
    `Quitar ${item.title} de la lista`,
  );

  return card;
}

// ---------- formulario de creacion ----------

function bindCreateForm() {
  const form = document.querySelector("#create-list-form");
  const nameInput = form.elements.name;
  const descriptionInput = form.elements.description;
  const message = document.querySelector("#create-list-message");

  // 1. validar en vivo mientras el usuario escribe
  nameInput.addEventListener("input", () => {
    showFieldError(nameInput, validateListName(nameInput.value, state.lists));
  });
  descriptionInput.addEventListener("input", () => {
    showFieldError(descriptionInput, validateListDescription(descriptionInput.value));
  });

  // 2. limpiar errores al cancelar
  form.addEventListener("reset", () => {
    clearFieldError(nameInput);
    clearFieldError(descriptionInput);
    setMessage(message, "");
  });

  // 3. validar todo al enviar
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameError = validateListName(nameInput.value, state.lists);
    const descriptionError = validateListDescription(descriptionInput.value);

    showFieldError(nameInput, nameError);
    showFieldError(descriptionInput, descriptionError);

    if (nameError || descriptionError) {
      setMessage(message, "Revisa los campos marcados antes de guardar.", "error");
      (nameError ? nameInput : descriptionInput).focus();
      return;
    }

    // 4. crear la lista y actualizar la vista
    const result = await createList(state.userId, {
      name: nameInput.value,
      description: descriptionInput.value,
      visibility: form.elements.visibility.value,
    });

    if (!result.ok) {
      showFieldError(nameInput, result.errors.name);
      showFieldError(descriptionInput, result.errors.description);
      return;
    }

    state.lists = await getUserLists(state.userId);
    state.activeListId = result.list.id;

    renderTabs();
    renderDetail();

    form.reset();
    setMessage(message, `Lista "${result.list.name}" creada.`, "success");

    // 5. cerrar el panel
    const panel = document.querySelector("#create-list-panel");
    window.bootstrap?.Collapse.getOrCreateInstance(panel).hide();
  });
}

// ---------- pestañas ----------

function bindTabs() {
  // 1. un solo listener para todas las pestañas (delegacion de eventos)
  document.querySelector("#lists-tabs").addEventListener("click", (event) => {
    const tab = event.target.closest("[data-list-id]");
    if (!tab) {
      return;
    }

    // 2. cambiar la lista activa sin recargar la vista
    event.preventDefault();
    state.activeListId = tab.dataset.listId;
    renderTabs();
    renderDetail();
  });
}

// ---------- controles del detalle ----------

function bindDetailControls() {
  const sortSelect = document.querySelector("#list-sort");
  const deleteButton = document.querySelector("#list-delete-button");
  const grid = document.querySelector("#list-items");

  // 1. ordenar
  sortSelect.value = state.sort;
  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    renderDetail();
  });

  // 2. eliminar lista (doble clic de confirmacion, sin dialogos nativos)
  deleteButton.addEventListener("click", async () => {
    if (deleteButton.dataset.confirm !== "true") {
      deleteButton.dataset.confirm = "true";
      deleteButton.innerHTML = '<i class="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>Confirmar eliminación';
      deleteButton.classList.replace("btn-outline-danger", "btn-danger");
      deleteButton.confirmTimer = setTimeout(() => resetDeleteButton(deleteButton), 4000);
      return;
    }

    const deleted = await deleteList(state.userId, state.activeListId);
    if (!deleted) {
      return;
    }

    state.lists = await getUserLists(state.userId);
    state.activeListId = state.lists[0]?.id ?? null;
    renderTabs();
    renderDetail();
  });

  // 3. quitar un titulo (delegacion de eventos sobre la grilla)
  grid.addEventListener("click", async (event) => {
    const button = event.target.closest('[data-action="remove"]');
    if (!button) {
      return;
    }

    const card = button.closest(".list-card");
    await removeItemFromList(
      state.userId,
      state.activeListId,
      card.dataset.contentId,
      card.dataset.mediaType,
    );

    state.lists = await getUserLists(state.userId);
    renderTabs();
    renderDetail();
  });
}

// ---------- helpers ----------

function resolveActiveList(requestedId) {
  // 1. mantener la lista activa anterior si aun existe, si no la primera
  const exists = state.lists.some((list) => list.id === requestedId);
  return exists ? requestedId : (state.lists[0]?.id ?? null);
}

function getActiveList() {
  return state.lists.find((list) => list.id === state.activeListId) ?? null;
}

function sortItems(items, sort) {
  const copy = [...items];

  switch (sort) {
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title, "es"));
    case "rating":
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "year":
      return copy.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
    default:
      return copy.sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""));
  }
}

function formatCount(count) {
  return count === 1 ? "1 título" : `${count} títulos`;
}

function showFieldError(input, error) {
  // 1. mostrar u ocultar el mensaje de error de un campo
  const feedback = document.querySelector(`#${input.id}-error`);
  feedback.textContent = error;
  input.classList.toggle("is-invalid", Boolean(error));
  input.classList.toggle("is-valid", !error && input.value.trim().length > 0);
  input.setAttribute("aria-invalid", error ? "true" : "false");
}

function clearFieldError(input) {
  document.querySelector(`#${input.id}-error`).textContent = "";
  input.classList.remove("is-invalid", "is-valid");
  input.removeAttribute("aria-invalid");
}

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `form-message mb-0 ${type ? `form-message-${type}` : ""}`.trim();
}

function resetDeleteButton(button) {
  clearTimeout(button.confirmTimer);
  button.dataset.confirm = "false";
  button.innerHTML = '<i class="bi bi-trash me-1" aria-hidden="true"></i>Eliminar lista';
  button.classList.replace("btn-danger", "btn-outline-danger");
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character],
  );
}

// ---------- reaccion al cierre de sesion ----------

document.addEventListener("auth:logout", () => {
  // 1. si el usuario cierra sesion estando en listas, volver al estado sin sesion
  if (document.querySelector("#lists-view")) {
    loadLists();
  }
});
