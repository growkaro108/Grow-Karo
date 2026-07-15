package com.growkaro.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.growkaro.backend.entity.Scheme;

@Repository
public interface SchemeRepository extends JpaRepository<Scheme, String> {
    // retrieve scheme and user by id
    @Query("SELECT s, u FROM Scheme s, User u WHERE s.id = :schemeId AND u.id = :userId")
    List<Object[]> findSchemeAndUserByIds(@Param("schemeId") String schemeId, @Param("userId") String userId);
}
