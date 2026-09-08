const state={products:window.SEED_PRODUCTS||[],cart:JSON.parse(localStorage.getItem("tfr_cart")||"[]"),favs:JSON.parse(localStorage.getItem("tfr_favs")||"[]")};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let activeCat="Todos";
const urlCat = new URLSearchParams(location.search).get("c");
if (urlCat && location.pathname.endsWith("categoria.html")) activeCat = urlCat;

function save(){localStorage.setItem("tfr_cart",JSON.stringify(state.cart));localStorage.setItem("tfr_favs",JSON.stringify(state.favs));}
function stockLabel(p){if(p.status==="agotado")return ["Agotado","off"];return ["Consultar disponibilidad","ok"];}
function addCart(id){const p=state.products.find(x=>x.id===id);if(!p||p.stock<1)return;const line=state.cart.find(x=>x.id===id);if(line){if(line.qty<p.stock)line.qty++}else state.cart.push({id,qty:1});save();renderHeader();openCart();}
function toggleFav(id){const i=state.favs.indexOf(id);if(i>=0)state.favs.splice(i,1);else state.favs.push(id);save();renderProducts();}
function renderHeader(){$("#cartCount").textContent=state.cart.reduce((a,x)=>a+x.qty,0);$("#favCount").textContent=state.favs.length}
function renderFilters(){
 const cats=["Todos",...new Set(state.products.map(p=>p.category))];
 $("#filters").innerHTML=cats.map(c=>`<button class="chip ${c===activeCat?'active':''}" onclick="setCat('${c.replaceAll("'","\\'")}')">${c}</button>`).join("");
}
window.setCat=c=>{activeCat=c;renderFilters();renderProducts();scrollTo({top:document.querySelector("#peces").offsetTop-70,behavior:"smooth"})}
function renderProducts(){
 const q=($("#search").value||"").toLowerCase().trim();
 let arr=state.products.filter(p=>(activeCat==="Todos"||p.category===activeCat)&&`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q));
 const sort=$("#sort").value;
 if(sort==="priceAsc")arr.sort((a,b)=>a.price-b.price); else if(sort==="priceDesc")arr.sort((a,b)=>b.price-a.price); else if(sort==="name")arr.sort((a,b)=>a.name.localeCompare(b.name)); else arr.sort((a,b)=>Number(b.featured)-Number(a.featured));
 $("#products").innerHTML=arr.map(p=>{const [sl,cl]=stockLabel(p);return `<article class="product"><div class="photo" style="background-image:url('${p.image}')"></div><div class="pbody"><span class="tag">${p.category.toUpperCase()}</span><h3><a href="producto.html?id=${p.id}">${p.name}</a></h3><p class="desc">${p.description}</p><div class="price-row"><span class="price">${p.price.toFixed(2).replace('.',',')} € / ${p.unit}</span><span class="stock ${cl}">${sl}</span></div><div class="pactions"><button class="buy" onclick="addCart('${p.id}')">🛒 Añadir</button><button class="fav heart ${state.favs.includes(p.id)?'on':''}" onclick="toggleFav('${p.id}')">${state.favs.includes(p.id)?'♥':'♡'}</button></div><a class="wh" href="https://wa.me/34612412469?text=${encodeURIComponent("Hola The Fish Room, me interesa "+p.name+". ¿Sigue disponible?")}" target="_blank">💬 Consultar por WhatsApp</a></div></article>`}).join("")||'<div class="empty">No encontramos productos con esos filtros.</div>';
}
function openCart(){openDrawer("cart")}
function openFavs(){const items=state.favs.map(id=>state.products.find(p=>p.id===id)).filter(Boolean);openDrawer("favs",items)}
function cartItems(){return state.cart.map(x=>({...x,p:state.products.find(p=>p.id===x.id)})).filter(x=>x.p)}
function cartTotal(){return cartItems().reduce((s,x)=>s+x.p.price*x.qty,0)}
function openDrawer(mode,custom){
 const d=$("#drawer"), c=$("#drawerContent"); d.classList.add("show");
 if(mode==="cart"){const items=cartItems();c.innerHTML=`<h2>🛒 Tu carrito</h2>${items.length?items.map(x=>`<div class="drawer-item"><img src="${x.p.image}"><div><b>${x.p.name}</b><div>${x.qty} × ${x.p.price.toFixed(2)} €</div></div><button onclick="removeCart('${x.p.id}')">✕</button></div>`).join("")+`<div class="drawer-total">Total: ${cartTotal().toFixed(2)} €</div><button class="btn" style="margin-top:15px;width:100%" onclick="checkout()">Continuar al pedido</button><p style="color:#9cb4bc;font-size:11px">La pasarela de pago real se conectará cuando publiquemos la tienda.</p>`:'<div class="empty">Tu carrito está vacío.</div>'}`;
 } else {c.innerHTML=`<h2>❤️ Favoritos</h2>${custom?.length?custom.map(p=>`<div class="drawer-item"><img src="${p.image}"><div><b>${p.name}</b><div>${p.price.toFixed(2)} €</div></div><button onclick="toggleFav('${p.id}');openFavs()">✕</button></div>`).join(""):'<div class="empty">Todavía no tienes favoritos.</div>'}`}
}
window.removeCart=id=>{state.cart=state.cart.filter(x=>x.id!==id);save();renderHeader();openCart()}
window.closeDrawer=()=>$("#drawer").classList.remove("show");
function checkout(){if(!state.cart.length)return;const text=cartItems().map(x=>`${x.qty}x ${x.p.name}`).join(", ");location.href=`https://wa.me/34612412469?text=${encodeURIComponent("Hola The Fish Room, quiero pedir: "+text+" . Total orientativo: "+cartTotal().toFixed(2)+" €. Quiero recogerlo en tienda.")}`}
function bookingSubmit(e){e.preventDefault();const b={service:$("#service").value,type:$("#bookingType").value,date:$("#date").value,time:$("#time").value,name:$("#clientName").value,phone:$("#clientPhone").value,address:$("#address").value,problem:$("#problem").value,createdAt:new Date().toISOString()};const list=JSON.parse(localStorage.getItem("tfr_bookings")||"[]");list.push(b);localStorage.setItem("tfr_bookings",JSON.stringify(list));alert("Solicitud guardada. En producción la enviaremos automáticamente por correo y WhatsApp.");e.target.reset()}
function renderReviews(){const r=JSON.parse(localStorage.getItem("tfr_reviews")||"[]");$("#reviews").innerHTML=r.length?r.map(x=>`<article class="review"><div class="stars">★★★★★</div><b>${x.name}</b><p>${x.text}</p></article>`).join(""):'<article class="review"><div class="stars">★★★★★</div><b>Próximamente</b><p>Las primeras reseñas reales de The Fish Room aparecerán aquí.</p></article>'}
document.addEventListener("DOMContentLoaded",()=>{renderHeader();renderFilters();renderProducts();renderReviews();$("#search").oninput=renderProducts;$("#sort").onchange=renderProducts;$("#cartBtn").onclick=openCart;$("#favBtn").onclick=openFavs;$("#bookingForm").onsubmit=bookingSubmit;$$("[data-service]").forEach(a=>a.onclick=()=>{$("#service").value=a.dataset.service});$("#drawer").onclick=e=>{if(e.target.id==="drawer")closeDrawer()};});
