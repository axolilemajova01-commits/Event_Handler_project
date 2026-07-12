package za.ac.tut.eventhandler;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TutEventHandlerApplication {
    public static void main(String[] args) {
        SpringApplication.run(TutEventHandlerApplication.class, args);
    }
}
