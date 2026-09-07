// ---------- trailer ----------
export function initTrailer(trailer) {
  const frame = document.querySelector("#media-trailer-frame");
  const empty = document.querySelector("#media-trailer-empty");
  const embedUrl = getEmbedUrl(trailer);

  // 1. mostrar estado vacio cuando no exista un video compatible
  if (!embedUrl) {
    frame.hidden = true;
    frame.removeAttribute("src");
    empty.hidden = false;
    return;
  }

  // 2. configurar el reproductor de youtube
  frame.src = embedUrl;
  frame.title = trailer.name || "Tráiler";
  frame.hidden = false;
  empty.hidden = true;
}

// --- url de youtube ---
function getEmbedUrl(trailer) {
  // 1. aceptar solo videos de youtube con una key valida
  if (!trailer?.key || trailer.site?.toLowerCase() !== "youtube") {
    return "";
  }

  return `https://www.youtube.com/embed/${encodeURIComponent(trailer.key)}`;
}
