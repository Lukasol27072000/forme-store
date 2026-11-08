const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".product-card");
filters.forEach(button => button.addEventListener("click", () => {
  filters.forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  const filter = button.dataset.filter;
  cards.forEach(card => card.hidden = filter !== "all" && card.dataset.category !== filter);
}));
document.querySelectorAll("[data-filter-link]").forEach(link => link.addEventListener("click", () => {
  const key = link.dataset.filterLink;
  const target = [...filters].find(item => item.dataset.filter === key);
  if (target) target.click();
}));
const modal = document.getElementById("productModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
function openProduct(button) {
  const card = button.closest(".product-card");
  const image = card.querySelector("img");
  modalImage.src = image.src;
  modalImage.alt = image.alt;
  modalTitle.textContent = card.querySelector("h3").textContent;
  modalCategory.textContent = card.querySelector(".product-category").textContent;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
document.querySelectorAll("[data-open]").forEach(button => button.addEventListener("click", () => openProduct(button)));
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", closeModal));
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

const GOOGLE_SCRIPT_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
document.getElementById("copyEnquiry").addEventListener("click", async () => {
  const model = document.getElementById("phoneModel").value;
  const name = document.getElementById("customerName").value.trim();
  const contact = document.getElementById("customerContact").value.trim();
  const comment = document.getElementById("customerComment").value.trim();
  const note = document.getElementById("formNote");
  if (!model || !name || !contact) {
    note.textContent = "Укажи имя, модель iPhone и контакт — это нужно для заявки.";
    return;
  }
  if (GOOGLE_SCRIPT_URL.startsWith("PASTE_")) {
    note.textContent = "Форма подготовлена. Для приёма заявок осталось подключить адрес Google Apps Script.";
    return;
  }
  const payload = {
    orderId: "FM-" + Date.now().toString().slice(-8),
    product: modalTitle.textContent,
    collection: modalCategory.textContent,
    phoneModel: model,
    customerName: name,
    contact,
    comment,
    source: "FORME website"
  };
  const button = document.getElementById("copyEnquiry");
  button.disabled = true;
  button.textContent = "ОТПРАВЛЯЕМ…";
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify(payload)
    });
    note.textContent = "Заявка отправлена. Мы свяжемся с тобой после проверки наличия и совместимости.";
    button.textContent = "ЗАЯВКА ОТПРАВЛЕНА ✓";
  } catch (error) {
    note.textContent = "Не удалось отправить заявку. Попробуй ещё раз или свяжись с нами напрямую.";
    button.disabled = false;
    button.textContent = "ОТПРАВИТЬ ЗАЯВКУ ↗";
  }
});
document.getElementById("menuToggle").addEventListener("click", () => document.getElementById("nav").classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(link => link.addEventListener("click", () => document.getElementById("nav").classList.remove("open")));
