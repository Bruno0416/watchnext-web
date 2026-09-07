import { getImageUrl } from "../../../data/content.js";

// ---------- detalle de lista ----------
export function renderListDetail(list, sort) {
  // 1. obtener el contenedor principal
  const detail = document.querySelector("#list-detail");

  if (!list) {
    detail.hidden = true;
    return;
  }

  detail.hidden = false;

  // 2. renderizar el encabezado
  document.querySelector("#list-detail-title").textContent = list.name;
  document.querySelector("#list-detail-description").textContent = list.description;
  document.querySelector("#list-detail-count").textContent = formatCount(list.items.length);

  // 3. configurar la eliminacion segun el tipo de lista
  const deleteButton = document.querySelector("#list-delete-button");
  deleteButton.hidden = Boolean(list.locked);
  resetDeleteButton(deleteButton);

  // 4. renderizar los titulos y estado vacio
  const grid = document.querySelector("#list-items");
  const empty = document.querySelector("#list-empty");
  const items = sortItems(list.items, sort);

  grid.innerHTML = "";
  items.forEach((item) => grid.appendChild(createItemCard(item)));
  empty.hidden = items.length > 0;
}

export function initListDetailControls({
  initialSort,
  onSortChange,
  onDeleteList,
  onRemoveItem,
}) {
  const sortSelect = document.querySelector("#list-sort");
  const deleteButton = document.querySelector("#list-delete-button");
  const grid = document.querySelector("#list-items");

  // 1. escuchar cambios de orden
  sortSelect.value = initialSort;
  sortSelect.addEventListener("change", () => {
    onSortChange?.(sortSelect.value);
  });

  // 2. confirmar la eliminacion antes de ejecutar la accion
  deleteButton.addEventListener("click", async () => {
    if (deleteButton.dataset.confirm !== "true") {
      prepareDeleteButton(deleteButton);
      return;
    }

    await onDeleteList?.();
  });

  // 3. escuchar la eliminacion de titulos mediante delegacion de eventos
  grid.addEventListener("click", async (event) => {
    const button = event.target.closest('[data-action="remove"]');

    if (!button) {
      return;
    }

    const card = button.closest(".list-card");

    await onRemoveItem?.({
      contentId: card.dataset.contentId,
      mediaType: card.dataset.mediaType,
    });
  });
}

// --- renderizado de tarjetas ---
function createItemCard(item) {
  // 1. clonar la plantilla definida en lists.html
  const template = document.querySelector("#list-item-template");
  const card = template.content.firstElementChild.cloneNode(true);

  // 2. rellenar los campos de la tarjeta
  card.dataset.contentId = item.id;
  card.dataset.mediaType = item.mediaType;

  // 3. preparar los enlaces al detalle del contenido
  const routeMediaType = item.mediaType === "TV" ? "tv" : "movie";
  card.querySelectorAll("[data-detail-link]").forEach((link) => {
    link.href = `#media/${routeMediaType}/${item.id}`;
    link.dataset.appRoute = "media";
    link.dataset.mediaType = routeMediaType;
    link.dataset.mediaId = item.id;
  });

  // 4. completar imagen y metadatos
  const image = card.querySelector("img");
  image.src = getImageUrl(item.posterPath || item.backdropPath, "w342");
  image.alt = `Imagen de ${item.title}`;

  card.querySelector('[data-field="title"]').textContent = item.title;
  card.querySelector('[data-field="title"]').title = item.title;
  card.querySelector('[data-field="type"]').textContent =
    item.mediaType === "TV" ? "Serie" : "Película";
  card.querySelector('[data-field="year"]').textContent = item.releaseDate
    ? item.releaseDate.slice(0, 4)
    : "S/F";
  card.querySelector('[data-field="rating"]').textContent = Number(
    item.rating ?? 0,
  ).toFixed(1);

  // 5. completar la accion de eliminacion
  card.querySelector('[data-action="remove"]').setAttribute(
    "aria-label",
    `Quitar ${item.title} de la lista`,
  );

  return card;
}

// --- helpers privados ---
function sortItems(items, sort) {
  const copy = [...items];

  switch (sort) {
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title, "es"));
    case "rating":
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "year":
      return copy.sort((a, b) =>
        (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""),
      );
    default:
      return copy.sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""));
  }
}

function formatCount(count) {
  return count === 1 ? "1 título" : `${count} títulos`;
}

function prepareDeleteButton(button) {
  button.dataset.confirm = "true";
  button.innerHTML =
    '<i class="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>Confirmar eliminación';
  button.classList.replace("btn-outline-danger", "btn-danger");
  button.confirmTimer = setTimeout(() => resetDeleteButton(button), 4000);
}

function resetDeleteButton(button) {
  clearTimeout(button.confirmTimer);
  button.dataset.confirm = "false";
  button.innerHTML =
    '<i class="bi bi-trash me-1" aria-hidden="true"></i>Eliminar lista';
  button.classList.replace("btn-danger", "btn-outline-danger");
}
