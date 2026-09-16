package com.aparcar.api.repository;

import com.aparcar.api.entity.reserva.Reserva;
import com.aparcar.api.entity.reserva.ReservaEstado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, UUID> {
    boolean existsByCocheraIdAndFechaAndEstado(UUID cocheraId, LocalDate fecha, ReservaEstado estado);

    List<Reserva> findByFechaAndEstado(LocalDate fecha, ReservaEstado estado);

    boolean existsByCocheraId(UUID cocheraId);

    List<Reserva> findByCocheraIdAndEstado(UUID cocheraId, ReservaEstado estado);

    boolean existsByVehiculoId(UUID vehiculoId);
}