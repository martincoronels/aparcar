package com.aparcar.api.service;

import com.aparcar.api.dto.reserva.ReservaRequestDto;
import com.aparcar.api.dto.reserva.ReservaResponseDto;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;

import java.util.List;
import java.util.UUID;

public interface IReservaService {
    /**
     * Crea una reserva CONFIRMADA validando:
     * <ul>
     *     <li>Que visitante, vehiculo y cochera existan.</li>
     *     <li>Que el vehiculo pertenezca al visitante indicado.</li>
     *     <li>Que el tipo de la cochera sea compatible con el tipo del vehiculo
     *     (ACCESIBLE acepta cualquier tipo; el resto debe coincidir exactamente).</li>
     *     <li>Que la cochera no tenga ya otra reserva CONFIRMADA en la misma fecha.</li>
     * </ul>
     *
     * @throws NotFoundException   Si visitante, vehiculo o cochera no existen.
     * @throws ValidationException Si no se cumple alguna regla de negocio.
     */
    ReservaResponseDto crear(ReservaRequestDto dto);

    /**
     * @throws NotFoundException Si no existe una reserva con ese id.
     */
    ReservaResponseDto obtenerPorId(UUID id);

    List<ReservaResponseDto> listar();
}
