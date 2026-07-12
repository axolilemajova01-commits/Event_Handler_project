package za.ac.tut.eventhandler.dto;

import za.ac.tut.eventhandler.model.UserRole;

public class AuthDtos {
    public static class RegisterRequest {
        public String fullName;
        public String email;
        public String password;
        public String studentNumber;
        public UserRole role;
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class AuthResponse {
        public Long id;
        public String token;
        public String fullName;
        public String email;
        public UserRole role;

        public AuthResponse(Long id, String token, String fullName, String email, UserRole role) {
            this.id = id;
            this.token = token;
            this.fullName = fullName;
            this.email = email;
            this.role = role;
        }
    }

    public static class ForgotPasswordRequest {
        public String email;
    }

    public static class ResetPasswordRequest {
        public String token;
        public String password;
    }

    public static class MessageResponse {
        public String message;
        public MessageResponse(String message) { this.message = message; }
    }
}
