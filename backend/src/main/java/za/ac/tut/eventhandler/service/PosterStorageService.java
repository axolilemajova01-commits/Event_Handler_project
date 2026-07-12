package za.ac.tut.eventhandler.service;

import com.cloudinary.Cloudinary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class PosterStorageService {
    private final Cloudinary cloudinary;

    public PosterStorageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadPoster(MultipartFile file) throws IOException {
        Map<String, String> options = new HashMap<>();
        options.put("folder", "tut-event-handler/posters");
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), options);
        return String.valueOf(result.get("secure_url"));
    }
}
