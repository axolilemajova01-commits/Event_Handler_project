package za.ac.tut.eventhandler.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import za.ac.tut.eventhandler.model.Event;
import za.ac.tut.eventhandler.model.EventStatus;
import za.ac.tut.eventhandler.model.Registration;
import za.ac.tut.eventhandler.repository.EventRepository;
import za.ac.tut.eventhandler.repository.RegistrationRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class EventReminderService {
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final MailService mailService;

    public EventReminderService(EventRepository eventRepository, RegistrationRepository registrationRepository, MailService mailService) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.mailService = mailService;
    }

    // Run every hour to check for events happening tomorrow
    @Scheduled(cron = "0 0 * * * *")
    public void sendEventReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Event> upcomingEvents = eventRepository.findByEventDateAndStatus(tomorrow, EventStatus.PUBLISHED);

        for (Event event : upcomingEvents) {
            List<Registration> registrations = registrationRepository.findByEventId(event.getId());
            for (Registration reg : registrations) {
                String studentName = reg.getStudent().getFullName();
                String studentEmail = reg.getStudent().getEmail();
                String time = event.getStartTime() != null ? event.getStartTime().toString() : "TBA";
                mailService.sendEventReminder(studentEmail, studentName, event.getTitle(), 
                    event.getEventDate().toString(), time, event.getVenue());
            }
        }
    }
}