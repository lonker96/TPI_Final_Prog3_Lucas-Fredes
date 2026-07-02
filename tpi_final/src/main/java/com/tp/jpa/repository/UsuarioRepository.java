package com.tp.jpa.repository;

import com.tp.jpa.model.Pedido;
import com.tp.jpa.model.Usuario;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio de Usuario. Además del CRUD heredado implementa la búsqueda
 * de un usuario activo por su mail.
 */
public class UsuarioRepository extends BaseRepository<Usuario> {

    public UsuarioRepository() {
        super(Usuario.class);
    }

    /**
     * Retorna el usuario activo con el mail indicado.
     */
    public Optional<Usuario> buscarPorMail(String mail) {
        EntityManager em = emf.createEntityManager();
        try {
            String jpql = "/* Consulta para recuperar un usuario activo por su e-mail unico */" +
                    "SELECT u FROM Usuario u WHERE u.mail = :mail AND u.eliminado = false";

            List<Usuario> resultados = em.createQuery(jpql, Usuario.class)
                    .setParameter("mail",mail)
                    .getResultList();
            /**
             * Si la lista no esta vacia, envolvemos el primer resultado en un Optional
             * Si esta vacia, retornamos Optional.empy().
             */
            if (!resultados.isEmpty()) {
                return Optional.of(resultados.get(0));
            }
            return Optional.empty();
        } finally {
            em.close();
        }
    }

    /**
     * Retorna los pedidos activos del usuario indicado.
     */
    public List<Pedido> buscarPedidosPorUsuario(Long idUsuario) {
        EntityManager em = emf.createEntityManager();
        try {
            String jpql = "/* Consulta para traer el listado de pedidos activos de un cliente */" +
                    "SELECT p FROM Usuario u JOIN u.pedidos p WHERE u.id = :idUsuario AND p.eliminado = false";
            return em.createQuery(jpql, Pedido.class)
                    .setParameter("idUsuario", idUsuario)
                    .getResultList();
        } finally {
            em.close();
        }

    }
}
