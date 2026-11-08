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
  filters.forEach(item => {
    item.classList.toggle("active", item.dataset.filter === key);
    if (item.dataset.filter === key) item.click();
  });
}));
const modal = document.getElementById("productModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
function openProduct(button) {
  const card = button.closest(".product-card");
  const image = card.querySelector("img");
  const title = card.querySelector("h3").textContent;
  const category = card.querySelector(".product-category").textContent;
  modalImage.src = image.src;
  modalImage.alt = image.alt;
  modalTitle.textContent = title;
  modalCategory.textContent = category;
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
document.getElementById("copyEnquiry").addEventListener("click", async () => {
  const model = document.getElementById("phoneModel").value;
  const contact = document.getElementById("customerContact").value.trim();
  const note = document.getElementById("formNote");
  if (!model || !contact) {
    note.textContent = "Выбери модель iPhone и укажи контакт — тогда сформируем заявку.";
    return;
  }
  const message = "Здравствуйте! Хочу уточнить возможность заказа в FORMÉ.\nМодель чехла: " + modalTitle.textContent + "\nМодель iPhone: " + model + "\nМой контакт: " + contact + "\nПрошу подтвердить совместимость, наличие и сроки.";
  try {
    await navigator.clipboard.writeText(message);
    note.textContent = "Текст заявки скопирован. Отправь его в удобный мессенджер FORMÉ после добавления контактов бренда.";
  } catch (error) {
    note.textContent = message;
  }
});
document.getElementById("menuToggle").addEventListener("click", () => document.getElementById("nav").classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(link => link.addEventListener("click", () => document.getElementById("nav").classList.remove("open")));