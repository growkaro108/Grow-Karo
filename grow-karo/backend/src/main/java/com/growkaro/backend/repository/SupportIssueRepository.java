package com.growkaro.backend.repository;

import com.growkaro.backend.entity.SupportIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportIssueRepository extends JpaRepository<SupportIssue, String> {

    // ── Per-user queries ─────────────────────────────────────────────────────

    Page<SupportIssue> findByUserId(String userId, Pageable pageable);

    Page<SupportIssue> findByUserIdAndStatus(String userId, SupportIssue.Status status, Pageable pageable);

    // ── Admin queries ─────────────────────────────────────────────────────────

    Page<SupportIssue> findByStatus(SupportIssue.Status status, Pageable pageable);

    Page<SupportIssue> findByPriority(SupportIssue.Priority priority, Pageable pageable);

    Page<SupportIssue> findByStatusAndPriority(SupportIssue.Status status, SupportIssue.Priority priority, Pageable pageable);

    List<SupportIssue> findByStatusOrderByPriorityDesc(SupportIssue.Status status);

    // ── Search ───────────────────────────────────────────────────────────────

    @Query("SELECT s FROM SupportIssue s WHERE " +
           "LOWER(s.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<SupportIssue> searchIssues(@Param("query") String query, Pageable pageable);

    // ── Dashboard stats ──────────────────────────────────────────────────────

    long countByStatus(SupportIssue.Status status);

    long countByPriority(SupportIssue.Priority priority);

    @Query("SELECT COUNT(s) FROM SupportIssue s WHERE s.status != 'RESOLVED' AND s.status != 'CLOSED'")
    long countOpenIssues();
}
