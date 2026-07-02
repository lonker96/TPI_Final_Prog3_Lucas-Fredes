import type { Product } from "../../../types/Product";
import { StorageHelper } from "../../../utils/storage";
import { navigate } from "../../../utils/navigate";

const contenedorCarrito = document.getElementById("items-carrito") as HTMLElement;
const contenedorResumen = document.getElementById("resumen-container") as HTMLElement;
const COSTO_ENVIO = 500;

// =========================================================================
// CORRECCIÓN 1: ESTADO GLOBAL PARA GESTIONAR EL STOCK DINÁMICO DEL LOCAL
// =========================================================================
let catalogoProductos: Product[] = [];

// Función asíncrona que simula la API y respeta el stock modificado
const inicializarCatalogoYCarrito = async () => {
    const productosGuardados = localStorage.getItem("foodstore_products");
    
    if (productosGuardados) {
        catalogoProductos = JSON.parse(productosGuardados);
    } else {
        try {
            const respuesta = await fetch("/src/data/productos.json");
            if (!respuesta.ok) throw new Error("No se pudo obtener el catálogo");
            catalogoProductos = await respuesta.json();
            localStorage.setItem("foodstore_products", JSON.stringify(catalogoProductos));
        } catch (error) {
            console.error("Error cargando productos en el carrito:", error);
        }
    }

    // =========================================================================
    // CORRECCIÓN 2: SINCRONIZAR EL CARRITO CON CAMBIOS DEL CATÁLOGO FRESH
    // =========================================================================
    sincronizarPreciosYStock();

    renderizarCarrito();
    actualizarBadgeCarrito();
};

const sincronizarPreciosYStock = () => {
    let carrito = StorageHelper.getCart();
    let huboCambios = false;

    carrito = carrito.map(item => {
        const prodFresco = catalogoProductos.find(p => p.id === item.product.id);
        if (prodFresco) {
            // Si el admin cambió el precio, se actualiza en el carrito
            if (item.product.precio !== prodFresco.precio) {
                item.product.precio = prodFresco.precio;
                huboCambios = true;
            }
            // Si el cliente tiene más unidades de las disponibles en stock, se ajusta al tope
            if (item.quantity > prodFresco.stock) {
                item.quantity = prodFresco.stock;
                huboCambios = true;
            }
        }
        return item;
    }).filter(item => {
        const prodFresco = catalogoProductos.find(p => p.id === item.product.id);
        // Filtra productos eliminados por el admin o sin stock absoluto
        return prodFresco && prodFresco.stock > 0 && prodFresco.eliminado !== true;
    });

    if (huboCambios) {
        StorageHelper.saveCart(carrito);
    }
};

const actualizarResumen = () => {
    const carrito = StorageHelper.getCart();
    const subtotal = carrito.reduce((acc, item) => acc + (item.product.precio * item.quantity), 0);
    
    const envio = carrito.length === 0 ? 0 : COSTO_ENVIO;
    const totalFinal = subtotal + envio;

    const subtotalElement = document.querySelector('[data-resumen="subtotal"]');
    const totalElement = document.querySelector('[data-resumen="total"]');
    const envioElement = document.getElementById("costo-envio");

    if (envioElement) {
        envioElement.textContent = `$${envio.toLocaleString()}`;
    }

    if (subtotalElement && totalElement) {
        subtotalElement.textContent = `$${subtotal.toLocaleString()}`;
        totalElement.textContent = `$${totalFinal.toLocaleString()}`;
    }
};

// =========================================================================
// TU MAQUETACIÓN ORIGINAL COMPLETAMENTE INTACTA (No cambia clases ni tags)
// =========================================================================
const renderizarCarrito = () => {
    const carrito = StorageHelper.getCart();
    if (!contenedorCarrito) return;
    contenedorCarrito.innerHTML = "";

    if (carrito.length === 0){
        contenedorCarrito.innerHTML = "<p class='carrito-vacio'>Tu carrito esta vacio. Volve al catalogo y compra algo rico</p>";
        actualizarResumen();
        return;
    }

    carrito.forEach(item =>{
        const productoInfo = item.product;
        const cantidad = item.quantity;

        const article = document.createElement("article");        
        article.classList.add("item-carrito");
        
        // Mantiene al 100% las clases y los anidamientos que tenías
        article.innerHTML = `
            <div class="card-carrito">
                <img src="${productoInfo.imagen}" alt="${productoInfo.nombre}">
                <div class="detalles">
                    <h4>${productoInfo.nombre}</h4>
                    <p>Subtotal: <b>$${(productoInfo.precio * cantidad).toLocaleString()}</b></p>
                </div>
                <div class="selector-cantidad">
                    <button class="btn-cantidad" data-id="${productoInfo.id}" data-action="restar">-</button>
                    <span>${cantidad}</span>
                    <button class="btn-cantidad" data-id="${productoInfo.id}" data-action="sumar">+</button>
                </div>
                <button class="btn-eliminar-todo" data-id="${productoInfo.id}" data-action="eliminar">Eliminar</button>
            </div>
        `;
        contenedorCarrito.appendChild(article);
    });

    actualizarResumen();
};


contenedorCarrito?.addEventListener("click", (e) =>{
    const target = e.target as HTMLElement;
    const id = Number(target.getAttribute("data-id"));
    if (!id) return;

    let carrito = StorageHelper.getCart();
    const accion = target.getAttribute("data-action");
    const itemEnCarrito = carrito.find(item => item.product.id === id);

    switch(accion){
        case "sumar":
            if(itemEnCarrito) {
                // =========================================================================
                // CORRECCIÓN 3: VALIDACIÓN CONTRA EL STOCK REAL ACTUALIZADO
                // =========================================================================
                const productoOriginal = catalogoProductos.find(p => p.id === id);
                if(productoOriginal && itemEnCarrito.quantity >= productoOriginal.stock){
                    alert(`Lo sentimos, no hay mas stock disponible de este producto (Maximo: ${productoOriginal.stock} unidades).`);
                    return;
                }
                itemEnCarrito.quantity += 1;
            }
            break;

        case "restar":
            if (itemEnCarrito) {
                if (itemEnCarrito.quantity > 1) {
                    itemEnCarrito.quantity -= 1;
                } else {
                    carrito = carrito.filter(item => item.product.id !== id);
                }
            }
            break;

        case "eliminar":
            carrito = carrito.filter(item => item.product.id !== id);
            break;
    }

    StorageHelper.saveCart(carrito);
    actualizarBadgeCarrito();
    renderizarCarrito();
});

// Control del panel lateral
contenedorResumen?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const accion = target.getAttribute("data-action");
    const carrito = StorageHelper.getCart();

    if (accion === "vaciar") {
        if (confirm("¿Estás seguro de que querés vaciar el carrito?")) {
            StorageHelper.saveCart([]);
            actualizarBadgeCarrito();
            renderizarCarrito();
        }
    }

    if (accion === "finalizar") {
        if (carrito.length === 0) {
            alert("El carrito está vacío.");
            return;
        }

        const user = StorageHelper.getSession();
        if (!user) {
            alert("Para finalizar la compra, debes iniciar sesión.");
            navigate("/src/pages/auth/login/login.html");
            return;
        }

        if (user.role === "ADMIN") {
            alert("Los administradores no pueden procesar compras del catálogo.");
            return;
        }

        const inputDireccion = document.getElementById("checkout-direccion") as HTMLInputElement;
        const inputTelefono = document.getElementById("checkout-telefono") as HTMLInputElement;
        const selectPago = document.getElementById("checkout-pago") as HTMLSelectElement;

        if (!inputDireccion?.value.trim() || !inputTelefono?.value.trim() || !selectPago?.value) {
            alert("Por favor, completa todos los campos requeridos para la entrega.");
            return;
        }

        // Control de stock de último segundo antes de cerrar el pedido
        for (const item of carrito) {
            const prodStock = catalogoProductos.find(p => p.id === item.product.id);
            if (!prodStock || prodStock.stock < item.quantity) {
                alert(`¡Conflicto de stock! El producto ${item.product.nombre} ya no tiene las unidades solicitadas.`);
                return;
            }
        }

        // =========================================================================
        // CORRECCIÓN 4: DESCONTAR EL STOCK ADQUIRIDO DEL CATÁLOGO GENERAL
        // =========================================================================
        carrito.forEach(item => {
            const prodStock = catalogoProductos.find(p => p.id === item.product.id);
            if (prodStock) {
                prodStock.stock -= item.quantity;
            }
        });
        localStorage.setItem("foodstore_products", JSON.stringify(catalogoProductos));

        const subtotal = carrito.reduce((acc, item) => acc + (item.product.precio * item.quantity), 0);
        const totalCompra = subtotal + COSTO_ENVIO;

        const nuevoPedido: any = {
            id: Date.now(),
            userId: user.id,
            userMail: user.mail,
            items: [...carrito],
            subtotal: subtotal,
            envio: COSTO_ENVIO,
            total: totalCompra,
            fecha: new Date().toLocaleDateString("es-AR", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit"
            }),
            estado: "PENDIENTE",
            entrega: {
                direccion: inputDireccion.value.trim(),
                telefono: inputTelefono.value.trim(),
                metodoPago: selectPago.value
            }
        };

        StorageHelper.saveOrder(nuevoPedido);

        alert(`¡Gracias por tu compra, Lucas! Pedido #${nuevoPedido.id.toString().slice(-6)} generado.`);
        
        inputDireccion.value = "";
        inputTelefono.value = "";
        selectPago.value = "";
        
        StorageHelper.saveCart([]);
        actualizarBadgeCarrito();
        renderizarCarrito();

        navigate("/src/pages/client/orders/orders.html");
    }
});

export const actualizarBadgeCarrito = () =>{
    const carrito = StorageHelper.getCart();
    const badge = document.getElementById("carrito-count");
    if (badge){
        const totalItems = carrito.reduce((acc, item) => acc + item.quantity, 0);
        badge.textContent = totalItems.toString();
        badge.classList.toggle("hidden", totalItems === 0);
    }
};

// =========================================================================
// CARGA INICIAL ASÍNCRONA
// =========================================================================
document.addEventListener("DOMContentLoaded", inicializarCatalogoYCarrito);