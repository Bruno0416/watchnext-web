export async function loadUsers() {
    // 1. cargar archivo json de los usuarios
    const usersResponse = await fetch("./src/data/json/users.json");

    // 2. validar que haya cargado
    if (!usersResponse.ok) {
        throw new Error("No se pudieron cargar los usuarios");
    }

    // 3. convertir respuesta en objeto
    const users = await usersResponse.json();

    // 4. devolver usuarios
    return users;
}