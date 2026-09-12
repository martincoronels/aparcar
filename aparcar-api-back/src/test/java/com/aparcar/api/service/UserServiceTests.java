package com.aparcar.api.service;

import com.aparcar.api.component.IRevokedUserCache;
import com.aparcar.api.config.UnitTests;
import com.aparcar.api.entity.auth.AppUser;
import com.aparcar.api.entity.reserva.Visitante;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.AppUserRepository;
import com.aparcar.api.repository.VisitanteRepository;
import com.aparcar.api.service.impl.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@UnitTests
public class UserServiceTests {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private IRevokedUserCache revokedUserCache;

    @Mock
    private VisitanteRepository visitanteRepository;

    @InjectMocks
    private UserService usersService;

    private final String testEmail = "test@mail.com";

    @Test
    @DisplayName("activateUser throws NotFoundException when user not found")
    void activateUserThrowsNotFoundExceptionWhenUserNotFound() {
        // Arrange
        when(appUserRepository.findByEmail(testEmail)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(NotFoundException.class, () -> usersService.activateUser(testEmail));
    }

    @Test
    @DisplayName("activateUser activates user successfully")
    void  activateUserSuccessfully() {
        // Arrange
        var user = new AppUser();
        user.setIsActive(false);
        when(appUserRepository.findByEmail(testEmail)).thenReturn(Optional.of(user));
        when(appUserRepository.save(user)).thenAnswer(i -> i.getArgument(0));

        // Act
        usersService.activateUser(testEmail);

        // Assert
        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(appUserRepository).save(captor.capture());
        AppUser savedUser = captor.getValue();
        assertTrue(savedUser.getIsActive());
    }

    @Test
    @DisplayName("getInactiveUsers returns set of inactive user emails")
    void getInactiveUsersReturnsSetOfInactiveUserEmails() {
        // Arrange
        when(appUserRepository.findInactiveEmails()).thenReturn(Set.of(testEmail));

        // Act
        Set<String> result = usersService.getInactiveUsers().emails();

        // Assert
        assertEquals(1, result.size());
        assertTrue(result.contains(testEmail));
    }

    @Test
    @DisplayName("deleteUser throws RuntimeException when caller email is null")
    void  deleteUserThrowsRuntimeExceptionWhenCallerEmailIsNull() {
        // Act & Assert
        assertThrows(RuntimeException.class, () -> usersService.deleteUser(testEmail, null));
    }

    @Test
    @DisplayName("deleteUser throws NotFoundException when user not found")
    void  deleteUserThrowsNotFoundExceptionWhenUserNotFound() {
        // Arrange
        when(appUserRepository.findByEmail(testEmail)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(NotFoundException.class, () -> usersService.deleteUser(testEmail, "caller@email.com"));
    }

    @Test
    @DisplayName("deleteUser throws ValidationException when user tries to delete themselves")
    void  deleteUserThrowsValidationExceptionWhenUserTriesToDeleteThemselves() {
        // Arrange
        var user = new AppUser();
        user.setEmail(testEmail);
        when(appUserRepository.findByEmail(testEmail)).thenReturn(Optional.of(user));

        // Act & Assert
        assertThrows(ValidationException.class, () -> usersService.deleteUser(testEmail, testEmail));
    }

    @Test
    void deleteUserDeletesUserSuccessfully() {
        // Arrange
        var user = new AppUser();
        user.setEmail(testEmail);
        when(appUserRepository.findByEmail(testEmail)).thenReturn(Optional.of(user));
        doNothing().when(revokedUserCache).revoke(testEmail);
        doNothing().when(appUserRepository).delete(user);

        // Act
        usersService.deleteUser(testEmail, "caller@email.com");

        // Assert
        verify(revokedUserCache).revoke(testEmail);
        verify(appUserRepository).delete(user);
    }

    @Test
    @DisplayName("deleteUser desvincula el visitante propio antes de borrar la cuenta, para no violar la FK")
    void deleteUserUnlinksOwnVisitanteBeforeDeleting() {
        // Arrange: la cuenta tiene un visitante propio (login self-service) vinculado.
        var user = new AppUser();
        user.setEmail(testEmail);

        var visitante = new Visitante();
        visitante.setAppUser(user);

        when(appUserRepository.findByEmail(testEmail)).thenReturn(Optional.of(user));
        when(visitanteRepository.findByAppUser_Email(testEmail)).thenReturn(Optional.of(visitante));
        when(visitanteRepository.save(visitante)).thenReturn(visitante);

        // Act
        usersService.deleteUser(testEmail, "caller@email.com");

        // Assert: el visitante queda desvinculado (y guardado) antes del delete del usuario.
        assertNull(visitante.getAppUser());
        verify(visitanteRepository).save(visitante);
        verify(appUserRepository).delete(user);
    }

    @Test
    @DisplayName("deleteUser no toca visitantes cuando la cuenta no tiene ninguno vinculado")
    void deleteUserDoesNothingToVisitantesWhenNoneLinked() {
        // Arrange
        var user = new AppUser();
        user.setEmail(testEmail);

        when(appUserRepository.findByEmail(testEmail)).thenReturn(Optional.of(user));
        when(visitanteRepository.findByAppUser_Email(testEmail)).thenReturn(Optional.empty());

        // Act
        usersService.deleteUser(testEmail, "caller@email.com");

        // Assert
        verify(visitanteRepository, never()).save(any());
        verify(appUserRepository).delete(user);
    }
}
