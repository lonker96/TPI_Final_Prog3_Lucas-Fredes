import type { Product } from "./Product";

export interface IOrderItem {
    product: Product;
    quantity: number;
}

export interface IOrder {
    id: number;          
    userId: number;      
    userMail: string;    
    items: IOrderItem[];
    subtotal: number;
    envio: number; 
    total: number;       
    fecha: string;       
    estado: "PENDIENTE" | "ENTREGADO" | "CANCELADO"; 

    entrega: {
        direccion: string;
        telefono: string;
        metodoPago: string;
    };
}