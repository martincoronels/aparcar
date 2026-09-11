package com.aparcar.api.security.securityConfig;

import com.aparcar.api.component.IRevokedUserCache;
import com.aparcar.api.filters.JWTGeneratorFilter;
import com.aparcar.api.filters.JWTValidationFilter;
import com.aparcar.api.filters.RateLimitFilter;
import com.aparcar.api.security.CustomBasicAuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Arrays;
import java.util.List;

import static com.aparcar.api.config.ApplicationConstants.*;

/**
 * Security configuration for the development environment only.
 * Provides relaxed CORS settings (localhost) and a lower BCrypt strength.
 */
@Configuration
@Profile(DEV_ENV)
public class DevSecurityConfig {

    /**
     * Configures the SecurityContextRepository to support both Request Attributes
     * and Session.
     * This is crucial for MockMvc and @WithMockUser to function correctly in a
     * stateless environment.
     *
     * @return A DelegatingSecurityContextRepository combining multiple strategies.
     */
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new DelegatingSecurityContextRepository(
                new RequestAttributeSecurityContextRepository(),
                new HttpSessionSecurityContextRepository());
    }

    /**
     * Configures the security filter chain for dev/test profiles.
     * Includes JWT filters, rate limiting, and basic authentication.
     *
     * @param http                      The HttpSecurity builder.
     * @param revokedUserCache          Cache for revoked tokens.
     * @param securityContextRepository The repository for capturing security
     *                                  context.
     * @param env                       The Spring environment for accessing
     *                                  properties.
     * @return The configured SecurityFilterChain.
     */
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            IRevokedUserCache revokedUserCache,
            SecurityContextRepository securityContextRepository,
            Environment env) {
        String secret = env.getProperty(JWT_SECRET_KEY, JWT_SECRET_DEFAULT);
        boolean isDev = Arrays.asList(env.getActiveProfiles()).contains(DEV_ENV);

        JWTValidationFilter jwtValidationFilter = new JWTValidationFilter(revokedUserCache, secret, isDev);
        JWTGeneratorFilter jwtGeneratorFilter = new JWTGeneratorFilter(secret);
        RateLimitFilter rateLimitFilter = new RateLimitFilter();

        return http
                .securityContext(context -> context.securityContextRepository(securityContextRepository))
                .sessionManagement(config -> config.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .cors(corsCustomizer -> corsCustomizer.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOriginPatterns(List.of("http://localhost:*"));
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
                    config.setExposedHeaders(List.of("Authorization"));
                    config.setAllowCredentials(true);
                    config.setMaxAge(3600L);
                    return config;
                }))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(requests -> requests
                        .requestMatchers("/users/**").hasAuthority("ADMIN")
                        .requestMatchers("/api/v1/reservas/**", "/api/v1/vehiculos/**", "/api/v1/visitantes/**",
                                "/login").authenticated()
                        .requestMatchers("/api/v1/cocheras/disponibles", "/register", "/forgot-password",
                                "/reset-password", "/actuator/health").permitAll()
                        .requestMatchers("/**").permitAll())
                .addFilterAfter(jwtGeneratorFilter, BasicAuthenticationFilter.class)
                .addFilterBefore(jwtValidationFilter, BasicAuthenticationFilter.class)
                .addFilterBefore(rateLimitFilter, JWTValidationFilter.class)
                .httpBasic(config -> config.authenticationEntryPoint(new CustomBasicAuthenticationEntryPoint()))
                .build();
    }

    /**
     * Provides a BCryptPasswordEncoder for password hashing.
     *
     * @return A BCryptPasswordEncoder instance.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
