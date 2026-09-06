// ---------- vista de perfil ----------

import { getSession } from "../../../core/session.js";
import { getUserById } from "../../../data/users.js";
import {
  REGIONS,
  getProfileByUserId,
  saveProfile,
  validateDisplayName,
  validateUsername,
  validateBio,
  validateRegion,
} from "../../../data/profiles.js";
import { getUserLists } from "../../../data/lists.js";

// --- estado de la vista ---

const state = {
  userId: null,
  user: null,
  profile: null,
  lists: [],
};

// ---------- carga de la vista ----------

export async function loadProfile() {
  // 1. cargar el fragmento html de perfil
  const response = await fetch("./src/features/profile/profile.html");

  if (!response.ok) {
    throw new Error("No se pudo cargar la vista de perfil");
  }

  // 2. inyectar la vista en el contenedor principal
  const app = document.querySelector("#app");
  app.innerHTML = await response.text();

  // 3. decidir que mostrar segun la sesion
  const session = getSession();
  const guest = document.querySelector("#profile-guest");
  const content = document.querySelector("#profile-content");

  if (!session) {
    guest.hidden = false;
    content.hidden = true;
    return;
  }

  guest.hidden = true;
  content.hidden = false;

  // 4. cargar usuario, perfil y listas
  state.userId = session.userId;
  state.user = getUserById(session.userId);
  state.profile = await getProfileByUserId(session.userId, state.user);
  state.lists = await getUserLists(session.userId);

  // 5. renderizar y conectar eventos
  renderHeader();
  renderStats();
  renderLists();
  bindEditForm();
}

// ---------- renderizado ----------

function renderHeader() {
  const { profile, user } = state;

  // 1. avatar con iniciales
  document.querySelector("#profile-avatar").textContent = getInitials(profile.displayName);

  // 2. identidad
  document.querySelector("#profile-display-name").textContent = profile.displayName;
  document.querySelector("#profile-username").textContent = profile.username;
  document.querySelector("#profile-email").textContent = user?.email ?? "";

  // 3. biografia (o texto de ayuda si esta vacia)
  const bio = document.querySelector("#profile-bio");
  bio.textContent = profile.bio || "Aún no has escrito una biografía.";
  bio.classList.toggle("text-secondary", !profile.bio);

  // 4. metadatos
  const region = REGIONS.find((item) => item.id === profile.regionId);
  document.querySelector("#profile-location").textContent = region
    ? `${profile.commune}, ${region.name}`
    : "Sin ubicación";
  document.querySelector("#profile-visibility").textContent =
    profile.visibility === "PRIVATE" ? "Privado" : "Público";
  document.querySelector("#profile-since").textContent = String(profile.createdAt ?? "").slice(0, 4) || "—";

  // 5. distintivo de rol (solo administradores)
  document.querySelector("#profile-role-badge").hidden = user?.role !== "ADMIN";
}

function renderStats() {
  const titles = state.lists.reduce((total, list) => total + list.items.length, 0);

  document.querySelector("#stat-lists").textContent = state.lists.length;
  document.querySelector("#stat-titles").textContent = titles;
  document.querySelector("#stat-followers").textContent = state.profile.followersCount ?? 0;
  document.querySelector("#stat-following").textContent = state.profile.followingCount ?? 0;
}

function renderLists() {
  // 1. una tarjeta por lista con hasta 3 posters de vista previa
  const grid = document.querySelector("#profile-lists-grid");

  grid.innerHTML = state.lists
    .map((list) => {
      const posters = list.items
        .slice(0, 3)
        .map((item) => item.posterPath || item.backdropPath)
        .filter(Boolean)
        .map((path) => `<img src="https://image.tmdb.org/t/p/w185${path}" alt="" loading="lazy">`)
        .join("");

      return `
        <a class="profile-list-card" href="#lists" data-app-route="lists">
          <div class="profile-list-posters">${posters || '<i class="bi bi-film" aria-hidden="true"></i>'}</div>
          <div class="profile-list-body">
            <h3 class="h6 mb-1">
              ${list.locked ? '<i class="bi bi-heart-fill me-1" aria-hidden="true"></i>' : ""}
              ${escapeHtml(list.name)}
            </h3>
            <p class="text-secondary small mb-0">${list.items.length} ${list.items.length === 1 ? "título" : "títulos"}</p>
          </div>
        </a>
      `;
    })
    .join("");
}

// ---------- formulario de edicion ----------

function bindEditForm() {
  const form = document.querySelector("#profile-form");
  const nameInput = form.elements.displayName;
  const usernameInput = form.elements.username;
  const bioInput = form.elements.bio;
  const regionSelect = form.elements.regionId;
  const communeSelect = form.elements.commune;
  const visibilitySelect = form.elements.visibility;
  const message = document.querySelector("#profile-form-message");

  // 1. poblar las regiones (arreglo js) y precargar los valores actuales
  regionSelect.innerHTML += REGIONS.map(
    (region) => `<option value="${region.id}">${region.name}</option>`,
  ).join("");
  fillForm();

  // 2. comunas dependientes de la region (arreglos relacionados)
  regionSelect.addEventListener("change", () => {
    renderCommunes(regionSelect.value, communeSelect);
    showFieldError(regionSelect, validateRegion(regionSelect.value, communeSelect.value));
  });
  communeSelect.addEventListener("change", () => {
    showFieldError(regionSelect, validateRegion(regionSelect.value, communeSelect.value));
  });

  // 3. validacion en vivo
  nameInput.addEventListener("input", () => showFieldError(nameInput, validateDisplayName(nameInput.value)));
  usernameInput.addEventListener("input", () => {
    usernameInput.value = usernameInput.value.toLowerCase();
    showFieldError(usernameInput, validateUsername(usernameInput.value));
  });
  bioInput.addEventListener("input", () => {
    document.querySelector("#profile-bio-count").textContent = bioInput.value.length;
    showFieldError(bioInput, validateBio(bioInput.value));
  });

  // 4. cancelar: volver a los valores guardados
  form.addEventListener("reset", (event) => {
    event.preventDefault();
    [nameInput, usernameInput, bioInput, regionSelect].forEach(clearFieldError);
    setMessage(message, "");
    fillForm();
  });

  // 5. guardar
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = {
      displayName: nameInput.value,
      username: usernameInput.value,
      bio: bioInput.value,
      regionId: regionSelect.value,
      commune: communeSelect.value,
      visibility: visibilitySelect.value,
    };

    const errors = {
      displayName: validateDisplayName(values.displayName),
      username: validateUsername(values.username),
      bio: validateBio(values.bio),
      region: validateRegion(values.regionId, values.commune),
    };

    showFieldError(nameInput, errors.displayName);
    showFieldError(usernameInput, errors.username);
    showFieldError(bioInput, errors.bio);
    showFieldError(regionSelect, errors.region);

    if (Object.values(errors).some(Boolean)) {
      setMessage(message, "Revisa los campos marcados antes de guardar.", "error");
      form.querySelector(".is-invalid")?.focus();
      return;
    }

    const result = await saveProfile(state.userId, values, state.user);
    if (!result.ok) {
      setMessage(message, "No se pudo guardar el perfil.", "error");
      return;
    }

    // 6. actualizar la vista con el perfil guardado
    state.profile = result.profile;
    renderHeader();
    setMessage(message, "Perfil actualizado.", "success");
    [nameInput, usernameInput, bioInput, regionSelect].forEach(clearFieldError);
    window.bootstrap?.Collapse.getOrCreateInstance(document.querySelector("#profile-edit-panel")).hide();
  });

  // --- rellenar con los valores del perfil actual ---
  function fillForm() {
    nameInput.value = state.profile.displayName ?? "";
    usernameInput.value = state.profile.username ?? "";
    bioInput.value = state.profile.bio ?? "";
    document.querySelector("#profile-bio-count").textContent = bioInput.value.length;
    regionSelect.value = state.profile.regionId ?? "";
    renderCommunes(regionSelect.value, communeSelect, state.profile.commune);
    visibilitySelect.value = state.profile.visibility ?? "PUBLIC";
  }
}

function renderCommunes(regionId, communeSelect, selected = "") {
  // 1. buscar la region y construir sus comunas
  const region = REGIONS.find((item) => item.id === regionId);

  if (!region) {
    communeSelect.innerHTML = '<option value="">Primero elige una región</option>';
    communeSelect.disabled = true;
    return;
  }

  communeSelect.disabled = false;
  communeSelect.innerHTML =
    '<option value="">Selecciona una comuna</option>' +
    region.communes.map((commune) => `<option value="${commune}">${commune}</option>`).join("");
  communeSelect.value = region.communes.includes(selected) ? selected : "";
}

// ---------- helpers ----------

function getInitials(name) {
  return String(name ?? "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "U";
}

function showFieldError(input, error) {
  const feedback = document.querySelector(`#${input.id}-error`);
  feedback.textContent = error;
  input.classList.toggle("is-invalid", Boolean(error));
  input.classList.toggle("is-valid", !error && input.value.trim().length > 0 && input.tagName !== "SELECT");
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

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character],
  );
}

// ---------- reaccion al cierre de sesion ----------

document.addEventListener("auth:logout", () => {
  if (document.querySelector("#profile-view")) {
    loadProfile();
  }
});
