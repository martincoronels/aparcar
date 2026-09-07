package com.aparcar.api.entity.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "app_users")
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nombre;

    private String email;
    private String password;

    private String telefono;

    @ElementCollection(targetClass = AppAuthority.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "app_user_authorities", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "authority")
    private Set<AppAuthority> authorities;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    public AppUser(String nombre, String email, String password, String telefono,
                   Set<AppAuthority> authorities, Boolean isActive) {
        this.nombre = nombre;
        this.email = email;
        this.password = password;
        this.telefono = telefono;
        this.authorities = authorities;
        this.isActive = isActive;
    }
}
