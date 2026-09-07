const STORAGE_PREFIX = "profile:";

export const ProfileRules = Object.freeze({
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 50,
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  BIO_MAX: 160,
  AVATAR_URL_MAX: 500,
});

export const ProfileVisibility = Object.freeze({
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
});

// ---------- lectura ----------

export async function loadProfiles() {
  // 1. cargar el archivo json de perfiles
  const response = await fetch("./src/data/json/profiles.json");

  // 2. validar que el archivo se haya cargado
  if (!response.ok) {
    throw new Error("No se pudieron cargar los perfiles");
  }

  // 3. devolver los perfiles procesados
  const data = await response.json();
  return (data.profiles ?? []).map(sanitizeProfile);
}

export async function getProfileByUserId(userId, user = null) {
  // 1. buscar el perfil base en el json
  const profiles = await loadProfiles();
  const base = profiles.find((profile) => profile.userId === userId) ?? null;

  // 2. generar un perfil por defecto cuando no exista
  const fallback = base ?? createDefaultProfile(userId, user);

  // 3. mezclar los cambios locales con el perfil base
  const stored = sanitizeProfile(readStorage(userId));
  return stored ? { ...fallback, ...stored } : fallback;
}

// ---------- validacion ----------

export function validateDisplayName(value) {
  const name = String(value ?? "").trim();

  if (!name) {
    return "El nombre es obligatorio.";
  }
  if (name.length < ProfileRules.DISPLAY_NAME_MIN) {
    return `El nombre debe tener al menos ${ProfileRules.DISPLAY_NAME_MIN} caracteres.`;
  }
  if (name.length > ProfileRules.DISPLAY_NAME_MAX) {
    return `El nombre no puede superar ${ProfileRules.DISPLAY_NAME_MAX} caracteres.`;
  }
  return "";
}

export function validateUsername(value) {
  const username = String(value ?? "").trim();

  if (!username) {
    return "El nombre de usuario es obligatorio.";
  }
  if (username.length < ProfileRules.USERNAME_MIN || username.length > ProfileRules.USERNAME_MAX) {
    return `Debe tener entre ${ProfileRules.USERNAME_MIN} y ${ProfileRules.USERNAME_MAX} caracteres.`;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Solo se permiten minúsculas, números y guion bajo (sin espacios).";
  }
  return "";
}

export function validateBio(value) {
  const bio = String(value ?? "").trim();

  if (bio.length > ProfileRules.BIO_MAX) {
    return `La biografía no puede superar ${ProfileRules.BIO_MAX} caracteres.`;
  }
  return "";
}

export function validateAvatarUrl(value) {
  const avatarUrl = String(value ?? "").trim();

  if (!avatarUrl) {
    return "";
  }
  if (avatarUrl.length > ProfileRules.AVATAR_URL_MAX) {
    return `La URL no puede superar ${ProfileRules.AVATAR_URL_MAX} caracteres.`;
  }

  try {
    const url = new URL(avatarUrl);
    return ["http:", "https:"].includes(url.protocol)
      ? ""
      : "Usa una URL http o https válida.";
  } catch {
    return "Ingresa una URL de imagen válida.";
  }
}

// ---------- escritura ----------

export async function saveProfile(userId, changes, user = null) {
  // 1. validar todos los campos editables
  const errors = {
    displayName: validateDisplayName(changes.displayName),
    username: validateUsername(changes.username),
    bio: validateBio(changes.bio),
    avatarUrl: validateAvatarUrl(changes.avatarUrl),
  };

  if (Object.values(errors).some(Boolean)) {
    return { ok: false, errors };
  }

  // 2. mezclar los cambios con lo ya guardado
  const current = sanitizeProfile(readStorage(userId)) ?? {};
  const updated = {
    ...current,
    displayName: String(changes.displayName).trim(),
    username: String(changes.username).trim(),
    bio: String(changes.bio ?? "").trim(),
    avatarUrl: String(changes.avatarUrl ?? "").trim() || null,
    visibility: Object.values(ProfileVisibility).includes(changes.visibility)
      ? changes.visibility
      : ProfileVisibility.PUBLIC,
    updatedAt: new Date().toISOString(),
  };

  // 3. persistir y devolver el perfil actualizado
  writeStorage(userId, updated);
  return { ok: true, profile: await getProfileByUserId(userId, user) };
}

// --- helpers privados ---

function createDefaultProfile(userId, user) {
  // 1. usar la parte local del correo como identidad inicial
  const local = String(user?.email ?? "usuario").split("@")[0];
  const username =
    local.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20) || "usuario";

  return {
    id: `profile-${userId}`,
    userId,
    username,
    displayName: local,
    bio: "",
    avatarUrl: null,
    visibility: ProfileVisibility.PUBLIC,
    followersCount: 0,
    followingCount: 0,
    favorites: [],
    topMovies: [],
    createdAt: user?.created_at ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeProfile(profile) {
  // 1. eliminar campos heredados que no pertenecen al perfil social
  if (!profile) {
    return null;
  }

  const {
    country: _country,
    regionId: _regionId,
    commune: _commune,
    ...cleanProfile
  } = profile;

  return cleanProfile;
}

function readStorage(userId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(userId, profile) {
  // 1. guardar solamente los campos vigentes del perfil
  localStorage.setItem(
    `${STORAGE_PREFIX}${userId}`,
    JSON.stringify(sanitizeProfile(profile)),
  );
}
