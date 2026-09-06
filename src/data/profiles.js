// ---------- perfiles de usuario ----------
// profiles.json trae los perfiles iniciales. los cambios que hace el usuario
// se guardan en localStorage bajo "watchnext-profile:{userId}" y se mezclan
// sobre el perfil base. los usuarios registrados desde la app (que no estan
// en el json) reciben un perfil por defecto generado a partir de su correo.

const STORAGE_PREFIX = "watchnext-profile:";

export const ProfileRules = Object.freeze({
  DISPLAY_NAME_MIN: 2,
  DISPLAY_NAME_MAX: 50,
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  BIO_MAX: 160,
});

export const ProfileVisibility = Object.freeze({
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
});

// --- regiones y comunas (arreglos relacionados) ---

export const REGIONS = [
  { id: "RM", name: "Región Metropolitana", communes: ["Santiago", "Providencia", "Las Condes", "Maipú", "Puente Alto", "La Florida", "Ñuñoa"] },
  { id: "V", name: "Valparaíso", communes: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "San Antonio"] },
  { id: "VIII", name: "Biobío", communes: ["Concepción", "Talcahuano", "Los Ángeles", "Chillán", "Coronel"] },
  { id: "IV", name: "Coquimbo", communes: ["La Serena", "Coquimbo", "Ovalle"] },
  { id: "IX", name: "La Araucanía", communes: ["Temuco", "Villarrica", "Angol"] },
  { id: "X", name: "Los Lagos", communes: ["Puerto Montt", "Osorno", "Castro"] },
  { id: "II", name: "Antofagasta", communes: ["Antofagasta", "Calama"] },
  { id: "VII", name: "Maule", communes: ["Talca", "Curicó", "Linares"] },
];

// --- lectura ---

export async function loadProfiles() {
  // 1. cargar el archivo json de perfiles
  const response = await fetch("./src/data/json/profiles.json");

  // 2. validar que el archivo se haya cargado
  if (!response.ok) {
    throw new Error("No se pudieron cargar los perfiles");
  }

  // 3. devolver el arreglo de perfiles
  const data = await response.json();
  return data.profiles ?? [];
}

export async function getProfileByUserId(userId, user = null) {
  // 1. buscar el perfil base en el json
  const profiles = await loadProfiles();
  const base = profiles.find((profile) => profile.userId === userId) ?? null;

  // 2. si no existe, generar uno por defecto para el usuario registrado
  const fallback = base ?? createDefaultProfile(userId, user);

  // 3. mezclar los cambios guardados localmente
  const stored = readStorage(userId);
  return stored ? { ...fallback, ...stored } : fallback;
}

// --- validacion ---

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

export function validateRegion(regionId, commune) {
  // 1. la region es opcional, pero si se elige debe tener comuna valida
  if (!regionId) {
    return "";
  }

  const region = REGIONS.find((item) => item.id === regionId);
  if (!region) {
    return "Selecciona una región válida.";
  }
  if (!commune || !region.communes.includes(commune)) {
    return "Selecciona una comuna de la región elegida.";
  }
  return "";
}

// --- escritura ---

export async function saveProfile(userId, changes, user = null) {
  // 1. validar todos los campos
  const errors = {
    displayName: validateDisplayName(changes.displayName),
    username: validateUsername(changes.username),
    bio: validateBio(changes.bio),
    region: validateRegion(changes.regionId, changes.commune),
  };

  if (Object.values(errors).some(Boolean)) {
    return { ok: false, errors };
  }

  // 2. mezclar con lo ya guardado y persistir
  const current = readStorage(userId) ?? {};
  const updated = {
    ...current,
    displayName: String(changes.displayName).trim(),
    username: String(changes.username).trim(),
    bio: String(changes.bio ?? "").trim(),
    regionId: changes.regionId || null,
    commune: changes.regionId ? changes.commune : null,
    visibility: Object.values(ProfileVisibility).includes(changes.visibility)
      ? changes.visibility
      : ProfileVisibility.PUBLIC,
    updatedAt: new Date().toISOString(),
  };
  writeStorage(userId, updated);

  // 3. devolver el perfil completo actualizado
  return { ok: true, profile: await getProfileByUserId(userId, user) };
}

// --- helpers privados ---

function createDefaultProfile(userId, user) {
  // 1. usar la parte local del correo como nombre inicial
  const local = String(user?.email ?? "usuario").split("@")[0];
  const username = local.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20) || "usuario";

  return {
    id: `profile-${userId}`,
    userId,
    username,
    displayName: local,
    bio: "",
    avatarUrl: null,
    country: "CL",
    regionId: null,
    commune: null,
    visibility: ProfileVisibility.PUBLIC,
    followersCount: 0,
    followingCount: 0,
    favorites: [],
    createdAt: user?.created_at ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
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
  localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(profile));
}
