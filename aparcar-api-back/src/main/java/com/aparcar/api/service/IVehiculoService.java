package com.aparcar.api.service;

import com.aparcar.api.dto.reserva.VehiculoRequestDto;
import com.aparcar.api.dto.reserva.VehiculoResponseDto;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;

import java.util.List;
import java.util.UUID;

public interface IVehiculoService {
    /**
     * Crea un vehiculo asociado a un visitante existente.
     *
     * @throws NotFoundException   Si el visitante indicado no existe.
     * @throws ValidationException Si ya existe un vehiculo con la misma patente.
     */
    VehiculoResponseDto crear(VehiculoRequestDto dto);

    /**
     * @throws NotFoundException Si no existe un vehiculo con ese id.
     */
    VehiculoResponseDto obtenerPorId(UUID id);

    List<VehiculoResponseDto> listar();

    List<VehiculoResponseDto> listarPorVisitante(UUID visitanteId);
}
