package za.ac.tut.eventhandler.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import za.ac.tut.eventhandler.dto.AuthDtos;
import za.ac.tut.eventhandler.model.User;
import za.ac.tut.eventhandler.model.UserRole;
import za.ac.tut.eventhandler.repository.UserRepository;
import za.ac.tut.eventhandler.security.JwtService;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailService mailService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, MailService mailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmail(request.email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setFullName(request.fullName);
        user.setEmail(request.email);
        user.setPasswordHash(passwordEncoder.encode(request.password));
        user.setRole(request.role == null ? UserRole.STUDENT : request.role);
        user.setStudentNumber(request.studentNumber);
        user.setApproved(true);
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmail(request.email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        if (user.getRole() == UserRole.ORGANIZER && !user.isApproved()) {
            throw new IllegalStateException("Organizer account is awaiting approval");
        }
        return toResponse(user);
    }

    public AuthDtos.MessageResponse forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with that email"));
        
        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(Instant.now().plusSeconds(3600)); // 1 hour expiry
        userRepository.save(user);

        String resetUrl = "http://localhost:5173/reset-password?token=" + resetToken;
        
        try {
            mailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), resetToken);
            return new AuthDtos.MessageResponse("Password reset link has been sent to your email");
        } catch (Exception e) {
            // Email not configured - return the link directly for development
            return new AuthDtos.MessageResponse("Email not configured. Use this link to reset your password: " + resetUrl);
        }
    }

    public AuthDtos.MessageResponse resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));
        
        if (user.getResetTokenExpiry() == null || Instant.now().isAfter(user.getResetTokenExpiry())) {
            throw new IllegalArgumentException("Reset token has expired");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return new AuthDtos.MessageResponse("Password has been reset successfully");
    }

    private AuthDtos.AuthResponse toResponse(User user) {
        return new AuthDtos.AuthResponse(user.getId(), jwtService.generateToken(user), user.getFullName(), user.getEmail(), user.getRole());
    }
}