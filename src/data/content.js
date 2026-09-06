const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

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
      nowPlaying: prepareContent(movies.nowPlaying, "Película"),
      popular: prepareContent(movies.popular, "Película"),
      topRated: prepareContent(movies.topRated, "Película"),
      upcoming: prepareContent(movies.upcoming, "Película"),
    },
    tv: {
      onTheAir: prepareContent(tv.onTheAir, "Serie"),
      popular: prepareContent(tv.popular, "Serie"),
      topRated: prepareContent(tv.topRated, "Serie"),
      discover: prepareContent(tv.discover, "Serie"),
    },
  };
}

// --- preparacion de contenido ---

function prepareContent(items, type) {
  // 1. completar cada elemento con su tipo y rutas de imagen
  return items.map((item) => ({
    ...item,
    type,
    fullPoster: item.posterPath ? `${IMAGE_BASE_URL}${item.posterPath}` : "",
    fullBackdrop: item.backdropPath
      ? `${IMAGE_BASE_URL}${item.backdropPath}`
      : "",
  }));
}
