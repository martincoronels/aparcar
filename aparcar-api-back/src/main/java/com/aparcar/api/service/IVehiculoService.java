package com.aparcar.api.service;

import com.aparcar.api.dto.reserva.VehiculoRequestDto;
import com.aparcar.api.dto.reserva.VehiculoResponseDto;
import com.aparcar.api.dto.reserva.VehiculoUpdateDto;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;

import java.util.List;
import java.util.UUID;

public interface IVehiculoService {
    /**
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

    /**
     * @throws NotFoundException                                     Si no existe un vehiculo con ese id.
     * @throws ValidationException                                   Si la patente nueva ya esta en uso.
     * @throws org.springframework.security.access.AccessDeniedException Si quien pide no es ADMIN ni el dueño.
     */
    VehiculoResponseDto editar(UUID id, VehiculoUpdateDto dto, String requesterEmail, boolean requesterIsAdmin);

    /**
     * @throws NotFoundException                                     Si no existe un vehiculo con ese id.
     * @throws ValidationException                                   Si el vehiculo tiene reservas asociadas.
     * @throws org.springframework.security.access.AccessDeniedException Si quien pide no es ADMIN ni el dueño.
     */
    void eliminar(UUID id, String requesterEmail, boolean requesterIsAdmin);
}