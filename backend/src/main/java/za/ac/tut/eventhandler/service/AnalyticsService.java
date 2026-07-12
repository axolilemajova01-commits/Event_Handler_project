package za.ac.tut.eventhandler.service;

import org.springframework.stereotype.Service;
import za.ac.tut.eventhandler.model.EventStatus;
import za.ac.tut.eventhandler.repository.EventRepository;
import za.ac.tut.eventhandler.repository.RegistrationRepository;
import za.ac.tut.eventhandler.repository.UserRepository;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AnalyticsService {
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    public AnalyticsService(EventRepository eventRepository, RegistrationRepository registrationRepository, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getDetailedStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalEvents", eventRepository.count());
        stats.put("totalRegistrations", registrationRepository.count());
        stats.put("avgRegistrationsPerEvent", eventRepository.count() > 0 ? 
            (double) registrationRepository.count() / eventRepository.count() : 0);
        return stats;
    }

    public Map<String, Object> getEventTrends() {
        Map<String, Object> trends = new LinkedHashMap<>();
        LocalDate now = LocalDate.now();
        
        long upcomingEvents = eventRepository.findByEventDateAndStatus(now.plusDays(1), EventStatus.PUBLISHED).size();
        long publishedEvents = eventRepository.findByStatus(EventStatus.PUBLISHED).size();
        long draftEvents = eventRepository.findByStatus(EventStatus.DRAFT).size();

        trends.put("published", publishedEvents);
        trends.put("drafts", draftEvents);
        trends.put("upcomingTomorrow", upcomingEvents);
        trends.put("totalEvents", eventRepository.count());
        return trends;
    }

    public Map<String, Object> getTopEvents() {
        Map<String, Object> top = new LinkedHashMap<>();
        var allEvents = eventRepository.findByStatus(EventStatus.PUBLISHED);
        top.put("totalPublished", allEvents.size());
        top.put("totalRegistrationsAcrossAll", allEvents.stream()
            .mapToLong(e -> registrationRepository.countByEventId(e.getId())).sum());
        return top;
    }
}