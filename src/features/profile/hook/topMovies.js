import { escapeHtml } from "../../../core/utils/html.js";
import { getImageUrl } from "../../../data/content.js";

// ---------- top de peliculas ----------
export function renderTopMovies(profile) {
  // 1. obtener la seleccion fija del perfil
  const movies = (profile.topMovies ?? [])
    .filter((item) => item.mediaType === "MOVIE")
    .slice(0, 6);

  const grid = document.querySelector("#profile-top-movies-grid");
  const empty = document.querySelector("#profile-top-movies-empty");

  // 2. mostrar el estado vacio cuando corresponda
  if (!movies.length) {
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  // 3. renderizar el top independiente de las listas
  grid.innerHTML = movies
    .map((movie) => {
      const image = getImageUrl(movie.posterPath, "w342");
      const year = movie.releaseDate ? movie.releaseDate.slice(0, 4) : "S/F";

      return `
        <article class="profile-movie-card" data-tmdb-id="${movie.tmdbId}">
          <div class="profile-movie-poster">
            ${image
          ? `<img src="${image}" alt="Poster de ${escapeHtml(movie.title)}" loading="lazy">`
          : '<i class="bi bi-film" aria-hidden="true"></i>'
        }
          </div>
          <h3>${escapeHtml(movie.title)}</h3>
          <p>${year}</p>
        </article>
      `;
    })
    .join("");
}
