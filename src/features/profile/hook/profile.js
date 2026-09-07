import { loadComponent } from "../../../core/components/loadComponent.js";
import { getSession } from "../../../core/session.js";
import { getUserLists } from "../../../data/lists.js";
import { getProfileByUserId } from "../../../data/profiles.js";
import { getUserById } from "../../../data/users.js";
import { initProfileEdit } from "./edit.js";
import { renderProfileHeader } from "./header.js";
import { renderProfileLists } from "./lists.js";
import { initProfileTabs } from "./tabs.js";
import { renderTopMovies } from "./topMovies.js";

// ---------- vista de perfil ----------
export async function loadProfile(userId = null) {
  // 1. cargar la estructura principal del perfil
  await loadComponent("#app", "./src/features/profile/profile.html");

  // 2. cargar los componentes html de la feature
  await loadProfileComponents();

  // 3. resolver el perfil solicitado
  const session = getSession();
  const targetUserId = userId ?? session?.userId ?? null;
  const guest = document.querySelector("#profile-guest");
  const content = document.querySelector("#profile-content");

  if (!targetUserId) {
    guest.hidden = false;
    content.hidden = true;
    return;
  }

  guest.hidden = true;
  content.hidden = false;

  // 4. cargar los datos necesarios para la vista
  const user = getUserById(targetUserId);
  const profile = await getProfileByUserId(targetUserId, user);
  const lists = await getUserLists(targetUserId);
  const isOwnProfile = session?.userId === targetUserId;

  // 5. renderizar los modulos de la feature
  renderProfileHeader({ profile, isOwnProfile });
  renderTopMovies(profile);
  renderProfileLists(lists, isOwnProfile);
  initProfileTabs();

  // 6. conectar la edicion solo para el perfil propio
  if (isOwnProfile) {
    initProfileEdit({
      userId: targetUserId,
      user,
      profile,
      onSaved: (updatedProfile) => {
        renderProfileHeader({ profile: updatedProfile, isOwnProfile });
      },
    });
  }
}

// --- carga de componentes ---
async function loadProfileComponents() {
  await Promise.all([
    loadComponent(
      "#profile-guest-slot",
      "./src/features/profile/components/profile-guest.html",
    ),
    loadComponent(
      "#profile-header-slot",
      "./src/features/profile/components/profile-header.html",
    ),
    loadComponent(
      "#profile-edit-slot",
      "./src/features/profile/components/profile-edit.html",
    ),
    loadComponent(
      "#profile-top-movies-slot",
      "./src/features/profile/components/profile-top-movies.html",
    ),
    loadComponent(
      "#profile-tabs-slot",
      "./src/features/profile/components/profile-tabs.html",
    ),
  ]);
}

// ---------- reaccion al cierre de sesion ----------
document.addEventListener("auth:logout", () => {
  // 1. recargar el perfil si la sesion cambia mientras la vista esta activa
  if (document.querySelector("#profile-view")) {
    loadProfile();
  }
});
