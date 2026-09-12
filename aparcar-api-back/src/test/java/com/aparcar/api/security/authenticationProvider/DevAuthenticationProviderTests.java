package com.aparcar.api.security.authenticationProvider;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

/**
 * Caja blanca: documenta explícitamente el comportamiento "inseguro a
 * propósito" del provider de dev — no valida la contraseña, cualquier
 * valor entra siempre que el email exista. Esto es lo que permitió
 * loguearse con cualquier contraseña durante las pruebas manuales.
 */
@ExtendWith(MockitoExtension.class)
class DevAuthenticationProviderTests {

    @Mock
    private UserDetailsService userDetailsService;

    @InjectMocks
    private DevAuthenticationProvider provider;

    @Test
    @DisplayName("autentica exitosamente sin importar la contraseña, si el usuario existe")
    void authenticatesRegardlessOfPassword() {
        UserDetails userDetails = new User(
                "mateo@mateo.com", "hashed-real-password", List.of(new SimpleGrantedAuthority("USER")));
        when(userDetailsService.loadUserByUsername("mateo@mateo.com")).thenReturn(userDetails);

        Authentication input = new UsernamePasswordAuthenticationToken("mateo@mateo.com", "cualquier-cosa-123");
        Authentication result = provider.authenticate(input);

        assertEquals("mateo@mateo.com", result.getName());
        assertEquals(1, result.getAuthorities().size());
    }

    @Test
    @DisplayName("propaga UsernameNotFoundException si el email no existe")
    void throwsWhenUserDoesNotExist() {
        when(userDetailsService.loadUserByUsername("no-existe@mateo.com"))
                .thenThrow(new UsernameNotFoundException("User not found for email no-existe@mateo.com"));

        Authentication input = new UsernamePasswordAuthenticationToken("no-existe@mateo.com", "algo");

        assertThrows(UsernameNotFoundException.class, () -> provider.authenticate(input));
    }

    @Test
    @DisplayName("supports() solo acepta UsernamePasswordAuthenticationToken")
    void supportsOnlyUsernamePasswordAuthenticationToken() {
        assertEquals(true, provider.supports(UsernamePasswordAuthenticationToken.class));
    }
}
