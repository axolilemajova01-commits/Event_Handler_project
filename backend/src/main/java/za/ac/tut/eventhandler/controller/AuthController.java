package za.ac.tut.eventhandler.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.ac.tut.eventhandler.dto.AuthDtos;
import za.ac.tut.eventhandler.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDtos.AuthResponse> register(@RequestBody AuthDtos.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDtos.AuthResponse> login(@RequestBody AuthDtos.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthDtos.MessageResponse> forgotPassword(@RequestBody AuthDtos.ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.email));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthDtos.MessageResponse> resetPassword(@RequestBody AuthDtos.ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request.token, request.password));
    }
}
