package za.ac.tut.eventhandler.dto;

import java.time.Instant;

public class RegistrationDtos {
    public static class AttendeeResponse {
        public Long id;
        public Long eventId;
        public Long studentId;
        public String studentName;
        public String studentEmail;
        public boolean attended;
        public Instant registeredAt;
        public Instant attendedAt;
        public String qrCodeToken;
    }
}
