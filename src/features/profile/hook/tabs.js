// ---------- pestanas del perfil ----------
export function initProfileTabs(initialTab = "lists") {
  const tabs = document.querySelector(".profile-tabs");
  let activeTab = initialTab;

  if (!tabs) {
    return;
  }

  // 1. renderizar el estado inicial
  renderTabs();

  // 2. escuchar la navegacion interna del perfil
  tabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-profile-tab]");

    if (!tab) {
      return;
    }

    // 3. cambiar la pestana activa
    activeTab = tab.dataset.profileTab;
    renderTabs();
  });

  // --- renderizado ---

  function renderTabs() {
    document.querySelectorAll("[data-profile-tab]").forEach((tab) => {
      const isActive = tab.dataset.profileTab === activeTab;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    document.querySelectorAll("[data-profile-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.profilePanel !== activeTab;
    });
  }
}
