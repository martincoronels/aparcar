package com.aparcar.api.service.impl;

import com.aparcar.api.dto.reserva.CocheraRequestDto;
import com.aparcar.api.dto.reserva.CocheraResponseDto;
import com.aparcar.api.entity.reserva.Cochera;
import com.aparcar.api.entity.reserva.CocheraEstado;
import com.aparcar.api.entity.reserva.CocheraTipo;
import com.aparcar.api.entity.reserva.ReservaEstado;
import com.aparcar.api.entity.reserva.VehiculoTipo;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.CocheraRepository;
import com.aparcar.api.repository.ReservaRepository;
import com.aparcar.api.service.ICocheraService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CocheraService implements ICocheraService {
    private final CocheraRepository cocheraRepository;
    private final ReservaRepository reservaRepository;

    @Override
    public CocheraResponseDto crear(CocheraRequestDto dto) {
        if (cocheraRepository.existsByNumero(dto.getNumero())) {
            throw new ValidationException("Ya existe una cochera con ese numero.");
        }

        Cochera cochera = new Cochera();
        cochera.setNumero(dto.getNumero());
        cochera.setSector(dto.getSector());
        cochera.setTipo(dto.getTipo());
        cochera.setEstado(dto.getEstado());

        return toResponseDto(cocheraRepository.save(cochera));
    }

    @Override
    public List<CocheraResponseDto> listar() {
        return cocheraRepository.findAll().stream().map(this::toResponseDto).toList();
    }

    @Override
    public List<CocheraResponseDto> listarDisponibles(LocalDate fecha, VehiculoTipo tipoVehiculo) {
        Set<UUID> ocupadas = reservaRepository.findByFechaAndEstado(fecha, ReservaEstado.CONFIRMADA).stream()
                .map(reserva -> reserva.getCochera().getId())
                .collect(Collectors.toSet());

        return cocheraRepository.findByEstado(CocheraEstado.HABILITADA).stream()
                .filter(cochera -> !ocupadas.contains(cochera.getId()))
                .filter(cochera -> esCompatible(cochera.getTipo(), tipoVehiculo))
                .map(this::toResponseDto)
                .toList();
    }

    private boolean esCompatible(CocheraTipo cocheraTipo, VehiculoTipo tipoVehiculo) {
        if (tipoVehiculo == null || cocheraTipo == CocheraTipo.ACCESIBLE) {
            return true;
        }
        return cocheraTipo.name().equals(tipoVehiculo.name());
    }

    private CocheraResponseDto toResponseDto(Cochera cochera) {
        return new CocheraResponseDto(
                cochera.getId(),
                cochera.getNumero(),
                cochera.getSector(),
                cochera.getTipo(),
                cochera.getEstado());
    }
}
