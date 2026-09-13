package com.aparcar.api.service.impl;

import com.aparcar.api.component.IRevokedUserCache;
import com.aparcar.api.dto.auth.UpdateUserDto;
import com.aparcar.api.dto.auth.UserResponseDto;
import com.aparcar.api.entity.auth.AppUser;
import com.aparcar.api.entity.auth.InactiveUsersDto;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.AppUserRepository;
import com.aparcar.api.repository.VisitanteRepository;
import com.aparcar.api.service.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements IUserService {

    private final AppUserRepository appUserRepository;
    private final IRevokedUserCache revokedUserCache;
    private final VisitanteRepository visitanteRepository;

    @Override
    public void activateUser(String email) {
        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found."));

        user.setIsActive(true);

        log.info("Activating user: {}", email);

        appUserRepository.save(user);
    }

    @Override
    public InactiveUsersDto getInactiveUsers() {
        return new InactiveUsersDto(appUserRepository.findInactiveEmails());
    }

    @Override
    public void deleteUser(String email, String callerEmail) {
        if (callerEmail == null) {
            log.error("authentication.getName() returned null.");
            throw new RuntimeException("Could not get caller email.");
        }

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found."));

        if (callerEmail.equals(user.getEmail())) {
            log.error("User {} tried to delete themselves.", callerEmail);
            throw new ValidationException("You cannot delete yourself.");
        }

        log.info("Revoking user's access");
        revokedUserCache.revoke(user.getEmail());

        // Si el usuario habia cargado su propio perfil de visitante (login
        // propio), hay que desvincularlo antes de borrar la cuenta: la FK
        // app_user_id no tiene cascade, y el perfil (con sus reservas) debe
        // seguir existiendo aunque se borre el login.
        visitanteRepository.findByAppUser_Email(email).ifPresent(visitante -> {
            visitante.setAppUser(null);
            visitanteRepository.save(visitante);
        });

        log.info("Deleting user: {}", user.getEmail());
        appUserRepository.delete(user);
    }

    @Override
    public List<UserResponseDto> getUsers() {
        return appUserRepository.findAll()
                .stream()
                .map(this::toResponseDto)
                .toList();
    }

    @Override
    public UserResponseDto updateUser(UUID id, UpdateUserDto dto) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found."));

        user.setNombre(dto.nombre());
        user.setTelefono(dto.telefono());
        user.setAuthorities(new HashSet<>(dto.authorities()));

        AppUser savedUser = appUserRepository.save(user);

        log.info("Updating user: {}", savedUser.getEmail());

        return toResponseDto(savedUser);
    }

    private UserResponseDto toResponseDto(AppUser user) {
        Set<String> authorities = user.getAuthorities() == null
                ? Set.of()
                : user.getAuthorities()
                        .stream()
                        .map(Enum::name)
                        .collect(Collectors.toSet());

        return new UserResponseDto(
                user.getId(),
                user.getNombre(),
                user.getEmail(),
                user.getTelefono(),
                authorities,
                user.getIsActive()
        );
    }
}