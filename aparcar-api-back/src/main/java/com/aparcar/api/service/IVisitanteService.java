package com.aparcar.api.service;

import com.aparcar.api.dto.reserva.VisitanteRequestDto;
import com.aparcar.api.dto.reserva.VisitanteResponseDto;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;

import java.util.List;
import java.util.UUID;

public interface IVisitanteService {
    /**
     * Crea un visitante nuevo.
     *
     * @throws ValidationException Si ya existe un visitante con el mismo documento.
     */
    VisitanteResponseDto crear(VisitanteRequestDto dto);

    /**
     * @throws NotFoundException Si no existe un visitante con ese id.
     */
    VisitanteResponseDto obtenerPorId(UUID id);

    List<VisitanteResponseDto> listar();
}
