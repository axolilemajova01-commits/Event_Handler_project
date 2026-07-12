package za.ac.tut.eventhandler.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.tut.eventhandler.model.SavedEvent;

import java.util.List;

public interface SavedEventRepository extends JpaRepository<SavedEvent, Long> {
    List<SavedEvent> findByStudentId(Long studentId);
    boolean existsByStudentIdAndEventId(Long studentId, Long eventId);
}
