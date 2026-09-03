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

        <button class="btn btn-sm content-browse-button" type="button">
          Ver todos
          <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
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
        const title = this.escapeHtml(content.title);
        const image = this.getBackdrop(content);
        const year = this.getYear(content.releaseDate);
        const rating = this.getRating(content.rating);

        return `
          <article class="content-card" data-content-id="${content.id}">
            <div class="content-image-wrap">
              <img
                src="${image}"
                class="content-image"
                alt="Imagen de ${title}"
                loading="lazy"
              >
              <div class="content-image-shade"></div>
            </div>

            <div class="content-card-body">
              <h3 class="content-card-title" title="${title}">${title}</h3>

              <div class="content-card-meta">
                <div class="d-flex align-items-center gap-2 min-w-0">
                  <span>${year}</span>
                </div>

                <span class="content-card-rating" aria-label="Calificación ${rating} de 10">
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

  getBackdrop(content) {
    return content.fullBackdrop || content.fullPoster;
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
