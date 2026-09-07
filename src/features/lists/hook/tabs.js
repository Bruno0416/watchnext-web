import { escapeHtml } from "../../../core/utils/html.js";

// ---------- pestanas de listas ----------
export function renderListTabs(lists, activeListId) {
  // 1. obtener el contenedor de pestanas
  const tabs = document.querySelector("#lists-tabs");

  // 2. renderizar una pestana por cada lista
  tabs.innerHTML = lists
    .map((list) => {
      const isActive = list.id === activeListId;

      return `
        <li role="presentation">
          <a class="lists-tab ${isActive ? "active" : ""}"
             href="#lists"
             role="tab"
             data-list-id="${list.id}"
             aria-selected="${isActive}"
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

export function initListTabs(onSelect) {
  // 1. obtener el contenedor de pestanas
  const tabs = document.querySelector("#lists-tabs");

  if (!tabs) {
    return;
  }

  // 2. escuchar cambios de lista mediante delegacion de eventos
  tabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-list-id]");

    if (!tab) {
      return;
    }

    event.preventDefault();
    onSelect?.(tab.dataset.listId);
  });
}
