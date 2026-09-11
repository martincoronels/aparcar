package com.aparcar.api.repository;

import com.aparcar.api.entity.reserva.Cochera;
import com.aparcar.api.entity.reserva.CocheraEstado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CocheraRepository extends JpaRepository<Cochera, UUID> {
    boolean existsByNumero(String numero);

    List<Cochera> findByEstado(CocheraEstado estado);
}
