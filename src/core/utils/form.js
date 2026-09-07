// ---------- utilidades de formularios ----------
export function showFieldError(input, error) {
  // 1. obtener el mensaje asociado al campo
  const feedback = document.querySelector(`#${input.id}-error`);

  if (!feedback) {
    return;
  }

  // 2. actualizar el mensaje y estado visual
  feedback.textContent = error;
  input.classList.toggle("is-invalid", Boolean(error));
  input.classList.toggle("is-valid", !error && input.value.trim().length > 0);
  input.setAttribute("aria-invalid", error ? "true" : "false");
}

export function clearFieldError(input) {
  // 1. limpiar el mensaje asociado al campo
  const feedback = document.querySelector(`#${input.id}-error`);

  if (feedback) {
    feedback.textContent = "";
  }

  // 2. limpiar el estado visual
  input.classList.remove("is-invalid", "is-valid");
  input.removeAttribute("aria-invalid");
}

export function setFormMessage(element, text, type = "") {
  // 1. actualizar el mensaje general del formulario
  if (!element) {
    return;
  }

  element.textContent = text;
  element.className = `form-message mb-0 ${type ? `form-message-${type}` : ""}`.trim();
}
