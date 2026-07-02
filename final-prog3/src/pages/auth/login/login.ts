import type { IUser } from "../../../types/IUser";
import { navigate } from "../../../utils/navigate";
import { StorageHelper } from "../../../utils/storage";

const loginForm = document.getElementById("login-form") as HTMLFormElement;

// 1. Cargamos los usuarios desde localStorage. 
// Si no existe la clave "users", inicializamos con los mockUsers de prueba para tener el ADMIN.
let usuariosRegistrados: IUser[] = JSON.parse(localStorage.getItem("users") || "[]");

if (usuariosRegistrados.length === 0) {
  const mockUsers: IUser[] = [
    { id: 1, mail: "admin@foodstore.com", password: "123", role: "ADMIN", loggedIn: false },
    { id: 2, mail: "client@foodstore.com", password: "123", role: "USUARIO", loggedIn: false }
  ];
  localStorage.setItem("users", JSON.stringify(mockUsers));
  usuariosRegistrados = mockUsers;
}

loginForm?.addEventListener("submit", (e: SubmitEvent) => {
  e.preventDefault();

  const emailInput = (document.getElementById("email") as HTMLInputElement).value.trim();
  const passwordInput = (document.getElementById("password") as HTMLInputElement).value;

  // 2. Buscamos en la lista global (que incluye los mocks + los registrados por pantalla)
  const userFound = usuariosRegistrados.find(
    (u) => u.mail === emailInput && u.password === passwordInput
  );

  if (userFound) {
    // 3. Creamos el objeto de sesión con loggedIn: true
    const sessionUser: IUser = {
      id: userFound.id,
      mail: userFound.mail,
      password: userFound.password, 
      role: userFound.role,
      loggedIn: true
    };

    // 4. Guardamos la sesión activa usando tu StorageHelper
    StorageHelper.saveSession(sessionUser);

    // 5. Redirección limpia según el Rol
    alert(`¡Bienvenido de nuevo!`);
    
    if (sessionUser.role === "ADMIN") {
      navigate("/src/pages/admin/home/home.html");
    } else {
      navigate("/src/pages/store/home.html");
    }
  } else {
    alert("Credenciales incorrectas. Por favor, intenta de nuevo.");
  }
});