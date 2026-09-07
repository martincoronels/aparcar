package com.aparcar.api.service.impl;

import com.aparcar.api.component.IRevokedUserCache;
import com.aparcar.api.entity.auth.AppUser;
import com.aparcar.api.entity.auth.InactiveUsersDto;
import com.aparcar.api.exception.NotFoundException;
import com.aparcar.api.exception.ValidationException;
import com.aparcar.api.repository.AppUserRepository;
import com.aparcar.api.service.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements IUserService {
    private final AppUserRepository appUserRepository;
    private final IRevokedUserCache revokedUserCache;

    @Override
    public void activateUser(String email) {
        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found."));

        user.setIsActive(true);
        log.info("Activating user: {}", email);
        appUserRepository.save(user);
    }

    @Override
    public InactiveUsersDto getInactiveUsers() {
        return new InactiveUsersDto(appUserRepository.findInactiveEmails());
    }

    @Override
    public void deleteUser(String email, String callerEmail) {
        if (callerEmail == null) {
            log.error("authentication.getName() returned null.");
            throw new RuntimeException("Could not get caller email.");
        }

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found."));

        if (callerEmail.equals(user.getEmail())) {
            log.error("User {} tried to delete themselves.", callerEmail);
            throw new ValidationException("You cannot delete yourself.");
        }

        log.info("Revoking user's access");
        revokedUserCache.revoke(user.getEmail());

        log.info("Deleting user: {}", user.getEmail());
        appUserRepository.delete(user);
    }
}
