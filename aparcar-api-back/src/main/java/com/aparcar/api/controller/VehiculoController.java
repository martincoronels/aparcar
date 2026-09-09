package com.aparcar.api.controller;

import com.aparcar.api.dto.reserva.VehiculoRequestDto;
import com.aparcar.api.dto.reserva.VehiculoResponseDto;
import com.aparcar.api.service.IVehiculoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vehiculos")
@RequiredArgsConstructor
public class VehiculoController {
    private final IVehiculoService vehiculoService;

    @PostMapping
    public ResponseEntity<VehiculoResponseDto> crear(@Valid @RequestBody VehiculoRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehiculoService.crear(dto));
    }

    @GetMapping
    public ResponseEntity<List<VehiculoResponseDto>> listar(
            @RequestParam(required = false) UUID visitanteId) {
        if (visitanteId != null) {
            return ResponseEntity.ok(vehiculoService.listarPorVisitante(visitanteId));
        }
        return ResponseEntity.ok(vehiculoService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehiculoResponseDto> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(vehiculoService.obtenerPorId(id));
    }
}
