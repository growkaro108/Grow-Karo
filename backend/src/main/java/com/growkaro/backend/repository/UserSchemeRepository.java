package com.growkaro.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.growkaro.backend.DTO.UserPortfolio;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;

import jakarta.persistence.LockModeType;

@Repository
public interface UserSchemeRepository extends JpaRepository<UserScheme, String> {

    @Query("SELECT us FROM UserScheme us JOIN FETCH us.scheme WHERE us.user.id = :userId")
    List<UserScheme> findAllByUserId(@Param("userId") String userId);

    Optional<UserScheme> findBySchemeAndUser(Scheme scheme, User user);

    @Query("SELECT us.scheme.schemeId FROM UserScheme us WHERE us.user = :user")
    List<String> findAllJoinedSchemeId(@Param("user") User user);

    @Query("SELECT us FROM UserScheme us WHERE us.user.id = :userId")
    List<UserScheme> findByUser_UserId(@Param("userId") String userId);

    List<UserPortfolio> findByUserId(String userId);

    boolean existsByNomineeNomineeId(String nomineeId);

    // get all approved user
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT us FROM UserScheme us
            JOIN FETCH us.scheme
            WHERE us.isApproved = true
            AND us.nextPayoutDate = :today
            """)
    List<UserScheme> findAllApprovedUserSchemes(@Param("today") LocalDate today);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    // find all user scheme whose maturity date is in range of 10 to 15 days
    @Query("SELECT us FROM UserScheme us JOIN FETCH us.user WHERE us.maturityDate BETWEEN :today AND :endDate")
    List<UserScheme> findAllByMaturityDate(@Param("today") LocalDate today, @Param("endDate") LocalDate endDate);

}