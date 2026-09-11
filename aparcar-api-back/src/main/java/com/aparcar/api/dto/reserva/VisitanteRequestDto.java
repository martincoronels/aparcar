package com.aparcar.api.dto.reserva;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VisitanteRequestDto {
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "El documento es obligatorio")
    private String documento;

    private String telefono;

    @Email(message = "El email no tiene un formato valido")
    private String email;
}
