package com.growkaro.backend.repository;

import java.util.List;
import java.util.Optional;

import org.jspecify.annotations.Nullable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.growkaro.backend.DTO.UserPortfolio;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;

import jakarta.transaction.Transactional;

@Repository
public interface UserSchemeRepository extends JpaRepository<UserScheme, String> {
    @Query("SELECT us FROM UserScheme us JOIN FETCH us.scheme WHERE us.user.id = :userId")
    List<UserScheme> findAllByUserIdWithSchemeDetails(@Param("userId") String userId);

    Optional<UserScheme> findBySchemeAndUser(Scheme scheme, User user);

    @Query("SELECT us.scheme.id FROM UserScheme us WHERE us.user = :user")
    List<String> findAllJoinedSchemeId(@Param("user") User user);

    @Nullable
    Object findAllByUserId(User user);

    @Query("SELECT us FROM UserScheme us LEFT JOIN FETCH us.scheme WHERE us.user.id = :userId")
    List<UserPortfolio> findByUserId(@Param("userId") String userId);

    @Modifying
    @Transactional
    @Query("UPDATE UserScheme us SET us.status = com.growkaro.backend.entity.UserScheme.Status.WITHDRAWN " +
            "WHERE us.userSchemeId = :userSchemeId " +
            "AND us.user.id = :userId " +
            "AND us.isApproved = false " +
            "AND us.status = com.growkaro.backend.entity.UserScheme.Status.PENDING")
    int withdrawUserScheme(@Param("userSchemeId") String userSchemeId, @Param("userId") String userId);
}
