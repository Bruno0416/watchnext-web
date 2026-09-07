import { setSession } from "../../../core/session.js";
import { getUsers } from "../../../data/users.js"

// ---------- inicio de sesion ----------
export function initLogin() {
  // 1. obtener los elementos del formulario
  const form = document.querySelector("#login-form");
  const passwordInput = document.querySelector("#login-password");
  const passwordToggle = document.querySelector("#login-password-toggle");

  if (!form || !passwordInput || !passwordToggle) {
    return;
  }

  // 2. escuchar el boton de visibilidad
  passwordToggle.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";

    const icon = passwordToggle.querySelector("i");

    icon.className = isHidden
      ? "bi bi-eye-slash"
      : "bi bi-eye";
  });

  // 3. escuchar el envio del formulario
  form.addEventListener("submit", handleLogin);
}

// --- envio del formulario ---
function handleLogin(event) {
  // 1. evitar la recarga del navegador
  event.preventDefault();

  // 2. preparar la visualizacion de errores
  const showError = (fieldName, message) => {
    const errorElement = document.querySelector(
      `[data-error-for="${fieldName}"]`,
    );

    if (errorElement) {
      errorElement.textContent = message;
    }
  };

  // 3. limpiar los mensajes anteriores
  event.target
    .querySelectorAll(".auth-error")
    .forEach((element) => {
      element.textContent = "";
    });

  // 4. obtener data del form y usuarios
  const formData = new FormData(event.target);
  const users = getUsers();

  // 5. obtener variables
  const email = formData.get("email");
  const password = formData.get("password");
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // 6. validar email
  if (!email || email.length > 150) {
    showError("email", "El correo es demasiado largo o está vacío");
    return;
  }

  if (!emailRegex.test(email)) {
    showError("email", "El correo debe tener un formato válido");
    return;
  }

  if (!password || password.length < 4 || password.length > 10) {
    showError(
      "password",
      "La contraseña debe tener entre 4 y 10 caracteres",
    );
    return;
  }

  // 7. buscar el usuario con las credenciales ingresadas
  const user = users.find(
    (user) => user.email === email && user.password === password,
  );

  if (!user) {
    showError("password", "Credenciales invalidas");
    return;
  }

  // 8. crear la sesion del usuario
  setSession(user);

  // 9. informar que la autenticacion termino
  document.dispatchEvent(new CustomEvent("auth:success"));
}
