package com.aparcar.api.dto.reserva;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class VisitanteUpdateDto {
    private String telefono;

    @Email(message = "El email no tiene un formato valido")
    private String email;
}