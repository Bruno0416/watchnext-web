const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// --- url de imagen ---
export function getImageUrl(path, size = "original") {
  // 1. construir la url completa de una imagen de tmdb
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : "";
}

// ---------- carga de contenido ----------
export async function loadContent() {
  // 1. cargar los archivos json en paralelo
  const [moviesResponse, tvResponse] = await Promise.all([
    fetch("./src/data/json/movies.json"),
    fetch("./src/data/json/tv.json"),
  ]);

  // 2. validar que ambos archivos se hayan cargado
  if (!moviesResponse.ok || !tvResponse.ok) {
    throw new Error("No se pudo cargar el contenido local");
  }

  // 3. convertir las respuestas a objetos javascript
  const [movies, tv] = await Promise.all([
    moviesResponse.json(),
    tvResponse.json(),
  ]);

  // 4. preparar y devolver las colecciones de contenido
  return {
    movies: {
      nowPlaying: prepareContent(movies.nowPlaying, "Película", "movie"),
      popular: prepareContent(movies.popular, "Película", "movie"),
      topRated: prepareContent(movies.topRated, "Película", "movie"),
      upcoming: prepareContent(movies.upcoming, "Película", "movie"),
    },
    tv: {
      onTheAir: prepareContent(tv.onTheAir, "Serie", "tv"),
      popular: prepareContent(tv.popular, "Serie", "tv"),
      topRated: prepareContent(tv.topRated, "Serie", "tv"),
      discover: prepareContent(tv.discover, "Serie", "tv"),
    },
  };
}

export async function getMediaById(mediaType, mediaId) {
  let list;
  // 1. seleccionar el archivo segun el tipo
  switch (mediaType) {
    case "movie":
      list = "./src/data/json/movies.json";
      break;

    case "tv":
      list = "./src/data/json/tv.json";
      break;

    default:
      return null;
  }

  // 2. cargar el contenido
  const response = await fetch(list);
  const content = await response.json();

  // 3. unir las categorias
  const items = Object.values(content).flat();

  // 4. buscar el contenido por id
  return items.find((item) => item.id === Number(mediaId)) ?? null;
}

// --- preparacion de contenido ---
function prepareContent(items, type, mediaType) {
  // 1. completar cada elemento con su tipo y rutas de imagen
  return items.map((item) => ({
    ...item,
    type,
    mediaType,
    fullPoster: getImageUrl(item.posterPath),
    fullBackdrop: getImageUrl(item.backdropPath),
  }));
}
