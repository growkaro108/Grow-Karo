package com.growkaro.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.growkaro.backend.DTO.UserPortfolio;
import com.growkaro.backend.DTO.UserRequest;
import com.growkaro.backend.entity.Scheme;
import com.growkaro.backend.entity.User;
import com.growkaro.backend.entity.UserScheme;

@Repository
public interface UserSchemeRepository extends JpaRepository<UserScheme, String> {

    // Fetch all UserScheme rows for a user, eagerly loading the scheme to avoid
    // N+1.
    @Query("SELECT us FROM UserScheme us JOIN FETCH us.scheme WHERE us.user.id = :userId")
    List<UserScheme> findAllByUserIdWithSchemeDetails(@Param("userId") String userId);

    // Lookup for checking/creating a UserScheme for a given (scheme, user) pair.
    Optional<UserScheme> findBySchemeAndUser(Scheme scheme, User user);

    // Just the scheme IDs a user has joined — avoids loading full entities.
    @Query("SELECT us.scheme.schemeId FROM UserScheme us WHERE us.user = :user AND (us.status = com.growkaro.backend.entity.UserScheme.UserSchemeStatus.ACTIVE OR us.status = com.growkaro.backend.entity.UserScheme.UserSchemeStatus.PENDING)")
    List<String> findAllJoinedSchemeId(@Param("user") User user);

    // DTO projection: requires UserPortfolio to be an interface projection
    // (getters matching UserScheme's properties) or a constructor-expression DTO.
    // If it's a plain class DTO, this needs @Query("SELECT new
    // ...UserPortfolio(...) FROM UserScheme us WHERE us.user.id = :userId")
    List<UserPortfolio> findByUserId(String userId);

    @Query("""
            SELECT us.userSchemeId AS userSchemeId,
                   us.status AS status,
                   us.isApproved AS isApproved,
                   us.requestDate AS requestDate,
                   us.paidAmount AS paidAmount,
                   us.paymentDates AS paymentDates,
                   us.scheme AS scheme,
                   us.user AS user
            FROM UserScheme us
            """)
    List<UserRequest> findAllWithUserAndScheme();
}