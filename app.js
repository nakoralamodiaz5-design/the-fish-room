const state = {
  products: window.TFR_PRODUCTS || [],
  cart: JSON.parse(localStorage.getItem("tfr_cart") || "[]"),
  favs: JSON.parse(localStorage.getItem("tfr_favs") || "[]")
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let activeCat = window.TFR_CATEGORY || "Todos";

function persistProducts(products) {
  localStorage.setItem("tfr_products", JSON.stringify(products));
  state.products = products;
}

function saveState() {
  localStorage.setItem("tfr_cart", JSON.stringify(state.cart));
  localStorage.setItem("tfr_favs", JSON.stringify(state.favs));
}

function stockInfo(product) {
  const stock = Number(product.stock);
  if (product.status === "agotado" || (!Number.isNaN(stock) && stock <= 0)) return ["Agotado", "off"];
  if (Number.isFinite(stock) && stock > 0 && stock <= 2) return [`Últimas ${stock}`, "low"];
  return ["Consultar disponibilidad", "ok"];
}

function addCart(id) {
  const product = state.products.find((p) => p.id === id);
  if (!product || stockInfo(product)[1] === "off") return;
  const line = state.cart.find((item) => item.id === id);
  if (line) line.qty += 1;
  else state.cart.push({ id, qty: 1 });
  saveState();
  renderHeader();
  openCart();
}

function changeQty(id, delta) {
  const line = state.cart.find((item) => item.id === id);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) state.cart = state.cart.filter((item) => item.id !== id);
  saveState();
  renderHeader();
  openCart();
}

function removeCart(id) {
  state.cart = state.cart.filter((item) => item.id !== id);
  saveState();
  renderHeader();
  openCart();
}

function toggleFav(id) {
  const index = state.favs.indexOf(id);
  if (index >= 0) state.favs.splice(index, 1);
  else state.favs.push(id);
  saveState();
  renderHeader();
  if ($("#products")) renderProducts();
}

function renderHeader() {
  const cartCount = $("#cartCount");
  const favCount = $("#favCount");
  if (cartCount) cartCount.textContent = state.cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  if (favCount) favCount.textContent = state.favs.length;
}

function cartItems() {
  return state.cart
    .map((item) => ({ ...item, product: state.products.find((p) => p.id === item.id) }))
    .filter((item) => item.product);
}

function cartTotal() {
  return cartItems().reduce((sum, item) => sum + Number(item.product.price) * Number(item.qty), 0);
}

function openCart() {
  const drawer = $("#drawer");
  const content = $("#drawerContent");
  if (!drawer || !content) return;
  drawer.classList.add("show");
  const items = cartItems();

  if (!items.length) {
    content.innerHTML = '<h2>🛒 Tu carrito</h2><div class="empty">Tu carrito está vacío.</div>';
    return;
  }

  const count = items.reduce((sum, item) => sum + Number(item.qty), 0);
  content.innerHTML = `
    <h2>🛒 Tu carrito</h2>
    ${items.map(({product, qty}) => `
      <div class="drawer-item">
        <img src="${product.image}" alt="${product.name}">
        <div>
          <b>${product.name}</b>
          <div>${Number(product.price).toFixed(2)} € / ${product.unit || "unidad"}</div>
          <div class="qty-row">
            <button class="qty" onclick="changeQty('${product.id}', -1)">−</button>
            <strong>${qty}</strong>
            <button class="qty" onclick="changeQty('${product.id}', 1)">+</button>
          </div>
        </div>
        <button class="remove-line" onclick="removeCart('${product.id}')">✕</button>
      </div>
    `).join("")}
    <div class="drawer-summary">
      <div><span>Productos</span><b>${count}</b></div>
      <div><span>Recogida en tienda</span><b>Gratis</b></div>
      <div class="drawer-total"><span>Total</span><b>${cartTotal().toFixed(2)} €</b></div>
    </div>
    <button class="btn" style="margin-top:15px;width:100%" onclick="checkout()">Continuar al pedido</button>
    <p class="mini-note">🏪 Recogida en The Fish Room · Santa María de Guía</p>
  `;
}

function openFavs() {
  const drawer = $("#drawer");
  const content = $("#drawerContent");
  if (!drawer || !content) return;
  drawer.classList.add("show");
  const items = state.favs.map((id) => state.products.find((p) => p.id === id)).filter(Boolean);
  content.innerHTML = `
    <h2>❤️ Favoritos</h2>
    ${items.length ? items.map((product) => `
      <div class="drawer-item">
        <img src="${product.image}" alt="${product.name}">
        <div><b>${product.name}</b><div>${Number(product.price).toFixed(2)} €</div></div>
        <button class="remove-line" onclick="toggleFav('${product.id}');openFavs()">✕</button>
      </div>
    `).join("") : '<div class="empty">Todavía no tienes favoritos.</div>'}
  `;
}

function closeDrawer() {
  const drawer = $("#drawer");
  if (drawer) drawer.classList.remove("show");
}

function checkout() {
  if (!state.cart.length) return;
  window.location.href = "checkout.html";
}

function renderFilters() {
  const filters = $("#filters");
  if (!filters) return;
  const categories = ["Todos", ...new Set(state.products.map((product) => product.category))];
  filters.innerHTML = categories.map((category) => `
    <button class="chip ${category === activeCat ? "active" : ""}" onclick="setCategory('${category.replaceAll("'", "\\'")}')">${category}</button>
  `).join("");
}

function setCategory(category) {
  activeCat = category;
  renderFilters();
  renderProducts();
  const shop = $("#peces");
  if (shop) window.scrollTo({top: shop.offsetTop - 70, behavior: "smooth"});
}

function renderProducts() {
  const productsNode = $("#products");
  if (!productsNode) return;
  const query = ($("#search")?.value || "").toLowerCase().trim();
  let products = state.products.filter((product) => {
    const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    const categoryMatch = activeCat === "Todos" || product.category === activeCat;
    return categoryMatch && haystack.includes(query);
  });

  const sort = $("#sort")?.value || "featured";
  if (sort === "priceAsc") products.sort((a,b) => a.price-b.price);
  else if (sort === "priceDesc") products.sort((a,b) => b.price-a.price);
  else if (sort === "name") products.sort((a,b) => a.name.localeCompare(b.name));
  else products.sort((a,b) => Number(b.featured)-Number(a.featured));

  productsNode.innerHTML = products.length ? products.map((product) => {
    const [stockText, stockClass] = stockInfo(product);
    const favourite = state.favs.includes(product.id);
    const disabled = stockClass === "off" ? "disabled" : "";
    return `
      <article class="product">
        <a class="photo" href="producto.html?id=${encodeURIComponent(product.id)}" style="background-image:url('${product.image}')"></a>
        <div class="pbody">
          <span class="tag">${product.category.toUpperCase()}</span>
          <h3><a href="producto.html?id=${encodeURIComponent(product.id)}">${product.name}</a></h3>
          <p class="desc">${product.description}</p>
          <div class="price-row">
            <span class="price">${Number(product.price).toFixed(2).replace(".", ",")} € / ${product.unit || "unidad"}</span>
            <span class="stock ${stockClass}">${stockText}</span>
          </div>
          <div class="pactions">
            <button class="buy" ${disabled} onclick="addCart('${product.id}')">🛒 Añadir</button>
            <button class="fav heart ${favourite ? "on" : ""}" onclick="toggleFav('${product.id}')">${favourite ? "♥" : "♡"}</button>
          </div>
          <a class="wh" href="https://wa.me/34612412469?text=${encodeURIComponent(`Hola The Fish Room, me interesa ${product.name}. ¿Sigue disponible?`)}" target="_blank" rel="noopener">💬 Consultar por WhatsApp</a>
        </div>
      </article>`;
  }).join("") : '<div class="empty">No encontramos productos con esos filtros.</div>';
}

function bookingSubmit(event) {
  event.preventDefault();
  const booking = {
    id: "SRV-" + Date.now(),
    service: $("#service")?.value || "",
    type: $("#bookingType")?.value || "",
    date: $("#date")?.value || "",
    time: $("#time")?.value || "",
    name: $("#clientName")?.value.trim() || "",
    phone: $("#clientPhone")?.value.trim() || "",
    address: $("#address")?.value.trim() || "",
    problem: $("#problem")?.value.trim() || "",
    createdAt: new Date().toISOString()
  };
  const bookings = JSON.parse(localStorage.getItem("tfr_bookings") || "[]");
  bookings.push(booking);
  localStorage.setItem("tfr_bookings", JSON.stringify(bookings));

  const message = [
    `Solicitud de servicio ${booking.id}`,
    `Servicio: ${booking.service}`,
    `Tipo: ${booking.type}`,
    `Fecha: ${booking.date} ${booking.time}`,
    `Cliente: ${booking.name}`,
    `Teléfono: ${booking.phone}`,
    booking.address ? `Dirección: ${booking.address}` : "",
    booking.problem ? `Descripción: ${booking.problem}` : ""
  ].filter(Boolean).join("\n");

  alert("Solicitud guardada. Se abrirá WhatsApp para enviarla a The Fish Room.");
  window.open("https://wa.me/34612412469?text=" + encodeURIComponent(message), "_blank", "noopener");
  event.target.reset();
}

function renderReviews() {
  const node = $("#reviews");
  if (!node) return;
  const reviews = JSON.parse(localStorage.getItem("tfr_reviews") || "[]");
  node.innerHTML = reviews.length
    ? reviews.map((r) => `<article class="review"><div class="stars">★★★★★</div><b>${r.name}</b><p>${r.text}</p></article>`).join("")
    : `<article class="review"><div class="stars">★★★★★</div><b>Próximamente</b><p>Las primeras reseñas reales de The Fish Room aparecerán aquí.</p></article>`;
}

window.addCart = addCart;
window.changeQty = changeQty;
window.removeCart = removeCart;
window.toggleFav = toggleFav;
window.openCart = openCart;
window.openFavs = openFavs;
window.closeDrawer = closeDrawer;
window.checkout = checkout;
window.setCategory = setCategory;
window.persistProducts = persistProducts;
window.TFR_STATE = state;

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFilters();
  renderProducts();
  renderReviews();

  $("#search")?.addEventListener("input", renderProducts);
  $("#sort")?.addEventListener("change", renderProducts);
  $("#cartBtn")?.addEventListener("click", openCart);
  $("#favBtn")?.addEventListener("click", openFavs);
  $("#accountBtn")?.addEventListener("click", () => window.location.href = "admin/");
  $("#bookingForm")?.addEventListener("submit", bookingSubmit);

  $$("[data-service]").forEach((element) => {
    element.addEventListener("click", () => {
      if ($("#service")) $("#service").value = element.dataset.service;
    });
  });

  $("#drawer")?.addEventListener("click", (event) => {
    if (event.target.id === "drawer") closeDrawer();
  });

  $("#promoBtn")?.addEventListener("click", () => {
    alert("Las promociones se publicarán próximamente desde el panel de administración.");
  });
});
