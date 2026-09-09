const TFR = {
  sb: window.supabase.createClient(window.TFR_SUPABASE_URL, window.TFR_SUPABASE_PUBLISHABLE_KEY),
  products: [],
  cart: JSON.parse(localStorage.getItem("tfr_cart") || "[]"),
  favs: JSON.parse(localStorage.getItem("tfr_favs") || "[]")
};

const $ = (s) => document.querySelector(s);
const qs = new URLSearchParams(location.search);

function saveCart(){ localStorage.setItem("tfr_cart", JSON.stringify(TFR.cart)); }
function saveFavs(){ localStorage.setItem("tfr_favs", JSON.stringify(TFR.favs)); }

function stockState(p){
  const n = Number(p.stock || 0);
  return n <= 0 ? {text:"Agotado", cls:"off"} : n <= 2 ? {text:`Últimas ${n}`, cls:"low"} : {text:"Disponible", cls:"ok"};
}

async function loadProducts(){
  const {data, error} = await TFR.sb.from("products")
    .select("id,name,category,price,stock,unit,image,description,featured")
    .eq("active", true)
    .order("featured", {ascending:false});

  if (!error && Array.isArray(data)) {
    TFR.products = data;
    localStorage.setItem("tfr_products_cache", JSON.stringify(data));
    return;
  }

  try {
    const cached = JSON.parse(localStorage.getItem("tfr_products_cache") || "[]");
    TFR.products = cached.length ? cached : (window.TFR_FALLBACK_PRODUCTS || []);
  } catch {
    TFR.products = window.TFR_FALLBACK_PRODUCTS || [];
  }
}

function updateHeader(){
  const n = TFR.cart.reduce((a,x)=>a + Number(x.qty || 0), 0);
  if($("#cartCount")) $("#cartCount").textContent = n;
  if($("#favCount")) $("#favCount").textContent = TFR.favs.length;
}

function addCart(id){
  const p = TFR.products.find(x=>x.id===id);
  if(!p || Number(p.stock)<=0) return;
  const line = TFR.cart.find(x=>x.id===id);
  if(line){
    if(line.qty >= Number(p.stock)) return alert("No hay más unidades disponibles.");
    line.qty++;
  } else {
    TFR.cart.push({id,qty:1});
  }
  saveCart(); updateHeader(); openCart();
}

function setQty(id, delta){
  const line = TFR.cart.find(x=>x.id===id);
  const p = TFR.products.find(x=>x.id===id);
  if(!line || !p) return;
  line.qty = Math.max(0, Math.min(Number(p.stock), line.qty + delta));
  if(!line.qty) TFR.cart = TFR.cart.filter(x=>x.id!==id);
  saveCart(); updateHeader(); openCart();
}

function removeCart(id){
  TFR.cart = TFR.cart.filter(x=>x.id!==id);
  saveCart(); updateHeader(); openCart();
}

function toggleFav(id){
  const i = TFR.favs.indexOf(id);
  if(i>=0) TFR.favs.splice(i,1); else TFR.favs.push(id);
  saveFavs(); updateHeader();
  if($("#products")) renderProducts();
}

function cartItems(){
  return TFR.cart.map(x=>({...x,p:TFR.products.find(p=>p.id===x.id)})).filter(x=>x.p);
}
function cartTotal(){ return cartItems().reduce((a,x)=>a+Number(x.p.price)*Number(x.qty),0); }

function openCart(){
  const d=$("#drawer"), c=$("#drawerContent");
  if(!d || !c) return;
  d.classList.add("show");
  const items=cartItems();
  if(!items.length){
    c.innerHTML=`<h2>🛒 Tu carrito</h2><div class="empty">Tu carrito está vacío.</div>`;
    return;
  }
  c.innerHTML=`<h2>🛒 Tu carrito</h2>
  ${items.map(x=>`<div class="drawer-item">
    <img src="${x.p.image}" alt="${x.p.name}">
    <div><b>${x.p.name}</b><div>${Number(x.p.price).toFixed(2)} € / ${x.p.unit||"unidad"}</div>
    <div class="qty-row"><button class="qty" onclick="setQty('${x.p.id}',-1)">−</button><strong>${x.qty}</strong><button class="qty" onclick="setQty('${x.p.id}',1)">+</button></div></div>
    <button class="remove-line" onclick="removeCart('${x.p.id}')">✕</button>
  </div>`).join("")}
  <div class="drawer-summary">
    <div><span>Productos</span><b>${items.reduce((a,x)=>a+x.qty,0)}</b></div>
    <div><span>Recogida en tienda</span><b>Gratis</b></div>
    <div class="drawer-total"><span>Total</span><b>${cartTotal().toFixed(2).replace(".",",")} €</b></div>
  </div>
  <button class="btn" style="width:100%;margin-top:16px" onclick="location.href='checkout.html'">Continuar al pedido</button>`;
}

function closeDrawer(){ if($("#drawer")) $("#drawer").classList.remove("show"); }

function renderProducts(){
  const node=$("#products");
  if(!node) return;
  const cat=window.TFR_CATEGORY || "Todos";
  const q=($("#search")?.value || "").toLowerCase().trim();
  let list=TFR.products.filter(p=>
    (cat==="Todos" || p.category===cat) &&
    `${p.name} ${p.category} ${p.description||""}`.toLowerCase().includes(q)
  );
  list.sort((a,b)=>Number(b.featured)-Number(a.featured));

  node.innerHTML=list.length ? list.map(p=>{
    const s=stockState(p);
    const fav=TFR.favs.includes(p.id);
    return `<article class="product">
      <a class="photo" href="producto.html?id=${encodeURIComponent(p.id)}" style="background-image:url('${p.image}')"></a>
      <div class="pbody">
        <span class="tag">${String(p.category).toUpperCase()}</span>
        <h3><a href="producto.html?id=${encodeURIComponent(p.id)}">${p.name}</a></h3>
        <p class="desc">${p.description||""}</p>
        <div class="price-row"><span class="price">${Number(p.price).toFixed(2).replace(".",",")} € / ${p.unit||"unidad"}</span><span class="stock ${s.cls}">${s.text}</span></div>
        <div class="pactions">
          <button class="buy" ${s.cls==="off"?"disabled":""} onclick="addCart('${p.id}')">🛒 Añadir</button>
          <button class="fav" onclick="toggleFav('${p.id}')">${fav?"♥":"♡"}</button>
        </div>
        <a class="wh" target="_blank" rel="noopener" href="https://wa.me/34612412469?text=${encodeURIComponent(`Hola The Fish Room, me interesa ${p.name}. ¿Sigue disponible?`)}">💬 Consultar por WhatsApp</a>
      </div></article>`;
  }).join("") : `<div class="empty">No hay productos en esta categoría.</div>`;
}

document.addEventListener("DOMContentLoaded", async ()=>{
  await loadProducts(); updateHeader(); renderProducts();
  $("#cartBtn")?.addEventListener("click", openCart);
  $("#search")?.addEventListener("input", renderProducts);
  $("#drawer")?.addEventListener("click",e=>{if(e.target.id==="drawer") closeDrawer();});
});

window.addCart=addCart; window.setQty=setQty; window.removeCart=removeCart;
window.toggleFav=toggleFav; window.openCart=openCart; window.closeDrawer=closeDrawer;
