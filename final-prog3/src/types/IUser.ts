import type { Rol } from "./Rol";

export interface IUser {
  id: number;
  nombre?: string;
  apellido?: string;
  mail: string;
  password?: string;
  celular?: string;
  loggedIn: boolean;
  role: Rol;
}
