const SESSION_KEY = "session";

// ---------- manejo de sesion ----------
export function getSession() {
  // 1. obtener la sesion almacenada
  const session = localStorage.getItem(SESSION_KEY);

  // 2. devolver la sesion procesada
  return session ? JSON.parse(session) : null;
}

export function hasSession() {
  // 1. comprobar si existe una sesion activa
  return getSession() !== null;
}

export function setSession(user) {
  // 1. crear una sesion minima para el usuario
  const session = {
    userId: user.id,
    role: user.role,
  };

  // 2. guardar la sesion en memoria
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // 3. devolver la sesion creada
  return session;
}

export function clearSession() {
  // 1. eliminar la sesion almacenada
  localStorage.removeItem(SESSION_KEY);
}
