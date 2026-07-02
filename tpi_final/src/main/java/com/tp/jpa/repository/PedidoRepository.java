package com.tp.jpa.repository;

import com.tp.jpa.model.Pedido;
import com.tp.jpa.model.Usuario;
import com.tp.jpa.model.enums.EstadoPedido;
import jakarta.persistence.EntityManager;

import java.util.List;

/**
 * Repositorio de Pedido. Además del CRUD heredado implementa consultas por
 * usuario y por estado.
 */
public class PedidoRepository extends BaseRepository<Pedido> {

    public PedidoRepository() {
        super(Pedido.class);
    }



    /**
     * Retorna los pedidos activos que coinciden con el estado indicado.
     */
    public List<Pedido> buscarPorEstado(EstadoPedido estadoPedido) {
        EntityManager em = emf.createEntityManager();
        try {
            String jpql = "/* Consulta para filtrar pedidos activos segun su estado actual */" +
                    "SELECT p FROM Pedido p WHERE p.estado = :estadoPedido AND p.eliminado = false";
            return em.createQuery(jpql, Pedido.class)
                    .setParameter("estadoPedido", estadoPedido)
                    .getResultList();
        } finally {
            em.close();
        }
    }
}
