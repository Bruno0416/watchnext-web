import { escapeHtml } from "../../../core/utils/html.js";
import { getImageUrl } from "../../../data/content.js";

// ---------- listas del perfil ----------
export function renderProfileLists(lists, isOwnProfile) {
  const grid = document.querySelector("#profile-lists-grid");
  const empty = document.querySelector("#profile-lists-empty");

  // 1. filtrar las listas visibles para el perfil actual
  const visibleLists = isOwnProfile
    ? lists
    : lists.filter((list) => list.visibility === "PUBLIC");

  if (!visibleLists.length) {
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  // 2. renderizar una tarjeta por lista
  grid.innerHTML = visibleLists.map(createListCard).join("");
}

// --- helpers privados ---
function createListCard(list) {
  const posters = list.items
    .slice(0, 3)
    .map((item) => item.posterPath || item.backdropPath)
    .filter(Boolean)
    .map(
      (path) => `<img src="${getImageUrl(path, "w185")}" alt="" loading="lazy">`,
    )
    .join("");

  return `
    <a class="profile-list-card" href="#lists" data-app-route="lists">
      <div class="profile-list-posters">
        ${posters || '<i class="bi bi-film" aria-hidden="true"></i>'}
      </div>
      <div class="profile-list-body">
        <h3>
          ${list.locked ? '<i class="bi bi-heart-fill me-1" aria-hidden="true"></i>' : ""}
          ${escapeHtml(list.name)}
        </h3>
        <p>${formatCount(list.items.length)}</p>
      </div>
    </a>
  `;
}

function formatCount(count) {
  return count === 1 ? "1 título" : `${count} títulos`;
}
