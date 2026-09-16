package com.aparcar.api.integration;

import com.aparcar.api.config.IntegrationTests;
import com.aparcar.api.entity.auth.AppAuthority;
import com.aparcar.api.entity.auth.AppUser;
import com.aparcar.api.entity.reserva.Vehiculo;
import com.aparcar.api.entity.reserva.VehiculoTipo;
import com.aparcar.api.entity.reserva.Visitante;
import com.aparcar.api.repository.VehiculoRepository;
import com.aparcar.api.repository.AppUserRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Caja negra para /api/v1/vehiculos.
 */
@IntegrationTests
public class VehiculoControllerTests {

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @Autowired
    private VisitanteRepository visitanteRepository;

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

    private Visitante crearVisitante(String documento, AppUser appUser) {
        Visitante visitante = new Visitante();
        visitante.setNombre("Juan Perez");
        visitante.setDocumento(documento);
        visitante.setAppUser(appUser);
        return visitanteRepository.save(visitante);
    }

    private Vehiculo crearVehiculo(String patente, VehiculoTipo tipo, Visitante visitante) {
        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setPatente(patente);
        vehiculo.setTipo(tipo);
        vehiculo.setVisitante(visitante);
        return vehiculoRepository.save(vehiculo);
    }

    // ---- Seguridad ----

    @Test
    @WithAnonymousUser
    @DisplayName("[Caja negra] endpoints de vehiculos devuelven 401 para anonimos")
    void devuelve401ParaAnonimos() throws Exception {
        mockMvc.perform(get("/api/v1/vehiculos")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/vehiculos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    // ---- Crear ----

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] POST /api/v1/vehiculos devuelve 400 si la patente tiene formato invalido")
    void crearDevuelve400SiPatenteTieneFormatoInvalido() throws Exception {
        Visitante visitante = crearVisitante("30111222", null);
        var context = getContext();

        mockMvc.perform(post("/api/v1/vehiculos")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patente\":\"12345\",\"tipo\":\"AUTO\",\"visitanteId\":\"" + visitante.getId() + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] POST /api/v1/vehiculos devuelve 404 si el visitante no existe")
    void crearDevuelve404SiVisitanteNoExiste() throws Exception {
        var context = getContext();

        mockMvc.perform(post("/api/v1/vehiculos")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patente\":\"ABC123\",\"tipo\":\"AUTO\",\"visitanteId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] POST /api/v1/vehiculos devuelve 201 y normaliza la patente a mayusculas")
    void crearDevuelve201YNormalizaPatente() throws Exception {
        Visitante visitante = crearVisitante("30111222", null);
        var context = getContext();

        mockMvc.perform(post("/api/v1/vehiculos")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patente\":\"abc123\",\"tipo\":\"AUTO\",\"visitanteId\":\"" + visitante.getId() + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.patente").value("ABC123"))
                .andExpect(jsonPath("$.visitanteId").value(visitante.getId().toString()));
    }

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] POST /api/v1/vehiculos devuelve 400 si la patente ya existe")
    void crearDevuelve400SiPatenteYaExiste() throws Exception {
        Visitante visitante = crearVisitante("30111222", null);
        crearVehiculo("ABC123", VehiculoTipo.AUTO, visitante);
        var context = getContext();

        mockMvc.perform(post("/api/v1/vehiculos")
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patente\":\"ABC123\",\"tipo\":\"MOTO\",\"visitanteId\":\"" + visitante.getId() + "\"}"))
                .andExpect(status().isBadRequest());
    }

    // ---- Listar ----

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] GET /api/v1/vehiculos sin filtro devuelve todos los vehiculos")
    void listarSinFiltroDevuelveTodos() throws Exception {
        Visitante v1 = crearVisitante("30111222", null);
        Visitante v2 = crearVisitante("30111333", null);
        crearVehiculo("AAA111", VehiculoTipo.AUTO, v1);
        crearVehiculo("BBB222", VehiculoTipo.MOTO, v2);
        var context = getContext();

        mockMvc.perform(get("/api/v1/vehiculos").with(securityContext(context)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] GET /api/v1/vehiculos?visitanteId filtra solo los de ese visitante")
    void listarConFiltroDevuelveSoloLosDeEseVisitante() throws Exception {
        Visitante v1 = crearVisitante("30111222", null);
        Visitante v2 = crearVisitante("30111333", null);
        crearVehiculo("AAA111", VehiculoTipo.AUTO, v1);
        crearVehiculo("BBB222", VehiculoTipo.MOTO, v2);
        var context = getContext();

        mockMvc.perform(get("/api/v1/vehiculos").param("visitanteId", v1.getId().toString()).with(securityContext(context)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].patente").value("AAA111"));
    }

    // ---- Obtener por id ----

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] GET /api/v1/vehiculos/{id} devuelve 404 si no existe")
    void obtenerPorIdDevuelve404SiNoExiste() throws Exception {
        var context = getContext();

        mockMvc.perform(get("/api/v1/vehiculos/" + UUID.randomUUID()).with(securityContext(context)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(authorities = "USER")
    @DisplayName("[Caja negra] GET /api/v1/vehiculos/{id} devuelve 200 con el vehiculo cuando existe")
    void obtenerPorIdDevuelve200CuandoExiste() throws Exception {
        Visitante visitante = crearVisitante("30111222", null);
        Vehiculo vehiculo = crearVehiculo("ABC123", VehiculoTipo.AUTO, visitante);
        var context = getContext();

        mockMvc.perform(get("/api/v1/vehiculos/" + vehiculo.getId()).with(securityContext(context)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patente").value("ABC123"));
    }

    @Test
    @WithMockUser(username = "dueño@test.com", authorities = "USER")
    @DisplayName("[Caja negra] PUT /api/v1/vehiculos/{id} devuelve 403 si no es el dueño")
    void editarDevuelve403SiNoEsElDueño() throws Exception {
        // El vehiculo pertenece a "otro@test.com"; quien hace el request es "dueño@test.com" -> no coinciden.
        AppUser propietarioReal = crearAppUser("otro@test.com");
        Visitante visitante = crearVisitante("30111222", propietarioReal);
        Vehiculo vehiculo = crearVehiculo("ABC123", VehiculoTipo.AUTO, visitante);
        var context = getContext();

        mockMvc.perform(put("/api/v1/vehiculos/" + vehiculo.getId())
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patente\":\"XYZ999\",\"tipo\":\"MOTO\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "dueño@test.com", authorities = "USER")
    @DisplayName("[Caja negra] PUT /api/v1/vehiculos/{id} permite al dueño editar su vehiculo")
    void editarPermiteAlDueñoEditarSuVehiculo() throws Exception {
        // El email del AppUser tiene que coincidir con el username del @WithMockUser.
        AppUser dueño = crearAppUser("dueño@test.com");
        Visitante visitante = crearVisitante("30111222", dueño);
        Vehiculo vehiculo = crearVehiculo("ABC123", VehiculoTipo.AUTO, visitante);
        var context = getContext();

        mockMvc.perform(put("/api/v1/vehiculos/" + vehiculo.getId())
                        .with(securityContext(context))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"patente\":\"XYZ999\",\"tipo\":\"MOTO\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patente").value("XYZ999"));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    @DisplayName("[Caja negra] DELETE /api/v1/vehiculos/{id} devuelve 204 cuando no tiene reservas")
    void eliminarDevuelve204CuandoNoTieneReservas() throws Exception {
        Visitante visitante = crearVisitante("30111222", null);
        Vehiculo vehiculo = crearVehiculo("ABC123", VehiculoTipo.AUTO, visitante);
        var context = getContext();

        mockMvc.perform(delete("/api/v1/vehiculos/" + vehiculo.getId()).with(securityContext(context)))
                .andExpect(status().isNoContent());
    }
}