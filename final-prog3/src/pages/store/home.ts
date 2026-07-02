import type { Product } from "../../types/Product";
import { StorageHelper } from "../../utils/storage";
import { navigate } from "../../utils/navigate";

// 1. VERIFICACIÓN Y CONTROL DE SESIÓN
let sesionActiva = StorageHelper.getSession();
if (!sesionActiva) {
    const sesionNativa = localStorage.getItem("foodstore_session");
    if (sesionNativa) sesionActiva = JSON.parse(sesionNativa);
}

if (!sesionActiva || sesionActiva.loggedIn !== true) {
    alert("Debes iniciar sesión para acceder al catálogo.");
    navigate("/src/pages/auth/login/login.html");
    throw new Error("Usuario no autenticado");
}

// 2. REFERENCIAS AL DOM ORIGINALES
const listaProductos = document.getElementById("contenedor-productos") as HTMLElement;
const buscador = document.getElementById("input-busqueda") as HTMLInputElement;
const selectOrden = document.getElementById("select-orden") as HTMLSelectElement; 
const contadorProductos = document.getElementById("contador-productos") as HTMLElement; 
const botonesFiltro = document.querySelectorAll('.btn-filtro');

// 3. ESTADO GLOBAL DEL CATÁLOGO
let catalogoProductos: Product[] = [];
let categoriaActiva = "todos";
let textoBusqueda = "";
let ordenActivo = "predeterminado"; 

// 4. INICIALIZACIÓN ASÍNCRONA OBLIGATORIA (Exigencia del TPI)
const inicializarCatalogo = async () => {
    const productosGuardados = localStorage.getItem("foodstore_products");
    
    if (productosGuardados) {
        catalogoProductos = JSON.parse(productosGuardados);
    } else {
        try {
            const respuesta = await fetch("/data/productos.json");
            if (!respuesta.ok) throw new Error("No se pudo obtener el JSON base");
            catalogoProductos = await respuesta.json();
            localStorage.setItem("foodstore_products", JSON.stringify(catalogoProductos));
        } catch (error) {
            console.error("Error en fetch de catálogo:", error);
            catalogoProductos = [];
        }
    }

    configurarEventosTienda();
    actualizarBadgeCarrito();
    aplicarFiltrosCOMBINADOS();
};

// 5. CAPA DE RENDERIZADO VISUAL RESPETANDO TU CSS ORIGINAL
export const renderizarProductos = (lista: Product[]) => {
    if (!listaProductos) return;
    listaProductos.innerHTML = "";

    const visibles = lista.filter(p => p.stock > 0 && p.eliminado !== true);

    if (contadorProductos) {
        contadorProductos.textContent = `Se encontraron ${visibles.length} productos.`;
    }

    if (visibles.length === 0) {
        listaProductos.innerHTML = `<p class="sin-productos">No hay productos disponibles que coincidan con la búsqueda.</p>`;
        return;
    }

    visibles.forEach((producto: Product) => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("card-producto");

        tarjeta.innerHTML = `
            <div class="imagen-contenedor">
                <img src="${producto.imagen}" alt="${producto.nombre}">
            </div>
            <div class="info">
                <span class="categoria">${producto.categoria.nombre}</span>
                <h2>${producto.nombre}</h2>
                <p class="descripcion">${producto.descripcion || ''}</p>
                <div class="meta">
                    <span class="precio">$${producto.precio.toLocaleString()}</span>
                    <span class="stock">Stock: ${producto.stock} u.</span>
                </div>
                <div class="acciones">
                    <button class="btn-detalles" data-id="${producto.id}">Ver Detalles</button>
                    <button class="btn-agregar" data-id="${producto.id}">🛒 Agregar</button>
                </div>
            </div>
        `;
        listaProductos.appendChild(tarjeta);
    });
};

// 6. CONTROLADOR DE FILTROS, BÚSQUEDAS Y ORDENAMIENTOS
const aplicarFiltrosCOMBINADOS = () => {
    let productosFiltrados = catalogoProductos.filter(producto => {
        if (categoriaActiva === "todos") return true;
        return producto.categoria.nombre.toLowerCase() === categoriaActiva.toLowerCase();
    });

    if (textoBusqueda !== "") {
        productosFiltrados = productosFiltrados.filter(producto => 
            producto.nombre.toLowerCase().includes(textoBusqueda) ||
            producto.categoria.nombre.toLowerCase().includes(textoBusqueda)
        );
    }

    if (ordenActivo === "nombre-asc") {
        productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (ordenActivo === "nombre-desc") {
        productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
    } else if (ordenActivo === "precio-asc") {
        productosFiltrados.sort((a, b) => a.precio - b.precio);
    } else if (ordenActivo === "precio-desc") {
        productosFiltrados.sort((a, b) => b.precio - a.precio);
    } else {
        productosFiltrados.sort((a, b) => a.id - b.id);
    }

    renderizarProductos(productosFiltrados);
};

// 7. GESTIÓN DEL CARRITO DE COMPRAS
const agregarAlCarrito = (idProducto: number) => {
    const producto = catalogoProductos.find(p => p.id === idProducto);
    if (!producto) return;

    const carritoActual = StorageHelper.getCart();
    const itemExistente = carritoActual.find(item => item.product.id === producto.id);

    if (itemExistente) {
        if (itemExistente.quantity < producto.stock) {
            itemExistente.quantity += 1;
        } else {
            alert(`Lo sentimos, solo quedan ${producto.stock} unidades de este producto.`);
            return;
        }
    } else {
        carritoActual.push({ product: producto, quantity: 1 });
    }

    StorageHelper.saveCart(carritoActual);
    actualizarBadgeCarrito();
};

export const actualizarBadgeCarrito = () => {
    const carrito = StorageHelper.getCart();
    const badge = document.getElementById("carrito-count");
    if (badge) {
        const totalItems = carrito.reduce((acc, item) => acc + item.quantity, 0);
        badge.textContent = totalItems.toString();
        badge.classList.toggle("hidden", totalItems === 0);
    }
};

// 8. ESCUCHADORES DE EVENTOS DE INTERFAZ
const configurarEventosTienda = () => {
    buscador?.addEventListener("input", () => {
        textoBusqueda = buscador.value.toLowerCase().trim();
        aplicarFiltrosCOMBINADOS();
    });

    selectOrden?.addEventListener("change", () => {
        ordenActivo = selectOrden.value;
        aplicarFiltrosCOMBINADOS();
    });

    listaProductos?.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const idProd = Number(target.getAttribute("data-id"));
        if (!idProd) return;

        if (target.classList.contains("btn-agregar")) {
            agregarAlCarrito(idProd);
        } else if (target.classList.contains("btn-detalles")) {
            // 🔥 NAVEGACIÓN ORIGINAL ACUMULANDO EL ID EN LA URL
            navigate(`/src/pages/store/productDetail/productDetail.html?id=${idProd}`);
        }
    });

    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesFiltro.forEach(btn => btn.classList.remove('active'));
            boton.classList.add('active');
            categoriaActiva = boton.getAttribute('data-categoria') || "todos";
            aplicarFiltrosCOMBINADOS(); 
        });
    });
};

inicializarCatalogo();