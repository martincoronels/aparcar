package com.aparcar.api.controller;

import com.aparcar.api.dto.auth.UserEmailDto;
import com.aparcar.api.entity.auth.InactiveUsersDto;
import com.aparcar.api.service.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final IUserService userService;

    @PostMapping("/activate")
    public ResponseEntity<Void> activateUser(@Valid @RequestBody UserEmailDto dto) {
        userService.activateUser(dto.getEmail());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/inactive")
    public ResponseEntity<InactiveUsersDto> getInactiveUsers() {
        var inactiveUsers = userService.getInactiveUsers();
        return ResponseEntity.ok(inactiveUsers);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteUser(@Valid @RequestBody UserEmailDto dto, Authentication authentication) {
        userService.deleteUser(dto.getEmail(), authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
