package com.aparcar.api.integration;

import com.aparcar.api.config.IntegrationTests;
import com.aparcar.api.entity.auth.AppAuthority;
import com.aparcar.api.entity.auth.AppUser;
import com.aparcar.api.entity.reserva.Visitante;
import com.aparcar.api.repository.AppUserRepository;
import com.aparcar.api.repository.VehiculoRepository;
import com.aparcar.api.repository.VisitanteRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;
import java.util.UUID;

import static org.springframework.security.core.context.SecurityContextHolder.getContext;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.securityContext;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Caja negra para /api/v1/visitantes, con foco en /me: el visitante carga
 * su propio perfil desde su cuenta de login (sin pasar por un admin).
 */
@IntegrationTests
public class VisitanteControllerTests {

    @Autowired
    private VisitanteRepository visitanteRepository;

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private MockMvc mockMvc;

    @AfterEach
    void tearDown() {
        vehiculoRepository.deleteAll();
        visitanteRepository.deleteAll();
        appUserRepository.deleteAll();
    }

    private AppUser crearAppUser(String email) {
        AppUser user = new AppUser();
        user.setNombre("Cuenta de prueba");
        user.setEmail(email);
        user.setPassword("hash-irrelevante");
        user.setAuthorities(Set.of(AppAuthority.USER));
        user.setIsActive(true);
        return appUserRepository.save(user);
    }

    private Visitante crearVisitante(String nombre, String documento, AppUser appUser) {
        Visitante visitante = new Visitante();
        visitante.setNombre(nombre);
        visitante.setDocumento(documento);
        visitante.setAppUser(appUser);
        return visitanteRepository.save(visitante);
    }

    // ---- Seguridad ----

    @Test
    @WithAnonymousUser
    @DisplayName("[Caja negra] endpoints de visitantes devuelven 401 para anonimos")
    void devuelve401ParaAnonimos() throws Exception {
        mockMvc.perform(get("/api/v1/visitantes")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/visitantes/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/visitantes/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // ---- Crear (flujo admin) ----

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] POST /api/v1/visitantes devuelve 400 si falta el nombre")
    void crearDevuelve400SiFaltaNombre() throws Exception {
        var context = getContext();

        mockMvc.perform(post("/api/v1/visitantes")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"documento\":\"30111222\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] POST /api/v1/visitantes devuelve 201 con datos validos")
    void crearDevuelve201ConDatosValidos() throws Exception {
        var context = getContext();

        mockMvc.perform(post("/api/v1/visitantes")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Juan Perez\",\"documento\":\"30111222\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Juan Perez"));
    }

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] POST /api/v1/visitantes devuelve 400 si el documento ya existe")
    void crearDevuelve400SiDocumentoYaExiste() throws Exception {
        crearVisitante("Juan Perez", "30111222", null);
        var context = getContext();

        mockMvc.perform(post("/api/v1/visitantes")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Otro Nombre\",\"documento\":\"30111222\"}"))
                .andExpect(status().isBadRequest());
    }

    // ---- Obtener por id ----

    @Test
    @WithMockUser(authorities = "ADMIN")
    @DisplayName("[Caja negra] GET /api/v1/visitantes/{id} devuelve 404 si no existe")
    void obtenerPorIdDevuelve404SiNoExiste() throws Exception {
        var context = getContext();

        mockMvc.perform(get("/api/v1/visitantes/" + UUID.randomUUID()).with(securityContext(context)))
                .andExpect(status().isNotFound());
    }

    // ---- /me: obtener el perfil propio ----

    @Test
    @WithMockUser(username = "visitante@test.com", authorities = "USER")
    @DisplayName("[Caja negra] GET /api/v1/visitantes/me devuelve 404 si la cuenta todavia no cargo su perfil")
    void obtenerPropioDevuelve404SiNoTienePerfil() throws Exception {
        crearAppUser("visitante@test.com");
        var context = getContext();

        mockMvc.perform(get("/api/v1/visitantes/me").with(securityContext(context)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "visitante@test.com", authorities = "USER")
    @DisplayName("[Caja negra] GET /api/v1/visitantes/me devuelve el perfil vinculado a la cuenta autenticada")
    void obtenerPropioDevuelveElPerfilPropio() throws Exception {
        AppUser appUser = crearAppUser("visitante@test.com");
        crearVisitante("Visitante Propio", "40222333", appUser);
        var context = getContext();

        mockMvc.perform(get("/api/v1/visitantes/me").with(securityContext(context)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Visitante Propio"))
                .andExpect(jsonPath("$.documento").value("40222333"));
    }

    // ---- /me: crear el perfil propio ----

    @Test
    @WithMockUser(username = "visitante@test.com", authorities = "USER")
    @DisplayName("[Caja negra] POST /api/v1/visitantes/me crea el perfil vinculado a la cuenta autenticada")
    void crearPropioCreaElPerfilVinculado() throws Exception {
        crearAppUser("visitante@test.com");
        var context = getContext();

        mockMvc.perform(post("/api/v1/visitantes/me")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Visitante Propio\",\"documento\":\"40222333\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Visitante Propio"));

        // Y a partir de aca, GET /me ya lo tiene que encontrar.
        mockMvc.perform(get("/api/v1/visitantes/me").with(securityContext(context)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documento").value("40222333"));
    }

    @Test
    @WithMockUser(username = "visitante@test.com", authorities = "USER")
    @DisplayName("[Caja negra] POST /api/v1/visitantes/me devuelve 400 si la cuenta ya tiene un perfil cargado")
    void crearPropioDevuelve400SiYaTienePerfil() throws Exception {
        AppUser appUser = crearAppUser("visitante@test.com");
        crearVisitante("Visitante Propio", "40222333", appUser);
        var context = getContext();

        mockMvc.perform(post("/api/v1/visitantes/me")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Otro Nombre\",\"documento\":\"50333444\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "visitante@test.com", authorities = "USER")
    @DisplayName("[Caja negra] POST /api/v1/visitantes/me devuelve 400 si el documento ya esta en uso por otro visitante")
    void crearPropioDevuelve400SiDocumentoYaEstaEnUso() throws Exception {
        crearVisitante("Otra Persona", "40222333", null);
        crearAppUser("visitante@test.com");
        var context = getContext();

        mockMvc.perform(post("/api/v1/visitantes/me")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Visitante Propio\",\"documento\":\"40222333\"}"))
                .andExpect(status().isBadRequest());
    }
}
