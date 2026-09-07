package com.aparcar.api.integration;

import com.aparcar.api.component.IRevokedUserCache;
import com.aparcar.api.config.IntegrationTests;
import com.aparcar.api.entity.auth.AppUser;
import com.aparcar.api.repository.AppUserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.core.context.SecurityContextHolder.getContext;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.securityContext;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@IntegrationTests
public class UserControllerTests {

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private IRevokedUserCache revokedUserCache;

    @Autowired
    private MockMvc mockMvc;

    @AfterEach
    void tearDown() {
        // Clear the repository and cache after each test
        appUserRepository.deleteAll();
        revokedUserCache.clear();
    }

    @Test
    @WithAnonymousUser
    @DisplayName("/users/** should return 401 Unauthorized for anonymous users")
    void shouldReturnUnauthorizedForAnonymousUsers() throws Exception {
        mockMvc.perform(post("/users/activate"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/users/inactive"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("/users/** should return 403 Forbidden for regular users")
    void shouldReturnForbiddenForRegularUsers() throws Exception {
        var context = getContext();
        mockMvc.perform(post("/users/activate")
                        .with(securityContext(context)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/users/inactive")
                        .with(securityContext(context)))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/users")
                        .with(securityContext(context)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    @DisplayName("/users/activate returns 400 Bad Request for invalid email")
    void activateShouldReturnBadRequestForInvalidEmail() throws Exception {
        var context = getContext();
        mockMvc.perform(post("/users/activate")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"invalid-email\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/users/activate")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    @DisplayName("/users/activate returns 200 OK for valid email")
    void activateShouldReturnOkForValidEmail() throws Exception {
        AppUser user = new AppUser();
                user.setNombre("Test User");
                user.setEmail("some@email.com");
        user.setPassword("password");
        user.setIsActive(false);
        appUserRepository.save(user);

        var context = getContext();
        mockMvc.perform(post("/users/activate")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"some@email.com\"}"))
                .andExpect(status().isOk());

        // Verify that the user is now active
        AppUser activatedUser = appUserRepository.findByEmail("some@email.com")
                .orElseThrow(() -> new IllegalStateException("User not found after activation."));

        assertTrue(activatedUser.getIsActive());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    @DisplayName("/users/inactive returns 200 OK with a set of inactive users")
    void inactiveShouldReturnOkWithASetOfInactiveUsers() throws Exception {
        AppUser user1 = new AppUser();
                user1.setNombre("Test User");
                user1.setEmail("some@email.com");
        user1.setPassword("password");
        user1.setIsActive(false);
        AppUser user2 = new AppUser();
                user2.setNombre("Test User");
                user2.setEmail("another@email.com");
        user2.setPassword("password");
        user2.setIsActive(true);
        appUserRepository.save(user1);
        appUserRepository.save(user2);

        var context = getContext();
        mockMvc.perform(get("/users/inactive")
                        .with(securityContext(context)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emails").isArray())
                .andExpect(jsonPath("$.emails.length()", is(1)))
                .andExpect(jsonPath("$.emails[0]").value(user1.getEmail()));
    }

    @Test
    @WithMockUser(authorities = "ADMIN", username = "some@email.com")
    @DisplayName("DELETE /users returns 400 Bad Request for caller email equal to deleted email")
    void deleteShouldReturnBadRequestForInvalidEmail() throws Exception {
        AppUser user = new AppUser();
                user.setNombre("Test User");
                user.setEmail("some@email.com");
        user.setPassword("password");
        user.setIsActive(false);
        appUserRepository.save(user);

        var context = getContext();
        mockMvc.perform(delete("/users")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"some@email.com\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "ADMIN", username = "caller@email.com")
    @DisplayName("DELETE /users returns 200 OK for valid email")
    void deleteShouldReturnOkForValidEmail() throws Exception {
        AppUser user = new AppUser();
                user.setNombre("Test User");
                user.setEmail("some@email.com");
        user.setPassword("password");
        user.setIsActive(false);
        appUserRepository.save(user);

        var context = getContext();
        mockMvc.perform(delete("/users")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"some@email.com\"}"))
                .andExpect(status().isNoContent());

        assertFalse(appUserRepository.existsByEmail(user.getEmail()));
        assertTrue(revokedUserCache.isRevoked(user.getEmail()));
    }
}
