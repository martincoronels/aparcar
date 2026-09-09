package com.aparcar.api.controller;

import com.aparcar.api.dto.reserva.VisitanteRequestDto;
import com.aparcar.api.dto.reserva.VisitanteResponseDto;
import com.aparcar.api.service.IVisitanteService;
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
@RequestMapping("/api/v1/visitantes")
@RequiredArgsConstructor
public class VisitanteController {
    private final IVisitanteService visitanteService;

    @PostMapping
    public ResponseEntity<VisitanteResponseDto> crear(@Valid @RequestBody VisitanteRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(visitanteService.crear(dto));
    }

    @GetMapping
    public ResponseEntity<List<VisitanteResponseDto>> listar() {
        return ResponseEntity.ok(visitanteService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VisitanteResponseDto> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(visitanteService.obtenerPorId(id));
    }
}
