package za.ac.tut.eventhandler.service;

import org.springframework.stereotype.Service;
import za.ac.tut.eventhandler.model.Event;
import za.ac.tut.eventhandler.model.SavedEvent;
import za.ac.tut.eventhandler.model.User;
import za.ac.tut.eventhandler.repository.EventRepository;
import za.ac.tut.eventhandler.repository.SavedEventRepository;
import za.ac.tut.eventhandler.repository.UserRepository;

import java.util.List;

@Service
public class SavedEventService {
    private final SavedEventRepository savedEventRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public SavedEventService(SavedEventRepository savedEventRepository, UserRepository userRepository, EventRepository eventRepository) {
        this.savedEventRepository = savedEventRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    public SavedEvent save(Long studentId, Long eventId) {
        if (savedEventRepository.existsByStudentIdAndEventId(studentId, eventId)) {
            throw new IllegalArgumentException("Event already saved");
        }
        User student = userRepository.findById(studentId).orElseThrow(() -> new IllegalArgumentException("Student not found"));
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found"));
        SavedEvent savedEvent = new SavedEvent();
        savedEvent.setStudent(student);
        savedEvent.setEvent(event);
        return savedEventRepository.save(savedEvent);
    }

    public List<SavedEvent> savedForStudent(Long studentId) {
        return savedEventRepository.findByStudentId(studentId);
    }
}
