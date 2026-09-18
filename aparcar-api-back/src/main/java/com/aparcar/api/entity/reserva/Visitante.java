package com.aparcar.api.entity.reserva;

import com.aparcar.api.entity.auth.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "visitantes")
public class Visitante {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false, unique = true)
    private String documento;

    private String telefono;

    private String email;

    // Cuenta con la que el propio visitante inicia sesion para cargar sus
    // datos. Nula para visitantes cargados por un admin sin cuenta propia.
    @OneToOne
    @JoinColumn(name = "app_user_id", unique = true)
    private AppUser appUser;
}
