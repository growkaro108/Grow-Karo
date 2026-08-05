package com.growkaro.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.growkaro.backend.DTO.UserPortfolio;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;
import com.growkaro.backend.enums.UserSchemeStatus;

import jakarta.transaction.Transactional;

@Repository
public interface UserSchemeRepository extends JpaRepository<UserScheme, String> {

    @Query("SELECT us FROM UserScheme us JOIN FETCH us.scheme WHERE us.user.id = :userId")
    List<UserScheme> findAllByUserId(@Param("userId") String userId);

    Optional<UserScheme> findBySchemeAndUser(Scheme scheme, User user);

    @Query("SELECT us.scheme.schemeId FROM UserScheme us WHERE us.user = :user")
    List<String> findAllJoinedSchemeId(@Param("user") User user);

    List<UserPortfolio> findByUserId(String userId);

    // get all approved user
    @Query("""
            SELECT us FROM UserScheme us
            JOIN FETCH us.scheme
            WHERE us.isApproved = true
            AND us.nextPayoutDate <= :today
            """)
    List<UserScheme> findAllApprovedUserSchemes(@Param("today") LocalDate today);

}