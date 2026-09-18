package com.aparcar.api.service.impl;

import com.aparcar.api.component.IEmailSender;
import com.aparcar.api.dto.auth.RegisteredUserDto;
import com.aparcar.api.dto.auth.RegistrationDto;
import com.aparcar.api.dto.email.PlainEmailData;
import com.aparcar.api.entity.auth.AppAuthority;
import com.aparcar.api.entity.auth.OneTimePassword;
import com.aparcar.api.entity.auth.Visitante;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.OTPException;
import com.aparcar.api.exception.OTPExceptionReason;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.OneTimePasswordRepository;
import com.aparcar.api.repository.VisitanteRepository;
import com.aparcar.api.service.IAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Validated
public class AuthService implements IAuthService {
    private final PasswordEncoder passwordEncoder;
    private final VisitanteRepository visitanteRepository;
    private final OneTimePasswordRepository otpRepository;
    private final IEmailSender emailSender;

    @Override
    public RegisteredUserDto register(RegistrationDto registrationDto) {
        if (visitanteRepository.existsByEmail(registrationDto.getEmail())) {
            throw new ValidationException("Email already registered.");
        }

        if (visitanteRepository.existsByDocumento(registrationDto.getDocumento())) {
            throw new ValidationException("Ya existe un visitante con ese documento.");
        }

        // Toda cuenta nace como USER y activa: la crea un admin desde el panel,
        // no un desconocido registrandose solo, asi que no hay nada que
        // aprobar despues. El rol se cambia desde Gestion de usuarios.
        String hashedPassword = passwordEncoder.encode(registrationDto.getPassword());
        Visitante user = new Visitante(
                registrationDto.getNombre(),
                registrationDto.getDocumento(),
                registrationDto.getEmail(),
                hashedPassword,
                registrationDto.getTelefono(),
                Set.of(AppAuthority.USER),
                true);
        Visitante savedUser = visitanteRepository.save(user);

        return new RegisteredUserDto(
                savedUser.getNombre(),
                savedUser.getDocumento(),
                savedUser.getEmail(),
                savedUser.getTelefono(),
                savedUser.getAuthorities());
    }

    @Override
    public void createAndSendOTP(String email) {
        Visitante user = visitanteRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found."));

        otpRepository.findByUser(user).ifPresent(otp -> {
            log.warn("Deleting existing OTP for user {} before creating a new one.", user.getEmail());
            otpRepository.delete(otp);
        });

        var otp = new OneTimePassword(
                user,
                String.format("%06d", new SecureRandom().nextInt(1_000_000)),
                Instant.now().plus(15, ChronoUnit.MINUTES));
        otpRepository.save(otp);

        // TODO: Implement a template for the email body and send frontend URL
        String body = """
                Tu código de verificación es: %s. El código tiene una validez de 15 minutos.

                Si no solicitaste este código, ignora este mensaje.
                """.formatted(otp.getToken());

        emailSender.sendPlainTextEmail(new PlainEmailData(body, "AparcAR - Recuperación de cuenta",
                List.of(user.getEmail())));
    }

    @Override
    public void resetPassword(String email, String token, String newPassword) {
        Visitante user = visitanteRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found."));

        OneTimePassword otp;
        try {
            otp = otpRepository.findByUserAndToken(user, token)
                    .orElseThrow(() -> new OTPException(OTPExceptionReason.INVALID));

            if (otp.isUsed() || otp.getExpiresAt().isBefore(Instant.now())) {
                throw new OTPException(OTPExceptionReason.EXPIRED);
            }
        } catch (OTPException e) {
            log.error(e.getMessage());
            throw new ValidationException("Invalid OTP.");
        }

        otp.setUsed(true);
        otpRepository.save(otp);

        user.setPassword(passwordEncoder.encode(newPassword));
        visitanteRepository.save(user);
    }
}
