package com.orgkgi.controller;

import com.orgkgi.service.AuthService;
import com.orgkgi.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.util.StringUtils;
import com.orgkgi.security.TokenBlocklistService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final TokenBlocklistService tokenBlocklistService;

    public AuthController(AuthService authService, TokenBlocklistService tokenBlocklistService) {
        this.authService = authService;
        this.tokenBlocklistService = tokenBlocklistService;
    }

    @PostMapping(value = "/register", consumes = "application/json", produces = "application/json")
    public ResponseEntity<RegisterResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping(value = "/login", consumes = "application/json", produces = "application/json")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        if (!StringUtils.hasText(authorization) || !authorization.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("A Bearer token is required to log out.");
        }
        tokenBlocklistService.block(authorization.substring(7));
        return ResponseEntity.ok("Logged out successfully.");
    }

    @PostMapping(value = "/forgot-password", consumes = "application/json", produces = "application/json")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.getUsernameOrEmail()));
    }

    @PostMapping(value = "/reset-password", consumes = "application/json", produces = "application/json")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok("Your password has been reset successfully.");
    }
}
