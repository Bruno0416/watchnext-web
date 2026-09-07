import {
  createList,
  deleteList,
  getUserLists,
  removeItemFromList,
} from "../../../data/lists.js";

// ---------- estado de listas ----------
const state = {
  userId: null,
  lists: [],
  activeListId: null,
  sort: "added",
};

export async function initListState(userId) {
  // 1. cargar las listas del usuario
  state.userId = userId;
  state.lists = await getUserLists(userId);

  // 2. conservar la seleccion anterior cuando siga disponible
  state.activeListId = resolveActiveList(state.activeListId);
}

export function getListState() {
  // 1. exponer una copia del estado de lectura
  return {
    lists: state.lists,
    activeListId: state.activeListId,
    activeList: getActiveList(),
    sort: state.sort,
  };
}

export function selectList(listId) {
  // 1. actualizar la lista activa
  state.activeListId = listId;
}

export function setListSort(sort) {
  // 1. actualizar el criterio de orden
  state.sort = sort;
}

export async function createUserList(values) {
  // 1. crear la lista mediante la capa de datos
  const result = await createList(state.userId, values);

  if (!result.ok) {
    return result;
  }

  // 2. recargar y seleccionar la lista creada
  await reloadLists();
  state.activeListId = result.list.id;
  return result;
}

export async function deleteActiveList() {
  // 1. eliminar la lista activa
  const deleted = await deleteList(state.userId, state.activeListId);

  if (!deleted) {
    return false;
  }

  // 2. recargar y seleccionar la primera lista disponible
  await reloadLists();
  state.activeListId = state.lists[0]?.id ?? null;
  return true;
}

export async function removeActiveItem(contentId, mediaType) {
  // 1. quitar el titulo de la lista activa
  await removeItemFromList(
    state.userId,
    state.activeListId,
    contentId,
    mediaType,
  );

  // 2. recargar las listas actualizadas
  await reloadLists();
}

// --- helpers privados ---
async function reloadLists() {
  state.lists = await getUserLists(state.userId);
}

function resolveActiveList(requestedId) {
  const exists = state.lists.some((list) => list.id === requestedId);
  return exists ? requestedId : (state.lists[0]?.id ?? null);
}

function getActiveList() {
  return state.lists.find((list) => list.id === state.activeListId) ?? null;
}
