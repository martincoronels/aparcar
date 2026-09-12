package com.aparcar.api.security;

import com.aparcar.api.entity.auth.AppAuthority;
import com.aparcar.api.entity.auth.AppUser;
import com.aparcar.api.repository.AppUserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

/**
 * Caja blanca: prueba directamente el puente entre AppUser y
 * UserDetails que usa Spring Security para autenticar.
 */
@ExtendWith(MockitoExtension.class)
class AppUserDetailsServiceTests {

    @Mock
    private AppUserRepository appUserRepository;

    @InjectMocks
    private AppUserDetailsService appUserDetailsService;

    @Test
    @DisplayName("loadUserByUsername mapea las authorities del AppUser a GrantedAuthority")
    void loadUserByUsernameMapsAuthorities() {
        AppUser user = new AppUser();
        user.setEmail("mateo@mateo.com");
        user.setPassword("hashed-password");
        user.setAuthorities(Set.of(AppAuthority.USER, AppAuthority.ADMIN));

        when(appUserRepository.findByEmail("mateo@mateo.com")).thenReturn(Optional.of(user));

        UserDetails result = appUserDetailsService.loadUserByUsername("mateo@mateo.com");

        assertEquals("mateo@mateo.com", result.getUsername());
        assertEquals("hashed-password", result.getPassword());
        assertEquals(2, result.getAuthorities().size());
        assertTrue(result.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("USER")));
        assertTrue(result.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ADMIN")));
    }

    @Test
    @DisplayName("loadUserByUsername lanza UsernameNotFoundException si el email no existe")
    void loadUserByUsernameThrowsWhenUserNotFound() {
        when(appUserRepository.findByEmail("no-existe@mateo.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> appUserDetailsService.loadUserByUsername("no-existe@mateo.com"));
    }
}
