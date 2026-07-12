package za.ac.tut.eventhandler.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import za.ac.tut.eventhandler.model.SavedEvent;
import za.ac.tut.eventhandler.service.SavedEventService;

import java.util.List;

@RestController
@RequestMapping("/api/saved-events")
@PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
public class SavedEventController {
    private final SavedEventService savedEventService;

    public SavedEventController(SavedEventService savedEventService) {
        this.savedEventService = savedEventService;
    }

    @PostMapping("/students/{studentId}/events/{eventId}")
    public ResponseEntity<SavedEvent> save(@PathVariable Long studentId, @PathVariable Long eventId) {
        return ResponseEntity.ok(savedEventService.save(studentId, eventId));
    }

    @GetMapping("/students/{studentId}")
    public ResponseEntity<List<SavedEvent>> savedForStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(savedEventService.savedForStudent(studentId));
    }
}
