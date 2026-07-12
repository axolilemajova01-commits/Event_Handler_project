package za.ac.tut.eventhandler.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.ac.tut.eventhandler.model.Event;
import za.ac.tut.eventhandler.model.EventStatus;

import java.time.LocalDate;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(EventStatus status);
    List<Event> findByOrganizerId(Long organizerId);
    List<Event> findByEventDateAndStatus(LocalDate eventDate, EventStatus status);

    @Query("select e from Event e where e.status = :status and " +
            "(lower(e.title) like lower(concat('%', :query, '%')) or " +
            "lower(e.description) like lower(concat('%', :query, '%')) or " +
            "lower(e.venue) like lower(concat('%', :query, '%')) or " +
            "lower(e.searchKeywords) like lower(concat('%', :query, '%')))")
    List<Event> searchPublished(@Param("query") String query, @Param("status") EventStatus status);
}
