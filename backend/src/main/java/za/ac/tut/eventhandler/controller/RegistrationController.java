package za.ac.tut.eventhandler.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import za.ac.tut.eventhandler.dto.RegistrationDtos;
import za.ac.tut.eventhandler.model.Registration;
import za.ac.tut.eventhandler.service.QrCodeService;
import za.ac.tut.eventhandler.service.RegistrationService;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {
    private final RegistrationService registrationService;
    private final QrCodeService qrCodeService;

    public RegistrationController(RegistrationService registrationService, QrCodeService qrCodeService) {
        this.registrationService = registrationService;
        this.qrCodeService = qrCodeService;
    }

    @PostMapping("/events/{eventId}/students/{studentId}")
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
    public ResponseEntity<Registration> register(@PathVariable Long eventId, @PathVariable Long studentId) {
        return ResponseEntity.ok(registrationService.register(eventId, studentId));
    }

    @PostMapping("/attendance/{qrCodeToken}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<Registration> markAttendance(@PathVariable String qrCodeToken) {
        return ResponseEntity.ok(registrationService.markAttendance(qrCodeToken));
    }

    @GetMapping("/events/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<List<RegistrationDtos.AttendeeResponse>> attendees(@PathVariable Long eventId) {
        return ResponseEntity.ok(registrationService.attendees(eventId));
    }

    @GetMapping(value = "/qr/{qrCodeToken}", produces = MediaType.IMAGE_PNG_VALUE)
    @PreAuthorize("hasAnyRole('STUDENT','ORGANIZER','ADMIN')")
    public byte[] qrCode(@PathVariable String qrCodeToken) {
        return qrCodeService.png(qrCodeToken);
    }
}
