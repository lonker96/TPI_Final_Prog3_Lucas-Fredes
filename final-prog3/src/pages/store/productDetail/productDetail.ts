import type { Product } from "../../../types/Product";
import { StorageHelper } from "../../../utils/storage";
import { navigate } from "../../../utils/navigate";

// 1. CAPTURA DE ELEMENTOS DEL DOM
const contenedorDetalle = document.getElementById("detalle-producto") as HTMLElement;
const btnVolver = document.getElementById("btn-volver") as HTMLButtonElement;

// 2. ESTADO INTERNO DEL DETALLE
let catalogoProductos: Product[] = [];
let productoActual: Product | undefined;
let cantidadSeleccionada = 1;

// 3. CAPTURAR EL ID DESDE LA URL (?id=X)
const obtenerIdUrl = (): number => {
    const parametros = new URLSearchParams(window.location.search);
    return Number(parametros.get("id"));
};

// 4. INICIALIZACIÓN DE DATOS COMPARTIDOS (Asincrónico REGLAMENTARIO)
const inicializarDetalle = async () => {
    const productosGuardados = localStorage.getItem("foodstore_products");
    
    if (productosGuardados) {
        catalogoProductos = JSON.parse(productosGuardados);
    } else {
        try {
            const respuesta = await fetch("/data/productos.json");
            if (!respuesta.ok) throw new Error("No se pudo obtener el catálogo");
            catalogoProductos = await respuesta.json();
            localStorage.setItem("foodstore_products", JSON.stringify(catalogoProductos));
        } catch (error) {
            console.error("Error cargando productos en detalle:", error);
        }
    }

    const idUrl = obtenerIdUrl();
    productoActual = catalogoProductos.find(p => p.id === idUrl);

    if (productoActual) {
        renderizarDetalle(productoActual);
        configurarEventosDetalle(productoActual);
    } else {
        if (contenedorDetalle) {
            contenedorDetalle.innerHTML = `<p class="error-texto">El producto seleccionado no existe o no se encuentra disponible.</p>`;
        }
    }
    actualizarBadgeCarrito();
};

// 5. CAPA DE RENDERIZADO VISUAL - ADAPTADA EXACTAMENTE A TU DETALLE.CSS
const renderizarDetalle = (producto: Product) => {
    if (!contenedorDetalle) return;

    const carritoActual = StorageHelper.getCart();
    const itemEnCarrito = carritoActual.find(item => item.product.id === producto.id);
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.quantity : 0;
    const stockDisponibleReal = producto.stock - cantidadEnCarrito;
    const tieneStock = stockDisponibleReal > 0;

    contenedorDetalle.innerHTML = `
        <div class="detalle-imagen">
            <img src="${producto.imagen}" alt="${producto.nombre}">
        </div>
        <div class="detalle-info">
            <span class="categoria-badge">${producto.categoria.nombre}</span>
            <h2>${producto.nombre}</h2>
            <p class="precio-grande">$${producto.precio.toLocaleString()}</p>
            <p class="descripcion-larga">${producto.descripcion || 'Sin descripción disponible por el momento.'}</p>
            
            <div class="compra-acciones">
                ${tieneStock ? `
                    <div class="selector-cantidad">
                        <button id="btn-menos" class="btn-qty">-</button>
                        <span id="contador-cantidad">${cantidadSeleccionada}</span>
                        <button id="btn-mas" class="btn-qty">+</button>
                    </div>
                    <button id="btn-agregar-detalle" class="btn-principal">🛒 Agregar al Carrito</button>
                ` : `
                    <p class="sin-stock-mensaje">⚠️ Lo sentimos, este producto se encuentra temporalmente agotado.</p>
                `}
            </div>
            <p class="stock-disponibilidad">Stock total de la tienda: ${producto.stock} unidades. (Ya tienes ${cantidadEnCarrito} en tu carrito)</p>
        </div>
    `;
};

// 6. CONTROLADORES DE EVENTOS CENTRALIZADOS
const configurarEventosDetalle = (producto: Product) => {
    
    contenedorDetalle?.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const carritoActual = StorageHelper.getCart();
        const itemEnCarrito = carritoActual.find(item => item.product.id === producto.id);
        const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.quantity : 0;
        const stockDisponibleReal = producto.stock - cantidadEnCarrito;

        // Botón Restar Cantidad
        if (target.id === "btn-menos" && cantidadSeleccionada > 1) {
            cantidadSeleccionada--;
            actualizarContadorUI();
        }

        // Botón Sumar Cantidad
        if (target.id === "btn-mas" && cantidadSeleccionada < stockDisponibleReal) {
            cantidadSeleccionada++;
            actualizarContadorUI();
        }

        // Botón Confirmar Compra (.btn-principal)
        if (target.id === "btn-agregar-detalle") {
            if (itemEnCarrito) {
                itemEnCarrito.quantity += cantidadSeleccionada;
            } else {
                carritoActual.push({ product: producto, quantity: cantidadSeleccionada });
            }

            StorageHelper.saveCart(carritoActual);
            alert(`¡Agregaste ${cantidadSeleccionada} unidad(es) de ${producto.nombre} al carrito!`);
            
            // Reseteamos estado y refrescamos la UI
            cantidadSeleccionada = 1;
            renderizarDetalle(producto);
            actualizarBadgeCarrito();
        }
    });
};

// 🔥 Setea el valor usando tu ID nativo '#contador-cantidad'
const actualizarContadorUI = () => {
    const txtCantidad = document.getElementById("contador-cantidad");
    if (txtCantidad) txtCantidad.textContent = cantidadSeleccionada.toString();
};

const actualizarBadgeCarrito = () => {
    const carrito = StorageHelper.getCart();
    const badge = document.getElementById("carrito-count");
    if (badge) {
        const totalItems = carrito.reduce((acc, item) => acc + item.quantity, 0);
        badge.textContent = totalItems.toString();
        badge.classList.toggle("hidden", totalItems === 0);
    }
};

// Evento Volver
btnVolver?.addEventListener("click", () => {
    navigate("/src/pages/store/home.html");
});

// Lanzar proceso
inicializarDetalle();