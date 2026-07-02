import type { IUser } from "../types/IUser";
import type { Rol } from "../types/Rol";
import { navigate } from "./navigate";
import { StorageHelper } from "./storage";

export const checkAuhtUser = (
  redireccion1: string,
  redireccion2: string,
  rolRequerido: Rol
) => {
  console.log("Comienzo de chequeo de autenticacion...");

  //Leemos la sesion ya parseada.
  const session = StorageHelper.getSession();

  //1. Si no hay sesion o loggedIn es falso.
  if(!session || !session.loggedIn) {
    console.log(("No existe sesion activa en local. Redirigiendo..."));
    navigate(redireccion1);
    return;
  }

  //2. Si existe pero el rol no coincida con el que requiere la vista.
  if (session.role !== rolRequerido) {
    console.log(`Existe sesion como ${session.role}, pero se requiere ${rolRequerido}. Redirigiendo a zona segura...`);
    navigate( redireccion2);
    return;
  }

  console.log(`Acceso consedido para el usuario ${session.nombre} (${session.role})`);

};

export const logout = () => {
  StorageHelper.clearSession();
  navigate("/src/pages/auth/login/login.html");
}
