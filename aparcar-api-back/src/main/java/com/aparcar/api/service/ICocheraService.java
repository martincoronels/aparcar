package com.aparcar.api.service;

import com.aparcar.api.dto.reserva.CocheraRequestDto;
import com.aparcar.api.dto.reserva.CocheraResponseDto;
import com.aparcar.api.entity.reserva.VehiculoTipo;
import com.aparcar.api.exception.ValidationException;

import java.time.LocalDate;
import java.util.List;

public interface ICocheraService {
    /**
     * @throws ValidationException Si ya existe una cochera con el mismo numero.
     */
    CocheraResponseDto crear(CocheraRequestDto dto);

    List<CocheraResponseDto> listar();

    /**
     * Cocheras habilitadas sin una reserva CONFIRMADA en esa fecha. Si se
     * indica tipoVehiculo, solo devuelve las compatibles (ver regla de
     * compatibilidad en {@link IReservaService}).
     */
    List<CocheraResponseDto> listarDisponibles(LocalDate fecha, VehiculoTipo tipoVehiculo);
}
