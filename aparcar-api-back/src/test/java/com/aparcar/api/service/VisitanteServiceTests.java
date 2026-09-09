package com.aparcar.api.service;

import com.aparcar.api.config.UnitTests;
import com.aparcar.api.dto.reserva.VisitanteRequestDto;
import com.aparcar.api.entity.reserva.Visitante;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.VisitanteRepository;
import com.aparcar.api.service.impl.VisitanteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@UnitTests
public class VisitanteServiceTests {

    @Mock
    private VisitanteRepository visitanteRepository;

    @InjectMocks
    private VisitanteService visitanteService;

    private VisitanteRequestDto dto;

    @BeforeEach
    void setUp() {
        dto = new VisitanteRequestDto();
        dto.setNombre("Juan Perez");
        dto.setDocumento("30111222");
        dto.setTelefono("11-4444-5555");
        dto.setEmail("juan@mail.com");
    }

    @Test
    @DisplayName("crear lanza ValidationException si ya existe un visitante con el mismo documento")
    void crearLanzaValidationExceptionSiDocumentoYaExiste() {
        when(visitanteRepository.existsByDocumento(dto.getDocumento())).thenReturn(true);

        assertThrows(ValidationException.class, () -> visitanteService.crear(dto));
    }

    @Test
    @DisplayName("crear guarda el visitante cuando el documento no esta repetido")
    void crearGuardaVisitanteCuandoDocumentoNoEstaRepetido() {
        when(visitanteRepository.existsByDocumento(dto.getDocumento())).thenReturn(false);
        when(visitanteRepository.save(any())).thenAnswer(i -> {
            Visitante v = i.getArgument(0);
            v.setId(UUID.randomUUID());
            return v;
        });

        var response = visitanteService.crear(dto);

        assertEquals(dto.getNombre(), response.nombre());
        assertEquals(dto.getDocumento(), response.documento());
    }

    @Test
    @DisplayName("obtenerPorId lanza NotFoundException si el visitante no existe")
    void obtenerPorIdLanzaNotFoundExceptionSiNoExiste() {
        UUID id = UUID.randomUUID();
        when(visitanteRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> visitanteService.obtenerPorId(id));
    }

    @Test
    @DisplayName("obtenerPorId devuelve el visitante cuando existe")
    void obtenerPorIdDevuelveVisitanteCuandoExiste() {
        Visitante visitante = new Visitante();
        visitante.setId(UUID.randomUUID());
        visitante.setNombre("Juan Perez");
        visitante.setDocumento("30111222");
        when(visitanteRepository.findById(visitante.getId())).thenReturn(Optional.of(visitante));

        var response = visitanteService.obtenerPorId(visitante.getId());

        assertEquals(visitante.getId(), response.id());
    }

    @Test
    @DisplayName("listar devuelve todos los visitantes")
    void listarDevuelveTodosLosVisitantes() {
        Visitante visitante = new Visitante();
        visitante.setId(UUID.randomUUID());
        when(visitanteRepository.findAll()).thenReturn(List.of(visitante));

        var response = visitanteService.listar();

        assertEquals(1, response.size());
    }
}
