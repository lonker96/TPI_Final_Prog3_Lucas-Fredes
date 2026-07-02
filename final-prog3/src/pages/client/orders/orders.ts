import { StorageHelper } from "../../../utils/storage";
import { navigate } from "../../../utils/navigate";
import type { IOrder } from "../../../types/IOrder";
import { logout } from "../../../utils/auth";

const contenedorPedidos = document.getElementById("lista-pedidos") as HTMLElement;
const modalOverlay = document.getElementById("modal-detalle-pedido") as HTMLDivElement;
const modalIdPedido = document.getElementById("modal-id-pedido") as HTMLElement;
const modalBodyContent = document.getElementById("modal-body-content") as HTMLElement;
const btnCerrarModal = document.getElementById("btn-cerrar-modal") as HTMLButtonElement;
const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;

// 1. GUARD DE SEGURIDAD
const user = StorageHelper.getSession();
if (!user || user.loggedIn !== true) {
    alert("Debes iniciar sesión para ver tus pedidos.");
    navigate("/src/pages/auth/login/login.html");
    throw new Error("No autenticado");
}

// 2. FUNCIÓN PARA MOSTRAR DETALLE EN MODAL
const abrirDetallePedido = (idPedido: number) => {
    const todosLosPedidos = StorageHelper.getOrders();
    const pedido = todosLosPedidos.find((o: IOrder) => o.id === idPedido);

    if (!pedido) return;

    // Seteamos el ID resumido en el título
    modalIdPedido.textContent = `#${pedido.id.toString().slice(-6)}`;

    // Configuramos Icono, Texto y Mensaje dinámico según requerimiento del TPI
    let icono = "⏳";
    let mensajeEstado = "Tu pedido fue recibido y está en espera de confirmación.";
    let claseBadge = "estado-pendiente";

    if (pedido.estado === "ENTREGADO") {
        icono = "✅";
        mensajeEstado = "¡El pedido ya fue entregado! Que lo disfrutes mucho.";
        claseBadge = "estado-entregado";
    } else if (pedido.estado === "CANCELADO") {
        icono = "❌";
        mensajeEstado = "Este pedido fue cancelado. Comunícate con soporte ante cualquier duda.";
        claseBadge = "estado-cancelado";
    }

    // Armamos la lista de productos del desglose
    const listaProductosHtml = pedido.items.map(item => `
        <div class="modal-producto-fila">
            <span>${item.product.nombre} <b>(x${item.quantity})</b></span>
            <span>$${(item.product.precio * item.quantity).toLocaleString()}</span>
        </div>
    `).join("");

    // Datos por defecto de entrega por si viene de una versión vieja del storage
    const entrega = pedido.entrega || {
        direccion: "Retiro por local / No especificado",
        telefono: "No especificado",
        metodoPago: "No especificado"
    };

    // Estructuramos el contenido completo solicitado
    modalBodyContent.innerHTML = `
        <div class="modal-estado-alerta">
            <span class="modal-icono">${icono}</span>
            <div>
                <span class="badge-estado ${claseBadge}">${pedido.estado}</span>
                <p class="modal-mensaje-estado">${mensajeEstado}</p>
            </div>
        </div>

        <div class="modal-seccion">
            <h4>Información de Entrega</h4>
            <p><b>Dirección:</b> ${entrega.direccion}</p>
            <p><b>Teléfono:</b> ${entrega.telefono}</p>
            <p><b>Método de Pago:</b> ${entrega.metodoPago}</p>
            <p><b>Fecha de Compra:</b> ${pedido.fecha}</p>
        </div>

        <div class="modal-seccion">
            <h4>Productos</h4>
            <div class="modal-lista-productos">
                ${listaProductosHtml}
            </div>
        </div>

        <div class="modal-seccion desglose-costos">
            <h4>Desglose de Costos</h4>
            <div class="modal-costo-fila">
                <span>Subtotal:</span>
                <span>$${(pedido.subtotal || (pedido.total - (pedido.envio || 0))).toLocaleString()}</span>
            </div>
            <div class="modal-costo-fila">
                <span>Costo de Envío:</span>
                <span>$${(pedido.envio || 0).toLocaleString()}</span>
            </div>
            <div class="modal-costo-fila total-resaltado">
                <span>Total Final:</span>
                <span>$${pedido.total.toLocaleString()}</span>
            </div>
        </div>
    `;

    // Mostramos el modal quitando la clase hidden
    modalOverlay.classList.remove("hidden");
};

// 3. FUNCIÓN PARA RENDERIZAR HISTORIAL
const renderizarPedidos = () => {
    const todosLosPedidos = StorageHelper.getOrders();
    const misPedidos = todosLosPedidos.filter((o: IOrder) => o.userId === user.id);

    misPedidos.sort((a, b) => b.id - a.id);

    if (misPedidos.length === 0) {
        contenedorPedidos.innerHTML = `
            <div class="sin-pedidos">
                <p>Aún no realizaste ningún pedido. ¡Andá al catálogo y armá tu primera compra!</p>
                <button id="btn-ir-catalogo" class="btn-principal">Ver Catálogo</button>
            </div>
        `;
        document.getElementById("btn-ir-catalogo")?.addEventListener("click", () => {
            navigate("/src/pages/store/home.html");
        });
        return;
    }

    let html = `
        <table class="pedidos-tabla">
            <thead>
                <tr>
                    <th>ID Pedido</th>
                    <th>Fecha</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
    `;

    misPedidos.forEach((pedido: IOrder) => {
        const detalleProductos = pedido.items
            .map(item => `${item.product.nombre} (x${item.quantity})`)
            .join("<br>");

        let claseEstado = "estado-pendiente";
        if (pedido.estado === "ENTREGADO") claseEstado = "estado-entregado";
        if (pedido.estado === "CANCELADO") claseEstado = "estado-cancelado";

        html += `
            <tr class="fila-pedido-clicable" data-id="${pedido.id}">
                <td><b>#${pedido.id.toString().slice(-6)}</b></td> 
                <td>${pedido.fecha}</td>
                <td class="col-productos">${detalleProductos}</td>
                <td><b class="precio">$${pedido.total.toLocaleString()}</b></td>
                <td><span class="badge-estado ${claseEstado}">${pedido.estado}</span></td>
                <td><button class="btn-ver-detalle" data-id="${pedido.id}">Ver Detalle</button></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    contenedorPedidos.innerHTML = html;

    // 🌟 MAJEADORES DE EVENTOS PARA ABRIR EL MODAL
    const filas = document.querySelectorAll(".fila-pedido-clicable");
    filas.forEach(fila => {
        fila.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            // Evitamos doble disparo si se hace click justo en el botón interno
            const idPedido = Number(fila.getAttribute("data-id"));
            if (idPedido) abrirDetallePedido(idPedido);
        });
    });
};

// 4. EVENTOS DE CIERRE DEL MODAL
btnCerrarModal.addEventListener("click", () => {
    modalOverlay.classList.add("hidden");
});

modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.add("hidden");
    }
});
buttonLogout?.addEventListener("click", () => {
    logout();
});

// 5. INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", renderizarPedidos);