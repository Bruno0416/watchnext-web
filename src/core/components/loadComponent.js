// ---------- carga de componentes ----------

export async function loadComponent(targetSelector, componentUrl) {
  // 1. obtener el contenedor destino
  const target = document.querySelector(targetSelector);

  // 2. validar que el contenedor exista
  if (!target) {
    throw new Error(`No se encontró el contenedor: ${targetSelector}`);
  }

  // 3. cargar el fragmento html
  const response = await fetch(componentUrl);

  // 4. validar que el recurso se haya cargado
  if (!response.ok) {
    throw new Error(`No se pudo cargar el componente: ${componentUrl}`);
  }

  // 5. inyectar el contenido del componente
  target.innerHTML = await response.text();
}
