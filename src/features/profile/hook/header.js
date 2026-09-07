// ---------- cabecera del perfil ----------
export function renderProfileHeader({ profile, isOwnProfile }) {
  // 1. renderizar el avatar
  const avatar = document.querySelector("#profile-avatar");
  const fallback = document.querySelector("#profile-avatar-fallback");

  avatar.style.backgroundImage = "";
  avatar.classList.toggle("has-image", Boolean(profile.avatarUrl));

  if (profile.avatarUrl) {
    avatar.style.backgroundImage = `url("${escapeCssUrl(profile.avatarUrl)}")`;
    fallback.textContent = "";
  } else {
    fallback.textContent = getInitials(profile.displayName);
  }

  // 2. renderizar identidad y biografia
  document.querySelector("#profile-display-name").textContent = profile.displayName;
  document.querySelector("#profile-username").textContent = profile.username;

  const bio = document.querySelector("#profile-bio");
  bio.textContent = profile.bio || "Este perfil todavía no tiene biografía.";
  bio.classList.toggle("is-empty", !profile.bio);

  // 3. renderizar estadisticas sociales
  document.querySelector("#stat-followers").textContent = profile.followersCount ?? 0;
  document.querySelector("#stat-following").textContent = profile.followingCount ?? 0;

  // 4. mostrar la accion correspondiente al perfil
  document.querySelector("#profile-edit-button").hidden = !isOwnProfile;
  document.querySelector("#profile-follow-button").hidden = isOwnProfile;
  document.querySelector("#profile-edit-slot").hidden = !isOwnProfile;
}

// --- helpers privados ---
function getInitials(name) {
  return (
    String(name ?? "U")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U"
  );
}

function escapeCssUrl(value) {
  return String(value ?? "").replace(/["\\\n\r]/g, "");
}
