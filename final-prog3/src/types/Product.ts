import type { ICategory } from "./Category";

export interface Product {
    id: number;
    eliminado?: boolean;
    createdAt?: string;
    nombre: string;
    precio: number;
    descripcion: string;
    stock: number;
    imagen: string;
    disponible: boolean;
    categoria: ICategory;
}