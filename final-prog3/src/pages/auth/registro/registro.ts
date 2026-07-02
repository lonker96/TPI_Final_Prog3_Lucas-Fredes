import type { IUser } from "../../../types/IUser";
import { navigate } from "../../../utils/navigate";

const form = document.getElementById("form") as HTMLFormElement;
const inputEmail = document.getElementById("email") as HTMLInputElement;
const inputPassword = document.getElementById("password") as HTMLInputElement;

// Traemos todos los usuarios registrados en el sistema
const usuariosRegistrados: IUser[] = JSON.parse(localStorage.getItem("users") || "[]");

form.addEventListener("submit", (e: SubmitEvent) => {
  e.preventDefault();
  
  const valueEmail = inputEmail.value.trim();
  const valuePassword = inputPassword.value;

  // 1. Validar que los campos no estén vacíos
  if (!valueEmail || !valuePassword) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  // 2. Verificamos si el usuario ya está registrado
  const usuarioExistente = usuariosRegistrados.find((u) => u.mail === valueEmail);
  if (usuarioExistente) {
    alert("Este correo ya está registrado.");
    return;
  }

  // 3. Creamos el nuevo usuario con rol de cliente (USUARIO)
  const newUser: IUser = {
    id: Date.now(),
    mail: valueEmail,
    password: valuePassword,
    role: "USUARIO",
    loggedIn: false
  };

  // 4. Lo agregamos al listado general 
  usuariosRegistrados.push(newUser);
  localStorage.setItem("users", JSON.stringify(usuariosRegistrados));

  alert("¡Registro exitoso! Ya puedes iniciar sesión.");
  
  // 5. Limpiamos el formulario y redirigimos
  form.reset();
  navigate("/src/pages/auth/login/login.html");
});