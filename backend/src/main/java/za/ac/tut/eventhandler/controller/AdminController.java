package za.ac.tut.eventhandler.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import za.ac.tut.eventhandler.model.Campus;
import za.ac.tut.eventhandler.model.Faculty;
import za.ac.tut.eventhandler.model.User;
import za.ac.tut.eventhandler.repository.CampusRepository;
import za.ac.tut.eventhandler.repository.EventRepository;
import za.ac.tut.eventhandler.repository.FacultyRepository;
import za.ac.tut.eventhandler.repository.RegistrationRepository;
import za.ac.tut.eventhandler.repository.SavedEventRepository;
import za.ac.tut.eventhandler.repository.UserRepository;
import za.ac.tut.eventhandler.service.AnalyticsService;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final CampusRepository campusRepository;
    private final FacultyRepository facultyRepository;
    private final RegistrationRepository registrationRepository;
    private final SavedEventRepository savedEventRepository;
    private final AnalyticsService analyticsService;

    public AdminController(UserRepository userRepository, EventRepository eventRepository, CampusRepository campusRepository, FacultyRepository facultyRepository, RegistrationRepository registrationRepository, SavedEventRepository savedEventRepository, AnalyticsService analyticsService) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.campusRepository = campusRepository;
        this.facultyRepository = facultyRepository;
        this.registrationRepository = registrationRepository;
        this.savedEventRepository = savedEventRepository;
        this.analyticsService = analyticsService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("organizers", userRepository.countByRole(za.ac.tut.eventhandler.model.UserRole.ORGANIZER));
        stats.put("students", userRepository.countByRole(za.ac.tut.eventhandler.model.UserRole.STUDENT));
        stats.put("totalEvents", eventRepository.count());
        stats.put("totalCampuses", campusRepository.count());
        stats.put("totalFaculties", facultyRepository.count());
        stats.put("totalRegistrations", registrationRepository.count());
        stats.put("totalSavedEvents", savedEventRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> users() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody Map<String, Object> body) {
        User user = new User();
        user.setFullName((String) body.get("fullName"));
        user.setEmail((String) body.get("email"));
        user.setPasswordHash("$2a$10$dummy");
        user.setRole(za.ac.tut.eventhandler.model.UserRole.valueOf((String) body.getOrDefault("role", "STUDENT")));
        user.setStudentNumber((String) body.get("studentNumber"));
        user.setApproved((Boolean) body.getOrDefault("approved", true));
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<User> updateUser(@PathVariable Long userId, @RequestBody Map<String, Object> updates) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (updates.containsKey("fullName")) user.setFullName((String) updates.get("fullName"));
        if (updates.containsKey("email")) user.setEmail((String) updates.get("email"));
        if (updates.containsKey("role")) user.setRole(za.ac.tut.eventhandler.model.UserRole.valueOf((String) updates.get("role")));
        if (updates.containsKey("approved")) user.setApproved((Boolean) updates.get("approved"));
        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userRepository.deleteById(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/organizers/{userId}/approve")
    public ResponseEntity<User> approveOrganizer(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setApproved(true);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @GetMapping("/events")
    public ResponseEntity<List<za.ac.tut.eventhandler.model.Event>> events() {
        return ResponseEntity.ok(eventRepository.findAll());
    }

    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long eventId) {
        eventRepository.deleteById(eventId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/campuses")
    public ResponseEntity<Campus> createCampus(@RequestBody Campus campus) {
        return ResponseEntity.ok(campusRepository.save(campus));
    }

    @PutMapping("/campuses/{campusId}")
    public ResponseEntity<Campus> updateCampus(@PathVariable Long campusId, @RequestBody Campus campusData) {
        Campus campus = campusRepository.findById(campusId).orElseThrow(() -> new IllegalArgumentException("Campus not found"));
        campus.setName(campusData.getName());
        campus.setCity(campusData.getCity());
        return ResponseEntity.ok(campusRepository.save(campus));
    }

    @DeleteMapping("/campuses/{campusId}")
    public ResponseEntity<Void> deleteCampus(@PathVariable Long campusId) {
        campusRepository.deleteById(campusId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/campuses")
    public ResponseEntity<List<Campus>> campuses() {
        return ResponseEntity.ok(campusRepository.findAll());
    }

    @PostMapping("/faculties")
    public ResponseEntity<Faculty> createFaculty(@RequestBody Faculty faculty) {
        return ResponseEntity.ok(facultyRepository.save(faculty));
    }

    @PutMapping("/faculties/{facultyId}")
    public ResponseEntity<Faculty> updateFaculty(@PathVariable Long facultyId, @RequestBody Faculty facultyData) {
        Faculty faculty = facultyRepository.findById(facultyId).orElseThrow(() -> new IllegalArgumentException("Faculty not found"));
        faculty.setName(facultyData.getName());
        return ResponseEntity.ok(facultyRepository.save(faculty));
    }

    @DeleteMapping("/faculties/{facultyId}")
    public ResponseEntity<Void> deleteFaculty(@PathVariable Long facultyId) {
        facultyRepository.deleteById(facultyId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/faculties")
    public ResponseEntity<List<Faculty>> faculties() {
        return ResponseEntity.ok(facultyRepository.findAll());
    }

    @GetMapping("/registrations")
    public ResponseEntity<List<za.ac.tut.eventhandler.model.Registration>> registrations() {
        return ResponseEntity.ok(registrationRepository.findAll());
    }

    @DeleteMapping("/registrations/{id}")
    public ResponseEntity<Void> deleteRegistration(@PathVariable Long id) {
        registrationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/saved-events")
    public ResponseEntity<List<za.ac.tut.eventhandler.model.SavedEvent>> savedEvents() {
        return ResponseEntity.ok(savedEventRepository.findAll());
    }

    @DeleteMapping("/saved-events/{id}")
    public ResponseEntity<Void> deleteSavedEvent(@PathVariable Long id) {
        savedEventRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/analytics/detailed")
    public ResponseEntity<Map<String, Object>> detailedAnalytics() {
        return ResponseEntity.ok(analyticsService.getDetailedStats());
    }

    @GetMapping("/analytics/trends")
    public ResponseEntity<Map<String, Object>> eventTrends() {
        return ResponseEntity.ok(analyticsService.getEventTrends());
    }

    @GetMapping("/analytics/top-events")
    public ResponseEntity<Map<String, Object>> topEvents() {
        return ResponseEntity.ok(analyticsService.getTopEvents());
    }
}