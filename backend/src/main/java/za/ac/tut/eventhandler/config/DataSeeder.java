package za.ac.tut.eventhandler.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import za.ac.tut.eventhandler.model.*;
import za.ac.tut.eventhandler.repository.*;

import java.util.Arrays;
import java.time.LocalDate;
import java.time.LocalTime;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seedReferenceData(
            CampusRepository campusRepository,
            FacultyRepository facultyRepository,
            UserRepository userRepository,
            EventRepository eventRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (campusRepository.count() == 0) {
                Arrays.asList("Soshanguve", "Pretoria", "Ga-Rankuwa", "Arcadia", "Mbombela").forEach(name -> {
                    Campus campus = new Campus();
                    campus.setName(name);
                    campusRepository.save(campus);
                });
            }

            if (facultyRepository.count() == 0) {
                Arrays.asList("ICT", "Engineering", "Management Sciences", "Arts and Design", "Humanities", "ARLC").forEach(name -> {
                    Faculty faculty = new Faculty();
                    faculty.setName(name);
                    facultyRepository.save(faculty);
                });
            } else {
                boolean hasArlc = facultyRepository.findAll().stream().anyMatch(faculty -> "ARLC".equalsIgnoreCase(faculty.getName()));
                if (!hasArlc) {
                    Faculty faculty = new Faculty();
                    faculty.setName("ARLC");
                    facultyRepository.save(faculty);
                }
            }

            if (userRepository.count() == 0) {
                User organizer = new User();
                organizer.setFullName("TUT Student Affairs");
                organizer.setEmail("organizer@tut.ac.za");
                organizer.setPasswordHash(passwordEncoder.encode("password"));
                organizer.setRole(UserRole.ORGANIZER);
                organizer.setApproved(true);
                userRepository.save(organizer);

                User student = new User();
                student.setFullName("TUT Student");
                student.setEmail("student@tut.ac.za");
                student.setPasswordHash(passwordEncoder.encode("password"));
                student.setRole(UserRole.STUDENT);
                student.setApproved(true);
                student.setStudentNumber("202612345");
                userRepository.save(student);

                User admin = new User();
                admin.setFullName("TUT Admin");
                admin.setEmail("admin@tut.ac.za");
                admin.setPasswordHash(passwordEncoder.encode("password"));
                admin.setRole(UserRole.ADMIN);
                admin.setApproved(true);
                userRepository.save(admin);
            }

            if (eventRepository.count() == 0) {
                User organizer = userRepository.findByEmail("organizer@tut.ac.za")
                        .orElseThrow(() -> new IllegalStateException("Seed organizer missing"));
                Campus soshanguve = campusRepository.findAll().stream()
                        .filter(campus -> campus.getName().equals("Soshanguve"))
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("Soshanguve campus missing"));
                Campus pretoria = campusRepository.findAll().stream()
                        .filter(campus -> campus.getName().equals("Pretoria"))
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("Pretoria campus missing"));
                Campus gaRankuwa = campusRepository.findAll().stream()
                        .filter(campus -> campus.getName().equals("Ga-Rankuwa"))
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("Ga-Rankuwa campus missing"));
                Faculty ict = facultyRepository.findAll().stream()
                        .filter(faculty -> faculty.getName().equals("ICT"))
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("ICT faculty missing"));
                Faculty management = facultyRepository.findAll().stream()
                        .filter(faculty -> faculty.getName().equals("Management Sciences"))
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("Management Sciences faculty missing"));
                Faculty humanities = facultyRepository.findAll().stream()
                        .filter(faculty -> faculty.getName().equals("Humanities"))
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException("Humanities faculty missing"));

                eventRepository.save(event(
                        "Spring Boot and React Workshop",
                        "Hands-on workshop for Computer Science students building a full-stack campus application from API to interface.",
                        soshanguve,
                        ict,
                        organizer,
                        "Building 10 Lab 3",
                        LocalDate.of(2026, 8, 15),
                        LocalTime.of(10, 0),
                        LocalTime.of(14, 0),
                        EventCategory.WORKSHOP,
                        120,
                        "Spring Boot, React, Full-stack, Computer Science, Soshanguve"
                ));

                eventRepository.save(event(
                        "Graduate Career Fair",
                        "Recruiters, CV reviews, interview preparation and internship opportunities for final-year students.",
                        pretoria,
                        management,
                        organizer,
                        "Main Hall",
                        LocalDate.of(2026, 8, 22),
                        LocalTime.of(9, 0),
                        LocalTime.of(16, 0),
                        EventCategory.CAREER_FAIR,
                        500,
                        "careers, internships, graduates, employers"
                ));

                eventRepository.save(event(
                        "Intercampus Sports Day",
                        "Soccer, netball, athletics and student society showcases across all TUT campuses.",
                        gaRankuwa,
                        humanities,
                        organizer,
                        "Sports Grounds",
                        LocalDate.of(2026, 8, 30),
                        LocalTime.of(8, 0),
                        LocalTime.of(17, 0),
                        EventCategory.SPORTS,
                        900,
                        "sports, student life, intercampus"
                ));
            }
        };
    }

    private Event event(
            String title,
            String description,
            Campus campus,
            Faculty faculty,
            User organizer,
            String venue,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            EventCategory category,
            Integer maximumAttendees,
            String tags) {
        Event event = new Event();
        event.setTitle(title);
        event.setDescription(description);
        event.setCampus(campus);
        event.setFaculty(faculty);
        event.setOrganizer(organizer);
        event.setVenue(venue);
        event.setEventDate(date);
        event.setStartTime(startTime);
        event.setEndTime(endTime);
        event.setCategory(category);
        event.setMaximumAttendees(maximumAttendees);
        event.setRegistrationDeadline(date.minusDays(1));
        event.setStatus(EventStatus.PUBLISHED);
        event.setTags(tags);
        event.setTargetAudience("TUT students");
        event.setShortSummary(description);
        event.setSearchKeywords(tags);
        return event;
    }
}
