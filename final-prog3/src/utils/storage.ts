import categoriasData from "../data/categorias.json";
import type { IUser } from "../types/IUser";
import type { Product } from "../types/Product";
 import type { IOrder } from "../types/IOrder";

const KEYS ={
    USER_SESSION:  "foodstore_session",
    PRODUCTS: "foodstore_products",
    CATEGORIES: "foodstore_categories",
    CART: "foodstore_cart",
    ORDERS: "foodstore_orders"
};

export const StorageHelper = {
    //Iniciamos la base simulada
    initDatabase() {
        if (!localStorage.getItem(KEYS.CATEGORIES)) {
            localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categoriasData));
        }

    },

    //Sesion de Usuario

    saveSession(user: IUser) {
        localStorage.setItem(KEYS.USER_SESSION, JSON.stringify(user));
    },

    getSession(): IUser | null {
        const session = localStorage.getItem(KEYS.USER_SESSION);
        return session ? JSON.parse(session) : null;
    },

    clearSession() {
        localStorage.removeItem(KEYS.USER_SESSION);
    },

    
    //Carrito de compras

    getCart(): {product: Product; quantity: number}[] {
        const cart = localStorage.getItem(KEYS.CART);
        return cart ? JSON.parse(cart) : [];
    },

    saveCart(cartData: { product: Product; quantity: number} []) {
        localStorage.setItem(KEYS.CART, JSON.stringify(cartData));
    },

    clearCart() {
        localStorage.removeItem(KEYS.CART);
    },

    // Gestión de Pedidos Globales
    getOrders(): IOrder[] {
        const orders = localStorage.getItem(KEYS.ORDERS);
        return orders ? JSON.parse(orders) : [];
    },

    saveOrder(nuevoPedido: IOrder) {
        const pedidosExistentes = this.getOrders();
        pedidosExistentes.push(nuevoPedido);
        localStorage.setItem(KEYS.ORDERS, JSON.stringify(pedidosExistentes));
    },

    // Útil para cuando el ADMIN cambie el estado de un pedido
    updateOrder(pedidosActualizados: IOrder[]) {
        localStorage.setItem(KEYS.ORDERS, JSON.stringify(pedidosActualizados));
    }
};