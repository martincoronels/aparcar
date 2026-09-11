package com.aparcar.api.dto.reserva;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class ReservaRequestDto {
    @NotNull(message = "El visitante es obligatorio")
    private UUID visitanteId;

    @NotNull(message = "El vehiculo es obligatorio")
    private UUID vehiculoId;

    @NotNull(message = "La cochera es obligatoria")
    private UUID cocheraId;

    @NotNull(message = "La fecha es obligatoria")
    @FutureOrPresent(message = "La fecha no puede ser anterior a hoy")
    private LocalDate fecha;
}
