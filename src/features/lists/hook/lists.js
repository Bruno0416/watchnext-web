import { loadComponent } from "../../../core/components/loadComponent.js";
import { getSession } from "../../../core/session.js";
import { initCreateListForm } from "./create.js";
import {
  initListDetailControls,
  renderListDetail,
} from "./detail.js";
import {
  createUserList,
  deleteActiveList,
  getListState,
  initListState,
  removeActiveItem,
  selectList,
  setListSort,
} from "./state.js";
import { initListTabs, renderListTabs } from "./tabs.js";

// ---------- vista de listas ----------
export async function loadLists() {
  // 1. cargar la estructura principal de listas
  await loadComponent("#app", "./src/features/lists/lists.html");

  // 2. decidir que mostrar segun la sesion
  const session = getSession();
  const guest = document.querySelector("#lists-guest");
  const content = document.querySelector("#lists-content");

  if (!session) {
    guest.hidden = false;
    content.hidden = true;
    return;
  }

  guest.hidden = true;
  content.hidden = false;

  // 3. cargar y renderizar el estado inicial
  await initListState(session.userId);
  renderView();

  // 4. conectar los modulos de interaccion
  initInteractions();
}

// ---------- renderizado ----------
function renderView() {
  // 1. obtener el estado actual de la feature
  const { lists, activeListId, activeList, sort } = getListState();

  // 2. renderizar selector y detalle
  renderListTabs(lists, activeListId);
  renderListDetail(activeList, sort);
}

// ---------- interacciones ----------
function initInteractions() {
  // 1. conectar la navegacion entre listas
  initListTabs((listId) => {
    selectList(listId);
    renderView();
  });

  // 2. conectar el formulario de creacion
  initCreateListForm({
    getLists: () => getListState().lists,
    onSubmit: async (values) => {
      const result = await createUserList(values);
      renderView();
      return result;
    },
  });

  // 3. conectar los controles del detalle
  initListDetailControls({
    initialSort: getListState().sort,
    onSortChange: (sort) => {
      setListSort(sort);
      renderView();
    },
    onDeleteList: async () => {
      const deleted = await deleteActiveList();
      renderView();
      return deleted;
    },
    onRemoveItem: async ({ contentId, mediaType }) => {
      await removeActiveItem(contentId, mediaType);
      renderView();
    },
  });
}

// ---------- reaccion al cierre de sesion ----------
document.addEventListener("auth:logout", () => {
  // 1. volver al estado sin sesion si la vista esta activa
  if (document.querySelector("#lists-view")) {
    loadLists();
  }
});
