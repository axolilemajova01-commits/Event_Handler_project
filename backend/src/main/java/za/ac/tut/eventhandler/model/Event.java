package za.ac.tut.eventhandler.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @ManyToOne(optional = false)
    private Campus campus;

    @ManyToOne(optional = false)
    private Faculty faculty;

    @ManyToOne(optional = false)
    private User organizer;

    @Column(nullable = false)
    private String venue;

    @Column(nullable = false)
    private LocalDate eventDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.DRAFT;

    private Integer maximumAttendees;
    private String posterUrl;
    private LocalDate registrationDeadline;
    private boolean registrationClosed;
    private String tags;
    private String targetAudience;
    private String shortSummary;
    private String objectives;
    private String attendeeRequirements;
    private String searchKeywords;
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Campus getCampus() { return campus; }
    public void setCampus(Campus campus) { this.campus = campus; }
    public Faculty getFaculty() { return faculty; }
    public void setFaculty(Faculty faculty) { this.faculty = faculty; }
    public User getOrganizer() { return organizer; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }
    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }
    public LocalDate getEventDate() { return eventDate; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }
    public LocalTime getStartTime() { return startTime; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public LocalTime getEndTime() { return endTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public EventCategory getCategory() { return category; }
    public void setCategory(EventCategory category) { this.category = category; }
    public EventStatus getStatus() { return status; }
    public void setStatus(EventStatus status) { this.status = status; }
    public Integer getMaximumAttendees() { return maximumAttendees; }
    public void setMaximumAttendees(Integer maximumAttendees) { this.maximumAttendees = maximumAttendees; }
    public String getPosterUrl() { return posterUrl; }
    public void setPosterUrl(String posterUrl) { this.posterUrl = posterUrl; }
    public LocalDate getRegistrationDeadline() { return registrationDeadline; }
    public void setRegistrationDeadline(LocalDate registrationDeadline) { this.registrationDeadline = registrationDeadline; }
    public boolean isRegistrationClosed() { return registrationClosed; }
    public void setRegistrationClosed(boolean registrationClosed) { this.registrationClosed = registrationClosed; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getTargetAudience() { return targetAudience; }
    public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }
    public String getShortSummary() { return shortSummary; }
    public void setShortSummary(String shortSummary) { this.shortSummary = shortSummary; }
    public String getObjectives() { return objectives; }
    public void setObjectives(String objectives) { this.objectives = objectives; }
    public String getAttendeeRequirements() { return attendeeRequirements; }
    public void setAttendeeRequirements(String attendeeRequirements) { this.attendeeRequirements = attendeeRequirements; }
    public String getSearchKeywords() { return searchKeywords; }
    public void setSearchKeywords(String searchKeywords) { this.searchKeywords = searchKeywords; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
