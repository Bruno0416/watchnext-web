// ---------- componente de carrusel destacado ----------

export class HeroCarousel {
  constructor(content) {
    // 1. preparar el contenido y el estado inicial
    this.content = content.slice(0, 6);
    this.element = null;
  }

  render() {
    // 1. crear el contenedor principal
    const section = document.createElement("section");

    // 2. construir la estructura del carrusel
    section.id = "featured";
    section.className = "hero-section";
    section.setAttribute("aria-label", "Contenido destacado");
    section.innerHTML = `
      <div id="featured-carousel" class="carousel slide carousel-fade">
        <div class="carousel-inner">
          ${this.createItems()}
        </div>
      </div>
    `;

    // 3. guardar la referencia al componente de bootstrap
    this.element = section.querySelector("#featured-carousel");

    // 4. devolver el componente renderizado
    return section;
  }

  init() {
    // 1. validar que el carrusel pueda inicializarse
    if (!this.element || !window.bootstrap?.Carousel) {
      return;
    }

    // 2. configurar el carrusel de bootstrap
    const carousel = window.bootstrap.Carousel.getOrCreateInstance(this.element, {
      interval: 6500,
      keyboard: false,
      pause: "hover",
      ride: "carousel",
      touch: true,
      wrap: true,
    });

    // 3. iniciar la rotacion automatica
    carousel.cycle();
  }

  createItems() {
    // 1. transformar el contenido en elementos destacados
    return this.content
      .map((content, index) => {
        const title = this.escapeHtml(content.title);
        const overview = this.escapeHtml(content.overview);
        const image = this.getBackdrop(content);
        const year = this.getYear(content.releaseDate);
        const rating = this.getRating(content.rating);

        return `
          <article class="carousel-item hero-item ${index === 0 ? "active" : ""}">
            <img
              src="${image}"
              class="hero-backdrop"
              alt="Imagen de ${title}"
              loading="${index === 0 ? "eager" : "lazy"}"
            >

            <div class="hero-scrim"></div>

            <div class="container-fluid app-container hero-content-wrap">
              <div class="hero-content">
                <div class="hero-eyebrow">
                  <span>${this.escapeHtml(content.type)}</span>
                  <span aria-hidden="true">•</span>
                  <span>${year}</span>
                </div>

                <h1 class="hero-title">${title}</h1>

                <div class="hero-rating" aria-label="Calificación ${rating} de 10">
                  <i class="bi bi-star-fill" aria-hidden="true"></i>
                  <strong>${rating}</strong>
                  <span>/ 10</span>
                </div>

                <p class="hero-overview">${overview}</p>

                <button
                  class="btn btn-primary hero-action"
                  type="button"
                  data-content-id="${content.id}"
                  aria-label="Ver más sobre ${title}"
                >
                  Ver más
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  // --- helpers privados ---

  getBackdrop(content) {
    return content.fullBackdrop || content.fullPoster;
  }

  getRating(value) {
    return Number(value ?? 0).toFixed(1);
  }

  getYear(date) {
    return date ? date.slice(0, 4) : "S/F";
  }

  escapeHtml(value) {
    // 1. escapar caracteres con significado especial en html
    return String(value ?? "").replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[character],
    );
  }
}
