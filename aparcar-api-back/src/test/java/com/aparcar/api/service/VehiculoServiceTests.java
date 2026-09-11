package com.aparcar.api.service;

import com.aparcar.api.config.UnitTests;
import com.aparcar.api.dto.reserva.VehiculoRequestDto;
import com.aparcar.api.entity.reserva.Vehiculo;
import com.aparcar.api.entity.reserva.VehiculoTipo;
import com.aparcar.api.entity.reserva.Visitante;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.VehiculoRepository;
import com.aparcar.api.repository.VisitanteRepository;
import com.aparcar.api.service.impl.VehiculoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@UnitTests
public class VehiculoServiceTests {

    @Mock
    private VehiculoRepository vehiculoRepository;

    @Mock
    private VisitanteRepository visitanteRepository;

    @InjectMocks
    private VehiculoService vehiculoService;

    private Visitante visitante;
    private VehiculoRequestDto dto;

    @BeforeEach
    void setUp() {
        visitante = new Visitante();
        visitante.setId(UUID.randomUUID());

        dto = new VehiculoRequestDto();
        dto.setPatente("abc123");
        dto.setTipo(VehiculoTipo.AUTO);
        dto.setVisitanteId(visitante.getId());
    }

    @Test
    @DisplayName("crear lanza NotFoundException si el visitante no existe")
    void crearLanzaNotFoundExceptionSiVisitanteNoExiste() {
        when(visitanteRepository.findById(visitante.getId())).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> vehiculoService.crear(dto));
    }

    @Test
    @DisplayName("crear lanza ValidationException si ya existe un vehiculo con esa patente")
    void crearLanzaValidationExceptionSiPatenteYaExiste() {
        when(visitanteRepository.findById(visitante.getId())).thenReturn(Optional.of(visitante));
        when(vehiculoRepository.existsByPatente("ABC123")).thenReturn(true);

        assertThrows(ValidationException.class, () -> vehiculoService.crear(dto));
    }

    @Test
    @DisplayName("crear normaliza la patente a mayusculas antes de guardar")
    void crearNormalizaPatenteAMayusculas() {
        when(visitanteRepository.findById(visitante.getId())).thenReturn(Optional.of(visitante));
        when(vehiculoRepository.existsByPatente("ABC123")).thenReturn(false);
        when(vehiculoRepository.save(any())).thenAnswer(i -> {
            Vehiculo v = i.getArgument(0);
            v.setId(UUID.randomUUID());
            return v;
        });

        var response = vehiculoService.crear(dto);

        assertEquals("ABC123", response.patente());

        ArgumentCaptor<Vehiculo> captor = ArgumentCaptor.forClass(Vehiculo.class);
        verify(vehiculoRepository).save(captor.capture());
        assertEquals("ABC123", captor.getValue().getPatente());
    }

    @Test
    @DisplayName("obtenerPorId lanza NotFoundException si el vehiculo no existe")
    void obtenerPorIdLanzaNotFoundExceptionSiNoExiste() {
        UUID id = UUID.randomUUID();
        when(vehiculoRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> vehiculoService.obtenerPorId(id));
    }

    @Test
    @DisplayName("listarPorVisitante devuelve solo los vehiculos de ese visitante")
    void listarPorVisitanteDevuelveVehiculosDelVisitante() {
        Vehiculo vehiculo = new Vehiculo();
        vehiculo.setId(UUID.randomUUID());
        vehiculo.setPatente("ABC123");
        vehiculo.setTipo(VehiculoTipo.AUTO);
        vehiculo.setVisitante(visitante);
        when(vehiculoRepository.findByVisitanteId(visitante.getId())).thenReturn(List.of(vehiculo));

        var response = vehiculoService.listarPorVisitante(visitante.getId());

        assertEquals(1, response.size());
        assertEquals(visitante.getId(), response.get(0).visitanteId());
    }
}
