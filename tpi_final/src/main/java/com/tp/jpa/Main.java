package com.tp.jpa;

import com.tp.jpa.model.enums.EstadoPedido;
import com.tp.jpa.model.*;
import com.tp.jpa.model.enums.FormaPago;
import com.tp.jpa.model.enums.Rol;
import com.tp.jpa.repository.CategoriaRepository;
import com.tp.jpa.repository.PedidoRepository;
import com.tp.jpa.repository.ProductoRepository;
import com.tp.jpa.repository.UsuarioRepository;
import com.tp.jpa.util.JPAUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;
import jdk.swing.interop.SwingInterOpUtils;

import java.util.*;

/**
 * Clase principal: menú de consola del sistema Food Store.
 * Orden de uso natural: Categorías -> Productos -> Usuarios -> Pedidos.
 */
public class Main {

    private static final Scanner sc = new Scanner(System.in);

    private static final CategoriaRepository categoriaRepo = new CategoriaRepository();
    private static final ProductoRepository productoRepo = new ProductoRepository();
    private static final UsuarioRepository usuarioRepo = new UsuarioRepository();
    private static final PedidoRepository pedidoRepo = new PedidoRepository();

    public static void main(String[] args) {
        boolean salir = false;
        while (!salir) {
            System.out.println();
            System.out.println("===== FOOD STORE - MENU PRINCIPAL =====");
            System.out.println("1. Gestionar Categorias");
            System.out.println("2. Gestionar Productos");
            System.out.println("3. Gestionar Usuarios");
            System.out.println("4. Gestionar Pedidos");
            System.out.println("5. Reportes");
            System.out.println("0. Salir");
            System.out.print("Opcion: ");
            String op = sc.nextLine().trim();
            switch (op) {
                case "1": menuCategorias(); break;
                case "2": menuProductos(); break;
                case "3": menuUsuarios(); break;
                case "4": menuPedidos(); break;
                case "5": menuReportes(); break;
                case "0": salir = true; break;
                default: System.out.println("Opción inválida.");
            }
        }
        JPAUtil.close();
        System.out.println("Aplicacion finalizada.");
    }

    // ── Submenús ─────────────────────────────────────────────────

    private static void menuCategorias() {
        boolean volver = false;
        while (!volver) {
            System.out.println("\n--- GESTION DE CATEGORIAS ---");
            System.out.println("1-Alta | 2-Modificar | 3-Baja logica | 4-Listado | 0-Volver");
            System.out.print("Opcion: ");
            String op = sc.nextLine().trim();
            switch (op) {
                case "1":
                    System.out.print("Nombre de la nueva categoria: ");
                    String nombre = sc.nextLine().trim();
                    System.out.print("Descripcion: ");
                    String desc = sc.nextLine().trim();
                    if (!nombre.isEmpty()) {
                        Categoria cat = Categoria.builder().nombre(nombre).descripcion(desc).build();
                        categoriaRepo.guardar(cat);
                        System.out.println("Categoria guardada exitosamente.");
                    } else {
                        System.out.println("El nombre no puede estar vacio.");
                    }
                    break;
                case "2":
                    System.out.print("Ingrese ID de la categoria a modificar: ");
                    Long idMod = leerLong();
                    Optional<Categoria> catOpt = categoriaRepo.buscarPorId(idMod);
                    if (catOpt.isPresent() && !catOpt.get().isEliminado()) {
                        Categoria c = catOpt.get();
                        System.out.print("Nuevo nombre (actual: " + c.getNombre() + "): ");
                        String nNom = sc.nextLine().trim();
                        if (!nNom.isEmpty()) c.setNombre(nNom);
                        System.out.print("Nueva descripcion: ");
                        String nDesc = sc.nextLine().trim();
                        if (!nDesc.isEmpty()) c.setDescripcion(nDesc);
                        categoriaRepo.guardar(c);
                        System.out.println("Categoria modificada.");
                    } else {
                        System.out.println("Categoria no encontrada o inactiva.");
                    }
                    break;
                case "3":
                    System.out.println("ID de la categoria a dar de baja: ");
                    if (categoriaRepo.eliminarLogico(leerLong())) {
                        System.out.println("Baja logica realizada.");
                    } else {
                        System.out.println("No se encontro la categoria.");
                    }
                    break;
                case "4":
                    List<Categoria> categorias = categoriaRepo.listarActivos();
                    if (categorias.isEmpty()) {
                        System.out.println("No hay categorias activas registradas.");
                    } else {
                        categorias.forEach(c -> System.out.println("ID: " + c.getId() + " | Nombre: "+ c.getNombre()));

                    }
                    break;
                case "0":
                    volver = true;
                    break;
                default:
                    System.out.println("Opcion invalida.");
            }
        }

    }

    private static void menuProductos() {
        boolean volver = false;
        while (!volver) {
            System.out.println("\n--- GESTION DE PRODUCTOS ---");
            System.out.println("1-Alta | 2-Modificar | 3-Baja logica | 4-Listado | 0-Volver");
            System.out.print("Opcion: ");
            String op = sc.nextLine().trim();
            switch (op) {
                case "1":
                    System.out.print("ID de la Categoria donde agregar el producto: ");
                    Long idCat = leerLong();
                    Optional<Categoria> catOpt = categoriaRepo.buscarPorId(idCat);
                    if (catOpt.isPresent() && !catOpt.get().isEliminado()){
                        System.out.print("Nombre del producto: ");
                        String nombre = sc.nextLine().trim();
                        System.out.print("Descripcion: ");
                        String desc = sc.nextLine().trim();
                        System.out.print("Precio: ");
                        double precio = leerDouble();
                        System.out.print("Stock inicial: ");
                        int stock = leerInt();

                        Producto prod = Producto.builder()
                                .nombre(nombre).precio(precio).stock(stock).descripcion(desc).disponible(true)
                                .build();

                        //Abrimos un em explicito para que la sesion este activa al cargar la coleccion
                        EntityManager em = JPAUtil.getEntityManagerFactory().createEntityManager();
                        EntityTransaction tx = em.getTransaction();
                        try {
                            tx.begin();
                            Categoria categoriaManaged = em.find(Categoria.class, idCat);
                            categoriaManaged.addProducto(prod);
                            em.merge(categoriaManaged);
                            tx.commit();
                            System.out.println();
                            System.out.println("Producto guardado y asociado a la categoria.");
                        } catch (Exception e) {
                            if (tx.isActive()) tx.rollback();
                            System.out.println("Error al guardar el producto: " + e.getMessage());
                        } finally {
                            em.close();
                        }
                    } else {
                        System.out.println("Categoria no valida.");
                    }
                    break;
                case "2":
                    System.out.print("Ingrese ID del producto a modificar: ");
                    Optional<Producto> pOtp = productoRepo.buscarPorId(leerLong());
                    if (pOtp.isPresent() && !pOtp.get().isEliminado()) {
                        Producto p = pOtp.get();
                        System.out.print("Nuevo precio (actual: " + p.getPrecio() + "): ");
                        p.setPrecio(leerDouble());
                        System.out.print("Nuevo Stock: ");
                        p.setStock(leerInt());
                        productoRepo.guardar(p);
                        System.out.println("Producto actualizado.");
                    } else {
                        System.out.println("Producto no encontrado o inactivo.");
                    }
                    break;
                case "3":
                    System.out.print("Ingrese ID del producto a dar de baja: ");
                    if (productoRepo.eliminarLogico(leerLong())) {
                        System.out.println("Baja logica del producto procesada.");
                    } else {
                        System.out.println("No se encontro el producto o ya fue eliminado.");
                    }
                    break;
                case "4":
                    System.out.print("¿Desea filtrar por categoria? (S/N): ");
                    String filtro = sc.nextLine().trim().toUpperCase();
                    if (filtro.equals("S")){
                        System.out.print("ID Categoria: ");
                        mostrarProductos(categoriaRepo.buscarProductosPorCategoria(leerLong()));
                    } else {
                        mostrarProductos(productoRepo.listarActivos());
                    }
                    break;
                case "0":
                    volver = true;
                    break;
                default:
                    System.out.println("Opcion invalida.");
            }
        }
    }

    private static void menuUsuarios() {
        boolean volver = false;
        while (!volver) {
            System.out.println("\n--- GESTION DE USUARIOS ---");
            System.out.println("1-Alta | 2-Modificar | 3-Baja logica | 4-Listado | 5-Buscar por mail | 0-Volver");
            System.out.print("Opcion: ");
            String op = sc.nextLine().trim();
            switch (op) {
                case "1":
                    System.out.print("Nombre: ");
                    String nombre = sc.nextLine().trim();
                    System.out.print("Apellido: ");
                    String apellido = sc.nextLine().trim();
                    System.out.print("Mail: ");
                    String mail = sc.nextLine().trim();
                    System.out.print("Contraseña ");
                    String pass = sc.nextLine().trim();
                    System.out.print("Rol (ADMIN / USUARIO): ");
                    String rolStr = sc.nextLine().trim().toUpperCase();

                    try {
                        Rol rol =Rol.valueOf(rolStr);
                        Usuario usr = Usuario.builder().nombre(nombre).apellido(apellido).mail(mail).contraseña(pass).rol(rol).build();
                        usuarioRepo.guardar(usr);
                        System.out.println("Usuario registrado exitosamente.");
                    } catch (IllegalArgumentException e) {
                        System.out.println("Rol invalido. Intente nuevamente");
                    }
                    break;
                case "2":
                    System.out.print("ID del usuario a modificar: ");
                    Long idMod = leerLong();
                    Optional<Usuario> usrOpt = usuarioRepo.buscarPorId(idMod);
                    if (usrOpt.isPresent() && !usrOpt.get().isEliminado()) {
                        Usuario u = usrOpt.get();
                        System.out.print("Nuevo nombre (actual: " + u.getNombre() + "): ");
                        String nNomb = sc.nextLine().trim();
                        if (!nNomb.isEmpty()) u.setNombre(nNomb);

                        System.out.print("Nuevo mail (actual: " + u.getMail() + "): ");
                        String nMail = sc.nextLine().trim();
                        if (!nMail.isEmpty()) u.setMail(nMail);

                        System.out.print("Nueva clave: ");
                        String nPass = sc.nextLine().trim();
                        if (!nPass.isEmpty()) u.setContraseña(nPass);

                        usuarioRepo.guardar(u);
                        System.out.println("Usuario actualizado.");
                    } else {
                        System.out.println("Usuario no encontrado.");
                    }
                    break;
                case "3":
                    System.out.print("ID del usuario a dar de baja: ");
                    Long idBaja = leerLong();
                    if (usuarioRepo.eliminarLogico(idBaja)) {
                        System.out.println("Baja logica del usuario procesada.");
                    } else {
                        System.out.println("No se pudo eliminar el usuario.");
                    }
                    break;
                case "4":
                    usuarioRepo.listarActivos().forEach(u -> System.out.println("ID: " + u.getId() + " | " + u.getNombre() + " " + u.getApellido() + " | Mail: " + u.getMail() + " | Rol: " + u.getRol()));
                    break;
                case "5":
                    System.out.print("Ingrese el mail a buscar: ");
                    Optional<Usuario> uOpt = usuarioRepo.buscarPorMail(sc.nextLine().trim());
                    if (uOpt.isPresent()) {
                        Usuario u = uOpt.get();
                        System.out.println("Usuario Encontrado -> ID: " + u.getId() + " | Nombre: " + u.getNombre() + " | Rol: " + u.getRol());
                    } else {
                        System.out.println("No se encontro ningun usuario activo con ese mail.");
                    }
                    break;
                case "0":
                    volver = true;
                    break;
                default:
                    System.out.println("Opcion invalida.");

            }
        }
    }

    private static void menuPedidos() {
        boolean volver = false;
        while (!volver) {
            System.out.println("\n--- GESTION DE PEDIDOS ---");
            System.out.println("1-Alta (Compra Atomica | 2-Cambiar estado | 3-Baja logica | 4.Listado");
            System.out.println("5-Por usuario | 6-Por estado | 0-Volver");
            System.out.print("Opcion: ");
            String op = sc.nextLine().trim();
            switch (op) {
                case "1":
                    ejecutarAltaPedidoAtomico();
                    break;
                case "2":
                    System.out.print("ID del Pedido: ");
                    Optional<Pedido> pOpt = pedidoRepo.buscarPorId(leerLong());
                    if (pOpt.isPresent() && !pOpt.get().isEliminado()) {
                        System.out.print("Nuevo Estado (PENDIENTE, PREPARANDO, ENVIADO, ENTREGADO, CANCELADO): ");
                        try {
                            pOpt.get().setEstado(EstadoPedido.valueOf(sc.nextLine().trim().toUpperCase()));
                            pedidoRepo.guardar(pOpt.get());
                            System.out.println("Estado actualizado correctamente.");
                        } catch (IllegalArgumentException e) {
                            System.out.println("Estado invalido.");
                        }
                    } else {
                        System.out.println("Pedido no encontrado.");
                    }
                    break;
                case "3":
                    System.out.print("ID del pedido a eliminar: ");
                    if (pedidoRepo.eliminarLogico(leerLong())) {
                        System.out.println("Pedido dado de baja.");
                    } else {
                        System.out.println("No se pudo eliminar el pedido.");
                    }
                    break;
                case "4":
                    mostrarListaPedidos(pedidoRepo.listarActivos());
                    break;
                case "5":
                    System.out.print("ID del Usuario: ");
                    mostrarListaPedidos(usuarioRepo.buscarPedidosPorUsuario(leerLong()));
                    break;
                case "6":
                    System.out.print("Estado a filtrar: ");
                    try {
                        mostrarListaPedidos(pedidoRepo.buscarPorEstado(EstadoPedido.valueOf(sc.nextLine().trim().toUpperCase())));
                    } catch (IllegalArgumentException e) {
                        System.out.println("Estado invalido.");
                    }
                    break;
                case "0":
                    volver = true;
                    break;
                default:
                    System.out.println("Opcion invalida.");
            }
        }
    }

    private static void menuReportes() {
        boolean volver = false;
        while (!volver) {
            System.out.println("\n--- PANEL DE REPORTES ---");
            System.out.println("1-Productos por categoria | 2-Pedidos por usuario | 3-Total facturado | 0-Volver");
            System.out.println("Opcion: ");
            String op = sc.nextLine().trim();
            switch (op) {
                case "1":
                    categoriaRepo.listarActivos().forEach(c-> {
                        System.out.println("\nCategoria: " + c.getNombre());
                        categoriaRepo.buscarProductosPorCategoria(c.getId()).forEach(p -> System.out.println(" -> " + p.getNombre() + " ($" + p.getPrecio() + ")"));
                    });
                    break;
                case "2":
                    usuarioRepo.listarActivos().forEach(u -> {
                        List<Pedido> pUsr = usuarioRepo.buscarPedidosPorUsuario(u.getId());
                        System.out.println("Usuario: " + u.getNombre() + " " + u.getApellido() + " | Cantidad de pedidos: " + pUsr.size());
                    });
                    break;
                case "3":
                    double total = pedidoRepo.listarActivos().stream().mapToDouble(Pedido::getTotal).sum();
                    System.out.println("Monto Historico Total Facturado: $" + total);
                    break;
                case "0":
                    volver = true;
                    break;
                default:
                    System.out.println("Opcion invalida.");
            }
        }
    }

    // ── Logica Compleja ─────────────────────────────────────────────────
    private static void ejecutarAltaPedidoAtomico() {
        System.out.print("ID del Usuario (Cliente) que realiza la compra: ");
        Long idUsuario = leerLong();
        Optional<Usuario> usrOpt = usuarioRepo.buscarPorId(idUsuario);

        if (usrOpt.isEmpty() || usrOpt.get().isEliminado()) {
            System.out.println("Error: El usuario no existe o esta inactivo.");
            return;
        }

        System.out.print("Forma de Pago (EFECTIVO / TARJETA / MERCADO_PAGO): ");
        FormaPago formaPago;
        try {
            formaPago = FormaPago.valueOf(sc.nextLine().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            System.out.println("Forma de pago invalida.");
            return;
        }

        // Se inicializa el Pedido utilizado los valores definidos por defecto
        Pedido pedido = Pedido.builder()
                .formaPago(formaPago)
                .estado(EstadoPedido.PENDIENTE)
                .total(0.0)
                .build();

        boolean cargandoCarrito = true;
        System.out.println("--- Agregue Productos al Carrito ---");

        while (cargandoCarrito) {
            System.out.print("ID del Producto a comprar: ");
            Optional<Producto> prodOpt = productoRepo.buscarPorId(leerLong());

            if (prodOpt.isPresent() && !prodOpt.get().isEliminado()) {
                Producto p = prodOpt.get();
                System.out.print("Cantidad (" + p.getNombre() + " - Stock actual: " + p.getStock() + "): ");
                int cant = leerInt();
                if (cant > 0 && cant <= p.getStock()) {
                    pedido.addDetallePedido(cant, p);
                    System.out.println("Añadido.");
                } else {
                    System.out.println("Cantidad invalida o stock insuficiente.");
                }
            } else {
                System.out.println("Producto inexistente.");
            }
            System.out.print("¿Cargar otro producto? (S/N): ");
            if (!sc.nextLine().trim().toUpperCase().equals("S")) cargandoCarrito = false;
        }

        if (pedido.getDetalles().isEmpty()) {
            System.out.println("El carrito de compras esta vacio.");
            return;
        }

        //Bloque de persistencia aislada bajo control manual de transaccion.
        EntityManager em = JPAUtil.getEntityManagerFactory().createEntityManager();
        EntityTransaction tx = em.getTransaction();

        try {
            tx.begin();

            //1. Validar y actualizar el stock de cada producto
            for (DetallePedido det : pedido.getDetalles()) {
                Producto pManaged = em.find(Producto.class, det.getProducto().getId());
                if (pManaged.getStock() < det.getCantidad()) {
                    throw new RuntimeException("Quiebre de stock concurrente detectado en: " + pManaged.getNombre());
                }
                pManaged.setStock(pManaged.getStock() - det.getCantidad());
                em.merge(pManaged);

                //Sincronizar la instancia administrada en el detalle
                det.setProducto(pManaged);
            }

            //2. Agregar el pedido a su coleccion y guardar el usuario para que aplique la cascada.
            Usuario uManaged = em.find(Usuario.class, idUsuario);
            uManaged.addPedido(pedido);
            em.merge(uManaged);

            tx.commit();
            System.out.println("Pedido registrado con exito Total: $" + pedido.getTotal());
        }catch (Exception e) {
            if (tx.isActive()) tx.rollback();
            System.out.println("Transaccion cancelada. Error critico: " + e.getMessage());
        } finally {
            em.close();
        }

    }

    // ── Metodos Auxiliares ─────────────────────────────────────────────────
    private static void mostrarProductos(List<Producto> lista){
        if (lista.isEmpty()) System.out.println("No se encontraron productos.");
        else lista.forEach(p -> System.out.println("ID: " + p.getId() + " | " + p.getNombre() + " | Precio: $" + p.getPrecio() + " | Stock: " + p.getStock()));
    }

    private static void mostrarListaPedidos(List<Pedido> lista) {
        if (lista.isEmpty()) System.out.println("No se registraron pedidos.");
        else lista.forEach(p -> System.out.println("ID Pedido: " + p.getId() + " | Estado: " + p.getEstado() + " | Total: $" + p.getTotal() + " |" + p.getFecha()));
    }

    private static Long leerLong() {
        while (true) {
            try {return Long.parseLong(sc.nextLine().trim()); }
            catch (NumberFormatException e) {System.out.print("Ingrese un ID numerico valido: ");
            }
        }
    }

    private static int leerInt () {
        while (true){
            try {return Integer.parseInt(sc.nextLine().trim());}
            catch (NumberFormatException e) {System.out.print("Ingrese un numero entero valido: ");
            }
        }
    }

    private static Double leerDouble () {
        while (true) {
            try { return Double.parseDouble(sc.nextLine().trim().replace(",","."));}
            catch (NumberFormatException e) {System.out.print("Ingrese un monto decimal valido: ");
            }
        }
    }
}
