import { loadProfiles } from "./profiles.js";

const STORAGE_PREFIX = "lists:";
export const FAVORITES_LIST_ID = "favorites";

export const ListVisibility = Object.freeze({
  PRIVATE: "PRIVATE",
  PUBLIC: "PUBLIC",
});

export const ListRules = Object.freeze({
  NAME_MIN: 3,
  NAME_MAX: 40,
  DESCRIPTION_MAX: 120,
});

// --- lectura ---

export async function getUserLists(userId) {
  // 1. devolver lo guardado si ya existe
  const stored = readStorage(userId);
  if (stored) {
    return stored;
  }

  // 2. si es la primera vez, crear la lista de favoritos desde el perfil
  const profiles = await loadProfiles();
  const profile = profiles.find((item) => item.userId === userId);
  const favorites = (profile?.favorites ?? []).map(mapFavoriteToItem);

  const seed = [
    {
      id: FAVORITES_LIST_ID,
      name: "Favoritos",
      description: "Los títulos que más te gustan.",
      visibility: ListVisibility.PRIVATE,
      locked: true,
      createdAt: new Date().toISOString(),
      items: favorites,
    },
  ];

  // 3. guardar y devolver
  writeStorage(userId, seed);
  return seed;
}

export async function getListById(userId, listId) {
  const lists = await getUserLists(userId);
  return lists.find((list) => list.id === listId) ?? null;
}

// --- validacion ---

export function validateListName(name, lists, ignoreId = null) {
  // 1. normalizar el valor
  const value = String(name ?? "").trim();

  // 2. aplicar reglas en orden
  if (!value) {
    return "El nombre es obligatorio.";
  }
  if (value.length < ListRules.NAME_MIN) {
    return `El nombre debe tener al menos ${ListRules.NAME_MIN} caracteres.`;
  }
  if (value.length > ListRules.NAME_MAX) {
    return `El nombre no puede superar ${ListRules.NAME_MAX} caracteres.`;
  }

  const duplicated = lists.some(
    (list) => list.id !== ignoreId && list.name.toLowerCase() === value.toLowerCase(),
  );
  if (duplicated) {
    return "Ya tienes una lista con ese nombre.";
  }

  // 3. sin errores
  return "";
}

export function validateListDescription(description) {
  const value = String(description ?? "").trim();

  if (value.length > ListRules.DESCRIPTION_MAX) {
    return `La descripción no puede superar ${ListRules.DESCRIPTION_MAX} caracteres.`;
  }

  return "";
}

// --- escritura ---

export async function createList(userId, { name, description, visibility }) {
  // 1. obtener las listas actuales y validar
  const lists = await getUserLists(userId);
  const nameError = validateListName(name, lists);
  const descriptionError = validateListDescription(description);

  if (nameError || descriptionError) {
    return { ok: false, errors: { name: nameError, description: descriptionError } };
  }

  // 2. construir la nueva lista
  const list = {
    id: createId(),
    name: String(name).trim(),
    description: String(description ?? "").trim(),
    visibility: Object.values(ListVisibility).includes(visibility)
      ? visibility
      : ListVisibility.PRIVATE,
    locked: false,
    createdAt: new Date().toISOString(),
    items: [],
  };

  // 3. guardar
  writeStorage(userId, [...lists, list]);
  return { ok: true, list };
}

export async function deleteList(userId, listId) {
  // 1. no permitir borrar la lista protegida
  const lists = await getUserLists(userId);
  const target = lists.find((list) => list.id === listId);

  if (!target || target.locked) {
    return false;
  }

  // 2. guardar sin la lista
  writeStorage(userId, lists.filter((list) => list.id !== listId));
  return true;
}

export async function addItemToList(userId, listId, item) {
  // 1. buscar la lista
  const lists = await getUserLists(userId);
  const list = lists.find((entry) => entry.id === listId);

  if (!list) {
    return { ok: false, message: "La lista no existe." };
  }

  // 2. evitar duplicados (mismo id y tipo)
  const exists = list.items.some(
    (entry) => entry.id === item.id && entry.mediaType === item.mediaType,
  );
  if (exists) {
    return { ok: false, message: "Ese título ya está en la lista." };
  }

  // 3. agregar al inicio y guardar
  list.items.unshift({ ...item, addedAt: new Date().toISOString() });
  writeStorage(userId, lists);
  return { ok: true };
}

export async function removeItemFromList(userId, listId, itemId, mediaType) {
  // 1. buscar la lista
  const lists = await getUserLists(userId);
  const list = lists.find((entry) => entry.id === listId);

  if (!list) {
    return false;
  }

  // 2. quitar el elemento y guardar
  list.items = list.items.filter(
    (entry) => !(String(entry.id) === String(itemId) && entry.mediaType === mediaType),
  );
  writeStorage(userId, lists);
  return true;
}

// --- conversion de datos ---

export function toListItem(content) {
  // 1. convertir un elemento del catalogo (movies/tv) al formato de lista
  return {
    id: content.id,
    mediaType: content.type === "Serie" ? "TV" : "MOVIE",
    title: content.title,
    posterPath: content.posterPath ?? "",
    backdropPath: content.backdropPath ?? "",
    rating: Number(content.rating ?? 0),
    releaseDate: content.releaseDate ?? "",
  };
}

function mapFavoriteToItem(favorite) {
  // 1. convertir un favorito de profiles.json al formato de lista
  return {
    id: favorite.tmdbId,
    mediaType: favorite.mediaType ?? "MOVIE",
    title: favorite.title,
    posterPath: favorite.posterPath ?? "",
    backdropPath: favorite.backdropPath ?? "",
    rating: Number(favorite.voteAverage ?? 0),
    releaseDate: favorite.releaseDate ?? "",
    addedAt: new Date().toISOString(),
  };
}

// --- helpers privados ---

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

function readStorage(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(userId, lists) {
  localStorage.setItem(storageKey(userId), JSON.stringify(lists));
}

function createId() {
  // 1. usar crypto si esta disponible, si no un id basado en tiempo
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
