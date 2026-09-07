
import { createUser } from "../../../data/users.js";

// ---------- registro de usuario ----------
export function initRegister() {
  // 1. obtener el formulario
  const form = document.querySelector("#register-form");

  if (!form) {
    return;
  }

  // 2. escuchar los botones de visibilidad
  form.querySelectorAll("[data-password-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = form.querySelector(
        `#${button.dataset.passwordTarget}`,
      );

      if (!input) {
        return;
      }

      const isHidden = input.type === "password";

      input.type = isHidden ? "text" : "password";

      const icon = button.querySelector("i");

      icon.className = isHidden
        ? "bi bi-eye-slash"
        : "bi bi-eye";
    });
  });

  // 3. escuchar el envio del formulario
  form.addEventListener("submit", handleRegister);
}

// --- envio del formulario ---
function handleRegister(event) {
  // 1. evitar la recarga del navegador
  event.preventDefault();

  // 2. obtener los datos del formulario
  const formData = new FormData(event.target);

  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // 3. preparar la visualizacion de errores
  const showError = (fieldName, message) => {
    const errorElement = document.querySelector(
      `[data-error-for="${fieldName}"]`,
    );

    if (errorElement) {
      errorElement.textContent = message;
    }
  };

  document
    .querySelectorAll(".auth-error")
    .forEach((element) => (element.textContent = ""));

  // 4. validar correo
  if (!email || email.length > 150) {
    showError("email", "El correo es demasiado largo o está vacío");
    return;
  }

  if (!emailRegex.test(email)) {
    showError("email", "El correo debe tener un formato válido");
    return;
  }

  // 5. validar contraseña
  if (password !== confirmPassword) {
    showError("confirmPassword", "Las contraseñas no coinciden");
    return;
  }

  // 6. crear usuario
  const newUser = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    email: email,
    email_verified: true,
    password: password,
    role: "USER",
  };

  createUser(newUser);

  // 7. limpiar el formulario
  event.target.reset();

  // 8. navegar a login
  document.querySelector(".auth-view")?.dispatchEvent(
    new CustomEvent("auth:view", {
      detail: "login",
    }),
  );
}