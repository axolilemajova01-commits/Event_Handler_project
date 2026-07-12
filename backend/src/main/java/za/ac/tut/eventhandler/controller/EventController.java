package za.ac.tut.eventhandler.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import za.ac.tut.eventhandler.dto.EventDtos;
import za.ac.tut.eventhandler.model.Event;
import za.ac.tut.eventhandler.model.EventStatus;
import za.ac.tut.eventhandler.service.AiEventService;
import za.ac.tut.eventhandler.service.EventService;
import za.ac.tut.eventhandler.service.PosterTemplateService;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService eventService;
    private final AiEventService aiEventService;
    private final PosterTemplateService posterTemplateService;

    public EventController(EventService eventService, AiEventService aiEventService, PosterTemplateService posterTemplateService) {
        this.eventService = eventService;
        this.aiEventService = aiEventService;
        this.posterTemplateService = posterTemplateService;
    }

    @GetMapping("/public")
    public ResponseEntity<List<EventDtos.PublicEventResponse>> publicEvents(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(eventService.publicEvents(q));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<EventDtos.PublicEventResponse> getEvent(@PathVariable Long eventId) {
        Event event = eventService.publicEvent(eventId);
        return ResponseEntity.ok(eventService.toPublicResponse(event));
    }

    @GetMapping("/organizer/{organizerId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<List<EventDtos.PublicEventResponse>> organizerEvents(@PathVariable Long organizerId) {
        return ResponseEntity.ok(eventService.organizerEvents(organizerId));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EventDtos.PublicEventResponse>> pendingEvents() {
        return ResponseEntity.ok(eventService.pendingEvents());
    }

    @PostMapping("/draft")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<Event> createDraft(@RequestBody EventDtos.CreateEventRequest request) {
        return ResponseEntity.ok(eventService.create(request, EventStatus.DRAFT));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<Event> submit(@RequestBody EventDtos.CreateEventRequest request) {
        return ResponseEntity.ok(eventService.create(request, EventStatus.PUBLISHED));
    }

    @PutMapping("/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<Event> update(@PathVariable Long eventId, @RequestBody EventDtos.CreateEventRequest request) {
        return ResponseEntity.ok(eventService.update(eventId, request));
    }

    @PostMapping("/{eventId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Event> approve(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.approve(eventId));
    }

    @PostMapping("/{eventId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Event> reject(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.reject(eventId));
    }

    @PostMapping("/{eventId}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Event> publish(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.publish(eventId));
    }

    @PostMapping("/{eventId}/close-registrations")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<Event> closeRegistrations(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventService.closeRegistrations(eventId));
    }

    @DeleteMapping("/{eventId}")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long eventId) {
        eventService.delete(eventId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/ai-draft")
    public ResponseEntity<EventDtos.AiEventDraft> aiDraft(@RequestBody EventDtos.AiEventRequest request) {
        return ResponseEntity.ok(aiEventService.generate(request));
    }

    @GetMapping("/{eventId}/poster")
    @PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
    public ResponseEntity<String> posterTemplate(@PathVariable Long eventId) {
        Event event = eventService.publicEvent(eventId);
        String html = posterTemplateService.generatePosterHtml(event);
        return ResponseEntity.ok().header("Content-Type", "text/html").body(html);
    }
}
