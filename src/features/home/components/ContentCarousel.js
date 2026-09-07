import { escapeHtml } from "../../../core/utils/html.js";

// ---------- componente de carrusel de contenido ----------

export class ContentCarousel {
  constructor(title, content, options = {}) {
    // 1. guardar los datos principales del carrusel
    this.title = title;
    this.content = content;

    // 2. resolver las opciones configurables
    this.id = options.id ?? this.getCarouselId();
  }

  render() {
    // 1. crear el contenedor principal
    const section = document.createElement("section");

    // 2. construir la estructura visual del carrusel
    section.id = this.id;
    section.className = "content-section";
    section.innerHTML = `
      <div class="content-section-header">
        <h2 class="content-section-title">
          <span>${this.title}</span>
        </h2>
      </div>

      <div class="content-carousel-shell">
        <button
          class="btn content-scroll-button content-scroll-button-prev"
          type="button"
          data-scroll-direction="left"
          aria-label="Desplazar ${this.title} hacia la izquierda"
        >
          <i class="bi bi-chevron-left"></i>
        </button>

        <div class="content-track" tabindex="0" aria-label="${this.title}">
          ${this.createItems()}
        </div>

        <button
          class="btn content-scroll-button content-scroll-button-next"
          type="button"
          data-scroll-direction="right"
          aria-label="Desplazar ${this.title} hacia la derecha"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    `;

    // 3. conectar los controles de desplazamiento
    this.bindControls(section);

    // 4. devolver el componente renderizado
    return section;
  }

  bindControls(section) {
    // 1. obtener la pista desplazable
    const track = section.querySelector(".content-track");

    // 2. registrar los controles de desplazamiento
    section.querySelectorAll("[data-scroll-direction]").forEach((button) => {
      button.addEventListener("click", () => {
        const direction = button.dataset.scrollDirection === "left" ? -1 : 1;
        const distance = Math.max(track.clientWidth * 0.82, 320);

        track.scrollBy({
          left: distance * direction,
          behavior: "smooth",
        });
      });
    });
  }

  createItems() {
    // 1. transformar el contenido en tarjetas html
    return this.content
      .map((content) => {
        const title = escapeHtml(content.title);
        const type = escapeHtml(content.type);
        const image = this.getPoster(content);
        const mediaType = escapeHtml(content.mediaType);
        const year = this.getYear(content.releaseDate);
        const rating = this.getRating(content.rating);

        return `
          <article
            class="content-card media-card"
            data-content-id="${content.id}"
            data-content-type="${content.type}"
          >
            <div class="media-card-poster-wrap">
              <a
                class="media-card-poster-link"
                href="#media/${mediaType}/${content.id}"
                data-app-route="media"
                data-media-type="${mediaType}"
                data-media-id="${content.id}"
                aria-label="Ver detalle de ${title}"
              >
                <img
                  src="${image}"
                  class="media-card-poster"
                  alt="Portada de ${title}"
                  loading="lazy"
                >
              </a>

              <button
                class="media-card-action content-add-button"
                type="button"
                data-action="add-to-list"
                aria-label="Agregar ${title} a una lista"
                title="Agregar a lista"
              >
                <i class="bi bi-plus-lg" aria-hidden="true"></i>
              </button>
            </div>

            <div class="media-card-body">
              <h3 class="media-card-title" title="${title}">
                <a
                  class="media-card-link"
                  href="#media/${mediaType}/${content.id}"
                  data-app-route="media"
                  data-media-type="${mediaType}"
                  data-media-id="${content.id}"
                >${title}</a>
              </h3>

              <div class="media-card-meta">
                <span class="media-card-details">
                  <span>${type}</span>
                  <span aria-hidden="true">·</span>
                  <span>${year}</span>
                </span>

                <span class="media-card-rating" aria-label="Calificación ${rating} de 10">
                  <i class="bi bi-star-fill" aria-hidden="true"></i>
                  ${rating}
                </span>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  // --- helpers privados ---

  getPoster(content) {
    return content.fullPoster || content.fullBackdrop;
  }

  getCarouselId() {
    // 1. normalizar el titulo para utilizarlo como id html
    return this.title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  getRating(value) {
    return Number(value ?? 0).toFixed(1);
  }

  getYear(date) {
    return date ? date.slice(0, 4) : "S/F";
  }
}
