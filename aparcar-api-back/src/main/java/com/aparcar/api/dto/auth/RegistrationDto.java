package com.aparcar.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Alta administrativa desde "Gestion de usuarios": a diferencia del alta
 * operativa, el admin elige la contraseña en vez de derivarla del documento.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegistrationDto {
    @NotEmpty(message = "Name is required")
    @Size(max = 100, message = "Name can't be longer than 100 characters")
    private String nombre;

    @NotEmpty(message = "El documento es obligatorio")
    private String documento;

    @Email
    @NotEmpty(message = "Email is required")
    private String email;

    @NotEmpty(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Size(max = 100, message = "Password can't be longer than 100 characters")
    private String password;

    // Opcional: no todos los visitantes cargan teléfono al registrarse
    private String telefono;
}
