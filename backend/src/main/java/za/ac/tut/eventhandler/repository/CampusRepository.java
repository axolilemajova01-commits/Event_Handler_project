package za.ac.tut.eventhandler.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.tut.eventhandler.model.Campus;

public interface CampusRepository extends JpaRepository<Campus, Long> {
}
