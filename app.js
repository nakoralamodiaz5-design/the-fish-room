const TFR={
  sb:window.supabase.createClient(window.TFR_SUPABASE_URL,window.TFR_SUPABASE_PUBLISHABLE_KEY),
  products:[],
  cart:JSON.parse(localStorage.getItem("tfr_cart")||"[]"),
  favs:JSON.parse(localStorage.getItem("tfr_favs")||"[]")
};
const $=s=>document.querySelector(s);
const qs=new URLSearchParams(location.search);
let activeCat=window.TFR_CATEGORY||"Todos";

function saveCart(){localStorage.setItem("tfr_cart",JSON.stringify(TFR.cart))}
function saveFavs(){localStorage.setItem("tfr_favs",JSON.stringify(TFR.favs))}
function stockState(p){const n=Number(p.stock||0);return n<=0?{text:"Agotado",cls:"off"}:n<=2?{text:`Últimas ${n}`,cls:"low"}:{text:"Disponible",cls:"ok"}}

async function loadProducts(){
  const {data,error}=await TFR.sb.from("products").select("id,name,category,price,stock,unit,image,description,featured").eq("active",true).order("featured",{ascending:false});
  if(!error&&Array.isArray(data)){TFR.products=data;localStorage.setItem("tfr_products_cache",JSON.stringify(data));return}
  try{const cached=JSON.parse(localStorage.getItem("tfr_products_cache")||"[]");TFR.products=cached.length?cached:(window.TFR_FALLBACK_PRODUCTS||[])}catch{TFR.products=window.TFR_FALLBACK_PRODUCTS||[]}
}

function updateHeader(){
  const n=TFR.cart.reduce((a,x)=>a+Number(x.qty||0),0);
  if($("#cartCount"))$("#cartCount").textContent=n;
  if($("#favCount"))$("#favCount").textContent=TFR.favs.length
}
function addCart(id){
  const p=TFR.products.find(x=>x.id===id)||(window.TFR_FALLBACK_PRODUCTS||[]).find(x=>x.id===id);
  if(!p||Number(p.stock)<=0)return;
  const line=TFR.cart.find(x=>x.id===id);
  if(line){if(line.qty>=Number(p.stock)){alert("No hay más unidades disponibles.");return}line.qty++}
  else TFR.cart.push({id,qty:1});
  saveCart();updateHeader();openCart();
}
function setQty(id,delta){
  const line=TFR.cart.find(x=>x.id===id),p=TFR.products.find(x=>x.id===id);
  if(!line||!p)return;
  line.qty=Math.max(0,Math.min(Number(p.stock),line.qty+delta));if(!line.qty)TFR.cart=TFR.cart.filter(x=>x.id!==id);
  saveCart();updateHeader();openCart();
}
function removeCart(id){TFR.cart=TFR.cart.filter(x=>x.id!==id);saveCart();updateHeader();openCart()}
function toggleFav(id){const i=TFR.favs.indexOf(id);if(i>=0)TFR.favs.splice(i,1);else TFR.favs.push(id);saveFavs();updateHeader();renderProducts()}

function cartItems(){return TFR.cart.map(x=>({...x,p:TFR.products.find(p=>p.id===x.id)})).filter(x=>x.p)}
function cartTotal(){return cartItems().reduce((a,x)=>a+Number(x.p.price)*Number(x.qty),0)}

function openCart(){
  const d=$("#drawer"),c=$("#drawerContent");if(!d||!c)return;d.classList.add("show");d.setAttribute("aria-hidden","false");
  const items=cartItems();
  if(!items.length){c.innerHTML=`<h2>🛒 Tu carrito</h2><div class="empty">Tu carrito está vacío.</div>`;return}
  c.innerHTML=`<h2>🛒 Tu carrito</h2>${items.map(x=>`<div class="drawer-item"><img src="${x.p.image}" alt="${x.p.name}"><div><b>${x.p.name}</b><div>${Number(x.p.price).toFixed(2)} € / ${x.p.unit||"unidad"}</div><div class="qty-row"><button class="qty" onclick="setQty('${x.p.id}',-1)">−</button><strong>${x.qty}</strong><button class="qty" onclick="setQty('${x.p.id}',1)">+</button></div></div><button class="remove-line" onclick="removeCart('${x.p.id}')">✕</button></div>`).join("")}<div class="drawer-summary"><div><span>Productos</span><b>${items.reduce((a,x)=>a+x.qty,0)}</b></div><div><span>Recogida en tienda</span><b>Gratis</b></div><div class="drawer-total"><span>Total</span><b>${cartTotal().toFixed(2).replace(".",",")} €</b></div></div><button class="btn" style="width:100%;margin-top:16px" onclick="location.href='checkout.html'">Continuar al pedido</button><p class="mini-note">🏪 Recogida en The Fish Room · Santa María de Guía</p>`
}
function openFavs(){
  const d=$("#drawer"),c=$("#drawerContent");if(!d||!c)return;d.classList.add("show");d.setAttribute("aria-hidden","false");
  const items=TFR.favs.map(id=>TFR.products.find(p=>p.id===id)).filter(Boolean);
  c.innerHTML=`<h2>❤️ Favoritos</h2>${items.length?items.map(p=>`<div class="drawer-item"><img src="${p.image}" alt="${p.name}"><div><b>${p.name}</b><div>${Number(p.price).toFixed(2)} €</div></div><button class="remove-line" onclick="toggleFav('${p.id}');openFavs()">✕</button></div>`).join(""):'<div class="empty">Todavía no tienes favoritos.</div>'}`
}
function closeDrawer(){const d=$("#drawer");if(d){d.classList.remove("show");d.setAttribute("aria-hidden","true")}}
function checkout(){if(TFR.cart.length)location.href="checkout.html"}

function renderFilters(){
  const filters=$("#filters");if(!filters)return;
  const categories=["Todos",...new Set(TFR.products.map(p=>p.category))];
  filters.innerHTML=categories.map(cat=>`<button class="chip ${cat===activeCat?"active":""}" onclick="setCategory('${String(cat).replaceAll("'","\\'")}')">${cat}</button>`).join("")
}
function setCategory(cat){
  activeCat=cat;renderFilters();renderProducts();
  const shop=$("#peces");if(shop)window.scrollTo({top:shop.offsetTop-70,behavior:"smooth"})
}

function renderProducts(){
  const node=$("#products");if(!node)return;
  const q=($("#search")?.value||"").toLowerCase().trim();
  let list=TFR.products.filter(p=>(activeCat==="Todos"||p.category===activeCat)&&`${p.name} ${p.category} ${p.description||""}`.toLowerCase().includes(q));
  const sort=$("#sort")?.value||"featured";
  if(sort==="priceAsc")list.sort((a,b)=>Number(a.price)-Number(b.price));
  else if(sort==="priceDesc")list.sort((a,b)=>Number(b.price)-Number(a.price));
  else if(sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name,"es"));
  else list.sort((a,b)=>Number(b.featured)-Number(a.featured));
  node.innerHTML=list.length?list.map(p=>{
    const s=stockState(p),fav=TFR.favs.includes(p.id);
    return `<article class="product"><a class="photo" href="producto.html?id=${encodeURIComponent(p.id)}" style="background-image:url('${p.image.replaceAll("'","%27")}')"></a><div class="pbody"><span class="tag">${String(p.category).toUpperCase()}</span><h3><a href="producto.html?id=${encodeURIComponent(p.id)}">${p.name}</a></h3><p class="desc">${p.description||""}</p><div class="price-row"><span class="price">${Number(p.price).toFixed(2).replace(".",",")} € / ${p.unit||"unidad"}</span><span class="stock ${s.cls}">${s.text}</span></div><div class="pactions"><button class="buy" ${s.cls==="off"?"disabled":""} onclick="addCart('${p.id}')">🛒 Añadir</button><button class="fav ${fav?"on":""}" onclick="toggleFav('${p.id}')">${fav?"♥":"♡"}</button></div><a class="wh" target="_blank" rel="noopener" href="https://wa.me/34612412469?text=${encodeURIComponent(`Hola The Fish Room, me interesa ${p.name}. ¿Sigue disponible?`)}">💬 Consultar por WhatsApp</a></div></article>`
  }).join(""):`<div class="empty">No encontramos productos con esos filtros.</div>`
}

async function bookingSubmit(e){
  e.preventDefault();
  const payload={service:$("#service")?.value||"",request_type:$("#bookingType")?.value||"",requested_date:$("#date")?.value||"",requested_time:$("#time")?.value||"",customer_name:$("#clientName")?.value.trim()||"",customer_phone:$("#clientPhone")?.value.trim()||"",address:$("#address")?.value.trim()||"",description:$("#problem")?.value.trim()||""};
  const known={service:payload.service,requested_date:payload.requested_date,requested_time:payload.requested_time,customer_name:payload.customer_name};
  const full={...known,request_type:payload.request_type,customer_phone:payload.customer_phone,address:payload.address,description:payload.description};
  let result=await TFR.sb.from("service_requests").insert(full);
  if(result.error) result=await TFR.sb.from("service_requests").insert(known);
  const msg=$("#bookingMsg");
  if(result.error){if(msg)msg.textContent="No se pudo guardar en el panel. Se abrirá WhatsApp para que no pierdas la solicitud."}
  else if(msg)msg.textContent="Solicitud guardada. También puedes enviarla por WhatsApp.";
  const lines=[`Solicitud de servicio`,`Servicio: ${payload.service}`,`Tipo: ${payload.request_type}`,`Fecha: ${payload.requested_date} ${payload.requested_time}`,`Cliente: ${payload.customer_name}`,`Teléfono: ${payload.customer_phone}`,payload.address?`Dirección: ${payload.address}`:"",payload.description?`Descripción: ${payload.description}`:""].filter(Boolean);
  window.open("https://wa.me/34612412469?text="+encodeURIComponent(lines.join("\n")),"_blank","noopener");
  e.target.reset()
}
function renderReviews(){const node=$("#reviews");if(!node)return;node.innerHTML=`<article class="review"><div class="stars">★★★★★</div><b>Próximamente</b><p>Las primeras reseñas reales de The Fish Room aparecerán aquí.</p></article>`}

Object.assign(window,{addCart,setQty,removeCart,toggleFav,openCart,openFavs,closeDrawer,checkout,setCategory,stockState,loadProducts,TFR});

document.addEventListener("DOMContentLoaded",async()=>{
  await loadProducts();updateHeader();renderFilters();renderProducts();renderReviews();
  $("#search")?.addEventListener("input",renderProducts);
  $("#sort")?.addEventListener("change",renderProducts);
  $("#cartBtn")?.addEventListener("click",openCart);
  $("#favBtn")?.addEventListener("click",openFavs);
  $("#bookingForm")?.addEventListener("submit",bookingSubmit);
  $("[data-service]") && document.querySelectorAll("[data-service]").forEach(el=>el.addEventListener("click",()=>{if($("#service"))$("#service").value=el.dataset.service}));
  $("#drawer")?.addEventListener("click",e=>{if(e.target.id==="drawer")closeDrawer()});
  $("#promoBtn")?.addEventListener("click",()=>alert("Las promociones se publicarán próximamente desde el panel de administración."));
});
