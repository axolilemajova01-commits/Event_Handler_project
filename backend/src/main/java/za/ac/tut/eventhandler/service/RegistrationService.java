package za.ac.tut.eventhandler.service;

import org.springframework.stereotype.Service;
import za.ac.tut.eventhandler.dto.RegistrationDtos;
import za.ac.tut.eventhandler.model.Event;
import za.ac.tut.eventhandler.model.Registration;
import za.ac.tut.eventhandler.model.User;
import za.ac.tut.eventhandler.repository.EventRepository;
import za.ac.tut.eventhandler.repository.RegistrationRepository;
import za.ac.tut.eventhandler.repository.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class RegistrationService {
    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public RegistrationService(RegistrationRepository registrationRepository, EventRepository eventRepository, UserRepository userRepository) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    public Registration register(Long eventId, Long studentId) {
        if (registrationRepository.existsByEventIdAndStudentId(eventId, studentId)) {
            throw new IllegalArgumentException("Student already registered for this event");
        }
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found"));
        if (event.isRegistrationClosed()) {
            throw new IllegalStateException("Registration is closed");
        }
        User student = userRepository.findById(studentId).orElseThrow(() -> new IllegalArgumentException("Student not found"));
        Registration registration = new Registration();
        registration.setEvent(event);
        registration.setStudent(student);
        registration.setQrCodeToken(UUID.randomUUID().toString());
        return registrationRepository.save(registration);
    }

    public Registration markAttendance(String qrCodeToken) {
        Registration registration = registrationRepository.findByQrCodeToken(qrCodeToken)
                .orElseThrow(() -> new IllegalArgumentException("Invalid QR code"));
        registration.setAttended(true);
        registration.setAttendedAt(Instant.now());
        return registrationRepository.save(registration);
    }

    public List<RegistrationDtos.AttendeeResponse> attendees(Long eventId) {
        return registrationRepository.findByEventId(eventId).stream().map(this::toAttendeeResponse).toList();
    }

    public List<Long> getRegisteredEventIds(Long studentId) {
        return registrationRepository.findByStudentId(studentId)
                .stream()
                .map(r -> r.getEvent().getId())
                .toList();
    }

    private RegistrationDtos.AttendeeResponse toAttendeeResponse(Registration registration) {
        RegistrationDtos.AttendeeResponse response = new RegistrationDtos.AttendeeResponse();
        response.id = registration.getId();
        response.eventId = registration.getEvent().getId();
        response.studentId = registration.getStudent().getId();
        response.studentName = registration.getStudent().getFullName();
        response.studentEmail = registration.getStudent().getEmail();
        response.attended = registration.isAttended();
        response.registeredAt = registration.getRegisteredAt();
        response.attendedAt = registration.getAttendedAt();
        response.qrCodeToken = registration.getQrCodeToken();
        return response;
    }
}
