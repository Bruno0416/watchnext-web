import { loadComponent } from "../../../core/components/loadComponent.js";
import { getImageUrl, getMediaById } from "../../../data/content.js";
import { initMediaLists } from "./lists.js";
import { initTrailer } from "./trailer.js";

// ---------- carga de media ----------
export async function loadMedia(mediaType, mediaId) {
    // 1. cargar la estructura html
    await loadComponent(
        "#app",
        "./src/features/media/media.html",
    );

    // 2. obtener el contenido solicitado
    const media = await getMediaById(mediaType, mediaId);

    if (!media) {
        renderNotFound();
        return;
    }

    // 3. normalizar los datos compartidos por peliculas y series
    const normalizedMedia = normalizeMedia(media, mediaType);

    // 4. renderizar la informacion principal
    renderMedia(normalizedMedia);

    // 5. iniciar las funcionalidades independientes
    initTrailer(normalizedMedia.trailer);
    initMediaLists(normalizedMedia);
}

// --- normalizar contenido ---
function normalizeMedia(media, mediaType) {
    return {
        ...media,
        mediaType,
        type: mediaType === "tv" ? "Serie" : "Película",
        displayTitle: media.title,
        displayDate: media.releaseDate ?? "",
        displayRuntime: media.runtime ?? null,
        displayRating: Number(media.rating ?? 0),
    };
}

// ---------- renderizado ----------
function renderMedia(media) {
    // 1. renderizar las secciones informativas de la pagina
    renderHero(media);
    renderMetadata(media);
    renderOverview(media);
    renderDirectors(media.directors);
    renderCast(media.cast);
}

// --- hero ---
function renderHero(media) {
    // 1. completar titulo e imagenes principales
    document.querySelector("#media-title").textContent = media.displayTitle;

    setImage(
        document.querySelector("#media-poster"),
        media.posterPath,
        "w500",
        `Portada de ${media.displayTitle}`,
    );

    setImage(
        document.querySelector("#media-backdrop"),
        media.backdropPath,
        "original",
        "",
    );
}

// --- metadatos ---
function renderMetadata(media) {
    const year = document.querySelector("#media-year");
    const runtime = document.querySelector("#media-runtime");
    const rating = document.querySelector("#media-rating");

    // 1. mostrar año y calificacion
    year.textContent = getYear(media.displayDate);
    rating.textContent = `★ ${media.displayRating.toFixed(1)}`;

    // 2. mostrar la duracion solo cuando exista en el modelo
    const formattedRuntime = formatRuntime(media.displayRuntime);
    runtime.textContent = formattedRuntime;
    runtime.hidden = !formattedRuntime;
}

// --- sinopsis ---
function renderOverview(media) {
    // 1. mostrar la sinopsis o un estado alternativo
    document.querySelector("#media-overview").textContent =
        media.overview || "Sinopsis no disponible.";
}

// --- direccion ---
function renderDirectors(directors = []) {
    const container = document.querySelector("#media-directors");
    const template = document.querySelector("#media-director-template");

    // 1. limpiar el contenido anterior
    container.replaceChildren();

    // 2. mostrar un estado alternativo cuando no existan directores
    if (!directors.length) {
        container.textContent = "Dirección no disponible.";
        return;
    }

    // 3. clonar la plantilla por cada director
    directors.forEach((director) => {
        const element = template.content.firstElementChild.cloneNode(true);
        element.textContent = director.name;
        container.append(element);
    });
}

// --- reparto ---
function renderCast(cast = []) {
    const container = document.querySelector("#media-cast");
    const template = document.querySelector("#media-cast-template");

    // 1. limpiar el contenido anterior
    container.replaceChildren();

    // 2. mostrar un estado alternativo cuando no exista reparto
    if (!cast.length) {
        container.textContent = "Reparto no disponible.";
        return;
    }

    // 3. clonar la plantilla para cada integrante
    cast.forEach((person) => {
        const card = template.content.firstElementChild.cloneNode(true);
        const image = card.querySelector('[data-field="image"]');

        setImage(
            image,
            person.profilePath,
            "w185",
            `Foto de ${person.name}`,
        );

        card.querySelector('[data-field="name"]').textContent = person.name;
        card.querySelector('[data-field="character"]').textContent =
            person.character || "Personaje no disponible";

        container.append(card);
    });
}

// --- estado no encontrado ---
function renderNotFound() {
    // 1. ocultar el contenido normal y mostrar el estado de error
    document.querySelector("#media-content").hidden = true;
    document.querySelector("#media-not-found").hidden = false;
}

// --- helpers privados ---
function setImage(element, path, size, alt) {
    // 1. ocultar la imagen cuando no exista una ruta valida
    if (!path) {
        element.removeAttribute("src");
        element.hidden = true;
        return;
    }

    // 2. completar la imagen con la url de tmdb
    element.src = getImageUrl(path, size);
    element.alt = alt;
    element.hidden = false;
}

function getYear(date) {
    return date ? date.slice(0, 4) : "S/F";
}

function formatRuntime(runtime) {
    const value = Array.isArray(runtime) ? runtime[0] : runtime;
    const minutes = Number(value);

    if (!Number.isFinite(minutes) || minutes <= 0) {
        return "";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (!hours) {
        return `${remainingMinutes} min`;
    }

    return remainingMinutes
        ? `${hours} h ${remainingMinutes} min`
        : `${hours} h`;
}
