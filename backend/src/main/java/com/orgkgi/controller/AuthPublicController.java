package com.orgkgi.controller;

import com.orgkgi.dto.ForgotPasswordRequest;
import com.orgkgi.dto.ForgotPasswordResponse;
import com.orgkgi.dto.ResetPasswordRequest;
import com.orgkgi.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthPublicController {

    private final AuthService authService;

    public AuthPublicController(AuthService authService) {
        this.authService = authService;
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
