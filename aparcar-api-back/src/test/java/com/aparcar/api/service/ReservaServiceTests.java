package com.aparcar.api.service;

import com.aparcar.api.config.UnitTests;
import com.aparcar.api.dto.reserva.ReservaRequestDto;
import com.aparcar.api.entity.reserva.Cochera;
import com.aparcar.api.entity.reserva.CocheraEstado;
import com.aparcar.api.entity.reserva.CocheraTipo;
import com.aparcar.api.entity.reserva.ReservaEstado;
import com.aparcar.api.entity.reserva.Vehiculo;
import com.aparcar.api.entity.reserva.VehiculoTipo;
import com.aparcar.api.entity.reserva.Visitante;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.CocheraRepository;
import com.aparcar.api.repository.ReservaRepository;
import com.aparcar.api.repository.VehiculoRepository;
import com.aparcar.api.repository.VisitanteRepository;
import com.aparcar.api.service.impl.ReservaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@UnitTests
public class ReservaServiceTests {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private VisitanteRepository visitanteRepository;

    @Mock
    private VehiculoRepository vehiculoRepository;

    @Mock
    private CocheraRepository cocheraRepository;

    @InjectMocks
    private ReservaService reservaService;

    private Visitante visitante;
    private Vehiculo vehiculo;
    private Cochera cochera;
    private ReservaRequestDto dto;

    @BeforeEach
    void setUp() {
        visitante = new Visitante();
        visitante.setId(UUID.randomUUID());

        vehiculo = new Vehiculo();
        vehiculo.setId(UUID.randomUUID());
        vehiculo.setVisitante(visitante);
        vehiculo.setTipo(VehiculoTipo.AUTO);

        cochera = new Cochera();
        cochera.setId(UUID.randomUUID());
        cochera.setNumero("A-01");
        cochera.setEstado(CocheraEstado.HABILITADA);
        cochera.setTipo(CocheraTipo.AUTO);

        dto = new ReservaRequestDto();
        dto.setVisitanteId(visitante.getId());
        dto.setVehiculoId(vehiculo.getId());
        dto.setCocheraId(cochera.getId());
        dto.setFecha(LocalDate.now());

        // lenient: algunos tests fallan antes de llegar a estos lookups, y en
        // modo estricto Mockito marcaria esos stubs como "unnecessary"
        lenient().when(visitanteRepository.findById(visitante.getId())).thenReturn(Optional.of(visitante));
        lenient().when(vehiculoRepository.findById(vehiculo.getId())).thenReturn(Optional.of(vehiculo));
        lenient().when(cocheraRepository.findById(cochera.getId())).thenReturn(Optional.of(cochera));
    }

    @Test
    @DisplayName("crear lanza NotFoundException si el visitante no existe")
    void crearLanzaNotFoundExceptionSiVisitanteNoExiste() {
        when(visitanteRepository.findById(visitante.getId())).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> reservaService.crear(dto));
    }

    @Test
    @DisplayName("crear lanza ValidationException si el vehiculo no pertenece al visitante")
    void crearLanzaValidationExceptionSiVehiculoNoPerteneceAlVisitante() {
        vehiculo.setVisitante(new Visitante());
        vehiculo.getVisitante().setId(UUID.randomUUID());

        assertThrows(ValidationException.class, () -> reservaService.crear(dto));
    }

    @Test
    @DisplayName("crear lanza ValidationException si el tipo de cochera no es compatible con el vehiculo")
    void crearLanzaValidationExceptionSiTiposNoSonCompatibles() {
        cochera.setTipo(CocheraTipo.MOTO);

        assertThrows(ValidationException.class, () -> reservaService.crear(dto));
    }

    @Test
    @DisplayName("crear permite una cochera ACCESIBLE para cualquier tipo de vehiculo")
    void crearPermiteCocheraAccesibleParaCualquierVehiculo() {
        cochera.setTipo(CocheraTipo.ACCESIBLE);
        when(reservaRepository.existsByCocheraIdAndFechaAndEstado(cochera.getId(), dto.getFecha(), ReservaEstado.CONFIRMADA))
                .thenReturn(false);
        when(reservaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertEquals(ReservaEstado.CONFIRMADA, reservaService.crear(dto).estado());
    }

    @Test
    @DisplayName("crear lanza ValidationException si la cochera ya tiene una reserva confirmada ese dia")
    void crearLanzaValidationExceptionSiCocheraYaEstaReservada() {
        when(reservaRepository.existsByCocheraIdAndFechaAndEstado(cochera.getId(), dto.getFecha(), ReservaEstado.CONFIRMADA))
                .thenReturn(true);

        assertThrows(ValidationException.class, () -> reservaService.crear(dto));
    }

    @Test
    @DisplayName("crear guarda la reserva como CONFIRMADA cuando todas las validaciones pasan")
    void crearGuardaReservaConfirmadaCuandoTodoEsValido() {
        when(reservaRepository.existsByCocheraIdAndFechaAndEstado(cochera.getId(), dto.getFecha(), ReservaEstado.CONFIRMADA))
                .thenReturn(false);
        when(reservaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var response = reservaService.crear(dto);

        assertEquals(ReservaEstado.CONFIRMADA, response.estado());
        assertEquals(cochera.getId(), response.cochera().id());
        assertEquals(vehiculo.getId(), response.vehiculo().id());
    }
}
