package za.ac.tut.eventhandler.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.ac.tut.eventhandler.model.Campus;
import za.ac.tut.eventhandler.model.Faculty;
import za.ac.tut.eventhandler.repository.CampusRepository;
import za.ac.tut.eventhandler.repository.FacultyRepository;

import java.util.List;

@RestController
@RequestMapping("/api/reference")
public class ReferenceController {
    private final CampusRepository campusRepository;
    private final FacultyRepository facultyRepository;

    public ReferenceController(CampusRepository campusRepository, FacultyRepository facultyRepository) {
        this.campusRepository = campusRepository;
        this.facultyRepository = facultyRepository;
    }

    @GetMapping("/campuses")
    public ResponseEntity<List<Campus>> campuses() {
        return ResponseEntity.ok(campusRepository.findAll());
    }

    @GetMapping("/faculties")
    public ResponseEntity<List<Faculty>> faculties() {
        return ResponseEntity.ok(facultyRepository.findAll());
    }
}
