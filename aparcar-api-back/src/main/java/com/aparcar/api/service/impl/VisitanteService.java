package com.aparcar.api.service.impl;

import com.aparcar.api.dto.reserva.VisitanteRequestDto;
import com.aparcar.api.dto.reserva.VisitanteResponseDto;
import com.aparcar.api.entity.auth.AppUser;
import com.aparcar.api.entity.reserva.Visitante;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.AppUserRepository;
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
    private final AppUserRepository appUserRepository;

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

    @Override
    public VisitanteResponseDto obtenerPropio(String email) {
        return visitanteRepository.findByAppUser_Email(email)
                .map(this::toResponseDto)
                .orElseThrow(() -> new NotFoundException("Todavia no cargaste tus datos de visitante."));
    }

    @Override
    public VisitanteResponseDto crearPropio(String email, VisitanteRequestDto dto) {
        if (visitanteRepository.existsByAppUser_Email(email)) {
            throw new ValidationException("Tu cuenta ya tiene un visitante cargado.");
        }

        if (visitanteRepository.existsByDocumento(dto.getDocumento())) {
            throw new ValidationException("Ya existe un visitante con ese documento.");
        }

        AppUser appUser = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado."));

        Visitante visitante = new Visitante();
        visitante.setNombre(dto.getNombre());
        visitante.setDocumento(dto.getDocumento());
        visitante.setTelefono(dto.getTelefono());
        visitante.setEmail(dto.getEmail());
        visitante.setAppUser(appUser);

        return toResponseDto(visitanteRepository.save(visitante));
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
