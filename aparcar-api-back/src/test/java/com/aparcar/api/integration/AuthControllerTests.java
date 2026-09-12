package com.aparcar.api.integration;

import com.aparcar.api.component.IEmailSender;
import com.aparcar.api.config.IntegrationTests;
import com.aparcar.api.dto.email.PlainEmailData;
import com.aparcar.api.entity.auth.AppUser;
import com.aparcar.api.entity.auth.OneTimePassword;
import com.aparcar.api.repository.AppUserRepository;
import com.aparcar.api.repository.OneTimePasswordRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.core.context.SecurityContextHolder.getContext;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.securityContext;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@IntegrationTests
@Import(AuthControllerTests.TestConfig.class)
public class AuthControllerTests {

    @Autowired
    private AppUserRepository userRepository;

    @Autowired
    private OneTimePasswordRepository otpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private IEmailSender emailSender;

    @Autowired
    private MockMvc mockMvc;

    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public IEmailSender emailSender() {
            return mock(IEmailSender.class);
        }
    }

    @AfterEach
    void tearDown() {
        otpRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    @DisplayName("/register validates input")
    void registerValidatesInput() throws Exception {
        var context = getContext();
        mockMvc.perform(post("/register")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content("{ \"nombre\": \"Test User\", \"email\": \"<script>alert(\\\"hacked\\\")</script>\", \"password\": \"123\" }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details").value(containsInAnyOrder(
                        "password: Password must be at least 8 characters long",
                        "email: must be a well-formed email address")));
    }

    @Test
    @WithAnonymousUser
    @DisplayName("/register returns 401 Unauthorized for anonymous users")
    void registerReturnsUnauthorizedForAnonymousUsers() throws Exception {
        mockMvc.perform(post("/register")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content("{ \"nombre\": \"Some Name\", \"email\": \"some@email.com\", \"password\": \"12345678\" }"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("/register returns 403 Forbidden for non-ADMIN users")
    void registerReturnsForbiddenForRegularUsers() throws Exception {
        var context = getContext();
        mockMvc.perform(post("/register")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content("{ \"nombre\": \"Some Name\", \"email\": \"some@email.com\", \"password\": \"12345678\" }"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    @DisplayName("/register creates inactive user")
    void registerCreatesInactiveUser() throws Exception {
        var context = getContext();
        mockMvc.perform(post("/register")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content("{ \"nombre\": \"Some Name\", \"email\": \"some@email.com\", \"password\": \"12345678\" }"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Some Name"))
                .andExpect(jsonPath("$.email").value("some@email.com"))
                .andExpect(jsonPath("$.authorities").isArray())
                .andExpect(jsonPath("$.authorities[0]").value("USER"));

        AppUser user = userRepository.findByEmail("some@email.com")
                .orElseThrow(() -> new IllegalStateException("User not found"));

        assertEquals("Some Name", user.getNombre());
        assertEquals("some@email.com", user.getEmail());
        assertTrue(passwordEncoder.matches("12345678", user.getPassword()));
        assertFalse(user.getIsActive());
    }

    @Test
    @WithMockUser(username = "some@email.com")
    @DisplayName("/login returns username")
    void loginReturnsUsername() throws Exception {
        var context = getContext();
        mockMvc.perform(post("/login")
                        .with(securityContext(context)))
                .andExpect(status().isOk())
                .andExpect(content().string("some@email.com"));
    }

    @Test
    @WithAnonymousUser
    @DisplayName("/forgot-password sends OTP")
    void forgotPasswordSendsOTP() throws Exception {
        doNothing().when(emailSender).sendPlainTextEmail(any(PlainEmailData.class));
        AppUser user = new AppUser();
                user.setNombre("Test User");
                user.setEmail("some@email.com");
        user.setPassword("123");
        user.setIsActive(true);
        userRepository.save(user);

        mockMvc.perform(post("/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content("{ \"email\": \"some@email.com\" }"))
                .andExpect(status().isAccepted());

        ArgumentCaptor<PlainEmailData> captor = ArgumentCaptor.forClass(PlainEmailData.class);
        verify(emailSender, times(1)).sendPlainTextEmail(captor.capture());

        OneTimePassword otp = otpRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        PlainEmailData emailData = captor.getValue();
        assertEquals("some@email.com", emailData.getRecipients().getFirst());
        assertTrue(emailData.getBody().contains(otp.getToken()));
    }

    @Test
    @DisplayName("/reset-password resets password with valid OTP")
    void resetPasswordWithValidOTP() throws Exception {
        doNothing().when(emailSender).sendPlainTextEmail(any(PlainEmailData.class));
        AppUser user = new AppUser();
                user.setNombre("Test User");
                user.setEmail("some@email.com");
        user.setPassword("123");
        user.setIsActive(true);
        userRepository.save(user);

        // Send first forgot password request
        mockMvc.perform(post("/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content("{ \"email\": \"some@email.com\" }"))
                .andExpect(status().isAccepted());

        String firstOtp = otpRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("User not found"))
                .getToken();

        // Send second forgot password request
        mockMvc.perform(post("/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content("{ \"email\": \"some@email.com\" }"))
                .andExpect(status().isAccepted());

        String validOtp = otpRepository.findByUser(user)
                .orElseThrow(() -> new IllegalStateException("User not found"))
                .getToken();

        // Try reset password with the first OTP
        mockMvc.perform(post("/reset-password")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(String.format(
                                "{ \"email\": \"some@email.com\", \"otp\": \"%s\", \"new_password\": \"newpassword123\" }",
                                firstOtp)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("Invalid OTP."));

        // Reset password with the valid OTP
        mockMvc.perform(post("/reset-password")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(String.format(
                                "{ \"email\": \"some@email.com\", \"otp\": \"%s\", \"new_password\": \"newpassword123\" }",
                                validOtp)))
                .andExpect(status().isOk());

        // Verify the password was changed
        AppUser updatedUser = userRepository.findByEmail("some@email.com")
                .orElseThrow(() -> new IllegalStateException("User not found"));

        assertTrue(passwordEncoder.matches("newpassword123", updatedUser.getPassword()));
    }
}
