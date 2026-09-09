package com.aparcar.api.service.impl;

import com.aparcar.api.dto.reserva.VehiculoRequestDto;
import com.aparcar.api.dto.reserva.VehiculoResponseDto;
import com.aparcar.api.entity.reserva.Vehiculo;
import com.aparcar.api.entity.reserva.Visitante;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.VehiculoRepository;
import com.aparcar.api.repository.VisitanteRepository;
import com.aparcar.api.service.IVehiculoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VehiculoService implements IVehiculoService {
    private final VehiculoRepository vehiculoRepository;
    private final VisitanteRepository visitanteRepository;

    @Override
    public VehiculoResponseDto crear(VehiculoRequestDto dto) {
        Visitante visitante = visitanteRepository.findById(dto.getVisitanteId())
                .orElseThrow(() -> new NotFoundException("Visitante no encontrado."));

        String patente = dto.getPatente().toUpperCase();
        if (vehiculoRepository.existsByPatente(patente)) {
            throw new ValidationException("Ya existe un vehiculo con esa patente.");
        }

        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setPatente(patente);
        vehiculo.setTipo(dto.getTipo());
        vehiculo.setVisitante(visitante);

        return toResponseDto(vehiculoRepository.save(vehiculo));
    }

    @Override
    public VehiculoResponseDto obtenerPorId(UUID id) {
        return toResponseDto(buscarPorId(id));
    }

    @Override
    public List<VehiculoResponseDto> listar() {
        return vehiculoRepository.findAll().stream().map(this::toResponseDto).toList();
    }

    @Override
    public List<VehiculoResponseDto> listarPorVisitante(UUID visitanteId) {
        return vehiculoRepository.findByVisitanteId(visitanteId).stream().map(this::toResponseDto).toList();
    }

    private Vehiculo buscarPorId(UUID id) {
        return vehiculoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vehiculo no encontrado."));
    }

    private VehiculoResponseDto toResponseDto(Vehiculo vehiculo) {
        return new VehiculoResponseDto(
                vehiculo.getId(),
                vehiculo.getPatente(),
                vehiculo.getTipo(),
                vehiculo.getVisitante().getId());
    }
}
