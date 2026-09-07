import { ContentCarousel } from "../components/ContentCarousel.js";
import { HeroCarousel } from "../components/HeroCarousel.js";
import { openAddToListModal } from "../../lists/hook/AddToListModal.js";

// ---------- carga de inicio ----------

export async function loadHome(content) {
  // 1. cargar el fragmento html de inicio
  const response = await fetch("./src/features/home/home.html");

  // 2. validar que la vista se haya cargado
  if (!response.ok) {
    throw new Error("No se pudo cargar la vista de inicio");
  }

  // 3. obtener el contenedor principal
  const app = document.querySelector("#app");

  // 4. validar que el contenedor principal exista
  if (!app) {
    throw new Error("No se encontró el contenedor principal #app");
  }

  // 5. inyectar la vista y renderizar su contenido
  app.innerHTML = await response.text();
  renderHome(content);
}

// --- renderizado de inicio ---

function renderHome(content) {
  // 1. obtener los contenedores de la vista
  const heroContent = document.querySelector("#hero-content");
  const homeContent = document.querySelector("#home-content");

  // 2. validar que los contenedores existan
  if (!heroContent || !homeContent) {
    return;
  }

  // 3. renderizar el carrusel destacado
  const heroCarousel = new HeroCarousel(content.movies.popular);
  heroContent.appendChild(heroCarousel.render());
  heroCarousel.init();

  // 4. definir las secciones de contenido
  const sections = [
    new ContentCarousel("Películas populares", content.movies.popular, {
      id: "popular-movies"
    }),
    new ContentCarousel("Ahora en cines", content.movies.nowPlaying, {
      id: "now-playing"
    }),
    new ContentCarousel("Películas mejor valoradas", content.movies.topRated, {
      id: "top-rated-movies"
    }),
    new ContentCarousel("Próximamente", content.movies.upcoming, {
      id: "upcoming"
    }),
    new ContentCarousel("Series populares", content.tv.popular, {
      id: "popular-series"
    }),
    new ContentCarousel("En emisión", content.tv.onTheAir, {
      id: "on-the-air"
    }),
    new ContentCarousel("Series mejor valoradas", content.tv.topRated, {
      id: "top-rated-series"
    }),
    new ContentCarousel("Descubrir series", content.tv.discover, {
      id: "discover-tv"
    }),
  ];

  // 5. renderizar las secciones en la vista
  sections.forEach((section) => homeContent.appendChild(section.render()));

  // 6. conectar el boton "agregar a lista" de las tarjetas
  bindAddToList(homeContent, content);
}

// --- agregar a lista ---

function bindAddToList(container, content) {
  // 1. indexar todo el catalogo por tipo + id para encontrar el titulo clickeado
  const catalog = new Map();
  [...Object.values(content.movies), ...Object.values(content.tv)]
    .flat()
    .forEach((item) => catalog.set(`${item.type}:${item.id}`, item));

  // 2. un solo listener para todas las tarjetas (delegacion de eventos)
  container.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="add-to-list"]');
    if (!button) {
      return;
    }

    const card = button.closest(".content-card");
    const item = catalog.get(`${card.dataset.contentType}:${card.dataset.contentId}`);

    if (item) {
      openAddToListModal(item);
    }
  });
}
