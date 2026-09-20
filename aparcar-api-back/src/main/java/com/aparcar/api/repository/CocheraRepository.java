package com.aparcar.api.repository;

import com.aparcar.api.entity.reserva.Cochera;
import com.aparcar.api.entity.reserva.CocheraEstado;
import com.aparcar.api.entity.reserva.CocheraTipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CocheraRepository extends JpaRepository<Cochera, UUID> {
    boolean existsByNumero(String numero);

    List<Cochera> findByEstado(CocheraEstado estado);

    /**
     * Cualquier parametro en null se ignora (no filtra por ese campo). El
     * filtro de sector es parcial e insensible a mayusculas/minusculas.
     */
    @Query("""
            SELECT c FROM Cochera c
            WHERE (:sector IS NULL OR LOWER(c.sector) LIKE LOWER(CONCAT('%', :sector, '%')))
              AND (:tipo IS NULL OR c.tipo = :tipo)
              AND (:estado IS NULL OR c.estado = :estado)
            ORDER BY c.numero
            """)
    List<Cochera> buscar(
            @Param("sector") String sector,
            @Param("tipo") CocheraTipo tipo,
            @Param("estado") CocheraEstado estado);
}