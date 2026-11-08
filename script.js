const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".product-card");
filters.forEach(button => button.addEventListener("click", () => {
  filters.forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  const filter = button.dataset.filter;
  cards.forEach(card => card.hidden = filter !== "all" && card.dataset.category !== filter);
}));
document.querySelectorAll("[data-filter-link]").forEach(link => link.addEventListener("click", () => {
  const target = [...filters].find(item => item.dataset.filter === link.dataset.filterLink);
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
  modal.querySelector(".modal-info").scrollTop = 0;
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
const PRICE_RUB = 1290;
document.getElementById("copyEnquiry").addEventListener("click", async () => {
  const model = document.getElementById("phoneModel").value;
  const name = document.getElementById("customerName").value.trim();
  const contact = document.getElementById("customerContact").value.trim();
  const city = document.getElementById("deliveryCity").value.trim();
  const address = document.getElementById("deliveryAddress").value.trim();
  const postcode = document.getElementById("deliveryPostcode").value.trim();
  const comment = document.getElementById("customerComment").value.trim();
  const consent = document.getElementById("personalDataConsent").checked;
  const note = document.getElementById("formNote");
  if (!model || !name || !contact || !city || !address || !consent) {
    note.textContent = "Заполни имя, модель iPhone, телефон и адрес доставки, а также отметь согласие на обработку данных.";
    return;
  }
  if (GOOGLE_SCRIPT_URL.startsWith("PASTE_")) {
    note.textContent = "Форма готова, но приём заказов ещё не подключён. Нужен URL опубликованного Google Apps Script.";
    return;
  }
  const payload = {
    orderId: "FM-" + Date.now().toString().slice(-8),
    product: modalTitle.textContent,
    collection: modalCategory.textContent,
    phoneModel: model,
    customerName: name,
    contact,
    city,
    address,
    postcode,
    comment,
    price: PRICE_RUB,
    source: "FORME website"
  };
  const button = document.getElementById("copyEnquiry");
  button.disabled = true;
  button.textContent = "ОТПРАВЛЯЕМ ЗАКАЗ…";
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type":"text/plain;charset=utf-8"},
      body: JSON.stringify(payload)
    });
    note.textContent = "Заказ отправлен. Чехол — 1 290 ₽. Мы свяжемся для подтверждения доставки.";
    button.textContent = "ЗАКАЗ ОТПРАВЛЕН ✓";
  } catch (error) {
    note.textContent = "Не удалось отправить заказ. Попробуй ещё раз.";
    button.disabled = false;
    button.textContent = "ОФОРМИТЬ ЗАКАЗ · 1 290 ₽ ↗";
  }
});
document.getElementById("menuToggle").addEventListener("click", () => {
  const nav = document.getElementById("nav");
  const open = nav.classList.toggle("open");
  document.getElementById("menuToggle").setAttribute("aria-expanded", String(open));
});
document.querySelectorAll(".nav a").forEach(link => link.addEventListener("click", () => document.getElementById("nav").classList.remove("open")));
