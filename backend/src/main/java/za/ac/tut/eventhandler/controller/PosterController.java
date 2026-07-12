package za.ac.tut.eventhandler.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import za.ac.tut.eventhandler.service.PosterStorageService;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/posters")
@PreAuthorize("hasAnyRole('ORGANIZER','ADMIN')")
public class PosterController {
    private final PosterStorageService posterStorageService;

    public PosterController(PosterStorageService posterStorageService) {
        this.posterStorageService = posterStorageService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(Collections.singletonMap("url", posterStorageService.uploadPoster(file)));
    }
}
