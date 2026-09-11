package com.aparcar.api.repository;

import com.aparcar.api.entity.reserva.Visitante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface VisitanteRepository extends JpaRepository<Visitante, UUID> {
    boolean existsByDocumento(String documento);
}
