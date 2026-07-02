import { checkAuhtUser, logout } from "../../../utils/auth";
import { StorageHelper } from "../../../utils/storage"; 
import type { Product } from "../../../types/Product";
import type { IOrder } from "../../../types/IOrder"; 

// 1. CONTROL DE ACCESO
checkAuhtUser(
  "/src/pages/auth/login/login.html",
  "/src/pages/client/home/home.html",
  "ADMIN"
);

// 2. REFERENCIAS AL DOM
const buttonLogout = document.getElementById("logoutButton") as HTMLButtonElement;
const tablaBody = document.getElementById("tabla-productos-body") as HTMLElement;
const formProducto = document.getElementById("form-nuevo-producto") as HTMLFormElement;
const tablaPedidosBody = document.getElementById("tabla-pedidos-admin-body") as HTMLElement;

// Elementos del Dashboard y Resúmenes rápidos
const txtStatCategorias = document.getElementById("stat-categorias") as HTMLElement;
const txtStatProductos = document.getElementById("stat-productos") as HTMLElement;
const txtStatDisponibles = document.getElementById("stat-disponibles") as HTMLElement;
const txtStatPedidos = document.getElementById("stat-pedidos") as HTMLElement;
const txtStatIngresos = document.getElementById("stat-ingresos") as HTMLElement;
const countPendientes = document.getElementById("resumen-pendientes") as HTMLElement;
const countEntregados = document.getElementById("resumen-entregados") as HTMLElement;
const countCancelados = document.getElementById("resumen-cancelados") as HTMLElement;

// 3. ESTADO DE LA APLICACIÓN
let catalogoAdmin: Product[] = [];

// Helper interno para ahorrar repetir código de guardado
const guardarCatalogoEnStorage = () => {
    localStorage.setItem("foodstore_products", JSON.stringify(catalogoAdmin));
};

// 4. FLUJO DE INICIALIZACIÓN ASÍNCRONA (Obligatorio por Consigna)
const inicializarAplicacion = async () => {
    const productosGuardados = localStorage.getItem("foodstore_products");
    
    if (productosGuardados) {
        catalogoAdmin = JSON.parse(productosGuardados);
    } else {
        try {
            const respuesta = await fetch("/data/productos.json");
            if (!respuesta.ok) throw new Error("Error al obtener el JSON");
            catalogoAdmin = await respuesta.json();
            guardarCatalogoEnStorage();
        } catch (error) {
            console.error("Error en el fetch reglamentario:", error);
            catalogoAdmin = [];
        }
    }

    // Encendemos la interfaz una vez cargados los datos
    configurarEventosDOM();
    ejecutarRenderizadoCompleto();
};

// 5. CAPA DE RENDERIZADO VISUAL
const ejecutarRenderizadoCompleto = () => {
    renderizarTablaProductos();
    renderizarTablaPedidos();
    renderizarSeccionCategorias();
    calcularEstadisticasDashboard();
};

const calcularEstadisticasDashboard = () => {
    const categoriasUnicas = new Set(catalogoAdmin.map(p => p.categoria.nombre));
    const productosConStock = catalogoAdmin.filter(p => p.stock > 0);
    const ordenesGlobales = StorageHelper.getOrders();
    
    const pendientes = ordenesGlobales.filter(o => o.estado.toUpperCase() === "PENDIENTE").length;
    const entregados = ordenesGlobales.filter(o => o.estado.toUpperCase() === "ENTREGADO").length;
    const cancelados = ordenesGlobales.filter(o => o.estado.toUpperCase() === "CANCELADO").length;

    const ingresosTotales = ordenesGlobales
        .filter(o => o.estado.toUpperCase() === "ENTREGADO")
        .reduce((acum, o) => acum + o.total, 0);

    if (txtStatCategorias) txtStatCategorias.textContent = categoriasUnicas.size.toString();
    if (txtStatProductos) txtStatProductos.textContent = catalogoAdmin.length.toString();
    if (txtStatDisponibles) txtStatDisponibles.textContent = productosConStock.length.toString();
    if (txtStatPedidos) txtStatPedidos.textContent = ordenesGlobales.length.toString();
    if (txtStatIngresos) txtStatIngresos.textContent = `$${ingresosTotales.toLocaleString()}`;
    if (countPendientes) countPendientes.textContent = pendientes.toString();
    if (countEntregados) countEntregados.textContent = entregados.toString();
    if (countCancelados) countCancelados.textContent = cancelados.toString();
};

const renderizarTablaProductos = () => {
  if (!tablaBody) return;
  tablaBody.innerHTML = "";
  
  catalogoAdmin.sort((a, b) => a.id - b.id);

  catalogoAdmin.forEach((producto) => {
    const tr = document.createElement("tr");
    if (producto.stock === 0) tr.classList.add("fila-sin-stock");

    tr.innerHTML = `
        <td>#${producto.id}</td>
        <td>
            <div class="prod-celda">
              <b>${producto.nombre}</b>
              <small>${producto.descripcion ? producto.descripcion.substring(0, 40) + '...' : ''}</small>
            </div>
        </td>
        <td>$${producto.precio.toLocaleString()}</td>
        <td>
            <div class="control-stock">
                <button class="btn-stock-mod" data-id="${producto.id}" data-action="restar-stock">-</button>
                <span class="stock-valor">${producto.stock}</span>
                <button class="btn-stock-mod" data-id="${producto.id}" data-action="sumar-stock">+</button>
            </div>
        </td>
        <td>
            <button class="btn-baja-logica" data-id="${producto.id}">
              ${producto.stock > 0 ? "Dar de Baja" : "Inactivo"}
            </button>
        </td>
    `;
    tablaBody.appendChild(tr);
  });
  calcularEstadisticasDashboard();
};

const renderizarTablaPedidos = () => {
    if (!tablaPedidosBody) return;
    
    const ordenes = StorageHelper.getOrders().sort((a, b) => b.id - a.id);
    if (ordenes.length === 0) {
        tablaPedidosBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 1rem; color: #666;">No hay pedidos registrados.</td></tr>`;
        return;
    }

    tablaPedidosBody.innerHTML = "";
    ordenes.forEach((pedido: IOrder) => {
        const tr = document.createElement("tr");
        const estadoFormateado = pedido.estado.toUpperCase();
        
        tr.innerHTML = `
            <td><b>#${pedido.id.toString().slice(-6)}</b></td>
            <td>${pedido.fecha}</td>
            <td><small>${pedido.userMail}</small></td>
            <td><b style="color: #2e7d32;">$${pedido.total.toLocaleString()}</b></td>
            <td><span class="badge-estado estado-${pedido.estado.toLowerCase()}">${pedido.estado}</span></td>
            <td>
                <select class="select-cambio-estado" data-id="${pedido.id}">
                    <option value="PENDIENTE" ${estadoFormateado === "PENDIENTE" ? "selected" : ""}>⏳ Pendiente</option>
                    <option value="ENTREGADO" ${estadoFormateado === "ENTREGADO" ? "selected" : ""}>✅ Entregado</option>
                    <option value="CANCELADO" ${estadoFormateado === "CANCELADO" ? "selected" : ""}>❌ Cancelado</option>
                </select>
            </td>
        `;
        tablaPedidosBody.appendChild(tr);
    });
};

const renderizarSeccionCategorias = () => {
    const tablaCategoriasBody = document.getElementById("tabla-categorias-body") as HTMLElement;
    if (!tablaCategoriasBody) return;

    const categoriasUnicas = new Set(catalogoAdmin.map(p => p.categoria.nombre));
    if (categoriasUnicas.size === 0) {
        tablaCategoriasBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 1rem; color: #666;">No hay categorías.</td></tr>`;
        return;
    }

    tablaCategoriasBody.innerHTML = "";
    let index = 1;
    categoriasUnicas.forEach((nombreCategoria) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>#CAT-${index++}</b></td>
            <td><span class="resumen-badge entregado" style="font-weight: 600;">${nombreCategoria}</span></td>
            <td>Categoría activa del menú de comidas rápidas y bebidas.</td>
        `;
        tablaCategoriasBody.appendChild(tr);
    });
};

// 6. CONTROLADORES DE EVENTOS (Agrupados y limpios)
const configurarEventosDOM = () => {
    
    // Cambios de Estado de Pedidos
    tablaPedidosBody?.addEventListener("change", (e) => {
        const target = e.target as HTMLSelectElement;
        if (target.classList.contains("select-cambio-estado")) {
            const idPedido = Number(target.getAttribute("data-id"));
            const todosLosPedidos = StorageHelper.getOrders();
            const pedido = todosLosPedidos.find(o => o.id === idPedido);
            
            if (pedido) {
                pedido.estado = target.value as any;
                localStorage.setItem("foodstore_orders", JSON.stringify(todosLosPedidos));
                ejecutarRenderizadoCompleto();
            }
        }
    });

    // Clicks en la tabla de productos (Stock y Bajas)
    tablaBody?.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const id = Number(target.getAttribute("data-id"));
        if (!id) return;

        const producto = catalogoAdmin.find(p => p.id === id);
        if (!producto) return;

        if (target.classList.contains("btn-stock-mod")) {
            const accion = target.getAttribute("data-action");
            producto.stock += (accion === "sumar-stock") ? 1 : (producto.stock > 0 ? -1 : 0);
        }

        if (target.classList.contains("btn-baja-logica") && confirm(`¿Baja lógica para: ${producto.nombre}?`)) {
            producto.stock = 0;
        }

        guardarCatalogoEnStorage();
        renderizarTablaProductos();
    });

    // Submit del Formulario (Alta de Producto)
    formProducto?.addEventListener("submit", (e: SubmitEvent) => {
        e.preventDefault();
        const nombre = (document.getElementById("nombre") as HTMLInputElement).value.trim();
        const descripcion = (document.getElementById("descripcion") as HTMLTextAreaElement).value.trim();
        const precio = Number((document.getElementById("precio") as HTMLInputElement).value);
        const stock = Number((document.getElementById("stock") as HTMLInputElement).value);
        const categoriaSeleccionada = (document.getElementById("categoria") as HTMLSelectElement).value;

        const maxId = catalogoAdmin.length > 0 ? Math.max(...catalogoAdmin.map(p => p.id)) : 0;

        const nuevoProducto: Product = {
            id: maxId + 1,
            eliminado: false,
            createdAt: new Date().toISOString(),
            nombre, descripcion, precio, stock,
            imagen: "https://placehold.co/150x150?text=Comida",
            disponible: stock > 0,
            categoria: {
                id: Math.floor(Math.random() * 1000),
                nombre: categoriaSeleccionada,
                descripcion: `Categoria de ${categoriaSeleccionada}`,
                eliminado: false,
                createdAt: new Date().toISOString()
            }
        };

        catalogoAdmin.unshift(nuevoProducto);
        guardarCatalogoEnStorage();
        formProducto.reset();
        ejecutarRenderizadoCompleto();
        alert("Producto incorporado exitosamente");
    });

    // Manejo de Logout
    buttonLogout?.addEventListener("click", () => logout());

    // Navegación de pestañas SPA y Modal de Alta
    configurarLayoutUI();
};

const configurarLayoutUI = () => {
    const navItems = document.querySelectorAll(".nav-menu .nav-item");
    const sections = document.querySelectorAll(".admin-section");
    const modalAlta = document.getElementById("modal-alta-producto");
    const btnAbrirAlta = document.getElementById("btn-abrir-alta");
    const btnCerrarAlta = document.getElementById("btn-cerrar-alta");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            sections.forEach(sec => sec.classList.add("d-none"));
            document.getElementById(item.getAttribute("data-target") as string)?.classList.remove("d-none");
        });
    });

    btnAbrirAlta?.addEventListener("click", () => modalAlta?.classList.remove("d-none"));
    btnCerrarAlta?.addEventListener("click", () => modalAlta?.classList.add("d-none"));
    formProducto?.addEventListener("submit", () => modalAlta?.classList.add("d-none"));
};

// 7. INICIO SÍNCRONO DE LA APP
inicializarAplicacion();