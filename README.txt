THE FISH ROOM — PAQUETE COMPLETO V1

Subida en bloque:
1) Extrae este ZIP.
2) En GitHub usa Agregar archivo > Subir archivos.
3) Selecciona TODOS los archivos del paquete y conserva sus rutas.
4) Confirma el commit en la rama principal.
5) No borres las imágenes .webp/.png ya existentes en el repositorio.

Archivos incluidos:
- index.html
- categoria.html
- producto.html
- checkout.html
- app.js
- data.js
- style.css
- admin/index.html
- README.txt

Arquitectura:
- data.js es el catálogo común.
- app.js es el carrito/favoritos/servicios común.
- tfr_products guarda cambios de catálogo locales del panel.
- tfr_cart guarda el carrito.
- tfr_orders, tfr_reservations y tfr_bookings guardan pedidos/reservas/servicios locales.

IMPORTANTE:
GitHub Pages es estático. Esta versión no ofrece autenticación ni base de datos de producción. Los datos del panel son locales al navegador y no se sincronizan entre dispositivos. Los pagos online son solamente una interfaz hasta conectar una pasarela real.
