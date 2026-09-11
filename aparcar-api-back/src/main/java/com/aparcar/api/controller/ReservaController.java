package com.aparcar.api.controller;

import com.aparcar.api.dto.reserva.ReservaRequestDto;
import com.aparcar.api.dto.reserva.ReservaResponseDto;
import com.aparcar.api.service.IReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
public class ReservaController {
    private final IReservaService reservaService;

    @PostMapping
    public ResponseEntity<ReservaResponseDto> crear(@Valid @RequestBody ReservaRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservaService.crear(dto));
    }

    @GetMapping
    public ResponseEntity<List<ReservaResponseDto>> listar() {
        return ResponseEntity.ok(reservaService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReservaResponseDto> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(reservaService.obtenerPorId(id));
    }
}
