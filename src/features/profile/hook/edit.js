import {
  clearFieldError,
  setFormMessage,
  showFieldError,
} from "../../../core/utils/form.js";
import {
  saveProfile,
  validateAvatarUrl,
  validateBio,
  validateDisplayName,
  validateUsername,
} from "../../../data/profiles.js";


// ---------- edicion del perfil ----------
export function initProfileEdit({ userId, user, profile, onSaved }) {
  const form = document.querySelector("#profile-form");

  if (!form) {
    return;
  }

  const nameInput = form.elements.displayName;
  const usernameInput = form.elements.username;
  const bioInput = form.elements.bio;
  const avatarInput = form.elements.avatarUrl;
  const visibilitySelect = form.elements.visibility;
  const message = document.querySelector("#profile-form-message");
  let currentProfile = profile;

  // 1. precargar los valores actuales
  fillForm();

  // 2. validar los campos en tiempo real
  nameInput.addEventListener("input", () => {
    showFieldError(nameInput, validateDisplayName(nameInput.value));
  });

  usernameInput.addEventListener("input", () => {
    usernameInput.value = usernameInput.value.toLowerCase();
    showFieldError(usernameInput, validateUsername(usernameInput.value));
  });

  bioInput.addEventListener("input", () => {
    document.querySelector("#profile-bio-count").textContent = bioInput.value.length;
    showFieldError(bioInput, validateBio(bioInput.value));
  });

  avatarInput.addEventListener("input", () => {
    showFieldError(avatarInput, validateAvatarUrl(avatarInput.value));
  });

  // 3. restaurar los valores guardados al cancelar
  form.addEventListener("reset", (event) => {
    event.preventDefault();
    [nameInput, usernameInput, bioInput, avatarInput].forEach(clearFieldError);
    setFormMessage(message, "");
    fillForm();
  });

  // 4. guardar los cambios del perfil
  form.addEventListener("submit", handleSubmit);

  async function handleSubmit(event) {
    event.preventDefault();

    const values = {
      displayName: nameInput.value,
      username: usernameInput.value,
      bio: bioInput.value,
      avatarUrl: avatarInput.value,
      visibility: visibilitySelect.value,
    };

    const errors = {
      displayName: validateDisplayName(values.displayName),
      username: validateUsername(values.username),
      bio: validateBio(values.bio),
      avatarUrl: validateAvatarUrl(values.avatarUrl),
    };

    showFieldError(nameInput, errors.displayName);
    showFieldError(usernameInput, errors.username);
    showFieldError(bioInput, errors.bio);
    showFieldError(avatarInput, errors.avatarUrl);

    if (Object.values(errors).some(Boolean)) {
      setFormMessage(message, "Revisa los campos marcados antes de guardar.", "error");
      form.querySelector(".is-invalid")?.focus();
      return;
    }

    const result = await saveProfile(userId, values, user);

    if (!result.ok) {
      setFormMessage(message, "No se pudo guardar el perfil.", "error");
      return;
    }

    // 5. actualizar el estado local y notificar al orquestador
    currentProfile = result.profile;
    onSaved?.(result.profile);
    setFormMessage(message, "Perfil actualizado.", "success");
    [nameInput, usernameInput, bioInput, avatarInput].forEach(clearFieldError);

    window.bootstrap?.Collapse.getOrCreateInstance(
      document.querySelector("#profile-edit-panel"),
    ).hide();
  }

  // --- rellenar formulario ---
  function fillForm() {
    nameInput.value = currentProfile.displayName ?? "";
    usernameInput.value = currentProfile.username ?? "";
    bioInput.value = currentProfile.bio ?? "";
    avatarInput.value = currentProfile.avatarUrl ?? "";
    visibilitySelect.value = currentProfile.visibility ?? "PUBLIC";
    document.querySelector("#profile-bio-count").textContent = bioInput.value.length;
  }
}
