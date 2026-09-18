package com.aparcar.api.dto.reserva;

import com.aparcar.api.entity.reserva.CocheraEstado;
import com.aparcar.api.entity.reserva.CocheraTipo;

import java.util.UUID;

public record CocheraResponseDto(
        UUID id,
        String numero,
        String sector,
        CocheraTipo tipo,
        CocheraEstado estado
) {
}
