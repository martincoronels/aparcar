package com.aparcar.api.dto.reserva;

import com.aparcar.api.entity.reserva.VehiculoTipo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.UUID;

@Data
public class VehiculoRequestDto {
    // Acepta formato argentino viejo (AAA000) y Mercosur (AA000AA)
    @NotBlank(message = "La patente es obligatoria")
    @Pattern(
            regexp = "^([A-Za-z]{3}[0-9]{3}|[A-Za-z]{2}[0-9]{3}[A-Za-z]{2})$",
            message = "La patente debe tener formato AAA000 o AA000AA"
    )
    private String patente;

    @NotNull(message = "El tipo de vehiculo es obligatorio")
    private VehiculoTipo tipo;

    @NotNull(message = "El visitante es obligatorio")
    private UUID visitanteId;
}
