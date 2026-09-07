const USERS_KEY = "users";

// ---------- almacenamiento de usuarios ----------
export async function initUsers() {
  // 1. reutilizar los usuarios almacenados cuando ya existen
  if (localStorage.getItem(USERS_KEY)) {
    return getUsers();
  }

  // 2. cargar los usuarios iniciales desde json
  const users = await loadUsers();

  // 3. guardar la copia inicial en localstorage
  saveUsers(users);

  // 4. devolver los usuarios inicializados
  return users;
}

export function getUsers() {
  // 1. obtener los usuarios almacenados
  const users = localStorage.getItem(USERS_KEY);

  // 2. devolver la coleccion procesada
  return users ? JSON.parse(users) : [];
}

export function getUserById(id) {
  // 1. buscar el usuario por identificador
  return getUsers().find((user) => user.id === id) ?? null;
}

export function getUserByEmail(email) {
  // 1. normalizar el correo buscado
  const normalizedEmail = String(email ?? "").trim().toLowerCase();

  // 2. buscar el usuario por correo
  return getUsers().find(
    (user) => user.email.toLowerCase() === normalizedEmail,
  ) ?? null;
}

export function createUser(user) {
  // 1. obtener los usuarios actuales
  const users = getUsers();

  // 2. agregar el nuevo usuario
  users.push(user);

  // 3. guardar la coleccion actualizada
  saveUsers(users);

  // 4. devolver el usuario creado
  return user;
}

// --- carga inicial ---

async function loadUsers() {
  // 1. cargar el archivo json de usuarios
  const response = await fetch("./src/data/json/users.json");

  // 2. validar que el archivo se haya cargado
  if (!response.ok) {
    throw new Error("No se pudieron cargar los usuarios");
  }

  // 3. devolver los usuarios procesados
  return await response.json();
}

// --- persistencia ---
function saveUsers(users) {
  // 1. guardar los usuarios en localstorage
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
