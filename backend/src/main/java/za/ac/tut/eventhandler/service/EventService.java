package za.ac.tut.eventhandler.service;

import org.springframework.stereotype.Service;
import za.ac.tut.eventhandler.dto.EventDtos;
import za.ac.tut.eventhandler.model.*;
import za.ac.tut.eventhandler.repository.*;

import java.util.List;

@Service
public class EventService {
    private final EventRepository eventRepository;
    private final CampusRepository campusRepository;
    private final FacultyRepository facultyRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;

    public EventService(EventRepository eventRepository, CampusRepository campusRepository, FacultyRepository facultyRepository, UserRepository userRepository, RegistrationRepository registrationRepository) {
        this.eventRepository = eventRepository;
        this.campusRepository = campusRepository;
        this.facultyRepository = facultyRepository;
        this.userRepository = userRepository;
        this.registrationRepository = registrationRepository;
    }

    public List<EventDtos.PublicEventResponse> publicEvents(String query) {
        List<Event> events;
        if (query != null && !query.trim().isEmpty()) {
            events = eventRepository.searchPublished(query.trim(), EventStatus.PUBLISHED);
        } else {
            events = eventRepository.findByStatus(EventStatus.PUBLISHED);
        }
        return events.stream().map(this::toPublicResponse).toList();
    }

    public EventDtos.PublicEventResponse toPublicResponse(Event event) {
        EventDtos.PublicEventResponse response = new EventDtos.PublicEventResponse();
        response.id = event.getId();
        response.title = event.getTitle();
        response.description = event.getDescription();
        response.campus = event.getCampus().getName();
        response.faculty = event.getFaculty().getName();
        response.venue = event.getVenue();
        response.date = event.getEventDate().toString();
        response.time = event.getStartTime() + " - " + event.getEndTime();
        response.category = event.getCategory().name();
        response.status = event.getStatus().name();
        response.maxAttendees = event.getMaximumAttendees();
        response.registrations = registrationRepository.countByEventId(event.getId());
        response.organizer = event.getOrganizer().getFullName();
        response.posterUrl = event.getPosterUrl();
        response.tags = event.getTags();
        response.targetAudience = event.getTargetAudience();
        response.shortSummary = event.getShortSummary();
        response.objectives = event.getObjectives();
        response.attendeeRequirements = event.getAttendeeRequirements();
        response.registrationDeadline = event.getRegistrationDeadline() != null ? event.getRegistrationDeadline().toString() : null;
        return response;
    }

    public Event create(EventDtos.CreateEventRequest request, EventStatus status) {
        User organizer = verifyOrganizer(request.organizerId);
        Event event = new Event();
        applyRequestToEvent(event, request, organizer);
        event.setStatus(status);
        return eventRepository.save(event);
    }

    public Event update(Long eventId, EventDtos.CreateEventRequest request) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found"));
        User organizer = verifyOrganizer(request.organizerId);
        if (!event.getOrganizer().getId().equals(organizer.getId()) && organizer.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only the event organizer or admin can update this event");
        }
        applyRequestToEvent(event, request, organizer);
        return eventRepository.save(event);
    }

    public List<EventDtos.PublicEventResponse> pendingEvents() {
        return eventRepository.findByStatus(EventStatus.PENDING_APPROVAL).stream().map(this::toPublicResponse).toList();
    }

    public List<EventDtos.PublicEventResponse> organizerEvents(Long organizerId) {
        return eventRepository.findByOrganizerId(organizerId).stream().map(this::toPublicResponse).toList();
    }

    public Event publicEvent(Long eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found"));
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new IllegalArgumentException("Event is not published");
        }
        return event;
    }

    public Event approve(Long eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found"));
        event.setStatus(EventStatus.PUBLISHED);
        return eventRepository.save(event);
    }

    public Event reject(Long eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found"));
        event.setStatus(EventStatus.REJECTED);
        return eventRepository.save(event);
    }

    private void applyRequestToEvent(Event event, EventDtos.CreateEventRequest request, User organizer) {
        Campus campus = campusRepository.findById(request.campusId).orElseThrow(() -> new IllegalArgumentException("Campus not found"));
        Faculty faculty = facultyRepository.findById(request.facultyId).orElseThrow(() -> new IllegalArgumentException("Faculty not found"));

        event.setTitle(request.title);
        event.setDescription(request.description);
        event.setCampus(campus);
        event.setFaculty(faculty);
        event.setOrganizer(organizer);
        event.setVenue(request.venue);
        event.setEventDate(request.eventDate);
        event.setStartTime(request.startTime);
        event.setEndTime(request.endTime);
        event.setCategory(request.category);
        event.setMaximumAttendees(request.maximumAttendees);
        event.setPosterUrl(request.posterUrl);
        event.setRegistrationDeadline(request.registrationDeadline);
        event.setTags(request.tags);
        event.setTargetAudience(request.targetAudience);
        event.setShortSummary(request.shortSummary);
        event.setObjectives(request.objectives);
        event.setAttendeeRequirements(request.attendeeRequirements);
        event.setSearchKeywords(request.searchKeywords);
    }

    private User verifyOrganizer(Long organizerId) {
        User organizer = userRepository.findById(organizerId).orElseThrow(() -> new IllegalArgumentException("Organizer not found"));
        if (organizer.getRole() != UserRole.ORGANIZER && organizer.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only approved organizers or admins may perform this action");
        }
        if (organizer.getRole() == UserRole.ORGANIZER && !organizer.isApproved()) {
            throw new IllegalArgumentException("Only approved organizers can perform this action");
        }
        return organizer;
    }

    public Event publish(Long eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found"));
        event.setStatus(EventStatus.PUBLISHED);
        return eventRepository.save(event);
    }

    public Event closeRegistrations(Long eventId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new IllegalArgumentException("Event not found"));
        event.setRegistrationClosed(true);
        event.setStatus(EventStatus.REGISTRATION_CLOSED);
        return eventRepository.save(event);
    }

    public void delete(Long eventId) {
        eventRepository.deleteById(eventId);
    }
}
