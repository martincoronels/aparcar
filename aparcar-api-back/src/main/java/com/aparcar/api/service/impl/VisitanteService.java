package com.aparcar.api.service.impl;

import com.aparcar.api.dto.reserva.VisitanteRequestDto;
import com.aparcar.api.dto.reserva.VisitanteResponseDto;
import com.aparcar.api.entity.reserva.Visitante;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.VisitanteRepository;
import com.aparcar.api.service.IVisitanteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VisitanteService implements IVisitanteService {
    private final VisitanteRepository visitanteRepository;

    @Override
    public VisitanteResponseDto crear(VisitanteRequestDto dto) {
        if (visitanteRepository.existsByDocumento(dto.getDocumento())) {
            throw new ValidationException("Ya existe un visitante con ese documento.");
        }

        Visitante visitante = new Visitante();
        visitante.setNombre(dto.getNombre());
        visitante.setDocumento(dto.getDocumento());
        visitante.setTelefono(dto.getTelefono());
        visitante.setEmail(dto.getEmail());

        return toResponseDto(visitanteRepository.save(visitante));
    }

    @Override
    public VisitanteResponseDto obtenerPorId(UUID id) {
        return toResponseDto(buscarPorId(id));
    }

    @Override
    public List<VisitanteResponseDto> listar() {
        return visitanteRepository.findAll().stream().map(this::toResponseDto).toList();
    }

    private Visitante buscarPorId(UUID id) {
        return visitanteRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Visitante no encontrado."));
    }

    private VisitanteResponseDto toResponseDto(Visitante visitante) {
        return new VisitanteResponseDto(
                visitante.getId(),
                visitante.getNombre(),
                visitante.getDocumento(),
                visitante.getTelefono(),
                visitante.getEmail());
    }
}
