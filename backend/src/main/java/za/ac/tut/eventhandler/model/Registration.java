package za.ac.tut.eventhandler.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class Registration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Event event;

    @ManyToOne(optional = false)
    private User student;

    @Column(nullable = false, unique = true)
    private String qrCodeToken;

    private boolean attended;
    private Instant registeredAt = Instant.now();
    private Instant attendedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public String getQrCodeToken() { return qrCodeToken; }
    public void setQrCodeToken(String qrCodeToken) { this.qrCodeToken = qrCodeToken; }
    public boolean isAttended() { return attended; }
    public void setAttended(boolean attended) { this.attended = attended; }
    public Instant getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(Instant registeredAt) { this.registeredAt = registeredAt; }
    public Instant getAttendedAt() { return attendedAt; }
    public void setAttendedAt(Instant attendedAt) { this.attendedAt = attendedAt; }
}
