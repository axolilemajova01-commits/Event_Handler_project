package za.ac.tut.eventhandler.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.tut.eventhandler.model.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole(za.ac.tut.eventhandler.model.UserRole role);
    Optional<User> findByResetToken(String resetToken);
}
