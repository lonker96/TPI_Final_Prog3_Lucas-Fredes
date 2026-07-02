# FoodStore - Plataforma de Gestión Gastronómica y Pedidos (SPA)

**FoodStore** es una aplicación web del tipo Single Page Application (SPA) desarrollada de forma modular y con tipado estricto en **TypeScript**.

La plataforma resuelve de manera integral el ecosistema de un comercio gastronómico, dividiendo los flujos de negocio y las interfaces según el rol del usuario autenticado (**Client** y **Admin**), protegiendo la integridad del inventario de productos en tiempo real.

---

## 🛠️ Tecnologías Core del Sistema

* **Lenguaje Principal:** TypeScript (Configuración estricta de tipos, interfaces y tipado modular).
* **Entorno de Construcción & Servidor:** Vite (Configuración de enrutamiento dinámico y empaquetado optimizado).
* **Diseño e Interfaz:** CSS3 Vanilla Estructurado (Arquitectura basada en variables globales `:root`, flexbox, CSS Grid y hojas independientes por vista).
* **Estructura:** HTML5 Semántico con nodos dinámicos inyectados vía código (`document.createElement`).

---

## 🚀 Requisitos Implementados (Global)

El proyecto implementa pilares arquitectónicos esenciales:

1. **Capa de Datos Asíncrona (`fetch`):** La base de datos simulada se lee asíncronamente mediante peticiones de red internas.
2. **Persistencia del Estado de Inventario:** Sincronización bidireccional entre el estado en memoria de la aplicación y el `localStorage`, garantizando que las modificaciones de stock impacten globalmente.
3. **Control Estricto de Sesiones y Roles:** Un Middleware basado en Helpers que valida de forma proactiva la existencia de un token de sesión activo y su jerarquía (`ADMIN` / `CLIENT`) antes de renderizar componentes o permitir navegaciones.

---

## 🔑 Credenciales Técnicas de Prueba

Para agilizar el proceso de corrección y evaluación de los flujos de usuario, la pantalla de acceso incorpora atajos de autocompletado con las siguientes cuentas técnicas precargadas:

| Rol | Correo Electrónico | Contraseña | Capacidades en el Sistema |
| :--- | :--- | :--- | :--- |
| **CLIENT** | `client@foodstore.com` | `123` | Exploración de la carta, gestión de carrito con control de stock y generación de órdenes de pedido. |
| **ADMIN** | `admin@foodstore.com` | `123` | Gestión completa del stock del catálogo, edición de la carta y auditoría (Inhabilitado para compras). |

---

## ⚙️ Instalación y Despliegue Local

Sigue estos pasos para clonar el repositorio y ejecutar el servidor local de desarrollo:

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/lonker96/Primer_Parcial_Prog3.git](https://github.com/lonker96/Primer_Parcial_Prog3.git)
   cd Primer_Parcial_Prog3

2. Instalar el arbol de dependencias:
    npm install
3. Acceder a la aplicacion: Abre tu navegador en la URL provista por la consola (por defecto:http://localhost:5173)

---

## 🔐 Documentación del Módulo: Autenticación (`src/pages/auth`)

El módulo de autenticación gestiona el ciclo de vida del acceso al sistema, el registro de nuevos consumidores y el establecimiento del estado de sesión global. Está compuesto por dos sub-módulos acoplados que operan sobre la base simulada de datos en almacenamiento local.

### 1. Registro de Usuarios (`/registro`)
Permite la incorporación dinámica de nuevos perfiles de tipo **CLIENT** (identificados internamente con el rol `"USUARIO"`) al sistema mediante validaciones estrictas en el lado del cliente.

---

### 2. Inicio de Sesión y Control de Roles (`/login`)
Es el punto de entrada crítico de la aplicación. Actúa como el middleware de autenticación inicial que discrimina las capacidades de la interfaz según los privilegios del perfil encontrado.

---

## 🛒 Módulo del Cliente: Catálogo, Detalle y Carrito (`src/pages/store`)

Este módulo compone el Core Business de **FoodStore** para el perfil del consumidor final. Toda la lógica está interconectada asíncronamente compartiendo la reactividad del inventario maestro alojado en `localStorage` bajo la clave `"foodstore_products"`.

### 1. Catálogo Principal e Interfaz Dinámica (`/home`)
El archivo `home.ts` procesa la carga del menú, la renderización de las tarjetas gastronómicas y la aplicación simultánea de criterios de búsqueda.

---

### 2. Vista de Detalle y Modificación de Cantidad (`/productDetail`)
Permite al usuario profundizar en las especificaciones del artículo seleccionado mediante la persistencia de parámetros en la URL.

---

### 3. Motor del Carrito y Cierre de Órdenes de Pedido (`/cart`)
El archivo `cart.ts` centraliza la lógica matemática de la compra, la consistencia de precios y el procesamiento del formulario final de entrega.
---

## 📊 Módulo de Administración: Dashboard y Control Total (`src/pages/admin`)

El módulo de administración (`admin/home.html`) funciona como un sistema ERP interno para la gestión comercial del negocio. Está acoplado a un controlador dinámico que interactúa directamente con el almacenamiento maestro de datos, impactando de forma inmediata en la interfaz que visualizan los clientes[cite: 9].
