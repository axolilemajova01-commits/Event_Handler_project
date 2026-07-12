package za.ac.tut.eventhandler.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class SavedEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private User student;

    @ManyToOne(optional = false)
    private Event event;

    private Instant savedAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public Instant getSavedAt() { return savedAt; }
    public void setSavedAt(Instant savedAt) { this.savedAt = savedAt; }
}
