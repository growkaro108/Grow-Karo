package com.growkaro.backend.repository;

import com.growkaro.backend.entity.User;

import jakarta.transaction.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    @Transactional
    @Modifying
    @Query(value = "DROP TABLE IF EXISTS users CASCADE", nativeQuery = true)
    void dropUserTable();

    // get all user email
    @Query("SELECT u.email FROM User u")
    List<String> findAllEmail();

    // get all user phone no.
    @Query("SELECT u.phone FROM User u")
    List<String> findAllPhoneNo();

    // ── Lookup ───────────────────────────────────────────────────────────────

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmailOrPhone(String email, String phone);

    // ── Existence checks ─────────────────────────────────────────────────────

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    // ── Role-based queries ───────────────────────────────────────────────────

    List<User> findByRole(User.Role role);

    Page<User> findByRole(User.Role role, Pageable pageable);

    long countByRole(User.Role role);

    // ── Status filters ───────────────────────────────────────────────────────

    Page<User> findByActive(boolean active, Pageable pageable);

    List<User> findByActiveAndRole(boolean active, User.Role role);

    // ── Search ───────────────────────────────────────────────────────────────

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "u.phone LIKE CONCAT('%', :query, '%')")
    Page<User> searchUsers(@Param("query") String query, Pageable pageable);

    // ── Date range ───────────────────────────────────────────────────────────

    List<User> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // ── Dashboard stats ──────────────────────────────────────────────────────

    long countByActive(boolean active);

    long countByEmailVerified(boolean verified);
}
