# WatchNext — Documentación de las features **Listas** y **Perfil**

Este documento explica, archivo por archivo y función por función, todo lo que se agregó o modificó para implementar las **listas por usuario** en WatchNext. La feature se apoya en el **router** (`src/core/router.js`) y el **módulo de sesión** (`src/core/session.js`) que hizo tu compañero en la rama `feature/auth-session`; aquí se explica cómo se conecta con ellos. Está pensado para que puedas explicar el código en la presentación y responder preguntas del docente.

---

## 1. Visión general

### ¿Qué hace la feature?

Cada usuario que inicia sesión tiene sus propias listas de películas y series. Por defecto tiene una lista **Favoritos** (que se carga desde `profiles.json` y no se puede borrar) y puede crear listas propias, agregar títulos desde el Home, quitarlos, ordenarlos y eliminar listas. Todo se guarda en `localStorage`, separado por usuario, así que si entra otro usuario ve sus propias listas.

### ¿Cómo se conectan las piezas?

```
index.html
  └─ main.js ─────────── inicializa navbar, usuarios y router (de tu compañero)
       ├─ core/router.js ─────────── decide qué vista cargar según data-app-route (home, auth, lists, profile)
       ├─ core/session.js ────────── sabe quién está logueado (localStorage, clave "session")
       ├─ data/profiles.js ───────── perfiles: json + cambios en localStorage  ← NUEVO
       ├─ data/lists.js ──────────── guarda/lee las listas de cada usuario     ← NUEVO
       ├─ features/home/ ─────────── tarjetas con botón "+" → abre el modal    ← MODIFICADO
       │     └─ features/lists/components/AddToListModal.js                  ← NUEVO
       ├─ features/lists/ ────────── la vista de listas                        ← NUEVO
       │     ├─ lists.html ───────── estructura semántica de la vista
       │     ├─ hook/lists.js ────── lógica: renderizar, validar, crear, borrar
       │     └─ style/style.css ──── estilos propios de la vista
       └─ features/profile/ ──────── la vista de perfil                        ← NUEVO
             ├─ profile.html ─────── cabecera, estadísticas, formulario, listas
             ├─ hook/profile.js ──── lógica: renderizar, validar, guardar
             └─ style/style.css ──── estilos propios de la vista
```

### Flujo de datos

1. `users.json` tiene el usuario (correo, contraseña, rol) y `profiles.json` tiene su perfil con `favorites`.
2. Al iniciar sesión por el formulario de tu compañero, `session.js` guarda `{ userId, role }` en `localStorage` bajo la clave `session`.
3. La primera vez que el usuario abre Listas, `lists.js` (datos) crea la lista Favoritos a partir del perfil y la guarda en `localStorage` bajo `watchnext-lists:{userId}`.
4. Desde ahí, todas las operaciones (crear, agregar, quitar, borrar) leen y escriben esa clave.

---

## 2. Archivos nuevos

### 2.1 Cómo se integra con el router de tu compañero (`src/core/router.js`)

Su router funciona por **clics**: cualquier elemento con `data-app-route="home|auth|lists|profile"` navega a esa vista (`navigate(route)`), y él ya había dejado el caso `lists` con un `console.log("enrutar a listas")` de placeholder. Lo que se cambió en su archivo (mínimo):

| Cambio | Para qué |
|---|---|
| `import { loadLists } from "../features/lists/hook/lists.js"` | Traer la vista. |
| `if (route === "lists") { setAppShellVisible(true); await loadLists(); }` | Reemplaza el `console.log` por la carga real de la vista. |
| `updateActiveLinks(route)` al inicio de `navigate()` + la función nueva | Marca en el navbar el enlace de la vista actual (`class="active"` y `aria-current="page"`); antes "Inicio" quedaba siempre marcado. |

Por eso todos los enlaces de la feature llevan `data-app-route`: en `lists.html` el botón "Iniciar sesión" (`auth`) y "Ir al inicio" (`home`), y en el modal "Ver mis listas" (`lists`).

### 2.2 Cómo se integra con la sesión de tu compañero (`src/core/session.js`)

Su módulo expone `getSession()`, `hasSession()`, `setSession(user)` y `clearSession()`. La sesión guardada es `{ userId, role }`. Listas solo usa `getSession()` para saber **quién** está logueado (`userId`) y así leer/escribir sus listas. Cuando el navbar cierra sesión dispara el evento `auth:logout`; `lists.js` lo escucha y, si la vista de listas está abierta, la vuelve a cargar en el estado "Inicia sesión".

### 2.2b `src/data/profiles.js` — Perfiles (JSON + cambios locales)

**Idea:** `profiles.json` es la semilla; lo que el usuario edita se guarda en `localStorage` bajo `watchnext-profile:{userId}` y se mezcla encima (`{ ...base, ...guardado }`). Un usuario registrado desde la app (que no está en el JSON) recibe un perfil por defecto generado desde su correo.

| Función / constante | Qué hace |
|---|---|
| `ProfileRules` | Reglas: nombre 2–50, usuario 3–20, bio máx. 160. |
| `REGIONS` | Arreglo de regiones de Chile, cada una con su arreglo `communes`. Es la implementación de "región y comuna relacionadas mediante arreglos JavaScript" que pide el Anexo. |
| `loadProfiles()` | `fetch` de `profiles.json`. |
| `getProfileByUserId(userId, user)` | Perfil base del JSON (o el por defecto) + cambios guardados. |
| `validateDisplayName` / `validateUsername` / `validateBio` / `validateRegion` | Devuelven un mensaje de error o `""`. El usuario solo admite `a-z`, `0-9` y `_`; la región es opcional pero si se elige exige una comuna de esa región. |
| `saveProfile(userId, changes, user)` | Valida todo; si hay errores devuelve `{ ok: false, errors }`; si no, guarda y devuelve el perfil actualizado. |
| `createDefaultProfile(userId, user)` (privada) | Perfil inicial para usuarios registrados: `displayName` y `username` desde la parte local del correo. |

---

### 2.3 `src/data/lists.js` — Almacenamiento de listas

**Por qué existe:** separa la **lógica de datos** (qué es una lista, cómo se guarda, qué reglas cumple) de la **vista** (`hook/lists.js`). Así el modal del Home y la vista de Listas usan las mismas funciones.

**Estructura de una lista:**

```js
{
  id: "favorites" | uuid,
  name: "Favoritos",
  description: "…",
  visibility: "PRIVATE" | "PUBLIC",
  locked: true | false,      // true = no se puede eliminar (solo Favoritos)
  createdAt: "2026-09-05T…",
  items: [ { id, mediaType: "MOVIE"|"TV", title, posterPath, backdropPath, rating, releaseDate, addedAt } ]
}
```

| Función | Qué hace |
|---|---|
| `FAVORITES_LIST_ID` | Constante `"favorites"`, id fijo de la lista protegida. |
| `ListVisibility` | Constante con `PRIVATE` / `PUBLIC`. |
| `ListRules` | Reglas de validación: nombre 3–40 caracteres, descripción máx. 120. |
| `getUserLists(userId)` | Si ya hay listas en `localStorage`, las devuelve. Si no (primera vez), busca el perfil en `profiles.json`, convierte sus `favorites` al formato de ítem y crea la lista **Favoritos** con `locked: true`. La guarda y la devuelve. |
| `getListById(userId, listId)` | Devuelve una lista concreta o `null`. |
| `validateListName(name, lists, ignoreId)` | Devuelve un mensaje de error o `""` si es válido. Reglas en orden: requerido → mínimo 3 → máximo 40 → no repetido (sin distinguir mayúsculas). |
| `validateListDescription(description)` | Máximo 120 caracteres. |
| `createList(userId, { name, description, visibility })` | Valida con las dos funciones anteriores; si hay error devuelve `{ ok: false, errors }`. Si no, crea la lista con un id único y la agrega al final. |
| `deleteList(userId, listId)` | Borra la lista, salvo que tenga `locked: true`. Devuelve `true/false`. |
| `addItemToList(userId, listId, item)` | Evita duplicados (mismo `id` + `mediaType`), agrega el ítem **al inicio** con `addedAt` y guarda. |
| `removeItemFromList(userId, listId, itemId, mediaType)` | Filtra el ítem fuera de la lista y guarda. |
| `toListItem(content)` | Convierte un elemento del catálogo del Home (`movies.json` / `tv.json`, que usan `type: "Película"/"Serie"`) al formato de ítem de lista (`mediaType: "MOVIE"/"TV"`). |
| `mapFavoriteToItem(favorite)` (privada) | Convierte un favorito de `profiles.json` (usa `tmdbId`, `voteAverage`) al formato de ítem. |
| `readStorage` / `writeStorage` (privadas) | Leen/escriben `localStorage` con la clave `watchnext-lists:{userId}`. |
| `createId()` (privada) | Usa `crypto.randomUUID()` si existe; si no, un id basado en la hora. |

**Por qué localStorage:** el anexo del ramo exige persistencia local. Los JSON son solo la "semilla" inicial (no se pueden escribir desde el navegador); lo que el usuario cambia vive en `localStorage`.

---

### 2.4 `src/features/lists/lists.html` — Estructura de la vista

Es un **fragmento** (sin `<html>`/`<body>`) que `lists.js` inyecta en `<main id="app">`, igual que `home.html`.

| Bloque | Elemento | Para qué |
|---|---|---|
| Estado sin sesión | `<section id="lists-guest" hidden>` | Mensaje + enlace real `<a href="#auth" data-app-route="auth">`. Se muestra si nadie inició sesión. |
| Contenido | `<div id="lists-content" hidden>` | Todo lo demás. El JS alterna el atributo `hidden` entre este y el anterior. |
| Encabezado | `<header class="lists-header">` | "Listas de {nombre}", título "Mis listas" y botón **Nueva lista** que abre un `collapse` de Bootstrap. |
| Formulario | `<form id="create-list-form" novalidate>` | Campos `name`, `description`, `visibility`. Cada input tiene `<label for>`, `autocomplete`, `aria-describedby`, un `form-text` con ayuda y un `invalid-feedback` vacío donde el JS escribe el error. `novalidate` desactiva la validación nativa del navegador para que la haga **JavaScript** (requisito de la rúbrica). |
| Mensaje | `<p id="create-list-message" role="status" aria-live="polite">` | Mensaje global del formulario (éxito/error). `aria-live` hace que los lectores de pantalla lo anuncien. |
| Pestañas | `<nav><ul id="lists-tabs">` | Una pestaña por lista, generada por JS como `<a href="#lists" data-list-id="…">` (hipervínculo real). |
| Detalle | `<section id="list-detail">` | Título, descripción, contador, `select` de orden, botón eliminar, la grilla `#list-items` y el estado vacío `#list-empty`. |
| Plantilla | `<template id="list-item-template">` | Tarjeta de un título. El JS la clona con `cloneNode(true)` y rellena los `data-field`. Reutiliza las clases `content-card` del Home para heredar el estilo. |

**Semántica usada:** `section`, `header`, `nav`, `article`, `form`, `label`, `template`. Cada ícono decorativo lleva `aria-hidden="true"` y cada botón sin texto lleva `aria-label`.

---

### 2.5 `src/features/lists/hook/lists.js` — Lógica de la vista

**Estado interno:**

```js
const state = { userId, lists, activeListId, sort };
```

Guarda el usuario, sus listas, cuál pestaña está activa y el orden elegido.

| Función | Qué hace |
|---|---|
| `loadLists()` | **Punto de entrada** (la llama el router con `navigate("lists")`). 1) Hace `fetch` de `lists.html` y lo inyecta en `#app`. 2) Lee la sesión con `getSession()`: si no hay, muestra `#lists-guest` y termina. 3) Si hay, carga las listas del usuario, su perfil (`getProfileByUserId`) y como respaldo el usuario (`getUserById` de `users.js`) para el nombre del encabezado; decide la lista activa (mantiene la anterior si sigue existiendo). 4) Llama a `renderTabs`, `renderDetail`, `bindTabs`, `bindCreateForm`, `bindDetailControls`. |
| `renderTabs()` | Genera el HTML de las pestañas como enlaces `<a href="#lists" data-list-id="…">`. La activa lleva `class="active"` y `aria-current="page"`. Favoritos lleva un ícono de corazón. Muestra la cantidad de títulos. Usa `escapeHtml` para que un nombre con `<` no rompa el HTML. |
| `bindTabs()` | Un solo listener en `#lists-tabs` (delegación): al hacer clic en una pestaña cambia `state.activeListId` y re-renderiza sin recargar la vista. |
| `renderDetail()` | Rellena título, descripción y contador de la lista activa; oculta el botón eliminar si `locked`; ordena los ítems con `sortItems`; vacía la grilla y agrega una tarjeta por ítem con `createItemCard`; muestra `#list-empty` si no hay ítems. |
| `createItemCard(item)` | Clona el `<template>`, pone `data-content-id` y `data-media-type`, la imagen (backdrop o póster con `getImageUrl`), el título, tipo (Película/Serie), año, rating con un decimal, y el `aria-label` del botón quitar. |
| `bindCreateForm()` | Conecta el formulario: **validación en vivo** con el evento `input` (muestra el error mientras escribes), limpieza en `reset` (botón Cancelar), y en `submit` valida todo, enfoca el primer campo con error, y si está OK llama a `createList`, recarga las listas, activa la nueva, re-renderiza, limpia el formulario, muestra el mensaje de éxito y cierra el panel. |
| `bindDetailControls()` | Conecta: el `select` de orden (`change` → re-render); el botón eliminar con **confirmación en dos clics** (primer clic cambia a "Confirmar eliminación" en rojo por 4 segundos; el segundo borra); y la grilla con **delegación de eventos**: un solo listener en `#list-items` detecta clics en cualquier `[data-action="remove"]`. |
| `resolveActiveList(requestedId)` | Si la lista activa anterior sigue existiendo la mantiene; si no, la primera lista. |
| `getActiveList()` | Devuelve el objeto de la lista activa. |
| `sortItems(items, sort)` | Copia el arreglo y ordena por: `title` (alfabético con `localeCompare` en español), `rating` (mayor primero), `year` (más reciente primero), o por defecto `addedAt` (agregado recientemente). |
| `formatCount(n)` | "1 título" / "N títulos". |
| `showFieldError(input, error)` | Escribe el error en `#{id}-error`, agrega `is-invalid` (Bootstrap lo pinta rojo y muestra el `invalid-feedback`), o `is-valid` si está bien y tiene contenido. Marca `aria-invalid`. |
| `clearFieldError(input)` | Quita todo lo anterior. |
| `setMessage(el, text, type)` | Escribe el mensaje global con clase `form-message-success` o `form-message-error`. |
| `resetDeleteButton(button)` | Devuelve el botón eliminar a su estado normal y cancela el temporizador. |
| `escapeHtml(value)` | Reemplaza `& < > " '` por entidades HTML. Previene inyección de HTML cuando se interpola texto del usuario en `innerHTML`. |

**Validaciones que puedes demostrar en la presentación:**

- Nombre vacío → "El nombre es obligatorio."
- Nombre "ab" → "El nombre debe tener al menos 3 caracteres."
- Nombre de 41+ caracteres → "El nombre no puede superar 40 caracteres." (además el input tiene `maxlength="40"`).
- Nombre "favoritos" → "Ya tienes una lista con ese nombre." (no distingue mayúsculas).
- Descripción de 121+ → "La descripción no puede superar 120 caracteres."
- Enviar con errores → mensaje global "Revisa los campos marcados antes de guardar." y foco en el campo con error.

---

### 2.6 `src/features/lists/components/AddToListModal.js` — Modal "Agregar a lista"

**Por qué existe:** conecta el Home con Listas. Es un modal de Bootstrap que se crea **una sola vez** y se reutiliza.

| Función | Qué hace |
|---|---|
| `openAddToListModal(content)` | **API pública.** Asegura que el modal exista, convierte el título del catálogo a ítem de lista (`toListItem`), pone el nombre del título en el encabezado. Si no hay sesión muestra "Inicia sesión…" con un enlace `data-app-route="auth"`; si hay, dibuja una casilla por lista (marcada si el título ya está adentro). Luego muestra el modal con `bootstrap.Modal`. |
| `ensureModal()` (privada) | Si el modal ya está en el `body` lo devuelve; si no, lo crea con la estructura estándar de Bootstrap (`modal-dialog`, `modal-header`, `modal-body`, `modal-footer`) y registra dos listeners: `change` (casillas) y `click` en enlaces (cierra el modal antes de navegar). |
| `renderOptions(lists)` (privada) | Genera la lista de `<label>` con `<input type="checkbox">` por cada lista, más un `<p aria-live="polite">` para el feedback. |
| `handleToggle(event)` (privada) | Al marcar una casilla llama a `addItemToList`; al desmarcar a `removeItemFromList`. Muestra "Agregado a la lista." / "Quitado de la lista." / o el mensaje de error, y actualiza el contador de esa lista. |

**Detalle técnico:** Bootstrap cancela la navegación de un `<a>` que tenga `data-bs-dismiss="modal"`, por eso los enlaces del modal no usan ese atributo y en su lugar el listener de `click` cierra el modal a mano. (Este fue un bug real que se detectó al probar).

---

### 2.7 `src/features/lists/style/style.css` — Estilos

Se importa desde `src/style.css` (CSS externo, un archivo por feature, mismo patrón que Home). Usa **solo las variables del tema** (`--wn-primary`, `--wn-surface`, `--wn-muted`, etc.), así funciona en modo oscuro y claro sin duplicar reglas.

| Grupo | Reglas | Para qué |
|---|---|---|
| Vista | `.lists-view`, `.lists-guest` | Espaciado y estado sin sesión centrado. |
| Panel | `.lists-panel`, `.form-control`, `.form-message*` | Tarjeta del formulario con fondo de superficie, inputs con foco morado, mensajes en color éxito/error. |
| Pestañas | `.lists-tabs`, `.lists-tab`, `.lists-tab-count` | Píldoras redondeadas; la activa en morado. Sobrescribe las variables `--bs-nav-pills-link-active-*` porque Bootstrap las pinta azules por defecto. |
| Grilla | `.lists-grid` | `display: grid` con `repeat(auto-fill, minmax(220px, 1fr))`: se adapta sola al ancho (responsive sin media queries). |
| Botones flotantes | `.list-card-remove`, `.content-add-button` | Botón redondo arriba a la derecha de la tarjeta, invisible hasta `hover`/`focus` (en móvil siempre visible). |
| Modal | `.add-to-list-content`, `.add-to-list-option` | Modal con colores del tema y opciones tipo tarjeta. |
| Responsive | `@media (max-width: 575.98px)` | Grilla más compacta y botones siempre visibles en pantallas chicas. |

---

### 2.8 `src/features/profile/` — Vista de Perfil

**`profile.html`** (fragmento inyectado en `#app`):

| Bloque | Elemento | Para qué |
|---|---|---|
| Sin sesión | `<section id="profile-guest">` | Mensaje + enlace `data-app-route="auth"`. |
| Cabecera | `<header class="profile-header">` | Avatar con iniciales, nombre, distintivo **Administrador** (solo si `role === "ADMIN"`), `@usuario`, correo, bio, ubicación, visibilidad, "miembro desde". |
| Estadísticas | `<section class="profile-stats">` con `<article>` | Listas, títulos guardados, seguidores, siguiendo. |
| Edición | `<form id="profile-form" novalidate>` | Nombre, usuario (con `input-group` "@"), bio con contador, **Región → Comuna** dependientes, visibilidad. Cada campo con `label`, `autocomplete`, ayuda y `invalid-feedback`. |
| Listas | `<section class="profile-lists">` | Tarjetas-enlace a cada lista con hasta 3 pósters. |

**`hook/profile.js`:**

| Función | Qué hace |
|---|---|
| `loadProfile()` | Punto de entrada (router → `navigate("profile")`). Carga el HTML, revisa sesión, obtiene usuario (`getUserById`), perfil y listas, y renderiza. |
| `renderHeader()` | Rellena avatar, nombre, usuario, correo, bio (o texto de ayuda), ubicación, visibilidad, año de registro y distintivo de rol. |
| `renderStats()` | Cuenta listas y suma de títulos desde `getUserLists`. |
| `renderLists()` | Tarjetas con pósters en miniatura (`w185` de TMDB). |
| `bindEditForm()` | Pobla el `select` de regiones desde `REGIONS`, precarga los valores actuales (`fillForm`), validación en vivo por campo, el usuario se fuerza a minúsculas, contador de bio, `reset` restaura, `submit` valida todo, guarda con `saveProfile`, re-renderiza la cabecera y cierra el panel. |
| `renderCommunes(regionId, select, selected)` | Al cambiar región, reemplaza las opciones de comuna con las del arreglo correspondiente (o deshabilita el select si no hay región). |
| `getInitials(name)` | "Usuario Demo" → "UD". |
| `showFieldError` / `clearFieldError` / `setMessage` / `escapeHtml` | Mismos helpers que en Listas. |
| Listener `auth:logout` | Vuelve al estado sin sesión si se cierra sesión estando en Perfil. |

**Validaciones que puedes demostrar:** nombre "A" → mínimo 2; usuario "Mi User" → solo minúsculas/números/guion bajo; bio > 160 → error; región elegida sin comuna → "Selecciona una comuna de la región elegida".

---

## 3. Archivos modificados

### 3.1 `src/core/router.js` (de tu compañero)

Ver sección 2.1: se conectó `loadLists()` en la ruta `lists`, `loadProfile()` en la ruta `profile`, y se agregó `updateActiveLinks()` para marcar el enlace activo del navbar. `main.js`, `navbar.html` y `session.js` **no se tocaron**.

### 3.2 `src/data/content.js`

Se exportó `getImageUrl(path)` para construir la URL completa de una imagen de TMDB desde cualquier módulo (antes la constante `IMAGE_BASE_URL` era privada).

### 3.3 `src/features/home/components/ContentCarousel.js`

Cada `<article class="content-card">` ahora lleva `data-content-type` (Película/Serie) y un botón `+` con `data-action="add-to-list"` y `aria-label` descriptivo.

### 3.4 `src/features/home/hook/home.js`

Nueva función `bindAddToList(container, content)`:

1. Indexa todo el catálogo en un `Map` con clave `"{tipo}:{id}"` para encontrar el objeto completo del título clickeado.
2. Registra **un solo listener** de `click` en el contenedor (delegación de eventos) que detecta el botón `+`, busca el título en el mapa y llama a `openAddToListModal(item)`.

### 3.5 `src/style.css`

Se agregaron los `@import` de `features/lists/style/style.css` y `features/profile/style/style.css`.

---

## 4. Cómo probarlo

1. Abre el proyecto con **Live Server** (clic derecho en `index.html` → "Open with Live Server"). Necesita servidor porque los fragmentos se cargan con `fetch`.
2. La app parte en la pantalla de autenticación. Pulsa **Continuar sin cuenta** → Inicio → **Listas** en el navbar: verás el estado "Inicia sesión".
3. Pulsa **Iniciar sesión** y entra con `usuario@demo.cl` / `1234` (o `admin@demo.cl` / `admin1234`).
4. Ve a **Listas**: verás Favoritos con Interstellar. Prueba el formulario con nombre vacío, "ab", "favoritos" y luego uno válido.
5. Ve a Inicio, pasa el mouse sobre una tarjeta y pulsa `+` → marca una lista → "Ver mis listas".
6. Cambia el orden, quita un título, elimina la lista (dos clics).
7. Cierra sesión desde el ícono de cuenta y vuelve a entrar con el otro usuario: las listas son independientes.
8. Ve a **Perfil**: edita nombre, usuario, bio, elige región y comuna, guarda y recarga la página: los cambios persisten. Con el admin verás el distintivo "Administrador".

---

## 5. Puntos de la rúbrica que cubre esta feature

| Criterio | Dónde se ve |
|---|---|
| HTML5 semántico | `lists.html`: `section`, `header`, `nav`, `article`, `form`, `template`. |
| Hipervínculos funcionales | Navbar (`data-app-route`), pestañas de listas, enlaces a `auth` y `home` desde la vista y el modal. |
| Botones funcionales | Nueva lista, Guardar, Cancelar, Eliminar, `+` en tarjetas, quitar. |
| Formularios interactivos con validación JS | `create-list-form` + `validateListName` / `validateListDescription` + validación en vivo. |
| Mensajes de error personalizados | Textos en español específicos por regla, `invalid-feedback`, mensaje global. |
| `label`, `autocomplete`, ayuda contextual | Todos los inputs tienen `label for`, `autocomplete="off"`, `form-text`, `aria-describedby`. |
| CSS externo y consistente | `lists/style/style.css` importado desde `src/style.css`, usa variables del tema. |
| Responsivo | Grid `auto-fill`, media query móvil. |
| Contenido dinámico desde JSON | Favoritos vienen de `profiles.json`; el catálogo de `movies.json`/`tv.json`. |
| `localStorage` | Listas por usuario (`watchnext-lists:{userId}`), además de la sesión y usuarios de tu compañero. |
| Control de sesión | Listas cambia según haya sesión (`getSession()`), y reacciona a `auth:logout`. |

---

## 6. Sugerencia de commits (para que el historial quede claro)

Todo va en la rama `feature/lists`, creada a partir de `feature/auth-session`:

```
feat(lists): almacenamiento de listas por usuario y carga de perfiles
feat(lists): vista de listas con formulario validado
feat(lists): modal "agregar a lista" desde el inicio
feat(profile): vista de perfil con edición validada y región/comuna
feat(router): conectar la vista de listas y marcar el enlace activo
style(lists): estilos de la vista de listas
docs: documentación de la feature de listas
```

Puedes hacer `git add` por carpeta para separar los commits, o uno solo si prefieres; lo importante es que el mensaje describa el cambio.
