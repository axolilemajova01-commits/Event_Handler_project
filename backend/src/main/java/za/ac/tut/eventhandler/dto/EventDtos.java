package za.ac.tut.eventhandler.dto;

import za.ac.tut.eventhandler.model.EventCategory;

import java.time.LocalDate;
import java.time.LocalTime;

public class EventDtos {
    public static class CreateEventRequest {
        public String title;
        public String description;
        public Long campusId;
        public Long facultyId;
        public Long organizerId;
        public String venue;
        public LocalDate eventDate;
        public LocalTime startTime;
        public LocalTime endTime;
        public EventCategory category;
        public Integer maximumAttendees;
        public String posterUrl;
        public LocalDate registrationDeadline;
        public String tags;
        public String targetAudience;
        public String shortSummary;
        public String objectives;
        public String attendeeRequirements;
        public String searchKeywords;
    }

    public static class AiEventRequest {
        public String prompt;
    }

    public static class AiEventDraft {
        public String title;
        public String description;
        public String suggestedCategory;
        public String tags;
        public String targetAudience;
        public String shortSummary;
        public String objectives;
        public String attendeeRequirements;
        public String estimatedDuration;
        public String searchKeywords;
    }

    public static class PublicEventResponse {
        public Long id;
        public String title;
        public String description;
        public String campus;
        public String faculty;
        public String venue;
        public String date;
        public String time;
        public String category;
        public String status;
        public Integer maxAttendees;
        public Long registrations;
        public String organizer;
        public String posterUrl;
        public String tags;
        public String targetAudience;
        public String shortSummary;
        public String objectives;
        public String attendeeRequirements;
        public String registrationDeadline;
    }
}
