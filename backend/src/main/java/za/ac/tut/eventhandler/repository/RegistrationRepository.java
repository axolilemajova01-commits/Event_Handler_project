package za.ac.tut.eventhandler.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.tut.eventhandler.model.Registration;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByEventId(Long eventId);
    List<Registration> findByStudentId(Long studentId);
    Optional<Registration> findByQrCodeToken(String qrCodeToken);
    boolean existsByEventIdAndStudentId(Long eventId, Long studentId);
    long countByEventId(Long eventId);
    long countByEventIdAndAttendedTrue(Long eventId);
}
