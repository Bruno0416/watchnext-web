import { openAddToListModal } from "../../lists/hook/AddToListModal.js";

// ---------- integracion con listas ----------
export function initMediaLists(media) {
  const button = document.querySelector('[data-media-action="add-to-list"]');

  if (!button) {
    return;
  }

  // 1. reutilizar el modal compartido de listas
  button.addEventListener("click", () => {
    openAddToListModal(media);
  });
}
