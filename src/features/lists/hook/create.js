import {
  clearFieldError,
  setFormMessage,
  showFieldError,
} from "../../../core/utils/form.js";
import {
  validateListDescription,
  validateListName,
} from "../../../data/lists.js";

// ---------- formulario de creacion ----------
export function initCreateListForm({ getLists, onSubmit }) {
  const form = document.querySelector("#create-list-form");
  const nameInput = form.elements.name;
  const descriptionInput = form.elements.description;
  const message = document.querySelector("#create-list-message");

  // 1. validar en vivo mientras el usuario escribe
  nameInput.addEventListener("input", () => {
    showFieldError(nameInput, validateListName(nameInput.value, getLists()));
  });

  descriptionInput.addEventListener("input", () => {
    showFieldError(descriptionInput, validateListDescription(descriptionInput.value));
  });

  // 2. limpiar errores al cancelar
  form.addEventListener("reset", () => {
    clearFieldError(nameInput);
    clearFieldError(descriptionInput);
    setFormMessage(message, "");
  });

  // 3. validar y enviar el formulario
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameError = validateListName(nameInput.value, getLists());
    const descriptionError = validateListDescription(descriptionInput.value);

    showFieldError(nameInput, nameError);
    showFieldError(descriptionInput, descriptionError);

    if (nameError || descriptionError) {
      setFormMessage(message, "Revisa los campos marcados antes de guardar.", "error");
      (nameError ? nameInput : descriptionInput).focus();
      return;
    }

    // 4. delegar la creacion al orquestador
    const result = await onSubmit?.({
      name: nameInput.value,
      description: descriptionInput.value,
      visibility: form.elements.visibility.value,
    });

    if (!result?.ok) {
      showFieldError(nameInput, result?.errors?.name ?? "");
      showFieldError(descriptionInput, result?.errors?.description ?? "");
      return;
    }

    // 5. limpiar el formulario y cerrar el panel
    form.reset();
    setFormMessage(message, `Lista "${result.list.name}" creada.`, "success");

    const panel = document.querySelector("#create-list-panel");
    window.bootstrap?.Collapse.getOrCreateInstance(panel).hide();
  });
}
